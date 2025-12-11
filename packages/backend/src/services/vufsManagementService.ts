import { CategoryHierarchy, BrandHierarchy, ItemMetadata, Material, Color } from '@vangarments/shared';
import { db } from '../database/connection';

export interface VUFSCategoryOption {
  id: string;
  name: string;
  level: 'page' | 'blue' | 'white' | 'gray';
  parentId?: string;
  description?: string;
  isActive: boolean;
}


export interface VUFSBrandOption {
  id: string;
  name: string;
  type: 'brand' | 'line' | 'collaboration';
  parentId?: string;
  description?: string;
  isActive: boolean;
}

export interface VUFSColorOption {
  id: string;
  name: string;
  hex: string;
  undertones: string[];
  isActive: boolean;
}

export interface VUFSMaterialOption {
  id: string;
  name: string;
  category: 'natural' | 'synthetic' | 'blend';
  properties: string[];
  isActive: boolean;
}

export interface VUFSCareInstructionOption {
  id: string;
  instruction: string;
  category: 'washing' | 'drying' | 'ironing' | 'dry_cleaning' | 'storage';
  isActive: boolean;
}

export class VUFSManagementService {
  /**
   * Add a new category
   */
  static async addCategory(
    name: string,
    level: 'page' | 'blue' | 'white' | 'gray',
    parentId?: string
  ): Promise<VUFSCategoryOption> {
    const parentIdVal = parentId ? parseInt(parentId) : null;

    // Determine integer level based on string level
    const levelMap: Record<string, number> = {
      'page': 1,
      'blue': 2,
      'white': 3,
      'gray': 4
    };
    const levelInt = levelMap[level] || 1;

    const query = `
      INSERT INTO vufs_categories (name, level, parent_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await db.query(query, [name, levelInt, parentIdVal]);
    const row = result.rows[0];

    return {
      id: row.id.toString(),
      name: row.name,
      level: level,
      parentId: row.parent_id?.toString(),
      isActive: true
    };
  }



  /**
   * Get categories by level and parent
   */
  static async getCategoriesByLevel(
    level: 'page' | 'blue' | 'white' | 'gray',
    parentId?: string
  ): Promise<VUFSCategoryOption[]> {
    const allCategories = await this.getCategories();
    return allCategories.filter(cat =>
      cat.level === level &&
      (!parentId || cat.parentId === parentId || (['tops', 'bottoms', 'dresses', 'outerwear', 'underwear', 'swimwear', 'accessories', 'shoes'].includes(cat.parentId || '') && !Number.isNaN(parseInt(parentId)))) && // Handle mixed ID types (string vs int) loosely for compatibility
      cat.isActive
    );
  }

  static async updateCategory(id: string, name: string): Promise<VUFSCategoryOption> {
    const query = `
      UPDATE vufs_categories
      SET name = $2
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [id, name]);
    const row = result.rows[0];
    if (!row) throw new Error('Category not found');

