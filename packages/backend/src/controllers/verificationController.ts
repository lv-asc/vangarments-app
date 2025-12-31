import { Request, Response } from 'express';
import { VerificationRequestModel } from '../models/VerificationRequest';
import { UserModel } from '../models/User';
import { BrandAccountModel } from '../models/BrandAccount';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        roles: string[];
    };
}

export class VerificationController {
    /**
     * Submit a verification request
     * POST /api/verification/request
     */
    async submitRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { requestType, entityId, reason, supportingDocuments } = req.body;
            const userId = req.user!.id;

            // Validate request type
            if (!['user', 'entity'].includes(requestType)) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_REQUEST_TYPE',
                        message: 'Request type must be "user" or "entity"'
                    }
                });
                return;
            }

            // For user verification, check if user already has pending request
            if (requestType === 'user') {
                const hasPending = await VerificationRequestModel.hasPendingRequest(userId);
                if (hasPending) {
                    res.status(400).json({
                        error: {
                            code: 'PENDING_REQUEST_EXISTS',
                            message: 'You already have a pending verification request'
                        }
                    });
                    return;
                }

                // Check if user is already verified
                const verificationStatus = await UserModel.getVerificationStatus(userId);
                if (verificationStatus === 'verified') {
                    res.status(400).json({
                        error: {
                            code: 'ALREADY_VERIFIED',
                            message: 'User is already verified'
                        }
                    });
                    return;
                }
            }

            // For entity verification, check if entity exists and user has permission
            if (requestType === 'entity') {
                if (!entityId) {
                    res.status(400).json({
                        error: {
                            code: 'ENTITY_ID_REQUIRED',
                            message: 'Entity ID is required for entity verification requests'
                        }
                    });
                    return;
                }

                const entity = await BrandAccountModel.findById(entityId);
                if (!entity) {
                    res.status(404).json({
                        error: {
                            code: 'ENTITY_NOT_FOUND',
                            message: 'Entity not found'
                        }
                    });
                    return;
                }

                // Check if user is the owner of the entity
                if (entity.userId !== userId) {
                    res.status(403).json({
                        error: {
                            code: 'INSUFFICIENT_PERMISSIONS',
                            message: 'You must be the owner of the entity to request verification'
                        }
                    });
                    return;
                }

                // Check if entity already has pending request
                const hasPending = await VerificationRequestModel.hasPendingRequest(undefined, entityId);
                if (hasPending) {
                    res.status(400).json({
                        error: {
                            code: 'PENDING_REQUEST_EXISTS',
                            message: 'This entity already has a pending verification request'
                        }
                    });
                    return;
                }

                // Check if entity is already verified
                if (entity.verificationStatus === 'verified') {
                    res.status(400).json({
                        error: {
                            code: 'ALREADY_VERIFIED',
                            message: 'Entity is already verified'
                        }
                    });
                    return;
                }
            }

            // Create verification request
            const request = await VerificationRequestModel.create({
                userId: requestType === 'user' ? userId : undefined,
                entityId: requestType === 'entity' ? entityId : undefined,
                requestType,
                reason,
                supportingDocuments
            });

            // Update status to pending
            if (requestType === 'user') {
                await UserModel.updateVerificationStatus(userId, 'pending');
            } else {
                await BrandAccountModel.update(entityId, { verificationStatus: 'pending' });
            }

            res.json({
                success: true,
                data: { request }
            });
        } catch (error: any) {
            console.error('Submit verification request error:', error);
            res.status(500).json({
                error: {
                    code: 'SUBMIT_REQUEST_FAILED',
                    message: error.message || 'Failed to submit verification request'
                }
            });
        }
    }

    /**
     * Get all verification requests (admin only)
     * GET /api/verification/requests
     */
    async getRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // Check admin permission
            if (!req.user!.roles.includes('admin')) {
                res.status(403).json({
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: 'Admin access required'
                    }
                });
                return;
            }

            const { status, requestType, limit, offset } = req.query;

            const filters: any = {};
            if (status) filters.status = status as string;
            if (requestType) filters.requestType = requestType as string;

            const result = await VerificationRequestModel.findMany(
                filters,
                limit ? parseInt(limit as string) : 50,
                offset ? parseInt(offset as string) : 0
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            console.error('Get verification requests error:', error);
            res.status(500).json({
                error: {
                    code: 'GET_REQUESTS_FAILED',
                    message: error.message || 'Failed to get verification requests'
                }
            });
        }
    }

    /**
     * Approve verification request (admin only)
     * PUT /api/verification/requests/:id/approve
     */
    async approveRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // Check admin permission
            if (!req.user!.roles.includes('admin')) {
                res.status(403).json({
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: 'Admin access required'
                    }
                });
                return;
            }

            const { id } = req.params;
            const { reviewNotes } = req.body;

            const request = await VerificationRequestModel.findById(id);
            if (!request) {
                res.status(404).json({
                    error: {
                        code: 'REQUEST_NOT_FOUND',
                        message: 'Verification request not found'
                    }
                });
                return;
            }

            // Update request status
            await VerificationRequestModel.update(id, {
                status: 'approved',
                reviewedBy: req.user!.id,
                reviewNotes
            });

            // Update user/entity verification status
            if (request.requestType === 'user' && request.userId) {
                await UserModel.updateVerificationStatus(request.userId, 'verified');
            } else if (request.requestType === 'entity' && request.entityId) {
                await BrandAccountModel.update(request.entityId, { verificationStatus: 'verified' });
            }

            res.json({
                success: true,
                message: 'Verification request approved'
            });
        } catch (error: any) {
            console.error('Approve verification request error:', error);
            res.status(500).json({
                error: {
                    code: 'APPROVE_REQUEST_FAILED',
                    message: error.message || 'Failed to approve verification request'
                }
            });
        }
    }

    /**
     * Reject verification request (admin only)
     * PUT /api/verification/requests/:id/reject
     */
    async rejectRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // Check admin permission
            if (!req.user!.roles.includes('admin')) {
                res.status(403).json({
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: 'Admin access required'
                    }
                });
                return;
            }

            const { id } = req.params;
            const { reviewNotes } = req.body;

            const request = await VerificationRequestModel.findById(id);
            if (!request) {
                res.status(404).json({
                    error: {
                        code: 'REQUEST_NOT_FOUND',
                        message: 'Verification request not found'
                    }
                });
                return;
            }

            // Update request status
            await VerificationRequestModel.update(id, {
                status: 'rejected',
                reviewedBy: req.user!.id,
                reviewNotes
            });

            // Update user/entity verification status
            if (request.requestType === 'user' && request.userId) {
                await UserModel.updateVerificationStatus(request.userId, 'rejected');
            } else if (request.requestType === 'entity' && request.entityId) {
                await BrandAccountModel.update(request.entityId, { verificationStatus: 'rejected' });
            }

            res.json({
                success: true,
                message: 'Verification request rejected'
            });
        } catch (error: any) {
            console.error('Reject verification request error:', error);
            res.status(500).json({
                error: {
                    code: 'REJECT_REQUEST_FAILED',
                    message: error.message || 'Failed to reject verification request'
                }
            });
        }
    }

    /**
     * Directly verify a user (admin only, no request needed)
     * PUT /api/users/:id/verify
     */
    async verifyUser(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // Check admin permission
            if (!req.user!.roles.includes('admin')) {
                res.status(403).json({
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: 'Admin access required'
                    }
                });
                return;
            }

            const { id } = req.params;

            const user = await UserModel.findById(id);
            if (!user) {
                res.status(404).json({
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found'
                    }
                });
                return;
            }

            await UserModel.updateVerificationStatus(id, 'verified');

            res.json({
                success: true,
                message: 'User verified successfully'
            });
        } catch (error: any) {
            console.error('Verify user error:', error);
            res.status(500).json({
                error: {
                    code: 'VERIFY_USER_FAILED',
                    message: error.message || 'Failed to verify user'
                }
            });
        }
    }

    /**
     * Unverify a user (admin only)
     * PUT /api/users/:id/unverify
     */
    async unverifyUser(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // Check admin permission
            if (!req.user!.roles.includes('admin')) {
                res.status(403).json({
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: 'Admin access required'
                    }
                });
                return;
            }

            const { id } = req.params;

            const user = await UserModel.findById(id);
            if (!user) {
                res.status(404).json({
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found'
                    }
                });
                return;
            }

            await UserModel.updateVerificationStatus(id, 'unverified');

            res.json({
                success: true,
                message: 'User unverified successfully'
            });
        } catch (error: any) {
            console.error('Unverify user error:', error);
            res.status(500).json({
                error: {
                    code: 'UNVERIFY_USER_FAILED',
                    message: error.message || 'Failed to unverify user'
                }
            });
        }
    }
}

export const verificationController = new VerificationController();
