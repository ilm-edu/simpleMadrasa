import React from "react";
import { ExamHall, HallAllocation, Student } from "../types";

interface PrintableQpDistributionSheetProps {
  madrasaName: string;
  madrasaRegNo: string;
  madrasaPlace: string;
  examTitle?: string;
  academicYear?: string;
  halls: ExamHall[];
  allocations: HallAllocation[];
  workspaceStudents: Student[];
  selectedClass?: string;
  selectedDivision?: string;
  selectedHall?: string;
  selectedShift?: string;
  classShiftMap?: Record<string, string>;
  isPreview?: boolean;
}

export default function PrintableQpDistributionSheet({
  madrasaName,
  madrasaRegNo,
  madrasaPlace,
  examTitle = "പരീക്ഷാ ഫലം / Examination",
  academicYear = "2025-2026",
  halls,
  allocations,
  workspaceStudents,
  selectedClass = "All",
  selectedDivision = "All",
  selectedHall = "All",
  selectedShift = "All",
  classShiftMap = {},
  isPreview = false,
}: PrintableQpDistributionSheetProps) {

  const getStudentGender = (studentId?: string, admNo?: string, fallbackGender?: string) => {
    const ws = workspaceStudents.find(
      s => (studentId && s.id === studentId) || (admNo && String(s.admissionNumber || "").trim() === String(admNo).trim())
    );
    const g = (ws?.gender || fallbackGender || "Male").trim();
    return /^female|പെൺ/i.test(g) ? "Female" : "Male";
  };

  const getStudentDiv = (studentId?: string, admNo?: string, fallbackDiv?: string) => {
    const ws = workspaceStudents.find(
      s => (studentId && s.id === studentId) || (admNo && String(s.admissionNumber || "").trim() === String(admNo).trim())
    );
    return (ws?.division || fallbackDiv || "A").trim().toUpperCase();
  };

  // Group seating allocations by hall
  const hallDataMap: Record<
    string,
    {
      hallName: string;
      hallId: string;
      shift: string;
      classesMap: Record<string, { boys: number; girls: number; total: number }>;
      totalBoys: number;
      totalGirls: number;
      grandTotal: number;
    }
  > = {};

  allocations.forEach(alloc => {
    if (selectedHall !== "All" && alloc.hallId !== selectedHall) return;
    if (selectedShift !== "All" && alloc.shift !== selectedShift) return;

    if (!hallDataMap[alloc.hallId]) {
      hallDataMap[alloc.hallId] = {
        hallName: alloc.hallName,
        hallId: alloc.hallId,
        shift: alloc.shift || "Shift 1",
        classesMap: {},
        totalBoys: 0,
        totalGirls: 0,
        grandTotal: 0,
      };
    }

    const currentHallData = hallDataMap[alloc.hallId];

    alloc.benches.forEach(benchRow => {
      benchRow.forEach(seat => {
        if (!seat.studentId) return;

        const stClass = (seat.studentClass || "").trim();
        if (!stClass) return;

        if (selectedClass !== "All" && stClass.toLowerCase() !== selectedClass.toLowerCase()) return;

        const stDiv = getStudentDiv(seat.studentId, seat.studentAdmissionNo, seat.studentDivision);
        if (selectedDivision !== "All" && stDiv !== selectedDivision.toUpperCase()) return;

        const gender = getStudentGender(seat.studentId, seat.studentAdmissionNo, seat.studentGender);

        const classKey = `${stClass} (${stDiv})`;

        if (!currentHallData.classesMap[classKey]) {
          currentHallData.classesMap[classKey] = { boys: 0, girls: 0, total: 0 };
        }

        if (gender === "Male") {
          currentHallData.classesMap[classKey].boys++;
          currentHallData.totalBoys++;
        } else {
          currentHallData.classesMap[classKey].girls++;
          currentHallData.totalGirls++;
        }

        currentHallData.classesMap[classKey].total++;
        currentHallData.grandTotal++;
      });
    });
  });

  const activeHallsList = Object.values(hallDataMap).filter(h => h.grandTotal > 0);

  // Calculate Overall Madrasa QP Totals
  const overallClassTotals: Record<string, { boys: number; girls: number; total: number }> = {};
  let overallBoys = 0;
  let overallGirls = 0;
  let overallTotal = 0;

  activeHallsList.forEach(hData => {
    Object.entries(hData.classesMap).forEach(([classKey, counts]) => {
      if (!overallClassTotals[classKey]) {
        overallClassTotals[classKey] = { boys: 0, girls: 0, total: 0 };
      }
      overallClassTotals[classKey].boys += counts.boys;
      overallClassTotals[classKey].girls += counts.girls;
      overallClassTotals[classKey].total += counts.total;

      overallBoys += counts.boys;
      overallGirls += counts.girls;
      overallTotal += counts.total;
    });
  });

  return (
    <div
      className={
        isPreview
          ? "p-6 bg-white text-black text-xs font-sans w-full space-y-8"
          : "absolute -left-[9999px] top-0 print:block print:relative p-6 bg-white text-black text-xs font-sans space-y-8"
      }
    >
      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: MASTER CONSOLIDATED QUESTION PAPER PACKET SUMMARY */}
      {/* ------------------------------------------------------------- */}
      <div className="page-break-after break-after-page border border-black p-5 rounded-sm">
        {/* Madrasa Header */}
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">{madrasaName}</h1>
          <div className="flex justify-between items-center text-[10px] font-mono mt-0.5 px-2">
            <span>Reg No: {madrasaRegNo || "—"}</span>
            <span>{madrasaPlace || "—"}</span>
          </div>
          <div className="mt-2 inline-block bg-black text-white px-3 py-1 text-xs font-black uppercase tracking-wider">
            ചോദ്യപേപ്പർ ഹാളുകൾ തിരിച്ചുള്ള വിതരണ രജിസ്റ്റർ (QUESTION PAPER HALL DISTRIBUTION SUMMARY)
          </div>
          <p className="text-[11px] font-bold mt-1">
            {examTitle} • അധ്യയന വർഷം: {academicYear}
          </p>
        </div>

        {/* Master Summary Table */}
        <div className="mb-4">
          <h2 className="text-xs font-black uppercase tracking-wide mb-2 flex items-center justify-between">
            <span>🏛️ 1. ഹാൾ തിരിച്ചുള്ള ചോദ്യപേപ്പർ വിതരണ മാസ്റ്റർ സമറി (Consolidated Office Master Sheet)</span>
            <span className="text-[10px] font-mono">
              ആകെ ഹാളുകൾ: {activeHallsList.length} | ആകെ പരീക്ഷാർത്ഥികൾ: {overallTotal} (👦 {overallBoys}, 👧 {overallGirls})
            </span>
          </h2>

          <table className="w-full border-collapse border border-black text-[10.5px]">
            <thead>
              <tr className="bg-gray-200 text-black font-black uppercase">
                <th className="border border-black p-1.5 text-center w-8">#</th>
                <th className="border border-black p-1.5 text-left">ഹാളിന്റെ പേര് (Exam Hall)</th>
                <th className="border border-black p-1.5 text-left">ക്ലാസ് & ഡിവിഷൻ (Class & Div)</th>
                <th className="border border-black p-1.5 text-center w-16 bg-blue-50">👦 ആൺ</th>
                <th className="border border-black p-1.5 text-center w-16 bg-pink-50">👧 പെൺ</th>
                <th className="border border-black p-1.5 text-center w-20 bg-gray-300">ആകെ QP എണ്ണം</th>
                <th className="border border-black p-1.5 text-center w-28">ഹാൾ ഇൻ-ചാർജ് ഒപ്പ്</th>
              </tr>
            </thead>
            <tbody>
              {activeHallsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-black p-4 text-center text-slate-500 italic">
                    ഈ ഫിൽട്ടറുകൾക്ക് അനുയോജ്യമായ സീറ്റിംഗ് ക്രമീകരണങ്ങൾ ലഭ്യമല്ല.
                  </td>
                </tr>
              ) : (
                activeHallsList.map((hData, hIdx) => {
                  const classEntries = Object.entries(hData.classesMap);
                  return classEntries.map(([clsKey, counts], cIdx) => (
                    <tr key={`${hData.hallId}-${clsKey}`} className="hover:bg-slate-50">
                      {cIdx === 0 && (
                        <td
                          rowSpan={classEntries.length}
                          className="border border-black p-1.5 text-center font-mono font-bold align-middle bg-slate-50"
                        >
                          {hIdx + 1}
                        </td>
                      )}
                      {cIdx === 0 && (
                        <td
                          rowSpan={classEntries.length}
                          className="border border-black p-1.5 font-black align-middle text-xs bg-slate-50"
                        >
                          <div>{hData.hallName}</div>
                          <span className="text-[9px] font-mono font-normal text-slate-600 block mt-0.5">
                            {hData.shift} • ആകെ: {hData.grandTotal} QP
                          </span>
                        </td>
                      )}
                      <td className="border border-black p-1.5 font-bold">{clsKey}</td>
                      <td className="border border-black p-1.5 text-center font-mono bg-blue-50/50 font-bold">
                        {counts.boys}
                      </td>
                      <td className="border border-black p-1.5 text-center font-mono bg-pink-50/50 font-bold">
                        {counts.girls}
                      </td>
                      <td className="border border-black p-1.5 text-center font-mono font-black text-xs bg-gray-100">
                        {counts.total}
                      </td>
                      {cIdx === 0 && (
                        <td
                          rowSpan={classEntries.length}
                          className="border border-black p-1.5 text-center align-middle font-mono text-[9px] text-slate-400"
                        >
                          ...................
                        </td>
                      )}
                    </tr>
                  ));
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-black text-white font-black text-xs">
                <td colSpan={3} className="border border-black p-2 text-right uppercase">
                  ആകെ മൊത്തം ആവശ്യമായ ചോദ്യപേപ്പറുകൾ (Grand Total QP Count):
                </td>
                <td className="border border-black p-2 text-center font-mono">{overallBoys}</td>
                <td className="border border-black p-2 text-center font-mono">{overallGirls}</td>
                <td className="border border-black p-2 text-center font-mono text-sm bg-yellow-300 text-black">
                  {overallTotal} QPs
                </td>
                <td className="border border-black p-2 text-center font-mono text-[9px] font-normal text-slate-300">
                  Verified & Ready
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Overall Class-wise Requirements Summary Card */}
        <div className="border border-black p-3 bg-slate-50 mt-4">
          <h3 className="text-[11px] font-black uppercase mb-1.5">
            📊 ക്ലാസ്സ് തിരിച്ചുള്ള ആകെ ചോദ്യപേപ്പർ ആവശ്യകത (Total Question Papers Required Per Class):
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
            {Object.entries(overallClassTotals).map(([clsName, counts]) => (
              <div key={clsName} className="border border-black/30 p-1.5 bg-white rounded-xs">
                <div className="font-extrabold text-slate-900 border-b border-black/20 pb-0.5">{clsName}</div>
                <div className="flex justify-between font-mono mt-1 text-[9.5px]">
                  <span>👦 {counts.boys}</span>
                  <span>👧 {counts.girls}</span>
                  <span className="font-black text-black">ആകെ: {counts.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end mt-8 pt-4 text-[11px] font-bold">
          <div className="text-center">
            <div className="border-t border-black w-44 pt-1">ചോദ്യപേപ്പർ പാക്കിംഗ് ചുമതലക്കാരൻ</div>
          </div>
          <div className="text-center">
            <div className="border-t border-black w-44 pt-1">പരീക്ഷാ കൺവീനർ / സദർ മുഅല്ലിം</div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: INDIVIDUAL ROOM SLIPS (FOR ROOM SUPERINTENDENTS)  */}
      {/* ------------------------------------------------------------- */}
      {activeHallsList.map((hData, hIdx) => {
        const classEntries = Object.entries(hData.classesMap);

        return (
          <div
            key={`slip-${hData.hallId}-${hIdx}`}
            className="page-break-after break-after-page border-2 border-black p-6 rounded-sm bg-white"
          >
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-2 mb-4">
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight">{madrasaName}</h1>
              <div className="flex justify-between text-[9px] font-mono mt-0.5">
                <span>Reg No: {madrasaRegNo || "—"}</span>
                <span>{madrasaPlace || "—"}</span>
              </div>
              <div className="mt-1.5 bg-black text-white py-1 px-4 text-xs font-black uppercase tracking-wider inline-block">
                പരീക്ഷാ ഹാൾ ചോദ്യപേപ്പർ വിതരണ സ്ലിപ്പ് (INVIGILATOR QP PACKET SLIP)
              </div>
            </div>

            {/* Hall Details Banner */}
            <div className="grid grid-cols-3 gap-2 bg-slate-100 border border-black p-2 mb-4 text-center font-bold text-xs">
              <div>
                <span className="text-[9px] text-slate-500 uppercase block font-mono">Exam Hall</span>
                <span className="text-sm font-black text-slate-900">{hData.hallName}</span>
              </div>
              <div className="border-x border-black/30">
                <span className="text-[9px] text-slate-500 uppercase block font-mono">Shift</span>
                <span className="text-xs font-black text-slate-900">{hData.shift}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase block font-mono">Total Candidates</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  {hData.grandTotal} (👦 {hData.totalBoys}, 👧 {hData.totalGirls})
                </span>
              </div>
            </div>

            {/* Table of Class-wise Breakdown for this Hall */}
            <div className="mb-4">
              <h3 className="text-xs font-black uppercase mb-1.5">
                📋 ഈ ഹാളിൽ പരീക്ഷയെഴുതുന്ന ക്ലാസ്സുകളും ആവശ്യമുള്ള ചോദ്യപേപ്പറുകളും:
              </h3>
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-gray-200 text-black font-black uppercase text-[10px]">
                    <th className="border border-black p-2 text-center w-10">Sl</th>
                    <th className="border border-black p-2 text-left">ക്ലാസ്സ് & ഡിവിഷൻ (Class & Div)</th>
                    <th className="border border-black p-2 text-center w-20 bg-blue-50">👦 ആൺകുട്ടികൾ</th>
                    <th className="border border-black p-2 text-center w-20 bg-pink-50">👧 പെൺകുട്ടികൾ</th>
                    <th className="border border-black p-2 text-center w-28 bg-gray-300">ആകെ ചോദ്യപേപ്പറുകൾ</th>
                  </tr>
                </thead>
                <tbody>
                  {classEntries.map(([clsKey, counts], cIdx) => (
                    <tr key={clsKey} className="hover:bg-slate-50">
                      <td className="border border-black p-2 text-center font-mono font-bold">{cIdx + 1}</td>
                      <td className="border border-black p-2 font-black text-sm">{clsKey}</td>
                      <td className="border border-black p-2 text-center font-mono font-bold bg-blue-50/50">
                        {counts.boys}
                      </td>
                      <td className="border border-black p-2 text-center font-mono font-bold bg-pink-50/50">
                        {counts.girls}
                      </td>
                      <td className="border border-black p-2 text-center font-mono font-black text-sm bg-gray-100">
                        {counts.total} QPs
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-black text-white font-black text-xs">
                    <td colSpan={2} className="border border-black p-2 text-right uppercase">
                      ഈ ഹാളിലേക്ക് നൽകിയ ആകെ ചോദ്യപേപ്പറുകൾ:
                    </td>
                    <td className="border border-black p-2 text-center font-mono">{hData.totalBoys}</td>
                    <td className="border border-black p-2 text-center font-mono">{hData.totalGirls}</td>
                    <td className="border border-black p-2 text-center font-mono text-sm bg-yellow-300 text-black">
                      {hData.grandTotal} QPs
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Room Invigilator Verification Checklist Box */}
            <div className="border border-black p-3 bg-slate-50 text-[11px] space-y-2 mb-6">
              <div className="font-extrabold uppercase border-b border-black/30 pb-1 text-slate-900">
                ✅ ഇൻവിജിലേറ്റർ പരിശോധിച്ച് ഉറപ്പുവരുത്തേണ്ട വിവരങ്ങൾ (Invigilator Verification Checklist):
              </div>
              <div className="grid grid-cols-2 gap-2 font-bold text-[10.5px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border border-black bg-white shrink-0"></div>
                  <span>ചോദ്യപേപ്പർ പാക്കറ്റ് സീൽ ചെയ്ത അവസ്ഥയിൽ ലഭിച്ചു</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border border-black bg-white shrink-0"></div>
                  <span>കുട്ടികളുടെ എണ്ണത്തിന് അനുസരിച്ചുള്ള QP കൃത്യമാണ്</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border border-black bg-white shrink-0"></div>
                  <span>പരീക്ഷ ആരംഭിക്കുന്നതിന് 5 മിനിറ്റ് മുൻപ് വിതരണം ചെയ്തു</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 border border-black bg-white shrink-0"></div>
                  <span>ബാക്കി വന്ന ചോദ്യപേപ്പറുകൾ ഓഫീസിൽ തിരികെ നൽകി</span>
                </div>
              </div>
            </div>

            {/* Invigilator Endorsement & Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-black text-[11px] font-bold">
              <div>
                <p className="uppercase text-[10px] text-slate-600 mb-6">ക്ലാസ്സ് ഇൻവിജിലേറ്ററുടെ ഒപ്പ് (Invigilator Signature):</p>
                <div className="border-b border-black w-full"></div>
                <p className="text-[9px] font-mono text-slate-500 mt-1">Name: ______________________</p>
              </div>
              <div className="text-right">
                <p className="uppercase text-[10px] text-slate-600 mb-6">ചീഫ് സൂപ്രണ്ട് ഒപ്പ് & സീൽ (Chief Superintendent):</p>
                <div className="border-b border-black w-full"></div>
                <p className="text-[9px] font-mono text-slate-500 mt-1">Verified & Handed Over</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
