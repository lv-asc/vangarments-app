export type VUFSDomain = 'APPAREL' | 'FOOTWEAR';
export type OperationalStatus = 'not_photographed' | 'photographed' | 'published' | 'sold' | 'repassed';
export type Gender = 'Male' | 'Female' | "Men's" | "Women's" | 'Unisex';
export type Condition = 'New' | 'Excellent Used' | 'Good' | 'Fair' | 'Poor';
export type PatternWeight = '1 – Super Lightweight' | '2 – Lightweight' | '3 – Mediumweight' | '4 – Heavyweight' | '5 – Superheavyweight' | '6 – Extraheavyweight';
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
    operationalStatus: OperationalStatus;
    platformExports?: PlatformExport[];
}
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
    operationalStatus: OperationalStatus;
    platformExports?: PlatformExport[];
}
export type ApparelPieceType = 'Accessories' | 'Bag' | 'Belts' | 'Bottoms' | 'Dresses' | 'Eyewear' | 'Headwear' | 'Jackets' | 'Jerseys' | 'Jewelry' | 'Others' | 'Pants' | 'Shirts' | 'Shorts' | 'Sweats' | 'Tank Tops' | 'Tops' | 'Vests' | 'Wallets' | 'Winter';
export type FootwearType = 'Sneakers' | 'Boots' | 'Loafers' | 'Sandals' | 'Dress Shoes' | 'Athletic' | 'Casual' | 'Formal';
export type SoleType = 'Rubber' | 'EVA' | 'Foam' | 'Leather' | 'Synthetic';
export type LaceType = 'Laced' | 'Slip-On' | 'Velcro' | 'Buckle' | 'Zipper';
export type VUFSColor = 'Black' | 'Blue' | 'Bone White' | 'Burgundy' | 'Charcoal' | 'Cream' | 'Gray' | 'Green' | 'Lavender Purple' | 'Light Blue' | 'Light Green' | 'Light Grey' | 'Navy' | 'Off-White' | 'Orange' | 'Pink' | 'Purple' | 'Red' | 'Salmon' | 'Silver' | 'Teal' | 'Violet Purple' | 'White' | 'Wine' | 'Yellow';
export type VUFSStyle = 'Vintage' | 'Athleisure' | 'Grunge' | 'Y2K' | 'Casual' | 'Utility' | 'Minimalist' | 'Urban' | 'Streetwear' | 'Classic' | 'Sportswear' | 'Skater';
export interface PlatformExport {
    platform: ExportPlatform;
    exportedAt: Date;
    productId?: string;
    status: 'pending' | 'exported' | 'published' | 'error';
    errorMessage?: string;
}
export type ExportPlatform = 'nuvem_shop' | 'shopify' | 'vinted' | 'magazine_luiza' | 'ebay' | 'google_shopping' | 'dropper';
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
export interface ConsignmentSettings {
    defaultCommissionRate: number;
    platformFeeRates: Record<ExportPlatform, number>;
    paymentTerms: number;
    minimumPayout: number;
    autoRepassThreshold: number;
}
export type VUFSItem = ApparelItem | FootwearItem;
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
export interface CategoryHierarchy {
    page: string;
    blueSubcategory: string;
    whiteSubcategory: string;
    graySubcategory: string;
}
export interface BrandHierarchy {
    brand: string;
    line?: string;
    collaboration?: string;
}
export interface ItemMetadata {
    composition: Array<{
        material: string;
        percentage: number;
    }>;
    colors: Array<{
        primary: string;
        undertones: string[];
    }>;
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
export interface ItemCondition {
    status: Condition;
    notes?: string;
    defects: string[];
}
export interface OwnershipInfo {
    status: 'owned' | 'loaned' | 'sold';
    visibility: 'public' | 'private' | 'friends';
    loanedTo?: string;
    loanDate?: Date;
}
//# sourceMappingURL=vufs.d.ts.map