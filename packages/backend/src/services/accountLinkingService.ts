import { db } from '../database/connection';

export interface SocialAccountLink {
  id: string;
  userId: string;
  platform: 'instagram' | 'tiktok' | 'pinterest' | 'twitter' | 'linkedin';
  platformUserId: string;
  platformUsername: string;
  profileUrl: string;
  isVerified: boolean;
  isPublic: boolean;
  linkType: 'bio_link' | 'profile_verification' | 'content_sync';
  metadata: {
    followerCount?: number;
    profilePicture?: string;
    bio?: string;
    lastSync?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AccountLinkingRequest {
  platform: 'instagram' | 'tiktok' | 'pinterest' | 'twitter' | 'linkedin';
  platformUsername: string;
  linkType: 'bio_link' | 'profile_verification' | 'content_sync';
  isPublic?: boolean;
}

export class AccountLinkingService {
  /**
   * Link a social media account to user profile
   */
  async linkSocialAccount(
    userId: string,
    linkingRequest: AccountLinkingRequest
  ): Promise<SocialAccountLink> {
    const { platform, platformUsername, linkType, isPublic = true } = linkingRequest;

    // Check if account is already linked
    const existingLink = await this.getSocialAccountLink(userId, platform);
    if (existingLink) {
      throw new Error(`${platform} account is already linked`);
    }

    // Verify the social account exists and get profile info
    const profileInfo = await this.verifyAndFetchProfile(platform, platformUsername);
    
    const query = `
      INSERT INTO social_account_links (
        user_id, platform, platform_user_id, platform_username,
        profile_url, is_verified, is_public, link_type, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      userId,
      platform,
      profileInfo.userId,
      platformUsername,
      profileInfo.profileUrl,
      profileInfo.isVerified,
      isPublic,
      linkType,
      JSON.stringify(profileInfo.metadata),
    ];

    const result = await db.query(query, values);
    return this.mapRowToSocialAccountLink(result.rows[0]);
  }

  /**
   * Unlink a social media account
   */
  async unlinkSocialAccount(userId: string, platform: string): Promise<void> {
    const query = `
      DELETE FROM social_account_links 
      WHERE user_id = $1 AND platform = $2
    `;

    await db.query(query, [userId, platform]);
  }

  /**
   * Get a specific social account link
   */
  async getSocialAccountLink(
    userId: string,
    platform: string
  ): Promise<SocialAccountLink | null> {
    const query = `
      SELECT * FROM social_account_links 
      WHERE user_id = $1 AND platform = $2
    `;

    const result = await db.query(query, [userId, platform]);
    return result.rows.length > 0 ? this.mapRowToSocialAccountLink(result.rows[0]) : null;
  }

  /**
   * Get all social account links for a user
   */
  async getUserSocialAccountLinks(userId: string): Promise<SocialAccountLink[]> {
    const query = `
      SELECT * FROM social_account_links 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [userId]);
    return result.rows.map(row => this.mapRowToSocialAccountLink(row));
  }

  /**
   * Check if user has any account linking
   */
  async hasAccountLinking(userId: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count FROM social_account_links 
      WHERE user_id = $1
    `;

    const result = await db.query(query, [userId]);
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Update social account link visibility
   */
  async updateLinkVisibility(
    userId: string,
    platform: string,
    isPublic: boolean
  ): Promise<void> {
    const query = `
      UPDATE social_account_links 
      SET is_public = $3, updated_at = NOW()
      WHERE user_id = $1 AND platform = $2
    `;

    await db.query(query, [userId, platform, isPublic]);
  }

  /**
   * Sync profile information from social platforms
   */
  async syncSocialProfiles(userId: string): Promise<{
    synced: number;
    errors: Array<{ platform: string; error: string }>;
  }> {
    const links = await this.getUserSocialAccountLinks(userId);
    let synced = 0;
    const errors: Array<{ platform: string; error: string }> = [];

    for (const link of links) {
      try {
        const profileInfo = await this.verifyAndFetchProfile(
          link.platform,
          link.platformUsername
        );

        const updateQuery = `
          UPDATE social_account_links 
          SET metadata = $3, updated_at = NOW()
          WHERE user_id = $1 AND platform = $2
        `;

        await db.query(updateQuery, [
          userId,
          link.platform,
          JSON.stringify({
            ...link.metadata,
            ...profileInfo.metadata,
            lastSync: new Date().toISOString(),
          }),
        ]);

        synced++;
      } catch (error: any) {
        errors.push({
          platform: link.platform,
          error: error.message || 'Sync failed',
        });
      }
    }

    return { synced, errors };
  }

  /**
   * Generate bio link for user profile
   */
  async generateBioLink(userId: string): Promise<{
    bioLink: string;
    qrCode: string;
    socialLinks: Array<{
      platform: string;
      username: string;
      url: string;
    }>;
  }> {
    const links = await this.getUserSocialAccountLinks(userId);
    const publicLinks = links.filter(link => link.isPublic);

    // Generate a unique bio link (similar to VSCO)
    const bioLink = `https://vangarments.com/u/${userId}`;
    
    // Generate QR code URL (would integrate with QR code service)
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bioLink)}`;

    const socialLinks = publicLinks.map(link => ({
      platform: link.platform,
      username: link.platformUsername,
      url: link.profileUrl,
    }));

    return {
      bioLink,
      qrCode,
      socialLinks,
    };
  }

  /**
   * Get social proof metrics for user
   */
  async getSocialProofMetrics(userId: string): Promise<{
    totalFollowers: number;
    verifiedAccounts: number;
    platforms: string[];
    socialScore: number;
  }> {
    const links = await this.getUserSocialAccountLinks(userId);
    
    const totalFollowers = links.reduce((sum, link) => {
      return sum + (link.metadata.followerCount || 0);
    }, 0);

    const verifiedAccounts = links.filter(link => link.isVerified).length;
    const platforms = links.map(link => link.platform);

    // Calculate social score based on followers, verification, and platform diversity
    let socialScore = 0;
    socialScore += Math.min(totalFollowers / 1000, 50); // Up to 50 points for followers
    socialScore += verifiedAccounts * 20; // 20 points per verified account
    socialScore += platforms.length * 5; // 5 points per platform

    return {
      totalFollowers,
      verifiedAccounts,
      platforms,
      socialScore: Math.min(Math.round(socialScore), 100),
    };
  }

  /**
   * Find users by social platform
   */
  async findUsersBySocialPlatform(
    platform: string,
    usernames: string[]
  ): Promise<Array<{
    userId: string;
    platformUsername: string;
    isPublic: boolean;
  }>> {
    if (usernames.length === 0) return [];

    const query = `
      SELECT user_id, platform_username, is_public
      FROM social_account_links 
      WHERE platform = $1 AND platform_username = ANY($2)
    `;

    const result = await db.query(query, [platform, usernames]);
    return result.rows.map(row => ({
      userId: row.user_id,
      platformUsername: row.platform_username,
      isPublic: row.is_public,
    }));
  }

  /**
   * Get account linking statistics
   */
  async getAccountLinkingStats(): Promise<{
    totalLinkedAccounts: number;
    platformBreakdown: Record<string, number>;
    verificationRate: number;
    publicLinkRate: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_linked_accounts,
        platform,
        COUNT(CASE WHEN is_verified THEN 1 END) as verified_count,
        COUNT(CASE WHEN is_public THEN 1 END) as public_count
      FROM social_account_links 
      GROUP BY platform
    `;

