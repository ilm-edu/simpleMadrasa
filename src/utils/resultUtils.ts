import { StudentResultEntry, MadrasaExamResult, ExamResultSettings, SubjectRule, GradeRuleItem, ResultDisplayMode } from "../types";

/**
 * Official Madrasa Board (Samastha) Grade Rules
 * As per official circular:
 * - 45 to 50: A+ (മുമ്താസ്)
 * - 40 to 44: A (ജയ്യിദ് ജിദ്ദൻ)
 * - 35 to 39: B+ (ജയ്യിദ് പ്ലസ്)
 * - 30 to 34: B (ജയ്യിദ്)
 * - 25 to 29: C+ (മഖ്ബൂൽ പ്ലസ്)
 * - 20 to 24: C (മഖ്ബൂൽ)
 * - 18 to 19: D+ (പാസ്സ്) -> Minimum Pass Grade
 * - 01 to 17: D (പരാജയം / തോറ്റു) -> Failed
 */
export const OFFICIAL_BOARD_GRADE_RULES: GradeRuleItem[] = [
  {
    id: "g_aplus",
    grade: "A+",
    label: "മുമ്താസ് (A+ Distinction)",
    minMark: 45,
    maxMark: 50,
    minPercentage: 90,
    maxPercentage: 100,
    isPass: true
  },
  {
    id: "g_a",
    grade: "A",
    label: "ജയ്യിദ് ജിദ്ദൻ (A First Class)",
    minMark: 40,
    maxMark: 44,
    minPercentage: 80,
    maxPercentage: 89,
    isPass: true
  },
  {
    id: "g_bplus",
    grade: "B+",
    label: "ജയ്യിദ് പ്ലസ് (B+ High Second)",
    minMark: 35,
    maxMark: 39,
    minPercentage: 70,
    maxPercentage: 79,
    isPass: true
  },
  {
    id: "g_b",
    grade: "B",
    label: "ജയ്യിദ് (B Second Class)",
    minMark: 30,
    maxMark: 34,
    minPercentage: 60,
    maxPercentage: 69,
    isPass: true
  },
  {
    id: "g_cplus",
    grade: "C+",
    label: "മഖ്ബൂൽ പ്ലസ് (C+ High Third)",
    minMark: 25,
    maxMark: 29,
    minPercentage: 50,
    maxPercentage: 59,
    isPass: true
  },
  {
    id: "g_c",
    grade: "C",
    label: "മഖ്ബൂൽ (C Third Class)",
    minMark: 20,
    maxMark: 24,
    minPercentage: 40,
    maxPercentage: 49,
    isPass: true
  },
  {
    id: "g_dplus",
    grade: "D+",
    label: "പാസ്സ് (D+ Pass)",
    minMark: 18,
    maxMark: 19,
    minPercentage: 36,
    maxPercentage: 39,
    isPass: true
  },
  {
    id: "g_d",
    grade: "D",
    label: "പരാജയം (D Not Passed / തോറ്റു)",
    minMark: 0,
    maxMark: 17,
    minPercentage: 0,
    maxPercentage: 35,
    isPass: false
  }
];

/**
 * Official Special Subject Rules (Rule 2 from Official Board circular):
 * ഖുർആൻ (ക്ലാസ് 2-7), തഫ്ഹീമുത്തിലാവ (ക്ലാസ് 1), ദുറൂസ് അറബി മലയാളം, കേട്ടെഴുത്ത്
 * എന്നിവയിൽ D+ ഗ്രേഡ് ലഭിച്ച് വിജയിക്കാൻ 20 മാർക്ക് നിർബന്ധമാണ്.
 */
export const OFFICIAL_SPECIAL_SUBJECT_RULES: Record<string, SubjectRule> = {
  "ഖുർആൻ": { subject: "ഖുർആൻ", maxMark: 50, passMark: 20 },
  "തഫ്ഹീമുത്തിലാവ": { subject: "തഫ്ഹീമുത്തിലാവ", maxMark: 50, passMark: 20 },
  "ദുറൂസ് അറബി മലയാളം": { subject: "ദുറൂസ് അറബി മലയാളം", maxMark: 50, passMark: 20 },
  "കേട്ടെഴുത്ത്": { subject: "കേട്ടെഴുത്ത്", maxMark: 50, passMark: 20 }
};

