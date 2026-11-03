import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  HeartHandshake,
  Star,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Users,
  Award,
  Save,
  Share2,
  ArrowLeft,
  ChevronRight,
  Filter,
  Search,
  Settings,
  ShieldCheck,
  Globe,
  Printer,
  FileText,
  UserCheck,
  CheckSquare,
  BarChart3,
  Moon,
  Sun,
  Copy,
  Check,
  Plus,
  Trash2,
  Lock,
  Unlock,
  MessageCircle,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Sliders,
  SlidersHorizontal,
  Eye,
  HelpCircle,
  Send,
  Smartphone,
  UserX,
  ExternalLink,
  ListChecks,
  Edit,
  KeyRound
} from "lucide-react";
import { 
  TarbiyahCycle, 
  TarbiyahQuestion, 
  StudentTarbiyahRecord, 
  Student, 
  TarbiyahAnswerType,
  TarbiyahQuestionTarget,
  TarbiyahMcqOption,
  StudentPinSourceType,
  deriveStudentPin,
  getEffectiveStudentPinInfo,
  formatDobReadable
} from "../types";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import SamasthaCsvImporterModal from "./SamasthaCsvImporterModal";

interface TarbiyahManagerProps {
  madrasaName: string;
  madrasaRegNo?: string;
  madrasaPlace?: string;
  madrasaPhone?: string;
  workspaceStudents: Student[];
  onBackToWorkspace: () => void;
  onBackToLanding: () => void;
  onOpenParentPortal?: () => void;
  onOpenPublicPortal?: () => void;
  onImportStudents?: (students: Student[]) => void;
  onUpdateWorkspaceStudents?: (students: Student[]) => void;
}

// DEFAULT COMPREHENSIVE QUESTIONS PRE-LOADED MATCHING USER REQUIREMENTS
const DEFAULT_TARBIYAH_QUESTIONS: TarbiyahQuestion[] = [
  // PARENT QUESTIONS
  {
    id: "p_wudu",
    title: "Night Wudu",
    titleMl: "രാത്രി വുളൂഅ് ചെയ്ത് ഉറങ്ങൽ",
    descriptionMl: "ഉറങ്ങുന്നതിന് തൊട്ടുമുമ്പ് വുളൂഅ് ചെയ്യുന്ന ശീലമുണ്ടോ?",
    target: "parent",
    answerType: "stars",
    maxPoints: 5,
    category: "worship",
    order: 1,
    enabled: true,
  },
  {
    id: "p_brush",
    title: "Night Brushing",
    titleMl: "രാത്രി ബ്രഷ് ചെയ്യൽ (പല്ല് തേക്കൽ)",
    descriptionMl: "ഭക്ഷണശേഷവും ഉറങ്ങുന്നതിന് മുമ്പും കൃത്യമായി പല്ല് തേക്കുന്നുണ്ടോ?",
    target: "parent",
    answerType: "stars",
    maxPoints: 5,
    category: "habits",
    order: 2,
    enabled: true,
  },
  {
    id: "p_dhikr",
    title: "Bedtime Dhikr & Dua",
    titleMl: "ഉറങ്ങുമ്പോൾ ഉള്ള ദിക്റും ദുആയും",
    descriptionMl: "ഉറക്കത്തിന്റെ ദുആയും ആയത്തുൽ കുർസിയ്യും സൂറത്തുകളും ഓതാറുണ്ടോ?",
    target: "parent",
    answerType: "stars",
    maxPoints: 5,
    category: "worship",
    order: 3,
    enabled: true,
  },
  {
    id: "p_obedience",
    title: "Obedience at Home",
    titleMl: "രക്ഷിതാക്കളോടുള്ള അനുസരണവും ആദരവും",
    descriptionMl: "മാതാപിതാക്കളുടെ വാക്ക് അനുസരിക്കുകയും ബഹുമാനത്തോടെ പെരുമാറുകയും ചെയ്യുന്നുണ്ടോ?",
    target: "parent",
    answerType: "stars",
    maxPoints: 5,
    category: "discipline",
    order: 4,
    enabled: true,
  },
  {
    id: "p_etiquette",
    title: "Islamic Etiquettes",
    titleMl: "ആചാരനിഷ്ഠയും സദാചാരവും",
    descriptionMl: "ഭക്ഷണ മര്യാദ, സലാം പറയൽ, വലിയവരോടുള്ള ബഹുമാനം എന്നിവ പാലിക്കുന്നുണ്ടോ?",
    target: "parent",
    answerType: "stars",
    maxPoints: 5,
    category: "habits",
    order: 5,
    enabled: true,
  },
  {
    id: "p_namaz",
    title: "5 Waqt Daily Namaz",
    titleMl: "5 വക്ത് നിസ്കാരം (പ്രതിദിന നിസ്കാരം)",
    descriptionMl: "ദിവസേനയുള്ള അഞ്ച് നേരത്തെ നിസ്കാരങ്ങളുടെ നിഷ്ഠ",
    target: "parent",
    answerType: "mcq_points",
    maxPoints: 10,
    options: [
      { label: "Full Jama'ath", labelMl: "ജമാഅത്തായി പള്ളിയിൽ (10 പോയിന്റ്)", points: 10 },
      { label: "Ada'a at Home/On-time", labelMl: "കൃത്യസമയത്ത് അദാആയി (7 പോയിന്റ്)", points: 7 },
      { label: "Qaza / Delayed", labelMl: "ഖളാആയിട്ടെങ്കിലും നിസ്കരിച്ചു (5 പോയിന്റ്)", points: 5 },
      { label: "Missed", labelMl: "ഉപേക്ഷിപ്പിച്ചു / നിർവ്വഹിച്ചില്ല (0 പോയിന്റ്)", points: 0 },
    ],
    category: "worship",
    order: 6,
    enabled: true,
  },

  // CLASS USTHADH QUESTIONS
  {
    id: "u_study",
    title: "Studies & Lesson Preparation",
    titleMl: "പഠനവും പാഠം ഒരുക്കലും",
    descriptionMl: "ദിവസേനയുള്ള പാഠഭാഗങ്ങൾ കൃത്യമായി പഠിച്ചും എഴുതിയും വരുന്നുണ്ടോ?",
    target: "teacher",
    answerType: "stars",
    maxPoints: 5,
    category: "academics",
    order: 7,
    enabled: true,
  },
  {
    id: "u_behavior",
    title: "Behavior in Madrasa",
    titleMl: "മദ്റസയിലെ പെരുമാറ്റം & സ്വഭാവശുദ്ധി",
    descriptionMl: "കൂട്ടുകാരോടും അധ്യാപകരോടും മാന്യമായ പെരുമാറ്റമാണോ?",
    target: "teacher",
    answerType: "stars",
    maxPoints: 5,
    category: "discipline",
    order: 8,
    enabled: true,
  },
  {
    id: "u_obedience",
    title: "Obedience to Usthad",
    titleMl: "ഉസ്താദുമാരോടുള്ള അനുസരണ",
    descriptionMl: "അധ്യാപകരുടെ നിർദ്ദേശങ്ങൾ അനുസരിക്കുകയും ആദരിക്കുകയും ചെയ്യുന്നുണ്ടോ?",
    target: "teacher",
    answerType: "stars",
    maxPoints: 5,
    category: "discipline",
    order: 9,
    enabled: true,
  },
  {
    id: "u_punctuality",
    title: "Punctuality",
    titleMl: "കൃത്യനിഷ്ഠ (സമയപാലനം)",
    descriptionMl: "മദ്റസയിൽ കൃത്യസമയത്ത് എത്തുകയും വരികളിൽ നിൽക്കുകയും ചെയ്യുന്നുണ്ടോ?",
    target: "teacher",
    answerType: "stars",
    maxPoints: 5,
    category: "discipline",
    order: 10,
    enabled: true,
  },
  {
    id: "u_attendance",
    title: "Attendance & Presence",
    titleMl: "ഹാജർ നില (അറ്റൻഡൻസ്)",
    descriptionMl: "കാരണമില്ലാതെ അവധിയെടുക്കാതെ കൃത്യമായി മദ്റസയിൽ ഹാജരാകുന്നുണ്ടോ?",
    target: "teacher",
    answerType: "stars",
    maxPoints: 5,
    category: "discipline",
    order: 11,
    enabled: true,
  },
  {
    id: "u_uniform",
    title: "Dress & Hygiene",
    titleMl: "വേഷം, തൊപ്പി, വസ്ത്രശുചിത്വം",
    descriptionMl: "നിശ്ചിത വസ്ത്രധാരണം, തൊപ്പി, ശരീര ശുചിത്വം എന്നിവ പാലിക്കുന്നുണ്ടോ?",
    target: "teacher",
    answerType: "stars",
    maxPoints: 5,
    category: "habits",
    order: 12,
    enabled: true,
  },
];

export interface RemainingClassGroup {
  key: string;
  classLevel: string;
  division: string;
  displayName: string;
  totalStudents: number;
  students: Student[];
  pendingParents: Student[];
  completedParentsCount: number;
  pendingUsthad: Student[];
  completedUsthadCount: number;
  bothCompleted: Student[];
  parentPercent: number;
  usthadPercent: number;
}

