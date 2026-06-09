import { fetchSyllabusData } from "@/lib/db";
import HomeClient from "./HomeClient";

// Force dynamic rendering to ensure the data is fetched fresh from the database
export const dynamic = "force-dynamic";

export default async function Home() {
  const syllabusData = await fetchSyllabusData();

  return <HomeClient syllabusData={syllabusData} />;
}
