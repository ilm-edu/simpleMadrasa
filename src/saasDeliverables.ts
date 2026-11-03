export const postgresSchema = `-- Madrasa SaaS Exam & Hall Seating Database Schema (PostgreSQL)
-- Fully optimized for quick querying, indexing, and multi-tenant isolation.

-- 1. Tenant/Madrasa Table
CREATE TABLE madrasas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Students Table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID REFERENCES madrasas(id) ON DELETE CASCADE,
    admission_number VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female')),
    dob DATE,
    father_name VARCHAR(255),
    phone VARCHAR(20),
    delivery_address TEXT,
    class_level VARCHAR(50) NOT NULL, -- e.g. "Class 5", "Class 6"
    division VARCHAR(10) NOT NULL,    -- e.g. "A", "B"
    shift VARCHAR(50) NOT NULL,       -- e.g. "Morning", "Afternoon"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_adm_per_madrasa UNIQUE (madrasa_id, admission_number)
);

-- 3. Exam Halls Table
CREATE TABLE exam_halls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID REFERENCES madrasas(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    benches_count INT NOT NULL DEFAULT 10,
    bench_capacity INT NOT NULL DEFAULT 2, -- e.g. 2 or 3 students per bench
    reserved_gender VARCHAR(10) NOT NULL DEFAULT 'None' CHECK (reserved_gender IN ('Male', 'Female', 'None')),
    reserved_classes VARCHAR(50)[] NOT NULL DEFAULT '{}', -- array of classes reserved, empty = none
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Active Shift Settings
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID REFERENCES madrasas(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- e.g. "Morning", "Afternoon"
    start_time TIME,
    end_time TIME,
    CONSTRAINT unique_shift_per_madrasa UNIQUE (madrasa_id, name)
);

-- 5. Seat Allocations Table
-- Stores the dynamic layout and mapping per exam/shift session
CREATE TABLE seat_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID REFERENCES madrasas(id) ON DELETE CASCADE,
    hall_id UUID REFERENCES exam_halls(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    shift_name VARCHAR(50) NOT NULL,
    bench_index INT NOT NULL,     -- 0 to benches_count - 1
    seat_index INT NOT NULL,      -- 0 to bench_capacity - 1
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_seat_per_shift UNIQUE (hall_id, shift_name, bench_index, seat_index),
    CONSTRAINT unique_student_per_shift UNIQUE (student_id, shift_name)
);

-- 6. Exam Attendance Records
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID REFERENCES madrasas(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    shift_name VARCHAR(50) NOT NULL,
    exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(10) NOT NULL DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Excused')),
    invigilator_signature VARCHAR(255),
    verified_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_student_attendance UNIQUE (student_id, shift_name, exam_date)
);

-- Performance Indexes
CREATE INDEX idx_students_gender_shift ON students(madrasa_id, gender, shift);
CREATE INDEX idx_students_class_div ON students(madrasa_id, class_level, division);
CREATE INDEX idx_seat_alloc_student ON seat_allocations(student_id);
CREATE INDEX idx_seat_alloc_hall_shift ON seat_allocations(hall_id, shift_name);
`;

