/**
 * Size conversion utilities for different international standards
 */

export interface SizeConversion {
  BR: string;
  US: string;
  EU: string;
  UK: string;
}

export type SizeCategory =
  | 'womens_clothing'
  | 'mens_clothing'
  | 'shoes'
  | 'shoes_womens'
  | 'shoes_mens'
  | 'waist_pants'
  | 'rings';

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
    'XXGG': { BR: 'XXGG', US: 'XXXL', EU: '44', UK: '16' },
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
    'XXGG': { BR: 'XXGG', US: 'XXXL', EU: '56', UK: '46' },
  };

  /**
   * Shoe size conversions (unisex/men's - BR uses same as EU typically)
   * Includes half sizes
   */
  static readonly SHOE_SIZES: Record<string, SizeConversion> = {
    '33': { BR: '33', US: '3', EU: '33', UK: '1' },
    '34': { BR: '34', US: '4', EU: '34', UK: '2' },
    '34.5': { BR: '34.5', US: '4.5', EU: '34.5', UK: '2.5' },
    '35': { BR: '35', US: '5', EU: '35', UK: '3' },
    '35.5': { BR: '35.5', US: '5.5', EU: '35.5', UK: '3.5' },
    '36': { BR: '36', US: '6', EU: '36', UK: '4' },
    '36.5': { BR: '36.5', US: '6.5', EU: '36.5', UK: '4.5' },
    '37': { BR: '37', US: '7', EU: '37', UK: '5' },
    '37.5': { BR: '37.5', US: '7.5', EU: '37.5', UK: '5.5' },
    '38': { BR: '38', US: '8', EU: '38', UK: '6' },
    '38.5': { BR: '38.5', US: '8.5', EU: '38.5', UK: '6.5' },
    '39': { BR: '39', US: '9', EU: '39', UK: '7' },
    '39.5': { BR: '39.5', US: '9.5', EU: '39.5', UK: '7.5' },
    '40': { BR: '40', US: '10', EU: '40', UK: '8' },
    '40.5': { BR: '40.5', US: '10.5', EU: '40.5', UK: '8.5' },
    '41': { BR: '41', US: '11', EU: '41', UK: '9' },
    '41.5': { BR: '41.5', US: '11.5', EU: '41.5', UK: '9.5' },
    '42': { BR: '42', US: '12', EU: '42', UK: '10' },
    '42.5': { BR: '42.5', US: '12.5', EU: '42.5', UK: '10.5' },
    '43': { BR: '43', US: '13', EU: '43', UK: '11' },
    '43.5': { BR: '43.5', US: '13.5', EU: '43.5', UK: '11.5' },
    '44': { BR: '44', US: '14', EU: '44', UK: '12' },
    '44.5': { BR: '44.5', US: '14.5', EU: '44.5', UK: '12.5' },
    '45': { BR: '45', US: '15', EU: '45', UK: '13' },
    '46': { BR: '46', US: '16', EU: '46', UK: '14' },
  };

  /**
   * Waist/pants size conversions (in inches for US/UK, cm for EU, numeric for BR)
   */
  static readonly WAIST_SIZES: Record<string, SizeConversion> = {
    '36': { BR: '36', US: '28', EU: '44', UK: '28' },
    '38': { BR: '38', US: '30', EU: '46', UK: '30' },
    '40': { BR: '40', US: '32', EU: '48', UK: '32' },
    '42': { BR: '42', US: '34', EU: '50', UK: '34' },
    '44': { BR: '44', US: '36', EU: '52', UK: '36' },
    '46': { BR: '46', US: '38', EU: '54', UK: '38' },
    '48': { BR: '48', US: '40', EU: '56', UK: '40' },
    '50': { BR: '50', US: '42', EU: '58', UK: '42' },
    '52': { BR: '52', US: '44', EU: '60', UK: '44' },
    '54': { BR: '54', US: '46', EU: '62', UK: '46' },
    '56': { BR: '56', US: '48', EU: '64', UK: '48' },
  };

  /**
   * Ring size conversions
   * BR uses the same system as FR/EU (internal diameter in mm × π)
   * US uses numeric system, UK uses letters
   */
  static readonly RING_SIZES: Record<string, SizeConversion> = {
    '10': { BR: '10', US: '5', EU: '49', UK: 'J' },
    '11': { BR: '11', US: '5.5', EU: '50', UK: 'K' },
    '12': { BR: '12', US: '6', EU: '51', UK: 'L' },
    '13': { BR: '13', US: '6.5', EU: '52', UK: 'L.5' },
    '14': { BR: '14', US: '7', EU: '54', UK: 'N' },
    '15': { BR: '15', US: '7.5', EU: '55', UK: 'O' },
    '16': { BR: '16', US: '8', EU: '57', UK: 'P' },
    '17': { BR: '17', US: '8.5', EU: '58', UK: 'Q' },
    '18': { BR: '18', US: '9', EU: '59', UK: 'R' },
    '19': { BR: '19', US: '9.5', EU: '60', UK: 'S' },
    '20': { BR: '20', US: '10', EU: '62', UK: 'T' },
    '21': { BR: '21', US: '10.5', EU: '63', UK: 'U' },
    '22': { BR: '22', US: '11', EU: '64', UK: 'V' },
    '23': { BR: '23', US: '11.5', EU: '65', UK: 'W' },
    '24': { BR: '24', US: '12', EU: '67', UK: 'X' },
    '25': { BR: '25', US: '12.5', EU: '68', UK: 'Y' },
    '26': { BR: '26', US: '13', EU: '69', UK: 'Z' },
  };

  /**
   * Get size chart by category
   */
  static getSizeChart(category: SizeCategory): Record<string, SizeConversion> {
    switch (category) {
      case 'womens_clothing':
        return this.WOMENS_CLOTHING_SIZES;
      case 'mens_clothing':
        return this.MENS_CLOTHING_SIZES;
      case 'shoes':
      case 'shoes_mens':
      case 'shoes_womens':
        return this.SHOE_SIZES;
      case 'waist_pants':
        return this.WAIST_SIZES;
      case 'rings':
        return this.RING_SIZES;
      default:
        return this.SHOE_SIZES;
    }
  }

  /**
   * Convert size between different standards
   */
  static convertSize(
    size: string,
    fromStandard: keyof SizeConversion,
    toStandard: keyof SizeConversion,
    category: SizeCategory
  ): string | null {
    const sizeChart = this.getSizeChart(category);

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
    category: SizeCategory
  ): SizeConversion | null {
    const sizeChart = this.getSizeChart(category);

    for (const [key, conversion] of Object.entries(sizeChart)) {
      if (conversion[fromStandard] === size) {
        return conversion;
      }
    }

    return null;
  }

  /**
   * Convert all sizes in a measurements object from one standard to another
   */
  static convertAllMeasurementSizes(
    sizes: any,
    fromStandard: keyof SizeConversion,
    toStandard: keyof SizeConversion
  ): any {
    if (!sizes) return {};

    const converted: any = {};

    // Convert shoes
    if (sizes.shoes) {
      converted.shoes = {
        min: sizes.shoes.min ? this.convertSize(sizes.shoes.min, fromStandard, toStandard, 'shoes') || sizes.shoes.min : undefined,
        max: sizes.shoes.max ? this.convertSize(sizes.shoes.max, fromStandard, toStandard, 'shoes') || sizes.shoes.max : undefined,
      };
    }

    // Convert waist
    if (sizes.waist) {
      converted.waist = {
        min: sizes.waist.min ? this.convertSize(sizes.waist.min, fromStandard, toStandard, 'waist_pants') || sizes.waist.min : undefined,
        max: sizes.waist.max ? this.convertSize(sizes.waist.max, fromStandard, toStandard, 'waist_pants') || sizes.waist.max : undefined,
      };
    }

    // Convert tops (letter sizes) - handle arrays
    if (sizes.tops) {
      if (Array.isArray(sizes.tops)) {
        converted.tops = sizes.tops.map(size =>
          this.convertSize(size, fromStandard, toStandard, 'womens_clothing') || size
        ).filter(Boolean);
      } else {
        // Backward compatibility: convert single string to array
        const convertedSize = this.convertSize(sizes.tops, fromStandard, toStandard, 'womens_clothing') || sizes.tops;
        converted.tops = [convertedSize];
      }
    }

    // Convert bottoms - handle arrays
    if (sizes.bottoms) {
      if (Array.isArray(sizes.bottoms)) {
        converted.bottoms = sizes.bottoms.map(size =>
          this.convertSize(size, fromStandard, toStandard, 'waist_pants') || size
        ).filter(Boolean);
      } else {
        // Backward compatibility: convert single string to array
        const convertedSize = this.convertSize(sizes.bottoms, fromStandard, toStandard, 'waist_pants') || sizes.bottoms;
        converted.bottoms = [convertedSize];
      }
    }

    // Convert dresses - handle arrays
    if (sizes.dresses) {
      if (Array.isArray(sizes.dresses)) {
        converted.dresses = sizes.dresses.map(size =>
          this.convertSize(size, fromStandard, toStandard, 'womens_clothing') || size
        ).filter(Boolean);
      } else {
        // Backward compatibility: convert single string to array
        const convertedSize = this.convertSize(sizes.dresses, fromStandard, toStandard, 'womens_clothing') || sizes.dresses;
        converted.dresses = [convertedSize];
      }
    }

    // Convert rings
    if (sizes.rings) {
      converted.rings = {};
      for (const [finger, size] of Object.entries(sizes.rings)) {
        if (size) {
          converted.rings[finger] = this.convertSize(size as string, fromStandard, toStandard, 'rings') || size;
        }
      }
    }

    return converted;
  }

  /**
   * Generate sizes in all standards from a single standard input
   */
  static generateAllStandardSizes(
    sizes: any,
    sourceStandard: keyof SizeConversion
  ): Record<string, any> {
    const standards: (keyof SizeConversion)[] = ['BR', 'US', 'EU', 'UK'];
    const result: Record<string, any> = {};

    for (const standard of standards) {
      if (standard === sourceStandard) {
        result[standard] = sizes;
      } else {
        result[standard] = this.convertAllMeasurementSizes(sizes, sourceStandard, standard);
      }
    }

    return result;
  }

  /**
   * Validate measurement data
   */
  static validateMeasurements(measurements: any): string[] {
    const errors: string[] = [];

    if (measurements.height && (measurements.height < 50 || measurements.height > 300)) {
      errors.push('Height must be between 50 and 300 cm');
    }

    if (measurements.weight && (measurements.weight < 20 || measurements.weight > 500)) {
      errors.push('Weight must be between 20 and 500 kg');
    }

    // Validate body measurements
    const bodyMeasurements = ['chest', 'waist', 'hips', 'inseam', 'shoulders', 'armLength'];
    for (const measurement of bodyMeasurements) {
      if (measurements[measurement] && (measurements[measurement] < 20 || measurements[measurement] > 200)) {
        errors.push(`${measurement} must be between 20 and 200 cm`);
      }
    }

    if (measurements.sizes) {
      const validStandards = ['BR', 'US', 'EU', 'UK'];
      for (const [standard, sizeChart] of Object.entries(measurements.sizes)) {
        if (!validStandards.includes(standard)) {
          errors.push(`Invalid size standard: ${standard}`);
        }
      }
    }

    if (measurements.preferredStandard && !['BR', 'US', 'EU', 'UK'].includes(measurements.preferredStandard)) {
      errors.push('Preferred standard must be BR, US, EU, or UK');
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

  /**
   * Get all available sizes for a category
   */
  static getAvailableSizes(category: SizeCategory, standard: keyof SizeConversion = 'BR'): string[] {
    const sizeChart = this.getSizeChart(category);
    return Object.values(sizeChart).map(conv => conv[standard]);
  }

  /**
   * Format size display with range
   */
  static formatSizeRange(
    sizeRange: { min?: string; max?: string } | undefined,
    standard: keyof SizeConversion = 'BR'
  ): string {
    if (!sizeRange) return '—';

    const { min, max } = sizeRange;
    if (!min && !max) return '—';
    if (min && max && min === max) return `${min} ${standard}`;
    if (min && max) return `${min} ${standard} - ${max} ${standard}`;
    if (min) return `${min} ${standard}+`;
    if (max) return `up to ${max} ${standard}`;
    return '—';
  }
}