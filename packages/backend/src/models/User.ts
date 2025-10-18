import { db } from '../database/connection';
import { UserProfile, UserMeasurements, FashionPreferences, Location } from '@vangarments/shared';

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
      GROUP BY u.id, u.cpf, u.email, u.profile, u.measurements, u.preferences, u.created_at, u.updated_at
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
      GROUP BY u.id, u.cpf, u.email, u.profile, u.measurements, u.preferences, u.created_at, u.updated_at
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
      GROUP BY u.id, u.cpf, u.email, u.profile, u.measurements, u.preferences, u.created_at, u.updated_at
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

    if (updateData.name || updateData.location) {
      // Update profile JSON
      const currentUser = await this.findById(userId);
      if (!currentUser) return null;

      const updatedProfile = {
        ...currentUser.personalInfo,
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.location && { location: updateData.location }),
      };

      updates.push(`profile = $${paramCount}`);
      values.push(JSON.stringify(updatedProfile));
      paramCount++;
    }

    if (updateData.measurements) {
      updates.push(`measurements = $${paramCount}`);
      values.push(JSON.stringify(updateData.measurements));
      paramCount++;
    }

    if (updateData.preferences) {
      updates.push(`preferences = $${paramCount}`);
      values.push(JSON.stringify(updateData.preferences));
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

  static async getUserRoles(userId: string): Promise<string[]> {
    const query = 'SELECT role FROM user_roles WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    return result.rows.map(row => row.role);
  }



  private static mapToUserProfile(row: any): UserProfile & { roles?: string[] } {
    const profile = typeof row.profile === 'string' ? JSON.parse(row.profile) : row.profile;
    const measurements = row.measurements ? 
      (typeof row.measurements === 'string' ? JSON.parse(row.measurements) : row.measurements) : {};
    const preferences = row.preferences ? 
      (typeof row.preferences === 'string' ? JSON.parse(row.preferences) : row.preferences) : {};

    return {
      id: row.id,
      cpf: row.cpf,
      email: row.email,
      personalInfo: {
        name: profile.name,
        birthDate: new Date(profile.birthDate),
        location: profile.location || {},
        gender: profile.gender,
      },
      measurements: measurements,
      preferences: preferences,
      badges: [], // Will be populated when badge system is implemented
      socialLinks: [], // Will be populated when social features are implemented
      roles: row.roles ? row.roles.filter((role: string) => role !== null) : [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}