import { Request, Response } from 'express';
import { PhotographyGuidanceService } from '../services/photographyGuidanceService';
import { VUFSDomain } from '../types/shared';

export class PhotographyController {
  /**
   * Get photography guidance for specific item type
   */
  static async getGuidance(req: Request, res: Response) {
    try {
      const { domain, itemType } = req.query;

      if (!domain || !itemType) {
        return res.status(400).json({
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'Domain and itemType are required',
          },
        });
      }

      if (!['APPAREL', 'FOOTWEAR'].includes(domain as string)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_DOMAIN',
            message: 'Domain must be APPAREL or FOOTWEAR',
          },
        });
      }

      const guidance = PhotographyGuidanceService.getGuidanceForItem(
        domain as VUFSDomain,
        itemType as string
      );

      res.json({
        guidance,
        estimatedTime: `${Math.ceil(guidance.totalDuration / 60)} minutes`,
      });
    } catch (error) {
      console.error('Get guidance error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching photography guidance',
        },
      });
    }
  }

  /**
   * Get 360-degree photography guidance
   */
  static async get360Guidance(req: Request, res: Response) {
    try {
      const guidance = PhotographyGuidanceService.get360PhotoGuidance();

      res.json({
        guidance,
        totalSteps: guidance.length,
        estimatedTime: `${Math.ceil(guidance.reduce((sum, step) => sum + step.duration, 0) / 60)} minutes`,
        note: '360° photography creates an interactive view of your item',
      });
    } catch (error) {
      console.error('Get 360 guidance error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching 360° photography guidance',
        },
      });
    }
  }

  /**
   * Get photography tips for specific conditions
   */
  static async getTips(req: Request, res: Response) {
    try {
      const { condition } = req.query;

      if (!condition) {
        return res.status(400).json({
          error: {
            code: 'MISSING_CONDITION',
            message: 'Condition parameter is required',
          },
        });
      }

      const validConditions = ['low_light', 'small_space', 'no_tripod', 'mobile_only'];
      if (!validConditions.includes(condition as string)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_CONDITION',
            message: `Condition must be one of: ${validConditions.join(', ')}`,
          },
        });
      }

      const tips = PhotographyGuidanceService.getPhotographyTips(
        condition as 'low_light' | 'small_space' | 'no_tripod' | 'mobile_only'
      );

      res.json({
        condition,
        tips,
        count: tips.length,
      });
    } catch (error) {
      console.error('Get tips error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching photography tips',
        },
      });
    }
  }

  /**
   * Validate photo quality
   */
  static async validatePhoto(req: Request, res: Response) {
    try {
      // This would integrate with actual image analysis
      // For now, return a basic validation response
      const validation = PhotographyGuidanceService.validatePhotoQuality(Buffer.alloc(0));

      res.json({
        validation,
        message: validation.isValid 
          ? 'Photo meets quality standards' 
          : 'Photo needs improvement',
      });
    } catch (error) {
      console.error('Validate photo error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while validating the photo',
        },
      });
    }
  }

  /**
   * Get all available photography guidance categories
   */
  static async getCategories(req: Request, res: Response) {
    try {
      const categories = {
        apparel: {
          domain: 'APPAREL',
          types: [
            'Shirts',
            'Jackets',
            'Pants',
            'Dresses',
            'Tops',
            'Shorts',
            'Sweats',
            'Tank Tops',
            'Accessories',
            'Bags',
            'Jewelry'
          ]
        },
        footwear: {
          domain: 'FOOTWEAR',
          types: [
            'Sneakers',
            'Boots',
            'Dress Shoes',
            'Sandals',
            'Athletic',
            'Casual'
          ]
        },
        specialFeatures: [
          '360° Photography',
          'Detail Shots',
          'Lifestyle Photography',
          'Flat Lay Styling'
        ],
        conditions: [
          {
            name: 'Low Light',
            code: 'low_light',
            description: 'Tips for shooting in poor lighting conditions'
          },
          {
            name: 'Small Space',
            code: 'small_space',
            description: 'Photography guidance for limited space'
          },
          {
            name: 'No Tripod',
            code: 'no_tripod',
            description: 'Handheld photography techniques'
          },
          {
            name: 'Mobile Only',
            code: 'mobile_only',
            description: 'Smartphone photography optimization'
          }
        ]
      };

      res.json({
        categories,
        totalTypes: categories.apparel.types.length + categories.footwear.types.length,
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching categories',
        },
      });
    }
  }

  /**
   * Get quick photography checklist
   */
  static async getQuickChecklist(req: Request, res: Response) {
    try {
      const checklist = {
        beforeShooting: [
          'Clean the item thoroughly',
          'Prepare a clean, neutral background',
          'Ensure good lighting (natural light preferred)',
          'Clean your camera lens',
          'Have your phone/camera ready and charged'
        ],
        duringShoot: [
          'Keep camera steady (use timer if needed)',
          'Take multiple shots from different angles',
          'Ensure the entire item is visible in frame',
          'Check for even lighting and minimal shadows',
          'Review photos immediately and retake if needed'
        ],
        afterShooting: [
          'Select the best, clearest photos',
          'Basic editing: adjust brightness/contrast if needed',
          'Crop to remove excess background',
          'Save in high quality for uploading',
          'Delete blurry or poor quality shots'
        ],
        commonMistakes: [
          'Shooting in poor lighting conditions',
          'Not cleaning the item before photographing',
          'Camera shake causing blurry photos',
          'Cutting off parts of the item in frame',
          'Distracting backgrounds or clutter',
          'Uneven shadows across the item'
        ]
      };

      res.json({
        checklist,
        estimatedTime: '5-15 minutes per item',
        note: 'Good photos significantly improve your item\'s appeal and sales potential',
      });
    } catch (error) {
      console.error('Get quick checklist error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching the checklist',
        },
      });
    }
  }
}