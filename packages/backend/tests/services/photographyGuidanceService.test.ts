import { PhotographyGuidanceService, PhotoGuidance, PhotoInstruction } from '../../src/services/photographyGuidanceService';
import { VUFSDomain } from '@vangarments/shared/types/vufs';

describe('PhotographyGuidanceService', () => {
  describe('getGuidanceForItem', () => {
    it('should return apparel guidance for APPAREL domain', () => {
      const guidance = PhotographyGuidanceService.getGuidanceForItem('APPAREL', 'Shirts');

      expect(guidance.domain).toBe('APPAREL');
      expect(guidance.itemType).toBe('Shirts');
      expect(guidance.instructions).toHaveLength(4); // Base + specific + final photo
      expect(guidance.totalDuration).toBeGreaterThan(0);
      expect(guidance.requiredPhotos).toContain('front');
      expect(guidance.optionalPhotos).toContain('back');
      expect(guidance.equipmentTips).toHaveLength(4);
      expect(guidance.lightingTips).toHaveLength(4);
    });

    it('should return footwear guidance for FOOTWEAR domain', () => {
      const guidance = PhotographyGuidanceService.getGuidanceForItem('FOOTWEAR', 'Sneakers');

      expect(guidance.domain).toBe('FOOTWEAR');
      expect(guidance.itemType).toBe('Sneakers');
      expect(guidance.instructions).toHaveLength(4);
      expect(guidance.totalDuration).toBe(32); // 4 steps × 8 seconds each
      expect(guidance.requiredPhotos).toContain('main');
      expect(guidance.optionalPhotos).toContain('side');
      expect(guidance.optionalPhotos).toContain('sole');
    });

    it('should include proper step sequencing', () => {
      const guidance = PhotographyGuidanceService.getGuidanceForItem('APPAREL', 'Shirts');

      guidance.instructions.forEach((instruction, index) => {
        expect(instruction.step).toBe(index + 1);
        expect(instruction.title).toBeTruthy();
        expect(instruction.description).toBeTruthy();
        expect(instruction.duration).toBe(8);
        expect(instruction.tips).toBeInstanceOf(Array);
        expect(instruction.commonMistakes).toBeInstanceOf(Array);
      });
    });

    it('should calculate total duration correctly', () => {
      const guidance = PhotographyGuidanceService.getGuidanceForItem('APPAREL', 'Jackets');
      const expectedDuration = guidance.instructions.reduce((sum, inst) => sum + inst.duration, 0);

      expect(guidance.totalDuration).toBe(expectedDuration);
    });
  });

  describe('apparel-specific guidance', () => {
    it('should provide shirt-specific instructions', () => {
      const guidance = PhotographyGuidanceService.getGuidanceForItem('APPAREL', 'Shirts');
      
      const shirtStep = guidance.instructions.find(inst => 
        inst.title.includes('Shirt') || inst.description.includes('collar')
      );

      expect(shirtStep).toBeDefined();
      expect(shirtStep?.tips).toContain('Lay collar flat and centered');
      expect(shirtStep?.tips).toContain('Spread sleeves naturally to sides');
      expect(shirtStep?.commonMistakes).toContain('Collar folded or twisted');
    });

    it('should provide jacket-specific instructions', () => {
      const guidance = PhotographyGuidanceService.getGuidanceForItem('APPAREL', 'Jackets');
      
      const jacketStep = guidance.instructions.find(inst => 
        inst.title.includes('Jacket') || inst.description.includes('lapels')
      );

      expect(jacketStep).toBeDefined();
      expect(jacketStep?.tips).toContain('Lay lapels flat and symmetrical');
      expect(jacketStep?.tips).toContain('Close all zippers and buttons');
      expect(jacketStep?.commonMistakes).toContain('Asymmetrical lapels');
    });

    it('should provide pants-specific instructions', () => {
      const guidance = PhotographyGuidanceService.getGuidanceForItem('APPAREL', 'Jeans');
      
      const pantsStep = guidance.instructions.find(inst => 
        inst.title.includes('Pants') || inst.description.includes('legs')
      );

      expect(pantsStep).toBeDefined();
      expect(pantsStep?.tips).toContain('Lay legs straight and parallel');
      expect(pantsStep?.tips).toContain('Ensure waistband is flat and centered');
      expect(pantsStep?.commonMistakes).toContain('Crooked leg positioning');
    });

    it('should provide dress-specific instructions', () => {
      const guidance = PhotographyGuidanceService.getGuidanceForItem('APPAREL', 'Dress');
      
      const dressStep = guidance.instructions.find(inst => 
        inst.title.includes('Dress') || inst.description.includes('silhouette')
      );

      expect(dressStep).toBeDefined();
      expect(dressStep?.tips).toContain('Lay the dress flat showing full length');
      expect(dressStep?.tips).toContain('Ensure neckline is properly positioned');
      expect(dressStep?.commonMistakes).toContain('Dress bunched up or twisted');
    });

    it('should provide default instructions for unknown item types', () => {
      const guidance = PhotographyGuidanceService.getGuidanceForItem('APPAREL', 'Unknown Item');
      
      const defaultStep = guidance.instructions.find(inst => 
        inst.title.includes('Item Details')
      );

      expect(defaultStep).toBeDefined();
      expect(defaultStep?.tips).toContain('Ensure item is laid flat and centered');
      expect(defaultStep?.commonMistakes).toContain('Item positioned crookedly');
    });
  });

  describe('footwear guidance workflow', () => {
    let footwearGuidance: PhotoGuidance;

    beforeEach(() => {
      footwearGuidance = PhotographyGuidanceService.getGuidanceForItem('FOOTWEAR', 'Sneakers');
    });

    it('should include shoe preparation step', () => {
      const prepStep = footwearGuidance.instructions[0];

      expect(prepStep.title).toBe('Prepare Your Shoes');
      expect(prepStep.tips).toContain('Clean the shoes thoroughly - remove dirt and scuffs');
      expect(prepStep.tips).toContain('Ensure laces are clean and properly tied');
      expect(prepStep.commonMistakes).toContain('Dirty or scuffed shoes');
    });

    it('should include setup step', () => {
      const setupStep = footwearGuidance.instructions[1];

      expect(setupStep.title).toBe('Set Up Your Shot');
      expect(setupStep.tips).toContain('Use a white or light-colored background');
      expect(setupStep.tips).toContain('Position near natural light source');
      expect(setupStep.commonMistakes).toContain('Cluttered or distracting backgrounds');
    });

    it('should include positioning step with specific shoe arrangement', () => {
      const positionStep = footwearGuidance.instructions[2];

      expect(positionStep.title).toBe('Position the Footwear');
      expect(positionStep.tips).toContain('Place right shoe forward, left shoe slightly behind');
      expect(positionStep.tips).toContain('Angle the right shoe pointing slightly to the right');
      expect(positionStep.commonMistakes).toContain('Shoes positioned incorrectly');
    });

    it('should include capture step with angle guidance', () => {
      const captureStep = footwearGuidance.instructions[3];

      expect(captureStep.title).toBe('Capture the Photo');
      expect(captureStep.tips).toContain('Shoot from about 45-degree angle above the shoes');
      expect(captureStep.tips).toContain('Ensure both shoes are in focus');
      expect(captureStep.commonMistakes).toContain('Shooting from too high or too low');
    });

    it('should provide footwear-specific equipment tips', () => {
      expect(footwearGuidance.equipmentTips).toContain('Smartphone camera is perfect for shoe photography');
      expect(footwearGuidance.equipmentTips).toContain('Use portrait mode if available for better depth');
    });

    it('should provide footwear-specific lighting tips', () => {
      expect(footwearGuidance.lightingTips).toContain('Natural window light works best');
      expect(footwearGuidance.lightingTips).toContain('Ensure even lighting on both shoes');
    });
  });

  describe('get360PhotoGuidance', () => {
    it('should return 360-degree photography instructions', () => {
      const guidance = PhotographyGuidanceService.get360PhotoGuidance();

      expect(guidance).toHaveLength(2);
      expect(guidance[0].title).toBe('Set Up 360° Photography Space');
      expect(guidance[1].title).toBe('Position and Rotate');
    });

    it('should include setup instructions for 360° photography', () => {
      const guidance = PhotographyGuidanceService.get360PhotoGuidance();
      const setupStep = guidance[0];

      expect(setupStep.tips).toContain('Use a lazy Susan or rotating platform');
      expect(setupStep.tips).toContain('Set up consistent lighting from multiple angles');
      expect(setupStep.commonMistakes).toContain('Inconsistent lighting between shots');
    });

    it('should include rotation and capture instructions', () => {
      const guidance = PhotographyGuidanceService.get360PhotoGuidance();
      const rotateStep = guidance[1];

      expect(rotateStep.tips).toContain('Take photos every 30-45 degrees (8-12 total shots)');
      expect(rotateStep.tips).toContain('Keep camera height and distance consistent');
      expect(rotateStep.commonMistakes).toContain('Irregular rotation intervals');
    });

    it('should have proper step numbering and timing', () => {
      const guidance = PhotographyGuidanceService.get360PhotoGuidance();

      guidance.forEach((instruction, index) => {
        expect(instruction.step).toBe(index + 1);
        expect(instruction.duration).toBe(8);
        expect(instruction.title).toBeTruthy();
        expect(instruction.description).toBeTruthy();
      });
    });
  });

  describe('validatePhotoQuality', () => {
    it('should return validation result with suggestions', () => {
      const mockBuffer = Buffer.from('fake-image-data');
      const result = PhotographyGuidanceService.validatePhotoQuality(mockBuffer);

      expect(result).toMatchObject({
        isValid: expect.any(Boolean),
        issues: expect.any(Array),
        suggestions: expect.any(Array)
      });

      expect(result.suggestions).toContain('Ensure good lighting for best results');
      expect(result.suggestions).toContain('Keep camera steady to avoid blur');
      expect(result.suggestions).toContain('Make sure the entire item is visible in frame');
    });

    it('should currently return valid for all images (placeholder implementation)', () => {
      const mockBuffer = Buffer.from('any-image-data');
      const result = PhotographyGuidanceService.validatePhotoQuality(mockBuffer);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('getPhotographyTips', () => {
    it('should provide low light photography tips', () => {
      const tips = PhotographyGuidanceService.getPhotographyTips('low_light');

      expect(tips).toContain('Move closer to a window for natural light');
      expect(tips).toContain('Use multiple lamps to create even lighting');
      expect(tips).toContain('Avoid using camera flash as it creates harsh shadows');
      expect(tips).toContain('Consider shooting during daytime hours');
      expect(tips).toContain('Use a white sheet or poster board as a reflector');
    });

    it('should provide small space photography tips', () => {
      const tips = PhotographyGuidanceService.getPhotographyTips('small_space');

      expect(tips).toContain('Use a smaller background like a white poster board');
      expect(tips).toContain('Shoot smaller items like accessories on a table');
      expect(tips).toContain('Consider hanging items for vertical shots');
      expect(tips).toContain('Use your phone\'s wide-angle lens if available');
      expect(tips).toContain('Focus on clean, minimal compositions');
    });

    it('should provide no tripod photography tips', () => {
      const tips = PhotographyGuidanceService.getPhotographyTips('no_tripod');

      expect(tips).toContain('Brace your arms against your body for stability');
      expect(tips).toContain('Use your phone\'s timer function (3-10 seconds)');
      expect(tips).toContain('Lean against a wall or stable surface');
      expect(tips).toContain('Take multiple shots to ensure you get a sharp one');
      expect(tips).toContain('Use burst mode and select the best photo');
    });

    it('should provide mobile-only photography tips', () => {
      const tips = PhotographyGuidanceService.getPhotographyTips('mobile_only');

      expect(tips).toContain('Clean your phone\'s camera lens regularly');
      expect(tips).toContain('Use your phone\'s portrait mode for better depth');
      expect(tips).toContain('Tap to focus on the most important part of the item');
      expect(tips).toContain('Use gridlines to help with composition');
      expect(tips).toContain('Edit photos using your phone\'s built-in tools');
    });

    it('should provide default tips for unknown conditions', () => {
      const tips = PhotographyGuidanceService.getPhotographyTips('unknown_condition' as any);

      expect(tips).toContain('Practice makes perfect - take multiple shots');
      expect(tips).toContain('Pay attention to lighting and composition');
      expect(tips).toContain('Keep your equipment clean and ready');
    });

    it('should return array of strings for all conditions', () => {
      const conditions: Array<'low_light' | 'small_space' | 'no_tripod' | 'mobile_only'> = [
        'low_light', 'small_space', 'no_tripod', 'mobile_only'
      ];

      conditions.forEach(condition => {
        const tips = PhotographyGuidanceService.getPhotographyTips(condition);
        expect(Array.isArray(tips)).toBe(true);
        expect(tips.length).toBeGreaterThan(0);
        tips.forEach(tip => {
          expect(typeof tip).toBe('string');
          expect(tip.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('instruction quality and consistency', () => {
    it('should have consistent instruction structure across all item types', () => {
      const itemTypes = ['Shirts', 'Jackets', 'Jeans', 'Dress', 'Sneakers'];
      const domains: VUFSDomain[] = ['APPAREL', 'APPAREL', 'APPAREL', 'APPAREL', 'FOOTWEAR'];

      itemTypes.forEach((itemType, index) => {
        const domain = domains[index];
        const guidance = PhotographyGuidanceService.getGuidanceForItem(domain, itemType);

        // Check that all instructions have required fields
        guidance.instructions.forEach(instruction => {
          expect(instruction.step).toBeGreaterThan(0);
          expect(instruction.title).toBeTruthy();
          expect(instruction.description).toBeTruthy();
          expect(instruction.duration).toBe(8);
          expect(Array.isArray(instruction.tips)).toBe(true);
          expect(Array.isArray(instruction.commonMistakes)).toBe(true);
          expect(instruction.tips.length).toBeGreaterThan(0);
          expect(instruction.commonMistakes.length).toBeGreaterThan(0);
        });

        // Check guidance structure
        expect(guidance.domain).toBe(domain);
        expect(guidance.itemType).toBe(itemType);
        expect(guidance.totalDuration).toBeGreaterThan(0);
        expect(Array.isArray(guidance.requiredPhotos)).toBe(true);
        expect(Array.isArray(guidance.optionalPhotos)).toBe(true);
        expect(Array.isArray(guidance.equipmentTips)).toBe(true);
        expect(Array.isArray(guidance.lightingTips)).toBe(true);
      });
    });

    it('should have meaningful and actionable tips', () => {
      const guidance = PhotographyGuidanceService.getGuidanceForItem('APPAREL', 'Shirts');

      guidance.instructions.forEach(instruction => {
        instruction.tips.forEach(tip => {
          expect(tip.length).toBeGreaterThan(10); // Meaningful length
          expect(tip).toMatch(/^[A-Z]/); // Starts with capital letter
        });

        instruction.commonMistakes.forEach(mistake => {
          expect(mistake.length).toBeGreaterThan(5); // Meaningful length
          expect(mistake).toMatch(/^[A-Z]/); // Starts with capital letter
        });
      });
    });

    it('should have appropriate timing for all steps', () => {
      const guidance = PhotographyGuidanceService.getGuidanceForItem('APPAREL', 'Shirts');

      guidance.instructions.forEach(instruction => {
        expect(instruction.duration).toBe(8); // All steps should be 8 seconds as per requirements
      });

      // Total duration should be reasonable (not too long or too short)
      expect(guidance.totalDuration).toBeGreaterThanOrEqual(24); // At least 3 steps
      expect(guidance.totalDuration).toBeLessThanOrEqual(80); // Not more than 10 steps
    });

    it('should provide comprehensive equipment and lighting guidance', () => {
      const apparelGuidance = PhotographyGuidanceService.getGuidanceForItem('APPAREL', 'Shirts');
      const footwearGuidance = PhotographyGuidanceService.getGuidanceForItem('FOOTWEAR', 'Sneakers');

      [apparelGuidance, footwearGuidance].forEach(guidance => {
        expect(guidance.equipmentTips.length).toBeGreaterThanOrEqual(3);
        expect(guidance.lightingTips.length).toBeGreaterThanOrEqual(3);

        guidance.equipmentTips.forEach(tip => {
          expect(tip).toMatch(/camera|phone|tripod|lens|equipment|portrait|smartphone/i);
        });

        guidance.lightingTips.forEach(tip => {
          expect(tip).toMatch(/light|lighting|window|shadow|bright|reflector|natural/i);
        });
      });
    });
  });

  describe('workflow integration', () => {
    it('should support the 8-second transition requirement', () => {
      const guidance = PhotographyGuidanceService.getGuidanceForItem('APPAREL', 'Shirts');

      // All steps should be exactly 8 seconds as per requirement 2.5
      guidance.instructions.forEach(instruction => {
        expect(instruction.duration).toBe(8);
      });
    });

    it('should provide guidance suitable for minimal text display', () => {
      const guidance = PhotographyGuidanceService.getGuidanceForItem('FOOTWEAR', 'Sneakers');

      // Titles should be concise for minimal text requirement
      guidance.instructions.forEach(instruction => {
        expect(instruction.title.length).toBeLessThan(50);
        expect(instruction.description.length).toBeLessThan(100);
      });
    });

    it('should cover both required and optional photo types', () => {
      const apparelGuidance = PhotographyGuidanceService.getGuidanceForItem('APPAREL', 'Shirts');
      const footwearGuidance = PhotographyGuidanceService.getGuidanceForItem('FOOTWEAR', 'Sneakers');

      expect(apparelGuidance.requiredPhotos).toContain('front');
      expect(apparelGuidance.optionalPhotos).toContain('back');
      expect(apparelGuidance.optionalPhotos).toContain('detail');

      expect(footwearGuidance.requiredPhotos).toContain('main');
      expect(footwearGuidance.optionalPhotos).toContain('side');
      expect(footwearGuidance.optionalPhotos).toContain('sole');
    });
  });
});