export const pythonScript = `import math
import json

class MadrasaSeatingAllocator:
    def __init__(self, students, halls):
        """
        students: list of dicts. Keys: id, name, gender, classLevel, division, shift, admissionNumber
        halls: list of dicts. Keys: id, name, benchesCount, benchCapacity, reservedGender, reservedClasses
        """
        self.students = students
        self.halls = halls

    def allocate_seating(self, active_shift):
        warnings = []
        unallocated_students = []
        allocations = []

        # 1. Filter students by active shift
        shift_students = [s for s in self.students if s.get('shift', '').lower() == active_shift.lower()]
        if not shift_students:
            return {
                "shift": active_shift,
                "allocations": [],
                "unallocated": [],
                "warnings": ["No students found for this shift."]
            }

        # Separate by gender
        boys = [s for s in shift_students if s.get('gender') == 'Male']
        girls = [s for s in shift_students if s.get('gender') == 'Female']

        # 2. Separate halls
        strict_boys_halls = [h for h in self.halls if h.get('reservedGender') == 'Male']
        strict_girls_halls = [h for h in self.halls if h.get('reservedGender') == 'Female']
        neutral_halls = [h for h in self.halls if h.get('reservedGender', 'None') == 'None' or not h.get('reservedGender')]

        # Greedy distribution of neutral halls based on student volume
        get_cap = lambda h: h.get('benchesCount', 10) * h.get('benchCapacity', 2)
        strict_boys_cap = sum(get_cap(h) for h in strict_boys_halls)
        strict_girls_cap = sum(get_cap(h) for h in strict_girls_halls)

        rem_boys = max(0, len(boys) - strict_boys_cap)
        rem_girls = max(0, len(girls) - strict_girls_cap)

        boys_halls = list(strict_boys_halls)
        girls_halls = list(strict_girls_halls)

        # Sort neutral halls by capacity descending
        sorted_neutral = sorted(neutral_halls, key=get_cap, reverse=True)
        for hall in sorted_neutral:
            if rem_boys == 0 and rem_girls == 0:
                if len(boys) > len(girls):
                    boys_halls.append(hall)
                else:
                    girls_halls.append(hall)
            elif rem_boys > rem_girls:
                boys_halls.append(hall)
                rem_boys = max(0, rem_boys - get_cap(hall))
            else:
                girls_halls.append(hall)
                rem_girls = max(0, rem_girls - get_cap(hall))

        # 3. Perform allocation for each gender
        boys_allocs = self._allocate_gender(boys, boys_halls, active_shift, warnings, unallocated_students)
        girls_allocs = self._allocate_gender(girls, girls_halls, active_shift, warnings, unallocated_students)

        return {
            "shift": active_shift,
            "allocations": boys_allocs + girls_allocs,
            "unallocatedStudents": unallocated_students,
            "warnings": warnings
        }

    def _allocate_gender(self, students, halls, shift, warnings, unallocated_students):
        if not students:
            return []
        if not halls:
            warnings.append(f"No halls allocated for {students[0]['gender']} students in this shift.")
            unallocated_students.extend(students)
            return []

        remaining = list(students)
        allocations = []

        # Divide halls into reserved class halls and general halls
        reserved_halls = [h for h in halls if h.get('reservedClasses')]
        general_halls = [h for h in halls if not h.get('reservedClasses')]

        # Reserve halls process
        for hall in reserved_halls:
            res_classes = [c.lower() for c in hall.get('reservedClasses', [])]
            matching = [s for s in remaining if s.get('classLevel', '').lower() in res_classes]
            
            hall_cap = hall['benchesCount'] * hall['benchCapacity']
            to_seat = matching[:hall_cap]

            if len(matching) > hall_cap:
                warnings.append(f"Reserved hall {hall['name']} over-subscribed. Seating limit reached ({hall_cap}).")

            if to_seat:
                benches = self._seat_grid(to_seat, hall)
                allocations.append({
                    "hallId": hall['id'],
                    "hallName": hall['name'],
                    "shift": shift,
                    "benches": benches,
                    "totalStudents": len(to_seat)
                })
                seated_ids = {s['id'] for s in to_seat}
                remaining = [s for s in remaining if s['id'] not in seated_ids]
            else:
                allocations.append({
                    "hallId": hall['id'],
                    "hallName": hall['name'],
                    "shift": shift,
                    "benches": self._empty_grid(hall),
                    "totalStudents": 0
                })

        # General halls process
        for hall in general_halls:
            if not remaining:
                break
            hall_cap = hall['benchesCount'] * hall['benchCapacity']
            to_seat = remaining[:hall_cap]

            benches = self._seat_grid(to_seat, hall)
            allocations.append({
                "hallId": hall['id'],
                "hallName": hall['name'],
                "shift": shift,
                "benches": benches,
                "totalStudents": len(to_seat)
            })
            seated_ids = {s['id'] for s in to_seat}
            remaining = [s for s in remaining if s['id'] not in seated_ids]

        if remaining:
            gender_label = "Boys" if students[0]['gender'] == 'Male' else "Girls"
            warnings.append(f"Capacity Warning: {len(remaining)} {gender_label} student(s) could not be seated due to insufficient hall capacity!")
            unallocated_students.extend(remaining)

        return allocations

    def _seat_grid(self, students, hall):
        N = hall['benchesCount']
        C = hall['benchCapacity']
        S = len(students)

        # Initialize Grid
        grid = [[{"benchIndex": b, "seatIndexOnBench": s, "studentId": None} for s in range(C)] for b in range(N)]

        if S == 0:
            return grid

        # Multi-Class Interleaving
        class_groups = {}
        for s in students:
            cl = s['classLevel']
            if cl not in class_groups:
                class_groups[cl] = []
            class_groups[cl].append(s)

        interleaved = []
        active_keys = [k for k in class_groups.keys() if len(class_groups[k]) > 0]
        while active_keys:
            for k in active_keys:
                if class_groups[k]:
                    interleaved.append(class_groups[k].pop(0))
            active_keys = [k for k in class_groups.keys() if len(class_groups[k]) > 0]

        # Dynamic Spacing & Bench allocation
        base = S // N
        remainder = S % N

        target_counts = [base] * N
        if remainder > 0:
            for r in range(remainder):
                spaced_idx = int((r * N) / remainder)
                target_counts[spaced_idx] += 1

        student_idx = 0
        for b in range(N):
            count = target_counts[b]
            if count == 0:
                continue

            if C == 2:
                if count == 1:
                    seat = 0 if b % 2 == 0 else 1
                    self._assign(grid[b][seat], interleaved[student_idx])
                    student_idx += 1
                elif count == 2:
                    self._assign(grid[b][0], interleaved[student_idx])
                    student_idx += 1
                    self._assign(grid[b][1], interleaved[student_idx])
                    student_idx += 1
            elif C == 3:
                if count == 1:
                    seat = 0 if b % 2 == 0 else 2
                    self._assign(grid[b][seat], interleaved[student_idx])
                    student_idx += 1
                elif count == 2:
                    self._assign(grid[b][0], interleaved[student_idx])
                    student_idx += 1
                    self._assign(grid[b][2], interleaved[student_idx])
                    student_idx += 1
                elif count == 3:
                    for seat in [0, 1, 2]:
                        self._assign(grid[b][seat], interleaved[student_idx])
                        student_idx += 1
            else:
                spacing = C / count
                for sc in range(count):
                    seat = int(sc * spacing)
                    if student_idx < len(interleaved) and seat < C:
                        self._assign(grid[b][seat], interleaved[student_idx])
                        student_idx += 1

        return grid

    def _assign(self, seat_dict, student):
        seat_dict['studentId'] = student['id']
        seat_dict['studentName'] = student['name']
        seat_dict['studentClass'] = student['classLevel']
        seat_dict['studentDivision'] = student['division']
        seat_dict['studentGender'] = student['gender']
        seat_dict['studentAdmissionNo'] = student['admissionNumber']

    def _empty_grid(self, hall):
        return [[{"benchIndex": b, "seatIndexOnBench": s, "studentId": None} for s in range(hall['benchCapacity'])] for b in range(hall['benchesCount'])]
`;

