# Plan to Reset Official Timetables & Workspace Exam Schedules

Clean up all existing official timetables and workspace exam schedules as requested by the user.

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed the following:
> 1. **Delete all old official timetables** from the Super Admin portal.
> 2. **Clear all exam schedules** currently saved in the Madrasa workspace.

- **Execution Strategy**:
  - We will implement a "Master Reset" mechanism that wipes `timetables.json` on the server and `madrasa_exam_timetable` in the browser's `localStorage`.
  - We will ensure that after the reset, the user can start fresh by publishing new board timetables.

---

## 1. Plan of Action

### Step 1: Purge Super Admin Official Timetables
- Identify and execute deletion for all boards currently in `timetables.json`.
- Since there is no "Delete All" API, we will iterate through the list of loaded boards and call the `DELETE /api/official-timetables/:id` endpoint for each.

### Step 2: Clear Workspace Exam Schedules
- Access the `localStorage` key `madrasa_exam_timetable` used by the Madrasa Workspace.
- Set this key to `{}` (an empty object) or remove it entirely to effectively reset all exam schedules in the user's local application instance.

### Step 3: Verification
- Verify that `timetables.json` is empty.
- Verify that the Madrasa Workspace Timetable editor shows an empty list for all classes.

---

## 2. Technical Implementation Details

- **Files to Modify/Execute**:
  - `src/components/SuperAdminPortal.tsx`: Trigger `DELETE` requests for each official board.
  - `src/App.tsx`: Provide a "Reset" action to clear `localStorage` items related to timetables.

---

## 3. Risk Assessment & Safety

- **Data Loss**: This is a destructive operation. All saved timetables and schedules will be permanently removed.
- **Safety**: We will implement the deletion directly via the existing API endpoints to ensure consistency with the application's backend logic.
- **Confirmation**: We will prompt the user one final time before executing these deletions in the code, or provide a button in the Super Admin panel to perform this action.

---

## 4. Execution Steps

1.  **Super Admin Portal Reset**:
    - Iterate through the `timetables` state and send `DELETE` requests for every entry.
2.  **Workspace Reset**:
    - Run the following command in the browser context (or via a UI button):
      `localStorage.removeItem("madrasa_exam_timetable");`
      `window.location.reload();`

---

*Proceed with execution?*
