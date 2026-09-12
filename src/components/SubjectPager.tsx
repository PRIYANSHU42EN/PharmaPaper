import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Subject } from "@/lib/supabase";

interface SubjectPagerProps {
  course: string;
  semesterSlug: string;
  previousSubject?: Subject | null;
  nextSubject?: Subject | null;
}

export default function SubjectPager({
  course,
  semesterSlug,
  previousSubject,
  nextSubject,
}: SubjectPagerProps) {
  if (!previousSubject && !nextSubject) {
    return null;
  }

  return (
    <nav 
      aria-label="Sibling subjects navigation"
      className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-200"
    >
      {previousSubject ? (
        <Link
          href={`/${course}/${semesterSlug}/${previousSubject.slug}`}
          className="group p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Previous Subject</span>
            <span className="block text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
              {previousSubject.name}
            </span>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {nextSubject ? (
        <Link
          href={`/${course}/${semesterSlug}/${nextSubject.slug}`}
          className="group p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all flex items-center justify-end text-right gap-3"
        >
          <div className="min-w-0">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Next Subject</span>
            <span className="block text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
              {nextSubject.name}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors">
            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
