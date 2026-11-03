import React, { useState, useRef } from "react";
import { 
  X, 
  Printer, 
  Share2, 
  CheckCircle2, 
  Copy, 
  FileText, 
  ExternalLink,
  MessageSquare,
  Download,
  Layers,
  Users,
  MapPin,
  Sparkles,
  Calendar,
  ClipboardList,
  GraduationCap,
  Building2,
  Check,
  Grid
} from "lucide-react";
import html2canvas from "html2canvas";
import { Language } from "../translations";
import { Student, ExamHall, SeatingResult, OfficialBoardTimetable } from "../types";
import { getClassColor } from "../App";

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  madrasaName: string;
  madrasaRegNo: string;
  madrasaPlace: string;
  activeShift: string;
  totalStudents: number;
  totalHalls: number;
  selectedPrintTargets: string[];
  onTriggerSavePdf: () => void;
  lang?: Language;
  students?: Student[];
  halls?: ExamHall[];
  seatingResult?: SeatingResult | null;
  classTimetableMap?: Record<string, any[]>;
}

/**
 * Sanitizes oklch() color functions from cloned document before html2canvas rendering.
 * Tailwind v4 outputs oklch(...) colors which html2canvas parser cannot process natively.
 */
const sanitizeOklchColorsInClonedDoc = (clonedDoc: Document) => {
  // 1. Sanitize text in <style> tags
  const styleTags = Array.from(clonedDoc.querySelectorAll("style"));
  styleTags.forEach((s) => {
    if (s.textContent && s.textContent.includes("oklch")) {
      s.textContent = s.textContent.replace(/oklch\([^)]+\)/g, "#0f172a");
    }
  });

  // 2. Helper canvas context to resolve any CSS color string to standard hex/rgb
  let dummyCtx: CanvasRenderingContext2D | null = null;
  try {
    const canvas = document.createElement("canvas");
    dummyCtx = canvas.getContext("2d");
  } catch (e) {}

  const resolveColorStr = (colorVal: string): string => {
    if (!colorVal || typeof colorVal !== "string") return "#0f172a";
    if (!colorVal.includes("oklch")) return colorVal;
    if (!dummyCtx) return "#0f172a";
    try {
      dummyCtx.fillStyle = "#ffffff";
      dummyCtx.fillStyle = colorVal;
      return dummyCtx.fillStyle || "#0f172a";
    } catch {
      return "#0f172a";
    }
  };

  // 3. For every element in the cloned DOM tree, resolve oklch computed styles to explicit RGB/hex
  const elements = Array.from(clonedDoc.querySelectorAll("*")) as HTMLElement[];
  elements.forEach((el) => {
    if (!el.style) return;
    try {
      const comp = window.getComputedStyle(el);
      if (comp.backgroundColor && comp.backgroundColor.includes("oklch")) {
        el.style.backgroundColor = resolveColorStr(comp.backgroundColor);
      }
      if (comp.color && comp.color.includes("oklch")) {
        el.style.color = resolveColorStr(comp.color);
      }
      if (comp.borderColor && comp.borderColor.includes("oklch")) {
        el.style.borderColor = resolveColorStr(comp.borderColor);
      }
      if (comp.outlineColor && comp.outlineColor.includes("oklch")) {
        el.style.outlineColor = resolveColorStr(comp.outlineColor);
      }
    } catch (e) {}
  });
};

