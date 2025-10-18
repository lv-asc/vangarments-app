import { Request, Response } from 'express';
import { errorHandlingService } from '../services/errorHandlingService';
import { performanceMonitoringService } from '../services/performanceMonitoringService';
import { userFeedbackService } from '../services/userFeedbackService';
import { healthCheckService } from '../services/healthCheckService';

export class MonitoringController {
  /**
   * Get system health status
   */
  static async getHealthStatus(req: Request, res: Response) {
    try {
      const health = await healthCheckService.getCurrentStatus();
      
      // Set appropriate status code based on health
      let statusCode = 200;
      if (health.status === 'unhealthy') statusCode = 503;
      
      res.status(statusCode).json({
        success: true,
        data: health,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message: 'Failed to get health status',
          details: error?.message,
        },
      });
    }
  }

  /**
   * Get error statistics and reports
   */
  static async getErrorStats(req: Request, res: Response) {
    try {
      const stats = errorHandlingService.getErrorStats();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'ERROR_STATS_ERROR',
          message: 'Failed to get error statistics',
          details: error?.message,
        },
      });
    }
  }

  /**
   * Get specific error report
   */
  static async getErrorReport(req: Request, res: Response) {
    try {
      const { errorId } = req.params;
      const errorReport = errorHandlingService.getErrorReport(errorId);
      
      if (!errorReport) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ERROR_NOT_FOUND',
            message: 'Error report not found',
          },
        });
      }
      
      res.json({
        success: true,
        data: errorReport,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'ERROR_REPORT_ERROR',
          message: 'Failed to get error report',
          details: error?.message,
        },
      });
    }
  }

  /**
   * Mark error as resolved
   */
  static async resolveError(req: Request, res: Response) {
    try {
      const { errorId } = req.params;
      const { resolution } = req.body;
      
      const success = errorHandlingService.resolveError(errorId);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ERROR_NOT_FOUND',
            message: 'Error report not found',
          },
        });
      }
      
      res.json({
        success: true,
        message: 'Error marked as resolved',
        data: { errorId, resolution },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'RESOLVE_ERROR_ERROR',
          message: 'Failed to resolve error',
          details: error?.message,
        },
      });
    }
  }

  /**
   * Get performance statistics
   */
  static async getPerformanceStats(req: Request, res: Response) {
    try {
      const stats = performanceMonitoringService.getPerformanceStats();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'PERFORMANCE_STATS_ERROR',
          message: 'Failed to get performance statistics',
          details: error?.message,
        },
      });
    }
  }

  /**
   * Get performance metrics with filtering
   */
  static async getPerformanceMetrics(req: Request, res: Response) {
    try {
      const { type, startTime, endTime } = req.query;
      
      const start = startTime ? new Date(startTime as string) : undefined;
      const end = endTime ? new Date(endTime as string) : undefined;
      
      const metrics = performanceMonitoringService.getMetrics(
        type as any,
        start,
        end
      );
      
      res.json({
        success: true,
        data: {
          metrics,
          total: metrics.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'PERFORMANCE_METRICS_ERROR',
          message: 'Failed to get performance metrics',
          details: error?.message,
        },
      });
    }
  }

  /**
   * Get system metrics history
   */
  static async getSystemMetricsHistory(req: Request, res: Response) {
    try {
      const { hours = 24 } = req.query;
      
      const history = performanceMonitoringService.getSystemMetricsHistory(
        parseInt(hours as string)
      );
      
      res.json({
        success: true,
        data: {
          history,
          total: history.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SYSTEM_METRICS_ERROR',
          message: 'Failed to get system metrics history',
          details: error?.message,
        },
      });
    }
  }

  /**
   * Submit bug report
   */
  static async submitBugReport(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const {
        type,
        severity,
        title,
        description,
        steps,
        expectedBehavior,
        actualBehavior,
        attachments,
      } = req.body;

      const bugReport = await userFeedbackService.submitBugReport({
        userId,
        type,
        severity,
        title,
        description,
        steps,
        expectedBehavior,
        actualBehavior,
        environment: {
          userAgent: req.get('User-Agent'),
          platform: req.get('X-Platform') || 'web',
          version: req.get('X-App-Version'),
          url: req.get('Referer'),
          timestamp: new Date(),
        },
        attachments,
        tags: [],
      });

      res.status(201).json({
        success: true,
        message: 'Bug report submitted successfully',
        data: bugReport,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'BUG_REPORT_ERROR',
          message: 'Failed to submit bug report',
          details: error?.message,
        },
      });
    }
  }

  /**
   * Submit user feedback
   */
  static async submitFeedback(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const {
        type,
        rating,
        title,
        message,
        category,
        page,
        feature,
      } = req.body;

      const feedback = await userFeedbackService.submitFeedback({
        userId,
        type,
        rating,
        title,
        message,
        category,
        page,
        feature,
        environment: {
          userAgent: req.get('User-Agent'),
          platform: req.get('X-Platform') || 'web',
          url: req.get('Referer'),
          timestamp: new Date(),
        },
      });

      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: feedback,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'FEEDBACK_ERROR',
          message: 'Failed to submit feedback',
          details: error?.message,
        },
      });
    }
  }

  /**
   * Submit feature request
   */
  static async submitFeatureRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const {
        title,
        description,
        useCase,
        priority,
        category,
      } = req.body;

      const featureRequest = await userFeedbackService.submitFeatureRequest({
        userId,
        title,
        description,
        useCase,
        priority,
        category,
      });

      res.status(201).json({
        success: true,
        message: 'Feature request submitted successfully',
        data: featureRequest,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'FEATURE_REQUEST_ERROR',
          message: 'Failed to submit feature request',
          details: error?.message,
        },
      });
    }
  }

  /**
   * Vote on feature request
   */
  static async voteOnFeatureRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { requestId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required to vote',
          },
        });
      }

      const featureRequest = await userFeedbackService.voteOnFeatureRequest(requestId, userId);

      if (!featureRequest) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'FEATURE_REQUEST_NOT_FOUND',
            message: 'Feature request not found',
          },
        });
      }

      res.json({
        success: true,
        message: 'Vote recorded successfully',
        data: featureRequest,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'VOTE_ERROR',
          message: 'Failed to record vote',
          details: error?.message,
        },
      });
    }
  }

  /**
   * Get bug reports
   */
  static async getBugReports(req: Request, res: Response) {
    try {
      const {
        status,
        severity,
        type,
        assignedTo,
        userId,
        limit = 50,
        offset = 0,
      } = req.query;

      const bugReports = userFeedbackService.getBugReports({
        status: status as any,
        severity: severity as any,
        type: type as any,
        assignedTo: assignedTo as string,
        userId: userId as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json({
        success: true,
        data: {
          bugReports,
          total: bugReports.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_BUG_REPORTS_ERROR',
          message: 'Failed to get bug reports',
          details: error?.message,
        },
      });
    }
  }

  /**
   * Get user feedback
   */
  static async getUserFeedback(req: Request, res: Response) {
    try {
      const {
        type,
        sentiment,
        actionable,
        status,
        userId,
        limit = 50,
        offset = 0,
      } = req.query;

      const feedback = userFeedbackService.getUserFeedback({
        type: type as any,
        sentiment: sentiment as any,
        actionable: actionable === 'true',
        status: status as any,
        userId: userId as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json({
        success: true,
        data: {
          feedback,
          total: feedback.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_FEEDBACK_ERROR',
          message: 'Failed to get user feedback',
          details: error?.message,
        },
      });
    }
  }

  /**
   * Get feature requests
   */
  static async getFeatureRequests(req: Request, res: Response) {
    try {
      const {
        status,
        priority,
        category,
        userId,
        limit = 50,
        offset = 0,
      } = req.query;

      const featureRequests = userFeedbackService.getFeatureRequests({
        status: status as any,
        priority: priority as any,
        category: category as string,
        userId: userId as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json({
        success: true,
        data: {
          featureRequests,
          total: featureRequests.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_FEATURE_REQUESTS_ERROR',
          message: 'Failed to get feature requests',
          details: error?.message,
        },
      });
    }
  }

  /**
   * Get feedback analytics
   */
  static async getFeedbackAnalytics(req: Request, res: Response) {
    try {
      const analytics = userFeedbackService.getFeedbackAnalytics();

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'FEEDBACK_ANALYTICS_ERROR',
          message: 'Failed to get feedback analytics',
          details: error?.message,
        },
      });
    }
  }

  /**
   * Update bug report status (admin only)
   */
  static async updateBugReportStatus(req: Request, res: Response) {
    try {
      const { reportId } = req.params;
      const { status, resolution, assignedTo } = req.body;

      const updatedReport = await userFeedbackService.updateBugReportStatus(
        reportId,
        status,
        resolution,
        assignedTo
      );

      if (!updatedReport) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BUG_REPORT_NOT_FOUND',
            message: 'Bug report not found',
          },
        });
      }

      res.json({
        success: true,
        message: 'Bug report status updated successfully',
        data: updatedReport,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_BUG_REPORT_ERROR',
          message: 'Failed to update bug report status',
          details: error?.message,
        },
      });
    }
  }
}