import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { AuthenticatedRequest } from '../utils/auth';
import { AddressUtils, BrazilianAddress } from '../utils/address';
import { MeasurementUtils } from '../utils/measurements';
import { VUFSItemModel } from '../models/VUFSItem';
import multer from 'multer';
import { LocalStorageService } from '../services/localStorageService';

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

      const { name, bio, socialLinks, roles, username } = req.body;
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
      if (bio !== undefined) {
        updateData.profile = {
          bio,
          updatedAt: new Date().toISOString()
        };
      }
      if (socialLinks) {
        updateData.socialLinks = socialLinks;
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

      // Calculate followers/following (mock for now as Social model isn't imported yet)
      const socialStats = {
        followers: 0,
        following: 0,
        outfitsCreated: 0
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
        bannerImage: null,
        socialLinks: user.socialLinks || [],
        roles: (user as any).roles || [],
        createdAt: user.createdAt,
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
}