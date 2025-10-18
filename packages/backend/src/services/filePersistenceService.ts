import fs from 'fs/promises';
import path from 'path';
import { VUFSCategoryOption, VUFSBrandOption, VUFSColorOption, VUFSMaterialOption } from './vufsManagementService';

export interface FileBackup {
  id: string;
  originalPath: string;
  backupPath: string;
  timestamp: Date;
  userId: string;
  description: string;
}

export class FilePersistenceService {
  private static readonly SHARED_DIR = path.join(process.cwd(), 'packages/shared/src');
  private static readonly CONSTANTS_DIR = path.join(this.SHARED_DIR, 'constants');
  private static readonly TYPES_DIR = path.join(this.SHARED_DIR, 'types');
  private static readonly BACKUP_DIR = path.join(process.cwd(), '.config-backups');

  /**
   * Initialize backup directory
   */
  static async initializeBackupDirectory(): Promise<void> {
    await fs.mkdir(this.BACKUP_DIR, { recursive: true });
  }

  /**
   * Create a backup of a file before modifying it
   */
  static async createFileBackup(filePath: string, userId: string, description: string): Promise<string> {
    await this.initializeBackupDirectory();
    
    const backupId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const backupPath = path.join(this.BACKUP_DIR, `${backupId}.backup`);
    
    try {
      // Copy original file to backup location
      await fs.copyFile(filePath, backupPath);
      
      // Create backup metadata
      const backup: FileBackup = {
        id: backupId,
        originalPath: filePath,
        backupPath,
        timestamp: new Date(),
        userId,
        description,
      };
      
      const metadataPath = path.join(this.BACKUP_DIR, `${backupId}.meta.json`);
      await fs.writeFile(metadataPath, JSON.stringify(backup, null, 2));
      
      return backupId;
    } catch (error) {
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restore a file from backup
   */
  static async restoreFromBackup(backupId: string): Promise<void> {
    const metadataPath = path.join(this.BACKUP_DIR, `${backupId}.meta.json`);
    
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const backup: FileBackup = JSON.parse(metadataContent);
      
      // Restore the file
      await fs.copyFile(backup.backupPath, backup.originalPath);
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update VUFS constants file with new data
   */
  static async updateVUFSConstants(
    categories: VUFSCategoryOption[],
    brands: VUFSBrandOption[],
    colors: VUFSColorOption[],
    materials: VUFSMaterialOption[],
    userId: string
  ): Promise<void> {
    const vufsConstantsPath = path.join(this.CONSTANTS_DIR, 'vufs.ts');
    
    // Create backup first
    await this.createFileBackup(vufsConstantsPath, userId, 'VUFS constants update');
    
    // Generate new file content
    const fileContent = this.generateVUFSConstantsFile(categories, brands, colors, materials);
    
    // Write updated file
    await fs.writeFile(vufsConstantsPath, fileContent, 'utf-8');
  }

  /**
   * Generate VUFS constants file content
   */
  private static generateVUFSConstantsFile(
    categories: VUFSCategoryOption[],
    brands: VUFSBrandOption[],
    colors: VUFSColorOption[],
    materials: VUFSMaterialOption[]
  ): string {
    const activeBrands = brands.filter(b => b.isActive && b.type === 'brand').map(b => `'${b.name}'`);
    const activeColors = colors.filter(c => c.isActive).map(c => `'${c.name}'`);
    const activeApparelTypes = categories
      .filter(c => c.isActive && c.level === 'page')
      .map(c => `'${c.name}'`);
    const activeMaterials = materials.filter(m => m.isActive).map(m => `'${m.name}'`);

    return `// VUFS Constants - Auto-generated from configuration management
// Last updated: ${new Date().toISOString()}

export const VUFS_BRANDS = [
  ${activeBrands.join(',\n  ')},
] as const;

export const VUFS_COLORS = [
  ${activeColors.join(',\n  ')},
] as const;

export const VUFS_STYLES = [
  'Vintage',
  'Athleisure',
  'Grunge',
  'Y2K',
  'Casual',
  'Utility',
  'Minimalist',
  'Urban',
  'Streetwear',
  'Classic',
  'Sportswear',
  'Skater',
] as const;

export const APPAREL_PIECE_TYPES = [
  ${activeApparelTypes.join(',\n  ')},
] as const;

export const FOOTWEAR_TYPES = [
  'Sneakers',
  'Boots',
  'Loafers',
  'Sandals',
  'Dress Shoes',
  'Athletic',
  'Casual',
  'Formal',
] as const;

export const SOLE_TYPES = [
  'Rubber',
  'EVA',
  'Foam',
  'Leather',
  'Synthetic',
] as const;

export const LACE_TYPES = [
  'Laced',
  'Slip-On',
  'Velcro',
  'Buckle',
  'Zipper',
] as const;

export const PATTERN_WEIGHTS = [
  '1 – Super Lightweight',
  '2 – Lightweight',
  '3 – Mediumweight', 
  '4 – Heavyweight',
  '5 – Superheavyweight',
  '6 – Extraheavyweight',
] as const;

export const GENDERS = [
  'Male',
  'Female',
  "Men's",
  "Women's", 
  'Unisex',
] as const;

export const CONDITIONS = [
  'New',
  'Excellent Used',
  'Good',
  'Fair',
  'Poor',
] as const;

export const OPERATIONAL_STATUSES = [
  'not_photographed',
  'photographed', 
  'published',
  'sold',
  'repassed',
] as const;

export const EXPORT_PLATFORMS = [
  'nuvem_shop',
  'shopify',
  'vinted',
  'magazine_luiza',
  'ebay',
  'google_shopping',
  'dropper',
] as const;

// Platform-specific mappings
export const PLATFORM_GENDER_MAPPING = {
  nuvem_shop: {
    'Male': 'Masculino',
    'Female': 'Feminino',
    "Men's": 'Masculino',
    "Women's": 'Feminino',
    'Unisex': 'Unissex',
  },
  shopify: {
    'Male': 'Men',
    'Female': 'Women',
    "Men's": 'Men',
    "Women's": 'Women',
    'Unisex': 'Unisex',
  },
  vinted: {
    'Male': 'Men',
    'Female': 'Women', 
    "Men's": 'Men',
    "Women's": 'Women',
    'Unisex': 'Unisex',
  },
} as const;

// Default consignment settings
export const DEFAULT_CONSIGNMENT_SETTINGS = {
  defaultCommissionRate: 0.30, // 30%
  platformFeeRates: {
    nuvem_shop: 0.05,
    shopify: 0.029,
    vinted: 0.05,
    magazine_luiza: 0.15,
    ebay: 0.10,
    google_shopping: 0.00,
    dropper: 0.08,
  },
  paymentTerms: 7, // days
  minimumPayout: 50.00, // BRL
  autoRepassThreshold: 1000.00, // BRL
} as const;

// SKU Generation Patterns
export const SKU_PATTERNS = {
  APPAREL: 'APP-{BRAND_CODE}-{PIECE_CODE}-{SEQUENCE}',
  FOOTWEAR: 'FTW-{BRAND_CODE}-{TYPE_CODE}-{SEQUENCE}',
} as const;

// Material categories for apparel
export const APPAREL_MATERIALS = [
  ${activeMaterials.join(',\n  ')},
] as const;

// Footwear materials
export const FOOTWEAR_MATERIALS = [
  'Leather',
  'Canvas',
  'Suede',
  'Mesh',
  'Synthetic',
  'Nubuck',
  'Patent Leather',
  'Fabric',
  'Knit',
  'Rubber',
] as const;

// Fit types for apparel
export const FIT_TYPES = [
  'Oversized',
  'Regular',
  'Slim',
  'Skinny',
  'Loose',
  'Relaxed',
  'Cropped',
  'Fitted',
  'Tailored',
  'Baggy',
  'Straight',
  'Wide',
] as const;
`;
  }

  /**
   * Update VUFS types file with new data
   */
  static async updateVUFSTypes(
    categories: VUFSCategoryOption[],
    brands: VUFSBrandOption[],
    colors: VUFSColorOption[],
    materials: VUFSMaterialOption[],
    userId: string
  ): Promise<void> {
    const vufsTypesPath = path.join(this.TYPES_DIR, 'vufs.ts');
    
    // Create backup first
    await this.createFileBackup(vufsTypesPath, userId, 'VUFS types update');
    
    // Read current file to preserve non-generated content
    const currentContent = await fs.readFile(vufsTypesPath, 'utf-8');
    
    // Generate type definitions
    const colorTypes = colors.filter(c => c.isActive).map(c => `'${c.name}'`).join('\n  | ');
    const brandTypes = brands.filter(b => b.isActive && b.type === 'brand').map(b => `'${b.name}'`).join('\n  | ');
    const apparelTypes = categories
      .filter(c => c.isActive && c.level === 'page')
      .map(c => `'${c.name}'`)
      .join('\n  | ');

    // Update specific type definitions while preserving the rest
    let updatedContent = currentContent;
    
    // Update VUFSColor type
    const colorTypeRegex = /export type VUFSColor = \s*\|?[^;]+;/s;
    const newColorType = `export type VUFSColor = \n  | ${colorTypes};`;
    updatedContent = updatedContent.replace(colorTypeRegex, newColorType);
    
    // Update ApparelPieceType if needed
    const apparelTypeRegex = /export type ApparelPieceType = \s*\|?[^;]+;/s;
    const newApparelType = `export type ApparelPieceType = \n  | ${apparelTypes};`;
    updatedContent = updatedContent.replace(apparelTypeRegex, newApparelType);
    
    // Write updated file
    await fs.writeFile(vufsTypesPath, updatedContent, 'utf-8');
  }

  /**
   * Create or update system configuration file
   */
  static async updateSystemConfiguration(config: any, userId: string): Promise<void> {
    const configPath = path.join(this.SHARED_DIR, 'config', 'system.json');
    
    // Ensure config directory exists
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    
    // Create backup if file exists
    try {
      await fs.access(configPath);
      await this.createFileBackup(configPath, userId, 'System configuration update');
    } catch (error) {
      // File doesn't exist, no backup needed
    }
    
    // Write configuration
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  /**
   * Get list of all backups
   */
  static async getBackupList(): Promise<FileBackup[]> {
    await this.initializeBackupDirectory();
    
    try {
      const files = await fs.readdir(this.BACKUP_DIR);
      const metaFiles = files.filter(f => f.endsWith('.meta.json'));
      
      const backups: FileBackup[] = [];
      
      for (const metaFile of metaFiles) {
        try {
          const metadataPath = path.join(this.BACKUP_DIR, metaFile);
          const content = await fs.readFile(metadataPath, 'utf-8');
          const backup: FileBackup = JSON.parse(content);
          backups.push(backup);
        } catch (error) {
          console.error(`Error reading backup metadata ${metaFile}:`, error);
        }
      }
      
      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error getting backup list:', error);
      return [];
    }
  }

  /**
   * Clean up old backups (keep only last N backups)
   */
  static async cleanupOldBackups(keepCount: number = 10): Promise<void> {
    const backups = await this.getBackupList();
    
    if (backups.length <= keepCount) {
      return;
    }
    
    const backupsToDelete = backups.slice(keepCount);
    
    for (const backup of backupsToDelete) {
      try {
        // Delete backup file
        await fs.unlink(backup.backupPath);
        
        // Delete metadata file
        const metadataPath = path.join(this.BACKUP_DIR, `${backup.id}.meta.json`);
        await fs.unlink(metadataPath);
      } catch (error) {
        console.error(`Error deleting backup ${backup.id}:`, error);
      }
    }
  }

  /**
   * Validate file integrity after write
   */
  static async validateFileIntegrity(filePath: string): Promise<boolean> {
    try {
      // Check if file exists and is readable
      await fs.access(filePath, fs.constants.R_OK);
      
      // For TypeScript files, do basic syntax validation
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Basic checks for TypeScript syntax
        const hasValidExports = content.includes('export');
        const hasMatchingBraces = (content.match(/\{/g) || []).length === (content.match(/\}/g) || []).length;
        const hasMatchingParens = (content.match(/\(/g) || []).length === (content.match(/\)/g) || []).length;
        
        return hasValidExports && hasMatchingBraces && hasMatchingParens;
      }
      
      // For JSON files, validate JSON syntax
      if (filePath.endsWith('.json')) {
        const content = await fs.readFile(filePath, 'utf-8');
        JSON.parse(content); // Will throw if invalid
        return true;
      }
      
      return true;
    } catch (error) {
      console.error(`File integrity validation failed for ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Reload configuration by triggering a module cache clear
   */
  static async reloadConfiguration(): Promise<void> {
    // In a production environment, this might trigger a graceful restart
    // or use a configuration reload mechanism
    
    // For now, we'll just clear the require cache for the configuration modules
    const configModules = [
      path.join(this.CONSTANTS_DIR, 'vufs.ts'),
      path.join(this.TYPES_DIR, 'vufs.ts'),
    ];
    
    for (const modulePath of configModules) {
      // Clear from require cache if it exists
      delete require.cache[require.resolve(modulePath)];
    }
    
    console.log('Configuration modules reloaded');
  }
}