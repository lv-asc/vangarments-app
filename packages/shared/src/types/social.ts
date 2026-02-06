// Social platform types for Vangarments

export interface SocialPost {
  id: string;
  slug: string;
  userId: string;
  postType: 'item' | 'inspiration';
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
  status: 'pending' | 'accepted';
  createdAt: string;

  // Populated fields
  follower?: UserProfile;
  following?: UserProfile;
}

export interface HomiesList {
  id: string;
  userId: string;
  name: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  members?: UserProfile[];
}

export interface HomiesListMember {
  id: string;
  listId: string;
  memberId: string;
  memberType: 'user' | 'brand' | 'store' | 'supplier' | 'non_profit';
  createdAt: string;
  member?: UserProfile | any;
}

// Entity types that can be followed
export type EntityType = 'brand' | 'store' | 'supplier' | 'page';

export interface EntityFollow {
  id: string;
  followerId: string;
  entityType: EntityType;
  entityId: string;
  createdAt: string;

  // Populated fields
  follower?: UserProfile;
  entity?: any; // BrandAccount | Store | Supplier | Page
}

// Direct Messaging Types
export interface Conversation {
  id: string;
  conversationType: 'direct' | 'entity' | 'group';
  entityType?: EntityType;
  entityId?: string;
  participants?: ConversationParticipant[];
  lastMessage?: Message;
  lastMessageAt?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
  // For UI convenience
  otherParticipant?: {
    id: string;
    username: string;
    profile: any;
  };
  entity?: any;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  lastReadAt?: string;
  joinedAt: string;
  user?: {
    id: string;
    username: string;
    profile: any;
  };
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user?: UserProfile;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  attachmentType: 'image' | 'video' | 'audio' | 'file';
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface MessageMention {
  id: string;
  messageId: string;
  mentionType: 'user' | 'item' | 'brand' | 'store' | 'supplier' | 'page' | 'article';
  mentionId: string;
  mentionText?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'item_share' | 'voice' | 'file';
  metadata?: any;
  createdAt: string;
  updatedAt?: string;
  editedAt?: string;
  deletedAt?: string;
  sender?: {
    id: string;
    username: string;
    profile: any;
  };
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
  mentions?: MessageMention[];
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
  verificationStatus?: string;
  roles?: string[];
}

export interface SocialLink {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'website' | 'discord';
  url: string;
  username?: string;
}

export interface Badge {
  id: string;
  type: 'brand_owner' | 'influencer' | 'stylist' | 'model' | 'designer' | 'creative_director';
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
  postType: 'item' | 'inspiration';
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
  postType?: 'item' | 'inspiration';
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
  friendsCount: number;
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