// Minimal shared types to fix compilation errors
// These should eventually be moved to the shared package

export type VUFSDomain = 'APPAREL' | 'FOOTWEAR';

export interface VUFSItem {
  id: string;
  owner: string;
  brand: string;
  color: string;
  gender: string;
  size: string;
}

export interface ApparelItem extends VUFSItem {
  pieceType: string;
  style?: string[];
  material?: string[];
  fit: string;
}

export interface FootwearItem extends VUFSItem {
  shoeType: string;
}

// Style Recommendation types
export interface StyleRecommendation {
  recommendationType: string;
  suggestions: {
    position: string;
    description: string;
    reasoning: string;
    priority: string;
  }[];
  styleInsights: {
    dominantStyles: string[];
    coherence: number;
    mixedStylesWorking: boolean;
  };
}

export interface SizeRecommendation {
  itemId: string;
  userMeasurements: any;
  itemSizing: {
    brand: string;
    sizeChart: any;
    fit: string;
  };
  recommendation: {
    recommendedSize: string;
    confidence: number;
    reasoning: string;
    fitPrediction: string;
  };
}

// Marketplace types
export interface MarketplaceFilters {
  category?: string;
  brand?: string;
  condition?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  size?: string;
  color?: string;
  location?: {
    country?: string;
    state?: string;
    maxDistance?: number; // km
  };
  shipping?: {
    freeShipping?: boolean;
    domesticOnly?: boolean;
  };
  seller?: {
    verified?: boolean;
    rating?: number;
  };
  search?: string;
  sortBy?: 'price_low' | 'price_high' | 'newest' | 'ending_soon' | 'most_watched' | 'distance';
}

export interface DetailedCondition {
  status: 'new' | 'dswt' | 'never_used' | 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  defects?: string[];
  wearSigns?: string[];
  alterations?: string[];
  authenticity: 'guaranteed' | 'likely_authentic' | 'unknown' | 'replica';
  boxIncluded?: boolean; // For shoes
  tagsIncluded?: boolean;
  receiptIncluded?: boolean;
}

export interface ShippingOptions {
  domestic: {
    available: boolean;
    cost: number;
    estimatedDays: number;
    methods: string[];
  };
  international: {
    available: boolean;
    cost?: number;
    estimatedDays?: number;
    restrictions?: string[];
  };
  freeShippingThreshold?: number;
  handlingTime: number; // days to ship
  returnPolicy: {
    accepted: boolean;
    period?: number; // days
    conditions?: string[];
    returnShipping: 'buyer' | 'seller' | 'shared';
  };
}

export type ListingStatus =
  | 'draft'
  | 'active'
  | 'sold'
  | 'reserved'
  | 'expired'
  | 'removed'
  | 'under_review';

export interface MarketplaceListing {
  id: string;
  itemId: string; // Reference to VUFS catalog item
  sellerId: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  condition: DetailedCondition;
  shipping: ShippingOptions;
  images: string[];
  status: ListingStatus;
  views: number;
  likes: number;
  watchers: number;
  category: string;
  tags: string[];
  location: {
    country: string;
    state?: string;
    city?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export type TransactionStatus =
  | 'pending_payment'
  | 'payment_confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'disputed';

export interface TransactionEvent {
  type: string;
  description: string;
  timestamp: Date;
  metadata?: any;
}

export interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface Transaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  fees: {
    platformFee: number;
    paymentFee: number;
    shippingFee: number;
  };
  netAmount: number; // Amount seller receives
  status: TransactionStatus;
  paymentMethod: string;
  paymentId?: string;
  shipping: {
    address: ShippingAddress;
    method: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
  };
  timeline: TransactionEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceReview {
  id: string;
  transactionId: string;
  reviewerId: string;
  revieweeId: string;
  type: 'buyer_to_seller' | 'seller_to_buyer';
  rating: number; // 1-5
  title?: string;
  comment?: string;
  aspects: {
    communication: number;
    shipping: number;
    itemCondition: number;
    overall: number;
  };
  helpful: number; // helpful votes
  createdAt: Date;
}