export const DEFAULT_EXAM_SETTINGS: ExamResultSettings = {
  defaultMaxMark: 50,
  defaultPassMark: 18,
  defaultWorkingDays: 180,
  classWorkingDays: {},
  subjectRules: { ...OFFICIAL_SPECIAL_SUBJECT_RULES }, // Default special 20-mark rules pre-configured
  gradeRules: [...OFFICIAL_BOARD_GRADE_RULES],
  displayMode: "marks_and_grades",
  showRank: false,
  showPercentage: true,
  showTotalMarks: true,
  showAttendance: true,
  showSubjectMarks: true,
  passCriteria: "all_subjects",
  publicAccessMode: "direct",
  accessPassword: "",
  requireCaptcha: false,
  scheduleEnabled: false,
  scheduledPublishTime: "",
  countdownTitle: "പരീക്ഷാ ഫലപ്രഖ്യാപനം ഉടൻ"
};

/**
 * Helper to determine grade and Malayalam label for a given score & max mark
 */
export function determineGradeFromScore(
  mark: number,
  maxMark: number,
  passMark: number,
  customRules?: GradeRuleItem[]
): {
  grade: string;
  gradeMalayalam: string;
  isPassed: boolean;
} {
  const rules = customRules && customRules.length > 0 ? customRules : OFFICIAL_BOARD_GRADE_RULES;
  const isPassed = mark >= passMark;
  const pct = maxMark > 0 ? (mark / maxMark) * 100 : 0;

  // If score failed the minimum pass mark (e.g. less than 18 or less than special 20 in Quran)
  if (!isPassed) {
    const failRule = rules.find(r => !r.isPass) || {
      grade: "D",
      label: "പരാജയം (D Not Passed)"
    };
    return {
      grade: failRule.grade,
      gradeMalayalam: failRule.label,
      isPassed: false
    };
  }

  // If passed: match against rules in order
  for (const rule of rules) {
    if (!rule.isPass) continue;

    let matches = false;
    if (maxMark === 50) {
      matches = mark >= rule.minMark && mark <= rule.maxMark;
    } else {
      matches = pct >= rule.minPercentage && pct <= rule.maxPercentage;
    }

    if (matches) {
      return {
        grade: rule.grade,
        gradeMalayalam: rule.label,
        isPassed: true
      };
    }
  }

  // Fallback if mark passed but fell between thresholds: lowest passing grade
  const lowestPassRule = [...rules].reverse().find(r => r.isPass);
  return {
    grade: lowestPassRule ? lowestPassRule.grade : "D+",
    gradeMalayalam: lowestPassRule ? lowestPassRule.label : "പാസ്സ് (D+ Pass)",
    isPassed: true
  };
}

/**
 * Helper to determine overall student grade from overall percentage
 */
export function determineOverallGradeFromPercentage(
  percentage: number,
  hasFailedAny: boolean,
  customRules?: GradeRuleItem[]
): {
  grade: string;
  gradeMalayalam: string;
} {
  const rules = customRules && customRules.length > 0 ? customRules : OFFICIAL_BOARD_GRADE_RULES;

  if (hasFailedAny) {
    const failRule = rules.find(r => !r.isPass) || {
      grade: "D",
      label: "പരാജയം (D Not Passed)"
    };
    return {
      grade: failRule.grade,
      gradeMalayalam: failRule.label
    };
  }

  for (const rule of rules) {
    if (!rule.isPass) continue;
    if (percentage >= rule.minPercentage && percentage <= rule.maxPercentage) {
      return {
        grade: rule.grade,
        gradeMalayalam: rule.label
      };
    }
  }

  const lowestPassRule = [...rules].reverse().find(r => r.isPass);
  return {
    grade: lowestPassRule ? lowestPassRule.grade : "D+",
    gradeMalayalam: lowestPassRule ? lowestPassRule.label : "പാസ്സ് (D+ Pass)"
  };
}

/**
 * Get subject-specific max mark and pass mark
 */
export function getSubjectMarkRules(
  subjectName: string, 
  settings?: ExamResultSettings,
  studentCustomMaxMarks?: Record<string, number>
): { maxMark: number; passMark: number } {
  const normSub = subjectName.trim();
  const rule = settings?.subjectRules?.[normSub];

  const defaultMax = settings?.defaultMaxMark || 50;
  const defaultPass = settings?.defaultPassMark || 18;

  const maxMark = rule?.maxMark || studentCustomMaxMarks?.[normSub] || defaultMax;
  const passMark = rule?.passMark || defaultPass;

  return { maxMark, passMark };
}

