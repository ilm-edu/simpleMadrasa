/**
 * Student Name Batch Parser Utility
 * Extracts admission number and student name from single-line text inputs.
 */

export function convertToArabicName(_name: string): string {
  return "";
}

export function parseBatchStudentLine(line: string, defaultAdm?: number): {
  admNo: string;
  studentName: string;
} {
  const trimmed = line.trim();
  let admNo = defaultAdm ? String(defaultAdm) : "";
  let studentName = trimmed;

  const matchWithNo = trimmed.match(/^(\d+)[\.\,\:\s\-]+(.+)$/);
  if (matchWithNo) {
    admNo = matchWithNo[1].trim();
    studentName = matchWithNo[2].trim();
  }

  return {
    admNo,
    studentName
  };
}
