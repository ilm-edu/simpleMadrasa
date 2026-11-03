import { Student, ExamHall, SeatingResult, HallAllocation, SeatingSeat } from "./types";

/**
 * Universal natural numeric roll number comparator
 * Correctly sorts 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, etc. (never 1, 10, 2)
 */
export const compareRollNumbers = (a: string | number | undefined, b: string | number | undefined): number => {
  return String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true, sensitivity: "base" });
};

export const getStudentEffectiveRoll = (s: Student): string => {
  if (s.rollNo !== undefined && s.rollNo !== null && String(s.rollNo).trim() !== "") {
    return String(s.rollNo);
  }
  if (s.rollNumber !== undefined && s.rollNumber !== null && String(s.rollNumber).trim() !== "") {
    return String(s.rollNumber);
  }
  return s.admissionNumber || "";
};

/**
 * Seating Allocation Algorithm for Madrasa Exams
 * Fully complies with:
 * 1. Gender Separation (separate halls/zones for boys and girls, no mixed halls in a shift)
 * 2. Hall Reservations (reserved for specific classes, divisions, shifts, or genders)
 * 3. Shift Handling (allocated based on active shift strength)
 * 4. Multi-Class Interleaving (alternating classes on benches to minimize proximity)
 * 5. Dynamic Spacing (maximizing distance on benches)
 * 6. Sequential Paper Passing Order (Roll numbers 1, 2, 3... aligned from front to back benches)
 * 7. Capacity Warning (limits allocations and warns instead of overfilling)
 */
