export type Language = "en" | "ml";

export interface Translations {
  // Navigation & Steps
  navStep1: string;
  navStep2: string;
  navStep3: string;
  navStep4: string;
  navStep5: string;
  navSeating: string;
  navDeliverables: string;
  backStep: string;
  nextStep: string;
  activeWorkspace: string;
  systemStatus: string;
  algorithmOptimal: string;
  orderCourierPrint: string;
  superAdmin: string;
  shift: string;
  singleShift: string;
  twoShifts: string;

  // Step Titles in Main View
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  step4Title: string;
  step4Desc: string;
  step5Title: string;
  step5Desc: string;
  workflowHeader: string;
  activeProfile: string;

  // Header Titles
  headerStep1: string;
  headerStep2: string;
  headerStep3: string;
  headerStep4: string;
  headerStep5: string;
  headerSeating: string;
  headerDeliverables: string;

  // Stats
  totalStudents: string;
  boysEnrolled: string;
  girlsEnrolled: string;
  examShiftMode: string;
  shift1Students: string;
  shift2Students: string;
  totalHalls: string;
  totalCapacity: string;
  maleSeats: string;
  femaleSeats: string;
  allocatedStudents: string;
  unallocatedStudents: string;

  // Student Tab
  fastBatchEntryTitle: string;
  fastBatchEntrySubtitle: string;
  selectClass: string;
  gender: string;
  boys: string;
  girls: string;
  division: string;
  startAdmNo: string;
  startAdmNoPlaceholder: string;
  studentNamesList: string;
  studentNamesListPlaceholder: string;
  saveStudentsList: string;
  addSingleStudent: string;
  studentName: string;
  arabicAutoAccuracy: string;
  arabicAutoFillBtn: string;
  arabicLivePreview: string;
  fatherName: string;
  phoneNumber: string;
  addressPlace: string;
  saveStudent: string;
  studentDirectory: string;
  searchStudentPlaceholder: string;
  filterByClass: string;
  filterByShift: string;
  filterByGender: string;
  allClasses: string;
  allShifts: string;
  allGenders: string;
  exportExcel: string;
  importExcel: string;
  clearAll: string;
  resetFilters: string;
  rollAdmNo: string;
  classAndDiv: string;
  actions: string;
  edit: string;
  delete: string;
  noStudentsFound: string;

  // Halls Tab
  shiftConfigTitle: string;
  shiftConfigDesc: string;
  singleShiftMode: string;
  singleShiftModeDesc: string;
  twoShiftsMode: string;
  twoShiftsModeDesc: string;
  classShiftMappingTitle: string;
  classShiftMappingDesc: string;
  addExamHall: string;
  hallName: string;
  benchesCount: string;
  benchCapacity: string;
  reservedGender: string;
  reservedClasses: string;
  reservedShifts: string;
  none: string;
  saveHall: string;
  examHallsList: string;
  hallCapacity: string;
  benches: string;
  seatsPerBench: string;
  genderRestriction: string;
  classRestriction: string;
  shiftRestriction: string;
  noHallsAdded: string;

  // Madrasa Profile Tab
  madrasaProfileTitle: string;
  madrasaProfileDesc: string;
  madrasaNameLabel: string;
  regNoLabel: string;
  placeLabel: string;
  whatsappLabel: string;
  saveProfile: string;
  switchMadrasa: string;
  addNewMadrasa: string;
  searchMadrasaPlaceholder: string;
  deleteMadrasa: string;

  // Print & Order Tab
  printOrderTitle: string;
  printOrderDesc: string;
  selectPrintTarget: string;
  optLabels: string;
  optHallTickets: string;
  optDoorNotice: string;
  optDailyDistribution: string;
  optWhatsappNotice: string;
  optMasterList: string;
  optAttendance: string;
  optClassMaster: string;
  activeShiftFilter: string;
  hallFilter: string;
  classFilter: string;
  allHalls: string;
  examScheduleBtn: string;
  printSavePdfBtn: string;
  pdfHowToTitle: string;
  pdfHowToDesc: string;
  strictA4PreviewTitle: string;
  zoomOverview: string;
  zoomCompact: string;
  zoomMedium: string;
  zoomOptimal: string;
  zoomActual: string;
  zoomLarge: string;
  expandFullHeight: string;
  collapseScrollBox: string;
  previewHelperInfo: string;
  activeTemplate: string;
  quickPrintTip: string;
  openPrintDialog: string;

  // Timetable Modal
  examTimetableTitle: string;
  examTimetableDesc: string;
  addExamDaySubject: string;
  dayNumber: string;
  examDate: string;
  subjectName: string;
  saveTimetable: string;
  close: string;

