import { ContentReportModel, UpdateContentReportData } from '../models/ContentReport';
import { SocialPostModel } from '../models/SocialPost';
import { PostCommentModel } from '../models/PostComment';
import { UserModel } from '../models/User';

export interface ModerationFilters {
  status?: string;
  priority?: string;
  reportedContentType?: string;
  reportedBy?: string;
}

export interface ContentFlag {
  id: string;
  contentId: string;
  contentType: 'post' | 'comment' | 'user';
  flagType: 'ai_detected' | 'user_reported' | 'system_flagged';
  flaggedBy: string;
  confidence?: number;
  details?: any;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: Date;
}

export interface CreateContentFlagData {
  contentId: string;
  contentType: 'post' | 'comment' | 'user';
  flagType: 'ai_detected' | 'user_reported' | 'system_flagged';
  flaggedBy: string;
  confidence?: number;
  details?: any;
}

export class ContentModerationService {
  /**
   * Get content reports with filters and pagination
   */
  async getReports(
    filters: ModerationFilters = {},
    page = 1,
    limit = 20
  ): Promise<{
    reports: any[];
    hasMore: boolean;
    totalReports: number;
  }> {
    const offset = (page - 1) * limit;

    const { reports, total } = await ContentReportModel.findMany(
      filters,
      limit + 1,
      offset
    );

    const hasMore = reports.length > limit;
    if (hasMore) {
      reports.pop();
    }

    // Enrich reports with content details
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const contentDetails = await this.getReportedContentDetails(
          report.reportedContentId,
          report.reportedContentType
        );

        return {
          ...report,
          reportedContent: contentDetails,
        };
      })
    );

    return {
      reports: enrichedReports,
      hasMore,
      totalReports: total,
    };
  }

  /**
   * Get a specific report with full details
   */
  async getReportWithDetails(reportId: string): Promise<any | null> {
    const report = await ContentReportModel.findById(reportId);
    if (!report) return null;

    const contentDetails = await this.getReportedContentDetails(
      report.reportedContentId,
      report.reportedContentType
    );

    return {
      ...report,
      reportedContent: contentDetails,
    };
  }

  /**
   * Take moderation action on a report
   */
  async takeAction(
    reportId: string,
    action: 'approve' | 'remove' | 'warn' | 'dismiss',
    moderatorId: string,
    reason?: string
  ): Promise<any> {
    const report = await ContentReportModel.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    // Update report status
    const updateData: UpdateContentReportData = {
      status: action === 'dismiss' ? 'dismissed' : 'resolved',
      reviewedBy: moderatorId,
      resolution: action,
    };

    const updatedReport = await ContentReportModel.update(reportId, updateData);

    // Take action on the reported content
    await this.executeContentAction(
      report.reportedContentId,
      report.reportedContentType,
      action,
      reason
    );

    return updatedReport;
  }

  /**
   * Get moderation statistics
   */
  async getStatistics(): Promise<{
    totalReports: number;
    pendingReports: number;
    highPriorityReports: number;
    resolvedToday: number;
  }> {
    return await ContentReportModel.getStatistics();
  }

  /**
   * Perform bulk actions on multiple reports
   */
  async bulkAction(
    reportIds: string[],
    action: 'approve' | 'remove' | 'warn' | 'dismiss',
    moderatorId: string,
    reason?: string
  ): Promise<any[]> {
    const results = await Promise.all(
      reportIds.map(async (reportId) => {
        try {
          return await this.takeAction(reportId, action, moderatorId, reason);
        } catch (error) {
          return { reportId, error: (error as Error).message };
        }
      })
    );

    return results;
  }

  /**
   * Flag content for automated review
   */
  async flagContent(flagData: CreateContentFlagData): Promise<ContentFlag> {
    // Mock implementation - in reality, this would create a content flag record
    const flag: ContentFlag = {
      id: `flag_${Date.now()}`,
      ...flagData,
      status: 'pending',
      createdAt: new Date(),
    };

    // TODO: Save to database
    
    // If confidence is high enough, automatically create a report
    if (flagData.confidence && flagData.confidence > 0.8) {
      await ContentReportModel.create({
        reportedBy: flagData.flaggedBy,
        reportedContentId: flagData.contentId,
        reportedContentType: flagData.contentType,
        reason: this.mapFlagTypeToReason(flagData.flagType),
        description: `Automatically flagged by ${flagData.flagType} with ${Math.round((flagData.confidence || 0) * 100)}% confidence`,
      });
    }

    return flag;
  }

  /**
   * Get details of reported content
   */
  private async getReportedContentDetails(
    contentId: string,
    contentType: string
  ): Promise<any> {
    switch (contentType) {
      case 'post':
        const post = await SocialPostModel.findById(contentId);
        return post ? {
          id: contentId,
          type: 'post',
          content: post.content,
          author: post.user,
        } : null;

      case 'comment':
        const comment = await PostCommentModel.findById(contentId);
        return comment ? {
          id: contentId,
          type: 'comment',
          content: { text: comment.content },
          author: comment.user,
        } : null;

      case 'user':
        const user = await UserModel.findById(contentId);
        return user ? {
          id: contentId,
          type: 'user',
          content: user.profile,
          author: user,
        } : null;

      default:
        return null;
    }
  }

  /**
   * Execute the actual moderation action on content
   */
  private async executeContentAction(
    contentId: string,
    contentType: string,
    action: string,
    reason?: string
  ): Promise<void> {
    switch (action) {
      case 'remove':
        await this.removeContent(contentId, contentType);
        break;
      
      case 'warn':
        await this.warnUser(contentId, contentType, reason);
        break;
      
      case 'approve':
        // Content is approved, no action needed
        break;
      
      case 'dismiss':
        // Report is dismissed, no action needed
        break;
    }
  }

  /**
   * Remove content based on type
   */
  private async removeContent(contentId: string, contentType: string): Promise<void> {
    switch (contentType) {
      case 'post':
        await SocialPostModel.delete(contentId);
        break;
      
      case 'comment':
        await PostCommentModel.delete(contentId, ''); // TODO: Get proper user ID
        break;
      
      case 'user':
        // TODO: Implement user suspension/ban
        console.log(`User ${contentId} should be suspended/banned`);
        break;
    }
  }

  /**
   * Send warning to user
   */
  private async warnUser(contentId: string, contentType: string, reason?: string): Promise<void> {
    // TODO: Implement user warning system
    console.log(`Warning sent for ${contentType} ${contentId}: ${reason}`);
  }

  /**
   * Map flag type to report reason
   */
  private mapFlagTypeToReason(flagType: string): any {
    const mapping: Record<string, any> = {
      'ai_detected': 'inappropriate_content',
      'user_reported': 'other',
      'system_flagged': 'spam',
    };

    return mapping[flagType] || 'other';
  }
}