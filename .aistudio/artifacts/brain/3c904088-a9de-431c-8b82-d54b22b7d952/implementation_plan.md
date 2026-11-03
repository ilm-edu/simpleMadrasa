# Clean Slate Timetable & Subject Directory Wizard

A completely user-driven, zero-hardcoded Board Timetable architecture. Super Admins create boards through a progressive step-by-step wizard, populate class-specific subjects directly into the directory, and build exam schedules where dropdowns strictly reflect the configured subjects.

## User Review & Critical Decisions

> [!IMPORTANT]
> All three design decisions confirmed by the user have been incorporated into this architecture:
> 1. **Complete Clean Slate**: Removed all pre-seeded hardcoded default subjects. The Subject Directory starts clean and is 100% curated by the user/admin.
> 2. **Strict Dropdown Filtering**: The timetable subject selector will strictly list only subjects present in that specific class's Subject Directory (no out-of-scope subjects or unmanaged text bypass).
> 3. **Step-by-Step Creation Wizard**: Super Admin board creation is consolidated into an intuitive 3-step progressive flow: Board Meta ➔ Class Subjects ➔ Exam Schedule & Timings ➔ Publish to Cloud.

- **Confirmed Decision 1**: Hardcoded Samastha subjects removed; directory is 100% admin-curated.
- **Confirmed Decision 2**: Subject dropdowns strictly limited to the selected class's directory items.
- **Confirmed Decision 3**: Step-by-step wizard replaces disjointed separate sub-tabs during creation.

---

## 1. Overview & Core Concept

- **What It Does**:
  Super Admins can effortlessly create new official examination boards from scratch without unwanted pre-seeded subjects interfering. The new step-by-step wizard guides the admin through:
  1. Setting up Board Identity (Name, Malayalam Title, Academic Year, Exam Term, Start Date, Friday Skip).
  2. Defining Subjects Class-by-Class (Class 1 to 12) with instant quick-add and category tagging.
  3. Generating Exam Days and picking subjects strictly from the directory configured in Step 2.
  4. Saving and Publishing instantly to Server JSON and Cloud Firestore. Once saved, any madrasa workspace user can import and apply this official timetable to their hall tickets and marklists with zero friction.
- **Target Audience**: Super Administrators managing official Islamic education boards (SKIMVB, SKJMCC, or custom boards) and Madrasa Sadr Mu'allims / Exam Officers.
- **Key Value**: Zero clutter, complete autonomy over subjects, eliminated sync conflicts, and absolute consistency between directory and timetable schedules.

---

## 2. User Experience & Visual Design

### Step-by-Step Creation Wizard Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ✦ Super Admin Official Board Timetable Creator Wizard                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  [1. Board Details]  ───▶  [2. Class Subjects]  ───▶  [3. Exam Schedule]   │
│       Active                     Pending                   Pending          │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Step 1: Board Identity & Calendar Parameters
- Input fields: Board Name (English), Board Title (Malayalam), Academic Year (e.g. 2025-2026), Exam Term (Quarterly, Half-Yearly, Annual, Model), Category (General / School Madrasa).
- Calendar settings: Examination Start Date, Auto-skip Friday holiday checkbox.
- Next button activates validation checks before advancing.

#### Step 2: Class-Wise Subject Directory Setup
- Clean, compact class tabs (`Class 1` to `Class 12`) with active badge counters.
- Quick-add form: Malayalam Name (required), English/Transliteration Name, Subject Category badge (Quran, Fiqh, Aqeedah, Thareekh, Lisan, Akhlaq, General).
- Reorderable subject table with drag/arrow handles and instant delete.
- Quick copy option: "Copy subjects from previous class" for fast authoring.

#### Step 3: Exam Schedule & Day Slotting
- Auto-generates Day 1, Day 2, ... based on start date and skip-Friday rule.
- Class navigation strip allowing swift switching between Class 1 through Class 12.
- **Strict Subject Dropdown**: Contains *only* the subjects defined for that class in Step 2, neatly categorized with Malayalam and English labels.
- Exam Timing input (`HH:MM - HH:MM AM/PM`) with default propagation to all days in one click.
- Swap & Reorder controls for examination days.

