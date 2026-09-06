const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

export function validateEnv() {
  // Only run in server context to prevent leaking server keys on client bundle
  if (typeof window !== 'undefined') return;

  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(
      `⚠️ Warning: Missing environment variables:\n${missing.join('\n')}\nPlease configure them in your Vercel Project Settings (Dashboard > Settings > Environment Variables).`
    );
  }
}
