import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart3, 
  Share2, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Users, 
  Eye, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Copy, 
  MessageCircle, 
  FileText, 
  ArrowLeft,
  X,
  Lock,
  Unlock,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  Search,
  Settings,
  Printer,
  Award,
  BookOpen,
  HelpCircle,
  AlertTriangle,
  Calendar,
  Sun,
  Moon,
  Globe,
  FileSpreadsheet,
  ShieldCheck,
  KeyRound
} from "lucide-react";
import { 
  Student,
  StudentResultEntry, 
  MadrasaExamResult, 
  ExamTermType, 
  ExamResultSettings, 
  SubjectRule, 
  GradeRuleItem,
  ResultDisplayMode,
  PublicAccessSecurity,
  StudentPinSourceType,
  deriveStudentPin,
  getEffectiveStudentPinInfo,
  formatDobReadable
} from "../types";
import { getSubjectsForClass, SubjectItem, normalizeClassKey } from "../data/subjectDirectory";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { 
  DEFAULT_EXAM_SETTINGS, 
  OFFICIAL_BOARD_GRADE_RULES,
  OFFICIAL_SPECIAL_SUBJECT_RULES,
  evaluateSubjectScore, 
  getSubjectMarkRules, 
  calculateStudentOverallResult, 
  assignClassRanks 
} from "../utils/resultUtils";
import StudentResultPortal from "./StudentResultPortal";
import SamasthaCsvImporterModal from "./SamasthaCsvImporterModal";
import PrintableMarklistSheet from "./PrintableMarklistSheet";

interface ResultManagerProps {
  madrasaName: string;
  madrasaRegNo: string;
  madrasaPlace: string;
  madrasaPhone: string;
  workspaceStudents: any[];
  classTimetables?: Record<string, any[]>;
  activeTimetableId?: string;
  activeTimetableName?: string;
  onBackToWorkspace: () => void;
  onBackToLanding?: () => void;
  onOpenPublicResultPortal: () => void;
  onUpdateWorkspaceStudents?: (students: Student[]) => void;
}

const LOCAL_RESULTS_KEY = "madrasa_exam_results_store";

export function getLocalMadrasaResults(madrasaId: string, timetableId?: string): MadrasaExamResult {
  try {
    const storageKey = timetableId ? `${LOCAL_RESULTS_KEY}_${madrasaId}_${timetableId}` : `${LOCAL_RESULTS_KEY}_${madrasaId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.settings) {
        parsed.settings = DEFAULT_EXAM_SETTINGS;
      }
      return parsed;
    }
  } catch (e) {}

  return {
    id: `${madrasaId}_${timetableId || 'default'}_2026`,
    madrasaId: madrasaId || "my_madrasa",
    madrasaName: "മദ്റസ പരീക്ഷാ റിസൾട്ട്",
    examTitle: "പാദവാർഷിക പരീക്ഷാ ഫലം 2026",
    academicYear: "2025-2026",
    term: "quarterly",
    timetableId: timetableId,
    settings: DEFAULT_EXAM_SETTINGS,
    classes: {},
    isPubliclyPublished: true,
    updatedAt: new Date().toISOString()
  };
}

export function saveLocalMadrasaResults(data: MadrasaExamResult): void {
  try {
    const storageKey = data.timetableId ? `${LOCAL_RESULTS_KEY}_${data.madrasaId}_${data.timetableId}` : `${LOCAL_RESULTS_KEY}_${data.madrasaId}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
    localStorage.setItem(LOCAL_RESULTS_KEY, JSON.stringify(data));
  } catch (e) {}
}

