// Master Subject Directory for Madrasa Classes 1 to 12 (+1, +2)
// Aligned strictly with the official Samastha Kerala Jam'iyyathul Mu'allimeen Central Council (SKJMCC)
// and Samastha Kerala Islam Matha Vidyabhyasa Board (SKIMVB) 2026 Board Examination Syllabus.

import { db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export interface SubjectItem {
  id: string;
  nameMl: string;
  nameEn: string;
  category: "quran" | "fiqh" | "aqeeda" | "thareekh" | "lisan" | "akhlaq" | "general";
  defaultOrder: number;
  isCustom?: boolean;
}

export function normalizeClassKey(classStr: any): string {
  if (!classStr) return "Class 1";
  const str = String(classStr).trim();
  const cleaned = str.toLowerCase();
  
  if (cleaned.includes("+2") || cleaned.includes("plus two") || cleaned.includes("plus 2") || cleaned === "12" || cleaned.includes("class 12") || cleaned.includes("std 12")) {
    return "Class 12";
  }
  if (cleaned.includes("+1") || cleaned.includes("plus one") || cleaned.includes("plus 1") || cleaned === "11" || cleaned.includes("class 11") || cleaned.includes("std 11")) {
    return "Class 11";
  }
  
  const match = cleaned.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    if (num >= 1 && num <= 12) {
      return `Class ${num}`;
    }
  }
  
  return str;
}

