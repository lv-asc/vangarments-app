import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
import { UserModel } from '../models/User';
import { BrandAccountModel } from '../models/BrandAccount';
import { BrandTeamModel } from '../models/BrandTeam';
import { StoreModel } from '../models/Store';
import { SupplierModel } from '../models/Supplier';
import { PageModel } from '../models/Page';
import { PageTeamModel } from '../models/PageTeam';

interface SwitchableAccount {
    id: string;
    type: 'user' | 'brand' | 'store' | 'supplier' | 'non_profit' | 'page';
    name: string;
    username?: string;
    slug?: string;
    avatar?: string;
    email?: string;
    telephone?: string;
    responsibleUserId?: string;
}

interface SwitchableAccountsResponse {
    accounts: {
        users: SwitchableAccount[];
        brands: SwitchableAccount[];
        stores: SwitchableAccount[];
        suppliers: SwitchableAccount[];
        nonProfits: SwitchableAccount[];
        pages: SwitchableAccount[];
    };
}

export class AccountController {
    /**
     * Get all accounts the current user can switch to
     * GET /api/v1/accounts/switchable
     */
    static async getSwitchableAccounts(req: Request, res: Response): Promise<void> {
        try {
            const authReq = req as AuthenticatedRequest;
            const userId = authReq.user?.userId || authReq.user?.id;

            if (!userId) {
                console.warn('Switch Account request without userId. User may not be properly authenticated.');
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            // Get the current user
            const currentUser = await UserModel.findById(userId);
            if (!currentUser) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            // Prepare the user's own account
            const userAccount: SwitchableAccount = {
                id: currentUser.id,
                type: 'user',
                name: currentUser.personalInfo?.name || 'User',
                username: currentUser.username,
                avatar: currentUser.personalInfo?.avatarUrl,
                email: currentUser.email,
                telephone: currentUser.personalInfo?.telephone,
            };

            // Get brand/store/supplier/non-profit memberships via BrandTeam
            const brandMemberships = await BrandTeamModel.getUserMembershipsWithDetails(userId);

            const brands: SwitchableAccount[] = [];
            const stores: SwitchableAccount[] = [];
            const suppliers: SwitchableAccount[] = [];
            const nonProfits: SwitchableAccount[] = [];

            for (const membership of brandMemberships) {
                const account: SwitchableAccount = {
                    id: membership.brandId,
                    type: membership.businessType as any,
                    name: membership.brandName,
                    slug: membership.brandSlug,
                    avatar: membership.brandLogo,
                    responsibleUserId: userId, // User is part of the team
                };

                // Get full brand info for email/phone
                const brandAccount = await BrandAccountModel.findById(membership.brandId);
                if (brandAccount) {
                    account.email = brandAccount.brandInfo.contactInfo?.email;
                    account.telephone = brandAccount.brandInfo.contactInfo?.phone;
                }

                // Categorize by business type
                switch (membership.businessType) {
                    case 'store':
                        account.type = 'store';
                        stores.push(account);
                        break;
                    case 'supplier':
                    case 'manufacturer':
                        account.type = 'supplier';
                        suppliers.push(account);
                        break;
                    case 'non_profit':
                        account.type = 'non_profit';
                        nonProfits.push(account);
                        break;
                    case 'brand':
                    case 'designer':
                    default:
                        account.type = 'brand';
                        brands.push(account);
                        break;
                }
            }

            // Also check for stores/suppliers where user is the owner (userId field)
            const ownedStores = await StoreModel.findAllByUserId(userId);
            for (const store of ownedStores) {
                // Avoid duplicates
                if (!stores.find(s => s.id === store.id)) {
                    stores.push({
                        id: store.id,
                        type: 'store',
                        name: store.name,
                        slug: store.slug,
                        email: store.email,
                        telephone: store.telephone,
                        responsibleUserId: store.userId,
                    });
                }
            }

            const ownedSuppliers = await SupplierModel.findAllByUserId(userId);
            for (const supplier of ownedSuppliers) {
                if (!suppliers.find(s => s.id === supplier.id)) {
                    suppliers.push({
                        id: supplier.id,
                        type: 'supplier',
                        name: supplier.name,
                        slug: supplier.slug,
                        email: supplier.email,
                        telephone: supplier.telephone,
                        responsibleUserId: supplier.userId,
                    });
                }
            }

            // Get page memberships
            const ownedPages = await PageModel.findAllByUserId(userId);
            const pages: SwitchableAccount[] = ownedPages.map(page => ({
                id: page.id,
                type: 'page' as const,
                name: page.name,
                slug: page.slug,
                avatar: page.logoUrl,
                email: page.email,
                telephone: page.telephone,
                responsibleUserId: page.userId,
            }));

            const response: SwitchableAccountsResponse = {
                accounts: {
                    users: [userAccount],
                    brands,
                    stores,
                    suppliers,
                    nonProfits,
                    pages,
                },
            };

            res.json(response);
        } catch (error) {
            console.error('Error getting switchable accounts:', error);
            if (error instanceof Error) {
                console.error('Error stack:', error.stack);
            }
            res.status(500).json({
                error: 'Failed to get switchable accounts',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    }
}
