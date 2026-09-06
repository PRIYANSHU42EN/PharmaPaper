import { getSemesters } from "@/lib/supabase";
import Hero from "@/components/Hero";
import SemesterGrid from "@/components/SemesterGrid";

export const revalidate = 3600;

export default async function Home() {
  const [bpharmSemesters, dpharmSemesters] = await Promise.all([
    getSemesters("bpharm"),
    getSemesters("dpharm"),
  ]);

  return (
    <div className="flex flex-col">
      <Hero />
      <SemesterGrid
        bpharmSemesters={bpharmSemesters}
        dpharmSemesters={dpharmSemesters}
      />
    </div>
  );
}
