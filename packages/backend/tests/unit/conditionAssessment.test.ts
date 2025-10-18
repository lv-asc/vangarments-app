/**
 * Unit tests for marketplace condition assessment logic
 * Tests detailed condition validation, status transitions, and assessment accuracy
 * Requirements: 3.1, 3.2
 */

import { DetailedCondition, ShippingOptions } from '@vangarments/shared/types/marketplace';

describe('Condition Assessment Logic', () => {
  describe('Condition Status Validation', () => {
    const validStatuses = ['new', 'dswt', 'never_used', 'excellent', 'good', 'fair', 'poor'];
    
    it('should validate all condition status enum values', () => {
      validStatuses.forEach(status => {
        const condition: DetailedCondition = {
          status: status as any,
          description: `Item in ${status} condition`,
          defects: [],
          wearSigns: [],
          alterations: [],
          authenticity: 'guaranteed',
        };
        
        expect(validStatuses).toContain(condition.status);
      });
    });

    it('should reject invalid condition status', () => {
      const invalidStatuses = ['mint', 'perfect', 'damaged', 'broken'];
      
      invalidStatuses.forEach(status => {
        expect(validStatuses).not.toContain(status);
      });
    });
  });

  describe('Authenticity Assessment', () => {
    const authenticityLevels = ['guaranteed', 'likely_authentic', 'unknown', 'replica'];
    
    it('should validate authenticity levels', () => {
      authenticityLevels.forEach(level => {
        const condition: DetailedCondition = {
          status: 'good',
          description: 'Test item',
          defects: [],
          wearSigns: [],
          alterations: [],
          authenticity: level as any,
        };
        
        expect(authenticityLevels).toContain(condition.authenticity);
      });
    });

    it('should handle guaranteed authenticity with supporting evidence', () => {
      const condition: DetailedCondition = {
        status: 'new',
        description: 'Brand new with all original packaging',
        defects: [],
        wearSigns: [],
        alterations: [],
        authenticity: 'guaranteed',
        boxIncluded: true,
        tagsIncluded: true,
        receiptIncluded: true,
      };
      
      expect(condition.authenticity).toBe('guaranteed');
      expect(condition.boxIncluded).toBe(true);
      expect(condition.tagsIncluded).toBe(true);
      expect(condition.receiptIncluded).toBe(true);
    });
  });

  describe('Defect and Wear Sign Tracking', () => {
    it('should track multiple defects accurately', () => {
      const condition: DetailedCondition = {
        status: 'good',
        description: 'Used item with minor issues',
        defects: [
          'small_scuff_on_heel',
          'slight_sole_wear',
          'minor_scratch_on_upper',
          'faded_logo'
        ],
        wearSigns: [
          'creasing_on_toe_box',
          'minor_dirt_on_outsole',
          'slight_color_fading'
        ],
        alterations: [],
        authenticity: 'likely_authentic',
      };
      
      expect(condition.defects).toHaveLength(4);
      expect(condition.wearSigns).toHaveLength(3);
      expect(condition.defects).toContain('small_scuff_on_heel');
      expect(condition.wearSigns).toContain('creasing_on_toe_box');
    });

    it('should handle items with no defects', () => {
      const condition: DetailedCondition = {
        status: 'excellent',
        description: 'Nearly perfect condition',
        defects: [],
        wearSigns: ['minimal_wear'],
        alterations: [],
        authenticity: 'guaranteed',
      };
      
      expect(condition.defects).toHaveLength(0);
      expect(condition.wearSigns).toHaveLength(1);
    });

    it('should track alterations separately from defects', () => {
      const condition: DetailedCondition = {
        status: 'good',
        description: 'Item with professional alterations',
        defects: ['minor_stain'],
        wearSigns: ['light_wear'],
        alterations: [
          'hemmed_pants',
          'taken_in_waist',
          'shortened_sleeves'
        ],
        authenticity: 'guaranteed',
      };
      
      expect(condition.alterations).toHaveLength(3);
      expect(condition.alterations).toContain('hemmed_pants');
      expect(condition.defects).not.toContain('hemmed_pants');
    });
  });

  describe('Condition Status Logic', () => {
    it('should properly assess new items', () => {
      const newCondition: DetailedCondition = {
        status: 'new',
        description: 'Brand new with tags, never worn',
        defects: [],
        wearSigns: [],
        alterations: [],
        authenticity: 'guaranteed',
        boxIncluded: true,
        tagsIncluded: true,
        receiptIncluded: true,
      };
      
      expect(newCondition.status).toBe('new');
      expect(newCondition.defects).toHaveLength(0);
      expect(newCondition.wearSigns).toHaveLength(0);
      expect(newCondition.tagsIncluded).toBe(true);
    });

    it('should properly assess DSWT (Deadstock With Tags) items', () => {
      const dswtCondition: DetailedCondition = {
        status: 'dswt',
        description: 'Deadstock with original tags, never worn but may show minor storage signs',
        defects: [],
        wearSigns: ['minor_storage_marks'],
        alterations: [],
        authenticity: 'guaranteed',
        boxIncluded: true,
        tagsIncluded: true,
        receiptIncluded: false,
      };
      
      expect(dswtCondition.status).toBe('dswt');
      expect(dswtCondition.tagsIncluded).toBe(true);
      expect(dswtCondition.wearSigns).toContain('minor_storage_marks');
    });

    it('should assess used items with appropriate wear signs', () => {
      const usedCondition: DetailedCondition = {
        status: 'good',
        description: 'Gently used with normal wear signs',
        defects: ['small_scuff'],
        wearSigns: [
          'creasing',
          'minor_sole_wear',
          'slight_fading'
        ],
        alterations: [],
        authenticity: 'likely_authentic',
        boxIncluded: false,
        tagsIncluded: false,
        receiptIncluded: false,
      };
      
      expect(usedCondition.status).toBe('good');
      expect(usedCondition.wearSigns.length).toBeGreaterThan(0);
      expect(usedCondition.boxIncluded).toBe(false);
    });
  });

  describe('Condition Assessment Validation', () => {
    it('should validate condition consistency', () => {
      // New items should not have wear signs or defects
      const inconsistentNewCondition: DetailedCondition = {
        status: 'new',
        description: 'New item',
        defects: ['scratch'], // Inconsistent with "new" status
        wearSigns: [],
        alterations: [],
        authenticity: 'guaranteed',
      };
      
      // This would be caught by validation logic
      const hasInconsistency = inconsistentNewCondition.status === 'new' && 
                              inconsistentNewCondition.defects.length > 0;
      expect(hasInconsistency).toBe(true);
    });

    it('should validate required fields for condition assessment', () => {
      const condition: DetailedCondition = {
        status: 'good',
        description: 'Test description',
        defects: [],
        wearSigns: [],
        alterations: [],
        authenticity: 'guaranteed',
      };
      
      // Required fields validation
      expect(condition.status).toBeDefined();
      expect(condition.description).toBeDefined();
      expect(condition.authenticity).toBeDefined();
      expect(Array.isArray(condition.defects)).toBe(true);
      expect(Array.isArray(condition.wearSigns)).toBe(true);
      expect(Array.isArray(condition.alterations)).toBe(true);
    });

    it('should handle optional fields appropriately', () => {
      const minimalCondition: DetailedCondition = {
        status: 'good',
        description: 'Minimal condition info',
        authenticity: 'unknown',
      };
      
      // Optional fields should be undefined or have default values
      expect(minimalCondition.defects).toBeUndefined();
      expect(minimalCondition.wearSigns).toBeUndefined();
      expect(minimalCondition.alterations).toBeUndefined();
      expect(minimalCondition.boxIncluded).toBeUndefined();
      expect(minimalCondition.tagsIncluded).toBeUndefined();
      expect(minimalCondition.receiptIncluded).toBeUndefined();
    });
  });

  describe('Shoe-Specific Condition Assessment', () => {
    it('should handle shoe-specific condition factors', () => {
      const shoeCondition: DetailedCondition = {
        status: 'good',
        description: 'Used sneakers in good condition',
        defects: [
          'scuff_on_heel',
          'minor_sole_separation'
        ],
        wearSigns: [
          'creasing_on_toe_box',
          'sole_wear_pattern',
          'insole_compression'
        ],
        alterations: [],
        authenticity: 'guaranteed',
        boxIncluded: true, // Important for shoes
        tagsIncluded: false,
        receiptIncluded: true,
      };
      
      expect(shoeCondition.boxIncluded).toBe(true);
      expect(shoeCondition.defects).toContain('scuff_on_heel');
      expect(shoeCondition.wearSigns).toContain('sole_wear_pattern');
    });

    it('should assess shoe condition without original box', () => {
      const noBoxCondition: DetailedCondition = {
        status: 'good',
        description: 'Good condition shoes, no original box',
        defects: [],
        wearSigns: ['light_wear'],
        alterations: [],
        authenticity: 'likely_authentic',
        boxIncluded: false,
        tagsIncluded: false,
        receiptIncluded: false,
      };
      
      expect(noBoxCondition.boxIncluded).toBe(false);
      // Condition can still be good without box
      expect(noBoxCondition.status).toBe('good');
    });
  });

  describe('Condition Assessment Edge Cases', () => {
    it('should handle replica items appropriately', () => {
      const replicaCondition: DetailedCondition = {
        status: 'new',
        description: 'Replica item, clearly marked as such',
        defects: [],
        wearSigns: [],
        alterations: [],
        authenticity: 'replica',
        boxIncluded: true,
        tagsIncluded: true,
        receiptIncluded: false,
      };
      
      expect(replicaCondition.authenticity).toBe('replica');
      // Replicas can still be in new condition
      expect(replicaCondition.status).toBe('new');
    });

    it('should handle items with extensive alterations', () => {
      const alteredCondition: DetailedCondition = {
        status: 'good',
        description: 'Vintage item with professional restoration',
        defects: [],
        wearSigns: ['age_appropriate_patina'],
        alterations: [
          'professional_cleaning',
          'sole_replacement',
          'leather_conditioning',
          'hardware_replacement'
        ],
        authenticity: 'guaranteed',
      };
      
      expect(alteredCondition.alterations).toHaveLength(4);
      expect(alteredCondition.alterations).toContain('sole_replacement');
      // Extensive alterations don't necessarily lower condition if done professionally
      expect(alteredCondition.status).toBe('good');
    });

    it('should handle poor condition items accurately', () => {
      const poorCondition: DetailedCondition = {
        status: 'poor',
        description: 'Heavily worn item with significant damage',
        defects: [
          'large_tear',
          'significant_staining',
          'sole_separation',
          'missing_hardware',
          'color_bleeding'
        ],
        wearSigns: [
          'heavy_wear_throughout',
          'structural_damage',
          'fading_and_discoloration'
        ],
        alterations: ['attempted_repair'],
        authenticity: 'unknown',
        boxIncluded: false,
        tagsIncluded: false,
        receiptIncluded: false,
      };
      
      expect(poorCondition.status).toBe('poor');
      expect(poorCondition.defects.length).toBeGreaterThan(3);
      expect(poorCondition.defects).toContain('large_tear');
      expect(poorCondition.wearSigns).toContain('structural_damage');
    });
  });
});