export function runSeatingAllocation(
  allStudents: Student[],
  allHalls: ExamHall[],
  activeShift: string,
  variationSeed: number = 0,
  lang: "en" | "ml" = "ml",
  dispersionMode: "full_dispersion" | "standard_paired" = "full_dispersion"
): SeatingResult {
  const warnings: string[] = [];
  const unallocatedStudents: Student[] = [];

  // 1. Filter students by the active shift
  const shiftStudents = allStudents.filter(
    (s) => (s.shift || "Shift 1").toLowerCase() === activeShift.toLowerCase()
  );

  if (shiftStudents.length === 0) {
    return {
      shift: activeShift,
      allocations: [],
      unallocatedStudents: [],
      warnings: [
        lang === "ml"
          ? `ഈ ഷിഫ്റ്റിൽ (${activeShift}) വിദ്യാർത്ഥികളാരും ഇല്ല.`
          : `No students found for ${activeShift}.`
      ],
    };
  }

  // 2. Filter available halls for this shift
  let availableHalls = allHalls.filter(
    (h) => !h.reservedShift || h.reservedShift === "None" || h.reservedShift.toLowerCase() === activeShift.toLowerCase()
  );

  if (availableHalls.length === 0) {
    // If no halls are configured for this shift, create an auto hall so no student is left without a seat
    const autoHall: ExamHall = {
      id: "auto-emergency-hall",
      name: lang === "ml" ? "ഹാൾ 1 (ഓട്ടോമാറ്റിക്)" : "Hall 1 (Automatic)",
      benchesCount: Math.max(5, Math.ceil(shiftStudents.length / 2)),
      benchCapacity: 2,
      isAutomaticCapacity: true,
      reservedGender: "None",
      reservedClasses: [],
      reservedDivisions: [],
      reservedShift: "None",
    };
    availableHalls = [autoHall];
    warnings.push(
      lang === "ml"
        ? `ഈ ഷിഫ്റ്റിലേക്ക് നിശ്ചിത ഹാളുകൾ ഇല്ലാത്തതിനാൽ ഓട്ടോമാറ്റിക് ഹാൾ ക്രമീകരിച്ച് എല്ലാ കുട്ടികൾക്കും സീറ്റുകൾ നൽകിയിട്ടുണ്ട്.`
        : `No halls were configured for ${activeShift}. An automatic hall has been generated to guarantee seating for all students.`
    );
  }

  // Helper to sort students naturally by class and numeric roll number
  const sortStudentList = (list: Student[]) => {
    return [...list].sort((a, b) => {
      const numA = parseInt(String(a.classLevel).replace(/\D/g, "")) || 0;
      const numB = parseInt(String(b.classLevel).replace(/\D/g, "")) || 0;
      if (numA !== numB) return numA - numB;
      const divComp = (a.division || "A").localeCompare(b.division || "A");
      if (divComp !== 0) return divComp;
      return compareRollNumbers(getStudentEffectiveRoll(a), getStudentEffectiveRoll(b));
    });
  };

  // Separate remaining students to seat by gender
  let remainingBoys = sortStudentList(shiftStudents.filter((s) => s.gender === "Male"));
  let remainingGirls = sortStudentList(shiftStudents.filter((s) => s.gender === "Female"));

  // Group halls into class/division-reserved and general halls
  const classReservedHalls = availableHalls.filter(
    (h) => (h.reservedClasses && h.reservedClasses.length > 0) || (h.reservedDivisions && h.reservedDivisions.length > 0)
  );
  const generalHalls = availableHalls.filter(
    (h) => (!h.reservedClasses || h.reservedClasses.length === 0) && (!h.reservedDivisions || h.reservedDivisions.length === 0)
  );

  const finalAllocations: HallAllocation[] = [];

  // Helper to process a single hall
  const processHallAllocation = (hall: ExamHall) => {
    // 1. Get eligible boys and girls in this hall
    let eligibleBoys = [...remainingBoys];
    let eligibleGirls = [...remainingGirls];

    // Filter by class / cohort reservation if any (supports "Class 1", "Class 1-A", etc.)
    if (hall.reservedClasses && hall.reservedClasses.length > 0) {
      const reservedLower = hall.reservedClasses.map((c) => c.toLowerCase().trim());
      eligibleBoys = eligibleBoys.filter((s) => {
        const clLower = (s.classLevel || "").toLowerCase().trim();
        const divLower = (s.division || "").toLowerCase().trim();
        const cohortKeyLower = divLower ? `${clLower}-${divLower}` : clLower;
        return reservedLower.includes(clLower) || reservedLower.includes(cohortKeyLower);
      });
      eligibleGirls = eligibleGirls.filter((s) => {
        const clLower = (s.classLevel || "").toLowerCase().trim();
        const divLower = (s.division || "").toLowerCase().trim();
        const cohortKeyLower = divLower ? `${clLower}-${divLower}` : clLower;
        return reservedLower.includes(clLower) || reservedLower.includes(cohortKeyLower);
      });
    }

    // Filter by division reservation if any
    if (hall.reservedDivisions && hall.reservedDivisions.length > 0) {
      const reservedDivsLower = hall.reservedDivisions.map((d) => d.toLowerCase());
      eligibleBoys = eligibleBoys.filter((s) =>
        reservedDivsLower.includes((s.division || "A").toLowerCase())
      );
      eligibleGirls = eligibleGirls.filter((s) =>
        reservedDivsLower.includes((s.division || "A").toLowerCase())
      );
    }

    // Filter by gender reservation
    if (hall.reservedGender === "Male") {
      eligibleGirls = [];
    } else if (hall.reservedGender === "Female") {
      eligibleBoys = [];
    }

    // 2. Decide students to seat in this hall
    let boysToSeat: Student[] = [];
    let girlsToSeat: Student[] = [];

    const N = hall.benchesCount;
    const isAuto = hall.isAutomaticCapacity || hall.benchCapacity === 0;
    const C = isAuto ? 6 : hall.benchCapacity;
    const hallCap = N * C;

    if (hall.reservedGender === "Male") {
      boysToSeat = eligibleBoys.slice(0, hallCap);
    } else if (hall.reservedGender === "Female") {
      girlsToSeat = eligibleGirls.slice(0, hallCap);
    } else {
      // Neutral Hall - find optimal partition of benches between boys and girls
      let bestNBoys = 0;
      let maxSeated = -1;

      for (let nb = 0; nb <= N; nb++) {
        const ng = N - nb;
        const seatedBoysCount = Math.min(eligibleBoys.length, nb * C);
        const seatedGirlsCount = Math.min(eligibleGirls.length, ng * C);
        const totalSeated = seatedBoysCount + seatedGirlsCount;

        if (totalSeated > maxSeated) {
          maxSeated = totalSeated;
          bestNBoys = nb;
        } else if (totalSeated === maxSeated) {
          const idealRatio = eligibleBoys.length / (eligibleBoys.length + eligibleGirls.length || 1);
          const currentRatio = nb / (N || 1);
          const prevBestRatio = bestNBoys / (N || 1);
          if (Math.abs(currentRatio - idealRatio) < Math.abs(prevBestRatio - idealRatio)) {
            bestNBoys = nb;
          }
        }
      }

      const boysCountToSeat = Math.min(eligibleBoys.length, bestNBoys * C);
      const girlsCountToSeat = Math.min(eligibleGirls.length, (N - bestNBoys) * C);

      boysToSeat = eligibleBoys.slice(0, boysCountToSeat);
      girlsToSeat = eligibleGirls.slice(0, girlsCountToSeat);
    }

    // Combine students for this hall
    const studentsToSeat = [...boysToSeat, ...girlsToSeat];

    // Allocate in grid using the active dispersionMode (preserves full dispersion inside reserved hall!)
    const benches = seatStudentsInHallGrid(studentsToSeat, hall, variationSeed, dispersionMode);
    finalAllocations.push({
      hallId: hall.id,
      hallName: hall.name,
      shift: activeShift,
      benches,
      totalStudents: studentsToSeat.length,
    });

    // Remove seated students from global remaining lists
    const seatedBoysIds = new Set(boysToSeat.map((s) => s.id));
    const seatedGirlsIds = new Set(girlsToSeat.map((s) => s.id));

    remainingBoys = remainingBoys.filter((s) => !seatedBoysIds.has(s.id));
    remainingGirls = remainingGirls.filter((s) => !seatedGirlsIds.has(s.id));
  };

  // -------------------------------------------------------------------------
  // 1. FULL DISPERSION ENGINE: PROPORTIONAL MULTI-HALL CLASS SCATTERING
  // If dispersionMode === "full_dispersion":
  // Instead of filling halls sequentially, students of each class are evenly
  // and proportionally scattered across ALL eligible halls (e.g. 12 students of
  // Class 3-B across 6 eligible halls -> exactly 2 students per hall), with
  // strict restriction compliance and user bench capacity strictly honored.
  // -------------------------------------------------------------------------
  if (dispersionMode === "full_dispersion") {
    // Helper: Determine if a student belongs to a class/division reserved for specific halls
    const hasAnyRestrictedHalls = availableHalls.some(
      (h) => (h.reservedClasses && h.reservedClasses.length > 0) || (h.reservedDivisions && h.reservedDivisions.length > 0)
    );

    const isStudentDesignatedForRestrictedHall = (s: Student) => {
      return availableHalls.some((h) => {
        const hasResClass = h.reservedClasses && h.reservedClasses.length > 0;
        const hasResDiv = h.reservedDivisions && h.reservedDivisions.length > 0;
        if (!hasResClass && !hasResDiv) return false;

        if (hasResClass) {
          const reservedLower = h.reservedClasses!.map((c) => c.toLowerCase().trim());
          const clLower = (s.classLevel || "").toLowerCase().trim();
          const divLower = (s.division || "").toLowerCase().trim();
          const cohortKeyLower = divLower ? `${clLower}-${divLower}` : clLower;
          if (reservedLower.includes(clLower) || reservedLower.includes(cohortKeyLower)) return true;
        }
        if (hasResDiv) {
          const reservedDivsLower = h.reservedDivisions!.map((d) => d.toLowerCase().trim());
          const divLower = (s.division || "A").toLowerCase().trim();
          if (reservedDivsLower.includes(divLower)) return true;
        }
        return false;
      });
    };

    // Helper: Check if a student is strictly eligible to enter a particular hall
    const isStudentEligibleForHall = (s: Student, h: ExamHall): boolean => {
      // 1. Gender reservation check
      if (h.reservedGender === "Male" && s.gender !== "Male") return false;
      if (h.reservedGender === "Female" && s.gender !== "Female") return false;

      const hasResClass = h.reservedClasses && h.reservedClasses.length > 0;
      const hasResDiv = h.reservedDivisions && h.reservedDivisions.length > 0;

      // 2. Class / Cohort reservation check
      if (hasResClass) {
        const reservedLower = h.reservedClasses!.map((c) => c.toLowerCase().trim());
        const clLower = (s.classLevel || "").toLowerCase().trim();
        const divLower = (s.division || "").toLowerCase().trim();
        const cohortKeyLower = divLower ? `${clLower}-${divLower}` : clLower;
        if (!reservedLower.includes(clLower) && !reservedLower.includes(cohortKeyLower)) return false;
      }

      // 3. Division reservation check
      if (hasResDiv) {
        const reservedDivsLower = h.reservedDivisions!.map((d) => d.toLowerCase().trim());
        const divLower = (s.division || "A").toLowerCase().trim();
        if (!reservedDivsLower.includes(divLower)) return false;
      }

      // 4. Strict Restricted-Class Containment (Zero Leakage to General Halls)
      // If this hall is general (unrestricted), but this student belongs to a class
      // designated for restricted halls, they must NEVER leak into general halls.
      if (!hasResClass && !hasResDiv && hasAnyRestrictedHalls && isStudentDesignatedForRestrictedHall(s)) {
        return false;
      }

      return true;
    };

    // Determine capacity buckets for ALL available halls in this shift
    const hallBuckets = availableHalls.map((h) => {
      const N = h.benchesCount;
      const isAuto = h.isAutomaticCapacity || h.benchCapacity === 0;
      const eligibleCount = [...remainingBoys, ...remainingGirls].filter(s => isStudentEligibleForHall(s, h)).length;
      const C = isAuto ? Math.max(2, Math.min(6, Math.ceil(eligibleCount / Math.max(1, N)))) : Math.max(1, h.benchCapacity);
      const grossCap = N * C;

      let boyCap = 0;
      let girlCap = 0;

      if (h.reservedGender === "Male") {
        boyCap = grossCap;
        girlCap = 0;
      } else if (h.reservedGender === "Female") {
        boyCap = 0;
        girlCap = grossCap;
      } else {
        const totalRem = remainingBoys.length + remainingGirls.length || 1;
        if (remainingGirls.length === 0) {
          boyCap = grossCap;
          girlCap = 0;
        } else if (remainingBoys.length === 0) {
          boyCap = 0;
          girlCap = grossCap;
        } else {
          // Check explicit user-set zone benches
          if (
            typeof h.boysBenchesCount === "number" &&
            typeof h.girlsBenchesCount === "number" &&
            h.boysBenchesCount > 0 &&
            h.girlsBenchesCount > 0 &&
            h.boysBenchesCount + h.girlsBenchesCount === N
          ) {
            boyCap = h.boysBenchesCount * C;
            girlCap = h.girlsBenchesCount * C;
          } else {
            const boyRatio = remainingBoys.length / totalRem;
            const bBenches = Math.max(0, Math.min(N, Math.round(N * boyRatio)));
            const gBenches = N - bBenches;
            boyCap = bBenches * C;
            girlCap = gBenches * C;
          }
        }
      }

      const totalEligible = [...remainingBoys, ...remainingGirls].filter(s => isStudentEligibleForHall(s, h)).length;

      return {
        hall: h,
        benchCap: C,
        grossCap,
        maxBoys: boyCap,
        maxGirls: girlCap,
        assignedBoys: [] as Student[],
        assignedGirls: [] as Student[],
        totalEligible,
      };
    });

    // -----------------------------------------------------------------------
    // A. PROPORTIONAL MULTI-HALL SCATTERING FOR BOYS
    // -----------------------------------------------------------------------
    if (remainingBoys.length > 0) {
      // Group boys by cohort (classLevel + division)
      const boyCohortMap: Record<string, Student[]> = {};
      for (const b of remainingBoys) {
        const cl = b.classLevel || "Class 1";
        const div = b.division || "A";
        const cohortKey = `${cl}__${div}`;
        if (!boyCohortMap[cohortKey]) boyCohortMap[cohortKey] = [];
        boyCohortMap[cohortKey].push(b);
      }

      const sortedBoyCohortKeys = Object.keys(boyCohortMap).sort((a, b) => {
        const [clA, divA] = a.split("__");
        const [clB, divB] = b.split("__");
        const nA = parseInt(clA.replace(/\D/g, "")) || 0;
        const nB = parseInt(clB.replace(/\D/g, "")) || 0;
        if (nA !== nB) return nA - nB;
        return (divA || "").localeCompare(divB || "");
      });

      sortedBoyCohortKeys.forEach((cohortKey, cohortIdx) => {
        const cohortStudents = boyCohortMap[cohortKey];
        if (cohortStudents.length === 0) return;
        const repStudent = cohortStudents[0];
        const cl = repStudent.classLevel || "Class 1";

        // Find all halls eligible for this cohort that have boy capacity
        const eligibleBuckets = hallBuckets.filter(
          (b) => b.maxBoys > 0 && isStudentEligibleForHall(repStudent, b.hall)
        );

        if (eligibleBuckets.length === 0) return;

        const M = eligibleBuckets.length;
        // Rotating starting hall offset so different classes disperse from different halls
        const startHallIdx = cohortIdx % M;

        cohortStudents.forEach((student, sIdx) => {
          let bestTarget: typeof eligibleBuckets[0] | null = null;
          let minSameClassCount = Infinity;
          const preferredIdx = (startHallIdx + sIdx) % M;

          // Search eligible halls starting from preferredIdx in round-robin order
          for (let i = 0; i < M; i++) {
            const hallIdx = (preferredIdx + i) % M;
            const target = eligibleBuckets[hallIdx];
            if (target.assignedBoys.length < target.maxBoys) {
              const sameClassCount = target.assignedBoys.filter(
                (s) => (s.classLevel || "").toLowerCase() === cl.toLowerCase()
              ).length;

              if (sameClassCount < minSameClassCount) {
                minSameClassCount = sameClassCount;
                bestTarget = target;
              }
            }
          }

          if (!bestTarget) {
            // Fallback: any eligible hall with remaining boy capacity
            bestTarget = eligibleBuckets.find((t) => t.assignedBoys.length < t.maxBoys) || null;
          }

          if (bestTarget) {
            bestTarget.assignedBoys.push(student);
          }
        });
      });
    }

    // -----------------------------------------------------------------------
    // B. PROPORTIONAL MULTI-HALL SCATTERING FOR GIRLS
    // -----------------------------------------------------------------------
    if (remainingGirls.length > 0) {
      // Group girls by cohort (classLevel + division)
      const girlCohortMap: Record<string, Student[]> = {};
      for (const g of remainingGirls) {
        const cl = g.classLevel || "Class 1";
        const div = g.division || "A";
        const cohortKey = `${cl}__${div}`;
        if (!girlCohortMap[cohortKey]) girlCohortMap[cohortKey] = [];
        girlCohortMap[cohortKey].push(g);
      }

      const sortedGirlCohortKeys = Object.keys(girlCohortMap).sort((a, b) => {
        const [clA, divA] = a.split("__");
        const [clB, divB] = b.split("__");
        const nA = parseInt(clA.replace(/\D/g, "")) || 0;
        const nB = parseInt(clB.replace(/\D/g, "")) || 0;
        if (nA !== nB) return nA - nB;
        return (divA || "").localeCompare(divB || "");
      });

      sortedGirlCohortKeys.forEach((cohortKey, cohortIdx) => {
        const cohortStudents = girlCohortMap[cohortKey];
        if (cohortStudents.length === 0) return;
        const repStudent = cohortStudents[0];
        const cl = repStudent.classLevel || "Class 1";

        // Find all halls eligible for this cohort that have girl capacity
        const eligibleBuckets = hallBuckets.filter(
          (b) => b.maxGirls > 0 && isStudentEligibleForHall(repStudent, b.hall)
        );

        if (eligibleBuckets.length === 0) return;

        const M = eligibleBuckets.length;
        // Rotating starting hall offset so different classes disperse from different halls
        const startHallIdx = cohortIdx % M;

        cohortStudents.forEach((student, sIdx) => {
          let bestTarget: typeof eligibleBuckets[0] | null = null;
          let minSameClassCount = Infinity;
          const preferredIdx = (startHallIdx + sIdx) % M;

          for (let i = 0; i < M; i++) {
            const hallIdx = (preferredIdx + i) % M;
            const target = eligibleBuckets[hallIdx];
            if (target.assignedGirls.length < target.maxGirls) {
              const sameClassCount = target.assignedGirls.filter(
                (s) => (s.classLevel || "").toLowerCase() === cl.toLowerCase()
              ).length;

              if (sameClassCount < minSameClassCount) {
                minSameClassCount = sameClassCount;
                bestTarget = target;
              }
            }
          }

          if (!bestTarget) {
            bestTarget = eligibleBuckets.find((t) => t.assignedGirls.length < t.maxGirls) || null;
          }

          if (bestTarget) {
            bestTarget.assignedGirls.push(student);
          }
        });
      });
    }

    // -----------------------------------------------------------------------
    // C. IN-HALL MAXIMUM DISTANCE GRID SEATING FOR EACH HALL
    // -----------------------------------------------------------------------
    for (const b of hallBuckets) {
      const studentsToSeat = [...b.assignedBoys, ...b.assignedGirls];
      const hallCap = b.grossCap;

      // Seat inside the hall with maximum Euclidean physical distance and alternating interleaving
      const benches = seatStudentsInHallGrid(studentsToSeat, b.hall, variationSeed, "full_dispersion");
      finalAllocations.push({
        hallId: b.hall.id,
        hallName: b.hall.name,
        shift: activeShift,
        benches,
        totalStudents: studentsToSeat.length,
      });

      const seatedBoysIds = new Set(b.assignedBoys.map((s) => s.id));
      const seatedGirlsIds = new Set(b.assignedGirls.map((s) => s.id));
      remainingBoys = remainingBoys.filter((s) => !seatedBoysIds.has(s.id));
      remainingGirls = remainingGirls.filter((s) => !seatedGirlsIds.has(s.id));
    }

    // Filter out unseated students of restricted classes so they NEVER leak to general/overflow halls
    if (hasAnyRestrictedHalls) {
      remainingBoys = remainingBoys.filter((s) => !isStudentDesignatedForRestrictedHall(s));
      remainingGirls = remainingGirls.filter((s) => !isStudentDesignatedForRestrictedHall(s));
    }
  } else {
    // -----------------------------------------------------------------------
    // STANDARD PAIRED MODE
    // -----------------------------------------------------------------------
    for (const hall of classReservedHalls) {
      processHallAllocation(hall);
    }

    if (classReservedHalls.length > 0) {
      const isStudentAssignedToRestrictedHall = (s: Student) => {
        return classReservedHalls.some((h) => {
          if (h.reservedClasses && h.reservedClasses.length > 0) {
            const reservedLower = h.reservedClasses.map((c) => c.toLowerCase().trim());
            const clLower = (s.classLevel || "").toLowerCase().trim();
            const divLower = (s.division || "").toLowerCase().trim();
            const cohortKeyLower = divLower ? `${clLower}-${divLower}` : clLower;
            if (reservedLower.includes(clLower) || reservedLower.includes(cohortKeyLower)) return true;
          }
          if (h.reservedDivisions && h.reservedDivisions.length > 0) {
            const reservedDivsLower = h.reservedDivisions.map((d) => d.toLowerCase().trim());
            const divLower = (s.division || "A").toLowerCase().trim();
            if (reservedDivsLower.includes(divLower)) return true;
          }
          return false;
        });
      };

      remainingBoys = remainingBoys.filter((s) => !isStudentAssignedToRestrictedHall(s));
      remainingGirls = remainingGirls.filter((s) => !isStudentAssignedToRestrictedHall(s));
    }

    for (const hall of generalHalls) {
      processHallAllocation(hall);
    }
  }

  // GUARANTEED 100% ALLOCATION: Ensure NO student is left unseated!
  const overflowBoysCount = remainingBoys.length;
  const overflowGirlsCount = remainingGirls.length;

  if (overflowBoysCount > 0 || overflowGirlsCount > 0) {
    // Collect all unseated students
    const overflowStudents = [...remainingBoys, ...remainingGirls];
    const totalOverflow = overflowStudents.length;

    // Calculate minimum benches required so no single class is forced to share a bench
    const overflowClassCounts: Record<string, number> = {};
    overflowStudents.forEach((s) => {
      const cl = (s.classLevel || "").toLowerCase();
      overflowClassCounts[cl] = (overflowClassCounts[cl] || 0) + 1;
    });
    const maxSingleClassInOverflow = Math.max(0, ...Object.values(overflowClassCounts));

    // Create a dedicated, properly configured Additional Exam Hall
    const extraHallBenches = Math.max(1, Math.ceil(totalOverflow / 2), maxSingleClassInOverflow);
    const extraHall: ExamHall = {
      id: `overflow-hall-${activeShift.toLowerCase().replace(/\s+/g, "-")}`,
      name: lang === "ml" ? "അധിക ഹാൾ (Additional Hall)" : "Additional Exam Hall",
      benchesCount: extraHallBenches,
      benchCapacity: 2,
      isAutomaticCapacity: false,
      reservedGender: "None",
      reservedClasses: [],
      reservedDivisions: [],
      reservedShift: "None",
    };

    // Seat students using the full intelligent seating grid algorithm with multi-class interleaving
    const extraBenches = seatStudentsInHallGrid(overflowStudents, extraHall, variationSeed, dispersionMode);
    finalAllocations.push({
      hallId: extraHall.id,
      hallName: extraHall.name,
      shift: activeShift,
      benches: extraBenches,
      totalStudents: totalOverflow,
    });

    // Clear remaining lists since all students are seated
    unallocatedStudents.push(...remainingBoys, ...remainingGirls);
    remainingBoys = [];
    remainingGirls = [];

    // Clear, comprehensive capacity notice in the user's selected language
    const parts: string[] = [];
    if (lang === "ml") {
      if (overflowBoysCount > 0) parts.push(`${overflowBoysCount} ആൺകുട്ടികൾ`);
      if (overflowGirlsCount > 0) parts.push(`${overflowGirlsCount} പെൺകുട്ടികൾ`);
      warnings.push(
        `കപ്പാസിറ്റി മുന്നറിയിപ്പ്: നിശ്ചിത ഹാളുകളിലേക്ക് അസൈൻ ചെയ്യാത്തതോ കപ്പാസിറ്റി തികയാത്തതോ ആയ ${totalOverflow} കുട്ടികൾക്ക് (${parts.join(", ")}) "അധിക ഹാൾ" ക്രമീകരിച്ച് ശാസ്ത്രീയമായി സീറ്റുകൾ നൽകിയിട്ടുണ്ട്. ഹാളുകളുടെ എണ്ണമോ ബെഞ്ചുകളുടെ കപ്പാസിറ്റിയോ ക്രമീകരിക്കാവുന്നതാണ്.`
      );
    } else {
      if (overflowBoysCount > 0) parts.push(`${overflowBoysCount} Boys`);
      if (overflowGirlsCount > 0) parts.push(`${overflowGirlsCount} Girls`);
      warnings.push(
        `Capacity Notice: ${totalOverflow} students (${parts.join(", ")}) not fitting into reserved halls have been assigned to an Additional Hall with optimized interleaving.`
      );
    }
  }

  // CRITICAL MADRASA EXAM REQUIREMENT: Strict Gender Zone Contiguity per Hall
  // In Madrasa examinations, once girls benches start, boys benches must NEVER appear afterwards.
  // All boys benches must be grouped together in one continuous block (at the front of the hall),
  // followed by all girls benches in one continuous block (or vice versa if hall is girls-reserved).
  finalAllocations.forEach((alloc) => {
    if (!alloc.benches || alloc.benches.length <= 1) return;

    // Detect if this hall started with girls (e.g. female reserved hall)
    const firstSeatedBench = alloc.benches.find((b) => b.some((s) => s.studentId !== null));
    const startsWithGirls = firstSeatedBench && firstSeatedBench.some((s) => isFemaleGender(s.studentGender));

    const boysBenches: SeatingSeat[][] = [];
    const girlsBenches: SeatingSeat[][] = [];
    const emptyBenches: SeatingSeat[][] = [];

    alloc.benches.forEach((row) => {
      const hasBoys = row.some((s) => s.studentId !== null && isMaleGender(s.studentGender));
      const hasGirls = row.some((s) => s.studentId !== null && isFemaleGender(s.studentGender));
      const isEmpty = !row.some((s) => s.studentId !== null);

      if (isEmpty) {
        emptyBenches.push(row);
      } else if (hasBoys && !hasGirls) {
        boysBenches.push(row);
      } else if (hasGirls && !hasBoys) {
        girlsBenches.push(row);
      } else {
        const mCount = row.filter((s) => isMaleGender(s.studentGender)).length;
        const fCount = row.filter((s) => isFemaleGender(s.studentGender)).length;
        if (mCount >= fCount) {
          boysBenches.push(row);
        } else {
          girlsBenches.push(row);
        }
      }
    });

    // Enforce contiguous layout:
    // Standard: All Boys benches first, then All Girls benches, then empty benches
    // If hall is female-reserved / starts with girls: All Girls first, then All Boys, then empty benches
    if (startsWithGirls) {
      alloc.benches = [...girlsBenches, ...boysBenches, ...emptyBenches];
    } else {
      alloc.benches = [...boysBenches, ...girlsBenches, ...emptyBenches];
    }

    // Re-index all benchIndex to match their real contiguous positions
    alloc.benches.forEach((row, bIdx) => {
      row.forEach((seat) => {
        seat.benchIndex = bIdx;
      });
    });
  });

  // Strict check for overcrowded benches (> 4 students seated on a bench)
  finalAllocations.forEach((alloc) => {
    let overcrowdedCount = 0;
    let maxDensity = 0;
    alloc.benches.forEach((row) => {
      const seated = row.filter((s) => s.studentId !== null).length;
      if (seated > 4) {
        overcrowdedCount++;
        if (seated > maxDensity) maxDensity = seated;
      }
    });

    if (overcrowdedCount > 0) {
      warnings.push(
        lang === "ml"
          ? `🚨 അതീവ മുന്നറിയിപ്പ് (${alloc.hallName}): ഈ ഹാളിലെ ${overcrowdedCount} ബെഞ്ചുകളിൽ 4-ൽ കൂടുതൽ കുട്ടികൾ (${maxDensity} കുട്ടികൾ വരെ) ഇരിക്കുന്നുണ്ട്! പരീക്ഷ സുഗമമാക്കാൻ ദയവായി കൂടുതൽ ബെഞ്ചുകൾ ചേർക്കുക.`
          : `🚨 Strict Warning (${alloc.hallName}): ${overcrowdedCount} benches have more than 4 students seated (up to ${maxDensity} per bench)! Please add more benches to solve overcrowding.`
      );
    }
  });

  // Final check for remaining students
  if (remainingBoys.length > 0 || remainingGirls.length > 0) {
    unallocatedStudents.push(...remainingBoys, ...remainingGirls);
    remainingBoys = [];
    remainingGirls = [];
  }

  if (unallocatedStudents && unallocatedStudents.length > 0) {
    warnings.unshift(
      lang === "ml"
        ? `⚠️ ആകെ ശേഷി തികയാത്തത് കാരണം അല്ലെങ്കിൽ ഹാൾ നിയന്ത്രണങ്ങൾ കാരണം ${unallocatedStudents.length} കുട്ടികൾക്ക് സീറ്റ് ലഭിച്ചിട്ടില്ല (Unallocated). ദയവായി ഹാളുകളിലെ ബെഞ്ചുകളുടെ എണ്ണം വർദ്ധിപ്പിക്കുകയോ ഹാൾ ക്ലാസ്സ് നിയന്ത്രണങ്ങൾ ഒഴിവാക്കുകയോ ചെയ്യുക.`
        : `⚠️ Consolidated Summary: ${unallocatedStudents.length} students remain unallocated due to total capacity limits or class restrictions across halls. Please increase hall bench counts or clear hall class restrictions.`
    );
  }

  return {
    shift: activeShift,
    allocations: finalAllocations,
    unallocatedStudents,
    warnings,
  };
}