  // Seating Matrix Tab
  seatingMatrixTitle: string;
  seatingMatrixDesc: string;
  runAllocationBtn: string;
  hallAllocations: string;
  bench: string;
  seat: string;
  emptySeat: string;

  // Courier Modal
  courierModalTitle: string;
  courierModalDesc: string;
  contactPerson: string;
  deliveryAddress: string;
  orderSummary: string;
  laminatedStickers: string;
  doorRegisterSlips: string;
  printFee: string;
  courierFee: string;
  totalAmount: string;
  placeOrderBtn: string;
  orderSuccessTitle: string;
  orderSuccessDesc: string;

  // Language names
  languageName: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation & Steps
    navStep1: "1. Madrasa Profile",
    navStep2: "2. Students",
    navStep3: "3. Exam Halls",
    navStep4: "4. Seating Matrix",
    navStep5: "5. Print & Order",
    navSeating: "Seating Matrix",
    navDeliverables: "SaaS Deliverables",
    backStep: "Previous Step",
    nextStep: "Next Step",
    activeWorkspace: "Active Workspace",
    systemStatus: "System Status",
    algorithmOptimal: "Algorithm Optimal",
    orderCourierPrint: "Order Courier Print",
    superAdmin: "Super Admin",
    shift: "Shift",
    singleShift: "Single Shift",
    twoShifts: "Two Shifts",

    // Step Titles in Main View
    step1Title: "1. Madrasa Profile & Shifts",
    step1Desc: "Name, Reg No & Shifts",
    step2Title: "2. Students & Strength",
    step2Desc: "Strength, Roll No & Divisions",
    step3Title: "3. Exam Halls",
    step3Desc: "Rooms, Benches & Seats",
    step4Title: "4. Seating Matrix",
    step4Desc: "Anti-Cheating Allocations",
    step5Title: "5. Print & Order",
    step5Desc: "Desk Labels, Notices & PDFs",
    workflowHeader: "Madrasa Exam Seating & Order Workflow",
    activeProfile: "Active Profile",

    // Header Titles
    headerStep1: "Step 1: Madrasa Profile & Shift Configuration",
    headerStep2: "Step 2: Student Enrolment & Strength",
    headerStep3: "Step 3: Exam Halls & Benches Configuration",
    headerStep4: "Step 4: Seating Matrix & Allocations",
    headerStep5: "Step 5: Place Order & Print Deliverables",
    headerSeating: "Seating Matrix Allocations",
    headerDeliverables: "SaaS Deliverables & Scripts Export",

    // Stats
    totalStudents: "Total Students",
    boysEnrolled: "Boys Enrolled",
    girlsEnrolled: "Girls Enrolled",
    examShiftMode: "Exam Shift Mode",
    shift1Students: "Shift 1 Students",
    shift2Students: "Shift 2 Students",
    totalHalls: "Total Halls",
    totalCapacity: "Total Capacity",
    maleSeats: "Boys Seats",
    femaleSeats: "Girls Seats",
    allocatedStudents: "Allocated Students",
    unallocatedStudents: "Unallocated Students",

    // Student Tab
    fastBatchEntryTitle: "Class-wise Student Batch Entry",
    fastBatchEntrySubtitle: "Quickly enter or paste student names for each class",
    selectClass: "Select Class",
    gender: "Gender",
    boys: "Boys",
    girls: "Girls",
    division: "Division",
    startAdmNo: "Starting Roll No",
    startAdmNoPlaceholder: "e.g. 101",
    studentNamesList: "Student Names List (One name per line)",
    studentNamesListPlaceholder: "1. Muhammed Bilal\n2. Ahmed Rayan\n3. Salman Faris\n4. Zayan\n5. Umar",
    saveStudentsList: "Save & Add All Students",
    addSingleStudent: "Add Single Student",
    studentName: "Student Name",
    arabicAutoAccuracy: "100% Accurate Arabic Name",
    arabicAutoFillBtn: "Auto-Fill Arabic Names",
    arabicLivePreview: "Live Arabic Name Preview",
    fatherName: "Father's Name",
    phoneNumber: "Phone Number",
    addressPlace: "Place / Address",
    saveStudent: "Save Student",
    studentDirectory: "Student Enrolment Directory",
    searchStudentPlaceholder: "Search by Name, Roll No, Class...",
    filterByClass: "Class",
    filterByShift: "Shift",
    filterByGender: "Gender",
    allClasses: "All Classes",
    allShifts: "All Shifts",
    allGenders: "All Genders",
    exportExcel: "Export CSV / Excel",
    importExcel: "Import CSV / Excel",
    clearAll: "Delete All Students",
    resetFilters: "Reset Filters",
    rollAdmNo: "Roll No",
    classAndDiv: "Class & Division",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    noStudentsFound: "No students found matching your filter.",

