import { Request, Response } from 'express';
import { ContentModerationService } from '../services/contentModerationService';
import { AuthenticatedRequest } from '../utils/auth';

const contentModerationService = new ContentModerationService();

export class ContentModerationController {
  /**
   * Get content reports with filters
   */
  async getReports(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        status, 
        priority, 
        reportedContentType, 
        reportedBy, 
        page = 1, 
        limit = 20 
      } = req.query;

      const filters = {
        status: status as string,
        priority: priority as string,
        reportedContentType: reportedContentType as string,
        reportedBy: reportedBy as string,
      };

      const result = await contentModerationService.getReports(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_REPORTS_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get a specific report by ID
   */
  async getReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;

      const report = await contentModerationService.getReportWithDetails(reportId);

      if (!report) {
        res.status(404).json({
          error: {
            code: 'REPORT_NOT_FOUND',
            message: 'Report not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: { report },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_REPORT_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Take action on a report
   */
  async takeAction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const { action, reason } = req.body;
      const moderatorId = req.user!.id;

      const result = await contentModerationService.takeAction(
        reportId,
        action,
        moderatorId,
        reason
      );

      res.json({
        success: true,
        data: { report: result },
        message: `Action "${action}" taken successfully`,
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'ACTION_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get moderation statistics
   */
  async getStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const statistics = await contentModerationService.getStatistics();

      res.json({
        success: true,
        data: { statistics },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_STATISTICS_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Perform bulk actions on multiple reports
   */
  async bulkAction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reportIds, action, reason } = req.body;
      const moderatorId = req.user!.id;

      const results = await contentModerationService.bulkAction(
        reportIds,
        action,
        moderatorId,
        reason
      );

      res.json({
        success: true,
        data: { results },
        message: `Bulk action "${action}" completed on ${results.length} reports`,
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'BULK_ACTION_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Flag content for review (automated systems)
   */
  async flagContent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { contentId, contentType, flagType, confidence, details } = req.body;
      const flaggedBy = req.user!.id;

      const flag = await contentModerationService.flagContent({
        contentId,
        contentType,
        flagType,
        flaggedBy,
        confidence,
        details,
      });

      res.status(201).json({
        success: true,
        data: { flag },
        message: 'Content flagged for review',
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'FLAG_CONTENT_FAILED',
          message: error.message,
        },
      });
    }
  }
}