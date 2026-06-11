import { z } from 'zod';

// ─── Search Input ─────────────────────────────────────────────────────────────
// Relaxed to allow Unicode letters so Devanagari/Hindi subject names work correctly.
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Query required')
    .max(100, 'Query too long')
    // Allow Unicode letters, digits, spaces, and common punctuation
    .regex(/^[\p{L}\p{N}\s\-_.&,()]+$/u, 'Invalid characters in search'),
});

// ─── Study Material (Admin Upload) ───────────────────────────────────────────
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
    'PDF must be from an approved source (Supabase, Google Drive)'
  ),
});

// ─── Payment (One-Time) ───────────────────────────────────────────────────────
// plan_type now matches ALL plans used in pricing/page.tsx
export const paymentSchema = z.object({
  user_id: z.string().min(1),
  plan_type: z.enum(['premium_onetime', 'premium_monthly', 'premium_yearly', 'video_pass', 'video_monthly']),
  razorpay_order_id: z.string().startsWith('order_'),
  razorpay_payment_id: z.string().startsWith('pay_'),
  // HMAC-SHA256 hex is 64 chars; subscription signatures may differ — accept 40–128
  razorpay_signature: z.string().min(40).max(128),
});

// ─── Subscription Verification ────────────────────────────────────────────────
export const subscriptionVerifySchema = z.object({
  razorpay_payment_id: z.string().startsWith('pay_'),
  razorpay_subscription_id: z.string().startsWith('sub_'),
  razorpay_signature: z.string().min(40).max(128),
});

// ─── Email Newsletter Signup ──────────────────────────────────────────────────
export const emailSchema = z.object({
  email: z.string().email('Invalid email').max(254).toLowerCase(),
});

// ─── API Request: Create Order ────────────────────────────────────────────────
export const createOrderSchema = z.object({
  amount: z.number().int().positive('Amount must be positive (in paise)'),
  currency: z.enum(['INR']).default('INR'),
  plan_type: z.enum(['video_pass', 'premium_yearly', 'premium_onetime']),
});

// ─── API Request: Create Subscription ────────────────────────────────────────
export const createSubscriptionSchema = z.object({
  plan_type: z.enum(['premium_monthly', 'premium_yearly']),
});