export const nodeScript = `// Node.js implementation of Madrasa Exam Hall Seating Allocation
// Alternates classes on benches, separates boys and girls, and supports Dynamic Spacing.

function runSeatingAllocation(students, halls, activeShift) {
  const warnings = [];
  const unallocatedStudents = [];

  const shiftStudents = students.filter(s => s.shift.toLowerCase() === activeShift.toLowerCase());
  if (shiftStudents.length === 0) {
    return { shift: activeShift, allocations: [], unallocatedStudents: [], warnings: ["No students in this shift"] };
  }

  const boys = shiftStudents.filter(s => s.gender === "Male");
  const girls = shiftStudents.filter(s => s.gender === "Female");

  const strictBoysHalls = halls.filter(h => h.reservedGender === "Male");
  const strictGirlsHalls = halls.filter(h => h.reservedGender === "Female");
  const neutralHalls = halls.filter(h => h.reservedGender === "None" || !h.reservedGender);

  const getCap = h => h.benchesCount * h.benchCapacity;
  const boysCap = strictBoysHalls.reduce((acc, h) => acc + getCap(h), 0);
  const girlsCap = strictGirlsHalls.reduce((acc, h) => acc + getCap(h), 0);

  let remBoys = Math.max(0, boys.length - boysCap);
  let remGirls = Math.max(0, girls.length - girlsCap);

  const boysHalls = [...strictBoysHalls];
  const girlsHalls = [...strictGirlsHalls];

  const sortedNeutral = [...neutralHalls].sort((a, b) => getCap(b) - getCap(a));
  for (const hall of sortedNeutral) {
    if (remBoys === 0 && remGirls === 0) {
      if (boys.length > girls.length) boysHalls.push(hall);
      else girlsHalls.push(hall);
    } else if (remBoys > remGirls) {
      boysHalls.push(hall);
      remBoys = Math.max(0, remBoys - getCap(hall));
    } else {
      girlsHalls.push(hall);
      remGirls = Math.max(0, remGirls - getCap(hall));
    }
  }

  const boysAlloc = allocateGender(boys, boysHalls, activeShift, warnings, unallocatedStudents);
  const girlsAlloc = allocateGender(girls, girlsHalls, activeShift, warnings, unallocatedStudents);

  return {
    shift: activeShift,
    allocations: [...boysAlloc, ...girlsAlloc],
    unallocatedStudents,
    warnings
  };
}

function allocateGender(students, halls, shift, warnings, unallocatedStudents) {
  if (students.length === 0) return [];
  if (halls.length === 0) {
    warnings.push(\`No halls available to seat \${students.length} \${students[0].gender} students.\`);
    unallocatedStudents.push(...students);
    return [];
  }

  let remaining = [...students];
  const allocations = [];

  const reservedHalls = halls.filter(h => h.reservedClasses && h.reservedClasses.length > 0);
  const generalHalls = halls.filter(h => !h.reservedClasses || h.reservedClasses.length === 0);

  for (const hall of reservedHalls) {
    const resClasses = hall.reservedClasses.map(c => c.toLowerCase());
    const matching = remaining.filter(s => resClasses.includes(s.classLevel.toLowerCase()));
    const cap = hall.benchesCount * hall.benchCapacity;
    const toSeat = matching.slice(0, cap);

    if (matching.length > cap) {
      warnings.push(\`Reserved hall \${hall.name} over-subscribed.\`);
    }

    if (toSeat.length > 0) {
      allocations.push({
        hallId: hall.id,
        hallName: hall.name,
        shift,
        benches: seatGrid(toSeat, hall),
        totalStudents: toSeat.length
      });
      const seatedIds = new Set(toSeat.map(s => s.id));
      remaining = remaining.filter(s => !seatedIds.has(s.id));
    } else {
      allocations.push({
        hallId: hall.id,
        hallName: hall.name,
        shift,
        benches: emptyGrid(hall),
        totalStudents: 0
      });
    }
  }

  for (const hall of generalHalls) {
    if (remaining.length === 0) break;
    const cap = hall.benchesCount * hall.benchCapacity;
    const toSeat = remaining.slice(0, cap);

    allocations.push({
      hallId: hall.id,
      hallName: hall.name,
      shift,
      benches: seatGrid(toSeat, hall),
      totalStudents: toSeat.length
    });
    const seatedIds = new Set(toSeat.map(s => s.id));
    remaining = remaining.filter(s => !seatedIds.has(s.id));
  }

  if (remaining.length > 0) {
    const label = students[0].gender === "Male" ? "Boys" : "Girls";
    warnings.push(\`Capacity Warning: \${remaining.length} \s\${label} student(s) could not be seated.\`);
    unallocatedStudents.push(...remaining);
  }

  return allocations;
}

function seatGrid(students, hall) {
  const N = hall.benchesCount;
  const C = hall.benchCapacity;
  const S = students.length;

  const grid = Array.from({ length: N }, (_, b) =>
    Array.from({ length: C }, (_, s) => ({ benchIndex: b, seatIndexOnBench: s, studentId: null }))
  );

  if (S === 0) return grid;

  // Interleave
  const groups = {};
  for (const s of students) {
    if (!groups[s.classLevel]) groups[s.classLevel] = [];
    groups[s.classLevel].push(s);
  }

  const interleaved = [];
  const keys = Object.keys(groups);
  let active = keys.filter(k => groups[k].length > 0);
  while (active.length > 0) {
    for (const k of active) {
      const s = groups[k].shift();
      if (s) interleaved.push(s);
    }
    active = keys.filter(k => groups[k].length > 0);
  }

  // Spacing
  const base = Math.floor(S / N);
  const rem = S % N;
  const targets = new Array(N).fill(base);
  if (rem > 0) {
    for (let r = 0; r < rem; r++) {
      targets[Math.floor((r * N) / rem)] += 1;
    }
  }

  let sIdx = 0;
  for (let b = 0; b < N; b++) {
    const count = targets[b];
    if (count === 0) continue;

    if (C === 2) {
      if (count === 1) {
        grid[b][b % 2 === 0 ? 0 : 1] = assign(grid[b][b % 2 === 0 ? 0 : 1], interleaved[sIdx++]);
      } else {
        grid[b][0] = assign(grid[b][0], interleaved[sIdx++]);
        grid[b][1] = assign(grid[b][1], interleaved[sIdx++]);
      }
    } else if (C === 3) {
      if (count === 1) {
        grid[b][b % 2 === 0 ? 0 : 2] = assign(grid[b][b % 2 === 0 ? 0 : 2], interleaved[sIdx++]);
      } else if (count === 2) {
        grid[b][0] = assign(grid[b][0], interleaved[sIdx++]);
        grid[b][2] = assign(grid[b][2], interleaved[sIdx++]);
      } else {
        grid[b][0] = assign(grid[b][0], interleaved[sIdx++]);
        grid[b][1] = assign(grid[b][1], interleaved[sIdx++]);
        grid[b][2] = assign(grid[b][2], interleaved[sIdx++]);
      }
    }
  }

  return grid;
}

function assign(seat, s) {
  if (!s) return seat;
  return {
    ...seat,
    studentId: s.id,
    studentName: s.name,
    studentClass: s.classLevel,
    studentDivision: s.division,
    studentGender: s.gender,
    studentAdmissionNo: s.admissionNumber
  };
}

function emptyGrid(hall) {
  return Array.from({ length: hall.benchesCount }, (_, b) =>
    Array.from({ length: hall.benchCapacity }, (_, s) => ({ benchIndex: b, seatIndexOnBench: s, studentId: null }))
  );
}
`;
