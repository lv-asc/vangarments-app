import { VUFSDomain } from '../types/shared';

export interface PhotoInstruction {
  step: number;
  title: string;
  description: string;
  duration: number; // seconds
  tips: string[];
  commonMistakes: string[];
  imageExample?: string;
}

export interface PhotoGuidance {
  domain: VUFSDomain;
  itemType: string;
  instructions: PhotoInstruction[];
  totalDuration: number;
  requiredPhotos: string[];
  optionalPhotos: string[];
  equipmentTips: string[];
  lightingTips: string[];
}

export class PhotographyGuidanceService {
  /**
   * Get photography guidance for specific item type
   */
  static getGuidanceForItem(domain: VUFSDomain, itemType: string): PhotoGuidance {
    if (domain === 'FOOTWEAR') {
      return this.getFootwearGuidance(itemType);
    } else {
      return this.getApparelGuidance(itemType);
    }
  }

  /**
   * Get apparel photography guidance
   */
  private static getApparelGuidance(itemType: string): PhotoGuidance {
    const baseInstructions: PhotoInstruction[] = [
      {
        step: 1,
        title: 'Prepare Your Space',
        description: 'Find a clean, flat surface with good natural lighting',
        duration: 8,
        tips: [
          'Use a white or neutral background',
          'Ensure the surface is wrinkle-free',
          'Position near a window for natural light',
          'Remove any distracting objects from the background'
        ],
        commonMistakes: [
          'Using cluttered backgrounds',
          'Poor lighting conditions',
          'Wrinkled or dirty surfaces'
        ]
      },
      {
        step: 2,
        title: 'Position the Garment',
        description: 'Lay the item flat and arrange it naturally',
        duration: 8,
        tips: [
          'Smooth out all wrinkles and creases',
          'Ensure the item is centered in frame',
          'Arrange sleeves and details naturally',
          'Make sure all buttons/zippers are properly closed'
        ],
        commonMistakes: [
          'Leaving wrinkles visible',
          'Crooked positioning',
          'Sleeves folded awkwardly'
        ]
      }
    ];

    // Add item-specific instructions
    const specificInstructions = this.getItemSpecificInstructions(itemType);
    
    const allInstructions = [...baseInstructions, ...specificInstructions];
    
    // Add final photo instruction
    allInstructions.push({
      step: allInstructions.length + 1,
      title: 'Capture the Photo',
      description: 'Take the photo from directly above at a 90-degree angle',
      duration: 8,
      tips: [
        'Hold camera/phone steady and parallel to the surface',
        'Ensure the entire item fits in frame with some border space',
        'Check that lighting is even across the garment',
        'Take multiple shots to ensure you have the best one'
      ],
      commonMistakes: [
        'Shooting at an angle',
        'Cutting off parts of the garment',
        'Uneven shadows',
        'Blurry photos from camera shake'
      ]
    });

    return {
      domain: 'APPAREL',
      itemType,
      instructions: allInstructions,
      totalDuration: allInstructions.reduce((sum, inst) => sum + inst.duration, 0),
      requiredPhotos: ['front'],
      optionalPhotos: ['back', 'detail', 'label'],
      equipmentTips: [
        'Use your smartphone camera - it\'s sufficient for catalog photos',
        'Clean your camera lens before shooting',
        'Use a tripod or stable surface if available',
        'Consider using your phone\'s timer function for steadier shots'
      ],
      lightingTips: [
        'Natural daylight is best - shoot near a window',
        'Avoid direct sunlight which creates harsh shadows',
        'Overcast days provide the most even lighting',
        'If using artificial light, use multiple sources to avoid shadows'
      ]
    };
  }

