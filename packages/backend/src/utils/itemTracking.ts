/**
 * Advanced item tracking utilities for composition, colors, care instructions, and loans
 */

import { Material, Color } from '@vangarments/shared';

export interface LoanRecord {
    id: string;
    itemId: string;
    loaneeId: string;
    loaneeName: string;
    loanDate: Date;
    expectedReturnDate?: Date;
    actualReturnDate?: Date;
    status: 'active' | 'returned' | 'overdue';
    notes?: string;
}

export interface WishlistItem {
    id: string;
    userId: string;
    itemReference?: string; // Reference to existing VUFS item
    desiredItem: {
        category?: any;
        brand?: any;
        description: string;
        maxPrice?: number;
        priority: 'low' | 'medium' | 'high';
    };
    createdAt: Date;
    updatedAt: Date;
}

export class ItemTrackingUtils {
    /**
     * Validate material composition (must total 100%)
     */
    static validateComposition(materials: Material[]): string[] {
        const errors: string[] = [];

        if (materials.length === 0) {
            errors.push('At least one material is required');
            return errors;
        }

        if (materials.length > 3) {
            errors.push('Maximum 3 materials allowed');
        }

        const totalPercentage = materials.reduce((sum, material) => sum + material.percentage, 0);
        if (Math.abs(totalPercentage - 100) > 0.1) { // Allow small floating point differences
            errors.push(`Material composition must total 100% (currently ${totalPercentage}%)`);
        }

        // Check for duplicate materials
        const materialNames = materials.map(m => m.name.toLowerCase());
        const uniqueNames = new Set(materialNames);
        if (uniqueNames.size !== materialNames.length) {
            errors.push('Duplicate materials are not allowed');
        }

        // Validate individual materials
        materials.forEach((material, index) => {
            if (!material.name || material.name.trim().length === 0) {
                errors.push(`Material ${index + 1}: Name is required`);
            }

            if (material.percentage <= 0 || material.percentage > 100) {
                errors.push(`Material ${index + 1}: Percentage must be between 0 and 100`);
            }
        });

        return errors;
    }

    /**
     * Validate color information
     */
    static validateColors(colors: Color[]): string[] {
        const errors: string[] = [];

        if (colors.length === 0) {
            errors.push('At least one color is required');
            return errors;
        }

        if (colors.length > 3) {
            errors.push('Maximum 3 colors allowed');
        }

        colors.forEach((color, index) => {
            if (!color.name || color.name.trim().length === 0) {
                errors.push(`Color ${index + 1}: Name is required`);
            }

            if (!color.hex || !/^#[0-9A-F]{6}$/i.test(color.hex)) {
                errors.push(`Color ${index + 1}: Valid hex color code is required`);
            }

            if (color.undertones && color.undertones.length > 3) {
                errors.push(`Color ${index + 1}: Maximum 3 undertones allowed`);
            }
        });

        return errors;
    }

    /**
     * Generate care instruction recommendations based on materials
     */
    static generateCareInstructions(materials: Material[]): string[] {
        const instructions = new Set<string>();

        materials.forEach(material => {
            const materialName = material.name.toLowerCase();

            // Cotton care
            if (materialName.includes('cotton')) {
                instructions.add('Machine wash cold');
                instructions.add('Tumble dry low');
                instructions.add('Iron medium heat');
            }

            // Wool care
            if (materialName.includes('wool') || materialName.includes('cashmere')) {
                instructions.add('Hand wash cold or dry clean');
                instructions.add('Lay flat to dry');
                instructions.add('Do not bleach');
            }

            // Silk care
            if (materialName.includes('silk')) {
                instructions.add('Dry clean only');
                instructions.add('Do not wring or twist');
                instructions.add('Store hanging');
            }

            // Synthetic materials
            if (materialName.includes('polyester') || materialName.includes('nylon') || materialName.includes('acrylic')) {
                instructions.add('Machine wash warm');
                instructions.add('Tumble dry medium');
                instructions.add('Iron low heat');
            }

            // Leather care
            if (materialName.includes('leather')) {
                instructions.add('Professional leather cleaning');
                instructions.add('Condition regularly');
                instructions.add('Store in breathable bag');
            }

            // Denim care
            if (materialName.includes('denim')) {
                instructions.add('Wash inside out');
                instructions.add('Cold water wash');
                instructions.add('Air dry to prevent shrinking');
            }
        });

        return Array.from(instructions);
    }

    /**
     * Calculate recommended wash frequency based on item type and usage
     */
    static calculateWashFrequency(category: any, wearCount: number = 0): {
        frequency: string;
        nextWashAt: number; // wears until next wash
    } {
        const categoryPage = category.page?.toLowerCase() || '';
        const categoryBlue = category.blueSubcategory?.toLowerCase() || '';
        const categoryWhite = category.whiteSubcategory?.toLowerCase() || '';

        let wearsBetweenWash = 1; // Default: wash after every wear

        // Underwear and activewear
        if (categoryBlue.includes('underwear') || categoryWhite.includes('underwear') ||
            categoryWhite.includes('bras') || categoryWhite.includes('panties') ||
            categoryWhite.includes('boxers') || categoryWhite.includes('briefs')) {
            wearsBetweenWash = 1;
        }
        // T-shirts and close-to-skin items
        else if (categoryWhite.includes('t-shirt') || categoryWhite.includes('tank')) {
            wearsBetweenWash = 1;
        }
        // Jeans and sturdy bottoms
        else if (categoryWhite.includes('jeans') || categoryWhite.includes('chinos')) {
            wearsBetweenWash = 5;
        }
        // Sweaters and knitwear
        else if (categoryWhite.includes('sweater') || categoryWhite.includes('cardigan')) {
            wearsBetweenWash = 3;
        }
        // Outerwear
        else if (categoryBlue.includes('outerwear')) {
            wearsBetweenWash = 10;
        }
        // Dress shirts and blouses
        else if (categoryWhite.includes('shirt') || categoryWhite.includes('blouse')) {
            wearsBetweenWash = 2;
        }
        // Dresses and skirts
        else if (categoryWhite.includes('dress') || categoryWhite.includes('skirt')) {
            wearsBetweenWash = 2;
        }

        const nextWashAt = wearsBetweenWash - (wearCount % wearsBetweenWash);

        return {
            frequency: `Every ${wearsBetweenWash} wear${wearsBetweenWash > 1 ? 's' : ''}`,
            nextWashAt: nextWashAt === wearsBetweenWash ? wearsBetweenWash : nextWashAt,
        };
    }

