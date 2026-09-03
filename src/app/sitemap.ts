import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export const revalidate = 86400; // 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pharmdbm.com";

  // Static URLs
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  try {
    // 1. Fetch semesters
    const { data: semesters } = await supabase
      .from("semesters")
      .select("id, slug, courses(code)");

    const semesterRoutes: MetadataRoute.Sitemap = (semesters || []).map((sem: any) => ({
      url: `${baseUrl}/${sem.courses?.code || "bpharm"}/${sem.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

    // 2. Fetch subjects with semester and course info
    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, slug, semesters(slug, courses(code))");

    const subjectRoutes: MetadataRoute.Sitemap = (subjects || []).map((sub: any) => {
      const course = sub.semesters?.courses?.code || "bpharm";
      const semSlug = sub.semesters?.slug || "1st-semester";
      return {
        url: `${baseUrl}/${course}/${semSlug}/${sub.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    });

    // 3. Fetch units with subject, semester, and course info
    const { data: units } = await supabase
      .from("units")
      .select("id, slug, subjects(slug, semesters(slug, courses(code)))");

    const unitRoutes: MetadataRoute.Sitemap = (units || []).map((u: any) => {
      const course = u.subjects?.semesters?.courses?.code || "bpharm";
      const semSlug = u.subjects?.semesters?.slug || "1st-semester";
      const subSlug = u.subjects?.slug || "subject";
      return {
        url: `${baseUrl}/${course}/${semSlug}/${subSlug}/${u.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    });

    // 4. Fetch posts
    const { data: posts } = await supabase
      .from("posts")
      .select("slug, published_at");

    const postRoutes: MetadataRoute.Sitemap = (posts || []).map((p: any) => ({
      url: `${baseUrl}/posts/${p.slug}`,
      lastModified: p.published_at ? new Date(p.published_at) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...semesterRoutes, ...subjectRoutes, ...unitRoutes, ...postRoutes];
  } catch (err) {
    console.error("Error generating dynamic sitemap:", err);
    return staticRoutes;
  }
}
