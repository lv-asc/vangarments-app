// Constants for the Vangarments platform

export const VUFS_CATEGORIES = {
  PAGES: [
    'Clothing',
    'Footwear',
    'Accessories',
    'Bags',
  ],
  CLOTHING: {
    BLUE: ['Tops', 'Bottoms', 'Outerwear', 'Underwear', 'Sleepwear'],
    WHITE: {
      TOPS: ['T-Shirts', 'Shirts', 'Blouses', 'Tank Tops', 'Sweaters', 'Hoodies', 'Cardigans'],
      BOTTOMS: ['Jeans', 'Trousers', 'Shorts', 'Skirts', 'Leggings', 'Joggers', 'Chinos'],
      OUTERWEAR: ['Jackets', 'Coats', 'Blazers', 'Vests', 'Parkas', 'Windbreakers'],
      UNDERWEAR: ['Bras', 'Panties', 'Boxers', 'Briefs', 'Undershirts', 'Shapewear'],
      SLEEPWEAR: ['Pajamas', 'Nightgowns', 'Robes', 'Sleep Sets', 'Loungewear'],
    },
    GRAY: {
      TSHIRTS: ['Crew Neck', 'V-Neck', 'Scoop Neck', 'Henley', 'Polo', 'Tank'],
      JEANS: ['Skinny', 'Straight', 'Bootcut', 'Wide Leg', 'High Waist', 'Low Rise'],
      JACKETS: ['Denim', 'Leather', 'Bomber', 'Moto', 'Varsity', 'Track'],
    },
  },
  FOOTWEAR: {
    BLUE: ['Sneakers', 'Dress Shoes', 'Boots', 'Sandals', 'Athletic', 'Casual'],
    WHITE: {
      SNEAKERS: ['Low-top', 'High-top', 'Slip-on', 'Running', 'Basketball', 'Skateboarding'],
      DRESS_SHOES: ['Oxfords', 'Loafers', 'Heels', 'Flats', 'Pumps', 'Mary Janes'],
      BOOTS: ['Ankle', 'Knee-high', 'Combat', 'Chelsea', 'Work', 'Hiking'],
      SANDALS: ['Flip-flops', 'Slides', 'Gladiator', 'Platform', 'Sport', 'Dress'],
      ATHLETIC: ['Running', 'Training', 'Basketball', 'Soccer', 'Tennis', 'Cross-training'],
    },
    GRAY: {
      SNEAKERS_LOWTOP: ['Canvas', 'Leather', 'Mesh', 'Suede', 'Knit', 'Synthetic'],
      HEELS: ['Stiletto', 'Block', 'Wedge', 'Kitten', 'Platform', 'Cone'],
      BOOTS_ANKLE: ['Lace-up', 'Zip', 'Pull-on', 'Buckle', 'Elastic', 'Harness'],
    },
  },
  ACCESSORIES: {
    BLUE: ['Jewelry', 'Watches', 'Eyewear', 'Hats', 'Scarves', 'Belts'],
    WHITE: {
      JEWELRY: ['Necklaces', 'Earrings', 'Bracelets', 'Rings', 'Brooches', 'Anklets'],
      WATCHES: ['Analog', 'Digital', 'Smart', 'Sport', 'Dress', 'Casual'],
      EYEWEAR: ['Sunglasses', 'Prescription', 'Reading', 'Blue Light', 'Safety'],
      HATS: ['Baseball Caps', 'Beanies', 'Fedoras', 'Sun Hats', 'Berets', 'Bucket Hats'],
    },
  },
  BAGS: {
    BLUE: ['Handbags', 'Backpacks', 'Luggage', 'Wallets', 'Clutches', 'Totes'],
    WHITE: {
      HANDBAGS: ['Shoulder', 'Crossbody', 'Satchel', 'Hobo', 'Top Handle', 'Mini'],
      BACKPACKS: ['Daypack', 'Laptop', 'Travel', 'School', 'Hiking', 'Fashion'],
      LUGGAGE: ['Carry-on', 'Checked', 'Duffel', 'Garment', 'Rolling', 'Hard Case'],
    },
  },
};

export const SIZE_STANDARDS = {
  BR: 'Brazilian',
  US: 'United States',
  EU: 'European',
  UK: 'United Kingdom',
};

export const USER_ROLES = {
  CONSUMER: 'consumer',
  INFLUENCER: 'influencer',
  BRAND_OWNER: 'brand_owner',
  STORE_OWNER: 'store_owner',
  MODEL: 'model',
  STYLIST: 'stylist',
  DESIGNER: 'designer',
  CREATIVE_DIRECTOR: 'creative_director',
} as const;

export const ITEM_CONDITIONS = {
  NEW: 'new',
  DSWT: 'dswt', // Dead Stock With Tags
  NEVER_USED: 'never_used',
  USED: 'used',
} as const;

export const VISIBILITY_LEVELS = {
  PUBLIC: 'public',
  FRIENDS: 'friends',
  PRIVATE: 'private',
} as const;

export const BADGE_TYPES = {

  BRAND_OWNER: 'brand_owner',
  VERIFIED_INFLUENCER: 'verified_influencer',
  TOP_SELLER: 'top_seller',
  FASHION_EXPERT: 'fashion_expert',
} as const;

// Re-export VUFS constants
export * from './vufs';

// Re-export sport org constants
export * from './sportOrg';

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/v1/auth/register',
    LOGIN: '/api/v1/auth/login',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
    PROFILE: '/api/v1/auth/profile',
  },
  USERS: {
    MEASUREMENTS: '/api/v1/users/measurements',
    ADDRESS: '/api/v1/users/address',
    PREFERENCES: '/api/v1/users/preferences',
    SIZE_CONVERSION: '/api/v1/users/size-conversion',
    SIZE_CHART: '/api/v1/users/size-chart',
  },
  VUFS: {
    CREATE_ITEM: '/api/v1/vufs/items',
    MY_ITEMS: '/api/v1/vufs/items/my',
    ITEM_STATS: '/api/v1/vufs/items/stats',
    SEARCH_ITEMS: '/api/v1/vufs/items/search',
    GET_ITEM: '/api/v1/vufs/items/:id',
    UPDATE_ITEM: '/api/v1/vufs/items/:id',
    DELETE_ITEM: '/api/v1/vufs/items/:id',
    GET_BY_CODE: '/api/v1/vufs/code/:vufsCode',
    VALIDATE_CODE: '/api/v1/vufs/validate/:code',
  },
  ANTEROOM: {
    ADD_ITEM: '/api/v1/anteroom/items',
    GET_ITEMS: '/api/v1/anteroom/items',
    UPDATE_ITEM: '/api/v1/anteroom/items/:id',
    COMPLETE_ITEM: '/api/v1/anteroom/items/:id/complete',
    REMOVE_ITEM: '/api/v1/anteroom/items/:id',
    CLEANUP: '/api/v1/anteroom/cleanup',
  },
  AI: {
    PROCESS_IMAGE: '/api/v1/ai/process-image',
    ANALYZE_ITEM: '/api/v1/ai/analyze-item',
  },
} as const;