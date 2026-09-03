import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import type { Subject } from "@/lib/supabase";

interface SubjectListProps {
  subjects: Subject[];
  course: string;
  semesterSlug: string;
}

export default function SubjectList({ subjects, course, semesterSlug }: SubjectListProps) {
  if (subjects.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-sm">
        No subjects found for this semester yet. Check back soon!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {subjects.map((subject, index) => {
        const targetUrl = `/${course}/${semesterSlug}/${subject.slug}`;

        return (
          <Link
            key={subject.id}
            href={targetUrl}
            className="group flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.01] transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs shrink-0">
                {index + 1}
              </span>
              <div>
                <h3 className="font-bold text-base sm:text-lg leading-snug">
                  {subject.name}
                </h3>
                {subject.description && (
                  <p className="text-xs text-blue-100/90 line-clamp-1 mt-0.5 font-normal">
                    {subject.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold bg-white/15 px-3 py-1.5 rounded-xl shrink-0 group-hover:bg-white/25 transition-colors">
              <span className="hidden sm:inline">Open Subject</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
