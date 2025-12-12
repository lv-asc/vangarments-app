"use strict";
// VUFS Constants - Based on your comprehensive system
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIT_TYPES = exports.FOOTWEAR_MATERIALS = exports.APPAREL_MATERIALS = exports.SKU_PATTERNS = exports.DEFAULT_CONSIGNMENT_SETTINGS = exports.PLATFORM_GENDER_MAPPING = exports.EXPORT_PLATFORMS = exports.OPERATIONAL_STATUSES = exports.CONDITIONS = exports.GENDERS = exports.PATTERN_WEIGHTS = exports.LACE_TYPES = exports.SOLE_TYPES = exports.FOOTWEAR_TYPES = exports.APPAREL_PIECE_TYPES = exports.VUFS_STYLES = exports.VUFS_COLORS = exports.VUFS_BRANDS = void 0;
exports.VUFS_BRANDS = [
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
];
exports.VUFS_COLORS = [
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
];
exports.VUFS_STYLES = [
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
];
exports.APPAREL_PIECE_TYPES = [
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
];
exports.FOOTWEAR_TYPES = [
    'Sneakers',
    'Boots',
    'Loafers',
    'Sandals',
    'Dress Shoes',
    'Athletic',
    'Casual',
    'Formal',
];
exports.SOLE_TYPES = [
    'Rubber',
    'EVA',
    'Foam',
    'Leather',
    'Synthetic',
];
exports.LACE_TYPES = [
    'Laced',
    'Slip-On',
    'Velcro',
    'Buckle',
    'Zipper',
];
exports.PATTERN_WEIGHTS = [
    '1 – Super Lightweight',
    '2 – Lightweight',
    '3 – Mediumweight',
    '4 – Heavyweight',
    '5 – Superheavyweight',
    '6 – Extraheavyweight',
];
exports.GENDERS = [
    'Male',
    'Female',
    "Men's",
    "Women's",
    'Unisex',
];
exports.CONDITIONS = [
    'New',
    'Excellent Used',
    'Good',
    'Fair',
    'Poor',
];
exports.OPERATIONAL_STATUSES = [
    'not_photographed',
    'photographed',
    'published',
    'sold',
    'repassed',
];
exports.EXPORT_PLATFORMS = [
    'nuvem_shop',
    'shopify',
    'vinted',
    'magazine_luiza',
    'ebay',
    'google_shopping',
    'dropper',
];
// Platform-specific mappings
exports.PLATFORM_GENDER_MAPPING = {
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
};
// Default consignment settings
exports.DEFAULT_CONSIGNMENT_SETTINGS = {
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
};
// SKU Generation Patterns
exports.SKU_PATTERNS = {
    APPAREL: 'APP-{BRAND_CODE}-{PIECE_CODE}-{SEQUENCE}',
    FOOTWEAR: 'FTW-{BRAND_CODE}-{TYPE_CODE}-{SEQUENCE}',
};
// Material categories for apparel
exports.APPAREL_MATERIALS = [
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
];
// Footwear materials
exports.FOOTWEAR_MATERIALS = [
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
];
// Fit types for apparel
exports.FIT_TYPES = [
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
];
//# sourceMappingURL=vufs.js.map