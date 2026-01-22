import { db } from '../database/connection';
import { AuthUtils } from '../utils/auth';
import { UserProfile, UserMeasurements, FashionPreferences, Location, SocialLink, PrivacySettings } from '@vangarments/shared';

export interface CreateUserData {
  cpf?: string; // Optional for OAuth users
  email: string;
  passwordHash?: string; // Optional for OAuth users
  name: string;
  birthDate: Date;
  gender: string;
  genderOther?: string;
  bodyType?: string;
  location?: Location;
  username: string; // Ensure this is consistent
  telephone: string;
  googleId?: string;
  facebookId?: string;
  googleData?: any;
  facebookData?: any;
  googleSigninEnabled?: boolean;
  facebookSigninEnabled?: boolean;
  emailVerified?: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpiresAt?: Date | null;
}

export interface UpdateUserData {
  name?: string;
  location?: Location;
  measurements?: UserMeasurements;
  preferences?: FashionPreferences;
  profile?: any;
  socialLinks?: SocialLink[];
  password?: string;
  privacySettings?: PrivacySettings;
  googleId?: string;
  facebookId?: string;
  googleData?: any;
  facebookData?: any;
  googleSigninEnabled?: boolean;
  facebookSigninEnabled?: boolean;
  cpf?: string;
  notificationPreferences?: {
    showNotificationBadge: boolean;
    showMessageBadge: boolean;
  };
}