/**
 * Check if a single subject score is passed
 */
export function evaluateSubjectScore(
  mark: number | null | undefined, 
  subjectName: string, 
  settings?: ExamResultSettings,
  studentCustomMaxMarks?: Record<string, number>
): {
  isPassed: boolean;
  isAbsent: boolean;
  maxMark: number;
  passMark: number;
  grade: string;
  gradeMalayalam: string;
} {
  const { maxMark, passMark } = getSubjectMarkRules(subjectName, settings, studentCustomMaxMarks);

  if (mark === null || mark === undefined) {
    return {
      isPassed: false,
      isAbsent: true,
      maxMark,
      passMark,
      grade: "-",
      gradeMalayalam: "ഹാജരായില്ല"
    };
  }

  const gradeResult = determineGradeFromScore(mark, maxMark, passMark, settings?.gradeRules);

  return {
    isPassed: gradeResult.isPassed,
    isAbsent: false,
    maxMark,
    passMark,
    grade: gradeResult.grade,
    gradeMalayalam: gradeResult.gradeMalayalam
  };
}

/**
 * Calculate full student stats (totals, percentage, pass/fail, failed subjects, grade)
 */
export function calculateStudentOverallResult(
  subjectMarks: Record<string, number | null>,
  settings?: ExamResultSettings,
  studentCustomMaxMarks?: Record<string, number>
): {
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  overallResult: "passed" | "failed";
  failedSubjects: string[];
  grade: string;
  gradeMalayalam: string;
  scoredSubjectsCount: number;
} {
  const subjects = Object.keys(subjectMarks);
  let totalMarks = 0;
  let maxTotalMarks = 0;
  let scoredSubjectsCount = 0;
  const failedSubjects: string[] = [];

  subjects.forEach(sub => {
    const mark = subjectMarks[sub];
    const { isPassed, isAbsent, maxMark } = evaluateSubjectScore(mark, sub, settings, studentCustomMaxMarks);

    maxTotalMarks += maxMark;

    if (typeof mark === "number" && !isNaN(mark)) {
      totalMarks += mark;
      scoredSubjectsCount++;
      if (!isPassed) {
        failedSubjects.push(sub);
      }
    } else if (isAbsent) {
      // If absent, considered not passed in that subject
      failedSubjects.push(sub);
    }
  });

  if (scoredSubjectsCount === 0) {
    return {
      totalMarks: 0,
      maxTotalMarks: maxTotalMarks || subjects.length * (settings?.defaultMaxMark || 50),
      percentage: 0,
      overallResult: "failed",
      failedSubjects,
      grade: "-",
      gradeMalayalam: "-",
      scoredSubjectsCount: 0
    };
  }

  const percentage = maxTotalMarks > 0 ? Math.round((totalMarks / maxTotalMarks) * 100) : 0;
  const hasFailedAny = failedSubjects.length > 0;
  const overallResult: "passed" | "failed" = hasFailedAny ? "failed" : "passed";

  const gradeEval = determineOverallGradeFromPercentage(percentage, hasFailedAny, settings?.gradeRules);

  return {
    totalMarks,
    maxTotalMarks,
    percentage,
    overallResult,
    failedSubjects,
    grade: gradeEval.grade,
    gradeMalayalam: gradeEval.gradeMalayalam,
    scoredSubjectsCount
  };
}

/**
 * Assign ranks to students in a class
 */
export function assignClassRanks(students: StudentResultEntry[]): StudentResultEntry[] {
  // Sort eligible passed students by totalMarks descending
  const sorted = [...students].sort((a, b) => {
    // Withheld / Excluded go to end
    if (a.status !== "published") return 1;
    if (b.status !== "published") return -1;

    // Passed students rank higher than failed
    if (a.overallResult === "passed" && b.overallResult !== "passed") return -1;
    if (a.overallResult !== "passed" && b.overallResult === "passed") return 1;

    return (b.totalMarks || 0) - (a.totalMarks || 0);
  });

  let currentRank = 1;
  return sorted.map((st, index) => {
    if (st.status !== "published" || st.overallResult !== "passed") {
      return { ...st, rank: undefined };
    }
    const rank = currentRank++;
    return { ...st, rank };
  });
}