/**
 * Core seat placement logic for a single hall
 * Implements Multi-Class Interleaving, Dynamic Spacing,
 * and Physical Row-by-Row Consecutive Paper Distribution Order
 */
function seatStudentsInHallGrid(students: Student[], hall: ExamHall, variationSeed: number = 0, dispersionMode: "full_dispersion" | "standard_paired" = "full_dispersion"): SeatingSeat[][] {
  const N = hall.benchesCount;
  const isAuto = hall.isAutomaticCapacity || hall.benchCapacity === 0;
  const C = isAuto ? Math.max(2, Math.ceil(students.length / N)) : hall.benchCapacity;
  const S = students.length;

  if (S === 0 || N <= 0) return createEmptyGrid(hall);

  // Split into boys and girls to maintain complete separation per bench
  const boys = students.filter((s) => s.gender === "Male");
  const girls = students.filter((s) => s.gender === "Female");

  // Determine single-class requirements for both genders
  const boysClassCounts: Record<string, number> = {};
  boys.forEach((b) => {
    const cl = (b.classLevel || "").toLowerCase();
    boysClassCounts[cl] = (boysClassCounts[cl] || 0) + 1;
  });
  const maxBoysSingleClass = Math.max(0, ...Object.values(boysClassCounts));

  const girlsClassCounts: Record<string, number> = {};
  girls.forEach((g) => {
    const cl = (g.classLevel || "").toLowerCase();
    girlsClassCounts[cl] = (girlsClassCounts[cl] || 0) + 1;
  });
  const maxGirlsSingleClass = Math.max(0, ...Object.values(girlsClassCounts));

  // Determine minimum benches required to ensure no two students of the same class share a bench:
  const minBoysBenches = boys.length > 0 ? Math.max(Math.ceil(boys.length / C), maxBoysSingleClass) : 0;
  const minGirlsBenches = girls.length > 0 ? Math.max(Math.ceil(girls.length / C), maxGirlsSingleClass) : 0;

  let N_boys = 0;
  let N_girls = 0;

  if (boys.length > 0 && girls.length === 0) {
    N_boys = N;
    N_girls = 0;
  } else if (girls.length > 0 && boys.length === 0) {
    N_boys = 0;
    N_girls = N;
  } else if (boys.length > 0 && girls.length > 0) {
    // Check if user explicitly set zone bench counts
    if (
      typeof hall.boysBenchesCount === "number" &&
      typeof hall.girlsBenchesCount === "number" &&
      hall.boysBenchesCount > 0 &&
      hall.girlsBenchesCount > 0 &&
      hall.boysBenchesCount + hall.girlsBenchesCount === N
    ) {
      N_boys = hall.boysBenchesCount;
      N_girls = hall.girlsBenchesCount;
    } else if (minBoysBenches + minGirlsBenches <= N) {
      // We have enough benches for both genders to have zero same-class conflicts!
      const spare = N - (minBoysBenches + minGirlsBenches);
      const boysRatio = boys.length / (boys.length + girls.length);
      const extraBoys = Math.round(spare * boysRatio);
      const extraGirls = spare - extraBoys;
      N_boys = minBoysBenches + extraBoys;
      N_girls = minGirlsBenches + extraGirls;
    } else {
      // When capacity is tight, prioritize benches according to single-class density
      let bestNBoys = 0;
      let maxSeated = -1;

      for (let nb = 0; nb <= N; nb++) {
        const ng = N - nb;
        const seatedBoysCount = Math.min(boys.length, nb * C);
        const seatedGirlsCount = Math.min(girls.length, ng * C);
        const totalSeated = seatedBoysCount + seatedGirlsCount;

        if (totalSeated > maxSeated) {
          maxSeated = totalSeated;
          bestNBoys = nb;
        } else if (totalSeated === maxSeated) {
          const idealRatio = boys.length / (boys.length + girls.length || 1);
          const currentRatio = nb / (N || 1);
          const prevBestRatio = bestNBoys / (N || 1);
          if (Math.abs(currentRatio - idealRatio) < Math.abs(prevBestRatio - idealRatio)) {
            bestNBoys = nb;
          }
        }
      }
      N_boys = bestNBoys;
      N_girls = N - N_boys;
    }
  }

  const boysToSeat = boys.slice(0, N_boys * C);
  const girlsToSeat = girls.slice(0, N_girls * C);

  // Helper to determine active column positions on a bench for a given count
  const getActiveColumnsForBench = (count: number, C: number, benchIdx: number): number[] => {
    if (count <= 0) return [];
    if (count >= C) {
      return Array.from({ length: C }, (_, i) => i);
    }

    if (count === 1) {
      return [benchIdx % 2 === 0 ? 0 : C - 1];
    }

    if (count === 2) {
      return [0, C - 1];
    }

    if (count === 3 && C === 4) {
      return [0, 2, 3];
    }

    const cols: number[] = [];
    const spacing = (C - 1) / (count - 1);
    for (let i = 0; i < count; i++) {
      cols.push(Math.round(i * spacing));
    }
    return cols;
  };

  // Seating engine for a specific gender section with STRICT Same-Class Bench Isolation & Front-to-Back Sequential Rolls
  const assignSectionSeats = (
    numBenches: number,
    studentsList: Student[]
  ): Student[][] => {
    if (studentsList.length === 0 || numBenches <= 0) return [];

    // 1. Group students by class level and sort each class group strictly by natural roll number
    const classGroups: { [key: string]: Student[] } = {};
    for (const s of studentsList) {
      if (!classGroups[s.classLevel]) {
        classGroups[s.classLevel] = [];
      }
      classGroups[s.classLevel].push(s);
    }
    for (const cl in classGroups) {
      classGroups[cl].sort((a, b) => {
        return compareRollNumbers(getStudentEffectiveRoll(a), getStudentEffectiveRoll(b));
      });
    }

    // 2. Sort classes by descending size so largest classes spread across distinct benches first
    const sortedClasses = Object.keys(classGroups).sort((a, b) => {
      const diff = classGroups[b].length - classGroups[a].length;
      if (diff !== 0) return diff;
      if (variationSeed > 0) {
        return ((a.charCodeAt(0) + variationSeed * 3) % 7) - ((b.charCodeAt(0) + variationSeed * 3) % 7);
      }
      return a.localeCompare(b);
    });

    const benchStudentsList: Student[][] = Array.from({ length: numBenches }, () => []);

    // 3. Place students one by one, giving lower roll numbers priority in earlier benches (front-to-back)
    for (const cl of sortedClasses) {
      const classStudents = [...classGroups[cl]];

      for (const student of classStudents) {
        let bestBenchIdx = -1;
        let bestScore = Infinity;

        for (let b = 0; b < numBenches; b++) {
          const currentBench = benchStudentsList[b];
          if (currentBench.length >= C) continue; // Bench is full

          let score = 0;

          // HARD CONSTRAINT: Check if bench already has a student of this exact same class
          const sameClassCount = currentBench.filter(
            (s) => s.classLevel.toLowerCase() === cl.toLowerCase()
          ).length;
          if (sameClassCount > 0) {
            score += 1000000 * sameClassCount; // Severe penalty for same-class on same bench
          }

          // Multi-Class Interleaving & Density Balance:
          // Pairing DIFFERENT classes on the same bench is the gold standard for exam seating.
          // Greatly prefer pairing with a different class over opening a far-away bench.
          if (currentBench.length > 0 && sameClassCount === 0) {
            score -= 10; // Reward for valid multi-class bench interleaving
          }
          score += currentBench.length * 50;

          // Sequential Front-to-Back Flow: prefer earlier benches for smaller roll numbers
          score += b * 5;

          // Vertical staggering: check if row in front or behind has the same class
          if (b > 0) {
            const prevHasClass = benchStudentsList[b - 1].some(
              (s) => s.classLevel.toLowerCase() === cl.toLowerCase()
            );
            if (prevHasClass) score += 30;
          }
          if (b + 1 < numBenches) {
            const nextHasClass = benchStudentsList[b + 1].some(
              (s) => s.classLevel.toLowerCase() === cl.toLowerCase()
            );
            if (nextHasClass) score += 30;
          }

          // Full Dispersion Spacing Reward: Maximize physical distance between benches of the same class
          const otherBenchesWithSameClass = benchStudentsList
            .map((bRow, bIdx) => ({ bIdx, hasClass: bRow.some((s) => s.classLevel.toLowerCase() === cl.toLowerCase()) }))
            .filter((x) => x.hasClass)
            .map((x) => x.bIdx);
          if (otherBenchesWithSameClass.length > 0) {
            const minDistance = Math.min(...otherBenchesWithSameClass.map((ob) => Math.abs(b - ob)));
            score -= minDistance * 40;
          }

          // Seed rotation tie-breaker
          if (variationSeed > 0) {
            const hash = (b * 11 + variationSeed * 5 + cl.charCodeAt(0)) % 19;
            score += hash;
          }

          if (score < bestScore) {
            bestScore = score;
            bestBenchIdx = b;
          }
        }

        if (bestBenchIdx !== -1) {
          benchStudentsList[bestBenchIdx].push(student);
        }
      }
    }

    // 4. POST-ALLOCATION CONFLICT REPAIR & SWAP ENGINE
    for (let pass = 0; pass < 20; pass++) {
      let resolvedAny = false;
      for (let b = 0; b < numBenches; b++) {
        const currentBench = benchStudentsList[b];
        const classes = currentBench.map((s) => s.classLevel.toLowerCase());
        const dupClass = classes.find((c, i) => classes.indexOf(c) !== i);

        if (dupClass) {
          let dupIdx = -1;
          for (let i = currentBench.length - 1; i >= 0; i--) {
            if (currentBench[i].classLevel.toLowerCase() === dupClass) {
              dupIdx = i;
              break;
            }
          }
          if (dupIdx === -1) continue;
          const dupStudent = currentBench[dupIdx];

          // 1. Try to move to any bench with room (< C) and NO student of dupClass
          let moved = false;
          for (let b2 = 0; b2 < numBenches; b2++) {
            if (b2 !== b && benchStudentsList[b2].length < C) {
              if (!benchStudentsList[b2].some((s) => s.classLevel.toLowerCase() === dupClass)) {
                currentBench.splice(dupIdx, 1);
                benchStudentsList[b2].push(dupStudent);
                moved = true;
                resolvedAny = true;
                break;
              }
            }
          }

          // 2. If no bench has empty space, try swapping with another student from another bench
          if (!moved) {
            for (let b2 = 0; b2 < numBenches; b2++) {
              if (b2 !== b && benchStudentsList[b2].length > 0) {
                for (let s2Idx = 0; s2Idx < benchStudentsList[b2].length; s2Idx++) {
                  const s2 = benchStudentsList[b2][s2Idx];
                  const s2Class = s2.classLevel.toLowerCase();

                  const bWithoutDup = currentBench.filter((_, i) => i !== dupIdx).map((s) => s.classLevel.toLowerCase());
                  const b2WithoutS2 = benchStudentsList[b2].filter((_, i) => i !== s2Idx).map((s) => s.classLevel.toLowerCase());

                  if (!bWithoutDup.includes(s2Class) && !b2WithoutS2.includes(dupClass)) {
                    currentBench[dupIdx] = s2;
                    benchStudentsList[b2][s2Idx] = dupStudent;
                    moved = true;
                    resolvedAny = true;
                    break;
                  }
                }
                if (moved) break;
              }
            }
          }
        }
      }
      if (!resolvedAny) break;
    }

    // 4.5 STRICT FRONT-TO-BACK SEQUENTIAL ROLL ORDER PER CLASS:
    const allAssignedClasses = new Set<string>();
    for (let b = 0; b < numBenches; b++) {
      for (const s of benchStudentsList[b]) {
        allAssignedClasses.add(s.classLevel);
      }
    }

    for (const cl of allAssignedClasses) {
      const occurrences: { benchIdx: number; studentIdx: number; student: Student }[] = [];
      for (let b = 0; b < numBenches; b++) {
        for (let sIdx = 0; sIdx < benchStudentsList[b].length; sIdx++) {
          if (benchStudentsList[b][sIdx].classLevel.toLowerCase() === cl.toLowerCase()) {
            occurrences.push({
              benchIdx: b,
              studentIdx: sIdx,
              student: benchStudentsList[b][sIdx],
            });
          }
        }
      }

      // Sort students naturally by roll number
      const sortedClassStudents = occurrences
        .map((o) => o.student)
        .sort((a, b) => compareRollNumbers(getStudentEffectiveRoll(a), getStudentEffectiveRoll(b)));

      // Reassign in strict front-to-back bench index order
      occurrences.forEach((occ, i) => {
        benchStudentsList[occ.benchIdx][occ.studentIdx] = sortedClassStudents[i];
      });
    }

    return benchStudentsList;
  };

  // 1. Allocate Boys first
  const initialBoysBenches = assignSectionSeats(N_boys, boysToSeat);
  const activeBoysBenches = initialBoysBenches.filter((b) => b.length > 0);

  // 2. Hand over ALL unused spare benches from boys directly to girls!
  // This guarantees that girls are NEVER starved of benches while earlier boys benches sit empty!
  const spareBenchesFromBoys = Math.max(0, N_boys - activeBoysBenches.length);
  const girlsAvailableBenches = N_girls + spareBenchesFromBoys;

  // 3. Allocate Girls with full available capacity
  const initialGirlsBenches = assignSectionSeats(girlsAvailableBenches, girlsToSeat);
  const activeGirlsBenches = initialGirlsBenches.filter((b) => b.length > 0);

  // 4. Build contiguous seating list:
  // Standard: All Boys benches first, then All Girls benches, followed by empty benches
  // If hall is female-reserved / starts with girls: All Girls first, then Boys
  const startsWithGirls = hall.reservedGender === "Female";
  const allActiveBenches = startsWithGirls
    ? [...activeGirlsBenches, ...activeBoysBenches]
    : [...activeBoysBenches, ...activeGirlsBenches];

  // 5. Build final grid with contiguous numbering from 0 to N-1
  const grid: SeatingSeat[][] = [];
  for (let b = 0; b < N; b++) {
    const benchRow: SeatingSeat[] = [];
    const bStudents = b < allActiveBenches.length ? allActiveBenches[b] : [];
    const count = bStudents.length;

    if (count === 0) {
      // Empty bench at the end of the hall
      for (let s = 0; s < C; s++) {
        benchRow.push({
          benchIndex: b,
          seatIndexOnBench: s,
          studentId: null,
        });
      }
    } else {
      // Occupied bench: layout with optimal spacing and staggering
      const activeCols = getActiveColumnsForBench(count, C, b);
      const prevRow = b > 0 ? grid[b - 1] : null;
      const optimizedStudents = getOptimalBenchArrangement(bStudents, activeCols, prevRow);

      const assignedColMap = new Map<number, Student>();
      for (let i = 0; i < activeCols.length; i++) {
        assignedColMap.set(activeCols[i], optimizedStudents[i]);
      }

      for (let s = 0; s < C; s++) {
        const student = assignedColMap.get(s);
        if (student) {
          benchRow.push({
            benchIndex: b,
            seatIndexOnBench: s,
            studentId: student.id,
            studentName: student.name,
            studentClass: student.classLevel,
            studentGender: student.gender,
            studentDivision: student.division || "A",
            studentAdmissionNo: student.admissionNumber,
            studentRollNo: getStudentEffectiveRoll(student),
          });
        } else {
          benchRow.push({
            benchIndex: b,
            seatIndexOnBench: s,
            studentId: null,
          });
        }
      }
    }

    grid.push(benchRow);
  }

  return grid;
}

