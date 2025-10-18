import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { AuthenticatedRequest } from '../utils/auth';
import { AddressUtils, BrazilianAddress } from '../utils/address';
import { MeasurementUtils } from '../utils/measurements';

export class UserController {
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
        state: addressData.state?.toUpperCase(),
        city: addressData.city,
        neighborhood: addressData.neighborhood,
        cep: cleanCEP,
        street: addressData.street,
        number: addressData.number,
        complement: addressData.complement,
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