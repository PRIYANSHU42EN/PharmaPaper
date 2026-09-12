"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import FloatingSocialIcons from "./FloatingSocialIcons";
import Footer from "./Footer";

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <FloatingSocialIcons />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
