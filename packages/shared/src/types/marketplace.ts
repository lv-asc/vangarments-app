// Marketplace and trading system types

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

export interface SellerProfile {
  userId: string;
  displayName: string;
  avatar?: string;
  rating: number;
  totalSales: number;
  totalListings: number;
  memberSince: Date;
  verificationStatus: {
    email: boolean;
    phone: boolean;
    identity: boolean;
    address: boolean;
  };
  badges: SellerBadge[];
  policies: {
    returnPolicy: string;
    shippingPolicy: string;
    communicationStyle: string;
  };
  stats: {
    responseTime: number; // hours
    shippingTime: number; // days
    positiveRating: number; // percentage
  };
}

export interface SellerBadge {
  type: 'top_seller' | 'fast_shipper' | 'verified_authentic' | 'eco_friendly' | 'new_seller';
  name: string;
  description: string;
  earnedAt: Date;
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

export interface WatchlistItem {
  id: string;
  userId: string;
  listingId: string;
  priceAlert?: number;
  notifications: {
    priceDrops: boolean;
    endingSoon: boolean;
    backInStock: boolean;
  };
  createdAt: Date;
}

export interface MarketplaceOffer {
  id: string;
  listingId: string;
  buyerId: string;
  amount: number;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'countered' | 'expired';
  expiresAt: Date;
  counterOffer?: {
    amount: number;
    message?: string;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceAnalytics {
  sellerId: string;
  period: 'week' | 'month' | 'quarter' | 'year';
  metrics: {
    totalViews: number;
    totalLikes: number;
    totalWatchers: number;
    conversionRate: number; // views to sales
    averagePrice: number;
    totalRevenue: number;
    totalFees: number;
    netEarnings: number;
  };
  topPerformingItems: {
    itemId: string;
    views: number;
    likes: number;
    soldPrice?: number;
  }[];
  categoryPerformance: Record<string, {
    listings: number;
    sales: number;
    averagePrice: number;
  }>;
}

// Integration with VUFS system
export interface VUFSMarketplaceItem extends MarketplaceListing {
  vufsData: {
    domain: 'APPAREL' | 'FOOTWEAR';
    brand: string;
    pieceType: string;
    color: string;
    material: string;
    size: string;
    style?: string[];
    fit?: string;
    authenticity: {
      verified: boolean;
      method?: string;
      confidence: number;
    };
  };
  marketValue: {
    estimated: number;
    confidence: number;
    comparables: number;
    trend: 'rising' | 'stable' | 'falling';
  };
}