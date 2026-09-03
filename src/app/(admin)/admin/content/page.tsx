"use client";

import { useState, useEffect } from "react";
import { 
  Folder, 
  BookOpen, 
  Layers, 
  Download, 
  Plus, 
  Search, 
  UploadCloud, 
  FileText, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  X,
  FileCheck
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SemesterOption {
  id: string;
  name: string;
  slug: string;
  number: number;
}

interface SubjectOption {
  id: string;
  name: string;
  slug: string;
  semester_id: string;
}

interface UnitOption {
  id: string;
  title: string;
  unit_number: number;
  slug: string;
  subject_id: string;
}

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState<"semesters" | "subjects" | "units" | "downloads">("units");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allSemesters, setAllSemesters] = useState<SemesterOption[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([]);
  const [allUnits, setAllUnits] = useState<UnitOption[]>([]);

  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [directPdfUrl, setDirectPdfUrl] = useState<string>("");
  const [customFileName, setCustomFileName] = useState<string>("");

  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const TABS = [
    { id: "units", name: "Units & PDFs", icon: Layers },
    { id: "downloads", name: "All PDF Downloads", icon: Download },
    { id: "subjects", name: "Subjects", icon: BookOpen },
    { id: "semesters", name: "Semesters", icon: Folder },
  ];

  // Initial load of reference metadata for the upload picker
  useEffect(() => {
    async function fetchReferences() {
      try {
        const { data: sems } = await supabase.from("semesters").select("id, name, slug, number").order("number");
        const { data: subs } = await supabase.from("subjects").select("id, name, slug, semester_id").order("name");
        const { data: uns } = await supabase.from("units").select("id, title, unit_number, slug, subject_id").order("unit_number");

        if (sems) setAllSemesters(sems);
        if (subs) setAllSubjects(subs);
        if (uns) setAllUnits(uns);
      } catch (err) {
        console.error("Failed to load reference options:", err);
      }
    }
    fetchReferences();
  }, []);

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
          .select("id, unit_number, title, slug, subject_id, subjects(id, name, semesters(id, name)), downloads(id, file_name, file_url, file_size_kb)")
          .order("title", { ascending: true })
          .limit(350);
        setData(u || []);
      } else if (activeTab === "downloads") {
        const { data: downs } = await supabase
          .from("downloads")
          .select("id, file_name, file_url, file_size_kb, uploaded_at, units(id, title, unit_number, subjects(id, name, semesters(id, name)))")
          .order("uploaded_at", { ascending: false })
          .limit(350);
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

  // Open modal with preselected unit
  function openUploadForUnit(unit: any) {
    const subjectId = unit.subjects?.id || unit.subject_id;
    const semesterId = unit.subjects?.semesters?.id;

    if (semesterId) setSelectedSemesterId(semesterId);
    if (subjectId) setSelectedSubjectId(subjectId);
    setSelectedUnitId(unit.id);
    setCustomFileName(`${unit.subjects?.name || "Subject"} - Unit ${unit.unit_number || 1} Notes.pdf`);
    setUploadStatus(null);
    setIsModalOpen(true);
  }

  // Handle upload form submission
  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUnitId) {
      setUploadStatus({ type: "error", message: "Please select a specific Unit to attach this PDF." });
      return;
    }

    if (!pdfFile && !directPdfUrl.trim()) {
      setUploadStatus({ type: "error", message: "Please select a PDF file to upload or enter a direct PDF link." });
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append("unitId", selectedUnitId);
      if (pdfFile) formData.append("file", pdfFile);
      if (directPdfUrl) formData.append("directUrl", directPdfUrl.trim());
      if (customFileName) formData.append("fileName", customFileName.trim());

      const res = await fetch("/api/v1/admin/upload-pdf", {
        method: "POST",
        headers: {
          "x-admin-passcode": "admin123",
        },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to upload PDF");
      }

      setUploadStatus({
        type: "success",
        message: `Success! Notes attached to Unit: ${json.download.file_name}`,
      });

      setPdfFile(null);
      setDirectPdfUrl("");
      await loadData();
    } catch (err: any) {
      setUploadStatus({ type: "error", message: err.message || "Failed to upload file" });
    } finally {
      setUploading(false);
    }
  }

  const filteredData = data.filter((item) => {
    return search.trim() === "" || JSON.stringify(item).toLowerCase().includes(search.toLowerCase());
  });

  // Filter subjects for dropdown based on selected semester
  const availableSubjects = selectedSemesterId
    ? allSubjects.filter((s) => s.semester_id === selectedSemesterId)
    : allSubjects;

  // Filter units for dropdown based on selected subject
  const availableUnits = selectedSubjectId
    ? allUnits.filter((u) => u.subject_id === selectedSubjectId)
    : allUnits;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">Curriculum Content & PDF Management</h1>
          <p className="text-slate-400 font-mono text-sm mt-1">
            Upload PDF notes, link download files to units, and manage semesters & subjects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Primary Upload Button */}
          <button 
            onClick={() => {
              setUploadStatus(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg hover:scale-105 font-mono text-sm"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Unit PDF
          </button>
        </div>
      </div>

      {/* Guide Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-blue-500/20 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
          <FileCheck className="w-5 h-5" />
        </div>
        <div className="text-xs sm:text-sm text-slate-300 space-y-1">
          <p className="font-bold text-white">How to upload PDF notes for each subject unit:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-slate-400">
            <li>Find your unit in the <strong>Units & PDFs</strong> tab below, or click the yellow <strong>"Upload Unit PDF"</strong> button.</li>
            <li>Select your <strong>Semester</strong>, <strong>Subject</strong>, and <strong>Unit Number</strong>.</li>
            <li>Choose your PDF document from your computer (or paste a PDF URL).</li>
            <li>Click <strong>"Save & Attach to Unit"</strong> — the student download timer button on that unit's page will automatically serve this PDF!</li>
          </ol>
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
                ? "border-amber-400 text-amber-400 font-bold bg-white/5"
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
            placeholder={`Search in ${activeTab}...`}
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono transition-colors"
          />
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing {filteredData.length} records
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-slate-900/60 rounded-xl border border-white/10 overflow-hidden shadow-xl">
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
                  <th className="px-6 py-3">
                    {activeTab === "units" ? "Unit Title" : activeTab === "downloads" ? "File / Notes Name" : "Name / Title"}
                  </th>
                  <th className="px-6 py-3">Subject / Semester</th>
                  <th className="px-6 py-3">PDF Attachment</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredData.map((item, idx) => {
                  const hasDownload = item.downloads && (Array.isArray(item.downloads) ? item.downloads.length > 0 : Boolean(item.downloads.file_url));
                  const downloadObj = Array.isArray(item.downloads) ? item.downloads[0] : item.downloads;

                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-3 text-slate-500">{idx + 1}</td>
                      <td className="px-6 py-3 text-white font-semibold">
                        <div className="flex items-center gap-2">
                          {activeTab === "units" && (
                            <span className="w-6 h-6 rounded-md bg-blue-600/30 text-blue-300 text-xs flex items-center justify-center font-bold">
                              U{item.unit_number}
                            </span>
                          )}
                          <span>{item.title || item.name || item.file_name}</span>
                        </div>
                      </td>

                      <td className="px-6 py-3 text-xs text-slate-400">
                        {item.subjects?.name || item.units?.subjects?.name || item.semesters?.name || "—"}
                      </td>

                      {/* PDF status */}
                      <td className="px-6 py-3 text-xs">
                        {activeTab === "units" ? (
                          hasDownload ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <Check className="w-3 h-3" /> Attached
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <AlertCircle className="w-3 h-3" /> Missing PDF
                            </span>
                          )
                        ) : activeTab === "downloads" ? (
                          <a 
                            href={item.file_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline"
                          >
                            <span>Open PDF</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500">{item.slug || "—"}</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-3 text-right">
                        {activeTab === "units" ? (
                          <button
                            onClick={() => openUploadForUnit(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-lg text-xs transition-all"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{hasDownload ? "Replace PDF" : "Upload PDF"}</span>
                          </button>
                        ) : activeTab === "downloads" ? (
                          <button
                            onClick={() => {
                              setSelectedUnitId(item.units?.id || "");
                              setCustomFileName(item.file_name);
                              setIsModalOpen(true);
                            }}
                            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                          >
                            Replace File
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: UPLOAD PDF FOR UNIT NOTES                          */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white">Upload Subject Unit Notes</h2>
                <p className="text-xs text-slate-400">Attach a verified PDF to a specific curriculum unit</p>
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Semester Selector */}
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  1. Select Semester / Year
                </label>
                <select
                  value={selectedSemesterId}
                  onChange={(e) => {
                    setSelectedSemesterId(e.target.value);
                    setSelectedSubjectId("");
                    setSelectedUnitId("");
                  }}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none font-mono"
                >
                  <option value="">-- Choose Semester / Year --</option>
                  {allSemesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  2. Select Subject
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setSelectedUnitId("");
                  }}
                  disabled={!selectedSemesterId}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none font-mono disabled:opacity-50"
                >
                  <option value="">-- Choose Subject ({availableSubjects.length} available) --</option>
                  {availableSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit Selector */}
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  3. Select Unit
                </label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  disabled={!selectedSubjectId}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none font-mono disabled:opacity-50"
                  required
                >
                  <option value="">-- Choose Unit --</option>
                  {availableUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unit_number}: {u.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload or Direct URL */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <label className="block text-xs font-mono uppercase text-slate-400">
                  4. Upload PDF File (.pdf)
                </label>

                {/* File picker */}
                <div className="border-2 border-dashed border-white/20 hover:border-amber-400/60 rounded-xl p-4 text-center cursor-pointer transition-colors bg-white/5">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setPdfFile(e.target.files[0]);
                        if (!customFileName) setCustomFileName(e.target.files[0].name);
                      }
                    }}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-400 file:text-slate-950 hover:file:bg-amber-300 cursor-pointer"
                  />
                  {pdfFile && (
                    <p className="text-xs text-emerald-400 font-mono mt-2 flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Selected: {pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div className="text-center text-xs font-mono text-slate-500 uppercase">— or enter external PDF link —</div>

                <input
                  type="url"
                  placeholder="https://example.com/notes.pdf or Google Drive Direct Link"
                  value={directPdfUrl}
                  onChange={(e) => setDirectPdfUrl(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Custom Display Name */}
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  File Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unit 1 Foundational Theory Notes.pdf"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Status Message */}
              {uploadStatus && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2 font-mono ${
                    uploadStatus.type === "success"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  {uploadStatus.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{uploadStatus.message}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs font-mono shadow-lg transition-all disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Uploading to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Save & Attach to Unit</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
