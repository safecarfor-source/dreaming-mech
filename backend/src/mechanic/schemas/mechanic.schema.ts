import { z } from 'zod';

/**
 * Zod schema for creating a mechanic
 * Provides runtime validation with excellent TypeScript inference
 */
export const CreateMechanicSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),

  location: z
    .string()
    .min(1, 'Location is required')
    .max(50, 'Location must be less than 50 characters'),

  phone: z
    .string()
    .regex(
      /^0\d{1,3}-?\d{3,4}-?\d{3,4}$/,
      'Phone must be a valid Korean phone number (e.g., 02-1234-5678, 010-1234-5678, 0000-000-000)',
    )
    .or(
      z.string().regex(
        /^0\d{9,11}$/,
        'Phone must be a valid Korean phone number without hyphens',
      ),
    ),

  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),

  address: z
    .string()
    .min(1, 'Address is required')
    .max(200, 'Address must be less than 200 characters'),

  mapLat: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),

  mapLng: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),

  mainImageUrl: z
    .string()
    .url('Main image URL must be a valid URL')
    .optional(),

  galleryImages: z
    .array(z.string().url('Each gallery image must be a valid URL'))
    .max(10, 'Maximum 10 gallery images allowed')
    .optional()
    .default([]),

  youtubeUrl: z
    .string()
    .url('YouTube URL must be a valid URL')
    .regex(
      /^https:\/\/(www\.)?youtube\.com\/(watch\?v=|shorts\/)/,
      'Must be a valid YouTube video or shorts URL',
    )
    .optional(),

  isActive: z.boolean().optional().default(true),
});

/**
 * Zod schema for updating a mechanic
 * All fields are optional for partial updates
 */
export const UpdateMechanicSchema = CreateMechanicSchema.partial();

/**
 * Zod schema for reordering mechanics
 */
export const ReorderMechanicsSchema = z.object({
  orderedIds: z
    .array(z.number().int().positive())
    .min(1, 'At least one mechanic ID is required'),
});

export type ReorderMechanicsDto = z.infer<typeof ReorderMechanicsSchema>;

/**
 * Zod schema for login
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .email('Must be a valid email address')
    .min(1, 'Email is required'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
});

/**
 * TypeScript types inferred from Zod schemas
 * These ensure consistency between validation and TypeScript types
 */
export type CreateMechanicDto = z.infer<typeof CreateMechanicSchema>;
export type UpdateMechanicDto = z.infer<typeof UpdateMechanicSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