export default function ResultManager({
  madrasaName,
  madrasaRegNo,
  madrasaPlace,
  madrasaPhone,
  workspaceStudents,
  classTimetables,
  activeTimetableId,
  activeTimetableName,
  onBackToWorkspace,
  onBackToLanding,
  onOpenPublicResultPortal,
  onUpdateWorkspaceStudents
}: ResultManagerProps) {
  const madrasaId = madrasaRegNo?.trim() || madrasaName?.toLowerCase().replace(/\s+/g, "_") || "demo_madrasa";

  const [resultsData, setResultsData] = useState<MadrasaExamResult>(() => {
    const loaded = getLocalMadrasaResults(madrasaId, activeTimetableId);
    return {
      ...loaded,
      madrasaName: madrasaName || loaded.madrasaName,
      regNo: madrasaRegNo || loaded.regNo,
      place: madrasaPlace || loaded.place,
      phone: madrasaPhone || loaded.phone,
      timetableId: activeTimetableId,
      timetableName: activeTimetableName,
      settings: loaded.settings || DEFAULT_EXAM_SETTINGS
    };
  });

  useEffect(() => {
    const loaded = getLocalMadrasaResults(madrasaId, activeTimetableId);
    setResultsData({
      ...loaded,
      madrasaName: madrasaName || loaded.madrasaName,
      regNo: madrasaRegNo || loaded.regNo,
      place: madrasaPlace || loaded.place,
      phone: madrasaPhone || loaded.phone,
      timetableId: activeTimetableId,
      timetableName: activeTimetableName,
      settings: loaded.settings || DEFAULT_EXAM_SETTINGS
    });
  }, [activeTimetableId, madrasaId, madrasaName, madrasaRegNo, madrasaPlace, madrasaPhone, activeTimetableName]);

  // Active Tab: Mark Entry, Tabulation Sheet, Settings, Portal Preview
  const [activeTab, setActiveTab] = useState<"mark_entry" | "tabulation" | "settings" | "portal_preview">("mark_entry");

  const [selectedClass, setSelectedClass] = useState<string>("Class 5");
  const [examTitle, setExamTitle] = useState<string>(resultsData.examTitle || "പാദവാർഷിക പരീക്ഷാ ഫലം 2026");
  const [academicYear, setAcademicYear] = useState<string>(resultsData.academicYear || "2025-2026");
  const [examTerm, setExamTerm] = useState<ExamTermType>(resultsData.term || "quarterly");

  // Exam and Pass Mark Settings
  const [examSettings, setExamSettings] = useState<ExamResultSettings>(() => {
    return resultsData.settings || DEFAULT_EXAM_SETTINGS;
  });

  // Selected students for bulk action
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  // Withhold modal state
  const [withholdModalStudent, setWithholdModalStudent] = useState<StudentResultEntry | null>(null);
  const [bulkWithholdModalOpen, setBulkWithholdModalOpen] = useState(false);
  const [withheldReasonText, setWithheldReasonText] = useState("ഫീസ് കുടിശ്ശിക (ദയവായി മദ്റസ ഓഫീസുമായി ബന്ധപ്പെടുക)");

  // Add custom subject column state
  const [newSubjectName, setNewSubjectName] = useState("");
  const [showAddSubjectInput, setShowAddSubjectInput] = useState(false);

  // Status & Feedback
  const [suiteTheme, setSuiteTheme] = useState<"light" | "dark">("light");
  const isDark = suiteTheme === "dark";
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSamasthaModalOpen, setIsSamasthaModalOpen] = useState(false);

  // Helper to get subjects for a class prioritizing Official Board Exam Timetable (classTimetables) then Master Syllabus Directory
  const getClassSubjectNames = (clsName: string): string[] => {
    const norm = normalizeClassKey(clsName);
    const plainNum = clsName.replace(/\D/g, "");
    const ttList =
      classTimetables?.[clsName] ||
      (plainNum ? classTimetables?.[`Class ${plainNum}`] || classTimetables?.[plainNum] : undefined) ||
      classTimetables?.[norm];

    if (Array.isArray(ttList) && ttList.length > 0) {
      const fromTt = ttList
        .map(item => {
          const rawSub = (item?.subject || "").trim();
          if (!rawSub || /^--/.test(rawSub)) return "";
          return rawSub.replace(/\s*\([^)]*[\u0600-\u06FF]+[^)]*\)\s*$/, "").trim() || rawSub;
        })
        .filter(Boolean);
      if (fromTt.length > 0) {
        return Array.from(new Set(fromTt));
      }
    }

    const syllabusList = getSubjectsForClass(clsName);
    if (syllabusList.length > 0) {
      return syllabusList.map(s => s.nameMl);
    }
    return ["ഖുർആൻ", "ഫിഖ്ഹ്", "അഖീദ", "താരീഖ്", "ലിസാൻ", "അഖ്‌ലാഖ്"];
  };

  // Import from Samastha Portal CSV
  const handleImportFromSamastha = (importedStudents: Student[]) => {
    if (!importedStudents || importedStudents.length === 0) return;

    const newEntries: StudentResultEntry[] = importedStudents.map((st, idx) => {
      const studentClass = st.classLevel || selectedClass;
      const defaultSubs = getClassSubjectNames(studentClass);
      const marksMap: Record<string, number | null> = {};
      defaultSubs.forEach(sub => {
        marksMap[sub] = null;
      });

      const initialEval = calculateStudentOverallResult(marksMap, examSettings);

      return {
        studentId: st.id || `st_samastha_${st.admissionNumber || idx}`,
        admissionNumber: st.admissionNumber || String(idx + 101),
        rollNo: st.rollNo || st.rollNumber || "",
        name: st.name || `Student ${idx + 1}`,
        classLevel: st.classLevel || selectedClass,
        division: st.division || "A",
        dob: st.dob || "",
        fatherName: st.fatherName || "",
        phone: st.phone || "",
        aadhaar: st.aadhaar || "",
        samasthaId: st.samasthaId || "",
        accessPin: st.accessPin || "",
        subjectMarks: marksMap,
        totalMarks: initialEval.totalMarks,
        maxTotalMarks: initialEval.maxTotalMarks,
        percentage: initialEval.percentage,
        overallResult: initialEval.overallResult,
        failedSubjects: initialEval.failedSubjects,
        grade: initialEval.gradeMalayalam,
        status: "published",
        updatedAt: new Date().toISOString()
      };
    });

    // Merge into resultsData.classResults for selectedClass
    setResultsData(prev => {
      const current = prev.classResults?.[selectedClass] || [];
      const currentMap = new Map(current.map(c => [c.admissionNumber, c]));

      newEntries.forEach(entry => {
        if (currentMap.has(entry.admissionNumber)) {
          const old = currentMap.get(entry.admissionNumber)! as StudentResultEntry;
          currentMap.set(entry.admissionNumber, {
            ...entry,
            subjectMarks: Object.keys(old.subjectMarks || {}).length > 0 ? old.subjectMarks : entry.subjectMarks,
            subjectGrades: old.subjectGrades || entry.subjectGrades,
            subjectPassStatus: old.subjectPassStatus || entry.subjectPassStatus,
            daysPresent: old.daysPresent ?? entry.daysPresent,
            totalMarks: old.totalMarks ?? entry.totalMarks,
            percentage: old.percentage ?? entry.percentage,
            grade: old.grade ?? entry.grade,
          });
        } else {
          currentMap.set(entry.admissionNumber, entry);
        }
      });

      return {
        ...prev,
        classResults: {
          ...prev.classResults,
          [selectedClass]: Array.from(currentMap.values())
        }
      };
    });

    setFeedback(`✅ ${importedStudents.length} കുട്ടികളെ സമസ്ത പോർട്ടലിൽ നിന്നും വിജയകരമായി ഇമ്പോർട്ട് ചെയ്തു!`);
    if (onUpdateWorkspaceStudents) {
      onUpdateWorkspaceStudents(importedStudents);
    }
    setTimeout(() => setFeedback(null), 4000);
  };
  const [isSaving, setIsSaving] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const availableClasses = [
    "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", 
    "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", 
    "Class 11", "Class 12"
  ];

  // Current class student results list
  const currentClassStudents: StudentResultEntry[] = useMemo(() => {
    return resultsData.classes[selectedClass] || [];
  }, [resultsData.classes, selectedClass]);

  // Current class total working days
  const currentClassWorkingDays = examSettings.classWorkingDays?.[selectedClass] || examSettings.defaultWorkingDays || 180;

  // Determine subjects for current class
  const currentSubjects: string[] = useMemo(() => {
    const subjectSet = new Set<string>();
    const hasAnyNonNullMark = currentClassStudents.some(st =>
      Object.values(st.subjectMarks || {}).some(v => v !== null && v !== undefined)
    );

    if (hasAnyNonNullMark) {
      // Preserve existing recorded mark columns first
      currentClassStudents.forEach(st => {
        Object.keys(st.subjectMarks || {}).forEach(sub => subjectSet.add(sub));
      });
    }

    // Include Official Board Exam Timetable / Syllabus subjects
    const timetableOrSyllabusSubs = getClassSubjectNames(selectedClass);
    timetableOrSyllabusSubs.forEach(sub => subjectSet.add(sub));

    // Also include any custom columns already added to students
    currentClassStudents.forEach(st => {
      Object.keys(st.subjectMarks || {}).forEach(sub => subjectSet.add(sub));
    });

    // Default fallback if still empty
    if (subjectSet.size === 0) {
      ["ഖുർആൻ", "ഫിഖ്ഹ്", "അഖീദ", "താരീഖ്", "ലിസാൻ", "അഖ്‌ലാഖ്"].forEach(s => subjectSet.add(s));
    }

    return Array.from(subjectSet);
  }, [currentClassStudents, selectedClass, classTimetables]);

  // Sync / Import students from Workspace
  const handleImportStudentsFromWorkspace = () => {
    const matchingWorkspaceStudents = workspaceStudents.filter(s => {
      return normalizeClassKey(s.classLevel || s.class) === selectedClass;
    });

    if (matchingWorkspaceStudents.length === 0) {
      alert(`വർക്ക്‌സ്‌പേസിൽ ${selectedClass}-ൽ ഉൾപ്പെടുന്ന കുട്ടികളെ കണ്ടെത്താനായില്ല. (No students found in workspace for ${selectedClass})`);
      return;
    }

    const defaultSubs = getClassSubjectNames(selectedClass);

    const importedEntries: StudentResultEntry[] = matchingWorkspaceStudents.map((st, idx) => {
      const marksMap: Record<string, number | null> = {};
      defaultSubs.forEach(sub => {
        marksMap[sub] = null;
      });

      const initialEval = calculateStudentOverallResult(marksMap, examSettings);

      return {
        studentId: st.id || `st_${st.admissionNumber || idx}`,
        admissionNumber: st.admissionNumber || String(idx + 101),
        rollNo: st.rollNo || st.rollNumber || "",
        name: st.name || `Student ${idx + 1}`,
        classLevel: selectedClass,
        division: st.division || "A",
        dob: st.dob || "",
        fatherName: st.fatherName || "",
        phone: st.phone || "",
        aadhaar: st.aadhaar || "",
        samasthaId: st.samasthaId || "",
        accessPin: deriveStudentPin(st, examSettings.studentPinSource || "aadhaar_last4"),
        subjectMarks: marksMap,
        totalMarks: initialEval.totalMarks,
        maxTotalMarks: initialEval.maxTotalMarks,
        percentage: initialEval.percentage,
        overallResult: initialEval.overallResult,
        failedSubjects: initialEval.failedSubjects,
        grade: initialEval.gradeMalayalam,
        status: "published",
        updatedAt: new Date().toISOString()
      };
    });

    const updated = {
      ...resultsData,
      classes: {
        ...resultsData.classes,
        [selectedClass]: importedEntries
      },
      updatedAt: new Date().toISOString()
    };

    setResultsData(updated);
    saveLocalMadrasaResults(updated);
    setFeedback(`✓ ${matchingWorkspaceStudents.length} വിദ്യാർത്ഥികളെ ${selectedClass} റിസൾട്ട് ഷീറ്റിലേക്ക് ചേർത്തു!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Automatically sync & enrich student records (DOB, Aadhaar, Admission No, PIN) from workspaceStudents without asking for CSV again
  useEffect(() => {
    if (!Array.isArray(workspaceStudents) || workspaceStudents.length === 0) return;
    const pinSource = examSettings.studentPinSource || "aadhaar_last4";
    let changed = false;
    const updatedClasses: Record<string, StudentResultEntry[]> = { ...(resultsData.classes || {}) };

    // Group workspaceStudents by normalized class key
    const byClass: Record<string, any[]> = {};
    workspaceStudents.forEach(ws => {
      const cls = normalizeClassKey(ws.classLevel || ws.class || "Class 1");
      if (!byClass[cls]) byClass[cls] = [];
      byClass[cls].push(ws);
    });

    Object.entries(byClass).forEach(([cls, wsList]) => {
      const existingList = updatedClasses[cls] || [];
      if (existingList.length === 0) {
        const defaultSubs = getClassSubjectNames(cls);
        updatedClasses[cls] = wsList.map((st, idx) => {
          const marksMap: Record<string, number | null> = {};
          defaultSubs.forEach(sub => {
            marksMap[sub] = null;
          });
          const initialEval = calculateStudentOverallResult(marksMap, examSettings);
          return {
            studentId: st.id || `st_${st.admissionNumber || idx}`,
            admissionNumber: st.admissionNumber || String(idx + 101),
        rollNo: st.rollNo || st.rollNumber || "",
            name: st.name || `Student ${idx + 1}`,
            classLevel: cls,
            division: st.division || "A",
            dob: st.dob || "",
            fatherName: st.fatherName || "",
            phone: st.phone || "",
            aadhaar: st.aadhaar || "",
            samasthaId: st.samasthaId || "",
            accessPin: deriveStudentPin(st, pinSource),
            subjectMarks: marksMap,
            totalMarks: initialEval.totalMarks,
            maxTotalMarks: initialEval.maxTotalMarks,
            percentage: initialEval.percentage,
            overallResult: initialEval.overallResult,
            failedSubjects: initialEval.failedSubjects,
            grade: initialEval.gradeMalayalam,
            status: "published",
            updatedAt: new Date().toISOString()
          };
        });
        changed = true;
      } else {
        // Enrich existing entries with DOB, Aadhaar, Phone, Father Name, and derived PIN from workspaceStudents
        const enrichedList = existingList.map(entry => {
          const match = wsList.find(
            w =>
              (w.admissionNumber && String(w.admissionNumber).trim() === String(entry.admissionNumber).trim()) ||
              w.id === entry.studentId ||
              (w.name && w.name.trim().toLowerCase() === (entry.name || "").trim().toLowerCase())
          );
          const mergedDob = entry.dob || match?.dob || "";
          const mergedAadhaar = entry.aadhaar || match?.aadhaar || "";
          const mergedFather = entry.fatherName || match?.fatherName || "";
          const mergedPhone = entry.phone || match?.phone || "";
          const mergedCustomPin = entry.customPin || (match as any)?.customPin || "";
          const nextPin = deriveStudentPin(
            { aadhaar: mergedAadhaar, dob: mergedDob, admissionNumber: entry.admissionNumber, accessPin: entry.accessPin, customPin: mergedCustomPin },
            pinSource
          );
          if (
            mergedDob !== (entry.dob || "") ||
            mergedAadhaar !== (entry.aadhaar || "") ||
            mergedFather !== (entry.fatherName || "") ||
            mergedPhone !== (entry.phone || "") ||
            mergedCustomPin !== (entry.customPin || "") ||
            nextPin !== (entry.accessPin || "")
          ) {
            changed = true;
            return {
              ...entry,
              dob: mergedDob,
              aadhaar: mergedAadhaar,
              fatherName: mergedFather,
              phone: mergedPhone,
              customPin: mergedCustomPin,
              accessPin: nextPin
            };
          }
          return entry;
        });
        if (changed) {
          updatedClasses[cls] = enrichedList;
        }
      }
    });

    if (changed) {
      const nextData = {
        ...resultsData,
        classes: updatedClasses,
        updatedAt: new Date().toISOString()
      };
      setResultsData(nextData);
      saveLocalMadrasaResults(nextData);
    }
  }, [workspaceStudents]);

  // Recalculate whole class when settings change
  const applySettingsToResults = (newSettings: ExamResultSettings) => {
    setExamSettings(newSettings);
    const pinSource = newSettings.studentPinSource || "aadhaar_last4";

    const updatedClasses: Record<string, StudentResultEntry[]> = {};
    Object.keys(resultsData.classes).forEach(cls => {
      const students = resultsData.classes[cls] || [];
      const recalculated = students.map(st => {
        const wsMatch = Array.isArray(workspaceStudents)
          ? workspaceStudents.find(
              w =>
                (w.admissionNumber && String(w.admissionNumber).trim() === String(st.admissionNumber).trim()) ||
                w.id === st.studentId
            )
          : undefined;
        const mergedDob = st.dob || wsMatch?.dob || "";
        const mergedAadhaar = st.aadhaar || wsMatch?.aadhaar || "";
        const mergedCustomPin = st.customPin || (wsMatch as any)?.customPin || "";
        const computedPin = deriveStudentPin(
          { aadhaar: mergedAadhaar, dob: mergedDob, admissionNumber: st.admissionNumber, accessPin: st.accessPin, customPin: mergedCustomPin },
          pinSource
        );
        const stats = calculateStudentOverallResult(st.subjectMarks || {}, newSettings, st.maxMarks);
        return {
          ...st,
          dob: mergedDob,
          aadhaar: mergedAadhaar,
          customPin: mergedCustomPin,
          accessPin: computedPin,
          totalMarks: stats.totalMarks,
          maxTotalMarks: stats.maxTotalMarks,
          percentage: stats.percentage,
          overallResult: stats.overallResult,
          failedSubjects: stats.failedSubjects,
          grade: stats.gradeMalayalam,
          updatedAt: new Date().toISOString()
        };
      });
      updatedClasses[cls] = newSettings.showRank ? assignClassRanks(recalculated) : recalculated;
    });

    const updatedData: MadrasaExamResult = {
      ...resultsData,
      settings: newSettings,
      classes: updatedClasses,
      updatedAt: new Date().toISOString()
    };

    setResultsData(updatedData);
    saveLocalMadrasaResults(updatedData);
    setFeedback("✓ പരീക്ഷാ ക്രമീകരണങ്ങൾ അപ്ഡേറ്റ് ചെയ്യുകയും എല്ലാ മാർക്കുകളും പുനർനിർണ്ണയിക്കുകയും ചെയ്തു!");
    setTimeout(() => setFeedback(null), 3500);
  };

  // Update individual student Custom PIN
  const handleStudentCustomPinChange = (studentId: string, newCustomPin: string) => {
    const pinTrimmed = newCustomPin.trim();
    const pinSource = examSettings.studentPinSource || "aadhaar_last4";
    const updatedList = currentClassStudents.map(st => {
      if (st.studentId !== studentId) return st;
      const nextPin = pinTrimmed || deriveStudentPin({ ...st, customPin: "" }, pinSource);
      return {
        ...st,
        customPin: pinTrimmed,
        accessPin: nextPin,
        updatedAt: new Date().toISOString()
      };
    });
    const updatedData: MadrasaExamResult = {
      ...resultsData,
      classes: {
        ...resultsData.classes,
        [selectedClass]: updatedList
      },
      updatedAt: new Date().toISOString()
    };
    setResultsData(updatedData);
    saveLocalMadrasaResults(updatedData);
  };

  // Generate random 4-digit custom PINs for all students in the selected class
  const handleGenerateRandomCustomPins = () => {
    const updatedList = currentClassStudents.map((st, idx) => {
      const randPin = String(1000 + ((parseInt(st.admissionNumber.replace(/\D/g, ""), 10) || (idx + 1)) * 73 + Math.floor(Math.random() * 8999)) % 9000);
      return {
        ...st,
        customPin: randPin,
        accessPin: randPin,
        updatedAt: new Date().toISOString()
      };
    });
    const updatedData: MadrasaExamResult = {
      ...resultsData,
      settings: {
        ...examSettings,
        publicAccessMode: "student_pin",
        securityMode: "student_pin",
        studentPinSource: "custom_pin"
      },
      classes: {
        ...resultsData.classes,
        [selectedClass]: updatedList
      },
      updatedAt: new Date().toISOString()
    };
    setResultsData(updatedData);
    saveLocalMadrasaResults(updatedData);
    setFeedback(`✓ ${selectedClass}-ലെ എല്ലാ കുട്ടികൾക്കും 4-അക്ക കസ്റ്റം PIN ജനറേറ്റ് ചെയ്തു!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Clear custom PINs in selected class to revert to automatic rule (Aadhaar/DOB/AdmNo)
  const handleClearCustomPinsInClass = () => {
    const pinSource = examSettings.studentPinSource === "custom_pin" ? "aadhaar_last4" : (examSettings.studentPinSource || "aadhaar_last4");
    const updatedList = currentClassStudents.map(st => {
      const autoPin = deriveStudentPin({ ...st, customPin: "" }, pinSource);
      return {
        ...st,
        customPin: "",
        accessPin: autoPin,
        updatedAt: new Date().toISOString()
      };
    });
    const updatedData: MadrasaExamResult = {
      ...resultsData,
      settings: {
        ...examSettings,
        studentPinSource: pinSource
      },
      classes: {
        ...resultsData.classes,
        [selectedClass]: updatedList
      },
      updatedAt: new Date().toISOString()
    };
    setResultsData(updatedData);
    saveLocalMadrasaResults(updatedData);
    setFeedback(`✓ കസ്റ്റം PIN ഒഴിവാക്കി ഓട്ടോമാറ്റിക് PIN സംവിധാനത്തിലേക്ക് മാറ്റി!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Handle Mark Change
  const handleMarkChange = (studentId: string, subject: string, valStr: string) => {
    const { maxMark } = getSubjectMarkRules(subject, examSettings);
    const val = valStr.trim() === "" ? null : Math.min(maxMark, Math.max(0, parseInt(valStr, 10) || 0));

    const updatedList = currentClassStudents.map(st => {
      if (st.studentId !== studentId) return st;
      const updatedMarks = {
        ...st.subjectMarks,
        [subject]: val
      };
      const stats = calculateStudentOverallResult(updatedMarks, examSettings, st.maxMarks);
      return {
        ...st,
        subjectMarks: updatedMarks,
        totalMarks: stats.totalMarks,
        maxTotalMarks: stats.maxTotalMarks,
        percentage: stats.percentage,
        overallResult: stats.overallResult,
        failedSubjects: stats.failedSubjects,
        grade: stats.gradeMalayalam,
        updatedAt: new Date().toISOString()
      };
    });

    const rankedList = examSettings.showRank ? assignClassRanks(updatedList) : updatedList;

    const updatedData = {
      ...resultsData,
      classes: {
        ...resultsData.classes,
        [selectedClass]: rankedList
      },
      updatedAt: new Date().toISOString()
    };

    setResultsData(updatedData);
    saveLocalMadrasaResults(updatedData);
  };

  // Handle Attendance Change (Days Present and Working Days)
  const handleAttendanceChange = (studentId: string, val: string) => {
    const classTotalDays = examSettings.classWorkingDays?.[selectedClass] || examSettings.defaultWorkingDays || 180;
    const numVal = parseInt(val, 10);
    const isValidNumber = !isNaN(numVal) && numVal >= 0;

    const updatedList = currentClassStudents.map(st => {
      if (st.studentId !== studentId) return st;
      return {
        ...st,
        daysPresent: isValidNumber ? numVal : undefined,
        totalWorkingDays: classTotalDays,
        attendance: isValidNumber ? `${numVal} / ${classTotalDays}` : val,
        updatedAt: new Date().toISOString()
      };
    });

    const updatedData = {
      ...resultsData,
      classes: {
        ...resultsData.classes,
        [selectedClass]: updatedList
      },
      updatedAt: new Date().toISOString()
    };

    setResultsData(updatedData);
    saveLocalMadrasaResults(updatedData);
  };

  // Handle Class-specific Total Working Days Change
  const handleClassWorkingDaysChange = (totalDays: number) => {
    const updatedSettings = {
      ...examSettings,
      classWorkingDays: {
        ...(examSettings.classWorkingDays || {}),
        [selectedClass]: totalDays
      }
    };
    applySettingsToResults(updatedSettings);
    setFeedback(`✓ ${selectedClass}-ലെ ആകെ പ്രവർത്തി ദിനങ്ങൾ ${totalDays} ആയി നിശ്ചയിച്ചു.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Bulk Full Attendance for all students in current class
  const handleBulkFullAttendance = () => {
    const classTotalDays = examSettings.classWorkingDays?.[selectedClass] || examSettings.defaultWorkingDays || 180;
    const updatedList = currentClassStudents.map(st => ({
      ...st,
      daysPresent: classTotalDays,
      totalWorkingDays: classTotalDays,
      attendance: `${classTotalDays} / ${classTotalDays}`,
      updatedAt: new Date().toISOString()
    }));

    const updatedData = {
      ...resultsData,
      classes: {
        ...resultsData.classes,
        [selectedClass]: updatedList
      },
      updatedAt: new Date().toISOString()
    };

    setResultsData(updatedData);
    saveLocalMadrasaResults(updatedData);
    setFeedback(`✓ ${currentClassStudents.length} കുട്ടികൾക്കും മുഴുവൻ ഹാജർ (${classTotalDays}/${classTotalDays} ദിനം) നൽകി!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Handle Direct Pass/Fail for a Subject
  const handleDirectPassFailChange = (studentId: string, subject: string, status: "pass" | "fail" | "absent") => {
    const { passMark } = getSubjectMarkRules(subject, examSettings);
    const updatedList = currentClassStudents.map(st => {
      if (st.studentId !== studentId) return st;
      const updatedPassStatus = {
        ...(st.subjectPassStatus || {}),
        [subject]: status
      };

      const simulatedMark = status === "pass" ? passMark : (status === "fail" ? Math.max(0, passMark - 2) : null);
      const updatedMarks = {
        ...st.subjectMarks,
        [subject]: simulatedMark
      };

      const allSubjectsPass = Object.keys(updatedPassStatus).every(sub => updatedPassStatus[sub] === "pass");
      const hasAnyFail = Object.values(updatedPassStatus).some(s => s === "fail" || s === "absent");
      const stats = calculateStudentOverallResult(updatedMarks, examSettings, st.maxMarks);

      return {
        ...st,
        subjectMarks: updatedMarks,
        subjectPassStatus: updatedPassStatus,
        overallResult: (hasAnyFail ? "failed" : (allSubjectsPass ? "passed" : stats.overallResult)) as "passed" | "failed",
        totalMarks: stats.totalMarks,
        maxTotalMarks: stats.maxTotalMarks,
        percentage: stats.percentage,
        grade: hasAnyFail ? "തോറ്റു (F)" : "വിജയിച്ചു",
        updatedAt: new Date().toISOString()
      };
    });

    const rankedList = examSettings.showRank ? assignClassRanks(updatedList) : updatedList;
    const updatedData = {
      ...resultsData,
      classes: {
        ...resultsData.classes,
        [selectedClass]: rankedList
      },
      updatedAt: new Date().toISOString()
    };

    setResultsData(updatedData);
    saveLocalMadrasaResults(updatedData);
  };

  // Handle Direct Grade for a Subject
  const handleDirectGradeChange = (studentId: string, subject: string, grade: string) => {
    const { maxMark, passMark } = getSubjectMarkRules(subject, examSettings);
    
    let simulatedMark: number | null = null;
    if (grade === "A+") simulatedMark = Math.round(maxMark * 0.95);
    else if (grade === "A") simulatedMark = Math.round(maxMark * 0.85);
    else if (grade === "B") simulatedMark = Math.round(maxMark * 0.70);
    else if (grade === "C") simulatedMark = Math.round(maxMark * 0.55);
    else if (grade === "D") simulatedMark = passMark;
    else if (grade === "F") simulatedMark = Math.max(0, passMark - 3);

    const updatedList = currentClassStudents.map(st => {
      if (st.studentId !== studentId) return st;
      const updatedGrades = {
        ...(st.subjectGrades || {}),
        [subject]: grade
      };

      const updatedMarks = {
        ...st.subjectMarks,
        [subject]: simulatedMark
      };

      const hasFail = Object.values(updatedGrades).some(g => g === "F" || g === "Absent");
      const stats = calculateStudentOverallResult(updatedMarks, examSettings, st.maxMarks);

      return {
        ...st,
        subjectMarks: updatedMarks,
        subjectGrades: updatedGrades,
        overallResult: (hasFail ? "failed" : "passed") as "passed" | "failed",
        grade: stats.gradeMalayalam,
        totalMarks: stats.totalMarks,
        maxTotalMarks: stats.maxTotalMarks,
        percentage: stats.percentage,
        updatedAt: new Date().toISOString()
      };
    });

    const rankedList = examSettings.showRank ? assignClassRanks(updatedList) : updatedList;
    const updatedData = {
      ...resultsData,
      classes: {
        ...resultsData.classes,
        [selectedClass]: rankedList
      },
      updatedAt: new Date().toISOString()
    };

    setResultsData(updatedData);
    saveLocalMadrasaResults(updatedData);
  };

  // Toggle overall pass / fail directly
  const handleToggleOverallPassFail = (studentId: string) => {
    const updatedList = currentClassStudents.map(st => {
      if (st.studentId !== studentId) return st;
      const currentPassed = st.overallResult === "passed";
      const nextResult: "passed" | "failed" = currentPassed ? "failed" : "passed";

      const updatedPassStatus: Record<string, "pass" | "fail" | "absent"> = {};
      const updatedMarks: Record<string, number | null> = {};

      currentSubjects.forEach(sub => {
        const { passMark } = getSubjectMarkRules(sub, examSettings);
        updatedPassStatus[sub] = nextResult === "passed" ? "pass" : "fail";
        updatedMarks[sub] = nextResult === "passed" ? passMark : Math.max(0, passMark - 2);
      });

      return {
        ...st,
        overallResult: nextResult,
        subjectPassStatus: updatedPassStatus,
        subjectMarks: updatedMarks,
        grade: nextResult === "passed" ? "വിജയിച്ചു" : "തോറ്റു",
        updatedAt: new Date().toISOString()
      };
    });

    const updatedData = {
      ...resultsData,
      classes: {
        ...resultsData.classes,
        [selectedClass]: updatedList
      },
      updatedAt: new Date().toISOString()
    };

    setResultsData(updatedData);
    saveLocalMadrasaResults(updatedData);
  };

  // Bulk All Pass (for Pass/Fail only mode)
  const handleBulkAllPass = () => {
    if (currentClassStudents.length === 0) return;

    const updatedList = currentClassStudents.map(st => {
      const passMap: Record<string, "pass" | "fail" | "absent"> = {};
      const marksMap: Record<string, number | null> = {};

      currentSubjects.forEach(sub => {
        const { passMark } = getSubjectMarkRules(sub, examSettings);
        passMap[sub] = "pass";
        marksMap[sub] = passMark;
      });

      const stats = calculateStudentOverallResult(marksMap, examSettings, st.maxMarks);

      return {
        ...st,
        subjectPassStatus: passMap,
        subjectMarks: marksMap,
        overallResult: "passed" as const,
        grade: "വിജയിച്ചു (Passed)",
        totalMarks: stats.totalMarks,
        maxTotalMarks: stats.maxTotalMarks,
        percentage: stats.percentage,
        updatedAt: new Date().toISOString()
      };
    });

    const updatedData = {
      ...resultsData,
      classes: {
        ...resultsData.classes,
        [selectedClass]: updatedList
      },
      updatedAt: new Date().toISOString()
    };

    setResultsData(updatedData);
    saveLocalMadrasaResults(updatedData);
    setFeedback(`✓ ${currentClassStudents.length} വിദ്യാർത്ഥികളെയും ഒറ്റയടിക്ക് പാസ്സാക്കി (All Passed)!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Bulk All Grade (for Grades only mode)
  const handleBulkAllGrade = (presetGrade: string) => {
    if (currentClassStudents.length === 0) return;

    const updatedList = currentClassStudents.map(st => {
      const gradesMap: Record<string, string> = {};
      const marksMap: Record<string, number | null> = {};

      currentSubjects.forEach(sub => {
        const { maxMark, passMark } = getSubjectMarkRules(sub, examSettings);
        gradesMap[sub] = presetGrade;

        let mark = passMark;
        if (presetGrade === "A+") mark = Math.round(maxMark * 0.95);
        else if (presetGrade === "A") mark = Math.round(maxMark * 0.85);
        else if (presetGrade === "B") mark = Math.round(maxMark * 0.70);
        else if (presetGrade === "C") mark = Math.round(maxMark * 0.55);

        marksMap[sub] = mark;
      });

      const stats = calculateStudentOverallResult(marksMap, examSettings, st.maxMarks);

      return {
        ...st,
        subjectGrades: gradesMap,
        subjectMarks: marksMap,
        overallResult: "passed" as const,
        grade: presetGrade,
        totalMarks: stats.totalMarks,
        maxTotalMarks: stats.maxTotalMarks,
        percentage: stats.percentage,
        updatedAt: new Date().toISOString()
      };
    });

    const updatedData = {
      ...resultsData,
      classes: {
        ...resultsData.classes,
        [selectedClass]: updatedList
      },
      updatedAt: new Date().toISOString()
    };

    setResultsData(updatedData);
    saveLocalMadrasaResults(updatedData);
    setFeedback(`✓ എല്ലാ കുട്ടികൾക്കും "${presetGrade}" ഗ്രേഡ് നൽകി!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Add Custom Subject Column
  const handleAddCustomSubject = () => {
    if (!newSubjectName.trim()) return;
    const subName = newSubjectName.trim();

    const updatedList = currentClassStudents.map(st => ({
      ...st,
      subjectMarks: {
        ...st.subjectMarks,
        [subName]: st.subjectMarks[subName] ?? null
      }
    }));

    const updatedData = {
      ...resultsData,
      classes: {
        ...resultsData.classes,
        [selectedClass]: updatedList
      },
      updatedAt: new Date().toISOString()
    };

    setResultsData(updatedData);
    saveLocalMadrasaResults(updatedData);
    setNewSubjectName("");
    setShowAddSubjectInput(false);
    setFeedback(`✓ "${subName}" എന്ന പുതിയ കോളം ചേർത്തു!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Single Student Toggle Withhold
  const handleConfirmSingleWithhold = (reason: string) => {
    if (!withholdModalStudent) return;
    
    const updatedList = currentClassStudents.map(st => {
      if (st.studentId !== withholdModalStudent.studentId) return st;
      return {
        ...st,
        status: "withheld" as const,
        withheldReason: reason.trim() || "ഫീസ് കുടിശ്ശിക (ദയവായി മദ്റസ ഓഫീസുമായി ബന്ധപ്പെടുക)",
        updatedAt: new Date().toISOString()
      };
    });

    const updatedData = {
      ...resultsData,
      classes: {
        ...resultsData.classes,
        [selectedClass]: updatedList
      },
      updatedAt: new Date().toISOString()
    };

    setResultsData(updatedData);
    saveLocalMadrasaResults(updatedData);
    setWithholdModalStudent(null);
    setFeedback(`✓ "${withholdModalStudent.name}" ന്റെ റിസൾട്ട് തടഞ്ഞുവെച്ചു (Withheld).`);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Release Withhold (Publish)
  const handleReleaseWithhold = (student: StudentResultEntry) => {
    const updatedList = currentClassStudents.map(st => {
      if (st.studentId !== student.studentId) return st;
      return {
        ...st,
        status: "published" as const,
        withheldReason: undefined,
        updatedAt: new Date().toISOString()
      };
    });

    const updatedData = {
      ...resultsData,
      classes: {
        ...resultsData.classes,
        [selectedClass]: updatedList
      },
      updatedAt: new Date().toISOString()
    };

    setResultsData(updatedData);
    saveLocalMadrasaResults(updatedData);
    setFeedback(`✓ "${student.name}" ന്റെ റിസൾട്ട് പബ്ലിഷ് ചെയ്തു (Released).`);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Bulk Actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(currentClassStudents.map(s => s.studentId));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk Withhold Execution
  const handleExecuteBulkWithhold = (reason: string) => {
    if (selectedStudentIds.length === 0) return;

    const updatedList = currentClassStudents.map(st => {
      if (!selectedStudentIds.includes(st.studentId)) return st;
      return {
        ...st,
        status: "withheld" as const,
        withheldReason: reason.trim() || "ഫീസ് കുടിശ്ശിക (ദയവായി മദ്റസ ഓഫീസുമായി ബന്ധപ്പെടുക)",
        updatedAt: new Date().toISOString()
      };
    });

    const updatedData = {
      ...resultsData,
      classes: {
        ...resultsData.classes,
        [selectedClass]: updatedList
      },
      updatedAt: new Date().toISOString()
    };

    setResultsData(updatedData);
    saveLocalMadrasaResults(updatedData);
    setBulkWithholdModalOpen(false);
    setSelectedStudentIds([]);
    setFeedback(`✓ ${selectedStudentIds.length} വിദ്യാർത്ഥികളുടെ റിസൾട്ട് വിജയകരമായി തടഞ്ഞുവെച്ചു (Withheld)!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Bulk Release / Publish
  const handleExecuteBulkRelease = () => {
    if (selectedStudentIds.length === 0) return;

    const updatedList = currentClassStudents.map(st => {
      if (!selectedStudentIds.includes(st.studentId)) return st;
      return {
        ...st,
        status: "published" as const,
        withheldReason: undefined,
        updatedAt: new Date().toISOString()
      };
    });

    const updatedData = {
      ...resultsData,
      classes: {
        ...resultsData.classes,
        [selectedClass]: updatedList
      },
      updatedAt: new Date().toISOString()
    };

    setResultsData(updatedData);
    saveLocalMadrasaResults(updatedData);
    setSelectedStudentIds([]);
    setFeedback(`✓ ${selectedStudentIds.length} വിദ്യാർത്ഥികളുടെ റിസൾട്ട് പബ്ലിഷ് ചെയ്തു!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Bulk Exclude
  const handleExecuteBulkExclude = () => {
    if (selectedStudentIds.length === 0) return;
    if (!confirm(`തിരഞ്ഞെടുത്ത ${selectedStudentIds.length} കുട്ടികളെ റിസൾട്ട് ലിസ്റ്റിൽ നിന്ന് ഒഴിവാക്കണോ?`)) {
      return;
    }

    const updatedList = currentClassStudents.filter(st => !selectedStudentIds.includes(st.studentId));

    const updatedData = {
      ...resultsData,
      classes: {
        ...resultsData.classes,
        [selectedClass]: updatedList
      },
      updatedAt: new Date().toISOString()
    };

    setResultsData(updatedData);
    saveLocalMadrasaResults(updatedData);
    setSelectedStudentIds([]);
    setFeedback(`✓ ${selectedStudentIds.length} കുട്ടികളെ ലിസ്റ്റിൽ നിന്ന് ഒഴിവാക്കി.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Save to Remote Firebase Firestore
  const handleSaveToCloud = async () => {
    setIsSaving(true);
    setFeedback(null);

    const payload: MadrasaExamResult = {
      ...resultsData,
      examTitle,
      academicYear,
      term: examTerm,
      settings: examSettings,
      madrasaName,
      regNo: madrasaRegNo,
      place: madrasaPlace,
      phone: madrasaPhone,
      isPubliclyPublished: true,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveLocalMadrasaResults(payload);

    // 1. Sync to Zero-Cost Server Cache so parent views cost 0 Firestore reads
    fetch(`/api/results/${encodeURIComponent(madrasaId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => {});

    try {
      sessionStorage.setItem(`result_cache_${madrasaId}`, JSON.stringify(payload));
    } catch {}

    // 2. Deduplicate Firestore writes: skip setDoc if nothing changed since last publish
    const contentFingerprint = JSON.stringify({
      classes: payload.classes,
      settings: payload.settings,
      examTitle: payload.examTitle,
      term: payload.term,
      madrasaName: payload.madrasaName
    });
    const hashKey = `last_published_result_fp_${madrasaId}`;

    try {
      if (sessionStorage.getItem(hashKey) === contentFingerprint) {
        setFeedback("✅ റിസൾട്ടുകൾ ക്ലൗഡിൽ തത്സമയം അപ്‌ഡേറ്റ് ആയിട്ടുണ്ട്! (0 അധിക ക്ലൗഡ് റൈറ്റുകൾ)");
        setTimeout(() => setFeedback(null), 4000);
        setIsSaving(false);
        return;
      }
    } catch {}

    try {
      const docRef = doc(db, "madrasa_results", madrasaId);
      await setDoc(docRef, payload, { merge: true });
      try { sessionStorage.setItem(hashKey, contentFingerprint); } catch {}
      setFeedback("✅ റിസൾട്ടുകൾ ക്ലൗഡിൽ തത്സമയം പബ്ലിഷ് ചെയ്തു! രക്ഷിതാക്കൾക്ക് ഇപ്പോൾ ഓൺലൈനായി കാണാം.");
      setTimeout(() => setFeedback(null), 4000);
    } catch (e: any) {
      console.warn("Firestore error:", e);
      setFeedback("✓ ലോക്കലായും സെർവറിലും സേവ് ചെയ്തു. (ക്ലൗഡ് ഫ്രീ-ടയർ സേവർ മോഡ്)");
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // WhatsApp Share Message & Link Generator
  const portalUrl = `${window.location.origin}${window.location.pathname}?view=result&madrasa=${encodeURIComponent(madrasaId)}${activeTimetableId ? `&timetable=${encodeURIComponent(activeTimetableId)}` : ""}`;
  const whatsappShareText = `📢 *${madrasaName || "മദ്റസ"} - ${examTitle}*

ബഹുമാനപ്പെട്ട രക്ഷിതാക്കളുടെ ശ്രദ്ധയ്ക്ക്,
ഞങ്ങളുടെ മദ്റസയിലെ പരീക്ഷാ ഫലം ഓൺലൈനായി പ്രസിദ്ധീകരിച്ചിട്ടുണ്ട്. താഴെ കാണുന്ന ലിങ്കിൽ ക്ലിക്ക് ചെയ്ത് ക്ലാസ്സും കുട്ടിയുടെ പേരും സെലക്ട് ചെയ്ത് റിസൾട്ട് പരിശോധിക്കാവുന്നതാണ്:

🔗 *റിസൾട്ട് ലിങ്ക്:*
${portalUrl}

(പരീക്ഷാ സംബന്ധമായ വിവരങ്ങൾക്ക് ഓഫീസുമായി ബന്ധപ്പെടുക: ${madrasaPhone || "മദ്റസ ഓഫീസ്"})`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleOpenWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappShareText)}`;
    window.open(waUrl, "_blank");
  };

  // Filtered students by search
  const filteredStudents = currentClassStudents.filter(st => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      st.name.toLowerCase().includes(q) ||
      st.admissionNumber.toLowerCase().includes(q)
    );
  });

  // Class Level Statistics
  const classStats = useMemo(() => {
    const total = currentClassStudents.length;
    let appeared = 0;
    let passed = 0;
    let failed = 0;
    let withheld = 0;
    let distinctions = 0;

    currentClassStudents.forEach(st => {
      if (st.status === "withheld") {
        withheld++;
      }
      const evalResult = calculateStudentOverallResult(st.subjectMarks || {}, examSettings, st.maxMarks);
      if (evalResult.scoredSubjectsCount > 0) {
        appeared++;
        if (evalResult.overallResult === "passed") {
          passed++;
          if (evalResult.percentage >= 80) distinctions++;
        } else {
          failed++;
        }
      }
    });

    const passPct = appeared > 0 ? Math.round((passed / appeared) * 100) : 0;

    return { total, appeared, passed, failed, withheld, distinctions, passPct };
  }, [currentClassStudents, examSettings]);

  // Update specific subject rule
  const handleUpdateSubjectRule = (subject: string, maxMark: number, passMark: number) => {
    const updatedRules: Record<string, SubjectRule> = {
      ...examSettings.subjectRules,
      [subject]: {
        subject,
        maxMark: maxMark > 0 ? maxMark : 50,
        passMark: passMark > 0 ? passMark : 18
      }
    };

    applySettingsToResults({
      ...examSettings,
      subjectRules: updatedRules
    });
  };

  // Grade Rules Handlers & Customization
  const currentGradeRules: GradeRuleItem[] = (examSettings.gradeRules && examSettings.gradeRules.length > 0)
    ? examSettings.gradeRules 
    : OFFICIAL_BOARD_GRADE_RULES;

  const handleUpdateGradeRule = (ruleId: string, updates: Partial<GradeRuleItem>) => {
    const updated = currentGradeRules.map(r => r.id === ruleId ? { ...r, ...updates } : r);
    applySettingsToResults({
      ...examSettings,
      gradeRules: updated
    });
  };

  const handleAddGradeRule = () => {
    const newId = `g_custom_${Date.now()}`;
    const newRule: GradeRuleItem = {
      id: newId,
      grade: "E",
      label: "പ്രത്യേക ഗ്രേഡ് (Grade E)",
      minMark: 10,
      maxMark: 17,
      minPercentage: 20,
      maxPercentage: 35,
      isPass: false
    };
    applySettingsToResults({
      ...examSettings,
      gradeRules: [...currentGradeRules, newRule]
    });
    setFeedback("✓ പുതിയ ഗ്രേഡ് നിര ചേർത്തു!");
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDeleteGradeRule = (ruleId: string) => {
    if (currentGradeRules.length <= 2) {
      alert("കുറഞ്ഞത് രണ്ട് ഗ്രേഡുകൾ എങ്കിലും ഉണ്ടായിരിക്കണം!");
      return;
    }
    const updated = currentGradeRules.filter(r => r.id !== ruleId);
    applySettingsToResults({
      ...examSettings,
      gradeRules: updated
    });
    setFeedback("✓ ഗ്രേഡ് നിര നീക്കം ചെയ്തു!");
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleResetGradeRulesToOfficial = () => {
    applySettingsToResults({
      ...examSettings,
      gradeRules: [...OFFICIAL_BOARD_GRADE_RULES]
    });
    setFeedback("✓ ഔദ്യോഗിക ബോർഡ് ഗ്രേഡ് നിയമങ്ങളിലേക്ക് പുനഃസ്ഥാപിച്ചു!");
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleApplyOfficialSpecialSubjectRules = () => {
    applySettingsToResults({
      ...examSettings,
      subjectRules: {
        ...examSettings.subjectRules,
        ...OFFICIAL_SPECIAL_SUBJECT_RULES
      }
    });
    setFeedback("✓ ബോർഡ് നിബന്ധന: ഖുർആൻ, തഫ്ഹീമുത്തിലാവ, ദുറൂസ്, കേട്ടെഴുത്ത് എന്നിവയ്ക്ക് 20 പാസ്സ് മാർക്ക് നിശ്ചയിച്ചു!");
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className={`min-h-screen font-sans p-3 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-4 sm:space-y-6 transition-colors ${
      isDark ? "bg-slate-950 text-slate-100 selection:bg-purple-500" : "bg-slate-50 text-slate-900 selection:bg-emerald-500"
    }`}>
      
      {/* MOBILE APPLICATION APP-BAR (NATIVE MOBILE EXPERIENCE) */}
      <div className={`md:hidden sticky top-0 z-30 px-3 py-2.5 -mx-3 -mt-3 mb-2 border-b flex items-center justify-between backdrop-blur-md transition-colors ${
        isDark ? "bg-slate-950/95 border-slate-800 text-white" : "bg-white/95 border-slate-200 text-slate-900 shadow-xs"
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          {onBackToLanding ? (
            <button
              type="button"
              onClick={onBackToLanding}
              className={`p-1.5 rounded-xl border transition cursor-pointer shrink-0 ${
                isDark ? "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              }`}
              title="ഹോം പോർട്ടൽ"
            >
              <Globe className="w-4 h-4 text-emerald-500" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onBackToWorkspace}
              className={`p-1.5 rounded-xl border transition cursor-pointer shrink-0 ${
                isDark ? "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              }`}
              title="വർക്ക്‌സ്‌പേസ്"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="min-w-0 flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs truncate">Result Suite</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {selectedClass} • {examTitle ? examTitle.slice(0, 16) : "Exam"}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT MOBILE CONTROLS */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setSuiteTheme(isDark ? "light" : "dark")}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isDark ? "bg-slate-900 text-amber-300 border-slate-800" : "bg-slate-100 text-slate-700 border-slate-200"
            }`}
            title="Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-xs"
            title="വാട്സ്ആപ്പ് ഷെയർ"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleSaveToCloud}
            disabled={isSaving}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs transition cursor-pointer shadow-xs flex items-center gap-1 disabled:opacity-50"
            title="ക്ലൗഡ് പബ്ലിഷ്"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="text-[11px]">{isSaving ? "..." : "സേവ്"}</span>
          </button>
        </div>
      </div>

      {/* TOP APPLICATION BAR: DEDICATED RESULT SUITE HEADER (DESKTOP) */}
      <div className={`hidden md:flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-3xl transition-colors ${
        isDark ? "bg-slate-900/90 border border-slate-800 text-white shadow-2xl" : "bg-white border border-slate-200 text-slate-900 shadow-md"
      }`}>
        
        {/* APP IDENTITY & SWITCHER */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className={`px-3 py-2 rounded-xl transition cursor-pointer border flex items-center gap-1.5 text-xs font-bold ${
                  isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 shadow-2xs"
                }`}
                title="പ്രധാന ലാൻഡിംഗ് പോർട്ടലിലേക്ക് മടങ്ങുക (Home)"
              >
                <Globe className="w-4 h-4 text-emerald-500" />
                <span className="hidden sm:inline">ഹോം</span>
              </button>
            )}

            <button
              onClick={onBackToWorkspace}
              className={`px-3 py-2 rounded-xl transition cursor-pointer border flex items-center gap-1.5 text-xs font-bold ${
                isDark ? "bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-800/60" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs"
              }`}
              title="സീറ്റിംഗ് അറേഞ്ച്മെന്റ് ആപ്പിലേക്ക് മാറുക"
            >
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">സീറ്റിംഗ് ആപ്പ്</span>
            </button>
          </div>
          
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`p-1.5 rounded-lg border flex items-center gap-1.5 font-bold text-xs ${
                isDark ? "bg-purple-950 text-purple-400 border-purple-800/60" : "bg-emerald-50 text-emerald-700 border-emerald-300"
              }`}>
                <BarChart3 className="w-4 h-4" />
                <span>Result Suite</span>
              </span>
              <h1 className={`text-base sm:text-lg font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                മദ്റസ പരീക്ഷാ റിസൾട്ട് ആപ്പ്
              </h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Live Suite
              </span>
            </div>
            <p className={`text-xs pt-0.5 ${isDark ? "text-slate-400" : "text-slate-600 font-medium"}`}>
              {madrasaName} {madrasaRegNo && `(${madrasaRegNo})`} • {examTitle} ({academicYear})
            </p>
          </div>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          {/* THEME TOGGLE (LIGHT / DARK) */}
          <button
            type="button"
            onClick={() => setSuiteTheme(isDark ? "light" : "dark")}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 border cursor-pointer ${
              isDark
                ? "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700"
                : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
            }`}
            title={isDark ? "ലൈറ്റ് മോഡിലേക്ക് മാറ്റുക" : "ഡാർക്ക് മോഡിലേക്ക് മാറ്റുക"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
            <span>{isDark ? "Lite Theme" : "Dark Theme"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>വാട്സ്ആപ്പ് ഷെയർ</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToCloud}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "സേവ് ചെയ്യുന്നു..." : "ക്ലൗഡിൽ പബ്ലിഷ് ചെയ്യുക"}</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK TOAST */}
      {feedback && (
        <div className={`p-3.5 border rounded-2xl font-bold text-xs flex items-center gap-2 animate-in fade-in ${
          isDark ? "bg-purple-950/80 border-purple-500/50 text-purple-200" : "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm"
        }`}>
          <Sparkles className={`w-4 h-4 shrink-0 ${isDark ? "text-purple-400" : "text-emerald-600"}`} />
          <span>{feedback}</span>
        </div>
      )}

      {/* RESULT APPLICATION MAIN NAVIGATION TABS (DESKTOP) */}
      <div className={`hidden md:flex flex-wrap items-center gap-2 border-b pb-2 ${
        isDark ? "border-slate-800" : "border-slate-200"
      }`}>
        <button
          type="button"
          onClick={() => setActiveTab("mark_entry")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer border ${
            activeTab === "mark_entry"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
              : isDark
              ? "bg-slate-900/80 text-slate-400 hover:text-white border-slate-800"
              : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 shadow-xs"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>1. മാർക്ക് എൻട്രി & ലിസ്റ്റ് (Mark Entry)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tabulation")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer border ${
            activeTab === "tabulation"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
              : isDark
              ? "bg-slate-900/80 text-slate-400 hover:text-white border-slate-800"
              : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 shadow-xs"
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>2. ഗ്രാൻഡ് ടാബുലേഷൻ ഷീറ്റ് (Tabulation Sheet)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer border ${
            activeTab === "settings"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
              : isDark
              ? "bg-slate-900/80 text-slate-400 hover:text-white border-slate-800"
              : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 shadow-xs"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>3. പരീക്ഷാ & പാസ്സ് ക്രമീകരണങ്ങൾ (Exam Settings)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("portal_preview")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer border ${
            activeTab === "portal_preview"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
              : isDark
              ? "bg-slate-900/80 text-slate-400 hover:text-white border-slate-800"
              : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 shadow-xs"
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>4. രക്ഷിതാക്കളുടെ വ്യൂ പ്രിവ്യൂ (Parent Portal Preview)</span>
        </button>
      </div>

      {/* TAB 1: MARK ENTRY VIEW */}
      {activeTab === "mark_entry" && (
        <div className="space-y-6">
          
          {/* EXAM META STRIP */}
          <div className={`border p-5 rounded-3xl space-y-4 transition-colors ${
            isDark ? "bg-slate-900/60 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className={`block font-bold mb-1 text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  പരീക്ഷാ നാമം (Exam Title):
                </label>
                <input
                  type="text"
                  value={examTitle || ""}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className={`w-full border p-2.5 rounded-xl font-bold outline-none ${
                    isDark ? "bg-slate-950 border-slate-700 text-white focus:ring-2 focus:ring-emerald-500" : "bg-slate-50 border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  }`}
                  placeholder="ഉദാ: പാദവാർഷിക പരീക്ഷാ ഫലം 2026"
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  അധ്യയന വർഷം (Academic Year):
                </label>
                <input
                  type="text"
                  value={academicYear || ""}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className={`w-full border p-2.5 rounded-xl font-mono outline-none ${
                    isDark ? "bg-slate-950 border-slate-700 text-white focus:ring-2 focus:ring-emerald-500" : "bg-slate-50 border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  }`}
                  placeholder="2025-2026"
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  പരീക്ഷാ ടേം (Exam Term):
                </label>
                <select
                  value={examTerm}
                  onChange={(e) => setExamTerm(e.target.value as ExamTermType)}
                  className={`w-full border p-2.5 rounded-xl outline-none ${
                    isDark ? "bg-slate-950 border-slate-700 text-white focus:ring-2 focus:ring-emerald-500" : "bg-slate-50 border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  }`}
                >
                  <option value="quarterly">പാദവാർഷിക പരീക്ഷ (Quarterly)</option>
                  <option value="half_yearly">അർദ്ധവാർഷിക പരീക്ഷ (Half Yearly)</option>
                  <option value="annual">വാർഷിക പൊതുപരീക്ഷ (Annual)</option>
                  <option value="model">മോഡൽ പരീക്ഷ (Model Exam)</option>
                </select>
              </div>
            </div>

            {/* CLASS SELECTOR PILLS */}
            <div className={`pt-3 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <div className="text-[11px] font-bold mb-2 flex items-center justify-between">
                <span className={isDark ? "text-slate-400" : "text-slate-600"}>ക്ലാസ് തിരഞ്ഞെടുക്കുക (SELECT CLASS):</span>
                <span className={isDark ? "text-emerald-400" : "text-emerald-700"}>തിരഞ്ഞെടുത്ത ക്ലാസ്: {selectedClass}</span>
              </div>

              <div className="flex overflow-x-auto no-scrollbar items-center gap-1.5 py-1 -mx-1 px-1">
                {availableClasses.map(cls => {
                  const hasEntries = (resultsData.classes[cls] || []).length;
                  const isSelected = selectedClass === cls;
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => {
                        setSelectedClass(cls);
                        setSelectedStudentIds([]);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                          : hasEntries
                          ? isDark ? "bg-slate-900 text-emerald-300 border-emerald-800/40 hover:bg-slate-800" : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                          : isDark ? "bg-slate-950 text-slate-400 border-slate-800 hover:text-white" : "bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900"
                      }`}
                    >
                      <span>{cls}</span>
                      {hasEntries > 0 && (
                        <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-mono border ${
                          isDark ? "bg-purple-950 text-purple-300 border-purple-700/50" : "bg-emerald-200 text-emerald-900 border-emerald-300"
                        }`}>
                          {hasEntries}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ACTIVE CLASS SUMMARY KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className={`border p-3.5 rounded-2xl ${
              isDark ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-xs"
            }`}>
              <span className={`block text-[10px] font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>ആകെ കുട്ടികൾ</span>
              <span className={`text-xl font-black font-mono ${isDark ? "text-white" : "text-slate-900"}`}>{classStats.total}</span>
            </div>

            <div className={`border p-3.5 rounded-2xl ${
              isDark ? "bg-slate-900/80 border-slate-800 text-sky-400" : "bg-white border-sky-200 text-sky-800 shadow-xs"
            }`}>
              <span className={`block text-[10px] font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>പരീക്ഷ എഴുതിയവർ</span>
              <span className="text-xl font-black text-sky-600 font-mono">{classStats.appeared}</span>
            </div>

            <div className={`border p-3.5 rounded-2xl ${
              isDark ? "bg-emerald-950/40 border-emerald-600/40 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xs"
            }`}>
              <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] font-bold">വിജയിച്ചവർ</span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">{classStats.passed}</span>
            </div>

            <div className={`border p-3.5 rounded-2xl ${
              isDark ? "bg-rose-950/40 border-rose-600/40 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-900 shadow-xs"
            }`}>
              <span className="text-rose-700 dark:text-rose-400 block text-[10px] font-bold">തോറ്റവർ</span>
              <span className="text-xl font-black text-rose-700 dark:text-rose-300 font-mono">{classStats.failed}</span>
            </div>

            <div className={`border p-3.5 rounded-2xl ${
              isDark ? "bg-purple-950/40 border-purple-600/40 text-purple-300" : "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-xs"
            }`}>
              <span className="text-indigo-700 dark:text-purple-400 block text-[10px] font-bold">വിജയ ശതമാനം %</span>
              <span className="text-xl font-black text-indigo-700 dark:text-purple-300 font-mono">{classStats.passPct}%</span>
            </div>

            <div className={`border p-3.5 rounded-2xl ${
              isDark ? "bg-slate-900/80 border-slate-800 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-900 shadow-xs"
            }`}>
              <span className="text-amber-700 dark:text-amber-400 block text-[10px] font-bold">തടഞ്ഞുവെച്ചവ (Withheld)</span>
              <span className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono">{classStats.withheld}</span>
            </div>
          </div>

          {/* ACTIVE PASS & GRADING RULES CHIP & MODE SWITCHER */}
          <div className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl text-xs transition-colors border ${
            isDark ? "bg-slate-900/40 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700 shadow-xs"
          }`}>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`flex items-center gap-1 font-bold ${isDark ? "text-purple-400" : "text-emerald-700"}`}>
                <Settings className="w-3.5 h-3.5" />
                <span>മോഡ്:</span>
              </span>

              {/* MODE PILLS */}
              <div className={`inline-flex items-center gap-1 p-1 rounded-xl border ${
                isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
              }`}>
                <button
                  type="button"
                  onClick={() => applySettingsToResults({ ...examSettings, displayMode: "marks_and_grades" })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1 ${
                    examSettings.displayMode === "marks_and_grades"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <BarChart3 className="w-3 h-3" />
                  <span>മുഴുവൻ മാർക്കും</span>
                </button>

                <button
                  type="button"
                  onClick={() => applySettingsToResults({ ...examSettings, displayMode: "pass_fail_only" })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1 ${
                    examSettings.displayMode === "pass_fail_only"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>പാസ്സ്/തോൽവി മാത്രം</span>
                </button>

                <button
                  type="button"
                  onClick={() => applySettingsToResults({ ...examSettings, displayMode: "grades_only" })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1 ${
                    examSettings.displayMode === "grades_only"
                      ? "bg-sky-600 text-white shadow-xs"
                      : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Award className="w-3 h-3" />
                  <span>ഗ്രേഡ് മാത്രം</span>
                </button>
              </div>

              <span>•</span>
              <span>പരമാവധി: <strong className={`font-mono ${isDark ? "text-white" : "text-slate-900 font-bold"}`}>{examSettings.defaultMaxMark}</strong></span>
              <span>•</span>
              <span>പാസ്സ്: <strong className={`font-mono ${isDark ? "text-emerald-400" : "text-emerald-700 font-bold"}`}>{examSettings.defaultPassMark}</strong></span>
              <span>•</span>
              <span>ഖുർആൻ: <strong className={`font-mono ${isDark ? "text-amber-300" : "text-amber-700 font-bold"}`}>{examSettings.subjectRules?.["ഖുർആൻ"]?.passMark || 20}</strong></span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`font-bold flex items-center gap-1 underline cursor-pointer ${
                isDark ? "text-purple-400 hover:text-purple-300" : "text-emerald-700 hover:text-emerald-800"
              }`}
            >
              <span>നിയമങ്ങൾ മാറ്റുക (Settings)</span>
            </button>
          </div>

          {/* TABLE ACTION CONTROLS */}
          <div className={`p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs transition-colors border ${
            isDark ? "bg-slate-900/90 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800 shadow-xs"
          }`}>
            
            <div className="flex flex-wrap items-center gap-2">
              {(!workspaceStudents || workspaceStudents.length === 0) && (
                <button
                  type="button"
                  onClick={() => setIsSamasthaModalOpen(true)}
                  className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    isDark
                      ? "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-600/40"
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                  }`}
                  title="online.samastha.info പോർട്ടലിൽ നിന്നും ഡൗൺലോഡ് ചെയ്ത CSV ഫയൽ ഇമ്പോർട്ട് ചെയ്യുക"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>സമസ്ത CSV ഇമ്പോർട്ട്</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleImportStudentsFromWorkspace}
                className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  isDark
                    ? "bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border-indigo-600/40"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200"
                }`}
                title="സീറ്റിംഗ് പ്ലാനറിലെ കുട്ടികളെ ഈ ക്ലാസിലേക്ക് ചേർക്കുക"
              >
                <Users className="w-3.5 h-3.5" />
                <span>സീറ്റിംഗ് കുട്ടികളെ സിങ്ക് ചെയ്യുക</span>
              </button>

              {/* QUICK BULK ACTIONS DEPENDING ON ACTIVE DISPLAY MODE */}
              {examSettings.displayMode === "pass_fail_only" && (
                <button
                  type="button"
                  onClick={handleBulkAllPass}
                  className={`px-3 py-2 rounded-xl font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs border ${
                    isDark
                      ? "bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-600/50"
                      : "bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300"
                  }`}
                  title="ഈ ക്ലാസിലെ എല്ലാ കുട്ടികളെയും ഒറ്റയടിക്ക് പാസ്സാക്കുക"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>✨ എല്ലാവരെയും പാസ്സാക്കുക</span>
                </button>
              )}

              {examSettings.displayMode === "grades_only" && (
                <div className={`flex items-center gap-1 p-1 rounded-xl border ${
                  isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
                }`}>
                  <span className={`text-[10px] font-bold px-1.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>ബൾക്ക് ഗ്രേഡ്:</span>
                  {["A+", "A", "B", "C"].map(gr => (
                    <button
                      key={gr}
                      type="button"
                      onClick={() => handleBulkAllGrade(gr)}
                      className={`px-2 py-0.5 text-[10px] font-black rounded cursor-pointer ${
                        isDark ? "bg-slate-800 hover:bg-blue-900 text-slate-300 hover:text-blue-200" : "bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200"
                      }`}
                    >
                      {gr}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowAddSubjectInput(!showAddSubjectInput)}
                className={`px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  isDark
                    ? "bg-slate-800 hover:bg-slate-700 text-sky-300 border-slate-700"
                    : "bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>വിഷയ കോളം ചേർക്കുക</span>
              </button>

              {showAddSubjectInput && (
                <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
                  isDark ? "bg-slate-950 border-sky-500/50" : "bg-white border-sky-300 shadow-xs"
                }`}>
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="വിഷയത്തിന്റെ പേര്..."
                    className={`px-2 py-1 text-xs outline-none w-32 ${isDark ? "bg-transparent text-white" : "bg-white text-slate-900"}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCustomSubject();
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubject}
                    className="p-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* CLASS WORKING DAYS & QUICK FULL ATTENDANCE */}
              <div className={`flex items-center gap-1.5 p-1.5 rounded-xl border ${
                isDark ? "bg-slate-950 border-sky-900/60" : "bg-slate-50 border-slate-200"
              }`}>
                <span className={`text-[11px] font-bold px-1 flex items-center gap-1 ${isDark ? "text-sky-400" : "text-sky-800"}`}>
                  <Calendar className="w-3.5 h-3.5 text-sky-500" />
                  <span>ആകെ പ്രവർത്തി ദിനങ്ങൾ:</span>
                </span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={currentClassWorkingDays}
                  onChange={(e) => handleClassWorkingDaysChange(Math.max(1, parseInt(e.target.value, 10) || 180))}
                  className={`w-14 p-1 rounded-lg text-center font-mono font-bold text-xs outline-none border ${
                    isDark ? "bg-slate-900 border-slate-700 text-white focus:border-sky-500" : "bg-white border-slate-300 text-slate-900 focus:border-sky-500"
                  }`}
                  title="ഈ ക്ലാസ്സിലെ ആകെ പ്രവർത്തി ദിനങ്ങൾ മാറ്റുക"
                />
                <button
                  type="button"
                  onClick={handleBulkFullAttendance}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                    isDark
                      ? "bg-sky-950 hover:bg-sky-900 text-sky-300 border-sky-700/50"
                      : "bg-sky-100 hover:bg-sky-200 text-sky-900 border-sky-300"
                  }`}
                  title="ഈ ക്ലാസ്സിലെ എല്ലാ കുട്ടികൾക്കും മുഴുവൻ ഹാജർ നൽകുക"
                >
                  <Sparkles className="w-3 h-3 text-sky-500" />
                  <span>മുഴുവൻ ഹാജർ</span>
                </button>
              </div>
            </div>

            {/* SEARCH & BULK ACTIONS */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="വിദ്യാർത്ഥിയെ തിരയുക..."
                  className={`pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none border w-44 ${
                    isDark ? "bg-slate-950 border-slate-700 text-white focus:border-purple-500" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500"
                  }`}
                />
              </div>

              {selectedStudentIds.length > 0 && (
                <div className={`flex items-center gap-1.5 p-1 rounded-xl border animate-in fade-in ${
                  isDark ? "bg-slate-950 border-purple-500/40" : "bg-emerald-50 border-emerald-300"
                }`}>
                  <span className={`text-[10px] font-bold px-2 ${isDark ? "text-purple-300" : "text-emerald-900"}`}>
                    {selectedStudentIds.length} പേർ സെലക്ട് ചെയ്തു:
                  </span>

                  <button
                    type="button"
                    onClick={() => setBulkWithholdModalOpen(true)}
                    className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-700/50 rounded-lg text-3xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="തിരഞ്ഞെടുത്തവരുടെ റിസൾട്ട് തടഞ്ഞുവെക്കുക"
                  >
                    <Lock className="w-3 h-3 text-red-400" />
                    <span>തടഞ്ഞുവെക്കുക (Withhold)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteBulkRelease}
                    className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 rounded-lg text-3xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="തിരഞ്ഞെടുത്തവരുടെ റിസൾട്ട് റിലീസ് ചെയ്യുക"
                  >
                    <Unlock className="w-3 h-3 text-emerald-400" />
                    <span>റിലീസ്</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteBulkExclude}
                    className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                    title="ലിസ്റ്റിൽ നിന്ന് ഒഴിവാക്കുക"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* MARK ENTRY TABLE */}
          <div className={`rounded-3xl overflow-hidden border transition-colors ${
            isDark ? "bg-slate-900/90 border-slate-800 shadow-2xl" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b text-[11px] font-bold ${
                    isDark ? "bg-slate-950 text-slate-400 border-slate-800" : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.length === currentClassStudents.length && currentClassStudents.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                      />
                    </th>
                    <th className="p-3 w-14 text-center">റോൾ</th>
                    <th className="p-3 min-w-[160px]">വിദ്യാർത്ഥിയുടെ പേര്</th>
                    
                    {/* ATTENDANCE COLUMN */}
                    <th className={`p-3 text-center min-w-[105px] border-l ${isDark ? "border-slate-800/60" : "border-slate-200"}`} title="ഹാജർ നില">
                      <span className={`block font-bold ${isDark ? "text-white" : "text-slate-900"}`}>ഹാജർ</span>
                      <span className={`text-[9px] font-mono block ${isDark ? "text-sky-400" : "text-sky-700 font-bold"}`}>/{currentClassWorkingDays} ദിനം</span>
                    </th>

                    {/* DYNAMIC SUBJECT COLUMNS WITH MAX & PASS MARKS OR P/F OR GRADES */}
                    {currentSubjects.map(sub => {
                      const { maxMark, passMark } = getSubjectMarkRules(sub, examSettings);
                      return (
                        <th key={sub} className={`p-3 text-center min-w-[105px] border-l ${isDark ? "border-slate-800/60" : "border-slate-200"}`}>
                          <span className={`block font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>{sub}</span>
                          {examSettings.displayMode === "pass_fail_only" ? (
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block">P / F / Abs</span>
                          ) : examSettings.displayMode === "grades_only" ? (
                            <span className="text-[9px] text-sky-600 dark:text-sky-400 font-bold block">ഗ്രേഡ്</span>
                          ) : (
                            <span className={`text-[9px] font-mono block ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                              Max: {maxMark} | Pass: <span className={passMark === 20 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>{passMark}</span>
                            </span>
                          )}
                        </th>
                      );
                    })}

                    {examSettings.displayMode === "marks_and_grades" && (
                      <>
                        <th className={`p-3 text-center w-20 border-l ${isDark ? "border-slate-800" : "border-slate-200"}`}>ആകെ</th>
                        <th className="p-3 text-center w-16">%</th>
                      </>
                    )}

                    <th className={`p-3 text-center min-w-[110px] border-l ${isDark ? "border-slate-800" : "border-slate-200"}`}>ഫലം (Result)</th>
                    
                    {examSettings.displayMode !== "pass_fail_only" && (
                      <th className="p-3 text-center w-20">ഗ്രേഡ്</th>
                    )}

                    {examSettings.showRank && (
                      <th className="p-3 text-center w-16">റാങ്ക്</th>
                    )}

                    <th className="p-3 text-center min-w-[110px]">സ്റ്റാറ്റസ്</th>
                    <th className="p-3 text-center w-20">ആക്ഷൻസ്</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={10 + currentSubjects.length} className="p-12 text-center text-slate-500">
                        <div className="max-w-md mx-auto space-y-3">
                          <Users className="w-10 h-10 text-slate-600 mx-auto" />
                          <p className="font-bold text-slate-400 text-sm">
                            {selectedClass}-ൽ ഇതുവരെ വിദ്യാർത്ഥികളെ ചേർത്തിട്ടില്ല.
                          </p>
                          <p className="text-xs text-slate-500">
                            മുകളിലുള്ള <strong>"സീറ്റിംഗ് കുട്ടികളെ ഇമ്പോർട്ട് ചെയ്യുക"</strong> ബട്ടൺ ക്ലിക്ക് ചെയ്ത് ഈ ക്ലാസിലെ കുട്ടികളെ സ്വയം കൊണ്ടുവരാം.
                          </p>
                          <button
                            type="button"
                            onClick={handleImportStudentsFromWorkspace}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <Plus className="w-4 h-4" />
                            <span>കുട്ടികളെ ഇമ്പോർട്ട് ചെയ്യുക</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const isSelected = selectedStudentIds.includes(student.studentId);
                      const isWithheld = student.status === "withheld";
                      const studentEval = calculateStudentOverallResult(student.subjectMarks || {}, examSettings, student.maxMarks);
                      
                      let isPassed = studentEval.overallResult === "passed";
                      if (student.overallResult) {
                        isPassed = student.overallResult === "passed";
                      }

                      return (
                        <tr 
                          key={`${student.studentId}-${student.admissionNumber}`}
                          className={`transition border-b ${
                            isDark
                              ? `border-slate-800/60 hover:bg-slate-800/40 ${isWithheld ? "bg-red-950/20" : isSelected ? "bg-purple-950/20" : ""}`
                              : `border-slate-200 hover:bg-slate-50 ${isWithheld ? "bg-red-50/60" : isSelected ? "bg-emerald-50/60" : ""}`
                          }`}
                        >
                          {/* CHECKBOX */}
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectStudent(student.studentId)}
                              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                            />
                          </td>

                          {/* ADMISSION NO / ROLL */}
                          <td className={`p-3 font-mono font-bold text-[11px] text-center ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            {student.admissionNumber}
                          </td>

                          {/* STUDENT NAME & INLINE CUSTOM PIN EDITOR */}
                          <td className="p-3">
                            <div className={`font-extrabold text-xs ${isDark ? "text-white" : "text-slate-900"}`}>
                              {student.name}
                            </div>

                            {((examSettings.publicAccessMode || examSettings.securityMode) === "student_pin") && (() => {
                              const pinInfo = getEffectiveStudentPinInfo(student, examSettings.studentPinSource || "aadhaar_last4");
                              return (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                    pinInfo.isCustom
                                      ? isDark ? "bg-amber-950/60 text-amber-300 border-amber-700" : "bg-amber-50 text-amber-800 border-amber-300"
                                      : pinInfo.isFallback
                                      ? isDark ? "bg-sky-950/60 text-sky-300 border-sky-700" : "bg-sky-50 text-sky-800 border-sky-300"
                                      : isDark ? "bg-slate-950 text-slate-400 border-slate-800" : "bg-slate-100 text-slate-600 border-slate-200"
                                  }`} title={pinInfo.sourceLabelMl}>
                                    🔑 {pinInfo.isCustom ? "കസ്റ്റം PIN:" : pinInfo.isFallback ? "Fallback PIN:" : "PIN:"}
                                  </span>
                                  <input
                                    type="text"
                                    value={student.customPin !== undefined && student.customPin !== "" ? student.customPin : ""}
                                    placeholder={pinInfo.pinValue}
                                    onChange={(e) => handleStudentCustomPinChange(student.studentId, e.target.value)}
                                    title="ഇവിടെ ടൈപ്പ് ചെയ്ത് ഈ കുട്ടിക്ക് മാത്രമായി ഒരു കസ്റ്റം PIN നൽകാം (ഒഴിവാക്കിയാൽ ഓട്ടോമാറ്റിക് PIN പ്രവർത്തിക്കും)"
                                    className={`w-20 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold outline-none border transition ${
                                      student.customPin
                                        ? isDark ? "bg-amber-950/40 border-amber-500 text-amber-200" : "bg-amber-50 border-amber-400 text-amber-950"
                                        : isDark ? "bg-slate-950 border-slate-800 text-slate-300 placeholder:text-slate-400 focus:border-purple-500" : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-600 focus:border-emerald-500"
                                    }`}
                                  />
                                </div>
                              );
                            })()}
                            {isWithheld && (
                              <div className="text-[10px] text-red-500 font-bold flex items-center gap-1 pt-0.5">
                                <Lock className="w-2.5 h-2.5 shrink-0" />
                                <span>തടഞ്ഞുവെച്ചു: {student.withheldReason || "ഫീസ് കുടിശ്ശിക"}</span>
                              </div>
                            )}
                          </td>

                          {/* ATTENDANCE INPUT (DAYS PRESENT & WORKING DAYS) */}
                          <td className={`p-2 border-l text-center ${isDark ? "border-slate-800/60" : "border-slate-200"}`}>
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="flex items-center gap-1 justify-center">
                                <input
                                  type="text"
                                  value={student.daysPresent !== undefined ? student.daysPresent : (student.attendance || "")}
                                  onChange={(e) => handleAttendanceChange(student.studentId, e.target.value)}
                                  placeholder={String(currentClassWorkingDays)}
                                  className={`w-14 p-1 rounded-lg text-center font-mono font-bold text-xs outline-none border ${
                                    isDark
                                      ? "bg-slate-950 border-slate-700 text-sky-300 focus:border-sky-500"
                                      : "bg-white border-slate-300 text-sky-800 focus:border-sky-500"
                                  }`}
                                  title={`ഹാജരായ ദിനം (ആകെ: ${currentClassWorkingDays})`}
                                />
                                <span className={`text-[10px] font-mono ${isDark ? "text-slate-500" : "text-slate-500"}`}>/{currentClassWorkingDays}</span>
                              </div>
                              {student.daysPresent !== undefined && currentClassWorkingDays > 0 && (
                                <span className={`text-[9px] font-mono font-bold ${isDark ? "text-sky-400" : "text-sky-700"}`}>
                                  {((student.daysPresent / currentClassWorkingDays) * 100).toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </td>

                          {/* SUBJECT MARKS INPUTS ACCORDING TO DISPLAY MODE */}
                          {currentSubjects.map(sub => {
                            const { maxMark, passMark } = getSubjectMarkRules(sub, examSettings);
                            const markVal = student.subjectMarks[sub];
                            const displayVal = markVal === null || markVal === undefined ? "" : String(markVal);
                            const isFail = typeof markVal === "number" && markVal < passMark;

                            // 1. PASS / FAIL DIRECT ENTRY
                            if (examSettings.displayMode === "pass_fail_only") {
                              const currentPassStatus = student.subjectPassStatus?.[sub] || (
                                typeof markVal === "number" ? (markVal >= passMark ? "pass" : "fail") : "pass"
                              );

                              return (
                                <td key={sub} className={`p-2 border-l text-center ${isDark ? "border-slate-800/60" : "border-slate-200"}`}>
                                  <div className={`inline-flex items-center gap-1 p-1 rounded-xl border shadow-inner ${
                                    isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
                                  }`}>
                                    <button
                                      type="button"
                                      onClick={() => handleDirectPassFailChange(student.studentId, sub, "pass")}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                                        currentPassStatus === "pass"
                                          ? "bg-emerald-600 text-white shadow-xs"
                                          : isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-800"
                                      }`}
                                      title="പാസ്സ് (Pass)"
                                    >
                                      P
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDirectPassFailChange(student.studentId, sub, "fail")}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                                        currentPassStatus === "fail"
                                          ? "bg-rose-600 text-white shadow-xs"
                                          : isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-800"
                                      }`}
                                      title="തോറ്റു (Fail)"
                                    >
                                      F
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDirectPassFailChange(student.studentId, sub, "absent")}
                                      className={`px-1.5 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer ${
                                        currentPassStatus === "absent"
                                          ? "bg-amber-600 text-white shadow-xs"
                                          : isDark ? "text-slate-600 hover:text-slate-400" : "text-slate-500 hover:text-slate-700"
                                      }`}
                                      title="ഹാജരില്ല (Absent)"
                                    >
                                      Abs
                                    </button>
                                  </div>
                                </td>
                              );
                            }

                            // 2. GRADES ONLY DIRECT ENTRY
                            if (examSettings.displayMode === "grades_only") {
                              const currentGr = student.subjectGrades?.[sub] || (
                                typeof markVal === "number"
                                  ? evaluateSubjectScore(markVal, sub, examSettings, student.maxMarks).grade
                                  : "-"
                              );

                              return (
                                <td key={sub} className={`p-2 border-l text-center ${isDark ? "border-slate-800/60" : "border-slate-200"}`}>
                                  <select
                                    value={currentGr}
                                    onChange={(e) => handleDirectGradeChange(student.studentId, sub, e.target.value)}
                                    className={`p-1.5 rounded-xl text-xs font-black outline-none cursor-pointer border ${
                                      isDark ? "bg-slate-950" : "bg-white"
                                    } ${
                                      currentGr === "A+" || currentGr === "A" ? (isDark ? "border-emerald-500/60 text-emerald-300" : "border-emerald-400 text-emerald-800") :
                                      currentGr === "B" ? (isDark ? "border-blue-500/60 text-blue-300" : "border-blue-400 text-blue-800") :
                                      currentGr === "C" ? (isDark ? "border-amber-500/60 text-amber-300" : "border-amber-400 text-amber-800") :
                                      currentGr === "F" ? (isDark ? "border-rose-500/80 text-rose-300 bg-rose-950/40" : "border-rose-400 text-rose-800 bg-rose-50") :
                                      (isDark ? "border-slate-700 text-slate-300" : "border-slate-300 text-slate-700")
                                    }`}
                                  >
                                    <option value="-">-</option>
                                    <option value="A+">A+</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                    <option value="F">F (Fail)</option>
                                    <option value="Absent">Abs</option>
                                  </select>
                                </td>
                              );
                            }

                            // 3. FULL NUMERIC MARKS ENTRY
                            return (
                              <td key={sub} className={`p-2 border-l text-center ${isDark ? "border-slate-800/60" : "border-slate-200"}`}>
                                <div className="relative inline-block">
                                  <input
                                    type="number"
                                    min="0"
                                    max={maxMark}
                                    value={displayVal}
                                    onChange={(e) => handleMarkChange(student.studentId, sub, e.target.value)}
                                    placeholder="-"
                                    className={`w-16 p-1.5 rounded-lg text-center font-bold text-xs outline-none transition ${
                                      isFail 
                                        ? (isDark ? "bg-rose-950/60 border border-rose-500/80 text-rose-200 focus:ring-2 focus:ring-rose-500" : "bg-rose-50 border border-rose-300 text-rose-800 focus:ring-2 focus:ring-rose-400")
                                        : (isDark ? "bg-slate-950 border border-slate-700 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500" : "bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400")
                                    }`}
                                  />
                                  {isFail && (
                                    <span className="absolute -top-1.5 -right-1.5 px-1 py-0.2 bg-rose-600 text-white text-[8px] font-black rounded-full" title={`പാസ്സ് മാർക്ക്: ${passMark}`}>
                                      F
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}

                          {/* TOTAL & PERCENTAGE (ONLY ON FULL MARKS MODE) */}
                          {examSettings.displayMode === "marks_and_grades" && (
                            <>
                              <td className={`p-3 border-l text-center font-mono font-extrabold ${isDark ? "border-slate-800 text-white" : "border-slate-200 text-slate-900"}`}>
                                <span>{studentEval.totalMarks}</span>
                                <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>/{studentEval.maxTotalMarks}</span>
                              </td>

                              <td className={`p-3 text-center font-mono font-bold ${isDark ? "text-sky-400" : "text-sky-700"}`}>
                                {studentEval.percentage}%
                              </td>
                            </>
                          )}

                          {/* PASS / FAIL BADGE & DIRECT TOGGLE BUTTON */}
                          <td className={`p-3 text-center border-l ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                            {examSettings.displayMode === "pass_fail_only" ? (
                              <button
                                type="button"
                                onClick={() => handleToggleOverallPassFail(student.studentId)}
                                className={`px-3 py-1 rounded-full text-xs font-black transition cursor-pointer border ${
                                  isPassed
                                    ? (isDark ? "bg-emerald-950 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900" : "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200")
                                    : (isDark ? "bg-rose-950 text-rose-300 border-rose-500/50 hover:bg-rose-900" : "bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200")
                                }`}
                                title="ക്ലിക്ക് ചെയ്ത് പാസ്സ് / തോൽവി മാറ്റുക"
                              >
                                {isPassed ? "✓ വിജയിച്ചു" : "✕ തോറ്റു"}
                              </button>
                            ) : (
                              studentEval.scoredSubjectsCount === 0 ? (
                                <span className="text-slate-400 text-[10px] font-bold">-</span>
                              ) : isPassed ? (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border inline-flex items-center gap-1 ${
                                  isDark ? "bg-emerald-950 text-emerald-300 border-emerald-500/40" : "bg-emerald-100 text-emerald-800 border-emerald-300"
                                }`}>
                                  <CheckCircle2 className={`w-2.5 h-2.5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
                                  <span>വിജയിച്ചു</span>
                                </span>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border inline-flex items-center gap-1 ${
                                  isDark ? "bg-rose-950 text-rose-300 border-rose-500/40" : "bg-rose-100 text-rose-800 border-rose-300"
                                }`} title={`തോറ്റ വിഷയങ്ങൾ: ${studentEval.failedSubjects.join(", ")}`}>
                                  <AlertTriangle className={`w-2.5 h-2.5 ${isDark ? "text-rose-400" : "text-rose-600"}`} />
                                  <span>തോറ്റു ({studentEval.failedSubjects.length})</span>
                                </span>
                              )
                            )}
                          </td>

                          {/* GRADE */}
                          {examSettings.displayMode !== "pass_fail_only" && (
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                                (student.grade || studentEval.grade)?.includes("A+")
                                  ? (isDark ? "bg-emerald-950/80 text-emerald-300 border-emerald-600/40" : "bg-emerald-100 text-emerald-800 border-emerald-300")
                                  : (student.grade || studentEval.grade)?.includes("A")
                                  ? (isDark ? "bg-teal-950/80 text-teal-300 border-teal-600/40" : "bg-teal-100 text-teal-800 border-teal-300")
                                  : (student.grade || studentEval.grade)?.includes("B")
                                  ? (isDark ? "bg-blue-950/80 text-blue-300 border-blue-600/40" : "bg-blue-100 text-blue-800 border-blue-300")
                                  : (student.grade || studentEval.grade)?.includes("C")
                                  ? (isDark ? "bg-amber-950/80 text-amber-300 border-amber-600/40" : "bg-amber-100 text-amber-800 border-amber-300")
                                  : (isDark ? "bg-slate-900 text-slate-400 border-slate-800" : "bg-slate-100 text-slate-700 border-slate-300")
                              }`}>
                                {student.grade || studentEval.grade || "-"}
                              </span>
                            </td>
                          )}

                          {/* RANK */}
                          {examSettings.showRank && (
                            <td className={`p-3 text-center font-bold font-mono ${isDark ? "text-amber-300" : "text-amber-700"}`}>
                              {student.rank ? `#${student.rank}` : "-"}
                            </td>
                          )}

                          {/* STATUS BADGE */}
                          <td className="p-3 text-center">
                            {isWithheld ? (
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border inline-flex items-center gap-1 ${
                                isDark ? "bg-red-950 text-red-300 border-red-500/50" : "bg-rose-100 text-rose-800 border-rose-300"
                              }`}>
                                <Lock className={`w-2.5 h-2.5 ${isDark ? "text-red-400" : "text-rose-600"}`} />
                                <span>തടഞ്ഞുവെച്ചു</span>
                              </span>
                            ) : (
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border inline-flex items-center gap-1 ${
                                isDark ? "bg-emerald-950 text-emerald-300 border-emerald-500/50" : "bg-emerald-100 text-emerald-800 border-emerald-300"
                              }`}>
                                <CheckCircle2 className={`w-2.5 h-2.5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
                                <span>പ്രസിദ്ധീകരിച്ചു</span>
                              </span>
                            )}
                          </td>

                          {/* ACTIONS */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {isWithheld ? (
                                <button
                                  type="button"
                                  onClick={() => handleReleaseWithhold(student)}
                                  title="റിസൾട്ട് റിലീസ് ചെയ്യുക"
                                  className={`px-2 py-1 rounded-lg text-3xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                                    isDark
                                      ? "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-600/40"
                                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                                  }`}
                                >
                                  <Unlock className="w-3 h-3" />
                                  <span>റിലീസ്</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setWithholdModalStudent(student)}
                                  title="ഫലം തടഞ്ഞുവെക്കുക"
                                  className={`px-2 py-1 rounded-lg text-3xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                                    isDark
                                      ? "bg-red-950/80 hover:bg-red-900 text-red-300 border-red-600/40"
                                      : "bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200"
                                  }`}
                                >
                                  <Lock className="w-3 h-3" />
                                  <span>തടയുക</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TABULATION REGISTER SHEET & PRINT */}
      {activeTab === "tabulation" && (
        <div className="space-y-4">
          
          {/* ACTION BAR */}
          <div className="no-print bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-purple-400" />
              <span className="font-extrabold text-white">ക്ലാസ്സ് ടാബുലേഷൻ ഷീറ്റ് (A4 Landscape Print Sheet)</span>
              <span className="text-purple-400 font-bold">• {selectedClass}</span>
            </div>

            <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const printableWindow = window.open("", "_blank");
                    if (printableWindow) {
                      printableWindow.document.write("<html><head><title>Marklist</title>");
                      printableWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">');
                      printableWindow.document.write("</head><body>");
                      printableWindow.document.write(document.getElementById("printable-marklist-all")?.innerHTML || "");
                      printableWindow.document.write("</body></html>");
                      printableWindow.document.close();
                      printableWindow.print();
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Printer className="w-4 h-4" />
                  <span>എല്ലാ ക്ലാസ്സും പ്രിന്റ് ചെയ്യുക (Print All)</span>
                </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Printer className="w-4 h-4" />
                <span>പ്രിന്റ് എടുക്കുക (Print A4)</span>
              </button>
            </div>
          </div>

          {/* HIDDEN PRINTABLE CONTENT */}
          <div id="printable-marklist-all" className="absolute -left-[9999px] top-0">
            <PrintableMarklistSheet 
              madrasaName={madrasaName}
              examTitle={examTitle}
              academicYear={academicYear}
              resultsData={resultsData}
              workspaceStudents={workspaceStudents}
              examSettings={examSettings}
            />
          </div>

          {/* TABULATION SHEET PAPER (PRINTABLE) */}
          <div id="real-print-content" className="printable-paper-sheet bg-white text-slate-900 border border-slate-300 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 print:m-0 print:p-2 print:border-none print:shadow-none">
            
            {/* OFFICIAL HEADER */}
            <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
              <div className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                OFFICIAL EXAMINATION TABULATION REGISTER
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-display">
                {madrasaName}
              </h2>
              <p className="text-xs text-slate-700 font-bold">
                {madrasaPlace && `${madrasaPlace} • `}
                {madrasaRegNo && `Reg No: ${madrasaRegNo} • `}
                {examTitle} • അധ്യയന വർഷം: {academicYear}
              </p>
              <div className="inline-block mt-1 px-3 py-0.5 bg-slate-100 border border-slate-400 rounded-full text-xs font-black text-slate-800">
                ക്ലാസ്സ്: {selectedClass} • ആകെ വിദ്യാർത്ഥികൾ: {currentClassStudents.length}
              </div>
            </div>

            {/* REGISTER TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-black border-b border-slate-400 text-[11px]">
                    <th className="p-2 border border-slate-300 text-center w-8">#</th>
                    <th className="p-2 border border-slate-300 w-16 text-center">റോൾ</th>
                    <th className="p-2 border border-slate-300 min-w-[150px]">വിദ്യാർത്ഥിയുടെ പേര്</th>
                    
                    {currentSubjects.map(sub => {
                      const { maxMark, passMark } = getSubjectMarkRules(sub, examSettings);
                      return (
                        <th key={sub} className="p-2 border border-slate-300 text-center min-w-[70px]">
                          <span className="block font-bold">{sub}</span>
                          <span className="text-[9px] font-mono text-slate-600 block">({maxMark} | P:{passMark})</span>
                        </th>
                      );
                    })}

                    <th className="p-2 border border-slate-300 text-center w-16">ആകെ</th>
                    <th className="p-2 border border-slate-300 text-center w-12">%</th>
                    <th className="p-2 border border-slate-300 text-center w-24">ഫലം</th>
                    <th className="p-2 border border-slate-300 text-center w-24">ഗ്രേഡ്</th>
                  </tr>
                </thead>
                <tbody>
                  {currentClassStudents.map((st, idx) => {
                    const evalResult = calculateStudentOverallResult(st.subjectMarks || {}, examSettings, st.maxMarks);
                    const isPassed = evalResult.overallResult === "passed";

                    return (
                      <tr key={`${st.studentId}-${st.admissionNumber}-${idx}`} className="hover:bg-slate-50 border-b border-slate-300">
                        <td className="p-2 border border-slate-300 text-center font-mono text-slate-600">{idx + 1}</td>
                        <td className="p-2 border border-slate-300 text-center font-mono font-bold">{st.admissionNumber}</td>
                        <td className="p-2 border border-slate-300">
                          <div className="font-extrabold text-slate-900">{st.name}</div>
                        </td>

                        {currentSubjects.map(sub => {
                          const { passMark } = getSubjectMarkRules(sub, examSettings);
                          const mark = st.subjectMarks[sub];
                          const isFail = typeof mark === "number" && mark < passMark;

                          return (
                            <td key={sub} className={`p-2 border border-slate-300 text-center font-mono font-bold ${
                              isFail ? "text-rose-700 bg-rose-50" : "text-slate-900"
                            }`}>
                              {mark === null || mark === undefined ? "-" : mark}
                              {isFail && <span className="text-[8px] text-rose-700 block font-bold">FAIL</span>}
                            </td>
                          );
                        })}

                        <td className="p-2 border border-slate-300 text-center font-mono font-extrabold text-slate-900">
                          {evalResult.totalMarks}
                        </td>
                        <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-800">
                          {evalResult.percentage}%
                        </td>
                        <td className="p-2 border border-slate-300 text-center font-extrabold">
                          {st.status === "withheld" ? (
                            <span className="text-amber-800 font-bold">തടഞ്ഞു</span>
                          ) : isPassed ? (
                            <span className="text-emerald-700 font-black">വിജയിച്ചു</span>
                          ) : (
                            <span className="text-rose-700 font-black">തോറ്റു</span>
                          )}
                        </td>
                        <td className="p-2 border border-slate-300 text-center text-xs font-bold text-slate-700">
                          {evalResult.grade || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* SUMMARY PERFORMANCE REGISTER BOX */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border border-slate-400 p-4 rounded-xl text-xs bg-slate-50">
              <div>
                <span className="text-slate-600 block text-[10px]">ആകെ വിദ്യാർത്ഥികൾ:</span>
                <span className="font-extrabold font-mono text-slate-900 text-sm">{classStats.total}</span>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px]">പരീക്ഷ എഴുതിയവർ:</span>
                <span className="font-extrabold font-mono text-slate-900 text-sm">{classStats.appeared}</span>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px]">വിജയിച്ചവർ / തോറ്റവർ:</span>
                <span className="font-extrabold font-mono text-emerald-800 text-sm">
                  {classStats.passed} ജയിച്ചു / <span className="text-rose-700">{classStats.failed} തോറ്റു</span>
                </span>
              </div>
              <div>
                <span className="text-slate-600 block text-[10px]">വിജയ ശതമാനം (Pass %):</span>
                <span className="font-black font-mono text-slate-900 text-base">{classStats.passPct}%</span>
              </div>
            </div>

            {/* OFFICIAL SIGNATURE BLOCK */}
            <div className="pt-10 flex items-center justify-between text-xs text-slate-800">
              <div className="text-center space-y-6">
                <div className="h-6"></div>
                <div className="border-t-2 border-slate-800 px-8 font-bold">ക്ലാസ് അദ്ധ്യാപകൻ</div>
              </div>

              <div className="text-center space-y-6">
                <div className="h-6"></div>
                <div className="border-t-2 border-slate-800 px-8 font-bold">പരീക്ഷാ കൺട്രോളർ</div>
              </div>

              <div className="text-center space-y-6">
                <div className="h-6"></div>
                <div className="border-t-2 border-slate-800 px-8 font-bold">സദർ മുഅല്ലിം / പ്രിൻസിപ്പാൾ</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: EXAM SETTINGS VIEW */}
      {activeTab === "settings" && (
        <div className={`border p-6 sm:p-8 rounded-3xl space-y-8 max-w-4xl mx-auto shadow-2xl transition ${
          isDark ? "bg-slate-900/90 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-xl"
        }`}>
          
          <div className={`border-b pb-4 flex items-center justify-between ${isDark ? "border-slate-800" : "border-slate-200"}`}>
            <div className="flex items-center gap-3">
              <span className={`p-2.5 rounded-2xl border ${
                isDark ? "bg-purple-950 text-purple-400 border-purple-800/60" : "bg-purple-100 text-purple-700 border-purple-200"
              }`}>
                <Settings className="w-5 h-5" />
              </span>
              <div>
                <h3 className={`text-lg font-black ${isDark ? "text-white" : "text-slate-900"}`}>പരീക്ഷാ & പാസ്സ് മാർക്ക് ക്രമീകരണങ്ങൾ</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>പരമാവധി മാർക്ക് (Max Mark), പാസ്സ് മാർക്ക്, ഖുർആൻ പ്രത്യേക നിബന്ധനകൾ, പ്രദർശന രീതികൾ</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("mark_entry")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              }`}
            >
              തിരികെ മാർക്ക് എൻട്രിയിലേക്ക്
            </button>
          </div>

          {/* SECTION B: GLOBAL MARKS */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
            <div>
              <label className={`block font-bold text-xs mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                ഡിഫോൾട്ട് പരമാവധി മാർക്ക് (Default Max Mark):
              </label>
              <input
                type="number"
                min="10"
                max="200"
                value={examSettings.defaultMaxMark}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 50;
                  applySettingsToResults({ ...examSettings, defaultMaxMark: val });
                }}
                className={`w-full border p-2.5 rounded-xl font-mono font-bold outline-none text-sm transition ${
                  isDark ? "bg-slate-950 border-slate-700 text-white focus:border-purple-500" : "bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-600 focus:bg-white"
                }`}
              />
              <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>മദ്റസാ പരീക്ഷകൾക്ക് സാധാരണയായി 50 ആണ്.</span>
            </div>

            <div>
              <label className={`block font-bold text-xs mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                ഡിഫോൾട്ട് പാസ്സ് മാർക്ക് (Default Pass Mark):
              </label>
              <input
                type="number"
                min="1"
                max={examSettings.defaultMaxMark}
                value={examSettings.defaultPassMark}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 18;
                  applySettingsToResults({ ...examSettings, defaultPassMark: val });
                }}
                className={`w-full border p-2.5 rounded-xl font-mono font-bold outline-none text-sm transition ${
                  isDark ? "bg-slate-950 border-slate-700 text-emerald-400 focus:border-purple-500" : "bg-slate-50 border-slate-300 text-emerald-700 focus:border-purple-600 focus:bg-white"
                }`}
              />
              <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>50-ൽ 18 മാർക്കാണ് സാധാരണ പാസ്സ് മാർക്ക്.</span>
            </div>
          </div>

          {/* SECTION C: SUBJECT SPECIFIC RULES (QURAN 20, ETC.) */}
          <div className={`space-y-3 pt-4 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
            <div className="flex items-center justify-between">
              <div>
                <label className={`block font-extrabold text-xs uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  വിഷയാടിസ്ഥാനത്തിലുള്ള പ്രത്യേക നിബന്ധനകൾ (Subject-wise Rules):
                </label>
                <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  ഉദാഹരണത്തിന്: ഖുർആൻ വിഷയത്തിന് 20 പാസ്സ് മാർക്ക് നിർബന്ധമാക്കാനും, മറ്റ് വിഷയങ്ങൾക്ക് 18 ആക്കാനും ഇവിടെ മാറ്റാം:
                </p>
              </div>
            </div>

            <div className={`overflow-x-auto border rounded-2xl ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b font-bold ${isDark ? "bg-slate-950 text-slate-400 border-slate-800" : "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    <th className="p-3">വിഷയം (Subject)</th>
                    <th className="p-3 text-center w-36">പരമാവധി മാർക്ക്</th>
                    <th className="p-3 text-center w-36">പാസ്സ് മാർക്ക്</th>
                    <th className="p-3 text-center w-40">നിലവിലെ അവസ്ഥ</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-200"}`}>
                  {currentSubjects.map(sub => {
                    const { maxMark, passMark } = getSubjectMarkRules(sub, examSettings);
                    return (
                      <tr key={sub} className={isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}>
                        <td className={`p-3 font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                          <BookOpen className={`w-3.5 h-3.5 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
                          <span>{sub}</span>
                        </td>

                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="10"
                            max="200"
                            value={maxMark}
                            onChange={(e) => {
                              const newMax = parseInt(e.target.value, 10) || examSettings.defaultMaxMark;
                              handleUpdateSubjectRule(sub, newMax, passMark);
                            }}
                            className={`w-20 p-1.5 border rounded-lg text-center font-mono font-bold text-xs outline-none transition ${
                              isDark ? "bg-slate-950 border-slate-700 text-white focus:border-purple-500" : "bg-white border-slate-300 text-slate-900 focus:border-purple-600"
                            }`}
                          />
                        </td>

                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="1"
                            max={maxMark}
                            value={passMark}
                            onChange={(e) => {
                              const newPass = parseInt(e.target.value, 10) || examSettings.defaultPassMark;
                              handleUpdateSubjectRule(sub, maxMark, newPass);
                            }}
                            className={`w-20 p-1.5 border rounded-lg text-center font-mono font-bold text-xs outline-none transition ${
                              passMark === 20
                                ? (isDark ? "bg-slate-950 border-amber-500 text-amber-300" : "bg-amber-50 border-amber-400 text-amber-800")
                                : (isDark ? "bg-slate-950 border-slate-700 text-emerald-400" : "bg-white border-slate-300 text-emerald-700")
                            }`}
                          />
                        </td>

                        <td className="p-3 text-center">
                          {passMark > examSettings.defaultPassMark ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isDark ? "bg-amber-950 text-amber-300 border-amber-800/60" : "bg-amber-100 text-amber-800 border-amber-300"
                            }`}>
                              പ്രത്യേക പാസ്സ്: {passMark}
                            </span>
                          ) : (
                            <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>സാധാരണ ({passMark})</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION C2: GRADE RULES (ഔദ്യോഗിക ബോർഡ് ഗ്രേഡ് നിയമങ്ങളും കസ്റ്റമൈസേഷനും) */}
          <div className={`space-y-4 pt-4 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <label className={`block font-extrabold text-xs uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    ഗ്രേഡ് നിശ്ചയിക്കുന്ന വിധം & കസ്റ്റമൈസേഷൻ (Grade Scale & Determination):
                  </label>
                </div>
                <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  ഔദ്യോഗിക സമസ്ത മദ്റസാ ബോർഡ് സർക്കുലർ പ്രകാരമുള്ള ഗ്രേഡ് ക്രമവും, നിങ്ങളുടെ ആവശ്യാനുസരണം മാറ്റങ്ങൾ വരുത്താനുള്ള സൗകര്യവും:
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetGradeRulesToOfficial}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    isDark 
                      ? "bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800" 
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs"
                  }`}
                  title="ഔദ്യോഗിക ബോർഡ് സർക്കുലറിലെ മാനദണ്ഡങ്ങളിലേക്ക് റീസെറ്റ് ചെയ്യുക"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>ബോർഡ് ക്രമം റീസെറ്റ്</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddGradeRule}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
                    isDark 
                      ? "bg-purple-600 hover:bg-purple-500 text-white" 
                      : "bg-purple-700 hover:bg-purple-800 text-white"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>പുതിയ ഗ്രേഡ്</span>
                </button>
              </div>
            </div>

            {/* OFFICIAL BOARD CIRCULAR NOTICE & SPECIAL 20 MARK SUBJECTS SHORTCUT */}
            <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
              isDark ? "bg-amber-950/30 border-amber-800/40 text-amber-200" : "bg-amber-50/80 border-amber-200 text-amber-950"
            }`}>
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <div className="font-extrabold text-xs flex items-center justify-between">
                    <span>ബോർഡ് സർക്കുലർ പ്രകാരമുള്ള പ്രധാന നിബന്ധനകൾ (Official Board Circular):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed opacity-90">
                    <li>
                      <strong>D+ ഉം അതിനു മുകളിലും</strong> ഗ്രേഡ് ലഭിച്ചവരെ മാത്രമേ <strong>വിജയികളായി</strong> പരിഗണിക്കൂ. (D ഗ്രേഡ് = പരാജയം / തോറ്റു).
                    </li>
                    <li>
                      <strong>രണ്ടു മുതൽ ഏഴുവരെ ക്ലാസുകളിൽ ഖുർആനിനും ഒന്നാം തരത്തിലെ തഫ്ഹീമുത്തിലാവക്കും ദുറൂസ് അറബി മലയാളത്തിനും കേട്ടെഴുത്തിനും</strong> ജയിക്കുന്നതിനാവശ്യമായ D+ ഗ്രേഡ് ലഭിക്കാൻ <strong>20 മാർക്ക്</strong> നിർബന്ധമാണ്.
                    </li>
                  </ul>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleApplyOfficialSpecialSubjectRules}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition inline-flex items-center gap-1.5 cursor-pointer ${
                        isDark 
                          ? "bg-amber-900/60 border-amber-600 text-amber-200 hover:bg-amber-800" 
                          : "bg-white border-amber-300 text-amber-900 hover:bg-amber-100 shadow-xs"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>ഈ 4 വിഷയങ്ങൾക്കും 20 പാസ്സ് മാർക്ക് നിശ്ചയിക്കുക (Apply 20 Pass Mark Rule)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* VISUAL BOARD LADDER PREVIEW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {currentGradeRules.map((gr) => (
                <div 
                  key={gr.id}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-between ${
                    gr.isPass 
                      ? (isDark ? "bg-slate-900/60 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800")
                      : (isDark ? "bg-rose-950/30 border-rose-900/50 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-900")
                  }`}
                >
                  <div className={`text-base font-black px-2.5 py-0.5 rounded-md ${
                    gr.grade === "A+" ? "bg-emerald-500 text-white" :
                    gr.grade === "A" ? "bg-emerald-600 text-white" :
                    gr.grade === "B+" ? "bg-blue-500 text-white" :
                    gr.grade === "B" ? "bg-blue-600 text-white" :
                    gr.grade === "C+" ? "bg-amber-500 text-white" :
                    gr.grade === "C" ? "bg-amber-600 text-white" :
                    gr.grade === "D+" ? "bg-purple-600 text-white" :
                    "bg-rose-600 text-white"
                  }`}>
                    {gr.grade}
                  </div>
                  <div className="text-[11px] font-bold mt-1 font-mono">
                    {gr.minMark}-{gr.maxMark} <span className="text-[9px] font-normal text-slate-500">({gr.minPercentage}%)</span>
                  </div>
                  <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-1 ${
                    gr.isPass 
                      ? (isDark ? "bg-emerald-950 text-emerald-300" : "bg-emerald-100 text-emerald-800")
                      : (isDark ? "bg-rose-950 text-rose-300" : "bg-rose-100 text-rose-800")
                  }`}>
                    {gr.isPass ? "വിജയം" : "പരാജയം"}
                  </span>
                </div>
              ))}
            </div>

            {/* EDITABLE GRADE RULES TABLE */}
            <div className={`overflow-x-auto border rounded-2xl ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b font-bold ${isDark ? "bg-slate-950 text-slate-400 border-slate-800" : "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    <th className="p-3 w-24">ഗ്രേഡ്</th>
                    <th className="p-3 text-center w-48">മാർക്ക് പരിധി (50-ൽ)</th>
                    <th className="p-3 text-center w-40">ശതമാനം (%)</th>
                    <th className="p-3 text-center w-36">വിജയ പദവി</th>
                    <th className="p-3 text-center w-20">ആക്ഷൻ</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-200"}`}>
                  {currentGradeRules.map((rule) => {
                    return (
                      <tr key={rule.id} className={isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}>
                        {/* GRADE SYMBOL */}
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={rule.grade}
                            onChange={(e) => handleUpdateGradeRule(rule.id, { grade: e.target.value.trim().toUpperCase(), label: e.target.value.trim().toUpperCase() })}
                            className={`w-16 p-1.5 border rounded-lg font-black text-center text-xs outline-none transition ${
                              isDark ? "bg-slate-950 border-slate-700 text-white focus:border-purple-500" : "bg-white border-slate-300 text-slate-900 focus:border-purple-600"
                            }`}
                          />
                        </td>

                        {/* MIN / MAX MARK */}
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={rule.minMark}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                handleUpdateGradeRule(rule.id, { minMark: val });
                              }}
                              className={`w-16 p-1.5 border rounded-lg text-center font-mono font-bold text-xs outline-none transition ${
                                isDark ? "bg-slate-950 border-slate-700 text-white focus:border-purple-500" : "bg-white border-slate-300 text-slate-900 focus:border-purple-600"
                              }`}
                            />
                            <span className="text-slate-400 font-bold">-</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={rule.maxMark}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                handleUpdateGradeRule(rule.id, { maxMark: val });
                              }}
                              className={`w-16 p-1.5 border rounded-lg text-center font-mono font-bold text-xs outline-none transition ${
                                isDark ? "bg-slate-950 border-slate-700 text-white focus:border-purple-500" : "bg-white border-slate-300 text-slate-900 focus:border-purple-600"
                              }`}
                            />
                          </div>
                        </td>

                        {/* MIN / MAX PERCENTAGE */}
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={rule.minPercentage}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                handleUpdateGradeRule(rule.id, { minPercentage: val });
                              }}
                              className={`w-14 p-1.5 border rounded-lg text-center font-mono text-xs outline-none transition ${
                                isDark ? "bg-slate-950 border-slate-700 text-slate-300 focus:border-purple-500" : "bg-white border-slate-300 text-slate-700 focus:border-purple-600"
                              }`}
                            />
                            <span className="text-slate-400">%</span>
                            <span className="text-slate-400 font-bold">-</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={rule.maxPercentage}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                handleUpdateGradeRule(rule.id, { maxPercentage: val });
                              }}
                              className={`w-14 p-1.5 border rounded-lg text-center font-mono text-xs outline-none transition ${
                                isDark ? "bg-slate-950 border-slate-700 text-slate-300 focus:border-purple-500" : "bg-white border-slate-300 text-slate-700 focus:border-purple-600"
                              }`}
                            />
                            <span className="text-slate-400">%</span>
                          </div>
                        </td>

                        {/* PASS OR FAIL TOGGLE */}
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleUpdateGradeRule(rule.id, { isPass: !rule.isPass })}
                            className={`px-3 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                              rule.isPass 
                                ? (isDark ? "bg-emerald-950 border-emerald-800 text-emerald-300 hover:bg-emerald-900" : "bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200")
                                : (isDark ? "bg-rose-950 border-rose-800 text-rose-300 hover:bg-rose-900" : "bg-rose-100 border-rose-300 text-rose-800 hover:bg-rose-200")
                            }`}
                          >
                            {rule.isPass ? "✓ വിജയം (Pass)" : "✕ തോറ്റു (Fail)"}
                          </button>
                        </td>

                        {/* DELETE BUTTON */}
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteGradeRule(rule.id)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isDark ? "border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-900" : "border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300"
                            }`}
                            title="ഈ ഗ്രേഡ് ഒഴിവാക്കുക"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION D: PARENT DISPLAY MODE */}
          <div className={`space-y-3 pt-4 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
            <div>
              <label className={`block font-extrabold text-xs uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                രക്ഷിതാക്കൾക്ക് ഫലം കാണിക്കുന്ന രീതി (Parent Result Display Mode):
              </label>
              <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                ചില മദ്റസകളിൽ കുട്ടികളുടെ മാർക്ക് രക്ഷിതാക്കൾക്ക് കാണിക്കാതെ പാസ്സ് / തോൽവി മാത്രം നൽകാൻ താല്പര്യപ്പെടാറുണ്ട്:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* MODE 1: MARKS AND GRADES */}
              <button
                type="button"
                onClick={() => applySettingsToResults({ ...examSettings, displayMode: "marks_and_grades" })}
                className={`p-4 rounded-2xl text-left border space-y-1.5 transition cursor-pointer ${
                  examSettings.displayMode === "marks_and_grades"
                    ? (isDark ? "bg-purple-950/80 border-purple-400 text-white shadow-lg" : "bg-purple-50 border-purple-500 text-purple-950 shadow-md")
                    : (isDark ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900")
                }`}
              >
                <div className={`font-extrabold text-xs flex items-center justify-between ${
                  examSettings.displayMode === "marks_and_grades" ? (isDark ? "text-white" : "text-purple-950") : (isDark ? "text-white" : "text-slate-800")
                }`}>
                  <span>മാർക്കുകളും ഗ്രേഡും (Full Marks)</span>
                  {examSettings.displayMode === "marks_and_grades" && <Check className="w-4 h-4 text-purple-600" />}
                </div>
                <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  നേടിയ മാർക്ക്, മാക്സിമം മാർക്ക്, പാസ്സ് മാർക്ക്, ഗ്രേഡ്, ശതമാനം എല്ലാം വിശദമായി കാണിക്കും.
                </p>
              </button>

              {/* MODE 2: PASS / FAIL ONLY */}
              <button
                type="button"
                onClick={() => applySettingsToResults({ ...examSettings, displayMode: "pass_fail_only" })}
                className={`p-4 rounded-2xl text-left border space-y-1.5 transition cursor-pointer ${
                  examSettings.displayMode === "pass_fail_only"
                    ? (isDark ? "bg-purple-950/80 border-purple-400 text-white shadow-lg" : "bg-purple-50 border-purple-500 text-purple-950 shadow-md")
                    : (isDark ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900")
                }`}
              >
                <div className={`font-extrabold text-xs flex items-center justify-between ${
                  examSettings.displayMode === "pass_fail_only" ? (isDark ? "text-white" : "text-purple-950") : (isDark ? "text-white" : "text-slate-800")
                }`}>
                  <span>പാസ്സ് / തോൽവി മാത്രം (Pass/Fail Only)</span>
                  {examSettings.displayMode === "pass_fail_only" && <Check className="w-4 h-4 text-purple-600" />}
                </div>
                <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  മാർക്കുകളുടെ എണ്ണം കാണിക്കില്ല. കുട്ടി പാസ്സായോ തോറ്റോ എന്ന് മാത്രം രക്ഷിതാക്കൾക്ക് അറിയാം.
                </p>
              </button>

              {/* MODE 3: GRADES ONLY */}
              <button
                type="button"
                onClick={() => applySettingsToResults({ ...examSettings, displayMode: "grades_only" })}
                className={`p-4 rounded-2xl text-left border space-y-1.5 transition cursor-pointer ${
                  examSettings.displayMode === "grades_only"
                    ? (isDark ? "bg-purple-950/80 border-purple-400 text-white shadow-lg" : "bg-purple-50 border-purple-500 text-purple-950 shadow-md")
                    : (isDark ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900")
                }`}
              >
                <div className={`font-extrabold text-xs flex items-center justify-between ${
                  examSettings.displayMode === "grades_only" ? (isDark ? "text-white" : "text-purple-950") : (isDark ? "text-white" : "text-slate-800")
                }`}>
                  <span>ഗ്രേഡ് മാത്രം (Grades Only)</span>
                  {examSettings.displayMode === "grades_only" && <Check className="w-4 h-4 text-purple-600" />}
                </div>
                <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  മാർക്കുകളുടെ നമ്പർ കാണിക്കാതെ ഗ്രേഡുകളും (A+, A, B, C, D) പാസ്സ്/ഫെയിലും മാത്രം കാണിക്കും.
                </p>
              </button>

            </div>
          </div>

          {/* SECTION E: PUBLIC DISPLAY & COLUMN VISIBILITY CONTROLS */}
          <div className={`space-y-3 pt-4 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
            <div>
              <label className={`block font-extrabold text-xs uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                പബ്ലിക് പോർട്ടൽ ഹെഡ്ഡറുകൾ & വിവരങ്ങളുടെ നിയന്ത്രണം (Public Header & Column Controls):
              </label>
              <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                രക്ഷിതാക്കൾക്ക് പബ്ലിക് ലിങ്കിൽ ഏതൊക്കെ വിവരങ്ങൾ കാണിക്കണം, ഏതൊക്കെ മറച്ചുവെക്കണം എന്ന് ഇവിടെ നിയന്ത്രിക്കാം:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              
              {/* TOGGLE PERCENTAGE */}
              <label className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition ${
                isDark ? "bg-slate-950 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-200 hover:border-slate-300"
              }`}>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? "text-white" : "text-slate-900"}`}>ശതമാനം % കാണിക്കുക</span>
                  <span className={`text-[10px] block ${isDark ? "text-slate-400" : "text-slate-500"}`}>പബ്ലിക് കാർഡിൽ ആകെ ശതമാനം പ്രദർശിപ്പിക്കും</span>
                </div>
                <input
                  type="checkbox"
                  checked={examSettings.showPercentage}
                  onChange={(e) => applySettingsToResults({ ...examSettings, showPercentage: e.target.checked })}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </label>

              {/* TOGGLE RANK */}
              <label className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition ${
                isDark ? "bg-slate-950 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-200 hover:border-slate-300"
              }`}>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? "text-white" : "text-slate-900"}`}>ക്ലാസ്സ് റാങ്ക് കാണിക്കുക</span>
                  <span className={`text-[10px] block ${isDark ? "text-slate-400" : "text-slate-500"}`}>കുട്ടിയുടെ ക്ലാസ്സ് റാങ്ക് (#1, #2...) കാണിക്കും</span>
                </div>
                <input
                  type="checkbox"
                  checked={examSettings.showRank}
                  onChange={(e) => applySettingsToResults({ ...examSettings, showRank: e.target.checked })}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </label>

              {/* TOGGLE ATTENDANCE */}
              <label className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition ${
                isDark ? "bg-slate-950 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-200 hover:border-slate-300"
              }`}>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? "text-white" : "text-slate-900"}`}>ഹാജർ നില കാണിക്കുക</span>
                  <span className={`text-[10px] block ${isDark ? "text-slate-400" : "text-slate-500"}`}>കുട്ടിയുടെ ഹാജർ വിവരങ്ങൾ രക്ഷിതാക്കൾക്ക് കാണിക്കും</span>
                </div>
                <input
                  type="checkbox"
                  checked={examSettings.showAttendance}
                  onChange={(e) => applySettingsToResults({ ...examSettings, showAttendance: e.target.checked })}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </label>

              {/* TOGGLE TOTAL MARKS */}
              <label className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition ${
                isDark ? "bg-slate-950 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-200 hover:border-slate-300"
              }`}>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? "text-white" : "text-slate-900"}`}>ആകെ മാർക്ക് കാണിക്കുക</span>
                  <span className={`text-[10px] block ${isDark ? "text-slate-400" : "text-slate-500"}`}>ആകെ നേടിയ മാർക്കും ആകെ മാർക്കും കാണിക്കും</span>
                </div>
                <input
                  type="checkbox"
                  checked={examSettings.showTotalMarks}
                  onChange={(e) => applySettingsToResults({ ...examSettings, showTotalMarks: e.target.checked })}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </label>

              {/* TOGGLE SUBJECT MARKS TABLE */}
              <label className={`flex items-center justify-between p-3.5 border rounded-2xl cursor-pointer transition ${
                isDark ? "bg-slate-950 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-200 hover:border-slate-300"
              }`}>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? "text-white" : "text-slate-900"}`}>വിഷയ പട്ടിക കാണിക്കുക</span>
                  <span className={`text-[10px] block ${isDark ? "text-slate-400" : "text-slate-500"}`}>ഓരോ വിഷയത്തിന്റെയും വിശദ പട്ടിക കാണിക്കും</span>
                </div>
                <input
                  type="checkbox"
                  checked={examSettings.showSubjectMarks}
                  onChange={(e) => applySettingsToResults({ ...examSettings, showSubjectMarks: e.target.checked })}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </label>

            </div>
          </div>

          {/* SECTION F: PARENT SECURITY & VERIFICATION */}
          <div className={`space-y-3 pt-4 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
            <div>
              <label className={`block font-extrabold text-xs uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                രക്ഷിതാക്കളുടെ സുരക്ഷാ പരിശോധന (Parent Security & Verification):
              </label>
              <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                പബ്ലിക് ലിങ്കിലൂടെ പ്രവേശിക്കുമ്പോൾ കുട്ടികളുടെ ഫലം കാണുന്നതിന് സുരക്ഷാ കോഡ് നിർബന്ധമാക്കാം:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { id: "direct", label: "ഡയറക്ട് സെലക്ഷൻ", desc: "പാസ്‌വേഡ് ഇല്ലാതെ ഡ്രോപ്ഡൗണിൽ നിന്ന് നേരിട്ട് കാണാം" },
                { id: "student_pin", label: "കുട്ടിയുടെ വ്യക്തിഗത PIN", desc: "ഓരോ കുട്ടിക്കും സ്വന്തം രഹസ്യ പിൻ അല്ലെങ്കിൽ ആധാർ അവസാന 4 അക്കം" },
                { id: "password", label: "പൊതു പാസ്‌വേഡ് / കോമൺ പിൻ", desc: "മദ്റസ നൽകിയ പൊതുവായ രഹസ്യ പാസ്‌വേഡ് അടിച്ചാൽ മാത്രം കാണാം" },
                { id: "dob", label: "ജനനത്തീയതി (DOB)", desc: "വിദ്യാർത്ഥിയുടെ ജനനത്തീയതി നൽകി ഉറപ്പുവരുത്തണം" },
                { id: "password_or_dob", label: "പാസ്‌വേഡ് അല്ലെങ്കിൽ DOB", desc: "രണ്ടിൽ ഏതെങ്കിലും ഒന്ന് നൽകിയാൽ മതിയാകും" }
              ].map(sec => {
                const isSelected = (examSettings.publicAccessMode || examSettings.securityMode) === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => applySettingsToResults({ ...examSettings, publicAccessMode: sec.id as any, securityMode: sec.id as any })}
                    className={`p-3.5 rounded-2xl text-left border space-y-1 transition cursor-pointer ${
                      isSelected
                        ? (isDark ? "bg-purple-950/70 border-purple-400 text-white shadow" : "bg-purple-50 border-purple-500 text-purple-950 shadow-md")
                        : (isDark ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900")
                    }`}
                  >
                    <div className={`font-bold text-xs flex items-center justify-between ${
                      isSelected ? (isDark ? "text-white" : "text-purple-950") : (isDark ? "text-white" : "text-slate-800")
                    }`}>
                      <span>{sec.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-600" />}
                    </div>
                    <p className={`text-[10px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>{sec.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* SUB-QUESTION FOR STUDENT PIN SOURCE (USES SAVED STUDENT DATA WITHOUT RE-ASKING FOR CSV) */}
            {((examSettings.publicAccessMode || examSettings.securityMode) === "student_pin") && (
              <div className={`p-4 rounded-2xl border space-y-3 animate-in fade-in ${
                isDark ? "bg-purple-950/30 border-purple-700/60 text-purple-100" : "bg-purple-50/70 border-purple-200 text-purple-950"
              }`}>
                <div className="flex items-start gap-2.5">
                  <KeyRound className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-xs block">
                      ഉപചോദ്യം (Sub-Question): രക്ഷിതാക്കൾ ലോഗിൻ ചെയ്യുമ്പോൾ സെക്യൂരിറ്റി PIN ആയി എന്താണ് നൽകേണ്ടത്?
                    </span>
                    <span className={`text-[11px] block mt-0.5 ${isDark ? "text-purple-300" : "text-purple-800"}`}>
                      നേരത്തെ ചേർത്ത സ്റ്റുഡന്റ് ഡാറ്റയിൽ (Samastha CSV / Workspace) നിന്ന് താഴെ തിരഞ്ഞെടുക്കുന്ന വിവരം ഓട്ടോമാറ്റിക്കായി PIN ആയി സെറ്റ് ചെയ്യപ്പെടും. വീണ്ടും CSV അപ്‌ലോഡ് ചെയ്യേണ്ടതില്ല:
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {[
                    {
                      id: "aadhaar_last4" as StudentPinSourceType,
                      label: "ആധാർ അവസാന 4 അക്കം",
                      desc: "Aadhaar നമ്പറിന്റെ അവസാന 4 അക്കങ്ങൾ (ഉദാ: 4829)"
                    },
                    {
                      id: "aadhaar_last6" as StudentPinSourceType,
                      label: "ആധാർ അവസാന 6 അക്കം",
                      desc: "Aadhaar നമ്പറിന്റെ അവസാന 6 അക്കങ്ങൾ (ഉദാ: 714829)"
                    },
                    {
                      id: "dob" as StudentPinSourceType,
                      label: "ജനനത്തീയതി (DOB)",
                      desc: "കുട്ടിയുടെ ജനനത്തീയതി (DD/MM/YYYY / ജനന വർഷം)"
                    },
                    {
                      id: "adm_no" as StudentPinSourceType,
                      label: "അഡ്മിഷൻ നമ്പർ (Adm No)",
                      desc: "കുട്ടിയുടെ മദ്റസ അഡ്മിഷൻ / റോൾ നമ്പർ"
                    },
                    {
                      id: "custom_pin" as StudentPinSourceType,
                      label: "✏️ കസ്റ്റം PIN (Custom)",
                      desc: "ഓരോ കുട്ടിക്കും ഉസ്താദ് നൽകുന്ന പ്രത്യേക PIN നമ്പർ"
                    }
                  ].map(pinOpt => {
                    const currentPinSource = examSettings.studentPinSource || "aadhaar_last4";
                    const isPinOptSelected = currentPinSource === pinOpt.id;
                    return (
                      <button
                        key={pinOpt.id}
                        type="button"
                        onClick={() =>
                          applySettingsToResults({
                            ...examSettings,
                            publicAccessMode: "student_pin",
                            securityMode: "student_pin",
                            studentPinSource: pinOpt.id
                          })
                        }
                        className={`p-3 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                          isPinOptSelected
                            ? isDark
                              ? "bg-purple-700 text-white border-purple-400 shadow-sm"
                              : "bg-purple-600 text-white border-purple-700 shadow-sm"
                            : isDark
                              ? "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-purple-500/50"
                              : "bg-white text-slate-800 border-purple-200 hover:border-purple-400"
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center justify-between gap-1">
                          <span>{pinOpt.label}</span>
                          {isPinOptSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                        <p className={`text-[10px] mt-1 leading-snug ${isPinOptSelected ? "text-purple-100" : isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {pinOpt.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* AUTOMATIC FALLBACK EXPLANATION WHEN AADHAAR / DOB IS MISSING IN CSV */}
                <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                  isDark ? "bg-slate-950/90 border-amber-700/50 text-amber-200" : "bg-amber-50/90 border-amber-200 text-amber-950"
                }`}>
                  <div className="font-extrabold flex items-center gap-1.5 text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>ആധാർ നമ്പറോ ജനനത്തീയതിയോ (DOB) CSV ഡാറ്റയിൽ ഇല്ലെങ്കിൽ എന്ത് സംഭവിക്കും? (Automatic Fallback):</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    ഒരു കുട്ടിയുടെ <strong>ആധാർ നമ്പർ</strong> അല്ലെങ്കിൽ <strong>ജനനത്തീയതി (DOB)</strong> അപ്‌ലോഡ് ചെയ്ത CSV ഫയലിൽ ഇല്ലെങ്കിലും (Missing ആണെങ്കിലും) രക്ഷിതാക്കൾക്ക് തടസ്സമില്ലാതെ ലോഗിൻ ചെയ്യാം. സിസ്റ്റം സ്വയം താഴെ പറയുന്ന ക്രമത്തിൽ <strong>Fallback PIN</strong> സ്വീകരിക്കും:
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40">1. കസ്റ്റം PIN (നൽകിയിട്ടുണ്ടെങ്കിൽ)</span>
                    <span>→</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40">2. കുട്ടിയുടെ അഡ്മിഷൻ നമ്പർ (ഉദാ: 2414)</span>
                    <span>→</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40">3. ലഭ്യമായ DOB / ആധാർ 4 അക്കം</span>
                  </div>
                </div>

                {/* INDIVIDUAL STUDENT CUSTOM PIN MANAGER TABLE */}
                <div className={`p-3.5 rounded-xl border space-y-3 ${
                  isDark ? "bg-slate-950/90 border-slate-800" : "bg-white border-purple-200"
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h5 className={`text-xs font-extrabold flex items-center gap-1.5 ${isDark ? "text-white" : "text-slate-900"}`}>
                        <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                        <span>ഓരോ കുട്ടിക്കും കസ്റ്റം PIN നൽകുക / പരിശോധിക്കുക ({selectedClass}):</span>
                      </h5>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        ഏതെങ്കിലും കുട്ടിക്ക് പ്രത്യേക കസ്റ്റം PIN നൽകണമെങ്കിൽ താഴെ ആ കുട്ടിയുടെ പേരിന് നേരെയുള്ള കസ്റ്റം PIN ബോക്സിൽ ടൈപ്പ് ചെയ്യുക. (മാർക്ക് എൻട്രി ടേബിളിലും പേരിന് താഴെ കസ്റ്റം PIN മാറ്റാൻ സൗകര്യമുണ്ട്).
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleGenerateRandomCustomPins}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] transition cursor-pointer shadow-2xs"
                      >
                        🎲 എല്ലാ കുട്ടികൾക്കും 4-അക്ക കസ്റ്റം PIN ഉണ്ടാക്കുക
                      </button>
                      <button
                        type="button"
                        onClick={handleClearCustomPinsInClass}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-[10px] border transition cursor-pointer ${
                          isDark ? "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800" : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        ↺ ഓട്ടോമാറ്റിക് PIN-ലേക്ക് റീസെറ്റ് ചെയ്യുക
                      </button>
                    </div>
                  </div>

                  {currentClassStudents.length > 0 && (
                    <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className={isDark ? "bg-slate-900 text-slate-400 border-b border-slate-800" : "bg-slate-100 text-slate-700 border-b border-slate-200"}>
                            <th className="p-2 font-bold">Adm No</th>
                            <th className="p-2 font-bold">കുട്ടിയുടെ പേര്</th>
                            <th className="p-2 font-bold">ആധാർ / DOB</th>
                            <th className="p-2 font-bold">നിലവിലെ Active PIN</th>
                            <th className="p-2 font-bold">കസ്റ്റം PIN നൽകാൻ (Custom PIN)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {currentClassStudents.map(st => {
                            const pinInfo = getEffectiveStudentPinInfo(st, examSettings.studentPinSource || "aadhaar_last4");
                            return (
                              <tr key={st.studentId} className={isDark ? "hover:bg-slate-900/50" : "hover:bg-slate-50"}>
                                <td className="p-2 font-mono font-bold">{st.admissionNumber}</td>
                                <td className="p-2 font-bold">{st.name}</td>
                                <td className="p-2 font-mono text-[10px] opacity-80">
                                  <div>Aadhaar: {st.aadhaar ? `...${st.aadhaar.replace(/\D/g, "").slice(-4)}` : <span className="text-amber-500 font-bold">ഇല്ല (Missing)</span>}</div>
                                  <div>DOB: {st.dob ? formatDobReadable(st.dob) : <span className="text-amber-500 font-bold">ഇല്ല (Missing)</span>}</div>
                                </td>
                                <td className="p-2">
                                  <span className={`font-mono font-black px-2 py-0.5 rounded text-xs ${
                                    pinInfo.isCustom
                                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40"
                                      : pinInfo.isFallback
                                      ? "bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/40"
                                      : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40"
                                  }`}>
                                    {pinInfo.pinValue}
                                  </span>
                                  <div className="text-[9px] opacity-75 mt-0.5">{pinInfo.sourceLabelMl}</div>
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={st.customPin || ""}
                                    onChange={(e) => handleStudentCustomPinChange(st.studentId, e.target.value)}
                                    placeholder="കസ്റ്റം PIN ടൈപ്പ് ചെയ്യുക..."
                                    className={`w-36 px-2 py-1 rounded-lg text-xs font-mono font-bold border outline-none ${
                                      isDark ? "bg-slate-900 border-slate-700 text-white focus:border-purple-500" : "bg-white border-slate-300 text-slate-900 focus:border-purple-600"
                                    }`}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PASSWORD INPUT & CAPTCHA CHECKBOX */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {((examSettings.publicAccessMode || examSettings.securityMode) === "password" || (examSettings.publicAccessMode || examSettings.securityMode) === "password_or_dob") && (
                <div>
                  <label className={`block font-bold text-xs mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    റിസൾട്ട് ആക്‌സസ്സ് പാസ്‌വേഡ് (Access Password):
                  </label>
                  <input
                    type="text"
                    value={examSettings.accessPassword || ""}
                    onChange={(e) => applySettingsToResults({ ...examSettings, accessPassword: e.target.value })}
                    placeholder="ഉദാ: MADRASA2025"
                    className={`w-full border p-2.5 rounded-xl font-mono font-bold outline-none text-xs transition ${
                      isDark ? "bg-slate-950 border-slate-700 text-amber-300 focus:border-purple-500" : "bg-white border-slate-300 text-amber-800 focus:border-purple-600"
                    }`}
                  />
                  <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>ഈ പാസ്‌വേഡ് നൽകുന്ന രക്ഷിതാക്കൾക്ക് മാത്രമേ ഫലം കാണാൻ കഴിയൂ.</span>
                </div>
              )}

              <div className="flex items-center">
                <label className={`flex items-center gap-3 p-3 border rounded-2xl cursor-pointer w-full transition ${
                  isDark ? "bg-slate-950 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}>
                  <input
                    type="checkbox"
                    checked={examSettings.requireCaptcha}
                    onChange={(e) => applySettingsToResults({ ...examSettings, requireCaptcha: e.target.checked })}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                  <div>
                    <span className={`text-xs font-bold block ${isDark ? "text-white" : "text-slate-900"}`}>ലളിതമായ ക്യാപ്‌ച കോഡ് (Simple Captcha) നിർബന്ധമാക്കുക</span>
                    <span className={`text-[10px] block ${isDark ? "text-slate-400" : "text-slate-500"}`}>4 അക്ക സുരക്ഷാ നമ്പർ അടിപ്പിച്ച ശേഷം മാത്രം റിസൾട്ട് തുറക്കുക</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* SECTION G: SCHEDULE RELEASE & LIVE COUNTDOWN */}
          <div className={`space-y-3 pt-4 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
            <div>
              <label className={`block font-extrabold text-xs uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                പരീക്ഷാ ഫലപ്രഖ്യാപനം ഷെഡ്യൂൾ ചെയ്യുക & കൗണ്ട്ഡൗൺ (Schedule Release & Live Countdown):
              </label>
              <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                നിർദ്ദിഷ്ട തീയതിയിലും സമയത്തും കൃത്യമായി റിസൾട്ട് ഓൺ ആക്കാനും, അതുവരെ പബ്ലിക് ലിങ്കിൽ ലൈവ് കൗണ്ട്ഡൗൺ കാണിക്കാനും:
              </p>
            </div>

            <div className={`border p-4 rounded-2xl space-y-4 ${
              isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={examSettings.scheduleEnabled}
                  onChange={(e) => applySettingsToResults({ ...examSettings, scheduleEnabled: e.target.checked })}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
                <div>
                  <span className={`text-xs font-bold block ${isDark ? "text-white" : "text-slate-900"}`}>ഫലപ്രഖ്യാപനം ഷെഡ്യൂൾ ചെയ്യുക (Enable Scheduled Release)</span>
                  <span className={`text-[10px] block ${isDark ? "text-slate-400" : "text-slate-500"}`}>ആ സമയം ആകുന്നത് വരെ രക്ഷിതാക്കൾക്ക് ലൈവ് ടൈമർ കാണിക്കും</span>
                </div>
              </label>

              {examSettings.scheduleEnabled && (
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t ${isDark ? "border-slate-800/80" : "border-slate-200"}`}>
                  <div>
                    <label className={`block font-bold text-xs mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      ഫലം പ്രഖ്യാപിക്കുന്ന തീയതിയും സമയവും:
                    </label>
                    <input
                      type="datetime-local"
                      value={examSettings.scheduledPublishTime ? examSettings.scheduledPublishTime.slice(0, 16) : ""}
                      onChange={(e) => {
                        const isoStr = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                        applySettingsToResults({ ...examSettings, scheduledPublishTime: isoStr });
                      }}
                      className={`w-full border p-2.5 rounded-xl font-mono font-bold outline-none text-xs ${
                        isDark ? "bg-slate-900 border-slate-700 text-white focus:border-purple-500" : "bg-white border-slate-300 text-slate-900 focus:border-purple-600"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block font-bold text-xs mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      കൗണ്ട്ഡൗൺ തലക്കെട്ട് (Countdown Title):
                    </label>
                    <input
                      type="text"
                      value={examSettings.countdownTitle || ""}
                      onChange={(e) => applySettingsToResults({ ...examSettings, countdownTitle: e.target.value })}
                      placeholder="ഉദാ: വാർഷിക പരീക്ഷാ ഫലപ്രഖ്യാപനം"
                      className={`w-full border p-2.5 rounded-xl font-bold outline-none text-xs ${
                        isDark ? "bg-slate-900 border-slate-700 text-white focus:border-purple-500" : "bg-white border-slate-300 text-slate-900 focus:border-purple-600"
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION H: CLASS-WISE TOTAL WORKING DAYS CONFIGURATION */}
          <div className={`space-y-3 pt-4 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
            <div>
              <label className={`block font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                <Calendar className={`w-4 h-4 ${isDark ? "text-sky-400" : "text-sky-600"}`} />
                <span>ക്ലാസ്സ് തിരിച്ചുള്ള ആകെ പ്രവർത്തി ദിനങ്ങൾ (Class-wise Working Days):</span>
              </label>
              <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                ഹാജർ ശതമാനത്തിന് പകരം &quot;ആകെ പ്രവർത്തി ദിനങ്ങളും കുട്ടി ഹാജരായ ദിനങ്ങളും&quot; കണക്കാക്കാനായി ഓരോ ക്ലാസ്സിലെയും ആകെ പ്രവർത്തി ദിനങ്ങൾ ഇവിടെ നൽകാം:
              </p>
            </div>

            <div className={`border p-4 rounded-2xl space-y-4 ${
              isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="max-w-xs">
                <label className={`block font-bold text-xs mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  മദ്റസ പൊതുവായ പ്രവർത്തി ദിനങ്ങൾ (Default):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={examSettings.defaultWorkingDays || 180}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 180);
                      applySettingsToResults({ ...examSettings, defaultWorkingDays: val });
                    }}
                    className={`w-28 border p-2 rounded-xl font-mono font-bold text-center text-sm outline-none ${
                      isDark ? "bg-slate-900 border-slate-700 text-sky-400 focus:border-sky-500" : "bg-white border-slate-300 text-sky-800 focus:border-sky-500"
                    }`}
                  />
                  <span className={`text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-600"}`}>ദിനങ്ങൾ</span>
                </div>
              </div>

              <div className={`pt-3 border-t ${isDark ? "border-slate-800/80" : "border-slate-200"}`}>
                <label className={`block text-xs font-bold mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  ഓരോ ക്ലാസ്സിലെയും ആകെ പ്രവർത്തി ദിനങ്ങൾ (പ്രത്യേകമായി മാറ്റാൻ):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {availableClasses.map(cls => {
                    const classDays = examSettings.classWorkingDays?.[cls] || examSettings.defaultWorkingDays || 180;
                    return (
                      <div key={cls} className={`p-2 border rounded-xl space-y-1 text-center ${
                        isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
                      }`}>
                        <span className={`block text-[11px] font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{cls}</span>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={classDays}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value, 10) || 180);
                            applySettingsToResults({
                              ...examSettings,
                              classWorkingDays: {
                                ...(examSettings.classWorkingDays || {}),
                                [cls]: val
                              }
                            });
                          }}
                          className={`w-full border p-1 rounded-lg font-mono font-bold text-center text-xs outline-none ${
                            isDark ? "bg-slate-950 border-slate-700 text-sky-300 focus:border-sky-500" : "bg-slate-50 border-slate-300 text-sky-800 focus:border-sky-500"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SAVE SETTINGS BUTTON */}
          <div className={`pt-4 border-t flex items-center justify-end gap-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
            <button
              type="button"
              onClick={() => setActiveTab("mark_entry")}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg cursor-pointer"
            >
              സേവ് ചെയ്ത് മാർക്ക് എൻട്രി കാണുക
            </button>
          </div>

        </div>
      )}

      {/* TAB 4: PORTAL PREVIEW */}
      {activeTab === "portal_preview" && (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl flex items-center justify-between text-xs border transition ${
            isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex items-center gap-2">
              <Eye className={`w-4 h-4 ${isDark ? "text-sky-400" : "text-sky-600"}`} />
              <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>രക്ഷിതാക്കൾ കാണുന്ന ലൈവ് റിസൾട്ട് പോർട്ടൽ പ്രിവ്യൂ</span>
            </div>
            <button
              type="button"
              onClick={onOpenPublicResultPortal}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                isDark ? "bg-sky-950 hover:bg-sky-900 text-sky-300 border-sky-600/40" : "bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200"
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>പുതിയ ടാബിൽ തുറക്കുക</span>
            </button>
          </div>

          <div className={`border rounded-3xl overflow-hidden shadow-2xl ${isDark ? "border-slate-800" : "border-slate-200"}`}>
            <StudentResultPortal defaultMadrasaId={madrasaId} />
          </div>
        </div>
      )}

      {/* SINGLE WITHHOLD MODAL */}
      {withholdModalStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className={`border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 transition ${
            isDark ? "bg-slate-900 border-red-500/40" : "bg-white border-red-300"
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <div className="flex items-center gap-2 text-rose-600">
                <Lock className="w-5 h-5" />
                <h4 className={`font-extrabold text-base ${isDark ? "text-white" : "text-slate-900"}`}>ഫലം തടഞ്ഞുവെക്കുക (Withhold)</h4>
              </div>
              <button
                type="button"
                onClick={() => setWithholdModalStudent(null)}
                className={`p-1.5 rounded-lg ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className={isDark ? "text-slate-300" : "text-slate-700"}>
                വിദ്യാർത്ഥി: <strong className={isDark ? "text-white" : "text-slate-900"}>{withholdModalStudent.name}</strong> (റോൾ: {withholdModalStudent.admissionNumber})
              </p>
              <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                തടഞ്ഞുവെച്ചാൽ രക്ഷിതാവിന് മാർക്ക് ലിസ്റ്റ് കാണാൻ കഴിയില്ല. പകരം നിങ്ങൾ നൽകുന്ന കാരണം സ്ക്രീനിൽ തെളിയും.
              </p>
            </div>

            <div>
              <label className={`block font-bold text-xs mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                തടഞ്ഞുവെക്കാനുള്ള കാരണം (രക്ഷിതാവ് കാണുന്നത്):
              </label>
              <textarea
                rows={3}
                defaultValue="ഫീസ് കുടിശ്ശികയുള്ളതിനാൽ ഫലം തടഞ്ഞുവെച്ചിരിക്കുന്നു. ദയവായി മദ്റസ ഓഫീസുമായി ബന്ധപ്പെടുക."
                id="singleWithholdReasonInput"
                className={`w-full border p-3 rounded-xl text-xs outline-none focus:border-red-500 ${
                  isDark ? "bg-slate-950 border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900 focus:bg-white"
                }`}
              />
            </div>

            <div className={`flex items-center justify-end gap-2 pt-2 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <button
                type="button"
                onClick={() => setWithholdModalStudent(null)}
                className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer ${
                  isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                }`}
              >
                റദ്ദാക്കുക
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById("singleWithholdReasonInput") as HTMLTextAreaElement;
                  handleConfirmSingleWithhold(input?.value || "ഫീസ് കുടിശ്ശിക");
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-extrabold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>തടഞ്ഞുവെക്കുക</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK WITHHOLD MODAL */}
      {bulkWithholdModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className={`border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 transition ${
            isDark ? "bg-slate-900 border-red-500/40" : "bg-white border-red-300"
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <div className="flex items-center gap-2 text-rose-600">
                <Lock className="w-5 h-5" />
                <h4 className={`font-extrabold text-base ${isDark ? "text-white" : "text-slate-900"}`}>ബൾക്ക് വിത്ത്‌ഹെൽഡ് ({selectedStudentIds.length} പേർ)</h4>
              </div>
              <button
                type="button"
                onClick={() => setBulkWithholdModalOpen(false)}
                className={`p-1.5 rounded-lg ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className={isDark ? "text-slate-300" : "text-slate-700"}>
                തിരഞ്ഞെടുത്ത <strong className="text-red-600">{selectedStudentIds.length} കുട്ടികളുടെ</strong> പരീക്ഷാ ഫലം ഒന്നിച്ച് തടഞ്ഞുവെക്കാൻ പോകുന്നു.
              </p>
            </div>

            <div>
              <label className={`block font-bold text-xs mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                രക്ഷിതാക്കൾക്ക് കാണിക്കേണ്ട കാരണം:
              </label>
              <textarea
                rows={3}
                value={withheldReasonText}
                onChange={(e) => setWithheldReasonText(e.target.value)}
                className={`w-full border p-3 rounded-xl text-xs outline-none focus:border-red-500 ${
                  isDark ? "bg-slate-950 border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900 focus:bg-white"
                }`}
              />
            </div>

            <div className={`flex items-center justify-end gap-2 pt-2 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <button
                type="button"
                onClick={() => setBulkWithholdModalOpen(false)}
                className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer ${
                  isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                }`}
              >
                റദ്ദാക്കുക
              </button>
              <button
                type="button"
                onClick={() => handleExecuteBulkWithhold(withheldReasonText)}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-extrabold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{selectedStudentIds.length} പേരുടെ റിസൾട്ട് തടയുക</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP SHARE MODAL */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className={`border rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 transition ${
            isDark ? "bg-slate-900 border-emerald-500/40" : "bg-white border-emerald-300"
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <div className="flex items-center gap-2">
                <span className={`p-2 rounded-xl border ${
                  isDark ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/50" : "bg-emerald-100 text-emerald-700 border-emerald-200"
                }`}>
                  <Share2 className="w-4 h-4" />
                </span>
                <div>
                  <h4 className={`font-extrabold text-base ${isDark ? "text-white" : "text-slate-900"}`}>വാട്സ്ആപ്പ് ഗ്രൂപ്പിൽ ഷെയർ ചെയ്യാം</h4>
                  <p className={`text-xs font-bold ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>രക്ഷിതാക്കൾക്ക് ക്ലാസ്സും പേരും സെലക്ട് ചെയ്ത് റിസൾട്ട് കാണാം</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className={`p-1.5 rounded-lg ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  രക്ഷിതാക്കൾക്ക് അയക്കേണ്ട വാട്സ്ആപ്പ് സന്ദേശം:
                </label>
                <div className={`border p-3.5 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed ${
                  isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}>
                  {whatsappShareText}
                </div>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  ഡയറക്ട് റിസൾട്ട് ലിങ്ക് (Direct URL):
                </label>
                <div className={`flex items-center gap-2 p-2 rounded-xl border ${
                  isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <span className={`font-mono text-[11px] truncate flex-1 ${isDark ? "text-emerald-400" : "text-emerald-700 font-bold"}`}>
                    {portalUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-3 py-1.5 rounded-lg font-bold text-3xs flex items-center gap-1 shrink-0 cursor-pointer ${
                      isDark ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-xs"
                    }`}
                  >
                    {copiedLink ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? "കോപ്പി ചെയ്തു" : "ലിങ്ക് കോപ്പി"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className={`flex flex-wrap items-center justify-between gap-2 pt-3 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <button
                type="button"
                onClick={onOpenPublicResultPortal}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer border ${
                  isDark ? "bg-slate-800 hover:bg-slate-700 text-sky-300 border-transparent" : "bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>ലിങ്ക് തുറന്ന് പരിശോധിക്കുക</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShareModalOpen(false)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer ${
                    isDark ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  ക്ലോസ്
                </button>
                <button
                  type="button"
                  onClick={handleOpenWhatsAppShare}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>വാട്സ്ആപ്പിലേക്ക് ഷെയർ ചെയ്യുക</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE FLOATING SAVE ACTION (FAB) */}
      <div className="md:hidden fixed bottom-16 right-4 z-40">
        <button
          type="button"
          onClick={handleSaveToCloud}
          disabled={isSaving}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs rounded-full shadow-2xl flex items-center gap-2 border border-emerald-400/40 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "സേവ്..." : "ക്ലൗഡ് സേവ്"}</span>
        </button>
      </div>

      {/* MOBILE NATIVE BOTTOM NAVIGATION BAR */}
      <div className={`md:hidden fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-md py-1.5 px-2 flex justify-around items-center transition-colors shadow-2xl ${
        isDark ? "bg-slate-950/95 border-slate-800 text-slate-400" : "bg-white/95 border-slate-200 text-slate-600"
      }`}>
        <button
          type="button"
          onClick={() => setActiveTab("mark_entry")}
          className={`flex-1 py-1 px-1 flex flex-col items-center gap-0.5 rounded-xl transition cursor-pointer ${
            activeTab === "mark_entry"
              ? isDark ? "text-emerald-400 font-black bg-emerald-950/50" : "text-emerald-700 font-black bg-emerald-50"
              : "hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="text-[10px] leading-tight">മാർക്ക് എൻട്രി</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tabulation")}
          className={`flex-1 py-1 px-1 flex flex-col items-center gap-0.5 rounded-xl transition cursor-pointer ${
            activeTab === "tabulation"
              ? isDark ? "text-emerald-400 font-black bg-emerald-950/50" : "text-emerald-700 font-black bg-emerald-50"
              : "hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Printer className="w-4 h-4" />
          <span className="text-[10px] leading-tight">ടാബുലേഷൻ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-1 px-1 flex flex-col items-center gap-0.5 rounded-xl transition cursor-pointer ${
            activeTab === "settings"
              ? isDark ? "text-emerald-400 font-black bg-emerald-950/50" : "text-emerald-700 font-black bg-emerald-50"
              : "hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="text-[10px] leading-tight">സെറ്റിംഗ്സ്</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("portal_preview")}
          className={`flex-1 py-1 px-1 flex flex-col items-center gap-0.5 rounded-xl transition cursor-pointer ${
            activeTab === "portal_preview"
              ? isDark ? "text-emerald-400 font-black bg-emerald-950/50" : "text-emerald-700 font-black bg-emerald-50"
              : "hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Eye className="w-4 h-4" />
          <span className="text-[10px] leading-tight">പ്രിവ്യൂ</span>
        </button>
      </div>

      {/* SAMASTHA CSV IMPORT MODAL */}
      <SamasthaCsvImporterModal
        isOpen={isSamasthaModalOpen}
        onClose={() => setIsSamasthaModalOpen(false)}
        onImportStudents={handleImportFromSamastha}
        defaultClass={selectedClass}
        isDark={isDark}
      />

    </div>
  );
}