/**
 * Mathematically finds the optimal student permutation for a single bench
 * to strictly prevent adjacent same-class students, maximize physical distance,
 * and stagger vertically with the bench in front.
 */
function getOptimalBenchArrangement(
  students: Student[],
  activeCols: number[],
  prevBenchRow: SeatingSeat[] | null
): Student[] {
  const K = students.length;
  if (K <= 1) return students;

  // Generate all permutations of indices 0..K-1
  const perms: number[][] = [];
  const generatePermutations = (curr: number[], used: boolean[]) => {
    if (curr.length === K) {
      perms.push([...curr]);
      return;
    }
    for (let i = 0; i < K; i++) {
      if (!used[i]) {
        used[i] = true;
        curr.push(i);
        generatePermutations(curr, used);
        curr.pop();
        used[i] = false;
      }
    }
  };
  generatePermutations([], new Array(K).fill(false));

  let bestPerm = perms[0];
  let minScore = Infinity;

  for (const perm of perms) {
    const candidateStudents = perm.map((idx) => students[idx]);
    let score = 0;

    // 1. ABSOLUTE TOP PRIORITY: Penalize adjacent same-class seats on the same bench heavily!
    for (let i = 0; i < K - 1; i++) {
      if (candidateStudents[i].classLevel.toLowerCase() === candidateStudents[i + 1].classLevel.toLowerCase()) {
        score += 1000000;
      }
    }

    // 2. Secondary penalty: 1-seat gap on same bench sharing same class
    for (let i = 0; i < K - 2; i++) {
      if (candidateStudents[i].classLevel.toLowerCase() === candidateStudents[i + 2].classLevel.toLowerCase()) {
        score += 1000;
      }
    }

    // 3. Vertical alignment staggering with bench in front
    if (prevBenchRow) {
      for (let i = 0; i < K; i++) {
        const col = activeCols[i];
        const prevSeat = prevBenchRow[col];
        if (
          prevSeat &&
          prevSeat.studentClass &&
          prevSeat.studentClass.toLowerCase() === candidateStudents[i].classLevel.toLowerCase()
        ) {
          score += 500;
        }
      }
    }

    if (score < minScore) {
      minScore = score;
      bestPerm = perm;
    }
  }

  return bestPerm.map((idx) => students[idx]);
}