    const result = await db.query(query);
    
    let totalLinkedAccounts = 0;
    let totalVerified = 0;
    let totalPublic = 0;
    const platformBreakdown: Record<string, number> = {};

    result.rows.forEach(row => {
      const count = parseInt(row.total_linked_accounts);
      totalLinkedAccounts += count;
      totalVerified += parseInt(row.verified_count);
      totalPublic += parseInt(row.public_count);
      platformBreakdown[row.platform] = count;
    });

    return {
      totalLinkedAccounts,
      platformBreakdown,
      verificationRate: totalLinkedAccounts > 0 ? totalVerified / totalLinkedAccounts : 0,
      publicLinkRate: totalLinkedAccounts > 0 ? totalPublic / totalLinkedAccounts : 0,
    };
  }

  /**
   * Verify and fetch profile information from social platform
   */
  private async verifyAndFetchProfile(
    platform: string,
    username: string
  ): Promise<{
    userId: string;
    profileUrl: string;
    isVerified: boolean;
    metadata: any;
  }> {
    // This would normally integrate with actual social media APIs
    // For now, return mock data based on platform
    
    const baseUrls = {
      instagram: 'https://instagram.com/',
      tiktok: 'https://tiktok.com/@',
      pinterest: 'https://pinterest.com/',
      twitter: 'https://twitter.com/',
      linkedin: 'https://linkedin.com/in/',
    };

    const profileUrl = baseUrls[platform as keyof typeof baseUrls] + username;

    // Mock profile verification and data
    return {
      userId: `${platform}_${username}_${Date.now()}`,
      profileUrl,
      isVerified: Math.random() > 0.8, // 20% chance of being verified
      metadata: {
        followerCount: Math.floor(Math.random() * 10000),
        profilePicture: `https://example.com/profile/${username}.jpg`,
        bio: `Fashion enthusiast on ${platform}`,
        lastSync: new Date().toISOString(),
      },
    };
  }

  private mapRowToSocialAccountLink(row: any): SocialAccountLink {
    return {
      id: row.id,
      userId: row.user_id,
      platform: row.platform,
      platformUserId: row.platform_user_id,
      platformUsername: row.platform_username,
      profileUrl: row.profile_url,
      isVerified: row.is_verified,
      isPublic: row.is_public,
      linkType: row.link_type,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}