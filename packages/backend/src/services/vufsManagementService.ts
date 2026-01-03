import { CategoryHierarchy, BrandHierarchy, ItemMetadata, Material, Color } from '@vangarments/shared';
import { db } from '../database/connection';

export interface VUFSCategoryOption {
  id: string;
  name: string;
  level: 'subcategory1' | 'subcategory2' | 'apparel' | 'page' | 'blue' | 'white' | 'gray';
  parentId?: string;
  description?: string;
  isActive: boolean;
  skuRef?: string;
}


export interface VUFSBrandOption {
  id: string;
  name: string;
  type: 'brand' | 'line' | 'collaboration';
  parentId?: string;
  description?: string;
  isActive: boolean;
  skuRef?: string;
  logo?: string;
}

export interface VUFSColorOption {
  id: string;
  name: string;
  hex: string;
  undertones: string[];
  isActive: boolean;
  skuRef?: string;
}

export interface VUFSMaterialOption {
  id: string;
  name: string;
  category: 'natural' | 'synthetic' | 'blend';
  properties: string[];
  compositions?: VUFSMaterialComposition[];
  isActive: boolean;
  skuRef?: string;
}

export interface VUFSCareInstructionOption {
  id: string;
  instruction: string;
  category: 'washing' | 'drying' | 'ironing' | 'dry_cleaning' | 'storage';
  isActive: boolean;
}

export interface VUFSCompositionCategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isDeleted: boolean;
}

export interface VUFSComposition {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  description?: string;
  isActive: boolean;
  isDeleted: boolean;
}

export interface VUFSMaterialComposition {
  materialId: string;
  compositionId: string;
  compositionName: string;
  percentage: number;
}

export interface VUFSPatternGroup {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  subcategories?: VUFSPatternSubcategory[];
  patterns?: VUFSPattern[];
}

export interface VUFSPatternSubcategory {
  id: string;
  groupId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  patterns?: VUFSPattern[];
}

export interface VUFSPattern {
  id: string;
  name: string;
  description?: string;
  skuRef?: string;
  groupId?: string;
  subcategoryId?: string;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
}

export class VUFSManagementService {
  /**
   * Global Settings (Aliases & Visibility)
   */
  static async getGlobalSettings(): Promise<Record<string, any>> {
    const result = await db.query('SELECT key, value FROM vufs_global_settings');
    const settings: Record<string, any> = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings;
  }