/**
 * Assign a student's profile snapshot directly into a seat
 */
function assignSeat(seat: SeatingSeat, student: Student) {
  if (!student) return;
  seat.studentId = student.id;
  seat.studentName = student.name;
  seat.studentClass = student.classLevel;
  seat.studentGender = student.gender;
  seat.studentDivision = student.division || "A";
  seat.studentAdmissionNo = student.admissionNumber;
  seat.studentRollNo = getStudentEffectiveRoll(student);
}

export function createEmptyGrid(hall: ExamHall): SeatingSeat[][] {
  const grid: SeatingSeat[][] = [];
  const C = (hall.isAutomaticCapacity || hall.benchCapacity === 0) ? 3 : hall.benchCapacity;
  for (let b = 0; b < hall.benchesCount; b++) {
    const row: SeatingSeat[] = [];
    for (let s = 0; s < C; s++) {
      row.push({
        benchIndex: b,
        seatIndexOnBench: s,
        studentId: null,
      });
    }
    grid.push(row);
  }
  return grid;
}

export interface BenchSameClassAnalysis {
  hasSameClass: boolean;
  isAdjacentConflict: boolean; // Direct copying risk: same class seated side-by-side without empty space
  isSafeSpaced: boolean;       // Same class, but only 2 students seated at opposite ends with empty gap in between!
  isMildCaution: boolean;      // Same class on a 3+ student bench
  conflictingClass: string | null;
  adjacentPairIndices: number[]; // e.g. [0, 1]
  statusLabel: {
    ml: string;
    en: string;
  };
  severity: "none" | "safe" | "mild" | "severe";
}

