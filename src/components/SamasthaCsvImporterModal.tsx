import React, { useState, useMemo } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  FileText,
  AlertTriangle,
  Users,
  ClipboardList,
  Sparkles,
  Layers,
  Check,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Student } from "../types";

interface SamasthaCsvImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportStudents: (importedStudents: Student[]) => void;
  defaultClass?: string;
  defaultDivision?: string;
  existingStudentsCount?: number;
  existingStudents?: Student[];
  isDark?: boolean;
}

// Mojibake decoder to restore genuine Arabic text from UTF-8 / Windows-1256 misinterpretations
export function fixArabicMojibake(str: string): string {
  if (!str) return "";
  const trimmed = str.trim();
  try {
    if (/[ØÙ]/i.test(trimmed)) {
      const bytes = new Uint8Array(trimmed.split("").map((c) => c.charCodeAt(0) & 0xff));
      const decoded = new TextDecoder("utf-8").decode(bytes);
      if (decoded && !decoded.includes("\ufffd")) {
        return decoded.trim();
      }
    }
  } catch (e) {}
  return trimmed;
}

// Robust CSV row splitter that handles quoted commas, tabs, or semicolons
export function parseCSVLine(line: string, delimiter: string = ","): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^"(.*)"$/, "$1"));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"(.*)"$/, "$1"));
  return result;
}

function detectDelimiter(firstLine: string): string {
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  if (tabs > commas && tabs > semicolons) return "\t";
  if (semicolons > commas) return ";";
  return ",";
}

export function normalizeClassLevel(raw: string | number | undefined | null): string {
  if (!raw && raw !== 0) return "Class 1";
  const str = String(raw).trim();
  const digitMatch = str.match(/\d+/);
  if (digitMatch) {
    return `Class ${parseInt(digitMatch[0], 10)}`;
  }
  const romanMap: Record<string, number> = {
    i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6,
    vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12
  };
  const lower = str.toLowerCase().replace(/[^a-z]/g, "");
  if (romanMap[lower]) {
    return `Class ${romanMap[lower]}`;
  }
  return str.startsWith("Class ") ? str : `Class ${str}`;
}

export function getClassBadgeStyle(classLevel: string) {
  const digits = classLevel.match(/\d+/);
  const num = digits ? parseInt(digits[0], 10) : 0;
  switch (num) {
    case 1: return "bg-blue-100 text-blue-900 border-blue-300";
    case 2: return "bg-emerald-100 text-emerald-900 border-emerald-300";
    case 3: return "bg-purple-100 text-purple-900 border-purple-300";
    case 4: return "bg-amber-100 text-amber-900 border-amber-300";
    case 5: return "bg-rose-100 text-rose-900 border-rose-300";
    case 6: return "bg-cyan-100 text-cyan-900 border-cyan-300";
    case 7: return "bg-indigo-100 text-indigo-900 border-indigo-300";
    case 8: return "bg-teal-100 text-teal-900 border-teal-300";
    case 9: return "bg-orange-100 text-orange-900 border-orange-300";
    case 10: return "bg-red-100 text-red-900 border-red-300";
    case 11: return "bg-violet-100 text-violet-900 border-violet-300";
    case 12: return "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300";
    default: return "bg-slate-100 text-slate-900 border-slate-300";
  }
}

