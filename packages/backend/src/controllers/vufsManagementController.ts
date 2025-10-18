import { Request, Response } from 'express';
import { VUFSManagementService } from '../services/vufsManagementService';

export class VUFSManagementController {
  /**
   * Get all VUFS categories
   */
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const { level, parentId } = req.query;
      
      let categories;
      if (level) {
        categories = await VUFSManagementService.getCategoriesByLevel(
          level as 'page' | 'blue' | 'white' | 'gray',
          parentId as string
        );
      } else {
        categories = await VUFSManagementService.getCategories();
      }
      
      res.json({
        message: 'Categories retrieved successfully',
        categories,
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while retrieving categories',
        },
      });
    }
  }

  /**
   * Search categories by name
   */
  static async searchCategories(req: Request, res: Response): Promise<void> {
    try {
      const { q: query } = req.query;
      
      if (!query || typeof query !== 'string') {
        res.status(400).json({
          error: {
            code: 'MISSING_QUERY',
            message: 'Search query is required',
          },
        });
        return;
      }
      
      const categories = await VUFSManagementService.searchCategories(query);
      
      res.json({
        message: 'Category search completed',
        query,
        categories,
      });
    } catch (error) {
      console.error('Search categories error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while searching categories',
        },
      });
    }
  }

  /**
   * Get category path (breadcrumb)
   */
  static async getCategoryPath(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const path = await VUFSManagementService.getCategoryPath(id);
      
      res.json({
        message: 'Category path retrieved successfully',
        categoryId: id,
        path,
      });
    } catch (error) {
      console.error('Get category path error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while retrieving category path',
        },
      });
    }
  }

  /**
   * Get all VUFS brands
   */
  static async getBrands(req: Request, res: Response): Promise<void> {
    try {
      const { type, parentId } = req.query;
      
      let brands;
      if (type) {
        brands = await VUFSManagementService.getBrandsByType(
          type as 'brand' | 'line' | 'collaboration',
          parentId as string
        );
      } else {
        brands = await VUFSManagementService.getBrands();
      }
      
      res.json({
        message: 'Brands retrieved successfully',
        brands,
      });
    } catch (error) {
      console.error('Get brands error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while retrieving brands',
        },
      });
    }
  }

  /**
   * Search brands by name
   */
  static async searchBrands(req: Request, res: Response): Promise<void> {
    try {
      const { q: query } = req.query;
      
      if (!query || typeof query !== 'string') {
        res.status(400).json({
          error: {
            code: 'MISSING_QUERY',
            message: 'Search query is required',
          },
        });
        return;
      }
      
      const brands = await VUFSManagementService.searchBrands(query);
      
      res.json({
        message: 'Brand search completed',
        query,
        brands,
      });
    } catch (error) {
      console.error('Search brands error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while searching brands',
        },
      });
    }
  }

  /**
   * Get brand path (breadcrumb)
   */
  static async getBrandPath(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const path = await VUFSManagementService.getBrandPath(id);
      
      res.json({
        message: 'Brand path retrieved successfully',
        brandId: id,
        path,
      });
    } catch (error) {
      console.error('Get brand path error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while retrieving brand path',
        },
      });
    }
  }

  /**
   * Get all VUFS colors
   */
  static async getColors(req: Request, res: Response): Promise<void> {
    try {
      const colors = await VUFSManagementService.getColors();
      
      res.json({
        message: 'Colors retrieved successfully',
        colors,
      });
    } catch (error) {
      console.error('Get colors error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while retrieving colors',
        },
      });
    }
  }

  /**
   * Get all VUFS materials
   */
  static async getMaterials(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.query;
      
      let materials;
      if (category) {
        materials = await VUFSManagementService.getMaterialsByCategory(
          category as 'natural' | 'synthetic' | 'blend'
        );
      } else {
        materials = await VUFSManagementService.getMaterials();
      }
      
      res.json({
        message: 'Materials retrieved successfully',
        materials,
      });
    } catch (error) {
      console.error('Get materials error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while retrieving materials',
        },
      });
    }
  }

  /**
   * Search materials by name
   */
  static async searchMaterials(req: Request, res: Response): Promise<void> {
    try {
      const { q: query } = req.query;
      
      if (!query || typeof query !== 'string') {
        res.status(400).json({
          error: {
            code: 'MISSING_QUERY',
            message: 'Search query is required',
          },
        });
        return;
      }
      
      const materials = await VUFSManagementService.searchMaterials(query);
      
      res.json({
        message: 'Material search completed',
        query,
        materials,
      });
    } catch (error) {
      console.error('Search materials error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while searching materials',
        },
      });
    }
  }

  /**
   * Get all care instructions
   */
  static async getCareInstructions(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.query;
      
      let instructions;
      if (category) {
        instructions = await VUFSManagementService.getCareInstructionsByCategory(
          category as 'washing' | 'drying' | 'ironing' | 'dry_cleaning' | 'storage'
        );
      } else {
        instructions = await VUFSManagementService.getCareInstructions();
      }
      
      res.json({
        message: 'Care instructions retrieved successfully',
        instructions,
      });
    } catch (error) {
      console.error('Get care instructions error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while retrieving care instructions',
        },
      });
    }
  }

  /**
   * Build category hierarchy helper
   */
  static async buildCategoryHierarchy(req: Request, res: Response): Promise<void> {
    try {
      const { page, blueSubcategory, whiteSubcategory, graySubcategory } = req.body;
      
      const hierarchy = VUFSManagementService.buildCategoryHierarchy(
        page,
        blueSubcategory,
        whiteSubcategory,
        graySubcategory
      );
      
      res.json({
        message: 'Category hierarchy built successfully',
        hierarchy,
      });
    } catch (error) {
      console.error('Build category hierarchy error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while building category hierarchy',
        },
      });
    }
  }

  /**
   * Build brand hierarchy helper
   */
  static async buildBrandHierarchy(req: Request, res: Response): Promise<void> {
    try {
      const { brand, line, collaboration } = req.body;
      
      const hierarchy = VUFSManagementService.buildBrandHierarchy(
        brand,
        line,
        collaboration
      );
      
      res.json({
        message: 'Brand hierarchy built successfully',
        hierarchy,
      });
    } catch (error) {
      console.error('Build brand hierarchy error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while building brand hierarchy',
        },
      });
    }
  }

  /**
   * Build item metadata helper
   */
  static async buildItemMetadata(req: Request, res: Response): Promise<void> {
    try {
      const { composition, colors, careInstructions, acquisitionInfo, pricing } = req.body;
      
      const metadata = VUFSManagementService.buildItemMetadata(
        composition || [],
        colors || [],
        careInstructions || [],
        acquisitionInfo,
        pricing
      );
      
      res.json({
        message: 'Item metadata built successfully',
        metadata,
      });
    } catch (error) {
      console.error('Build item metadata error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while building item metadata',
        },
      });
    }
  }
}