  /**
   * Get footwear photography guidance
   */
  private static getFootwearGuidance(itemType: string): PhotoGuidance {
    const instructions: PhotoInstruction[] = [
      {
        step: 1,
        title: 'Prepare Your Shoes',
        description: 'Clean and prepare the footwear for photography',
        duration: 8,
        tips: [
          'Clean the shoes thoroughly - remove dirt and scuffs',
          'Polish leather shoes if applicable',
          'Ensure laces are clean and properly tied',
          'Remove any price tags or stickers'
        ],
        commonMistakes: [
          'Dirty or scuffed shoes',
          'Loose or messy laces',
          'Visible wear that could be cleaned'
        ]
      },
      {
        step: 2,
        title: 'Set Up Your Shot',
        description: 'Position shoes on a clean, neutral background',
        duration: 8,
        tips: [
          'Use a white or light-colored background',
          'Ensure the surface is clean and smooth',
          'Position near natural light source',
          'Have both shoes ready for the shot'
        ],
        commonMistakes: [
          'Cluttered or distracting backgrounds',
          'Poor lighting setup',
          'Uneven surface causing shoes to tilt'
        ]
      },
      {
        step: 3,
        title: 'Position the Footwear',
        description: 'Arrange shoes in the standard catalog position',
        duration: 8,
        tips: [
          'Place right shoe forward, left shoe slightly behind',
          'Angle the right shoe pointing slightly to the right',
          'Ensure both shoes are visible and not overlapping',
          'Laces should be tied neatly and evenly'
        ],
        commonMistakes: [
          'Shoes positioned incorrectly',
          'One shoe blocking the other',
          'Uneven lace tying',
          'Shoes not angled properly'
        ]
      },
      {
        step: 4,
        title: 'Capture the Photo',
        description: 'Take the photo from a slight angle to show both shoes',
        duration: 8,
        tips: [
          'Shoot from about 45-degree angle above the shoes',
          'Ensure both shoes are in focus',
          'Include the full shoe with some background space',
          'Check that lighting is even on both shoes'
        ],
        commonMistakes: [
          'Shooting from too high or too low',
          'One shoe out of focus',
          'Harsh shadows on the shoes',
          'Cutting off parts of the shoes'
        ]
      }
    ];

    return {
      domain: 'FOOTWEAR',
      itemType,
      instructions,
      totalDuration: instructions.reduce((sum, inst) => sum + inst.duration, 0),
      requiredPhotos: ['main'],
      optionalPhotos: ['side', 'sole', 'detail', 'back'],
      equipmentTips: [
        'Smartphone camera is perfect for shoe photography',
        'Clean camera lens for crisp, clear photos',
        'Use portrait mode if available for better depth',
        'Consider using a small tripod for consistent angles'
      ],
      lightingTips: [
        'Natural window light works best',
        'Avoid direct sunlight to prevent harsh shadows',
        'Use a white poster board as a reflector if needed',
        'Ensure even lighting on both shoes'
      ]
    };
  }

  /**
   * Get item-specific photography instructions
   */
  private static getItemSpecificInstructions(itemType: string): PhotoInstruction[] {
    const type = itemType.toLowerCase();

    if (type.includes('shirt') || type.includes('blouse') || type.includes('top')) {
      return [
        {
          step: 3,
          title: 'Arrange Shirt Details',
          description: 'Position collar, sleeves, and buttons properly',
          duration: 8,
          tips: [
            'Lay collar flat and centered',
            'Spread sleeves naturally to sides',
            'Ensure all buttons are fastened',
            'Smooth out any pocket details'
          ],
          commonMistakes: [
            'Collar folded or twisted',
            'Sleeves bunched up',
            'Unbuttoned or misaligned buttons'
          ]
        }
      ];
    }

    if (type.includes('jacket') || type.includes('blazer') || type.includes('coat')) {
      return [
        {
          step: 3,
          title: 'Arrange Jacket Details',
          description: 'Position lapels, sleeves, and closures properly',
          duration: 8,
          tips: [
            'Lay lapels flat and symmetrical',
            'Arrange sleeves naturally',
            'Close all zippers and buttons',
            'Ensure pockets lay flat'
          ],
          commonMistakes: [
            'Asymmetrical lapels',
            'Bunched sleeves',
            'Open zippers or buttons',
            'Pockets sticking out'
          ]
        }
      ];
    }

    if (type.includes('pants') || type.includes('jeans') || type.includes('trousers')) {
      return [
        {
          step: 3,
          title: 'Arrange Pants Layout',
          description: 'Position legs and waistband properly',
          duration: 8,
          tips: [
            'Lay legs straight and parallel',
            'Ensure waistband is flat and centered',
            'Close all zippers and buttons',
            'Smooth out pocket areas'
          ],
          commonMistakes: [
            'Crooked leg positioning',
            'Twisted waistband',
            'Open fly or buttons',
            'Bulging pockets'
          ]
        }
      ];
    }

    if (type.includes('dress')) {
      return [
        {
          step: 3,
          title: 'Arrange Dress Shape',
          description: 'Position the dress to show its natural silhouette',
          duration: 8,
          tips: [
            'Lay the dress flat showing full length',
            'Arrange sleeves (if any) naturally',
            'Ensure neckline is properly positioned',
            'Smooth out skirt portion evenly'
          ],
          commonMistakes: [
            'Dress bunched up or twisted',
            'Uneven hem line',
            'Neckline folded incorrectly'
          ]
        }
      ];
    }

    // Default instructions for other items
    return [
      {
        step: 3,
        title: 'Arrange Item Details',
        description: 'Position all details and features properly',
        duration: 8,
        tips: [
          'Ensure item is laid flat and centered',
          'Arrange any straps, ties, or details naturally',
          'Close all zippers, buttons, or fasteners',
          'Smooth out all areas evenly'
        ],
        commonMistakes: [
          'Item positioned crookedly',
          'Details folded or hidden',
          'Fasteners left open'
        ]
      }
    ];
  }

