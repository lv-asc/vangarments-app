import { AWSService } from './awsService';
import {
  VUFS_BRANDS,
  VUFS_COLORS,
  APPAREL_PIECE_TYPES,
  FOOTWEAR_TYPES,
  APPAREL_MATERIALS,
  FOOTWEAR_MATERIALS
} from '@vangarments/shared/constants/vufs';
import {
  VUFSDomain,
  CategoryHierarchy,
  BrandHierarchy,
  ItemMetadata,
  ItemCondition,
  VUFSColor,
  ApparelPieceType,
  FootwearType
} from '@vangarments/shared/types/vufs';

export interface AIAnalysisResult {
  domain: VUFSDomain | null;
  detectedBrand: string | null;
  detectedPieceType: string | null;
  detectedColor: string | null;
  detectedMaterial: string | null;
  detectedViewpoint?: string;
  confidence: {
    overall: number;
    brand: number;
    pieceType: number;
    color: number;
    material: number;
  };
  rawLabels: any[];
  detectedText: string[];
  backgroundRemoved: boolean;
  processedImageUrl?: string;
}

export interface VUFSExtractionResult {
  category: Partial<CategoryHierarchy>;
  brand: Partial<BrandHierarchy>;
  metadata: Partial<ItemMetadata>;
  condition: Partial<ItemCondition>;
  confidence: {
    category: number;
    brand: number;
    metadata: number;
    condition: number;
    overall: number;
  };
  suggestions: {
    category: string[];
    brand: string[];
    colors: string[];
    materials: string[];
  };
}

export interface UserFeedback {
  itemId: string;
  userId: string;
  aiSuggestions: VUFSExtractionResult;
  userCorrections: {
    category?: CategoryHierarchy;
    brand?: BrandHierarchy;
    metadata?: Partial<ItemMetadata>;
    condition?: ItemCondition;
  };
  feedbackType: 'correction' | 'confirmation' | 'partial_correction';
  timestamp: Date;
}

export class AIProcessingService {
  /**
   * Process fashion item image with comprehensive AI analysis
   */
  static async processItemImage(
    imageBuffer: Buffer,
    originalFilename: string
  ): Promise<AIAnalysisResult> {
    try {
      // 1. Remove background
      const processedBuffer = await AWSService.removeBackground(imageBuffer);

      // 2. Upload processed image
      const imageKey = `processed/${Date.now()}-${originalFilename}`;
      const processedImageUrl = await AWSService.uploadImage(
        processedBuffer,
        imageKey,
        'image/jpeg'
      );

      // 3. Detect labels using AWS Rekognition
      const labels = await AWSService.detectLabels(processedBuffer);

      // 4. Detect text (for brand/size detection)
      const textDetections = await AWSService.detectText(processedBuffer);

      // 5. Try custom fashion model
      const customModelResult = await AWSService.invokeFashionModel(processedBuffer);

      // 6. Analyze and extract fashion attributes
      const analysis = this.analyzeFashionAttributes(
        labels,
        textDetections,
        customModelResult
      );

      return {
        ...analysis,
        backgroundRemoved: true,
        processedImageUrl,
      };
    } catch (error) {
      console.error('AI processing error:', error);

      // Fallback: basic analysis without processing
      const labels = await AWSService.detectLabels(imageBuffer);
      const textDetections = await AWSService.detectText(imageBuffer);

      const analysis = this.analyzeFashionAttributes(labels, textDetections, null);

      return {
        ...analysis,
        backgroundRemoved: false,
      };
    }
  }

  /**
   * Extract VUFS properties from AI analysis with confidence scoring
   */
  static async extractVUFSProperties(
    imageBuffer: Buffer,
    originalFilename: string
  ): Promise<VUFSExtractionResult> {
    const aiAnalysis = await this.processItemImage(imageBuffer, originalFilename);

    // Extract VUFS category hierarchy
    const category = this.extractCategoryHierarchy(aiAnalysis);

    // Extract brand hierarchy
    const brand = this.extractBrandHierarchy(aiAnalysis);

    // Extract metadata
    const metadata = this.extractItemMetadata(aiAnalysis);

    // Extract condition assessment
    const condition = this.extractConditionAssessment(aiAnalysis);

    // Calculate confidence scores
    const confidence = this.calculateVUFSConfidence(aiAnalysis, category, brand, metadata, condition);

    // Generate suggestions for user review
    const suggestions = this.generateSuggestions(aiAnalysis);

    return {
      category,
      brand,
      metadata,
      condition,
      confidence,
      suggestions,
    };
  }

