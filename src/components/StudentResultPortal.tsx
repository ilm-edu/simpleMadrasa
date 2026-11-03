import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  PhoneCall, 
  MessageCircle, 
  Printer, 
  Award, 
  ArrowLeft, 
  GraduationCap, 
  Calendar, 
  Building2, 
  Layers, 
  Share2,
  Lock,
  Unlock,
  Sparkles,
  ExternalLink,
  Clock,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  Sun,
  Moon
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  StudentResultEntry,
  MadrasaExamResult,
  PublicAccessSecurity,
  deriveStudentPin,
  verifyStudentPin,
  getEffectiveStudentPinInfo,
  doesDobMatch,
  formatDobReadable,
  toDobDateInputValue
} from "../types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getLocalMadrasaResults } from "./ResultManager";
import { evaluateSubjectScore, getSubjectMarkRules, calculateStudentOverallResult, OFFICIAL_BOARD_GRADE_RULES } from "../utils/resultUtils";

interface StudentResultPortalProps {
  onBackToApp?: () => void;
  defaultMadrasaId?: string;
  isPublicPortal?: boolean;
  isAdminPreview?: boolean;
}

// Trigger celebratory phone vibration & colorful paper confetti
export const triggerCelebration = () => {
  // 1. Phone Vibration (haptic feedback)
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([120, 80, 200, 80, 400]);
    } catch (e) {}
  }

  // 2. Confetti Cannon from left & right sides
  try {
    confetti({
      particleCount: 75,
      angle: 60,
      spread: 70,
      origin: { x: 0.05, y: 0.65 },
      colors: ['#10b981', '#f59e0b', '#6366f1', '#ec4899', '#3b82f6', '#14b8a6']
    });
    confetti({
      particleCount: 75,
      angle: 120,
      spread: 70,
      origin: { x: 0.95, y: 0.65 },
      colors: ['#10b981', '#f59e0b', '#6366f1', '#ec4899', '#3b82f6', '#14b8a6']
    });

    // Center celebratory shower after brief delay
    setTimeout(() => {
      confetti({
        particleCount: 90,
        spread: 100,
        origin: { y: 0.45 },
        colors: ['#10b981', '#f59e0b', '#6366f1', '#ec4899', '#3b82f6', '#14b8a6']
      });
    }, 200);
  } catch (e) {}
};