export default function SamasthaCsvImporterModal({
  isOpen,
  onClose,
  onImportStudents,
  defaultClass = "Class 1",
  defaultDivision = "A",
  existingStudentsCount = 0,
  isDark = false,
}: SamasthaCsvImporterModalProps) {
  // "class_wise": Individual class & division CSVs (default active)
  // "admission_register": Single file for entire madrasa (temporarily disabled as requested)
  const [activeTab, setActiveTab] = useState<"admission_register" | "class_wise">("class_wise");

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");

  const [targetClass, setTargetClass] = useState<string>(defaultClass);
  const [targetDivision, setTargetDivision] = useState<string>(defaultDivision);
  const [parsedStudents, setParsedStudents] = useState<Student[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Detected classes inside parsed data
  const [detectedMultipleClasses, setDetectedMultipleClasses] = useState<string[]>([]);
  // Selected classes to import from Admission Register (by default: all classes in data)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const parseTextContent = (text: string, sourceName: string, mode: "admission_register" | "class_wise") => {
    if (!text || !text.trim()) {
      setErrorMsg("ഫയലിൽ വിവരങ്ങൾ ഒന്നും കണ്ടെത്താൻ കഴിഞ്ഞില്ല.");
      setIsProcessing(false);
      return;
    }

    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setErrorMsg("ഈ ഡാറ്റയിൽ ആവശ്യമായ വരികൾ ഇല്ല. കുറഞ്ഞത് തലക്കെട്ടും (Header) ഒരു വിദ്യാർത്ഥിയുടെ വിവരവും വേണം.");
      setIsProcessing(false);
      return;
    }

    const delimiter = detectDelimiter(lines[0]);
    // Header detection
    const headerCols = parseCSVLine(lines[0], delimiter).map((h) =>
      h.toLowerCase().replace(/[^a-z0-9]/g, "")
    );

    // Find column indices
    const idIdx = headerCols.findIndex((h) => h === "samasthaid" || h === "studentid" || h === "regid" || h === "registrationid" || h === "id" || h === "uid");
    
    // Explicit Roll Number column in CSV
    const rollNoIdx = headerCols.findIndex((h) => h === "rollno" || h === "roll" || h === "rollnumber" || h === "classrollno" || h.includes("rollno") || h.includes("rollnum"));

    const nameIdx = headerCols.findIndex(
      (h) => (h === "name" || h === "studentname" || h.includes("name")) && !h.includes("arabic") && !h.includes("father") && !h.includes("mother")
    );
    
    const fatherIdx = headerCols.findIndex((h) => (h === "father" || h.includes("father") || h.includes("guardian") || h.includes("parent")) && !h.includes("arabic"));
    
    const dobIdx = headerCols.findIndex((h) => h === "dob" || h.includes("birth"));
    
    const aadhaarIdx = headerCols.findIndex((h) => h.includes("adhaar") || h.includes("aadhaar") || h.includes("adhar"));
    
    const genderIdx = headerCols.findIndex((h) => h === "gender" || h.includes("gender") || h.includes("sex"));
    
    const addressIdx = headerCols.findIndex((h) => h.includes("permanentaddress") || h.includes("address") || h.includes("place"));
    
    const mobileIdx = headerCols.findIndex((h) => h.includes("mobile") || h.includes("phone") || h.includes("contact") || h.includes("whatsapp"));
    
    // Adm. No (specifically avoiding Adm. Date and Roll No)
    const admNoIdx = headerCols.findIndex((h) => (h === "admno" || h === "adno" || h.includes("adm") || h.includes("admission")) && !h.includes("date") && !h.includes("roll"));
    
    // Class column (e.g. "Class", "Std")
    const classIdx = headerCols.findIndex((h) => h === "class" || h === "std" || h === "standard" || h.startsWith("class"));
    
    // Division column if present
    const divIdx = headerCols.findIndex((h) => h === "division" || h === "div" || h === "section");

    const studentsList: Student[] = [];
    const classesSeen = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i], delimiter);
      if (row.length < 2) continue;

      const rawName = (nameIdx !== -1 ? row[nameIdx] : row[2]) || "";
      if (!rawName.trim()) continue;


      const rawAdm = (admNoIdx !== -1 ? row[admNoIdx] : row[11]) || "";
      const admissionNumber = rawAdm.trim() || `ADM-${i}`;

      const rawRoll = (rollNoIdx !== -1 ? row[rollNoIdx] : "") || "";

      const rawDob = (dobIdx !== -1 ? row[dobIdx] : row[6]) || "";
      const rawAadhaar = (aadhaarIdx !== -1 ? row[aadhaarIdx] : "") || "";
      const rawGender = (genderIdx !== -1 ? row[genderIdx] : row[7]) || "MALE";
      const gender: "Male" | "Female" = rawGender.toUpperCase().includes("FEM") ? "Female" : "Male";

      const rawFather = (fatherIdx !== -1 ? row[fatherIdx] : row[4]) || "";
      const rawPhone = (mobileIdx !== -1 ? row[mobileIdx] : row[9]) || "";
      const rawAddress = (addressIdx !== -1 ? row[addressIdx] : row[8]) || "";
      const rawSamasthaId = (idIdx !== -1 ? row[idIdx] : (headerCols.length > 1 && headerCols[1] === "id" ? row[1] : "")) || "";

      // Store default fallback accessPin from Aadhaar last 4 or Adm No
      const cleanAadhaar = rawAadhaar.replace(/\D/g, "");
      const pin =
        cleanAadhaar.length >= 4
          ? cleanAadhaar.slice(-4)
          : admissionNumber.replace(/\D/g, "").slice(-4) || admissionNumber || "1234";

      // Class assignment logic:
      let studentClass = targetClass;
      let studentDiv = targetDivision || "A";

      if (mode === "admission_register") {
        // In Admission Register, read class directly from student's row
        if (classIdx !== -1 && row[classIdx]) {
          studentClass = normalizeClassLevel(row[classIdx]);
        } else if (row[12]) {
          studentClass = normalizeClassLevel(row[12]);
        }
        // Division is always 'A' for single-division madrasas
        studentDiv = "A";
      } else {
        // In Class-wise mode:
        // Use user selected targetClass & targetDivision
        studentClass = targetClass;
        studentDiv = targetDivision || "A";
        // If file happens to specify a division column, respect it
        if (divIdx !== -1 && row[divIdx]) {
          studentDiv = row[divIdx].trim().toUpperCase() || studentDiv;
        }
      }

      if (studentClass) {
        classesSeen.add(studentClass);
      }

      studentsList.push({
        id: `st-samastha-${rawSamasthaId || admissionNumber}-${Date.now()}-${i}`,
        admissionNumber,
        rollNo: rawRoll.trim() || undefined,
        rollNumber: rawRoll.trim() || undefined,
        name: rawName.trim(),
        gender,
        classLevel: studentClass,
        division: studentDiv,
        shift: "Shift 1",
        dob: rawDob.trim(),
        fatherName: rawFather.trim(),
        phone: rawPhone.trim(),
        address: rawAddress.trim(),
        aadhaar: rawAadhaar.trim(),
        samasthaId: rawSamasthaId.trim() || undefined,
        accessPin: pin,
      });
    }

    if (studentsList.length === 0) {
      setErrorMsg("ഫയലിൽ സാധുവായ വിദ്യാർത്ഥികളുടെ വിവരങ്ങൾ കണ്ടെത്താനായില്ല. സമസ്ത പോർട്ടലിൽ നിന്നും ഡൗൺലോഡ് ചെയ്ത ശരിയായ CSV അല്ലെങ്കിൽ Excel ഫയൽ തന്നെയെന്ന് ഉറപ്പാക്കുക.");
    } else {
      const sortedClasses = Array.from(classesSeen).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, "") || "0", 10);
        const numB = parseInt(b.replace(/\D/g, "") || "0", 10);
        return numA - numB;
      });

      setParsedStudents(studentsList);
      setDetectedMultipleClasses(sortedClasses);
      // Pre-select all detected classes by default
      setSelectedClasses(sortedClasses);
      setErrorMsg(null);
    }
    setIsProcessing(false);
  };

  const processFile = async (selectedFile: File, mode = activeTab) => {
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const lowerName = selectedFile.name.toLowerCase();
      // Check if file is Excel (.xlsx or .xls)
      if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csvText = XLSX.utils.sheet_to_csv(worksheet);
        setRawText(csvText);
        parseTextContent(csvText, selectedFile.name, mode);
        return;
      }

      // Check if file is CSV / text
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          setRawText(text || "");
          // In case an Excel file was uploaded with .csv or generic extension
          if (text && (text.startsWith("PK\x03\x04") || text.includes("\x00\x00"))) {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: "array" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const csvText = XLSX.utils.sheet_to_csv(worksheet);
            setRawText(csvText);
            parseTextContent(csvText, selectedFile.name, mode);
          } else {
            parseTextContent(text, selectedFile.name, mode);
          }
        } catch (innerErr: any) {
          console.error("File text parse error:", innerErr);
          setErrorMsg("ഫയൽ വായിച്ചപ്പോൾ തടസ്സമുണ്ടായി: " + (innerErr.message || "Invalid file"));
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setErrorMsg("ഫയൽ തുറക്കാൻ സാധിച്ചില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.");
        setIsProcessing(false);
      };
      reader.readAsText(selectedFile);
    } catch (err: any) {
      console.error("General file processing error:", err);
      setErrorMsg("ഫയൽ പ്രോസസ്സ് ചെയ്യുന്നതിൽ തടസ്സമുണ്ടായി: " + (err.message || "Failed"));
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    processFile(uploadedFile, activeTab);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    processFile(droppedFile, activeTab);
  };

  const handleSwitchTab = (newTab: "admission_register" | "class_wise") => {
    setActiveTab(newTab);
    // If rawText already exists, immediately re-parse with the new mode
    if (rawText) {
      setIsProcessing(true);
      setTimeout(() => {
        parseTextContent(rawText, fileName, newTab);
      }, 50);
    }
  };

  // Breakdown by class for Admission Register
  const classBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    parsedStudents.forEach((st) => {
      const cls = st.classLevel || "Class 1";
      counts[cls] = (counts[cls] || 0) + 1;
    });
    // Sort logically by class number
    return Object.entries(counts).sort((a, b) => {
      const numA = parseInt(a[0].replace(/\D/g, "") || "0", 10);
      const numB = parseInt(b[0].replace(/\D/g, "") || "0", 10);
      return numA - numB;
    });
  }, [parsedStudents]);

  // Filtered students based on selected classes (in Admission Register mode)
  const filteredStudents = useMemo(() => {
    if (activeTab === "admission_register") {
      if (selectedClasses.length === 0) return [];
      return parsedStudents.filter((st) => selectedClasses.includes(st.classLevel || "Class 1"));
    }
    return parsedStudents;
  }, [activeTab, parsedStudents, selectedClasses]);

  const boysCount = filteredStudents.filter((s) => s.gender === "Male").length;
  const girlsCount = filteredStudents.filter((s) => s.gender === "Female").length;

  const handleApplyImport = () => {
    if (filteredStudents.length === 0) return;

    if (activeTab === "admission_register") {
      // In Admission Register mode, preserve each student's class and default division to A
      const updated = filteredStudents.map((st) => ({
        ...st,
        classLevel: st.classLevel || "Class 1",
        division: "A",
      }));
      onImportStudents(updated);
      onClose();
    } else {
      // In Class & Division mode, apply selected targetClass & targetDivision
      const updated = parsedStudents.map((st) => ({
        ...st,
        classLevel: targetClass,
        division: targetDivision || "A",
      }));
      onImportStudents(updated);
      onClose();
    }
  };

  const allDetectedClassesList = classBreakdown.map(([cls]) => cls);
  const isAllClassesSelected = allDetectedClassesList.length > 0 && selectedClasses.length === allDetectedClassesList.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[94vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-emerald-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  സമസ്ത പോർട്ടൽ ഡാറ്റ ഇമ്പോർട്ട് (Import Samastha Students)
                </h3>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 hidden sm:inline-block">
                  online.samastha.info
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600">
                സമസ്ത ഓൺലൈൻ പോർട്ടലിലെ CSV അല്ലെങ്കിൽ Excel (.xlsx / .xls) ഫയൽ വഴി കുട്ടികളെ അപ്‌ലോഡ് ചെയ്യാം.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODE SELECTOR TABS */}
        <div className="p-3 bg-slate-100/80 border-b border-slate-200 grid grid-cols-2 gap-2 shrink-0">
          <button
            type="button"
            disabled={true}
            className="p-2.5 sm:p-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-xs border border-slate-200/80 bg-slate-100/60 text-slate-400 opacity-60 cursor-not-allowed select-none"
            title="ഈ ടാബ് ഇപ്പോൾ താൽക്കാലികമായി നിർത്തിവെച്ചിരിക്കുന്നു (Temporarily Disabled)"
          >
            <ClipboardList className="w-4 h-4 shrink-0 text-slate-400" />
            <div className="text-left">
              <div className="flex items-center gap-1.5 font-extrabold">
                <span className="line-through decoration-slate-400">സമസ്ത അഡ്മിഷൻ രജിസ്റ്റർ</span>
                <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md font-bold">
                  താൽക്കാലികമായി നിർത്തിവെച്ചു (Disabled)
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-normal hidden sm:block">
                ക്ലാസ്സ് & ഡിവിഷൻ ലിസ്റ്റ് ടാബ് ഉപയോഗിക്കുക
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab("class_wise")}
            className={`p-2.5 sm:p-3 rounded-2xl font-bold transition flex items-center justify-center gap-2 text-xs cursor-pointer border ${
              activeTab === "class_wise"
                ? "bg-white text-emerald-900 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20"
                : "bg-transparent text-slate-600 border-transparent hover:bg-white/60 hover:text-slate-900"
            }`}
          >
            <Users className={`w-4 h-4 shrink-0 ${activeTab === "class_wise" ? "text-emerald-600" : "text-slate-400"}`} />
            <div className="text-left">
              <div className="flex items-center gap-1.5 font-extrabold">
                <span>ക്ലാസ്സ് & ഡിവിഷൻ ലിസ്റ്റ്</span>
                <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-md font-bold">
                  Divisions (A, B, C)
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-normal hidden sm:block">
                ഓരോ ക്ലാസ്സും ഡിവിഷനും പ്രത്യേകം ഡൗൺലോഡ് ചെയ്ത് അപ്‌ലോഡ് ചെയ്യാൻ
              </p>
            </div>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">

          {/* TAB 1 CONTENT: ADMISSION REGISTER (ALL CLASSES IN 1 FILE) */}
          {activeTab === "admission_register" && (
            <div className="space-y-4">
              {/* CRITICAL WARNING / DISCLAIMER CARD */}
              <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300 text-amber-950 space-y-2 shadow-xs">
                <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>പ്രത്യേക ശ്രദ്ധയ്ക്ക് (Important Notice for Admission Register):</span>
                </div>
                
                <p className="text-xs font-semibold leading-relaxed text-amber-900">
                  സമസ്ത അഡ്മിഷൻ രജിസ്റ്റർ (Admission Register) ഫയലിൽ <strong>ക്ലാസ്സ് (Class)</strong> വിവരങ്ങൾ മാത്രമേ ഉള്ളൂ; <strong>ഡിവിഷൻ (A, B, C...) രേഖപ്പെടുത്തിയിട്ടില്ല</strong>.
                </p>

                <div className="p-3 bg-white/90 rounded-xl border border-amber-200 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="font-bold text-slate-800 leading-relaxed">
                      <span className="text-emerald-800 font-black">✅ ഡിവിഷൻ ഇല്ലാത്ത മദ്റസകൾക്ക് മാത്രം (Single Division):</span> നിങ്ങളുടെ മദ്റസയിൽ ക്ലാസ്സുകൾക്ക് പ്രത്യേക ഡിവിഷനുകൾ ഇല്ലെങ്കിൽ, ഈ ഒരൊറ്റ ഫയൽ അപ്‌ലോഡ് ചെയ്ത് 1 മുതൽ 12 വരെയുള്ള <strong>മുഴുവൻ ക്ലാസ്സുകളിലെയും കുട്ടികളെ ഒറ്റ ക്ലിക്കിൽ</strong> ഇവിടെ ഇമ്പോർട്ട് ചെയ്യാം!
                    </p>
                  </div>
                  <div className="flex items-start gap-2 pt-1 border-t border-amber-100">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <p className="font-bold text-slate-700 leading-relaxed">
                      <span className="text-rose-700 font-black">⚠️ ഡിവിഷൻ ഉള്ള മദ്റസകൾ:</span> നിങ്ങളുടെ മദ്റസയിൽ ഒരേ ക്ലാസ്സിന് ഒന്നിലധികം ഡിവിഷനുകൾ (ഉദാ: 5A, 5B, 5C...) ഉണ്ടെങ്കിൽ, <strong>ദയവായി ഈ ടാബ് ഉപയോഗിക്കരുത്</strong>. പകരം മുകളിലെ രണ്ടാമത്തെ ടാബ് ആയ <strong>'ക്ലാസ്സ് & ഡിവിഷൻ ലിസ്റ്റ്'</strong> വഴി ഓരോ ഡിവിഷനിലെയും ഫയലുകൾ പ്രത്യേകം അപ്‌ലോഡ് ചെയ്യുക.
                    </p>
                  </div>
                </div>
              </div>

              {/* HOW TO GET ADMISSION REGISTER BANNER */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">1</span>
                    <span>സമസ്ത പോർട്ടലിൽ നിന്നും അഡ്മിഷൻ രജിസ്റ്റർ ഡൗൺലോഡ് ചെയ്യുക:</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    സമസ്ത സൈറ്റിൽ ലോഗിൻ ചെയ്ത് <strong>Admission Register</strong> പേജിൽ നിന്നും CSV അല്ലെങ്കിൽ Excel ഫയൽ ഡൗൺലോഡ് ചെയ്യുക.
                  </p>
                </div>

                <a
                  href="https://online.samastha.info/madrasa/students.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer text-xs"
                >
                  <span>🌐 സമസ്ത പോർട്ടൽ</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 2 CONTENT: CLASS & DIVISION WISE (FOR MADRASAS WITH DIVISIONS) */}
          {activeTab === "class_wise" && (
            <div className="space-y-4">
              {/* STEP 1: SAMASTHA DIRECT PORTAL LINK BANNER */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">1</span>
                    <span>സമസ്ത പോർട്ടലിൽ നിന്നും ക്ലാസ്സ്/ഡിവിഷൻ ഫയൽ ഡൗൺലോഡ് ചെയ്യുക:</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    ക്ലാസ്സും ഡിവിഷനും തിരഞ്ഞെടുത്ത് വിദ്യാർത്ഥികളുടെ ലിസ്റ്റ് <strong>CSV</strong> അല്ലെങ്കിൽ <strong>Excel</strong> ആയി ഡൗൺലോഡ് ചെയ്യുക.
                  </p>
                </div>

                <a
                  href="https://online.samastha.info/madrasa/students.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer text-xs"
                >
                  <span>🌐 പോർട്ടൽ തുറക്കുക</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* STEP 2: TARGET CLASS & DIVISION SELECTORS */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ക്ലാസ്സ് (Target Class):
                    </label>
                    <select
                      value={targetClass}
                      onChange={(e) => setTargetClass(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs outline-none focus:border-emerald-600"
                    >
                      {["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ഡിവിഷൻ (Division):
                    </label>
                    <select
                      value={targetDivision}
                      onChange={(e) => setTargetDivision(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs outline-none focus:border-emerald-600"
                    >
                      {["A", "B", "C", "D", "E", "General"].map((d) => (
                        <option key={d} value={d}>Division {d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 bg-white rounded-xl p-2.5 border border-slate-200">
                  ℹ️ നിങ്ങൾ അപ്‌ലോഡ് ചെയ്യുന്ന ഫയലിലെ എല്ലാ കുട്ടികളെയും <strong>{targetClass} - Division {targetDivision}</strong> ലേക്ക് ചേർക്കുന്നതാണ്.
                </p>
              </div>

              {/* SMART NOTIFICATION IF MULTIPLE CLASSES DETECTED IN THIS FILE */}
              {detectedMultipleClasses.length > 1 && (
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-xs flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>ഈ ഫയലിൽ ഒന്നിലധികം ക്ലാസ്സുകളുണ്ട് ({detectedMultipleClasses.length} ക്ലാസ്സുകൾ)!</span>
                    </p>
                    <p className="text-[11px] text-blue-700">
                      ഇത് അഡ്മിഷൻ രജിസ്റ്റർ ആണെങ്കിൽ, ക്ലാസ്സ് നഷ്ടപ്പെടാതെ എല്ലാ ക്ലാസ്സുകളിലേക്കും ഒരുമിച്ച് അപ്‌ലോഡ് ചെയ്യാൻ 'അഡ്മിഷൻ രജിസ്റ്റർ' മോഡിലേക്ക് മാറാം.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSwitchTab("admission_register")}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition text-[11px] shrink-0 cursor-pointer shadow-xs"
                  >
                    അഡ്മിഷൻ രജിസ്റ്ററിലേക്ക് മാറുക
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: UNIFIED FILE SELECTION DROPZONE & BUTTON */}
          <div className="space-y-3 pt-1">
            {/* HIDDEN INPUT FOR FILE SELECTION */}
            <input
              id="samastha-file-input"
              type="file"
              accept=".csv,.xlsx,.xls,.tsv,.txt,text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* DROP AREA */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-5 sm:p-6 text-center transition cursor-pointer ${
                file
                  ? "border-emerald-500 bg-emerald-50/50"
                  : "border-slate-300 hover:border-emerald-500 hover:bg-slate-50"
              }`}
              onClick={() => document.getElementById("samastha-file-input")?.click()}
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2.5">
                <Upload className="w-6 h-6" />
              </div>

              {fileName ? (
                <div className="space-y-1">
                  <p className="font-extrabold text-sm text-emerald-950 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{fileName}</span>
                  </p>
                  <p className="text-[11px] text-emerald-700">മറ്റൊരു ഫയൽ മാറ്റാൻ ഇവിടെ വീണ്ടും ക്ലിക്ക് ചെയ്യുക</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-bold text-sm text-slate-800">
                    {activeTab === "admission_register"
                      ? "സമസ്ത അഡ്മിഷൻ രജിസ്റ്റർ CSV അല്ലെങ്കിൽ Excel ഫയൽ ഇവിടെ ഇടുക"
                      : "സമസ്ത ക്ലാസ്സ് ലിസ്റ്റ് CSV അല്ലെങ്കിൽ Excel ഫയൽ ഇവിടെ ഇടുക"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    .CSV, .XLSX, .XLS ഫോർമാറ്റിലുള്ള ഫയലുകൾ സപ്പോർട്ട് ചെയ്യുന്നു (Drag & Drop or Click)
                  </p>
                </div>
              )}
            </div>

            {/* SINGLE UNIFIED BUTTON FOR FILE SELECTION */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => document.getElementById("samastha-file-input")?.click()}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold rounded-2xl transition flex items-center justify-center gap-2.5 cursor-pointer shadow-md text-xs sm:text-sm"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-100" />
                <span>ഫയൽ തിരഞ്ഞെടുക്കുക (Select CSV / Excel)</span>
              </button>
            </div>

            <p className="text-center text-[11px] text-slate-500">
              💡 ഫോണിലും (Android) കമ്പ്യൂട്ടറിലും സമസ്തയിൽ നിന്നുള്ള ഫയലുകൾ ഈ ഒറ്റ ബട്ടൺ വഴി നേരിട്ട് തിരഞ്ഞെടുക്കാം.
            </p>
          </div>

          {/* ERROR ALERT */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* PARSED PREVIEW STATS & CLASS CHOOSER */}
          {parsedStudents.length > 0 && (
            <div className="space-y-3 pt-2">
              
              {/* ADMISSION REGISTER CLASS SELECTION BOX (CHOOSE SPECIFIC CLASSES OR ALL CLASSES) */}
              {activeTab === "admission_register" && classBreakdown.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm text-emerald-950">
                        <Layers className="w-4 h-4 text-emerald-700" />
                        <span>ഇമ്പോർട്ട് ചെയ്യേണ്ട ക്ലാസ്സുകൾ തിരഞ്ഞെടുക്കുക (Select Classes to Import):</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        ആവശ്യമുള്ള ക്ലാസ്സുകൾ മാത്രം ടിക്ക് ചെയ്യാം, അല്ലെങ്കിൽ എല്ലാ ക്ലാസ്സുകളും ഒരുമിച്ച് തിരഞ്ഞെടുക്കാം.
                      </p>
                    </div>

                    {/* QUICK TOGGLE BUTTONS */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedClasses(allDetectedClassesList)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                          isAllClassesSelected
                            ? "bg-emerald-700 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-500/30"
                            : "bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                        }`}
                      >
                        ✓ എല്ലാ ക്ലാസ്സുകളും ({parsedStudents.length})
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setSelectedClasses([])}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        ✕ എല്ലാം ഒഴിവാക്കുക
                      </button>
                    </div>
                  </div>

                  {/* SELECTABLE CLASS PILLS */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
                    {classBreakdown.map(([cls, count]) => {
                      const isSelected = selectedClasses.includes(cls);
                      return (
                        <button
                          type="button"
                          key={cls}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedClasses(selectedClasses.filter((c) => c !== cls));
                            } else {
                              setSelectedClasses([...selectedClasses, cls]);
                            }
                          }}
                          className={`p-2 rounded-xl text-xs font-black transition flex items-center justify-between gap-2 cursor-pointer border shadow-2xs ${
                            isSelected
                              ? `${getClassBadgeStyle(cls)} ring-2 ring-emerald-500/40 shadow-xs scale-[1.01]`
                              : "bg-white text-slate-400 border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 border ${
                              isSelected ? "bg-emerald-600 text-white border-emerald-700" : "bg-slate-100 text-transparent border-slate-300"
                            }`}>
                              {isSelected ? "✓" : ""}
                            </div>
                            <span className="truncate">{cls}</span>
                          </div>
                          
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                            isSelected ? "bg-white/90 text-slate-900" : "bg-slate-100 text-slate-500"
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* SELECTION SUMMARY STATUS BAR */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-2 border-t border-emerald-200/80 font-bold">
                    <span className="text-slate-700">
                      തിരഞ്ഞെടുത്ത ക്ലാസ്സുകൾ: <strong className="text-emerald-950 font-black">{selectedClasses.length} / {classBreakdown.length}</strong>
                    </span>
                    <span className="text-emerald-900">
                      ഇമ്പോർട്ട് ചെയ്യുന്ന കുട്ടികൾ: <strong className="text-emerald-950 font-black">{filteredStudents.length} / {parsedStudents.length}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* OVERALL STATS BAR */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-black text-sm text-slate-900">
                    {filteredStudents.length} കുട്ടികൾ ഇമ്പോർട്ടിനായി തയ്യാർ!
                  </span>
                  {activeTab === "admission_register" && filteredStudents.length !== parsedStudents.length && (
                    <span className="text-[11px] text-slate-500 font-normal">
                      (ആകെ {parsedStudents.length} കുട്ടികളിൽ)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-blue-800 bg-blue-100/80 px-2.5 py-0.5 rounded-lg border border-blue-200">
                    👦 ആൺകുട്ടികൾ: {boysCount}
                  </span>
                  <span className="text-pink-800 bg-pink-100/80 px-2.5 py-0.5 rounded-lg border border-pink-200">
                    👧 പെൺകുട്ടികൾ: {girlsCount}
                  </span>
                </div>
              </div>

              {/* WARNING IF NO CLASSES ARE CHECKED */}
              {activeTab === "admission_register" && selectedClasses.length === 0 && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>നിങ്ങൾ ക്ലാസ്സുകളൊന്നും തിരഞ്ഞെടുത്തിട്ടില്ല. മുകളിലെ ക്ലാസ്സ് ബാഡ്ജുകളിൽ ക്ലിക്ക് ചെയ്യുകയോ 'എല്ലാ ക്ലാസ്സുകളും' ബട്ടൺ അമർത്തുകയോ ചെയ്യുക.</span>
                </div>
              )}

              {/* STUDENT PREVIEW TABLE */}
              {filteredStudents.length > 0 && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 sticky top-0 text-[11px] font-extrabold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">റോൾ/Adm</th>
                        <th className="p-2.5">പേര് (Name)</th>
                        <th className="p-2.5">അറബിക് പേര്</th>
                        <th className="p-2.5">ക്ലാസ്സ് (Class)</th>
                        <th className="p-2.5">ലിംഗം</th>
                        <th className="p-2.5">ഫോൺ നമ്പർ</th>
                        <th className="p-2.5">രക്ഷിതാവ് (Father)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.slice(0, 20).map((st, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="p-2 font-mono font-bold text-slate-700">{st.admissionNumber}</td>
                          <td className="p-2 font-bold text-slate-900">{st.name}</td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${getClassBadgeStyle(st.classLevel || targetClass)}`}>
                              {st.classLevel || targetClass}
                            </span>
                          </td>
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              st.gender === "Male" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"
                            }`}>
                              {st.gender === "Male" ? "ആൺ" : "പെൺ"}
                            </span>
                          </td>
                          <td className="p-2 font-mono text-[11px] text-slate-600">{st.phone || "-"}</td>
                          <td className="p-2 text-slate-700 text-[11px]">{st.fatherName || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredStudents.length > 20 && (
                <p className="text-[10px] text-slate-500 text-center">
                  (ബാക്കി {filteredStudents.length - 20} കുട്ടികളുടെ വിവരങ്ങളും ഇമ്പോർട്ടിൽ ഉൾപ്പെടുന്നതാണ്)
                </p>
              )}
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 transition cursor-pointer text-xs"
          >
            റദ്ദാക്കുക (Cancel)
          </button>

          <button
            type="button"
            disabled={filteredStudents.length === 0 || isProcessing}
            onClick={handleApplyImport}
            className="px-5 sm:px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 text-xs sm:text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {activeTab === "admission_register"
                ? isAllClassesSelected
                  ? `മുഴുവൻ ക്ലാസ്സുകളിലെയും (${filteredStudents.length} കുട്ടികൾ) ഇമ്പോർട്ട് ചെയ്യുക`
                  : selectedClasses.length > 0
                  ? `തിരഞ്ഞെടുത്ത ${selectedClasses.length} ക്ലാസ്സുകളിലെ (${filteredStudents.length} കുട്ടികൾ) ഇമ്പോർട്ട് ചെയ്യുക`
                  : `ഒരു ക്ലാസ്സെങ്കിലും തിരഞ്ഞെടുക്കുക`
                : `${targetClass} (${targetDivision}) ലേക്ക് ${parsedStudents.length} കുട്ടികളെ ചേർക്കുക`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
