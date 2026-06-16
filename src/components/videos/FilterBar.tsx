"use client";

import { useState } from "react";
import { Filter, SlidersHorizontal, ChevronDown } from "lucide-react";

interface FilterBarProps {
  filters: {
    course: string;
    semester: string;
    sort: string;
  };
  setFilters: (filters: any) => void;
}

export function FilterBar({ filters, setFilters }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="mb-8 relative z-30">
      {/* Mobile Toggle */}
      <button 
        className="md:hidden w-full flex items-center justify-between p-4 liquid-glass rounded-xl mb-4 text-white font-medium"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters & Sort
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Filter Controls */}
      <div className={`${isOpen ? "flex" : "hidden"} md:flex flex-col md:flex-row gap-4 p-4 md:p-2 liquid-glass md:rounded-full rounded-xl items-center`}>
        <div className="flex items-center gap-2 text-muted px-4 hidden md:flex font-mono text-sm">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </div>

        {/* Course Filter */}
        <select 
          value={filters.course}
          onChange={(e) => handleFilterChange("course", e.target.value)}
          className="w-full md:w-auto bg-surface/50 border border-white/10 rounded-full px-4 py-2 text-sm text-text focus:outline-none focus:border-brand-light appearance-none font-mono cursor-pointer hover:bg-surface transition-colors"
        >
          <option value="">All Courses</option>
          <option value="B.Pharm">B.Pharm</option>
          <option value="D.Pharm">D.Pharm</option>
        </select>

        {/* Semester Filter */}
        <select 
          value={filters.semester}
          onChange={(e) => handleFilterChange("semester", e.target.value)}
          className="w-full md:w-auto bg-surface/50 border border-white/10 rounded-full px-4 py-2 text-sm text-text focus:outline-none focus:border-brand-light appearance-none font-mono cursor-pointer hover:bg-surface transition-colors"
        >
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
            <option key={sem} value={sem}>Semester {sem}</option>
          ))}
        </select>

        <div className="flex-1" />

        {/* Sort Filter */}
        <div className="w-full md:w-auto flex items-center gap-3">
          <span className="text-muted text-sm font-mono hidden lg:block">Sort by:</span>
          <select 
            value={filters.sort}
            onChange={(e) => handleFilterChange("sort", e.target.value)}
            className="w-full md:w-auto bg-brand/10 border border-brand/30 text-brand-light rounded-full px-4 py-2 text-sm focus:outline-none focus:border-brand appearance-none font-mono font-bold cursor-pointer hover:bg-brand/20 transition-colors"
          >
            <option value="latest">Latest Releases</option>
            <option value="viewed">Most Viewed</option>
            <option value="liked">Most Liked</option>
          </select>
        </div>
      </div>
    </div>
  );
}
