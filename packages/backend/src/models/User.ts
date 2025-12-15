import { db } from '../database/connection';
import { UserProfile, UserMeasurements, FashionPreferences, Location, SocialLink } from '@vangarments/shared';

export interface CreateUserData {
  cpf?: string; // Optional for OAuth users
  email: string;
  passwordHash?: string; // Optional for OAuth users
  name: string;
  birthDate: Date;
  gender: string;
  location?: Location;
}



export interface UpdateUserData {
  name?: string;
  location?: Location;
  measurements?: UserMeasurements;
  preferences?: FashionPreferences;
  profile?: any;
  socialLinks?: SocialLink[];
  privacySettings?: {
    height: boolean;
    weight: boolean;
    birthDate: boolean;
  };
}

export class UserModel {
  static async create(userData: CreateUserData): Promise<UserProfile> {
    const { cpf, email, passwordHash, name, birthDate, gender, location } = userData;

    const profile = {
      name,
      birthDate: birthDate.toISOString(),
      gender,
      location: location || {},
    };

    const query = `
      INSERT INTO users (cpf, email, password_hash, profile)
      VALUES ($1, $2, $3, $4)
      RETURNING id, cpf, email, profile, measurements, preferences, created_at, updated_at
    `;

    const result = await db.query(query, [cpf || null, email, passwordHash || null, JSON.stringify(profile)]);
    const user = result.rows[0];

    return this.mapToUserProfile(user);
  }

  static async findById(id: string): Promise<UserProfile | null> {
    const query = `
      SELECT u.*, array_agg(ur.role) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = $1
      GROUP BY u.id, u.cpf, u.email, u.username, u.username_last_changed, u.profile, u.privacy_settings, u.measurements, u.preferences, u.created_at, u.updated_at
    `;

    const result = await db.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToUserProfile(result.rows[0]);
  }

  static async findByEmail(email: string): Promise<UserProfile | null> {
    const query = `
      SELECT u.*, array_agg(ur.role) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.email = $1
      GROUP BY u.id, u.cpf, u.email, u.username, u.username_last_changed, u.profile, u.privacy_settings, u.measurements, u.preferences, u.created_at, u.updated_at
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

    if (updates.length === 0) {
      return this.findById(userId);
    }

    values.push(userId);
    const query = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING id, cpf, email, profile, measurements, preferences, created_at, updated_at
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

  static async findAll(filters: { search?: string; limit?: number; offset?: number } = {}): Promise<{ users: UserProfile[], total: number }> {
    const { search, limit = 20, offset = 0 } = filters;
    const params: any[] = [];
    let whereClause = '';

    if (search) {
      params.push(`%${search}%`);
      whereClause = `WHERE u.email ILIKE $${params.length} OR u.profile->>'name' ILIKE $${params.length}`;
    }

    const query = `
      SELECT u.*, array_agg(ur.role) as roles, count(*) OVER() as full_count
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      ${whereClause}
      GROUP BY u.id, u.cpf, u.email, u.username, u.username_last_changed, u.profile, u.privacy_settings, u.measurements, u.preferences, u.status, u.ban_expires_at, u.ban_reason, u.created_at, u.updated_at
      ORDER BY u.created_at DESC
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

  private static mapToUserProfile(row: any): UserProfile {
    const profile = typeof row.profile === 'string' ? JSON.parse(row.profile) : row.profile;
    const measurements = row.measurements ?
      (typeof row.measurements === 'string' ? JSON.parse(row.measurements) : row.measurements) : {};
    const preferences = row.preferences ?
      (typeof row.preferences === 'string' ? JSON.parse(row.preferences) : row.preferences) : {};
    const privacySettings = row.privacy_settings ?
      (typeof row.privacy_settings === 'string' ? JSON.parse(row.privacy_settings) : row.privacy_settings) : { height: false, weight: false, birthDate: false };

    return {
      id: row.id,
      cpf: row.cpf,
      email: row.email,
      username: row.username,
      usernameLastChanged: row.username_last_changed ? new Date(row.username_last_changed) : undefined,
      personalInfo: {
        name: profile.name,
        birthDate: new Date(profile.birthDate),
        location: profile.location || {},
        gender: profile.gender,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
      },
      measurements: measurements,
      preferences: preferences,
      privacySettings: privacySettings,
      badges: [], // Will be populated when badge system is implemented
      socialLinks: profile.socialLinks || [],
      roles: row.roles ? row.roles.filter((role: string) => role !== null) : [],
      status: row.status || 'active',
      banExpiresAt: row.ban_expires_at ? new Date(row.ban_expires_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      _rawProfile: profile,
    } as UserProfile & { roles?: string[], _rawProfile?: any, username?: string, usernameLastChanged?: Date, status: string, banExpiresAt?: Date };
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

  static async delete(userId: string): Promise<boolean> {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Delete user roles first (foreign key constraint)
      await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);

      // Delete brand accounts (if any)
      await client.query('DELETE FROM brand_accounts WHERE user_id = $1', [userId]);

      // Delete the user
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
}