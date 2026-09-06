"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Folder, 
  BookOpen, 
  Layers, 
  Plus, 
  Search, 
  UploadCloud, 
  FileText, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  X,
  FileCheck,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Trash2,
  FileUp,
  Pencil,
  Tag,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Filter,
  CheckCircle,
  FileDown
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

interface JoinedUnit {
  id: string;
  unit_number: number;
  title: string;
  slug: string;
  subject_id: string;
  subjects?: {
    id: string;
    name: string;
    slug: string;
    order_index: number;
    semester_id: string;
    semesters?: {
      id: string;
      number: number;
      name: string;
      slug: string;
    };
  };
  downloads?: Array<{
    id: string;
    file_name: string;
    file_url: string;
    file_size_kb?: number;
    uploaded_at?: string;
  }>;
}

function getAdminPasscode(): string {
  if (typeof window !== "undefined") {
    return (
      sessionStorage.getItem("pharmdbm_admin_passcode") ||
      localStorage.getItem("pharmdbm_admin_passcode") ||
      ""
    );
  }
  return "";
}

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState<"units-notes" | "subjects" | "semesters" | "posts">("units-notes");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [onlyMissingPdf, setOnlyMissingPdf] = useState(false);

  // Accordion expansion state for Units & Notes tree
  const [expandedSemesters, setExpandedSemesters] = useState<Record<string, boolean>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  // Inline rename state for Subjects and Units
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState<string>("");
  const [isSavingInline, setIsSavingInline] = useState<boolean>(false);

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allSemesters, setAllSemesters] = useState<SemesterOption[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([]);
  const [allUnits, setAllUnits] = useState<UnitOption[]>([]);

  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);
  const [directPdfUrl, setDirectPdfUrl] = useState<string>("");
  const [customFileName, setCustomFileName] = useState<string>("");

  // 5-State Upload Workflow: "idle" | "selected" | "uploading" | "success" | "error"
  const [uploadStep, setUploadStep] = useState<"idle" | "selected" | "uploading" | "success" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedResult, setUploadedResult] = useState<{
    fileName: string;
    fileSizeKb: number;
    fileUrl: string;
    publicPageUrl?: string;
    unitTitle?: string;
  } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Career & Exam Guide Posts Modal State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content_html: "",
    category: "Career",
  });
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const TABS = [
    { id: "units-notes", name: "Units & Notes", icon: Layers },
    { id: "subjects", name: "Subjects", icon: BookOpen },
    { id: "semesters", name: "Semesters", icon: Folder },
    { id: "posts", name: "Career & Exam Posts", icon: FileText },
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
      if (activeTab === "units-notes") {
        const { data: u, error: uErr } = await supabase
          .from("units")
          .select(`
            id, unit_number, title, slug, subject_id,
            subjects (
              id, name, slug, order_index, semester_id,
              semesters (
                id, number, name, slug
              )
            ),
            downloads (
              id, file_name, file_url, file_size_kb, uploaded_at
            )
          `)
          .order("unit_number", { ascending: true })
          .limit(500);

        if (uErr) throw uErr;
        setData(u || []);
      } else if (activeTab === "semesters") {
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
      } else if (activeTab === "posts") {
        const { data: postsData } = await supabase
          .from("posts")
          .select("id, title, slug, excerpt, content_html, category, published_at")
          .order("published_at", { ascending: false })
          .limit(100);
        setData(postsData || []);
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

  // Hierarchical tree transformation for Units & Notes screen
  const { semesterTree, totalUnitsCount, attachedUnitsCount, missingUnitsCount } = useMemo(() => {
    if (activeTab !== "units-notes" || !Array.isArray(data)) {
      return { semesterTree: [], totalUnitsCount: 0, attachedUnitsCount: 0, missingUnitsCount: 0 };
    }

    const unitsList: JoinedUnit[] = data;
    let total = 0;
    let attached = 0;

    // Grouping map: semesterId -> { semesterInfo, subjectsMap: subjectId -> { subjectInfo, units: [] } }
    const semMap = new Map<string, {
      id: string;
      name: string;
      number: number;
      slug: string;
      subjects: Map<string, {
        id: string;
        name: string;
        slug: string;
        order_index: number;
        units: JoinedUnit[];
      }>;
    }>();

    for (const unit of unitsList) {
      total++;
      const hasDownload = Boolean(unit.downloads && unit.downloads.length > 0 && unit.downloads[0].file_url);
      if (hasDownload) attached++;

      const sem = unit.subjects?.semesters;
      const semId = sem?.id || "unassigned-semester";
      const semName = sem?.name || "Unassigned Semester";
      const semNum = sem?.number ?? 999;
      const semSlug = sem?.slug || "";

      if (!semMap.has(semId)) {
        semMap.set(semId, {
          id: semId,
          name: semName,
          number: semNum,
          slug: semSlug,
          subjects: new Map(),
        });
      }

      const semNode = semMap.get(semId)!;
      const sub = unit.subjects;
      const subId = sub?.id || "unassigned-subject";
      const subName = sub?.name || "Unassigned Subject";
      const subSlug = sub?.slug || "";
      const subOrder = sub?.order_index ?? 999;

      if (!semNode.subjects.has(subId)) {
        semNode.subjects.set(subId, {
          id: subId,
          name: subName,
          slug: subSlug,
          order_index: subOrder,
          units: [],
        });
      }

      semNode.subjects.get(subId)!.units.push(unit);
    }

    // Convert map to sorted tree
    const tree = Array.from(semMap.values())
      .map((sem) => {
        const sortedSubjects = Array.from(sem.subjects.values())
          .map((sub) => {
            const sortedUnits = [...sub.units].sort((a, b) => a.unit_number - b.unit_number);
            const subAttached = sortedUnits.filter((u) => u.downloads && u.downloads.length > 0).length;
            return {
              ...sub,
              units: sortedUnits,
              totalUnits: sortedUnits.length,
              attachedUnits: subAttached,
            };
          })
          .sort((a, b) => a.order_index - b.order_index || a.name.localeCompare(b.name));

        const semTotal = sortedSubjects.reduce((acc, s) => acc + s.totalUnits, 0);
        const semAttached = sortedSubjects.reduce((acc, s) => acc + s.attachedUnits, 0);

        return {
          id: sem.id,
          name: sem.name,
          number: sem.number,
          slug: sem.slug,
          subjects: sortedSubjects,
          totalUnits: semTotal,
          attachedUnits: semAttached,
        };
      })
      .sort((a, b) => a.number - b.number || a.name.localeCompare(b.name));

    return {
      semesterTree: tree,
      totalUnitsCount: total,
      attachedUnitsCount: attached,
      missingUnitsCount: total - attached,
    };
  }, [data, activeTab]);

  // Filtered Tree based on search query and "only missing PDF" toggle
  const filteredTree = useMemo(() => {
    if (activeTab !== "units-notes") return [];

    const q = search.trim().toLowerCase();

    return semesterTree
      .map((sem) => {
        const matchingSubjects = sem.subjects
          .map((sub) => {
            const matchingUnits = sub.units.filter((unit) => {
              const hasPdf = Boolean(unit.downloads && unit.downloads.length > 0);
              if (onlyMissingPdf && hasPdf) return false;

              if (!q) return true;

              const titleMatch = unit.title?.toLowerCase().includes(q);
              const numMatch = String(unit.unit_number).includes(q);
              const subMatch = sub.name?.toLowerCase().includes(q);
              const semMatch = sem.name?.toLowerCase().includes(q);
              return titleMatch || numMatch || subMatch || semMatch;
            });

            if (matchingUnits.length === 0) return null;

            return {
              ...sub,
              units: matchingUnits,
            };
          })
          .filter(Boolean) as typeof sem.subjects;

        if (matchingSubjects.length === 0) return null;

        return {
          ...sem,
          subjects: matchingSubjects,
        };
      })
      .filter(Boolean) as typeof semesterTree;
  }, [semesterTree, search, onlyMissingPdf, activeTab]);

  // Auto-expand tree when searching
  useEffect(() => {
    if (search.trim()) {
      const semExp: Record<string, boolean> = {};
      const subExp: Record<string, boolean> = {};
      filteredTree.forEach((sem) => {
        semExp[sem.id] = true;
        sem.subjects.forEach((sub) => {
          subExp[sub.id] = true;
        });
      });
      setExpandedSemesters(semExp);
      setExpandedSubjects(subExp);
    }
  }, [search, filteredTree]);

  // Accordion Toggles
  function toggleSemester(id: string) {
    setExpandedSemesters((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleSubject(id: string) {
    setExpandedSubjects((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function expandAll() {
    const semExp: Record<string, boolean> = {};
    const subExp: Record<string, boolean> = {};
    semesterTree.forEach((sem) => {
      semExp[sem.id] = true;
      sem.subjects.forEach((sub) => {
        subExp[sub.id] = true;
      });
    });
    setExpandedSemesters(semExp);
    setExpandedSubjects(subExp);
  }

  function collapseAll() {
    setExpandedSemesters({});
    setExpandedSubjects({});
  }

  // Inline Rename Handlers
  function startInlineEdit(id: string, currentVal: string) {
    setInlineEditId(id);
    setInlineEditValue(currentVal);
  }

  async function saveInlineEdit(id: string, originalVal: string) {
    const trimmed = inlineEditValue.trim();
    if (!trimmed || trimmed === originalVal) {
      setInlineEditId(null);
      return;
    }
    setIsSavingInline(true);
    try {
      const isSubject = activeTab === "subjects";
      const res = await fetch("/api/v1/admin/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": getAdminPasscode(),
        },
        body: JSON.stringify({
          action: isSubject ? "rename-subject" : "rename-unit",
          id,
          [isSubject ? "name" : "title"]: trimmed,
        }),
      });
      if (res.ok) {
        setData((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, [isSubject ? "name" : "title"]: trimmed }
              : item
          )
        );
        if (isSubject) {
          setAllSubjects((prev) =>
            prev.map((s) => (s.id === id ? { ...s, name: trimmed } : s))
          );
        } else {
          setAllUnits((prev) =>
            prev.map((u) => (u.id === id ? { ...u, title: trimmed } : u))
          );
        }
      }
    } catch (err) {
      console.error("Failed to inline rename:", err);
    } finally {
      setIsSavingInline(false);
      setInlineEditId(null);
    }
  }

  // Remove / Unlink PDF Download Handler
  async function handleDeleteDownload(downloadId: string, unitId: string, unitTitle: string) {
    if (!confirm(`Are you sure you want to remove the PDF attached to "${unitTitle}"?`)) {
      return;
    }

    try {
      const res = await fetch("/api/v1/admin/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": getAdminPasscode(),
        },
        body: JSON.stringify({
          action: "delete-download",
          downloadId,
          unitId,
        }),
      });

      if (res.ok) {
        setData((prev) =>
          prev.map((u) =>
            u.id === unitId ? { ...u, downloads: [] } : u
          )
        );
      } else {
        alert("Failed to remove PDF file from unit.");
      }
    } catch (err) {
      console.error("Failed to remove PDF:", err);
      alert("Error removing PDF file.");
    }
  }

  // Career & Exam Posts Modal Handlers
  function openCreatePostModal() {
    setEditingPostId(null);
    setPostForm({
      title: "",
      slug: "",
      excerpt: "",
      content_html: "",
      category: "Career",
    });
    setPostError(null);
    setIsPostModalOpen(true);
  }

  function openEditPostModal(post: any) {
    setEditingPostId(post.id);
    setPostForm({
      title: post.title || "",
      slug: post.slug || "",
      excerpt: post.excerpt || "",
      content_html: post.content_html || "",
      category: post.category || "Career",
    });
    setPostError(null);
    setIsPostModalOpen(true);
  }

  async function handleSavePost(e: React.FormEvent) {
    e.preventDefault();
    if (!postForm.title.trim()) {
      setPostError("Post title is required");
      return;
    }
    setIsSavingPost(true);
    setPostError(null);
    try {
      const slug = postForm.slug.trim() || postForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const payload = {
        action: editingPostId ? "update-post" : "create-post",
        id: editingPostId,
        title: postForm.title.trim(),
        slug,
        excerpt: postForm.excerpt.trim(),
        content_html: postForm.content_html.trim(),
        category: postForm.category,
      };
      const res = await fetch("/api/v1/admin/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": getAdminPasscode(),
        },
        body: JSON.stringify({ ...payload }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        setPostError(result.error || "Failed to save post");
        return;
      }
      setIsPostModalOpen(false);
      loadData();
    } catch (err: any) {
      setPostError(err.message || "Failed to save post");
    } finally {
      setIsSavingPost(false);
    }
  }

  async function handleDeletePost(id: string) {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch("/api/v1/admin/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": getAdminPasscode(),
        },
        body: JSON.stringify({ action: "delete-post", id }),
      });
      if (res.ok) {
        setData((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  }

  // Open upload modal with preselected unit from row
  function openUploadForUnit(unit: any) {
    const subjectId = unit.subjects?.id || unit.subject_id;
    const semesterId = unit.subjects?.semesters?.id || unit.subjects?.semester_id;

    if (semesterId) setSelectedSemesterId(semesterId);
    if (subjectId) setSelectedSubjectId(subjectId);
    setSelectedUnitId(unit.id);
    setCustomFileName(`${unit.subjects?.name || "Subject"} - Unit ${unit.unit_number || 1} Notes.pdf`);
    setPdfFile(null);
    setDirectPdfUrl("");
    setUploadError(null);
    setFileValidationError(null);
    setUploadedResult(null);
    setUploadStep("idle");
    setUploadProgress(0);
    setIsModalOpen(true);
  }

  function resetModalState() {
    setPdfFile(null);
    setDirectPdfUrl("");
    setUploadError(null);
    setFileValidationError(null);
    setUploadedResult(null);
    setUploadStep("idle");
    setUploadProgress(0);
  }

  // Validate and accept file
  function validateAndSelectFile(file: File) {
    setFileValidationError(null);
    setUploadError(null);

    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    if (!isPdf) {
      setFileValidationError(`Selected file is not a PDF (${file.type || file.name.split('.').pop()}). Only .pdf documents are supported.`);
      setPdfFile(null);
      setUploadStep("error");
      return;
    }

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      setFileValidationError(`File exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please choose a smaller PDF.`);
      setPdfFile(null);
      setUploadStep("error");
      return;
    }

    setPdfFile(file);
    if (!customFileName) {
      setCustomFileName(file.name);
    }
    setUploadStep("selected");
  }

  // Real XHR progress upload
  function handleUploadSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();

    if (!selectedUnitId) {
      setUploadError("Please select a specific Semester, Subject, and Unit first.");
      setUploadStep("error");
      return;
    }

    if (!pdfFile && !directPdfUrl.trim()) {
      setUploadError("Please choose a PDF file or enter a direct PDF URL.");
      setUploadStep("error");
      return;
    }

    setUploadStep("uploading");
    setUploadProgress(0);
    setUploadError(null);

    const formData = new FormData();
    formData.append("unitId", selectedUnitId);
    if (pdfFile) formData.append("file", pdfFile);
    if (directPdfUrl) formData.append("directUrl", directPdfUrl.trim());
    if (customFileName) formData.append("fileName", customFileName.trim());

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/v1/admin/upload-pdf");
    xhr.withCredentials = true;
    xhr.setRequestHeader("x-admin-passcode", getAdminPasscode());

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.min(Math.round((event.loaded / event.total) * 95), 95);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          setUploadProgress(100);
          setUploadStep("success");
          setUploadedResult({
            fileName: json.fileName,
            fileSizeKb: json.fileSizeKb,
            fileUrl: json.fileUrl,
            publicPageUrl: json.publicPageUrl,
            unitTitle: json.unit ? `Unit ${json.unit.unit_number}: ${json.unit.title}` : undefined,
          });
          loadData();
        } catch (err) {
          setUploadError("Unexpected server response format.");
          setUploadStep("error");
        }
      } else {
        let msg = "Upload request failed.";
        try {
          const json = JSON.parse(xhr.responseText);
          if (json.error) msg = json.error;
        } catch (_) {}
        setUploadError(msg);
        setUploadStep("error");
      }
    };

    xhr.onerror = () => {
      setUploadError("Network error occurred during PDF upload. Check connection.");
      setUploadStep("error");
    };

    xhr.send(formData);
  }

  // Filtered flat list for other tabs (semesters, subjects, posts)
  const filteredFlatData = useMemo(() => {
    if (activeTab === "units-notes") return [];
    const q = search.toLowerCase();
    return data.filter((item) => {
      if (activeTab === "semesters") {
        return item.name?.toLowerCase().includes(q) || String(item.number).includes(q);
      }
      if (activeTab === "subjects") {
        return (
          item.name?.toLowerCase().includes(q) ||
          item.slug?.toLowerCase().includes(q) ||
          item.semesters?.name?.toLowerCase().includes(q)
        );
      }
      if (activeTab === "posts") {
        return (
          item.title?.toLowerCase().includes(q) ||
          item.slug?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.excerpt?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, activeTab, search]);

  const availableSubjects = selectedSemesterId
    ? allSubjects.filter((s) => s.semester_id === selectedSemesterId)
    : allSubjects;

  const availableUnits = selectedSubjectId
    ? allUnits.filter((u) => u.subject_id === selectedSubjectId)
    : allUnits;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">
            Curriculum Content & PDF Notes
          </h1>
          <p className="text-slate-400 font-mono text-sm mt-1">
            Organized hierarchy of Semesters, Subjects, and Units with direct PDF attachment and preview
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

          {/* Action button based on tab */}
          {activeTab === "posts" ? (
            <button 
              onClick={openCreatePostModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg hover:scale-105 font-mono text-sm"
            >
              <Plus className="w-4 h-4" />
              New Career / Exam Guide
            </button>
          ) : (
            <button 
              onClick={() => {
                resetModalState();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg hover:scale-105 font-mono text-sm"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Unit PDF
            </button>
          )}
        </div>
      </div>

      {/* Progress & Upload Overview Banner */}
      {activeTab === "units-notes" && (
        <div className="bg-gradient-to-r from-slate-900/90 to-blue-950/60 border border-white/10 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/30 shadow-inner">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-white font-display font-bold text-base sm:text-lg flex items-center gap-2.5">
                  Curriculum Upload Progress
                  <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {totalUnitsCount} Total Units
                  </span>
                </h2>
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {attachedUnitsCount} Attached
                  </span>
                  <span>•</span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {missingUnitsCount} Missing PDF
                  </span>
                  <span>•</span>
                  <span>
                    {totalUnitsCount > 0 ? Math.round((attachedUnitsCount / totalUnitsCount) * 100) : 0}% Complete
                  </span>
                </div>
              </div>
            </div>

            {/* Expand / Collapse all toggles */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={expandAll}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-mono transition-colors border border-white/10"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-mono transition-colors border border-white/10"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden mt-4 p-0.5 border border-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 transition-all duration-500"
              style={{
                width: `${totalUnitsCount > 0 ? Math.max((attachedUnitsCount / totalUnitsCount) * 100, 2) : 2}%`,
              }}
            />
          </div>
        </div>
      )}

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

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/60 rounded-xl border border-white/10 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === "units-notes"
                ? "Search units across all semesters..."
                : `Search in ${activeTab}...`
            }
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-8 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* Filter Toggle: "Show only units missing a PDF" */}
          {activeTab === "units-notes" && (
            <button
              type="button"
              onClick={() => setOnlyMissingPdf(!onlyMissingPdf)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                onlyMissingPdf
                  ? "bg-amber-500/20 text-amber-300 border-amber-400/60 font-bold shadow-[0_0_12px_rgba(251,192,45,0.2)]"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Show only units missing a PDF</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                onlyMissingPdf ? "bg-amber-400 text-slate-950 font-bold" : "bg-white/10 text-slate-300"
              }`}>
                {missingUnitsCount}
              </span>
            </button>
          )}

          <div className="text-xs font-mono text-slate-400 whitespace-nowrap">
            {activeTab === "units-notes"
              ? `${filteredTree.reduce((acc, sem) => acc + sem.subjects.reduce((sa, sub) => sa + sub.units.length, 0), 0)} units shown`
              : `Showing ${filteredFlatData.length} records`}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: UNIFIED "UNITS & NOTES" TREE NAVIGATION ACCORDION */}
      {/* ========================================================= */}
      {activeTab === "units-notes" && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-16 bg-slate-900/60 rounded-xl border border-white/10 text-center text-slate-400 font-mono text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
              <span>Loading Units & Notes tree...</span>
            </div>
          ) : filteredTree.length === 0 ? (
            <div className="p-16 bg-slate-900/60 rounded-xl border border-white/10 text-center flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 text-white/10 mb-4" />
              <h3 className="text-xl font-display text-white mb-2">No Matching Units Found</h3>
              <p className="text-slate-400 font-mono max-w-md mx-auto text-sm">
                {onlyMissingPdf
                  ? "Great job! All units matching your search criteria already have a PDF attached."
                  : "No units found matching your search term. Try a different query."}
              </p>
              {onlyMissingPdf && (
                <button
                  onClick={() => setOnlyMissingPdf(false)}
                  className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-mono transition-colors"
                >
                  Clear missing PDF filter
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTree.map((semester) => {
                const isSemExpanded = Boolean(expandedSemesters[semester.id]);
                const semUnitsTotal = semester.subjects.reduce((a, s) => a + s.units.length, 0);
                const semAttachedTotal = semester.subjects.reduce(
                  (a, s) => a + s.units.filter((u) => u.downloads && u.downloads.length > 0).length,
                  0
                );

                return (
                  <div
                    key={semester.id}
                    className="bg-slate-900/70 border border-white/10 rounded-2xl overflow-hidden shadow-lg transition-all"
                  >
                    {/* Level 1: Semester Header */}
                    <div
                      onClick={() => toggleSemester(semester.id)}
                      className="p-4 sm:px-6 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors border-b border-transparent data-[expanded=true]:border-white/10"
                      data-expanded={isSemExpanded}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                          {isSemExpanded ? (
                            <ChevronDown className="w-4 h-4 text-blue-300" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display font-bold text-white text-base sm:text-lg flex items-center gap-2.5 truncate">
                            {semester.name}
                            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-white/10 text-slate-300 shrink-0">
                              {semester.subjects.length} Subjects
                            </span>
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Status pill */}
                        <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                            semAttachedTotal === semUnitsTotal && semUnitsTotal > 0
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : semAttachedTotal > 0
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          }`}>
                            {semAttachedTotal} / {semUnitsTotal} PDFs
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Level 2: Subjects Accordion */}
                    {isSemExpanded && (
                      <div className="p-3 sm:p-5 space-y-3 bg-black/25">
                        {semester.subjects.map((subject) => {
                          const isSubExpanded = Boolean(expandedSubjects[subject.id]);
                          const subAttached = subject.units.filter((u) => u.downloads && u.downloads.length > 0).length;

                          return (
                            <div
                              key={subject.id}
                              className="bg-slate-950/80 border border-white/10 rounded-xl overflow-hidden"
                            >
                              {/* Subject Header */}
                              <div
                                onClick={() => toggleSubject(subject.id)}
                                className="p-3.5 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors border-b border-transparent data-[expanded=true]:border-white/10"
                                data-expanded={isSubExpanded}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-6 h-6 rounded-md bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/30">
                                    {isSubExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-amber-300" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-sans font-semibold text-white text-sm sm:text-base truncate">
                                      {subject.name}
                                    </h4>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 shrink-0">
                                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${
                                    subAttached === subject.units.length && subject.units.length > 0
                                      ? "bg-emerald-500/20 text-emerald-300"
                                      : "bg-white/10 text-slate-300"
                                  }`}>
                                    {subAttached} / {subject.units.length} Units Ready
                                  </span>
                                </div>
                              </div>

                              {/* Level 3: Units Rows */}
                              {isSubExpanded && (
                                <div className="divide-y divide-white/5 bg-slate-900/40">
                                  {subject.units.map((unit) => {
                                    const hasDownload = Boolean(
                                      unit.downloads && unit.downloads.length > 0 && unit.downloads[0].file_url
                                    );
                                    const downloadObj = unit.downloads?.[0];

                                    return (
                                      <div
                                        key={unit.id}
                                        className="p-3 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                                      >
                                        {/* Unit Number & Title (with Inline Rename) */}
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                          <span className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-300 text-xs flex items-center justify-center font-bold font-mono shrink-0 border border-blue-500/20">
                                            U{unit.unit_number}
                                          </span>

                                          <div className="min-w-0 flex-1">
                                            {inlineEditId === unit.id ? (
                                              <div className="flex items-center gap-2">
                                                <input
                                                  type="text"
                                                  autoFocus
                                                  value={inlineEditValue}
                                                  onChange={(e) => setInlineEditValue(e.target.value)}
                                                  onKeyDown={(e) => {
                                                    if (e.key === "Enter") saveInlineEdit(unit.id, unit.title);
                                                    if (e.key === "Escape") setInlineEditId(null);
                                                  }}
                                                  onBlur={() => saveInlineEdit(unit.id, unit.title)}
                                                  disabled={isSavingInline}
                                                  className="bg-slate-950 border border-amber-400 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none w-full max-w-md shadow-inner"
                                                />
                                                {isSavingInline ? (
                                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                                                ) : (
                                                  <span className="text-[10px] text-amber-400 font-mono shrink-0">Enter ↵</span>
                                                )}
                                              </div>
                                            ) : (
                                              <div
                                                onClick={() => startInlineEdit(unit.id, unit.title)}
                                                className="group flex items-center gap-2 cursor-pointer hover:text-amber-300 transition-colors"
                                                title="Click to inline rename unit"
                                              >
                                                <span className="text-xs sm:text-sm text-white font-medium border-b border-dashed border-white/20 group-hover:border-amber-400">
                                                  {unit.title}
                                                </span>
                                                <Pencil className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Status Badge & Actions */}
                                        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pl-10 md:pl-0">
                                          {/* Status Badge */}
                                          {hasDownload && downloadObj ? (
                                            <div className="flex items-center gap-2">
                                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono">
                                                <Check className="w-3 h-3 text-emerald-400" />
                                                <span>PDF attached</span>
                                              </span>
                                              {downloadObj.file_size_kb ? (
                                                <span className="text-[10px] font-mono text-slate-500 hidden lg:inline">
                                                  ({(downloadObj.file_size_kb / 1024).toFixed(1)} MB)
                                                </span>
                                              ) : null}
                                            </div>
                                          ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-mono">
                                              <AlertCircle className="w-3 h-3 text-amber-400" />
                                              <span>No PDF yet</span>
                                            </span>
                                          )}

                                          {/* Row Actions */}
                                          <div className="flex items-center gap-2">
                                            {hasDownload && downloadObj ? (
                                              <>
                                                {/* Open preview */}
                                                <a
                                                  href={downloadObj.file_url}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white rounded-lg text-xs font-mono transition-colors border border-white/10"
                                                  title="Open & preview PDF file"
                                                >
                                                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                                                  <span>Open</span>
                                                </a>

                                                {/* Replace */}
                                                <button
                                                  type="button"
                                                  onClick={() => openUploadForUnit(unit)}
                                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-xs font-mono transition-colors border border-blue-500/30"
                                                  title="Replace attached PDF"
                                                >
                                                  <RefreshCw className="w-3.5 h-3.5" />
                                                  <span>Replace</span>
                                                </button>

                                                {/* Remove file */}
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleDeleteDownload(downloadObj.id, unit.id, unit.title)
                                                  }
                                                  className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                                                  title="Remove PDF from unit"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              </>
                                            ) : (
                                              /* Upload missing PDF */
                                              <button
                                                type="button"
                                                onClick={() => openUploadForUnit(unit)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500 hover:to-yellow-500 text-amber-300 hover:text-slate-950 font-bold border border-amber-400/40 rounded-lg text-xs font-mono transition-all shadow-sm"
                                              >
                                                <UploadCloud className="w-3.5 h-3.5" />
                                                <span>Upload PDF</span>
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2, 3, 4: SUBJECTS, SEMESTERS, AND POSTS TABLES        */}
      {/* ========================================================= */}
      {activeTab !== "units-notes" && (
        <div className="bg-slate-900/60 rounded-xl border border-white/10 overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
              <span>Loading {activeTab}...</span>
            </div>
          ) : filteredFlatData.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 text-white/10 mb-4" />
              <h3 className="text-xl font-display text-white mb-2 capitalize">No {activeTab} Found</h3>
              <p className="text-slate-400 font-mono max-w-md mx-auto text-sm">
                {activeTab === "posts" 
                  ? "No career updates or exam guides published yet. Click 'New Career / Exam Guide' to add your first post."
                  : "No matching records found in the database."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300 font-mono">
                <thead className="bg-black/30 border-b border-white/10 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-3">#</th>
                    <th className="px-6 py-3">
                      {activeTab === "subjects" ? "Subject Name (Click to rename)" :
                       activeTab === "posts" ? "Title & Slug" : "Name / Title"}
                    </th>
                    <th className="px-6 py-3">
                      {activeTab === "posts" ? "Category" : "Semester / Code"}
                    </th>
                    <th className="px-6 py-3">
                      {activeTab === "posts" ? "Published Date" : "Slug"}
                    </th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredFlatData.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-3 text-slate-500">{idx + 1}</td>

                      {/* Name / Title */}
                      <td className="px-6 py-3 text-white font-semibold">
                        {activeTab === "subjects" ? (
                          inlineEditId === item.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                autoFocus
                                value={inlineEditValue}
                                onChange={(e) => setInlineEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveInlineEdit(item.id, item.name);
                                  if (e.key === "Escape") setInlineEditId(null);
                                }}
                                onBlur={() => saveInlineEdit(item.id, item.name)}
                                disabled={isSavingInline}
                                className="bg-slate-950 border border-amber-400 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none w-full max-w-sm shadow-inner"
                              />
                              {isSavingInline ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                              ) : (
                                <span className="text-[10px] text-amber-400 font-mono shrink-0">Enter ↵</span>
                              )}
                            </div>
                          ) : (
                            <div 
                              onClick={() => startInlineEdit(item.id, item.name)}
                              className="group flex items-center gap-2 cursor-pointer hover:text-amber-300 transition-colors"
                              title="Click to inline rename"
                            >
                              <span className="border-b border-dashed border-white/20 group-hover:border-amber-400">
                                {item.name}
                              </span>
                              <Pencil className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </div>
                          )
                        ) : activeTab === "posts" ? (
                          <div>
                            <p className="text-white font-bold">{item.title}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">/posts/{item.slug}</p>
                          </div>
                        ) : (
                          <span>{item.name}</span>
                        )}
                      </td>

                      {/* Semester / Category */}
                      <td className="px-6 py-3 text-xs">
                        {activeTab === "posts" ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            item.category === "Exam Guide"
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}>
                            <Tag className="w-3 h-3" />
                            {item.category || "Career"}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            {item.semesters?.name || (item.courses ? `${item.courses.code}` : "—")}
                          </span>
                        )}
                      </td>

                      {/* Slug or Published Date */}
                      <td className="px-6 py-3 text-xs">
                        {activeTab === "posts" ? (
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {item.published_at ? new Date(item.published_at).toLocaleDateString() : "Just now"}
                          </span>
                        ) : (
                          <span className="text-slate-500">{item.slug || "—"}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3 text-right">
                        {activeTab === "posts" ? (
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/posts/${item.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-white/10 rounded-lg transition-colors"
                              title="View on site"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => openEditPostModal(item)}
                              className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-white/10 rounded-lg transition-colors"
                              title="Edit post"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(item.id)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Delete post"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: POST CREATE & EDIT (CAREER & EXAM GUIDES)          */}
      {/* ========================================================= */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-xl w-full p-5 sm:p-7 shadow-2xl relative my-6 text-left">
            <button
              onClick={() => setIsPostModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-11 h-11 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-display font-bold text-white leading-snug">
                  {editingPostId ? "Edit Career / Exam Guide" : "New Career & Exam Guide"}
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Publishes directly to the Recent Posts widget and <code>/posts</code> directory
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePost} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-400 uppercase text-[11px] mb-1 font-bold">
                  Post Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pharmacist Recruitment Exam 2026 Notification"
                  value={postForm.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setPostForm((prev) => ({
                      ...prev,
                      title: newTitle,
                      slug: prev.slug && editingPostId ? prev.slug : newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
                    }));
                  }}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase text-[11px] mb-1 font-bold">
                    Category Tag <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={postForm.category}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Career">Career / Job Opening</option>
                    <option value="Exam Guide">Exam Guide / Syllabus</option>
                    <option value="Recruitment">Recruitment Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase text-[11px] mb-1 font-bold">
                    URL Slug <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="pharmacist-recruitment-2026"
                    value={postForm.slug}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, slug: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase text-[11px] mb-1 font-bold">
                  Short Excerpt (Sidebar & Cards Preview)
                </label>
                <textarea
                  rows={2}
                  placeholder="A concise 1-2 sentence preview for search results and sidebar widgets..."
                  value={postForm.excerpt}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase text-[11px] mb-1 font-bold">
                  Full Article Content (HTML or Markdown)
                </label>
                <textarea
                  rows={5}
                  placeholder="<p>Full notification details, eligibility requirements, and direct application links...</p>"
                  value={postForm.content_html}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, content_html: e.target.value }))}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              {postError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300">
                  {postError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPost}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                >
                  {isSavingPost ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Post...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{editingPostId ? "Save Changes" : "Publish Post"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: UPLOAD PDF FOR UNIT NOTES (5-STATE POLISHED UX)     */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-xl w-full p-5 sm:p-7 shadow-2xl relative my-6 text-left">
            {/* Close Button */}
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetModalState();
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-11 h-11 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-display font-bold text-white leading-snug">
                  {uploadStep === "success" ? "PDF Uploaded Successfully" : "Upload Subject Unit Notes"}
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  {uploadStep === "success" 
                    ? "Study material linked to curriculum and ready for students" 
                    : "Attach a verified PDF to a specific curriculum unit"}
                </p>
              </div>
            </div>

            {/* STATE 4: SUCCESS CONFIRMATION & VERIFY LINKS */}
            {uploadStep === "success" && uploadedResult ? (
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/10 animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-300 font-display">
                      Verified & Attached to Unit!
                    </h3>
                    <p className="text-xs text-slate-300 font-mono mt-1">
                      {uploadedResult.unitTitle || "The document has been securely stored and published."}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-emerald-500/20 rounded-xl p-3.5 flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate font-mono">
                          {uploadedResult.fileName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {uploadedResult.fileSizeKb > 0 
                            ? `${(uploadedResult.fileSizeKb / 1024).toFixed(2)} MB • Cloud Storage` 
                            : "Cloud Storage"}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold shrink-0">
                      Active
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={uploadedResult.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs font-mono shadow-lg transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open & Verify Direct PDF</span>
                  </a>

                  {uploadedResult.publicPageUrl && (
                    <a
                      href={uploadedResult.publicPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs font-mono border border-white/10 transition-all"
                    >
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>Test Student Page Flow</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={resetModalState}
                    className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-mono transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload another PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetModalState();
                    }}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs rounded-xl transition-colors font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* UPLOAD FORM */
              <form onSubmit={(e) => { e.preventDefault(); handleUploadSubmit(); }} className="space-y-4">
                <div className="space-y-3 bg-black/20 p-3.5 rounded-xl border border-white/5">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                      1. Semester / Year <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={selectedSemesterId}
                      onChange={(e) => {
                        setSelectedSemesterId(e.target.value);
                        setSelectedSubjectId("");
                        setSelectedUnitId("");
                      }}
                      disabled={uploadStep === "uploading"}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:border-amber-400 focus:outline-none font-mono disabled:opacity-50"
                    >
                      <option value="">-- Choose Semester / Year --</option>
                      {allSemesters.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                      2. Subject <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => {
                        setSelectedSubjectId(e.target.value);
                        setSelectedUnitId("");
                      }}
                      disabled={!selectedSemesterId || uploadStep === "uploading"}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:border-amber-400 focus:outline-none font-mono disabled:opacity-50"
                    >
                      <option value="">-- Choose Subject ({availableSubjects.length} available) --</option>
                      {availableSubjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                      3. Target Unit <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      disabled={!selectedSubjectId || uploadStep === "uploading"}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:border-amber-400 focus:outline-none font-mono disabled:opacity-50"
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
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>4. PDF Document (.pdf)</span>
                    <span className="text-slate-500 lowercase text-[10px]">max 50mb</span>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        validateAndSelectFile(e.target.files[0]);
                      }
                    }}
                  />

                  {uploadStep === "uploading" ? (
                    <div className="bg-slate-950/80 border border-amber-400/40 rounded-2xl p-5 text-center space-y-4 shadow-inner">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                        <span className="flex items-center gap-2 font-bold text-white">
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                          Uploading to Supabase Storage...
                        </span>
                        <span className="text-amber-400 font-bold text-sm">{uploadProgress}%</span>
                      </div>

                      <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 transition-all duration-300 shadow-sm"
                          style={{ width: `${Math.max(uploadProgress, 5)}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-slate-400 font-mono">
                        {uploadProgress < 50
                          ? "Transferring PDF data to storage bucket..."
                          : uploadProgress < 95
                          ? "Saving public access link and curriculum records..."
                          : "Finalizing and linking to unit download flow..."}
                      </p>
                    </div>
                  ) : pdfFile ? (
                    <div className="bg-slate-950/90 border border-white/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-white truncate font-mono">
                            {pdfFile.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                            <span>{(pdfFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                            <span>•</span>
                            <span className="text-emerald-400 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Valid PDF
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white rounded-lg text-xs font-mono transition-colors"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPdfFile(null);
                            setUploadStep("idle");
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(false);
                        if (e.dataTransfer.files?.[0]) {
                          validateAndSelectFile(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2.5 ${
                        isDraggingOver
                          ? "border-amber-400 bg-amber-400/10 scale-[1.01]"
                          : "border-white/20 hover:border-amber-400/60 bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
                        <FileUp className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Drag a PDF here or tap to choose a file
                        </p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          PDF documents only (up to 50MB)
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="mt-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-mono font-semibold transition-colors border border-white/10"
                      >
                        Choose PDF File
                      </button>
                    </div>
                  )}

                  <div className="mt-3">
                    <div className="text-center text-[10px] font-mono text-slate-500 uppercase tracking-widest my-2">
                      — or paste direct external PDF link —
                    </div>
                    <input
                      type="url"
                      placeholder="https://example.com/notes.pdf or Supabase Public URL"
                      value={directPdfUrl}
                      onChange={(e) => setDirectPdfUrl(e.target.value)}
                      disabled={uploadStep === "uploading"}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:border-amber-400 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Student-Facing File Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 1 Foundational Theory Notes.pdf"
                    value={customFileName}
                    onChange={(e) => setCustomFileName(e.target.value)}
                    disabled={uploadStep === "uploading"}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white font-mono focus:border-amber-400 focus:outline-none disabled:opacity-50"
                  />
                </div>

                {(uploadStep === "error" || uploadError || fileValidationError) && (
                  <div className="p-3.5 rounded-xl text-xs bg-rose-500/15 text-rose-200 border border-rose-500/30 flex items-start gap-2.5 font-mono animate-in fade-in duration-200">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <p className="font-bold text-rose-300">Upload failed</p>
                      <p className="text-[11px] text-rose-200/90 leading-relaxed">
                        {uploadError || fileValidationError || "An error occurred while uploading. Please check the file and try again."}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetModalState();
                    }}
                    disabled={uploadStep === "uploading"}
                    className="px-4 py-2.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={uploadStep === "uploading" || (!pdfFile && !directPdfUrl.trim())}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-xs font-mono shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {uploadStep === "uploading" ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading ({uploadProgress}%)...</span>
                      </>
                    ) : uploadStep === "error" ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Upload</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Save & Attach to Unit</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
