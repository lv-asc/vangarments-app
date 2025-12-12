// VUFS (Vangarments Universal Fashion Standard) Types
// Based on your comprehensive 1-year development work

export type VUFSDomain = 'APPAREL' | 'FOOTWEAR';

export type OperationalStatus =
  | 'not_photographed'
  | 'photographed'
  | 'published'
  | 'sold'
  | 'repassed';

export type Gender = 'Male' | 'Female' | "Men's" | "Women's" | 'Unisex';

export type Condition = 'New' | 'Excellent Used' | 'Good' | 'Fair' | 'Poor';

export type PatternWeight =
  | '1 – Super Lightweight'
  | '2 – Lightweight'
  | '3 – Mediumweight'
  | '4 – Heavyweight'
  | '5 – Superheavyweight'
  | '6 – Extraheavyweight';

// APPAREL Domain Types
export interface ApparelItem {
  id: string;
  sku: string;
  brand: string;
  model?: string;
  style: string[];
  pattern: PatternWeight;
  material: string;
  pieceType: ApparelPieceType;
  fit: string;
  color: VUFSColor;
  size: string;
  gender: Gender;
  condition: Condition;
  photographed: boolean;
  price: number;
  owner: string;
  supplier?: string;
  sold: boolean;
  soldPrice?: number;
  repassStatus: boolean;
  amountToTransfer?: number;
  createdDate: Date;

  // Operational tracking
  operationalStatus: OperationalStatus;

  // Platform export tracking
  platformExports?: PlatformExport[];
}

// FOOTWEAR Domain Types
export interface FootwearItem {
  id: string;
  sku: string;
  brand: string;
  modelType: FootwearType;
  upperMaterial: string;
  soleType: SoleType;
  laceType: LaceType;
  color: VUFSColor;
  size: string;
  heelHeight?: number;
  gender: Gender;
  condition: Condition;
  photographed: boolean;
  price: number;
  owner: string;
  supplier?: string;
  sold: boolean;
  soldPrice?: number;
  repassStatus: boolean;
  amountToTransfer?: number;
  createdDate: Date;

  // Operational tracking
  operationalStatus: OperationalStatus;

  // Platform export tracking
  platformExports?: PlatformExport[];
}

// Piece Types for APPAREL
export type ApparelPieceType =
  | 'Accessories'
  | 'Bag'
  | 'Belts'
  | 'Bottoms'
  | 'Dresses'
  | 'Eyewear'
  | 'Headwear'
  | 'Jackets'
  | 'Jerseys'
  | 'Jewelry'
  | 'Others'
  | 'Pants'
  | 'Shirts'
  | 'Shorts'
  | 'Sweats'
  | 'Tank Tops'
  | 'Tops'
  | 'Vests'
  | 'Wallets'
  | 'Winter';

// Footwear Types
export type FootwearType =
  | 'Sneakers'
  | 'Boots'
  | 'Loafers'
  | 'Sandals'
  | 'Dress Shoes'
  | 'Athletic'
  | 'Casual'
  | 'Formal';

export type SoleType =
  | 'Rubber'
  | 'EVA'
  | 'Foam'
  | 'Leather'
  | 'Synthetic';

export type LaceType =
  | 'Laced'
  | 'Slip-On'
  | 'Velcro'
  | 'Buckle'
  | 'Zipper';

// VUFS Colors
export type VUFSColor =
  | 'Black'
  | 'Blue'
  | 'Bone White'
  | 'Burgundy'
  | 'Charcoal'
  | 'Cream'
  | 'Gray'
  | 'Green'
  | 'Lavender Purple'
  | 'Light Blue'
  | 'Light Green'
  | 'Light Grey'
  | 'Navy'
  | 'Off-White'
  | 'Orange'
  | 'Pink'
  | 'Purple'
  | 'Red'
  | 'Salmon'
  | 'Silver'
  | 'Teal'
  | 'Violet Purple'
  | 'White'
  | 'Wine'
  | 'Yellow';

// VUFS Styles
export type VUFSStyle =
  | 'Vintage'
  | 'Athleisure'
  | 'Grunge'
  | 'Y2K'
  | 'Casual'
  | 'Utility'
  | 'Minimalist'
  | 'Urban'
  | 'Streetwear'
  | 'Classic'
  | 'Sportswear'
  | 'Skater';

// Platform Export Types
export interface PlatformExport {
  platform: ExportPlatform;
  exportedAt: Date;
  productId?: string;
  status: 'pending' | 'exported' | 'published' | 'error';
  errorMessage?: string;
}

export type ExportPlatform =
  | 'nuvem_shop'
  | 'shopify'
  | 'vinted'
  | 'magazine_luiza'
  | 'ebay'
  | 'google_shopping'
  | 'dropper';

// Platform Conversion Data
export interface PlatformProductData {
  title: string;
  description: string;
  tags: string[];
  seoTitle?: string;
  slug?: string;
  handle?: string;
  pricing: {
    price: number;
    compareAtPrice?: number;
    currency: string;
  };
  shipping?: {
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  };
  platformCategory: string;
  platformGender: string;
  images: string[];
}

// Financial Tracking
export interface FinancialRecord {
  itemSku: string;
  owner: string;
  supplier?: string;
  originalPrice: number;
  soldPrice?: number;
  commissionRate: number;
  platformFees: number;
  netAmount: number;
  amountToOwner: number;
  repassStatus: boolean;
  repassDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
}

// Consignment Business Logic
export interface ConsignmentSettings {
  defaultCommissionRate: number;
  platformFeeRates: Record<ExportPlatform, number>;
  paymentTerms: number; // days
  minimumPayout: number;
  autoRepassThreshold: number;
}

// Complete VUFS Item (Union Type)
export type VUFSItem = ApparelItem | FootwearItem;

// VUFS Catalog Entry
export interface VUFSCatalogEntry {
  id: string;
  vufsCode: string;
  domain: VUFSDomain;
  item: VUFSItem;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

// Category Hierarchy for VUFS system
export interface CategoryHierarchy {
  page: string;
  blueSubcategory: string;
  whiteSubcategory: string;
  graySubcategory: string;
}

// Brand Hierarchy for VUFS system
export interface BrandHierarchy {
  brand: string;
  line?: string;
  collaboration?: string;
}

// Item Metadata
export interface ItemMetadata {
  composition: Array<{ material: string; percentage: number }>;
  colors: Array<{ primary: string; undertones: string[] }>;
  careInstructions: string[];
  size?: string;
  pattern?: string;
  fit?: string;
  name?: string;
  description?: string;
  customAttributes?: Record<string, string>;
  acquisitionInfo: {
    date: string | Date;
    price: number;
    store: string;
  };
  pricing: {
    retailPrice: number;
    currentValue: number;
  };
}

// Item Condition
export interface ItemCondition {
  status: Condition;
  notes?: string;
  defects: string[];
}

// Ownership Information
export interface OwnershipInfo {
  status: 'owned' | 'loaned' | 'sold';
  visibility: 'public' | 'private' | 'friends';
  loanedTo?: string;
  loanDate?: Date;
}