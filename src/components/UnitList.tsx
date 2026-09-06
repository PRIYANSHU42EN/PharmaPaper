import Link from "next/link";
import { Layers, ArrowRight } from "lucide-react";
import type { Unit } from "@/lib/supabase";

interface UnitListProps {
  units: Unit[];
  course: string;
  semesterSlug: string;
  subjectSlug: string;
}

export default function UnitList({
  units,
  course,
  semesterSlug,
  subjectSlug,
}: UnitListProps) {
  if (units.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-sm">
        No unit notes available for this subject yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {units.map((unit) => {
        const targetUrl = `/${course}/${semesterSlug}/${subjectSlug}/${unit.slug}`;

        return (
          <Link
            key={unit.id}
            href={targetUrl}
            className="group flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.01] transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-extrabold text-sm shrink-0">
                U{unit.unit_number}
              </span>
              <div>
                <h3 className="font-bold text-base sm:text-lg leading-snug">
                  {unit.title}
                </h3>
                <p className="text-xs text-blue-100/90 line-clamp-1 mt-0.5 font-normal">
                  Complete chapter notes, theory, mechanisms & formulas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold bg-white/15 px-3.5 py-2 rounded-xl shrink-0 group-hover:bg-white/25 transition-colors">
              <span>Open Unit {unit.unit_number}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