/**
 * Smart Bench Same-Class Proximity & Gap Analyzer
 * Evaluates whether students of the same class on a bench pose an exam copying risk:
 * 1. Adjacent Same Class (തൊട്ടടുത്തിരിക്കൽ - No empty gap between them): Severe Warning!
 * 2. 2 students seated at opposite ends with gap (2 പേർ മാത്രം, 2 അറ്റങ്ങളിലായി ഗ്യാപ്പോടെ ഇരിക്കൽ): Safe Spaced! (No warning needed)
 * 3. 3+ students on the same bench with same class: Mild Caution.
 */
export function evaluateBenchSameClass(row: SeatingSeat[]): BenchSameClassAnalysis {
  const occupied = row
    .map((s, idx) => ({ seat: s, sIdx: idx }))
    .filter((item) => item.seat.studentId !== null && item.seat.studentClass);

  if (occupied.length < 2) {
    return {
      hasSameClass: false,
      isAdjacentConflict: false,
      isSafeSpaced: false,
      isMildCaution: false,
      conflictingClass: null,
      adjacentPairIndices: [],
      statusLabel: { ml: "", en: "" },
      severity: "none",
    };
  }

  // Group seated indices by class level
  const classGroups: Record<string, number[]> = {};
  occupied.forEach((item) => {
    const cls = item.seat.studentClass!;
    if (!classGroups[cls]) classGroups[cls] = [];
    classGroups[cls].push(item.sIdx);
  });

  const duplicateClasses = Object.keys(classGroups).filter(
    (cls) => classGroups[cls].length > 1
  );

  if (duplicateClasses.length === 0) {
    return {
      hasSameClass: false,
      isAdjacentConflict: false,
      isSafeSpaced: false,
      isMildCaution: false,
      conflictingClass: null,
      adjacentPairIndices: [],
      statusLabel: { ml: "", en: "" },
      severity: "none",
    };
  }

  const primaryClass = duplicateClasses[0];
  const indices = classGroups[primaryClass]; // e.g. [0, 1] or [0, 3]

  // Check if any two students of the same class sit immediately next to each other
  const adjacentPairIndices: number[] = [];
  for (let i = 0; i < indices.length - 1; i++) {
    if (Math.abs(indices[i] - indices[i + 1]) === 1) {
      adjacentPairIndices.push(indices[i], indices[i + 1]);
    }
  }

  if (adjacentPairIndices.length > 0) {
    // SEVERE: Seated directly side-by-side with no gap!
    return {
      hasSameClass: true,
      isAdjacentConflict: true,
      isSafeSpaced: false,
      isMildCaution: false,
      conflictingClass: primaryClass,
      adjacentPairIndices,
      statusLabel: {
        ml: `🚨 തൊട്ടടുത്ത് ഒരേ ക്ലാസ്സ് (${primaryClass})`,
        en: `🚨 Adjacent Same Class (${primaryClass})`,
      },
      severity: "severe",
    };
  }

  // If there is NO adjacent pair:
  // Is this bench having only 2 students total, and they are seated at the opposite ends with at least 1 empty seat gap?
  if (occupied.length === 2 && indices.length === 2) {
    const gap = Math.abs(indices[0] - indices[1]) - 1;
    if (gap >= 1) {
      // Exactly what user requested:
      // "aake oro bengil 2 per matrame irikkunnulloo engil benginte 2 attathavum arav irikkuka. Appol swabhavikamayum avide gap undavum. Avide warninginye aavashayam varunnillalllo.."
      return {
        hasSameClass: true,
        isAdjacentConflict: false,
        isSafeSpaced: true,
        isMildCaution: false,
        conflictingClass: primaryClass,
        adjacentPairIndices: [],
        statusLabel: {
          ml: `🛡️ അകലം പാലിച്ചിരിക്കുന്നു (സേഫ് ഗ്യാപ്പ്)`,
          en: `🛡️ Safe Spaced Ends (Gap)`,
        },
        severity: "safe",
      };
    }
  }

  // If there are 3 or more students on the bench with duplicate classes:
  return {
    hasSameClass: true,
    isAdjacentConflict: false,
    isSafeSpaced: false,
    isMildCaution: true,
    conflictingClass: primaryClass,
    adjacentPairIndices: [],
    statusLabel: {
      ml: `⚠️ ഒരേ ക്ലാസ്സ് (${primaryClass})`,
      en: `⚠️ Same Class (${primaryClass})`,
    },
    severity: "mild",
  };
}

