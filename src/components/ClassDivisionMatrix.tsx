import React, { useState, useMemo } from "react";
import { 
  Building2, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  GraduationCap, 
  Search, 
  Sparkles,
  ArrowRight,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";
import { Student, ExamHall, SeatingResult } from "../types";

interface ClassDivisionMatrixProps {
  studentsWithMappedShifts: Student[];
  halls: ExamHall[];
  seatingResult: SeatingResult | null;
  activeShift: "Shift 1" | "Shift 2" | "Shift 3";
  setActiveShift: (shift: "Shift 1" | "Shift 2" | "Shift 3") => void;
  shiftsCount: number;
  lang: "en" | "ml";
  madrasaName: string;
  madrasaRegNo?: string;
  madrasaPlace?: string;
  getClassColor: (cl: string | null | undefined) => { bg: string; text: string; border: string; pill: string; dot: string };
  onNavigateToHalls: () => void;
}

export const ClassDivisionMatrix: React.FC<ClassDivisionMatrixProps> = ({
  studentsWithMappedShifts,
  halls,
  seatingResult,
  activeShift,
  setActiveShift,
  shiftsCount,
  lang,
  madrasaName,
  madrasaRegNo,
  madrasaPlace,
  getClassColor,
  onNavigateToHalls,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnallocatedCohort, setSelectedUnallocatedCohort] = useState<string | null>(null);

  // Filter students for the active shift
  const shiftStudents = useMemo(() => {
    return studentsWithMappedShifts.filter((s) => s.shift === activeShift);
  }, [studentsWithMappedShifts, activeShift]);

  // Extract all unique cohorts (Class + Division) naturally sorted
  const cohorts = useMemo(() => {
    const map = new Map<string, { classLevel: string; division: string; students: Student[] }>();

    shiftStudents.forEach((s) => {
      const cl = s.classLevel || "Class 1";
      const div = s.division || "A";
      const key = `${cl}__${div}`;
      if (!map.has(key)) {
        map.set(key, { classLevel: cl, division: div, students: [] });
      }
      map.get(key)!.students.push(s);
    });

    const list = Array.from(map.entries()).map(([key, data]) => ({
      key,
      classLevel: data.classLevel,
      division: data.division,
      students: data.students,
    }));

    return list.sort((a, b) => {
      const numA = parseInt(String(a.classLevel).replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(String(b.classLevel).replace(/\D/g, ""), 10) || 0;
      if (numA !== numB) return numA - numB;
      return a.division.localeCompare(b.division);
    });
  }, [shiftStudents]);

  // Available halls in active shift's seating result (deduplicated by hallId)
  const allocationHalls = useMemo(() => {
    if (!seatingResult || !seatingResult.allocations) return [];
    const seen = new Set<string>();
    const res: { hallId: string; hallName: string; totalStudents: number; benches: any[] }[] = [];
    seatingResult.allocations.forEach((a) => {
      if (!seen.has(a.hallId)) {
        seen.add(a.hallId);
        res.push({
          hallId: a.hallId,
          hallName: a.hallName,
          totalStudents: a.totalStudents,
          benches: a.benches,
        });
      }
    });
    return res;
  }, [seatingResult]);

  // Build matrix rows
  const matrixData = useMemo(() => {
    const rows = cohorts.map((c) => {
      const totalStudents = c.students.length;
      const hallCounts: Record<string, number> = {};
      let totalSeated = 0;

      allocationHalls.forEach((hall) => {
        let countInHall = 0;
        hall.benches.forEach((row) => {
          row.forEach((seat) => {
            if (
              seat.studentId &&
              seat.studentClass === c.classLevel &&
              (seat.studentDivision || "A") === c.division
            ) {
              countInHall++;
            }
          });
        });
        hallCounts[hall.hallId] = countInHall;
        totalSeated += countInHall;
      });

      const unallocatedCount = Math.max(0, totalStudents - totalSeated);

      // Find the specific unallocated student objects
      const seatedStudentIds = new Set<string>();
      allocationHalls.forEach((hall) => {
        hall.benches.forEach((row) => {
          row.forEach((seat) => {
            if (seat.studentId) seatedStudentIds.add(seat.studentId);
          });
        });
      });

      const unallocatedList = c.students.filter((st) => !seatedStudentIds.has(st.id));

      return {
        key: c.key,
        classLevel: c.classLevel,
        division: c.division,
        totalStudents,
        hallCounts,
        totalSeated,
        unallocatedCount,
        unallocatedList,
      };
    });

    if (!searchQuery.trim()) return rows;

    const query = searchQuery.toLowerCase().trim();
    return rows.filter(
      (r) =>
        r.classLevel.toLowerCase().includes(query) ||
        r.division.toLowerCase().includes(query) ||
        `${r.classLevel}-${r.division}`.toLowerCase().includes(query)
    );
  }, [cohorts, allocationHalls, searchQuery]);

  // Overall totals
  const overallStats = useMemo(() => {
    const totalStudents = shiftStudents.length;
    const totalSeated = matrixData.reduce((acc, r) => acc + r.totalSeated, 0);
    const totalUnallocated = matrixData.reduce((acc, r) => acc + r.unallocatedCount, 0);
    const hallTotals: Record<string, number> = {};

    allocationHalls.forEach((h) => {
      hallTotals[h.hallId] = matrixData.reduce((acc, r) => acc + (r.hallCounts[h.hallId] || 0), 0);
    });

    return {
      totalStudents,
      totalSeated,
      totalUnallocated,
      hallTotals,
    };
  }, [shiftStudents, matrixData, allocationHalls]);

  // Direct print trigger for Class Matrix
  const handlePrintMatrix = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Metrics Bar (Hidden during Print) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-2xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-extrabold text-slate-900 text-base sm:text-lg">
                  {lang === "ml"
                    ? "ക്ലാസ്സ് & ഡിവിഷൻ തിരിച്ചുള്ള വിന്യാസ മാട്രിക്സ്"
                    : "Class & Division Seating Distribution Matrix"}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-2xs font-black font-mono">
                  {activeShift}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === "ml"
                  ? "ഓരോ ക്ലാസിലെയും കുട്ടികൾ ഏതൊക്കെ ഹാളുകളിലായി വിന്യസിക്കപ്പെട്ടു എന്നും, ആർക്കെങ്കിലും സീറ്റ് ലഭിക്കാതിരുന്നിട്ടുണ്ടോ എന്നും ഒറ്റനോട്ടത്തിൽ കണ്ടെത്തുക."
                  : "Monitor student distribution across examination halls by class and division, and identify unseated candidates instantly."}
              </p>
            </div>
          </div>

          {/* Action Buttons: Shift switch & Print */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {shiftsCount > 1 && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveShift("Shift 1")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                    activeShift === "Shift 1"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  {lang === "ml" ? "ഷിഫ്റ്റ് 1" : "Shift 1"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveShift("Shift 2")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                    activeShift === "Shift 2"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  {lang === "ml" ? "ഷിഫ്റ്റ് 2" : "Shift 2"}
                </button>
                {shiftsCount >= 3 && (
                  <button
                    type="button"
                    onClick={() => setActiveShift("Shift 3")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                      activeShift === "Shift 3"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    {lang === "ml" ? "ഷിഫ്റ്റ് 3" : "Shift 3"}
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handlePrintMatrix}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === "ml" ? "മാട്രിക്സ് പ്രിന്റ് ചെയ്യുക" : "Print Matrix"}</span>
            </button>
          </div>
        </div>

        {/* Quick Search & Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "ml" ? "ക്ലാസ്സ് അല്ലെങ്കിൽ ഡിവിഷൻ തിരയുക..." : "Search class or division..."}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition outline-hidden"
            />
          </div>

          <div className="md:col-span-7 flex flex-wrap items-center justify-end gap-2 text-xs">
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
              <span className="text-slate-500">{lang === "ml" ? "ക്ലാസ്സുകൾ:" : "Cohorts:"}</span>
              <span className="font-mono font-black text-slate-900">{matrixData.length}</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
              <span className="text-slate-500">{lang === "ml" ? "ആകെ കുട്ടികൾ:" : "Total Students:"}</span>
              <span className="font-mono font-black text-slate-900">{overallStats.totalStudents}</span>
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === "ml" ? "സീറ്റ് ലഭിച്ചവർ:" : "Seated:"}</span>
              <span className="font-mono font-black">{overallStats.totalSeated}</span>
            </div>
            {overallStats.totalUnallocated > 0 ? (
              <div className="px-3 py-1.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl flex items-center gap-2 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span className="font-black">{lang === "ml" ? "സീറ്റ് ലഭിക്കാത്തവർ:" : "Unallocated:"}</span>
                <span className="font-mono font-black bg-rose-600 text-white px-1.5 py-0.2 rounded text-[11px]">
                  {overallStats.totalUnallocated}
                </span>
              </div>
            ) : (
              <div className="px-3 py-1.5 bg-emerald-100/70 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-1.5 font-bold">
                <span>✓</span>
                <span>{lang === "ml" ? "100% കുട്ടികൾക്കും സീറ്റ് ലഭിച്ചു" : "100% Allocated"}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* UNALLOCATED CRITICAL BANNER (IF ANY) */}
      {overallStats.totalUnallocated > 0 && (
        <div className="bg-rose-50 border-2 border-rose-400 p-4 sm:p-5 rounded-2xl shadow-sm space-y-3 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                ⚠️
              </div>
              <div>
                <h4 className="font-display font-black text-rose-950 text-sm sm:text-base flex items-center gap-2">
                  <span>{lang === "ml" ? "സീറ്റ് ലഭിക്കാത്ത കുട്ടികൾ ഉണ്ട്!" : "Attention: Unallocated Students Found!"}</span>
                  <span className="bg-rose-600 text-white text-xs px-2 py-0.5 rounded-full font-mono">
                    {overallStats.totalUnallocated} {lang === "ml" ? "കുട്ടികൾ" : "Students"}
                  </span>
                </h4>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  {lang === "ml"
                    ? "താഴെ കാണിച്ച ചില ക്ലാസുകളിലെ കുട്ടികൾക്ക് ഹാളുകളിൽ കപ്പാസിറ്റി തികയാത്തതിനാൽ സീറ്റ് ലഭിച്ചിട്ടില്ല. ഹാളുകളുടെ ബെഞ്ചുകൾ വർദ്ധിപ്പിക്കുകയോ പുതിയ ഹാൾ ചേർക്കുകയോ ചെയ്യുക."
                    : "Due to capacity limits, some students below could not be placed. Please increase bench count or add a new hall."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onNavigateToHalls}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{lang === "ml" ? "ഹാൾ കപ്പാസിറ്റി കൂട്ടുക →" : "Expand Hall Capacity →"}</span>
            </button>
          </div>
        </div>
      )}

      {/* OFFICIAL INSTITUTIONAL PRINT HEADER (ONLY VISIBLE DURING PRINT) */}
      <div className="hidden print:block mb-4 pb-3 border-b-2 border-slate-900 text-center">
        <h1 className="text-xl font-display font-black text-slate-950 uppercase tracking-tight">{madrasaName}</h1>
        <p className="text-xs text-slate-700 font-bold mt-0.5">
          {madrasaPlace ? `${madrasaPlace} • ` : ""}{madrasaRegNo ? `Reg No: ${madrasaRegNo} • ` : ""}{activeShift}
        </p>
        <h2 className="text-sm font-black text-slate-900 mt-2 uppercase tracking-wide bg-slate-100 py-1 border-y border-slate-300">
          {lang === "ml" ? "ക്ലാസ്സ് & ഡിവിഷൻ തിരിച്ചുള്ള സീറ്റിംഗ് വിന്യാസ മാട്രിക്സ്" : "Class & Division Seating Distribution Matrix"}
        </h2>
        <div className="flex justify-between items-center text-[10px] text-slate-600 font-mono mt-1.5 px-1">
          <span>{lang === "ml" ? "ആകെ ക്ലാസ്സുകൾ:" : "Total Cohorts:"} {matrixData.length}</span>
          <span>{lang === "ml" ? "ആകെ വിദ്യാർത്ഥികൾ:" : "Total Students:"} {overallStats.totalStudents}</span>
          <span>{lang === "ml" ? "സീറ്റ് ലഭിച്ചവർ:" : "Seated:"} {overallStats.totalSeated}</span>
          <span>{lang === "ml" ? "സീറ്റ് ലഭിക്കാത്തവർ:" : "Unallocated:"} {overallStats.totalUnallocated}</span>
        </div>
      </div>

      {/* THE MASTER MATRIX TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-slate-800 print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-800 text-[11px] font-extrabold tracking-wider">
                <th className="py-3.5 px-4 sticky left-0 z-10 bg-slate-900">
                  {lang === "ml" ? "ക്ലാസ്സ് & ഡിവിഷൻ" : "Class & Division"}
                </th>
                <th className="py-3.5 px-3 text-center">
                  {lang === "ml" ? "ആകെ കുട്ടികൾ" : "Total Students"}
                </th>
                {allocationHalls.map((hall, hIdx) => (
                  <th key={`${hall.hallId}-${hIdx}`} className="py-3.5 px-3 text-center border-l border-slate-800 font-display">
                    <div className="truncate max-w-[120px] mx-auto" title={hall.hallName}>
                      🏛️ {hall.hallName}
                    </div>
                  </th>
                ))}
                <th className="py-3.5 px-3 text-center border-l border-slate-800 bg-slate-800/80">
                  {lang === "ml" ? "ആകെ സീറ്റ് ലഭിച്ചവർ" : "Total Seated"}
                </th>
                <th className="py-3.5 px-3 text-center border-l border-slate-800">
                  {lang === "ml" ? "സീറ്റ് ലഭിക്കാത്തവർ" : "Unallocated"}
                </th>
                <th className="py-3.5 px-4 text-center border-l border-slate-800">
                  {lang === "ml" ? "സ്റ്റാറ്റസ്" : "Allocation Status"}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-slate-800 font-sans">
              {matrixData.map((row) => {
                const color = getClassColor(row.classLevel);
                const isFullySeated = row.unallocatedCount === 0;

                return (
                  <tr
                    key={row.key}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !isFullySeated ? "bg-rose-50/30" : ""
                    }`}
                  >
                    {/* Class & Division Pill */}
                    <td className="py-3 px-4 font-bold sticky left-0 z-10 bg-inherit border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${color.dot} shrink-0 ring-1 ring-slate-300`} />
                        <span className="font-display font-extrabold text-slate-900 text-xs">
                          {row.classLevel}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-black border border-slate-200">
                          Div {row.division}
                        </span>
                      </div>
                    </td>

                    {/* Total students in class */}
                    <td className="py-3 px-3 text-center font-mono font-black text-slate-900">
                      {row.totalStudents}
                    </td>

                    {/* Counts per Hall */}
                    {allocationHalls.map((hall, hIdx) => {
                      const count = row.hallCounts[hall.hallId] || 0;
                      return (
                        <td key={`${hall.hallId}-${hIdx}`} className="py-3 px-3 text-center border-l border-slate-100">
                          {count > 0 ? (
                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg font-mono font-black text-xs shadow-2xs">
                              {count}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Seated */}
                    <td className="py-3 px-3 text-center border-l border-slate-100 bg-slate-50/50 font-mono font-black text-emerald-800 text-xs">
                      {row.totalSeated}
                    </td>

                    {/* Unallocated Count */}
                    <td className="py-3 px-3 text-center border-l border-slate-100 font-mono">
                      {row.unallocatedCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => setSelectedUnallocatedCohort(row.key)}
                          className="inline-flex items-center justify-center min-w-[28px] px-2.5 py-1 bg-rose-600 text-white rounded-lg font-black text-xs shadow-xs hover:bg-rose-700 transition cursor-pointer"
                          title="Click to view unallocated students in this class"
                        >
                          ⚠️ {row.unallocatedCount}
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold text-xs">0</span>
                      )}
                    </td>

                    {/* Status Indicator */}
                    <td className="py-3 px-4 text-center border-l border-slate-100">
                      {isFullySeated ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10.5px]">
                          <span>✓</span>
                          <span>{lang === "ml" ? "100% വിന്യസിച്ചു" : "100% Seated"}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedUnallocatedCohort(row.key)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 hover:bg-rose-200 font-extrabold text-[10.5px] cursor-pointer transition border border-rose-300"
                        >
                          <span>⚠️</span>
                          <span>{lang === "ml" ? `${row.unallocatedCount} പേർക്ക് സീറ്റില്ല` : `${row.unallocatedCount} Unseated`}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Total Summary Row */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-extrabold border-t-2 border-slate-800 text-xs">
                <td className="py-3.5 px-4 sticky left-0 z-10 bg-slate-900 font-display font-black">
                  {lang === "ml" ? "ആകെ (Total All Classes)" : "Total (All Classes)"}
                </td>
                <td className="py-3.5 px-3 text-center font-mono font-black text-amber-300 text-sm">
                  {overallStats.totalStudents}
                </td>
                {allocationHalls.map((hall, hIdx) => (
                  <td key={`${hall.hallId}-${hIdx}`} className="py-3.5 px-3 text-center border-l border-slate-800 font-mono font-black text-emerald-300">
                    {overallStats.hallTotals[hall.hallId] || 0}
                  </td>
                ))}
                <td className="py-3.5 px-3 text-center border-l border-slate-800 bg-slate-800 font-mono font-black text-emerald-400 text-sm">
                  {overallStats.totalSeated}
                </td>
                <td className="py-3.5 px-3 text-center border-l border-slate-800 font-mono font-black text-rose-300">
                  {overallStats.totalUnallocated}
                </td>
                <td className="py-3.5 px-4 text-center border-l border-slate-800 font-mono text-2xs text-slate-300">
                  {overallStats.totalStudents > 0
                    ? `${((overallStats.totalSeated / overallStats.totalStudents) * 100).toFixed(1)}% Seated`
                    : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Helpful Explanation Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 no-print">
          <div className="flex items-center gap-2">
            <span className="text-base shrink-0">💡</span>
            <span>
              {lang === "ml"
                ? "കോപ്പിയടി തടയുന്നതിനായി ഒരേ ക്ലാസിലെ കുട്ടികളെ വ്യത്യസ്ത ഹാളുകളിലായി വിന്യസിച്ചിരിക്കുന്നു (Multi-Hall Dispersion). ഓരോ ഹാളിലെയും എണ്ണം മുകളിൽ കാണാം."
                : "Students of each class are dispersed across multiple halls to prevent malpractice. Click print to generate an official master class allocation matrix."}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-2xs font-bold text-slate-700">{lang === "ml" ? "പൂർണ്ണമായി ഇരിപ്പിടം ലഭിച്ചു" : "Fully Seated"}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block ml-2" />
            <span className="text-2xs font-bold text-rose-700">{lang === "ml" ? "ഇരിപ്പിടം തികയാത്തത്" : "Unallocated"}</span>
          </div>
        </div>
      </div>

      {/* UNALLOCATED STUDENTS MODAL / DRAWER */}
      {selectedUnallocatedCohort && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {(() => {
              const targetRow = matrixData.find((r) => r.key === selectedUnallocatedCohort);
              if (!targetRow) return null;

              return (
                <div>
                  <div className="p-5 bg-gradient-to-r from-rose-900 to-rose-800 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-rose-200 shrink-0">
                        ⚠️
                      </div>
                      <div>
                        <h4 className="font-display font-extrabold text-base">
                          {targetRow.classLevel} - Div {targetRow.division}
                        </h4>
                        <p className="text-2xs text-rose-200">
                          {lang === "ml"
                            ? `സീറ്റ് ലഭിക്കാത്ത കുട്ടികൾ (${targetRow.unallocatedCount} പേർ)`
                            : `Unallocated Students (${targetRow.unallocatedCount})`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUnallocatedCohort(null)}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {lang === "ml"
                        ? "താഴെ പറയുന്ന വിദ്യാർത്ഥികൾക്കാണ് നിലവിലെ ഹാൾ കപ്പാസിറ്റി കുറവായതിനാൽ സീറ്റ് അലോക്കേറ്റ് ചെയ്യാൻ കഴിയാത്തത്:"
                        : "The following students could not be seated due to insufficient hall capacity in this shift:"}
                    </p>

                    <div className="space-y-2">
                      {targetRow.unallocatedList.map((st, idx) => (
                        <div
                          key={st.id || idx}
                          className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-display font-black text-rose-950 block">
                              👤 {st.name}
                            </span>
                            <span className="text-[11px] font-mono text-rose-700">
                              Roll/Adm: {st.admissionNumber || st.id} • {st.gender === "Male" ? (lang === "ml" ? "ആൺ" : "Boy") : (lang === "ml" ? "പെൺ" : "Girl")}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-mono font-bold text-2xs">
                            {st.classLevel} {st.division}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                      <strong className="font-black block">
                        💡 {lang === "ml" ? "എങ്ങനെ പരിഹരിക്കാം?" : "How to solve?"}
                      </strong>
                      <p className="text-[11px] leading-relaxed text-amber-800">
                        {lang === "ml"
                          ? "ഹാളുകൾ ടാബിൽ പോയി ഏതെങ്കിലും ഹാളിലെ ബെഞ്ചുകളുടെ എണ്ണം കൂട്ടുകയോ, പുതിയൊരു ഹാൾ ചേർക്കുകയോ ചെയ്യുക. തുടർന്ന് 'റീ-കാൽക്കുലേറ്റ്' അമർത്തുമ്പോൾ ഇവർക്ക് സ്വയം സീറ്റ് ലഭിക്കും."
                          : "Go to the Halls tab to add more benches or a new hall, then recalculate seating."}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedUnallocatedCohort(null)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      {lang === "ml" ? "അടയ്ക്കുക" : "Close"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUnallocatedCohort(null);
                        onNavigateToHalls();
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{lang === "ml" ? "ഹാൾ ക്രമീകരിക്കുക" : "Manage Halls"}</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