    // Halls Tab
    shiftConfigTitle: "Exam Shift Configuration",
    shiftConfigDesc: "Choose whether exams are conducted in a single morning shift or two separate shifts",
    singleShiftMode: "Single Shift Mode (All Classes Together)",
    singleShiftModeDesc: "All classes (Classes 1 to 10) attend exams in one common shift",
    twoShiftsMode: "Two Shifts Mode (Shift 1 & Shift 2)",
    twoShiftsModeDesc: "Primary classes attend in Shift 1 and Higher classes attend in Shift 2",
    classShiftMappingTitle: "Class to Shift Allocation",
    classShiftMappingDesc: "Specify which shift each class belongs to",
    addExamHall: "Add Exam Hall / Room",
    hallName: "Hall Name / Room Number",
    benchesCount: "Total Benches Count",
    benchCapacity: "Students per Bench",
    reservedGender: "Gender Reservation",
    reservedClasses: "Reserved Classes (Optional)",
    reservedShifts: "Reserved Shift (Optional)",
    none: "None / Open for All",
    saveHall: "Save Hall",
    examHallsList: "Exam Halls & Capacity List",
    hallCapacity: "Hall Capacity",
    benches: "Benches",
    seatsPerBench: "Students/Bench",
    genderRestriction: "Gender Rule",
    classRestriction: "Class Rule",
    shiftRestriction: "Shift Rule",
    noHallsAdded: "No exam halls configured yet.",

    // Madrasa Profile Tab
    madrasaProfileTitle: "Madrasa Profile & General Information",
    madrasaProfileDesc: "Manage institution details printed on all desk labels, attendance registers, and notices",
    madrasaNameLabel: "Madrasa Name (English / Official)",
    regNoLabel: "Registration / Affiliation Number",
    placeLabel: "Place / District / State",
    whatsappLabel: "Official Contact / WhatsApp Number",
    saveProfile: "Save Profile Information",
    switchMadrasa: "Switch Active Madrasa Workspace",
    addNewMadrasa: "Add New Madrasa Profile",
    searchMadrasaPlaceholder: "Search Madrasa by Name or Place...",
    deleteMadrasa: "Delete Profile",

    // Print & Order Tab
    printOrderTitle: "Export Center & Physical Print Layout",
    printOrderDesc: "Generate production-ready printable documents and desk stickers for your exams",
    selectPrintTarget: "1. Select Print Target / Document Type",
    optLabels: "Student Desk Labels (Seating Stickers)",
    optHallTickets: "Student Hall Tickets (Bulk 4 / Page)",
    optDoorNotice: "Hall Door Notices (Entrance Charts)",
    optDailyDistribution: "Daily Exam Hall Distribution & Signature Sheet",
    optWhatsappNotice: "WhatsApp Parent Group Notice",
    optMasterList: "Master Student Seating List",
    optAttendance: "Exam Attendance Sheet",
    optClassMaster: "Class Master Register",
    activeShiftFilter: "Exam Shift",
    hallFilter: "Filter Hall",
    classFilter: "Filter Class",
    allHalls: "All Halls",
    examScheduleBtn: "Edit Exam Schedule",
    printSavePdfBtn: "Print / Save as PDF (Ctrl+P)",
    pdfHowToTitle: "How to Save as PDF?",
    pdfHowToDesc: 'In the print dialog that opens, change the "Destination" to "Save as PDF", set Paper Size to "A4", and turn on "Background graphics".',
    strictA4PreviewTitle: "STRICT A4 PHYSICAL LAYOUT PREVIEW (AS PRINTED ON PAPER)",
    zoomOverview: "45% (Overview)",
    zoomCompact: "60% (Compact)",
    zoomMedium: "75% (Medium)",
    zoomOptimal: "85% (Optimal)",
    zoomActual: "100% (Actual 1:1)",
    zoomLarge: "120% (Large)",
    expandFullHeight: "Expand Full Height",
    collapseScrollBox: "Collapse to Scroll Box",
    previewHelperInfo: "Exact 1:1 print reproduction matching physical A4 paper. Use Zoom and Scroll to examine all details.",
    activeTemplate: "Active Template",
    quickPrintTip: "Tip: Use Ctrl + P to trigger browser print dialog",
    openPrintDialog: "Open Print Dialog →",

    // Timetable Modal
    examTimetableTitle: "Exam Schedule & Subject Timetable",
    examTimetableDesc: "Configure subjects and dates printed on each student's desk sticker",
    addExamDaySubject: "+ Add Subject / Exam Day",
    dayNumber: "Day",
    examDate: "Exam Date",
    subjectName: "Subject Name",
    saveTimetable: "Save Schedule",
    close: "Close",

