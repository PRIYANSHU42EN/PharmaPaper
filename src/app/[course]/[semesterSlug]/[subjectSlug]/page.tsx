import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { ChevronRight, BookOpen, Layers, ShieldCheck, Clock } from "lucide-react";
import { 
  supabase,
  getSemesterBySlug, 
  getSubjectBySlug, 
  getSubjects, 
  getUnits, 
  getApprovedComments, 
  getRecentPosts 
} from "@/lib/supabase";
import UnitList from "@/components/UnitList";
import SubjectPager from "@/components/SubjectPager";
import Sidebar from "@/components/Sidebar";
import CommentSection from "@/components/CommentSection";

interface PageProps {
  params: Promise<{
    course: string;
    semesterSlug: string;
    subjectSlug: string;
  }>;
}

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, slug, semesters(slug, courses(code))")
      .limit(200);

    return (subjects || []).map((sub: any) => ({
      course: (sub.semesters?.courses?.code || "bpharm").toLowerCase(),
      semesterSlug: sub.semesters?.slug || "1st-semester",
      subjectSlug: sub.slug,
    }));
  } catch (err) {
    console.error("Error generating static params for subjects:", err);
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { course, semesterSlug, subjectSlug } = await params;
  const semester = await getSemesterBySlug(course, semesterSlug);
  if (!semester) return { title: "Subject Not Found — PharmaPaper" };

  const subject = await getSubjectBySlug(semester.id, subjectSlug);
  if (!subject) return { title: "Subject Not Found — PharmaPaper" };

  const courseLabel = course.toUpperCase() === "BPHARM" ? "B.Pharm" : "D.Pharm";
  return {
    title: `${subject.name} – Notes (${courseLabel} ${semester.title || semester.name}) | PharmaPaper`,
    description: `Complete unit-wise lecture notes, summaries, and PCI study guide for ${subject.name} in ${courseLabel} ${semester.title || semester.name}.`,
  };
}

export default async function SubjectPage({ params }: PageProps) {
  const { course, semesterSlug, subjectSlug } = await params;
  const normalizedCourse = course.toLowerCase();

  const semester = await getSemesterBySlug(normalizedCourse, semesterSlug);
  if (!semester) notFound();

  const subject = await getSubjectBySlug(semester.id, subjectSlug);
  if (!subject) notFound();

  const [allSubjects, units, comments, recentPosts] = await Promise.all([
    getSubjects(semester.id),
    getUnits(subject.id),
    getApprovedComments("subject", subject.id),
    getRecentPosts(5),
  ]);

  // Compute siblings for SubjectPager
  const currentIndex = allSubjects.findIndex(s => s.id === subject.id);
  const previousSubject = currentIndex > 0 ? allSubjects[currentIndex - 1] : null;
  const nextSubject = currentIndex >= 0 && currentIndex < allSubjects.length - 1 ? allSubjects[currentIndex + 1] : null;

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
          <span className="text-blue-600 font-bold truncate max-w-xs sm:max-w-md">{subject.name}</span>
        </nav>

        {/* Two-Column 70/30 Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Content (~70%) */}
          <main className="lg:col-span-8 space-y-8">
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{courseLabel} • {semester.title || semester.name}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-950 tracking-tight leading-tight">
                {subject.name} – Notes
              </h1>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Access structured unit modules, chapter classifications, and study materials for {subject.name}. Click on any unit pill below to open the unit study page and access the notes download.
              </p>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  {units.length} Curriculum Units
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  PCI Verified
                </span>
              </div>
            </div>

            {/* Unit Selection Section - NO TIMED DOWNLOAD BUTTON HERE per Rule 5 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                    Select Your Unit to Download the Notes
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Each unit below opens into a full chapter overview with download timer
                  </p>
                </div>
              </div>

              {/* Vertical list of unit buttons - NO DOWNLOADS RENDERED HERE per Rule 5 */}
              <UnitList
                units={units}
                course={normalizedCourse}
                semesterSlug={semesterSlug}
                subjectSlug={subjectSlug}
              />
            </div>

            {/* Long-form SEO Article */}
            <article className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 prose max-w-none text-slate-700">
              <h2 className="text-2xl font-display font-bold text-slate-900 border-b border-slate-100 pb-3">
                Key Topics & Study Recommendations for {subject.name}
              </h2>
              {subject.content_html ? (
                <div 
                  className="space-y-4 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: subject.content_html }} 
                />
              ) : (
                <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                  <p>
                    {subject.name} forms a cornerstone discipline in the pharmacy curriculum. Students are encouraged to focus on clear definitions, reaction pathways, analytical instrumentation, and pharmacotherapeutic applications.
                  </p>
                  <p>
                    Each unit has been calibrated to follow standard university examination patterns. We strongly recommend making handwritten summary sheets for reaction mechanisms and dosage calculations as you work through each unit PDF.
                  </p>
                </div>
              )}
            </article>

            {/* SubjectPager: Sibling Subjects Navigation */}
            <SubjectPager
              course={normalizedCourse}
              semesterSlug={semesterSlug}
              previousSubject={previousSubject}
              nextSubject={nextSubject}
            />

            {/* CommentSection at the bottom */}
            <CommentSection
              parentType="subject"
              parentId={subject.id}
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
