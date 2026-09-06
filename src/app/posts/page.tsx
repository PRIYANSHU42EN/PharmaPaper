import Link from "next/link";
import { Metadata } from "next";
import { FileText, ArrowRight, Calendar, Sparkles } from "lucide-react";
import { getRecentPosts } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "All Posts & Career Guides | PharmaPaper",
  description: "Read the latest pharmacy career guides, GPAT exam strategies, and pharmaceutical industry insights.",
};

export const revalidate = 3600;

export default async function PostsPage() {
  const posts = await getRecentPosts(20);

  return (
    <div className="py-12 sm:py-16 bg-[#F9FAFB] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Articles & Insights</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900">
            Pharmacy Career Guides & Exam Updates
          </h1>
          <p className="text-slate-600 text-sm max-w-xl mx-auto">
            Practical insights on higher studies, GPAT preparation, government exams, and industry trends for pharmacy students.
          </p>
        </div>

        {/* Posts List or Clean Empty State */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-display">No Career Guides Published Yet</h3>
            <p className="text-sm text-slate-500 mt-2">
              Our academic team is currently drafting new exam guides and recruitment notices. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.slug}`}
                className="group block p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all space-y-2"
              >
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] tracking-wide uppercase ${
                    post.category === "Exam Guide" 
                      ? "bg-purple-100 text-purple-700" 
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {post.category || "Career"}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(post.published_at).toLocaleDateString()}</span>
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
                <div className="pt-2 text-xs font-bold text-blue-600 flex items-center gap-1">
                  <span>Read Full Guide</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