export const SAMASTHA_SYLLABUS_TEMPLATE: Record<string, SubjectItem[]> = {
  "Class 1": [
    { id: "c1_sub1", nameMl: "അദ്ദീനിയാത്ത് വൽ അഖ്ലാഖ് വൽ ഇംലാഅ്", nameEn: "Ad-Deeniyath, Akhlaq & Imla", category: "akhlaq", defaultOrder: 1 },
    { id: "c1_sub2", nameMl: "അൽ ഖിറാഅത്ത് വൽ കിതാബത്ത് (തഫ്ഹീമു തിലാവ)", nameEn: "Al-Qira'ath wal Kithabah", category: "lisan", defaultOrder: 2 },
  ],
  "Class 2": [
    { id: "c2_sub1", nameMl: "അൽ ഫിഖ്ഹ്", nameEn: "Al-Fiqh", category: "fiqh", defaultOrder: 1 },
    { id: "c2_sub2", nameMl: "ദുറൂസുൽ ഇഹ്സാൻ", nameEn: "Duroos-ul-Ihsan", category: "akhlaq", defaultOrder: 2 },
    { id: "c2_sub3", nameMl: "അൽ അഖീദ", nameEn: "Al-Aqeedah", category: "aqeeda", defaultOrder: 3 },
    { id: "c2_sub4", nameMl: "അൽ ഖുർആൻ, ഹിഫ്ള്", nameEn: "Al-Quran & Hifdh", category: "quran", defaultOrder: 4 },
  ],
  "Class 3": [
    { id: "c3_sub1", nameMl: "ദുറൂസുൽ ഇഹ്സാൻ", nameEn: "Duroos-ul-Ihsan", category: "akhlaq", defaultOrder: 1 },
    { id: "c3_sub2", nameMl: "അൽ അഖീദ", nameEn: "Al-Aqeedah", category: "aqeeda", defaultOrder: 2 },
    { id: "c3_sub3", nameMl: "ലിസാനുൽ ഖുർആൻ", nameEn: "Lisan-ul-Quran", category: "lisan", defaultOrder: 3 },
    { id: "c3_sub4", nameMl: "അൽ ഫിഖ്ഹ്", nameEn: "Al-Fiqh", category: "fiqh", defaultOrder: 4 },
    { id: "c3_sub5", nameMl: "അത്താരീഖ്", nameEn: "Ath-Thareekh", category: "thareekh", defaultOrder: 5 },
    { id: "c3_sub6", nameMl: "അൽ ഖുർആൻ വ തദ്രീബു തിലാവ, ഹിഫ്ള്", nameEn: "Al-Quran, Thadreeb & Hifdh", category: "quran", defaultOrder: 6 },
  ],
  "Class 4": [
    { id: "c4_sub1", nameMl: "അൽ അഖീദ", nameEn: "Al-Aqeedah", category: "aqeeda", defaultOrder: 1 },
    { id: "c4_sub2", nameMl: "ദുറൂസുൽ ഇഹ്സാൻ", nameEn: "Duroos-ul-Ihsan", category: "akhlaq", defaultOrder: 2 },
    { id: "c4_sub3", nameMl: "അത്താരീഖ്", nameEn: "Ath-Thareekh", category: "thareekh", defaultOrder: 3 },
    { id: "c4_sub4", nameMl: "ലിസാനുൽ ഖുർആൻ", nameEn: "Lisan-ul-Quran", category: "lisan", defaultOrder: 4 },
    { id: "c4_sub5", nameMl: "അൽ ഫിഖ്ഹ്", nameEn: "Al-Fiqh", category: "fiqh", defaultOrder: 5 },
    { id: "c4_sub6", nameMl: "അൽ ഖുർആൻ വ തദ്രീബു തിലാവ, ഹിഫ്ള്", nameEn: "Al-Quran, Thadreeb & Hifdh", category: "quran", defaultOrder: 6 },
  ],
  "Class 5": [
    { id: "c5_sub1", nameMl: "ദുറൂസുൽ ഇഹ്സാൻ", nameEn: "Duroos-ul-Ihsan", category: "akhlaq", defaultOrder: 1 },
    { id: "c5_sub2", nameMl: "അൽ ഫിഖ്ഹ്", nameEn: "Al-Fiqh", category: "fiqh", defaultOrder: 2 },
    { id: "c5_sub3", nameMl: "അത്താരീഖ്", nameEn: "Ath-Thareekh", category: "thareekh", defaultOrder: 3 },
    { id: "c5_sub4", nameMl: "ലിസാനുൽ ഖുർആൻ", nameEn: "Lisan-ul-Quran", category: "lisan", defaultOrder: 4 },
    { id: "c5_sub5", nameMl: "അത്തജ്വീദ്", nameEn: "Ath-Thajweed", category: "quran", defaultOrder: 5 },
  ],
  "Class 6": [
    { id: "c6_sub1", nameMl: "അൽ ഫിഖ്ഹ്", nameEn: "Al-Fiqh", category: "fiqh", defaultOrder: 1 },
    { id: "c6_sub2", nameMl: "അത്താരീഖ്", nameEn: "Ath-Thareekh", category: "thareekh", defaultOrder: 2 },
    { id: "c6_sub3", nameMl: "ലിസാനുൽ ഖുർആൻ", nameEn: "Lisan-ul-Quran", category: "lisan", defaultOrder: 3 },
    { id: "c6_sub4", nameMl: "ദുറൂസുൽ ഇഹ്സാൻ", nameEn: "Duroos-ul-Ihsan", category: "akhlaq", defaultOrder: 4 },
    { id: "c6_sub5", nameMl: "അത്തജ്വീദ്", nameEn: "Ath-Thajweed", category: "quran", defaultOrder: 5 },
    { id: "c6_sub6", nameMl: "അൽ ഖുർആൻ, ഹിഫ്ള്", nameEn: "Al-Quran & Hifdh", category: "quran", defaultOrder: 6 },
  ],
  "Class 7": [
    { id: "c7_sub1", nameMl: "അത്തജ്വീദ്", nameEn: "Ath-Thajweed", category: "quran", defaultOrder: 1 },
    { id: "c7_sub2", nameMl: "ദുറൂസുൽ ഇഹ്സാൻ", nameEn: "Duroos-ul-Ihsan", category: "akhlaq", defaultOrder: 2 },
    { id: "c7_sub3", nameMl: "അൽ ഫിഖ്ഹ്", nameEn: "Al-Fiqh", category: "fiqh", defaultOrder: 3 },
    { id: "c7_sub4", nameMl: "ലിസാനുൽ ഖുർആൻ", nameEn: "Lisan-ul-Quran", category: "lisan", defaultOrder: 4 },
    { id: "c7_sub5", nameMl: "അത്താരീഖ്", nameEn: "Ath-Thareekh", category: "thareekh", defaultOrder: 5 },
    { id: "c7_sub6", nameMl: "അൽ ഖുർആൻ, ഹിഫ്ള്", nameEn: "Al-Quran & Hifdh", category: "quran", defaultOrder: 6 },
  ],
  "Class 8": [
    { id: "c8_sub1", nameMl: "ദുറൂസുൽ ഇഹ്സാൻ", nameEn: "Duroos-ul-Ihsan", category: "akhlaq", defaultOrder: 1 },
    { id: "c8_sub2", nameMl: "അൽ ഫിഖ്ഹ്", nameEn: "Al-Fiqh", category: "fiqh", defaultOrder: 2 },
    { id: "c8_sub3", nameMl: "ലിസാനുൽ ഖുർആൻ", nameEn: "Lisan-ul-Quran", category: "lisan", defaultOrder: 3 },
    { id: "c8_sub4", nameMl: "അത്താരീഖ്", nameEn: "Ath-Thareekh", category: "thareekh", defaultOrder: 4 },
  ],
  "Class 9": [
    { id: "c9_sub1", nameMl: "അൽ ഫിഖ്ഹ്", nameEn: "Al-Fiqh", category: "fiqh", defaultOrder: 1 },
    { id: "c9_sub2", nameMl: "അത്താരീഖ്", nameEn: "Ath-Thareekh", category: "thareekh", defaultOrder: 2 },
    { id: "c9_sub3", nameMl: "ലിസാനുൽ ഖുർആൻ", nameEn: "Lisan-ul-Quran", category: "lisan", defaultOrder: 3 },
    { id: "c9_sub4", nameMl: "ദുറൂസുൽ ഇഹ്സാൻ", nameEn: "Duroos-ul-Ihsan", category: "akhlaq", defaultOrder: 4 },
  ],
  "Class 10": [
    { id: "c10_sub1", nameMl: "അത്തഫ്സീർ", nameEn: "Ath-Thafseer", category: "quran", defaultOrder: 1 },
    { id: "c10_sub2", nameMl: "അൽ ഫിഖ്ഹ്", nameEn: "Al-Fiqh", category: "fiqh", defaultOrder: 2 },
    { id: "c10_sub3", nameMl: "ലിസാനുൽ ഖുർആൻ", nameEn: "Lisan-ul-Quran", category: "lisan", defaultOrder: 3 },
    { id: "c10_sub4", nameMl: "ദുറൂസുൽ ഇഹ്സാൻ", nameEn: "Duroos-ul-Ihsan", category: "akhlaq", defaultOrder: 4 },
  ],
  "Class 11": [
    { id: "c11_sub1", nameMl: "അൽ ഫിഖ്ഹ്", nameEn: "Al-Fiqh", category: "fiqh", defaultOrder: 1 },
    { id: "c11_sub2", nameMl: "ദുറൂസുൽ ഇഹ്സാൻ", nameEn: "Duroos-ul-Ihsan", category: "akhlaq", defaultOrder: 2 },
    { id: "c11_sub3", nameMl: "ലിസാനുൽ ഖുർആൻ", nameEn: "Lisan-ul-Quran", category: "lisan", defaultOrder: 3 },
    { id: "c11_sub4", nameMl: "അത്തഫ്സീർ", nameEn: "Ath-Thafseer", category: "quran", defaultOrder: 4 },
  ],
  "Class 12": [
    { id: "c12_sub1", nameMl: "ദുറൂസുൽ ഇഹ്സാൻ", nameEn: "Duroos-ul-Ihsan", category: "akhlaq", defaultOrder: 1 },
    { id: "c12_sub2", nameMl: "അത്തഫ്സീർ", nameEn: "Ath-Thafseer", category: "quran", defaultOrder: 2 },
    { id: "c12_sub3", nameMl: "അൽ ഫിഖ്ഹ്", nameEn: "Al-Fiqh", category: "fiqh", defaultOrder: 3 },
    { id: "c12_sub4", nameMl: "ലിസാനുൽ ഖുർആൻ", nameEn: "Lisan-ul-Quran", category: "lisan", defaultOrder: 4 },
  ]
};

