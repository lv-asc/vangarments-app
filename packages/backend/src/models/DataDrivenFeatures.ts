import { db } from '../database/connection';

export interface AIModelMetrics {
    id: string;
    modelName: string;
    modelVersion: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    trainingDataSize: number;
    lastTrainingDate: string;
    performanceMetrics: {
        categoryAccuracy: Record<string, number>;
        colorAccuracy: Record<string, number>;
        styleAccuracy: Record<string, number>;
    };
    createdAt: string;
    updatedAt: string;
}

export interface ItemValuation {
    id: string;
    itemId: string;
    originalPrice?: number;
    currentMarketValue: number;
    depreciationRate: number;
    conditionFactor: number;
    brandFactor: number;
    trendFactor: number;
    rarityFactor: number;
    valuationConfidence: number;
    lastUpdated: string;
    valuationHistory: Array<{
        date: string;
        value: number;
        factors: Record<string, number>;
    }>;
}

export interface StyleDNA {
    id: string;
    userId: string;
    styleProfile: {
        primaryStyle: string;
        secondaryStyles: string[];
        colorPreferences: {
            primary: string[];
            secondary: string[];
            avoid: string[];
        };
        patternPreferences: {
            preferred: string[];
            neutral: string[];
            avoid: string[];
        };
        fitPreferences: {
            tops: string;
            bottoms: string;
            dresses: string;
        };
        occasionPreferences: Record<string, number>;
    };
    trendAlignment: {
        currentTrends: number; // 0-1 score
        emergingTrends: number;
        classicStyles: number;
        personalStyle: number;
    };
    influenceFactors: {
        socialMedia: number;
        friends: number;
        celebrities: number;
        brands: number;
        personal: number;
    };
    evolutionTracking: Array<{
        date: string;
        styleChanges: string[];
        confidenceScore: number;
    }>;
    lastAnalyzed: string;
    confidenceScore: number;
}

export interface WardrobeOptimization {
    id: string;
    userId: string;
    analysis: {
        totalItems: number;
        utilizationRate: number;
        gapAnalysis: Array<{
            category: string;
            priority: 'high' | 'medium' | 'low';
            reason: string;
            suggestedItems: string[];
        }>;
        redundancyAnalysis: Array<{
            category: string;
            redundantItems: string[];
            keepRecommendation: string;
            reason: string;
        }>;
        seasonalBalance: Record<string, number>;
        occasionCoverage: Record<string, number>;
    };
    recommendations: {
        itemsToAdd: Array<{
            category: string;
            description: string;
            priority: number;
            estimatedCost: number;
            reasoning: string;
        }>;
        itemsToRemove: Array<{
            itemId: string;
            reason: string;
            alternativeAction: 'sell' | 'donate' | 'store';
        }>;
        stylingTips: Array<{
            title: string;
            description: string;
            itemIds: string[];
        }>;
    };
    sustainabilityScore: number;
    costEfficiencyScore: number;
    styleCoherenceScore: number;
    lastOptimized: string;
}

export interface PersonalizedTrendPrediction {
    id: string;
    userId: string;
    predictions: Array<{
        trendId: string;
        trendName: string;
        category: string;
        personalRelevance: number; // 0-1 score
        adoptionProbability: number;
        timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
        reasoning: string[];
        suggestedItems: Array<{
            description: string;
            category: string;
            priceRange: { min: number; max: number };
        }>;
    }>;
    globalTrendAlignment: number;
    personalStyleConsistency: number;
    budgetConsiderations: {
        totalEstimatedCost: number;
        prioritizedSpending: Array<{
            category: string;
            amount: number;
            justification: string;
        }>;
    };
    generatedAt: string;
    validUntil: string;
}

