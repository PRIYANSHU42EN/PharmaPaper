import { z } from 'zod';

// Search input
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Query required')
    .max(100, 'Query too long')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Invalid characters in search'),
});

// Study material (admin upload)
export const materialSchema = z.object({
  action: z.enum(['INSERT', 'UPDATE', 'DELETE']).optional(),
  id: z.string().uuid().nullable().optional(),
  title: z.string().min(3).max(200),
  course: z.enum(['B.Pharm', 'D.Pharm']),
  semester: z.number().int().min(1).max(8),
  subject: z.string().min(2).max(100),
  type: z.enum(['notes', 'pyq']),
  file_url: z.string().url().refine(
    url => ['supabase.co', 'drive.google.com', 'google.com', 'w3.org'].some(d => url.includes(d)),
    'PDF must be from an approved source'
  ),
});

// Payment
export const paymentSchema = z.object({
  user_id: z.string(),
  plan_type: z.enum(['premium_onetime', 'premium_monthly']),
  razorpay_order_id: z.string().startsWith('order_'),
  razorpay_payment_id: z.string().startsWith('pay_'),
  razorpay_signature: z.string().length(64),
});

// Email signup
export const emailSchema = z.object({
  email: z.string().email('Invalid email').max(254),
});