    // Seating Matrix Tab
    seatingMatrixTitle: "Visual Exam Seating Matrix",
    seatingMatrixDesc: "Interactive allocation layout showing bench placements and conflict avoidance",
    runAllocationBtn: "Re-run Seating Allocation",
    hallAllocations: "Hall Allocations",
    bench: "Bench",
    seat: "Seat",
    emptySeat: "Empty Seat",

    // Courier Modal
    courierModalTitle: "Direct Courier Delivery Order",
    courierModalDesc: "Get Laminated Desk Stickers & Hall Registers delivered to your Madrasa",
    contactPerson: "Contact Person / Usthad Representative",
    deliveryAddress: "Madrasa Full Delivery Address with PIN code",
    orderSummary: "Order Summary",
    laminatedStickers: "Standard Sticker Paper Desk Seating Labels",
    doorRegisterSlips: "Exam Hall Door Attendance & Seating Register Slips",
    printFee: "Print & Lamination Fee",
    courierFee: "Speed Post / Courier Delivery",
    totalAmount: "Total Payable Amount",
    placeOrderBtn: "Confirm & Place Order",
    orderSuccessTitle: "Order Placed Successfully!",
    orderSuccessDesc: "Your order has been recorded. Our team will verify and dispatch within 24 hours.",

    // Language names
    languageName: "English",
  },
  ml: {
    // Navigation & Steps
    navStep1: "1. മദ്റസ & ഷിഫ്റ്റ്",
    navStep2: "2. വിദ്യാർത്ഥികൾ",
    navStep3: "3. പരീക്ഷാ ഹാളുകൾ",
    navStep4: "4. സീറ്റിംഗ് മാട്രിക്സ്",
    navStep5: "5. പ്രിന്റും റിപ്പോർട്ടുകളും",
    navSeating: "സീറ്റിംഗ് മാട്രിക്സ്",
    navDeliverables: "സാസ് ഡെലിവറബിൾസ്",
    backStep: "മുൻപത്തെ സ്റ്റെപ്പ്",
    nextStep: "അടുത്ത സ്റ്റെപ്പ്",
    activeWorkspace: "പ്രവർത്തന മദ്റസ",
    systemStatus: "സിസ്റ്റം സ്ഥിതി",
    algorithmOptimal: "അൽഗോരിതം ഒപ്റ്റിമൽ",
    orderCourierPrint: "കൊറിയർ പ്രിന്റ് ഓർഡർ ചെയ്യുക",
    superAdmin: "സൂപ്പർ അഡ്മിൻ",
    shift: "ഷിഫ്റ്റ്",
    singleShift: "സിംഗിൾ ഷിഫ്റ്റ്",
    twoShifts: "രണ്ട് ഷിഫ്റ്റുകൾ",

    // Step Titles in Main View
    step1Title: "1. മദ്റസ & ഷിഫ്റ്റ്",
    step1Desc: "പേര്, വിവരങ്ങൾ, ഷിഫ്റ്റുകൾ",
    step2Title: "2. കുട്ടികളും എണ്ണവും",
    step2Desc: "റോൾ നമ്പർ & ഡിവിഷനുകൾ",
    step3Title: "3. പരീക്ഷാ ഹാളുകൾ",
    step3Desc: "റൂമുകൾ, ബെഞ്ചുകൾ, സീറ്റുകൾ",
    step4Title: "4. സീറ്റിംഗ് മാട്രിക്സ്",
    step4Desc: "ആന്റി-ചീറ്റിംഗ് സീറ്റുകൾ",
    step5Title: "5. പ്രിന്റും റിപ്പോർട്ടുകളും",
    step5Desc: "ഡെസ്ക് സ്റ്റിക്കർ, നോട്ടീസുകൾ, PDF",
    workflowHeader: "മദ്റസ പരീക്ഷാ സീറ്റിംഗ് & ഓർഡർ വർക്ക്ഫ്ലോ",
    activeProfile: "സജീവ പ്രൊഫൈൽ",

    // Header Titles
    headerStep1: "ഘട്ടം 1: മദ്റസ പ്രൊഫൈലും ഷിഫ്റ്റ് ക്രമീകരണവും",
    headerStep2: "ഘട്ടം 2: വിദ്യാർത്ഥികളുടെ എൻറോൾമെന്റ് വിവരങ്ങൾ",
    headerStep3: "ഘട്ടം 3: പരീക്ഷാ ഹാൾ & ബെഞ്ച് വിവരങ്ങൾ ക്രമീകരിക്കൽ",
    headerStep4: "ഘട്ടം 4: സീറ്റിംഗ് ക്രമീകരണവും മാട്രിക്സും",
    headerStep5: "ഘട്ടം 5: ഡെസ്ക് ലേബലുകൾ, നോട്ടീസുകൾ & പ്രിന്റ്",
    headerSeating: "സീറ്റിംഗ് മാട്രിക്സ് അലോക്കേഷൻ",
    headerDeliverables: "സാസ് ഡെലിവറബിൾസ് & സ്ക്രിപ്റ്റുകൾ",

    // Stats
    totalStudents: "ആകെ വിദ്യാർത്ഥികൾ",
    boysEnrolled: "ആൺകുട്ടികൾ",
    girlsEnrolled: "പെൺകുട്ടികൾ",
    examShiftMode: "പരീക്ഷാ ഷിഫ്റ്റ് രീതി",
    shift1Students: "ഷിഫ്റ്റ് 1 വിദ്യാർത്ഥികൾ",
    shift2Students: "ഷിഫ്റ്റ് 2 വിദ്യാർത്ഥികൾ",
    totalHalls: "ആകെ ഹാളുകൾ",
    totalCapacity: "ആകെ സീറ്റുകൾ",
    maleSeats: "ആൺകുട്ടികളുടെ സീറ്റുകൾ",
    femaleSeats: "പെൺകുട്ടികളുടെ സീറ്റുകൾ",
    allocatedStudents: "സീറ്റ് നൽകിയവർ",
    unallocatedStudents: "സീറ്റ് ലഭിക്കാത്തവർ",

    // Student Tab
    fastBatchEntryTitle: "ക്ലാസ്സ് തിരിച്ചുള്ള ബാച്ച് എൻട്രി",
    fastBatchEntrySubtitle: "ഓരോ ക്ലാസ്സിലെയും വിദ്യാർത്ഥികളുടെ പേരുകൾ വേഗത്തിൽ ടൈപ്പ് ചെയ്ത് ചേർക്കാം",
    selectClass: "ക്ലാസ്സ് തിരഞ്ഞെടുക്കുക",
    gender: "ലിംഗം",
    boys: "ആൺകുട്ടികൾ",
    girls: "പെൺകുട്ടികൾ",
    division: "ഡിവിഷൻ",
    startAdmNo: "തുടങ്ങുന്ന റോൾ നമ്പർ",
    startAdmNoPlaceholder: "ഉദാഹരണത്തിന്: 101",
    studentNamesList: "വിദ്യാർത്ഥികളുടെ പേരുകൾ (വരിവരിയായി നൽകുക)",
    studentNamesListPlaceholder: "1. മുഹമ്മദ് ബിലാൽ\n2. അഹമ്മദ് റയാൻ\n3. സൽമാൻ ഫാരിസ്\n4. സയാൻ\n5. ഉമർ",
    saveStudentsList: "എല്ലാ വിദ്യാർത്ഥികളെയും ചേർക്കുക",
    addSingleStudent: "ഒരു വിദ്യാർത്ഥിയെ ചേർക്കുക",
    studentName: "വിദ്യാർത്ഥിയുടെ പേര്",
    arabicAutoAccuracy: "100% കൃത്യമായ അറബിക് നാമം",
    arabicAutoFillBtn: "അറബിക് പേരുകൾ ഓട്ടോ-ഫിൽ ചെയ്യുക",
    arabicLivePreview: "ലൈവ് അറബിക് നാമം പ്രിവ്യൂ",
    fatherName: "പിതാവിന്റെ പേര്",
    phoneNumber: "ഫോൺ നമ്പർ",
    addressPlace: "സ്ഥലം / മേൽവിലാസം",
    saveStudent: "വിദ്യാർത്ഥിയെ സേവ് ചെയ്യുക",
    studentDirectory: "വിദ്യാർത്ഥികളുടെ ലിസ്റ്റ്",
    searchStudentPlaceholder: "പേര്, റോൾ നമ്പർ, ക്ലാസ്സ് എന്നിവ തിരയുക...",
    filterByClass: "ക്ലാസ്സ്",
    filterByShift: "ഷിഫ്റ്റ്",
    filterByGender: "ലിംഗം",
    allClasses: "എല്ലാ ക്ലാസ്സുകളും",
    allShifts: "എല്ലാ ഷിഫ്റ്റുകളും",
    allGenders: "എല്ലാവരും",
    exportExcel: "എക്സൽ എക്സ്പോർട്ട്",
    importExcel: "എക്സൽ ഇമ്പോർട്ട്",
    clearAll: "വിദ്യാർത്ഥികളെ ഒഴിവാക്കുക",
    resetFilters: "ഫിൽട്ടർ മാറ്റുക",
    rollAdmNo: "റോൾ നമ്പർ",
    classAndDiv: "ക്ലാസ്സും ഡിവിഷനും",
    actions: "പ്രവർത്തനങ്ങൾ",
    edit: "എഡിറ്റ്",
    delete: "ഡിലീറ്റ്",
    noStudentsFound: "തിരഞ്ഞെടുത്ത ഫിൽട്ടറിൽ വിദ്യാർത്ഥികൾ ലഭ്യമല്ല.",

    // Halls Tab
    shiftConfigTitle: "പരീക്ഷാ ഷിഫ്റ്റ് ക്രമീകരണം",
    shiftConfigDesc: "പരീക്ഷകൾ ഒറ്റ ഷിഫ്റ്റിലാണോ അതോ രണ്ട് ഷിഫ്റ്റുകളിലായാണോ നടത്തുന്നത് എന്ന് തിരഞ്ഞെടുക്കുക",
    singleShiftMode: "സിംഗിൾ ഷിഫ്റ്റ് രീതി (എല്ലാ ക്ലാസ്സുകളും ഒരുമിച്ച്)",
    singleShiftModeDesc: "1 മുതൽ 10 വരെയുള്ള എല്ലാ ക്ലാസ്സുകളും ഒരൊറ്റ ഷിഫ്റ്റിൽ പരീക്ഷ എഴുതുന്നു",
    twoShiftsMode: "രണ്ട് ഷിഫ്റ്റുകൾ രീതി (ഷിഫ്റ്റ് 1 & ഷിഫ്റ്റ് 2)",
    twoShiftsModeDesc: "പ്രൈമറി ക്ലാസ്സുകൾ ഷിഫ്റ്റ് 1-ലും ഉയർന്ന ക്ലാസ്സുകൾ ഷിഫ്റ്റ് 2-ലും പരീക്ഷ എഴുതുന്നു",
    classShiftMappingTitle: "ക്ലാസ്സുകൾ ഷിഫ്റ്റുകളിലേക്ക് നിശ്ചയിക്കൽ",
    classShiftMappingDesc: "ഓരോ ക്ലാസ്സും ഏത് ഷിഫ്റ്റിലാണെന്ന് തിരഞ്ഞെടുക്കുക",
    addExamHall: "പുതിയ പരീക്ഷാ ഹാൾ / റൂം ചേർക്കുക",
    hallName: "ഹാളിന്റെ പേര് / റൂം നമ്പർ",
    benchesCount: "ആകെ ബെഞ്ചുകളുടെ എണ്ണം",
    benchCapacity: "ഒരു ബെഞ്ചിലെ വിദ്യാർത്ഥികൾ",
    reservedGender: "ലിംഗ സംവരണം",
    reservedClasses: "പ്രത്യേക ക്ലാസ്സുകൾ (ആവശ്യമെങ്കിൽ)",
    reservedShifts: "പ്രത്യേക ഷിഫ്റ്റ് (ആവശ്യമെങ്കിൽ)",
    none: "ആർക്കും ഇരിക്കാം (പൊതുവായത്)",
    saveHall: "ഹാൾ സേവ് ചെയ്യുക",
    examHallsList: "പരീക്ഷാ ഹാളുകളുടെ ലിസ്റ്റ്",
    hallCapacity: "ഹാൾ ശേഷി",
    benches: "ബെഞ്ചുകൾ",
    seatsPerBench: "കുട്ടികൾ/ബെഞ്ച്",
    genderRestriction: "ലിംഗ നിബന്ധന",
    classRestriction: "ക്ലാസ്സ് നിബന്ധന",
    shiftRestriction: "ഷിഫ്റ്റ് നിബന്ധന",
    noHallsAdded: "ഹാളുകൾ ഒന്നും ചേർത്തിട്ടില്ല.",

    // Madrasa Profile Tab
    madrasaProfileTitle: "മദ്റസ പ്രൊഫൈലും പൊതു വിവരങ്ങളും",
    madrasaProfileDesc: "ഡെസ്ക് ലേബലുകളിലും ഹാൾ നോട്ടീസുകളിലും പ്രിന്റ് ചെയ്തു വരേണ്ട മദ്റസ വിവരങ്ങൾ",
    madrasaNameLabel: "മദ്റസയുടെ പേര്",
    regNoLabel: "രജിസ്ട്രേഷൻ / അഫിലിയേഷൻ നമ്പർ",
    placeLabel: "സ്ഥലം / ജില്ല",
    whatsappLabel: "വാട്സ്ആപ്പ് / ഫോൺ നമ്പർ",
    saveProfile: "വിവരങ്ങൾ സേവ് ചെയ്യുക",
    switchMadrasa: "മദ്റസ മാറ്റുക",
    addNewMadrasa: "പുതിയ മദ്റസ പ്രൊഫൈൽ ചേർക്കുക",
    searchMadrasaPlaceholder: "പേരോ സ്ഥലമോ നൽകി തിരയുക...",
    deleteMadrasa: "പ്രൊഫൈൽ ഡിലീറ്റ് ചെയ്യുക",

    // Print & Order Tab
    printOrderTitle: "പ്രിന്റ് & എക്സ്പോർട്ട് സെന്റർ",
    printOrderDesc: "പരീക്ഷകൾക്കാവശ്യമായ ഡെസ്ക് സ്റ്റിക്കറുകളും ഹാൾ നോട്ടീസുകളും പ്രിന്റ് ചെയ്യാം",
    selectPrintTarget: "1. പ്രിന്റ് ചെയ്യേണ്ട ഡോക്യുമെന്റ് തിരഞ്ഞെടുക്കുക",
    optLabels: "വിദ്യാർത്ഥികളുടെ ഡെസ്ക് ലേബലുകൾ (സീറ്റിംഗ് സ്റ്റിക്കറുകൾ)",
    optHallTickets: "വിദ്യാർത്ഥികളുടെ ഹോൾടിക്കറ്റ് (ബൾക്ക് പ്രിന്റ് - 4 / പേജ്)",
    optDoorNotice: "ഹാൾ ഡോർ നോട്ടീസുകൾ (വാതിലിൽ ഒട്ടിക്കാൻ)",
    optDailyDistribution: "പരീക്ഷാ ഹാൾ വിതരണ & ഒപ്പ് പട്ടിക",
    optWhatsappNotice: "രക്ഷിതാക്കൾക്കുള്ള വാട്സ്ആപ്പ് നോട്ടീസ്",
    optMasterList: "മാസ്റ്റർ സീറ്റിംഗ് ലിസ്റ്റ്",
    optAttendance: "പരീക്ഷാ ഹാജർ പട്ടിക",
    optClassMaster: "ക്ലാസ്സ് മാസ്റ്റർ രജിസ്റ്റർ",
    activeShiftFilter: "പരീക്ഷാ ഷിഫ്റ്റ്",
    hallFilter: "ഹാൾ ഫിൽട്ടർ",
    classFilter: "ക്ലാസ്സ് ഫിൽട്ടർ",
    allHalls: "എല്ലാ ഹാളുകളും",
    examScheduleBtn: "പരീക്ഷാ ടൈംടേബിൾ തിരുത്തുക",
    printSavePdfBtn: "പ്രിന്റ് / സേവ് PDF (Ctrl+P)",
    pdfHowToTitle: "എങ്ങനെ PDF ആയി സേവ് ചെയ്യാം?",
    pdfHowToDesc: 'തുറന്നുവരുന്ന പ്രിന്റ് വിൻഡോയിൽ Destination എന്നത് "Save as PDF" ആക്കി മാറ്റുക, പേപ്പർ സൈസ് "A4" നൽകുക.',
    strictA4PreviewTitle: "കൃത്യമായ A4 ഫിസിക്കൽ ലേഔട്ട് പ്രിവ്യൂ (പേപ്പറിൽ വരുന്ന അതേ രൂപം)",
    zoomOverview: "45% (പൂർണ്ണ രൂപം)",
    zoomCompact: "60% (ചെറുത്)",
    zoomMedium: "75% (ഇടത്തരം)",
    zoomOptimal: "85% (അനുയോജ്യം)",
    zoomActual: "100% (യഥാർത്ഥ അളവ്)",
    zoomLarge: "120% (വലുത്)",
    expandFullHeight: "മുഴുവൻ പേജുകളും വിടർത്തുക",
    collapseScrollBox: "സ്ക്രോൾ ബോക്സിലേക്ക് ചുരുക്കുക",
    previewHelperInfo: "യഥാർത്ഥ A4 പേപ്പറിൽ പ്രിന്റ് ചെയ്തു വരുന്ന അതേ ലേഔട്ട്. സൂം ചെയ്തും സ്ക്രോൾ ചെയ്തും പരിശോധിക്കാം.",
    activeTemplate: "നിലവിലെ ടെംപ്ലേറ്റ്",
    quickPrintTip: "സൂചന: Ctrl + P അമർത്തി വേഗത്തിൽ പ്രിന്റ് ചെയ്യാം",
    openPrintDialog: "പ്രിന്റ് വിൻഡോ തുറക്കുക →",

    // Timetable Modal
    examTimetableTitle: "പരീക്ഷാ ടൈംടേബിളും വിഷയങ്ങളും",
    examTimetableDesc: "ഓരോ വിദ്യാർത്ഥിയുടെയും ഡെസ്ക് സ്റ്റിക്കറിൽ പ്രിന്റ് ചെയ്യേണ്ട വിഷയങ്ങളും തീയതികളും",
    addExamDaySubject: "+ പുതിയ വിഷയവും ദിവസവും ചേർക്കുക",
    dayNumber: "ദിവസം",
    examDate: "പരീക്ഷാ തീയതി",
    subjectName: "വിഷയത്തിന്റെ പേര്",
    saveTimetable: "ടൈംടേബിൾ സേവ് ചെയ്യുക",
    close: "അടയ്ക്കുക",

    // Seating Matrix Tab
    seatingMatrixTitle: "വിഷ്വൽ സീറ്റിംഗ് മാട്രിക്സ്",
    seatingMatrixDesc: "ഓരോ ഹാളിലെയും ബെഞ്ചുകളിലും സീറ്റുകളിലും കുട്ടികൾ ഇരിക്കുന്നതിന്റെ മാട്രിക്സ് ലേഔട്ട്",
    runAllocationBtn: "സീറ്റിംഗ് വീണ്ടും ക്രമീകരിക്കുക",
    hallAllocations: "ഹാൾ അലോക്കേഷനുകൾ",
    bench: "ബെഞ്ച്",
    seat: "സീറ്റ്",
    emptySeat: "ഒഴിഞ്ഞ സീറ്റ്",

    // Courier Modal
    courierModalTitle: "നേരിട്ടുള്ള കൊറിയർ ഡെലിവറി ഓർഡർ",
    courierModalDesc: "ലാമിനേറ്റ് ചെയ്ത ഡെസ്ക് സ്റ്റിക്കറുകളും ഹാൾ രജിസ്റ്ററുകളും മദ്റസയിലേക്ക് നേരിട്ട് എത്തിക്കുന്നു",
    contactPerson: "ബന്ധപ്പെടേണ്ട വ്യക്തി / ഉസ്താദ്",
    deliveryAddress: "പിൻകോഡ് ഉൾപ്പെടെയുള്ള പൂർണ്ണ മേൽവിലാസം",
    orderSummary: "ഓർഡർ സംഗ്രഹം",
    laminatedStickers: "ലാമിനേറ്റ് ചെയ്ത ഡെസ്ക് സീറ്റിംഗ് സ്റ്റിക്കറുകൾ",
    doorRegisterSlips: "പരീക്ഷാ ഹാൾ ഡോർ അറ്റൻഡൻസ് & സീറ്റിംഗ് രജിസ്റ്റർ സ്ലിപ്പുകൾ",
    printFee: "പ്രിന്റിംഗ് & ലാമിനേഷൻ ചാർജ്ജ്",
    courierFee: "സ്പീഡ് പോസ്റ്റ് / കൊറിയർ ഡെലിവറി",
    totalAmount: "ആകെ അടയ്ക്കേണ്ട തുക",
    placeOrderBtn: "ഓർഡർ സ്ഥിരീകരിക്കുക",
    orderSuccessTitle: "ഓർഡർ വിജയകരമായി സമർപ്പിച്ചു!",
    orderSuccessDesc: "നിങ്ങളുടെ ഓർഡർ രേഖപ്പെടുത്തിയിരിക്കുന്നു. 24 മണിക്കൂറിനുള്ളിൽ മദ്റസയിലേക്ക് അയക്കുന്നതാണ്.",

    // Language names
    languageName: "മലയാളം",
  }
};

