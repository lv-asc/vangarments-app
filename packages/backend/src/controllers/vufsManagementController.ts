import { Request, Response } from 'express';
import { VUFSManagementService } from '../services/vufsManagementService';

export class VUFSManagementController {
  /**
   * Global Settings
   */
  static async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await VUFSManagementService.getGlobalSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const { key, value } = req.body;
      if (!key) {
        res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Key is required' } });
        return;
      }
      await VUFSManagementService.updateGlobalSetting(key, value);
      res.json({ message: 'Setting updated' });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  /**
   * Bulk add items
   */
  static async bulkAdd(req: Request, res: Response): Promise<void> {
    try {
      const { type, items, attributeSlug } = req.body;
      if (!type || !items || !Array.isArray(items)) {
        res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Type and items array are required' } });
        return;
      }

      // Map frontend titles/types to internal types
      let normalizedType = type.toLowerCase();
      if (type.includes('Category')) normalizedType = 'category';
      else if (type.includes('Brand')) normalizedType = 'brand';
      else if (type.includes('Color')) normalizedType = 'color';
      else if (type.includes('Material')) normalizedType = 'material';
      else if (type.includes('Pattern')) normalizedType = 'pattern';
      else if (type.includes('Fit')) normalizedType = 'fit';
      else if (type.includes('Size')) normalizedType = 'size';

      const result = await VUFSManagementService.bulkAddItems(normalizedType, items, attributeSlug);
      res.json({ message: 'Bulk add completed', result });
    } catch (error: any) {
      console.error('Bulk add error:', error);
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  /**
   * Add a new category
   */
  static async addCategory(req: Request, res: Response): Promise<void> {
    try {
      const { name, level, parentId } = req.body;

      if (!name || !level) {
        res.status(400).json({
          error: {
            code: 'MISSING_FIELDS',
            message: 'Name and level are required',
          },
        });
        return;
      }

      const category = await VUFSManagementService.addCategory(
        name,
        level as 'page' | 'blue' | 'white' | 'gray',
        parentId
      );

      res.status(201).json({
        message: 'Category created successfully',
        category,
      });
    } catch (error: any) {
      console.error('Add category error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'An error occurred while creating category',
        },
      });
    }
  }

