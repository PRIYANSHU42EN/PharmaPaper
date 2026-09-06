import Link from "next/link";
import { GraduationCap, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright & Brand */}
          <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FBC02D] text-slate-950 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-display font-extrabold text-xl text-white tracking-tight">
                Pharma<span className="text-blue-400">Paper</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              Your Gateway to Excellence in Pharmacy Education. Free, high-quality, syllabus-oriented lecture notes for B.Pharm & D.Pharm students.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              &copy; {new Date().getFullYear()} PharmaPaper. All rights reserved.
            </p>
          </div>

          {/* Link List */}
          <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-xs font-semibold">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              About Us
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact Us
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/disclaimer" className="hover:text-white transition-colors">
              Disclaimer
            </Link>
            <Link href="/posts" className="hover:text-white transition-colors">
              All Posts
            </Link>
            <Link href="/admin" className="text-slate-600 hover:text-slate-400 transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