export class DataDrivenFeaturesModel {
    /**
     * Update AI model metrics
     */
    static async updateAIModelMetrics(metricsData: Omit<AIModelMetrics, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIModelMetrics> {
        const query = `
      INSERT INTO ai_model_metrics (
        model_name, model_version, accuracy, precision, recall, f1_score,
        training_data_size, last_training_date, performance_metrics
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (model_name, model_version) 
      DO UPDATE SET
        accuracy = EXCLUDED.accuracy,
        precision = EXCLUDED.precision,
        recall = EXCLUDED.recall,
        f1_score = EXCLUDED.f1_score,
        training_data_size = EXCLUDED.training_data_size,
        last_training_date = EXCLUDED.last_training_date,
        performance_metrics = EXCLUDED.performance_metrics,
        updated_at = NOW()
      RETURNING *
    `;

        const values = [
            metricsData.modelName,
            metricsData.modelVersion,
            metricsData.accuracy,
            metricsData.precision,
            metricsData.recall,
            metricsData.f1Score,
            metricsData.trainingDataSize,
            metricsData.lastTrainingDate,
            JSON.stringify(metricsData.performanceMetrics),
        ];

        const result = await db.query(query, values);
        return this.mapRowToAIModelMetrics(result.rows[0]);
    }

    /**
     * Calculate item valuation
     */
    static async calculateItemValuation(itemId: string, factors: {
        originalPrice?: number;
        condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
        brand: string;
        category: string;
        age: number; // in months
    }): Promise<ItemValuation> {
        // Valuation algorithm
        const baseValue = factors.originalPrice || 100; // Default if no original price

        // Condition factor (0.2 - 1.0)
        const conditionFactors = {
            'new': 1.0,
            'excellent': 0.85,
            'good': 0.70,
            'fair': 0.50,
            'poor': 0.20,
        };
        const conditionFactor = conditionFactors[factors.condition];

        // Brand factor (0.5 - 1.5) - would be calculated from brand data
        const brandFactor = await this.getBrandFactor(factors.brand);

        // Trend factor (0.7 - 1.3) - based on current trends
        const trendFactor = await this.getTrendFactor(factors.category);

        // Depreciation (age-based)
        const monthlyDepreciation = 0.02; // 2% per month
        const depreciationRate = Math.max(0.1, 1 - (factors.age * monthlyDepreciation));

        // Rarity factor (0.8 - 2.0) - based on item availability
        const rarityFactor = await this.getRarityFactor(factors.brand, factors.category);

        const currentMarketValue = Math.round(
            baseValue * conditionFactor * brandFactor * trendFactor * depreciationRate * rarityFactor
        );

        const valuationData: Omit<ItemValuation, 'id'> = {
            itemId,
            originalPrice: factors.originalPrice,
            currentMarketValue,
            depreciationRate,
            conditionFactor,
            brandFactor,
            trendFactor,
            rarityFactor,
            valuationConfidence: 0.85, // Would be calculated based on data quality
            lastUpdated: new Date().toISOString(),
            valuationHistory: [],
        };

        const query = `
      INSERT INTO item_valuations (
        item_id, original_price, current_market_value, depreciation_rate,
        condition_factor, brand_factor, trend_factor, rarity_factor,
        valuation_confidence, valuation_history
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (item_id)
      DO UPDATE SET
        current_market_value = EXCLUDED.current_market_value,
        depreciation_rate = EXCLUDED.depreciation_rate,
        condition_factor = EXCLUDED.condition_factor,
        brand_factor = EXCLUDED.brand_factor,
        trend_factor = EXCLUDED.trend_factor,
        rarity_factor = EXCLUDED.rarity_factor,
        valuation_confidence = EXCLUDED.valuation_confidence,
        last_updated = NOW(),
        valuation_history = item_valuations.valuation_history || jsonb_build_array(
          jsonb_build_object(
            'date', NOW()::text,
            'value', item_valuations.current_market_value,
            'factors', jsonb_build_object(
              'condition', item_valuations.condition_factor,
              'brand', item_valuations.brand_factor,
              'trend', item_valuations.trend_factor,
              'rarity', item_valuations.rarity_factor
            )
          )
        )
      RETURNING *
    `;

        const values = [
            itemId,
            valuationData.originalPrice,
            valuationData.currentMarketValue,
            valuationData.depreciationRate,
            valuationData.conditionFactor,
            valuationData.brandFactor,
            valuationData.trendFactor,
            valuationData.rarityFactor,
            valuationData.valuationConfidence,
            JSON.stringify(valuationData.valuationHistory),
        ];

        const result = await db.query(query, values);
        return this.mapRowToItemValuation(result.rows[0]);
    }

    /**
     * Analyze user style DNA
     */
    static async analyzeStyleDNA(userId: string): Promise<StyleDNA> {
        // Get user's wardrobe and interaction data
        const wardrobeQuery = `
      SELECT vi.*, vi.metadata->>'category' as category, vi.metadata->>'color' as color,
             vi.metadata->>'style' as style, ui.interaction_type, ui.created_at as interaction_date
      FROM vufs_items vi
      LEFT JOIN user_interactions ui ON vi.id = ui.item_id
      WHERE vi.user_id = $1
      ORDER BY ui.created_at DESC
    `;

        const wardrobeResult = await db.query(wardrobeQuery, [userId]);
        const items = wardrobeResult.rows;

        // Analyze style patterns
        const styleAnalysis = this.analyzeStylePatterns(items);

        const styleDNA: Omit<StyleDNA, 'id'> = {
            userId,
            styleProfile: {
                primaryStyle: styleAnalysis.primaryStyle,
                secondaryStyles: styleAnalysis.secondaryStyles,
                colorPreferences: styleAnalysis.colorPreferences,
                patternPreferences: styleAnalysis.patternPreferences,
                fitPreferences: styleAnalysis.fitPreferences,
                occasionPreferences: styleAnalysis.occasionPreferences,
            },
            trendAlignment: {
                currentTrends: styleAnalysis.trendAlignment.current,
                emergingTrends: styleAnalysis.trendAlignment.emerging,
                classicStyles: styleAnalysis.trendAlignment.classic,
                personalStyle: styleAnalysis.trendAlignment.personal,
            },
            influenceFactors: {
                socialMedia: 0.3,
                friends: 0.2,
                celebrities: 0.15,
                brands: 0.25,
                personal: 0.1,
            },
            evolutionTracking: [],
            lastAnalyzed: new Date().toISOString(),
            confidenceScore: styleAnalysis.confidenceScore,
        };

        const query = `
      INSERT INTO style_dna (
        user_id, style_profile, trend_alignment, influence_factors,
        evolution_tracking, confidence_score
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id)
      DO UPDATE SET
        style_profile = EXCLUDED.style_profile,
        trend_alignment = EXCLUDED.trend_alignment,
        influence_factors = EXCLUDED.influence_factors,
        evolution_tracking = style_dna.evolution_tracking || jsonb_build_array(
          jsonb_build_object(
            'date', NOW()::text,
            'styleChanges', EXCLUDED.style_profile,
            'confidenceScore', EXCLUDED.confidence_score
          )
        ),
        confidence_score = EXCLUDED.confidence_score,
        last_analyzed = NOW()
      RETURNING *
    `;

        const values = [
            userId,
            JSON.stringify(styleDNA.styleProfile),
            JSON.stringify(styleDNA.trendAlignment),
            JSON.stringify(styleDNA.influenceFactors),
            JSON.stringify(styleDNA.evolutionTracking),
            styleDNA.confidenceScore,
        ];

        const result = await db.query(query, values);
        return this.mapRowToStyleDNA(result.rows[0]);
    }

    /**
     * Generate wardrobe optimization recommendations
     */
    static async generateWardrobeOptimization(userId: string): Promise<WardrobeOptimization> {
        // Get user's wardrobe data
        const wardrobeQuery = `
      SELECT vi.*, ui.interaction_count, ui.last_worn
      FROM vufs_items vi
      LEFT JOIN (
        SELECT item_id, COUNT(*) as interaction_count, MAX(created_at) as last_worn
        FROM user_interactions 
        WHERE interaction_type = 'worn'
        GROUP BY item_id
      ) ui ON vi.id = ui.item_id
      WHERE vi.user_id = $1
    `;

        const wardrobeResult = await db.query(wardrobeQuery, [userId]);
        const items = wardrobeResult.rows;

        // Analyze wardrobe
        const analysis = this.analyzeWardrobe(items);

        const optimization: Omit<WardrobeOptimization, 'id'> = {
            userId,
            analysis: {
                totalItems: items.length,
                utilizationRate: analysis.utilizationRate,
                gapAnalysis: analysis.gaps,
                redundancyAnalysis: analysis.redundancies,
                seasonalBalance: analysis.seasonalBalance,
                occasionCoverage: analysis.occasionCoverage,
            },
            recommendations: {
                itemsToAdd: analysis.recommendations.add,
                itemsToRemove: analysis.recommendations.remove,
                stylingTips: analysis.recommendations.styling,
            },
            sustainabilityScore: analysis.scores.sustainability,
            costEfficiencyScore: analysis.scores.costEfficiency,
            styleCoherenceScore: analysis.scores.styleCoherence,
            lastOptimized: new Date().toISOString(),
        };

        const query = `
      INSERT INTO wardrobe_optimizations (
        user_id, analysis, recommendations, sustainability_score,
        cost_efficiency_score, style_coherence_score
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id)
      DO UPDATE SET
        analysis = EXCLUDED.analysis,
        recommendations = EXCLUDED.recommendations,
        sustainability_score = EXCLUDED.sustainability_score,
        cost_efficiency_score = EXCLUDED.cost_efficiency_score,
        style_coherence_score = EXCLUDED.style_coherence_score,
        last_optimized = NOW()
      RETURNING *
    `;

        const values = [
            userId,
            JSON.stringify(optimization.analysis),
            JSON.stringify(optimization.recommendations),
            optimization.sustainabilityScore,
            optimization.costEfficiencyScore,
            optimization.styleCoherenceScore,
        ];

        const result = await db.query(query, values);
        return this.mapRowToWardrobeOptimization(result.rows[0]);
    }

    /**
     * Generate personalized trend predictions
     */
    static async generatePersonalizedTrendPredictions(userId: string): Promise<PersonalizedTrendPrediction> {
        // Get user's style DNA
        const styleDNA = await this.getStyleDNA(userId);

        // Get current global trends
        const trendsQuery = `
      SELECT * FROM trend_reports 
      WHERE target_audience IN ('public', 'premium')
      ORDER BY created_at DESC
      LIMIT 10
    `;

        const trendsResult = await db.query(trendsQuery);
        const trends = trendsResult.rows;

        // Generate personalized predictions
        const predictions = this.generateTrendPredictions(styleDNA, trends);

        const trendPrediction: Omit<PersonalizedTrendPrediction, 'id'> = {
            userId,
            predictions: predictions.items,
            globalTrendAlignment: predictions.globalAlignment,
            personalStyleConsistency: predictions.personalConsistency,
            budgetConsiderations: predictions.budgetConsiderations,
            generatedAt: new Date().toISOString(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        };

        const query = `
      INSERT INTO personalized_trend_predictions (
        user_id, predictions, global_trend_alignment, personal_style_consistency,
        budget_considerations, valid_until
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id)
      DO UPDATE SET
        predictions = EXCLUDED.predictions,
        global_trend_alignment = EXCLUDED.global_trend_alignment,
        personal_style_consistency = EXCLUDED.personal_style_consistency,
        budget_considerations = EXCLUDED.budget_considerations,
        generated_at = NOW(),
        valid_until = EXCLUDED.valid_until
      RETURNING *
    `;

        const values = [
            userId,
            JSON.stringify(trendPrediction.predictions),
            trendPrediction.globalTrendAlignment,
            trendPrediction.personalStyleConsistency,
            JSON.stringify(trendPrediction.budgetConsiderations),
            trendPrediction.validUntil,
        ];

        const result = await db.query(query, values);
        return this.mapRowToPersonalizedTrendPrediction(result.rows[0]);
    }

    // Helper methods
    private static async getBrandFactor(brand: string): Promise<number> {
        // Mock implementation - would query brand reputation data
        const brandFactors: Record<string, number> = {
            'luxury': 1.3,
            'premium': 1.1,
            'mainstream': 1.0,
            'budget': 0.8,
        };
        return brandFactors[brand] || 1.0;
    }

    private static async getTrendFactor(category: string): Promise<number> {
        // Mock implementation - would analyze current trend data
        const trendFactors: Record<string, number> = {
            'sustainable': 1.2,
            'vintage': 1.1,
            'fast_fashion': 0.9,
            'classic': 1.0,
        };
        return trendFactors[category] || 1.0;
    }

    private static async getRarityFactor(brand: string, category: string): Promise<number> {
        // Mock implementation - would analyze market availability
        return Math.random() * 0.4 + 0.8; // 0.8 - 1.2
    }

    private static analyzeStylePatterns(items: any[]): any {
        // Mock style analysis - would use ML algorithms
        return {
            primaryStyle: 'casual_chic',
            secondaryStyles: ['sustainable', 'vintage'],
            colorPreferences: {
                primary: ['earth_tones', 'neutrals'],
                secondary: ['pastels'],
                avoid: ['neon'],
            },
            patternPreferences: {
                preferred: ['solid', 'minimal_print'],
                neutral: ['stripes'],
                avoid: ['loud_patterns'],
            },
            fitPreferences: {
                tops: 'relaxed_fit',
                bottoms: 'tailored',
                dresses: 'a_line',
            },
            occasionPreferences: {
                casual: 0.6,
                work: 0.3,
                formal: 0.1,
            },
            trendAlignment: {
                current: 0.7,
                emerging: 0.5,
                classic: 0.8,
                personal: 0.9,
            },
            confidenceScore: 0.85,
        };
    }

    private static analyzeWardrobe(items: any[]): any {
        // Mock wardrobe analysis
        return {
            utilizationRate: 0.65,
            gaps: [
                {
                    category: 'blazers',
                    priority: 'high' as const,
                    reason: 'Missing professional wear options',
                    suggestedItems: ['structured blazer', 'casual blazer'],
                },
            ],
            redundancies: [
                {
                    category: 'basic_tees',
                    redundantItems: ['item_1', 'item_2', 'item_3'],
                    keepRecommendation: 'item_1',
                    reason: 'Similar style and color, keep highest quality',
                },
            ],
            seasonalBalance: {
                spring: 0.25,
                summer: 0.35,
                fall: 0.25,
                winter: 0.15,
            },
            occasionCoverage: {
                casual: 0.7,
                work: 0.2,
                formal: 0.1,
            },
            recommendations: {
                add: [
                    {
                        category: 'blazers',
                        description: 'Structured navy blazer for professional occasions',
                        priority: 1,
                        estimatedCost: 250,
                        reasoning: 'Fills gap in professional wardrobe',
                    },
                ],
                remove: [
                    {
                        itemId: 'item_old',
                        reason: 'Rarely worn, poor condition',
                        alternativeAction: 'donate' as const,
                    },
                ],
                styling: [
                    {
                        title: 'Casual Friday Look',
                        description: 'Combine blazer with jeans for smart-casual style',
                        itemIds: ['blazer_1', 'jeans_1', 'top_1'],
                    },
                ],
            },
            scores: {
                sustainability: 0.75,
                costEfficiency: 0.68,
                styleCoherence: 0.82,
            },
        };
    }

    private static async getStyleDNA(userId: string): Promise<StyleDNA | null> {
        const query = 'SELECT * FROM style_dna WHERE user_id = $1';
        const result = await db.query(query, [userId]);
        return result.rows.length > 0 ? this.mapRowToStyleDNA(result.rows[0]) : null;
    }

    private static generateTrendPredictions(styleDNA: StyleDNA | null, trends: any[]): any {
        // Mock trend prediction generation
        return {
            items: [
                {
                    trendId: 'trend_1',
                    trendName: 'Sustainable Minimalism',
                    category: 'lifestyle',
                    personalRelevance: 0.85,
                    adoptionProbability: 0.75,
                    timeframe: 'short_term' as const,
                    reasoning: ['Aligns with your sustainable preferences', 'Matches your minimalist style'],
                    suggestedItems: [
                        {
                            description: 'Organic cotton basic tee',
                            category: 'tops',
                            priceRange: { min: 50, max: 100 },
                        },
                    ],
                },
            ],
            globalAlignment: 0.72,
            personalConsistency: 0.88,
            budgetConsiderations: {
                totalEstimatedCost: 500,
                prioritizedSpending: [
                    {
                        category: 'basics',
                        amount: 200,
                        justification: 'Foundation pieces for sustainable wardrobe',
                    },
                ],
            },
        };
    }

    // Mapping methods
    private static mapRowToAIModelMetrics(row: any): AIModelMetrics {
        return {
            id: row.id,
            modelName: row.model_name,
            modelVersion: row.model_version,
            accuracy: row.accuracy,
            precision: row.precision,
            recall: row.recall,
            f1Score: row.f1_score,
            trainingDataSize: row.training_data_size,
            lastTrainingDate: row.last_training_date,
            performanceMetrics: row.performance_metrics,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    private static mapRowToItemValuation(row: any): ItemValuation {
        return {
            id: row.id,
            itemId: row.item_id,
            originalPrice: row.original_price,
            currentMarketValue: row.current_market_value,
            depreciationRate: row.depreciation_rate,
            conditionFactor: row.condition_factor,
            brandFactor: row.brand_factor,
            trendFactor: row.trend_factor,
            rarityFactor: row.rarity_factor,
            valuationConfidence: row.valuation_confidence,
            lastUpdated: row.last_updated,
            valuationHistory: row.valuation_history || [],
        };
    }

    private static mapRowToStyleDNA(row: any): StyleDNA {
        return {
            id: row.id,
            userId: row.user_id,
            styleProfile: row.style_profile,
            trendAlignment: row.trend_alignment,
            influenceFactors: row.influence_factors,
            evolutionTracking: row.evolution_tracking || [],
            lastAnalyzed: row.last_analyzed,
            confidenceScore: row.confidence_score,
        };
    }

    private static mapRowToWardrobeOptimization(row: any): WardrobeOptimization {
        return {
            id: row.id,
            userId: row.user_id,
            analysis: row.analysis,
            recommendations: row.recommendations,
            sustainabilityScore: row.sustainability_score,
            costEfficiencyScore: row.cost_efficiency_score,
            styleCoherenceScore: row.style_coherence_score,
            lastOptimized: row.last_optimized,
        };
    }

    private static mapRowToPersonalizedTrendPrediction(row: any): PersonalizedTrendPrediction {
        return {
            id: row.id,
            userId: row.user_id,
            predictions: row.predictions,
            globalTrendAlignment: row.global_trend_alignment,
            personalStyleConsistency: row.personal_style_consistency,
            budgetConsiderations: row.budget_considerations,
            generatedAt: row.generated_at,
            validUntil: row.valid_until,
        };
    }
}