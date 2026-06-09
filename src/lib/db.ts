import { supabase } from "./supabase";

export interface SyllabusItem {
  id: string;
  title: string;
  code: string;
  subjects: string[];
}

export interface SyllabusData {
  bpharm: SyllabusItem[];
  dpharm: SyllabusItem[];
}

export async function fetchSyllabusData(): Promise<SyllabusData> {
  // Fetch courses
  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select("*")
    .in("code", ["bpharm", "dpharm"]);

  if (coursesError) {
    console.error("Error fetching courses:", coursesError.message, coursesError.details, coursesError.hint, coursesError.code);
    return getFallbackSyllabusData();
  }

  // Fetch semesters
  const { data: semesters, error: semestersError } = await supabase
    .from("semesters")
    .select("*")
    .order("number", { ascending: true });

  if (semestersError) {
    console.error("Error fetching semesters:", semestersError.message, semestersError.details, semestersError.hint, semestersError.code);
    return getFallbackSyllabusData();
  }

  // Fetch subjects
  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("*")
    .order("name", { ascending: true });

  if (subjectsError) {
    console.error("Error fetching subjects:", subjectsError.message, subjectsError.details, subjectsError.hint, subjectsError.code);
    return getFallbackSyllabusData();
  }

  const bpharmCourse = courses?.find(c => c.code === "bpharm");
  const dpharmCourse = courses?.find(c => c.code === "dpharm");

  const bpharmSemesters = semesters?.filter(s => s.course_id === bpharmCourse?.id) || [];
  const dpharmSemesters = semesters?.filter(s => s.course_id === dpharmCourse?.id) || [];

  const getSubjectsForSemester = (courseId: string, semNumber: number) => {
    return (
      subjects
        ?.filter(sub => sub.course_id === courseId && sub.semester_number === semNumber)
        .map(sub => sub.name) || []
    );
  };

  const bpharmList: SyllabusItem[] = bpharmSemesters.map(sem => ({
    id: `sem${sem.number}`,
    title: sem.name,
    code: `BP${sem.number}01T`,
    subjects: getSubjectsForSemester(bpharmCourse?.id || "", sem.number)
  }));

  const dpharmList: SyllabusItem[] = dpharmSemesters.map(sem => ({
    id: `year${sem.number}`,
    title: sem.name,
    code: `DP${sem.number}01T`,
    subjects: getSubjectsForSemester(dpharmCourse?.id || "", sem.number)
  }));

  return {
    bpharm: bpharmList,
    dpharm: dpharmList
  };
}

function getFallbackSyllabusData(): SyllabusData {
  return {
    bpharm: [
      { id: "sem1", title: "Semester I", code: "BP101T", subjects: ["Basics of Python Programming for Pharmaceutical Sciences", "General Pharmacy", "Healthcare Psychology and Communication Skills", "Human Anatomy, Physiology and Pathophysiology I", "Introduction to Pharmacognosy", "Pharmaceutical Inorganic and Analytical Chemistry"] },
      { id: "sem2", title: "Semester II", code: "BP201T", subjects: ["Applied Biostatistics and Data Analytics", "Biochemistry", "Human Anatomy, Physiology and Pathophysiology II", "Pharmaceutical Organic Chemistry", "Pharmacognosy and Phytochemistry", "Physical Pharmaceutics"] },
      { id: "sem3", title: "Semester III", code: "BP301T", subjects: ["Introduction to Machine Learning in Pharmaceutical Sciences", "Environmental Sciences", "Ethics and Universal Human Values", "General Pharmacology", "Heterocyclic Compounds and Stereochemistry", "Pharmaceutical Dosage Forms I", "Pharmaceutical Engineering", "Pharmaceutical Microbiology"] },
      { id: "sem4", title: "Semester IV", code: "BP401T", subjects: ["Herbal Drug Technology", "Medicinal Chemistry", "Pharmaceutical Biotechnology", "Social Pharmacy and Public Health", "Systemic Pharmacology I"] },
      { id: "sem5", title: "Semester V", code: "BP501T", subjects: ["Biomedicinal Chemistry", "Industrial Pharmacognosy", "Innovation and Startup Ecosystem", "Pharmaceutical Dosage Form II", "Pharmaceutical Quality Assurance", "Systemic Pharmacology II"] },
      { id: "sem6", title: "Semester VI", code: "BP601T", subjects: ["Advanced Pharmacognosy", "Biopharmaceutics and Pharmacokinetics", "Intellectual Property Rights", "AI Applications in Pharmaceutical Sciences", "Pharmaceutical Analysis", "Pharmaceutical Jurisprudence"] },
      { id: "sem7", title: "Semester VII", code: "BP701T", subjects: ["Biostatistics and Research Methodology", "Cosmetics and Cosmeceuticals", "AI in Clinical Applications", "Modern Analytical Techniques", "Pharmacovigilance", "Pharmacy Practice", "Regulatory Affairs"] },
      { id: "sem8", title: "Semester VIII", code: "BP801T", subjects: ["Ethical Considerations and Translational Applications of AI in Pharmacy", "Clinical Pharmacotherapeutics", "Industrial Pharmacy and Facility Design", "Pharmaceutical Management", "Sterile Dosage Forms and Novel Drug Delivery Systems"] },
    ],
    dpharm: [
      { id: "year1", title: "Year I", code: "DP101T", subjects: ["Pharmaceutics", "Pharmaceutical Chemistry", "Pharmacognosy", "Human Anatomy and Physiology", "Social Pharmacy"] },
      { id: "year2", title: "Year II", code: "DP201T", subjects: ["Pharmacology", "Community Pharmacy & Management", "Biochemistry & Clinical Pathology", "Pharmacotherapeutics", "Hospital & Clinical Pharmacy", "Pharmacy Law & Ethics"] },
    ],
  };
}
