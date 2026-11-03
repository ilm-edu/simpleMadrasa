import React from "react";
import { MadrasaExamResult, ExamResultSettings, Student } from "../types";
import { getSubjectsForClass } from "../data/subjectDirectory";

interface PrintableMarklistSheetProps {
  madrasaName: string;
  examTitle: string;
  academicYear: string;
  resultsData: MadrasaExamResult;
  workspaceStudents: Student[];
  examSettings: ExamResultSettings;
  isPreview?: boolean;
  selectedClass?: string;
  selectedDivision?: string;
  showAdmissionNo?: boolean;
  orientation?: "portrait" | "landscape";
}

export default function PrintableMarklistSheet({
  madrasaName,
  examTitle,
  academicYear,
  resultsData,
  workspaceStudents,
  examSettings,
  isPreview = false,
  selectedClass = "All",
  selectedDivision = "All",
  showAdmissionNo = true,
  orientation = "portrait",
}: PrintableMarklistSheetProps) {

  const getStudentDetails = (admNo: string, studentId?: string) => {
    return workspaceStudents.find(s => 
      (studentId && s.id === studentId) ||
      (admNo && String(s.admissionNumber || "").trim() === String(admNo).trim())
    );
  };

  const classesList = Object.keys(resultsData?.classes || {}).filter(cls => 
    selectedClass === "All" || cls.trim().toLowerCase() === selectedClass.trim().toLowerCase()
  );

  const isLandscape = orientation === "landscape";

  return (
    <div className={isPreview ? "bg-white text-black text-xs font-sans w-full flex flex-col items-center" : "absolute -left-[9999px] top-0 print:block print:relative bg-white text-black text-xs font-sans w-full"}>
      {/* Inject CSS @page rules for precise A4 print geometry */}
      <style>{`
        @page {
          size: A4 ${orientation};
          margin: 6mm;
        }
        @media print {
          html, body {
            width: ${isLandscape ? "297mm" : "210mm"};
            height: ${isLandscape ? "210mm" : "297mm"};
            background: white !important;
          }
          .marklist-sheet-container {
            width: 100% !important;
            max-width: ${isLandscape ? "285mm" : "198mm"} !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {classesList.map((cls) => {
        const rawStudents = resultsData.classes[cls] || [];
        const subjects = getSubjectsForClass(cls).map(s => s.nameMl);

        // Filter by division if selectedDivision !== "All"
        const students = rawStudents.filter(st => {
          if (selectedDivision === "All") return true;
          const ws = getStudentDetails(st.admissionNumber, st.studentId);
          const div = (ws?.division || (st as any).division || "A").trim();
          return div.toUpperCase() === selectedDivision.toUpperCase();
        });

        if (students.length === 0 && selectedDivision !== "All") return null;

        // Separate and sort Boys and Girls
        const boysList: any[] = [];
        const girlsList: any[] = [];

        students.forEach((st, idx) => {
          const ws = getStudentDetails(st.admissionNumber, st.studentId);
          const gender = (ws?.gender || (st as any).gender || "Female").trim();
          const isMale = /^male|ആൺ/i.test(gender);
          const studentObj = { 
            ...st, 
            _originalIndex: idx, 
            _roll: st.rollNo || ws?.rollNumber || (idx + 1),
            _adm: st.admissionNumber || ws?.admissionNumber || ""
          };
          if (isMale) {
            boysList.push(studentObj);
          } else {
            girlsList.push(studentObj);
          }
        });

        // Sort both by Roll No
        boysList.sort((a, b) => (parseInt(a._roll, 10) || 0) - (parseInt(b._roll, 10) || 0));
        girlsList.sort((a, b) => (parseInt(a._roll, 10) || 0) - (parseInt(b._roll, 10) || 0));

        const boysCount = boysList.length;
        const girlsCount = girlsList.length;
        const totalCount = boysCount + girlsCount;

        // Determine Division label for display
        let displayDiv = selectedDivision !== "All" ? selectedDivision : "";
        if (!displayDiv && students.length > 0) {
          const firstDiv = (getStudentDetails(students[0].admissionNumber, students[0].studentId)?.division || (students[0] as any).division || "").trim();
          if (firstDiv && students.every(st => {
            const d = (getStudentDetails(st.admissionNumber, st.studentId)?.division || (st as any).division || "").trim();
            return d.toUpperCase() === firstDiv.toUpperCase();
          })) {
            displayDiv = firstDiv;
          }
        }
        const classAndDivLabel = displayDiv ? `${cls} - Div ${displayDiv.toUpperCase()}` : cls;

        // Dynamic scaling calculations based on total student count & subject count to guarantee 1-page fit without right margin overflow
        const isCompact = totalCount > 14 || subjects.length > 6;
        const isUltraCompact = totalCount > 24 || subjects.length > 8;

        // Row padding & text size classes
        const cellPadding = isUltraCompact
          ? "px-0.5 py-0.5"
          : isCompact
          ? "px-0.8 py-0.5"
          : "px-1 py-1";

        const tableTextSize = isUltraCompact
          ? "text-[7.5px] leading-tight"
          : isCompact
          ? "text-[8px] leading-tight"
          : "text-[9px] leading-snug";

        const headerPadding = isUltraCompact ? "pb-1 mb-2" : isCompact ? "pb-1.5 mb-2.5" : "pb-3 mb-4";
        const titleFontSize = isUltraCompact ? "text-base font-black" : isCompact ? "text-lg font-black" : "text-xl font-black";

        // Subject area available percentage calculation
        const subjectAreaWidthPct = isLandscape ? 48 : 42;
        const perSubjectWidthPct = subjects.length > 0 ? (subjectAreaWidthPct / subjects.length) : 8;

        return (
          <div 
            key={cls} 
            className={`marklist-sheet-container bg-white text-slate-900 border border-slate-300 print:border-none p-3 sm:p-5 rounded-xl shadow-xs print:shadow-none mb-8 page-break-after break-after-page box-sizing-border overflow-hidden ${
              isLandscape ? "max-w-[285mm] w-full" : "max-w-[198mm] w-full"
            }`}
            style={{ pageBreakAfter: "always", breakAfter: "page" }}
          >
            {/* Header */}
            <div className={`text-center border-b-2 border-black ${headerPadding}`}>
              <h1 className={`${titleFontSize} uppercase tracking-tight font-display`}>{madrasaName}</h1>
              <h2 className="text-xs sm:text-sm font-extrabold mt-0.5 font-display">
                {examTitle} — {classAndDivLabel} (മാർക്ക് ലിസ്റ്റ് / Mark List)
              </h2>
              <p className="text-[10px] font-mono mt-0.5 text-slate-700">
                അധ്യയന വർഷം (Academic Year): {academicYear}
              </p>
            </div>

            {/* Mark List Table with strict table-fixed layout to prevent horizontal overflow past page margin */}
            <div className="w-full overflow-hidden">
              <table className={`w-full table-fixed border-collapse border border-black ${tableTextSize} align-middle`}>
                <thead>
                  <tr className="bg-slate-200 text-black font-black uppercase text-center">
                    <th className={`border border-black ${cellPadding}`} style={{ width: "4%" }}>റോൾ</th>
                    {showAdmissionNo && <th className={`border border-black ${cellPadding}`} style={{ width: "6%" }}>അഡ്മിഷൻ</th>}
                    <th className={`border border-black ${cellPadding} text-left truncate`} style={{ width: showAdmissionNo ? (isLandscape ? "20%" : "17%") : (isLandscape ? "24%" : "21%") }}>
                      വിദ്യാർത്ഥിയുടെ പേര് (Student Name)
                    </th>
                    <th className={`border border-black ${cellPadding}`} style={{ width: "5%" }}>ഹാജർ</th>
                    
                    {/* Render subject columns with compact auto-wrapping text and fixed percentage width */}
                    {subjects.map((sub, sIdx) => {
                      const cleanSub = sub.replace(/\(.*\)/, "").trim();
                      return (
                        <th 
                          key={sIdx} 
                          className={`border border-black ${cellPadding} text-center font-bold break-words hyphens-auto leading-[1.05]`}
                          style={{ width: `${perSubjectWidthPct}%` }}
                        >
                          {cleanSub}
                        </th>
                      );
                    })}
                    
                    <th className={`border border-black ${cellPadding} font-black`} style={{ width: "6%" }}>ആകെ</th>
                    <th className={`border border-black ${cellPadding}`} style={{ width: "5%" }}>റാങ്ക്</th>
                    <th className={`border border-black ${cellPadding}`} style={{ width: "6%" }}>ഫലം</th>
                    <th className={`border border-black ${cellPadding}`} style={{ width: "8%" }}>റിമാർക്സ്</th>
                  </tr>
                </thead>
                <tbody>
                  {/* BOYS SECTION */}
                  <tr className="bg-slate-100 font-black">
                    <td 
                      colSpan={(showAdmissionNo ? 3 : 2) + subjects.length + 5} 
                      className={`border border-black ${cellPadding} text-slate-900 uppercase`}
                    >
                      👦 ആൺകുട്ടികൾ (Boys Section - Total: {boysCount})
                    </td>
                  </tr>
                  {boysList.length === 0 ? (
                    <tr>
                      <td 
                        colSpan={(showAdmissionNo ? 3 : 2) + subjects.length + 5} 
                        className={`border border-black ${cellPadding} text-center text-slate-400 italic`}
                      >
                        ആൺകുട്ടികൾ ലഭ്യമല്ല
                      </td>
                    </tr>
                  ) : (
                    boysList.map((st, bIdx) => {
                      const ws = getStudentDetails(st.admissionNumber, st.studentId);
                      return (
                        <tr key={`boy-${st.studentId || st.admissionNumber}-${bIdx}`} className="hover:bg-slate-50">
                          <td className={`border border-black ${cellPadding} text-center font-mono font-bold`}>
                            {st.rollNo || ws?.rollNumber || bIdx + 1}
                          </td>
                          {showAdmissionNo && (
                            <td className={`border border-black ${cellPadding} text-center font-mono`}>
                              {st._adm || st.admissionNumber || ws?.admissionNumber || ""}
                            </td>
                          )}
                          <td className={`border border-black ${cellPadding} font-bold text-slate-900 truncate`}>
                            {st.name || ws?.name}
                          </td>
                          <td className={`border border-black ${cellPadding} text-center font-mono`}></td>
                          {subjects.map((sub, sIdx) => {
                            const mark = st.subjectMarks?.[sub];
                            return (
                              <td key={sIdx} className={`border border-black ${cellPadding} text-center font-mono font-bold`}>
                                {mark !== null && mark !== undefined ? mark : ""}
                              </td>
                            );
                          })}
                          <td className={`border border-black ${cellPadding} text-center font-mono`}></td>
                          <td className={`border border-black ${cellPadding} text-center font-mono`}></td>
                          <td className={`border border-black ${cellPadding} text-center`}></td>
                          <td className={`border border-black ${cellPadding} text-center`}></td>
                        </tr>
                      );
                    })
                  )}

                  {/* GIRLS SECTION */}
                  <tr className="bg-slate-100 font-black">
                    <td 
                      colSpan={(showAdmissionNo ? 3 : 2) + subjects.length + 5} 
                      className={`border border-black ${cellPadding} text-slate-900 uppercase`}
                    >
                      👧 പെൺകുട്ടികൾ (Girls Section - Total: {girlsCount})
                    </td>
                  </tr>
                  {girlsList.length === 0 ? (
                    <tr>
                      <td 
                        colSpan={(showAdmissionNo ? 3 : 2) + subjects.length + 5} 
                        className={`border border-black ${cellPadding} text-center text-slate-400 italic`}
                      >
                        പെൺകുട്ടികൾ ലഭ്യമല്ല
                      </td>
                    </tr>
                  ) : (
                    girlsList.map((st, gIdx) => {
                      const ws = getStudentDetails(st.admissionNumber, st.studentId);
                      return (
                        <tr key={`girl-${st.studentId || st.admissionNumber}-${gIdx}`} className="hover:bg-slate-50">
                          <td className={`border border-black ${cellPadding} text-center font-mono font-bold`}>
                            {st.rollNo || ws?.rollNumber || gIdx + 1}
                          </td>
                          {showAdmissionNo && (
                            <td className={`border border-black ${cellPadding} text-center font-mono`}>
                              {st._adm || st.admissionNumber || ws?.admissionNumber || ""}
                            </td>
                          )}
                          <td className={`border border-black ${cellPadding} font-bold text-slate-900 truncate`}>
                            {st.name || ws?.name}
                          </td>
                          <td className={`border border-black ${cellPadding} text-center font-mono`}></td>
                          {subjects.map((sub, sIdx) => {
                            const mark = st.subjectMarks?.[sub];
                            return (
                              <td key={sIdx} className={`border border-black ${cellPadding} text-center font-mono font-bold`}>
                                {mark !== null && mark !== undefined ? mark : ""}
                              </td>
                            );
                          })}
                          <td className={`border border-black ${cellPadding} text-center font-mono`}></td>
                          <td className={`border border-black ${cellPadding} text-center font-mono`}></td>
                          <td className={`border border-black ${cellPadding} text-center`}></td>
                          <td className={`border border-black ${cellPadding} text-center`}></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary Footer Box */}
            <div className={`border border-black bg-white font-bold ${
              isUltraCompact ? "mt-2 p-1.5 text-[9px] space-y-1" : isCompact ? "mt-2.5 p-2 text-[10px] space-y-1" : "mt-4 p-2.5 text-[11px] space-y-1.5"
            }`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-1">
                <div>ആകെ പ്രവൃത്തി ദിവസം (Total Working Days): <span className="font-mono font-black">____________________</span></div>
                <div>ആകെ കുട്ടികൾ (Total Students): <span className="font-mono">ആൺ: {boysCount}, പെൺ: {girlsCount}, ആകെ: {totalCount}</span></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-black/30 pt-1">
                <div>പാസ്സായവർ (Total Passed): <span className="font-mono">ആൺ: _________, പെൺ: _________, ആകെ: _________</span></div>
                <div>വിജയ ശതമാനം % (Pass %): <span className="font-mono">ആൺ: _________%, പെൺ: _________%, ആകെ: _________%</span></div>
              </div>
            </div>

            {/* Signatures Footer */}
            <div className={`flex justify-between items-end text-black font-extrabold ${
              isUltraCompact ? "mt-4 pt-2 text-[9px]" : isCompact ? "mt-6 pt-3 text-[10px]" : "mt-8 pt-4 text-[11px]"
            }`}>
              <div className="text-center">
                <div className="border-t border-black w-36 sm:w-44 pt-1">ക്ലാസ് ഉസ്താദ് (Class Usthad)</div>
              </div>
              <div className="text-center">
                <div className="border-t border-black w-36 sm:w-44 pt-1">പരീക്ഷ കൺവീനർ / സദർ</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