/**
 * Helper to test male gender robustly
 */
export function isMaleGender(gender?: string): boolean {
  if (!gender) return false;
  const g = gender.toLowerCase().trim();
  return g === "male" || g === "boy" || g === "m" || g.includes("ആൺ");
}

/**
 * Helper to test female gender robustly
 */
export function isFemaleGender(gender?: string): boolean {
  if (!gender) return false;
  const g = gender.toLowerCase().trim();
  return g === "female" || g === "girl" || g === "f" || g.includes("പെൺ");
}

/**
 * Gender Separation Validator for Madrasa Exam Benches
 * In Madrasa examinations, boys and girls must NEVER sit together on the same bench.
 */
export interface BenchGenderAnalysis {
  hasGenderConflict: boolean;
  boysCount: number;
  girlsCount: number;
  statusLabel: {
    ml: string;
    en: string;
  };
}

export function evaluateBenchGender(
  benchSeats: SeatingSeat[],
  studentsList?: Student[]
): BenchGenderAnalysis {
  let boysCount = 0;
  let girlsCount = 0;

  benchSeats.forEach((s) => {
    if (s.studentId) {
      let g = s.studentGender;
      if (!g && studentsList) {
        const found = studentsList.find((st) => st.id === s.studentId);
        if (found) g = found.gender;
      }
      if (isMaleGender(g)) {
        boysCount++;
      } else if (isFemaleGender(g)) {
        girlsCount++;
      }
    }
  });

  const hasGenderConflict = boysCount > 0 && girlsCount > 0;

  return {
    hasGenderConflict,
    boysCount,
    girlsCount,
    statusLabel: {
      ml: hasGenderConflict
        ? `🚨 അതീവ ഗുരുതര മുന്നറിയിപ്പ്: ആൺകുട്ടികളും പെൺകുട്ടികളും ഒരേ ബെഞ്ചിൽ (${boysCount} ആൺ + ${girlsCount} പെൺ)!`
        : "",
      en: hasGenderConflict
        ? `🚨 CRITICAL GENDER CONFLICT: Boys & Girls on Same Bench (${boysCount} Boys + ${girlsCount} Girls)!`
        : "",
    },
  };
}

