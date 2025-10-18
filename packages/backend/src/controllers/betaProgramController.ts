import { Request, Response } from 'express';
import { BetaProgramService } from '../services/betaProgramService';
import { BetaProgramModel } from '../models/BetaProgram';

export class BetaProgramController {
  static async joinBetaProgram(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { participantType, referralCode } = req.body;

      if (!participantType) {
        return res.status(400).json({ error: 'Participant type is required' });
      }

      let invitedBy: string | undefined;
      if (referralCode) {
        const referrer = await BetaProgramModel.findByReferralCode(referralCode);
        if (referrer) {
          invitedBy = referrer.userId;
        }
      }

      const participant = await BetaProgramService.joinBetaProgram(
        userId,
        participantType,
        invitedBy
      );

      res.status(201).json({
        message: 'Successfully joined beta program',
        participant,
      });
    } catch (error) {
      console.error('Error joining beta program:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getBetaStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const participant = await BetaProgramModel.findByUserId(userId);
      
      if (!participant) {
        return res.status(404).json({ 
          error: 'User is not a beta participant',
          isBetaParticipant: false 
        });
      }

      res.json({
        isBetaParticipant: true,
        participant,
      });
    } catch (error) {
      console.error('Error getting beta status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getBetaAnalytics(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const analytics = await BetaProgramService.getBetaAnalytics(userId);
      
      res.json({ analytics });
    } catch (error) {
      console.error('Error getting beta analytics:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async submitFeedback(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { feedbackType, title, description, priority, attachments } = req.body;

      if (!feedbackType || !title || !description) {
        return res.status(400).json({ 
          error: 'Feedback type, title, and description are required' 
        });
      }

      const feedback = await BetaProgramService.submitFeedback(userId, {
        feedbackType,
        title,
        description,
        priority,
        attachments,
      });

      res.status(201).json({
        message: 'Feedback submitted successfully',
        feedback,
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getExclusiveContent(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const content = await BetaProgramService.getExclusiveContent(userId);
      
      res.json({ content });
    } catch (error) {
      console.error('Error getting exclusive content:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getBetaLeaderboard(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify user is beta participant
      const participant = await BetaProgramModel.findByUserId(userId);
      if (!participant) {
        return res.status(403).json({ error: 'Beta participant access required' });
      }

      const leaderboard = await BetaProgramService.getBetaLeaderboard();
      
      res.json({ leaderboard });
    } catch (error) {
      console.error('Error getting beta leaderboard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getNetworkVisibility(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const networkData = await BetaProgramService.getNetworkVisibility(userId);
      
      res.json({ networkData });
    } catch (error) {
      console.error('Error getting network visibility:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getFeedbackHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const participant = await BetaProgramModel.findByUserId(userId);
      if (!participant) {
        return res.status(403).json({ error: 'Beta participant access required' });
      }

      const { status, limit = 20, offset = 0 } = req.query;

      const { feedback, total } = await BetaProgramModel.getFeedback(
        participant.id,
        status as string,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.json({
        feedback,
        total,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: total > parseInt(offset as string) + parseInt(limit as string),
        },
      });
    } catch (error) {
      console.error('Error getting feedback history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getBetaStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify user has admin privileges or is industry leader
      const participant = await BetaProgramModel.findByUserId(userId);
      if (!participant || participant.participantType !== 'industry_leader') {
        return res.status(403).json({ error: 'Industry leader access required' });
      }

      const stats = await BetaProgramModel.getBetaStats();
      
      res.json({ stats });
    } catch (error) {
      console.error('Error getting beta stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async validateReferralCode(req: Request, res: Response) {
    try {
      const { referralCode } = req.params;

      if (!referralCode) {
        return res.status(400).json({ error: 'Referral code is required' });
      }

      const referrer = await BetaProgramModel.findByReferralCode(referralCode);
      
      if (!referrer) {
        return res.status(404).json({ 
          valid: false, 
          error: 'Invalid referral code' 
        });
      }

      res.json({
        valid: true,
        referrer: {
          participantType: referrer.participantType,
          joinedAt: referrer.joinedAt,
        },
      });
    } catch (error) {
      console.error('Error validating referral code:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}