function getRandomCaptcha(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function StudentResultPortal({ 
  onBackToApp, 
  defaultMadrasaId,
  isPublicPortal = false,
  isAdminPreview = false
}: StudentResultPortalProps) {
  // Read madrasa and timetable from URL search params if present: ?madrasa=xxx&timetable=yyy
  const urlParams = new URLSearchParams(window.location.search);
  const paramMadrasa = urlParams.get("madrasa") || defaultMadrasaId || "demo_madrasa";
  const paramTimetable = urlParams.get("timetable") || "";

  const [madrasaId, setMadrasaId] = useState<string>(paramMadrasa);
  const [timetableId, setTimetableId] = useState<string>(paramTimetable);
  const [resultData, setResultData] = useState<MadrasaExamResult>(() => getLocalMadrasaResults(paramMadrasa, paramTimetable));
  const [isLoading, setIsLoading] = useState(false);

  // Portal Theme: strictly light mode as requested
  const isDark = false;

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [studentSearch, setStudentSearch] = useState<string>("");

  // Result display & loading transition states
  const [displayedStudentId, setDisplayedStudentId] = useState<string | null>(null);
  const [isResultLoading, setIsResultLoading] = useState<boolean>(false);

  // Countdown & Scheduling State
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [bypassCountdown, setBypassCountdown] = useState<boolean>(false);

  // Security & Captcha State
  const [enteredPassword, setEnteredPassword] = useState<string>("");
  const [enteredDob, setEnteredDob] = useState<string>("");
  const [captchaCode, setCaptchaCode] = useState<string>(() => getRandomCaptcha());
  const [enteredCaptcha, setEnteredCaptcha] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticatedStudentId, setAuthenticatedStudentId] = useState<string | null>(null);

  // Intercept browser back button when in public mode to protect admin software
  useEffect(() => {
    const isPublic = isPublicPortal || window.location.search.includes("view=result") || window.location.search.includes("portal=result");
    if (!isPublic) return;

    window.history.pushState({ portal: true }, "", window.location.href);

    const handlePopState = () => {
      // If result sheet is currently open, close it back to selection form
      if (displayedStudentId) {
        setDisplayedStudentId(null);
        setSelectedStudentId("");
        window.history.pushState({ portal: true }, "", window.location.href);
      } else {
        // Keep them safely on the public portal
        window.history.pushState({ portal: true }, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isPublicPortal, displayedStudentId]);

  // Update current time every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch from Session Cache -> Server Cache (0 Firestore reads) -> Firestore fallback
  useEffect(() => {
    async function loadRemoteResult() {
      setIsLoading(true);
      const cacheKey = timetableId ? `result_cache_${madrasaId}_${timetableId}` : `result_cache_${madrasaId}`;
      const apiPath = timetableId ? `/api/results/${encodeURIComponent(madrasaId)}/${encodeURIComponent(timetableId)}` : `/api/results/${encodeURIComponent(madrasaId)}`;
      const docPath = timetableId ? `madrasa_results_${madrasaId}_${timetableId}` : `madrasa_results_${madrasaId}`;

      try {
        // 1. Check sessionStorage first
        try {
          const cachedSession = sessionStorage.getItem(cacheKey);
          if (cachedSession) {
            const parsed = JSON.parse(cachedSession) as MadrasaExamResult;
            if (parsed && parsed.classes && Object.keys(parsed.classes).length > 0) {
              setResultData(parsed);
              const firstClass = Object.keys(parsed.classes).find(c => (parsed.classes[c] || []).length > 0);
              if (firstClass) setSelectedClass(firstClass);
              setIsLoading(false);
              return;
            }
          }
        } catch {}

        // 2. Check Zero-Cost Server Cache
        try {
          const apiRes = await fetch(apiPath);
          if (apiRes.ok) {
            const json = await apiRes.json();
            if (json.success && json.data && json.data.classes) {
              const data = json.data as MadrasaExamResult;
              setResultData(data);
              try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
              const firstClass = Object.keys(data.classes || {}).find(c => (data.classes[c] || []).length > 0);
              if (firstClass) setSelectedClass(firstClass);
              setIsLoading(false);
              return;
            }
          }
        } catch {}

        // 3. Check localStorage if on same device
        const local = getLocalMadrasaResults(madrasaId, timetableId);
        const localHasClasses = Object.keys(local.classes || {}).some(c => (local.classes[c] || []).length > 0);
        if (localHasClasses && local.isPubliclyPublished) {
          setResultData(local);
          const firstClass = Object.keys(local.classes || {}).find(c => (local.classes[c] || []).length > 0);
          if (firstClass) setSelectedClass(firstClass);
          setIsLoading(false);
          return;
        }

        // 4. Fallback to Firestore only if not in session, server cache, or local storage
        const docRef = doc(db, "madrasa_results", docPath);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as MadrasaExamResult;
          setResultData(data);
          try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
          // Warm up server cache so subsequent parents use 0 Firestore reads
          fetch(apiPath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
          }).catch(() => {});
          const firstClassWithData = Object.keys(data.classes || {}).find(c => (data.classes[c] || []).length > 0);
          if (firstClassWithData) {
            setSelectedClass(firstClassWithData);
          }
        } else {
          setResultData(local);
          const firstClassWithData = Object.keys(local.classes || {}).find(c => (local.classes[c] || []).length > 0);
          if (firstClassWithData) {
            setSelectedClass(firstClassWithData);
          }
        }
      } catch (e) {
        console.warn("Could not load remote result:", e);
        const local = getLocalMadrasaResults(madrasaId, timetableId);
        setResultData(local);
      } finally {
        setIsLoading(false);
      }
    }

    loadRemoteResult();
  }, [madrasaId, timetableId]);

  const settings = resultData.settings;
  const availableClassesWithResults = Object.keys(resultData.classes || {}).filter(
    cls => (resultData.classes[cls] || []).length > 0
  );

  // When classes change, auto-select first class if none selected
  useEffect(() => {
    if (!selectedClass && availableClassesWithResults.length > 0) {
      setSelectedClass(availableClassesWithResults[0]);
    }
  }, [availableClassesWithResults, selectedClass]);

  // Current class students
  const classStudents: StudentResultEntry[] = selectedClass ? (resultData.classes[selectedClass] || []) : [];

  // Filter students by search
  const filteredStudents = useMemo(() => {
    return classStudents.filter(st => {
      if (!studentSearch.trim()) return true;
      const q = studentSearch.toLowerCase();
      return (
        st.name.toLowerCase().includes(q) || 
        st.admissionNumber.toLowerCase().includes(q)
      );
    });
  }, [classStudents, studentSearch]);

  // Currently active student (enriched with workspaceStudents from localStorage if DOB/Aadhaar/CustomPIN was updated)
  const rawActiveStudent: StudentResultEntry | undefined = classStudents.find(
    s => s.studentId === selectedStudentId
  );

  const activeStudent: StudentResultEntry | undefined = useMemo(() => {
    if (!rawActiveStudent) return undefined;
    try {
      const rawWs = localStorage.getItem("madrasa_students_v2") || localStorage.getItem("madrasa_students");
      if (rawWs) {
        const wsList = JSON.parse(rawWs);
        if (Array.isArray(wsList)) {
          const match = wsList.find(
            (w: any) =>
              (w.admissionNumber && String(w.admissionNumber).trim() === String(rawActiveStudent.admissionNumber).trim()) ||
              w.id === rawActiveStudent.studentId ||
              (w.name && w.name.trim().toLowerCase() === (rawActiveStudent.name || "").trim().toLowerCase())
          );
          if (match) {
            return {
              ...rawActiveStudent,
              dob: rawActiveStudent.dob || match.dob || "",
              aadhaar: rawActiveStudent.aadhaar || match.aadhaar || "",
              customPin: rawActiveStudent.customPin || match.customPin || "",
              accessPin: rawActiveStudent.customPin || match.customPin || rawActiveStudent.accessPin || match.accessPin || ""
            };
          }
        }
      }
    } catch {}
    return rawActiveStudent;
  }, [rawActiveStudent]);

  // Check if countdown should be shown
  const isScheduledInFuture = useMemo(() => {
    if (!settings?.scheduleEnabled || !settings.scheduledPublishTime) return false;
    const targetMs = new Date(settings.scheduledPublishTime).getTime();
    return targetMs > currentTime;
  }, [settings, currentTime]);

  // Remaining time for countdown
  const countdownData = useMemo(() => {
    if (!settings?.scheduledPublishTime) return null;
    const targetMs = new Date(settings.scheduledPublishTime).getTime();
    const diff = Math.max(0, targetMs - currentTime);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { diff, days, hours, minutes, seconds };
  }, [settings, currentTime]);

  // Security checks
  const accessMode: PublicAccessSecurity = settings?.publicAccessMode || settings?.securityMode || "direct";
  const isSecurityRequired = accessMode !== "direct" || !!settings?.requireCaptcha;
  const isStudentUnlocked = !isSecurityRequired || authenticatedStudentId === selectedStudentId;

  // Handle Security Submit
  const handleVerifyStudentAccess = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!activeStudent) return;

    // Strict Scheduling Enforcement: Block access if scheduled in the future and not admin preview
    if (isScheduledInFuture && !isAdminPreview) {
      setAuthError("പരീക്ഷാ ഫലം നിശ്ചിത പ്രഖ്യാപന സമയത്തിന് ശേഷമേ ലഭ്യമാകൂ!");
      return;
    }

    // Verify Captcha if required
    if (settings?.requireCaptcha) {
      if (enteredCaptcha.trim().toUpperCase() !== captchaCode.toUpperCase()) {
        setAuthError("ക്യാപ്‌ച കോഡ് തെറ്റാണ്! വീണ്ടും ശ്രമിക്കുക.");
        setCaptchaCode(getRandomCaptcha());
        return;
      }
    }

    // Verify Individual Student Personal PIN (Aadhaar 4/6 digit, DOB, Admission No, or Custom PIN with automatic fallback)
    if (accessMode === "student_pin") {
      const pinSource = settings?.studentPinSource || "aadhaar_last4";
      const isMatch = verifyStudentPin(activeStudent, enteredPassword, pinSource);

      if (!isMatch) {
        const pinInfo = getEffectiveStudentPinInfo(activeStudent, pinSource);
        if (pinInfo.missingPrimaryField) {
          setAuthError(
            `PIN പൊരുത്തപ്പെടുന്നില്ല! ${pinInfo.fallbackHintMl}`
          );
        } else {
          const pinLabel = pinSource === "aadhaar_last6"
            ? "ആധാർ നമ്പറിന്റെ അവസാന 6 അക്കങ്ങൾ"
            : pinSource === "dob"
            ? "ജനനത്തീയതി (DOB - DD/MM/YYYY അല്ലെങ്കിൽ ജനന വർഷം)"
            : pinSource === "adm_no"
            ? "അഡ്മിഷൻ നമ്പർ"
            : pinSource === "custom_pin"
            ? "മദ്റസ നൽകിയ കസ്റ്റം PIN"
            : "ആധാർ നമ്പറിന്റെ അവസാന 4 അക്കങ്ങൾ";
          setAuthError(`കുട്ടിയുടെ വ്യക്തിഗത PIN തെറ്റാണ്! ദയവായി ${pinLabel} അല്ലെങ്കിൽ അഡ്മിഷൻ നമ്പർ (${activeStudent.admissionNumber}) നൽകുക.`);
        }
        return;
      }
    }

    // Verify Madrasa Common Password if required
    if (accessMode === "password") {
      const correctPw = settings?.accessPassword?.trim() || "1234";
      if (enteredPassword.trim() !== correctPw) {
        setAuthError("പാസ്‌വേഡ് തെറ്റാണ്! മദ്റസ നൽകിയ ശരിയായ പാസ്‌വേഡ് നൽകുക.");
        return;
      }
    }

    // Verify DOB if required (supports DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, or birth year)
    if (accessMode === "dob") {
      if (activeStudent.dob && !doesDobMatch(activeStudent.dob, enteredDob)) {
        setAuthError("ജനനത്തീയതി (Date of Birth) പൊരുത്തപ്പെടുന്നില്ല!");
        return;
      }
    }

    // Verify Password or DOB
    if (accessMode === "password_or_dob") {
      const correctPw = settings?.accessPassword?.trim() || "1234";
      const pwMatch = enteredPassword.trim() === correctPw;
      const dobMatch = activeStudent.dob ? doesDobMatch(activeStudent.dob, enteredDob) : true;

      if (!pwMatch && !dobMatch) {
        setAuthError("നൽകിയ പാസ്‌വേഡ് അല്ലെങ്കിൽ ജനനത്തീയതി തെറ്റാണ്!");
        return;
      }
    }

    // Access granted!
    setAuthenticatedStudentId(activeStudent.studentId);
    setAuthError(null);
    handleFetchResult(activeStudent.studentId);
  };

  // Snappy result loader giving quick, responsive feedback before revealing the result
  const handleFetchResult = (studentId: string) => {
    if (!studentId) return;

    // Strict Scheduling Enforcement: Block access if scheduled in future and not admin preview
    if (isScheduledInFuture && !isAdminPreview) {
      setAuthError("പരീക്ഷാ ഫലം നിശ്ചിത പ്രഖ്യാപന സമയത്തിന് ശേഷമേ ലഭ്യമാകൂ!");
      return;
    }

    setIsResultLoading(true);
    setAuthError(null);
    setTimeout(() => {
      setIsResultLoading(false);
      setDisplayedStudentId(studentId);

      // Check if student passed to trigger celebratory phone vibration & confetti
      const targetStudent = classStudents.find(s => s.studentId === studentId);
      if (targetStudent && targetStudent.status !== "withheld") {
        const evalRes = calculateStudentOverallResult(targetStudent.subjectMarks || {}, settings, targetStudent.maxMarks);
        const isPassed = targetStudent.overallResult === "passed" || (!targetStudent.overallResult && evalRes.overallResult === "passed");
        if (isPassed) {
          triggerCelebration();
        }
      }
    }, 450);
  };

  const handlePrintResult = () => {
    window.print();
  };

  const officePhone = resultData.phone || "9633465267";
  const whatsappOfficeUrl = `https://wa.me/91${officePhone.replace(/\D/g, "")}?text=${encodeURIComponent(
    `അസ്സലാമു അലൈക്കും, ${resultData.madrasaName}-ലെ ${activeStudent?.name || "കുട്ടിയുടെ"} പരീക്ഷാ ഫലവുമായി ബന്ധപ്പെട്ട് സംസാരിക്കാൻ ആഗ്രഹിക്കുന്നു.`
  )}`;

  // Attendance string formatter
  const getFormattedAttendance = (student: StudentResultEntry) => {
    const classDays = student.totalWorkingDays || settings?.classWorkingDays?.[student.classLevel] || settings?.defaultWorkingDays || 180;
    if (student.daysPresent !== undefined && student.daysPresent !== null) {
      const pct = classDays > 0 ? ((student.daysPresent / classDays) * 100).toFixed(1) : null;
      return `${student.daysPresent} / ${classDays} ദിനം${pct ? ` (${pct}%)` : ""}`;
    }
    if (student.attendance) {
      return student.attendance;
    }
    return null;
  };

  // =========================================================================
  // VIEW A: LIVE COUNTDOWN SCREEN (IF SCHEDULED IN FUTURE AND NOT BYPASSED)
  // =========================================================================
  if (isScheduledInFuture && !bypassCountdown) {
    const publishDateFormatted = settings?.scheduledPublishTime
      ? new Date(settings.scheduledPublishTime).toLocaleString("en-IN", {
          dateStyle: "full",
          timeStyle: "short"
        })
      : "";

    return (
      <div className={`min-h-screen font-sans p-4 sm:p-8 flex flex-col justify-center items-center transition-colors ${
        isDark ? "bg-slate-950 text-slate-100 selection:bg-purple-500" : "bg-slate-100 text-slate-900 selection:bg-emerald-500"
      }`}>
        <div className={`max-w-2xl w-full p-6 sm:p-10 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden border transition-colors ${
          isDark ? "bg-slate-900 border-purple-500/30 text-white" : "bg-white border-slate-200 text-slate-900"
        }`}>

          {/* TOP TAG */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold ${
            isDark ? "bg-purple-950 border border-purple-600/50 text-purple-300" : "bg-emerald-50 border border-emerald-300 text-emerald-800"
          }`}>
            <Clock className="w-4 h-4" />
            <span>{settings?.countdownTitle || "പരീക്ഷാ ഫലപ്രഖ്യാപന കൗണ്ട്ഡൗൺ"}</span>
          </div>

          {/* MADRASA BRANDING */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              {resultData.madrasaName}
            </h1>
            <p className={`text-xs sm:text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {resultData.place && `${resultData.place} • `}
              {resultData.examTitle || "വാർഷിക പരീക്ഷാ ഫലം"} ({resultData.academicYear})
            </p>
          </div>

          {/* COUNTDOWN CLOCK BOXES */}
          {countdownData && (
            <div className="grid grid-cols-4 gap-2 sm:gap-4 py-4 max-w-lg mx-auto">
              <div className={`p-3 sm:p-4 rounded-2xl border ${
                isDark ? "bg-slate-950/80 border-purple-500/30" : "bg-slate-50 border-slate-200 shadow-sm"
              }`}>
                <span className="block text-2xl sm:text-4xl font-black font-mono">
                  {String(countdownData.days).padStart(2, "0")}
                </span>
                <span className={`text-[10px] sm:text-xs font-bold uppercase ${isDark ? "text-purple-300" : "text-slate-600"}`}>
                  ദിവസങ്ങൾ
                </span>
              </div>

              <div className={`p-3 sm:p-4 rounded-2xl border ${
                isDark ? "bg-slate-950/80 border-purple-500/30" : "bg-slate-50 border-slate-200 shadow-sm"
              }`}>
                <span className="block text-2xl sm:text-4xl font-black font-mono">
                  {String(countdownData.hours).padStart(2, "0")}
                </span>
                <span className={`text-[10px] sm:text-xs font-bold uppercase ${isDark ? "text-purple-300" : "text-slate-600"}`}>
                  മണിക്കൂർ
                </span>
              </div>

              <div className={`p-3 sm:p-4 rounded-2xl border ${
                isDark ? "bg-slate-950/80 border-purple-500/30" : "bg-slate-50 border-slate-200 shadow-sm"
              }`}>
                <span className="block text-2xl sm:text-4xl font-black font-mono">
                  {String(countdownData.minutes).padStart(2, "0")}
                </span>
                <span className={`text-[10px] sm:text-xs font-bold uppercase ${isDark ? "text-purple-300" : "text-slate-600"}`}>
                  മിനിറ്റ്
                </span>
              </div>

              <div className={`p-3 sm:p-4 rounded-2xl border ${
                isDark ? "bg-slate-950/80 border-purple-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm"
              }`}>
                <span className="block text-2xl sm:text-4xl font-black font-mono">
                  {String(countdownData.seconds).padStart(2, "0")}
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase">
                  സെക്കൻഡ്
                </span>
              </div>
            </div>
          )}

          {/* SCHEDULE ANNOUNCEMENT NOTICE */}
          <div className={`p-4 rounded-2xl text-left space-y-1.5 max-w-md mx-auto border ${
            isDark ? "bg-purple-950/40 border-purple-800/40" : "bg-slate-50 border-slate-200"
          }`}>
            <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? "text-purple-300" : "text-emerald-700"
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>പ്രഖ്യാപന സമയം:</span>
            </div>
            <p className="text-xs font-extrabold">
              {publishDateFormatted}
            </p>
            <p className={`text-[11px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              നിശ്ചിത സമയത്ത് പരീക്ഷാ ഫലം ഇവിടെ തത്സമയം ലഭ്യമാകുന്നതാണ്. പേജ് റീഫ്രഷ് ചെയ്യേണ്ടതില്ല.
            </p>
          </div>

          {/* ADMIN PREVIEW BYPASS BUTTON (ONLY VISIBLE IN ADMIN PREVIEW, NEVER ON PUBLIC PORTAL) */}
          {isAdminPreview && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setBypassCountdown(true)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition border cursor-pointer flex items-center gap-1.5 ${
                  isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                }`}
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>അഡ്മിൻ പ്രിവ്യൂ കാണുക (Admin Bypass)</span>
              </button>

              {onBackToApp && (
                <button
                  type="button"
                  onClick={onBackToApp}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  മദ്റസ ആപ്പിലേക്ക് മടങ്ങുക
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: MAIN ONLINE RESULT PORTAL
  // =========================================================================
  return (
    <div className={`min-h-screen font-sans p-3 sm:p-6 md:p-10 transition-colors ${
      isDark ? "bg-slate-950 text-slate-100 selection:bg-purple-500" : "bg-slate-100 text-slate-900 selection:bg-emerald-500"
    }`}>
      
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* TOP BAR / NAV (HIDDEN ON PRINT) */}
        <div className={`no-print flex items-center justify-between gap-3 p-4 rounded-2xl border transition-colors ${
          isDark ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"
        }`}>
          <div className="flex items-center gap-2">
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                }`}
                title="മദ്റസ ആപ്പിലേക്ക് മടങ്ങുക"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <span className={`text-[10px] uppercase tracking-wider font-extrabold ${isDark ? "text-purple-400" : "text-emerald-700"}`}>
                Official Online Result Portal
              </span>
              <h1 className="text-sm font-extrabold leading-tight">{resultData.madrasaName}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* PRINT BUTTON */}
            {activeStudent && isStudentUnlocked && activeStudent.status !== "withheld" && (
              <button
                type="button"
                onClick={handlePrintResult}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>പ്രിന്റ് ചെയ്യുക</span>
              </button>
            )}
          </div>
        </div>

        {/* MADRASA BRANDING CARD */}
        <div className={`p-6 rounded-3xl text-center space-y-2 border transition-colors relative overflow-hidden ${
          isDark 
            ? "bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/40 border-purple-500/30 text-white shadow-2xl" 
            : "bg-white border-slate-200 text-slate-900 shadow-md border-t-4 border-t-emerald-600"
        }`}>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isDark ? "bg-purple-950/80 border border-purple-800/60 text-purple-300" : "bg-emerald-50 border border-emerald-300 text-emerald-800"
          }`}>
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{resultData.examTitle || "പരീക്ഷാ ഫലം 2026"}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {resultData.madrasaName}
          </h2>

          <p className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {resultData.place && `${resultData.place} • `}
            {resultData.regNo && `Reg No: ${resultData.regNo} • `}
            അധ്യയന വർഷം: {resultData.academicYear}
          </p>
        </div>

        {/* STEP 1 & 2: DROPDOWN SELECTORS FOR PARENTS (CLASS & STUDENT) */}
        <div className={`no-print p-5 sm:p-6 rounded-3xl space-y-5 border transition-colors ${
          isDark ? "bg-slate-900/90 border-slate-800 shadow-xl" : "bg-white border-slate-200 shadow-md"
        }`}>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* DROPDOWN 1: SELECT CLASS */}
            <div className="space-y-1.5">
              <label className={`font-bold text-xs flex items-center gap-1.5 ${isDark ? "text-slate-300" : "text-slate-800"}`}>
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">1</span>
                <span>ക്ലാസ്സ് തിരഞ്ഞെടുക്കുക (SELECT CLASS):</span>
              </label>

              {availableClassesWithResults.length === 0 ? (
                <div className={`p-3 rounded-xl border text-center text-xs ${
                  isDark ? "bg-slate-950 border-slate-800 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}>
                  ഈ മദ്റസയിൽ ഇതുവരെ റിസൾട്ടുകൾ ലഭ്യമായിട്ടില്ല.
                </div>
              ) : (
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedStudentId("");
                    setStudentSearch("");
                    setAuthenticatedStudentId(null);
                    setAuthError(null);
                  }}
                  className={`w-full p-3 rounded-xl font-extrabold text-sm outline-none cursor-pointer border transition ${
                    isDark 
                      ? "bg-slate-950 border-slate-700 text-white focus:border-purple-500" 
                      : "bg-white border-slate-300 text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  }`}
                >
                  <option value="">-- ക്ലാസ്സ് തിരഞ്ഞെടുക്കുക --</option>
                  {availableClassesWithResults.map(cls => (
                    <option key={cls} value={cls}>
                      {cls} ({resultData.classes[cls]?.length || 0} കുട്ടികൾ)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* DROPDOWN 2: SELECT STUDENT */}
            <div className="space-y-1.5">
              <label className={`font-bold text-xs flex items-center gap-1.5 ${isDark ? "text-slate-300" : "text-slate-800"}`}>
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">2</span>
                <span>കുട്ടിയുടെ പേര് തിരഞ്ഞെടുക്കുക (SELECT STUDENT):</span>
              </label>

              <select
                value={selectedStudentId}
                disabled={!selectedClass || classStudents.length === 0}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  setAuthenticatedStudentId(null);
                  setAuthError(null);
                  setEnteredPassword("");
                  setEnteredDob("");
                  setEnteredCaptcha("");
                }}
                className={`w-full p-3 rounded-xl font-extrabold text-sm outline-none cursor-pointer border transition disabled:opacity-50 ${
                  isDark 
                    ? "bg-slate-950 border-slate-700 text-white focus:border-purple-500" 
                    : "bg-white border-slate-300 text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                }`}
              >
                <option value="">
                  {selectedClass ? "-- കുട്ടിയുടെ പേര് തിരഞ്ഞെടുക്കുക --" : "ആദ്യം ക്ലാസ്സ് തിരഞ്ഞെടുക്കുക"}
                </option>
                {filteredStudents.map(st => (
                  <option key={st.studentId} value={st.studentId}>
                    {st.admissionNumber} - {st.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* OPTIONAL QUICK SEARCH FILTER TO FIND NAME FASTER */}
          {selectedClass && classStudents.length > 5 && (
            <div className={`pt-2 border-t flex items-center gap-2 ${
              isDark ? "border-slate-800/60" : "border-slate-200"
            }`}>
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="പേര് അല്ലെങ്കിൽ റോൾ നമ്പർ ടൈപ്പ് ചെയ്ത് ലിസ്റ്റ് ചുരുക്കുക..."
                className={`text-xs outline-none w-full ${
                  isDark ? "bg-transparent text-slate-300 placeholder:text-slate-600" : "bg-transparent text-slate-800 placeholder:text-slate-400"
                }`}
              />
              {studentSearch && (
                <button
                  type="button"
                  onClick={() => setStudentSearch("")}
                  className="text-slate-400 hover:text-slate-600 text-xs px-1 font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* DIRECT GET RESULT BUTTON (WHEN NO PASSWORD/DOB IS REQUIRED) */}
          {selectedStudentId && !isSecurityRequired && !displayedStudentId && !isResultLoading && (
            <div className="pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleFetchResult(selectedStudentId)}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer transform active:scale-[0.99]"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>റിസൾട്ട് പരിശോധിക്കുക (Get Result)</span>
              </button>
            </div>
          )}

        </div>

        {/* FAST SNAPPY LOADING MICRO-ANIMATION */}
        {isResultLoading && (
          <div className="no-print p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-4 max-w-md mx-auto animate-in fade-in zoom-in-95 text-slate-900">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
              <GraduationCap className="w-8 h-8 text-emerald-600 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900">
                പരീക്ഷാ ഫലം ലഭ്യമാക്കുന്നു...
              </h4>
              <p className="text-xs text-slate-500 font-bold">
                വിദ്യാർത്ഥിയുടെ മാർക്ക് ഷീറ്റ് വേഗത്തിൽ പരിശോധിക്കുന്നു
              </p>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full animate-pulse w-4/5 transition-all duration-300" />
            </div>
          </div>
        )}

        {/* STEP 3: SECURITY VERIFICATION (PASSWORD, DOB, CAPTCHA) */}
        {activeStudent && isSecurityRequired && !isStudentUnlocked && !displayedStudentId && (
          <div className={`no-print p-6 rounded-3xl max-w-md mx-auto shadow-2xl space-y-4 border animate-in fade-in ${
            isDark ? "bg-slate-900 border-purple-500/40" : "bg-white border-slate-200"
          }`}>
            <div className={`flex items-center gap-2.5 border-b pb-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <div className={`p-2 rounded-xl border ${
                isDark ? "bg-purple-950 text-purple-400 border-purple-700/50" : "bg-emerald-50 text-emerald-700 border-emerald-300"
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>
                  സുരക്ഷാ പരിശോധന (Verification)
                </h3>
                <p className={`text-[11px] font-bold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  {activeStudent.name} (Adm: {activeStudent.admissionNumber})
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyStudentAccess} className="space-y-3.5">
              
              {/* CASE: INDIVIDUAL STUDENT PIN */}
              {accessMode === "student_pin" && (() => {
                const pinSource = settings?.studentPinSource || "aadhaar_last4";
                const pinInfo = getEffectiveStudentPinInfo(activeStudent, pinSource);
                const labelText = pinInfo.isCustom
                  ? "കുട്ടിയുടെ വ്യക്തിഗത കസ്റ്റം PIN (Custom PIN):"
                  : pinSource === "aadhaar_last6"
                  ? "കുട്ടിയുടെ വ്യക്തിഗത PIN (ആധാർ അവസാന 6 അക്കം):"
                  : pinSource === "dob"
                  ? "കുട്ടിയുടെ വ്യക്തിഗത PIN (ജനനത്തീയതി / DOB):"
                  : pinSource === "adm_no"
                  ? "കുട്ടിയുടെ വ്യക്തിഗത PIN (അഡ്മിഷൻ നമ്പർ):"
                  : "കുട്ടിയുടെ വ്യക്തിഗത PIN (ആധാർ അവസാന 4 അക്കം):";
                const placeholderText = pinInfo.isCustom
                  ? "മദ്റസ നൽകിയ കസ്റ്റം PIN നൽകുക..."
                  : pinSource === "aadhaar_last6"
                  ? "ആധാറിന്റെ അവസാന 6 അക്കം നൽകുക..."
                  : pinSource === "dob"
                  ? "DD/MM/YYYY (ഉദാ: 05/05/2015) അല്ലെങ്കിൽ 2015..."
                  : pinSource === "adm_no"
                  ? "അഡ്മിഷൻ നമ്പർ നൽകുക..."
                  : "ആധാറിന്റെ അവസാന 4 അക്കം നൽകുക...";

                return (
                  <div className="space-y-2">
                    <label className={`block text-xs font-bold flex items-center gap-1.5 ${
                      isDark ? "text-slate-300" : "text-slate-800"
                    }`}>
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{labelText}</span>
                    </label>

                    {/* Automatic Fallback Notice when Aadhaar or DOB is missing in CSV for this student */}
                    {pinInfo.missingPrimaryField && !pinInfo.isCustom && (
                      <div className={`p-2.5 rounded-xl border text-[11px] font-bold leading-relaxed ${
                        isDark ? "bg-amber-950/50 border-amber-700/60 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-900"
                      }`}>
                        ℹ️ {pinInfo.fallbackHintMl}
                      </div>
                    )}

                    {pinSource === "dob" && !pinInfo.isCustom ? (
                      <div className="space-y-2">
                        {/* Calendar Picker (converts cleanly to DD/MM/YYYY so user sees exact format) */}
                        <input
                          type="date"
                          value={toDobDateInputValue(enteredPassword)}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEnteredPassword(val ? formatDobReadable(val) : "");
                          }}
                          className={`w-full p-2.5 rounded-xl text-xs outline-none border font-mono font-bold text-center cursor-pointer ${
                            isDark ? "bg-slate-950 border-slate-700 text-white focus:border-purple-500" : "bg-white border-slate-300 text-slate-900 focus:border-emerald-600"
                          }`}
                        />
                        {/* Direct Text Input for DD/MM/YYYY, Birth Year (2015), or Admission No fallback */}
                        <input
                          type="text"
                          value={enteredPassword || ""}
                          onChange={(e) => setEnteredPassword(e.target.value)}
                          placeholder={placeholderText}
                          className={`w-full p-2 rounded-xl text-xs outline-none border font-mono tracking-wider text-center font-bold ${
                            isDark ? "bg-slate-950/70 border-slate-800 text-slate-200 focus:border-purple-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-600"
                          }`}
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        inputMode="numeric"
                        value={enteredPassword}
                        onChange={(e) => setEnteredPassword(e.target.value)}
                        placeholder={placeholderText}
                        maxLength={20}
                        className={`w-full p-2.5 rounded-xl text-xs outline-none border font-mono tracking-widest text-center text-base font-bold ${
                          isDark ? "bg-slate-950 border-slate-700 text-white focus:border-purple-500" : "bg-white border-slate-300 text-slate-900 focus:border-emerald-600"
                        }`}
                      />
                    )}

                    <p className="text-[10px] text-slate-500">
                      {pinInfo.fallbackHintMl}
                    </p>
                  </div>
                );
              })()}

              {/* CASE: PASSWORD */}
              {(accessMode === "password" || accessMode === "password_or_dob") && (
                <div>
                  <label className={`block text-xs font-bold mb-1 flex items-center gap-1.5 ${
                    isDark ? "text-slate-300" : "text-slate-800"
                  }`}>
                    <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                    <span>മദ്റസ സെക്യൂരിറ്റി പാസ്‌വേഡ് / കോമൺ പിൻ:</span>
                  </label>
                  <input
                    type="password"
                    value={enteredPassword}
                    onChange={(e) => setEnteredPassword(e.target.value)}
                    placeholder="പാസ്‌വേഡ് നൽകുക..."
                    className={`w-full p-2.5 rounded-xl text-xs outline-none border ${
                      isDark ? "bg-slate-950 border-slate-700 text-white focus:border-purple-500" : "bg-white border-slate-300 text-slate-900 focus:border-emerald-600"
                    }`}
                  />
                </div>
              )}

              {/* CASE: DOB */}
              {(accessMode === "dob" || accessMode === "password_or_dob") && (
                <div>
                  <label className={`block text-xs font-bold mb-1 flex items-center gap-1.5 ${
                    isDark ? "text-slate-300" : "text-slate-800"
                  }`}>
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span>കുട്ടിയുടെ ജനനത്തീയതി (Date of Birth):</span>
                  </label>
                  <input
                    type="text"
                    value={enteredDob}
                    onChange={(e) => setEnteredDob(e.target.value)}
                    placeholder="DD/MM/YYYY അല്ലെങ്കിൽ YYYY-MM-DD"
                    className={`w-full p-2.5 rounded-xl text-xs outline-none border ${
                      isDark ? "bg-slate-950 border-slate-700 text-white focus:border-purple-500" : "bg-white border-slate-300 text-slate-900 focus:border-emerald-600"
                    }`}
                  />
                </div>
              )}

              {/* CASE: CAPTCHA CODE */}
              {settings?.requireCaptcha && (
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? "text-slate-300" : "text-slate-800"}`}>
                    ക്യാപ്‌ച കോഡ് ടൈപ്പ് ചെയ്യുക (Enter Captcha):
                  </label>
                  <div className="flex items-center gap-2">
                    <div className={`px-4 py-2 rounded-xl font-mono font-black text-lg tracking-widest select-none border ${
                      isDark ? "bg-slate-950 border-purple-500/50 text-purple-300" : "bg-slate-100 border-slate-300 text-emerald-800"
                    }`}>
                      {captchaCode}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCaptchaCode(getRandomCaptcha())}
                      className={`p-2.5 rounded-xl transition cursor-pointer border ${
                        isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                      }`}
                      title="പുതിയ കോഡ് മാറ്റുക"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={enteredCaptcha}
                      onChange={(e) => setEnteredCaptcha(e.target.value)}
                      placeholder="കോഡ്..."
                      maxLength={4}
                      className={`flex-1 p-2.5 rounded-xl font-mono font-bold text-center text-sm outline-none border uppercase ${
                        isDark ? "bg-slate-950 border-slate-700 text-white focus:border-purple-500" : "bg-white border-slate-300 text-slate-900 focus:border-emerald-600"
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* ERROR MESSAGE */}
              {authError && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>റിസൾട്ട് പരിശോധിക്കുക (View Result)</span>
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: RESULT DISPLAY AREA (ONLY IF SELECTED, UNLOCKED, AND FETCHED) */}
        {activeStudent && isStudentUnlocked && displayedStudentId === activeStudent.studentId && !isResultLoading ? (
          <div className="space-y-4">
            {/* ACTION BAR: SEARCH ANOTHER STUDENT & TOP CONTROLS */}
            <div className="no-print flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setDisplayedStudentId(null);
                  setSelectedStudentId("");
                  setAuthenticatedStudentId(null);
                  setAuthError(null);
                }}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-extrabold transition flex items-center gap-2 border border-slate-300 shadow-xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-600" />
                <span>← മറ്റൊരു കുട്ടിയുടെ ഫലം തിരയുക (Search Another Student)</span>
              </button>

              <button
                type="button"
                onClick={handlePrintResult}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ml-auto"
              >
                <Printer className="w-4 h-4" />
                <span>പ്രിന്റ് / സേവ് ചെയ്യുക</span>
              </button>
            </div>

            {/* CASE A: RESULT WITHHELD BY MADRASA */}
            {activeStudent.status === "withheld" ? (
              <div className="bg-rose-50 border-2 border-rose-300 p-6 sm:p-8 rounded-3xl text-center space-y-4 shadow-xl animate-in zoom-in-95 text-rose-950">
                <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto border border-rose-300">
                  <Lock className="w-8 h-8 text-rose-600" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-rose-800">
                    ഔദ്യോഗിക അറിയിപ്പ് (OFFICIAL NOTICE)
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-rose-900">
                    പരീക്ഷാ ഫലം തടഞ്ഞുവെച്ചിരിക്കുന്നു (Withheld)
                  </h3>
                  <p className="text-sm font-bold text-rose-800">
                    {activeStudent.name} (റോൾ / Adm: {activeStudent.admissionNumber}) • {activeStudent.classLevel}
                  </p>
                </div>

                {/* WITHHELD REASON */}
                <div className="p-4 bg-white border border-rose-200 rounded-2xl max-w-md mx-auto text-left space-y-1 shadow-sm">
                  <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                    തടഞ്ഞുവെക്കാനുള്ള കാരണം (Reason):
                  </div>
                  <div className="text-xs text-slate-800 font-bold leading-relaxed">
                    {activeStudent.withheldReason || "ഫീസ് കുടിശ്ശിക - ദയവായി മദ്റസ ഓഫീസുമായി ബന്ധപ്പെടുക."}
                  </div>
                </div>

                <p className="text-xs text-slate-700 max-w-md mx-auto leading-relaxed">
                  പരീക്ഷാ ഫലം ലഭ്യമാക്കുന്നതിനായി രക്ഷിതാക്കൾ എത്രയും വേഗം താഴെ കാണുന്ന നമ്പറുകളിൽ മദ്റസ ഓഫീസുമായി ബന്ധപ്പെടേണ്ടതാണ്.
                </p>

                {/* CALL / WHATSAPP ACTION BUTTONS */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href={`tel:${officePhone}`}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-sm"
                  >
                    <PhoneCall className="w-4 h-4 text-emerald-400" />
                    <span>ഓഫീസിലേക്ക് വിളിക്കുക ({officePhone})</span>
                  </a>

                  <a
                    href={whatsappOfficeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition shadow-sm flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>വാട്സ്ആപ്പിൽ മെസ്സേജ് അയക്കുക</span>
                  </a>
                </div>
              </div>
            ) : (
              /* CASE B: RESULT PUBLISHED (MARKSHEET) */
              <div id="real-print-content" className="printable-paper-sheet bg-white text-slate-900 border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 print:m-0 print:p-4 print:border-none print:shadow-none">
                
                {/* MARKSHEET OFFICIAL HEADER */}
                <div className="text-center border-b-2 border-emerald-600 pb-4 space-y-1">
                  <div className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">
                    {resultData.examTitle || "പരീക്ഷാ ഫല രേഖ (MARKSHEET)"}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                    {resultData.madrasaName}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    {resultData.place && `${resultData.place} • `}
                    {resultData.regNo && `Reg No: ${resultData.regNo} • `}
                    അധ്യയന വർഷം: {resultData.academicYear}
                  </p>
                </div>

                {/* STUDENT EVALUATION CALCULATION */}
                {(() => {
                  const displayMode = settings?.displayMode || "marks_and_grades";
                  const overallEval = calculateStudentOverallResult(activeStudent.subjectMarks || {}, settings, activeStudent.maxMarks);
                  
                  // Handle direct pass/fail or direct grade overrides if present
                  let isPassed = overallEval.overallResult === "passed";
                  if (activeStudent.overallResult) {
                    isPassed = activeStudent.overallResult === "passed";
                  }

                  const failedList = overallEval.failedSubjects;

                  // Visibility settings
                  const showPercentage = settings?.showPercentage !== false;
                  const showTotalMarks = settings?.showTotalMarks !== false;
                  const showRank = !!settings?.showRank && activeStudent.rank !== undefined;
                  const attendanceFormatted = getFormattedAttendance(activeStudent);
                  const showAttendance = settings?.showAttendance !== false && !!attendanceFormatted;
                  const showSubjectTable = settings?.showSubjectMarks !== false;

                  return (
                    <>
                      {/* CELEBRATION CONGRATULATIONS BANNER FOR PASSED STUDENTS */}
                      {isPassed && (
                        <div className="no-print p-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl animate-bounce">🎉</span>
                            <div>
                              <h4 className="text-sm sm:text-base font-black tracking-wide">
                                അഭിനന്ദനങ്ങൾ! പരീക്ഷയിൽ ഉന്നത വിജയം നേടിയിരിക്കുന്നു!
                              </h4>
                              <p className="text-xs text-emerald-100 font-medium">
                                {activeStudent.name} • {activeStudent.classLevel}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={triggerCelebration}
                            className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/40 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs ml-auto"
                            title="വീണ്ടും ആഘോഷിക്കൂ"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                            <span>വീണ്ടും ആഘോഷിക്കൂ! 🎊</span>
                          </button>
                        </div>
                      )}
                      {/* STUDENT PROFILE STRIP */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px]">വിദ്യാർത്ഥിയുടെ പേര്:</span>
                          <span className="font-extrabold text-slate-900 text-sm">{activeStudent.name}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[10px]">ക്ലാസ്സ് & ഡിവിഷൻ:</span>
                          <span className="font-extrabold text-slate-900 text-sm">{activeStudent.classLevel} {activeStudent.division && `(${activeStudent.division})`}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[10px]">അഡ്മിഷൻ / റോൾ നമ്പർ:</span>
                          <span className="font-mono font-extrabold text-slate-900 text-sm">{activeStudent.admissionNumber}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[10px]">പരീക്ഷാ ഫലം (Result):</span>
                          {isPassed ? (
                            <span className="inline-flex items-center gap-1 font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>വിജയിച്ചു (PASSED)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-extrabold text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-full text-xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>തോറ്റു (FAILED)</span>
                            </span>
                          )}
                        </div>

                        {/* ATTENDANCE DISPLAY */}
                        {showAttendance && (
                          <div>
                            <span className="text-slate-500 block text-[10px]">ഹാജർ നില (Attendance):</span>
                            <span className="font-bold text-sky-800 text-xs">{attendanceFormatted}</span>
                          </div>
                        )}

                        {/* RANK DISPLAY */}
                        {showRank && (
                          <div>
                            <span className="text-slate-500 block text-[10px]">ക്ലാസ്സ് റാങ്ക് (Rank):</span>
                            <span className="font-extrabold text-amber-700 text-sm">#{activeStudent.rank}</span>
                          </div>
                        )}
                      </div>

                      {/* NOTICE IF FAILED IN ANY SUBJECT */}
                      {!isPassed && failedList.length > 0 && showSubjectTable && displayMode !== "pass_fail_only" && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            <strong>ശ്രദ്ധിക്കുക:</strong> {failedList.join(", ")} എന്നീ വിഷയങ്ങളിൽ നിശ്ചിത പാസ്സ് മാർക്ക് ലഭിക്കാത്തതിനാൽ പരീക്ഷ പാസ്സായിട്ടില്ല.
                          </span>
                        </div>
                      )}

                      {/* SUBJECT-WISE MARKS TABLE OR CLEAN OVERALL PASS/FAIL CARD */}
                      {showSubjectTable ? (
                        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                <th className="p-3 w-12 text-center">#</th>
                                <th className="p-3">വിഷയം (Subject)</th>
                                
                                {/* CONDITIONAL COLUMNS BASED ON DISPLAY MODE */}
                                {displayMode === "marks_and_grades" && (
                                  <>
                                    <th className="p-3 text-center w-24">പരമാവധി</th>
                                    <th className="p-3 text-center w-24">പാസ്സ്</th>
                                    <th className="p-3 text-center w-28">നേടിയ മാർക്ക്</th>
                                  </>
                                )}

                                {displayMode === "grades_only" && (
                                  <th className="p-3 text-center w-32">ഗ്രേഡ് (Grade)</th>
                                )}

                                <th className="p-3 text-center w-28">ഫലം (Status)</th>

                                {displayMode === "marks_and_grades" && (
                                  <th className="p-3 text-center w-28">ഗ്രേഡ്</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {Object.keys(activeStudent.subjectMarks || {}).map((sub, idx) => {
                                const mark = activeStudent.subjectMarks[sub];
                                const directGrade = activeStudent.subjectGrades?.[sub];
                                const directPass = activeStudent.subjectPassStatus?.[sub];
                                const scoreEval = evaluateSubjectScore(mark, sub, settings, activeStudent.maxMarks);
                                const displayMark = scoreEval.isAbsent ? "Absent" : mark;
                                
                                const subjectPassed = directPass ? directPass === "pass" : (directGrade ? directGrade !== "F" : scoreEval.isPassed);

                                return (
                                  <tr key={sub} className={`hover:bg-slate-50/80 ${!subjectPassed ? "bg-rose-50/40" : ""}`}>
                                    <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                                    <td className="p-3 font-bold text-slate-900">
                                      <div className="flex items-center gap-2">
                                        <span>{sub}</span>
                                        {scoreEval.passMark === 20 && displayMode === "marks_and_grades" && (
                                          <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold font-mono">
                                            പാസ്സ്: 20
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* FULL MARKS COLUMNS */}
                                    {displayMode === "marks_and_grades" && (
                                      <>
                                        <td className="p-3 text-center font-mono text-slate-600">{scoreEval.maxMark}</td>
                                        <td className="p-3 text-center font-mono text-slate-600">{scoreEval.passMark}</td>
                                        <td className="p-3 text-center font-mono font-extrabold text-slate-900 text-sm">
                                          {displayMark}
                                        </td>
                                      </>
                                    )}

                                    {/* GRADES ONLY COLUMN */}
                                    {displayMode === "grades_only" && (
                                      <td className="p-3 text-center font-bold text-slate-800 text-xs">
                                        {directGrade || scoreEval.grade}
                                      </td>
                                    )}

                                    {/* STATUS COLUMN (PASS / FAIL) */}
                                    <td className="p-3 text-center">
                                      {subjectPassed ? (
                                        <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>വിജയിച്ചു (PASS)</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                                          <AlertTriangle className="w-3 h-3" />
                                          <span>തോറ്റു (FAIL)</span>
                                        </span>
                                      )}
                                    </td>

                                    {displayMode === "marks_and_grades" && (
                                      <td className="p-3 text-center font-bold text-emerald-800">
                                        {directGrade || scoreEval.grade}
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-50 font-black border-t-2 border-slate-300 text-slate-900">
                                <td colSpan={2} className="p-3 text-right">ആകെ ഫലം (OVERALL RESULT):</td>
                                
                                {displayMode === "marks_and_grades" && (
                                  <>
                                    <td className="p-3 text-center font-mono text-slate-600">
                                      {showTotalMarks ? overallEval.maxTotalMarks : "-"}
                                    </td>
                                    <td className="p-3 text-center font-mono text-slate-500">-</td>
                                    <td className="p-3 text-center font-mono text-emerald-800 text-sm">
                                      {showTotalMarks ? overallEval.totalMarks : "-"}
                                    </td>
                                  </>
                                )}

                                {displayMode === "grades_only" && (
                                  <td className="p-3 text-center font-bold text-emerald-800 text-xs">
                                    {activeStudent.grade || overallEval.grade}
                                  </td>
                                )}

                                <td className="p-3 text-center">
                                  {isPassed ? (
                                    <span className="font-extrabold text-emerald-800">വിജയിച്ചു</span>
                                  ) : (
                                    <span className="font-extrabold text-rose-800">തോറ്റു</span>
                                  )}
                                </td>

                                {displayMode === "marks_and_grades" && (
                                  <td className="p-3 text-center text-emerald-800 text-xs">
                                    {activeStudent.grade || overallEval.grade}
                                  </td>
                                )}
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ) : (
                        /* CLEAN CARD VIEW WHEN SUBJECT TABLE IS HIDDEN (STRICT OVERALL PASS/FAIL ONLY) */
                        <div className={`p-8 rounded-3xl text-center space-y-4 border ${
                          isPassed 
                            ? "bg-emerald-50/70 border-emerald-300 text-emerald-950" 
                            : "bg-rose-50/70 border-rose-300 text-rose-950"
                        }`}>
                          <div className="space-y-1">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500 block">
                              വാർഷിക പരീക്ഷാ സമഗ്ര മൂല്യനിർണ്ണയം (OVERALL RESULT)
                            </span>
                            <div className={`text-3xl sm:text-4xl font-black ${isPassed ? "text-emerald-800" : "text-rose-800"}`}>
                              {isPassed ? "✓ വിജയിച്ചു (PASSED)" : "✕ തോറ്റു (FAILED)"}
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm font-medium text-slate-700 max-w-md mx-auto leading-relaxed">
                            {isPassed 
                              ? "വിദ്യാർത്ഥി ഈ അധ്യയന വർഷത്തെ വാർഷിക പരീക്ഷ വിജയകരമായി പൂർത്തിയാക്കി അടുത്ത ക്ലാസിലേക്ക് യോഗ്യത നേടിയിരിക്കുന്നു."
                              : "വിദ്യാർത്ഥി നിശ്ചിത പരീക്ഷാ മാനദണ്ഡങ്ങൾ കൈവരിക്കാത്തതിനാൽ അടുത്ത ക്ലാസിലേക്ക് പ്രമോഷൻ ലഭിച്ചിട്ടില്ല."
                            }
                          </p>

                          {/* KEY STATS: ATTENDANCE & RANK (NO SUBJECT CLUTTER) */}
                          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                            {showAttendance && attendanceFormatted && (
                              <div className="px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
                                <span className="text-[10px] text-slate-500 font-bold block uppercase">ഹാജർ നില (Attendance)</span>
                                <span className="text-sm font-black text-sky-800">{attendanceFormatted}</span>
                              </div>
                            )}

                            {showRank && activeStudent.rank && (
                              <div className="px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
                                <span className="text-[10px] text-slate-500 font-bold block uppercase">ക്ലാസ്സ് റാങ്ക് (Class Rank)</span>
                                <span className="text-sm font-black text-amber-700">#{activeStudent.rank}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* OVERALL PERFORMANCE SUMMARY BOXES (WHEN SUBJECT TABLE IS SHOWN) */}
                      {showSubjectTable && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {showPercentage && displayMode === "marks_and_grades" && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                              <span className="text-[10px] text-emerald-800 font-bold block uppercase">ശതമാനം (Percentage)</span>
                              <span className="text-xl font-black text-emerald-800 font-mono">
                                {overallEval.percentage}%
                              </span>
                            </div>
                          )}

                          <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-center">
                            <span className="text-[10px] text-purple-800 font-bold block uppercase">സമഗ്ര ഗ്രേഡ് (Overall Grade)</span>
                            <span className="text-base font-black text-purple-900">
                              {activeStudent.grade || overallEval.gradeMalayalam}
                            </span>
                          </div>

                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                            <span className="text-[10px] text-slate-600 font-bold block uppercase">തീയതി (Issued Date)</span>
                            <span className="text-xs font-bold text-slate-800">
                              {new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* GRADE SYSTEM REFERENCE (ബോർഡ് ഗ്രേഡ് സൂചിക) */}
                      <div className="pt-2">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] text-slate-600 space-y-1.5">
                          <div className="font-bold text-slate-800 flex items-center justify-between">
                            <span>ഗ്രേഡ് മാനദണ്ഡം (Grading Scale):</span>
                            <span className="font-semibold text-[9px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              D+ ഉം അതിനു മുകളിലും വിജയം
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-700">
                            {(settings?.gradeRules || OFFICIAL_BOARD_GRADE_RULES).map(gr => (
                              <span key={gr.id} className="inline-flex items-center gap-1 font-mono">
                                <strong className={`font-black ${gr.isPass ? "text-slate-900" : "text-rose-600"}`}>{gr.grade}</strong>: {gr.minMark}-{gr.maxMark} ({gr.minPercentage}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* SIGNATURE & SEAL PLACEHOLDERS */}
                <div className="pt-8 flex items-center justify-between text-xs text-slate-600 border-t border-slate-200">
                  <div className="text-center space-y-8">
                    <div className="h-6"></div>
                    <div className="border-t border-slate-400 px-6 font-bold text-slate-800">ക്ലാസ് അദ്ധ്യാപകൻ</div>
                  </div>

                  <div className="text-center space-y-8">
                    <div className="h-6"></div>
                    <div className="border-t border-slate-400 px-6 font-bold text-slate-800">സദർ മുഅല്ലിം / പ്രിൻസിപ്പാൾ</div>
                  </div>
                </div>

              </div>
            )}
          </div>
        ) : (
          <div className={`p-10 rounded-3xl text-center space-y-2 border transition-colors ${
            isDark ? "bg-slate-900/40 border-slate-800 text-slate-500" : "bg-white border-slate-200 text-slate-500 shadow-sm"
          }`}>
            <Search className="w-8 h-8 text-slate-400 mx-auto" />
            <p className={`text-sm font-bold ${isDark ? "text-slate-400" : "text-slate-800"}`}>
              റിസൾട്ട് കാണാൻ മുകളിൽ നിന്ന് ക്ലാസ്സും കുട്ടിയുടെ പേരും തിരഞ്ഞെടുക്കുക.
            </p>
            <p className="text-xs text-slate-500">
              ഡ്രോപ്പ്ഡൗൺ ലിസ്റ്റിൽ നിന്ന് കുട്ടി തിരഞ്ഞെടുക്കുമ്പോൾ ഔദ്യോഗിക പരീക്ഷാ ഫലം ഇവിടെ കാണാം.
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
