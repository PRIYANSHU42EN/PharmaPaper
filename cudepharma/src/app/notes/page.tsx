import { Suspense } from "react";
import { fetchSyllabusData } from "@/lib/db";
import NotesClient from "./NotesClient";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const syllabusData = await fetchSyllabusData();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-charcoal text-brand-cream flex items-center justify-center font-mono text-xs uppercase tracking-widest">
        Loading Study Vault...
      </div>
    }>
      <NotesClient syllabusData={syllabusData} />
    </Suspense>
  );
}
