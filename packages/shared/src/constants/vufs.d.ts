export declare const VUFS_BRANDS: readonly ["Adidas®", "Approve®", "Calvin Klein®", "Christian Dior®", "Converse®", "Down Jacquards®", "Fila®", "GAP®", "Guess®", "High Company®", "John John®", "Levi's®", "Louis Vuitton®", "Nike®", "Polo Ralph Lauren®", "Puma®", "Ralph Lauren®", "Tommy Hilfiger®", "Uniqlo®", "Vans®", "Zara®"];
export declare const VUFS_COLORS: readonly ["Black", "Blue", "Bone White", "Burgundy", "Charcoal", "Cream", "Gray", "Green", "Lavender Purple", "Light Blue", "Light Green", "Light Grey", "Navy", "Off-White", "Orange", "Pink", "Purple", "Red", "Salmon", "Silver", "Teal", "Violet Purple", "White", "Wine", "Yellow"];
export declare const VUFS_STYLES: readonly ["Vintage", "Athleisure", "Grunge", "Y2K", "Casual", "Utility", "Minimalist", "Urban", "Streetwear", "Classic", "Sportswear", "Skater"];
export declare const APPAREL_PIECE_TYPES: readonly ["Accessories", "Bag", "Belts", "Bottoms", "Dresses", "Eyewear", "Headwear", "Jackets", "Jerseys", "Jewelry", "Others", "Pants", "Shirts", "Shorts", "Sweats", "Tank Tops", "Tops", "Vests", "Wallets", "Winter"];
export declare const FOOTWEAR_TYPES: readonly ["Sneakers", "Boots", "Loafers", "Sandals", "Dress Shoes", "Athletic", "Casual", "Formal"];
export declare const SOLE_TYPES: readonly ["Rubber", "EVA", "Foam", "Leather", "Synthetic"];
export declare const LACE_TYPES: readonly ["Laced", "Slip-On", "Velcro", "Buckle", "Zipper"];
export declare const PATTERN_WEIGHTS: readonly ["1 – Super Lightweight", "2 – Lightweight", "3 – Mediumweight", "4 – Heavyweight", "5 – Superheavyweight", "6 – Extraheavyweight"];
export declare const GENDERS: readonly ["Male", "Female", "Men's", "Women's", "Unisex"];
export declare const CONDITIONS: readonly ["New", "Excellent Used", "Good", "Fair", "Poor"];
export declare const OPERATIONAL_STATUSES: readonly ["not_photographed", "photographed", "published", "sold", "repassed"];
export declare const EXPORT_PLATFORMS: readonly ["nuvem_shop", "shopify", "vinted", "magazine_luiza", "ebay", "google_shopping", "dropper"];
export declare const PLATFORM_GENDER_MAPPING: {
    readonly nuvem_shop: {
        readonly Male: "Masculino";
        readonly Female: "Feminino";
        readonly "Men's": "Masculino";
        readonly "Women's": "Feminino";
        readonly Unisex: "Unissex";
    };
    readonly shopify: {
        readonly Male: "Men";
        readonly Female: "Women";
        readonly "Men's": "Men";
        readonly "Women's": "Women";
        readonly Unisex: "Unisex";
    };
    readonly vinted: {
        readonly Male: "Men";
        readonly Female: "Women";
        readonly "Men's": "Men";
        readonly "Women's": "Women";
        readonly Unisex: "Unisex";
    };
};
export declare const DEFAULT_CONSIGNMENT_SETTINGS: {
    readonly defaultCommissionRate: 0.3;
    readonly platformFeeRates: {
        readonly nuvem_shop: 0.05;
        readonly shopify: 0.029;
        readonly vinted: 0.05;
        readonly magazine_luiza: 0.15;
        readonly ebay: 0.1;
        readonly google_shopping: 0;
        readonly dropper: 0.08;
    };
    readonly paymentTerms: 7;
    readonly minimumPayout: 50;
    readonly autoRepassThreshold: 1000;
};
export declare const SKU_PATTERNS: {
    readonly APPAREL: "APP-{BRAND_CODE}-{PIECE_CODE}-{SEQUENCE}";
    readonly FOOTWEAR: "FTW-{BRAND_CODE}-{TYPE_CODE}-{SEQUENCE}";
};
export declare const APPAREL_MATERIALS: readonly ["Cotton", "Polyester", "Nylon", "Wool", "Silk", "Linen", "Denim", "Leather", "Suede", "Canvas", "Fleece", "Cashmere", "Spandex", "Elastane", "Viscose", "Rayon", "Acrylic", "Bamboo", "Modal", "Tencel"];
export declare const FOOTWEAR_MATERIALS: readonly ["Leather", "Canvas", "Suede", "Mesh", "Synthetic", "Nubuck", "Patent Leather", "Fabric", "Knit", "Rubber"];
export declare const FIT_TYPES: readonly ["Oversized", "Regular", "Slim", "Skinny", "Loose", "Relaxed", "Cropped", "Fitted", "Tailored", "Baggy", "Straight", "Wide"];
//# sourceMappingURL=vufs.d.ts.map