// Clean slate: Clean empty directory by default (100% user-curated)
export const DEFAULT_MASTER_SUBJECTS_DIRECTORY: Record<string, SubjectItem[]> = {
  "Class 1": [],
  "Class 2": [],
  "Class 3": [],
  "Class 4": [],
  "Class 5": [],
  "Class 6": [],
  "Class 7": [],
  "Class 8": [],
  "Class 9": [],
  "Class 10": [],
  "Class 11": [],
  "Class 12": []
};

// Attach numeric and short aliases
for (let i = 1; i <= 12; i++) {
  DEFAULT_MASTER_SUBJECTS_DIRECTORY[`${i}`] = DEFAULT_MASTER_SUBJECTS_DIRECTORY[`Class ${i}`];
}
DEFAULT_MASTER_SUBJECTS_DIRECTORY["+1"] = DEFAULT_MASTER_SUBJECTS_DIRECTORY["Class 11"];
DEFAULT_MASTER_SUBJECTS_DIRECTORY["+2"] = DEFAULT_MASTER_SUBJECTS_DIRECTORY["Class 12"];

export const MASTER_SUBJECTS_DIRECTORY = DEFAULT_MASTER_SUBJECTS_DIRECTORY;

const DIRECTORY_STORAGE_KEY = "madrasa_master_subjects_directory_custom";