  /**
   * Store user feedback for AI training improvement
   */
  static async storeFeedback(feedback: UserFeedback): Promise<void> {
    try {
      // Store feedback in database for model training
      // This would be used to improve AI accuracy over time
      console.log('Storing AI feedback for training:', feedback);

      // In production, this would:
      // 1. Store feedback in training database
      // 2. Queue for model retraining
      // 3. Update confidence scoring algorithms
      // 4. Improve suggestion algorithms
    } catch (error) {
      console.error('Failed to store AI feedback:', error);
    }
  }

  /**
   * Get AI confidence score for a specific property
   */
  static getConfidenceScore(
    property: string,
    detectedValue: any,
    aiAnalysis: AIAnalysisResult
  ): number {
    // Base confidence from AI analysis
    let baseConfidence = aiAnalysis.confidence.overall;

    // Adjust based on property type and detection quality
    switch (property) {
      case 'brand':
        return aiAnalysis.detectedBrand ? Math.min(baseConfidence + 20, 95) : 0;
      case 'color':
        return aiAnalysis.detectedColor ? Math.min(baseConfidence + 15, 90) : 0;
      case 'pieceType':
        return aiAnalysis.detectedPieceType ? Math.min(baseConfidence + 10, 85) : 0;
      case 'material':
        return aiAnalysis.detectedMaterial ? Math.min(baseConfidence + 5, 80) : 0;
      default:
        return baseConfidence;
    }
  }

  /**
   * Analyze fashion attributes from AI detection results
   */
  private static analyzeFashionAttributes(
    labels: any[],
    textDetections: any[],
    customModelResult: any
  ): Omit<AIAnalysisResult, 'backgroundRemoved' | 'processedImageUrl'> {
    // Extract detected text
    const detectedText = textDetections
      .filter(detection => detection.Type === 'LINE')
      .map(detection => detection.DetectedText)
      .filter(text => text && text.length > 1);

    // Determine domain (APPAREL vs FOOTWEAR)
    const domain = this.detectDomain(labels, customModelResult);

    // Detect brand
    const detectedBrand = this.detectBrand(labels, detectedText, customModelResult);

    // Detect piece type
    const detectedPieceType = this.detectPieceType(labels, domain, customModelResult);

    // Detect color
    const detectedColor = this.detectColor(labels, customModelResult);

    // Detect material
    const detectedMaterial = this.detectMaterial(labels, domain, customModelResult);

    // Detect viewpoint/label
    const detectedViewpoint = this.detectViewpoint(labels, detectedText, customModelResult);

    // Calculate confidence scores
    const confidence = this.calculateConfidence(
      labels,
      detectedBrand,
      detectedPieceType,
      detectedColor,
      detectedMaterial,
      customModelResult
    );

    return {
      domain,
      detectedBrand,
      detectedPieceType,
      detectedColor,
      detectedMaterial,
      detectedViewpoint,
      confidence,
      rawLabels: labels,
      detectedText,
    };
  }

  /**
   * Detect viewpoint/label from text and labels
   */
  private static detectViewpoint(
    labels: any[],
    detectedText: string[],
    customModelResult: any
  ): string {
    const labelNames = labels.map(l => l.Name.toLowerCase());
    const allText = detectedText.join(' ').toLowerCase();

    // 1. Check for Tags
    // Composition/Care Tag
    const careKeywords = ['wash', 'dry', 'iron', 'bleach', 'cotton', 'polyester', 'wool', '%'];
    if (careKeywords.filter(k => allText.includes(k)).length >= 2) {
      return 'Composition Tag';
    }

    // Main Brand Tag
    const sizeKeywords = ['s', 'm', 'l', 'xl', 'xxl', 'small', 'medium', 'large'];
    const brandTagKeywords = ['made in', 'rn', 'ca'];
    if (
      (sizeKeywords.some(k => new RegExp(`\\b${k}\\b`).test(allText)) && labelNames.some(l => l.includes('text'))) ||
      brandTagKeywords.some(k => allText.includes(k)) ||
      (labelNames.some(l => l.includes('label') && !l.includes('clothing')))
    ) {
      return 'Main Tag';
    }

    // 2. Check for Specific Details
    if (labelNames.includes('zipper')) return 'Zipper';
    if (labelNames.includes('button')) return 'Button';
    if (labelNames.includes('pocket')) return 'Pocket';

    // Damage
    const damageKeywords = ['stain', 'hole', 'tear', 'damage', 'rip'];
    if (damageKeywords.some(k => labelNames.some(l => l.includes(k)))) {
      return 'Damage';
    }

    // 3. Close-up / Texture
    if (labelNames.some(l => l.includes('texture') || l.includes('pattern') || l.includes('macro'))) {
      return 'Details';
    }

    // 4. Default to Front (standard view)
    // We could try to distinguish Back if we had a specific model, but heuristics are risky.
    return 'Front';
  }

