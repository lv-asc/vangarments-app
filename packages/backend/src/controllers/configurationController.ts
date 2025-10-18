import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
import { ConfigurationService } from '../services/configurationService';

export class ConfigurationController {
  /**
   * Get all editable configurations
   */
  static async getConfigurations(req: AuthenticatedRequest, res: Response) {
    try {
      const configurations = await ConfigurationService.getAllConfigurations();
      
      res.json({
        success: true,
        data: configurations,
      });
    } catch (error) {
      console.error('Get configurations error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve configurations',
        },
      });
    }
  }

  /**
   * Get VUFS standards configuration
   */
  static async getVUFSStandards(req: AuthenticatedRequest, res: Response) {
    try {
      const vufsStandards = await ConfigurationService.getVUFSStandards();
      
      res.json({
        success: true,
        data: vufsStandards,
      });
    } catch (error) {
      console.error('Get VUFS standards error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve VUFS standards',
        },
      });
    }
  }

  /**
   * Update VUFS standards
   */
  static async updateVUFSStandards(req: AuthenticatedRequest, res: Response) {
    try {
      const { updates } = req.body;
      
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Updates array is required',
          },
        });
      }

      const result = await ConfigurationService.updateVUFSStandards(updates, req.user!.userId);
      
      res.json({
        success: true,
        data: result,
        message: 'VUFS standards updated successfully',
      });
    } catch (error) {
      console.error('Update VUFS standards error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update VUFS standards',
        },
      });
    }
  }

  /**
   * Add new VUFS category
   */
  static async addVUFSCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const categoryData = req.body;
      
      const result = await ConfigurationService.addVUFSCategory(categoryData, req.user!.userId);
      
      res.json({
        success: true,
        data: result,
        message: 'VUFS category added successfully',
      });
    } catch (error) {
      console.error('Add VUFS category error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add VUFS category',
        },
      });
    }
  }

  /**
   * Add new VUFS brand
   */
  static async addVUFSBrand(req: AuthenticatedRequest, res: Response) {
    try {
      const brandData = req.body;
      
      const result = await ConfigurationService.addVUFSBrand(brandData, req.user!.userId);
      
      res.json({
        success: true,
        data: result,
        message: 'VUFS brand added successfully',
      });
    } catch (error) {
      console.error('Add VUFS brand error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add VUFS brand',
        },
      });
    }
  }

  /**
   * Add new VUFS color
   */
  static async addVUFSColor(req: AuthenticatedRequest, res: Response) {
    try {
      const colorData = req.body;
      
      const result = await ConfigurationService.addVUFSColor(colorData, req.user!.userId);
      
      res.json({
        success: true,
        data: result,
        message: 'VUFS color added successfully',
      });
    } catch (error) {
      console.error('Add VUFS color error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add VUFS color',
        },
      });
    }
  }

  /**
   * Add new VUFS material
   */
  static async addVUFSMaterial(req: AuthenticatedRequest, res: Response) {
    try {
      const materialData = req.body;
      
      const result = await ConfigurationService.addVUFSMaterial(materialData, req.user!.userId);
      
      res.json({
        success: true,
        data: result,
        message: 'VUFS material added successfully',
      });
    } catch (error) {
      console.error('Add VUFS material error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add VUFS material',
        },
      });
    }
  }

  /**
   * Update system settings
   */
  static async updateSystemSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const settings = req.body;
      
      const result = await ConfigurationService.updateSystemSettings(settings, req.user!.userId);
      
      res.json({
        success: true,
        data: result,
        message: 'System settings updated successfully',
      });
    } catch (error) {
      console.error('Update system settings error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update system settings',
        },
      });
    }
  }

  /**
   * Get configuration backup history
   */
  static async getBackupHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const history = await ConfigurationService.getBackupHistory();
      
      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error('Get backup history error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve backup history',
        },
      });
    }
  }

  /**
   * Rollback configuration to a previous version
   */
  static async rollbackConfiguration(req: AuthenticatedRequest, res: Response) {
    try {
      const { backupId } = req.params;
      
      const result = await ConfigurationService.rollbackConfiguration(backupId, req.user!.userId);
      
      res.json({
        success: true,
        data: result,
        message: 'Configuration rolled back successfully',
      });
    } catch (error) {
      console.error('Rollback configuration error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to rollback configuration',
        },
      });
    }
  }

  /**
   * Reload configuration from files
   */
  static async reloadConfiguration(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await ConfigurationService.reloadConfiguration();
      
      res.json({
        success: true,
        data: result,
        message: 'Configuration reloaded successfully',
      });
    } catch (error) {
      console.error('Reload configuration error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reload configuration',
        },
      });
    }
  }
}