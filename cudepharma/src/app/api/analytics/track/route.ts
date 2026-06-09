import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/ratelimit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
    
    // Safety rate limit for telemetry endpoints to avoid flooding
    const { blocked, headers } = await checkRateLimit('search', ip);
    if (blocked) {
      return NextResponse.json(
        { error: 'Too many analytics updates' },
        { status: 429, headers }
      );
    }

    const body = await req.json();
    const { event, user_id, material_id, metadata } = body;

    if (!event) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('analytics')
      .insert({
        event,
        user_id: user_id || null,
        material_id: material_id || null,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Analytics tracking log failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, tracking_id: data.id });
  } catch (err: any) {
    console.error('Analytics tracking endpoint exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
