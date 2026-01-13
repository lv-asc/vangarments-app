import { Request, Response } from 'express';
import { UserRegistrationSchema } from '@vangarments/shared';
import { UserModel } from '../models/User';
import { AuthUtils, AuthenticatedRequest } from '../utils/auth';
import { CPFValidator } from '../utils/cpf';
import { AdminAuthService } from '../services/adminAuthService';
import { BrandAccountModel } from '../models/BrandAccount';
import { SupplierModel } from '../models/Supplier';
import { PageModel } from '../models/Page';
import { SocialPostModel } from '../models/SocialPost';
import { BrandTeamModel } from '../models/BrandTeam';

export class AuthController {
    static async register(req: Request, res: Response) {
        try {
            // Validate input data
            const validationResult = UserRegistrationSchema.safeParse(req.body);
            if (!validationResult.success) {
                console.error('========== REGISTRATION VALIDATION FAILED ==========');
                console.error('Request body:', JSON.stringify(req.body, null, 2));
                console.error('Validation errors:');
                validationResult.error.errors.forEach((err, i) => {
                    console.error(`  Error ${i + 1}: Path="${err.path.join('.')}" Message="${err.message}"`);
                });
                console.error('====================================================');
                return res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid input data',
                        details: validationResult.error.errors,
                    },
                });
            }

            const { cpf, email, password, name, birthDate, gender, username } = validationResult.data;
            const { genderOther, bodyType, telephone } = req.body; // Access optional fields directly from body or add to schema

            // Validate CPF
            if (!CPFValidator.isValid(cpf)) {
                return res.status(400).json({
                    error: {
                        code: 'INVALID_CPF',
                        message: 'Invalid CPF format or checksum',
                    },
                });
            }

            const cleanCPF = CPFValidator.clean(cpf);

            // Check if user already exists
            const existingUserByCPF = await UserModel.findByCPF(cleanCPF);
            if (existingUserByCPF) {
                return res.status(409).json({
                    error: {
                        code: 'CPF_ALREADY_EXISTS',
                        message: 'An account with this CPF already exists',
                    },
                });
            }

            const existingUserByEmail = await UserModel.findByEmail(email);
            if (existingUserByEmail) {
                return res.status(409).json({
                    error: {
                        code: 'EMAIL_ALREADY_EXISTS',
                        message: 'An account with this email already exists',
                    },
                });
            }

            // Check if username is taken
            const isUsernameTaken = await UserModel.isUsernameTaken(username);
            if (isUsernameTaken) {
                return res.status(409).json({
                    error: {
                        code: 'USERNAME_TAKEN',
                        message: 'This username is already taken',
                    },
                });
            }

            // Hash password
            const passwordHash = await AuthUtils.hashPassword(password);

            // Create user
            const user = await UserModel.create({
                cpf: cleanCPF,
                email,
                passwordHash,
                name,
                birthDate,
                gender,
                genderOther,
                bodyType,
                username,
                telephone,
            });

            // Add default consumer role
            await UserModel.addRole(user.id, 'consumer');

            // Generate JWT token
            const token = AuthUtils.generateToken({
                id: user.id,
                userId: user.id,
                email: user.email,
                roles: ['consumer'],
            });

            // Return user data (without sensitive information)
            const { ...userResponse } = user;

            res.status(201).json({
                message: 'User registered successfully',
                user: userResponse,
                token,
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An error occurred during registration',
                },
            });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    error: {
                        code: 'MISSING_CREDENTIALS',
                        message: 'Email and password are required',
                    },
                });
            }

            // Find user by email
            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Invalid email or password',
                    },
                });
            }

            // Verify password
            const passwordHash = await UserModel.getPasswordHash(user.id);
            if (!passwordHash) {
                return res.status(401).json({
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Invalid email or password',
                    },
                });
            }

            const isValidPassword = await AuthUtils.comparePassword(password, passwordHash);
            if (!isValidPassword) {
                return res.status(401).json({
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Invalid email or password',
                    },
                });
            }

            // Get user roles
            const roles = await UserModel.getUserRoles(user.id);

            // Generate JWT token
            const token = AuthUtils.generateToken({
                id: user.id,
                userId: user.id,
                email: user.email,
                roles,
            });

            res.json({
                message: 'Login successful',
                user,
                token,
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An error occurred during login',
                },
            });
        }
    }

    static async getProfile(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                });
            }

            const user = await UserModel.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found',
                    },
                });
            }
            // Transform user response to include avatar at top level for frontend consumption
            const userResponse = {
                ...user,
                id: user.id,
                name: user.personalInfo.name,
                email: user.email,
                cpf: user.cpf,
                avatar: (user.personalInfo as any).avatarUrl || null,
                username: user.username,
                personalInfo: user.personalInfo,
                measurements: user.measurements,
                preferences: user.preferences,
                privacySettings: (user as any).privacySettings,
                socialLinks: user.socialLinks,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };

            // Fetch linked entities
            const [brandAccounts, memberships, suppliers, pages, posts] = await Promise.all([
                BrandAccountModel.findAllByUserId(user.id),
                BrandTeamModel.getUserMembershipsWithDetails(user.id),
                SupplierModel.findAllByUserId(user.id),
                PageModel.findAllByUserId(user.id),
                SocialPostModel.findMany({ userId: user.id }, 1) // Just need to check existence
            ]);

            // Merge owned brands and memberships
            const allBrandEntities = new Map();

            // Add owned brands
            brandAccounts.forEach(ba => {
                allBrandEntities.set(ba.id, {
                    id: ba.id,
                    name: ba.brandInfo.name,
                    slug: ba.brandInfo.slug,
                    logo: ba.brandInfo.logo,
                    businessType: ba.brandInfo.businessType
                });
            });

            // Add memberships
            memberships.forEach(m => {
                if (!allBrandEntities.has(m.brandId)) {
                    allBrandEntities.set(m.brandId, {
                        id: m.brandId,
                        name: m.brandName,
                        slug: m.brandSlug,
                        logo: m.brandLogo,
                        businessType: m.businessType
                    });
                }
            });

            const mergedBrands = Array.from(allBrandEntities.values());

            const brands = mergedBrands.filter(b => !b.businessType || b.businessType === 'brand' || b.businessType === 'designer' || b.businessType === 'manufacturer');
            const stores = mergedBrands.filter(b => b.businessType === 'store');

            (userResponse as any).linkedEntities = {
                brands: brands.map(b => ({
                    id: b.id,
                    name: b.name,
                    slug: b.slug,
                    logo: b.logo
                })),
                stores: stores.map(s => ({
                    id: s.id,
                    name: s.name,
                    slug: s.slug,
                    logo: s.logo
                })),
                suppliers: suppliers.map(s => ({
                    id: s.id,
                    name: s.name,
                    slug: s.slug
                })),
                pages: pages.map(p => ({
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    logo: p.logoUrl
                })),
                hasPost: posts.total > 0
            };

            res.json({ user: userResponse });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An error occurred while fetching profile',
                },
            });
        }
    }

    static async updateProfile(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                });
            }

            const { name, location, measurements, preferences } = req.body;

            const updatedUser = await UserModel.update(req.user.userId, {
                name,
                location,
                measurements,
                preferences,
            });

            if (!updatedUser) {
                return res.status(404).json({
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found',
                    },
                });
            }

            res.json({
                message: 'Profile updated successfully',
                user: updatedUser,
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An error occurred while updating profile',
                },
            });
        }
    }

    static async refreshToken(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                });
            }

            // Get fresh user roles
            const roles = await UserModel.getUserRoles(req.user.userId);

            // Generate new token
            const token = AuthUtils.generateToken({
                id: req.user.userId,
                userId: req.user.userId,
                email: req.user.email,
                roles,
            });

            res.json({
                message: 'Token refreshed successfully',
                token,
            });
        } catch (error) {
            console.error('Refresh token error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An error occurred while refreshing token',
                },
            });
        }
    }

    static async adminLogin(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    error: {
                        code: 'MISSING_CREDENTIALS',
                        message: 'Email and password are required',
                    },
                });
            }

            // Authenticate admin user
            const authResult = await AdminAuthService.authenticateAdmin(email, password);
            if (!authResult) {
                return res.status(401).json({
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Invalid email or password',
                    },
                });
            }

            if (!authResult.isAdmin) {
                return res.status(403).json({
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: 'Admin privileges required',
                    },
                });
            }

            res.json({
                message: 'Admin login successful',
                user: authResult.user,
                token: authResult.token,
                isAdmin: authResult.isAdmin,
                permissions: authResult.permissions,
            });
        } catch (error) {
            console.error('Admin login error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An error occurred during admin login',
                },
            });
        }
    }

    static async initializeAdmin(req: Request, res: Response) {
        try {
            // This endpoint should only be available in development or during initial setup
            if (process.env.NODE_ENV === 'production') {
                return res.status(403).json({
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Admin initialization not allowed in production',
                    },
                });
            }

            const adminUser = await AdminAuthService.initializeDefaultAdmin();

            res.json({
                message: 'Default admin user initialized successfully',
                user: {
                    id: adminUser.id,
                    email: adminUser.email,
                    name: adminUser.personalInfo.name,
                },
            });
        } catch (error) {
            console.error('Initialize admin error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An error occurred during admin initialization',
                },
            });
        }
    }

    static async grantAdminRole(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                });
            }

            // Check if current user is admin
            const isCurrentUserAdmin = await AdminAuthService.isAdmin(req.user.userId);
            if (!isCurrentUserAdmin) {
                return res.status(403).json({
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: 'Admin privileges required',
                    },
                });
            }

            const { userId } = req.body;
            if (!userId) {
                return res.status(400).json({
                    error: {
                        code: 'MISSING_USER_ID',
                        message: 'User ID is required',
                    },
                });
            }

            await AdminAuthService.grantAdminPrivileges(userId);

            res.json({
                message: 'Admin privileges granted successfully',
                userId,
            });
        } catch (error) {
            console.error('Grant admin role error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An error occurred while granting admin privileges',
                },
            });
        }
    }

    static async getAdminUsers(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                });
            }

            // Check if current user is admin
            const isCurrentUserAdmin = await AdminAuthService.isAdmin(req.user.userId);
            if (!isCurrentUserAdmin) {
                return res.status(403).json({
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: 'Admin privileges required',
                    },
                });
            }

            const adminUsers = await AdminAuthService.getAdminUsers();

            res.json({
                message: 'Admin users retrieved successfully',
                users: adminUsers,
            });
        } catch (error) {
            console.error('Get admin users error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An error occurred while retrieving admin users',
                },
            });
        }
    }
}