export function getMasterSubjectsDirectory(): Record<string, SubjectItem[]> {
  try {
    const saved = localStorage.getItem(DIRECTORY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        const result: Record<string, SubjectItem[]> = {};

        for (let i = 1; i <= 12; i++) {
          const cName = `Class ${i}`;
          const savedList = parsed[cName] || parsed[`${i}`];

          if (Array.isArray(savedList)) {
            result[cName] = savedList.map((s, idx) => ({
              ...s,
              defaultOrder: s.defaultOrder || idx + 1,
              isCustom: true
            }));
          } else {
            result[cName] = [];
          }
          result[`${i}`] = result[cName];
        }
        result["+1"] = result["Class 11"];
        result["+2"] = result["Class 12"];
        return result;
      }
    }
  } catch (e) {
    console.error("Failed to read master subjects directory:", e);
  }
  return DEFAULT_MASTER_SUBJECTS_DIRECTORY;
}

export function saveMasterSubjectsDirectory(dir: Record<string, SubjectItem[]>, persistToRemote: boolean = true): void {
  try {
    const toSave: Record<string, SubjectItem[]> = { ...dir };
    for (let i = 1; i <= 12; i++) {
      const cName = `Class ${i}`;
      if (toSave[cName]) {
        toSave[`${i}`] = toSave[cName];
      } else if (toSave[`${i}`]) {
        toSave[cName] = toSave[`${i}`];
      }
    }
    if (toSave["Class 11"]) toSave["+1"] = toSave["Class 11"];
    if (toSave["Class 12"]) toSave["+2"] = toSave["Class 12"];

    localStorage.setItem(DIRECTORY_STORAGE_KEY, JSON.stringify(toSave));
    window.dispatchEvent(new CustomEvent("subjects-directory-updated", { detail: toSave }));

    if (persistToRemote) {
      // 1. Post to Server API (persists in subject_directory.json)
      fetch("/api/subject-directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory: toSave })
      }).catch(err => console.warn("Failed to persist subject directory to server:", err));

      // 2. Persist to Firestore system_settings/subject_directory
      try {
        setDoc(doc(db, "system_settings", "subject_directory"), {
          directory: toSave,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(err => console.warn("Failed to persist subject directory to Firestore:", err));
      } catch (fsErr) {
        console.warn("Firestore save notice:", fsErr);
      }
    }
  } catch (e) {
    console.error("Failed to save master subjects directory:", e);
  }
}

export async function fetchRemoteSubjectDirectory(): Promise<Record<string, SubjectItem[]>> {
  try {
    let remoteDir: Record<string, SubjectItem[]> | null = null;

    // 1. Fetch from Server API first
    try {
      const res = await fetch("/api/subject-directory");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.directory && typeof data.directory === "object" && Object.keys(data.directory).length > 0) {
          remoteDir = data.directory;
        }
      }
    } catch (apiErr) {
      console.warn("Could not fetch subject directory from server:", apiErr);
    }

    // 2. If server has no saved data, check Firestore system_settings/subject_directory
    if (!remoteDir) {
      try {
        const snap = await getDoc(doc(db, "system_settings", "subject_directory"));
        if (snap.exists() && snap.data()?.directory) {
          remoteDir = snap.data().directory;
        }
      } catch (fsErr) {
        console.warn("Could not fetch subject directory from Firestore:", fsErr);
      }
    }

    if (remoteDir) {
      // Save locally without re-triggering remote persistence loop
      saveMasterSubjectsDirectory(remoteDir, false);
      return getMasterSubjectsDirectory();
    }
  } catch (err) {
    console.warn("Error fetching remote subject directory:", err);
  }
  return getMasterSubjectsDirectory();
}