/**
 * Intelligent Seating Density Analyzer (1-6 students/bench, 2 per bench ideal suggestion)
 */
export interface BenchDensityAnalysis {
  seatedCount: number;
  capacity: number;
  level: "empty" | "safe" | "ideal" | "moderate" | "high" | "critical";
  labelMl: string;
  labelEn: string;
  badgeClass: string;
  recommendationMl: string;
  recommendationEn: string;
}

export function evaluateBenchDensity(
  benchSeats: SeatingSeat[],
  benchCapacity: number = 4
): BenchDensityAnalysis {
  const seatedCount = benchSeats.filter((s) => s.studentId !== null && s.studentId !== "").length;

  if (seatedCount === 0) {
    return {
      seatedCount: 0,
      capacity: benchCapacity,
      level: "empty",
      labelMl: "ശൂന്യമായ ബെഞ്ച് (0)",
      labelEn: "Empty Bench (0)",
      badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
      recommendationMl: "ആവശ്യമെങ്കിൽ മറ്റ് ഹാളുകളിൽ നിന്നുള്ള വിദ്യാർത്ഥികളെ ഇവിടെ ഇരുത്താം.",
      recommendationEn: "Can be utilized for students from other crowded halls.",
    };
  }

  if (seatedCount === 1) {
    return {
      seatedCount: 1,
      capacity: benchCapacity,
      level: "safe",
      labelMl: "സുരക്ഷിത അകലം (1 കുട്ടി)",
      labelEn: "Spacious (1 Student)",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      recommendationMl: "പൂർണ്ണ സുരക്ഷിത അകലം. കോപ്പിയടി സാധ്യത ഒട്ടുമില്ല.",
      recommendationEn: "Complete safe distance. Zero copying possibility.",
    };
  }

  if (seatedCount === 2) {
    return {
      seatedCount: 2,
      capacity: benchCapacity,
      level: "ideal",
      labelMl: "✨ ഉത്തമ ക്രമീകരണം (2 കുട്ടികൾ)",
      labelEn: "✨ Ideal Standard (2 Students)",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold shadow-2xs",
      recommendationMl: "മദ്റസാ പരീക്ഷകളിൽ ഏറ്റവും ഉത്തമമായ ക്രമീകരണം (ഇരു അറ്റങ്ങളിലായി ഗ്യാപ്പ് പാലിച്ചിരിക്കുന്നു).",
      recommendationEn: "Gold Standard for Madrasa exams (both ends utilized with proper gap in between).",
    };
  }

  if (seatedCount === 3) {
    return {
      seatedCount: 3,
      capacity: benchCapacity,
      level: "moderate",
      labelMl: "ഇടത്തരം സാന്ദ്രത (3 കുട്ടികൾ)",
      labelEn: "Moderate Density (3 Students)",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300 font-bold",
      recommendationMl: "ശ്രദ്ധിക്കുക: വ്യത്യസ്ത ക്ലാസുകളിലെ കുട്ടികളെ ഇടകലർത്തി ഇരുത്തുന്നത് ഉറപ്പാക്കുക (സാധ്യമെങ്കിൽ 2 കുട്ടികൾ വീതമാക്കുക).",
      recommendationEn: "Caution: Ensure alternating classes. Consider reducing to 2 per bench if halls are available.",
    };
  }

  if (seatedCount === 4) {
    return {
      seatedCount: 4,
      capacity: benchCapacity,
      level: "high",
      labelMl: "ഉയർന്ന സാന്ദ്രത (4 കുട്ടികൾ - പരമാവധി)",
      labelEn: "High Density (4 Students - Max)",
      badgeClass: "bg-orange-100 text-orange-800 border-orange-300 font-extrabold",
      recommendationMl: "പരമാവധി കപ്പാസിറ്റി. കൂടുതൽ ഹാളുകളോ ബെഞ്ചുകളോ നൽകി 2 കുട്ടികൾ വീതമുള്ള ഉത്തമ രീതിയിലേക്ക് മാറ്റുന്നത് പരീക്ഷാ പരിശുദ്ധി കൂട്ടും.",
      recommendationEn: "Maximum allowable limit. Providing extra benches to achieve 2 per bench is strongly recommended.",
    };
  }

  // 5 or 6 or more
  return {
    seatedCount,
    capacity: benchCapacity,
    level: "critical",
    labelMl: `🚨 ഗുരുതര തിങ്ങിനിറയൽ (${seatedCount} കുട്ടികൾ)`,
    labelEn: `🚨 Critical Overcrowding (${seatedCount} Students)`,
    badgeClass: "bg-red-600 text-white border-red-700 font-black animate-pulse shadow-md",
    recommendationMl: `അതീവ ഗുരുതരം! ബെഞ്ചിൽ കുട്ടികൾ തിങ്ങിനിറഞ്ഞിരിക്കുന്നു (${seatedCount} പേർ). ഉടൻ അധിക ബെഞ്ചുകൾ ചേർക്കുകയോ മറ്റൊരു ഹാളിലേക്ക് മാറ്റുകയോ ചെയ്യുക.`,
    recommendationEn: `Critical overcrowding (${seatedCount} students). Immediately add extra benches or distribute across other halls.`,
  };
}