  /**
   * Detect if item is APPAREL or FOOTWEAR
   */
  private static detectDomain(labels: any[], customModelResult: any): VUFSDomain | null {
    if (customModelResult?.domain) {
      return customModelResult.domain;
    }

    const labelNames = labels.map(label => label.Name.toLowerCase());

    // Check for footwear indicators
    const footwearKeywords = [
      'shoe', 'boot', 'sneaker', 'sandal', 'heel', 'loafer',
      'footwear', 'sole', 'lace', 'athletic shoe'
    ];

    const hasFootwearIndicators = footwearKeywords.some(keyword =>
      labelNames.some(label => label.includes(keyword))
    );

    if (hasFootwearIndicators) {
      return 'FOOTWEAR';
    }

    // Check for apparel indicators
    const apparelKeywords = [
      'clothing', 'shirt', 'jacket', 'dress', 'pants', 'skirt',
      'top', 'blouse', 'sweater', 'coat', 'vest', 'shorts'
    ];

    const hasApparelIndicators = apparelKeywords.some(keyword =>
      labelNames.some(label => label.includes(keyword))
    );

    if (hasApparelIndicators) {
      return 'APPAREL';
    }

    return null;
  }

  /**
   * Detect brand from text and labels
   */
  private static detectBrand(
    labels: any[],
    detectedText: string[],
    customModelResult: any
  ): string | null {
    if (customModelResult?.brand) {
      return customModelResult.brand;
    }

    // Check detected text for brand names
    const allText = detectedText.join(' ').toLowerCase();

    for (const brand of VUFS_BRANDS) {
      const brandName = brand.replace('®', '').toLowerCase();
      if (allText.includes(brandName)) {
        return brand;
      }
    }

    // Check labels for brand-related terms
    const brandLabels = labels.filter(label =>
      label.Name.toLowerCase().includes('logo') ||
      label.Name.toLowerCase().includes('brand') ||
      label.Name.toLowerCase().includes('text')
    );

    // This would be enhanced with a brand logo recognition model
    return null;
  }

  /**
   * Detect piece type based on domain
   */
  private static detectPieceType(
    labels: any[],
    domain: VUFSDomain | null,
    customModelResult: any
  ): string | null {
    if (customModelResult?.pieceType) {
      return customModelResult.pieceType;
    }

    const labelNames = labels.map(label => label.Name.toLowerCase());

    if (domain === 'APPAREL') {
      for (const pieceType of APPAREL_PIECE_TYPES) {
        const typeKeywords = this.getPieceTypeKeywords(pieceType);
        if (typeKeywords.some(keyword =>
          labelNames.some(label => label.includes(keyword.toLowerCase()))
        )) {
          return pieceType;
        }
      }
    } else if (domain === 'FOOTWEAR') {
      for (const footwearType of FOOTWEAR_TYPES) {
        const typeKeywords = this.getFootwearTypeKeywords(footwearType);
        if (typeKeywords.some(keyword =>
          labelNames.some(label => label.includes(keyword.toLowerCase()))
        )) {
          return footwearType;
        }
      }
    }

    return null;
  }

  /**
   * Detect color from labels
   */
  private static detectColor(labels: any[], customModelResult: any): string | null {
    if (customModelResult?.color) {
      return customModelResult.color;
    }

    const labelNames = labels.map(label => label.Name.toLowerCase());

    for (const color of VUFS_COLORS) {
      const colorKeywords = color.toLowerCase().split(' ');
      if (colorKeywords.every(keyword =>
        labelNames.some(label => label.includes(keyword))
      )) {
        return color;
      }
    }

    return null;
  }

