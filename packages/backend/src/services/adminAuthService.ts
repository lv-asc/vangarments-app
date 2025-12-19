import { UserModel } from '../models/User';
import { AuthUtils } from '../utils/auth';
import { UserProfile } from '@vangarments/shared';

export interface AdminAuthResult {
  user: UserProfile;
  token: string;
  isAdmin: boolean;
  permissions: string[];
}

export interface AdminUserCreationData {
  email: string;
  password: string;
  name: string;
  cpf?: string;
}

export class AdminAuthService {
  /**
   * Authenticate admin user with enhanced privileges check
   */
  static async authenticateAdmin(email: string, password: string): Promise<AdminAuthResult | null> {
    try {
      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return null;
      }

      // Verify password
      const passwordHash = await UserModel.getPasswordHash(user.id);
      if (!passwordHash) {
        return null;
      }

      const isValidPassword = await AuthUtils.comparePassword(password, passwordHash);
      if (!isValidPassword) {
        return null;
      }

      // Get user roles
      const roles = await UserModel.getUserRoles(user.id);
      const isAdmin = roles.includes('admin');

      // Generate JWT token with admin privileges
      const token = AuthUtils.generateToken({
        id: user.id,
        userId: user.id,
        email: user.email,
        roles,
      });

      // Define admin permissions
      const permissions = this.getAdminPermissions(roles);

      return {
        user,
        token,
        isAdmin,
        permissions,
      };
    } catch (error) {
      console.error('Admin authentication error:', error);
      return null;
    }
  }

  /**
   * Create admin user with full system privileges
   */
  static async createAdminUser(adminData: AdminUserCreationData): Promise<UserProfile> {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findByEmail(adminData.email);
      if (existingUser) {
        throw new Error(`User with email ${adminData.email} already exists`);
      }

      // Hash password
      const passwordHash = await AuthUtils.hashPassword(adminData.password);

      // Create user
      const user = await UserModel.create({
        email: adminData.email,
        passwordHash,
        name: adminData.name,
        birthDate: new Date('1990-01-01'), // Default birth date
        gender: 'other',
        cpf: adminData.cpf || '00000000000', // Default CPF for admin
        username: adminData.email.split('@')[0], // Default username
        telephone: '0000000000', // Default telephone for admin
      });

      // Add admin role
      await UserModel.addRole(user.id, 'admin');

      // Add consumer role for basic functionality
      await UserModel.addRole(user.id, 'consumer');

      console.log(`✅ Admin user created: ${adminData.email}`);
      return user;
    } catch (error) {
      console.error('Admin user creation error:', error);
      throw error;
    }
  }

  /**
   * Grant admin privileges to existing user
   */
  static async grantAdminPrivileges(userId: string): Promise<void> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      const roles = await UserModel.getUserRoles(userId);

      if (!roles.includes('admin')) {
        await UserModel.addRole(userId, 'admin');
        console.log(`✅ Admin privileges granted to user: ${user.email}`);
      } else {
        console.log(`ℹ️ User ${user.email} already has admin privileges`);
      }
    } catch (error) {
      console.error('Grant admin privileges error:', error);
      throw error;
    }
  }

  /**
   * Revoke admin privileges from user
   */
  static async revokeAdminPrivileges(userId: string): Promise<void> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      await UserModel.removeRole(userId, 'admin');
      console.log(`✅ Admin privileges revoked from user: ${user.email}`);
    } catch (error) {
      console.error('Revoke admin privileges error:', error);
      throw error;
    }
  }

  /**
   * Check if user has admin privileges
   */
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const roles = await UserModel.getUserRoles(userId);
      return roles.includes('admin');
    } catch (error) {
      console.error('Admin check error:', error);
      return false;
    }
  }

  /**
   * Get all admin users
   */
  static async getAdminUsers(): Promise<UserProfile[]> {
    try {
      // This would need a custom query in UserModel, for now we'll implement it here
      const { db } = require('../database/connection');

      const query = `
        SELECT u.*, array_agg(ur.role) as roles
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.role = 'admin'
        GROUP BY u.id, u.cpf, u.email, u.profile, u.measurements, u.preferences, u.created_at, u.updated_at
        ORDER BY u.created_at
      `;

      const result = await db.query(query);

      return result.rows.map((row: any) => {
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
          badges: [],
          socialLinks: [],
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        };
      });
    } catch (error) {
      console.error('Get admin users error:', error);
      throw error;
    }
  }

  /**
   * Initialize default admin user "lv"
   */
  static async initializeDefaultAdmin(): Promise<UserProfile> {
    const defaultAdminData: AdminUserCreationData = {
      email: 'lv@vangarments.com',
      password: 'admin123', // Should be changed in production
      name: 'lv',
      cpf: '00000000000',
    };

    try {
      // Check if admin already exists
      const existingAdmin = await UserModel.findByEmail(defaultAdminData.email);
      if (existingAdmin) {
        // Ensure admin role is assigned
        const roles = await UserModel.getUserRoles(existingAdmin.id);
        if (!roles.includes('admin')) {
          await UserModel.addRole(existingAdmin.id, 'admin');
          console.log(`✅ Admin role added to existing user: ${defaultAdminData.email}`);
        }
        return existingAdmin;
      }

      // Create new admin user
      return await this.createAdminUser(defaultAdminData);
    } catch (error) {
      console.error('Initialize default admin error:', error);
      throw error;
    }
  }

  /**
   * Get admin permissions based on roles
   */
  private static getAdminPermissions(roles: string[]): string[] {
    const permissions: string[] = [];

    if (roles.includes('admin')) {
      permissions.push(
        'system:configure',
        'users:manage',
        'vufs:edit',
        'marketplace:moderate',
        'content:moderate',
        'analytics:view',
        'system:backup',
        'system:restore',
        'roles:assign',
        'permissions:manage'
      );
    }

    if (roles.includes('consumer')) {
      permissions.push(
        'wardrobe:create',
        'wardrobe:edit',
        'marketplace:buy',
        'social:post',
        'profile:edit'
      );
    }

    if (roles.includes('brand_owner')) {
      permissions.push(
        'brand:manage',
        'catalog:edit',
        'marketplace:sell',
        'analytics:brand'
      );
    }

    return permissions;
  }

  /**
   * Validate admin access for configuration changes
   */
  static async validateAdminAccess(userId: string, action: string): Promise<boolean> {
    try {
      const isAdmin = await this.isAdmin(userId);
      if (!isAdmin) {
        return false;
      }

      const roles = await UserModel.getUserRoles(userId);
      const permissions = this.getAdminPermissions(roles);

      // Check if user has permission for the specific action
      const actionPermissionMap: { [key: string]: string } = {
        'configure_vufs': 'vufs:edit',
        'manage_users': 'users:manage',
        'system_config': 'system:configure',
        'moderate_content': 'content:moderate',
        'view_analytics': 'analytics:view',
      };

      const requiredPermission = actionPermissionMap[action];
      return requiredPermission ? permissions.includes(requiredPermission) : true;
    } catch (error) {
      console.error('Validate admin access error:', error);
      return false;
    }
  }
}