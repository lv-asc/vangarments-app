import { z } from 'zod';

// Validation schemas using Zod
export const UserRegistrationSchema = z.object({
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Invalid CPF format'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  birthDate: z.string().transform((str) => new Date(str)),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']),
  genderOther: z.string().optional(),
  bodyType: z.enum(['male', 'female']).optional(),
  telephone: z.string().min(8, 'Phone number must be at least 8 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_.]+$/, 'Username must only contain letters, numbers, underscores, and dots'),
}).refine((data) => {
  if (data.gender === 'other') {
    return !!data.bodyType;
  }
  return true;
}, {
  message: "If gender is 'Other', you must specify the body type for app features",
  path: ['bodyType'],
});

export const VUFSItemSchema = z.object({
  category: z.object({
    page: z.string().min(1, 'Page category is required'),
    blueSubcategory: z.string().min(1, 'Blue subcategory is required'),
    whiteSubcategory: z.string().min(1, 'White subcategory is required'),
    graySubcategory: z.string().min(1, 'Gray subcategory is required'),
  }),
  brand: z.object({
    brand: z.string().min(1, 'Brand is required'),
    line: z.string().optional(),
    collaboration: z.string().optional(),
  }),
  metadata: z.object({
    composition: z.array(z.object({
      name: z.string(),
      percentage: z.number().min(0).max(100),
    })).max(3, 'Maximum 3 materials allowed'),
    colors: z.array(z.object({
      name: z.string(),
      hex: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
      undertones: z.array(z.string()).max(3, 'Maximum 3 undertones allowed'),
    })).max(3, 'Maximum 3 colors allowed'),
    careInstructions: z.array(z.string()),
  }),
  condition: z.object({
    status: z.enum(['new', 'dswt', 'never_used', 'used']),
    description: z.string().optional(),
    wearCount: z.number().min(0).optional(),
  }),
});

export const LocationSchema = z.object({
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  neighborhood: z.string().optional(),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'Invalid CEP format').optional(),
});

export const BrazilianAddressSchema = z.object({
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'Invalid CEP format'),
  state: z.string().length(2, 'State must be 2 characters'),
  city: z.string().min(2, 'City name is required'),
  neighborhood: z.string().min(2, 'Neighborhood is required'),
  street: z.string().min(5, 'Street address is required'),
  number: z.string().min(1, 'Address number is required'),
  complement: z.string().optional(),
});

export const MeasurementsSchema = z.object({
  height: z.number().min(100).max(250).optional(),
  weight: z.number().min(30).max(300).optional(),
  sizes: z.record(z.string(), z.record(z.string(), z.string())).optional(),
});

export const PreferencesSchema = z.object({
  favoriteColors: z.array(z.string()).optional(),
  preferredBrands: z.array(z.string()).optional(),
  styleProfile: z.array(z.string()).optional(),
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).optional(),
});

export const SizeConversionSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  fromStandard: z.enum(['BR', 'US', 'EU', 'UK']),
  toStandard: z.enum(['BR', 'US', 'EU', 'UK']),
  category: z.enum(['womens_clothing', 'mens_clothing', 'shoes']),
});

export type UserRegistrationInput = z.infer<typeof UserRegistrationSchema>;
export type VUFSItemInput = z.infer<typeof VUFSItemSchema>;
export type LocationInput = z.infer<typeof LocationSchema>;
export type BrazilianAddressInput = z.infer<typeof BrazilianAddressSchema>;
export type MeasurementsInput = z.infer<typeof MeasurementsSchema>;
export type PreferencesInput = z.infer<typeof PreferencesSchema>;
export type SizeConversionInput = z.infer<typeof SizeConversionSchema>;