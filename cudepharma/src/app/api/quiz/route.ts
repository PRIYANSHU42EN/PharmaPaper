import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { getUserAccess } from '@/lib/access';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await getUserAccess(userId);
    if (!access.canTakeExams) {
      return NextResponse.json({ error: "Premium subscription required to access quizzes" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');

    if (!subject) {
      return NextResponse.json({ error: 'Subject parameter required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('quizzes')
      .select('id, question, options, answer, explanation')
      .eq('subject', subject);

    if (error) {
      console.error('Fetch quizzes error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ quizzes: data || [] });
  } catch (err: any) {
    console.error('Quiz GET API exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await getUserAccess(userId);
    if (!access.canTakeExams) {
      return NextResponse.json({ error: "Premium subscription required" }, { status: 403 });
    }

    const body = await req.json();
    const { subject, score, total } = body;

    if (!subject || score === undefined || !total) {
      return NextResponse.json({ error: 'Invalid results payload' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('quiz_results')
      .insert({
        user_id: userId,
        subject,
        score,
        total,
      })
      .select()
      .single();

    if (error) {
      console.error('Insert quiz results error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: data });
  } catch (err: any) {
    console.error('Quiz POST API exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
