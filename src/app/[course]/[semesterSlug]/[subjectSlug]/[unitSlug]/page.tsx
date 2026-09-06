import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { ChevronRight, Layers, FileText, ShieldCheck, CheckCircle2 } from "lucide-react";
import { 
  getSemesterBySlug, 
  getSubjectBySlug, 
  getUnitBySlug, 
  getDownload,
  getApprovedComments, 
  getRecentPosts 
} from "@/lib/supabase";
import TimedDownloadButton from "@/components/TimedDownloadButton";
import Sidebar from "@/components/Sidebar";
import CommentSection from "@/components/CommentSection";

interface PageProps {
  params: Promise<{
    course: string;
    semesterSlug: string;
    subjectSlug: string;
    unitSlug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { course, semesterSlug, subjectSlug, unitSlug } = await params;
  const semester = await getSemesterBySlug(course, semesterSlug);
  if (!semester) return { title: "Unit Not Found — PharmaPaper" };

  const subject = await getSubjectBySlug(semester.id, subjectSlug);
  if (!subject) return { title: "Unit Not Found — PharmaPaper" };

  const unit = await getUnitBySlug(subject.id, unitSlug);
  if (!unit) return { title: "Unit Not Found — PharmaPaper" };

  const courseLabel = course.toUpperCase() === "BPHARM" ? "B.Pharm" : "D.Pharm";
  return {
    title: `${unit.title} Notes – ${subject.name} | PharmaPaper`,
    description: `Download verified PDF notes and revision guide for ${unit.title} in ${subject.name} (${courseLabel} ${semester.title || semester.name}).`,
  };
}

export default async function UnitPage({ params }: PageProps) {
  const { course, semesterSlug, subjectSlug, unitSlug } = await params;
  const normalizedCourse = course.toLowerCase();

  const semester = await getSemesterBySlug(normalizedCourse, semesterSlug);
  if (!semester) notFound();

  const subject = await getSubjectBySlug(semester.id, subjectSlug);
  if (!subject) notFound();

  const unit = await getUnitBySlug(subject.id, unitSlug);
  if (!unit) notFound();

  const [download, comments, recentPosts] = await Promise.all([
    getDownload(unit.id),
    getApprovedComments("unit", unit.id),
    getRecentPosts(5),
  ]);

  const courseLabel = normalizedCourse === "bpharm" ? "B.Pharm" : "D.Pharm";

  return (
    <div className="py-8 sm:py-12 bg-[#F9FAFB] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6 flex-wrap" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="uppercase text-slate-700">{courseLabel}</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link href={`/${normalizedCourse}/${semesterSlug}`} className="hover:text-blue-600 transition-colors">
            {semester.title || semester.name}
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link href={`/${normalizedCourse}/${semesterSlug}/${subjectSlug}`} className="hover:text-blue-600 transition-colors">
            {subject.name}
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-blue-600 font-bold">{unit.title}</span>
        </nav>

        {/* Two-Column 70/30 Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Content (~70%) */}
          <main className="lg:col-span-8 space-y-8">
            {/* Header Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                <Layers className="w-3.5 h-3.5" />
                <span>{subject.name} • Unit {unit.unit_number}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-950 tracking-tight leading-tight">
                {unit.title}
              </h1>

              {unit.content_html ? (
                <div 
                  className="text-slate-600 text-sm sm:text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: unit.content_html }} 
                />
              ) : (
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Complete chapter notes and syllabus coverage for {unit.title}. Prepared according to standard PCI exam criteria with high-yield formulas, flowcharts, and theoretical definitions.
                </p>
              )}

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <ShieldCheck className="w-4 h-4" />
                  PCI Syllabus Compliant
                </span>
                <span className="flex items-center gap-1.5 text-blue-600">
                  <CheckCircle2 className="w-4 h-4" />
                  High-Quality OCR PDF
                </span>
              </div>
            </div>

            {/* Timed Download Section (THE ONLY PLACE WITH FILE LINK per Non-negotiable Rule 1 & 5) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 text-center">
              <div className="max-w-md mx-auto">
                <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                  Download Verified Lecture Notes
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Click the button below to initiate the secure download timer
                </p>
              </div>

              {download ? (
                <TimedDownloadButton
                  unitId={unit.id}
                  unitTitle={unit.title}
                  fileUrl={download.file_url}
                  fileName={download.file_name}
                  fileSizeKb={download.file_size_kb}
                />
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 text-sm">
                  The PDF notes for this unit are being prepared by faculty. Please check back shortly!
                </div>
              )}
            </div>

            {/* Unit Study Tips */}
            <div className="bg-gradient-to-br from-amber-500/10 via-white to-blue-500/10 rounded-3xl p-6 sm:p-8 border border-amber-200/60 shadow-sm space-y-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>💡 Study Tip for Exam Preparation</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                When preparing for semester end examinations in {subject.name}, review the classification schemes and schematic diagrams first. Practice drawing chemical structures and instrumentation flowcharts by hand to maximize written exam marks.
              </p>
            </div>

            {/* CommentSection at the bottom */}
            <CommentSection
              parentType="unit"
              parentId={unit.id}
              initialComments={comments}
            />
          </main>

          {/* Right Column Sidebar (~30%) */}
          <div className="lg:col-span-4">
            <div className="sticky top-28">
              <Sidebar recentPosts={recentPosts} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