export const formatClassLabel = (cls: string, lang: Language): string => {
  if (lang === "ml") {
    const num = cls.replace(/\D/g, "");
    return num ? `ക്ലാസ്സ് ${num}` : cls;
  }
  return cls;
};

export const formatShiftLabel = (shift: string, lang: Language): string => {
  if (lang === "ml") {
    if (shift === "Shift 1") return "ഷിഫ്റ്റ് 1";
    if (shift === "Shift 2") return "ഷിഫ്റ്റ് 2";
    return shift;
  }
  return shift;
};

export const formatGenderLabel = (gender: "Male" | "Female" | string, lang: Language): string => {
  if (lang === "ml") {
    if (gender === "Male") return "ആൺകുട്ടി";
    if (gender === "Female") return "പെൺകുട്ടി";
    return gender;
  }
  return gender;
};

export const formatSubject = (subject: string, lang: Language): string => {
  if (!subject) return "";
  if (lang === "en") {
    // Remove Malayalam characters and parentheses containing them
    return subject.replace(/\s*\([\u0D00-\u0D7F\s\/\-\.&]+\)/g, "").trim();
  } else {
    // In Malayalam mode: If subject has a Malayalam translation in parentheses, extract or format it
    const match = subject.match(/\(([\u0D00-\u0D7F\s\/\-\.&]+)\)/);
    if (match && match[1]) {
      return match[1].trim();
    }
    return subject;
  }
};
