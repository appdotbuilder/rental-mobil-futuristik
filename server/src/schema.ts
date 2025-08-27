import { z } from 'zod';

// Car schema with proper numeric handling
export const carSchema = z.object({
  id: z.number(),
  name: z.string(),
  brand: z.string(),
  model: z.string(),
  year: z.number().int(),
  image_url: z.string().url(),
  rental_price_per_day: z.number(),
  transmission: z.enum(['manual', 'automatic']),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid']),
  seats: z.number().int(),
  description: z.string().nullable(),
  features: z.string().nullable(), // JSON string of features array
  is_available: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Car = z.infer<typeof carSchema>;

// Input schema for creating cars
export const createCarInputSchema = z.object({
  name: z.string().min(1, 'Nama mobil wajib diisi'),
  brand: z.string().min(1, 'Merek mobil wajib diisi'),
  model: z.string().min(1, 'Model mobil wajib diisi'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  image_url: z.string().url('URL gambar tidak valid'),
  rental_price_per_day: z.number().positive('Harga sewa harus lebih dari 0'),
  transmission: z.enum(['manual', 'automatic']),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid']),
  seats: z.number().int().min(1).max(20),
  description: z.string().nullable(),
  features: z.string().nullable(), // JSON string of features
  is_available: z.boolean().default(true)
});

export type CreateCarInput = z.infer<typeof createCarInputSchema>;

// Input schema for updating cars
export const updateCarInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  image_url: z.string().url().optional(),
  rental_price_per_day: z.number().positive().optional(),
  transmission: z.enum(['manual', 'automatic']).optional(),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid']).optional(),
  seats: z.number().int().min(1).max(20).optional(),
  description: z.string().nullable().optional(),
  features: z.string().nullable().optional(),
  is_available: z.boolean().optional()
});

export type UpdateCarInput = z.infer<typeof updateCarInputSchema>;

// Car filter schema for search/filtering
export const carFilterSchema = z.object({
  brand: z.string().optional(),
  transmission: z.enum(['manual', 'automatic']).optional(),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid']).optional(),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  min_seats: z.number().int().optional(),
  max_seats: z.number().int().optional(),
  is_available: z.boolean().optional()
});

export type CarFilter = z.infer<typeof carFilterSchema>;

// Contact information schema
export const contactInfoSchema = z.object({
  id: z.number(),
  company_name: z.string(),
  phone: z.string(),
  email: z.string().email(),
  address: z.string(),
  whatsapp_number: z.string(),
  facebook_url: z.string().url().nullable(),
  instagram_url: z.string().url().nullable(),
  business_hours: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ContactInfo = z.infer<typeof contactInfoSchema>;

// Input schema for updating contact info
export const updateContactInfoInputSchema = z.object({
  id: z.number(),
  company_name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  address: z.string().min(1).optional(),
  whatsapp_number: z.string().min(1).optional(),
  facebook_url: z.string().url().nullable().optional(),
  instagram_url: z.string().url().nullable().optional(),
  business_hours: z.string().min(1).optional()
});

export type UpdateContactInfoInput = z.infer<typeof updateContactInfoInputSchema>;

// WhatsApp message generation schema
export const whatsappMessageInputSchema = z.object({
  car_id: z.number(),
  customer_name: z.string().min(1, 'Nama pelanggan wajib diisi'),
  customer_phone: z.string().min(1, 'Nomor telepon wajib diisi'),
  rental_start_date: z.string().min(1, 'Tanggal mulai sewa wajib diisi'),
  rental_end_date: z.string().min(1, 'Tanggal selesai sewa wajib diisi'),
  additional_message: z.string().optional()
});

export type WhatsappMessageInput = z.infer<typeof whatsappMessageInputSchema>;

// WhatsApp message response schema
export const whatsappMessageResponseSchema = z.object({
  whatsapp_url: z.string().url(),
  message: z.string()
});

export type WhatsappMessageResponse = z.infer<typeof whatsappMessageResponseSchema>;

// Car availability check schema
export const carAvailabilityInputSchema = z.object({
  car_id: z.number(),
  start_date: z.string(),
  end_date: z.string()
});

export type CarAvailabilityInput = z.infer<typeof carAvailabilityInputSchema>;

// Car availability response schema
export const carAvailabilityResponseSchema = z.object({
  car_id: z.number(),
  is_available: z.boolean(),
  message: z.string()
});

export type CarAvailabilityResponse = z.infer<typeof carAvailabilityResponseSchema>;