export class UserModel {
  static async create(userData: CreateUserData): Promise<UserProfile> {
    const { cpf, email, passwordHash, name, birthDate, gender, location, username, telephone, googleId, facebookId, googleData, facebookData, googleSigninEnabled, facebookSigninEnabled } = userData;

    const profile = {
      name,
      birthDate: birthDate.toISOString(),
      gender,
      genderOther: userData.genderOther,
      bodyType: userData.bodyType,
      location: location || {},
      telephone
    };

    const query = `
      INSERT INTO users (cpf, email, password_hash, profile, username, google_id, facebook_id, google_data, facebook_data, google_signin_enabled, facebook_signin_enabled, email_verified, email_verification_token, email_verification_expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const result = await db.query(query, [
      cpf || null,
      email,
      passwordHash || null,
      JSON.stringify(profile),
      username,
      googleId || null,
      facebookId || null,
      googleData ? JSON.stringify(googleData) : null,
      facebookData ? JSON.stringify(facebookData) : null,
      googleSigninEnabled ?? true,
      facebookSigninEnabled ?? true,
      userData.emailVerified ?? false,
      userData.emailVerificationToken || null,
      userData.emailVerificationExpiresAt || null
    ]);
    const user = result.rows[0];

    const mappedUser = this.mapToUserProfile(user);

    // Auto-follow @v by default
    try {
      const vRes = await db.query("SELECT id FROM users WHERE username = 'v'");
      if (vRes.rows.length > 0) {
        const vId = vRes.rows[0].id;
        if (mappedUser.id !== vId) {
          // Use a raw query to avoid circular dependencies if we were to import UserFollowModel
          await db.query(`
            INSERT INTO user_follows (follower_id, following_id, status)
            VALUES ($1, $2, 'accepted')
            ON CONFLICT (follower_id, following_id) DO NOTHING
          `, [mappedUser.id, vId]);
        }
      }
    } catch (e) {
      console.error('Error auto-following @v:', e);
    }

    return mappedUser;
  }

  static async findById(id: string): Promise<UserProfile | null> {
    const query = `
      SELECT u.*, array_agg(ur.role) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = $1
      GROUP BY u.id, u.cpf, u.email, u.username, u.username_last_changed, u.profile, u.privacy_settings, u.measurements, u.preferences, u.status, u.ban_expires_at, u.ban_reason, u.verification_status, u.last_seen_at, u.created_at, u.updated_at
    `;

    const result = await db.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToUserProfile(result.rows[0]);
  }

  static async findByUsername(username: string): Promise<UserProfile | null> {
    const query = `
      SELECT u.*, array_agg(ur.role) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE LOWER(u.username) = LOWER($1)
      GROUP BY u.id, u.cpf, u.email, u.username, u.username_last_changed, u.profile, u.privacy_settings, u.measurements, u.preferences, u.status, u.ban_expires_at, u.ban_reason, u.verification_status, u.last_seen_at, u.created_at, u.updated_at
    `;

    const result = await db.query(query, [username]);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToUserProfile(result.rows[0]);
  }

  static async findByUsernameOrId(identifier: string): Promise<UserProfile | null> {
    // Check if identifier is a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    if (isUUID) {
      return this.findById(identifier);
    }

    // Otherwise treat as username (slug)
    return this.findByUsername(identifier);
  }

  static async findByEmail(email: string): Promise<UserProfile | null> {
    const query = `
      SELECT u.*, array_agg(ur.role) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.email = $1
      GROUP BY u.id, u.cpf, u.email, u.username, u.username_last_changed, u.profile, u.privacy_settings, u.measurements, u.preferences, u.status, u.ban_expires_at, u.ban_reason, u.verification_status, u.last_seen_at, u.created_at, u.updated_at
    `;

    const result = await db.query(query, [email]);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToUserProfile(result.rows[0]);
  }

  static async findByCPF(cpf: string): Promise<UserProfile | null> {
    const query = `
      SELECT u.*, array_agg(ur.role) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.cpf = $1
      GROUP BY u.id, u.cpf, u.email, u.username, u.username_last_changed, u.profile, u.privacy_settings, u.measurements, u.preferences, u.created_at, u.updated_at
    `;

    const result = await db.query(query, [cpf]);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToUserProfile(result.rows[0]);
  }

  static async findByGoogleId(googleId: string): Promise<UserProfile | null> {
    const query = `
      SELECT u.*, array_agg(ur.role) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.google_id = $1
      GROUP BY u.id
    `;

    const result = await db.query(query, [googleId]);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToUserProfile(result.rows[0]);
  }

  static async findByFacebookId(facebookId: string): Promise<UserProfile | null> {
    const query = `
      SELECT u.*, array_agg(ur.role) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.facebook_id = $1
      GROUP BY u.id
    `;

    const result = await db.query(query, [facebookId]);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToUserProfile(result.rows[0]);
  }

  static async getPasswordHash(userId: string): Promise<string | null> {
    const query = 'SELECT password_hash FROM users WHERE id = $1';
    const result = await db.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].password_hash;
  }

  static async update(userId: string, updateData: UpdateUserData): Promise<UserProfile | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Fetch current user once for merging
    const currentUser = await this.findById(userId);
    if (!currentUser) return null;

    if (updateData.password) {
      const passwordHash = await AuthUtils.hashPassword(updateData.password);
      updates.push(`password_hash = $${paramCount}`);
      values.push(passwordHash);
      paramCount++;
    }

    if (updateData.name || updateData.location || updateData.profile || updateData.socialLinks) {
      console.log('DEBUG: UserModel.update updateData', JSON.stringify(updateData, null, 2));

      const currentProfile = typeof (currentUser as any)._rawProfile === 'string'
        ? JSON.parse((currentUser as any)._rawProfile)
        : (currentUser as any)._rawProfile || {};

      const updatedProfile = {
        ...currentProfile,
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.location && { location: updateData.location }),
        ...(updateData.profile || {}), // Merge generic profile updates (bio, avatarUrl, birthDate)
        ...(updateData.socialLinks && { socialLinks: updateData.socialLinks }),
      };

      updates.push(`profile = $${paramCount}`);
      values.push(JSON.stringify(updatedProfile));
      paramCount++;
    }

    if (updateData.cpf) {
      updates.push(`cpf = $${paramCount}`);
      values.push(updateData.cpf);
      paramCount++;
    }

    if (updateData.measurements) {
      const currentMeasurements = currentUser.measurements || {};
      const updatedMeasurements = {
        ...currentMeasurements,
        ...updateData.measurements
      };
      updates.push(`measurements = $${paramCount}`);
      values.push(JSON.stringify(updatedMeasurements));
      paramCount++;
    }

    if (updateData.preferences) {
      const currentPreferences = currentUser.preferences || {};
      const updatedPreferences = {
        ...currentPreferences,
        ...updateData.preferences
      };
      updates.push(`preferences = $${paramCount}`);
      values.push(JSON.stringify(updatedPreferences));
      paramCount++;
    }

    if (updateData.hasOwnProperty('googleId')) {
      updates.push(`google_id = $${paramCount}`);
      values.push(updateData.googleId);
      paramCount++;
    }

    if (updateData.hasOwnProperty('facebookId')) {
      updates.push(`facebook_id = $${paramCount}`);
      values.push(updateData.facebookId);
      paramCount++;
    }

    if (updateData.hasOwnProperty('googleData')) {
      updates.push(`google_data = $${paramCount}`);
      values.push(updateData.googleData ? JSON.stringify(updateData.googleData) : null);
      paramCount++;
    }

    if (updateData.hasOwnProperty('facebookData')) {
      updates.push(`facebook_data = $${paramCount}`);
      values.push(updateData.facebookData ? JSON.stringify(updateData.facebookData) : null);
      paramCount++;
    }

    if (updateData.hasOwnProperty('googleSigninEnabled')) {
      updates.push(`google_signin_enabled = $${paramCount}`);
      values.push(updateData.googleSigninEnabled);
      paramCount++;
    }

    if (updateData.hasOwnProperty('facebookSigninEnabled')) {
      updates.push(`facebook_signin_enabled = $${paramCount}`);
      values.push(updateData.facebookSigninEnabled);
      paramCount++;
    }

    if (updateData.privacySettings) {
      const currentPrivacy = currentUser.privacySettings || {};
      const updatedPrivacy = {
        ...currentPrivacy,
        ...updateData.privacySettings
      };
      updates.push(`privacy_settings = $${paramCount}`);
      values.push(JSON.stringify(updatedPrivacy));
      paramCount++;
    }

    if (updateData.notificationPreferences) {
      const currentNotifPref = (currentUser as any).notificationPreferences || {};
      const updatedNotifPref = {
        ...currentNotifPref,
        ...updateData.notificationPreferences
      };
      updates.push(`notification_preferences = $${paramCount}`);
      values.push(JSON.stringify(updatedNotifPref));
      paramCount++;
    }

    if (updates.length === 0) {
      return this.findById(userId);
    }

    values.push(userId);
    const query = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToUserProfile(result.rows[0]);
  }

  static async addRole(userId: string, role: string): Promise<void> {
    const query = `
      INSERT INTO user_roles (user_id, role)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role) DO NOTHING
    `;

    await db.query(query, [userId, role]);
  }

  static async removeRole(userId: string, role: string): Promise<void> {
    const query = 'DELETE FROM user_roles WHERE user_id = $1 AND role = $2';
    await db.query(query, [userId, role]);
  }

  static async setRoles(userId: string, roles: string[]): Promise<void> {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Delete existing roles
      await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);

      // Insert new roles
      if (roles.length > 0) {
        const values = roles.map((role, index) => `($1, $${index + 2})`).join(', ');
        const query = `INSERT INTO user_roles (user_id, role) VALUES ${values}`;
        await client.query(query, [userId, ...roles]);
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async getUserRoles(userId: string): Promise<string[]> {
    const query = 'SELECT role FROM user_roles WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    return result.rows.map(row => row.role);
  }

  /**
   * Check if a username is already taken (case-insensitive)
   */
  static async isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean> {
    const query = excludeUserId
      ? 'SELECT 1 FROM users WHERE LOWER(username) = LOWER($1) AND id != $2 LIMIT 1'
      : 'SELECT 1 FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1';
    const params = excludeUserId ? [username, excludeUserId] : [username];
    const result = await db.query(query, params);
    return result.rows.length > 0;
  }

  /**
   * Update username with 7-day cooldown enforcement
   * Returns: { success: boolean, error?: string, daysRemaining?: number }
   */
  static async updateUsername(userId: string, newUsername: string): Promise<{ success: boolean; error?: string; daysRemaining?: number }> {
    // Validate username format (1-30 chars, alphanumeric + underscore)
    const usernameRegex = /^[a-zA-Z0-9_]{1,30}$/;
    if (!usernameRegex.test(newUsername)) {
      return { success: false, error: 'Username must be 1-30 characters, alphanumeric and underscore only' };
    }

    // Check if username is taken
    const isTaken = await this.isUsernameTaken(newUsername, userId);
    if (isTaken) {
      return { success: false, error: 'Username is already taken' };
    }

    // Check cooldown (7 days)
    const cooldownQuery = 'SELECT username, username_last_changed FROM users WHERE id = $1';
    const cooldownResult = await db.query(cooldownQuery, [userId]);

    if (cooldownResult.rows.length === 0) {
      return { success: false, error: 'User not found' };
    }

    const { username: currentUsername, username_last_changed } = cooldownResult.rows[0];

    // If username is the same, no change needed
    if (currentUsername?.toLowerCase() === newUsername.toLowerCase()) {
      return { success: true };
    }

    if (username_last_changed) {
      const lastChanged = new Date(username_last_changed);
      const daysSinceChange = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceChange < 7) {
        const daysRemaining = Math.ceil(7 - daysSinceChange);
        return { success: false, error: `Username can only be changed once every 7 days`, daysRemaining };
      }
    }

    // Update username
    const updateQuery = 'UPDATE users SET username = $1, username_last_changed = NOW(), updated_at = NOW() WHERE id = $2';
    await db.query(updateQuery, [newUsername, userId]);

    return { success: true };
  }

  static async findAll(filters: { search?: string; limit?: number; offset?: number; roles?: string[]; status?: string; verificationStatus?: string } = {}): Promise<{ users: UserProfile[], total: number }> {
    const { search, limit = 20, offset = 0, roles, status, verificationStatus } = filters;
    const params: any[] = [];
    let whereClause = '';
    const conditions: string[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.email ILIKE $${params.length} OR u.profile->>'name' ILIKE $${params.length} OR u.username ILIKE $${params.length})`);
    }

    if (roles && roles.length > 0) {
      // Filter users who have at least one of the specified roles
      params.push(roles);
      conditions.push(`EXISTS (SELECT 1 FROM user_roles ur2 WHERE ur2.user_id = u.id AND ur2.role = ANY($${params.length}))`);
    }

    if (status) {
      // If status is specific (e.g. 'trashed', 'active'), filter by it.
      // If status is 'all', show everything EXCEPT trashed (unless specific trash view requested? No, 'all' usually means valid users).
      if (status === 'trashed') {
        params.push('trashed');
        conditions.push(`u.status = $${params.length}`);
      } else if (status !== 'all') {
        params.push(status);
        conditions.push(`u.status = $${params.length}`);
      } else {
        // status === 'all': exclude trashed by default to keep them hidden
        params.push('trashed');
        conditions.push(`u.status != $${params.length}`);
      }
    } else {
      // Default: exclude trashed
      params.push('trashed');
      conditions.push(`u.status != $${params.length}`);
    }

    if (verificationStatus) {
      if (verificationStatus === 'unverified') {
        conditions.push(`(u.verification_status != 'verified' OR u.verification_status IS NULL)`);
      } else {
        params.push(verificationStatus);
        conditions.push(`u.verification_status = $${params.length}`);
      }
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    const query = `
      SELECT u.*, array_agg(ur.role) as roles, count(*) OVER() as full_count
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      ${whereClause}
      GROUP BY u.id, u.cpf, u.email, u.username, u.username_last_changed, u.profile, u.privacy_settings, u.measurements, u.preferences, u.status, u.ban_expires_at, u.ban_reason, u.verification_status, u.last_seen_at, u.created_at, u.updated_at
      ORDER BY (
        NULLIF(u.profile->>'avatarUrl', '') IS NOT NULL 
        OR NULLIF(u.profile->>'profilePicture', '') IS NOT NULL 
        OR NULLIF(u.profile->>'image', '') IS NOT NULL 
        OR NULLIF(u.profile->>'profileImage', '') IS NOT NULL
        OR NULLIF(u.profile->>'bannerUrl', '') IS NOT NULL
      ) DESC, u.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return { users: [], total: 0 };
    }

    const total = parseInt(result.rows[0].full_count);
    const users = result.rows.map(row => this.mapToUserProfile(row));

    return { users, total };
  }

  /**
   * Search for users with aggregated statistics (followers, posts)
   * This is a public search endpoint.
   */
  static async searchPublicUsers(filters: { search?: string; limit?: number; offset?: number; roles?: string[]; verificationStatus?: string } = {}): Promise<{ users: UserProfile[], total: number }> {
    const { search, limit = 20, offset = 0, roles, verificationStatus } = filters;
    const params: any[] = [];
    let whereClause = '';
    const conditions: string[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.email ILIKE $${params.length} OR u.profile->>'name' ILIKE $${params.length} OR u.username ILIKE $${params.length})`);
    }

    if (roles && roles.length > 0) {
      params.push(roles);
      conditions.push(`EXISTS (SELECT 1 FROM user_roles ur2 WHERE ur2.user_id = u.id AND ur2.role = ANY($${params.length}))`);
    }

    if (verificationStatus) {
      params.push(verificationStatus);
      conditions.push(`u.verification_status = $${params.length}`);
    }

    // Always filter for active users in public search
    params.push('active');
    conditions.push(`u.status = $${params.length}`);

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    const query = `
      SELECT u.*, 
             array_agg(DISTINCT ur.role) as roles, 
             count(*) OVER() as full_count,
             (SELECT COUNT(*)::int FROM user_follows uf WHERE uf.following_id = u.id AND uf.status = 'accepted') as followers_count,
             (SELECT COUNT(*)::int FROM social_posts sp WHERE sp.user_id = u.id AND sp.visibility = 'public') as posts_count
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      ${whereClause}
      GROUP BY u.id, u.cpf, u.email, u.username, u.username_last_changed, u.profile, u.privacy_settings, u.measurements, u.preferences, u.status, u.ban_expires_at, u.ban_reason, u.verification_status, u.last_seen_at, u.created_at, u.updated_at
      ORDER BY followers_count DESC, u.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return { users: [], total: 0 };
    }

    const total = parseInt(result.rows[0].full_count);
    const users = result.rows.map(row => {
      const user = this.mapToUserProfile(row);
      return {
        ...user,
        stats: {
          followers: row.followers_count || 0,
          posts: row.posts_count || 0
        }
      };
    });

    return { users, total };
  }

  public static mapToUserProfile(row: any): UserProfile {
    const profile = typeof row.profile === 'string' ? JSON.parse(row.profile) : row.profile;
    const measurements = row.measurements ? (typeof row.measurements === 'string' ? JSON.parse(row.measurements) : row.measurements) : {};
    const preferences = row.preferences ? (typeof row.preferences === 'string' ? JSON.parse(row.preferences) : row.preferences) : {};
    const notificationPreferences = row.notification_preferences ? (typeof row.notification_preferences === 'string' ? JSON.parse(row.notification_preferences) : row.notification_preferences) : {
      showNotificationBadge: true,
      showMessageBadge: true
    };
    const privacySettings = row.privacy_settings ? (typeof row.privacy_settings === 'string' ? JSON.parse(row.privacy_settings) : row.privacy_settings) : {
      height: 'private',
      weight: 'private',
      birthDate: 'private',
      gender: 'public',
      country: 'public',
      state: 'public',
      city: 'public',
      wardrobe: 'public',
      likedItems: 'public',
      wishlist: 'public',
      posts: 'public',
      telephone: 'private'
    };

    return {
      id: row.id,
      cpf: row.cpf,
      email: row.email,
      username: row.username,
      usernameLastChanged: row.username_last_changed ? new Date(row.username_last_changed) : undefined,
      personalInfo: {
        name: profile.name,
        birthDate: profile.birthDate ? new Date(profile.birthDate) : undefined,
        location: profile.location || {},
        gender: profile.gender,
        genderOther: profile.genderOther,
        bodyType: profile.bodyType,
        avatarUrl: profile.avatarUrl || profile.profilePicture || profile.image || profile.profileImage,
        bio: profile.bio,
        telephone: profile.telephone,
        contactEmail: profile.contactEmail,
      },
      measurements: measurements,
      preferences: preferences,
      privacySettings: privacySettings,
      badges: [],
      socialLinks: profile.socialLinks || [],
      roles: row.roles ? row.roles.filter((role: string) => role !== null) : [],
      status: row.status || 'active',
      verificationStatus: (row.roles && row.roles.includes('admin')) ? 'verified' : (row.verification_status || 'unverified'),
      banExpiresAt: row.ban_expires_at ? new Date(row.ban_expires_at) : undefined,
      lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      googleId: row.google_id,
      facebookId: row.facebook_id,
      googleData: typeof row.google_data === 'string' ? JSON.parse(row.google_data) : row.google_data,
      facebookData: typeof row.facebook_data === 'string' ? JSON.parse(row.facebook_data) : row.facebook_data,
      googleSigninEnabled: row.google_signin_enabled,
      facebookSigninEnabled: row.facebook_signin_enabled,
      emailVerified: row.email_verified,
      notificationPreferences: notificationPreferences,
      _rawProfile: profile,
    } as any;
  }

  static async updateStatus(userId: string, status: string, banExpiresAt?: Date, banReason?: string): Promise<void> {
    const query = `
      UPDATE users 
      SET status = $1, 
          ban_expires_at = $2,
          ban_reason = $3,
          updated_at = NOW()
      WHERE id = $4
    `;
    await db.query(query, [status, banExpiresAt || null, banReason || null, userId]);
  }

  static async moveToTrash(userId: string): Promise<void> {
    return this.updateStatus(userId, 'trashed');
  }

  static async restore(userId: string): Promise<void> {
    return this.updateStatus(userId, 'active');
  }

  static async delete(userId: string): Promise<boolean> {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM brand_accounts WHERE user_id = $1', [userId]);
      const result = await client.query('DELETE FROM users WHERE id = $1', [userId]);
      await client.query('COMMIT');
      return (result.rowCount || 0) > 0;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Update user verification status
   */
  static async updateVerificationStatus(
    userId: string,
    status: 'unverified' | 'pending' | 'verified' | 'rejected'
  ): Promise<void> {
    const query = `
      UPDATE users 
      SET verification_status = $1, updated_at = NOW()
      WHERE id = $2
    `;
    await db.query(query, [status, userId]);
  }

  /**
   * Get user verification status
   */
  static async getVerificationStatus(userId: string): Promise<string | null> {
    const query = 'SELECT verification_status FROM users WHERE id = $1';
    const result = await db.query(query, [userId]);
    if (result.rows.length === 0) return null;
    return result.rows[0].verification_status || 'unverified';
  }

  static async findByVerificationToken(token: string): Promise<UserProfile | null> {
    const query = `
      SELECT u.*, array_agg(ur.role) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.email_verification_token = $1
      GROUP BY u.id, u.cpf, u.email, u.username, u.username_last_changed, u.profile, u.privacy_settings, u.measurements, u.preferences, u.status, u.ban_expires_at, u.ban_reason, u.verification_status, u.last_seen_at, u.created_at, u.updated_at
    `;

    const result = await db.query(query, [token]);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToUserProfile(result.rows[0]);
  }

  static async verifyEmail(userId: string): Promise<void> {
    const query = `
      UPDATE users 
      SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires_at = NULL, updated_at = NOW()
      WHERE id = $1
    `;
    await db.query(query, [userId]);
  }

  static async updateVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    const query = `
      UPDATE users 
      SET email_verification_token = $1, email_verification_expires_at = $2, updated_at = NOW()
      WHERE id = $3
    `;
    await db.query(query, [token, expiresAt, userId]);
  }
}
