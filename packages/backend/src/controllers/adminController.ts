import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
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
}
