/**
 * Size conversion utilities for different international standards
 */

export interface SizeConversion {
  BR: string;
  US: string;
  EU: string;
  UK: string;
}

export class MeasurementUtils {
  /**
   * Women's clothing size conversions
   */
  static readonly WOMENS_CLOTHING_SIZES: Record<string, SizeConversion> = {
    'PP': { BR: 'PP', US: 'XS', EU: '32', UK: '4' },
    'P': { BR: 'P', US: 'S', EU: '34', UK: '6' },
    'M': { BR: 'M', US: 'M', EU: '36', UK: '8' },
    'G': { BR: 'G', US: 'L', EU: '38', UK: '10' },
    'GG': { BR: 'GG', US: 'XL', EU: '40', UK: '12' },
    'XGG': { BR: 'XGG', US: 'XXL', EU: '42', UK: '14' },
  };

  /**
   * Men's clothing size conversions
   */
  static readonly MENS_CLOTHING_SIZES: Record<string, SizeConversion> = {
    'PP': { BR: 'PP', US: 'XS', EU: '44', UK: '34' },
    'P': { BR: 'P', US: 'S', EU: '46', UK: '36' },
    'M': { BR: 'M', US: 'M', EU: '48', UK: '38' },
    'G': { BR: 'G', US: 'L', EU: '50', UK: '40' },
    'GG': { BR: 'GG', US: 'XL', EU: '52', UK: '42' },
    'XGG': { BR: 'XGG', US: 'XXL', EU: '54', UK: '44' },
  };

  /**
   * Shoe size conversions (unisex)
   */
  static readonly SHOE_SIZES: Record<string, SizeConversion> = {
    '34': { BR: '34', US: '4', EU: '34', UK: '2' },
    '35': { BR: '35', US: '5', EU: '35', UK: '3' },
    '36': { BR: '36', US: '6', EU: '36', UK: '4' },
    '37': { BR: '37', US: '7', EU: '37', UK: '5' },
    '38': { BR: '38', US: '8', EU: '38', UK: '6' },
    '39': { BR: '39', US: '9', EU: '39', UK: '7' },
    '40': { BR: '40', US: '10', EU: '40', UK: '8' },
    '41': { BR: '41', US: '11', EU: '41', UK: '9' },
    '42': { BR: '42', US: '12', EU: '42', UK: '10' },
    '43': { BR: '43', US: '13', EU: '43', UK: '11' },
    '44': { BR: '44', US: '14', EU: '44', UK: '12' },
  };

  /**
   * Convert size between different standards
   */
  static convertSize(
    size: string, 
    fromStandard: keyof SizeConversion, 
    toStandard: keyof SizeConversion,
    category: 'womens_clothing' | 'mens_clothing' | 'shoes'
  ): string | null {
    let sizeChart: Record<string, SizeConversion>;
    
    switch (category) {
      case 'womens_clothing':
        sizeChart = this.WOMENS_CLOTHING_SIZES;
        break;
      case 'mens_clothing':
        sizeChart = this.MENS_CLOTHING_SIZES;
        break;
      case 'shoes':
        sizeChart = this.SHOE_SIZES;
        break;
      default:
        return null;
    }

    // Find the size entry that matches the input
    for (const [key, conversion] of Object.entries(sizeChart)) {
      if (conversion[fromStandard] === size) {
        return conversion[toStandard];
      }
    }

    return null;
  }

  /**
   * Get all size conversions for a given size
   */
  static getAllConversions(
    size: string,
    fromStandard: keyof SizeConversion,
    category: 'womens_clothing' | 'mens_clothing' | 'shoes'
  ): SizeConversion | null {
    let sizeChart: Record<string, SizeConversion>;
    
    switch (category) {
      case 'womens_clothing':
        sizeChart = this.WOMENS_CLOTHING_SIZES;
        break;
      case 'mens_clothing':
        sizeChart = this.MENS_CLOTHING_SIZES;
        break;
      case 'shoes':
        sizeChart = this.SHOE_SIZES;
        break;
      default:
        return null;
    }

    for (const [key, conversion] of Object.entries(sizeChart)) {
      if (conversion[fromStandard] === size) {
        return conversion;
      }
    }

    return null;
  }

  /**
   * Validate measurement data
   */
  static validateMeasurements(measurements: any): string[] {
    const errors: string[] = [];

    if (measurements.height && (measurements.height < 100 || measurements.height > 250)) {
      errors.push('Height must be between 100 and 250 cm');
    }

    if (measurements.weight && (measurements.weight < 30 || measurements.weight > 300)) {
      errors.push('Weight must be between 30 and 300 kg');
    }

    if (measurements.sizes) {
      const validStandards = ['BR', 'US', 'EU', 'UK'];
      for (const [standard, sizeChart] of Object.entries(measurements.sizes)) {
        if (!validStandards.includes(standard)) {
          errors.push(`Invalid size standard: ${standard}`);
        }
      }
    }

    return errors;
  }

  /**
   * Convert height between units
   */
  static convertHeight(height: number, fromUnit: 'cm' | 'ft', toUnit: 'cm' | 'ft'): number {
    if (fromUnit === toUnit) return height;
    
    if (fromUnit === 'cm' && toUnit === 'ft') {
      return Math.round((height / 30.48) * 100) / 100; // Convert cm to feet with 2 decimal places
    }
    
    if (fromUnit === 'ft' && toUnit === 'cm') {
      return Math.round(height * 30.48); // Convert feet to cm
    }
    
    return height;
  }

  /**
   * Convert weight between units
   */
  static convertWeight(weight: number, fromUnit: 'kg' | 'lbs', toUnit: 'kg' | 'lbs'): number {
    if (fromUnit === toUnit) return weight;
    
    if (fromUnit === 'kg' && toUnit === 'lbs') {
      return Math.round(weight * 2.20462 * 100) / 100; // Convert kg to lbs with 2 decimal places
    }
    
    if (fromUnit === 'lbs' && toUnit === 'kg') {
      return Math.round((weight / 2.20462) * 100) / 100; // Convert lbs to kg with 2 decimal places
    }
    
    return weight;
  }
}