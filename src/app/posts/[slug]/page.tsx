import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { ChevronRight, Calendar, ArrowLeft } from "lucide-react";
import { getPostBySlug } from "@/lib/supabase";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post Not Found — Pharmdbm" };

  return {
    title: `${post.title} | Pharmdbm`,
    description: post.excerpt || "Read this comprehensive guide on Pharmdbm.",
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  return (
    <div className="py-12 sm:py-16 bg-[#F9FAFB] min-h-screen">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Link
          href="/posts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all posts</span>
        </Link>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Calendar className="w-4 h-4" />
            <span>Published on {new Date(post.published_at).toLocaleDateString()}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-base text-slate-600 font-medium italic border-l-4 border-blue-500 pl-4">
              {post.excerpt}
            </p>
          )}

          <div
            className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base pt-4 border-t border-slate-100"
            dangerouslySetInnerHTML={{ __html: post.content_html || "<p>Article content coming soon.</p>" }}
          />
        </div>
      </article>
    </div>
  );
}
