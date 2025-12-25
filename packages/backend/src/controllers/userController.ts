import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { AuthenticatedRequest } from '../utils/auth';
import { AddressUtils, BrazilianAddress } from '../utils/address';
import { MeasurementUtils } from '../utils/measurements';
import { VUFSItemModel } from '../models/VUFSItem';
import multer from 'multer';
import { LocalStorageService } from '../services/localStorageService';
import { BrandAccountModel } from '../models/BrandAccount';
import { StoreModel } from '../models/Store';
import { SupplierModel } from '../models/Supplier';
import { PageModel } from '../models/Page';
import { SocialService } from '../services/socialService';
import { OutfitModel } from '../models/Outfit';
import { BrandTeamModel } from '../models/BrandTeam';
import { UserFollowModel } from '../models/UserFollow';
import axios from 'axios';

const socialService = new SocialService();

// Configure multer for avatar uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export class UserController {
  static uploadAvatarMiddleware = upload.single('avatar');
  static uploadBannerMiddleware = upload.single('banner');

  static async uploadAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'NO_FILE',
            message: 'No image file provided'
          }
        });
      }

      const uploadResult = await LocalStorageService.uploadImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'profiles',
        req.user.userId
      );

      const avatarUrl = uploadResult.optimizedUrl || uploadResult.url;

      // Update user profile with new avatar URL
      // Pass avatarUrl as a profile field that will be merged with existing profile data
      const updateData: any = {
        profile: {
          avatarUrl
        }
      };

      const updatedUser = await UserModel.update(req.user.userId, updateData);

      if (!updatedUser) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.json({
        message: 'Avatar uploaded successfully',
        avatarUrl
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while uploading avatar'
        }
      });
    }
  }

  static async uploadBanner(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'NO_FILE',
            message: 'No image file provided'
          }
        });
      }

      const uploadResult = await LocalStorageService.uploadImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'banners',
        req.user.userId
      );

      const bannerUrl = uploadResult.optimizedUrl || uploadResult.url;

      // Update user profile with new banner URL
      const updateData: any = {
        profile: {
          bannerUrl
        }
      };

      const updatedUser = await UserModel.update(req.user.userId, updateData);

      if (!updatedUser) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.json({
        message: 'Banner uploaded successfully',
        bannerUrl
      });
    } catch (error) {
      console.error('Upload banner error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while uploading banner'
        }
      });
    }
  }

  static async updateProfileImages(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }

      const { profileImages } = req.body;

      if (!Array.isArray(profileImages)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_DATA',
            message: 'profileImages must be an array'
          }
        });
      }

      // Limit to 5 images
      if (profileImages.length > 5) {
        return res.status(400).json({
          error: {
            code: 'TOO_MANY_IMAGES',
            message: 'Maximum 5 profile images allowed'
          }
        });
      }

      // First image becomes the main avatar
      const avatarUrl = profileImages.length > 0 ? profileImages[0] : null;

      const updateData: any = {
        profile: {
          profileImages,
          avatarUrl
        }
      };

      const updatedUser = await UserModel.update(req.user.userId, updateData);

      if (!updatedUser) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.json({
        message: 'Profile images updated successfully',
        profileImages,
        avatarUrl
      });
    } catch (error) {
      console.error('Update profile images error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating profile images'
        }
      });
    }
  }

  static async updateBannerImages(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }

      const { bannerImages } = req.body;

      if (!Array.isArray(bannerImages)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_DATA',
            message: 'bannerImages must be an array'
          }
        });
      }

      // Limit to 5 banner images
      if (bannerImages.length > 5) {
        return res.status(400).json({
          error: {
            code: 'TOO_MANY_IMAGES',
            message: 'Maximum 5 banner images allowed'
          }
        });
      }

      // First banner becomes the main banner
      const bannerUrl = bannerImages.length > 0 ? bannerImages[0] : null;

      const updateData: any = {
        profile: {
          bannerImages,
          bannerUrl
        }
      };

      const updatedUser = await UserModel.update(req.user.userId, updateData);

      if (!updatedUser) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.json({
        message: 'Banner images updated successfully',
        bannerImages,
        bannerUrl
      });
    } catch (error) {
      console.error('Update banner images error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating banner images'
        }
      });
    }
  }

  static async checkUsernameAvailability(req: Request, res: Response) {
    try {
      const { username } = req.params;
      const excludeUserId = (req as AuthenticatedRequest).user?.userId;

      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]{1,30}$/;
      if (!usernameRegex.test(username)) {
        return res.json({
          available: false,
          error: 'Username must be 3-30 characters, alphanumeric and underscore only'
        });
      }

      const isTaken = await UserModel.isUsernameTaken(username, excludeUserId);

      res.json({
        available: !isTaken,
        username
      });
    } catch (error) {
      console.error('Check username availability error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while checking username availability'
        }
      });
    }
  }

  static async lookupCEP(req: Request, res: Response) {
    const { cep } = req.params;
    console.log(`[CEP Proxy] Received request for CEP: ${cep}`);

    try {
      const cleanCEP = cep.replace(/\D/g, '');

      if (cleanCEP.length !== 8) {
        console.warn(`[CEP Proxy] Invalid CEP length: ${cleanCEP}`);
        return res.status(400).json({
          error: {
            code: 'INVALID_CEP',
            message: 'CEP must be 8 digits'
          }
        });
      }

      console.log(`[CEP Proxy] Fetching from ViaCEP: https://viacep.com.br/ws/${cleanCEP}/json/`);

      const response = await axios.get(`https://viacep.com.br/ws/${cleanCEP}/json/`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Vangarments-Platform/1.0'
        }
      });

      const data = response.data;
      console.log(`[CEP Proxy] ViaCEP response received:`, data);

      if (data.erro) {
        console.warn(`[CEP Proxy] CEP not found in ViaCEP: ${cleanCEP}`);
        return res.status(404).json({
          error: {
            code: 'CEP_NOT_FOUND',
            message: 'CEP not found'
          }
        });
      }

      const formattedData = {
        cep: data.cep,
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
        complement: data.complemento,
        ibge: data.ibge,
        gia: data.gia,
        ddd: data.ddd,
        siafi: data.siafi
      };

      res.json({ data: formattedData });
    } catch (error: any) {
      console.error('[CEP Proxy] Critical error:', error.message);
      if (error.response) {
        console.error('[CEP Proxy] ViaCEP error response:', error.response.status, error.response.data);
      }

      res.status(500).json({
        error: {
          code: 'CEP_LOOKUP_ERROR',
          message: error.message || 'Failed to lookup CEP'
        }
      });
    }
  }

  static async updateBasicProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }

      const { name, bio, socialLinks, roles, username, privacySettings, measurements, birthDate, location, gender, genderOther, bodyType, contactEmail, telephone } = req.body;
      console.log('DEBUG: updateBasicProfile req.body', { name, bio, privacySettings, measurements, birthDate, location, gender, genderOther, bodyType });
      const updateData: any = {};
      let usernameUpdateResult: { success: boolean; error?: string; daysRemaining?: number } | null = null;

      // Handle username update separately (has special validation)
      if (username !== undefined) {
        usernameUpdateResult = await UserModel.updateUsername(req.user.userId, username);
        if (!usernameUpdateResult.success) {
          return res.status(400).json({
            error: {
              code: 'USERNAME_UPDATE_FAILED',
              message: usernameUpdateResult.error,
              daysRemaining: usernameUpdateResult.daysRemaining
            }
          });
        }
      }

      if (name) updateData.name = name;
      if (bio !== undefined || birthDate !== undefined) {
        updateData.profile = updateData.profile || {};
        if (bio !== undefined) updateData.profile.bio = bio;
        if (birthDate !== undefined) updateData.profile.birthDate = birthDate;
        updateData.profile.updatedAt = new Date().toISOString();
      }

      if (privacySettings !== undefined) {
        updateData.privacySettings = privacySettings;
      }

      if (socialLinks) {
        updateData.socialLinks = socialLinks;
      }
      if (measurements) {
        updateData.measurements = measurements;
      }
      if (location) {
        updateData.location = location;
      }

      if (gender || genderOther || bodyType || contactEmail || telephone) {
        updateData.profile = updateData.profile || {};
        if (gender !== undefined) updateData.profile.gender = gender;
        if (genderOther !== undefined) updateData.profile.genderOther = genderOther;
        if (bodyType !== undefined) updateData.profile.bodyType = bodyType;
        if (contactEmail !== undefined) updateData.profile.contactEmail = contactEmail;
        if (telephone !== undefined) updateData.profile.telephone = telephone;
      }
      // Update roles if provided
      if (roles) {
        await UserModel.setRoles(req.user.userId, roles);
      }

      // Only call update if there's data to update (username is handled separately)
      if (Object.keys(updateData).length > 0) {
        await UserModel.update(req.user.userId, updateData);
      }

      // Fetch updated user to return complete profile
      const updatedUser = await UserModel.findById(req.user.userId);

      if (!updatedUser) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.json({
        message: 'Profile updated successfully',
        user: {
          name: updatedUser.personalInfo.name,
          bio: (updatedUser.personalInfo as any).bio,
          username: (updatedUser as any).username,
          roles: (updatedUser as any).roles
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating profile'
        }
      });
    }
  }

  static async getProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);

      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      // Get stats
      const stats = await VUFSItemModel.getStatsByOwner(id);

      // Get outfit count
      const userOutfits = await OutfitModel.getUserOutfits(id);

      // Get social stats
      const socialStatsRaw = await socialService.getUserSocialStats(id);

      const socialStats = {
        followers: socialStatsRaw.followersCount,
        following: socialStatsRaw.followingCount,
        pendingFollowRequests: socialStatsRaw.pendingFollowRequestsCount,
        outfitsCreated: userOutfits.length
      };

      const profile = {
        id: user.id,
        name: user.personalInfo.name,
        username: (user as any).username || user.email.split('@')[0], // Use real username or fallback
        usernameLastChanged: (user as any).usernameLastChanged || null,
        email: user.email,
        cpf: user.cpf,
        birthDate: user.personalInfo.birthDate,
        bio: (user.personalInfo as any).bio || '',
        profileImage: (user.personalInfo as any).avatarUrl,
        bannerImage: (user as any)._rawProfile?.bannerUrl || null,
        profileImages: (user as any)._rawProfile?.profileImages || [],
        bannerImages: (user as any)._rawProfile?.bannerImages || [],
        socialLinks: user.socialLinks || [],
        roles: (user as any).roles || [],
        createdAt: user.createdAt,
        // Include full nested objects for frontend consumption
        personalInfo: user.personalInfo,
        measurements: user.measurements || {},
        privacySettings: (user as any).privacySettings || { height: false, weight: false, birthDate: false },
        stats: {
          wardrobeItems: stats.totalItems || 0,
          ...socialStats
        },
        preferences: {
          style: user.preferences?.styleProfile || [],
          brands: user.preferences?.preferredBrands || [],
          colors: user.preferences?.favoriteColors || [],
          priceRange: user.preferences?.priceRange || { min: 0, max: 1000 }
        }
      };

      res.json({
        message: 'Profile retrieved successfully',
        profile
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching profile'
        }
      });
    }
  }

  static async getByUsername(req: Request, res: Response) {
    try {
      const { username } = req.params;
      const user = await UserModel.findByUsername(username);

      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      // Get stats
      const [itemStats, outfitStats, socialStats] = await Promise.all([
        VUFSItemModel.getStatsByOwner(user.id),
        OutfitModel.getUserOutfitStats(user.id),
        socialService.getUserSocialStats(user.id)
      ]);

      const profile = {
        id: user.id,
        name: user.personalInfo.name,
        username: (user as any).username || user.email.split('@')[0],
        usernameLastChanged: (user as any).usernameLastChanged || null,
        email: user.email,
        // Hide sensitive info for public profile
        // cpf: user.cpf, 
        // birthDate: user.personalInfo.birthDate,
        bio: (user.personalInfo as any).bio || '',
        profileImage: (user.personalInfo as any).avatarUrl,
        bannerImage: (user as any)._rawProfile?.bannerUrl || null,
        bannerImages: (user as any)._rawProfile?.bannerImages || [],
        // Only expose main profile image (first one) to public
        socialLinks: user.socialLinks || [],
        roles: (user as any).roles || [],
        createdAt: user.createdAt,
        // Include partial nested objects safe for public
        personalInfo: {
          name: user.personalInfo.name,
          gender: user.personalInfo.gender,
          avatarUrl: user.personalInfo.avatarUrl,
          bio: (user.personalInfo as any).bio,
          location: user.personalInfo.location
        },
        measurements: (user.privacySettings as any)?.weight || (user.privacySettings as any)?.height ? {} : user.measurements,
        stats: {
          wardrobeItems: itemStats.totalItems || 0,
          followers: socialStats.followersCount || 0,
          following: socialStats.followingCount || 0,
          friendsCount: socialStats.friendsCount || 0,
          pendingFollowRequests: socialStats.pendingFollowRequestsCount || 0,
          outfitsCreated: outfitStats.totalOutfits || 0
        },
        preferences: {
          style: user.preferences?.styleProfile || [],
          brands: user.preferences?.preferredBrands || [],
          colors: user.preferences?.favoriteColors || [],
          // Hide price range for public
        }
      };

      res.json({
        message: 'Profile retrieved successfully',
        profile
      });
    } catch (error) {
      console.error('Get profile by username error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching profile'
        }
      });
    }
  }

  static async updateMeasurements(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { height, weight, sizes } = req.body;

      // Validate measurements
      const validationErrors = MeasurementUtils.validateMeasurements({
        height,
        weight,
        sizes,
      });

      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid measurement data',
            details: validationErrors,
          },
        });
      }

      const measurements = {
        height,
        weight,
        sizes: sizes || {},
        updatedAt: new Date().toISOString(),
      };

      const updatedUser = await UserModel.update(req.user.userId, {
        measurements,
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
        message: 'Measurements updated successfully',
        measurements: updatedUser.measurements,
      });
    } catch (error) {
      console.error('Update measurements error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating measurements',
        },
      });
    }
  }

  static async updateAddress(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const addressData: Partial<BrazilianAddress> = req.body;

      // Validate Brazilian address
      const validationErrors = AddressUtils.validateAddress(addressData);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid address data',
            details: validationErrors,
          },
        });
      }

      // Validate state code
      if (addressData.state && !AddressUtils.isValidState(addressData.state)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_STATE',
            message: 'Invalid Brazilian state code',
          },
        });
      }

      // Format and clean CEP
      const cleanCEP = addressData.cep ? AddressUtils.cleanCEP(addressData.cep) : '';

      const location = {
        country: 'Brazil',
        state: addressData.state?.toUpperCase() || '',
        city: addressData.city || '',
        neighborhood: addressData.neighborhood || '',
        cep: cleanCEP,
        street: addressData.street || '',
        number: addressData.number || '',
        complement: addressData.complement || '',
      };

      const updatedUser = await UserModel.update(req.user.userId, {
        location,
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
        message: 'Address updated successfully',
        location: updatedUser.personalInfo.location,
      });
    } catch (error) {
      console.error('Update address error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating address',
        },
      });
    }
  }

  static async updatePreferences(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { favoriteColors, preferredBrands, styleProfile, priceRange } = req.body;

      // Validate price range
      if (priceRange && (priceRange.min < 0 || priceRange.max < priceRange.min)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_PRICE_RANGE',
            message: 'Invalid price range values',
          },
        });
      }

      const preferences = {
        favoriteColors: favoriteColors || [],
        preferredBrands: preferredBrands || [],
        styleProfile: styleProfile || [],
        priceRange: priceRange || { min: 0, max: 1000 },
        updatedAt: new Date().toISOString(),
      };

      const updatedUser = await UserModel.update(req.user.userId, {
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
        message: 'Preferences updated successfully',
        preferences: updatedUser.preferences,
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating preferences',
        },
      });
    }
  }

  static async convertSize(req: Request, res: Response) {
    try {
      const { size, fromStandard, toStandard, category } = req.query;

      if (!size || !fromStandard || !toStandard || !category) {
        return res.status(400).json({
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'Size, fromStandard, toStandard, and category are required',
          },
        });
      }

      const validCategories = ['womens_clothing', 'mens_clothing', 'shoes'];
      if (!validCategories.includes(category as string)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_CATEGORY',
            message: 'Category must be one of: womens_clothing, mens_clothing, shoes',
          },
        });
      }

      const validStandards = ['BR', 'US', 'EU', 'UK'];
      if (!validStandards.includes(fromStandard as string) ||
        !validStandards.includes(toStandard as string)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_STANDARD',
            message: 'Standards must be one of: BR, US, EU, UK',
          },
        });
      }

      const convertedSize = MeasurementUtils.convertSize(
        size as string,
        fromStandard as any,
        toStandard as any,
        category as any
      );

      if (!convertedSize) {
        return res.status(404).json({
          error: {
            code: 'SIZE_NOT_FOUND',
            message: 'Size conversion not found',
          },
        });
      }

      res.json({
        originalSize: size,
        convertedSize,
        fromStandard,
        toStandard,
        category,
      });
    } catch (error) {
      console.error('Size conversion error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during size conversion',
        },
      });
    }
  }

  static async getSizeChart(req: Request, res: Response) {
    try {
      const { category } = req.query;

      if (!category) {
        return res.status(400).json({
          error: {
            code: 'MISSING_CATEGORY',
            message: 'Category parameter is required',
          },
        });
      }

      let sizeChart;
      switch (category) {
        case 'womens_clothing':
          sizeChart = MeasurementUtils.WOMENS_CLOTHING_SIZES;
          break;
        case 'mens_clothing':
          sizeChart = MeasurementUtils.MENS_CLOTHING_SIZES;
          break;
        case 'shoes':
          sizeChart = MeasurementUtils.SHOE_SIZES;
          break;
        default:
          return res.status(400).json({
            error: {
              code: 'INVALID_CATEGORY',
              message: 'Category must be one of: womens_clothing, mens_clothing, shoes',
            },
          });
      }

      res.json({
        category,
        sizeChart,
      });
    } catch (error) {
      console.error('Get size chart error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching size chart',
        },
      });
    }
  }

  static async getAllUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const { search, page = 1, limit = 20, roles, status } = req.query;

      // Ensure user is admin
      if (!req.user?.roles.includes('admin')) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied. Admin role required.',
          },
        });
      }

      const filters = {
        search: search as string,
        limit: parseInt(limit as string),
        offset: (parseInt(page as string) - 1) * parseInt(limit as string),
        roles: roles ? (roles as string).split(',') : undefined,
        status: (status as string) || undefined
      };

      const { users, total } = await UserModel.findAll(filters);

      res.json({
        success: true,
        users,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching users',
        },
      });
    }
  }



  static async getUserById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!req.user?.roles.includes('admin')) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied. Admin role required.',
          },
        });
      }

      const [user, brands, stores, suppliers, pages] = await Promise.all([
        UserModel.findById(id),
        BrandAccountModel.findAllByUserId(id),
        StoreModel.findAllByUserId(id),
        SupplierModel.findAllByUserId(id),
        PageModel.findAllByUserId(id)
      ]);

      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        });
      }

      res.json({
        success: true,
        user: {
          ...user,
          brands,
          stores,
          suppliers,
          pages
        },
      });
    } catch (error) {
      console.error('Get user by id error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching user',
        },
      });
    }
  }

  static async adminUpdateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, bio, roles, username, socialLinks, privacySettings, measurements, birthDate, location, gender, genderOther, bodyType, contactEmail, telephone } = req.body;

      if (!req.user?.roles.includes('admin')) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied. Admin role required.',
          },
        });
      }

      console.log('DEBUG: adminUpdateUser body', req.body);

      const updateData: any = {};

      // Handle username update
      if (username !== undefined) {
        // Check if taken, but maybe allow bypass cooldown? For now standard check.
        const isTaken = await UserModel.isUsernameTaken(username, id);
        if (isTaken) {
          return res.status(400).json({
            error: {
              code: 'USERNAME_TAKEN',
              message: 'Username is already taken'
            }
          });
        }
        // Directly update username for admin, skipping cooldown check usually desired
        // But we need to update it via SQL. UserModel.update doesn't update username directly in some versions?
        // UserModel.create inserts it. UserModel.update does NOT have username in UpdateUserData unless we change interface.
        // Let's check UserModel.update. It does NOT update username.
        // UserModel.updateUsername handles it.
        // We'll call updateUsername but ignoring success/daysRemaining result if we want to FORCE it,
        // or we respect it. Standard updateUsername checks cooldown.
        // Admins might want to force it.
        // Let's stick to standard flow for now using updateUsername, but since we are admin, maybe we should direct update if we could.
        // However, let's use the provided method.
        const usernameResult = await UserModel.updateUsername(id, username);
        if (!usernameResult.success) {
          // If it failed due to cooldown, admins might want to override.
          // For now, let's just return error.
          return res.status(400).json({
            error: {
              code: 'USERNAME_UPDATE_FAILED',
              message: usernameResult.error
            }
          });
        }
      }

      if (name) updateData.name = name;

      if (bio !== undefined || birthDate !== undefined || contactEmail !== undefined || telephone !== undefined || gender !== undefined) {
        updateData.profile = updateData.profile || {};
        if (bio !== undefined) updateData.profile.bio = bio;
        if (birthDate !== undefined) updateData.profile.birthDate = birthDate;
        if (contactEmail !== undefined) updateData.profile.contactEmail = contactEmail;
        if (telephone !== undefined) updateData.profile.telephone = telephone;
        if (gender !== undefined) updateData.profile.gender = gender;
        if (genderOther !== undefined) updateData.profile.genderOther = genderOther;
        if (bodyType !== undefined) updateData.profile.bodyType = bodyType;
      }

      if (location) updateData.location = location;
      if (measurements) updateData.measurements = measurements;
      if (privacySettings) updateData.privacySettings = privacySettings;
      if (socialLinks) updateData.socialLinks = socialLinks;

      // Update roles if provided
      if (roles && Array.isArray(roles)) {
        await UserModel.setRoles(id, roles);
      }

      if (Object.keys(updateData).length > 0) {
        await UserModel.update(id, updateData);
      }

      const updatedUser = await UserModel.findById(id);

      res.json({
        success: true,
        user: updatedUser,
      });
    } catch (error) {
      console.error('Admin update user error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating user',
        },
      });
    }
  }

  static async updateActivity(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED' } });
      }

      // Update last_seen_at
      await UserModel.update(req.user.userId, {
        lastSeenAt: new Date().toISOString() // Fixed property name to match interface update
      } as any); // Type assertion needed until UpdateUserData interface is properly updated

      res.json({ success: true });
    } catch (error) {
      // Silent error for activity updates
      console.error('Update activity error:', error);
      res.status(500).json({ success: false });
    }
  }

  static async banUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { duration, reason } = req.body;

      if (!req.user?.roles.includes('admin')) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
      }

      let banExpiresAt: Date | undefined;
      const now = new Date();

      if (duration && duration !== 'permanent') {
        const durations: Record<string, number> = {
          '1d': 24 * 60 * 60 * 1000,
          '1w': 7 * 24 * 60 * 60 * 1000,
          '1m': 30 * 24 * 60 * 60 * 1000,
          '3m': 90 * 24 * 60 * 60 * 1000,
          '6m': 180 * 24 * 60 * 60 * 1000,
          '1y': 365 * 24 * 60 * 60 * 1000,
          '2y': 730 * 24 * 60 * 60 * 1000,
        };
        if (durations[duration]) {
          banExpiresAt = new Date(now.getTime() + durations[duration]);
        }
      }

      await UserModel.updateStatus(id, 'banned', banExpiresAt, reason);

      res.json({ success: true, message: 'User banned' });
    } catch (error) {
      console.error('Ban user error:', error);
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to ban user' } });
    }
  }

  static async deactivateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!req.user?.roles.includes('admin')) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
      }

      await UserModel.updateStatus(id, 'deactivated');
      res.json({ success: true, message: 'User deactivated' });
    } catch (error) {
      console.error('Deactivate user error:', error);
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to deactivate user' } });
    }
  }

  static async reactivateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!req.user?.roles.includes('admin')) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
      }

      await UserModel.updateStatus(id, 'active');
      res.json({ success: true, message: 'User reactivated' });
    } catch (error) {
      console.error('Reactivate user error:', error);
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to reactivate user' } });
    }
  }

  static async restoreUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!req.user?.roles.includes('admin')) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
      }

      await UserModel.restore(id);
      res.json({ success: true, message: 'User restored from trash' });
    } catch (error) {
      console.error('Restore user error:', error);
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to restore user' } });
    }
  }

  /**
   * Get all team memberships across all brands
   * Used by admin dashboard to show entities linked to users
   */
  static async getAllTeamMemberships(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.roles.includes('admin')) {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Admin access required' }
        });
      }

      const memberships = await BrandTeamModel.getAllMemberships();
      res.json({ success: true, memberships });
    } catch (error) {
      console.error('Get all team memberships error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to get team memberships' }
      });
    }
  }

  /**
   * Get current user's team memberships with full entity details
   * Used by profile page to show linked entities
   */
  static async getMyMemberships(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      const memberships = await BrandTeamModel.getUserMembershipsWithDetails(req.user.userId);
      res.json({ success: true, memberships });
    } catch (error) {
      console.error('Get my memberships error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to get memberships' }
      });
    }
  }

  static async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!req.user?.roles.includes('admin')) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
      }

      // Prevent self-deletion
      if (req.user.userId === id) {
        return res.status(400).json({ error: { code: 'INVALID_OPERATION', message: 'Cannot delete your own account' } });
      }

      const { force } = req.query;

      // If force=true, delete permanently
      if (force === 'true') {
        const deleted = await UserModel.delete(id);
        if (!deleted) {
          return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
        }
        return res.json({ success: true, message: 'User deleted permanently' });
      }

      // Otherwise, soft delete (move to trash)
      await UserModel.moveToTrash(id);
      res.json({ success: true, message: 'User moved to trash' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete user' } });
    }
  }

  /**
   * Update privacy settings for the current user
   */
  static async updatePrivacySettings(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      const { isPrivate, wardrobe, activity, outfits, marketplace, height, weight, birthDate, gender, telephone } = req.body;

      // Build the privacy settings object
      const privacySettings: any = {};

      if (isPrivate !== undefined) privacySettings.isPrivate = isPrivate;
      if (wardrobe !== undefined) privacySettings.wardrobe = wardrobe;
      if (activity !== undefined) privacySettings.activity = activity;
      if (outfits !== undefined) privacySettings.outfits = outfits;
      if (marketplace !== undefined) privacySettings.marketplace = marketplace;
      if (height !== undefined) privacySettings.height = height;
      if (weight !== undefined) privacySettings.weight = weight;
      if (birthDate !== undefined) privacySettings.birthDate = birthDate;
      if (gender !== undefined) privacySettings.gender = gender;
      if (telephone !== undefined) privacySettings.telephone = telephone;

      const updatedUser = await UserModel.update(req.user.userId, { privacySettings });

      if (!updatedUser) {
        return res.status(404).json({
          error: { code: 'USER_NOT_FOUND', message: 'User not found' }
        });
      }

      res.json({
        success: true,
        message: 'Privacy settings updated',
        privacySettings: updatedUser.privacySettings
      });
    } catch (error) {
      console.error('Update privacy settings error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update privacy settings' }
      });
    }
  }

  /**
   * Get pending follow requests for the current user
   */
  static async getFollowRequests(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      const { page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      const { users, total } = await UserFollowModel.getPendingFollowRequests(
        req.user.userId,
        parseInt(limit as string),
        offset
      );

      res.json({
        success: true,
        requests: users,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string)
        }
      });
    } catch (error) {
      console.error('Get follow requests error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to get follow requests' }
      });
    }
  }

  /**
   * Accept a follow request
   */
  static async acceptFollowRequest(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      const { requesterId } = req.params;

      const success = await UserFollowModel.acceptFollowRequest(requesterId, req.user.userId);

      if (!success) {
        return res.status(404).json({
          error: { code: 'REQUEST_NOT_FOUND', message: 'Follow request not found' }
        });
      }

      res.json({
        success: true,
        message: 'Follow request accepted'
      });
    } catch (error) {
      console.error('Accept follow request error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to accept follow request' }
      });
    }
  }

  /**
   * Decline a follow request
   */
  static async declineFollowRequest(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      const { requesterId } = req.params;

      const success = await UserFollowModel.declineFollowRequest(requesterId, req.user.userId);

      if (!success) {
        return res.status(404).json({
          error: { code: 'REQUEST_NOT_FOUND', message: 'Follow request not found' }
        });
      }

      res.json({
        success: true,
        message: 'Follow request declined'
      });
    } catch (error) {
      console.error('Decline follow request error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to decline follow request' }
      });
    }
  }

  /**
   * Get follow status between current user and target user
   */
  static async getFollowStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      const { userId } = req.params;

      const status = await UserFollowModel.getFollowStatus(req.user.userId, userId);

      res.json({
        success: true,
        status
      });
    } catch (error) {
      console.error('Get follow status error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to get follow status' }
      });
    }
  }

  /**
   * Get pending follow request count for the current user
   */
  static async getFollowRequestCount(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      const count = await UserFollowModel.getPendingFollowRequestCount(req.user.userId);

      res.json({
        success: true,
        count
      });
    } catch (error) {
      console.error('Get follow request count error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to get follow request count' }
      });
    }
  }
}