  /**
   * Detect material based on domain and labels
   */
  private static detectMaterial(
    labels: any[],
    domain: VUFSDomain | null,
    customModelResult: any
  ): string | null {
    if (customModelResult?.material) {
      return customModelResult.material;
    }

    const labelNames = labels.map(label => label.Name.toLowerCase());
    const materials = domain === 'FOOTWEAR' ? FOOTWEAR_MATERIALS : APPAREL_MATERIALS;

    for (const material of materials) {
      if (labelNames.some(label => label.includes(material.toLowerCase()))) {
        return material;
      }
    }

    return null;
  }

  /**
   * Calculate confidence scores
   */
  private static calculateConfidence(
    labels: any[],
    detectedBrand: string | null,
    detectedPieceType: string | null,
    detectedColor: string | null,
    detectedMaterial: string | null,
    customModelResult: any
  ) {
    const baseConfidence = customModelResult?.confidence || 0.5;

    return {
      overall: Math.round(baseConfidence * 100),
      brand: detectedBrand ? (customModelResult?.brandConfidence || 70) : 0,
      pieceType: detectedPieceType ? (customModelResult?.pieceTypeConfidence || 80) : 0,
      color: detectedColor ? (customModelResult?.colorConfidence || 85) : 0,
      material: detectedMaterial ? (customModelResult?.materialConfidence || 60) : 0,
    };
  }

  /**
   * Get keywords for piece type detection
   */
  private static getPieceTypeKeywords(pieceType: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'Shirts': ['shirt', 'blouse', 'button-up'],
      'Jackets': ['jacket', 'blazer', 'coat'],
      'Pants': ['pants', 'trousers', 'jeans'],
      'Dresses': ['dress', 'gown'],
      'Tops': ['top', 'shirt', 'blouse'],
      'Shorts': ['shorts'],
      'Sweats': ['sweatshirt', 'hoodie', 'sweatpants'],
      'Tank Tops': ['tank', 'camisole'],
      'Bags': ['bag', 'purse', 'handbag', 'backpack'],
      'Jewelry': ['jewelry', 'necklace', 'bracelet', 'ring'],
      'Eyewear': ['glasses', 'sunglasses'],
    };

