import { revalidatePath } from "next/cache";

/**
 * Revalidates all pages associated with a specific unit:
 * - The unit page itself (with download button and comments)
 * - The parent subject page
 * - The parent semester page
 * - The home page
 * - The sitemap
 */
export async function revalidateUnitHierarchy(supabase: any, unitId: string) {
  try {
    const { data: unit, error } = await supabase
      .from("units")
      .select("id, slug, subjects(slug, semesters(slug, courses(code)))")
      .eq("id", unitId)
      .maybeSingle();

    if (error || !unit) {
      console.warn("[revalidate] Could not find unit for ID:", unitId, error?.message);
      return;
    }

    const rawCourse = (unit.subjects as any)?.semesters?.courses?.code?.toLowerCase() || "bpharm";
    const course = rawCourse.replace(/[^a-z0-9]/g, "");
    const semSlug = (unit.subjects as any)?.semesters?.slug || "1st-semester";
    const subSlug = (unit.subjects as any)?.slug || "subject";
    const unitSlug = unit.slug;

    const unitPath = `/${course}/${semSlug}/${subSlug}/${unitSlug}`;
    const subjectPath = `/${course}/${semSlug}/${subSlug}`;
    const semPath = `/${course}/${semSlug}`;

    revalidatePath(unitPath);
    revalidatePath(subjectPath);
    revalidatePath(semPath);
    revalidatePath("/");
    revalidatePath("/sitemap.xml");

    console.log(`[revalidate] Successfully revalidated unit hierarchy: ${unitPath}`);
  } catch (err) {
    console.warn("[revalidate] Error during unit revalidation:", err);
  }
}

/**
 * Revalidates all pages associated with a specific subject:
 * - The subject page
 * - The parent semester page
 * - The home page
 * - The sitemap
 */
export async function revalidateSubjectHierarchy(supabase: any, subjectId: string) {
  try {
    const { data: subject, error } = await supabase
      .from("subjects")
      .select("id, slug, semesters(slug, courses(code))")
      .eq("id", subjectId)
      .maybeSingle();

    if (error || !subject) {
      console.warn("[revalidate] Could not find subject for ID:", subjectId, error?.message);
      return;
    }

    const rawCourse = (subject.semesters as any)?.courses?.code?.toLowerCase() || "bpharm";
    const course = rawCourse.replace(/[^a-z0-9]/g, "");
    const semSlug = (subject.semesters as any)?.slug || "1st-semester";
    const subSlug = subject.slug;

    const subjectPath = `/${course}/${semSlug}/${subSlug}`;
    const semPath = `/${course}/${semSlug}`;

    revalidatePath(subjectPath);
    revalidatePath(semPath);
    revalidatePath("/");
    revalidatePath("/sitemap.xml");

    console.log(`[revalidate] Successfully revalidated subject hierarchy: ${subjectPath}`);
  } catch (err) {
    console.warn("[revalidate] Error during subject revalidation:", err);
  }
}

/**
 * Revalidates all pages associated with posts.
 */
export function revalidatePost(slug?: string) {
  try {
    if (slug) {
      revalidatePath(`/posts/${slug}`);
    }
    revalidatePath("/posts");
    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    console.log(`[revalidate] Successfully revalidated posts${slug ? ` (slug: ${slug})` : ""}`);
  } catch (err) {
    console.warn("[revalidate] Error during post revalidation:", err);
  }
}
