const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RAZORPAY_KEY_ID',
  'NEXT_PUBLIC_RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'CRON_SECRET',
  'RAZORPAY_MONTHLY_PLAN_ID',
  'RAZORPAY_VIDEO_PLAN_ID',
];

export function validateEnv() {
  // Only run in server context to prevent leaking server keys on client bundle
  if (typeof window !== 'undefined') return;

  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing.join('\n')}`
    );
  }
}
