import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/ratelimit';
import { searchSchema } from '@/lib/validators';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

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

    const queryTerm = `%${cleanWords.join('%')}%`;

    // Query subjects
    const { data: subjectsData, error: subError } = await supabase
      .from('subjects')
      .select('id, name, slug, description, semester_id')
      .ilike('name', queryTerm)
      .limit(10);

    // Query units
    const { data: unitsData, error: unitError } = await supabase
      .from('units')
      .select('id, title, slug, unit_number, subject_id')
      .ilike('title', queryTerm)
      .limit(10);

    const formattedResults = [
      ...(subjectsData || []).map(s => ({
        id: s.id,
        title: s.name,
        slug: s.slug,
        type: 'subject',
        description: s.description,
      })),
      ...(unitsData || []).map(u => ({
        id: u.id,
        title: u.title,
        slug: u.slug,
        type: 'unit',
      }))
    ];

    return NextResponse.json({ results: formattedResults });
  } catch (err: any) {
    console.error('Search route handler exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
