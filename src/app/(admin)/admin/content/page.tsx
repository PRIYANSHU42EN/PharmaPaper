"use client";

import { useState, useEffect } from "react";
import { Folder, BookOpen, Layers, Download, Plus, Search, Filter, FileText, Check, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState<"semesters" | "subjects" | "units" | "downloads">("semesters");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");

  const TABS = [
    { id: "semesters", name: "Semesters", icon: Folder },
    { id: "subjects", name: "Subjects", icon: BookOpen },
    { id: "units", name: "Units", icon: Layers },
    { id: "downloads", name: "Downloads", icon: Download },
  ];

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === "semesters") {
        const { data: sems } = await supabase
          .from("semesters")
          .select("id, number, name, slug, courses(code, name)")
          .order("number", { ascending: true });
        setData(sems || []);
      } else if (activeTab === "subjects") {
        const { data: subs } = await supabase
          .from("subjects")
          .select("id, name, slug, order_index, semester_number, semesters(name, slug, courses(code))")
          .order("order_index", { ascending: true })
          .limit(100);
        setData(subs || []);
      } else if (activeTab === "units") {
        const { data: u } = await supabase
          .from("units")
          .select("id, unit_number, title, slug, subjects(name, semesters(name))")
          .order("unit_number", { ascending: true })
          .limit(100);
        setData(u || []);
      } else if (activeTab === "downloads") {
        const { data: downs } = await supabase
          .from("downloads")
          .select("id, file_name, file_url, file_size_kb, units(title, subjects(name))")
          .limit(100);
        setData(downs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const filteredData = data.filter((item) => {
    const matchSearch = search.trim() === "" || JSON.stringify(item).toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">Curriculum Content Management</h1>
          <p className="text-slate-400 font-mono text-sm mt-1">Manage Semesters, Subjects, Units, and Notes Downloads</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadData}
            className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-mono text-sm shadow-md">
            <Plus className="w-4 h-4" /> Add {activeTab.slice(0, -1)}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto custom-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-mono text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "border-amber-400 text-amber-400 font-bold"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.name}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/60 rounded-xl border border-white/10 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono transition-colors"
          />
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing {filteredData.length} records in database
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-slate-900/60 rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
            <span>Loading {activeTab}...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <FileText className="w-12 h-12 text-white/10 mb-4" />
            <h3 className="text-xl font-display text-white mb-2 capitalize">No {activeTab} Found</h3>
            <p className="text-slate-400 font-mono max-w-md mx-auto text-sm">
              No matching records found in the database.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 font-mono">
              <thead className="bg-black/30 border-b border-white/10 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Name / Title</th>
                  <th className="px-6 py-3">Slug</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-6 py-3 text-white font-semibold">
                      {item.title || item.name || item.file_name}
                    </td>
                    <td className="px-6 py-3 text-amber-300/80 text-xs">
                      {item.slug || "—"}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-400">
                      {item.courses?.code?.toUpperCase() ||
                        item.subjects?.name ||
                        item.units?.title ||
                        (item.file_size_kb ? `${(item.file_size_kb / 1024).toFixed(1)} MB` : "—")}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