#### Step 4: Instant Publish & Verification
- "🚀 ക്ലൗഡിലേക്ക് പബ്ലിഷ് ചെയ്യുക (Publish to Cloud & Server)" action.
- Real-time confirmation with dual persistence in `/api/official-timetables` and Firestore `system_settings/official_timetables`.
- Immediately shows up in the user workspace's "ഔദ്യോഗിക ബോർഡ് ടൈംടേബിൾ ഇമ്പോർട്ട് ചെയ്യുക" modal.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Elimination of Hardcoded Default Subjects**
  - *Chosen Approach*: Replace hardcoded `DEFAULT_MASTER_SUBJECTS_DIRECTORY` with empty class slots by default, backed by `/api/subject-directory` and Firestore `system_settings/subject_directory`.
  - *Why*: Prevents unwanted subjects (e.g. Class 1 displaying Fiqh or Akhlaq if not part of that curriculum) from bleeding into the UI.
  - *Alternative Considered*: Hiding hardcoded items via filters was rejected because it causes confusion when resetting or reloading.

- **Decision 2: Strict Dropdown Constraint**
  - *Chosen Approach*: Dropdowns only render subjects from `getSubjectsForClass(activeClassKey)`. The custom text input option is hidden unless an admin explicitly clicks an "Add to Directory first" prompt.
  - *Why*: Ensures every exam subject is backed by a recognized directory ID and metadata, keeping hall tickets and marklists clean.

- **Decision 3: Server & Database Seed Decoupling**
  - *Chosen Approach*: Remove hardcoded `defaultOfficialTimetables` seed from `server.ts` so that deleted boards remain deleted and do not resurrect on reboot.
  - *Why*: True multi-tenant reliability and predictable state.

---

## 4. Technical Architecture & Data Strategy

### System & Request Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPER ADMIN PORTAL                                  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     Board Creation Wizard                             │  │
│  │   [Step 1: Meta] ──▶ [Step 2: Directory] ──▶ [Step 3: Schedule Grid]  │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      ▼
                      Dual-Tier Persistence Engine
            ┌─────────────────────────┴─────────────────────────┐
            ▼                                                   ▼
┌───────────────────────┐                           ┌───────────────────────┐
│     Node/Express      │                           │   Firebase Firestore  │
│      (server.ts)      │                           │                       │
│  /api/official-       │                           │  system_settings/     │
│   timetables          │                           │   official_timetables │
│  /api/subject-        │                           │  system_settings/     │
│   directory           │                           │   subject_directory   │
└───────────┬───────────┘                           └───────────┬───────────┘
            └─────────────────────────┬─────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER WORKSPACE (App.tsx)                           │
│                                                                             │
│  - Pulls published official boards into local state on demand               │
│  - "Import Official Board" renders latest admin-published schedules         │
│  - Generates Student Hall Tickets & Exam Marklists with 100% precision      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component & File Mapping

1. `src/data/subjectDirectory.ts`:
   - Set clean empty defaults (`DEFAULT_MASTER_SUBJECTS_DIRECTORY = { "Class 1": [], ... }`).
   - Retain normalization and helper utilities.
   - Synchronize with `/api/subject-directory` and Firestore `system_settings/subject_directory`.
2. `server.ts`:
   - Remove automatic fallback re-seeding of old boards when `timetables.json` is empty.
   - Serve `/api/subject-directory` and `/api/official-timetables` purely from persistent state.
3. `src/components/SuperAdminPortal.tsx`:
   - Implement `BoardWizardModal` or inline progressive wizard with 3 steps.
   - Restrict subject dropdowns to `masterDir[classKey]`.
   - Add "Save & Publish" handler with toast notifications and optimistic state updates.
4. `src/App.tsx`:
   - Ensure workspace import dialog displays newly published boards smoothly.
   - Hydrate cleanly on reload.
