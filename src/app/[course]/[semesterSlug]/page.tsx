import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { BookOpen, ChevronRight, GraduationCap, ShieldCheck } from "lucide-react";
import { 
  getSemesterBySlug, 
  getSubjects, 
  getApprovedComments, 
  getRecentPosts 
} from "@/lib/supabase";
import SubjectList from "@/components/SubjectList";
import Sidebar from "@/components/Sidebar";
import CommentSection from "@/components/CommentSection";

interface PageProps {
  params: Promise<{
    course: string;
    semesterSlug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { course, semesterSlug } = await params;
  const semester = await getSemesterBySlug(course, semesterSlug);
  if (!semester) return { title: "Semester Not Found — PharmaPaper" };

  const courseLabel = course.toUpperCase() === "BPHARM" ? "B.Pharm" : "D.Pharm";
  return {
    title: `${courseLabel} ${semester.title || semester.name} Notes – All Subjects | PharmaPaper`,
    description: `Download verified unit-wise lecture notes, summaries, and PCI syllabus study material for ${courseLabel} ${semester.title || semester.name}.`,
  };
}

export default async function SemesterPage({ params }: PageProps) {
  const { course, semesterSlug } = await params;
  const normalizedCourse = course.toLowerCase();

  const semester = await getSemesterBySlug(normalizedCourse, semesterSlug);
  if (!semester) {
    notFound();
  }

  const [subjects, comments, recentPosts] = await Promise.all([
    getSubjects(semester.id),
    getApprovedComments("semester", semester.id),
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
          <span className="text-blue-600 font-bold">{semester.title || semester.name}</span>
        </nav>

        {/* Two-Column 70/30 Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Content (~70%) */}
          <main className="lg:col-span-8 space-y-8">
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{courseLabel} Curriculum</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-950 tracking-tight">
                {courseLabel} {semester.title || semester.name} Notes – All Subjects
              </h1>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Welcome to the complete lecture notes repository for {courseLabel} {semester.title || semester.name}. 
                Below is the verified list of all subjects taught in this semester according to the standard PCI (Pharmacy Council of India) curriculum. Click on any subject to open its unit notes.
              </p>

              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200/60 w-fit">
                <ShieldCheck className="w-4 h-4" />
                <span>PCI Syllabus Compliant • 100% Free Access</span>
              </div>
            </div>

            {/* Subject Selection Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                    Select Your Subject to Download Notes
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Click any subject pill below to view its unit modules
                  </p>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">
                  {subjects.length} Subjects
                </span>
              </div>

              {/* Vertical list of subjects - NO UNITS RENDERED HERE per Rule 5 */}
              <SubjectList
                subjects={subjects}
                course={normalizedCourse}
                semesterSlug={semesterSlug}
              />
            </div>

            {/* SEO Long-form Article */}
            <article className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 prose max-w-none text-slate-700">
              <h2 className="text-2xl font-display font-bold text-slate-900 border-b border-slate-100 pb-3">
                Overview & Preparation Strategy for {semester.title || semester.name}
              </h2>
              {semester.content_html ? (
                <div 
                  className="space-y-4 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: semester.content_html }} 
                />
              ) : (
                <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                  <p>
                    {courseLabel} {semester.title || semester.name} is a vital milestone in pharmacy education. Mastering the theoretical foundations and practical laboratory techniques during this semester directly influences student performance in competitive exams such as GPAT, NIPER-JEE, and state Drug Inspector tests.
                  </p>
                  <p>
                    Our notes are curated to provide structured summaries, classification tables, chemical mechanisms, and high-yield examination questions. Make sure to download each unit sequentially and test your recall using university previous year question papers.
                  </p>
                </div>
              )}
            </article>

            {/* CommentSection at the bottom */}
            <CommentSection
              parentType="semester"
              parentId={semester.id}
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
