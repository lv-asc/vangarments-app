import { Response } from 'express';
import { db } from '../database/connection';
import { AuthenticatedRequest, AuthUtils } from '../utils/auth';
import { UserModel } from '../models/User';

export class AdminController {
    async getUsers(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required'
                    }
                });
            }

            // Check if user is admin (this should be handled by middleware, but extra safety)
            const userRoles = await UserModel.getUserRoles(req.user.userId);
            if (!userRoles.includes('admin')) {
                return res.status(403).json({
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Admin access required'
                    }
                });
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const search = req.query.search as string;

            const offset = (page - 1) * limit;

            const { users, total } = await UserModel.findAll({ search, limit, offset });

            res.json({
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An error occurred while fetching users'
                }
            });
        }
    }

    async createUser(req: AuthenticatedRequest, res: Response) {
        try {
            const { name, username, email, password, roles, birthDate, gender, cpf } = req.body;

            // Basic validation
            if (!email || !username || !password || !name) {
                return res.status(400).json({
                    error: {
                        code: 'INVALID_INPUT',
                        message: 'Name, username, email, and password are required'
                    }
                });
            }

            // Check if user already exists
            const existingEmail = await UserModel.findByEmail(email);
            if (existingEmail) {
                return res.status(400).json({
                    error: {
                        code: 'EMAIL_TAKEN',
                        message: 'Email is already in use'
                    }
                });
            }

            const existingUsername = await UserModel.findByUsername(username);
            if (existingUsername) {
                return res.status(400).json({
                    error: {
                        code: 'USERNAME_TAKEN',
                        message: 'Username is already taken'
                    }
                });
            }

            // Hash password
            const passwordHash = await AuthUtils.hashPassword(password);

            // Create user
            const newUser = await UserModel.create({
                name,
                username,
                email,
                passwordHash,
                birthDate: birthDate ? new Date(birthDate) : new Date(),
                gender: gender || 'prefer-not-to-say',
                cpf: cpf || null,
                telephone: req.body.telephone || ''
            });

            // Set roles if provided
            if (roles && Array.isArray(roles) && roles.length > 0) {
                await UserModel.setRoles(newUser.id, roles);
            } else {
                // Default role
                await UserModel.setRoles(newUser.id, ['consumer']);
            }

            // Log the action (could be more sophisticated)
            console.log(`[ADMIN] User created: ${newUser.username} (${newUser.id}) by admin ${req.user?.userId}`);

            res.status(201).json({
                message: 'User created successfully',
                user: {
                    ...newUser,
                    roles: roles || ['consumer']
                }
            });
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An error occurred while creating the user'
                }
            });
        }
    }

    /**
     * Get all entities for verification management
     * Includes: Users, Brands, Stores, Suppliers, Pages, Non-Profits
     * GET /api/admin/all-entities
     */
    async getAllEntities(req: AuthenticatedRequest, res: Response) {
        try {
            const { user } = req;

            if (!user?.roles.includes('admin')) {
                return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
            }

            // Fetch all users
            const usersQuery = `
                SELECT 
                    u.id,
                    u.username,
                    u.profile,
                    u.verification_status,
                    u.created_at,
                    u.updated_at,
                    'USER' as entity_type,
                    array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL) as roles
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                WHERE u.status != 'trashed'
                GROUP BY u.id, u.username, u.profile, u.verification_status, u.created_at, u.updated_at
            `;

            // Fetch all brands (including stores, suppliers, etc.)
            const brandsQuery = `
                SELECT 
                    ba.id,
                    ba.user_id,
                    ba.brand_info,
                    ba.verification_status,
                    ba.created_at,
                    ba.updated_at,
                    UPPER(COALESCE(ba.brand_info->>'businessType', 'BRAND')) as entity_type
                FROM brand_accounts ba
                WHERE ba.deleted_at IS NULL
            `;

            // Fetch all pages
            const pagesQuery = `
                SELECT 
                    p.id,
                    p.user_id,
                    p.name,
                    p.slug,
                    p.description,
                    p.logo_url,
                    p.banner_url,
                    p.is_verified,
                    p.created_at,
                    p.updated_at,
                    'PAGE' as entity_type
                FROM pages p
                WHERE p.deleted_at IS NULL
            `;

            const [usersResult, brandsResult, pagesResult] = await Promise.all([
                db.query(usersQuery),
                db.query(brandsQuery),
                db.query(pagesQuery)
            ]);

            // Transform users
            const users = usersResult.rows.map((row: any) => {
                const profile = typeof row.profile === 'string' ? JSON.parse(row.profile) : row.profile;
                return {
                    id: row.id,
                    entityType: 'USER',
                    brandInfo: {
                        name: profile.name || 'Unnamed User',
                        slug: row.username,
                        businessType: 'USER',
                        logo: profile.avatarUrl || profile.profilePicture
                    },
                    verificationStatus: row.verification_status || 'not_started',
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    roles: row.roles || []
                };
            });

            // Transform brands
            const brands = brandsResult.rows.map((row: any) => {
                const brandInfo = typeof row.brand_info === 'string' ? JSON.parse(row.brand_info) : row.brand_info;
                return {
                    id: row.id,
                    userId: row.user_id,
                    entityType: row.entity_type,
                    brandInfo: {
                        name: brandInfo.name || 'Unnamed Entity',
                        slug: brandInfo.slug,
                        businessType: row.entity_type,
                        logo: brandInfo.logo,
                        description: brandInfo.description
                    },
                    verificationStatus: row.verification_status || 'not_started',
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                };
            });

            // Transform pages
            const pages = pagesResult.rows.map((row: any) => ({
                id: row.id,
                userId: row.user_id,
                entityType: 'PAGE',
                brandInfo: {
                    name: row.name || 'Unnamed Page',
                    slug: row.slug,
                    businessType: 'PAGE',
                    logo: row.logo_url,
                    description: row.description
                },
                verificationStatus: row.is_verified ? 'verified' : 'not_started',
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));

            // Combine all entities
            const allEntities = [...users, ...brands, ...pages];

            res.json({
                success: true,
                data: {
                    entities: allEntities,
                    total: allEntities.length
                }
            });
        } catch (error: any) {
            console.error('Get all entities error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to fetch entities'
                }
            });
        }
    }

    /**
     * Update entity verification status
     * PUT /api/admin/entities/:entityId/verify
     */
    async updateEntityVerification(req: AuthenticatedRequest, res: Response) {
        try {
            const { user } = req;
            const { entityId } = req.params;
            const { status, entityType, notes } = req.body;

            if (!user?.roles.includes('admin')) {
                return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
            }

            if (!['not_started', 'pending', 'verified', 'rejected'].includes(status)) {
                return res.status(400).json({
                    error: { code: 'INVALID_STATUS', message: 'Invalid verification status' }
                });
            }

            let query: string;
            let params: any[];

            // Update based on entity type
            if (entityType === 'USER') {
                query = `
                    UPDATE users 
                    SET verification_status = $1, updated_at = NOW()
                    WHERE id = $2
                    RETURNING id, verification_status
                `;
                params = [status, entityId];
            } else if (entityType === 'PAGE') {
                // For pages, map verification status to is_verified boolean
                const isVerified = status === 'verified';
                query = `
                    UPDATE pages 
                    SET is_verified = $1, updated_at = NOW()
                    WHERE id = $2
                    RETURNING id, is_verified
                `;
                params = [isVerified, entityId];
            } else {
                // For brands (BRAND, STORE, SUPPLIER, NON_PROFIT, etc.)
                query = `
                    UPDATE brand_accounts 
                    SET verification_status = $1, updated_at = NOW()
                    WHERE id = $2
                    RETURNING id, verification_status
                `;
                params = [status, entityId];
            }

            const result = await db.query(query, params);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: { code: 'NOT_FOUND', message: 'Entity not found' }
                });
            }

            res.json({
                success: true,
                data: { entity: result.rows[0] }
            });
        } catch (error: any) {
            console.error('Update entity verification error:', error);
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to update verification status'
                }
            });
        }
    }
}