export function resetMasterSubjectsDirectory(): void {
  try {
    localStorage.removeItem(DIRECTORY_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("subjects-directory-updated", { detail: DEFAULT_MASTER_SUBJECTS_DIRECTORY }));

    // Reset on server and firestore as well
    fetch("/api/subject-directory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ directory: DEFAULT_MASTER_SUBJECTS_DIRECTORY })
    }).catch(err => console.warn("Failed to reset server subject directory:", err));

    try {
      setDoc(doc(db, "system_settings", "subject_directory"), {
        directory: DEFAULT_MASTER_SUBJECTS_DIRECTORY,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(err => console.warn("Failed to reset firestore subject directory:", err));
    } catch (e) {}
  } catch (e) {
    console.error("Failed to reset master subjects directory:", e);
  }
}

export function getSubjectsForClass(classLevel: string): SubjectItem[] {
  const currentDir = getMasterSubjectsDirectory();
  if (!classLevel) return [];
  const norm = normalizeClassKey(classLevel);
  if (currentDir[norm] && currentDir[norm].length > 0) {
    return currentDir[norm];
  }
  if (currentDir[classLevel] && currentDir[classLevel].length > 0) {
    return currentDir[classLevel];
  }
  return [];
}

export function getSeparatedSubjectsForClass(classLevel: string): {
  defaultSubjects: SubjectItem[];
  customSubjects: SubjectItem[];
  allSubjects: SubjectItem[];
} {
  const allSubjects = getSubjectsForClass(classLevel);
  return {
    defaultSubjects: [],
    customSubjects: allSubjects,
    allSubjects
  };
}

// Exam terms available in Madrasas
export const EXAM_TERMS = [
  { id: "quarterly", labelMl: "പാദവാർഷിക പരീക്ഷ (Quarterly)", labelEn: "Quarterly Exam", shortMl: "പാദവാർഷികം" },
  { id: "half_yearly", labelMl: "അർദ്ധവാർഷിക പരീക്ഷ (Half-Yearly)", labelEn: "Half-Yearly Exam", shortMl: "അർദ്ധവാർഷികം" },
  { id: "annual", labelMl: "കൊല്ലപ്പരീക്ഷ / വാർഷിക പരീക്ഷ (Annual)", labelEn: "Annual Exam", shortMl: "കൊല്ലപ്പരീക്ഷ" },
  { id: "model", labelMl: "മോഡൽ പരീക്ഷ (Model Exam)", labelEn: "Model Exam", shortMl: "മോഡൽ" },
] as const;

// Helper to format any date input into dd MMM yyyy (e.g., "18 Jul 2026")
export function formatToDdMmmYyyy(dateStr: any): string {
  if (!dateStr) return "";
  const trimmed = String(dateStr).trim();
  if (/^Day\s+\d+/i.test(trimmed)) return trimmed;
  if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const clean = trimmed.replace(/\s*\([A-Za-z]+\)/g, "").trim();

  const ymdMatch = clean.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const mIdx = Math.max(0, Math.min(11, parseInt(ymdMatch[2], 10) - 1));
    const d = ymdMatch[3].padStart(2, "0");
    return `${d} ${months[mIdx]} ${y}`;
  }

  const dmyMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, "0");
    const mIdx = Math.max(0, Math.min(11, parseInt(dmyMatch[2], 10) - 1));
    const y = dmyMatch[3];
    return `${d} ${months[mIdx]} ${y}`;
  }

  const mmmMatch = clean.match(/^(\d{1,2})\s+([A-Za-z]{3})(?:\s+(\d{4}))?$/);
  if (mmmMatch) {
    const d = mmmMatch[1].padStart(2, "0");
    const mStr = mmmMatch[2].slice(0, 1).toUpperCase() + mmmMatch[2].slice(1, 3).toLowerCase();
    const y = mmmMatch[3] || new Date().getFullYear().toString();
    return `${d} ${mStr} ${y}`;
  }

  return trimmed;
}

