import { db } from "../firebase";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";

export interface AuditReport {
  institutionId: string;
  institutionName: string;
  duplicates: {
    students: {
        admissionNo: string;
        name: string;
        count: number;
    }[];
  };
  inconsistencies: {
    halls: string[];
    orphans: string[];
  };
}

export async function runFullAudit(): Promise<AuditReport[]> {
  const reports: AuditReport[] = [];
  const instCol = collection(db, "institutions");
  const instSnap = await getDocs(instCol);

  for (const instDoc of instSnap.docs) {
    const institutionId = instDoc.id;
    const institution = instDoc.data();
    
    // Fetch data subcollection
    const dataCol = collection(db, "institutions", institutionId, "data");
    const dataSnap = await getDocs(dataCol);

    for (const dataDoc of dataSnap.docs) {
      const data = dataDoc.data();
      const report: AuditReport = {
        institutionId,
        institutionName: institution.name || "Unknown",
        duplicates: { students: [] },
        inconsistencies: { halls: [], orphans: [] }
      };

      // 1. Check for student duplicates (by Name + Admission Number)
      if (Array.isArray(data.students)) {
        const studentMap = new Map<string, number>();
        for (const student of data.students) {
          // Assuming students have name and admissionNo
          const key = `${student.admissionNo}-${student.name}`;
          studentMap.set(key, (studentMap.get(key) || 0) + 1);
        }
        for (const [key, count] of studentMap.entries()) {
          if (count > 1) {
            const [admissionNo, name] = key.split("-");
            report.duplicates.students.push({ admissionNo, name, count });
          }
        }
      }

      // 2. Add other checks (halls, orphans, etc.) here
      
      if (report.duplicates.students.length > 0 || report.inconsistencies.halls.length > 0 || report.inconsistencies.orphans.length > 0) {
        reports.push(report);
      }
    }
  }

  return reports;
}
