// VUFS Constants - Based on your comprehensive system

export const VUFS_BRANDS = [
  'Adidas®',
  'Approve®',
  'Calvin Klein®',
  'Christian Dior®',
  'Converse®',
  'Down Jacquards®',
  'Fila®',
  'GAP®',
  'Guess®',
  'High Company®',
  'John John®',
  "Levi's®",
  'Louis Vuitton®',
  'Nike®',
  'Polo Ralph Lauren®',
  'Puma®',
  'Ralph Lauren®',
  'Tommy Hilfiger®',
  'Uniqlo®',
  'Vans®',
  'Zara®',
  // Add more as needed from your complete list
] as const;

export const VUFS_COLORS = [
  'Black',
  'Blue', 
  'Bone White',
  'Burgundy',
  'Charcoal',
  'Cream',
  'Gray',
  'Green',
  'Lavender Purple',
  'Light Blue',
  'Light Green',
  'Light Grey',
  'Navy',
  'Off-White',
  'Orange',
  'Pink',
  'Purple',
  'Red',
  'Salmon',
  'Silver',
  'Teal',
  'Violet Purple',
  'White',
  'Wine',
  'Yellow',
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
  'Accessories',
  'Bag',
  'Belts',
  'Bottoms',
  'Dresses',
  'Eyewear',
  'Headwear',
  'Jackets',
  'Jerseys',
  'Jewelry',
  'Others',
  'Pants',
  'Shirts',
  'Shorts',
  'Sweats',
  'Tank Tops',
  'Tops',
  'Vests',
  'Wallets',
  'Winter',
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
  'Cotton',
  'Polyester',
  'Nylon',
  'Wool',
  'Silk',
  'Linen',
  'Denim',
  'Leather',
  'Suede',
  'Canvas',
  'Fleece',
  'Cashmere',
  'Spandex',
  'Elastane',
  'Viscose',
  'Rayon',
  'Acrylic',
  'Bamboo',
  'Modal',
  'Tencel',
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