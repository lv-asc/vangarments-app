import { v4 as uuidv4 } from 'uuid';

export interface BugReport {
  id: string;
  userId?: string;
  type: 'bug' | 'feature_request' | 'performance_issue' | 'ui_issue' | 'data_issue' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  steps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  environment: {
    userAgent?: string;
    platform?: string;
    version?: string;
    url?: string;
    timestamp: Date;
  };
  attachments?: {
    screenshots?: string[];
    logs?: string[];
    networkLogs?: any[];
  };
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'duplicate';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

export interface UserFeedback {
  id: string;
  userId?: string;
  type: 'general' | 'feature' | 'usability' | 'performance' | 'content' | 'support';
  rating?: number; // 1-5 scale
  title?: string;
  message: string;
  category?: string;
  page?: string;
  feature?: string;
  environment: {
    userAgent?: string;
    platform?: string;
    url?: string;
    timestamp: Date;
  };
  sentiment?: 'positive' | 'neutral' | 'negative';
  actionable: boolean;
  status: 'new' | 'reviewed' | 'acted_upon' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureRequest {
  id: string;
  userId?: string;
  title: string;
  description: string;
  useCase: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  votes: number;
  voters: string[];
  status: 'submitted' | 'under_review' | 'planned' | 'in_development' | 'completed' | 'rejected';
  estimatedEffort?: 'small' | 'medium' | 'large' | 'extra_large';
  businessValue?: 'low' | 'medium' | 'high';
  technicalComplexity?: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export class UserFeedbackService {
  private bugReports: Map<string, BugReport> = new Map();
  private userFeedback: Map<string, UserFeedback> = new Map();
  private featureRequests: Map<string, FeatureRequest> = new Map();

  /**
   * Submit a bug report
   */
  async submitBugReport(reportData: Omit<BugReport, 'id' | 'status' | 'priority' | 'createdAt' | 'updatedAt'>): Promise<BugReport> {
    const bugReport: BugReport = {
      id: uuidv4(),
      ...reportData,
      status: 'open',
      priority: this.determinePriority(reportData.severity, reportData.type),
      tags: this.generateTags(reportData),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.bugReports.set(bugReport.id, bugReport);

    // Auto-assign based on type and severity
    this.autoAssignBugReport(bugReport);

    // Send notifications
    this.notifyBugReportSubmission(bugReport);

    // Log for monitoring
    console.log(`[BUG REPORT] ${bugReport.severity.toUpperCase()}: ${bugReport.title} (${bugReport.id})`);

    return bugReport;
  }

  /**
   * Submit user feedback
   */
  async submitFeedback(feedbackData: Omit<UserFeedback, 'id' | 'sentiment' | 'actionable' | 'status' | 'createdAt' | 'updatedAt'>): Promise<UserFeedback> {
    const feedback: UserFeedback = {
      id: uuidv4(),
      ...feedbackData,
      sentiment: this.analyzeSentiment(feedbackData.message),
      actionable: this.isActionable(feedbackData),
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.userFeedback.set(feedback.id, feedback);

    // Process actionable feedback
    if (feedback.actionable) {
      this.processActionableFeedback(feedback);
    }

    // Log for analytics
    console.log(`[FEEDBACK] ${feedback.type.toUpperCase()}: ${feedback.sentiment} sentiment (${feedback.id})`);

    return feedback;
  }

  /**
   * Submit feature request
   */
  async submitFeatureRequest(requestData: Omit<FeatureRequest, 'id' | 'votes' | 'voters' | 'status' | 'createdAt' | 'updatedAt'>): Promise<FeatureRequest> {
    const featureRequest: FeatureRequest = {
      id: uuidv4(),
      ...requestData,
      votes: 1, // Creator automatically votes
      voters: requestData.userId ? [requestData.userId] : [],
      status: 'submitted',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.featureRequests.set(featureRequest.id, featureRequest);

    // Check for duplicates
    this.checkForDuplicateFeatureRequests(featureRequest);

    // Log for product management
    console.log(`[FEATURE REQUEST] ${featureRequest.priority.toUpperCase()}: ${featureRequest.title} (${featureRequest.id})`);

    return featureRequest;
  }

  /**
   * Vote on feature request
   */
  async voteOnFeatureRequest(requestId: string, userId: string): Promise<FeatureRequest | null> {
    const request = this.featureRequests.get(requestId);
    if (!request) return null;

    if (!request.voters.includes(userId)) {
      request.voters.push(userId);
      request.votes++;
      request.updatedAt = new Date();

      // Check if request should be prioritized based on votes
      this.checkFeatureRequestPrioritization(request);
    }

    return request;
  }

  /**
   * Update bug report status
   */
  async updateBugReportStatus(
    reportId: string, 
    status: BugReport['status'], 
    resolution?: string,
    assignedTo?: string
  ): Promise<BugReport | null> {
    const report = this.bugReports.get(reportId);
    if (!report) return null;

    report.status = status;
    report.updatedAt = new Date();
    
    if (resolution) {
      report.resolution = resolution;
    }
    
    if (assignedTo) {
      report.assignedTo = assignedTo;
    }
    
    if (status === 'resolved' || status === 'closed') {
      report.resolvedAt = new Date();
    }

    // Notify stakeholders
    this.notifyBugReportUpdate(report);

    return report;
  }

  /**
   * Get bug reports with filtering
   */
  getBugReports(filters?: {
    status?: BugReport['status'];
    severity?: BugReport['severity'];
    type?: BugReport['type'];
    assignedTo?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): BugReport[] {
    let reports = Array.from(this.bugReports.values());

    if (filters) {
      if (filters.status) {
        reports = reports.filter(r => r.status === filters.status);
      }
      if (filters.severity) {
        reports = reports.filter(r => r.severity === filters.severity);
      }
      if (filters.type) {
        reports = reports.filter(r => r.type === filters.type);
      }
      if (filters.assignedTo) {
        reports = reports.filter(r => r.assignedTo === filters.assignedTo);
      }
      if (filters.userId) {
        reports = reports.filter(r => r.userId === filters.userId);
      }
    }

    // Sort by priority and creation date
    reports.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Apply pagination
    if (filters?.offset || filters?.limit) {
      const offset = filters.offset || 0;
      const limit = filters.limit || 50;
      reports = reports.slice(offset, offset + limit);
    }

    return reports;
  }

  /**
   * Get user feedback with filtering
   */
  getUserFeedback(filters?: {
    type?: UserFeedback['type'];
    sentiment?: UserFeedback['sentiment'];
    actionable?: boolean;
    status?: UserFeedback['status'];
    userId?: string;
    limit?: number;
    offset?: number;
  }): UserFeedback[] {
    let feedback = Array.from(this.userFeedback.values());

    if (filters) {
      if (filters.type) {
        feedback = feedback.filter(f => f.type === filters.type);
      }
      if (filters.sentiment) {
        feedback = feedback.filter(f => f.sentiment === filters.sentiment);
      }
      if (filters.actionable !== undefined) {
        feedback = feedback.filter(f => f.actionable === filters.actionable);
      }
      if (filters.status) {
        feedback = feedback.filter(f => f.status === filters.status);
      }
      if (filters.userId) {
        feedback = feedback.filter(f => f.userId === filters.userId);
      }
    }

    // Sort by actionable first, then by creation date
    feedback.sort((a, b) => {
      if (a.actionable !== b.actionable) {
        return a.actionable ? -1 : 1;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Apply pagination
    if (filters?.offset || filters?.limit) {
      const offset = filters.offset || 0;
      const limit = filters.limit || 50;
      feedback = feedback.slice(offset, offset + limit);
    }

    return feedback;
  }

  /**
   * Get feature requests with filtering
   */
  getFeatureRequests(filters?: {
    status?: FeatureRequest['status'];
    priority?: FeatureRequest['priority'];
    category?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): FeatureRequest[] {
    let requests = Array.from(this.featureRequests.values());

    if (filters) {
      if (filters.status) {
        requests = requests.filter(r => r.status === filters.status);
      }
      if (filters.priority) {
        requests = requests.filter(r => r.priority === filters.priority);
      }
      if (filters.category) {
        requests = requests.filter(r => r.category === filters.category);
      }
      if (filters.userId) {
        requests = requests.filter(r => r.userId === filters.userId);
      }
    }

    // Sort by votes and priority
    requests.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.votes - a.votes;
    });

    // Apply pagination
    if (filters?.offset || filters?.limit) {
      const offset = filters.offset || 0;
      const limit = filters.limit || 50;
      requests = requests.slice(offset, offset + limit);
    }

    return requests;
  }

  /**
   * Get feedback analytics
   */
  getFeedbackAnalytics(): {
    bugReports: {
      total: number;
      byStatus: Record<string, number>;
      bySeverity: Record<string, number>;
      byType: Record<string, number>;
      averageResolutionTime: number;
    };
    userFeedback: {
      total: number;
      byType: Record<string, number>;
      bySentiment: Record<string, number>;
      actionablePercentage: number;
    };
    featureRequests: {
      total: number;
      byStatus: Record<string, number>;
      byPriority: Record<string, number>;
      averageVotes: number;
    };
  } {
    const bugReports = Array.from(this.bugReports.values());
    const feedback = Array.from(this.userFeedback.values());
    const requests = Array.from(this.featureRequests.values());

    // Bug report analytics
    const bugsByStatus = bugReports.reduce((acc, bug) => {
      acc[bug.status] = (acc[bug.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bugsBySeverity = bugReports.reduce((acc, bug) => {
      acc[bug.severity] = (acc[bug.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bugsByType = bugReports.reduce((acc, bug) => {
      acc[bug.type] = (acc[bug.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const resolvedBugs = bugReports.filter(b => b.resolvedAt);
    const averageResolutionTime = resolvedBugs.length > 0
      ? resolvedBugs.reduce((sum, bug) => {
          return sum + (bug.resolvedAt!.getTime() - bug.createdAt.getTime());
        }, 0) / resolvedBugs.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // User feedback analytics
    const feedbackByType = feedback.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const feedbackBySentiment = feedback.reduce((acc, f) => {
      if (f.sentiment) {
        acc[f.sentiment] = (acc[f.sentiment] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const actionableFeedback = feedback.filter(f => f.actionable).length;
    const actionablePercentage = feedback.length > 0 ? (actionableFeedback / feedback.length) * 100 : 0;

    // Feature request analytics
    const requestsByStatus = requests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestsByPriority = requests.reduce((acc, req) => {
      acc[req.priority] = (acc[req.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageVotes = requests.length > 0
      ? requests.reduce((sum, req) => sum + req.votes, 0) / requests.length
      : 0;

    return {
      bugReports: {
        total: bugReports.length,
        byStatus: bugsByStatus,
        bySeverity: bugsBySeverity,
        byType: bugsByType,
        averageResolutionTime,
      },
      userFeedback: {
        total: feedback.length,
        byType: feedbackByType,
        bySentiment: feedbackBySentiment,
        actionablePercentage,
      },
      featureRequests: {
        total: requests.length,
        byStatus: requestsByStatus,
        byPriority: requestsByPriority,
        averageVotes,
      },
    };
  }

  /**
   * Determine bug report priority based on severity and type
   */
  private determinePriority(severity: BugReport['severity'], type: BugReport['type']): BugReport['priority'] {
    if (severity === 'critical') return 'urgent';
    if (severity === 'high') return 'high';
    if (severity === 'medium' && (type === 'performance_issue' || type === 'data_issue')) return 'high';
    if (severity === 'medium') return 'medium';
    return 'low';
  }

  /**
   * Generate tags for bug report
   */
  private generateTags(reportData: Partial<BugReport>): string[] {
    const tags: string[] = [];
    
    if (reportData.type) tags.push(reportData.type);
    if (reportData.severity) tags.push(reportData.severity);
    if (reportData.environment?.platform) tags.push(reportData.environment.platform);
    
    // Add tags based on description content
    const description = reportData.description?.toLowerCase() || '';
    if (description.includes('mobile')) tags.push('mobile');
    if (description.includes('web')) tags.push('web');
    if (description.includes('login')) tags.push('authentication');
    if (description.includes('payment')) tags.push('payment');
    if (description.includes('upload')) tags.push('upload');
    
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Auto-assign bug report based on type and severity
   */
  private autoAssignBugReport(bugReport: BugReport): void {
    // In production, this would assign to appropriate team members
    // based on expertise, workload, and availability
    
    let assignee: string | undefined;
    
    switch (bugReport.type) {
      case 'performance_issue':
        assignee = 'performance-team';
        break;
      case 'ui_issue':
        assignee = 'frontend-team';
        break;
      case 'data_issue':
        assignee = 'backend-team';
        break;
      default:
        if (bugReport.severity === 'critical' || bugReport.severity === 'high') {
          assignee = 'senior-developer';
        }
    }
    
    if (assignee) {
      bugReport.assignedTo = assignee;
    }
  }

  /**
   * Analyze sentiment of feedback message
   */
  private analyzeSentiment(message: string): UserFeedback['sentiment'] {
    // Simple sentiment analysis - in production, use proper NLP service
    const positiveWords = ['good', 'great', 'excellent', 'love', 'amazing', 'perfect', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'broken', 'slow', 'confusing'];
    
    const lowerMessage = message.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Determine if feedback is actionable
   */
  private isActionable(feedbackData: Partial<UserFeedback>): boolean {
    // Feedback is actionable if it contains specific suggestions or identifies clear issues
    const message = feedbackData.message?.toLowerCase() || '';
    
    const actionableIndicators = [
      'should', 'could', 'would like', 'suggest', 'recommend', 'improve',
      'add', 'remove', 'change', 'fix', 'bug', 'issue', 'problem'
    ];
    
    return actionableIndicators.some(indicator => message.includes(indicator));
  }

  /**
   * Process actionable feedback
   */
  private processActionableFeedback(feedback: UserFeedback): void {
    // In production, this would:
    // 1. Create tasks in project management system
    // 2. Notify product team
    // 3. Add to feature request backlog if appropriate
    
    console.log(`[ACTIONABLE FEEDBACK] Processing feedback ${feedback.id}: ${feedback.message}`);
  }

  /**
   * Check for duplicate feature requests
   */
  private checkForDuplicateFeatureRequests(newRequest: FeatureRequest): void {
    const existingRequests = Array.from(this.featureRequests.values());
    
    // Simple duplicate detection based on title similarity
    const similarRequests = existingRequests.filter(req => {
      const similarity = this.calculateStringSimilarity(
        newRequest.title.toLowerCase(),
        req.title.toLowerCase()
      );
      return similarity > 0.8 && req.id !== newRequest.id;
    });
    
    if (similarRequests.length > 0) {
      console.log(`[DUPLICATE CHECK] Feature request ${newRequest.id} may be similar to existing requests:`, 
        similarRequests.map(r => r.id));
    }
  }

  /**
   * Check if feature request should be prioritized based on votes
   */
  private checkFeatureRequestPrioritization(request: FeatureRequest): void {
    // Auto-prioritize based on vote thresholds
    if (request.votes >= 50 && request.priority === 'low') {
      request.priority = 'medium';
      console.log(`[FEATURE PRIORITIZATION] Request ${request.id} upgraded to medium priority (${request.votes} votes)`);
    } else if (request.votes >= 100 && request.priority === 'medium') {
      request.priority = 'high';
      console.log(`[FEATURE PRIORITIZATION] Request ${request.id} upgraded to high priority (${request.votes} votes)`);
    }
  }

  /**
   * Calculate string similarity (simple implementation)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Send notifications for bug report submission
   */
  private notifyBugReportSubmission(bugReport: BugReport): void {
    // In production, this would send notifications via:
    // - Email to assigned team
    // - Slack/Teams integration
    // - Project management system webhook
    
    console.log(`[NOTIFICATION] Bug report ${bugReport.id} submitted and assigned to ${bugReport.assignedTo}`);
  }

  /**
   * Send notifications for bug report updates
   */
  private notifyBugReportUpdate(bugReport: BugReport): void {
    // In production, this would notify:
    // - Original reporter
    // - Assigned developer
    // - Project manager
    
    console.log(`[NOTIFICATION] Bug report ${bugReport.id} status updated to ${bugReport.status}`);
  }
}

// Export singleton instance
export const userFeedbackService = new UserFeedbackService();