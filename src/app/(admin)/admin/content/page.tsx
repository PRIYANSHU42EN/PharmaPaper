"use client";

import { useState } from "react";
import { Folder, BookOpen, Layers, Download, Plus, Search, Filter, FileText } from "lucide-react";

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState("semesters");

  const TABS = [
    { id: "semesters", name: "Semesters", icon: Folder },
    { id: "subjects", name: "Subjects", icon: BookOpen },
    { id: "units", name: "Units", icon: Layers },
    { id: "downloads", name: "Downloads", icon: Download },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">Curriculum Content Management</h1>
          <p className="text-muted font-mono text-sm mt-1">Manage Semesters, Subjects, Units, and Notes Downloads</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-light transition-colors font-mono text-sm">
          <Plus className="w-4 h-4" /> Add {activeTab.slice(0, -1)}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto custom-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-mono text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? "border-brand-light text-brand-light font-bold" 
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.name}
          </button>
        ))}
      </div>

      <div className="liquid-glass rounded-xl border border-white/5 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`} 
            className="w-full bg-surface/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-text focus:outline-none focus:border-brand-light font-mono transition-colors"
          />
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-white/10 rounded-lg text-white hover:bg-surface-2 transition-colors font-mono text-sm w-full md:w-auto">
          <Filter className="w-4 h-4" /> Filter by Course
        </button>
      </div>

      {/* Table Shell for Active Tab */}
      <div className="liquid-glass rounded-xl border border-white/5 overflow-hidden">
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <FileText className="w-12 h-12 text-white/10 mb-4" />
          <h3 className="text-xl font-display text-white mb-2 capitalize">{activeTab} Repository</h3>
          <p className="text-muted font-mono max-w-md mx-auto text-sm">
            Curriculum content for {activeTab} can be edited, reordered (order_index), or updated with SEO article HTML.
          </p>
        </div>
      </div>
    </div>
  );
}