  /**
   * Get 360-degree photo guidance
   */
  static get360PhotoGuidance(): PhotoInstruction[] {
    return [
      {
        step: 1,
        title: 'Set Up 360° Photography Space',
        description: 'Create a controlled environment for 360° capture',
        duration: 8,
        tips: [
          'Use a lazy Susan or rotating platform',
          'Set up consistent lighting from multiple angles',
          'Use a seamless background (white or neutral)',
          'Mark camera position to maintain consistent distance'
        ],
        commonMistakes: [
          'Inconsistent lighting between shots',
          'Camera distance varying',
          'Background changes between angles'
        ]
      },
      {
        step: 2,
        title: 'Position and Rotate',
        description: 'Take photos at regular intervals while rotating the item',
        duration: 8,
        tips: [
          'Take photos every 30-45 degrees (8-12 total shots)',
          'Keep camera height and distance consistent',
          'Ensure item stays centered on platform',
          'Maintain same lighting throughout'
        ],
        commonMistakes: [
          'Irregular rotation intervals',
          'Item moving off-center',
          'Inconsistent camera positioning'
        ]
      }
    ];
  }

  /**
   * Validate photo quality
   */
  static validatePhotoQuality(imageBuffer: Buffer): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    // This would integrate with image analysis
    // For now, return basic validation
    return {
      isValid: true,
      issues: [],
      suggestions: [
        'Ensure good lighting for best results',
        'Keep camera steady to avoid blur',
        'Make sure the entire item is visible in frame'
      ]
    };
  }

  /**
   * Get photography tips for specific conditions
   */
  static getPhotographyTips(condition: 'low_light' | 'small_space' | 'no_tripod' | 'mobile_only'): string[] {
    switch (condition) {
      case 'low_light':
        return [
          'Move closer to a window for natural light',
          'Use multiple lamps to create even lighting',
          'Avoid using camera flash as it creates harsh shadows',
          'Consider shooting during daytime hours',
          'Use a white sheet or poster board as a reflector'
        ];
      
      case 'small_space':
        return [
          'Use a smaller background like a white poster board',
          'Shoot smaller items like accessories on a table',
          'Consider hanging items for vertical shots',
          'Use your phone\'s wide-angle lens if available',
          'Focus on clean, minimal compositions'
        ];
      
      case 'no_tripod':
        return [
          'Brace your arms against your body for stability',
          'Use your phone\'s timer function (3-10 seconds)',
          'Lean against a wall or stable surface',
          'Take multiple shots to ensure you get a sharp one',
          'Use burst mode and select the best photo'
        ];
      
      case 'mobile_only':
        return [
          'Clean your phone\'s camera lens regularly',
          'Use your phone\'s portrait mode for better depth',
          'Tap to focus on the most important part of the item',
          'Use gridlines to help with composition',
          'Edit photos using your phone\'s built-in tools'
        ];
      
      default:
        return [
          'Practice makes perfect - take multiple shots',
          'Pay attention to lighting and composition',
          'Keep your equipment clean and ready'
        ];
    }
  }
}