  static async updateGlobalSetting(key: string, value: any): Promise<void> {
    await db.query(
      `INSERT INTO vufs_global_settings (key, value)
       VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
      [key, JSON.stringify(value)]
    );
  }

  /**
   * Add a new category
   */
  static async addCategory(
    name: string,
    level: 'page' | 'blue' | 'white' | 'gray',
    parentId?: string,
    skuRef?: string
  ): Promise<VUFSCategoryOption> {
    // We use 'apparel' type_slug to match getCategories filter
    const result = await this.addAttributeValue('apparel', name, parentId, { skuRef });
    return {
      id: result.id,
      name: result.name,
      level: 'apparel',
      parentId: result.parentId,
      isActive: true,
      skuRef: result.skuRef
    };
  }



  /**
   * Get categories by level and parent
   */
  static async getCategoriesByLevel(
    level: 'subcategory1' | 'subcategory2' | 'apparel' | 'page' | 'blue' | 'white' | 'gray',
    parentId?: string
  ): Promise<VUFSCategoryOption[]> {
    const allCategories = await this.getCategories();
    return allCategories.filter(cat =>
      cat.level === level &&
      (!parentId || cat.parentId === parentId || (['tops', 'bottoms', 'dresses', 'outerwear', 'underwear', 'swimwear', 'accessories', 'shoes'].includes(cat.parentId || '') && !Number.isNaN(parseInt(parentId)))) && // Handle mixed ID types (string vs int) loosely for compatibility
      cat.isActive
    );
  }

  static async updateCategory(id: string, name?: string, parentId?: string | null, skuRef?: string): Promise<VUFSCategoryOption> {
    const result = await this.updateAttributeValue(id, { name, parentId, skuRef });
    return {
      id: result.id,
      name: result.name,
      level: 'apparel', // Default/Presumed
      parentId: result.parentId,
      isActive: true,
      skuRef: result.skuRef
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
   * Helper to parse attribute values that could be JSON arrays or comma-separated strings
   */
  private static parseAttributeValue(value: string): string[] {
    if (!value) return [];
    const trimmed = value.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(v => String(v));
      } catch (e) {
        // Fallback to comma split if JSON parse fails
      }
    }
    return trimmed.split(',').map(v => v.trim()).filter(Boolean);
  }

  /**
   * Generic Update Item
   */
  private static async updateItem(table: string, id: string, name: string, extraUpdates: Record<string, any> = {}): Promise<any> {
    const setParts = ['name = $2'];
    const values = [id, name];
    let paramCount = 2;

    for (const [key, value] of Object.entries(extraUpdates)) {
      paramCount++;
      setParts.push(`${key} = $${paramCount}`);
      values.push(value);
    }

    const query = `UPDATE ${table} SET ${setParts.join(', ')} WHERE id = $1 RETURNING *`;
    try {
      const result = await db.query(query, values);
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
  static async bulkAddItems(type: string, items: string[], attributeSlug?: string): Promise<{ added: number, duplicates: number, errors: number }> {
    let table = '';
    let extraData: any = {};
    let isAttribute = false;

    // Check if it's a standard type
    switch (type.toLowerCase()) {
      case 'category': case 'style / category': table = 'vufs_categories'; extraData = { level: 1 }; break;
      case 'brand': table = 'vufs_brands'; extraData = { type: 'brand' }; break;
      case 'color': table = 'vufs_colors'; break;
      case 'material': table = 'vufs_materials'; extraData = { category: 'natural' }; break;
      case 'pattern': table = 'vufs_patterns'; break;
      case 'fit': table = 'vufs_fits'; break;
      case 'size': table = 'vufs_sizes'; break;
      case 'gender': table = 'vufs_genders'; break;
      default:
        // If attributeSlug is provided, we assume it's a custom attribute
        if (attributeSlug) {
          isAttribute = true;
        } else {
          // It might be that 'type' IS the slug if we passed it that way, but let's rely on explicit attributeSlug arg for clarity
          throw new Error(`Invalid type for bulk add: ${type}`);
        }
    }

    let added = 0;
    let duplicates = 0;
    let errors = 0;

    for (const item of items) {
      if (!item || !item.trim()) continue;
      try {
        if (isAttribute && attributeSlug) {
          await this.addAttributeValue(attributeSlug, item.trim());
        } else {
          await this.addItem(table, item.trim(), extraData);
        }
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
   * Get all categories from vufs_attribute_values (unified data source)
   * This reads from the same table as admin/categories for consistency
   */
  static async getCategories(includeDeleted: boolean = false): Promise<VUFSCategoryOption[]> {
    // Read from vufs_attribute_values where type_slug = 'apparel' (unified source)
    const query = `
      SELECT id, name, type_slug, parent_id, sort_order, sku_ref 
      FROM vufs_attribute_values 
      WHERE type_slug = 'apparel' 
      ORDER BY sort_order ASC, name ASC
    `;
    const result = await db.query(query);

    return result.rows.map((row: any) => ({
      id: row.id.toString(),
      name: row.name,
      level: 'apparel' as const,
      parentId: row.parent_id?.toString(),
      skuRef: row.sku_ref,
      isActive: true,
      isDeleted: false,
      deletedAt: null
    }));
  }

  /**
   * Get only deleted categories (for trash view)
   */
  static async getDeletedCategories(): Promise<VUFSCategoryOption[]> {
    const query = 'SELECT * FROM vufs_categories WHERE is_deleted = true ORDER BY deleted_at DESC';
    const result = await db.query(query);

    const levelMapReverse: Record<number, 'subcategory1' | 'subcategory2' | 'apparel' | 'gray'> = {
      1: 'subcategory1', 2: 'subcategory2', 3: 'apparel', 4: 'gray'
    };

    return result.rows.map((row: any) => ({
      id: row.id.toString(),
      name: row.name,
      level: levelMapReverse[row.level] || 'page',
      parentId: row.parent_id?.toString(),
      isActive: false,
      isDeleted: true,
      deletedAt: row.deleted_at
    }));
  }

  /**
   * Soft delete a category (move to trash)
   */
  static async deleteCategory(id: string): Promise<void> {
    // Categories are now stored in vufs_attribute_values (unified source)
    // So we use the generic delete method
    await this.deleteAttributeValue(id);
  }

  /**
   * Restore a category from trash
   */
  static async restoreCategory(id: string): Promise<void> {
    // Restore by clearing the is_deleted flag
    await db.query('UPDATE vufs_categories SET is_deleted = false, deleted_at = NULL WHERE id = $1', [id]);
    // Note: Children remain deleted - user needs to restore them individually if desired
  }

  /**
   * Permanently delete a category (hard delete from trash)
   */
  static async permanentlyDeleteCategory(id: string): Promise<void> {
    // Recursively delete children first to satisfy foreign key constraints
    const childrenResult = await db.query('SELECT id FROM vufs_categories WHERE parent_id = $1', [id]);
    for (const row of childrenResult.rows) {
      await this.permanentlyDeleteCategory(row.id.toString());
    }
    await this.deleteItem('vufs_categories', id);
  }

  /**
   * Get all brands from DB with logo information from brand_accounts
   */
  static async getBrands(): Promise<VUFSBrandOption[]> {
    const query = `
      SELECT vb.*, ba.brand_info->>'logo' as logo
      FROM vufs_brands vb
      LEFT JOIN brand_accounts ba ON ba.brand_info->>'name' = vb.name
      ORDER BY vb.name
    `;
    const result = await db.query(query);
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type as any,
      parentId: row.parent_id,
      isActive: row.is_active,
      logo: row.logo || undefined
    }));
  }

  static async addBrand(name: string, type: string = 'brand', parentId?: string, skuRef?: string): Promise<VUFSBrandOption> {
    return this.addItem('vufs_brands', name, { type, parent_id: parentId, sku_ref: skuRef });
  }

  static async deleteBrand(id: string): Promise<void> {
    await this.deleteItem('vufs_brands', id);
  }
  static async updateBrand(id: string, name: string, skuRef?: string): Promise<any> {
    return this.updateItem('vufs_brands', id, name, skuRef ? { sku_ref: skuRef } : {});
  }

  /**
   * Get all colors from DB
   */
  static async getColors(): Promise<VUFSColorOption[]> {
    const query = 'SELECT * FROM vufs_colors WHERE is_active = true ORDER BY name';
    const result = await db.query(query);
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      hex: row.hex_code || '#000000',
      undertones: [], // Placeholder
      skuRef: row.sku_ref,
      isActive: row.is_active
    }));
  }

  static async addColor(name: string, hex: string = '#000000', skuRef?: string): Promise<VUFSColorOption> {
    return this.addItem('vufs_colors', name, { hex_code: hex, sku_ref: skuRef });
  }

  static async deleteColor(id: string): Promise<void> {
    await this.deleteItem('vufs_colors', id);
  }
  static async updateColor(id: string, name: string, skuRef?: string): Promise<any> {
    return this.updateItem('vufs_colors', id, name, skuRef ? { sku_ref: skuRef } : {});
  }

  /**
   * Get all materials from DB
   */
  static async getMaterials(): Promise<VUFSMaterialOption[]> {
    const query = `
      SELECT m.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'compositionId', c.id, 
                   'compositionName', c.name, 
                   'percentage', mc.percentage
                 )
               ) FILTER (WHERE mc.composition_id IS NOT NULL), 
               '[]'
             ) as compositions
      FROM vufs_materials m
      LEFT JOIN vufs_material_compositions mc ON m.id = mc.material_id
      LEFT JOIN vufs_compositions c ON mc.composition_id = c.id
      WHERE m.is_active = true AND (m.is_deleted = false OR m.is_deleted IS NULL)
      GROUP BY m.id
      ORDER BY m.name`;

    const result = await db.query(query);
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category as any || 'natural',
      properties: [],
      compositions: row.compositions.map((c: any) => ({
        ...c,
        materialId: row.id // ensure materialId is present in interface if needed, or mapped correctly
      })),
      isActive: row.is_active,
      skuRef: row.sku_ref,
      isDeleted: row.is_deleted || false
    }));
  }

  static async getDeletedMaterials(): Promise<any[]> {
    const query = 'SELECT * FROM vufs_materials WHERE is_deleted = true ORDER BY deleted_at DESC';
    const result = await db.query(query);
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category as any || 'natural',
      isActive: row.is_active,
      skuRef: row.sku_ref,
      isDeleted: true,
      deletedAt: row.deleted_at
    }));
  }

  static async addMaterial(name: string, category: string = 'natural', skuRef?: string): Promise<VUFSMaterialOption> {
    return this.addItem('vufs_materials', name, { category, sku_ref: skuRef });
  }

  static async deleteMaterial(id: string): Promise<void> {
    await db.query('UPDATE vufs_materials SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  }

  static async restoreMaterial(id: string): Promise<void> {
    await db.query('UPDATE vufs_materials SET is_deleted = false, deleted_at = NULL WHERE id = $1', [id]);
  }

  static async permanentlyDeleteMaterial(id: string): Promise<void> {
    await this.deleteItem('vufs_materials', id);
  }

  static async updateMaterial(id: string, name: string, skuRef?: string): Promise<any> {
    return this.updateItem('vufs_materials', id, name, skuRef ? { sku_ref: skuRef } : {});
  }







  // --- COMPOSITION MANAGEMENT ---

  static async getCompositionCategories(includeDeleted: boolean = false): Promise<VUFSCompositionCategory[]> {
    const query = `SELECT * FROM vufs_composition_categories ${includeDeleted ? '' : 'WHERE is_deleted = false'} ORDER BY name`;
    const result = await db.query(query);
    return result.rows.map((row: any) => ({
      id: row.id.toString(),
      name: row.name,
      description: row.description,
      isActive: row.is_active,
      isDeleted: row.is_deleted
    }));
  }

  static async addCompositionCategory(name: string, description: string = ''): Promise<VUFSCompositionCategory> {
    return this.addItem('vufs_composition_categories', name, { description });
  }

  static async updateCompositionCategory(id: string, name: string, description?: string): Promise<any> {
    return this.updateItem('vufs_composition_categories', id, name, description !== undefined ? { description } : {});
  }

  static async deleteCompositionCategory(id: string): Promise<void> {
    await db.query('UPDATE vufs_composition_categories SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  }

  static async restoreCompositionCategory(id: string): Promise<void> {
    await db.query('UPDATE vufs_composition_categories SET is_deleted = false, deleted_at = NULL WHERE id = $1', [id]);
  }

  static async getCompositions(includeDeleted: boolean = false): Promise<VUFSComposition[]> {
    const query = `
      SELECT c.*, cat.name as category_name 
      FROM vufs_compositions c 
      LEFT JOIN vufs_composition_categories cat ON c.category_id = cat.id 
      ${includeDeleted ? '' : 'WHERE c.is_deleted = false'} 
      ORDER BY c.name`;
    const result = await db.query(query);
    return result.rows.map((row: any) => ({
      id: row.id.toString(),
      name: row.name,
      categoryId: row.category_id?.toString(),
      categoryName: row.category_name,
      description: row.description,
      isActive: row.is_active,
      isDeleted: row.is_deleted
    }));
  }

  static async addComposition(name: string, categoryId: string, description: string = ''): Promise<VUFSComposition> {
    return this.addItem('vufs_compositions', name, { category_id: categoryId, description });
  }

  static async updateComposition(id: string, name: string, categoryId?: string, description?: string): Promise<any> {
    const updates: any = {};
    if (categoryId !== undefined) updates.category_id = categoryId;
    if (description !== undefined) updates.description = description;
    return this.updateItem('vufs_compositions', id, name, updates);
  }

  static async deleteComposition(id: string): Promise<void> {
    await db.query('UPDATE vufs_compositions SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  }

  static async restoreComposition(id: string): Promise<void> {
    await db.query('UPDATE vufs_compositions SET is_deleted = false, deleted_at = NULL WHERE id = $1', [id]);
  }

  /**
   * Get compositions for a material
   */
  static async getMaterialCompositions(materialId: string): Promise<VUFSMaterialComposition[]> {
    const query = `
      SELECT mc.*, c.name as composition_name 
      FROM vufs_material_compositions mc 
      JOIN vufs_compositions c ON mc.composition_id = c.id 
      WHERE mc.material_id = $1
    `;
    const result = await db.query(query, [materialId]);
    return result.rows.map((row: any) => ({
      materialId: row.material_id.toString(),
      compositionId: row.composition_id.toString(),
      compositionName: row.composition_name,
      percentage: parseFloat(row.percentage)
    }));
  }

  /**
   * Update compositions for a material (Full replace)
   */
  static async updateMaterialCompositions(materialId: string, compositions: { compositionId: string, percentage: number }[]): Promise<void> {
    await db.transaction(async (client) => {
      // 1. Delete existing
      await client.query('DELETE FROM vufs_material_compositions WHERE material_id = $1', [materialId]);

      // 2. Insert new
      if (compositions.length > 0) {
        const values: any[] = [];
        const placeholders: string[] = [];
        let pIndex = 1;

        compositions.forEach(comp => {
          placeholders.push(`($${pIndex}, $${pIndex + 1}, $${pIndex + 2})`);
          values.push(materialId, comp.compositionId, comp.percentage);
          pIndex += 3;
        });

        const query = `
          INSERT INTO vufs_material_compositions (material_id, composition_id, percentage)
          VALUES ${placeholders.join(', ')}
        `;
        await client.query(query, values);
      }
    });
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

  // --- Size Attribute Matrix ---

  /**
   * Set a value for a specific attribute on a size
   */
  static async setSizeAttribute(sizeId: string, attributeSlug: string, value: string) {
    const query = `
            INSERT INTO vufs_size_attributes (size_id, attribute_slug, value)
            VALUES ($1, $2, $3)
            ON CONFLICT (size_id, attribute_slug)
            DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
    const res = await db.query(query, [sizeId, attributeSlug, value]);
    return res.rows[0];
  }

  /**
   * Get all attributes for a specific size
   */
  static async getSizeAttributes(sizeId: string) {
    const query = `
            SELECT sa.*, at.name as attribute_name 
            FROM vufs_size_attributes sa
            JOIN vufs_attribute_types at ON sa.attribute_slug = at.slug
            WHERE sa.size_id = $1
        `;
    const res = await db.query(query, [sizeId]);
    return res.rows;
  }

  /**
   * Get ALL size attributes (efficiently for the grid view)
   */
  static async getAllSizeAttributes() {
    const query = `
            SELECT size_id, attribute_slug, value
            FROM vufs_size_attributes
        `;
    const res = await db.query(query);
    return res.rows;
  }

  /**
   * Get materials by category
   */
  static async getMaterialsByCategory(category: string): Promise<VUFSMaterialOption[]> {
    const query = `
      SELECT m.*, 
             json_agg(
                 json_build_object(
                     'compositionId', c.id, 
                     'compositionName', c.name,
                     'percentage', mc.percentage
                 )
             ) FILTER (WHERE c.id IS NOT NULL) as compositions
      FROM vufs_materials m
      LEFT JOIN vufs_material_compositions mc ON m.id = mc.material_id
      LEFT JOIN vufs_compositions c ON mc.composition_id = c.id
      WHERE m.category = $1 AND m.is_active = true AND m.is_deleted = false
      GROUP BY m.id
      ORDER BY m.name
    `;
    const result = await db.query(query, [category]);
    return result.rows.map((row: any) => ({
      id: row.id.toString(),
      name: row.name,
      category: row.category,
      properties: [],
      compositions: row.compositions || [],
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
    const levelMapReverse: Record<number, 'subcategory1' | 'subcategory2' | 'apparel' | 'gray'> = {
      1: 'subcategory1', 2: 'subcategory2', 3: 'apparel', 4: 'gray'
    };
    return result.rows.map((row: any) => ({
      id: row.id.toString(),
      name: row.name,
      level: levelMapReverse[row.level] || 'subcategory1',
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
    const sql = `
      SELECT m.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'compositionId', c.id, 
                   'compositionName', c.name, 
                   'percentage', mc.percentage
                 )
               ) FILTER (WHERE mc.composition_id IS NOT NULL), 
               '[]'
             ) as compositions
      FROM vufs_materials m
      LEFT JOIN vufs_material_compositions mc ON m.id = mc.material_id
      LEFT JOIN vufs_compositions c ON mc.composition_id = c.id
      WHERE m.name ILIKE $1 AND m.is_active = true
      GROUP BY m.id
    `;
    const result = await db.query(sql, [`%${query}%`]);
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category as any,
      properties: [],
      compositions: row.compositions.map((c: any) => ({ ...c, materialId: row.id })),
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
   * Get Patterns from DB (excluding deleted)
   */
  static async getPatterns(): Promise<VUFSPattern[]> {
    const query = 'SELECT * FROM vufs_patterns WHERE is_active = true AND (is_deleted = false OR is_deleted IS NULL) ORDER BY name';
    const result = await db.query(query);
    return result.rows.map((row: any) => ({
      id: row.id.toString(),
      name: row.name,
      description: row.description,
      skuRef: row.sku_ref,
      groupId: row.group_id?.toString(),
      subcategoryId: row.subcategory_id?.toString(),
      isActive: row.is_active,
      isDeleted: row.is_deleted || false
    }));
  }

  /**
   * Get deleted Patterns (trash)
   */
  static async getDeletedPatterns(): Promise<any[]> {
    const query = 'SELECT * FROM vufs_patterns WHERE is_deleted = true ORDER BY deleted_at DESC';
    const result = await db.query(query);
    return result.rows.map((row: any) => ({ ...row, isActive: row.is_active, skuRef: row.sku_ref, isDeleted: true, deletedAt: row.deleted_at }));
  }

  static async addPattern(
    name: string,
    skuRef?: string,
    groupId?: string,
    subcategoryId?: string,
    description?: string
  ): Promise<VUFSPattern> {
    const query = `
      INSERT INTO vufs_patterns (name, sku_ref, group_id, subcategory_id, description, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `;
    const result = await db.query(query, [
      name,
      skuRef || null,
      groupId ? parseInt(groupId) : null,
      subcategoryId ? parseInt(subcategoryId) : null,
      description || null
    ]);
    const row = result.rows[0];
    return {
      id: row.id.toString(),
      name: row.name,
      description: row.description,
      skuRef: row.sku_ref,
      groupId: row.group_id?.toString(),
      subcategoryId: row.subcategory_id?.toString(),
      isActive: row.is_active,
      isDeleted: false
    };
  }

  /**
   * Soft delete a pattern (move to trash)
   */
  static async deletePattern(id: string): Promise<void> {
    await db.query('UPDATE vufs_patterns SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  }

  /**
   * Restore a pattern from trash
   */
  static async restorePattern(id: string): Promise<void> {
    await db.query('UPDATE vufs_patterns SET is_deleted = false, deleted_at = NULL WHERE id = $1', [id]);
  }

  /**
   * Permanently delete a pattern
   */
  static async permanentlyDeletePattern(id: string): Promise<void> {
    await this.deleteItem('vufs_patterns', id);
  }

  static async updatePattern(
    id: string,
    updates: { name?: string; skuRef?: string; groupId?: string | null; subcategoryId?: string | null; description?: string }
  ): Promise<VUFSPattern> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIdx++}`);
      values.push(updates.name);
    }
    if (updates.skuRef !== undefined) {
      fields.push(`sku_ref = $${paramIdx++}`);
      values.push(updates.skuRef || null);
    }
    if (updates.groupId !== undefined) {
      fields.push(`group_id = $${paramIdx++}`);
      values.push(updates.groupId ? parseInt(updates.groupId) : null);
    }
    if (updates.subcategoryId !== undefined) {
      fields.push(`subcategory_id = $${paramIdx++}`);
      values.push(updates.subcategoryId ? parseInt(updates.subcategoryId) : null);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIdx++}`);
      values.push(updates.description || null);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `
      UPDATE vufs_patterns 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${paramIdx}
      RETURNING *
    `;
    const result = await db.query(query, values);
    const row = result.rows[0];
    return {
      id: row.id.toString(),
      name: row.name,
      description: row.description,
      skuRef: row.sku_ref,
      groupId: row.group_id?.toString(),
      subcategoryId: row.subcategory_id?.toString(),
      isActive: row.is_active,
      isDeleted: row.is_deleted || false
    };
  }

  // ==========================================
  // PATTERN GROUPS MANAGEMENT
  // ==========================================

  /**
   * Get all pattern groups with their subcategories and patterns
   */
  static async getPatternGroups(): Promise<VUFSPatternGroup[]> {
    const groupsQuery = `
      SELECT * FROM vufs_pattern_groups 
      WHERE is_active = true 
      ORDER BY sort_order
    `;
    const subcatsQuery = `
      SELECT * FROM vufs_pattern_subcategories 
      WHERE is_active = true 
      ORDER BY sort_order
    `;
    const patternsQuery = `
      SELECT * FROM vufs_patterns 
      WHERE is_active = true AND (is_deleted = false OR is_deleted IS NULL) 
      ORDER BY name
    `;

    const [groupsResult, subcatsResult, patternsResult] = await Promise.all([
      db.query(groupsQuery),
      db.query(subcatsQuery),
      db.query(patternsQuery)
    ]);

    const subcatsMap = new Map<string, VUFSPatternSubcategory[]>();
    const patternsMap = new Map<string, VUFSPattern[]>();
    const patternsBySubcatMap = new Map<string, VUFSPattern[]>();

    // Group patterns by group_id and subcategory_id
    for (const row of patternsResult.rows) {
      const pattern: VUFSPattern = {
        id: row.id.toString(),
        name: row.name,
        description: row.description,
        skuRef: row.sku_ref,
        groupId: row.group_id?.toString(),
        subcategoryId: row.subcategory_id?.toString(),
        isActive: row.is_active,
        isDeleted: row.is_deleted || false
      };

      if (pattern.subcategoryId) {
        if (!patternsBySubcatMap.has(pattern.subcategoryId)) {
          patternsBySubcatMap.set(pattern.subcategoryId, []);
        }
        patternsBySubcatMap.get(pattern.subcategoryId)!.push(pattern);
      } else if (pattern.groupId) {
        if (!patternsMap.has(pattern.groupId)) {
          patternsMap.set(pattern.groupId, []);
        }
        patternsMap.get(pattern.groupId)!.push(pattern);
      }
    }

    // Group subcategories by group_id
    for (const row of subcatsResult.rows) {
      const subcat: VUFSPatternSubcategory = {
        id: row.id.toString(),
        groupId: row.group_id.toString(),
        name: row.name,
        sortOrder: row.sort_order,
        isActive: row.is_active,
        patterns: patternsBySubcatMap.get(row.id.toString()) || []
      };

      if (!subcatsMap.has(subcat.groupId)) {
        subcatsMap.set(subcat.groupId, []);
      }
      subcatsMap.get(subcat.groupId)!.push(subcat);
    }

    // Build final groups array
    return groupsResult.rows.map((row: any) => ({
      id: row.id.toString(),
      name: row.name,
      description: row.description,
      emoji: row.emoji,
      slug: row.slug,
      sortOrder: row.sort_order,
      isActive: row.is_active,
      subcategories: subcatsMap.get(row.id.toString()) || [],
      patterns: patternsMap.get(row.id.toString()) || []
    }));
  }

  /**
   * Get all pattern subcategories (flat list)
   */
  static async getPatternSubcategories(): Promise<VUFSPatternSubcategory[]> {
    const query = 'SELECT * FROM vufs_pattern_subcategories WHERE is_active = true ORDER BY group_id, sort_order';
    const result = await db.query(query);
    return result.rows.map((row: any) => ({
      id: row.id.toString(),
      groupId: row.group_id.toString(),
      name: row.name,
      sortOrder: row.sort_order,
      isActive: row.is_active
    }));
  }

  /**
   * Add a new pattern subcategory
   */
  static async addPatternSubcategory(groupId: string, name: string): Promise<VUFSPatternSubcategory> {
    const maxOrderRes = await db.query(
      'SELECT COALESCE(MAX(sort_order), 0) as max_order FROM vufs_pattern_subcategories WHERE group_id = $1',
      [groupId]
    );
    const nextOrder = (maxOrderRes.rows[0]?.max_order || 0) + 1;

    const query = `
      INSERT INTO vufs_pattern_subcategories (group_id, name, sort_order)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await db.query(query, [parseInt(groupId), name, nextOrder]);
    const row = result.rows[0];
    return {
      id: row.id.toString(),
      groupId: row.group_id.toString(),
      name: row.name,
      sortOrder: row.sort_order,
      isActive: row.is_active
    };
  }

  /**
   * Update a pattern subcategory
   */
  static async updatePatternSubcategory(id: string, name: string): Promise<VUFSPatternSubcategory> {
    const query = `
      UPDATE vufs_pattern_subcategories 
      SET name = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await db.query(query, [name, id]);
    const row = result.rows[0];
    return {
      id: row.id.toString(),
      groupId: row.group_id.toString(),
      name: row.name,
      sortOrder: row.sort_order,
      isActive: row.is_active
    };
  }

  /**
   * Delete a pattern subcategory (also nullifies patterns pointing to it)
   */
  static async deletePatternSubcategory(id: string): Promise<void> {
    // First, remove subcategory reference from patterns
    await db.query('UPDATE vufs_patterns SET subcategory_id = NULL WHERE subcategory_id = $1', [id]);
    // Then delete the subcategory
    await db.query('DELETE FROM vufs_pattern_subcategories WHERE id = $1', [id]);
  }

  /**
   * Update a pattern group (name, description, emoji)
   */
  static async updatePatternGroup(
    id: string,
    updates: { name?: string; description?: string; emoji?: string }
  ): Promise<VUFSPatternGroup> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIdx++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIdx++}`);
      values.push(updates.description);
    }
    if (updates.emoji !== undefined) {
      fields.push(`emoji = $${paramIdx++}`);
      values.push(updates.emoji);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `
      UPDATE vufs_pattern_groups 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${paramIdx}
      RETURNING *
    `;
    const result = await db.query(query, values);
    const row = result.rows[0];
    return {
      id: row.id.toString(),
      name: row.name,
      description: row.description,
      emoji: row.emoji,
      slug: row.slug,
      sortOrder: row.sort_order,
      isActive: row.is_active
    };
  }


  /**
   * Get Fits from vufs_fits table (excluding deleted)
   */
  static async getFits(): Promise<any[]> {
    const query = `
      SELECT f.*, 
        (SELECT array_agg(category_id) 
         FROM vufs_category_attributes 
         WHERE attribute_slug = 'possible-fits' 
         AND (
           CASE 
             WHEN value LIKE '[%' THEN value::jsonb ? f.id::text
             ELSE (',' || value || ',') LIKE '%,' || f.id::text || ',%'
           END
         )) as associated_categories
      FROM vufs_fits f 
      WHERE is_active = true AND (is_deleted = false OR is_deleted IS NULL)
      ORDER BY name
    `;
    const result = await db.query(query);
    return result.rows.map((row: any) => ({
      ...row,
      isActive: row.is_active,
      skuRef: row.sku_ref,
      isDeleted: row.is_deleted || false,
      associatedCategories: row.associated_categories || []
    }));
  }

  static async getDeletedFits(): Promise<any[]> {
    const query = 'SELECT * FROM vufs_fits WHERE is_deleted = true ORDER BY deleted_at DESC';
    const result = await db.query(query);
    return result.rows.map((row: any) => ({
      ...row,
      isActive: row.is_active,
      skuRef: row.sku_ref,
      isDeleted: true,
      deletedAt: row.deleted_at
    }));
  }


  static async addFit(name: string, skuRef?: string): Promise<any> {
    return this.addItem('vufs_fits', name, { sku_ref: skuRef });
  }

  static async deleteFit(id: string): Promise<void> {
    await db.query('UPDATE vufs_fits SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  }

  static async restoreFit(id: string): Promise<void> {
    await db.query('UPDATE vufs_fits SET is_deleted = false, deleted_at = NULL WHERE id = $1', [id]);
  }

  static async permanentlyDeleteFit(id: string): Promise<void> {
    await this.deleteItem('vufs_fits', id);
  }


  static async getApparelForFit(fitId: string): Promise<string[]> {
    const query = `
      SELECT category_id 
      FROM vufs_category_attributes 
      WHERE attribute_slug = 'possible-fits' 
      AND (
        CASE 
          WHEN value LIKE '[%' THEN value::jsonb ? $1
          ELSE (',' || value || ',') LIKE '%,' || $1 || ',%'
        END
      )
    `;
    const result = await db.query(query, [fitId]);
    return result.rows.map(row => row.category_id);
  }

  static async updateFit(id: string, name: string, skuRef?: string, categoryIds?: string[]): Promise<any> {
    const updatedFit = await this.updateItem('vufs_fits', id, name, skuRef ? { sku_ref: skuRef } : {});
    const fit = { ...updatedFit, isActive: updatedFit.is_active };

    if (categoryIds !== undefined) {
      // 1. Get current categories for this fit
      const currentCategories = await this.getApparelForFit(id);

      // 2. Identify categories to add and remove
      const toAdd = categoryIds.filter(cid => !currentCategories.includes(cid));
      const toRemove = currentCategories.filter(cid => !categoryIds.includes(cid));

      // 3. Process removals
      for (const cid of toRemove) {
        const attrRes = await db.query(
          "SELECT value FROM vufs_category_attributes WHERE category_id = $1 AND attribute_slug = 'possible-fits'",
          [cid]
        );
        if (attrRes.rows.length > 0) {
          const currentValues = this.parseAttributeValue(attrRes.rows[0].value).filter(v => v !== id);
          if (currentValues.length === 0) {
            await db.query(
              "DELETE FROM vufs_category_attributes WHERE category_id = $1 AND attribute_slug = 'possible-fits'",
              [cid]
            );
          } else {
            // Save in JSON format to match ApparelManagement behavior
            await db.query(
              "UPDATE vufs_category_attributes SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE category_id = $2 AND attribute_slug = 'possible-fits'",
              [JSON.stringify(currentValues), cid]
            );
          }
        }
      }

      // 4. Process additions
      for (const cid of toAdd) {
        const attrRes = await db.query(
          "SELECT value FROM vufs_category_attributes WHERE category_id = $1 AND attribute_slug = 'possible-fits'",
          [cid]
        );
        if (attrRes.rows.length > 0) {
          const currentValues = this.parseAttributeValue(attrRes.rows[0].value);
          if (!currentValues.includes(id)) {
            currentValues.push(id);
            await db.query(
              "UPDATE vufs_category_attributes SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE category_id = $2 AND attribute_slug = 'possible-fits'",
              [JSON.stringify(currentValues), cid]
            );
          }
        } else {
          await db.query(
            "INSERT INTO vufs_category_attributes (category_id, attribute_slug, value) VALUES ($1, 'possible-fits', $2)",
            [cid, JSON.stringify([id])]
          );
        }
      }
    }

    return fit;
  }

  /**
   * Get Sizes from vufs_sizes table (excluding deleted)
   */
  static async getSizes(): Promise<any[]> {
    const query = 'SELECT * FROM vufs_sizes WHERE is_active = true AND (is_deleted = false OR is_deleted IS NULL) ORDER BY sort_order ASC, name ASC';
    const result = await db.query(query);
    return result.rows.map((row: any) => ({ ...row, isActive: row.is_active, skuRef: row.sku_ref, isDeleted: row.is_deleted || false }));
  }

  static async getDeletedSizes(): Promise<any[]> {
    const query = 'SELECT * FROM vufs_sizes WHERE is_deleted = true ORDER BY deleted_at DESC';
    const result = await db.query(query);
    return result.rows.map((row: any) => ({ ...row, isActive: row.is_active, skuRef: row.sku_ref, isDeleted: true, deletedAt: row.deleted_at }));
  }

  static async addSize(name: string, skuRef?: string): Promise<any> {
    return this.addItem('vufs_sizes', name, { sku_ref: skuRef });
  }

  static async deleteSize(id: string): Promise<void> {
    await db.query('UPDATE vufs_sizes SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  }

  static async restoreSize(id: string): Promise<void> {
    await db.query('UPDATE vufs_sizes SET is_deleted = false, deleted_at = NULL WHERE id = $1', [id]);
  }

  static async permanentlyDeleteSize(id: string): Promise<void> {
    await this.deleteItem('vufs_sizes', id);
  }

  static async updateSize(id: string, name: string, skuRef?: string): Promise<any> {
    return this.updateItem('vufs_sizes', id, name, skuRef ? { sku_ref: skuRef } : {});
  }

  // --- GENDER MANAGEMENT ---

  /**
   * Get Genders from DB (excluding deleted)
   */
  static async getGenders(): Promise<any[]> {
    const query = 'SELECT * FROM vufs_genders WHERE is_active = true AND (is_deleted = false OR is_deleted IS NULL) ORDER BY name';
    const result = await db.query(query);
    return result.rows.map((row: any) => ({ ...row, isActive: row.is_active, skuRef: row.sku_ref, isDeleted: row.is_deleted || false }));
  }

  static async getDeletedGenders(): Promise<any[]> {
    const query = 'SELECT * FROM vufs_genders WHERE is_deleted = true ORDER BY deleted_at DESC';
    const result = await db.query(query);
    return result.rows.map((row: any) => ({ ...row, isActive: row.is_active, skuRef: row.sku_ref, isDeleted: true, deletedAt: row.deleted_at }));
  }

  static async addGender(name: string, skuRef?: string): Promise<any> {
    return this.addItem('vufs_genders', name, { sku_ref: skuRef });
  }

  static async deleteGender(id: string): Promise<void> {
    await db.query('UPDATE vufs_genders SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  }

  static async restoreGender(id: string): Promise<void> {
    await db.query('UPDATE vufs_genders SET is_deleted = false, deleted_at = NULL WHERE id = $1', [id]);
  }

  static async permanentlyDeleteGender(id: string): Promise<void> {
    await this.deleteItem('vufs_genders', id);
  }


  static async updateGender(id: string, name: string, skuRef?: string): Promise<any> {
    return this.updateItem('vufs_genders', id, name, skuRef ? { sku_ref: skuRef } : {});
  }

  // --- STANDARDS MANAGEMENT ---

  static async getStandards(): Promise<any[]> {
    const query = 'SELECT * FROM vufs_standards ORDER BY sort_order ASC';
    const result = await db.query(query);
    return result.rows;
  }

  static async addStandard(data: { name: string, label: string, region: string, category: string, approach: string, description: string }): Promise<any> {
    const query = `
      INSERT INTO vufs_standards (name, label, region, category, approach, description, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, (SELECT COALESCE(MAX(sort_order), 0) + 10 FROM vufs_standards))
      RETURNING *
    `;
    const result = await db.query(query, [data.name, data.label, data.region, data.category, data.approach, data.description]);
    return result.rows[0];
  }

  static async updateStandard(id: string, data: { name: string, label: string, region: string, category: string, approach: string, description: string }): Promise<any> {
    const query = `
      UPDATE vufs_standards
      SET name = $1, label = $2, region = $3, category = $4, approach = $5, description = $6
      WHERE id = $7
      RETURNING *
    `;
    const result = await db.query(query, [data.name, data.label, data.region, data.category, data.approach, data.description, id]);
    if (result.rows.length === 0) throw new Error('Standard not found');
    return result.rows[0];
  }

  static async deleteStandard(id: string): Promise<void> {
    await db.query('DELETE FROM vufs_standards WHERE id = $1', [id]);
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
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
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
    const query = 'SELECT * FROM vufs_attribute_values WHERE type_slug = $1 ORDER BY sort_order, name';
    const result = await db.query(query, [typeSlug]);
    return result.rows.map((row: any) => ({
      ...row,
      isActive: row.is_active,
      sortOrder: row.sort_order || 0,
      parentId: row.parent_id || null,
      skuRef: row.sku_ref
    }));
  }

  static async addAttributeValue(typeSlug: string, name: string, parentId?: string, extraData?: { skuRef?: string }): Promise<any> {
    // Get max sort_order for this type
    const maxOrderRes = await db.query(
      'SELECT COALESCE(MAX(sort_order), 0) as max_order FROM vufs_attribute_values WHERE type_slug = $1',
      [typeSlug]
    );
    const nextOrder = (maxOrderRes.rows[0]?.max_order || 0) + 1;

    const query = `
      INSERT INTO vufs_attribute_values (type_slug, name, sort_order, parent_id)
      INSERT INTO vufs_attribute_values (type_slug, name, sort_order, parent_id, sku_ref)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    try {
      const result = await db.query(query, [typeSlug, name, nextOrder, parentId || null, extraData?.skuRef || null]);
      return { ...result.rows[0], isActive: true, sortOrder: nextOrder, parentId: parentId || null };
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error(`Value "${name}" already exists for this attribute.`);
      }
      throw error;
    }
  }

  static async deleteAttributeValue(id: string): Promise<void> {
    // 1. Get all descendants (tree structure) using Recursive CTE
    // We select ID and Depth to know delete order (deepest first)
    const treeQuery = `
      WITH RECURSIVE descendants AS (
          SELECT id, parent_id, 1 as depth
          FROM vufs_attribute_values
          WHERE id = $1
          
          UNION ALL
          
          SELECT t.id, t.parent_id, d.depth + 1
          FROM vufs_attribute_values t
          JOIN descendants d ON t.parent_id = d.id
      )
      SELECT id FROM descendants ORDER BY depth DESC;
    `;

    // Note: We include the item itself in the CTE (WHERE id = $1) so we get the full list to delete matching the target + children
    // If we only wanted children we'd change the base case. 
    // Actually, let's keep it simple: Find all descendants of ID, delete them, then delete ID.

    // Revised Strategy:
    // 1. Find all children (recursive)
    // 2. Delete them in reverse order of depth
    // 3. Delete the parent

    const descendantsQuery = `
      WITH RECURSIVE descendants AS (
          SELECT id, parent_id, 1 as depth
          FROM vufs_attribute_values
          WHERE parent_id = $1
          
          UNION ALL
          
          SELECT t.id, t.parent_id, d.depth + 1
          FROM vufs_attribute_values t
          JOIN descendants d ON t.parent_id = d.id
      )
      SELECT id FROM descendants ORDER BY depth DESC;
    `;

    try {
      // Get all children first
      const res = await db.query(descendantsQuery, [id]);

      // Delete each descendant one by one (safe way to ensure FKs are respected if there are other constraints)
      // Or we could do DELETE FROM ... WHERE id IN (...) if pure self-ref allows it?
      // Postgres checks constraints row-by-row or at end of statement. 
      // Safest is iterative for now to be sure.
      for (const row of res.rows) {
        await db.query('DELETE FROM vufs_attribute_values WHERE id = $1', [row.id]);
      }

      // Finally delete the item itself
      await db.query('DELETE FROM vufs_attribute_values WHERE id = $1', [id]);

    } catch (error: any) {
      console.error('Error deleting attribute value:', error);
      throw error;
    }
  }

  /**
   * Get all descendants of an attribute value (for preview before deletion)
   */
  static async getAttributeValueDescendants(id: string): Promise<{ id: string; name: string; type_slug: string; depth: number }[]> {
    const descendantsQuery = `
      WITH RECURSIVE descendants AS (
          SELECT id, name, type_slug, parent_id, 1 as depth
          FROM vufs_attribute_values
          WHERE parent_id = $1
          
          UNION ALL
          
          SELECT t.id, t.name, t.type_slug, t.parent_id, d.depth + 1
          FROM vufs_attribute_values t
          JOIN descendants d ON t.parent_id = d.id
      )
      SELECT id, name, type_slug, depth FROM descendants ORDER BY depth ASC, name ASC;
    `;

    const res = await db.query(descendantsQuery, [id]);
    return res.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      type_slug: row.type_slug,
      depth: row.depth
    }));
  }

  static async updateAttributeValue(id: string, updates: { name?: string; parentId?: string | null, skuRef?: string }): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${++paramIndex}`);
      values.push(updates.name);
    }
    if (updates.parentId !== undefined) {
      fields.push(`parent_id = $${++paramIndex}`);
      values.push(updates.parentId);
    }
    if (updates.skuRef !== undefined) {
      fields.push(`sku_ref = $${++paramIndex}`);
      values.push(updates.skuRef || null);
    }

    if (fields.length === 0) {
      throw new Error('No updates provided');
    }

    const query = `
      UPDATE vufs_attribute_values
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING *;
    `;

    try {
      const result = await db.query(query, [id, ...values]);
      if (result.rowCount === 0) {
        throw new Error('Attribute value not found');
      }
      return { ...result.rows[0], isActive: true, sortOrder: result.rows[0].sort_order, parentId: result.rows[0].parent_id, skuRef: result.rows[0].sku_ref };
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error(`Value "${updates.name}" already exists for this attribute.`);
      }
      throw error;
    }
  }

  static async reorderAttributeValues(orders: { id: string; sortOrder: number }[]): Promise<void> {
    for (const order of orders) {
      await db.query(
        'UPDATE vufs_attribute_values SET sort_order = $2 WHERE id = $1',
        [order.id, order.sortOrder]
      );
    }
  }

  /**
   * Change an item's hierarchy level (promote/demote) and cascade children.
   * Hierarchy: subcategory-1 → subcategory-2 → subcategory-3 → apparel
   */
  static async changeHierarchyLevel(
    itemId: string,
    targetLevel: 'subcategory-1' | 'subcategory-2' | 'subcategory-3' | 'apparel',
    newParentId?: string | null
  ): Promise<void> {
    const hierarchyOrder = ['subcategory-1', 'subcategory-2', 'subcategory-3', 'apparel'];
    const targetIndex = hierarchyOrder.indexOf(targetLevel);

    if (targetIndex === -1) {
      throw new Error(`Invalid target level: ${targetLevel}`);
    }

    // Get the item's current level
    const itemResult = await db.query(
      'SELECT id, type_slug, name FROM vufs_attribute_values WHERE id = $1',
      [itemId]
    );

    if (itemResult.rowCount === 0) {
      throw new Error('Item not found');
    }

    const item = itemResult.rows[0];
    const currentLevel = item.type_slug;
    const currentIndex = hierarchyOrder.indexOf(currentLevel);

    if (currentIndex === -1) {
      throw new Error(`Item has invalid level: ${currentLevel}`);
    }

    // Update the item's type_slug and parent_id
    try {
      await db.query(
        'UPDATE vufs_attribute_values SET type_slug = $2, parent_id = $3 WHERE id = $1',
        [itemId, targetLevel, newParentId || null]
      );
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error(`An item named "${item.name}" already exists in ${targetLevel}. Please rename one of them first.`);
      }
      throw error;
    }

    // Cascade: update all children to move one level deeper/shallower accordingly
    const levelDiff = targetIndex - currentIndex;

    if (levelDiff !== 0) {
      // Get all direct children of this item
      const childrenResult = await db.query(
        'SELECT id, type_slug FROM vufs_attribute_values WHERE parent_id = $1',
        [itemId]
      );

      for (const child of childrenResult.rows) {
        const childCurrentIndex = hierarchyOrder.indexOf(child.type_slug);
        const childNewIndex = childCurrentIndex + levelDiff;

        if (childNewIndex >= 0 && childNewIndex < hierarchyOrder.length) {
          const childNewLevel = hierarchyOrder[childNewIndex] as 'subcategory-1' | 'subcategory-2' | 'subcategory-3' | 'apparel';
          // Recursively cascade to children
          await this.changeHierarchyLevel(child.id, childNewLevel, itemId);
        }
      }
    }
  }

  // --- GENERIC SKU REF UPDATE ---
  /**
   * Update the sku_ref field for any attribute table
   */
  static async updateSkuRef(tableName: string, id: string, skuRef: string): Promise<void> {
    const sanitizedTable = tableName.replace(/[^a-z_]/g, ''); // Basic SQL injection prevention
    const query = `UPDATE ${sanitizedTable} SET sku_ref = $2 WHERE id = $1`;
    await db.query(query, [id, skuRef || null]);
  }
}