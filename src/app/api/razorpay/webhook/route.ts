import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { checkRateLimit } from '@/lib/ratelimit';

// Use service role key for admin DB access (fallback to anon key for safety in dev environments)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ✅ Crash immediately if secret is missing — never use a default
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

if (!webhookSecret) {
  throw new Error(
    '❌ RAZORPAY_WEBHOOK_SECRET is not set. Refusing to start.'
  );
}

function verifySignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret) // uses verified secret
    .update(body)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { blocked, headers } = await checkRateLimit("payment", ip);
  if (blocked) {
    return NextResponse.json(
      { error: "Too many requests. Try again in 1 minute." },
      { status: 429, headers }
    );
  }

  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || '';

  // Step 1: Verify it's really from Razorpay
  if (!verifySignature(body, signature)) {
    console.error('❌ Invalid webhook signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);
  const { event: eventType, payload } = event;

  console.log('📩 Webhook received:', eventType);

  try {
    switch (eventType) {

      // ✅ One-time payment success
      case 'payment.captured': {
        const payment = payload.payment.entity;
        await handlePaymentCaptured(payment);
        break;
      }

      // ❌ One-time payment failed
      case 'payment.failed': {
        const payment = payload.payment.entity;
        await handlePaymentFailed(payment);
        break;
      }

      // ✅ Subscription activated
      case 'subscription.activated': {
        const subscription = payload.subscription.entity;
        await handleSubscriptionActivated(subscription);
        break;
      }

      // 🔄 Subscription renewed (monthly charge success)
      case 'subscription.charged': {
        const subscription = payload.subscription.entity;
        const payment = payload.payment.entity;
        await handleSubscriptionCharged(subscription, payment);
        break;
      }

      // ⏸️ Subscription cancelled by user
      case 'subscription.cancelled': {
        const subscription = payload.subscription.entity;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      // ⚠️ Subscription payment failed
      case 'subscription.halted': {
        const subscription = payload.subscription.entity;
        await handleSubscriptionHalted(subscription);
        break;
      }

      default:
        console.log('ℹ️ Unhandled event:', eventType);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

// ─────────────────────────────────────────
// HANDLERS
// ─────────────────────────────────────────

async function handlePaymentCaptured(payment: any) {
  const { id, order_id, amount, notes } = payment;

  // Retrieve original pending payment to know the plan_type
  const { data: original } = await supabase
    .from('payments')
    .select('plan_type')
    .eq('razorpay_order_id', order_id)
    .maybeSingle();

  const planType = original?.plan_type || 'premium_onetime';
  
  let accessLevel = 'premium';
  let durationDays = 365;

  if (planType === 'video_pass' || planType === 'video_monthly') {
    accessLevel = 'video_only';
    durationDays = 30;
  } else if (planType === 'premium_monthly' || planType === 'full_access') {
    accessLevel = 'premium';
    durationDays = 30;
  } else if (planType === 'premium_onetime' || planType === 'yearly') {
    accessLevel = 'premium';
    durationDays = 365;
  }

  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  await supabase
    .from('payments')
    .update({
      status: 'paid',
      razorpay_payment_id: id,
      access_level: accessLevel,
      expires_at: expiresAt.toISOString(),
    })
    .eq('razorpay_order_id', order_id);

  // Send confirmation email
  await sendEmail({
    to: notes?.email,
    subject: '🎉 PharmPaper Premium Activated!',
    message: `Your premium access (${accessLevel === 'video_only' ? 'Video Pass' : 'Full Access'}) is now active. Amount paid: ₹${amount / 100}`,
  });

  console.log('✅ Payment captured:', id);
}

async function handlePaymentFailed(payment: any) {
  const { order_id, notes, error_description } = payment;

  await supabase
    .from('payments')
    .update({ status: 'failed' })
    .eq('razorpay_order_id', order_id);

  // Notify user
  await sendEmail({
    to: notes?.email,
    subject: '❌ PharmPaper Payment Failed',
    message: `Your payment failed. Reason: ${error_description}. Please try again.`,
  });

  console.log('❌ Payment failed:', order_id);
}

async function handleSubscriptionActivated(subscription: any) {
  const { id, plan_id, notes } = subscription;

  let accessLevel = 'premium';
  let planType = 'premium_monthly';
  
  if (plan_id === process.env.RAZORPAY_VIDEO_PLAN_ID) {
    accessLevel = 'video_only';
    planType = 'video_monthly';
  }

  await supabase
    .from('payments')
    .update({ 
      status: 'paid',
      access_level: accessLevel,
      plan_type: planType,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('razorpay_subscription_id', id);

  await sendEmail({
    to: notes?.email,
    subject: '🎉 PharmPaper Subscription Active!',
    message: `Your monthly subscription (${accessLevel === 'video_only' ? 'Video Pass' : 'Full Access'}) is now active. Enjoy unlimited access!`,
  });

  console.log('✅ Subscription activated:', id);
}

async function handleSubscriptionCharged(subscription: any, payment: any) {
  const { id, plan_id, notes } = subscription;
  const { amount } = payment;

  // Retrieve original payment to copy user_id
  const { data: original } = await supabase
    .from('payments')
    .select('user_id')
    .eq('razorpay_subscription_id', id)
    .limit(1)
    .maybeSingle();

  const userId = original?.user_id || null;

  let accessLevel = 'premium';
  let planType = 'premium_monthly';
  
  if (plan_id === process.env.RAZORPAY_VIDEO_PLAN_ID) {
    accessLevel = 'video_only';
    planType = 'video_monthly';
  }

  // Insert new payment record for this month
  await supabase.from('payments').insert({
    user_id: userId,
    razorpay_subscription_id: id,
    razorpay_payment_id: payment.id,
    plan_type: planType,
    access_level: accessLevel,
    status: 'paid',
    amount: amount / 100,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  await sendEmail({
    to: notes?.email,
    subject: '🔄 PharmPaper Subscription Renewed',
    message: `Your monthly plan (${accessLevel === 'video_only' ? 'Video Pass' : 'Full Access'}) has been renewed. ₹${amount / 100} charged successfully.`,
  });

  console.log('🔄 Subscription renewed:', id);
}

async function handleSubscriptionCancelled(subscription: any) {
  const { id, notes, current_end } = subscription;

  // Keep active until period ends
  await supabase
    .from('payments')
    .update({
      status: 'cancelled',
      expires_at: new Date(current_end * 1000),
    })
    .eq('razorpay_subscription_id', id);

  await sendEmail({
    to: notes?.email,
    subject: '😢 PharmPaper Subscription Cancelled',
    message: `Your subscription has been cancelled. You'll retain access until ${new Date(current_end * 1000).toDateString()}.`,
  });

  console.log('⏸️ Subscription cancelled:', id);
}

async function handleSubscriptionHalted(subscription: any) {
  const { id, notes } = subscription;

  await supabase
    .from('payments')
    .update({ status: 'halted' })
    .eq('razorpay_subscription_id', id);

  await sendEmail({
    to: notes?.email,
    subject: '⚠️ PharmPaper Payment Issue',
    message: 'We could not charge your subscription. Please update your payment method to continue access.',
  });

  console.log('⚠️ Subscription halted:', id);
}

// ─────────────────────────────────────────
// EMAIL HELPER (using Resend - free tier)
// ─────────────────────────────────────────
async function sendEmail({ to, subject, message }: {
  to: string;
  subject: string;
  message: string;
}) {
  if (!to) return;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PharmPaper <noreply@pharmapaper.com>',
        to,
        subject,
        text: message,
      }),
    });
  } catch (err) {
    console.error('Failed to send email:', err);
  }
}
