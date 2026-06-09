export interface PlanConfig {
  name: string;
  price: number; // in INR
  razorpayPlanId?: string; // subscription plan ID (from env)
  accessLevel: 'video_only' | 'premium';
}

export const PLANS: Record<string, PlanConfig> = {
  video_monthly: {
    name: "Video Pass",
    price: 20,
    razorpayPlanId: process.env.RAZORPAY_VIDEO_PLAN_ID || process.env.NEXT_PUBLIC_RAZORPAY_VIDEO_PLAN_ID,
    accessLevel: 'video_only',
  },
  full_monthly: {
    name: "Full Access",
    price: 50,
    razorpayPlanId: process.env.RAZORPAY_MONTHLY_PLAN_ID || process.env.NEXT_PUBLIC_RAZORPAY_MONTHLY_PLAN_ID,
    accessLevel: 'premium',
  },
  yearly: {
    name: "Yearly Vault",
    price: 250,
    accessLevel: 'premium',
  },
};