export function formatDateShort(dateStr: any): string {
  const formatted = formatToDdMmmYyyy(dateStr);
  if (!formatted) return "";
  if (/^Day\s+\d+/i.test(formatted)) return formatted;
  const parts = formatted.split(" ");
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`;
  }
  return formatted.slice(0, 6);
}

export function toDateInputValue(dateStr: any): string {
  if (!dateStr) return "";
  const trimmed = String(dateStr).trim();
  if (/^Day\s+\d+/i.test(trimmed)) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const clean = trimmed.replace(/\s*\([A-Za-z]+\)/g, "").trim();
  const ymdMatch = clean.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, "0")}-${ymdMatch[3].padStart(2, "0")}`;
  }
  const dmyMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  const mmmMatch = clean.match(/^(\d{1,2})\s+([A-Za-z]{3})(?:\s+(\d{4}))?$/);
  if (mmmMatch) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const day = mmmMatch[1].padStart(2, "0");
    const mIdx = months.indexOf(mmmMatch[2].toLowerCase());
    const year = mmmMatch[3] || new Date().getFullYear().toString();
    if (mIdx !== -1) {
      const month = String(mIdx + 1).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }
  return "";
}

export function formatDateWithDay(dateStr: any): string {
  if (!dateStr) return "";
  const trimmed = String(dateStr).trim();
  if (/^Day\s+\d+/i.test(trimmed)) return trimmed;
  const iso = toDateInputValue(trimmed);
  if (!iso) return trimmed;
  const parts = iso.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);
    if (!isNaN(dateObj.getTime())) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayName = days[dateObj.getDay()];
      return `${String(d).padStart(2, "0")}-${String(m + 1).padStart(2, "0")}-${y} (${dayName})`;
    }
  }
  return trimmed;
}