export default function WhatsAppShareModal({
  isOpen,
  onClose,
  madrasaName,
  madrasaRegNo,
  madrasaPlace,
  activeShift,
  totalStudents,
  totalHalls,
  selectedPrintTargets,
  onTriggerSavePdf,
  lang = "ml",
  students = [],
  halls = [],
  seatingResult = null,
  classTimetableMap = {}
}: WhatsAppShareModalProps) {
  const [viewScopeMode, setViewScopeMode] = useState<"class" | "hall">("class");
  const [selectedClass, setSelectedClass] = useState<string>("All");
  const [selectedDivision, setSelectedDivision] = useState<string>("All");
  const [selectedHall, setSelectedHall] = useState<string>("All");
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");

  const exportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Extract list of all unique classes present in workspace
  const availableClasses = Array.from(
    new Set(students.map((s) => s.classLevel).filter(Boolean))
  ).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, "")) || 0;
    const numB = parseInt(b.replace(/\D/g, "")) || 0;
    return numA - numB;
  });

  // Extract list of all unique halls
  const availableHalls = halls.map((h) => h.name).filter(Boolean);

  const activeClassToExport = selectedClass === "All" ? (availableClasses[0] || "Class 1") : selectedClass;
  const activeHallToExport = selectedHall === "All" ? (availableHalls[0] || "Hall 1") : selectedHall;

  // Compute student list based on active view mode
  let classAllStudents: Student[] = [];
  let availableDivisions: string[] = [];
  let classStudents: Student[] = [];

  if (viewScopeMode === "class") {
    classAllStudents = students.filter(
      (s) => selectedClass === "All" || s.classLevel === selectedClass
    );
    availableDivisions = Array.from(
      new Set(classAllStudents.map((s) => (s.division && s.division.trim() ? s.division.trim().toUpperCase() : "A")))
    ).sort();

    classStudents = classAllStudents.filter((s) => {
      const div = s.division && s.division.trim() ? s.division.trim().toUpperCase() : "A";
      return selectedDivision === "All" || div === selectedDivision;
    });
  } else {
    // Hall View Mode: Filter students who are allocated to the selected Hall
    const hallStudentIds = new Set<string>();
    if (seatingResult && seatingResult.allocations) {
      seatingResult.allocations.forEach((alloc) => {
        if (selectedHall === "All" || alloc.hallName === selectedHall) {
          alloc.benches.forEach((row) => {
            row.forEach((seat) => {
              if (seat && seat.studentId) hallStudentIds.add(seat.studentId);
            });
          });
        }
      });
    }

    classStudents = students.filter((s) => hallStudentIds.has(s.id));
    classAllStudents = classStudents;
    availableDivisions = Array.from(
      new Set(classStudents.map((s) => (s.division && s.division.trim() ? s.division.trim().toUpperCase() : "A")))
    ).sort();
  }

  // Map hall seat allocations for students in classStudents
  const studentSeatingMap = new Map<string, { hallName: string; benchNo: number; seatLetter: string; shift: string }>();

  if (seatingResult && seatingResult.allocations) {
    seatingResult.allocations.forEach((alloc) => {
      alloc.benches.forEach((row, bIdx) => {
        row.forEach((seat, sIdx) => {
          if (seat && seat.studentId) {
            const letter = String.fromCharCode(65 + sIdx);
            studentSeatingMap.set(seat.studentId, {
              hallName: alloc.hallName,
              benchNo: bIdx + 1,
              seatLetter: letter,
              shift: alloc.shift || activeShift
            });
          }
        });
      });
    });
  }

  // Get Timetable for the active class
  const classTimetable = classTimetableMap[activeClassToExport] || [];

  const handleClassChange = (cl: string) => {
    setSelectedClass(cl);
    setSelectedDivision("All");
  };

  const handleHallChange = (hName: string) => {
    setSelectedHall(hName);
  };

  const displayScopeTitle = viewScopeMode === "class"
    ? `${activeClassToExport}${selectedDivision !== "All" ? ` (DIV ${selectedDivision})` : " (ALL DIVS)"}`
    : `${selectedHall === "All" ? "ALL EXAM HALLS" : selectedHall}`;

  const handleDownloadPNG = async (exportType: string) => {
    if (!exportRef.current) return;
    setGeneratingType(exportType);

    try {
      const targetElement = exportRef.current.querySelector(`#png-export-card-${exportType}`) as HTMLElement;
      if (!targetElement) throw new Error("Target card element not found");

      const canvas = await html2canvas(targetElement, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: sanitizeOklchColorsInClonedDoc
      });

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;

      let fileSlug = "";
      if (viewScopeMode === "class") {
        const classSlug = activeClassToExport.replace(/\s+/g, "_");
        const divSlug = selectedDivision !== "All" ? `_Div_${selectedDivision}` : "_All_Divs";
        fileSlug = `${classSlug}${divSlug}`;
      } else {
        fileSlug = selectedHall.replace(/\s+/g, "_");
      }

      a.download = `${madrasaName || "Madrasa"}_${fileSlug}_${exportType}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to generate PNG image:", err);
    } finally {
      setGeneratingType(null);
    }
  };

  const handleShareWhatsAppImage = async (exportType: string, summaryCaption: string) => {
    if (!exportRef.current) return;
    setGeneratingType(exportType);

    try {
      const targetElement = exportRef.current.querySelector(`#png-export-card-${exportType}`) as HTMLElement;
      if (!targetElement) throw new Error("Target card element not found");

      const canvas = await html2canvas(targetElement, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: sanitizeOklchColorsInClonedDoc
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        let fileSlug = "";
        if (viewScopeMode === "class") {
          const classSlug = activeClassToExport.replace(/\s+/g, "_");
          const divSlug = selectedDivision !== "All" ? `_Div_${selectedDivision}` : "";
          fileSlug = `${classSlug}${divSlug}`;
        } else {
          fileSlug = selectedHall.replace(/\s+/g, "_");
        }

        const file = new File([blob], `${fileSlug}_${exportType}.png`, { type: "image/png" });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `${madrasaName} - ${displayScopeTitle} ${exportType}`,
              text: summaryCaption
            });
            setGeneratingType(null);
            return;
          } catch (e) {
            console.log("Native share fallback to WhatsApp link:", e);
          }
        }

        // Fallback: download PNG and open WhatsApp Web/App
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${madrasaName || "Madrasa"}_${fileSlug}_${exportType}.png`;
        a.click();

        let cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
        if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

        const baseUrl = cleanPhone
          ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(summaryCaption)}`
          : `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryCaption)}`;
        
        window.open(baseUrl, "_blank");
        setGeneratingType(null);
      }, "image/png");
    } catch (err) {
      console.error("Error sharing PNG image:", err);
      setGeneratingType(null);
    }
  };

  // Helper to render rows grouped by Division or flat list
  const renderTableRowsWithDivisions = (
    columnsCount: number,
    renderRow: (st: Student, globalIdx: number) => React.ReactNode
  ) => {
    if (viewScopeMode === "class" && selectedDivision === "All" && availableDivisions.length > 1) {
      let globalCounter = 0;
      return availableDivisions.map((divName) => {
        const divStudents = classStudents.filter(
          (s) => (s.division && s.division.trim() ? s.division.trim().toUpperCase() : "A") === divName
        );
        if (divStudents.length === 0) return null;

        return (
          <React.Fragment key={`div-group-${divName}`}>
            <tr style={{ backgroundColor: "#064e3b", color: "#ffffff" }}>
              <td
                colSpan={columnsCount}
                className="p-2.5 font-black text-xs uppercase tracking-wider text-center font-mono"
                style={{ border: "1px solid #022c22", borderLeft: "5px solid #f59e0b", backgroundColor: "#064e3b", color: "#fbbf24" }}
              >
                ─── DIVISION {divName} ({divStudents.length} STUDENTS) ───
              </td>
            </tr>
            {divStudents.map((st) => {
              globalCounter++;
              return renderRow(st, globalCounter);
            })}
          </React.Fragment>
        );
      });
    }

    return classStudents.map((st, idx) => renderRow(st, idx + 1));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner">
              <MessageSquare className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-display font-black tracking-tight flex items-center gap-2">
                <span>{lang === "ml" ? "വാട്സ്ആപ്പ് ഇമേജ് ഷെയറിംഗ് ഹബ്" : "WhatsApp Image Share Hub"}</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/40 font-mono font-bold">
                  PNG Export
                </span>
              </h3>
              <p className="text-emerald-100/90 text-xs mt-0.5">
                {lang === "ml"
                  ? "ക്ലാസ്സ് / ഹാൾ തിരിച്ചുള്ള high-resolution വാട്സ്ആപ്പ് ചിത്രങ്ങൾ"
                  : "Class-wise and Hall-wise high-resolution image slips for WhatsApp parent & teacher groups"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODE SWITCHER TAB BAR (CLASS VIEW VS HALL VIEW) */}
        <div className="bg-slate-900 text-white p-2 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              {lang === "ml" ? "ഫിൽട്ടർ രീതി:" : "View Mode:"}
            </span>
            <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setViewScopeMode("class")}
                className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  viewScopeMode === "class"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{lang === "ml" ? "🏫 ക്ലാസ്സ് തിരിച്ചുള്ളത് (By Class)" : "🏫 By Class"}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewScopeMode("hall")}
                className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  viewScopeMode === "hall"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{lang === "ml" ? "🏛️ ഹാൾ തിരിച്ചുള്ളത് (By Hall)" : "🏛️ By Hall"}</span>
              </button>
            </div>
          </div>

          <span className="text-2xs font-mono text-emerald-300/80 font-bold hidden sm:inline">
            {viewScopeMode === "class" ? "Class & Division Scope" : "Exam Hall Allocation Scope"}
          </span>
        </div>

        {/* CONDITIONAL SUB-NAV BARS DEPENDING ON VIEW SCOPE MODE */}
        {viewScopeMode === "class" ? (
          <>
            {/* CLASS SELECTOR TABS BAR */}
            <div className="bg-slate-100 p-2.5 px-4 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-thin">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider px-1 shrink-0 flex items-center gap-1 font-mono">
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>{lang === "ml" ? "ക്ലാസ്സ്:" : "Class:"}</span>
              </span>

              <button
                type="button"
                onClick={() => handleClassChange("All")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  selectedClass === "All"
                    ? "bg-slate-900 text-white shadow-sm font-extrabold"
                    : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {lang === "ml" ? "എല്ലാ ക്ലാസുകളും" : "All Classes"} ({students.length})
              </button>

              {availableClasses.map((cl) => {
                const count = students.filter((s) => s.classLevel === cl).length;
                const isSel = selectedClass === cl;
                const color = getClassColor(cl);
                return (
                  <button
                    key={cl}
                    type="button"
                    onClick={() => handleClassChange(cl)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                      isSel
                        ? `${color.pill} shadow-md ring-2 ring-emerald-400/40 border-transparent`
                        : "bg-white text-slate-800 hover:bg-slate-50 border-slate-200"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSel ? "bg-white" : color.dot}`}></span>
                    <span>{cl}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSel ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* DIVISION SELECTOR TABS BAR */}
            <div className="bg-slate-50 p-2 px-4 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-thin">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider px-1 shrink-0 flex items-center gap-1 font-mono">
                <Grid className="w-3.5 h-3.5 text-teal-700" />
                <span>{lang === "ml" ? "ഡിവിഷൻ:" : "Division:"}</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedDivision("All")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  selectedDivision === "All"
                    ? "bg-emerald-800 text-white font-black shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-300"
                }`}
              >
                {lang === "ml" ? "എല്ലാ ഡിവിഷനും" : "All Divisions"} ({classAllStudents.length})
              </button>

              {availableDivisions.map((divName) => {
                const divCount = classAllStudents.filter(
                  (s) => (s.division && s.division.trim() ? s.division.trim().toUpperCase() : "A") === divName
                ).length;
                const isSel = selectedDivision === divName;
                return (
                  <button
                    key={divName}
                    type="button"
                    onClick={() => setSelectedDivision(divName)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                      isSel
                        ? "bg-teal-800 text-white border-teal-900 shadow-xs font-extrabold"
                        : "bg-white text-slate-700 hover:bg-slate-100 border-slate-300"
                    }`}
                  >
                    <span>Div {divName}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSel ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {divCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          /* HALL SELECTOR TABS BAR (HALL VIEW MODE) */
          <div className="bg-slate-100 p-2.5 px-4 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-thin">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider px-1 shrink-0 flex items-center gap-1 font-mono">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>{lang === "ml" ? "പരീക്ഷാ ഹാൾ:" : "Exam Hall:"}</span>
            </span>

            <button
              type="button"
              onClick={() => handleHallChange("All")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                selectedHall === "All"
                  ? "bg-slate-900 text-white shadow-sm font-extrabold"
                  : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              {lang === "ml" ? "എല്ലാ ഹാളുകളും" : "All Halls"} ({halls.length})
            </button>

            {availableHalls.map((hName) => {
              const hallAlloc = seatingResult?.allocations?.find((a) => a.hallName === hName);
              let hCount = 0;
              if (hallAlloc) {
                hallAlloc.benches.forEach((r) => r.forEach((s) => { if (s && s.studentId) hCount++; }));
              }
              const isSel = selectedHall === hName;
              return (
                <button
                  key={hName}
                  type="button"
                  onClick={() => handleHallChange(hName)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                    isSel
                      ? "bg-emerald-700 text-white border-emerald-800 shadow-md ring-2 ring-emerald-400/40"
                      : "bg-white text-slate-800 hover:bg-slate-50 border-slate-200"
                  }`}
                >
                  <Building2 className={`w-3.5 h-3.5 ${isSel ? "text-emerald-200" : "text-emerald-600"}`} />
                  <span>{hName}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSel ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {hCount}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* MAIN EXPORT OPTIONS CONTAINER */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          {/* Top Info Banner */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-950 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📱</span>
              <div>
                <span className="font-extrabold font-display text-slate-900">
                  {displayScopeTitle} — {lang === "ml" ? "വാട്സ്ആപ്പ് ഇമേജ് കാർഡുകൾ" : "WhatsApp Image Slips"}
                </span>
                <span className="text-[11px] text-slate-600 block">
                  {lang === "ml"
                    ? `ആകെ ${classStudents.length} വിദ്യാർത്ഥികൾ • വാട്സ്ആപ്പ് ഗ്രൂപ്പിൽ അയക്കാൻ യോജിച്ച high-resolution PNG ചിത്രങ്ങൾ`
                    : `Total ${classStudents.length} students • Optimized HD PNG cards for WhatsApp sharing`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onTriggerSavePdf}
                className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 font-bold border border-emerald-300 rounded-xl text-xs transition cursor-pointer flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-700" />
                <span>{lang === "ml" ? "ഫുൾ PDF സേവ്" : "Save Full PDF"}</span>
              </button>
            </div>
          </div>

          {/* 5 PNG EXPORT CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. SEAT MAP IMAGE CARD */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-400 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                      📍
                    </div>
                    <div>
                      <h4 className="font-display font-extrabold text-sm text-slate-900">
                        {lang === "ml" ? "1. സീറ്റ് മാപ്പ് ഇമേജ് (Seat Map)" : "1. Seat Map Image"}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {lang === "ml" ? "കുട്ടികളുടെ ഹാൾ, ബെഞ്ച്, സീറ്റ് നമ്പർ വിവരങ്ങൾ" : "Student Hall, Bench & Seat letter summary"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                    Seat Map
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed font-mono">
                  {classStudents.slice(0, 3).map((st) => {
                    const seatInfo = studentSeatingMap.get(st.id);
                    return (
                      <div key={st.id} className="flex justify-between items-center py-0.5 border-b border-slate-100 last:border-0">
                        <span className="font-bold text-slate-800 truncate max-w-[140px]">{st.name} ({st.division || "A"})</span>
                        <span className="text-emerald-700 font-bold">
                          {seatInfo ? `${seatInfo.hallName} • B#${seatInfo.benchNo} (${seatInfo.seatLetter})` : "Not Seated"}
                        </span>
                      </div>
                    );
                  })}
                  {classStudents.length > 3 && (
                    <div className="text-[10px] text-slate-400 text-center pt-1 italic">
                      + {classStudents.length - 3} {lang === "ml" ? "കൂടുതൽ വിദ്യാർത്ഥികൾ..." : "more..."}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={generatingType === "seat_map"}
                  onClick={() => handleDownloadPNG("seat_map")}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>{generatingType === "seat_map" ? "Generating..." : "Download PNG"}</span>
                </button>
                <button
                  type="button"
                  disabled={generatingType === "seat_map"}
                  onClick={() =>
                    handleShareWhatsAppImage(
                      "seat_map",
                      `*${madrasaName}* — *${displayScopeTitle} Seat Map*\n📍 Total Students: ${classStudents.length}`
                    )
                  }
                  className="py-2.5 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{lang === "ml" ? "WhatsApp Share" : "Share WhatsApp"}</span>
                </button>
              </div>
            </div>

            {/* 2. VISUAL DESK MAP CARD (PRINT-STYLE BENCH GRID) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-400 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
                      🪑
                    </div>
                    <div>
                      <h4 className="font-display font-extrabold text-sm text-slate-900">
                        {lang === "ml" ? "2. വിഷ്വൽ ഡെസ്ക് മാപ്പ് (Print Bench Grid)" : "2. Visual Desk Map"}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {lang === "ml" ? "പ്രിന്റിംഗിലുള്ള അതേ വിഷ്വൽ ബെഞ്ച് ഗ്രിഡ് ലേഔട്ട്" : "Exact print-style bench seating arrangement grid"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded-full font-bold border border-teal-200">
                    Print Desk Grid
                  </span>
                </div>
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 text-xs text-teal-950 font-medium leading-relaxed">
                  {lang === "ml"
                    ? "പ്രിന്റൗട്ടിലുള്ളതുപോലെ ബെഞ്ചുകളും (Bench Cards) ആൺകുട്ടികൾ / പെൺകുട്ടികൾ മേഖലകളും വ്യക്തമാക്കുന്ന വിഷ്വൽ ബെഞ്ച് പ്ലാൻ."
                    : "Exact print-style bench visual plan showing bench numbers and seat positions."}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={generatingType === "desk_map"}
                  onClick={() => handleDownloadPNG("desk_map")}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>{generatingType === "desk_map" ? "Generating..." : "Download PNG"}</span>
                </button>
                <button
                  type="button"
                  disabled={generatingType === "desk_map"}
                  onClick={() =>
                    handleShareWhatsAppImage(
                      "desk_map",
                      `*${madrasaName}* — *${displayScopeTitle} Visual Desk Map Grid*`
                    )
                  }
                  className="py-2.5 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{lang === "ml" ? "WhatsApp Share" : "Share WhatsApp"}</span>
                </button>
              </div>
            </div>

            {/* 3. WHATSAPP SLIP / PARENT NOTICE CARD */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-400 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                      📱
                    </div>
                    <div>
                      <h4 className="font-display font-extrabold text-sm text-slate-900">
                        {lang === "ml" ? "3. വാട്സ്ആപ്പ് സ്ലിപ്പ് / രക്ഷാകർതൃ നോട്ടീസ്" : "3. WhatsApp Slip / Parent Notice"}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {lang === "ml" ? "പരീക്ഷാ ടൈംടേബിളും ഹാൾ വിവരങ്ങളും അടങ്ങിയ നോട്ടീസ്" : "Formatted notice slip with exam schedule & hall directions"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                    Parent Slip
                  </span>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs text-amber-950 font-medium leading-relaxed">
                  {lang === "ml"
                    ? "മാതാപിതാക്കളുടെ വാട്സ്ആപ്പ് ഗ്രൂപ്പിൽ ഷെയർ ചെയ്യാൻ അനുയോജ്യമായ പരീക്ഷാ ടൈംടേബിളും ഹാൾ വഴികാട്ടിയും."
                    : "Official exam schedule and seating instructions formatted cleanly for parent WhatsApp communications."}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={generatingType === "parent_notice"}
                  onClick={() => handleDownloadPNG("parent_notice")}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>{generatingType === "parent_notice" ? "Generating..." : "Download PNG"}</span>
                </button>
                <button
                  type="button"
                  disabled={generatingType === "parent_notice"}
                  onClick={() =>
                    handleShareWhatsAppImage(
                      "parent_notice",
                      `*${madrasaName}* — *${displayScopeTitle} Exam Timetable & Parent Notice*`
                    )
                  }
                  className="py-2.5 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{lang === "ml" ? "WhatsApp Share" : "Share WhatsApp"}</span>
                </button>
              </div>
            </div>

            {/* 4. MASTER LIST CARD */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-400 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                      📋
                    </div>
                    <div>
                      <h4 className="font-display font-extrabold text-sm text-slate-900">
                        {lang === "ml" ? "4. മാസ്റ്റർ ലിസ്റ്റ് (Master Seating List)" : "4. Master Seating List"}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {lang === "ml" ? "ക്ലാസിലെ മുഴുവൻ വിദ്യാർത്ഥികളുടെയും പട്ടിക" : "Comprehensive master student roster & hall allocations"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    Master List
                  </span>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs text-emerald-950 font-medium leading-relaxed">
                  {lang === "ml"
                    ? "ഉസ്താദുമാർക്ക് പരിശോധിക്കാൻ ആൺകുട്ടികളുടെയും പെൺകുട്ടികളുടെയും എണ്ണവും ഹാൾ വിവരങ്ങളും ഉൾപ്പെടുത്തിയ ഫുൾ മാസ്റ്റർ ലിസ്റ്റ്."
                    : "Complete classroom master seating roster including boys/girls headcount and assigned hall rooms."}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={generatingType === "master_list"}
                  onClick={() => handleDownloadPNG("master_list")}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>{generatingType === "master_list" ? "Generating..." : "Download PNG"}</span>
                </button>
                <button
                  type="button"
                  disabled={generatingType === "master_list"}
                  onClick={() =>
                    handleShareWhatsAppImage(
                      "master_list",
                      `*${madrasaName}* — *${displayScopeTitle} Master Seating List*`
                    )
                  }
                  className="py-2.5 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{lang === "ml" ? "WhatsApp Share" : "Share WhatsApp"}</span>
                </button>
              </div>
            </div>

            {/* 5. FULL REGISTER CARD */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-400 transition md:col-span-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-sm">
                      📑
                    </div>
                    <div>
                      <h4 className="font-display font-extrabold text-sm text-slate-900">
                        {lang === "ml" ? "5. ഫുൾ രജിസ്റ്റർ കാർഡ് (Full Register)" : "5. Full Register Card"}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {lang === "ml" ? "അഡ്മിഷൻ നമ്പർ, റോൾ നമ്പർ, ഹാജർ രേഖപ്പെടുത്തൽ പട്ടിക" : "Attendance register template with admission & roll numbers"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full font-bold border border-slate-300">
                    Full Register
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium leading-relaxed">
                  {lang === "ml"
                    ? "ക്ലാസ്സ് ഉസ്താദുമാർക്ക് വിതരണം ചെയ്യാനും വാട്സ്ആപ്പിൽ സൂക്ഷിക്കാനുമുള്ള ഔദ്യോഗിക ഫുൾ അറ്റൻഡൻസ് രജിസ്റ്റർ കാർഡ്."
                    : "Official class roll call register card suitable for class teachers and administrative records."}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={generatingType === "full_register"}
                  onClick={() => handleDownloadPNG("full_register")}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>{generatingType === "full_register" ? "Generating..." : "Download Register PNG"}</span>
                </button>
                <button
                  type="button"
                  disabled={generatingType === "full_register"}
                  onClick={() =>
                    handleShareWhatsAppImage(
                      "full_register",
                      `*${madrasaName}* — *${displayScopeTitle} Full Register Card*`
                    )
                  }
                  className="py-2.5 px-5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{lang === "ml" ? "WhatsApp-ലേക്ക് അയക്കുക" : "Share to WhatsApp Group"}</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* HIDDEN OFF-SCREEN PNG RENDER CARDS CONTAINER (EXACT PRINT BENCH GRID WITH EXPLICIT STANDARD HEX STYLES) */}
        <div
          ref={exportRef}
          className="fixed left-[-9999px] top-[-9999px] opacity-100 pointer-events-none"
          style={{ width: "900px", backgroundColor: "#ffffff" }}
        >
          {/* CARD 1: SEAT MAP (EMERALD EXECUTIVE) */}
          <div
            id="png-export-card-seat_map"
            className="p-8 space-y-6 font-sans"
            style={{ width: "900px", backgroundColor: "#ffffff", color: "#0f172a", border: "4px solid #064e3b", borderRadius: "16px" }}
          >
            {/* Header Block */}
            <div className="text-center pb-4 space-y-2" style={{ borderBottom: "2px solid #d97706" }}>
              <div className="text-xs font-black font-mono tracking-widest uppercase" style={{ color: "#b45309" }}>
                OFFICIAL MADRASA EXAMINATION DOCUMENT
              </div>
              <h2 className="text-2xl font-black font-display uppercase tracking-tight" style={{ color: "#064e3b" }}>
                {madrasaName || "HIDAYATHUL ISLAM HIGHER SECONDARY MADRASA"}
              </h2>
              <div className="text-xs font-bold flex items-center justify-center gap-3 font-mono" style={{ color: "#047857" }}>
                <span>{madrasaPlace}</span>
                <span style={{ color: "#d97706" }}>◆</span>
                <span>Reg No: {madrasaRegNo || "N/A"}</span>
                <span style={{ color: "#d97706" }}>◆</span>
                <span>Shift: {activeShift}</span>
              </div>
              <div className="mt-2 inline-block px-5 py-1.5 font-black text-xs rounded-full font-mono uppercase tracking-wide" style={{ backgroundColor: "#064e3b", color: "#ffffff", border: "1px solid #f59e0b" }}>
                {displayScopeTitle} — EXAM SEATING SEAT MAP
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-left border-collapse text-xs" style={{ border: "1px solid #cbd5e1" }}>
              <thead>
                <tr className="text-xs font-black uppercase" style={{ backgroundColor: "#064e3b", color: "#ffffff", borderBottom: "2px solid #d97706" }}>
                  <th className="p-2.5 text-center w-12" style={{ border: "1px solid #022c22" }}>#</th>
                  <th className="p-2.5 w-24" style={{ border: "1px solid #022c22" }}>Adm No</th>
                  <th className="p-2.5" style={{ border: "1px solid #022c22" }}>Student Name</th>
                  <th className="p-2.5 text-center w-16" style={{ border: "1px solid #022c22" }}>Div</th>
                  <th className="p-2.5" style={{ border: "1px solid #022c22" }}>Exam Hall Name</th>
                  <th className="p-2.5 text-center w-28" style={{ border: "1px solid #022c22" }}>Bench & Seat Allocation</th>
                </tr>
              </thead>
              <tbody>
                {renderTableRowsWithDivisions(6, (st, idx) => {
                  const sInfo = studentSeatingMap.get(st.id);
                  return (
                    <tr key={st.id} style={{ backgroundColor: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                      <td className="p-2.5 text-center font-bold font-mono" style={{ border: "1px solid #cbd5e1", color: "#475569" }}>{idx}</td>
                      <td className="p-2.5 font-mono font-bold" style={{ border: "1px solid #cbd5e1", color: "#334155" }}>{st.admissionNumber || st.rollNo || "-"}</td>
                      <td className="p-2.5 font-extrabold" style={{ border: "1px solid #cbd5e1", color: "#0f172a" }}>{st.name}</td>
                      <td className="p-2.5 text-center font-bold" style={{ border: "1px solid #cbd5e1", color: "#047857" }}>{st.division || "A"}</td>
                      <td className="p-2.5 font-extrabold" style={{ border: "1px solid #cbd5e1", color: "#064e3b" }}>{sInfo?.hallName || "Unassigned"}</td>
                      <td className="p-2.5 text-center" style={{ border: "1px solid #cbd5e1" }}>
                        {sInfo ? (
                          <span className="inline-block px-2.5 py-1 rounded-full text-2xs font-mono font-black" style={{ backgroundColor: "#ecfdf5", color: "#047857", border: "1px solid #6ee7b7" }}>
                            Bench #{sInfo.benchNo} (Seat {sInfo.seatLetter})
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-2xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="pt-3 flex justify-between items-center text-2xs font-bold font-mono" style={{ borderTop: "2px solid #e2e8f0", color: "#64748b" }}>
              <span>Verified Madrasa Seating System</span>
              <span style={{ color: "#047857" }}>Total Count: {classStudents.length} Students</span>
            </div>
          </div>

          {/* CARD 2: VISUAL DESK MAP (EXACT PRINT-STYLE BENCH GRID LAYOUT) */}
          <div
            id="png-export-card-desk_map"
            className="p-8 space-y-6 font-sans"
            style={{ width: "900px", backgroundColor: "#ffffff", color: "#0f172a", border: "4px solid #064e3b", borderRadius: "16px" }}
          >
            <div className="text-center pb-4 space-y-2" style={{ borderBottom: "2px solid #d97706" }}>
              <div className="text-xs font-black font-mono tracking-widest uppercase" style={{ color: "#b45309" }}>
                EXAM BENCH ARRANGEMENT & VISUAL DESK MAP
              </div>
              <h2 className="text-2xl font-black font-display uppercase tracking-tight" style={{ color: "#064e3b" }}>
                {madrasaName || "HIDAYATHUL ISLAM HIGHER SECONDARY MADRASA"}
              </h2>
              <div className="text-xs font-bold flex items-center justify-center gap-3 font-mono" style={{ color: "#047857" }}>
                <span>{madrasaPlace}</span>
                <span style={{ color: "#d97706" }}>◆</span>
                <span>Shift: {activeShift}</span>
              </div>
              <div className="mt-2 inline-block px-5 py-1.5 font-black text-xs rounded-full font-mono uppercase tracking-wide" style={{ backgroundColor: "#064e3b", color: "#ffffff", border: "1px solid #f59e0b" }}>
                {displayScopeTitle} — VISUAL DESK MAP GRID
              </div>
            </div>

            {/* RENDER BENCHES ACCORDING TO SEATING RESULT ALLOCATIONS (PRINT BENCH GRID MATCH) */}
            {(() => {
              const relevantAllocations = (seatingResult?.allocations || []).filter((alloc) => {
                if (viewScopeMode === "hall" && selectedHall !== "All") {
                  return alloc.hallName === selectedHall;
                }
                return true;
              });

              if (relevantAllocations.length === 0) {
                return (
                  <div className="p-8 text-center text-xs text-slate-500 font-mono italic bg-slate-50 rounded-xl border border-slate-200">
                    No seating allocations generated for this scope yet.
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {relevantAllocations.map((alloc, hIdx) => {
                    return (
                      <div key={alloc.hallId || hIdx} className="space-y-3">
                        <div className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-center font-mono flex items-center justify-between" style={{ backgroundColor: "#064e3b", color: "#fbbf24", borderLeft: "5px solid #f59e0b" }}>
                          <span>🏛️ {alloc.hallName}</span>
                          <span>Total Benches: {alloc.benches.length}</span>
                        </div>

                        {/* Bench Cards Grid */}
                        <div className="grid grid-cols-2 gap-3.5">
                          {alloc.benches.map((row, bIdx) => {
                            const hasStudents = row.some((s) => s && s.studentId);
                            if (!hasStudents && viewScopeMode === "class") return null;

                            return (
                              <div
                                key={bIdx}
                                className="p-3 rounded-2xl space-y-2"
                                style={{ backgroundColor: "#f8fafc", border: "2px solid #cbd5e1" }}
                              >
                                <div className="flex items-center justify-between border-b pb-1.5 font-mono text-xs font-black" style={{ borderColor: "#cbd5e1", color: "#064e3b" }}>
                                  <span className="flex items-center gap-1">
                                    <span>🪑 Bench #{bIdx + 1}</span>
                                  </span>
                                  <span className="text-3xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: "#064e3b", color: "#ffffff" }}>
                                    {row.filter((s) => s && s.studentId).length} Seats
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {row.map((seat, sIdx) => {
                                    const seatLetter = String.fromCharCode(65 + sIdx);
                                    if (!seat || !seat.studentId) {
                                      return (
                                        <div
                                          key={sIdx}
                                          className="p-2 rounded-xl text-center text-3xs italic font-mono"
                                          style={{ backgroundColor: "#ffffff", border: "1px dashed #cbd5e1", color: "#94a3b8" }}
                                        >
                                          Seat {seatLetter}: Empty
                                        </div>
                                      );
                                    }

                                    const stObj = students.find((st) => st.id === seat.studentId);
                                    const cColor = getClassColor(stObj?.classLevel);

                                    return (
                                      <div
                                        key={sIdx}
                                        className="p-2 rounded-xl flex flex-col justify-between space-y-1"
                                        style={{ backgroundColor: "#ffffff", border: "1px solid #a7f3d0" }}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="text-3xs font-black font-mono px-1.5 py-0.2 rounded" style={{ backgroundColor: "#064e3b", color: "#ffffff" }}>
                                            Seat {seatLetter}
                                          </span>
                                          <span className="text-3xs font-extrabold font-mono" style={{ color: "#047857" }}>
                                            {stObj?.classLevel || "Class"} ({stObj?.division || "A"})
                                          </span>
                                        </div>
                                        <div className="font-extrabold text-xs text-slate-900 truncate">
                                          {stObj?.name || seat.studentName}
                                        </div>
                                        <div className="text-3xs font-mono text-slate-500 font-semibold">
                                          Adm: {stObj?.admissionNumber || stObj?.rollNo || "-"}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="pt-3 flex justify-between text-2xs font-bold font-mono" style={{ borderTop: "2px solid #e2e8f0", color: "#64748b" }}>
              <span>Madrasa Exam Desk Plan</span>
              <span style={{ color: "#047857" }}>Total: {classStudents.length} Students</span>
            </div>
          </div>

          {/* CARD 3: WHATSAPP SLIP / PARENT NOTICE (EMERALD EXECUTIVE) */}
          <div
            id="png-export-card-parent_notice"
            className="p-8 space-y-6 font-sans"
            style={{ width: "900px", backgroundColor: "#ffffff", color: "#0f172a", border: "4px solid #064e3b", borderRadius: "16px" }}
          >
            <div className="text-center pb-4 space-y-2" style={{ borderBottom: "2px solid #d97706" }}>
              <div className="text-xs font-black font-mono tracking-widest uppercase" style={{ color: "#b45309" }}>
                PARENT EXAMINATION NOTICE & TIMETABLE
              </div>
              <h2 className="text-2xl font-black font-display uppercase tracking-tight" style={{ color: "#064e3b" }}>
                {madrasaName || "HIDAYATHUL ISLAM HIGHER SECONDARY MADRASA"}
              </h2>
              <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "#047857" }}>
                പരീക്ഷാ ടൈംടേബിൾ & ഹാൾ ഇൻഫോർമേഷൻ — {displayScopeTitle}
              </div>
            </div>

            <div className="p-4 rounded-2xl space-y-2" style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0" }}>
              <h3 className="font-black text-xs uppercase tracking-wider font-mono" style={{ color: "#064e3b" }}>◆ പരീക്ഷാ ടൈംടേബിൾ (EXAM TIMETABLE) ◆</h3>
              {classTimetable.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {classTimetable.map((tt: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-xl flex justify-between items-center font-bold" style={{ backgroundColor: "#ffffff", border: "1px solid #a7f3d0" }}>
                      <span style={{ color: "#0f172a" }}>Day {tt.dayNum}: {tt.subject}</span>
                      <span className="font-mono text-2xs px-2 py-0.5 rounded font-black" style={{ backgroundColor: "#064e3b", color: "#ffffff" }}>{tt.dateStr}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs italic font-semibold" style={{ color: "#475569" }}>പരീക്ഷാ ടൈംടേബിൾ ലഭ്യമാണ്</div>
              )}
            </div>

            <table className="w-full text-left border-collapse text-xs" style={{ border: "1px solid #cbd5e1" }}>
              <thead>
                <tr className="font-black text-xs uppercase" style={{ backgroundColor: "#064e3b", color: "#ffffff", borderBottom: "2px solid #d97706" }}>
                  <th className="p-2 text-center w-12" style={{ border: "1px solid #022c22" }}>#</th>
                  <th className="p-2" style={{ border: "1px solid #022c22" }}>Student Name</th>
                  <th className="p-2 text-center" style={{ border: "1px solid #022c22" }}>Adm No</th>
                  <th className="p-2 text-center w-16" style={{ border: "1px solid #022c22" }}>Div</th>
                  <th className="p-2" style={{ border: "1px solid #022c22" }}>Exam Hall</th>
                  <th className="p-2 text-center" style={{ border: "1px solid #022c22" }}>Seat Details</th>
                </tr>
              </thead>
              <tbody>
                {renderTableRowsWithDivisions(6, (st, idx) => {
                  const sInfo = studentSeatingMap.get(st.id);
                  return (
                    <tr key={st.id} style={{ backgroundColor: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                      <td className="p-2 text-center font-bold font-mono" style={{ border: "1px solid #cbd5e1" }}>{idx}</td>
                      <td className="p-2 font-extrabold" style={{ border: "1px solid #cbd5e1", color: "#0f172a" }}>{st.name}</td>
                      <td className="p-2 text-center font-mono font-bold" style={{ border: "1px solid #cbd5e1" }}>{st.admissionNumber || st.rollNo || "-"}</td>
                      <td className="p-2 text-center font-bold" style={{ border: "1px solid #cbd5e1", color: "#047857" }}>{st.division || "A"}</td>
                      <td className="p-2 font-extrabold" style={{ border: "1px solid #cbd5e1", color: "#064e3b" }}>{sInfo?.hallName || "Hall"}</td>
                      <td className="p-2 text-center font-mono" style={{ border: "1px solid #cbd5e1" }}>
                        {sInfo ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-2xs font-bold" style={{ backgroundColor: "#ecfdf5", color: "#047857", border: "1px solid #6ee7b7" }}>
                            Bench #{sInfo.benchNo} ({sInfo.seatLetter})
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-2xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="p-3.5 rounded-xl text-center text-xs font-bold" style={{ backgroundColor: "#f0fdf4", borderLeft: "5px solid #059669", color: "#065f46" }}>
              📢 എല്ലാ വിദ്യാർത്ഥികളും കൃത്യസമയത്ത് പരീക്ഷാ ഹാളിൽ ഹാജരാകേണ്ടതാണ്. (All students must arrive on time for exams)
            </div>
          </div>

          {/* CARD 4: MASTER LIST (EMERALD EXECUTIVE) */}
          <div
            id="png-export-card-master_list"
            className="p-8 space-y-6 font-sans"
            style={{ width: "900px", backgroundColor: "#ffffff", color: "#0f172a", border: "4px solid #064e3b", borderRadius: "16px" }}
          >
            <div className="text-center pb-4 space-y-2" style={{ borderBottom: "2px solid #d97706" }}>
              <div className="text-xs font-black font-mono tracking-widest uppercase" style={{ color: "#b45309" }}>
                CONSOLIDATED CLASS MASTER SEATING ROSTER
              </div>
              <h2 className="text-2xl font-black font-display uppercase tracking-tight" style={{ color: "#064e3b" }}>
                {madrasaName || "HIDAYATHUL ISLAM HIGHER SECONDARY MADRASA"}
              </h2>
              <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "#047857" }}>
                CONSOLIDATED MASTER SEATING LIST — {displayScopeTitle}
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs" style={{ border: "1px solid #cbd5e1" }}>
              <thead>
                <tr className="font-black text-xs uppercase" style={{ backgroundColor: "#064e3b", color: "#ffffff", borderBottom: "2px solid #d97706" }}>
                  <th className="p-2.5 text-center w-12" style={{ border: "1px solid #022c22" }}>#</th>
                  <th className="p-2.5 w-24" style={{ border: "1px solid #022c22" }}>Adm No</th>
                  <th className="p-2.5" style={{ border: "1px solid #022c22" }}>Student Name</th>
                  <th className="p-2.5 text-center w-16" style={{ border: "1px solid #022c22" }}>Div</th>
                  <th className="p-2.5 text-center w-16" style={{ border: "1px solid #022c22" }}>Gender</th>
                  <th className="p-2.5" style={{ border: "1px solid #022c22" }}>Hall Name</th>
                  <th className="p-2.5 text-center w-28" style={{ border: "1px solid #022c22" }}>Bench / Seat</th>
                </tr>
              </thead>
              <tbody>
                {renderTableRowsWithDivisions(7, (st, idx) => {
                  const sInfo = studentSeatingMap.get(st.id);
                  return (
                    <tr key={st.id} style={{ backgroundColor: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                      <td className="p-2 text-center font-bold font-mono" style={{ border: "1px solid #cbd5e1" }}>{idx}</td>
                      <td className="p-2 font-mono font-bold" style={{ border: "1px solid #cbd5e1" }}>{st.admissionNumber || st.rollNo || "-"}</td>
                      <td className="p-2 font-extrabold" style={{ border: "1px solid #cbd5e1", color: "#0f172a" }}>{st.name}</td>
                      <td className="p-2 text-center font-bold" style={{ border: "1px solid #cbd5e1", color: "#047857" }}>{st.division || "A"}</td>
                      <td className="p-2 text-center font-bold" style={{ border: "1px solid #cbd5e1" }}>{st.gender || "Boy"}</td>
                      <td className="p-2 font-bold" style={{ border: "1px solid #cbd5e1", color: "#064e3b" }}>{sInfo?.hallName || "Unassigned"}</td>
                      <td className="p-2 text-center font-mono" style={{ border: "1px solid #cbd5e1" }}>
                        {sInfo ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-2xs font-bold" style={{ backgroundColor: "#ecfdf5", color: "#047857", border: "1px solid #6ee7b7" }}>
                            B#{sInfo.benchNo} ({sInfo.seatLetter})
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-2xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* CARD 5: FULL REGISTER (EMERALD EXECUTIVE) */}
          <div
            id="png-export-card-full_register"
            className="p-8 space-y-6 font-sans"
            style={{ width: "900px", backgroundColor: "#ffffff", color: "#0f172a", border: "4px solid #064e3b", borderRadius: "16px" }}
          >
            <div className="text-center pb-4 space-y-2" style={{ borderBottom: "2px solid #d97706" }}>
              <div className="text-xs font-black font-mono tracking-widest uppercase" style={{ color: "#b45309" }}>
                OFFICIAL CLASS ATTENDANCE & ROLL CALL REGISTER
              </div>
              <h2 className="text-2xl font-black font-display uppercase tracking-tight" style={{ color: "#064e3b" }}>
                {madrasaName || "HIDAYATHUL ISLAM HIGHER SECONDARY MADRASA"}
              </h2>
              <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "#047857" }}>
                CLASS ATTENDANCE & EXAM ROLL REGISTER — {displayScopeTitle}
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs" style={{ border: "1px solid #cbd5e1" }}>
              <thead>
                <tr className="font-black text-xs uppercase" style={{ backgroundColor: "#064e3b", color: "#ffffff", borderBottom: "2px solid #d97706" }}>
                  <th className="p-2.5 text-center w-12" style={{ border: "1px solid #022c22" }}>Roll</th>
                  <th className="p-2.5 w-24" style={{ border: "1px solid #022c22" }}>Adm No</th>
                  <th className="p-2.5" style={{ border: "1px solid #022c22" }}>Student Name</th>
                  <th className="p-2.5 text-center w-16" style={{ border: "1px solid #022c22" }}>Div</th>
                  <th className="p-2.5 text-center w-24" style={{ border: "1px solid #022c22" }}>Day 1</th>
                  <th className="p-2.5 text-center w-24" style={{ border: "1px solid #022c22" }}>Day 2</th>
                  <th className="p-2.5 text-center w-24" style={{ border: "1px solid #022c22" }}>Day 3</th>
                  <th className="p-2.5 text-center w-24" style={{ border: "1px solid #022c22" }}>Day 4</th>
                </tr>
              </thead>
              <tbody>
                {renderTableRowsWithDivisions(8, (st, idx) => (
                  <tr key={st.id} style={{ backgroundColor: idx % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                    <td className="p-2.5 text-center font-bold font-mono" style={{ border: "1px solid #cbd5e1" }}>{idx}</td>
                    <td className="p-2.5 font-mono font-bold" style={{ border: "1px solid #cbd5e1" }}>{st.admissionNumber || st.rollNo || "-"}</td>
                    <td className="p-2.5 font-extrabold" style={{ border: "1px solid #cbd5e1", color: "#0f172a" }}>{st.name}</td>
                    <td className="p-2.5 text-center font-bold" style={{ border: "1px solid #cbd5e1", color: "#047857" }}>{st.division || "A"}</td>
                    <td className="p-2.5 text-center" style={{ border: "1px solid #cbd5e1" }}></td>
                    <td className="p-2.5 text-center" style={{ border: "1px solid #cbd5e1" }}></td>
                    <td className="p-2.5 text-center" style={{ border: "1px solid #cbd5e1" }}></td>
                    <td className="p-2.5 text-center" style={{ border: "1px solid #cbd5e1" }}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            {lang === "ml"
              ? "💡 നിങ്ങളുടെ ക്ലാസ്സിലെയും ഹാളിലെയും വിവരങ്ങൾ വാട്സ്ആപ്പ് ഇമേജുകളായി സെക്കൻഡുകൾക്കുള്ളിൽ പങ്കുവെക്കാം."
              : "💡 Share crisp class & hall PNG cards directly to WhatsApp groups."}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            {lang === "ml" ? "അടയ്ക്കുക" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
