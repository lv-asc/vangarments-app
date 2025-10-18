// Social platform types for Vangarments

export interface SocialPost {
  id: string;
  userId: string;
  postType: 'outfit' | 'item' | 'inspiration';
  content: {
    title?: string;
    description?: string;
    imageUrls: string[];
    tags?: string[];
  };
  wardrobeItemIds: string[];
  engagementStats: {
    likes: number;
    comments: number;
    shares: number;
  };
  visibility: 'public' | 'followers' | 'private';
  createdAt: string;
  updatedAt: string;
  
  // Populated fields
  user?: UserProfile;
  comments?: PostComment[];
  likes?: PostLike[];
  wardrobeItems?: VUFSItem[];
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentCommentId?: string;
  createdAt: string;
  updatedAt: string;
  
  // Populated fields
  user?: UserProfile;
  parentComment?: PostComment;
  replies?: PostComment[];
}

export interface PostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
  
  // Populated fields
  user?: UserProfile;
}

export interface UserFollow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
  
  // Populated fields
  follower?: UserProfile;
  following?: UserProfile;
}

export interface UserProfile {
  id: string;
  profile: {
    name: string;
    username?: string;
    bio?: string;
    profilePicture?: string;
    bannerImage?: string;
    socialLinks?: SocialLink[];
  };
  badges?: Badge[];
}

export interface SocialLink {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'website';
  url: string;
  username?: string;
}

export interface Badge {
  id: string;
  type: 'beta_pioneer' | 'brand_owner' | 'influencer' | 'stylist' | 'model' | 'designer' | 'creative_director';
  name: string;
  description: string;
  iconUrl?: string;
  color?: string;
}

export interface VUFSItem {
  id: string;
  vufsCode: string;
  ownerId: string;
  categoryHierarchy: {
    page: string;
    blueSubcategory: string;
    whiteSubcategory: string;
    graySubcategory: string;
  };
  brandHierarchy: {
    brand: string;
    line?: string;
    collaboration?: string;
  };
  metadata: {
    name: string;
    composition: Material[];
    colors: Color[];
    careInstructions: string[];
    acquisitionInfo?: AcquisitionInfo;
    pricingInfo?: PricingInfo;
  };
  images: ItemImage[];
  conditionInfo: ItemCondition;
  visibilitySettings: {
    public: boolean;
    marketplace: boolean;
    social: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  name: string;
  percentage: number;
}

export interface Color {
  name: string;
  hex?: string;
  undertones?: string[];
}

export interface AcquisitionInfo {
  source: 'purchase' | 'gift' | 'trade' | 'loan';
  date?: string;
  price?: number;
  store?: string;
  receipt?: string;
}

export interface PricingInfo {
  retailPrice?: number;
  paidPrice?: number;
  currentValue?: number;
  marketValue?: number;
}

export interface ItemImage {
  id: string;
  url: string;
  type: 'front' | 'back' | 'detail' | '360';
  isPrimary: boolean;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ItemCondition {
  status: 'new' | 'dswt' | 'never_used' | 'used_excellent' | 'used_good' | 'used_fair' | 'damaged';
  description?: string;
  defects?: string[];
  wearSigns?: string[];
}

// API Request/Response types
export interface CreatePostRequest {
  postType: 'outfit' | 'item' | 'inspiration';
  content: {
    title?: string;
    description?: string;
    imageUrls: string[];
    tags?: string[];
  };
  wardrobeItemIds?: string[];
  visibility?: 'public' | 'followers' | 'private';
}

export interface FeedRequest {
  page?: number;
  limit?: number;
  feedType?: 'following' | 'discover' | 'personal';
}

export interface SearchPostsRequest {
  q?: string;
  postType?: 'outfit' | 'item' | 'inspiration';
  tags?: string[];
  userId?: string;
  page?: number;
  limit?: number;
}

export interface AddCommentRequest {
  content: string;
  parentCommentId?: string;
}

export interface FeedResponse {
  posts: SocialPost[];
  hasMore: boolean;
  pagination: {
    page: number;
    limit: number;
  };
}

export interface SearchResponse {
  posts: SocialPost[];
  hasMore: boolean;
  pagination: {
    page: number;
    limit: number;
  };
}

export interface UsersResponse {
  users: UserProfile[];
  hasMore: boolean;
  pagination: {
    page: number;
    limit: number;
  };
}

export interface UserSocialStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

export interface OutfitCombination {
  id: string;
  name: string;
  items: VUFSItem[];
  occasion?: string;
  season?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Pinterest-like content discovery types
export interface ContentCategory {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  postCount: number;
}

export interface TrendingTag {
  tag: string;
  postCount: number;
  growth: number; // Percentage growth in the last week
}

export interface DiscoverFeed {
  categories: ContentCategory[];
  trendingTags: TrendingTag[];
  featuredPosts: SocialPost[];
  recommendedUsers: UserProfile[];
}

// Social engagement analytics
export interface EngagementMetrics {
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  averageEngagementRate: number;
  topPerformingPosts: SocialPost[];
  engagementTrend: {
    date: string;
    likes: number;
    comments: number;
    shares: number;
  }[];
}

// Content creation helpers
export interface PhotoGuide {
  step: number;
  title: string;
  description: string;
  imageUrl?: string;
  duration: number; // in seconds
  tips?: string[];
}

export interface OutfitCreationSession {
  id: string;
  userId: string;
  pinnedItem?: VUFSItem;
  selectedItems: VUFSItem[];
  suggestions: VUFSItem[];
  occasion?: string;
  season?: string;
  createdAt: string;
  updatedAt: string;
}

// Social proof and recommendations
export interface StyleRecommendation {
  type: 'similar_style' | 'trending' | 'seasonal' | 'occasion_based';
  confidence: number;
  items: VUFSItem[];
  reason: string;
  basedOn?: {
    userPosts?: SocialPost[];
    wardrobeItems?: VUFSItem[];
    followedUsers?: UserProfile[];
  };
}

export interface SocialProof {
  totalUsers: number;
  totalPosts: number;
  totalItems: number;
  featuredInfluencers: UserProfile[];
  recentActivity: {
    type: 'post' | 'follow' | 'like' | 'comment';
    user: UserProfile;
    target?: SocialPost | UserProfile;
    timestamp: string;
  }[];
}