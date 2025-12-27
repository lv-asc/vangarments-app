// Core types for the Vangarments platform

export interface UserProfile {
  id: string;
  cpf: string; // Brazilian personal ID
  email: string;
  username: string;
  usernameLastChanged?: Date;
  personalInfo: {
    name: string;
    birthDate: Date;
    location: Location;
    gender: Gender;
    genderOther?: string;
    bodyType?: BodyType;
    avatarUrl?: string;
    bio?: string;
    contactEmail?: string;
    telephone?: string;
  };
  measurements: UserMeasurements;
  preferences: FashionPreferences;
  badges: Badge[];
  socialLinks: SocialLink[];
  privacySettings?: {
    height: boolean;
    weight: boolean;
    birthDate: boolean;
    country?: boolean;
    state?: boolean;
    city?: boolean;
    gender?: boolean;
    telephone?: boolean;
  };
  roles: UserRole[];
  status: 'active' | 'banned' | 'deactivated';
  banExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RingSizes {
  thumb?: string;
  indexFinger?: string;
  middleFinger?: string;
  ringFinger?: string;
  pinky?: string;
}

export interface SizeRange {
  min?: string;
  max?: string;
}

export interface CategorySizes {
  shoes?: SizeRange;
  tops?: string[];      // Array to allow multiple size selections
  bottoms?: string[];   // Array to allow multiple size selections
  dresses?: string[];   // Array to allow multiple size selections
  waist?: SizeRange;
  rings?: RingSizes;
}

export interface UserMeasurements {
  // Body measurements (height in cm, weight in kg)
  height?: number;
  weight?: number;
  chest?: number;      // cm
  waist?: number;      // cm (body measurement, not clothing size)
  hips?: number;       // cm
  inseam?: number;     // cm
  shoulders?: number;  // cm
  armLength?: number;  // cm

  // Size preferences by standard (BR, US, EU, UK)
  sizes?: {
    [standard: string]: CategorySizes;
  };

  // User's preferred display standard
  preferredStandard?: 'BR' | 'US' | 'EU' | 'UK';

  updatedAt?: string;
}

export interface VUFSItem {
  id: string;
  vufsCode: string; // Unique global identifier
  ownerId: string;
  category: CategoryHierarchy;
  brand: BrandHierarchy;
  metadata: ItemMetadata;
  images: ItemImage[];
  condition: ItemCondition;
  ownership: OwnershipInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryHierarchy {
  page: string; // Top level
  blueSubcategory: string; // Second level
  whiteSubcategory: string; // Third level
  graySubcategory: string; // Fourth level
}

export interface BrandHierarchy {
  brand: string;
  line?: string;
  collaboration?: string;
}

export interface ItemMetadata {
  composition: Material[];
  colors: Color[];
  careInstructions: string[];
  acquisitionInfo: AcquisitionInfo;
  pricing: PricingInfo;
}

export interface ItemImage {
  id: string;
  url: string;
  type: 'front' | 'back' | 'detail';
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  aiAnalysis?: AIProcessingResult;
}

export interface AIProcessingResult {
  itemDetection: {
    confidence: number;
    boundingBox: BoundingBox;
    category: string;
  };
  vufsProperties: {
    [property: string]: {
      value: any;
      confidence: number;
    };
  };
  suggestedTags: Tag[];
  backgroundRemoved: boolean;
}

// Additional type definitions
export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';
export type BodyType = 'male' | 'female';
export type UserRole =
  | 'admin'
  | 'influencer'
  | 'model'
  | 'journalist'
  | 'brand_owner'
  | 'supplier'
  | 'stylist'
  | 'independent_reseller'
  | 'store_owner'
  | 'fashion_designer';

export interface Location {
  country: string;
  state: string;
  city: string;
  neighborhood?: string;
  cep?: string; // Brazilian postal code
  street?: string;
  number?: string;
  complement?: string;
}

export interface Badge {
  id: string;
  type: string;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface SizeChart {
  [size: string]: string;
}

export interface FashionPreferences {
  favoriteColors: string[];
  preferredBrands: string[];
  styleProfile: string[];
  priceRange: {
    min: number;
    max: number;
  };
}

export interface Material {
  name: string;
  percentage: number;
}

export interface Color {
  name: string;
  hex: string;
  undertones: string[];
}

export interface AcquisitionInfo {
  purchaseDate?: Date;
  purchasePrice?: number;
  store?: string;
  receiptUrl?: string;
}

export interface PricingInfo {
  retailPrice?: number;
  currentValue?: number;
  marketValue?: number;
}

export interface ItemCondition {
  status: 'new' | 'dswt' | 'never_used' | 'used';
  description?: string;
  wearCount?: number;
}

export interface OwnershipInfo {
  status: 'owned' | 'sold' | 'loaned' | 'wishlist';
  visibility: 'public' | 'friends' | 'private';
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Tag {
  name: string;
  confidence: number;
}

// Re-export social types
export * from './social';

// Re-export marketplace types
export * from './marketplace';

// Re-export VUFS types
export * from './vufs';