// Reusable Modern Interactive Input Widget
export const renderQuestionInputWidget = (
  q: TarbiyahQuestion,
  currentVal: number,
  onChange: (val: number) => void,
  themeDark: boolean
) => {
  // 1. STARS (Dynamic 1 to maxPoints, capped at 10 for clean layout)
  if (q.answerType === "stars") {
    const starCount = Math.min(q.maxPoints || 5, 10);
    return (
      <div className="flex flex-wrap items-center gap-1 pt-1">
        {Array.from({ length: starCount }, (_, i) => i + 1).map(starNum => (
          <button
            key={starNum}
            type="button"
            onClick={() => onChange(starNum)}
            className={`p-1 rounded-lg transition cursor-pointer ${
              currentVal >= starNum
                ? "text-amber-400 hover:text-amber-500 scale-105"
                : themeDark ? "text-slate-700 hover:text-slate-500" : "text-slate-300 hover:text-slate-400"
            }`}
            title={`${starNum} Stars`}
          >
            <Star className="w-5 h-5 fill-current" />
          </button>
        ))}
      </div>
    );
  }

  // 2. MCQ POINTS
  if (q.answerType === "mcq_points" && q.options && q.options.length > 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {q.options.map((opt, oIdx) => {
          const isSelected = currentVal === opt.points;
          return (
            <button
              key={`${opt.label || opt.labelMl}_${oIdx}`}
              type="button"
              onClick={() => onChange(opt.points)}
              className={`p-2 rounded-xl text-xs font-bold text-left transition border cursor-pointer flex items-center justify-between gap-2 ${
                isSelected
                  ? "bg-teal-600 text-white border-teal-500 shadow-xs ring-1 ring-teal-400"
                  : themeDark
                    ? "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="truncate">{opt.labelMl || opt.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                isSelected ? "bg-white/20 text-white" : "bg-teal-50 text-teal-800 dark:bg-slate-800 dark:text-teal-400"
              }`}>
                {opt.points} pt
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // 3. EMOJI SLIDER
  if (q.answerType === "slider") {
    const max = q.maxPoints || 10;
    const ratio = max > 0 ? currentVal / max : 0;
    const emoji = ratio >= 0.9 ? "🌟" : ratio >= 0.75 ? "😃" : ratio >= 0.5 ? "🙂" : ratio >= 0.25 ? "😐" : "😟";
    const labelText = ratio >= 0.9 ? "അത്യുത്തമം" : ratio >= 0.75 ? "വളരെ നല്ലത്" : ratio >= 0.5 ? "നല്ലത്" : ratio >= 0.25 ? "ശരാശരി" : "ശ്രദ്ധിക്കണം";

    return (
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="text-base">{emoji}</span>
            <span className={themeDark ? "text-slate-300" : "text-slate-700"}>{labelText}</span>
          </span>
          <span className="font-mono font-black text-teal-600 dark:text-teal-400">{currentVal} / {max} pt</span>
        </div>
        <input
          type="range"
          min="0"
          max={max}
          value={currentVal}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
        />
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <button type="button" onClick={() => onChange(0)} className="hover:text-teal-600 cursor-pointer">0 pt</button>
          <button type="button" onClick={() => onChange(Math.round(max * 0.5))} className="hover:text-teal-600 cursor-pointer">50%</button>
          <button type="button" onClick={() => onChange(max)} className="hover:text-teal-600 cursor-pointer">100%</button>
        </div>
      </div>
    );
  }

  // 4. YES / NO / PARTIAL SMART PILLS
  if (q.answerType === "yes_no") {
    const fullPts = q.maxPoints || 5;
    const halfPts = Math.round(fullPts / 2);
    return (
      <div className="grid grid-cols-3 gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => onChange(fullPts)}
          className={`py-1.5 px-2 rounded-xl text-xs font-bold transition border cursor-pointer text-center ${
            currentVal === fullPts
              ? "bg-emerald-600 text-white border-emerald-500 shadow-xs"
              : themeDark ? "bg-slate-900 text-slate-300 border-slate-800" : "bg-white text-slate-700 border-slate-200"
          }`}
        >
          ✅ ഉണ്ട് ({fullPts})
        </button>
        <button
          type="button"
          onClick={() => onChange(halfPts)}
          className={`py-1.5 px-2 rounded-xl text-xs font-bold transition border cursor-pointer text-center ${
            currentVal === halfPts
              ? "bg-amber-600 text-white border-amber-500 shadow-xs"
              : themeDark ? "bg-slate-900 text-slate-300 border-slate-800" : "bg-white text-slate-700 border-slate-200"
          }`}
        >
          ⚠️ ഭാഗികം ({halfPts})
        </button>
        <button
          type="button"
          onClick={() => onChange(0)}
          className={`py-1.5 px-2 rounded-xl text-xs font-bold transition border cursor-pointer text-center ${
            currentVal === 0
              ? "bg-rose-600 text-white border-rose-500 shadow-xs"
              : themeDark ? "bg-slate-900 text-slate-300 border-slate-800" : "bg-white text-slate-700 border-slate-200"
          }`}
        >
          ❌ ഇല്ല (0)
        </button>
      </div>
    );
  }

  // 5. GRADE PILLS (A+, A, B, C, D)
  if (q.answerType === "grade_pills") {
    const max = q.maxPoints || 10;
    const grades = [
      { label: "A+", pts: max },
      { label: "A", pts: Math.round(max * 0.8) },
      { label: "B", pts: Math.round(max * 0.65) },
      { label: "C", pts: Math.round(max * 0.5) },
      { label: "D", pts: Math.round(max * 0.35) },
    ];
    return (
      <div className="flex items-center gap-1 pt-1 flex-wrap">
        {grades.map(g => (
          <button
            key={g.label}
            type="button"
            onClick={() => onChange(g.pts)}
            className={`flex-1 min-w-[34px] py-1 px-1.5 rounded-lg text-xs font-bold transition border cursor-pointer text-center ${
              currentVal === g.pts
                ? "bg-teal-600 text-white border-teal-500 shadow-xs ring-1 ring-teal-400"
                : themeDark ? "bg-slate-900 text-slate-300 border-slate-800" : "bg-white text-slate-700 border-slate-200"
            }`}
          >
            <div>{g.label}</div>
            <div className="text-[9px] opacity-75 font-mono">{g.pts}p</div>
          </button>
        ))}
      </div>
    );
  }

  // 6. NUMERIC / DIRECT INPUT / STEPPER
  const max = q.maxPoints || 10;
  return (
    <div className="flex items-center gap-1.5 pt-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, currentVal - 1))}
        className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black transition cursor-pointer"
      >
        -
      </button>
      <input
        type="number"
        min="0"
        max={max}
        value={currentVal}
        onChange={e => {
          const v = Math.min(max, Math.max(0, parseInt(e.target.value) || 0));
          onChange(v);
        }}
        className={`w-16 p-1 text-center font-mono font-bold text-xs rounded-lg border ${
          themeDark ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
        }`}
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, currentVal + 1))}
        className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black transition cursor-pointer"
      >
        +
      </button>
      <span className="text-[10px] text-slate-500 font-mono">/ {max} pt</span>
    </div>
  );
};

export default function TarbiyahManager({
  madrasaName,
  madrasaRegNo = "",
  madrasaPlace = "",
  madrasaPhone = "",
  workspaceStudents = [],
  onBackToWorkspace,
  onBackToLanding,
  onOpenParentPortal,
  onImportStudents,
  onUpdateWorkspaceStudents,
}: TarbiyahManagerProps) {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(false);

  // Internal students state (can be updated via Samastha CSV import)
  const [internalStudents, setInternalStudents] = useState<Student[]>(() => workspaceStudents || []);
  const [isSamasthaModalOpen, setIsSamasthaModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (workspaceStudents && workspaceStudents.length > 0) {
      setInternalStudents(workspaceStudents);
    }
  }, [workspaceStudents]);

  const handleImportFromSamastha = (imported: Student[]) => {
    if (!imported || imported.length === 0) return;
    setInternalStudents(prev => {
      const map = new Map(prev.map(s => [s.admissionNumber || s.id, s]));
      imported.forEach(s => map.set(s.admissionNumber || s.id, s));
      const combined = Array.from(map.values());
      return combined;
    });
    if (onImportStudents) {
      onImportStudents(imported);
    }
    if (onUpdateWorkspaceStudents) {
      onUpdateWorkspaceStudents(imported);
    }
    setFeedback(`✅ ${imported.length} കുട്ടികളുടെ സമസ്ത CSV ഡാറ്റ വിജയകരമായി ഇമ്പോർട്ട് ചെയ്തു!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Active Main Navigation Tab
  // 1: usthad_entry, 2: teacher_effort, 3: rank_list, 4: reminders, 5: settings
  const [activeTab, setActiveTab] = useState<"usthad_entry" | "teacher_effort" | "rank_list" | "reminders" | "settings">("usthad_entry");

  // Madrasa & Cycle state
  const [cycleTitle, setCycleTitle] = useState<string>("2026 ഒക്ടോബർ നിരന്തര മൂല്യനിർണ്ണയം");
  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly" | "bimonthly">("monthly");
  const [academicYear, setAcademicYear] = useState<string>("2025-2026");
  const [teacherDeadline, setTeacherDeadline] = useState<string>("2026-10-15");
  const [parentDeadline, setParentDeadline] = useState<string>("2026-10-12");
  const [isParentWindowOpen, setIsParentWindowOpen] = useState<boolean>(true);
  const [isTeacherWindowOpen, setIsTeacherWindowOpen] = useState<boolean>(true);
  const [isPublishedBySadar, setIsPublishedBySadar] = useState<boolean>(false);
  const [includeExamMarks, setIncludeExamMarks] = useState<boolean>(false);
  const [parentSecurityEnabled, setParentSecurityEnabled] = useState<boolean>(true);
  const [parentPinSource, setParentPinSource] = useState<StudentPinSourceType>("aadhaar_last4");
  const [showTarbiyahCustomPinManager, setShowTarbiyahCustomPinManager] = useState<boolean>(false);

  // Questions state
  const [questions, setQuestions] = useState<TarbiyahQuestion[]>(DEFAULT_TARBIYAH_QUESTIONS);

  // Records state: classLevel -> studentId -> StudentTarbiyahRecord
  const [records, setRecords] = useState<Record<string, Record<string, StudentTarbiyahRecord>>>({});

  // Selected class for Usthad view
  const [selectedClass, setSelectedClass] = useState<string>("Class 5");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Feedback toast
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Parent Direct Evaluation Modal State (for quick testing/submission)
  const [parentModalStudent, setParentModalStudent] = useState<Student | null>(null);
  const [parentScoresDraft, setParentScoresDraft] = useState<Record<string, number>>({});
  const [parentDeclarationAccepted, setParentDeclarationAccepted] = useState<boolean>(false);
  const [parentNameInput, setParentNameInput] = useState<string>("");

  // Question filter for leaderboard
  const [selectedQuestionFilter, setSelectedQuestionFilter] = useState<string>("all");

  const storageKey = `madrasa_tarbiyah_${madrasaRegNo || madrasaName || "default"}`;

  // Helper: List of unique classes
  const availableClasses = useMemo(() => {
    if (internalStudents.length > 0) {
      const set = new Set(internalStudents.map(s => String(s.classLevel || "")));
      return Array.from(set).filter(Boolean).sort((a: string, b: string) => {
        const numA = parseInt(a.replace(/\D/g, "")) || 0;
        const numB = parseInt(b.replace(/\D/g, "")) || 0;
        return numA - numB;
      });
    }
    return ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
  }, [internalStudents]);

  // Group students by Class Level and Division for fine-grained progress tracking (e.g. Class 1-A, Class 1-B)
  const classDivisionGroups = useMemo<RemainingClassGroup[]>(() => {
    if (internalStudents.length === 0) return [];

    const map: Record<string, { classLevel: string; division: string; students: Student[] }> = {};

    internalStudents.forEach(s => {
      const cls = (s.classLevel || s.class || "Class 1").trim();
      const div = (s.division || "A").trim().toUpperCase();
      const key = `${cls}__${div}`;
      if (!map[key]) {
        map[key] = { classLevel: cls, division: div, students: [] };
      }
      map[key].students.push(s);
    });

    const teacherQuestionsCount = questions.filter(q => q.target === "teacher" && q.enabled).length;

    const list: RemainingClassGroup[] = Object.entries(map).map(([key, item]) => {
      const classRecs = records[item.classLevel] || {};
      const total = item.students.length;

      // Pending parents: not verified
      const pendingParents = item.students.filter(s => {
        const rec = classRecs[s.id];
        return !rec || !rec.parentVerified;
      });

      // Pending usthad: not all teacher questions scored
      const pendingUsthad = item.students.filter(s => {
        const rec = classRecs[s.id];
        if (!rec || !rec.teacherScores) return true;
        return Object.keys(rec.teacherScores).length < teacherQuestionsCount || teacherQuestionsCount === 0;
      });

      // Both completed
      const bothCompleted = item.students.filter(s => {
        const rec = classRecs[s.id];
        const isP = rec && rec.parentVerified;
        const isU = rec && rec.teacherScores && Object.keys(rec.teacherScores).length >= teacherQuestionsCount && teacherQuestionsCount > 0;
        return isP && isU;
      });

      const completedParentsCount = total - pendingParents.length;
      const completedUsthadCount = total - pendingUsthad.length;

      const parentPercent = total > 0 ? Math.round((completedParentsCount / total) * 100) : 0;
      const usthadPercent = total > 0 ? Math.round((completedUsthadCount / total) * 100) : 0;

      return {
        key,
        classLevel: item.classLevel,
        division: item.division,
        displayName: `${item.classLevel} - Div ${item.division}`,
        totalStudents: total,
        students: item.students,
        pendingParents,
        completedParentsCount,
        pendingUsthad,
        completedUsthadCount,
        bothCompleted,
        parentPercent,
        usthadPercent
      };
    });

    return list.sort((a, b) => {
      const numA = parseInt(a.classLevel.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.classLevel.replace(/\D/g, "")) || 0;
      if (numA !== numB) return numA - numB;
      return a.division.localeCompare(b.division);
    });
  }, [internalStudents, records, questions]);

  // Remaining list modal and filter states
  const [selectedRemainingGroup, setSelectedRemainingGroup] = useState<RemainingClassGroup | null>(null);
  const [remainingFilter, setRemainingFilter] = useState<"all" | "pending_only" | "parent_pending" | "usthad_pending">("all");
  const [activeRemainingTab, setActiveRemainingTab] = useState<"parents" | "usthads" | "completed">("parents");

  // Settings: Question Engine Head Filter & MCQ Editor state
  const [settingsActiveHead, setSettingsActiveHead] = useState<"both" | "parents" | "teachers">("both");
  const [editingMcqQuestionId, setEditingMcqQuestionId] = useState<string | null>(null);

  // Send personalized WhatsApp reminder to individual parent
  const sendIndividualParentWhatsApp = (student: Student) => {
    const parentPortalUrl = `${window.location.origin}${window.location.pathname}?view=tarbiyah-portal&class=${encodeURIComponent(student.classLevel || "")}&student=${encodeURIComponent(student.admissionNumber || student.id)}`;
    const phone = student.phone || (student as any).parentPhone || (student as any).whatsapp || "";
    const cleanPhone = phone.replace(/\D/g, "");
    
    const message = `*അസ്സലാമു അലൈകും,*\n\n*${madrasaName} - തർബിയ്യത്ത് നിരന്തര മൂല്യനിർണ്ണയം*\n\nപ്രിയ രക്ഷിതാവ് അറിയുന്നതിന്, താങ്കളുടെ മകൻ/മകൾ *${student.name}* (${student.classLevel || ""}${student.division ? ` - Div ${student.division}` : ""})-ന്റെ ഈ മാസത്തെ തർബിയ്യത്ത് മൂല്യനിർണ്ണയം ഇതുവരെ സമർപ്പിച്ചിട്ടില്ല.\n\nദയവായി താഴെ കാണുന്ന ലിങ്കിൽ ക്ലിക്ക് ചെയ്ത് കുട്ടിയുടെ സത്യസന്ധമായ വിലയിരുത്തൽ ഉടൻ രേഖപ്പെടുത്താൻ താല്പര്യപ്പെടുന്നു:\n👉 ${parentPortalUrl}\n\nനന്ദി, മദ്റസ സദർ ഉസ്താദ്.`;

    if (cleanPhone) {
      const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, "_blank");
    } else {
      navigator.clipboard.writeText(message);
      setFeedback(`✅ ${student.name}-ന്റെ രക്ഷിതാവിനുള്ള വാട്സ്ആപ്പ് സന്ദേശം കോപ്പി ചെയ്തു! (ഫോൺ നമ്പർ ലഭ്യമല്ല)`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Group broadcast WhatsApp message
  const generateGroupParentWhatsAppMessage = (group: RemainingClassGroup) => {
    const parentPortalUrl = `${window.location.origin}${window.location.pathname}?view=tarbiyah-portal&class=${encodeURIComponent(group.classLevel)}`;
    const namesList = group.pendingParents.map((s, i) => `${i + 1}. ${s.name} ${s.rollNumber ? `(Roll: ${s.rollNumber})` : ""}`).join("\n");

    const text = `*${madrasaName} - തർബിയ്യത്ത് നിരന്തര മൂല്യനിർണ്ണയം*\n\n*${group.displayName} ബാക്കി നിൽക്കുന്ന രക്ഷിതാക്കളുടെ ശ്രദ്ധയ്ക്ക്,*\n\nതാഴെ പറയുന്ന ${group.pendingParents.length} കുട്ടികളുടെ ഈ മാസത്തെ തർബിയ്യത്ത് മൂല്യനിർണ്ണയം ഇനിയും പൂർത്തിയായിട്ടില്ല:\n\n${namesList}\n\nദയവായി രക്ഷിതാക്കൾ താഴെ കാണുന്ന പോർട്ടൽ ലിങ്ക് വഴി ഉടൻ തന്നെ സമർപ്പിക്കുക:\n👉 ${parentPortalUrl}\n\nനന്ദി, ക്ലാസ് ഉസ്താദ് & സദർ ഉസ്താദ്.`;

    navigator.clipboard.writeText(text);
    setFeedback(`✅ ${group.displayName}-ലെ ${group.pendingParents.length} രക്ഷിതാക്കൾക്കുള്ള വാട്സ്ആപ്പ് ലിസ്റ്റ് കോപ്പി ചെയ്തു!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Set default selected class on mount
  useEffect(() => {
    if (availableClasses.length > 0 && !availableClasses.includes(selectedClass)) {
      setSelectedClass(availableClasses[0]);
    }
  }, [availableClasses, selectedClass]);

  // Load from localStorage or Firebase
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: TarbiyahCycle = JSON.parse(saved);
        if (parsed.title) setCycleTitle(parsed.title);
        if (parsed.frequency) setFrequency(parsed.frequency);
        if (parsed.academicYear) setAcademicYear(parsed.academicYear);
        if (parsed.teacherDeadline) setTeacherDeadline(parsed.teacherDeadline);
        if (parsed.parentDeadline) setParentDeadline(parsed.parentDeadline);
        if (typeof parsed.isParentWindowOpen === "boolean") setIsParentWindowOpen(parsed.isParentWindowOpen);
        if (typeof parsed.isTeacherWindowOpen === "boolean") setIsTeacherWindowOpen(parsed.isTeacherWindowOpen);
        if (typeof parsed.isPublishedBySadar === "boolean") setIsPublishedBySadar(parsed.isPublishedBySadar);
        if (typeof parsed.includeExamMarksInBestStudent === "boolean") setIncludeExamMarks(parsed.includeExamMarksInBestStudent);
        if (typeof parsed.parentSecurityEnabled === "boolean") setParentSecurityEnabled(parsed.parentSecurityEnabled);
        if (parsed.parentPinSource) setParentPinSource(parsed.parentPinSource);
        if (Array.isArray(parsed.questions) && parsed.questions.length > 0) setQuestions(parsed.questions);
        if (parsed.records) setRecords(parsed.records);
      } catch (err) {
        console.error("Failed to parse saved tarbiyah cycle:", err);
      }
    }
  }, [storageKey]);

  // Automatically sync student identity fields (DOB, Aadhaar, Admission No, PIN) from internalStudents into records
  useEffect(() => {
    if (!internalStudents || internalStudents.length === 0) return;
    setRecords(prev => {
      let changed = false;
      const next = { ...prev };
      internalStudents.forEach(st => {
        const cls = (st.classLevel || st.class || "Class 1").trim();
        const classMap = next[cls] ? { ...next[cls] } : {};
        const existing = classMap[st.id];
        const computedPin = deriveStudentPin(st, parentPinSource);
        if (!existing) {
          changed = true;
          classMap[st.id] = {
            studentId: st.id,
            studentName: st.name,
            classLevel: cls,
            division: st.division || "A",
            rollNo: st.rollNumber || st.admissionNumber || "",
            admissionNumber: st.admissionNumber || st.rollNumber || "",
            dob: st.dob || "",
            aadhaar: st.aadhaar || "",
            customPin: st.customPin || "",
            accessPin: st.customPin || computedPin,
            parentPhone: st.phone || "",
            parentScores: {},
            parentVerified: false,
            teacherScores: {},
            totalParentPoints: 0,
            maxParentPoints: 0,
            totalTeacherPoints: 0,
            maxTeacherPoints: 0,
            totalScore: 0,
            maxTotalScore: 0,
            percentage: 0,
          };
          next[cls] = classMap;
        } else if (
          existing.dob !== (st.dob || existing.dob || "") ||
          existing.aadhaar !== (st.aadhaar || existing.aadhaar || "") ||
          existing.admissionNumber !== (st.admissionNumber || existing.admissionNumber || "") ||
          existing.customPin !== (st.customPin || existing.customPin || "") ||
          existing.accessPin !== (st.customPin || computedPin)
        ) {
          changed = true;
          classMap[st.id] = {
            ...existing,
            admissionNumber: st.admissionNumber || existing.admissionNumber || "",
            dob: st.dob || existing.dob || "",
            aadhaar: st.aadhaar || existing.aadhaar || "",
            customPin: st.customPin || existing.customPin || "",
            accessPin: st.customPin || computedPin,
          };
          next[cls] = classMap;
        }
      });
      return changed ? next : prev;
    });
  }, [internalStudents, parentPinSource]);

  // Save to localStorage & Cloud
  const handleSaveToCloud = async () => {
    setIsSaving(true);
    try {
      const cycleData: TarbiyahCycle = {
        id: `${madrasaRegNo || "demo"}_tarbiyah_${academicYear}`,
        madrasaId: madrasaRegNo || madrasaName || "demo",
        madrasaName,
        academicYear,
        title: cycleTitle,
        frequency,
        startDate: new Date().toISOString().split("T")[0],
        endDate: teacherDeadline,
        teacherDeadline,
        parentDeadline,
        isParentWindowOpen,
        isTeacherWindowOpen,
        isPublishedBySadar,
        includeExamMarksInBestStudent: includeExamMarks,
        parentSecurityEnabled,
        parentPinSource,
        questions,
        records,
        updatedAt: new Date().toISOString(),
      };

      // Save locally
      localStorage.setItem(storageKey, JSON.stringify(cycleData));

      // Save to Zero-Cost Server Cache (so parent portal loads with 0 Firestore reads!)
      fetch(`/api/tarbiyah/${encodeURIComponent(cycleData.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cycleData)
      }).catch(() => {});
      fetch(`/api/tarbiyah/${encodeURIComponent(cycleData.madrasaId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cycleData)
      }).catch(() => {});

      const fpKey = `tarbiyah_fp_${cycleData.id}`;
      const fpVal = JSON.stringify({
        title: cycleData.title,
        frequency: cycleData.frequency,
        teacherDeadline: cycleData.teacherDeadline,
        parentDeadline: cycleData.parentDeadline,
        isParentWindowOpen: cycleData.isParentWindowOpen,
        isTeacherWindowOpen: cycleData.isTeacherWindowOpen,
        isPublishedBySadar: cycleData.isPublishedBySadar,
        parentSecurityEnabled: cycleData.parentSecurityEnabled,
        parentPinSource: cycleData.parentPinSource,
        questions: cycleData.questions,
        records: cycleData.records
      });

      // Save to Firebase Firestore only if content actually changed
      if (db && sessionStorage.getItem(fpKey) !== fpVal) {
        const docRef = doc(db, "tarbiyah_cycles", cycleData.id);
        await setDoc(docRef, cycleData, { merge: true });
        try { sessionStorage.setItem(fpKey, fpVal); } catch {}
      }

      setFeedback("✅ തർബിയ്യത്ത് മൂല്യനിർണ്ണയ വിവരങ്ങൾ ക്ലൗഡിലും ലോക്കലിലും വിജയകരമായി സേവ് ചെയ്തു!");
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error("Error saving tarbiyah data:", err);
      setFeedback("⚠️ സേവ് ചെയ്തപ്പോൾ തടസ്സമുണ്ടായി. ലോക്കൽ ബാക്കപ്പ് സുരക്ഷിതമാണ്.");
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper: Get students for a specific class
  const getStudentsForClass = (cls: string): Student[] => {
    return internalStudents.filter(s => s.classLevel === cls);
  };

  // Usthad: Update score for a student
  const handleUsthadScoreChange = (classLevel: string, studentId: string, questionId: string, points: number) => {
    setRecords(prev => {
      const classMap = prev[classLevel] || {};
      const existing = classMap[studentId] || {
        studentId,
        studentName: internalStudents.find(s => s.id === studentId)?.name || "Student",
        classLevel,
        parentScores: {},
        parentVerified: false,
        teacherScores: {},
        totalParentPoints: 0,
        maxParentPoints: 0,
        totalTeacherPoints: 0,
        maxTeacherPoints: 0,
        totalScore: 0,
        maxTotalScore: 0,
        percentage: 0,
      };

      const updatedTeacherScores = {
        ...existing.teacherScores,
        [questionId]: points,
      };

      // Calculate totals
      const teacherQuestions = questions.filter(q => q.target === "teacher" && q.enabled);
      const parentQuestions = questions.filter(q => q.target === "parent" && q.enabled);

      const totalTeacherPoints = teacherQuestions.reduce((sum, q) => sum + (updatedTeacherScores[q.id] || 0), 0);
      const maxTeacherPoints = teacherQuestions.reduce((sum, q) => sum + q.maxPoints, 0);

      const totalParentPoints = parentQuestions.reduce((sum, q) => sum + (existing.parentScores[q.id] || 0), 0);
      const maxParentPoints = parentQuestions.reduce((sum, q) => sum + q.maxPoints, 0);

      const totalScore = totalTeacherPoints + totalParentPoints;
      const maxTotalScore = maxTeacherPoints + maxParentPoints;
      const percentage = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;

      return {
        ...prev,
        [classLevel]: {
          ...classMap,
          [studentId]: {
            ...existing,
            teacherScores: updatedTeacherScores,
            teacherEvaluatedAt: new Date().toISOString(),
            totalTeacherPoints,
            maxTeacherPoints,
            totalScore,
            maxTotalScore,
            percentage,
          },
        },
      };
    });
  };

  // Parent: Save evaluation from parent modal
  const handleSaveParentSubmission = () => {
    if (!parentModalStudent) return;
    if (!parentDeclarationAccepted) {
      alert("ദയവായി രക്ഷിതാവിന്റെ സാക്ഷ്യപ്പെടുത്തൽ (Declaration) ചെക്ക് ചെയ്യുക.");
      return;
    }

    const student = parentModalStudent;
    const classLevel = student.classLevel;

    setRecords(prev => {
      const classMap = prev[classLevel] || {};
      const existing = classMap[student.id] || {
        studentId: student.id,
        studentName: student.name,
        classLevel,
        parentScores: {},
        parentVerified: false,
        teacherScores: {},
        totalParentPoints: 0,
        maxParentPoints: 0,
        totalTeacherPoints: 0,
        maxTeacherPoints: 0,
        totalScore: 0,
        maxTotalScore: 0,
        percentage: 0,
      };

      const parentQuestions = questions.filter(q => q.target === "parent" && q.enabled);
      const teacherQuestions = questions.filter(q => q.target === "teacher" && q.enabled);

      const totalParentPoints = parentQuestions.reduce((sum, q) => sum + (parentScoresDraft[q.id] || 0), 0);
      const maxParentPoints = parentQuestions.reduce((sum, q) => sum + q.maxPoints, 0);

      const totalTeacherPoints = teacherQuestions.reduce((sum, q) => sum + (existing.teacherScores[q.id] || 0), 0);
      const maxTeacherPoints = teacherQuestions.reduce((sum, q) => sum + q.maxPoints, 0);

      const totalScore = totalTeacherPoints + totalParentPoints;
      const maxTotalScore = maxTeacherPoints + maxParentPoints;
      const percentage = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;

      return {
        ...prev,
        [classLevel]: {
          ...classMap,
          [student.id]: {
            ...existing,
            parentScores: { ...parentScoresDraft },
            parentVerified: true,
            parentEvaluatedAt: new Date().toISOString(),
            parentEvaluatorName: parentNameInput || student.fatherName || "Parent",
            totalParentPoints,
            maxParentPoints,
            totalScore,
            maxTotalScore,
            percentage,
          },
        },
      };
    });

    setParentModalStudent(null);
    setParentScoresDraft({});
    setParentDeclarationAccepted(false);
    setFeedback(`✅ ${student.name}-ന്റെ രക്ഷിതാവിന്റെ മൂല്യനിർണ്ണയം വിജയകരമായി രേഖപ്പെടുത്തി!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Staff / Teacher Effort Statistics
  const teacherEffortStats = useMemo(() => {
    return availableClasses.map((cls, idx) => {
      const classStudents = getStudentsForClass(cls);
      const totalStudents = classStudents.length;
      const classRecords = records[cls] || {};

      const teacherQuestionsCount = questions.filter(q => q.target === "teacher" && q.enabled).length;
      const parentQuestionsCount = questions.filter(q => q.target === "parent" && q.enabled).length;

      // Usthad completed if all teacher questions are scored
      const usthadCompletedCount = classStudents.filter(s => {
        const rec = classRecords[s.id];
        if (!rec || !rec.teacherScores) return false;
        return Object.keys(rec.teacherScores).length >= teacherQuestionsCount && teacherQuestionsCount > 0;
      }).length;

      // Parents completed if parent verified & has scores
      const parentCompletedCount = classStudents.filter(s => {
        const rec = classRecords[s.id];
        return rec && rec.parentVerified && Object.keys(rec.parentScores || {}).length >= parentQuestionsCount;
      }).length;

      const parentPendingCount = Math.max(0, totalStudents - parentCompletedCount);
      const usthadPendingCount = Math.max(0, totalStudents - usthadCompletedCount);

      const usthadPercent = totalStudents > 0 ? Math.round((usthadCompletedCount / totalStudents) * 100) : 0;
      const parentPercent = totalStudents > 0 ? Math.round((parentCompletedCount / totalStudents) * 100) : 0;

      // Overall class completion score
      const overallPercent = Math.round((usthadPercent + parentPercent) / 2);

      return {
        className: cls,
        totalStudents,
        usthadCompletedCount,
        usthadPendingCount,
        usthadPercent,
        parentCompletedCount,
        parentPendingCount,
        parentPercent,
        overallPercent,
      };
    }).sort((a, b) => b.overallPercent - a.overallPercent);
  }, [availableClasses, internalStudents, records, questions]);

  // Overall Ranked Students
  const rankedStudentsList = useMemo(() => {
    const list: {
      student: Student;
      record: StudentTarbiyahRecord;
      classLevel: string;
      percentage: number;
      totalScore: number;
      questionPoints: Record<string, number>;
    }[] = [];

    availableClasses.forEach(cls => {
      const classStudents = getStudentsForClass(cls);
      const classMap = records[cls] || {};

      classStudents.forEach(s => {
        const rec = classMap[s.id];
        if (rec) {
          const allQuestionPoints = { ...rec.teacherScores, ...rec.parentScores };
          list.push({
            student: s,
            record: rec,
            classLevel: cls,
            percentage: rec.percentage || 0,
            totalScore: rec.totalScore || 0,
            questionPoints: allQuestionPoints,
          });
        }
      });
    });

    if (selectedQuestionFilter === "all") {
      return list.sort((a, b) => b.percentage - a.percentage);
    } else {
      // Sort by specific question score
      return list.sort((a, b) => (b.questionPoints[selectedQuestionFilter] || 0) - (a.questionPoints[selectedQuestionFilter] || 0));
    }
  }, [availableClasses, workspaceStudents, records, selectedQuestionFilter]);

  // Filtered students in Usthad entry view
  const activeClassStudents = useMemo(() => {
    return getStudentsForClass(selectedClass).filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.admissionNumber && s.admissionNumber.toLowerCase().includes(q)) ||
        (s.division && s.division.toLowerCase().includes(q))
      );
    });
  }, [selectedClass, workspaceStudents, searchQuery]);

  // WhatsApp reminder message for parents
  const generateParentWhatsAppMessage = (cls: string) => {
    const classStudents = getStudentsForClass(cls);
    const classRecords = records[cls] || {};
    const pendingStudents = classStudents.filter(s => !classRecords[s.id]?.parentVerified);

    const namesList = pendingStudents.map((s, i) => `${i + 1}. ${s.name}`).join("\n");
    const parentPortalUrl = `${window.location.origin}${window.location.pathname}?view=tarbiyah-portal&class=${encodeURIComponent(cls)}`;

    const text = `*${madrasaName} - തർബിയ്യത്ത് നിരന്തര മൂല്യനിർണ്ണയം*\n\nപ്രിയ രക്ഷിതാക്കളുടെ ശ്രദ്ധയ്ക്ക്,\n${cls}-ലെ താഴെ പറയുന്ന കുട്ടികളുടെ ഈ മാസത്തെ തർബിയ്യത്ത് മൂല്യനിർണ്ണയം ഇനിയും പൂർത്തിയായിട്ടില്ല:\n\n${namesList}\n\nദയവായി താഴെ കാണുന്ന ലിങ്കിൽ ക്ലിക്ക് ചെയ്ത് കുട്ടിയുടെ സത്യസന്ധമായ വിലയിരുത്തൽ ഉടൻ രേഖപ്പെടുത്തുക:\n👉 ${parentPortalUrl}\n\nനന്ദി, മദ്റസ സദർ ഉസ്താദ്.`;

    navigator.clipboard.writeText(text);
    setFeedback(`✅ ${cls}-ലെ ${pendingStudents.length} രക്ഷിതാക്കൾക്കുള്ള വാട്സ്ആപ്പ് സന്ദേശം കോപ്പി ചെയ്തു!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  // WhatsApp report for staff / teachers effort
  const generateStaffEffortWhatsAppReport = () => {
    const lines = teacherEffortStats.map((st, i) => {
      const badge = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🔹";
      return `${badge} *${st.className}*: ഉസ്താദ്: ${st.usthadPercent}% | രക്ഷിതാക്കൾ: ${st.parentPercent}% (ബാക്കി: ${st.parentPendingCount})`;
    }).join("\n");

    const text = `*${madrasaName} - അധ്യാപക നിരന്തര മൂല്യനിർണ്ണയ പുരോഗതി (Teachers Effort Leaderboard)*\n\n${cycleTitle}\n\n${lines}\n\nഎല്ലാ ഉസ്താദുമാരും തങ്ങളുടെ ക്ലാസിലെ രക്ഷിതാക്കളെ ഓർമ്മിപ്പിക്കുകയും ശേഷിക്കുന്ന എൻട്രികൾ ഉടൻ പൂർത്തിയാക്കുകയും ചെയ്യുക.\nസദർ ഉസ്താദ്.`;

    navigator.clipboard.writeText(text);
    setFeedback("✅ സ്റ്റാഫ് മീറ്റിംഗ് / വാട്സ്ആപ്പ് ഗ്രൂപ്പ് റിപ്പോർട്ട് കോപ്പി ചെയ്തു!");
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className={`min-h-screen font-sans p-3 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-4 sm:space-y-6 transition-colors ${
      isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>

      {/* MOBILE APPLICATION APP-BAR */}
      <div className={`md:hidden sticky top-0 z-30 px-3 py-2.5 -mx-3 -mt-3 mb-2 border-b flex items-center justify-between backdrop-blur-md transition-colors ${
        isDark ? "bg-slate-950/95 border-slate-800 text-white" : "bg-white/95 border-slate-200 text-slate-900 shadow-xs"
      }`}>
        <div className="flex items-center gap-2 min-w-0">
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

          <div className="min-w-0 flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs truncate">Tarbiyah Suite</span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {selectedClass} • {frequency === "monthly" ? "പ്രതിമാസം" : "ആഴ്ചയിൽ"}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT MOBILE CONTROLS */}
        <div className="flex items-center gap-1.5 shrink-0">
          {internalStudents.length === 0 && (
            <button
              type="button"
              onClick={() => setIsSamasthaModalOpen(true)}
              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                isDark ? "bg-slate-900 text-teal-300 border-slate-800" : "bg-teal-50 text-teal-800 border-teal-200"
              }`}
              title="സമസ്ത CSV ഇമ്പോർട്ട്"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isDark ? "bg-slate-900 text-amber-300 border-slate-800" : "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleSaveToCloud}
            disabled={isSaving}
            className="px-2.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-black text-xs transition cursor-pointer shadow-xs flex items-center gap-1 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="text-[11px]">{isSaving ? "..." : "സേവ്"}</span>
          </button>
        </div>
      </div>

      {/* TOP DESKTOP HEADER BAR */}
      <div className={`hidden md:flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-3xl transition-colors ${
        isDark ? "bg-slate-900/90 border border-slate-800 text-white shadow-xl" : "bg-white border border-slate-200 text-slate-900 shadow-sm"
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onBackToLanding}
              className={`px-3 py-2 rounded-xl transition cursor-pointer border flex items-center gap-1.5 text-xs font-bold ${
                isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              }`}
            >
              <Globe className="w-4 h-4 text-emerald-500" />
              <span>ഹോം</span>
            </button>
            <button
              onClick={onBackToWorkspace}
              className={`px-3 py-2 rounded-xl transition cursor-pointer border flex items-center gap-1.5 text-xs font-bold ${
                isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              }`}
            >
              <Users className="w-4 h-4 text-teal-600" />
              <span>സീറ്റിംഗ് ആപ്പ്</span>
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg border font-bold text-xs flex items-center gap-1.5 ${
                isDark ? "bg-teal-950 text-teal-300 border-teal-800" : "bg-teal-50 text-teal-800 border-teal-300"
              }`}>
                <HeartHandshake className="w-4 h-4" />
                <span>ആപ്പ് 3 • Tarbiyah Suite</span>
              </span>
              <h1 className="text-base sm:text-lg font-black">
                നിരന്തര മൂല്യനിർണ്ണയ & തർബിയ്യത്ത് സിസ്റ്റം
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isPublishedBySadar ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300"
              }`}>
                {isPublishedBySadar ? "🟢 സദർ ഉസ്താദ് പബ്ലിഷ് ചെയ്തു" : "🟡 ഡ്രാഫ്റ്റ് / ഉസ്താദ് റിവ്യൂ"}
              </span>
            </div>
            <p className="text-xs text-slate-500 pt-0.5">
              {madrasaName} {madrasaRegNo && `(${madrasaRegNo})`} • {cycleTitle}
            </p>
          </div>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div className="flex items-center gap-2">
          {internalStudents.length === 0 && (
            <button
              type="button"
              onClick={() => setIsSamasthaModalOpen(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                isDark ? "bg-slate-800 text-teal-300 border-slate-700" : "bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-300"
              }`}
              title="സമസ്ത പോർട്ടലിൽ നിന്നും കുട്ടികളെ ഇമ്പോർട്ട് ചെയ്യുക"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
              <span>സമസ്ത CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              isDark ? "bg-slate-800 text-amber-300 border-slate-700" : "bg-slate-100 text-slate-800 border-slate-300"
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{isDark ? "Light" : "Dark"}</span>
          </button>

          <button
            type="button"
            onClick={generateStaffEffortWhatsAppReport}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 cursor-pointer ${
              isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
            }`}
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span>സ്റ്റാഫ് ചാർട്ട് ഷെയർ</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToCloud}
            disabled={isSaving}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white font-extrabold rounded-xl text-xs transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "സേവ് ചെയ്യുന്നു..." : "ക്ലൗഡിൽ സേവ് ചെയ്യുക"}</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK TOAST */}
      {feedback && (
        <div className="p-3.5 border rounded-2xl font-bold text-xs flex items-center gap-2 bg-teal-50 border-teal-300 text-teal-900 shadow-sm animate-in fade-in">
          <Sparkles className="w-4 h-4 shrink-0 text-teal-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* MAIN APPLICATION NAVIGATION TABS (DESKTOP) */}
      <div className={`hidden md:flex flex-wrap items-center gap-2 border-b pb-2 ${
        isDark ? "border-slate-800" : "border-slate-200"
      }`}>
        <button
          type="button"
          onClick={() => setActiveTab("usthad_entry")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer border ${
            activeTab === "usthad_entry"
              ? "bg-teal-600 text-white border-teal-500 shadow-md"
              : isDark ? "bg-slate-900 text-slate-400 border-slate-800" : "bg-white text-slate-600 border-slate-200 shadow-2xs"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>1. ക്ലാസ് ഉസ്താദ് എൻട്രി (Usthad Evaluation)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("teacher_effort")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer border ${
            activeTab === "teacher_effort"
              ? "bg-teal-600 text-white border-teal-500 shadow-md"
              : isDark ? "bg-slate-900 text-slate-400 border-slate-800" : "bg-white text-slate-600 border-slate-200 shadow-2xs"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>2. ടീച്ചേഴ്സ് എഫർട്ട് & പ്രോഗ്രസ് (Staff Leaderboard)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rank_list")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer border ${
            activeTab === "rank_list"
              ? "bg-teal-600 text-white border-teal-500 shadow-md"
              : isDark ? "bg-slate-900 text-slate-400 border-slate-800" : "bg-white text-slate-600 border-slate-200 shadow-2xs"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>3. വിദ്യാർത്ഥി റാങ്ക് ലിസ്റ്റ് & ബെസ്റ്റ് സ്റ്റുഡന്റ്</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reminders")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer border ${
            activeTab === "reminders"
              ? "bg-teal-600 text-white border-teal-500 shadow-md"
              : isDark ? "bg-slate-900 text-slate-400 border-slate-800" : "bg-white text-slate-600 border-slate-200 shadow-2xs"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>4. ബാക്കി നിൽക്കുന്നവരുടെ ലിസ്റ്റ് (Reminders)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer border ${
            activeTab === "settings"
              ? "bg-teal-600 text-white border-teal-500 shadow-md"
              : isDark ? "bg-slate-900 text-slate-400 border-slate-800" : "bg-white text-slate-600 border-slate-200 shadow-2xs"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>5. ചോദ്യങ്ങളും സമയപരിധിയും (Settings & Windows)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: USTHAD EVALUATION ENTRY */}
      {/* ========================================================================= */}
      {activeTab === "usthad_entry" && (
        <div className="space-y-4">
          {/* CLASS SELECTOR BAR */}
          <div className={`p-4 rounded-3xl border space-y-3 ${
            isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className={`font-black text-sm flex items-center gap-1.5 ${
                  isDark ? "text-teal-400" : "text-teal-700"
                }`}>
                  <UserCheck className="w-4 h-4" />
                  <span>ക്ലാസ് ഉസ്താദ് നേരിട്ട് മാർക്ക് നൽകുന്ന വിഭാഗം</span>
                </h3>
                <p className="text-xs text-slate-500">
                  പഠനം, പെരുമാറ്റം, അനുസരണം, കൃത്യനിഷ്ഠ, ഹാജർ, വേഷം എന്നിവയിൽ ഓരോ കുട്ടിക്കും സ്റ്റാറുകൾ നൽകുക.
                </p>
              </div>

              {/* SEARCH INPUT */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="കുട്ടിയുടെ പേര് തിരയുക..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border ${
                    isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              </div>
            </div>

            {/* CLASS CHIPS (HORIZONTALLY SCROLLABLE ON MOBILE) */}
            <div className="flex overflow-x-auto no-scrollbar items-center gap-1.5 py-1 -mx-1 px-1">
              {availableClasses.map(cls => {
                const count = getStudentsForClass(cls).length;
                const isSel = selectedClass === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                      isSel
                        ? "bg-teal-600 text-white border-teal-500 shadow-xs"
                        : isDark ? "bg-slate-950 text-slate-400 border-slate-800" : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    <span>{cls}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSel ? "bg-white/20 text-white" : isDark ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-700"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STUDENTS EVALUATION LIST */}
          <div className="space-y-3">
            {activeClassStudents.length === 0 ? (
              <div className={`p-8 text-center border rounded-3xl ${
                isDark ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-500"
              }`}>
                <Users className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="font-bold text-xs">ഈ ക്ലാസിൽ വിദ്യാർത്ഥികൾ ലഭ്യമല്ല അല്ലെങ്കിൽ തിരച്ചിലിൽ കണ്ടെത്തിയില്ല.</p>
              </div>
            ) : (
              activeClassStudents.map(student => {
                const studentRecord = records[selectedClass]?.[student.id];
                const teacherScores = studentRecord?.teacherScores || {};
                const parentDone = studentRecord?.parentVerified;

                return (
                  <div
                    key={student.id}
                    className={`p-4 rounded-2xl border transition ${
                      isDark ? "bg-slate-900/80 border-slate-800 text-slate-100" : "bg-white border-slate-200 shadow-2xs hover:shadow-sm text-slate-900"
                    }`}
                  >
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b ${
                      isDark ? "border-slate-800" : "border-slate-100"
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isDark ? "bg-teal-950 text-teal-300" : "bg-teal-100 text-teal-800"
                        }`}>
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm">{student.name}</span>
                            {student.division && (
                              <span className={`text-[10px] px-1.5 rounded font-semibold ${
                                isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
                              }`}>
                                Div {student.division}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">
                              Roll: {student.admissionNumber || "NA"}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {student.fatherName ? `വാപ്പ: ${student.fatherName}` : "രക്ഷിതാവ്"}
                          </span>
                        </div>
                      </div>

                      {/* PARENT EVALUATION STATUS & QUICK POPUP BUTTON */}
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 border ${
                          parentDone
                            ? isDark
                              ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                              : "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : isDark
                              ? "bg-amber-950 text-amber-300 border-amber-800"
                              : "bg-amber-50 text-amber-800 border-amber-300"
                        }`}>
                          {parentDone ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>രക്ഷിതാവ് രേഖപ്പെടുത്തി ({studentRecord.totalParentPoints} pt)</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>രക്ഷിതാവ് ചെയ്തിട്ടില്ല</span>
                            </>
                          )}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setParentModalStudent(student);
                            setParentScoresDraft(studentRecord?.parentScores || {});
                            setParentDeclarationAccepted(studentRecord?.parentVerified || false);
                            setParentNameInput(studentRecord?.parentEvaluatorName || student.fatherName || "");
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                            isDark
                              ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                          }`}
                          title="രക്ഷിതാവിന്റെ ഫോൺ കോളിലൂടെയോ നേരിട്ടോ ഉള്ള ഉത്തരങ്ങൾ രേഖപ്പെടുത്തുക"
                        >
                          രക്ഷിതാവ് എൻട്രി
                        </button>
                      </div>
                    </div>

                    {/* USTHAD QUESTIONS RATING GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3">
                      {questions.filter(q => q.target === "teacher" && q.enabled).map(q => {
                        const currentVal = teacherScores[q.id] || 0;
                        return (
                          <div
                            key={q.id}
                            className={`p-2.5 rounded-xl border space-y-1.5 ${
                              isDark
                                ? "bg-slate-950/60 border-slate-800/80 text-slate-200"
                                : "bg-slate-50/80 border-slate-200 text-slate-800"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-bold text-xs ${isDark ? "text-slate-200" : "text-slate-800"}`}>{q.titleMl}</span>
                              <span className={`text-[10px] font-mono font-bold ${isDark ? "text-teal-400" : "text-teal-700"}`}>
                                {currentVal}/{q.maxPoints}
                              </span>
                            </div>

                            {renderQuestionInputWidget(
                              q,
                              currentVal,
                              (val) => handleUsthadScoreChange(selectedClass, student.id, q.id, val),
                              isDark
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* SCORE SUMMARY BAR */}
                    {studentRecord && (
                      <div className={`mt-3 pt-2 border-t flex items-center justify-between text-xs ${
                        isDark ? "border-slate-800" : "border-slate-100"
                      }`}>
                        <span className="text-slate-500">
                          ഉസ്താദ് സ്കോർ: <strong className={isDark ? "text-teal-400" : "text-teal-700"}>{studentRecord.totalTeacherPoints}</strong> • 
                          രക്ഷിതാവ് സ്കോർ: <strong className={isDark ? "text-purple-400" : "text-purple-700"}>{studentRecord.totalParentPoints}</strong>
                        </span>
                        <span className={`font-black ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                          ആകെ സ്കോർ: {studentRecord.totalScore}/{studentRecord.maxTotalScore} ({studentRecord.percentage}%)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TEACHER EFFORT & PROGRESS LEADERBOARD */}
      {/* ========================================================================= */}
      {activeTab === "teacher_effort" && (
        <div className="space-y-6">
          <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div>
              <h3 className={`font-black text-base flex items-center gap-2 ${
                isDark ? "text-teal-400" : "text-teal-700"
              }`}>
                <BarChart3 className="w-5 h-5" />
                <span>ടീച്ചേഴ്സ് എഫർട്ട് & ക്ലാസ് പുരോഗതി ചാർട്ട് (Staff Effort Chart)</span>
              </h3>
              <p className="text-xs text-slate-500 max-w-2xl mt-1">
                ഓരോ ക്ലാസ് ഉസ്താദുമാരും തങ്ങളുടെ കുട്ടികളുടെ എൻട്രി എത്രത്തോളം പൂർത്തിയാക്കി എന്നും, രക്ഷിതാക്കളിൽ എത്ര പേർ ബാക്കിയുണ്ടെന്നും ഒറ്റനോട്ടത്തിൽ അറിയാം. സ്റ്റാഫുകൾക്കിടയിൽ റാങ്ക് ലിസ്റ്റ് തയ്യാറാക്കാം.
              </p>
            </div>

            <button
              type="button"
              onClick={generateStaffEffortWhatsAppReport}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer shrink-0"
            >
              <Share2 className="w-4 h-4" />
              <span>സ്റ്റാഫ് ഗ്രൂപ്പിലേക്ക് ഷെയർ ചെയ്യുക</span>
            </button>
          </div>

          {/* EFFORT TABLE */}
          <div className={`rounded-3xl border overflow-hidden ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b font-extrabold ${
                    isDark ? "bg-slate-950/70 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <th className="p-3.5 text-center w-12">റാങ്ക്</th>
                    <th className="p-3.5">ക്ലാസ്സ്</th>
                    <th className="p-3.5 text-center">ആകെ കുട്ടികൾ</th>
                    <th className="p-3.5">ഉസ്താദ് പൂർത്തിയാക്കിയത്</th>
                    <th className="p-3.5">രക്ഷിതാക്കൾ പൂർത്തിയാക്കിയത്</th>
                    <th className="p-3.5 text-center">രക്ഷിതാക്കളുടെ ബാക്കി</th>
                    <th className="p-3.5 text-center">ആകെ സ്കോർ %</th>
                    <th className="p-3.5 text-center">നടപടി</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-100"}`}>
                  {teacherEffortStats.map((item, idx) => {
                    const rankBadge = idx === 0 ? "🥇 ഒന്നാം റാങ്ക്" : idx === 1 ? "🥈 രണ്ടാം റാങ്ക്" : idx === 2 ? "🥉 മൂന്നാം റാങ്ക്" : `#${idx + 1}`;
                    return (
                      <tr key={item.className} className={`transition ${isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}`}>
                        <td className="p-3.5 text-center font-black">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                            idx === 0 ? "bg-amber-100 text-amber-900 font-black" : "text-slate-500"
                          }`}>
                            {rankBadge}
                          </span>
                        </td>
                        <td className={`p-3.5 font-black text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                          {item.className}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold">
                          {item.totalStudents}
                        </td>
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span>{item.usthadCompletedCount} / {item.totalStudents}</span>
                              <strong className="text-teal-600">{item.usthadPercent}%</strong>
                            </div>
                            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                              <div
                                className="bg-teal-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${item.usthadPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span>{item.parentCompletedCount} / {item.totalStudents}</span>
                              <strong className="text-purple-600">{item.parentPercent}%</strong>
                            </div>
                            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                              <div
                                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${item.parentPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-center font-bold">
                          {item.parentPendingCount > 0 ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                              isDark ? "bg-amber-950 text-amber-300" : "bg-amber-100 text-amber-800"
                            }`}>
                              {item.parentPendingCount} പേർ ബാക്കി
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                              isDark ? "bg-emerald-950 text-emerald-300" : "bg-emerald-100 text-emerald-800"
                            }`}>
                              ✓ മുഴുവൻ പൂർത്തിയായി
                            </span>
                          )}
                        </td>
                        <td className={`p-3.5 text-center font-mono font-black text-sm ${isDark ? "text-teal-400" : "text-teal-700"}`}>
                          {item.overallPercent}%
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => generateParentWhatsAppMessage(item.className)}
                            className={`px-2.5 py-1 border rounded-xl text-[11px] font-bold transition flex items-center gap-1 mx-auto cursor-pointer ${
                              isDark
                                ? "bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                            }`}
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>റിമൈൻഡർ</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STUDENT RANK LIST & BEST STUDENT */}
      {/* ========================================================================= */}
      {activeTab === "rank_list" && (
        <div className="space-y-6">
          <div className={`p-5 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-black text-base flex items-center gap-2 ${
                  isDark ? "text-teal-400" : "text-teal-700"
                }`}>
                  <Award className="w-5 h-5" />
                  <span>വിദ്യാർത്ഥി റാങ്ക് ലിസ്റ്റും ബെസ്റ്റ് സ്റ്റുഡന്റും</span>
                </h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isPublishedBySadar ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300"
                }`}>
                  {isPublishedBySadar ? "🟢 പൊതുജനങ്ങൾക്ക് ലഭ്യമാണ് (Published)" : "🔒 സദർ ഉസ്താദ് ലോക്ക് ചെയ്തു"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ഉസ്താദിന്റെയും രക്ഷിതാവിന്റെയും വിലയിരുത്തലുകൾ ഒരുമിപ്പിച്ച് തയ്യാറാക്കിയ സമ്പൂർണ്ണ തർബിയ്യത്ത് റാങ്ക് ലിസ്റ്റ്.
              </p>
            </div>

            {/* SADAR USTHAD PUBLISH TOGGLE */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsPublishedBySadar(!isPublishedBySadar);
                  setFeedback(
                    !isPublishedBySadar
                      ? "🟢 സദർ ഉസ്താദ് റാങ്ക് ലിസ്റ്റ് ഔദ്യോഗികമായി പബ്ലിഷ് ചെയ്തു!"
                      : "🔒 റാങ്ക് ലിസ്റ്റ് ഡ്രാഫ്റ്റ് മോഡിലേക്ക് ലോക്ക് ചെയ്തു."
                  );
                  setTimeout(() => setFeedback(null), 4000);
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-sm ${
                  isPublishedBySadar
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-amber-600 hover:bg-amber-500 text-white"
                }`}
              >
                {isPublishedBySadar ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{isPublishedBySadar ? "പബ്ലിഷ് ചെയ്തു (Visible)" : "സദർ ഉസ്താദ് പബ്ലിഷ് ചെയ്യുക"}</span>
              </button>
            </div>
          </div>

          {/* QUESTION SPECIFIC LEADERBOARD SELECTOR */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-500 shrink-0">പ്രത്യേക കാറ്റഗറി റാങ്ക്:</span>
            <button
              type="button"
              onClick={() => setSelectedQuestionFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                selectedQuestionFilter === "all"
                  ? "bg-teal-600 text-white border-teal-500 shadow-xs"
                  : isDark
                    ? "bg-slate-900 text-slate-400 border-slate-800"
                    : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              🏆 ഓവറോൾ ബെസ്റ്റ് സ്റ്റുഡന്റ്
            </button>

            {questions.filter(q => q.enabled).map(q => (
              <button
                key={q.id}
                type="button"
                onClick={() => setSelectedQuestionFilter(q.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                  selectedQuestionFilter === q.id
                    ? "bg-teal-600 text-white border-teal-500 shadow-xs"
                    : isDark
                      ? "bg-slate-900 text-slate-400 border-slate-800"
                      : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                {q.id === "p_namaz" ? "🕌 5 വക്ത് നിസ്കാരം ചാമ്പ്യൻസ്" : q.titleMl}
              </button>
            ))}
          </div>

          {/* TOP 3 PODIUM / BEST STUDENTS */}
          {rankedStudentsList.length >= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* RANK 2 */}
              <div className={`order-2 sm:order-1 p-5 rounded-3xl border text-center space-y-2 shadow-2xs ${
                isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
              }`}>
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-200 text-slate-700 font-black flex items-center justify-center text-sm shadow-xs">
                  🥈
                </div>
                <div className="text-xs font-bold uppercase text-slate-400">രണ്ടാം സ്ഥാനം</div>
                <div className={`font-black text-base ${isDark ? "text-white" : "text-slate-900"}`}>{rankedStudentsList[1].student.name}</div>
                <div className="text-xs text-slate-500">{rankedStudentsList[1].classLevel}</div>
                <div className="text-sm font-mono font-bold text-teal-600">{rankedStudentsList[1].percentage}%</div>
              </div>

              {/* RANK 1 CHAMPION */}
              <div className={`order-1 sm:order-2 p-6 rounded-3xl border-2 text-center space-y-2 shadow-lg scale-105 ${
                isDark
                  ? "border-amber-500/80 bg-gradient-to-b from-amber-500/10 to-slate-900 text-white"
                  : "border-amber-400/80 bg-gradient-to-b from-amber-500/10 to-white text-slate-900"
              }`}>
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-lg shadow-md">
                  👑 1
                </div>
                <div className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                  {selectedQuestionFilter === "p_namaz" ? "നമസ്കാര ചാമ്പ്യൻ" : "ബെസ്റ്റ് സ്റ്റുഡന്റ് (1st Place)"}
                </div>
                <div className={`font-black text-lg ${isDark ? "text-white" : "text-slate-900"}`}>{rankedStudentsList[0].student.name}</div>
                <div className="text-xs text-slate-500">{rankedStudentsList[0].classLevel}</div>
                <div className={`text-base font-mono font-black ${isDark ? "text-teal-400" : "text-teal-700"}`}>{rankedStudentsList[0].percentage}%</div>
              </div>

              {/* RANK 3 */}
              <div className={`order-3 p-5 rounded-3xl border text-center space-y-2 shadow-2xs ${
                isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
              }`}>
                <div className={`w-10 h-10 mx-auto rounded-full font-black flex items-center justify-center text-sm shadow-xs ${
                  isDark ? "bg-amber-900/40 text-amber-300" : "bg-amber-100 text-amber-800"
                }`}>
                  🥉
                </div>
                <div className="text-xs font-bold uppercase text-slate-400">മൂന്നാം സ്ഥാനം</div>
                <div className={`font-black text-base ${isDark ? "text-white" : "text-slate-900"}`}>{rankedStudentsList[2].student.name}</div>
                <div className="text-xs text-slate-500">{rankedStudentsList[2].classLevel}</div>
                <div className="text-sm font-mono font-bold text-teal-600">{rankedStudentsList[2].percentage}%</div>
              </div>
            </div>
          )}

          {/* DETAILED RANK TABLE */}
          <div className={`rounded-3xl border overflow-hidden ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b font-extrabold ${
                    isDark ? "bg-slate-950/70 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <th className="p-3.5 text-center w-12">റാങ്ക്</th>
                    <th className="p-3.5">വിദ്യാർത്ഥിയുടെ പേര്</th>
                    <th className="p-3.5">ക്ലാസ്സ്</th>
                    <th className="p-3.5 text-center">ഉസ്താദ് സ്കോർ</th>
                    <th className="p-3.5 text-center">രക്ഷിതാവ് സ്കോർ</th>
                    <th className="p-3.5 text-center">ആകെ പോയിന്റ്</th>
                    <th className="p-3.5 text-center">ശതമാനം</th>
                    <th className="p-3.5 text-center">പദവി</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-100"}`}>
                  {rankedStudentsList.map((item, index) => (
                    <tr key={item.student.id} className={`transition ${isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50/60"}`}>
                      <td className="p-3.5 text-center font-black">
                        #{index + 1}
                      </td>
                      <td className="p-3.5 font-bold">
                        <div className={isDark ? "text-white" : "text-slate-900"}>{item.student.name}</div>
                        <div className="text-[10px] text-slate-400">{item.student.fatherName || "രക്ഷിതാവ്"}</div>
                      </td>
                      <td className="p-3.5">{item.classLevel}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-teal-600">
                        {item.record.totalTeacherPoints} pt
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-purple-600">
                        {item.record.totalParentPoints} pt
                      </td>
                      <td className="p-3.5 text-center font-mono font-black">
                        {item.totalScore} / {item.record.maxTotalScore}
                      </td>
                      <td className={`p-3.5 text-center font-mono font-black ${isDark ? "text-teal-400" : "text-teal-700"}`}>
                        {item.percentage}%
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.percentage >= 90
                            ? "bg-emerald-100 text-emerald-800"
                            : item.percentage >= 75
                            ? "bg-teal-100 text-teal-800"
                            : item.percentage >= 50
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {item.percentage >= 90 ? "മുമ്താസ് (A+)" : item.percentage >= 75 ? "ജയ്യിദ് ജിദ്ദൻ (A)" : "ശ്രദ്ധിക്കണം"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REMINDERS & CLASS-WISE REMAINING LIST */}
      {/* ========================================================================= */}
      {activeTab === "reminders" && (
        <div className="space-y-6">
          {/* TOP BANNER & OVERALL SUMMARY */}
          <div className={`p-5 rounded-3xl border space-y-4 ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className={`font-black text-base flex items-center gap-2 ${
                  isDark ? "text-teal-400" : "text-teal-700"
                }`}>
                  <ListChecks className="w-5 h-5 text-teal-600" />
                  <span>ക്ലാസ്സ് തിരിച്ചുള്ള ബാക്കി സ്റ്റാറ്റസും ലിസ്റ്റും (Class-wise Remaining Submissions)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ഓരോ ക്ലാസിലും ഡിവിഷനിലും രക്ഷിതാവിന്റെയും ഉസ്താദിന്റെയും ഭാഗത്തുനിന്ന് പൂർത്തിയാക്കാൻ ബാക്കിയുള്ള കുട്ടികളുടെ കൃത്യമായ കണക്ക്.
                </p>
              </div>

              {/* OVERALL QUICK BADGES */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 text-xs font-black">
                  👨‍👩‍👧 രക്ഷിതാക്കൾ ബാക്കി: {classDivisionGroups.reduce((acc, g) => acc + g.pendingParents.length, 0)}
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 text-xs font-black">
                  👳‍♂️ ഉസ്താദ് ബാക്കി: {classDivisionGroups.reduce((acc, g) => acc + g.pendingUsthad.length, 0)}
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-xs font-black">
                  ✅ രണ്ടും പൂർത്തിയായവർ: {classDivisionGroups.reduce((acc, g) => acc + g.bothCompleted.length, 0)}
                </div>
              </div>
            </div>

            {/* FILTER PILLS */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500">ഫിൽട്ടർ:</span>
              <button
                type="button"
                onClick={() => setRemainingFilter("all")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  remainingFilter === "all"
                    ? "bg-teal-600 text-white border-teal-500 shadow-2xs"
                    : isDark ? "bg-slate-950 text-slate-400 border-slate-800" : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                എല്ലാ ക്ലാസുകളും ({classDivisionGroups.length})
              </button>
              <button
                type="button"
                onClick={() => setRemainingFilter("pending_only")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  remainingFilter === "pending_only"
                    ? "bg-rose-600 text-white border-rose-500 shadow-2xs"
                    : isDark ? "bg-slate-950 text-slate-400 border-slate-800" : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                ബാക്കിയുള്ളവ മാത്രം ({classDivisionGroups.filter(g => g.pendingParents.length > 0 || g.pendingUsthad.length > 0).length})
              </button>
              <button
                type="button"
                onClick={() => setRemainingFilter("parent_pending")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  remainingFilter === "parent_pending"
                    ? "bg-purple-600 text-white border-purple-500 shadow-2xs"
                    : isDark ? "bg-slate-950 text-slate-400 border-slate-800" : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                രക്ഷിതാവ് ബാക്കിയുള്ളവ ({classDivisionGroups.filter(g => g.pendingParents.length > 0).length})
              </button>
              <button
                type="button"
                onClick={() => setRemainingFilter("usthad_pending")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  remainingFilter === "usthad_pending"
                    ? "bg-amber-600 text-white border-amber-500 shadow-2xs"
                    : isDark ? "bg-slate-950 text-slate-400 border-slate-800" : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                ഉസ്താദ് ബാക്കിയുള്ളവ ({classDivisionGroups.filter(g => g.pendingUsthad.length > 0).length})
              </button>
            </div>
          </div>

          {/* CLASS CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classDivisionGroups
              .filter(group => {
                if (remainingFilter === "pending_only") return group.pendingParents.length > 0 || group.pendingUsthad.length > 0;
                if (remainingFilter === "parent_pending") return group.pendingParents.length > 0;
                if (remainingFilter === "usthad_pending") return group.pendingUsthad.length > 0;
                return true;
              })
              .map(group => {
                const isAllDone = group.pendingParents.length === 0 && group.pendingUsthad.length === 0;

                return (
                  <div
                    key={group.key}
                    className={`p-5 rounded-3xl border space-y-4 transition ${
                      isAllDone
                        ? isDark ? "bg-slate-900/90 border-emerald-900/40" : "bg-emerald-50/20 border-emerald-200 shadow-xs"
                        : isDark ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    {/* CARD HEADER */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-black text-base ${isDark ? "text-white" : "text-slate-900"}`}>
                            {group.classLevel}
                          </h4>
                          <span className="px-2 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold text-xs">
                            Div {group.division}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          ആകെ {group.totalStudents} കുട്ടികൾ
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => generateGroupParentWhatsAppMessage(group)}
                        disabled={group.pendingParents.length === 0}
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                        title="ഈ ക്ലാസിലെ ബാക്കി രക്ഷിതാക്കൾക്കുള്ള വാട്സ്ആപ്പ് സന്ദേശം കോപ്പി ചെയ്യുക"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>
                    </div>

                    {/* DUAL PROGRESS BARS (PARENT & USTHAD) */}
                    <div className="space-y-2.5 pt-1">
                      {/* PARENT STATUS */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                            <span>👨‍👩‍👧 രക്ഷിതാക്കൾ:</span>
                            {group.pendingParents.length === 0 ? (
                              <span className="text-emerald-600 font-black">പൂർത്തിയായി</span>
                            ) : (
                              <span className="text-rose-600 font-black">{group.pendingParents.length} ബാക്കി</span>
                            )}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {group.completedParentsCount}/{group.totalStudents} ({group.parentPercent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              group.parentPercent === 100 ? "bg-emerald-500" : group.parentPercent >= 50 ? "bg-purple-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${group.parentPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* USTHAD STATUS */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                            <span>👳‍♂️ ക്ലാസ് ഉസ്താദ്:</span>
                            {group.pendingUsthad.length === 0 ? (
                              <span className="text-emerald-600 font-black">പൂർത്തിയായി</span>
                            ) : (
                              <span className="text-amber-600 font-black">{group.pendingUsthad.length} ബാക്കി</span>
                            )}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {group.completedUsthadCount}/{group.totalStudents} ({group.usthadPercent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              group.usthadPercent === 100 ? "bg-emerald-500" : group.usthadPercent >= 50 ? "bg-teal-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${group.usthadPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* PROMINENT BUTTON: WHO IS REMAINING? */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRemainingGroup(group);
                          setActiveRemainingTab(group.pendingParents.length > 0 ? "parents" : "usthads");
                        }}
                        className={`w-full py-2.5 px-3 rounded-2xl text-xs font-black transition flex items-center justify-between cursor-pointer border ${
                          isAllDone
                            ? "bg-emerald-600/10 text-emerald-700 border-emerald-300 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-600/20"
                            : "bg-teal-600 hover:bg-teal-500 text-white border-teal-500 shadow-xs"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Eye className="w-4 h-4" />
                          <span>ആരൊക്കെയാണ് ബാക്കി? (ലിസ്റ്റ് കാണുക)</span>
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          isAllDone ? "bg-emerald-600 text-white" : "bg-white/20 text-white"
                        }`}>
                          {group.pendingParents.length} രക്ഷിതാവ് • {group.pendingUsthad.length} ഉസ്താദ്
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* ========================================================================= */}
          {/* DETAILED REMAINING STUDENTS MODAL (WHO IS REMAINING?) */}
          {/* ========================================================================= */}
          {selectedRemainingGroup && (
            <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <div className={`border rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 ${
                isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
              }`}>
                {/* MODAL HEADER */}
                <div className={`flex items-center justify-between border-b pb-3 ${
                  isDark ? "border-slate-800" : "border-slate-100"
                }`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                      വിശദമായ ബാക്കി വിവരങ്ങൾ (Pending Drilldown)
                    </span>
                    <h3 className={`font-black text-lg ${isDark ? "text-white" : "text-slate-900"}`}>
                      {selectedRemainingGroup.displayName}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRemainingGroup(null)}
                    className={`p-2 text-slate-400 rounded-xl transition cursor-pointer ${
                      isDark ? "hover:bg-slate-800 hover:text-white" : "hover:bg-slate-100 hover:text-slate-700"
                    }`}
                  >
                    ✕
                  </button>
                </div>

                {/* MODAL SUB-TABS */}
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <button
                    type="button"
                    onClick={() => setActiveRemainingTab("parents")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                      activeRemainingTab === "parents"
                        ? "bg-rose-600 text-white shadow-xs"
                        : isDark ? "bg-slate-950 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>👨‍👩‍👧 രക്ഷിതാവ് ബാക്കി ({selectedRemainingGroup.pendingParents.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRemainingTab("usthads")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                      activeRemainingTab === "usthads"
                        ? "bg-amber-600 text-white shadow-xs"
                        : isDark ? "bg-slate-950 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>👳‍♂️ ഉസ്താദ് ബാക്കി ({selectedRemainingGroup.pendingUsthad.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRemainingTab("completed")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                      activeRemainingTab === "completed"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : isDark ? "bg-slate-950 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>✅ പൂർത്തിയായവർ ({selectedRemainingGroup.bothCompleted.length})</span>
                  </button>
                </div>

                {/* MODAL LIST VIEW */}
                <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
                  {/* 1. PARENTS PENDING */}
                  {activeRemainingTab === "parents" && (
                    selectedRemainingGroup.pendingParents.length === 0 ? (
                      <div className="p-8 text-center text-sm font-bold text-emerald-600">
                        🎉 ഈ ക്ലാസിലെ മുഴുവൻ രക്ഷിതാക്കളും സമർപ്പണം പൂർത്തിയാക്കി!
                      </div>
                    ) : (
                      selectedRemainingGroup.pendingParents.map((st, i) => (
                        <div
                          key={`${st.id}-${i}`}
                          className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <div>
                              <div className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{st.name}</span>
                                {st.rollNumber && (
                                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 rounded font-mono">
                                    Roll #{st.rollNumber}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                രക്ഷിതാവ്: {st.fatherName || "രക്ഷിതാവ്"} {st.phone ? `• 📞 ${st.phone}` : ""}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => sendIndividualParentWhatsApp(st)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="രക്ഷിതാവിന് വ്യക്തിഗത വാട്സ്ആപ്പ് സന്ദേശം അയക്കുക"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setParentModalStudent(st);
                                setParentScoresDraft(records[selectedRemainingGroup.classLevel]?.[st.id]?.parentScores || {});
                                setParentNameInput(st.fatherName || "");
                                setParentDeclarationAccepted(false);
                              }}
                              className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="രക്ഷിതാവിന്റെ മറുപടി ഇപ്പോൾ നേരിട്ട് രേഖപ്പെടുത്തുക"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>നേരിട്ട് എൻട്രി</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )
                  )}

                  {/* 2. USTHAD PENDING */}
                  {activeRemainingTab === "usthads" && (
                    selectedRemainingGroup.pendingUsthad.length === 0 ? (
                      <div className="p-8 text-center text-sm font-bold text-emerald-600">
                        🎉 ഉസ്താദ് ഈ ക്ലാസിലെ മുഴുവൻ കുട്ടികൾക്കും മാർക്ക് നൽകി കഴിഞ്ഞു!
                      </div>
                    ) : (
                      selectedRemainingGroup.pendingUsthad.map((st, i) => (
                        <div
                          key={`${st.id}-${i}`}
                          className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <div>
                              <div className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{st.name}</span>
                                {st.rollNumber && (
                                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 rounded font-mono">
                                    Roll #{st.rollNumber}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                അഡ്മിഷൻ: {st.admissionNumber || st.id}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClass(selectedRemainingGroup.classLevel);
                              setSearchQuery(st.name);
                              setActiveTab("usthad_entry");
                              setSelectedRemainingGroup(null);
                            }}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>ഇപ്പോൾ മാർക്ക് നൽകുക</span>
                          </button>
                        </div>
                      ))
                    )
                  )}

                  {/* 3. BOTH COMPLETED */}
                  {activeRemainingTab === "completed" && (
                    selectedRemainingGroup.bothCompleted.length === 0 ? (
                      <div className="p-8 text-center text-sm font-bold text-slate-400">
                        ഇതുവരെ ആരും രണ്ട് മൂല്യനിർണ്ണയങ്ങളും പൂർത്തിയാക്കിയിട്ടില്ല.
                      </div>
                    ) : (
                      selectedRemainingGroup.bothCompleted.map((st, i) => {
                        const rec = records[selectedRemainingGroup.classLevel]?.[st.id];
                        return (
                          <div
                              key={`${st.id}-${i}`}
                            className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                              isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
                                {i + 1}
                              </span>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white">{st.name}</span>
                                <div className="text-[10px] text-slate-400">Roll #{st.rollNumber || i + 1}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-black text-emerald-600">
                                {rec?.totalScore || 0} / {rec?.maxTotalScore || 100} pt
                              </span>
                              <div className="text-[10px] text-slate-400 font-mono">
                                ({rec?.percentage || 0}%)
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )
                  )}
                </div>

                {/* MODAL FOOTER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => generateGroupParentWhatsAppMessage(selectedRemainingGroup)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>ബാക്കി രക്ഷിതാക്കൾക്കുള്ള വാട്സ്ആപ്പ് സന്ദേശം കോപ്പി ചെയ്യുക</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRemainingGroup(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    ക്ലോസ്
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SETTINGS & CUSTOMIZABLE QUESTIONS ENGINE */}
      {/* ========================================================================= */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* DEADLINES & DATES SECTION */}
          <div className={`p-5 rounded-3xl border space-y-4 ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <h3 className={`font-black text-base flex items-center gap-2 ${
              isDark ? "text-teal-400" : "text-teal-700"
            }`}>
              <Settings className="w-5 h-5" />
              <span>മൂല്യനിർണ്ണയ ആവൃത്തി & സമയപരിധികൾ (Cycle & Deadlines)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* TITLE */}
              <div className="space-y-1">
                <label className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>സൈക്കിൾ പേര് / ടൈറ്റിൽ:</label>
                <input
                  type="text"
                  value={cycleTitle}
                  onChange={e => setCycleTitle(e.target.value)}
                  className={`w-full text-xs p-2.5 rounded-xl border ${
                    isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              </div>

              {/* FREQUENCY */}
              <div className="space-y-1">
                <label className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>ആവൃത്തി (Frequency):</label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value as any)}
                  className={`w-full text-xs p-2.5 rounded-xl border ${
                    isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                >
                  <option value="weekly">ആഴ്ചയിലൊരിക്കൽ (Weekly)</option>
                  <option value="biweekly">രണ്ടാഴ്ചയിലൊരിക്കൽ (Bi-Weekly)</option>
                  <option value="monthly">മാസത്തിലൊരിക്കൽ (Monthly)</option>
                  <option value="bimonthly">രണ്ട് മാസത്തിലൊരിക്കൽ (Bi-Monthly)</option>
                </select>
              </div>

              {/* PARENT DEADLINE */}
              <div className="space-y-1">
                <label className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>രക്ഷിതാക്കളുടെ അവസാന തീയതി:</label>
                <input
                  type="date"
                  value={parentDeadline}
                  onChange={e => setParentDeadline(e.target.value)}
                  className={`w-full text-xs p-2 rounded-xl border ${
                    isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              </div>

              {/* USTHAD DEADLINE */}
              <div className="space-y-1">
                <label className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>ഉസ്താദുമാരുടെ അവസാന തീയതി:</label>
                <input
                  type="date"
                  value={teacherDeadline}
                  onChange={e => setTeacherDeadline(e.target.value)}
                  className={`w-full text-xs p-2 rounded-xl border ${
                    isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              </div>
            </div>

            {/* WINDOW TOGGLES */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                <input
                  type="checkbox"
                  checked={isParentWindowOpen}
                  onChange={e => setIsParentWindowOpen(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 accent-teal-600 cursor-pointer"
                />
                <span>രക്ഷിതാക്കളുടെ എൻട്രി വിൻഡോ ഓപ്പൺ ആണ് (Parent Window Active)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                <input
                  type="checkbox"
                  checked={isTeacherWindowOpen}
                  onChange={e => setIsTeacherWindowOpen(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 accent-teal-600 cursor-pointer"
                />
                <span>ഉസ്താദുമാരുടെ എൻട്രി വിൻഡോ ഓപ്പൺ ആണ് (Teacher Window Active)</span>
              </label>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PARENT SIGN-IN SECURITY & PIN CONFIGURATION (TARBIYAH SUITE) */}
          {/* ========================================================================= */}
          <div className={`p-5 rounded-3xl border space-y-4 ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className={`font-black text-base flex items-center gap-2 ${
                  isDark ? "text-teal-400" : "text-teal-700"
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                  <span>രക്ഷിതാക്കളുടെ സൈൻ-ഇൻ & സുരക്ഷാ പരിശോധന (Parent Sign-In Security PIN)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  തർബിയ്യത്ത് സ്യൂട്ട് ആപ്പിൽ രക്ഷിതാക്കൾ സ്വന്തം കുട്ടിയുടെ മൂല്യനിർണ്ണയം നടത്താൻ സൈൻ-ഇൻ ചെയ്യുമ്പോൾ വേണ്ട സുരക്ഷാ സംവിധാനം.
                </p>
              </div>
              <label className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border cursor-pointer text-xs font-extrabold ${
                parentSecurityEnabled
                  ? isDark ? "bg-teal-950/60 border-teal-700 text-teal-300" : "bg-teal-50 border-teal-300 text-teal-900"
                  : isDark ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
              }`}>
                <input
                  type="checkbox"
                  checked={parentSecurityEnabled}
                  onChange={e => setParentSecurityEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 accent-teal-600 cursor-pointer"
                />
                <span>സെക്യൂരിറ്റി PIN പരിശോധന സജീവമാക്കുക (Enable Parent Security PIN)</span>
              </label>
            </div>

            {parentSecurityEnabled && (
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? "bg-teal-950/20 border-teal-800/60" : "bg-teal-50/70 border-teal-200"
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className={`text-xs font-black flex items-center gap-1.5 ${
                      isDark ? "text-teal-300" : "text-teal-950"
                    }`}>
                      <KeyRound className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>തർബിയ്യത്ത് സ്യൂട്ടിലെ രക്ഷിതാക്കളുടെ സൈൻ-ഇൻ സെക്യൂരിറ്റി PIN ആയി എന്താണ് വേണ്ടത്? (Choose Parent Sign-In PIN):</span>
                    </h5>
                    <p className={`text-[11px] mt-0.5 ${
                      isDark ? "text-slate-400" : "text-teal-800"
                    }`}>
                      മുമ്പ് സമസ്ത CSV വഴിയോ മദ്റസ ആപ്പിലോ ചേർത്ത വിദ്യാർത്ഥികളുടെ ഡാറ്റയിൽ നിന്ന് ഈ PIN സ്വയം പ്രവർത്തിക്കും. വീണ്ടും CSV ഫയലോ ഡാറ്റയോ അപ്‌ലോഡ് ചെയ്യേണ്ടതില്ല.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {[
                    {
                      id: "aadhaar_last4" as StudentPinSourceType,
                      title: "ആധാർ അവസാന 4 അക്കം",
                      sub: "Aadhaar Last 4 Digits",
                      desc: "ഉദാ: 8912 (ആധാറിന്റെ അവസാന 4 അക്കം)"
                    },
                    {
                      id: "aadhaar_last6" as StudentPinSourceType,
                      title: "ആധാർ അവസാന 6 അക്കം",
                      sub: "Aadhaar Last 6 Digits",
                      desc: "ഉദാ: 678912 (ആധാറിന്റെ അവസാന 6 അക്കം)"
                    },
                    {
                      id: "dob" as StudentPinSourceType,
                      title: "ജനനത്തീയതി (DOB)",
                      sub: "Date of Birth",
                      desc: "കുട്ടിയുടെ ജനനത്തീയതി പിൻ ആയി ഉപയോഗിക്കുന്നു"
                    },
                    {
                      id: "adm_no" as StudentPinSourceType,
                      title: "അഡ്മിഷൻ നമ്പർ",
                      sub: "Admission Number",
                      desc: "കുട്ടിയുടെ അഡ്മിഷൻ നമ്പർ പിൻ ആയി ഉപയോഗിക്കുന്നു"
                    },
                    {
                      id: "custom_pin" as StudentPinSourceType,
                      title: "കസ്റ്റം PIN (Custom PIN)",
                      sub: "Individual Custom PIN",
                      desc: "ഓരോ കുട്ടിക്കും പ്രത്യേകമായി നിശ്ചയിക്കുന്ന PIN"
                    }
                  ].map(opt => {
                    const isSelected = parentPinSource === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          setParentPinSource(opt.id);
                          if (opt.id === "custom_pin") setShowTarbiyahCustomPinManager(true);
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? isDark
                              ? "bg-teal-900/50 border-teal-400 text-white shadow-sm"
                              : "bg-white border-teal-600 text-teal-950 shadow-sm ring-2 ring-teal-500/20"
                            : isDark
                              ? "bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700"
                              : "bg-white/70 border-slate-200 text-slate-700 hover:bg-white"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-black text-xs">{opt.title}</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? "border-teal-600 bg-teal-600 text-white" : "border-slate-400"
                            }`}>
                              {isSelected && <CheckCircle2 className="w-3 h-3" />}
                            </div>
                          </div>
                          <div className="text-[10px] font-bold text-teal-600 mt-0.5">{opt.sub}</div>
                        </div>
                        <p className="text-[10px] opacity-75 mt-1.5 leading-snug">{opt.desc}</p>
                      </div>
                    );
                  })}
                </div>

                {/* MISSING DATA FALLBACK & CUSTOM PIN MANAGER */}
                <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                  isDark ? "bg-slate-900/80 border-slate-800 text-slate-300" : "bg-white border-teal-200 text-slate-700"
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1 text-[11px]">
                      <div className="font-black text-teal-700 dark:text-teal-300">
                        💡 ആധാർ നമ്പറോ ജനനത്തീയതിയോ ഇല്ലാത്ത കുട്ടികൾക്കുള്ള ഫാൾബാക്ക് (Automatic Fallback Rule):
                      </div>
                      <p className="leading-relaxed opacity-90">
                        തിരഞ്ഞെടുത്ത വിവരം (ഉദാഹരണത്തിന് <b>ആധാർ നമ്പർ</b> അല്ലെങ്കിൽ <b>DOB</b>) ഏതെങ്കിലും കുട്ടിയുടെ ഡാറ്റയിൽ ഇല്ലെങ്കിൽ, ആ കുട്ടിക്ക് <b>കസ്റ്റം PIN</b> നൽകിയിട്ടുണ്ടെങ്കിൽ അതും, അല്ലെങ്കിൽ <b>അഡ്മിഷൻ നമ്പർ (Admission No) / റോൾ നമ്പർ</b> ഓട്ടോമാറ്റിക് ഫാൾബാക്ക് PIN ആയും പ്രവർത്തിക്കും.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTarbiyahCustomPinManager(prev => !prev)}
                      className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black transition cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{showTarbiyahCustomPinManager ? "കസ്റ്റം PIN പട്ടിക മറയ്ക്കുക" : "ഓരോ കുട്ടിക്കും കസ്റ്റം PIN നൽകുക"}</span>
                    </button>
                  </div>

                  {showTarbiyahCustomPinManager && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-teal-800 dark:text-teal-300">
                          ക്ലാസ് തിരിച്ച് ഓരോ കുട്ടിക്കും കസ്റ്റം PIN നൽകാം ({selectedClass}):
                        </span>
                        <select
                          value={selectedClass}
                          onChange={e => setSelectedClass(e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                            isDark ? "bg-slate-950 border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                          }`}
                        >
                          {availableClasses.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>
                      <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className={isDark ? "bg-slate-950 text-slate-400" : "bg-slate-100 text-slate-600"}>
                              <th className="p-2 font-black">Adm/Roll</th>
                              <th className="p-2 font-black">പേര് (Name)</th>
                              <th className="p-2 font-black">ആധാർ / DOB</th>
                              <th className="p-2 font-black">കസ്റ്റം PIN (Custom PIN)</th>
                              <th className="p-2 font-black">നിലവിലെ PIN (Active PIN)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {getStudentsForClass(selectedClass).map((st, idx) => {
                              const info = getEffectiveStudentPinInfo(st, parentPinSource);
                              return (
                                <tr key={`${st.id}-${idx}`}>
                                  <td className="p-2 font-mono font-bold">{st.admissionNumber || st.rollNumber || "-"}</td>
                                  <td className="p-2 font-bold">{st.name}</td>
                                  <td className="p-2 text-[11px] font-mono">
                                    {st.aadhaar ? `Aadhaar: ...${st.aadhaar.slice(-4)}` : <span className="text-amber-600 font-bold">No Aadhaar</span>}
                                    {" | "}
                                    {st.dob ? formatDobReadable(st.dob) : <span className="text-amber-600 font-bold">No DOB</span>}
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={st.customPin || ""}
                                      onChange={e => {
                                        const val = e.target.value.trim();
                                        const nextList = internalStudents.map(item =>
                                          item.id === st.id
                                            ? { ...item, customPin: val, accessPin: val || deriveStudentPin({ ...item, customPin: "" }, parentPinSource) }
                                            : item
                                        );
                                        setInternalStudents(nextList);
                                        if (onUpdateWorkspaceStudents) onUpdateWorkspaceStudents(nextList);
                                        try {
                                          localStorage.setItem("madrasa_students_v2", JSON.stringify(nextList));
                                        } catch {}
                                      }}
                                      placeholder="കസ്റ്റം PIN..."
                                      className={`w-28 px-2 py-1 rounded-lg border text-xs font-mono font-bold ${
                                        isDark ? "bg-slate-950 border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                                      }`}
                                    />
                                  </td>
                                  <td className="p-2">
                                    <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-300 font-mono font-black">
                                      {info.pin || "-"}
                                    </span>
                                    {info.isFallback && (
                                      <span className="ml-1.5 text-[10px] font-bold text-amber-600">
                                        (Fallback: {info.fallbackReasonMalayalam})
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* CUSTOMIZABLE QUESTIONS ENGINE: SEPARATE HEADS FOR PARENT & USTHAD */}
          {/* ========================================================================= */}
          <div className={`p-5 rounded-3xl border space-y-5 ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className={`font-black text-base flex items-center gap-2 ${
                  isDark ? "text-teal-400" : "text-teal-700"
                }`}>
                  <SlidersHorizontal className="w-5 h-5" />
                  <span>ചോദ്യങ്ങളുടെ എൻജിൻ (Customizable Evaluation Engine)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ഓരോ ചോദ്യത്തിനും പരമാവധി പോയിന്റുകൾ (Max Points) ക്രമീകരിക്കാം. ചോദ്യങ്ങളെ രക്ഷിതാക്കൾക്കും ഉസ്താദുമാർക്കും പ്രത്യേക ഹെഡുകളായി തിരിച്ചു നൽകിയിരിക്കുന്നു.
                </p>
              </div>

              {/* HEAD SELECTOR TABS */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSettingsActiveHead("both")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    settingsActiveHead === "both"
                      ? "bg-teal-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  എല്ലാം ({questions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsActiveHead("parents")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                    settingsActiveHead === "parents"
                      ? "bg-purple-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>👨‍👩‍👧 രക്ഷിതാക്കൾ</span>
                  <span className="text-[10px] opacity-80">({questions.filter(q => q.target === "parent").length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsActiveHead("teachers")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                    settingsActiveHead === "teachers"
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>👳‍♂️ ഉസ്താദുമാർ</span>
                  <span className="text-[10px] opacity-80">({questions.filter(q => q.target === "teacher").length})</span>
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* HEAD 1: PARENT QUESTIONS SECTION */}
            {/* ------------------------------------------------------------- */}
            {(settingsActiveHead === "both" || settingsActiveHead === "parents") && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-200 dark:border-purple-900/50">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 rounded-xl text-xs font-black">
                      HEAD 1
                    </span>
                    <h4 className="font-black text-sm text-purple-800 dark:text-purple-300">
                      👨‍👩‍👧 രക്ഷിതാക്കൾക്കുള്ള ചോദ്യങ്ങൾ (Parent Evaluation Head)
                    </h4>
                    <span className="text-xs text-slate-500">
                      (ആകെ {questions.filter(q => q.target === "parent" && q.enabled).reduce((acc, q) => acc + (q.maxPoints || 5), 0)} പോയിന്റ്)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newQ: TarbiyahQuestion = {
                        id: `p_custom_${Date.now()}`,
                        title: "Custom Parent Question",
                        titleMl: "പുതിയ രക്ഷിതാവ് ചോദ്യം",
                        descriptionMl: "വിവരണം ഇവിടെ രേഖപ്പെടുത്തുക",
                        target: "parent",
                        answerType: "stars",
                        maxPoints: 5,
                        order: questions.length + 1,
                        enabled: true,
                      };
                      setQuestions([...questions, newQ]);
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ രക്ഷിതാക്കൾക്ക് പുതിയ ചോദ്യം</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {questions.filter(q => q.target === "parent").map((q) => {
                    const qIndex = questions.findIndex(item => item.id === q.id);
                    const isMcqOpen = editingMcqQuestionId === q.id;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-2xl border space-y-3 transition ${
                          q.enabled
                            ? isDark ? "bg-slate-950/70 border-slate-800" : "bg-purple-50/20 border-slate-200"
                            : "opacity-60 bg-slate-100 dark:bg-slate-900 border-dashed border-slate-300"
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                          {/* INDEX & TITLE */}
                          <div className="md:col-span-5 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-400">#{qIndex + 1}</span>
                              <input
                                type="text"
                                value={q.titleMl}
                                onChange={e => {
                                  const updated = [...questions];
                                  updated[qIndex].titleMl = e.target.value;
                                  setQuestions(updated);
                                }}
                                placeholder="ചോദ്യം (മലയാളം)"
                                className={`w-full font-bold text-xs p-2 rounded-xl border ${
                                  isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                                }`}
                              />
                            </div>
                            <input
                              type="text"
                              value={q.descriptionMl || ""}
                              onChange={e => {
                                const updated = [...questions];
                                updated[qIndex].descriptionMl = e.target.value;
                                setQuestions(updated);
                              }}
                              placeholder="ചോദ്യത്തിനുള്ള സൂചന / വിവരണം (ഓപ്ഷണൽ)"
                              className={`w-full text-[11px] px-2 py-1 rounded-lg border ${
                                isDark ? "bg-slate-900/60 border-slate-800 text-slate-300" : "bg-white/80 border-slate-200 text-slate-600"
                              }`}
                            />
                          </div>

                          {/* ANSWER TYPE */}
                          <div className="md:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400">ഉത്തര ശൈലി (UI Style):</label>
                            <select
                              value={q.answerType}
                              onChange={e => {
                                const updated = [...questions];
                                const newType = e.target.value as TarbiyahAnswerType;
                                updated[qIndex].answerType = newType;
                                if (newType === "stars" && !updated[qIndex].maxPoints) updated[qIndex].maxPoints = 5;
                                if (newType === "slider" && !updated[qIndex].maxPoints) updated[qIndex].maxPoints = 10;
                                if (newType === "mcq_points" && (!updated[qIndex].options || updated[qIndex].options?.length === 0)) {
                                  updated[qIndex].options = [
                                    { label: "Option 1", labelMl: "5 വഖ്ത് പൂർണ്ണം", points: 5 },
                                    { label: "Option 2", labelMl: "3-4 വഖ്ത്", points: 3 },
                                    { label: "Option 3", labelMl: "1-2 വഖ്ത്", points: 1 },
                                    { label: "Option 4", labelMl: "നിസ്കരിച്ചില്ല", points: 0 },
                                  ];
                                  updated[qIndex].maxPoints = 5;
                                }
                                setQuestions(updated);
                              }}
                              className={`w-full text-xs p-2 rounded-xl border ${
                                isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                              }`}
                            >
                              <option value="stars">⭐ സ്റ്റാർ റേറ്റിംഗ് (Stars Rating)</option>
                              <option value="mcq_points">🔘 മൾട്ടിപ്പിൾ ചോയ്സ് ഓപ്ഷനുകൾ (MCQ)</option>
                              <option value="slider">🎚️ ലൈവ് ഇമോജി സ്ലൈഡർ (Live Slider)</option>
                              <option value="yes_no">🟢 പൂർണ്ണം / ഭാഗികം / ഇല്ല (Yes-No Pills)</option>
                              <option value="grade_pills">🏷️ ഗ്രേഡ് ചിപ്സ് (A+, A, B, C, D)</option>
                              <option value="numeric">🔢 ഡയറക്റ്റ് മാർക്ക് ഇൻപുട്ട് (Direct Points)</option>
                            </select>
                          </div>

                          {/* MAX POINTS (CUSTOMIZABLE) */}
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400">മാക്സിമം പോയിന്റ്:</label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={q.maxPoints || 5}
                                onChange={e => {
                                  const updated = [...questions];
                                  updated[qIndex].maxPoints = Math.max(1, parseInt(e.target.value) || 1);
                                  setQuestions(updated);
                                }}
                                className={`w-full font-mono font-black text-center text-xs p-2 rounded-xl border ${
                                  isDark ? "bg-slate-900 border-slate-800 text-teal-400" : "bg-white border-slate-200 text-teal-700"
                                }`}
                              />
                              <span className="text-[10px] text-slate-400">pt</span>
                            </div>
                          </div>

                          {/* TOGGLES & ACTIONS */}
                          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2 md:pt-0">
                            {q.answerType === "mcq_points" && (
                              <button
                                type="button"
                                onClick={() => setEditingMcqQuestionId(isMcqOpen ? null : q.id)}
                                className={`p-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                  isMcqOpen
                                    ? "bg-purple-600 text-white border-purple-500"
                                    : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200"
                                }`}
                                title="MCQ ഓപ്ഷനുകൾ എഡിറ്റ് ചെയ്യുക"
                              >
                                {isMcqOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}

                            <label className="flex items-center gap-1 text-[11px] font-bold text-slate-500 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={q.enabled}
                                onChange={e => {
                                  const updated = [...questions];
                                  updated[qIndex].enabled = e.target.checked;
                                  setQuestions(updated);
                                }}
                                className="w-4 h-4 rounded text-teal-600 accent-teal-600 cursor-pointer"
                              />
                              <span>ആക്ടീവ്</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`"${q.titleMl}" എന്ന ചോദ്യം ഒഴിവാക്കണമെന്നുറപ്പാണോ?`)) {
                                  setQuestions(questions.filter(item => item.id !== q.id));
                                }
                              }}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                              title="ഡിലീറ്റ്"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* MCQ OPTIONS BUILDER ACCORDION */}
                        {q.answerType === "mcq_points" && isMcqOpen && (
                          <div className="p-3.5 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-black text-purple-900 dark:text-purple-300">
                              <span>🔘 MCQ ഓപ്ഷനുകളും നൽകേണ്ട പോയിന്റുകളും:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...questions];
                                  const currentOpts = updated[qIndex].options || [];
                                  updated[qIndex].options = [
                                    ...currentOpts,
                                    { label: `Option ${currentOpts.length + 1}`, labelMl: `ഓപ്ഷൻ ${currentOpts.length + 1}`, points: 0 }
                                  ];
                                  setQuestions(updated);
                                }}
                                className="text-[11px] px-2 py-0.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition cursor-pointer"
                              >
                                + ചോയ്സ് ചേർക്കുക
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(q.options || []).map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                                  <input
                                    type="text"
                                    value={opt.labelMl}
                                    onChange={e => {
                                      const updated = [...questions];
                                      if (updated[qIndex].options) {
                                        updated[qIndex].options![oIdx].labelMl = e.target.value;
                                        setQuestions(updated);
                                      }
                                    }}
                                    placeholder="ഓപ്ഷൻ പേര്"
                                    className="flex-1 text-xs p-1 bg-transparent border-0 outline-hidden font-medium"
                                  />
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={opt.points}
                                    onChange={e => {
                                      const updated = [...questions];
                                      if (updated[qIndex].options) {
                                        updated[qIndex].options![oIdx].points = parseInt(e.target.value) || 0;
                                        // Auto update maxPoints if this is higher
                                        const maxPts = Math.max(...updated[qIndex].options!.map(o => o.points));
                                        updated[qIndex].maxPoints = maxPts;
                                        setQuestions(updated);
                                      }
                                    }}
                                    className="w-14 text-center font-mono font-bold text-xs p-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                                  />
                                  <span className="text-[10px] text-slate-400">pt</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...questions];
                                      if (updated[qIndex].options) {
                                        updated[qIndex].options = updated[qIndex].options!.filter((_, i) => i !== oIdx);
                                        setQuestions(updated);
                                      }
                                    }}
                                    className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* HEAD 2: TEACHER / USTHAD QUESTIONS SECTION */}
            {/* ------------------------------------------------------------- */}
            {(settingsActiveHead === "both" || settingsActiveHead === "teachers") && (
              <div className="space-y-3 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200 dark:border-amber-900/50">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-black">
                      HEAD 2
                    </span>
                    <h4 className="font-black text-sm text-amber-800 dark:text-amber-300">
                      👳‍♂️ ക്ലാസ് ഉസ്താദുമാർക്കുള്ള ചോദ്യങ്ങൾ (Usthad Evaluation Head)
                    </h4>
                    <span className="text-xs text-slate-500">
                      (ആകെ {questions.filter(q => q.target === "teacher" && q.enabled).reduce((acc, q) => acc + (q.maxPoints || 5), 0)} പോയിന്റ്)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newQ: TarbiyahQuestion = {
                        id: `u_custom_${Date.now()}`,
                        title: "Custom Usthad Question",
                        titleMl: "പുതിയ ഉസ്താദ് ചോദ്യം",
                        descriptionMl: "വിവരണം ഇവിടെ രേഖപ്പെടുത്തുക",
                        target: "teacher",
                        answerType: "stars",
                        maxPoints: 5,
                        order: questions.length + 1,
                        enabled: true,
                      };
                      setQuestions([...questions, newQ]);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ ഉസ്താദുമാർക്ക് പുതിയ ചോദ്യം</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {questions.filter(q => q.target === "teacher").map((q) => {
                    const qIndex = questions.findIndex(item => item.id === q.id);
                    const isMcqOpen = editingMcqQuestionId === q.id;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-2xl border space-y-3 transition ${
                          q.enabled
                            ? isDark ? "bg-slate-950/70 border-slate-800" : "bg-amber-50/20 border-slate-200"
                            : "opacity-60 bg-slate-100 dark:bg-slate-900 border-dashed border-slate-300"
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                          {/* INDEX & TITLE */}
                          <div className="md:col-span-5 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-400">#{qIndex + 1}</span>
                              <input
                                type="text"
                                value={q.titleMl}
                                onChange={e => {
                                  const updated = [...questions];
                                  updated[qIndex].titleMl = e.target.value;
                                  setQuestions(updated);
                                }}
                                placeholder="ചോദ്യം (മലയാളം)"
                                className={`w-full font-bold text-xs p-2 rounded-xl border ${
                                  isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                                }`}
                              />
                            </div>
                            <input
                              type="text"
                              value={q.descriptionMl || ""}
                              onChange={e => {
                                const updated = [...questions];
                                updated[qIndex].descriptionMl = e.target.value;
                                setQuestions(updated);
                              }}
                              placeholder="ചോദ്യത്തിനുള്ള സൂചന / വിവരണം (ഓപ്ഷണൽ)"
                              className={`w-full text-[11px] px-2 py-1 rounded-lg border ${
                                isDark ? "bg-slate-900/60 border-slate-800 text-slate-300" : "bg-white/80 border-slate-200 text-slate-600"
                              }`}
                            />
                          </div>

                          {/* ANSWER TYPE */}
                          <div className="md:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400">ഉത്തര ശൈലി (UI Style):</label>
                            <select
                              value={q.answerType}
                              onChange={e => {
                                const updated = [...questions];
                                const newType = e.target.value as TarbiyahAnswerType;
                                updated[qIndex].answerType = newType;
                                if (newType === "stars" && !updated[qIndex].maxPoints) updated[qIndex].maxPoints = 5;
                                if (newType === "slider" && !updated[qIndex].maxPoints) updated[qIndex].maxPoints = 10;
                                if (newType === "mcq_points" && (!updated[qIndex].options || updated[qIndex].options?.length === 0)) {
                                  updated[qIndex].options = [
                                    { label: "Excellent", labelMl: "അത്യുത്തമം", points: 5 },
                                    { label: "Good", labelMl: "നല്ലത്", points: 4 },
                                    { label: "Average", labelMl: "ശരാശരി", points: 2 },
                                    { label: "Poor", labelMl: "ശ്രദ്ധിക്കണം", points: 0 },
                                  ];
                                  updated[qIndex].maxPoints = 5;
                                }
                                setQuestions(updated);
                              }}
                              className={`w-full text-xs p-2 rounded-xl border ${
                                isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                              }`}
                            >
                              <option value="stars">⭐ സ്റ്റാർ റേറ്റിംഗ് (Stars Rating)</option>
                              <option value="mcq_points">🔘 മൾട്ടിപ്പിൾ ചോയ്സ് ഓപ്ഷനുകൾ (MCQ)</option>
                              <option value="slider">🎚️ ലൈവ് ഇമോജി സ്ലൈഡർ (Live Slider)</option>
                              <option value="yes_no">🟢 പൂർണ്ണം / ഭാഗികം / ഇല്ല (Yes-No Pills)</option>
                              <option value="grade_pills">🏷️ ഗ്രേഡ് ചിപ്സ് (A+, A, B, C, D)</option>
                              <option value="numeric">🔢 ഡയറക്റ്റ് മാർക്ക് ഇൻപുട്ട് (Direct Points)</option>
                            </select>
                          </div>

                          {/* MAX POINTS (CUSTOMIZABLE) */}
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400">മാക്സിമം പോയിന്റ്:</label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={q.maxPoints || 5}
                                onChange={e => {
                                  const updated = [...questions];
                                  updated[qIndex].maxPoints = Math.max(1, parseInt(e.target.value) || 1);
                                  setQuestions(updated);
                                }}
                                className={`w-full font-mono font-black text-center text-xs p-2 rounded-xl border ${
                                  isDark ? "bg-slate-900 border-slate-800 text-amber-400" : "bg-white border-slate-200 text-amber-700"
                                }`}
                              />
                              <span className="text-[10px] text-slate-400">pt</span>
                            </div>
                          </div>

                          {/* TOGGLES & ACTIONS */}
                          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2 md:pt-0">
                            {q.answerType === "mcq_points" && (
                              <button
                                type="button"
                                onClick={() => setEditingMcqQuestionId(isMcqOpen ? null : q.id)}
                                className={`p-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                  isMcqOpen
                                    ? "bg-amber-600 text-white border-amber-500"
                                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200"
                                }`}
                                title="MCQ ഓപ്ഷനുകൾ എഡിറ്റ് ചെയ്യുക"
                              >
                                {isMcqOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}

                            <label className="flex items-center gap-1 text-[11px] font-bold text-slate-500 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={q.enabled}
                                onChange={e => {
                                  const updated = [...questions];
                                  updated[qIndex].enabled = e.target.checked;
                                  setQuestions(updated);
                                }}
                                className="w-4 h-4 rounded text-teal-600 accent-teal-600 cursor-pointer"
                              />
                              <span>ആക്ടീവ്</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`"${q.titleMl}" എന്ന ചോദ്യം ഒഴിവാക്കണമെന്നുറപ്പാണോ?`)) {
                                  setQuestions(questions.filter(item => item.id !== q.id));
                                }
                              }}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                              title="ഡിലീറ്റ്"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* MCQ OPTIONS BUILDER ACCORDION */}
                        {q.answerType === "mcq_points" && isMcqOpen && (
                          <div className="p-3.5 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-black text-amber-900 dark:text-amber-300">
                              <span>🔘 MCQ ഓപ്ഷനുകളും നൽകേണ്ട പോയിന്റുകളും:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...questions];
                                  const currentOpts = updated[qIndex].options || [];
                                  updated[qIndex].options = [
                                    ...currentOpts,
                                    { label: `Option ${currentOpts.length + 1}`, labelMl: `ഓപ്ഷൻ ${currentOpts.length + 1}`, points: 0 }
                                  ];
                                  setQuestions(updated);
                                }}
                                className="text-[11px] px-2 py-0.5 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition cursor-pointer"
                              >
                                + ചോയ്സ് ചേർക്കുക
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(q.options || []).map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                                  <input
                                    type="text"
                                    value={opt.labelMl}
                                    onChange={e => {
                                      const updated = [...questions];
                                      if (updated[qIndex].options) {
                                        updated[qIndex].options![oIdx].labelMl = e.target.value;
                                        setQuestions(updated);
                                      }
                                    }}
                                    placeholder="ഓപ്ഷൻ പേര്"
                                    className="flex-1 text-xs p-1 bg-transparent border-0 outline-hidden font-medium"
                                  />
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={opt.points}
                                    onChange={e => {
                                      const updated = [...questions];
                                      if (updated[qIndex].options) {
                                        updated[qIndex].options![oIdx].points = parseInt(e.target.value) || 0;
                                        // Auto update maxPoints if this is higher
                                        const maxPts = Math.max(...updated[qIndex].options!.map(o => o.points));
                                        updated[qIndex].maxPoints = maxPts;
                                        setQuestions(updated);
                                      }
                                    }}
                                    className="w-14 text-center font-mono font-bold text-xs p-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                                  />
                                  <span className="text-[10px] text-slate-400">pt</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...questions];
                                      if (updated[qIndex].options) {
                                        updated[qIndex].options = updated[qIndex].options!.filter((_, i) => i !== oIdx);
                                        setQuestions(updated);
                                      }
                                    }}
                                    className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PARENT QUICK EVALUATION MODAL */}
      {/* ========================================================================= */}
      {parentModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className={`border rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 ${
            isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? "border-slate-800" : "border-slate-100"
            }`}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">രക്ഷിതാവിന്റെ വിലയിരുത്തൽ</span>
                <h3 className={`font-black text-base ${isDark ? "text-white" : "text-slate-900"}`}>
                  {parentModalStudent.name} ({parentModalStudent.classLevel})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setParentModalStudent(null)}
                className={`p-1 text-slate-400 ${isDark ? "hover:text-white" : "hover:text-slate-700"}`}
              >
                ✕
              </button>
            </div>

            {/* PARENT QUESTIONS LIST */}
            <div className="max-h-[60vh] overflow-y-auto space-y-3.5 pr-1">
              {questions.filter(q => q.target === "parent" && q.enabled).map(q => {
                const currentVal = parentScoresDraft[q.id] || 0;
                return (
                  <div key={q.id} className={`p-3 rounded-2xl border space-y-1.5 ${
                    isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-xs ${isDark ? "text-white" : "text-slate-900"}`}>{q.titleMl}</span>
                      <span className="text-[10px] font-mono font-bold text-teal-600">{currentVal}/{q.maxPoints} pt</span>
                    </div>
                    {q.descriptionMl && (
                      <p className="text-[11px] text-slate-500">{q.descriptionMl}</p>
                    )}

                    {renderQuestionInputWidget(
                      q,
                      currentVal,
                      (val) => setParentScoresDraft(prev => ({ ...prev, [q.id]: val })),
                      isDark
                    )}
                  </div>
                );
              })}
            </div>

            {/* MANDATORY PARENT DECLARATION AS REQUESTED */}
            <div className={`p-3.5 rounded-2xl border space-y-2 ${
              isDark ? "bg-teal-950/60 border-teal-800/80" : "bg-teal-50 border-teal-200"
            }`}>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={parentDeclarationAccepted}
                  onChange={e => setParentDeclarationAccepted(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-teal-600 accent-teal-600 cursor-pointer shrink-0"
                />
                <span className={`text-xs font-bold leading-relaxed ${
                  isDark ? "text-teal-200" : "text-teal-950"
                }`}>
                  "ഞാൻ കുട്ടിയുടെ രക്ഷിതാവാണ്. ഞാൻ മാർക്ക് നൽകുന്നത് എന്റെ സത്യസന്ധമായ വിലയിരുത്തലിന് ശേഷം മാത്രമാണെന്ന് സാക്ഷ്യപ്പെടുത്തുന്നു."
                </span>
              </label>
            </div>

            {/* SUBMIT BUTTONS */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setParentModalStudent(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                ക്ലോസ്
              </button>
              <button
                type="button"
                onClick={handleSaveParentSubmission}
                disabled={!parentDeclarationAccepted}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-black rounded-xl text-xs transition shadow-md cursor-pointer"
              >
                സേവ് ചെയ്യുക
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE FLOATING SAVE ACTION */}
      <div className="md:hidden fixed bottom-16 right-4 z-40">
        <button
          type="button"
          onClick={handleSaveToCloud}
          disabled={isSaving}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white font-black text-xs rounded-full shadow-2xl flex items-center gap-2 border border-teal-400/40 cursor-pointer disabled:opacity-50"
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
          onClick={() => setActiveTab("usthad_entry")}
          className={`flex-1 py-1 px-1 flex flex-col items-center gap-0.5 rounded-xl transition cursor-pointer ${
            activeTab === "usthad_entry" ? "text-teal-600 font-black bg-teal-50 dark:bg-teal-950/50" : ""
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span className="text-[10px]">ഉസ്താദ്</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("teacher_effort")}
          className={`flex-1 py-1 px-1 flex flex-col items-center gap-0.5 rounded-xl transition cursor-pointer ${
            activeTab === "teacher_effort" ? "text-teal-600 font-black bg-teal-50 dark:bg-teal-950/50" : ""
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-[10px]">ചാർട്ട്</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rank_list")}
          className={`flex-1 py-1 px-1 flex flex-col items-center gap-0.5 rounded-xl transition cursor-pointer ${
            activeTab === "rank_list" ? "text-teal-600 font-black bg-teal-50 dark:bg-teal-950/50" : ""
          }`}
        >
          <Award className="w-4 h-4" />
          <span className="text-[10px]">റാങ്ക്</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reminders")}
          className={`flex-1 py-1 px-1 flex flex-col items-center gap-0.5 rounded-xl transition cursor-pointer ${
            activeTab === "reminders" ? "text-teal-600 font-black bg-teal-50 dark:bg-teal-950/50" : ""
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="text-[10px]">ബാക്കി</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-1 px-1 flex flex-col items-center gap-0.5 rounded-xl transition cursor-pointer ${
            activeTab === "settings" ? "text-teal-600 font-black bg-teal-50 dark:bg-teal-950/50" : ""
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="text-[10px]">സെറ്റിംഗ്സ്</span>
        </button>
      </div>

      {/* SAMASTHA CSV IMPORT MODAL */}
      <SamasthaCsvImporterModal
        isOpen={isSamasthaModalOpen}
        onClose={() => setIsSamasthaModalOpen(false)}
        isDark={isDark}
        defaultClass={selectedClass}
        existingStudents={workspaceStudents}
        existingStudentsCount={workspaceStudents?.length || 0}
        onImportStudents={handleImportFromSamastha}
      />

    </div>
  );
}