    return {
      id: row.id.toString(),
      name: row.name,
      level: row.level === 1 ? 'page' : row.level === 2 ? 'blue' : row.level === 3 ? 'white' : 'gray',
      parentId: row.parent_id?.toString(),
      isActive: row.is_active
    };
  }

  /**
   * Generic Add Item
   */
  private static async addItem(table: string, name: string, extraData: any = {}): Promise<any> {
    const keys = ['name', ...Object.keys(extraData)];
    const values = [name, ...Object.values(extraData)];
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    try {
      const result = await db.query(query, values);
      return { ...result.rows[0], isActive: true };
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw new Error(`Item "${name}" already exists.`);
      }
      throw error;
    }
  }

  /**
   * Generic Update Item
   */
  private static async updateItem(table: string, id: string, name: string): Promise<any> {
    const query = `UPDATE ${table} SET name = $2 WHERE id = $1 RETURNING *`;
    try {
      const result = await db.query(query, [id, name]);
      if (result.rowCount === 0) throw new Error('Item not found');
      return { ...result.rows[0], isActive: true };
    } catch (error: any) {
      if (error.code === '23505') throw new Error(`Item "${name}" already exists.`);
      throw error;
    }
  }

  /**
   * Generic Bulk Add Items
   * Returns count of successfully added items
   */
  static async bulkAddItems(type: string, items: string[]): Promise<{ added: number, duplicates: number, errors: number }> {
    let table = '';
    let extraData: any = {};

    switch (type) {
      case 'category': table = 'vufs_categories'; extraData = { level: 1 }; break; // Defaulting to page level for bulk
      case 'brand': table = 'vufs_brands'; extraData = { type: 'brand' }; break;
      case 'color': table = 'vufs_colors'; break;
      case 'material': table = 'vufs_materials'; extraData = { category: 'natural' }; break;
      case 'pattern': table = 'vufs_patterns'; break;
      case 'fit': table = 'vufs_fits'; break;
      case 'size': table = 'vufs_sizes'; break;
      default: throw new Error('Invalid type for bulk add');
    }

    let added = 0;
    let duplicates = 0;
    let errors = 0;

    for (const item of items) {
      if (!item || !item.trim()) continue;
      try {
        await this.addItem(table, item.trim(), extraData);
        added++;
      } catch (err: any) {
        if (err.message && err.message.includes('already exists')) {
          duplicates++;
        } else {
          errors++;
          console.error(`Failed to bulk add "${item}":`, err);
        }
      }
    }

    return { added, duplicates, errors };
  }

  /**
   * Generic Delete Item
   */
  private static async deleteItem(table: string, id: string): Promise<void> {
    const query = `DELETE FROM ${table} WHERE id = $1`;
    await db.query(query, [id]);
  }

  /**
   * Get all categories (updated to support delete)
   */
  static async getCategories(): Promise<VUFSCategoryOption[]> {
    const query = 'SELECT * FROM vufs_categories ORDER BY level, name';
    const result = await db.query(query);

    const levelMapReverse: Record<number, 'page' | 'blue' | 'white' | 'gray'> = {
      1: 'page', 2: 'blue', 3: 'white', 4: 'gray'
    };

    return result.rows.map((row: any) => ({
      id: row.id.toString(),
      name: row.name,
      level: levelMapReverse[row.level] || 'page',
      parentId: row.parent_id?.toString(),
      isActive: true
    }));
  }

  static async deleteCategory(id: string): Promise<void> {
    await this.deleteItem('vufs_categories', id);
  }

  /**
   * Get all brands from DB
   */
  static async getBrands(): Promise<VUFSBrandOption[]> {
    const query = 'SELECT * FROM vufs_brands ORDER BY name';
    const result = await db.query(query);
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type as any,
      parentId: row.parent_id,
      isActive: row.is_active
    }));
  }

  static async addBrand(name: string, type: string = 'brand', parentId?: string): Promise<VUFSBrandOption> {
    return this.addItem('vufs_brands', name, { type, parent_id: parentId });
  }

  static async deleteBrand(id: string): Promise<void> {
    await this.deleteItem('vufs_brands', id);
  }
  static async updateBrand(id: string, name: string): Promise<any> {
    return this.updateItem('vufs_brands', id, name);
  }

  /**
   * Get all colors from DB
   */
  static async getColors(): Promise<VUFSColorOption[]> {
    const query = 'SELECT * FROM vufs_colors ORDER BY name';
    const result = await db.query(query);
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      hex: row.hex_code || '#000000',
      undertones: [], // Placeholder
      isActive: row.is_active
    }));
  }

  static async addColor(name: string, hex: string = '#000000'): Promise<VUFSColorOption> {
    return this.addItem('vufs_colors', name, { hex_code: hex });
  }

  static async deleteColor(id: string): Promise<void> {
    await this.deleteItem('vufs_colors', id);
  }
  static async updateColor(id: string, name: string): Promise<any> {
    return this.updateItem('vufs_colors', id, name);
  }

  /**
   * Get all materials from DB
   */
  static async getMaterials(): Promise<VUFSMaterialOption[]> {
    const query = 'SELECT * FROM vufs_materials ORDER BY name';
    const result = await db.query(query);
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category as any || 'natural', // Default if null
      properties: [],
      isActive: row.is_active
    }));
  }

  static async addMaterial(name: string, category: string = 'natural'): Promise<VUFSMaterialOption> {
    return this.addItem('vufs_materials', name, { category });
  }

  static async deleteMaterial(id: string): Promise<void> {
    await this.deleteItem('vufs_materials', id);
  }
  static async updateMaterial(id: string, name: string): Promise<any> {
    return this.updateItem('vufs_materials', id, name);
  }





  // --- Category Attribute Matrix ---

  /**
   * Set a value for a specific attribute on a category
   */
  static async setCategoryAttribute(categoryId: string | number, attributeSlug: string, value: string) {
    const query = `
            INSERT INTO vufs_category_attributes (category_id, attribute_slug, value)
            VALUES ($1, $2, $3)
            ON CONFLICT (category_id, attribute_slug)
            DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
    const res = await db.query(query, [categoryId, attributeSlug, value]);
    return res.rows[0];
  }

  /**
   * Get all attributes for a specific category
   */
  static async getCategoryAttributes(categoryId: string | number) {
    const query = `
            SELECT ca.*, at.name as attribute_name 
            FROM vufs_category_attributes ca
            JOIN vufs_attribute_types at ON ca.attribute_slug = at.slug
            WHERE ca.category_id = $1
        `;
    const res = await db.query(query, [categoryId]);
    return res.rows;
  }

  /**
   * Get ALL category attributes (efficiently for the grid view)
   */
  static async getAllCategoryAttributes() {
    const query = `
            SELECT category_id, attribute_slug, value
            FROM vufs_category_attributes
        `;
    const res = await db.query(query);
    return res.rows;
  }

  // --- Brand Attribute Matrix ---

  /**
   * Set a value for a specific attribute on a brand
   */
  static async setBrandAttribute(brandId: string, attributeSlug: string, value: string) {
    const query = `
            INSERT INTO vufs_brand_attributes (brand_id, attribute_slug, value)
            VALUES ($1, $2, $3)
            ON CONFLICT (brand_id, attribute_slug)
            DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
    const res = await db.query(query, [brandId, attributeSlug, value]);
    return res.rows[0];
  }

  /**
   * Get all attributes for a specific brand
   */
  static async getBrandAttributes(brandId: string) {
    const query = `
            SELECT ba.*, at.name as attribute_name 
            FROM vufs_brand_attributes ba
            JOIN vufs_attribute_types at ON ba.attribute_slug = at.slug
            WHERE ba.brand_id = $1
        `;
    const res = await db.query(query, [brandId]);
    return res.rows;
  }

  /**
   * Get ALL brand attributes (efficiently for the grid view)
   */
  static async getAllBrandAttributes() {
    const query = `
            SELECT brand_id, attribute_slug, value
            FROM vufs_brand_attributes
        `;
    const res = await db.query(query);
    return res.rows;
  }

  /**
   * Get materials by category
   */
  static async getMaterialsByCategory(category: 'natural' | 'synthetic' | 'blend'): Promise<VUFSMaterialOption[]> {
    const query = 'SELECT * FROM vufs_materials WHERE category = $1 AND is_active = true ORDER BY name';
    const result = await db.query(query, [category]);
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category as any,
      properties: [],
      isActive: row.is_active
    }));
  }

  /**
   * Get brands by type
   */
  static async getBrandsByType(type: string, parentId?: string): Promise<VUFSBrandOption[]> {
    let query = 'SELECT * FROM vufs_brands WHERE type = $1 AND is_active = true';
    const params: any[] = [type];

    if (parentId) {
      query += ' AND parent_id = $2';
      params.push(parentId);
    }

    query += ' ORDER BY name';

    const result = await db.query(query, params);
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type as any,
      parentId: row.parent_id,
      isActive: row.is_active
    }));
  }

  /**
   * Search methods
   */
  static async searchCategories(query: string): Promise<VUFSCategoryOption[]> {
    const sql = 'SELECT * FROM vufs_categories WHERE name ILIKE $1 AND is_active = true';
    const result = await db.query(sql, [`%${query}%`]);
    // ... mapping logic similar to getCategories
    const levelMapReverse: Record<number, 'page' | 'blue' | 'white' | 'gray'> = {
      1: 'page', 2: 'blue', 3: 'white', 4: 'gray'
    };
    return result.rows.map((row: any) => ({
      id: row.id.toString(),
      name: row.name,
      level: levelMapReverse[row.level] || 'page',
      parentId: row.parent_id?.toString(),
      isActive: true
    }));
  }

  static async searchBrands(query: string): Promise<VUFSBrandOption[]> {
    const sql = 'SELECT * FROM vufs_brands WHERE name ILIKE $1 AND is_active = true';
    const result = await db.query(sql, [`%${query}%`]);
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type as any,
      parentId: row.parent_id,
      isActive: row.is_active
    }));
  }

  static async searchMaterials(query: string): Promise<VUFSMaterialOption[]> {
    const sql = 'SELECT * FROM vufs_materials WHERE name ILIKE $1 AND is_active = true';
    const result = await db.query(sql, [`%${query}%`]);
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category as any,
      properties: [],
      isActive: row.is_active
    }));
  }

  /**
   * Path Helpers (In-memory reconstruction for simplicity)
   */
  static async getCategoryPath(categoryId: string): Promise<VUFSCategoryOption[]> {
    const all = await this.getCategories();
    const path: VUFSCategoryOption[] = [];
    let current = all.find(c => c.id === categoryId);
    while (current) {
      path.unshift(current);
      if (current.parentId) {
        current = all.find(c => c.id === current!.parentId);
      } else {
        break;
      }
    }
    return path;
  }

  static async getBrandPath(brandId: string): Promise<VUFSBrandOption[]> {
    const all = await this.getBrands();
    const path: VUFSBrandOption[] = [];
    let current = all.find(b => b.id === brandId);
    while (current) {
      path.unshift(current);
      if (current.parentId) {
        current = all.find(b => b.id === current!.parentId);
      } else {
        break;
      }
    }
    return path;
  }

  /**
   * Care Instructions (Hardcoded for now)
   */
  static async getCareInstructions(): Promise<VUFSCareInstructionOption[]> {
    return [
      { id: 'machine-wash-cold', instruction: 'Machine wash cold', category: 'washing', isActive: true },
      { id: 'machine-wash-warm', instruction: 'Machine wash warm', category: 'washing', isActive: true },
      { id: 'tumble-dry-low', instruction: 'Tumble dry low', category: 'drying', isActive: true },
      { id: 'iron-low-heat', instruction: 'Iron on low heat', category: 'ironing', isActive: true },
      // ... (abbreviated list for brevity, can expand later if needed)
    ];
  }

  static async getCareInstructionsByCategory(category: string): Promise<VUFSCareInstructionOption[]> {
    const all = await this.getCareInstructions();
    return all.filter(c => c.category === category);
  }

  /**
   * Build Helpers
   */
  static buildCategoryHierarchy(
    page?: string,
    blueSubcategory?: string,
    whiteSubcategory?: string,
    graySubcategory?: string
  ): CategoryHierarchy {
    return {
      page: page || '',
      blueSubcategory: blueSubcategory || '',
      whiteSubcategory: whiteSubcategory || '',
      graySubcategory: graySubcategory || '',
    };
  }

  static buildBrandHierarchy(
    brand?: string,
    line?: string,
    collaboration?: string
  ): BrandHierarchy {
    return {
      brand: brand || '',
      line,
      collaboration,
    };
  }

  static buildItemMetadata(
    composition: Material[],
    colors: Color[],
    careInstructions: string[],
    acquisitionInfo: any = {},
    pricing: any = {}
  ): ItemMetadata {
    return {
      composition,
      colors,
      careInstructions,
      acquisitionInfo,
      pricing,
    };
  }

  /**
   * Get Patterns from DB
   */
  static async getPatterns(): Promise<any[]> {
    const query = 'SELECT * FROM vufs_patterns ORDER BY name';
    const result = await db.query(query);
    return result.rows.map((row: any) => ({ ...row, isActive: row.is_active }));
  }

  static async addPattern(name: string): Promise<any> {
    return this.addItem('vufs_patterns', name);
  }

  static async deletePattern(id: string): Promise<void> {
    await this.deleteItem('vufs_patterns', id);
  }
  static async updatePattern(id: string, name: string): Promise<any> {
    return this.updateItem('vufs_patterns', id, name);
  }

  /**
   * Get Fits from DB
   */
  static async getFits(): Promise<any[]> {
    const query = 'SELECT * FROM vufs_fits ORDER BY name';
    const result = await db.query(query);
    return result.rows.map((row: any) => ({ ...row, isActive: row.is_active }));
  }

  static async addFit(name: string): Promise<any> {
    return this.addItem('vufs_fits', name);
  }

  static async deleteFit(id: string): Promise<void> {
    await this.deleteItem('vufs_fits', id);
  }
  static async updateFit(id: string, name: string): Promise<any> {
    return this.updateItem('vufs_fits', id, name);
  }

  /**
   * Get Sizes from DB
   */
  static async getSizes(): Promise<any[]> {
    const query = 'SELECT * FROM vufs_sizes ORDER BY sort_order ASC, name ASC';
    const result = await db.query(query);
    return result.rows.map((row: any) => ({ ...row, isActive: row.is_active }));
  }

  static async addSize(name: string): Promise<any> {
    return this.addItem('vufs_sizes', name);
  }

  static async deleteSize(id: string): Promise<void> {
    await this.deleteItem('vufs_sizes', id);
  }
  static async updateSize(id: string, name: string): Promise<any> {
    return this.updateItem('vufs_sizes', id, name);
  }

  // --- DYNAMIC ATTRIBUTE MANAGEMENT ---

  static async getAttributeTypes(): Promise<any[]> {
    const query = 'SELECT * FROM vufs_attribute_types ORDER BY name';
    const result = await db.query(query);
    return result.rows.map((row: any) => ({ ...row, isActive: row.is_active }));
  }

  static async addAttributeType(slug: string, name: string): Promise<any> {
    const query = `
      INSERT INTO vufs_attribute_types (slug, name)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const res = await db.query(query, [slug, name]);
    return res.rows[0];
  }

  static async updateAttributeType(slug: string, updates: { name: string }): Promise<any> {
    const query = `
      UPDATE vufs_attribute_types
      SET name = $2
      WHERE slug = $1
      RETURNING *;
    `;
    const res = await db.query(query, [slug, updates.name]);
    return res.rows[0];
  }

  static async deleteAttributeType(slug: string): Promise<void> {
    // Cascade delete handles values, but we can be explicit if needed.
    // Assuming DB cascade is set as per migration.
    const query = 'DELETE FROM vufs_attribute_types WHERE slug = $1';
    await db.query(query, [slug]);
  }

  static async getAttributeValues(typeSlug: string): Promise<any[]> {
    const query = 'SELECT * FROM vufs_attribute_values WHERE type_slug = $1 ORDER BY name';
    const result = await db.query(query, [typeSlug]);
    return result.rows.map((row: any) => ({ ...row, isActive: row.is_active }));
  }

  static async addAttributeValue(typeSlug: string, name: string): Promise<any> {
    // Verify type exists first? Not strictly needed with FK constraint but good for error msg.
    const query = `
      INSERT INTO vufs_attribute_values (type_slug, name)
      VALUES ($1, $2)
      RETURNING *
    `;
    try {
      const result = await db.query(query, [typeSlug, name]);
      return { ...result.rows[0], isActive: true };
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error(`Value "${name}" already exists for this attribute.`);
      }
      throw error;
    }
  }

  static async deleteAttributeValue(id: string): Promise<void> {
    const query = 'DELETE FROM vufs_attribute_values WHERE id = $1';
    await db.query(query, [id]);
  }
  static async updateAttributeValue(id: string, name: string): Promise<any> {
    const query = `
      UPDATE vufs_attribute_values
      SET name = $2
      WHERE id = $1
      RETURNING *;
    `;

    try {
      const result = await db.query(query, [id, name]);
      if (result.rowCount === 0) {
        throw new Error('Attribute value not found');
      }
      return { ...result.rows[0], isActive: true };
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error(`Value "${name}" already exists for this attribute.`);
      }
      throw error;
    }
  }
}