export function getDynamicDefaultStartDate(): string {
  const now = new Date();
  if (now.getDay() === 5) {
    now.setDate(now.getDate() + 1);
  }
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getDynamicAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

export function getNextUnusedSubject(classKey: string, existingAssignedSubjects: string[]): string {
  const classSubjects = getSubjectsForClass(classKey);
  if (!classSubjects || classSubjects.length === 0) return "";
  const assignedSet = new Set(
    existingAssignedSubjects.map(s => (s ? s.trim().toLowerCase() : ""))
  );
  const unused = classSubjects.find(s => !assignedSet.has(s.nameMl.trim().toLowerCase()));
  return unused ? unused.nameMl : "";
}

export function calculateSequentialDates(startDateStr: string, count: number, skipFri: boolean): string[] {
  if (!startDateStr) startDateStr = getDynamicDefaultStartDate();
  const iso = toDateInputValue(startDateStr) || startDateStr;
  const parts = iso.split("-").map(Number);
  let cur: Date;
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    cur = new Date(parts[0], parts[1] - 1, parts[2]);
  } else {
    cur = new Date(startDateStr);
  }
  if (isNaN(cur.getTime())) {
    cur = new Date();
  }
  const daysArr: string[] = [];

  // Fix: If start date itself is Friday and skipFri is enabled, shift immediately to Saturday
  if (skipFri && cur.getDay() === 5) {
    cur.setDate(cur.getDate() + 1);
  }

  while (daysArr.length < count) {
    if (skipFri && cur.getDay() === 5) {
      cur.setDate(cur.getDate() + 1);
      continue;
    }
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, "0");
    const dd = String(cur.getDate()).padStart(2, "0");
    daysArr.push(formatDateWithDay(`${yyyy}-${mm}-${dd}`));
    cur.setDate(cur.getDate() + 1);
  }
  return daysArr;
}

export interface ExamDaySlot {
  dayNumber: number;
  dateStr: string;
  displayDate: string;
  isFriday: boolean;
  isHoliday: boolean;
  holidayReason?: string;
  dayNameMl: string;
  dayNameEn: string;
}

export function compute7DayExamSlots(startDateStr: string, skipFriday: boolean = true): ExamDaySlot[] {
  if (!startDateStr) return [];
  const iso = toDateInputValue(startDateStr) || startDateStr;
  const parts = iso.split("-");
  if (parts.length !== 3) return [];
  
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const start = new Date(y, m, d);
  if (isNaN(start.getTime())) return [];

  const slots: ExamDaySlot[] = [];
  let curr = new Date(start);
  let examDayCount = 0;

  const dayNamesMl = ["ഞായർ", "തിങ്കൾ", "ചൊവ്വ", "ബുധൻ", "വ്യാഴം", "വെള്ളി", "ശനി"];
  const dayNamesEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  while (examDayCount < 7 && slots.length < 12) {
    const isFri = curr.getDay() === 5;
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, "0");
    const dd = String(curr.getDate()).padStart(2, "0");
    const isoDate = `${yyyy}-${mm}-${dd}`;
    const displayDate = `${dd}-${mm}-${yyyy}`;
    const dayIdx = curr.getDay();

    if (isFri && skipFriday) {
      slots.push({
        dayNumber: 0,
        dateStr: isoDate,
        displayDate,
        isFriday: true,
        isHoliday: true,
        holidayReason: "🕌 വെള്ളി അവധി (Friday Holiday)",
        dayNameMl: dayNamesMl[dayIdx],
        dayNameEn: dayNamesEn[dayIdx],
      });
    } else {
      examDayCount++;
      slots.push({
        dayNumber: examDayCount,
        dateStr: isoDate,
        displayDate,
        isFriday: isFri,
        isHoliday: false,
        dayNameMl: dayNamesMl[dayIdx],
        dayNameEn: dayNamesEn[dayIdx],
      });
    }
    curr.setDate(curr.getDate() + 1);
  }

  return slots;
}
