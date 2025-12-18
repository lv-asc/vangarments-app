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
                cpf: cpf || null
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
}