    return keywordMap[pieceType] || [pieceType.toLowerCase()];
  }

  /**
   * Get keywords for footwear type detection
   */
  private static getFootwearTypeKeywords(footwearType: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'Sneakers': ['sneaker', 'athletic shoe', 'running shoe'],
      'Boots': ['boot', 'ankle boot'],
      'Sandals': ['sandal', 'flip-flop'],
      'Dress Shoes': ['dress shoe', 'oxford', 'loafer'],
      'Athletic': ['athletic', 'sport', 'running'],
    };

    return keywordMap[footwearType] || [footwearType.toLowerCase()];
  }

  /**
   * Extract VUFS category hierarchy from AI analysis
   */
  private static extractCategoryHierarchy(aiAnalysis: AIAnalysisResult): Partial<CategoryHierarchy> {
    const category: Partial<CategoryHierarchy> = {};

    if (aiAnalysis.domain === 'APPAREL') {
      // Map detected piece type to VUFS hierarchy
      if (aiAnalysis.detectedPieceType) {
        category.page = 'Apparel';
        category.blueSubcategory = this.mapToBlueSubcategory(aiAnalysis.detectedPieceType);
        category.whiteSubcategory = aiAnalysis.detectedPieceType;
        category.graySubcategory = this.inferGraySubcategory(aiAnalysis);
      }
    } else if (aiAnalysis.domain === 'FOOTWEAR') {
      category.page = 'Footwear';
      category.blueSubcategory = this.mapFootwearToBlueSubcategory(aiAnalysis.detectedPieceType);
      category.whiteSubcategory = aiAnalysis.detectedPieceType || 'Shoes';
      category.graySubcategory = this.inferFootwearGraySubcategory(aiAnalysis);
    }

    return category;
  }

  /**
   * Extract brand hierarchy from AI analysis
   */
  private static extractBrandHierarchy(aiAnalysis: AIAnalysisResult): Partial<BrandHierarchy> {
    const brand: Partial<BrandHierarchy> = {};

    if (aiAnalysis.detectedBrand) {
      brand.brand = aiAnalysis.detectedBrand;
      // Try to detect line/collaboration from text
      const detectedText = aiAnalysis.detectedText.join(' ').toLowerCase();
      brand.line = this.detectBrandLine(aiAnalysis.detectedBrand, detectedText);
      brand.collaboration = this.detectCollaboration(detectedText);
    }

    return brand;
  }

  /**
   * Extract item metadata from AI analysis
   */
  private static extractItemMetadata(aiAnalysis: AIAnalysisResult): Partial<ItemMetadata> {
    const metadata: Partial<ItemMetadata> = {};

    // Extract composition
    if (aiAnalysis.detectedMaterial) {
      metadata.composition = [{
        material: aiAnalysis.detectedMaterial,
        percentage: 100 // Default, user can adjust
      }];
    }

    // Extract colors
    if (aiAnalysis.detectedColor) {
      metadata.colors = [{
        primary: aiAnalysis.detectedColor,
        undertones: this.detectUndertones(aiAnalysis)
      }];
    }

    // Extract care instructions (basic defaults based on material)
    if (aiAnalysis.detectedMaterial) {
      metadata.careInstructions = this.generateCareInstructions(aiAnalysis.detectedMaterial);
    }

    return metadata;
  }

  /**
   * Extract condition assessment from AI analysis
   */
  private static extractConditionAssessment(aiAnalysis: AIAnalysisResult): Partial<ItemCondition> {
    const condition: Partial<ItemCondition> = {};

    // Analyze image quality and visible wear
    const qualityScore = this.assessImageQuality(aiAnalysis);
    const wearIndicators = this.detectWearIndicators(aiAnalysis);

    if (qualityScore > 0.8 && wearIndicators.length === 0) {
      condition.status = 'Excellent Used';
    } else if (qualityScore > 0.6 && wearIndicators.length <= 1) {
      condition.status = 'Good';
    } else if (qualityScore > 0.4) {
      condition.status = 'Fair';
    } else {
      condition.status = 'Poor';
    }

    condition.defects = wearIndicators;

    return condition;
  }

  /**
   * Calculate VUFS confidence scores
   */
  private static calculateVUFSConfidence(
    aiAnalysis: AIAnalysisResult,
    category: Partial<CategoryHierarchy>,
    brand: Partial<BrandHierarchy>,
    metadata: Partial<ItemMetadata>,
    condition: Partial<ItemCondition>
  ) {
    const categoryConfidence = Object.keys(category).length > 0 ?
      Math.min(aiAnalysis.confidence.pieceType + 10, 90) : 0;

    const brandConfidence = brand.brand ?
      Math.min(aiAnalysis.confidence.brand + 15, 95) : 0;

    const metadataConfidence = (metadata.composition || metadata.colors) ?
      Math.min((aiAnalysis.confidence.color + aiAnalysis.confidence.material) / 2 + 10, 85) : 0;

    const conditionConfidence = condition.status ? 75 : 0; // Base confidence for condition assessment

    const overall = Math.round(
      (categoryConfidence + brandConfidence + metadataConfidence + conditionConfidence) / 4
    );

    return {
      category: categoryConfidence,
      brand: brandConfidence,
      metadata: metadataConfidence,
      condition: conditionConfidence,
      overall,
    };
  }

  /**
   * Generate suggestions for user review
   */
  private static generateSuggestions(aiAnalysis: AIAnalysisResult) {
    return {
      category: this.generateCategorySuggestions(aiAnalysis),
      brand: this.generateBrandSuggestions(aiAnalysis),
      colors: this.generateColorSuggestions(aiAnalysis),
      materials: this.generateMaterialSuggestions(aiAnalysis),
    };
  }

  // Helper methods for mapping and detection
  private static mapToBlueSubcategory(pieceType: string): string {
    const mapping: Record<string, string> = {
      'Shirts': 'Tops',
      'Tops': 'Tops',
      'Tank Tops': 'Tops',
      'Pants': 'Bottoms',
      'Shorts': 'Bottoms',
      'Dresses': 'Dresses',
      'Jackets': 'Outerwear',
      'Sweats': 'Casual',
      'Accessories': 'Accessories',
    };
    return mapping[pieceType] || 'Other';
  }

  private static mapFootwearToBlueSubcategory(pieceType: string | null): string {
    if (!pieceType) return 'Shoes';

    const mapping: Record<string, string> = {
      'Sneakers': 'Athletic',
      'Boots': 'Boots',
      'Sandals': 'Casual',
      'Dress Shoes': 'Formal',
      'Athletic': 'Athletic',
    };
    return mapping[pieceType] || 'Casual';
  }

  private static inferGraySubcategory(aiAnalysis: AIAnalysisResult): string {
    // Infer style/occasion from labels and context
    const labels = aiAnalysis.rawLabels.map(l => l.Name.toLowerCase());

    if (labels.some(l => l.includes('formal') || l.includes('business'))) {
      return 'Formal';
    } else if (labels.some(l => l.includes('sport') || l.includes('athletic'))) {
      return 'Athletic';
    } else if (labels.some(l => l.includes('casual'))) {
      return 'Casual';
    }

    return 'Casual'; // Default
  }

  private static inferFootwearGraySubcategory(aiAnalysis: AIAnalysisResult): string {
    const labels = aiAnalysis.rawLabels.map(l => l.Name.toLowerCase());

    if (labels.some(l => l.includes('running') || l.includes('sport'))) {
      return 'Athletic';
    } else if (labels.some(l => l.includes('dress') || l.includes('formal'))) {
      return 'Formal';
    }

    return 'Casual';
  }

  private static detectBrandLine(brand: string, detectedText: string): string | undefined {
    // Common brand lines detection
    const brandLines: Record<string, string[]> = {
      'Adidas': ['originals', 'performance', 'neo'],
      'Nike': ['air', 'dunk', 'jordan', 'sb'],
      'Zara': ['basic', 'trf', 'woman'],
    };

    const lines = brandLines[brand] || [];
    return lines.find(line => detectedText.includes(line));
  }

  private static detectCollaboration(detectedText: string): string | undefined {
    // Look for collaboration indicators (x, collaboration, etc.)
    if (detectedText.includes(' x ') || detectedText.includes('collaboration')) {
      // Extract collaboration partner (simplified)
      const parts = detectedText.split(' x ');
      if (parts.length > 1) {
        return parts[1].split(' ')[0];
      }
    }
    return undefined;
  }

  private static detectUndertones(aiAnalysis: AIAnalysisResult): string[] {
    // Analyze color undertones from labels
    const colorLabels = aiAnalysis.rawLabels
      .filter(l => l.Name.toLowerCase().includes('color') ||
        VUFS_COLORS.some(c => l.Name.toLowerCase().includes(c.toLowerCase())))
      .map(l => l.Name);

    return colorLabels.slice(0, 2); // Max 2 undertones
  }

  private static generateCareInstructions(material: string): string[] {
    const careMap: Record<string, string[]> = {
      'Cotton': ['Machine wash cold', 'Tumble dry low', 'Iron medium heat'],
      'Polyester': ['Machine wash warm', 'Tumble dry low', 'Do not iron'],
      'Wool': ['Hand wash cold', 'Lay flat to dry', 'Dry clean recommended'],
      'Silk': ['Hand wash cold', 'Air dry', 'Dry clean only'],
      'Denim': ['Machine wash cold', 'Hang dry', 'Iron medium heat'],
    };

    return careMap[material] || ['Follow care label instructions'];
  }

  private static assessImageQuality(aiAnalysis: AIAnalysisResult): number {
    // Assess image quality based on confidence and label clarity
    return aiAnalysis.confidence.overall / 100;
  }

  private static detectWearIndicators(aiAnalysis: AIAnalysisResult): string[] {
    const wearKeywords = ['worn', 'faded', 'stain', 'hole', 'tear', 'damage'];
    const labels = aiAnalysis.rawLabels.map(l => l.Name.toLowerCase());

    return wearKeywords.filter(keyword =>
      labels.some(label => label.includes(keyword))
    );
  }

  private static generateCategorySuggestions(aiAnalysis: AIAnalysisResult): string[] {
    if (aiAnalysis.domain === 'APPAREL') {
      return APPAREL_PIECE_TYPES.slice(0, 5);
    } else if (aiAnalysis.domain === 'FOOTWEAR') {
      return FOOTWEAR_TYPES.slice(0, 5);
    }
    return [];
  }

  private static generateBrandSuggestions(aiAnalysis: AIAnalysisResult): string[] {
    return VUFS_BRANDS.slice(0, 10);
  }

  private static generateColorSuggestions(aiAnalysis: AIAnalysisResult): string[] {
    return VUFS_COLORS.slice(0, 10);
  }

  private static generateMaterialSuggestions(aiAnalysis: AIAnalysisResult): string[] {
    if (aiAnalysis.domain === 'APPAREL') {
      return APPAREL_MATERIALS.slice(0, 8);
    } else if (aiAnalysis.domain === 'FOOTWEAR') {
      return FOOTWEAR_MATERIALS.slice(0, 8);
    }
    return [];
  }
}