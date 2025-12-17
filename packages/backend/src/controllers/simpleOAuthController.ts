import { Request, Response } from 'express';
import { AuthUtils } from '../utils/auth';
import { UserModel } from '../models/User';

export class SimpleOAuthController {
  /**
   * Initiate Google OAuth
   */
  static initiateGoogleAuth(req: Request, res: Response) {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.GOOGLE_CALLBACK_URL || '')}&` +
      `response_type=code&` +
      `scope=email profile&` +
      `access_type=offline`;

    res.redirect(googleAuthUrl);
  }

  /**
   * Handle Google OAuth callback
   */
  static async handleGoogleCallback(req: Request, res: Response) {
    try {
      const { code } = req.query;

      if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: process.env.GOOGLE_CALLBACK_URL || '',
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      // Get user info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const googleUser = await userResponse.json();

      if (!googleUser.email) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_email`);
      }

      // Check if user exists
      let user = await UserModel.findByEmail(googleUser.email);

      if (!user) {
        // Create new user with OAuth data
        // Create new user with OAuth data
        user = await UserModel.create({
          email: googleUser.email,
          name: googleUser.name || 'Google User',
          birthDate: new Date(), // Will be updated during onboarding
          gender: 'not_specified', // Will be updated during onboarding
          username: googleUser.email.split('@')[0] + Math.floor(Math.random() * 1000), // Temp username
        });

        // Add default consumer role
        await UserModel.addRole(user.id, 'consumer');
      }

      // Generate JWT token
      const roles = await UserModel.getUserRoles(user.id);
      const token = AuthUtils.generateToken({
        id: user.id,
        userId: user.id,
        email: user.email,
        roles,
      });

      // Check if user needs onboarding
      const needsOnboarding = !user.cpf || !user.personalInfo.birthDate;

      const redirectUrl = needsOnboarding
        ? `${process.env.FRONTEND_URL}/onboarding?token=${token}&provider=google`
        : `${process.env.FRONTEND_URL}/dashboard?token=${token}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_error`);
    }
  }

  /**
   * Initiate Facebook OAuth
   */
  static initiateFacebookAuth(req: Request, res: Response) {
    const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${process.env.FACEBOOK_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.FACEBOOK_CALLBACK_URL || '')}&` +
      `response_type=code&` +
      `scope=email`;

    res.redirect(facebookAuthUrl);
  }

  /**
   * Handle Facebook OAuth callback
   */
  static async handleFacebookCallback(req: Request, res: Response) {
    try {
      const { code } = req.query;

      if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.FACEBOOK_APP_ID || '',
          client_secret: process.env.FACEBOOK_APP_SECRET || '',
          code: code as string,
          redirect_uri: process.env.FACEBOOK_CALLBACK_URL || '',
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      // Get user info from Facebook
      const userResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${tokenData.access_token}`);
      const facebookUser = await userResponse.json();

      if (!facebookUser.email) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_email`);
      }

      // Check if user exists
      let user = await UserModel.findByEmail(facebookUser.email);

      if (!user) {
        // Create new user with OAuth data
        // Create new user with OAuth data
        user = await UserModel.create({
          email: facebookUser.email,
          name: facebookUser.name || 'Facebook User',
          birthDate: new Date(), // Will be updated during onboarding
          gender: 'not_specified', // Will be updated during onboarding
          username: facebookUser.email.split('@')[0] + Math.floor(Math.random() * 1000), // Temp username
        });

        // Add default consumer role
        await UserModel.addRole(user.id, 'consumer');
      }

      // Generate JWT token
      const roles = await UserModel.getUserRoles(user.id);
      const token = AuthUtils.generateToken({
        id: user.id,
        userId: user.id,
        email: user.email,
        roles,
      });

      // Check if user needs onboarding
      const needsOnboarding = !user.cpf || !user.personalInfo.birthDate;

      const redirectUrl = needsOnboarding
        ? `${process.env.FRONTEND_URL}/onboarding?token=${token}&provider=facebook`
        : `${process.env.FRONTEND_URL}/dashboard?token=${token}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Facebook OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_error`);
    }
  }

  /**
   * Handle OAuth failure
   */
  static handleOAuthFailure(req: Request, res: Response) {
    console.error('OAuth authentication failed:', req.query.error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
}