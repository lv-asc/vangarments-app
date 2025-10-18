import { db } from '../database/connection';

export interface TrainingData {
  id: string;
  imageUrl: string;
  groundTruthLabels: {
    domain: string;
    brand: string;
    pieceType: string;
    color: string;
    material: string;
    style?: string[];
    fit?: string;
  };
  userFeedback?: {
    userId: string;
    corrections: any;
    confidence: number;
    timestamp: Date;
  };
  aiPredictions?: {
    domain: string;
    brand: string;
    pieceType: string;
    color: string;
    material: string;
    confidence: number;
  };
  modelVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelPerformance {
  modelVersion: string;
  accuracy: {
    overall: number;
    domain: number;
    brand: number;
    pieceType: number;
    color: number;
    material: number;
  };
  totalSamples: number;
  lastEvaluated: Date;
}

export class AITrainingModel {
  /**
   * Store training data with ground truth labels
   */
  static async storeTrainingData(data: Omit<TrainingData, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrainingData> {
    const query = `
      INSERT INTO ai_training_data (
        image_url, ground_truth_labels, user_feedback, 
        ai_predictions, model_version
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      data.imageUrl,
      JSON.stringify(data.groundTruthLabels),
      data.userFeedback ? JSON.stringify(data.userFeedback) : null,
      data.aiPredictions ? JSON.stringify(data.aiPredictions) : null,
      data.modelVersion,
    ];

    const result = await db.query(query, values);
    return this.mapToTrainingData(result.rows[0]);
  }

  /**
   * Record user feedback for AI predictions
   */
  static async recordUserFeedback(
    imageUrl: string,
    userId: string,
    corrections: any,
    confidence: number
  ): Promise<TrainingData | null> {
    const userFeedback = {
      userId,
      corrections,
      confidence,
      timestamp: new Date(),
    };

    const query = `
      UPDATE ai_training_data 
      SET user_feedback = $1, updated_at = NOW()
      WHERE image_url = $2
      RETURNING *
    `;

    const values = [JSON.stringify(userFeedback), imageUrl];
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToTrainingData(result.rows[0]);
  }

  /**
   * Get training data for model improvement
   */
  static async getTrainingDataset(
    modelVersion?: string,
    limit: number = 1000,
    offset: number = 0
  ): Promise<TrainingData[]> {
    let query = `
      SELECT * FROM ai_training_data 
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (modelVersion) {
      query += ` WHERE model_version = $${paramCount}`;
      values.push(modelVersion);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await db.query(query, values);
    return result.rows.map(row => this.mapToTrainingData(row));
  }

  /**
   * Get feedback data for model evaluation
   */
  static async getFeedbackData(modelVersion?: string): Promise<TrainingData[]> {
    let query = `
      SELECT * FROM ai_training_data 
      WHERE user_feedback IS NOT NULL
    `;
    const values: any[] = [];

    if (modelVersion) {
      query += ` AND model_version = $1`;
      values.push(modelVersion);
    }

    query += ` ORDER BY updated_at DESC`;

    const result = await db.query(query, values);
    return result.rows.map(row => this.mapToTrainingData(row));
  }

  /**
   * Calculate model performance metrics
   */
  static async calculateModelPerformance(modelVersion: string): Promise<ModelPerformance> {
    const query = `
      SELECT 
        COUNT(*) as total_samples,
        AVG(CASE WHEN 
          (ai_predictions->>'domain') = (ground_truth_labels->>'domain') AND
          (ai_predictions->>'brand') = (ground_truth_labels->>'brand') AND
          (ai_predictions->>'pieceType') = (ground_truth_labels->>'pieceType') AND
          (ai_predictions->>'color') = (ground_truth_labels->>'color') AND
          (ai_predictions->>'material') = (ground_truth_labels->>'material')
        THEN 1 ELSE 0 END) as overall_accuracy,
        AVG(CASE WHEN (ai_predictions->>'domain') = (ground_truth_labels->>'domain') THEN 1 ELSE 0 END) as domain_accuracy,
        AVG(CASE WHEN (ai_predictions->>'brand') = (ground_truth_labels->>'brand') THEN 1 ELSE 0 END) as brand_accuracy,
        AVG(CASE WHEN (ai_predictions->>'pieceType') = (ground_truth_labels->>'pieceType') THEN 1 ELSE 0 END) as piece_type_accuracy,
        AVG(CASE WHEN (ai_predictions->>'color') = (ground_truth_labels->>'color') THEN 1 ELSE 0 END) as color_accuracy,
        AVG(CASE WHEN (ai_predictions->>'material') = (ground_truth_labels->>'material') THEN 1 ELSE 0 END) as material_accuracy
      FROM ai_training_data 
      WHERE model_version = $1 AND ai_predictions IS NOT NULL
    `;

    const result = await db.query(query, [modelVersion]);
    const row = result.rows[0];

    return {
      modelVersion,
      accuracy: {
        overall: Math.round((parseFloat(row.overall_accuracy) || 0) * 100),
        domain: Math.round((parseFloat(row.domain_accuracy) || 0) * 100),
        brand: Math.round((parseFloat(row.brand_accuracy) || 0) * 100),
        pieceType: Math.round((parseFloat(row.piece_type_accuracy) || 0) * 100),
        color: Math.round((parseFloat(row.color_accuracy) || 0) * 100),
        material: Math.round((parseFloat(row.material_accuracy) || 0) * 100),
      },
      totalSamples: parseInt(row.total_samples) || 0,
      lastEvaluated: new Date(),
    };
  }

  /**
   * Store model performance metrics
   */
  static async storeModelPerformance(performance: ModelPerformance): Promise<void> {
    const query = `
      INSERT INTO model_performance (
        model_version, accuracy_metrics, total_samples, last_evaluated
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (model_version) 
      DO UPDATE SET 
        accuracy_metrics = $2,
        total_samples = $3,
        last_evaluated = $4,
        updated_at = NOW()
    `;

    const values = [
      performance.modelVersion,
      JSON.stringify(performance.accuracy),
      performance.totalSamples,
      performance.lastEvaluated,
    ];

    await db.query(query, values);
  }

  /**
   * Get model performance history
   */
  static async getModelPerformanceHistory(): Promise<ModelPerformance[]> {
    const query = `
      SELECT * FROM model_performance 
      ORDER BY last_evaluated DESC
    `;

    const result = await db.query(query);
    return result.rows.map(row => ({
      modelVersion: row.model_version,
      accuracy: typeof row.accuracy_metrics === 'string' 
        ? JSON.parse(row.accuracy_metrics) 
        : row.accuracy_metrics,
      totalSamples: row.total_samples,
      lastEvaluated: new Date(row.last_evaluated),
    }));
  }

  /**
   * Get items that need human review (low confidence predictions)
   */
  static async getItemsNeedingReview(confidenceThreshold: number = 70): Promise<TrainingData[]> {
    const query = `
      SELECT * FROM ai_training_data 
      WHERE (ai_predictions->>'confidence')::numeric < $1
      AND user_feedback IS NULL
      ORDER BY (ai_predictions->>'confidence')::numeric ASC
      LIMIT 50
    `;

    const result = await db.query(query, [confidenceThreshold]);
    return result.rows.map(row => this.mapToTrainingData(row));
  }

  /**
   * Get training statistics
   */
  static async getTrainingStats(): Promise<{
    totalTrainingData: number;
    feedbackCount: number;
    averageConfidence: number;
    modelVersions: string[];
    lastTrainingDate: Date | null;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_training_data,
        COUNT(user_feedback) as feedback_count,
        AVG((ai_predictions->>'confidence')::numeric) as average_confidence,
        array_agg(DISTINCT model_version) as model_versions,
        MAX(created_at) as last_training_date
      FROM ai_training_data
    `;

    const result = await db.query(query);
    const row = result.rows[0];

    return {
      totalTrainingData: parseInt(row.total_training_data) || 0,
      feedbackCount: parseInt(row.feedback_count) || 0,
      averageConfidence: Math.round(parseFloat(row.average_confidence) || 0),
      modelVersions: row.model_versions || [],
      lastTrainingDate: row.last_training_date ? new Date(row.last_training_date) : null,
    };
  }

  private static mapToTrainingData(row: any): TrainingData {
    const groundTruthLabels = typeof row.ground_truth_labels === 'string' 
      ? JSON.parse(row.ground_truth_labels) 
      : row.ground_truth_labels;
    
    const userFeedback = row.user_feedback 
      ? (typeof row.user_feedback === 'string' ? JSON.parse(row.user_feedback) : row.user_feedback)
      : undefined;
    
    const aiPredictions = row.ai_predictions 
      ? (typeof row.ai_predictions === 'string' ? JSON.parse(row.ai_predictions) : row.ai_predictions)
      : undefined;

    return {
      id: row.id,
      imageUrl: row.image_url,
      groundTruthLabels,
      userFeedback,
      aiPredictions,
      modelVersion: row.model_version,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}