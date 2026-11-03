import React, { useState, useEffect } from "react";
import {
  HeartHandshake,
  Star,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Check,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Send,
  KeyRound,
  Lock
} from "lucide-react";
import {
  TarbiyahCycle,
  Student,
  TarbiyahQuestion,
  StudentPinSourceType,
  deriveStudentPin,
  verifyStudentPin,
  getEffectiveStudentPinInfo,
  formatDobReadable,
  toDobDateInputValue,
  StudentTarbiyahRecord
} from "../types";
import { renderQuestionInputWidget } from "./TarbiyahManager";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface TarbiyahPortalProps {
  defaultMadrasaId: string;
  onBackToApp?: () => void;
  onBackToLanding?: () => void;
}

export default function TarbiyahPortal({
  defaultMadrasaId,
  onBackToApp,
  onBackToLanding,
}: TarbiyahPortalProps) {
  const [cycle, setCycle] = useState<TarbiyahCycle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [parentName, setParentName] = useState<string>("");
  const [enteredPin, setEnteredPin] = useState<string>("");
  const [authenticatedStudentId, setAuthenticatedStudentId] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [declarationAccepted, setDeclarationAccepted] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Available students list from saved cycle or local workspace data (never ask user for CSV again)
  useEffect(() => {
    async function loadCycle() {
      setLoading(true);
      try {
        let loadedCycle: TarbiyahCycle | null = null;
        const docId = `${defaultMadrasaId}_tarbiyah_2025-2026`;
        const localKey = `madrasa_tarbiyah_${defaultMadrasaId}`;

        // 1. Try Zero-Cost Server Cache first (0 Firestore reads!)
        try {
          const apiRes = await fetch(`/api/tarbiyah/${encodeURIComponent(docId)}`);
          if (apiRes.ok) {
            const json = await apiRes.json();
            if (json.success && json.data) {
              loadedCycle = json.data as TarbiyahCycle;
            }
          }
          if (!loadedCycle) {
            const apiRes2 = await fetch(`/api/tarbiyah/${encodeURIComponent(defaultMadrasaId)}`);
            if (apiRes2.ok) {
              const json2 = await apiRes2.json();
              if (json2.success && json2.data) {
                loadedCycle = json2.data as TarbiyahCycle;
              }
            }
          }
        } catch {}

        // 2. Try localStorage if not found on server
        if (!loadedCycle) {
          const localData = localStorage.getItem(localKey);
          if (localData) {
            loadedCycle = JSON.parse(localData);
          }
        }

        // 3. Fallback to Firestore only if neither Server Cache nor localStorage had the cycle
        if (!loadedCycle && db) {
          const docRef = doc(db, "tarbiyah_cycles", docId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            loadedCycle = snap.data() as TarbiyahCycle;
            // Warm up server cache for subsequent parents
            fetch(`/api/tarbiyah/${encodeURIComponent(docId)}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(loadedCycle)
            }).catch(() => {});
          }
        }

        // Enrich with already stored workspace students from localStorage so user never has to re-upload CSV
        let savedStudents: Student[] = [];
        try {
          const rawStudents = localStorage.getItem("madrasa_students_v2") || localStorage.getItem("madrasa_students");
          if (rawStudents) {
            savedStudents = JSON.parse(rawStudents);
          }
        } catch {}

        if (savedStudents.length > 0) {
          const baseCycle: TarbiyahCycle = loadedCycle || {
            id: `${defaultMadrasaId}_tarbiyah_2025-2026`,
            madrasaId: defaultMadrasaId,
            madrasaName: "മദ്റസ തർബിയ്യത്ത് ട്രാക്കർ",
            academicYear: "2025-2026",
            title: "2026 നിരന്തര മൂല്യനിർണ്ണയം",
            frequency: "monthly",
            startDate: new Date().toISOString().split("T")[0],
            endDate: "2026-10-30",
            teacherDeadline: "2026-10-30",
            parentDeadline: "2026-10-25",
            isParentWindowOpen: true,
            isTeacherWindowOpen: true,
            isPublishedBySadar: false,
            includeExamMarksInBestStudent: false,
            parentSecurityEnabled: true,
            parentPinSource: "aadhaar_last4",
            questions: [],
            records: {},
            updatedAt: new Date().toISOString()
          };
          const pinSrc = baseCycle.parentPinSource || "aadhaar_last4";
          const nextRecords = { ...(baseCycle.records || {}) };
          savedStudents.forEach(st => {
            const cls = (st.classLevel || (st as any).class || "Class 1").trim();
            const clsMap = { ...(nextRecords[cls] || {}) };
            const existing = clsMap[st.id];
            const computedPin = deriveStudentPin(st, pinSrc);
            clsMap[st.id] = {
              ...(existing || {
                studentId: st.id,
                studentName: st.name,
                classLevel: cls,
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
              }),
              division: st.division || existing?.division || "A",
              rollNo: String(st.rollNumber || st.admissionNumber || existing?.rollNo || ""),
              admissionNumber: String(st.admissionNumber || st.rollNumber || existing?.admissionNumber || ""),
              dob: st.dob || existing?.dob || "",
              aadhaar: st.aadhaar || existing?.aadhaar || "",
              customPin: st.customPin || existing?.customPin || "",
              accessPin: st.customPin || computedPin || existing?.accessPin || "",
            };
            nextRecords[cls] = clsMap;
          });
          loadedCycle = { ...baseCycle, records: nextRecords };
        }

        if (loadedCycle) {
          setCycle(loadedCycle);
          const classes = Object.keys(loadedCycle.records || {});
          if (classes.length > 0) {
            setSelectedClass(classes[0]);
          }
        }
      } catch (err) {
        console.error("Error loading tarbiyah cycle:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCycle();
  }, [defaultMadrasaId]);

  // When selected student changes, populate previous scores if available
  useEffect(() => {
    setAuthenticatedStudentId(null);
    setEnteredPin("");
    setPinError(null);
    if (cycle && selectedClass && selectedStudentId) {
      const rec = cycle.records?.[selectedClass]?.[selectedStudentId];
      if (rec && rec.parentScores) {
        setScores(rec.parentScores);
        setDeclarationAccepted(rec.parentVerified || false);
        setParentName(rec.parentEvaluatorName || "");
      } else {
        setScores({});
        setDeclarationAccepted(false);
      }
    }
  }, [selectedClass, selectedStudentId, cycle]);

  const studentsInClass = React.useMemo(() => {
    if (!cycle || !cycle.records || !selectedClass) return [];
    const classMap = cycle.records[selectedClass] || {};
    return Object.values(classMap);
  }, [cycle, selectedClass]);

  const activeStudentRecord: StudentTarbiyahRecord | undefined = React.useMemo(() => {
    if (!cycle || !selectedClass || !selectedStudentId) return undefined;
    return cycle.records?.[selectedClass]?.[selectedStudentId];
  }, [cycle, selectedClass, selectedStudentId]);

  const isSecurityRequired = cycle?.parentSecurityEnabled !== false;
  const pinSource: StudentPinSourceType = cycle?.parentPinSource || "aadhaar_last4";
  const isParentUnlocked = !isSecurityRequired || authenticatedStudentId === selectedStudentId;
  const activeStudentPinInfo = activeStudentRecord
    ? getEffectiveStudentPinInfo(activeStudentRecord, pinSource)
    : null;
  const effectivePinSource = activeStudentPinInfo?.effectiveSource || pinSource;

  const handleUpdatePinSource = (newSource: StudentPinSourceType) => {
    if (!cycle) return;
    const updated: TarbiyahCycle = {
      ...cycle,
      parentSecurityEnabled: true,
      parentPinSource: newSource,
      updatedAt: new Date().toISOString()
    };
    setCycle(updated);
    const localKey = `madrasa_tarbiyah_${defaultMadrasaId}`;
    localStorage.setItem(localKey, JSON.stringify(updated));
  };

  const handleVerifyParentSignIn = () => {
    setPinError(null);
    if (!activeStudentRecord) return;
    const rawEntered = enteredPin.trim();
    if (!rawEntered) {
      setPinError("ദയവായി സെക്യൂരിറ്റി PIN / വിവരങ്ങൾ നൽകുക.");
      return;
    }

    const isVerified = verifyStudentPin(activeStudentRecord, rawEntered, pinSource);
    if (!isVerified) {
      setPinError("നൽകിയ PIN തെറ്റാണ്. ദയവായി കുട്ടിയുടെ ശരിയായ PIN / വിവരങ്ങൾ നൽകുക.");
      return;
    }

    setAuthenticatedStudentId(selectedStudentId);
    setPinError(null);
  };

  const parentQuestions = React.useMemo(() => {
    if (!cycle || !cycle.questions) return [];
    return cycle.questions.filter(q => q.target === "parent" && q.enabled);
  }, [cycle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedStudentId) {
      alert("ദയവായി ക്ലാസും കുട്ടിയുടെ പേരും തിരഞ്ഞെടുക്കുക.");
      return;
    }
    if (!declarationAccepted) {
      alert("ദയവായി രക്ഷിതാവിന്റെ സാക്ഷ്യപ്പെടുത്തൽ (Declaration) ചെക്ക് ചെയ്യുക.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!cycle) return;

      const existingRecord = cycle.records?.[selectedClass]?.[selectedStudentId];
      const studentName = existingRecord?.studentName || "Student";

      const totalParentPoints = parentQuestions.reduce((sum, q) => sum + (scores[q.id] || 0), 0);
      const maxParentPoints = parentQuestions.reduce((sum, q) => sum + q.maxPoints, 0);

      const totalTeacherPoints = existingRecord?.totalTeacherPoints || 0;
      const maxTeacherPoints = existingRecord?.maxTeacherPoints || 0;

      const totalScore = totalParentPoints + totalTeacherPoints;
      const maxTotalScore = maxParentPoints + maxTeacherPoints;
      const percentage = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;

      const updatedRecord = {
        ...(existingRecord || {
          studentId: selectedStudentId,
          studentName,
          classLevel: selectedClass,
          teacherScores: {},
        }),
        parentScores: scores,
        parentVerified: true,
        parentEvaluatedAt: new Date().toISOString(),
        parentEvaluatorName: parentName || "രക്ഷിതാവ്",
        totalParentPoints,
        maxParentPoints,
        totalScore,
        maxTotalScore,
        percentage,
      };

      const updatedCycle: TarbiyahCycle = {
        ...cycle,
        records: {
          ...cycle.records,
          [selectedClass]: {
            ...(cycle.records?.[selectedClass] || {}),
            [selectedStudentId]: updatedRecord,
          },
        },
        updatedAt: new Date().toISOString(),
      };

      // Save locally & to Zero-Cost Server Cache
      const localKey = `madrasa_tarbiyah_${defaultMadrasaId}`;
      localStorage.setItem(localKey, JSON.stringify(updatedCycle));
      setCycle(updatedCycle);

      const docId = cycle.id || `${defaultMadrasaId}_tarbiyah_2025-2026`;
      fetch(`/api/tarbiyah/${encodeURIComponent(docId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCycle)
      }).catch(() => {});
      fetch(`/api/tarbiyah/${encodeURIComponent(defaultMadrasaId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCycle)
      }).catch(() => {});

      // Save to Firebase Firestore
      if (db) {
        const docRef = doc(db, "tarbiyah_cycles", docId);
        await setDoc(docRef, updatedCycle, { merge: true });
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting parent evaluation:", err);
      alert("സബ്മിറ്റ് ചെയ്തപ്പോൾ തടസ്സമുണ്ടായി. ദയവായി വീണ്ടും ശ്രമിക്കുക.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-slate-50 text-slate-900 font-sans p-3 sm:p-6 lg:p-10">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* HEADER BAR */}
        <div className="bg-white rounded-3xl p-6 border border-teal-100 shadow-sm text-center space-y-3 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600" />
          
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="absolute left-4 top-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>തിരികെ</span>
            </button>
          )}

          <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold shadow-xs">
            <HeartHandshake className="w-6 h-6" />
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              രക്ഷിതാക്കളുടെ വിലയിരുത്തൽ പോർട്ടൽ
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              {cycle?.madrasaName || "മദ്റസ തർബിയ്യത്ത് ട്രാക്കർ"}
            </h1>
            <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1">
              കുട്ടിയുടെ ദൈനംദിന ഇസ്ലാമിക ചിട്ടകളും സ്വഭാവഗുണങ്ങളും വിലയിരുത്താനും മികച്ച ശീലങ്ങൾ വളർത്തിയെടുക്കാനുമുള്ള നിരന്തര മൂല്യനിർണ്ണയം.
            </p>
          </div>
        </div>

        {/* SUCCESS MESSAGE */}
        {submitted ? (
          <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-sm text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">ജസാക്കല്ലാഹു ഖൈർ!</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              താങ്കളുടെ കുട്ടിയുടെ സത്യസന്ധമായ വിവരങ്ങൾ വിജയകരമായി മദ്റസയിലേക്ക് രേഖപ്പെടുത്തിയിരിക്കുന്നു. കുട്ടിയുടെ വളർച്ചയിലും ഇസ്ലാമിക ശിക്ഷണത്തിലും താങ്കൾ കാണിക്കുന്ന ശ്രദ്ധ അഭിനന്ദനാർഹമാണ്.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setSelectedStudentId("");
                setScores({});
                setDeclarationAccepted(false);
              }}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md"
            >
              മറ്റൊരു കുട്ടിയെ വിലയിരുത്തുക
            </button>
          </div>
        ) : (
          /* EVALUATION FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* STEP 1: CLASS & STUDENT SELECTION */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-teal-800 font-black text-xs uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-[10px]">1</span>
                <span>കുട്ടിയുടെ വിവരങ്ങൾ തിരഞ്ഞെടുക്കുക</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* CLASS */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">ക്ലാസ്സ് (Class):</label>
                  <select
                    value={selectedClass}
                    onChange={e => {
                      setSelectedClass(e.target.value);
                      setSelectedStudentId("");
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:border-teal-500 bg-slate-50"
                  >
                    <option value="">-- ക്ലാസ് തിരഞ്ഞെടുക്കുക --</option>
                    {Object.keys(cycle?.records || {}).length > 0 ? (
                      Object.keys(cycle?.records || {}).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))
                    ) : (
                      ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))
                    )}
                  </select>
                </div>

                {/* STUDENT */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">വിദ്യാർത്ഥിയുടെ പേര്:</label>
                  <select
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:border-teal-500 bg-slate-50"
                  >
                    <option value="">-- കുട്ടിയുടെ പേര് തിരഞ്ഞെടുക്കുക --</option>
                    {studentsInClass.map(s => (
                      <option key={s.studentId} value={s.studentId}>
                        {s.studentName} {s.rollNo ? `(Roll: ${s.rollNo})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PARENT NAME */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">വിലയിരുത്തുന്ന രക്ഷിതാവിന്റെ പേര്:</label>
                <input
                  type="text"
                  placeholder="ഉദാ: അബ്ദുല്ല (പിതാവ് / മാതാവ്)"
                  value={parentName}
                  onChange={e => setParentName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:border-teal-500 bg-slate-50"
                />
              </div>

              {/* PARENT SIGN-IN SECURITY PIN VERIFICATION */}
              {selectedStudentId && isSecurityRequired && !isParentUnlocked && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-black text-teal-950 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                          <span>രക്ഷിതാക്കളുടെ സൈൻ-ഇൻ സുരക്ഷാ പരിശോധന (Parent Sign-In Security PIN)</span>
                        </h4>
                        <p className="text-[11px] text-teal-800 mt-0.5">
                          സെക്യൂരിറ്റി PIN ആയി താഴെ പറയുന്നവയിൽ ഏത് വിവരമാണ് നൽകേണ്ടത് എന്ന് തിരഞ്ഞെടുക്കാം:
                        </p>
                      </div>
                    </div>

                    {/* SUB-QUESTION: CHOOSE PIN TYPE (DOB, AADHAAR 4/6 DIGITS, ADMISSION NO, CUSTOM PIN) */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { id: "aadhaar_last4" as StudentPinSourceType, label: "ആധാർ 4 അക്കം", sub: "Last 4 Digits" },
                        { id: "aadhaar_last6" as StudentPinSourceType, label: "ആധാർ 6 അക്കം", sub: "Last 6 Digits" },
                        { id: "dob" as StudentPinSourceType, label: "ജനനത്തീയതി", sub: "DOB" },
                        { id: "adm_no" as StudentPinSourceType, label: "അഡ്മിഷൻ നമ്പർ", sub: "Admission No" },
                        { id: "custom_pin" as StudentPinSourceType, label: "കസ്റ്റം PIN", sub: "Custom PIN" }
                      ].map(opt => {
                        const isSel = pinSource === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleUpdatePinSource(opt.id)}
                            className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                              isSel
                                ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                                : "bg-white text-slate-700 border-teal-200 hover:bg-teal-50"
                            }`}
                          >
                            <div className="text-[11px] font-black leading-tight">{opt.label}</div>
                            <div className={`text-[9px] font-bold ${isSel ? "text-teal-100" : "text-teal-600"}`}>{opt.sub}</div>
                          </button>
                        );
                      })}
                    </div>

                    {activeStudentPinInfo?.isFallback && (
                      <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900">
                        ശ്രദ്ധിക്കുക: ഈ കുട്ടിയുടെ പ്രധാന വിവരങ്ങൾ ലഭ്യമല്ലാത്തതിനാൽ പകരം{" "}
                        <span className="underline font-black">{activeStudentPinInfo.fallbackReasonMalayalam}</span>{" "}
                        ഉപയോഗിച്ച് പ്രവേശിക്കാം.
                      </div>
                    )}

                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                        <span>
                          {effectivePinSource === "aadhaar_last6"
                            ? "കുട്ടിയുടെ ആധാർ നമ്പറിന്റെ അവസാന 6 അക്കം നൽകുക:"
                            : effectivePinSource === "dob"
                            ? "കുട്ടിയുടെ ജനനത്തീയതി (DOB - DD/MM/YYYY) നൽകുക:"
                            : effectivePinSource === "adm_no"
                            ? "കുട്ടിയുടെ അഡ്മിഷൻ നമ്പർ (Admission No) നൽകുക:"
                            : effectivePinSource === "custom_pin"
                            ? "കുട്ടിയുടെ കസ്റ്റം സെക്യൂരിറ്റി PIN നൽകുക:"
                            : "കുട്ടിയുടെ ആധാർ നമ്പറിന്റെ അവസാന 4 അക്കം നൽകുക:"}
                        </span>
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {effectivePinSource === "dob" ? (
                          <div className="flex-1 flex flex-col sm:flex-row gap-1.5">
                            <input
                              type="text"
                              value={enteredPin}
                              onChange={e => setEnteredPin(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter") handleVerifyParentSignIn();
                              }}
                              placeholder="DD/MM/YYYY (ഉദാ: 05/05/2015)"
                              className="flex-1 p-2.5 rounded-xl border border-teal-300 bg-white text-xs font-mono font-bold text-center tracking-wider focus:border-teal-600 outline-none"
                            />
                            <input
                              type="date"
                              value={toDobDateInputValue(enteredPin)}
                              onChange={e => {
                                if (e.target.value) {
                                  setEnteredPin(formatDobReadable(e.target.value));
                                }
                              }}
                              className="px-2.5 py-2 rounded-xl border border-teal-300 bg-white text-xs font-bold text-slate-700 focus:border-teal-600 outline-none cursor-pointer"
                              title="കലണ്ടറിൽ നിന്ന് തിരഞ്ഞെടുക്കുക"
                            />
                          </div>
                        ) : (
                          <input
                            type="text"
                            inputMode={effectivePinSource === "adm_no" || effectivePinSource === "custom_pin" ? "text" : "numeric"}
                            value={enteredPin}
                            onChange={e => setEnteredPin(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") handleVerifyParentSignIn();
                            }}
                            placeholder={
                              effectivePinSource === "aadhaar_last6"
                                ? "ആധാർ അവസാന 6 അക്കം..."
                                : effectivePinSource === "adm_no"
                                ? "അഡ്മിഷൻ നമ്പർ..."
                                : effectivePinSource === "custom_pin"
                                ? "കസ്റ്റം PIN..."
                                : "ആധാർ അവസാന 4 അക്കം..."
                            }
                            className="flex-1 p-2.5 rounded-xl border border-teal-300 bg-white text-xs font-mono font-bold text-center tracking-widest focus:border-teal-600 outline-none"
                          />
                        )}
                        <button
                          type="button"
                          onClick={handleVerifyParentSignIn}
                          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>സൈൻ-ഇൻ (Verify PIN)</span>
                        </button>
                      </div>
                      {pinError && (
                        <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{pinError}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2 & 3: QUESTIONS AND SUBMIT (SHOWN AFTER PIN VERIFICATION) */}
            {(!selectedStudentId || isParentUnlocked) && (
              <>
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-teal-800 font-black text-xs uppercase tracking-wider">
                      <span className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-[10px]">2</span>
                      <span>ചോദ്യങ്ങൾക്കുള്ള ഉത്തരങ്ങൾ നൽകുക</span>
                    </div>
                    <span className="text-[11px] text-slate-400">സത്യസന്ധമായി രേഖപ്പെടുത്തുക</span>
                  </div>

                  <div className="space-y-3">
                    {parentQuestions.map((q, idx) => {
                      const currentScore = scores[q.id] || 0;
                      return (
                        <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-teal-700 font-mono">ചോദ്യം {idx + 1}</span>
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900">{q.titleMl}</h4>
                              {q.descriptionMl && (
                                <p className="text-[11px] text-slate-500 mt-0.5">{q.descriptionMl}</p>
                              )}
                            </div>
                            <span className="text-xs font-mono font-bold text-teal-700 shrink-0">
                              {currentScore}/{q.maxPoints} pt
                            </span>
                          </div>

                          {renderQuestionInputWidget(
                            q,
                            currentScore,
                            (val) => setScores(prev => ({ ...prev, [q.id]: val })),
                            false
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 3: PARENT DECLARATION (MANDATORY) */}
                <div className="bg-teal-50 rounded-3xl p-5 border border-teal-200 shadow-xs space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={declarationAccepted}
                      onChange={e => setDeclarationAccepted(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded text-teal-600 accent-teal-600 cursor-pointer shrink-0"
                    />
                    <div className="space-y-1">
                      <span className="font-black text-xs sm:text-sm text-teal-950 leading-relaxed block">
                        "ഞാൻ കുട്ടിയുടെ രക്ഷിതാവാണ്. ഞാൻ മാർക്ക് നൽകുന്നത് എന്റെ സത്യസന്ധമായ വിലയിരുത്തലിന് ശേഷം മാത്രമാണെന്ന് സാക്ഷ്യപ്പെടുത്തുന്നു."
                      </span>
                      <span className="text-[11px] text-teal-800/80 block">
                        (True Parent Verification & Honest Evaluation Declaration)
                      </span>
                    </div>
                  </label>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmitting || !declarationAccepted || !selectedStudentId}
                  className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-black text-sm rounded-2xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "സമർപ്പിക്കുന്നു..." : "വിലയിരുത്തൽ സമർപ്പിക്കുക"}</span>
                </button>
              </>
            )}
          </form>
        )}

        {/* FOOTER */}
        <div className="text-center text-[11px] text-slate-400">
          Powered by Madrasa Seating & Evaluation Suite • Secure Cloud Evaluation
        </div>

      </div>
    </div>
  );
}