  /**
   * Update category
   */
  static async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, parentId } = req.body;
      if (!name && parentId === undefined) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name or parentId is required' } });
        return;
      }
      const category = await VUFSManagementService.updateCategory(id, name, parentId);
      res.json({ message: 'Category updated successfully', category });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

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
    } catch (error: any) {
      console.error('Get categories error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'An error occurred while retrieving categories',
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

  /**
   * Delete a category
   */
  static async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await VUFSManagementService.deleteCategory(id);
      res.json({ message: 'Category deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  // --- BRAND MANAGEMENT ---

  static async addBrand(req: Request, res: Response): Promise<void> {
    try {
      const { name, type, parentId } = req.body;
      if (!name) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name is required' } });
        return;
      }
      const brand = await VUFSManagementService.addBrand(name, type, parentId);
      res.status(201).json({ message: 'Brand created successfully', brand });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: { code: 'CONFLICT', message: error.message } });
        return;
      }
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async updateBrand(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name is required' } });
        return;
      }
      const brand = await VUFSManagementService.updateBrand(id, name);
      res.json({ message: 'Brand updated successfully', brand });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async deleteBrand(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await VUFSManagementService.deleteBrand(id);
      res.json({ message: 'Brand deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  // --- COLOR MANAGEMENT ---



  static async addColor(req: Request, res: Response): Promise<void> {
    try {
      const { name, hex } = req.body;
      if (!name) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name is required' } });
        return;
      }
      const color = await VUFSManagementService.addColor(name, hex);
      res.status(201).json({ message: 'Color created successfully', color });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: { code: 'CONFLICT', message: error.message } });
        return;
      }
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async updateColor(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name is required' } });
        return;
      }
      const color = await VUFSManagementService.updateColor(id, name);
      res.json({ message: 'Color updated successfully', color });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async deleteColor(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await VUFSManagementService.deleteColor(id);
      res.json({ message: 'Color deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  // --- MATERIAL MANAGEMENT ---

  static async addMaterial(req: Request, res: Response): Promise<void> {
    try {
      const { name, category } = req.body;
      if (!name) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name is required' } });
        return;
      }
      const material = await VUFSManagementService.addMaterial(name, category);
      res.status(201).json({ message: 'Material created successfully', material });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: { code: 'CONFLICT', message: error.message } });
        return;
      }
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async updateMaterial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name is required' } });
        return;
      }
      const material = await VUFSManagementService.updateMaterial(id, name);
      res.json({ message: 'Material updated successfully', material });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async deleteMaterial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await VUFSManagementService.deleteMaterial(id);
      res.json({ message: 'Material deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  // --- PATTERN MANAGEMENT ---

  static async getPatterns(req: Request, res: Response): Promise<void> {
    try {
      const patterns = await VUFSManagementService.getPatterns();
      res.json({ message: 'Patterns retrieved successfully', patterns });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async addPattern(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name is required' } });
        return;
      }
      const pattern = await VUFSManagementService.addPattern(name);
      res.status(201).json({ message: 'Pattern created successfully', pattern });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: { code: 'CONFLICT', message: error.message } });
        return;
      }
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async updatePattern(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name is required' } });
        return;
      }
      const pattern = await VUFSManagementService.updatePattern(id, name);
      res.json({ message: 'Pattern updated successfully', pattern });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async deletePattern(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await VUFSManagementService.deletePattern(id);
      res.json({ message: 'Pattern deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  // --- FIT MANAGEMENT ---

  static async getFits(req: Request, res: Response): Promise<void> {
    try {
      const fits = await VUFSManagementService.getFits();
      res.json({ message: 'Fits retrieved successfully', fits });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async addFit(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name is required' } });
        return;
      }
      const fit = await VUFSManagementService.addFit(name);
      res.status(201).json({ message: 'Fit created successfully', fit });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: { code: 'CONFLICT', message: error.message } });
        return;
      }
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async updateFit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name is required' } });
        return;
      }
      const fit = await VUFSManagementService.updateFit(id, name);
      res.json({ message: 'Fit updated successfully', fit });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async deleteFit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await VUFSManagementService.deleteFit(id);
      res.json({ message: 'Fit deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  // --- SIZE MANAGEMENT ---

  static async getSizes(req: Request, res: Response): Promise<void> {
    try {
      const sizes = await VUFSManagementService.getSizes();
      res.json({ message: 'Sizes retrieved successfully', sizes });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async addSize(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name is required' } });
        return;
      }
      const size = await VUFSManagementService.addSize(name);
      res.status(201).json({ message: 'Size created successfully', size });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: { code: 'CONFLICT', message: error.message } });
        return;
      }
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async updateSize(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name is required' } });
        return;
      }
      const size = await VUFSManagementService.updateSize(id, name);
      res.json({ message: 'Size updated successfully', size });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: { code: 'CONFLICT', message: error.message } });
        return;
      }
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async deleteSize(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await VUFSManagementService.deleteSize(id);
      res.json({ message: 'Size deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  // --- STANDARDS MANAGEMENT ---

  static async getStandards(req: Request, res: Response): Promise<void> {
    try {
      const standards = await VUFSManagementService.getStandards();
      res.json({ message: 'Standards retrieved successfully', standards });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async addStandard(req: Request, res: Response): Promise<void> {
    try {
      const { name, label, region, category, approach, description } = req.body;
      if (!name || !label) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name and Label are required' } });
        return;
      }
      // Note: region, category, approach, description are optional in schema but good to provide
      const standard = await VUFSManagementService.addStandard({ name, label, region, category, approach, description });
      res.status(201).json({ message: 'Standard created successfully', standard });
    } catch (error: any) {
      if (error.message.includes('unique constraint')) {
        res.status(409).json({ error: { code: 'CONFLICT', message: 'Standard with this name already exists' } });
        return;
      }
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async updateStandard(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, label, region, category, approach, description } = req.body;
      // We allow updating metadata even if name/label stays same
      const standard = await VUFSManagementService.updateStandard(id, { name, label, region, category, approach, description });
      res.json({ message: 'Standard updated successfully', standard });
    } catch (error: any) {
      if (error.message === 'Standard not found') {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Standard not found' } });
        return;
      }
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async deleteStandard(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await VUFSManagementService.deleteStandard(id);
      res.json({ message: 'Standard deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  // --- DYNAMIC ATTRIBUTE MANAGEMENT ---

  static async getAttributeTypes(req: Request, res: Response): Promise<void> {
    try {
      const types = await VUFSManagementService.getAttributeTypes();
      res.json({ message: 'Attribute types retrieved successfully', types });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async addAttributeType(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name is required' } });
        return;
      }
      // Auto-generate slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const type = await VUFSManagementService.addAttributeType(slug, name);
      res.status(201).json({ message: 'Attribute type created successfully', type });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: { code: 'CONFLICT', message: error.message } });
        return;
      }
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async updateAttributeType(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name is required' } });
        return;
      }
      const type = await VUFSManagementService.updateAttributeType(slug, { name });
      res.json({ message: 'Attribute type updated successfully', type });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async deleteAttributeType(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      await VUFSManagementService.deleteAttributeType(slug);
      res.json({ message: 'Attribute type deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async getAttributeValues(req: Request, res: Response): Promise<void> {
    try {
      const { typeSlug } = req.params;
      const values = await VUFSManagementService.getAttributeValues(typeSlug);
      res.json({ message: 'Attribute values retrieved successfully', values });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async addAttributeValue(req: Request, res: Response): Promise<void> {
    try {
      const { typeSlug } = req.params;
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name is required' } });
        return;
      }
      const value = await VUFSManagementService.addAttributeValue(typeSlug, name);
      res.status(201).json({ message: 'Attribute value created successfully', value });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: { code: 'CONFLICT', message: error.message } });
        return;
      }
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async deleteAttributeValue(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // Using ID for values
      await VUFSManagementService.deleteAttributeValue(id);
      res.json({ message: 'Attribute value deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async updateAttributeValue(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Name is required' } });
        return;
      }
      const value = await VUFSManagementService.updateAttributeValue(id, name);
      res.json({ message: 'Attribute value updated successfully', value });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: { code: 'CONFLICT', message: error.message } });
        return;
      }
      if (error.message === 'Attribute value not found') {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: error.message } });
        return;
      }
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  // --- Matrix View Endpoints ---

  static async getAllCategoryAttributes(req: Request, res: Response) {
    try {
      const attrs = await VUFSManagementService.getAllCategoryAttributes();
      res.json({ attributes: attrs });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async setCategoryAttribute(req: Request, res: Response) {
    try {
      const { categoryId, attributeSlug, value } = req.body;
      if (!categoryId || !attributeSlug) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Missing categoryId or attributeSlug' } });
        return;
      }
      const result = await VUFSManagementService.setCategoryAttribute(categoryId, attributeSlug, value);
      res.json({ success: true, attribute: result });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async getAllBrandAttributes(req: Request, res: Response) {
    try {
      const attrs = await VUFSManagementService.getAllBrandAttributes();
      res.json({ attributes: attrs });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async setBrandAttribute(req: Request, res: Response) {
    try {
      const { brandId, attributeSlug, value } = req.body;
      if (!brandId || !attributeSlug) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Missing brandId or attributeSlug' } });
        return;
      }
      const result = await VUFSManagementService.setBrandAttribute(brandId, attributeSlug, value);
      res.json({ success: true, attribute: result });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }
  static async getAllSizeAttributes(req: Request, res: Response) {
    try {
      const attrs = await VUFSManagementService.getAllSizeAttributes();
      res.json({ attributes: attrs });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }

  static async setSizeAttribute(req: Request, res: Response) {
    try {
      const { sizeId, attributeSlug, value } = req.body;
      if (!sizeId || !attributeSlug) {
        res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Missing sizeId or attributeSlug' } });
        return;
      }
      const result = await VUFSManagementService.setSizeAttribute(sizeId, attributeSlug, value);
      res.json({ success: true, attribute: result });
    } catch (error: any) {
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: error.message } });
    }
  }
}