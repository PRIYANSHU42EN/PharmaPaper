import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/ratelimit';
import { searchSchema } from '@/lib/validators';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
    const { blocked, headers } = await checkRateLimit('search', ip);
    if (blocked) {
      return NextResponse.json(
        { error: 'Too many search requests. Please wait 1 minute.' },
        { status: 429, headers }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ results: [] });
    }

    const parsed = searchSchema.safeParse({ query: q });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const cleanWords = parsed.data.query
      .trim()
      .split(/\s+/)
      .map(word => word.replace(/[^a-zA-Z0-9]/g, ''))
      .filter(word => word.length > 0);

    if (cleanWords.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const formattedQuery = cleanWords
      .map(word => `${word}:*`)
      .join(' & ');

    const { data, error } = await supabase
      .from('study_materials')
      .select('id, title, subject, course, semester, type')
      .textSearch('search_vector', formattedQuery);

    if (error) {
      console.error('Database search error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ results: data || [] });
  } catch (err: any) {
    console.error('Search route handler exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
