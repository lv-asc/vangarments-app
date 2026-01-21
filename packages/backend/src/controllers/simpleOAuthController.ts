import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
import { AuthUtils } from '../utils/auth';
import { UserModel } from '../models/User';

export class SimpleOAuthController {
  /**
   * Initiate Google OAuth
   */
  static initiateGoogleAuth(req: Request, res: Response) {
    const action = req.path.includes('/signup') ? 'signup' : 'login';

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.GOOGLE_CALLBACK_URL || '')}&` +
      `response_type=code&` +
      `scope=email profile&` +
      `state=${action}&` +
      `prompt=select_account&` +
      `access_type=offline`;

    res.redirect(googleAuthUrl);
  }

  /**
   * Handle Google OAuth callback
   */
  static async handleGoogleCallback(req: Request, res: Response) {
    try {
      const { code, state: action } = req.query;

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

      if (!googleUser.email || !googleUser.id) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_email`);
      }

      // 1. Try to find by Google ID first
      let user = await UserModel.findByGoogleId(googleUser.id);

      if (user && (user as any).googleSigninEnabled === false) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_signin_disabled`);
      }

      // 2. If not found, try to find by email
      if (!user) {
        user = await UserModel.findByEmail(googleUser.email);

        if (user) {
          // Link existing user to Google ID and data
          await UserModel.update(user.id, {
            googleId: googleUser.id,
            googleData: {
              email: googleUser.email,
              name: googleUser.name,
              picture: googleUser.picture
            }
          });
        }
      }

      // Handle action specific logic
      if (action === 'signup' && user) {
        // User tried to signup but already exists
        return res.redirect(`${process.env.FRONTEND_URL}/register?error=account_exists`);
      }

      if (action === 'login' && !user) {
        // User tried to login but doesn't exist
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=account_not_found`);
      }

      if (!user) {
        // 3. Create new user with OAuth data
        user = await UserModel.create({
          email: googleUser.email,
          name: googleUser.name || 'Google User',
          birthDate: new Date(), // Will be updated during onboarding
          gender: 'not_specified', // Will be updated during onboarding
          username: googleUser.email.split('@')[0] + Math.floor(Math.random() * 1000), // Temp username
          telephone: '', // Will be updated during onboarding
          googleId: googleUser.id,
          googleData: {
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture
          }
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
        : `${process.env.FRONTEND_URL}/wardrobe?token=${token}`;

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
    const action = req.path.includes('/signup') ? 'signup' : 'login';

    const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${process.env.FACEBOOK_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.FACEBOOK_CALLBACK_URL || '')}&` +
      `response_type=code&` +
      `state=${action}&` +
      `scope=email`;

    res.redirect(facebookAuthUrl);
  }

  /**
   * Handle Facebook OAuth callback
   */
  static async handleFacebookCallback(req: Request, res: Response) {
    try {
      const { code, state: action } = req.query;

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

      // Handle action specific logic
      if (action === 'signup' && user) {
        // User tried to signup but already exists
        return res.redirect(`${process.env.FRONTEND_URL}/register?error=account_exists`);
      }

      if (action === 'login' && !user) {
        // User tried to login but doesn't exist
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=account_not_found`);
      }

      if (!user) {
        // Create new user with OAuth data
        // Create new user with OAuth data
        user = await UserModel.create({
          email: facebookUser.email,
          name: facebookUser.name || 'Facebook User',
          birthDate: new Date(), // Will be updated during onboarding
          gender: 'not_specified', // Will be updated during onboarding
          username: facebookUser.email.split('@')[0] + Math.floor(Math.random() * 1000), // Temp username
          telephone: '', // Will be updated during onboarding
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
        : `${process.env.FRONTEND_URL}/wardrobe?token=${token}`;

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

  /**
   * Initiate Google Connect (for logged in users)
   */
  static initiateGoogleConnect(req: Request, res: Response) {
    // Pass the user ID in the state parameter to verify ownership on callback
    // In a production app, this should be a signed/encrypted token
    const state = req.query.userId as string;

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.GOOGLE_CALLBACK_URL?.replace('/callback', '/connect/callback') || '')}&` +
      `response_type=code&` +
      `scope=email profile&` +
      `state=${state}&` +
      `access_type=offline`;

    res.redirect(googleAuthUrl);
  }

  /**
   * Handle Google Connect callback
   */
  static async handleGoogleConnectCallback(req: Request, res: Response) {
    try {
      const { code, state: userId } = req.query;

      if (!code || !userId) {
        return res.redirect(`${process.env.FRONTEND_URL}/settings?error=connect_failed`);
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
          redirect_uri: process.env.GOOGLE_CALLBACK_URL?.replace('/callback', '/connect/callback') || '',
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        return res.redirect(`${process.env.FRONTEND_URL}/settings?error=connect_failed`);
      }

      // Get user info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const googleUser = await userResponse.json();

      if (!googleUser.id) {
        return res.redirect(`${process.env.FRONTEND_URL}/settings?error=no_google_id`);
      }

      // Check if this Google ID is already used by another user
      const existingUser = await UserModel.findByGoogleId(googleUser.id);
      if (existingUser && existingUser.id !== userId) {
        return res.redirect(`${process.env.FRONTEND_URL}/settings?error=google_id_taken`);
      }

      // Link Google ID and data to user
      await UserModel.update(userId as string, {
        googleId: googleUser.id,
        googleData: {
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture
        }
      });

      res.redirect(`${process.env.FRONTEND_URL}/settings?success=google_connected`);
    } catch (error) {
      console.error('Google Connect callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/settings?error=connect_error`);
    }
  }

  /**
   * Initiate Facebook Connect (for logged in users)
   */
  static initiateFacebookConnect(req: Request, res: Response) {
    console.log('Initiating Facebook Connect for userId:', req.query.userId);
    const state = req.query.userId as string;

    if (!process.env.FACEBOOK_APP_ID) {
      console.error('FACEBOOK_APP_ID is missing');
      return res.redirect(`${process.env.FRONTEND_URL}/settings?error=config_missing`);
    }

    const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${process.env.FACEBOOK_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.FACEBOOK_CALLBACK_URL?.replace('/callback', '/connect/callback') || '')}&` +
      `response_type=code&` +
      `state=${state}&` +
      `scope=email`;

    console.log('Redirecting to Facebook:', facebookAuthUrl);
    res.redirect(facebookAuthUrl);
  }

  /**
   * Handle Facebook Connect callback
   */
  static async handleFacebookConnectCallback(req: Request, res: Response) {
    try {
      const { code, state: userId } = req.query;
      console.log('Handling Facebook Connect Callback for userId:', userId);

      if (!code || !userId) {
        console.error('Missing code or userId in callback');
        return res.redirect(`${process.env.FRONTEND_URL}/settings?error=connect_failed`);
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
          redirect_uri: process.env.FACEBOOK_CALLBACK_URL?.replace('/callback', '/connect/callback') || '',
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        return res.redirect(`${process.env.FRONTEND_URL}/settings?error=connect_failed`);
      }

      // Get user info from Facebook
      const userResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`);
      const facebookUser = await userResponse.json();

      if (!facebookUser.id) {
        return res.redirect(`${process.env.FRONTEND_URL}/settings?error=no_facebook_id`);
      }

      // Check if this Facebook ID is already used by another user
      const existingUser = await UserModel.findByFacebookId(facebookUser.id);
      if (existingUser && existingUser.id !== userId) {
        return res.redirect(`${process.env.FRONTEND_URL}/settings?error=facebook_id_taken`);
      }

      // Link Facebook ID and data to user
      await UserModel.update(userId as string, {
        facebookId: facebookUser.id,
        facebookData: {
          email: facebookUser.email,
          name: facebookUser.name,
          picture: facebookUser.picture?.data?.url
        }
      });

      res.redirect(`${process.env.FRONTEND_URL}/settings?success=facebook_connected`);
    } catch (error) {
      console.error('Facebook Connect callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/settings?error=connect_error`);
    }
  }

  static async disconnectOAuth(req: AuthenticatedRequest, res: Response) {
    try {
      const { provider } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const updateData: any = {};
      if (provider === 'google') {
        updateData.googleId = null;
        updateData.googleData = null;
      } else if (provider === 'facebook') {
        updateData.facebookId = null;
        updateData.facebookData = null;
      } else {
        return res.status(400).json({ error: 'Invalid provider' });
      }

      await UserModel.update(userId, updateData);

      res.json({ message: `${provider} disconnected successfully` });
    } catch (error) {
      console.error('OAuth disconnection error:', error);
      res.status(500).json({ error: 'Failed to disconnect account' });
    }
  }
}