    /**
     * Track item usage and provide insights
     */
    static calculateUsageInsights(wearCount: number, acquisitionDate: Date): {
        costPerWear?: number;
        usageFrequency: string;
        recommendation: string;
    } {
        const daysSinceAcquisition = Math.floor((Date.now() - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24));
        const weeksOwned = Math.max(1, Math.floor(daysSinceAcquisition / 7));
        const wearsPerWeek = wearCount / weeksOwned;

        let usageFrequency = '';
        let recommendation = '';

        if (wearsPerWeek >= 2) {
            usageFrequency = 'High usage';
            recommendation = 'Great value item! Consider similar pieces.';
        } else if (wearsPerWeek >= 0.5) {
            usageFrequency = 'Regular usage';
            recommendation = 'Good wardrobe staple.';
        } else if (wearsPerWeek >= 0.1) {
            usageFrequency = 'Occasional usage';
            recommendation = 'Consider styling differently or special occasions.';
        } else {
            usageFrequency = 'Rarely worn';
            recommendation = 'Consider donating or selling if not seasonal/special occasion.';
        }

        return {
            usageFrequency,
            recommendation,
        };
    }

    /**
     * Validate loan record
     */
    static validateLoanRecord(loan: Partial<LoanRecord>): string[] {
        const errors: string[] = [];

        if (!loan.itemId) {
            errors.push('Item ID is required');
        }

        if (!loan.loaneeId) {
            errors.push('Loanee ID is required');
        }

        if (!loan.loaneeName || loan.loaneeName.trim().length === 0) {
            errors.push('Loanee name is required');
        }

        if (!loan.loanDate) {
            errors.push('Loan date is required');
        }

        if (loan.expectedReturnDate && loan.loanDate && loan.expectedReturnDate <= loan.loanDate) {
            errors.push('Expected return date must be after loan date');
        }

        if (loan.actualReturnDate && loan.loanDate && loan.actualReturnDate < loan.loanDate) {
            errors.push('Actual return date cannot be before loan date');
        }

        return errors;
    }

    /**
     * Calculate loan status
     */
    static calculateLoanStatus(loan: LoanRecord): 'active' | 'returned' | 'overdue' {
        if (loan.actualReturnDate) {
            return 'returned';
        }

        if (loan.expectedReturnDate && new Date() > loan.expectedReturnDate) {
            return 'overdue';
        }

        return 'active';
    }

    /**
     * Validate wishlist item
     */
    static validateWishlistItem(item: Partial<WishlistItem>): string[] {
        const errors: string[] = [];

        if (!item.userId) {
            errors.push('User ID is required');
        }

        if (!item.desiredItem?.description || item.desiredItem.description.trim().length === 0) {
            errors.push('Item description is required');
        }

        if (item.desiredItem?.maxPrice && item.desiredItem.maxPrice <= 0) {
            errors.push('Max price must be greater than 0');
        }

        if (item.desiredItem?.priority && !['low', 'medium', 'high'].includes(item.desiredItem.priority)) {
            errors.push('Priority must be low, medium, or high');
        }

        return errors;
    }

    /**
     * Generate item care schedule
     */
    static generateCareSchedule(materials: Material[], category: any, wearCount: number = 0): {
        washRecommendation: any;
        careInstructions: string[];
        maintenanceTips: string[];
    } {
        const washRecommendation = this.calculateWashFrequency(category, wearCount);
        const careInstructions = this.generateCareInstructions(materials);

        const maintenanceTips: string[] = [];

        // Add category-specific maintenance tips
        const categoryBlue = category.blueSubcategory?.toLowerCase() || '';

        if (categoryBlue.includes('outerwear')) {
            maintenanceTips.push('Check pockets before cleaning');
            maintenanceTips.push('Zip up zippers to maintain shape');
        }

        if (categoryBlue.includes('footwear')) {
            maintenanceTips.push('Use shoe trees to maintain shape');
            maintenanceTips.push('Rotate wear to allow drying');
        }

        // Add material-specific tips
        materials.forEach(material => {
            const materialName = material.name.toLowerCase();

            if (materialName.includes('leather')) {
                maintenanceTips.push('Apply leather conditioner monthly');
            }

            if (materialName.includes('suede')) {
                maintenanceTips.push('Use suede brush to maintain texture');
            }

            if (materialName.includes('wool')) {
                maintenanceTips.push('Use cedar blocks to prevent moths');
            }
        });

        return {
            washRecommendation,
            careInstructions,
            maintenanceTips: Array.from(new Set(maintenanceTips)), // Remove duplicates
        };
    }
}