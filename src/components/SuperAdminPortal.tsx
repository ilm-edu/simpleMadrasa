import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Package, 
  Users, 
  Truck, 
  DollarSign, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  PhoneCall, 
  Building, 
  Settings, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  Share2,
  Printer,
  Edit,
  X,
  Save,
  FileText,
  Plus,
  Trash2,
  Eye,
  RotateCcw,
  Check,
  Tag,
  AlignLeft,
  Info,
  Calendar,
  BookOpen,
  Send,
  UserCheck,
  ArrowRight,
  QrCode,
  ToggleLeft,
  ToggleRight,
  MessageSquare,
  CheckCheck,
  Download,
  Copy,
  Filter,
  Smartphone,
  MessageCircle,
  XCircle,
  ShieldAlert,
  Award,
  UserPlus,
  UserMinus,
  Shield,
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Upload,
  Database,
  Archive,
  HardDrive,
  AlertCircle
} from "lucide-react";
import { PricingConfig, PricingItem, OfficialBoardTimetable, OfficialTimetableEntry, ExamTermType, TimetableSource, MadrasaLicense, AccountsUser } from "../types";
import { 
  EXAM_TERMS, 
  MASTER_SUBJECTS_DIRECTORY, 
  getSubjectsForClass, 
  getSeparatedSubjectsForClass,
  getMasterSubjectsDirectory, 
  saveMasterSubjectsDirectory, 
  resetMasterSubjectsDirectory, 
  fetchRemoteSubjectDirectory,
  SubjectItem,
  toDateInputValue,
  formatToDdMmmYyyy,
  formatDateWithDay,
  normalizeClassKey,
  SAMASTHA_SYLLABUS_TEMPLATE,
  getDynamicDefaultStartDate,
  getDynamicAcademicYear,
  getNextUnusedSubject,
  calculateSequentialDates
} from "../data/subjectDirectory";
import { DEFAULT_OFFICIAL_TIMETABLES } from "../data/defaultTimetables";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import {
  SystemConfig, 
  defaultSystemConfig, 
  fetchRemoteSystemConfig, 
  updateRemoteSystemConfig, 
  getUpiPaymentDetails,
  getSuperAdminList,
  addSuperAdminUser,
  removeSuperAdminUser,
  SuperAdminUser,
  getAccountsUsersList,
  addAccountsUser,
  removeAccountsUser,
  isAccountsEmail,
  AppModuleKey,
  AppVisibilityStatus,
  defaultAppModulesStatus
} from "../systemConfig";
import DatabaseAuditModal from "./DatabaseAuditModal";

export interface CRMUser {
  id: string;
  name: string;
  phone: string;
  regNo: string;
  place: string;
  email?: string;
  studentCount: number;
  hallCount: number;
  lastActiveAt: string;
  firstSeenAt: string;
  lastAction: string;
  totalActionsCount: number;
  ordersCount: number;
  source: string;
  notes?: string;
  students?: any[];
}

interface SuperAdminPortalProps {
  initialTab?: "madrasas" | "timetables" | "orders" | "commercial" | "system_settings" | "partners" | "analytics";
  onSwitchToUserMode: () => void;
  onImportMadrasaToWorkspace?: (madrasaData: any, autoPrint?: boolean) => void;
}

const defaultPricingState: PricingConfig = {
  packageTitle: "Print & Courier Delivery Package",
  packageTitleMl: "നേരിട്ടുള്ള കൊറിയർ ഡെലിവറി ഓർഡർ",
  packageSubtitle: "Standard desk stickers and door attendance registers delivered directly to your Madrasa",
  packageSubtitleMl: "ഡെസ്ക് സ്റ്റിക്കറുകളും ഹാൾ രജിസ്റ്ററുകളും മദ്റസയിലേക്ക് നേരിട്ട് എത്തിക്കുന്നു",
  whatsappSupportPhone: "919633465267",
  freeDeliveryThreshold: 1000,
  courierFee: 80,
  courierTitle: "Speed Post / Courier Delivery",
  courierTitleMl: "സ്പീഡ് പോസ്റ്റ് / കൊറിയർ ഡെലിവറി",
  courierDesc: "Safe and fast door delivery across Kerala via India Post / DTDC",
  courierDescMl: "കേരളത്തിലുടനീളം സ്പീഡ് പോസ്റ്റ് / DTDC വഴി മദ്റസയിലേക്ക് നേരിട്ട് എത്തിക്കുന്നു",
  futureMonthlyPlan: 199,
  futureYearlyPlan: 1499,
  items: [
    {
      id: "desk_stickers",
      name: "Standard Sticker Paper",
      nameMl: "സ്റ്റാൻഡേർഡ് ഡെസ്ക് സ്റ്റിക്കർ പേപ്പർ",
      description: "Self-adhesive desk stickers with Roll No, Class & Hall index",
      descriptionMl: "ഡെസ്ക് സ്റ്റിക്കറുകൾ (റോൾ നമ്പർ, ക്ലാസ്സ് സഹിതം)",
      paperType: "Self-Adhesive Sticker Sheet (4 stickers/sheet)",
      paperTypeMl: "സെൽഫ് അഡ്ഹസീവ് സ്റ്റിക്കർ പേപ്പർ (ഷീറ്റിൽ 4 എണ്ണം)",
      itemsPerPage: 4,
      pricePerPage: 16,
      pricingType: "per_page",
      price: 16,
      unitPrice: 16,
      defaultQtyLabel: "A4 Sheets",
      enabled: true,
      isMandatory: true,
      icon: "Sparkles"
    },
    {
      id: "door_registers",
      name: "Hall Door Attendance & Seating Slips",
      nameMl: "പരീക്ഷാ ഹാൾ ഡോർ അറ്റൻഡൻസ് രജിസ്റ്ററുകൾ",
      description: "Class-wise student door attendance sheets and hall seating matrix for notice boards",
      descriptionMl: "ഹാളിന്റെ വാതിലിൽ ഒട്ടിക്കുന്ന എ-ക്ലാസ്സ് അറ്റൻഡൻസ് ചാർട്ടും സീറ്റിംഗ് മാട്രിക്സ് സ്ലിപ്പുകളും",
      paperType: "100 GSM Executive Bond Paper (1 hall chart/sheet)",
      paperTypeMl: "100 GSM എക്സിക്യൂട്ടീവ് ബോണ്ട് പേപ്പർ (ഷീറ്റിൽ 1 ഹാൾ)",
      itemsPerPage: 1,
      pricePerPage: 10,
      pricingType: "per_page",
      price: 10,
      unitPrice: 10,
      defaultQtyLabel: "A4 Sheets",
      enabled: true,
      isMandatory: false,
      icon: "FileText"
    },
    {
      id: "hall_tickets",
      name: "Student Hall Tickets & Exam Passes",
      nameMl: "വിദ്യാർത്ഥി ഹാൾ ടിക്കറ്റുകളും എക്സാം പാസ്സുകളും",
      description: "Individual student photo hall tickets with exam timetable, seat number, and instructions",
      descriptionMl: "പരീക്ഷാ ടൈംടേബിളും സീറ്റ് നമ്പറും അടങ്ങിയ വിദ്യാർത്ഥി ഹാൾ ടിക്കറ്റുകൾ",
      paperType: "80 GSM High-Brightness White Bond Paper (2 passes/sheet)",
      paperTypeMl: "80 GSM ഹൈ-ബ്രൈറ്റ്നസ് വൈറ്റ് ബോണ്ട് പേപ്പർ (ഷീറ്റിൽ 2 ഹാൾ ടിക്കറ്റ്)",
      itemsPerPage: 2,
      pricePerPage: 6,
      pricingType: "per_page",
      price: 6,
      unitPrice: 6,
      defaultQtyLabel: "A4 Sheets",
      enabled: true,
      isMandatory: false,
      icon: "Award"
    },
    {
      id: "duty_registers",
      name: "Invigilator Master Duty & Daily Attendance Register",
      nameMl: "ഇൻവിജിലേറ്റർ ഡ്യൂട്ടി & പരീക്ഷാ രജിസ്റ്റർ",
      description: "Superintendent daily hall logbook, question paper seal verification, and signature logs",
      descriptionMl: "ഹാൾ സൂപ്രണ്ട് ഡ്യൂട്ടി ലോഗ്ബുക്കും വിദ്യാർത്ഥി ഒപ്പ് രജിസ്റ്ററും",
      paperType: "80 GSM Standard Exam Bond Paper (1 register/hall)",
      paperTypeMl: "80 GSM സ്റ്റാൻഡേർഡ് ബോണ്ട് പേപ്പർ (ഹാൾ വൈസ് രജിസ്റ്റർ)",
      itemsPerPage: 1,
      pricePerPage: 5,
      pricingType: "per_page",
      price: 5,
      unitPrice: 5,
      defaultQtyLabel: "A4 Sheets",
      enabled: true,
      isMandatory: false,
      icon: "ClipboardList"
    }
  ]
};

export default function SuperAdminPortal({ onSwitchToUserMode, onImportMadrasaToWorkspace, initialTab = "madrasas" }: SuperAdminPortalProps) {
  const [activeTab, setActiveTab] = useState<"madrasas" | "timetables" | "orders" | "commercial" | "system_settings" | "partners" | "analytics">(initialTab || "madrasas");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [orders, setOrders] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [partnerFilter, setPartnerFilter] = useState<"all" | "partner" | "direct">("all");
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // CRM & User Activity Marketing Hub State
  const [crmUsers, setCrmUsers] = useState<CRMUser[]>([]);
  const [crmSearchQuery, setCrmSearchQuery] = useState("");
  const [crmFilter, setCrmFilter] = useState<"all" | "today" | "week" | "with_orders" | "large" | "paid" | "trial" | "expired">("all");
  const [marketingTemplate, setMarketingTemplate] = useState<string>("software_launch");
  const [customMarketingMessage, setCustomMarketingMessage] = useState<string>("");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Dynamic Madrasa License Management State
  const [licensesMap, setLicensesMap] = useState<Record<string, MadrasaLicense>>(() => {
    try {
      const saved = localStorage.getItem("madrasa_licenses_map");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [selectedUserForLicense, setSelectedUserForLicense] = useState<CRMUser | null>(null);
  const [licenseStatus, setLicenseStatus] = useState<"trial" | "paid" | "expired">("paid");
  const [licensePlan, setLicensePlan] = useState<"bundle" | "seating_only" | "result_only" | "tarbiyah_only">("bundle");
  const [licenseDurationMonths, setLicenseDurationMonths] = useState<number>(12);
  const [licenseAmountPaid, setLicenseAmountPaid] = useState<number>(149);
  const [licenseExpiresAt, setLicenseExpiresAt] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  });
  const [licenseNotes, setLicenseNotes] = useState<string>("");
  const [licenseFeedback, setLicenseFeedback] = useState<string | null>(null);

  // Direct User Activation by Phone/Email without request
  const [directInput, setDirectInput] = useState<string>("");
  const [directMadrasaName, setDirectMadrasaName] = useState<string>("");
  const [directRegNo, setDirectRegNo] = useState<string>("");
  const [isDirectActivating, setIsDirectActivating] = useState<boolean>(false);
  const [directFeedback, setDirectFeedback] = useState<string | null>(null);

  // System Configuration & Payment Details State
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(defaultSystemConfig);
  const [isSavingSystemConfig, setIsSavingSystemConfig] = useState(false);
  const [systemConfigFeedback, setSystemConfigFeedback] = useState<string | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);

  // Official Board Timetables State
  const [timetables, setTimetables] = useState<OfficialBoardTimetable[]>(() => {
    try {
      const cached = localStorage.getItem("madrasa_official_boards_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_OFFICIAL_TIMETABLES;
  });
  const [activeBoardId, setActiveBoardId] = useState<string>(() => {
    try {
      const meta = localStorage.getItem("madrasa_active_board_metadata");
      if (meta) {
        const parsed = JSON.parse(meta);
        if (parsed?.boardId) return parsed.boardId;
      }
    } catch (e) {}
    return "ardha_varshika_2026";
  });
  const [activeClassKey, setActiveClassKey] = useState<string>("Class 5");
  const [isSavingTimetable, setIsSavingTimetable] = useState(false);
  const [timetableFeedback, setTimetableFeedback] = useState<string | null>(null);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restorePreviewData, setRestorePreviewData] = useState<any>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [serverSnapshotInfo, setServerSnapshotInfo] = useState<{ hasBackup: boolean; createdAt?: string; totalBoards?: number } | null>(null);
  const [batchExamStartDate, setBatchExamStartDate] = useState<string>(() => getDynamicDefaultStartDate());
  const [batchSkipFriday, setBatchSkipFriday] = useState<boolean>(true);
  const [newBoardForm, setNewBoardForm] = useState({
    boardName: "",
    boardNameMl: "",
    academicYear: getDynamicAcademicYear(),
    term: "quarterly" as ExamTermType,
    termMl: "പാദവാർഷിക പരീക്ഷ",
    description: "",
    isVerified: true,
    source: "superadmin_verified" as TimetableSource,
    category: "general" as "general" | "school"
  });

  // 3-Step Board Creation Wizard State
  const [boardWizardStep, setBoardWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardActiveCls, setWizardActiveCls] = useState<string>("Class 1");
  const [wizardClasses, setWizardClasses] = useState<Record<string, OfficialTimetableEntry[]>>({});
  const [wizardStartDate, setWizardStartDate] = useState<string>(() => getDynamicDefaultStartDate());
  const [wizardSkipFriday, setWizardSkipFriday] = useState<boolean>(true);
  const [wizardTimingToAll, setWizardTimingToAll] = useState<string>("06:30 AM - 08:30 AM");
  const [wizardNewSubMl, setWizardNewSubMl] = useState("");
  const [wizardNewSubEn, setWizardNewSubEn] = useState("");
  const [wizardNewSubCat, setWizardNewSubCat] = useState<"quran" | "fiqh" | "aqeeda" | "thareekh" | "lisan" | "akhlaq" | "general">("fiqh");

  // Copy Schedule to Other Classes Modal State
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copySourceClass, setCopySourceClass] = useState<string>("Class 1");
  const [copyTargetClasses, setCopyTargetClasses] = useState<Record<string, boolean>>({});
  const [copyMode, setCopyMode] = useState<"structure_only" | "full_schedule">("structure_only");

  // Subject Directory State
  const [timetableSubTab, setTimetableSubTab] = useState<"timetables" | "directory">("timetables");
  const [masterDir, setMasterDir] = useState<Record<string, SubjectItem[]>>(() => getMasterSubjectsDirectory());
  
  useEffect(() => {
    const handleDirUpdate = () => {
      setMasterDir(getMasterSubjectsDirectory());
    };
    window.addEventListener("subjects-directory-updated", handleDirUpdate);
    return () => window.removeEventListener("subjects-directory-updated", handleDirUpdate);
  }, []);
  const [dirSelectedClass, setDirSelectedClass] = useState<string>("Class 5");
  const [isAddingSubjectToDir, setIsAddingSubjectToDir] = useState(false);
  const [dirNewSubjectForm, setDirNewSubjectForm] = useState<{
    nameMl: string;
    nameEn: string;
    category: "quran" | "fiqh" | "aqeeda" | "thareekh" | "lisan" | "akhlaq" | "general";
  }>({
    nameMl: "",
    nameEn: "",
    category: "fiqh"
  });
  const [customEditingDays, setCustomEditingDays] = useState<Record<string, boolean>>({});
  const [swappingDayIndex, setSwappingDayIndex] = useState<number | null>(null);
  const [editingSubject, setEditingSubject] = useState<{ classKey: string; subject: SubjectItem } | null>(null);
  const [editingBoardDetails, setEditingBoardDetails] = useState<OfficialBoardTimetable | null>(null);

  // SuperAdmin Edit/Correction Modal State
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editingType, setEditingType] = useState<"order" | "submission">("order");
  const [editForm, setEditForm] = useState({
    madrasaName: "",
    regNo: "",
    place: "",
    contactName: "",
    phone: "",
    address: "",
    status: "Pending",
    trackingNo: ""
  });

  // Commercial Pricing Settings state
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(() => {
    try {
      const saved = localStorage.getItem("saas_pricing_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.items && Array.isArray(parsed.items)) return parsed;
        return {
          ...defaultPricingState,
          courierFee: parsed.courierFee || 80,
          whatsappSupportPhone: parsed.whatsappSupportPhone || "919847000000",
          futureMonthlyPlan: parsed.futureMonthlyPlan || 199,
          futureYearlyPlan: parsed.futureYearlyPlan || 1499,
        };
      }
    } catch (e) {}
    return defaultPricingState;
  });

  // Preview state in commercial tab
  const [previewSeats, setPreviewSeats] = useState(120);
  const [previewHalls, setPreviewHalls] = useState(4);
  const [previewLang, setPreviewLang] = useState<"ml" | "en">("ml");

  // Super Admin Management State
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [isAddingSuperAdmin, setIsAddingSuperAdmin] = useState(false);
  const [superAdminFeedback, setSuperAdminFeedback] = useState<string | null>(null);

  const handleAddSuperAdmin = async () => {
    if (!newAdminEmail.trim()) {
      setSuperAdminFeedback("❌ ഇമെയിൽ വിലാസം നൽകുക (Email required)");
      return;
    }
    setIsAddingSuperAdmin(true);
    setSuperAdminFeedback(null);
    try {
      const res = await addSuperAdminUser(newAdminEmail, newAdminName, "Root Admin");
      if (res.success) {
        setSystemConfig(prev => ({
          ...prev,
          superAdmins: res.list
        }));
        setNewAdminEmail("");
        setNewAdminName("");
        setSuperAdminFeedback(`✅ "${newAdminEmail}" എന്ന ഉപയോക്താവിന് സൂപ്പർ അഡ്മിൻ അധികാരം നൽകി!`);
        setTimeout(() => setSuperAdminFeedback(null), 4000);
      } else {
        setSuperAdminFeedback("❌ " + (res.error || "Failed to add super admin"));
      }
    } catch (e: any) {
      setSuperAdminFeedback("❌ Error: " + e.message);
    } finally {
      setIsAddingSuperAdmin(false);
    }
  };

  const handleRemoveSuperAdmin = async (email: string) => {
    if (!confirm(`"${email}" എന്ന ഉപയോക്താവിനെ സൂപ്പർ അഡ്മിൻ പട്ടികയിൽ നിന്ന് ഒഴിവാക്കണോ?`)) {
      return;
    }
    try {
      const res = await removeSuperAdminUser(email);
      if (res.success) {
        setSystemConfig(prev => ({
          ...prev,
          superAdmins: res.list
        }));
        setSuperAdminFeedback(`✓ "${email}" എന്ന അക്കൗണ്ടിന്റെ സൂപ്പർ അഡ്മിൻ പദവി ഒഴിവാക്കി.`);
        setTimeout(() => setSuperAdminFeedback(null), 4000);
      } else {
        alert(res.error || "Failed to remove super admin");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  // Accounts Team Management State
  const [newAccountsEmail, setNewAccountsEmail] = useState("");
  const [newAccountsName, setNewAccountsName] = useState("");
  const [newAccountsPhone, setNewAccountsPhone] = useState("");
  const [isAddingAccountsUser, setIsAddingAccountsUser] = useState(false);
  const [accountsFeedback, setAccountsFeedback] = useState<string | null>(null);

  const handleAddAccountsUser = async () => {
    if (!newAccountsEmail.trim()) {
      setAccountsFeedback("❌ ഇമെയിൽ വിലാസം നൽകുക (Email required)");
      return;
    }
    setIsAddingAccountsUser(true);
    setAccountsFeedback(null);
    try {
      const res = await addAccountsUser(newAccountsEmail, newAccountsName, newAccountsPhone, "Super Admin");
      if (res.success) {
        setSystemConfig(prev => ({
          ...prev,
          accountsUsers: res.list
        }));
        setNewAccountsEmail("");
        setNewAccountsName("");
        setNewAccountsPhone("");
        setAccountsFeedback(`✅ "${newAccountsEmail}" എന്ന അക്കൗണ്ട്സ് ടീം അംഗത്തെ വിജയകരമായി ചേർത്തു!`);
        setTimeout(() => setAccountsFeedback(null), 4000);
      } else {
        setAccountsFeedback("❌ " + (res.error || "Failed to add accounts user"));
      }
    } catch (e: any) {
      setAccountsFeedback("❌ Error: " + e.message);
    } finally {
      setIsAddingAccountsUser(false);
    }
  };

  const handleRemoveAccountsUser = async (email: string) => {
    if (!confirm(`"${email}" എന്ന ഉപയോക്താവിനെ അക്കൗണ്ട്സ് ടീമിൽ നിന്ന് ഒഴിവാക്കണോ?`)) {
      return;
    }
    try {
      const res = await removeAccountsUser(email);
      if (res.success) {
        setSystemConfig(prev => ({
          ...prev,
          accountsUsers: res.list
        }));
        setAccountsFeedback(`✓ "${email}" എന്നയാളെ അക്കൗണ്ട്സ് ടീമിൽ നിന്ന് ഒഴിവാക്കി.`);
        setTimeout(() => setAccountsFeedback(null), 4000);
      } else {
        alert(res.error || "Failed to remove accounts user");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const getActivePackagePrice = (): number => {
    try {
      const savedPricing = localStorage.getItem("saas_pricing_config");
      const cfg = savedPricing ? JSON.parse(savedPricing) : pricingConfig;
      if (cfg && Array.isArray(cfg.items)) {
        const item = cfg.items.find((i: any) => i.id === "desk_stickers" || i.enabled);
        if (item && typeof item.price === "number" && item.price > 0) {
          return item.price;
        }
      }
    } catch (e) {}
    return 149;
  };

  const handleQuickToggleLicense = async (user: CRMUser) => {
    const key = user.id || user.regNo || user.name;
    const existing = licensesMap[key] || (user.regNo ? licensesMap[user.regNo] : null) || licensesMap[user.name];
    const isCurrentlyPaid = existing && existing.status === "paid";

    if (!confirm(`Are you sure you want to ${isCurrentlyPaid ? "deactivate" : "activate 1-Year License for"} ${user.name || "this Madrasa"}?`)) {
      return;
    }

    const newStatus = isCurrentlyPaid ? "trial" : "paid";
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);

    const activePrice = getActivePackagePrice();
    const cleanPhone = (user.phone || "").replace(/\D/g, "");
    const p10 = cleanPhone.slice(-10);

    const newLic: MadrasaLicense = {
      madrasaId: key,
      madrasaName: user.name,
      phone: user.phone,
      regNo: user.regNo,
      status: newStatus,
      plan: "bundle",
      durationMonths: 12,
      amountPaid: newStatus === "paid" ? activePrice : 0,
      activatedAt: new Date().toISOString(),
      expiresAt: newStatus === "paid" ? d.toISOString() : undefined,
      activatedBy: "SuperAdmin / Accounts",
      notes: newStatus === "paid" ? "Quick 1-click activated" : "Deactivated to trial"
    };

    const updated = {
      ...licensesMap,
      [key]: newLic,
      ...(user.regNo ? { [user.regNo]: newLic } : {}),
      ...(user.name ? { [user.name]: newLic } : {}),
      ...(cleanPhone ? { [cleanPhone]: newLic } : {}),
      ...(p10 && p10.length === 10 ? { [p10]: newLic, [`91${p10}`]: newLic } : {})
    };

    setLicensesMap(updated);
    try {
      localStorage.setItem("madrasa_licenses_map", JSON.stringify(updated));
      await fetch("/api/licenses", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Email": "superadmin@meladportal.com"
        },
        body: JSON.stringify(newLic)
      });
    } catch (e) {}

    setLicenseFeedback(`✅ ${user.name} ലൈസൻസ്: ${newStatus === "paid" ? "Paid Active" : "Trial"}!`);
    setTimeout(() => setLicenseFeedback(null), 2500);
  };

  const handlePermanentDeleteUser = async (user: CRMUser) => {
    if (!window.confirm(`⚠️ Permanently delete "${user.name}" and ALL their database records? This action cannot be undone and will clean up the database.`)) {
      return;
    }
    try {
      if (db) {
        try {
          await deleteDoc(doc(db, "institutions", user.id));
        } catch (e) {
          console.warn("Firestore delete err:", e);
        }
      }
      setCrmUsers(prev => prev.filter(u => u.id !== user.id));
      setSubmissions(prev => prev.filter(s => s.id !== user.id && s.ownerUid !== user.id));
      setOrders(prev => prev.orderList ? prev.orderList.filter(o => o.id !== user.id && o.ownerUid !== user.id) : prev);
      try {
        await fetch(`/api/admin/delete-user/${user.id}`, { 
          method: "DELETE",
          headers: { "x-admin-email": auth.currentUser?.email || "edavachalniyas@gmail.com" }
        });
      } catch (e) {}

      alert(`Successfully deleted user "${user.name}" and cleared all associated database records.`);
    } catch (e: any) {
      alert("Failed to delete user: " + (e.message || "Unknown error"));
    }
  };

  const handleDirectActivateByAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = directInput.trim().toLowerCase();
    if (!clean) {
      setDirectFeedback("❌ Please enter phone number, email or registration number.");
      return;
    }
    setIsDirectActivating(true);
    setDirectFeedback(null);
    try {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      const mName = directMadrasaName.trim() || `Madrasa (${clean})`;
      const rNo = directRegNo.trim() || "DIRECT-ACTIVE";
      const cleanPhone = clean.replace(/\D/g, "");
      const p10 = cleanPhone.slice(-10);
      const activePrice = getActivePackagePrice();

      const newLic: MadrasaLicense = {
        madrasaId: clean,
        madrasaName: mName,
        phone: clean.includes("@") ? "" : clean,
        email: clean.includes("@") ? clean : undefined,
        regNo: rNo,
        status: "paid",
        plan: "bundle",
        durationMonths: 12,
        amountPaid: activePrice,
        activatedAt: new Date().toISOString(),
        expiresAt: d.toISOString(),
        activatedBy: "Super Admin (Direct Activation)",
        notes: "Direct instant activation from Super Admin Dashboard"
      };

      const updated = {
        ...licensesMap,
        [clean]: newLic,
        [mName]: newLic,
        [rNo]: newLic,
        ...(cleanPhone ? { [cleanPhone]: newLic } : {}),
        ...(p10 && p10.length === 10 ? { [p10]: newLic, [`91${p10}`]: newLic } : {})
      };

      setLicensesMap(updated);
      try {
        localStorage.setItem("madrasa_licenses_map", JSON.stringify(updated));
        await fetch("/api/licenses", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Admin-Email": "superadmin@meladportal.com"
          },
          body: JSON.stringify(newLic)
        });
      } catch (e) {}

      setDirectFeedback(`✅ "${clean}" (${mName}) ലൈസൻസ് വിജയകരമായി ആക്റ്റിവേറ്റ് ചെയ്തു!`);
      setDirectInput("");
      setDirectMadrasaName("");
      setDirectRegNo("");
      setTimeout(() => setDirectFeedback(null), 4000);
    } catch (err: any) {
      setDirectFeedback("❌ Error: " + err.message);
    } finally {
      setIsDirectActivating(false);
    }
  };

  const handleOpenEditModal = (item: any, type: "order" | "submission") => {
    setEditingType(type);
    setEditingItem(item);
    setEditForm({
      madrasaName: item.madrasaName || item.name || "",
      regNo: item.regNo || "",
      place: item.place || "",
      contactName: item.contactName || "Usthad Representative",
      phone: item.phone || "",
      address: item.address || "",
      status: item.status || "Pending",
      trackingNo: item.trackingNo || ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      if (editingType === "order") {
        const res = await fetch(`/api/orders/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            madrasaName: editForm.madrasaName,
            regNo: editForm.regNo,
            place: editForm.place,
            contactName: editForm.contactName,
            phone: editForm.phone,
            address: editForm.address,
            status: editForm.status,
            trackingNo: editForm.trackingNo
          })
        });
        const data = await res.json();
        if (data.success) {
          setOrders(prev => prev.map(o => o.id === editingItem.id ? data.order : o));
          alert("Order & Madrasa details updated successfully!");
          setEditingItem(null);
        }
      } else {
        const res = await fetch(`/api/submissions/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editForm.madrasaName,
            regNo: editForm.regNo,
            place: editForm.place,
            phone: editForm.phone
          })
        });
        const data = await res.json();
        if (data.success) {
          setSubmissions(prev => prev.map(s => s.id === editingItem.id ? data.submission : s));
          alert("Madrasa Registration details updated successfully!");
          setEditingItem(null);
        }
      }
    } catch (e) {
      alert("Failed to save changes.");
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [resOrders, resSubs, resPricing, resTimetables, resSysConfig, resPartners, resCrm, resLicenses, resDir] = await Promise.all([
        fetch("/api/orders").then(r => r.json()).catch(() => ({ orders: [] })),
        fetch("/api/submissions").then(async r => {
          if (!r.ok) throw new Error("Fetch failed");
          const text = await r.text();
          try { return JSON.parse(text); } catch { return { submissions: [] }; }
        }).catch(() => ({ submissions: [] })),
        fetch("/api/pricing-config").then(r => r.json()).catch(() => ({ config: null })),
        fetch("/api/official-timetables").then(r => r.json()).catch(() => ({ timetables: [] })),
        fetchRemoteSystemConfig(),
        fetch("/api/partners").then(r => r.json()).catch(() => ({ partners: [] })),
        fetch("/api/crm-users").then(r => r.json()).catch(() => ({ users: [] })),
        fetch("/api/licenses").then(r => r.json()).catch(() => ({ licenses: {} })),
        fetchRemoteSubjectDirectory().catch(() => null)
      ]);
      
      // Collect orders from backend and local storage
      let serverOrders: any[] = resOrders.orders || [];
      let localOrders: any[] = [];
      try {
        const savedOrdersStr = localStorage.getItem("madrasa_print_orders");
        if (savedOrdersStr) {
          const parsed = JSON.parse(savedOrdersStr);
          if (Array.isArray(parsed)) localOrders = parsed;
        }
      } catch (e) {}

      const orderMap = new Map<string, any>();
      [...serverOrders, ...localOrders].forEach(o => {
        if (o && o.id) orderMap.set(o.id, o);
      });
      const mergedOrders = Array.from(orderMap.values());
      setOrders(mergedOrders);
      try {
        localStorage.setItem("madrasa_print_orders", JSON.stringify(mergedOrders));
      } catch (e) {}

      setSubmissions(resSubs.submissions || []);
      setSystemConfig(resSysConfig);

      let unifiedCrm: CRMUser[] = resCrm.users || [];
      try {
        if (db) {
          const instSnap = await getDocs(collection(db, "institutions"));
          instSnap.forEach(d => {
            const data = d.data();
            if (data && (data.name || data.email)) {
              const cleanPhone = (data.phone || "").replace(/[^0-9]/g, "");
              const p10 = cleanPhone.slice(-10);
              const exists = unifiedCrm.some(u => 
                u.id === d.id || 
                (p10 && u.phone && u.phone.includes(p10)) ||
                (data.name && u.name && u.name.trim().toLowerCase() === data.name.trim().toLowerCase())
              );
              if (!exists) {
                unifiedCrm.push({
                  id: d.id,
                  name: data.name || "Registered Madrasa",
                  phone: data.phone || "",
                  regNo: data.regNo || "REG-2026",
                  place: data.place || "Kerala",
                  email: data.email || "",
                  studentCount: 0,
                  hallCount: 0,
                  lastActiveAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
                  firstSeenAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
                  lastAction: "Google / Cloud Login",
                  totalActionsCount: 1,
                  ordersCount: 0,
                  source: "Cloud Institution",
                  notes: ""
                });
              }
            }
          });
        }
      } catch (e) {
        console.warn("Firestore institutions sync notice:", e);
      }
      setCrmUsers(unifiedCrm);
      if (resDir) {
        setMasterDir(resDir);
      }
      if (resLicenses && resLicenses.licenses) {
        setLicensesMap(prev => {
          const merged = { ...prev, ...resLicenses.licenses };
          try { localStorage.setItem("madrasa_licenses_map", JSON.stringify(merged)); } catch (e) {}
          return merged;
        });
      }

      // Collect partners from backend and local storage
      let combinedPartners = resPartners.partners || [];
      try {
        const localPartnersStr = localStorage.getItem("madrasa_partner_applications");
        if (localPartnersStr) {
          const localPartners = JSON.parse(localPartnersStr);
          if (Array.isArray(localPartners)) {
            const existingPhones = new Set(combinedPartners.map((p: any) => p.phone || p.id));
            for (const lp of localPartners) {
              if (!existingPhones.has(lp.phone || lp.id)) {
                combinedPartners.push(lp);
              }
            }
          }
        }
      } catch (e) {}
      setPartners(combinedPartners);
      
      if (resPricing && resPricing.config && Array.isArray(resPricing.config.items)) {
        setPricingConfig(resPricing.config);
        try {
          localStorage.setItem("saas_pricing_config", JSON.stringify(resPricing.config));
        } catch (e) {}
      }

      // Determine latest official timetables across Server API, Local Cache, and Firestore Cloud (fallback only)
      let serverBoards: OfficialBoardTimetable[] = Array.isArray(resTimetables?.timetables) ? resTimetables.timetables : [];
      let localBoards: OfficialBoardTimetable[] = [];
      try {
        const cached = localStorage.getItem("madrasa_official_boards_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) localBoards = parsed;
        }
      } catch (e) {}

      let cloudBoards: OfficialBoardTimetable[] = [];
      if (serverBoards.length === 0 && localBoards.length === 0) {
        try {
          const fsSnap = await getDoc(doc(db, "system_settings", "official_timetables"));
          if (fsSnap.exists() && Array.isArray(fsSnap.data()?.timetables)) {
            cloudBoards = fsSnap.data().timetables;
          }
        } catch (fsErr) {}
      }

      const getMaxTimestamp = (list: OfficialBoardTimetable[]) => {
        if (!Array.isArray(list) || list.length === 0) return 0;
        return Math.max(...list.map(b => new Date(b.lastUpdated || b.publishedAt || 0).getTime() || 0));
      };

      const candidates = [serverBoards, cloudBoards, localBoards].filter(arr => arr.length > 0);
      if (candidates.length > 0) {
        candidates.sort((a, b) => getMaxTimestamp(b) - getMaxTimestamp(a));
        const bestBoards = candidates[0];
        setTimetables(bestBoards);
        try {
          localStorage.setItem("madrasa_official_boards_cache", JSON.stringify(bestBoards));
        } catch (e) {}
        if (bestBoards.length > 0 && !bestBoards.some((t: any) => t.id === activeBoardId)) {
          const defB = bestBoards.find((t: any) => t.isDefault) || bestBoards[0];
          setActiveBoardId(defB.id);
        }
      }
    } catch (e) {
      console.error("Error loading admin data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystemConfig = async (overrideConfig?: SystemConfig) => {
    setIsSavingSystemConfig(true);
    setSystemConfigFeedback(null);
    const cfgToSave = overrideConfig || systemConfig;
    try {
      const success = await updateRemoteSystemConfig(cfgToSave);
      setSystemConfig({ ...cfgToSave });
      if (success) {
        setSystemConfigFeedback("✅ സിസ്റ്റം ക്രമീകരണങ്ങളും ആപ്പ് മൊഡ്യൂൾ സ്റ്റാറ്റസും ക്ലൗഡിൽ സേവ് ചെയ്തു!");
      } else {
        setSystemConfigFeedback("⚠️ ക്ലൗഡ് കണക്ഷൻ ലഭ്യമല്ല, പ്രാദേശികമായി (Local) സേവ് ചെയ്തു.");
      }
      setTimeout(() => setSystemConfigFeedback(null), 4000);
    } catch (e) {
      setSystemConfigFeedback("❌ സേവ് ചെയ്യുന്നതിൽ പിശക് സംഭവിച്ചു.");
    } finally {
      setIsSavingSystemConfig(false);
    }
  };

  useEffect(() => {
    fetchAdminData();

    const handleOrdersUpdated = () => {
      try {
        const saved = localStorage.getItem("madrasa_print_orders");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setOrders(parsed);
        }
      } catch (e) {}
    };

    window.addEventListener("madrasa-orders-updated", handleOrdersUpdated);
    return () => window.removeEventListener("madrasa-orders-updated", handleOrdersUpdated);
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string, trackingNo?: string, courierPartner?: string, rejectionReason?: string) => {
    try {
      let updatedOrder: any = null;
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, trackingNo, courierPartner, rejectionReason })
        });
        const data = await res.json();
        if (data.success) {
          updatedOrder = data.order;
        }
      } catch (e) {}

      setOrders(prev => {
        const updated = prev.map(o => {
          if (o.id === orderId) {
            return updatedOrder || { 
              ...o, 
              status: newStatus, 
              trackingNo: trackingNo !== undefined ? trackingNo : o.trackingNo, 
              courierPartner: courierPartner !== undefined ? courierPartner : o.courierPartner, 
              rejectionReason: rejectionReason !== undefined ? rejectionReason : o.rejectionReason,
              updatedAt: new Date().toISOString()
            };
          }
          return o;
        });
        try {
          localStorage.setItem("madrasa_print_orders", JSON.stringify(updated));
          window.dispatchEvent(new Event("madrasa-orders-updated"));
        } catch (e) {}
        return updated;
      });
    } catch (e) {
      alert("Failed to update status");
    }
  };

  // Timetable Operations
  const currentBoard = timetables.find(t => t.id === activeBoardId) || timetables[0];

  // Helper to generate sequential dates skipping Friday if requested (Timezone-safe local date math)
  const calculateSequentialDates = (startDateStr: string, count: number, skipFri: boolean): string[] => {
    if (!startDateStr) return [];
    const iso = toDateInputValue(startDateStr) || startDateStr;
    const parts = iso.split("-").map(Number);
    let cur: Date;
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      cur = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      cur = new Date(startDateStr);
    }
    if (isNaN(cur.getTime())) return [];
    const daysArr: string[] = [];
    while (daysArr.length < count) {
      // 5 = Friday
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
  };

  const getBoardClassEntries = (board: OfficialBoardTimetable | undefined | null, classKey: string): OfficialTimetableEntry[] => {
    if (!board || !board.classes) return [];
    const norm = normalizeClassKey(classKey);
    const plainNum = norm.replace(/\D/g, "");
    let existing = board.classes[norm] !== undefined
      ? board.classes[norm]
      : (board.classes[classKey] !== undefined)
        ? board.classes[classKey]
        : (plainNum && board.classes[plainNum] !== undefined)
          ? board.classes[plainNum]
          : undefined;

    if (existing !== undefined && Array.isArray(existing)) {
      return existing;
    }

    const stdSubjects = getSubjectsForClass(classKey) || [];
    if (stdSubjects.length > 0) {
      const dates = calculateSequentialDates(batchExamStartDate || getDynamicDefaultStartDate(), stdSubjects.length, batchSkipFriday);
      const generated: OfficialTimetableEntry[] = stdSubjects.map((s, idx) => ({
        dayNum: idx + 1,
        dateStr: dates[idx] || formatDateWithDay(dates[idx]),
        subject: s.nameMl,
        timeStr: wizardTimingToAll || "06:30 AM - 08:30 AM"
      }));
      board.classes[norm] = generated;
      if (plainNum) board.classes[plainNum] = generated;
      return generated;
    }

    return [];
  };

  // Unified real-time persistence helper
  const syncBoardTimetableToSystem = async (
    boardInput: OfficialBoardTimetable,
    baseList?: OfficialBoardTimetable[],
    makeActiveDefault: boolean = true,
    persistToCloud: boolean = false
  ): Promise<OfficialBoardTimetable> => {
    const nowIso = new Date().toISOString();
    const normClasses: Record<string, OfficialTimetableEntry[]> = { ...(boardInput.classes || {}) };

    for (let i = 1; i <= 12; i++) {
      const withPrefix = `Class ${i}`;
      const numStr = String(i);
      const entries = normClasses[withPrefix] !== undefined
        ? normClasses[withPrefix]
        : normClasses[numStr] !== undefined
          ? normClasses[numStr]
          : getBoardClassEntries({ ...boardInput, classes: normClasses }, withPrefix);
      if (Array.isArray(entries)) {
        const cleaned = entries.filter(Boolean).map((e, idx) => ({
          dayNum: e.dayNum || idx + 1,
          dateStr: e.dateStr ? formatDateWithDay(e.dateStr) : `Day ${idx + 1}`,
          subject: e.subject || "",
          timeStr: e.timeStr || wizardTimingToAll || "06:30 AM - 08:30 AM"
        }));
        normClasses[withPrefix] = cleaned;
        normClasses[numStr] = cleaned;
      }
    }
    if (normClasses["Class 11"]) normClasses["+1"] = normClasses["Class 11"];
    if (normClasses["Class 12"]) normClasses["+2"] = normClasses["Class 12"];

    const boardToSave: OfficialBoardTimetable = {
      ...boardInput,
      isDefault: makeActiveDefault ? true : boardInput.isDefault,
      classes: normClasses,
      lastUpdated: nowIso,
      updatedBy: "Super Admin"
    };

    const listSource = baseList || timetables;
    const existsInList = listSource.some(t => t.id === boardToSave.id);
    const updatedList = (existsInList ? listSource.map(t => t.id === boardToSave.id ? boardToSave : t) : [...listSource, boardToSave]).map(t => ({
      ...t,
      isDefault: makeActiveDefault ? t.id === boardToSave.id : t.isDefault
    }));

    setTimetables(updatedList);

    const userTimetableMap: Record<string, { dayNum: number; dateStr: string; subject: string; timeStr?: string }[]> = {};
    Object.entries(normClasses).forEach(([clKey, subjs]) => {
      if (Array.isArray(subjs)) {
        const mapped = subjs.map((s, idx) => ({
          dayNum: s.dayNum || idx + 1,
          dateStr: s.dateStr ? formatDateWithDay(s.dateStr) : `Day ${idx + 1}`,
          subject: s.subject || "",
          timeStr: s.timeStr || wizardTimingToAll || "06:30 AM - 08:30 AM"
        }));
        userTimetableMap[clKey] = mapped;
        const numMatch = clKey.match(/\d+/);
        if (numMatch) {
          const num = numMatch[0];
          userTimetableMap[num] = mapped;
          userTimetableMap[`Class ${num}`] = mapped;
          userTimetableMap[`ക്ലാസ് ${num}`] = mapped;
          userTimetableMap[`std ${num}`] = mapped;
        }
      }
    });

    const metaToSave = {
      boardId: boardToSave.id,
      boardName: boardToSave.boardName,
      boardNameMl: boardToSave.boardNameMl,
      term: boardToSave.term || "quarterly",
      termMl: boardToSave.termMl || "പാദവാർഷികം",
      isVerified: !!boardToSave.isVerified,
      source: boardToSave.source || "superadmin_verified",
      lastUpdated: nowIso,
      updatedBy: "Super Admin"
    };

    try {
      localStorage.setItem("madrasa_official_boards_cache", JSON.stringify(updatedList));
      localStorage.setItem("madrasa_active_board_metadata", JSON.stringify(metaToSave));
      localStorage.setItem("madrasa_exam_timetable", JSON.stringify(userTimetableMap));
    } catch (e) {}

    window.dispatchEvent(new CustomEvent("official-timetable-updated", {
      detail: {
        board: boardToSave,
        timetables: updatedList,
        classTimetableMap: userTimetableMap,
        metadata: metaToSave
      }
    }));
    window.dispatchEvent(new Event("official-timetables-updated"));

    if (persistToCloud) {
      try {
        await Promise.allSettled([
          fetch(`/api/official-timetables/${boardToSave.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(boardToSave)
          }).catch(() => {}),
          setDoc(doc(db, "system_settings", "official_timetables"), {
            timetables: updatedList,
            activeBoardId: boardToSave.id,
            updatedAt: nowIso
          }, { merge: true }).catch(() => {})
        ]);
      } catch (err) {
        console.warn("Background timetable sync warning:", err);
      }
    }

    return boardToSave;
  };

  const handleUpdateBoardClassSubject = (classKey: string, dayIndex: number, field: keyof OfficialTimetableEntry, value: any) => {
    if (!currentBoard) return;
    const updatedBoard: OfficialBoardTimetable = {
      ...currentBoard,
      classes: { ...(currentBoard.classes || {}) }
    };
    const classEntries = [...getBoardClassEntries(updatedBoard, classKey)];
    if (classEntries[dayIndex]) {
      let finalVal = value;
      if (field === "dateStr" && typeof value === "string") {
        finalVal = formatDateWithDay(value);
      }
      classEntries[dayIndex] = {
        ...classEntries[dayIndex],
        [field]: finalVal
      };
      const norm = normalizeClassKey(classKey);
      const plainNum = norm.replace(/\D/g, "");
      updatedBoard.classes[norm] = classEntries;
      if (plainNum) updatedBoard.classes[plainNum] = classEntries;
      if (norm === "Class 11") updatedBoard.classes["+1"] = classEntries;
      if (norm === "Class 12") updatedBoard.classes["+2"] = classEntries;
      syncBoardTimetableToSystem(updatedBoard, timetables, true);
    }
  };

  const handleAddDayToClass = (classKey: string) => {
    if (!currentBoard) return;
    const updatedBoard: OfficialBoardTimetable = {
      ...currentBoard,
      classes: { ...(currentBoard.classes || {}) }
    };
    const classEntries = [...getBoardClassEntries(updatedBoard, classKey)];
    const newDayNum = classEntries.length + 1;
    let nextDate = `Day ${newDayNum}`;
    if (classEntries.length > 0 && classEntries[classEntries.length - 1].dateStr) {
      const lastIso = toDateInputValue(classEntries[classEntries.length - 1].dateStr);
      if (lastIso) {
        const parts = lastIso.split("-").map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        d.setDate(d.getDate() + 1);
        if (batchSkipFriday && d.getDay() === 5) {
          d.setDate(d.getDate() + 1);
        }
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        nextDate = formatDateWithDay(`${yyyy}-${mm}-${dd}`);
      }
    } else {
      nextDate = formatDateWithDay(batchExamStartDate || getDynamicDefaultStartDate());
    }

    const existingAssigned = classEntries.map(e => e.subject);
    const nextSubject = getNextUnusedSubject(classKey, existingAssigned);

    classEntries.push({
      dayNum: newDayNum,
      dateStr: nextDate,
      subject: nextSubject,
      timeStr: wizardTimingToAll || "06:30 AM - 08:30 AM"
    });
    const norm = normalizeClassKey(classKey);
    const plainNum = norm.replace(/\D/g, "");
    updatedBoard.classes[norm] = classEntries;
    if (plainNum) updatedBoard.classes[plainNum] = classEntries;
    if (norm === "Class 11") updatedBoard.classes["+1"] = classEntries;
    if (norm === "Class 12") updatedBoard.classes["+2"] = classEntries;
    syncBoardTimetableToSystem(updatedBoard, timetables, true);
  };

  const handleApplyCopyScheduleToClasses = () => {
    if (!currentBoard) return;
    const sourceEntries = getBoardClassEntries(currentBoard, copySourceClass);
    if (sourceEntries.length === 0) {
      alert(`${copySourceClass}-ൽ പരീക്ഷാ തീയതികൾ ഒന്നും ചേർത്തിട്ടില്ല. ആദ്യം ഈ ക്ലാസിൽ ടൈംടേബിൾ നിർമ്മിക്കുക.`);
      return;
    }

    const selectedTargets = Object.entries(copyTargetClasses)
      .filter(([_, sel]) => sel)
      .map(([cls]) => cls);

    if (selectedTargets.length === 0) {
      alert("പകർത്തേണ്ട ലക്ഷ്യ ക്ലാസുകൾ തിരഞ്ഞെടുക്കുക (Select at least one target class)!");
      return;
    }

    const updatedBoard: OfficialBoardTimetable = {
      ...currentBoard,
      classes: { ...(currentBoard.classes || {}) }
    };

    selectedTargets.forEach((targetCls) => {
      const targetSubjects = getSubjectsForClass(targetCls);
      const targetEntries: OfficialTimetableEntry[] = sourceEntries.map((src, idx) => {
        let targetSubj = src.subject;
        if (copyMode === "structure_only") {
          targetSubj = targetSubjects[idx] ? targetSubjects[idx].nameMl : "";
        }
        return {
          dayNum: idx + 1,
          dateStr: src.dateStr,
          timeStr: src.timeStr || wizardTimingToAll || "06:30 AM - 08:30 AM",
          subject: targetSubj
        };
      });

      const norm = normalizeClassKey(targetCls);
      const plainNum = norm.replace(/\D/g, "");
      updatedBoard.classes[norm] = targetEntries;
      if (plainNum) updatedBoard.classes[plainNum] = targetEntries;
      if (norm === "Class 11") updatedBoard.classes["+1"] = targetEntries;
      if (norm === "Class 12") updatedBoard.classes["+2"] = targetEntries;
    });

    syncBoardTimetableToSystem(updatedBoard, timetables, true, true);
    setIsCopyModalOpen(false);
    setTimetableFeedback(`✅ ${copySourceClass} ടൈംടേബിൾ ${selectedTargets.length} ക്ലാസുകളിലേക്ക് വിജയകരമായി പകർത്തി!`);
    setTimeout(() => setTimetableFeedback(null), 5000);
  };

  const handleSwapDaysInClass = (classKey: string, fromIndex: number, toIndex: number) => {
    if (!currentBoard) return;
    const updatedBoard: OfficialBoardTimetable = {
      ...currentBoard,
      classes: { ...(currentBoard.classes || {}) }
    };
    const classEntries = [...getBoardClassEntries(updatedBoard, classKey)].map(e => ({ ...e }));
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= classEntries.length ||
      toIndex >= classEntries.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    // Keep Day 1, Day 2... and their corresponding Dates anchored in order while swapping the subjects & timings
    const fromSubject = classEntries[fromIndex].subject;
    const fromTime = classEntries[fromIndex].timeStr;
    const toSubject = classEntries[toIndex].subject;
    const toTime = classEntries[toIndex].timeStr;

    classEntries[fromIndex] = {
      ...classEntries[fromIndex],
      dayNum: fromIndex + 1,
      subject: toSubject,
      timeStr: toTime
    };
    classEntries[toIndex] = {
      ...classEntries[toIndex],
      dayNum: toIndex + 1,
      subject: fromSubject,
      timeStr: fromTime
    };

    // Also swap custom input mode flags if active
    setCustomEditingDays(prev => {
      const keyA = `${classKey}_${fromIndex}`;
      const keyB = `${classKey}_${toIndex}`;
      return {
        ...prev,
        [keyA]: !!prev[keyB],
        [keyB]: !!prev[keyA]
      };
    });

    const plainNum = classKey.replace(/\D/g, "");
    const withClass = plainNum ? `Class ${plainNum}` : classKey;
    updatedBoard.classes[classKey] = classEntries;
    if (withClass) updatedBoard.classes[withClass] = classEntries;
    if (plainNum) updatedBoard.classes[plainNum] = classEntries;
    if (plainNum === "11") updatedBoard.classes["+1"] = classEntries;
    if (plainNum === "12") updatedBoard.classes["+2"] = classEntries;

    setSwappingDayIndex(null);
    syncBoardTimetableToSystem(updatedBoard, timetables, true, true);
    setTimetableFeedback(
      `✓ Day ${fromIndex + 1} (${classEntries[fromIndex].dateStr}) ↔ Day ${toIndex + 1} (${classEntries[toIndex].dateStr}) വിഷയങ്ങൾ പരസ്പരം മാറ്റി സേവ് ചെയ്തു!`
    );
    setTimeout(() => setTimetableFeedback(null), 3500);
  };

  const handleMoveDayInClass = (classKey: string, dayIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? dayIndex - 1 : dayIndex + 1;
    handleSwapDaysInClass(classKey, dayIndex, targetIndex);
  };

  const handleRemoveDayFromClass = (classKey: string, dayIndex: number) => {
    if (!currentBoard) return;
    const updatedBoard: OfficialBoardTimetable = {
      ...currentBoard,
      classes: { ...(currentBoard.classes || {}) }
    };
    const oldEntries = [...getBoardClassEntries(updatedBoard, classKey)];
    const removedItem = oldEntries[dayIndex];
    // Preserve sequential slot dates so Day 1, Day 2, Day 3 keep their chronological dates when a subject box is deleted
    const slotDates = oldEntries.map(e => e.dateStr);
    const classEntries = oldEntries.filter((_, idx) => idx !== dayIndex);
    // re-index dayNum and assign preserved slot dates
    const reindexed = classEntries.map((entry, idx) => ({
      ...entry,
      dayNum: idx + 1,
      dateStr: slotDates[idx] ? slotDates[idx] : (entry.dateStr.startsWith("Day ") ? `Day ${idx + 1}` : entry.dateStr)
    }));
    const plainNum = classKey.replace(/\D/g, "");
    const withClass = plainNum ? `Class ${plainNum}` : classKey;
    updatedBoard.classes[classKey] = reindexed;
    if (withClass) updatedBoard.classes[withClass] = reindexed;
    if (plainNum) updatedBoard.classes[plainNum] = reindexed;
    if (plainNum === "11") updatedBoard.classes["+1"] = reindexed;
    if (plainNum === "12") updatedBoard.classes["+2"] = reindexed;

    setSwappingDayIndex(null);
    syncBoardTimetableToSystem(updatedBoard, timetables, true, true);
    setTimetableFeedback(
      `🗑️ "${removedItem?.subject || `Day ${dayIndex + 1}`}" ബോക്സ് ഒഴിവാക്കി! ബാക്കിയുള്ള വിഷയങ്ങൾ Day 1, Day 2 ക്രമത്തിലാക്കി സേവ് ചെയ്തു.`
    );
    setTimeout(() => setTimetableFeedback(null), 4000);
  };

  const handleReloadDirectorySubjectsForClass = (classKey: string) => {
    if (!currentBoard) return;
    const stdSubjects = getSubjectsForClass(classKey) || [];
    if (stdSubjects.length === 0) return;
    const updatedBoard: OfficialBoardTimetable = {
      ...currentBoard,
      classes: { ...(currentBoard.classes || {}) }
    };
    const existingEntries = getBoardClassEntries(updatedBoard, classKey);
    const dates = calculateSequentialDates(batchExamStartDate || "2026-07-18", stdSubjects.length, batchSkipFriday);
    const generated: OfficialTimetableEntry[] = stdSubjects.map((s, idx) => ({
      dayNum: idx + 1,
      dateStr: existingEntries[idx]?.dateStr || dates[idx] || formatDateWithDay(`2026-07-${18 + idx}`),
      subject: s.nameMl,
      timeStr: existingEntries[idx]?.timeStr || "06:30 AM - 08:30 AM"
    }));
    const plainNum = classKey.replace(/\D/g, "");
    const withClass = plainNum ? `Class ${plainNum}` : classKey;
    updatedBoard.classes[classKey] = generated;
    if (withClass) updatedBoard.classes[withClass] = generated;
    if (plainNum) updatedBoard.classes[plainNum] = generated;
    if (plainNum === "11") updatedBoard.classes["+1"] = generated;
    if (plainNum === "12") updatedBoard.classes["+2"] = generated;
    syncBoardTimetableToSystem(updatedBoard, timetables, true, true);
    setTimetableFeedback(`✓ ${classKey}-ലേക്ക് ഒഫീഷ്യൽ ഡയറക്ടറിയിലെ ${generated.length} വിഷയങ്ങളും പുനഃസ്ഥാപിച്ചു!`);
    setTimeout(() => setTimetableFeedback(null), 4000);
  };

  const handleSaveBoardTimetable = async () => {
    if (!currentBoard) return;
    setIsSavingTimetable(true);
    setTimetableFeedback(null);
    try {
      await syncBoardTimetableToSystem(currentBoard, timetables, true, true);
      setTimetableFeedback("✓ ഔദ്യോഗിക ബോർഡ് പരീക്ഷാ ടൈംടേബിൾ (തീയതികളും വിഷയങ്ങളും) ക്ലൗഡിലും സെർവറിലും വിജയകരമായി സേവ് ചെയ്തു! എല്ലാ മദ്റസകളിലും യൂസർമാർക്കും ഇത് തത്സമയം ലഭ്യമായി.");
      setTimeout(() => setTimetableFeedback(null), 6000);
    } catch (e: any) {
      alert("Error publishing timetable: " + e.message);
    } finally {
      setIsSavingTimetable(false);
    }
  };

  const handleApplySequentialDates = (scope: "current_class" | "all_classes") => {
    if (!currentBoard) return;
    const updatedBoard: OfficialBoardTimetable = {
      ...currentBoard,
      classes: { ...(currentBoard.classes || {}) }
    };
    if (scope === "current_class") {
      const classEntries = [...getBoardClassEntries(updatedBoard, activeClassKey)].map(e => ({ ...e }));
      if (classEntries.length === 0) return;
      const dates = calculateSequentialDates(batchExamStartDate, classEntries.length, batchSkipFriday);
      classEntries.forEach((entry, idx) => {
        if (dates[idx]) {
          entry.dateStr = dates[idx];
        }
      });
      const plainNum = activeClassKey.replace(/\D/g, "");
      const withClass = plainNum ? `Class ${plainNum}` : activeClassKey;
      updatedBoard.classes[activeClassKey] = classEntries;
      if (withClass) updatedBoard.classes[withClass] = classEntries;
      if (plainNum) updatedBoard.classes[plainNum] = classEntries;
      syncBoardTimetableToSystem(updatedBoard, timetables, true, true);
      setTimetableFeedback(`✓ ${activeClassKey}-ലേക്ക് തുടർച്ചയായ ${classEntries.length} പരീക്ഷാ തീയതികൾ നൽകി യൂസർമാർക്കായി സേവ് ചെയ്തു!`);
      setTimeout(() => setTimetableFeedback(null), 4000);
    } else {
      let totalUpdated = 0;
      for (let i = 1; i <= 12; i++) {
        const clsKey = `Class ${i}`;
        const classEntries = [...getBoardClassEntries(updatedBoard, clsKey)].map(e => ({ ...e }));
        if (classEntries.length > 0) {
          const dates = calculateSequentialDates(batchExamStartDate, classEntries.length, batchSkipFriday);
          classEntries.forEach((entry, idx) => {
            if (dates[idx]) {
              entry.dateStr = dates[idx];
            }
          });
          const numStr = String(i);
          updatedBoard.classes[clsKey] = classEntries;
          updatedBoard.classes[numStr] = classEntries;
          totalUpdated++;
        }
      }
      syncBoardTimetableToSystem(updatedBoard, timetables, true, true);
      setTimetableFeedback(`✓ മുഴുവൻ ക്ലാസുകളിലേക്കും (${totalUpdated} ക്ലാസുകൾ) തുടർച്ചയായ തീയതികൾ നൽകി യൂസർമാർക്കായി സേവ് ചെയ്തു!`);
      setTimeout(() => setTimetableFeedback(null), 4000);
    }
  };

  // Set Board as Default/Active for all Madrasas
  const handleToggleBoardDefault = async (boardId: string) => {
    const targetBoard = timetables.find(t => t.id === boardId);
    if (!targetBoard) return;
    await syncBoardTimetableToSystem({ ...targetBoard, isDefault: true }, timetables, true, true);
    setTimetableFeedback(`✓ "${targetBoard.boardNameMl || targetBoard.boardName}" പ്രധാന ബോർഡ് ടൈംടേബിൾ ആയി നിശ്ചയിച്ചു! എല്ലാ യൂസർമാർക്കും ഇത് തനിയെ ലോഡ് ആകും.`);
    setTimeout(() => setTimetableFeedback(null), 4000);
  };

  const handleUpdateCurrentBoardMetadata = (field: keyof OfficialBoardTimetable, value: any) => {
    if (!currentBoard) return;
    const updatedBoard = {
      ...currentBoard,
      [field]: value,
      lastUpdated: new Date().toISOString()
    };
    syncBoardTimetableToSystem(updatedBoard, timetables, true);
  };

  const handleOpenBoardWizard = () => {
    setBoardWizardStep(1);
    setWizardActiveCls("Class 1");
    setWizardClasses({});
    setWizardStartDate(batchExamStartDate || "2026-07-18");
    setWizardSkipFriday(batchSkipFriday !== undefined ? batchSkipFriday : true);
    setWizardTimingToAll("06:30 AM - 08:30 AM");
    setWizardNewSubMl("");
    setWizardNewSubEn("");
    setWizardNewSubCat("fiqh");
    setNewBoardForm({
      boardName: "",
      boardNameMl: "",
      academicYear: "2025-2026",
      term: "quarterly",
      termMl: "പാദവാർഷിക പരീക്ഷ",
      description: "",
      isVerified: true,
      source: "superadmin_verified",
      category: "general"
    });
    setIsCreatingBoard(true);
  };

  const handleWizardProceedToStep2 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newBoardForm.boardName.trim()) {
      alert("Please enter Board Name (ബോർഡിന്റെ പേര് നൽകുക)!");
      return;
    }
    setBoardWizardStep(2);
  };

  const handleWizardProceedToStep3 = () => {
    const currentDir = getMasterSubjectsDirectory();
    const updatedClasses: Record<string, OfficialTimetableEntry[]> = { ...wizardClasses };

    for (let i = 1; i <= 12; i++) {
      const clsKey = `Class ${i}`;
      const plainNum = String(i);
      const subjs = currentDir[clsKey] || currentDir[plainNum] || [];

      // If not yet populated, create days based on directory subjects
      if (!updatedClasses[clsKey] || updatedClasses[clsKey].length === 0) {
        if (subjs.length > 0) {
          const dates = calculateSequentialDates(wizardStartDate || "2026-07-18", subjs.length, wizardSkipFriday);
          const entries: OfficialTimetableEntry[] = subjs.map((s, idx) => ({
            dayNum: idx + 1,
            dateStr: dates[idx] || formatDateWithDay(`2026-07-${18 + idx}`),
            subject: s.nameMl,
            timeStr: wizardTimingToAll || "06:30 AM - 08:30 AM"
          }));
          updatedClasses[clsKey] = entries;
          updatedClasses[plainNum] = entries;
        } else {
          updatedClasses[clsKey] = [];
          updatedClasses[plainNum] = [];
        }
      }
    }
    setWizardClasses(updatedClasses);
    setBoardWizardStep(3);
  };

  const handleWizardAddSubject = (cls: string) => {
    if (!wizardNewSubMl.trim()) {
      alert("വിഷയത്തിന്റെ മലയാളം പേര് നൽകുക (Malayalam Name is required)!");
      return;
    }
    const currentList = masterDir[cls] || [];
    const newId = `${cls.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
    const newSubject: SubjectItem = {
      id: newId,
      nameMl: wizardNewSubMl.trim(),
      nameEn: wizardNewSubEn.trim() || wizardNewSubMl.trim(),
      category: wizardNewSubCat,
      defaultOrder: currentList.length + 1,
      isCustom: true
    };
    const plainNum = cls.replace(/\D/g, "");
    const updated = {
      ...masterDir,
      [cls]: [...currentList, newSubject],
      ...(plainNum ? { [plainNum]: [...currentList, newSubject] } : {}),
      ...(plainNum === "11" ? { "+1": [...currentList, newSubject] } : {}),
      ...(plainNum === "12" ? { "+2": [...currentList, newSubject] } : {})
    };
    setMasterDir(updated);
    saveMasterSubjectsDirectory(updated);
    setWizardNewSubMl("");
    setWizardNewSubEn("");
  };

  const handleWizardRemoveSubject = (cls: string, subjectId: string) => {
    const currentList = masterDir[cls] || [];
    const updatedList = currentList.filter(s => s.id !== subjectId);
    const plainNum = cls.replace(/\D/g, "");
    const updated = {
      ...masterDir,
      [cls]: updatedList,
      ...(plainNum ? { [plainNum]: updatedList } : {}),
      ...(plainNum === "11" ? { "+1": updatedList } : {}),
      ...(plainNum === "12" ? { "+2": updatedList } : {})
    };
    setMasterDir(updated);
    saveMasterSubjectsDirectory(updated);
  };

  const handleLoadSamasthaTemplateToDirectory = () => {
    if (confirm("സമസ്ത സിലബസ് സ്റ്റാൻഡേർഡ് ടെംപ്ലേറ്റ് മുഴുവൻ ക്ലാസുകളിലേക്കും ലോഡ് ചെയ്യണോ? (നിലവിലുള്ള വിഷയങ്ങൾ മാറ്റപ്പെടും)")) {
      setMasterDir(SAMASTHA_SYLLABUS_TEMPLATE);
      saveMasterSubjectsDirectory(SAMASTHA_SYLLABUS_TEMPLATE);
    }
  };

  const handleClearClassSubjectsInWizard = (cls: string) => {
    if (confirm(`${cls}-ലെ എല്ലാ വിഷയങ്ങളും നീക്കം ചെയ്യണോ?`)) {
      const plainNum = cls.replace(/\D/g, "");
      const updated = {
        ...masterDir,
        [cls]: [],
        ...(plainNum ? { [plainNum]: [] } : {})
      };
      setMasterDir(updated);
      saveMasterSubjectsDirectory(updated);
    }
  };

  const handleUpdateWizardDaySubject = (cls: string, dayIdx: number, subjectVal: string) => {
    const list = [...(wizardClasses[cls] || [])];
    if (list[dayIdx]) {
      list[dayIdx] = { ...list[dayIdx], subject: subjectVal };
      const plainNum = cls.replace(/\D/g, "");
      setWizardClasses({
        ...wizardClasses,
        [cls]: list,
        ...(plainNum ? { [plainNum]: list } : {})
      });
    }
  };

  const handleUpdateWizardDayDate = (cls: string, dayIdx: number, dateVal: string) => {
    const list = [...(wizardClasses[cls] || [])];
    if (list[dayIdx]) {
      list[dayIdx] = { ...list[dayIdx], dateStr: formatDateWithDay(dateVal) };
      const plainNum = cls.replace(/\D/g, "");
      setWizardClasses({
        ...wizardClasses,
        [cls]: list,
        ...(plainNum ? { [plainNum]: list } : {})
      });
    }
  };

  const handleUpdateWizardDayTime = (cls: string, dayIdx: number, timeVal: string) => {
    const list = [...(wizardClasses[cls] || [])];
    if (list[dayIdx]) {
      list[dayIdx] = { ...list[dayIdx], timeStr: timeVal };
      const plainNum = cls.replace(/\D/g, "");
      setWizardClasses({
        ...wizardClasses,
        [cls]: list,
        ...(plainNum ? { [plainNum]: list } : {})
      });
    }
  };

  const handleWizardAddDay = (cls: string) => {
    const list = [...(wizardClasses[cls] || [])];
    const newDayNum = list.length + 1;
    let nextDate = formatDateWithDay(wizardStartDate || "2026-07-18");
    if (list.length > 0 && list[list.length - 1].dateStr) {
      const lastIso = toDateInputValue(list[list.length - 1].dateStr);
      if (lastIso) {
        const parts = lastIso.split("-").map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        d.setDate(d.getDate() + 1);
        if (wizardSkipFriday && d.getDay() === 5) d.setDate(d.getDate() + 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        nextDate = formatDateWithDay(`${yyyy}-${mm}-${dd}`);
      }
    }
    const classSubjs = masterDir[cls] || [];
    const assignedSubjs = list.map(d => d.subject);
    const nextSubj = getNextUnusedSubject(cls, assignedSubjs);
    const defaultSubj = nextSubj || (classSubjs.length > 0 ? classSubjs[0].nameMl : "");
    list.push({
      dayNum: newDayNum,
      dateStr: nextDate,
      subject: defaultSubj,
      timeStr: wizardTimingToAll || "06:30 AM - 08:30 AM"
    });
    const plainNum = cls.replace(/\D/g, "");
    setWizardClasses({
      ...wizardClasses,
      [cls]: list,
      ...(plainNum ? { [plainNum]: list } : {})
    });
  };

  const handleWizardRemoveDay = (cls: string, dayIdx: number) => {
    const list = [...(wizardClasses[cls] || [])].filter((_, idx) => idx !== dayIdx).map((d, idx) => ({
      ...d,
      dayNum: idx + 1
    }));
    const plainNum = cls.replace(/\D/g, "");
    setWizardClasses({
      ...wizardClasses,
      [cls]: list,
      ...(plainNum ? { [plainNum]: list } : {})
    });
  };

  const handleWizardMoveDay = (cls: string, dayIdx: number, direction: "up" | "down") => {
    const list = [...(wizardClasses[cls] || [])];
    const targetIdx = direction === "up" ? dayIdx - 1 : dayIdx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[dayIdx];
    list[dayIdx] = list[targetIdx];
    list[targetIdx] = temp;
    const reordered = list.map((d, idx) => ({ ...d, dayNum: idx + 1 }));
    const plainNum = cls.replace(/\D/g, "");
    setWizardClasses({
      ...wizardClasses,
      [cls]: reordered,
      ...(plainNum ? { [plainNum]: reordered } : {})
    });
  };

  const handleWizardApplySequentialDates = (cls: string) => {
    const list = [...(wizardClasses[cls] || [])];
    if (list.length === 0) return;
    const dates = calculateSequentialDates(wizardStartDate, list.length, wizardSkipFriday);
    const updated = list.map((d, idx) => ({
      ...d,
      dateStr: dates[idx] || d.dateStr
    }));
    const plainNum = cls.replace(/\D/g, "");
    setWizardClasses({
      ...wizardClasses,
      [cls]: updated,
      ...(plainNum ? { [plainNum]: updated } : {})
    });
  };

  const handleWizardApplyTimingToAllDays = (cls: string) => {
    const list = [...(wizardClasses[cls] || [])];
    const updated = list.map(d => ({ ...d, timeStr: wizardTimingToAll }));
    const plainNum = cls.replace(/\D/g, "");
    setWizardClasses({
      ...wizardClasses,
      [cls]: updated,
      ...(plainNum ? { [plainNum]: updated } : {})
    });
  };

  const handleWizardAutofillFromDirectory = (cls: string) => {
    const subjs = masterDir[cls] || [];
    if (subjs.length === 0) {
      alert(`${cls}-ലേക്ക് വിഷയങ്ങൾ ഒന്നും ചേർത്തിട്ടില്ല. Step 2-ൽ പോയി വിഷയം ചേർക്കുക.`);
      return;
    }
    const dates = calculateSequentialDates(wizardStartDate, subjs.length, wizardSkipFriday);
    const entries: OfficialTimetableEntry[] = subjs.map((s, idx) => ({
      dayNum: idx + 1,
      dateStr: dates[idx] || formatDateWithDay(`2026-07-${18 + idx}`),
      subject: s.nameMl,
      timeStr: wizardTimingToAll || "06:30 AM - 08:30 AM"
    }));
    const plainNum = cls.replace(/\D/g, "");
    setWizardClasses({
      ...wizardClasses,
      [cls]: entries,
      ...(plainNum ? { [plainNum]: entries } : {})
    });
  };

  const handleWizardSaveAndPublish = async () => {
    if (!newBoardForm.boardName.trim()) {
      alert("Please enter Board Name!");
      setBoardWizardStep(1);
      return;
    }
    setIsSavingTimetable(true);
    try {
      const nowIso = new Date().toISOString();
      const cleanClasses: Record<string, OfficialTimetableEntry[]> = {};
      for (let i = 1; i <= 12; i++) {
        const cls = `Class ${i}`;
        const plainNum = String(i);
        const entries = wizardClasses[cls] || wizardClasses[plainNum] || [];
        cleanClasses[cls] = entries;
        cleanClasses[plainNum] = entries;
      }
      if (cleanClasses["Class 11"]) cleanClasses["+1"] = cleanClasses["Class 11"];
      if (cleanClasses["Class 12"]) cleanClasses["+2"] = cleanClasses["Class 12"];

      const newBoard: OfficialBoardTimetable = {
        id: "board_" + Date.now(),
        boardName: newBoardForm.boardName.trim(),
        boardNameMl: (newBoardForm.boardNameMl || newBoardForm.boardName).trim(),
        academicYear: newBoardForm.academicYear || "2025-2026",
        term: newBoardForm.term || "quarterly",
        termMl: newBoardForm.termMl || (EXAM_TERMS.find(t => t.id === newBoardForm.term)?.shortMl || "പാദവാർഷികം"),
        category: newBoardForm.category || "general",
        categoryMl: newBoardForm.category === "school" ? "സ്കൂൾ മദ്റസ" : "ജനറൽ മദ്റസ",
        description: newBoardForm.description || "Official Exam Schedule",
        isDefault: true,
        isVerified: newBoardForm.isVerified,
        source: newBoardForm.source,
        publishedAt: nowIso,
        lastUpdated: nowIso,
        updatedBy: "Super Admin",
        classes: cleanClasses
      };

      const res = await fetch("/api/official-timetables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBoard)
      });
      const data = await res.json();
      const createdBoard = data.success && data.timetable ? data.timetable : newBoard;

      await syncBoardTimetableToSystem(createdBoard, [...timetables, createdBoard], true, true);
      setActiveBoardId(createdBoard.id);
      setIsCreatingBoard(false);
      setBoardWizardStep(1);
      setTimetableFeedback(`✅ "${createdBoard.boardNameMl || createdBoard.boardName}" ടൈംടേബിൾ വിജയകരമായി സേവ് ചെയ്ത് യൂസർമാർക്കായി പബ്ലിഷ് ചെയ്തു!`);
      setTimeout(() => setTimetableFeedback(null), 5000);
    } catch (err: any) {
      alert("Error publishing timetable: " + err.message);
    } finally {
      setIsSavingTimetable(false);
    }
  };

  // Master Subject Directory Management Handlers
  const handleAddSubjectToDirectory = (classKey: string) => {
    if (!dirNewSubjectForm.nameMl.trim()) {
      alert("വിഷയത്തിന്റെ മലയാളം പേര് നൽകുക (Malayalam Name is required)!");
      return;
    }
    const currentList = masterDir[classKey] || [];
    const newId = `${classKey.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
    const newSubject: SubjectItem = {
      id: newId,
      nameMl: dirNewSubjectForm.nameMl.trim(),
      nameEn: dirNewSubjectForm.nameEn.trim() || dirNewSubjectForm.nameMl.trim(),
      category: dirNewSubjectForm.category,
      defaultOrder: currentList.length + 1,
      isCustom: true
    };
    const plainNum = classKey.replace(/\D/g, "");
    const updated = {
      ...masterDir,
      [classKey]: [...currentList, newSubject],
      ...(plainNum ? { [plainNum]: [...currentList, newSubject] } : {}),
      ...(plainNum === "11" ? { "+1": [...currentList, newSubject] } : {}),
      ...(plainNum === "12" ? { "+2": [...currentList, newSubject] } : {})
    };
    setMasterDir(updated);
    saveMasterSubjectsDirectory(updated);
    setIsAddingSubjectToDir(false);
    setDirNewSubjectForm({ nameMl: "", nameEn: "", category: "fiqh" });
    setTimetableFeedback(`✓ "${newSubject.nameMl}" വിജയകരമായി ${classKey} സിലബസ് ഡയറക്ടറിയിൽ ചേർത്തു!`);
    setTimeout(() => setTimetableFeedback(null), 4000);
  };

  const handleMoveSubjectInDirectory = (classKey: string, index: number, direction: "up" | "down") => {
    const currentList = [...(masterDir[classKey] || [])];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentList.length) return;
    const temp = currentList[index];
    currentList[index] = currentList[targetIdx];
    currentList[targetIdx] = temp;
    const reordered = currentList.map((item, idx) => ({
      ...item,
      defaultOrder: idx + 1
    }));
    const plainNum = classKey.replace(/\D/g, "");
    const updated: Record<string, SubjectItem[]> = {
      ...masterDir,
      [classKey]: reordered,
      ...(plainNum ? { [plainNum]: reordered } : {}),
      ...(plainNum === "11" ? { "+1": reordered } : {}),
      ...(plainNum === "12" ? { "+2": reordered } : {})
    };
    setMasterDir(updated);
    saveMasterSubjectsDirectory(updated);
    setTimetableFeedback(`✓ "${temp.nameMl}" (${classKey}) സ്ഥാനം Day ${targetIdx + 1}-ലേക്ക് മാറ്റി!`);
    setTimeout(() => setTimetableFeedback(null), 3500);
  };

  const handleRemoveSubjectFromDirectory = (classKey: string, subjectId: string) => {
    const currentList = masterDir[classKey] || [];
    const item = currentList.find(s => s.id === subjectId);
    if (!item) return;
    const updatedList = currentList
      .filter(s => s.id !== subjectId)
      .map((s, idx) => ({ ...s, defaultOrder: idx + 1 }));
    const plainNum = classKey.replace(/\D/g, "");
    const updated: Record<string, SubjectItem[]> = {
      ...masterDir,
      [classKey]: updatedList,
      ...(plainNum ? { [plainNum]: updatedList } : {}),
      ...(plainNum === "11" ? { "+1": updatedList } : {}),
      ...(plainNum === "12" ? { "+2": updatedList } : {})
    };
    setMasterDir(updated);
    saveMasterSubjectsDirectory(updated);
    setTimetableFeedback(`🗑️ "${item.nameMl}" ${classKey} സിലബസ് ഡയറക്ടറിയിൽ നിന്ന് ഒഴിവാക്കി.`);
    setTimeout(() => setTimetableFeedback(null), 4000);
  };

  const handleResetDirectoryToDefault = () => {
    if (confirm("സിലബസ് ഡയറക്ടറി സമസ്ത SKJMCC / SKIMVB ഒറിജിനൽ മാനദണ്ഡങ്ങളിലേക്ക് റീസെറ്റ് ചെയ്യണോ? നിങ്ങളുടെ കസ്റ്റം വിഷയങ്ങൾ ഒഴിവാക്കപ്പെടും.")) {
      resetMasterSubjectsDirectory();
      const fresh = getMasterSubjectsDirectory();
      setMasterDir(fresh);
      setTimetableFeedback("✓ സമസ്തയുടെ ഔദ്യോഗിക സിലബസ് ഡയറക്ടറി വിജയകരമായി പുനഃസ്ഥാപിച്ചു!");
      setTimeout(() => setTimetableFeedback(null), 4000);
    }
  };

  const handleUpdateSubjectInDirectory = (classKey: string, updatedSub: SubjectItem) => {
    if (!updatedSub.nameMl.trim()) {
      alert("വിഷയത്തിന്റെ മലയാളം പേര് നൽകുക (Malayalam Name is required)!");
      return;
    }
    const currentList = masterDir[classKey] || [];
    const updatedList = currentList.map(s => s.id === updatedSub.id ? updatedSub : s);
    const updated = {
      ...masterDir,
      [classKey]: updatedList
    };
    setMasterDir(updated);
    saveMasterSubjectsDirectory(updated);
    setEditingSubject(null);
    setTimetableFeedback(`✓ "${updatedSub.nameMl}" (${classKey}) സിലബസ് വിവരങ്ങൾ വിജയകരമായി പുതുക്കി!`);
    setTimeout(() => setTimetableFeedback(null), 4000);
  };

  const [isSavingDirectory, setIsSavingDirectory] = useState(false);
  const handleSaveDirectoryToCloud = async () => {
    setIsSavingDirectory(true);
    try {
      saveMasterSubjectsDirectory(masterDir, true);
      await fetch("/api/subject-directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory: masterDir })
      });
      try {
        await setDoc(doc(db, "system_settings", "subject_directory"), {
          directory: masterDir,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {}

      setTimetableFeedback("✅ സിലബസ് ഡയറക്ടറി ക്ലൗഡിലും സെർവറിലും സുരക്ഷിതമായി സേവ് ചെയ്തു! റീലോഡ് ചെയ്താലും മാറ്റങ്ങൾ നിലനിൽക്കും.");
      setTimeout(() => setTimetableFeedback(null), 5000);
    } catch (err: any) {
      alert("Error saving subject directory to cloud: " + err.message);
    } finally {
      setIsSavingDirectory(false);
    }
  };

  const handleResetWorkspace = () => {
    if (confirm("എല്ലാ ലോക്കൽ ടൈംടേബിൾ ഷെഡ്യൂളുകളും ക്ലിയർ ചെയ്യണോ?")) {
      localStorage.removeItem("madrasa_exam_timetable");
      window.location.reload();
    }
  };

  const handleDeleteAllBoards = async () => {
    if (!confirm("എല്ലാ ഔദ്യോഗിക ടൈംടേബിളുകളും സ്ഥിരമായി ഒഴിവാക്കണോ?")) return;
    try {
      for (const board of timetables) {
        await fetch(`/api/official-timetables/${board.id}`, { method: "DELETE" });
      }
      setTimetables([]);
      setTimetableFeedback("✓ എല്ലാ ടൈംടേബിളുകളും വിജയകരമായി ഒഴിവാക്കി!");
      setTimeout(() => setTimetableFeedback(null), 4000);
    } catch (e) {
      console.error(e);
      alert("Error deleting boards");
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    const b = timetables.find(t => t.id === boardId);
    if (!b) return;
    if (!confirm(`"${b.boardName}" എന്ന ബോർഡ് ടൈംടേബിൾ സ്ഥിരമായി ഒഴിവാക്കണോ (Delete)?\nഈ പ്രവർത്തനം തിരിച്ചെടുക്കാൻ കഴിയില്ല.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/official-timetables/${boardId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        const remaining = timetables.filter(t => t.id !== boardId);
        setTimetables(remaining);
        if (activeBoardId === boardId) {
          setActiveBoardId(remaining.length > 0 ? remaining[0].id : "");
        }
        setTimetableFeedback(`✓ "${b.boardName}" ബോർഡ് ടൈംടേബിൾ വിജയകരമായി ഒഴിവാക്കി!`);
        setTimeout(() => setTimetableFeedback(null), 4000);
      } else {
        alert("Failed to delete board timetable: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error deleting board timetable: " + err.message);
    }
  };

  const handleSaveEditedBoardDetails = async () => {
    if (!editingBoardDetails) return;
    if (!editingBoardDetails.boardName.trim()) {
      alert("Board name is required!");
      return;
    }
    try {
      await syncBoardTimetableToSystem(editingBoardDetails, timetables, true);
      setEditingBoardDetails(null);
      setTimetableFeedback(`✓ "${editingBoardDetails.boardName}" ബോർഡ് വിവരങ്ങൾ വിജയകരമായി അപ്ഡേറ്റ് ചെയ്തു!`);
      setTimeout(() => setTimetableFeedback(null), 4000);
    } catch (err: any) {
      alert("Error saving board details: " + err.message);
    }
  };

  // Timetable Backup & Restore Handlers
  const fetchServerSnapshotInfo = async () => {
    try {
      const res = await fetch("/api/official-timetables/backup");
      const data = await res.json();
      if (data.success && data.hasBackup && data.backup) {
        setServerSnapshotInfo({
          hasBackup: true,
          createdAt: data.backup.createdAt,
          totalBoards: data.backup.totalBoards || (data.backup.timetables ? data.backup.timetables.length : 0)
        });
      } else {
        setServerSnapshotInfo({ hasBackup: false });
      }
    } catch (e) {
      setServerSnapshotInfo({ hasBackup: false });
    }
  };

  const handleDownloadTimetablesBackup = async () => {
    setIsBackingUp(true);
    try {
      const nowIso = new Date().toISOString();
      const dateStr = nowIso.slice(0, 10);
      const backupPayload = {
        appName: "Madrasa Seating Engine",
        backupType: "official_timetables_backup",
        version: "1.0",
        createdAt: nowIso,
        createdBy: "Super Admin",
        activeBoardId,
        totalBoards: timetables.length,
        timetables
      };

      // 1. Create server snapshot
      try {
        await fetch("/api/official-timetables/backup", { method: "POST" });
        localStorage.setItem("madrasa_timetables_backup_snapshot", JSON.stringify(backupPayload));
      } catch (e) {}

      // 2. Trigger browser download
      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `madrasa_exam_timetables_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setTimetableFeedback("✓ ഔദ്യോഗിക പരീക്ഷാ ടൈംടേബിൾ ബാക്കപ്പ് ഫയൽ ഡൗൺലോഡ് ചെയ്യുകയും സെർവറിൽ സുരക്ഷിതമായി സൂക്ഷിക്കുകയും ചെയ്തു!");
      setTimeout(() => setTimetableFeedback(null), 5000);
    } catch (err: any) {
      alert("ബാക്കപ്പ് എടുക്കുന്നതിൽ തടസ്സമുണ്ടായി: " + err.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  const ResetTimetableSection = () => (
    <div className="bg-red-950/20 border border-red-500/30 rounded-3xl p-6 space-y-4">
      <h3 className="text-sm font-black text-red-400">⚠️ ഡാറ്റ റിസെറ്റ് (Danger Zone)</h3>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleDeleteAllBoards}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
        >
          എല്ലാ ഔദ്യോഗിക ടൈംടേബിളുകളും ഒഴിവാക്കുക
        </button>
        <button
          onClick={handleResetWorkspace}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer"
        >
          വർക്ക്‌സ്പെയ്സ് എക്സാം ഷെഡ്യൂൾ ക്ലിയർ ചെയ്യുക
        </button>
      </div>
    </div>
  );

  const handleDownloadSingleBoardBackup = (board: OfficialBoardTimetable) => {
    try {
      const nowIso = new Date().toISOString();
      const dateStr = nowIso.slice(0, 10);
      const backupPayload = {
        appName: "Madrasa Seating Engine",
        backupType: "single_board_timetable_backup",
        version: "1.0",
        createdAt: nowIso,
        createdBy: "Super Admin",
        board
      };
      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanName = (board.boardName || "board").toLowerCase().replace(/[^a-z0-9]/g, "_");
      a.download = `${cleanName}_timetable_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setTimetableFeedback(`✓ "${board.boardName}" ടൈംടേബിൾ ബാക്കപ്പ് ഫയലായി ഡൗൺലോഡ് ചെയ്തു!`);
      setTimeout(() => setTimetableFeedback(null), 4000);
    } catch (err: any) {
      alert("ബോർഡ് ബാക്കപ്പ് എടുക്കുന്നതിൽ തടസ്സമുണ്ടായി: " + err.message);
    }
  };

  const handleSelectRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        let list: any[] = [];
        if (Array.isArray(parsed)) {
          list = parsed;
        } else if (parsed && Array.isArray(parsed.timetables)) {
          list = parsed.timetables;
        } else if (parsed && parsed.board && parsed.board.classes) {
          list = [parsed.board];
        } else if (parsed && parsed.boardName && parsed.classes) {
          list = [parsed];
        }

        if (list.length === 0) {
          setRestoreError("തിരഞ്ഞെടുത്ത ഫയലിൽ സാധുവായ ടൈംടേബിളുകൾ കണ്ടെത്താനായില്ല.");
          return;
        }

        setRestorePreviewData({
          source: file.name,
          createdAt: parsed.createdAt || new Date().toISOString(),
          timetables: list,
          totalBoards: list.length
        });
      } catch (err: any) {
        setRestoreError("ഫയൽ വായിക്കാൻ സാധിച്ചില്ല. സാധുവായ JSON ഫയൽ തന്നെയെന്ന് ഉറപ്പാക്കുക: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExecuteRestore = async (useSnapshot: boolean = false) => {
    setIsRestoring(true);
    setRestoreError(null);
    try {
      let payload: any = {};
      if (useSnapshot) {
        payload = { useServerSnapshot: true };
      } else {
        if (!restorePreviewData || !restorePreviewData.timetables) {
          setRestoreError("റീസ്റ്റോർ ചെയ്യാനുള്ള വിവരങ്ങൾ ലഭ്യമല്ല.");
          setIsRestoring(false);
          return;
        }
        payload = { timetables: restorePreviewData.timetables };
      }

      const res = await fetch("/api/official-timetables/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.timetables)) {
        const restoredList: OfficialBoardTimetable[] = data.timetables;
        setTimetables(restoredList);
        if (restoredList.length > 0) {
          const defaultBoard = restoredList.find(b => b.isDefault) || restoredList[0];
          setActiveBoardId(defaultBoard.id);
          syncBoardTimetableToSystem(defaultBoard, restoredList, true, true);
        }

        setIsRestoreModalOpen(false);
        setRestorePreviewData(null);
        setTimetableFeedback(`✓ ${restoredList.length} ബോർഡ് ടൈംടേബിളുകൾ ബാക്കപ്പിൽ നിന്ന് വിജയകരമായി റീസ്റ്റോർ ചെയ്തു!`);
        setTimeout(() => setTimetableFeedback(null), 5000);
      } else {
        setRestoreError(data.error || "റീസ്റ്റോർ പരാജയപ്പെട്ടു.");
      }
    } catch (err: any) {
      setRestoreError("റീസ്റ്റോർ ചെയ്യുമ്പോൾ തടസ്സമുണ്ടായി: " + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  // Save Pricing Config to server and localStorage
  const handleSavePricingConfig = async () => {
    setIsSavingPricing(true);
    setSaveFeedback(null);
    try {
      // 1. Save to LocalStorage
      localStorage.setItem("saas_pricing_config", JSON.stringify(pricingConfig));

      // 2. Save to Server Database
      const res = await fetch("/api/pricing-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pricingConfig)
      });
      const data = await res.json();
      if (data.success) {
        setSaveFeedback("✓ All item prices, descriptions and delivery fees updated successfully for all users!");
        setTimeout(() => setSaveFeedback(null), 4000);
      } else {
        throw new Error(data.error || "Failed to update pricing on server");
      }
    } catch (err: any) {
      setSaveFeedback("Saved locally. (Note: Server sync returned: " + (err.message || err) + ")");
      setTimeout(() => setSaveFeedback(null), 4000);
    } finally {
      setIsSavingPricing(false);
    }
  };

  // Helper to update specific item in pricingConfig
  const handleUpdateItem = (index: number, updates: Partial<PricingItem>) => {
    const newItems = [...pricingConfig.items];
    newItems[index] = { ...newItems[index], ...updates };
    setPricingConfig({ ...pricingConfig, items: newItems });
  };

  // Helper to add a new custom item
  const handleAddNewItem = () => {
    const newItemId = "item_" + Date.now();
    const newItem: PricingItem = {
      id: newItemId,
      name: "New Custom Item",
      nameMl: "പുതിയ കസ്റ്റം ഇനം",
      description: "Detailed description of this material or service",
      descriptionMl: "ഈ ഇനത്തിന്റെ അല്ലെങ്കിൽ സേവനത്തിന്റെ വിശദമായ വിവരണം",
      pricingType: "fixed",
      price: 50,
      unitPrice: 50,
      defaultQtyLabel: "Units",
      enabled: true,
      isMandatory: false,
      icon: "Tag"
    };
    setPricingConfig({
      ...pricingConfig,
      items: [...pricingConfig.items, newItem]
    });
  };

  // Helper to remove an item
  const handleRemoveItem = (index: number) => {
    if (pricingConfig.items.length <= 1) {
      alert("At least one package item is required!");
      return;
    }
    const newItems = pricingConfig.items.filter((_, i) => i !== index);
    setPricingConfig({ ...pricingConfig, items: newItems });
  };

  // Helper to reset pricing to defaults
  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to reset all item prices and descriptions to system defaults?")) {
      setPricingConfig(defaultPricingState);
    }
  };

  const filteredOrders = orders.filter(o => {
    const cleanQuery = searchQuery.trim().toLowerCase();
    const queryDigits = searchQuery.replace(/[^0-9]/g, "");
    const orderPhoneDigits = (o.phone || "").replace(/[^0-9]/g, "");
    const matchesPhone = queryDigits.length >= 3 && orderPhoneDigits.includes(queryDigits);

    const matchesSearch = cleanQuery === "" ||
                          (o.madrasaName || "").toLowerCase().includes(cleanQuery) ||
                          (o.id || "").toLowerCase().includes(cleanQuery) ||
                          (o.phone || "").toLowerCase().includes(cleanQuery) ||
                          matchesPhone ||
                          (o.contactName || "").toLowerCase().includes(cleanQuery) ||
                          (o.partnerName || "").toLowerCase().includes(cleanQuery) ||
                          (o.place || "").toLowerCase().includes(cleanQuery);
    const matchesStatus = statusFilter === "All" || o.status === statusFilter;
    const matchesPartner = partnerFilter === "all" ? true :
                           partnerFilter === "partner" ? !!o.isPartnerOrder : !o.isPartnerOrder;
    return matchesSearch && matchesStatus && matchesPartner;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const pendingOrdersCount = orders.filter(o => o.status === "Pending").length;
  const courieredOrdersCount = orders.filter(o => o.status === "Couriered" || o.status === "Delivered").length;
  const partnerOrdersCount = orders.filter(o => o.isPartnerOrder).length;

  // --- CRM & USER ACTIVITY MARKETING HELPERS ---
  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return "Active recently";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "Active recently";
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSec < 60) return "🟢 Active Just Now";
      if (diffMin < 60) return `🟢 Active ${diffMin}m ago`;
      if (diffHours < 24) return `🟢 Today (${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
      if (diffDays === 1) return `🟡 Yesterday (${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
      if (diffDays < 7) return `🟡 ${diffDays} days ago`;
      return `⚪ ${date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}`;
    } catch (e) {
      return "Active recently";
    }
  };

  const getMarketingMessage = (userName: string) => {
    const cleanName = userName || "ഉസ്താദ്";
    if (marketingTemplate === "custom" && customMarketingMessage.trim()) {
      return customMarketingMessage.replace(/{name}/g, cleanName);
    }
    if (marketingTemplate === "software_launch") {
      return `അസ്സലാമു അലൈകും ${cleanName},\n\nഞങ്ങളുടെ മദ്റസ പരീക്ഷാ സീറ്റിംഗ് സോഫ്റ്റ്‌വെയർ (Seat Manager AI Studio) ഉപയോഗിച്ചതിന് വളരെ നന്ദി.\n\nമദ്റസകൾക്കായുള്ള പുതിയ കംപ്ലീറ്റ് സ്കൂൾ/മദ്റസ മാനേജ്‌മെന്റ് പെയ്ഡ് സോഫ്റ്റ്‌വെയർ & റിസൾട്ട് പബ്ലിഷിംഗ് സ്യൂട്ട് ഉടൻ വരുന്നു. വൻ ഓഫറുകൾക്കും ലൈവ് ഡെമോയ്ക്കുമായി ബന്ധപ്പെടുക.\n\nഹെൽപ്പ് ലൈൻ / WhatsApp: ${systemConfig.adminWhatsAppPhone || "9633465267"}`;
    }
    if (marketingTemplate === "printing_offer") {
      return `അസ്സലാമു അലൈകും ${cleanName},\n\nപരീക്ഷാ ഹാൾ ഡോർ അറ്റൻഡൻസ് ലിസ്റ്റ്, ഡെസ്ക് സ്റ്റിക്കറുകൾ, ഹാൾ ടിക്കറ്റുകൾ എന്നിവ കുറഞ്ഞ നിരക്കിൽ സ്പീഡ് പോസ്റ്റ് വഴി നിങ്ങളുടെ മദ്റസയിലേക്ക് നേരിട്ട് എത്തിക്കുന്നു.\n\nഓർഡർ ചെയ്യാൻ ബന്ധപ്പെടുക: ${systemConfig.adminWhatsAppPhone || "9633465267"}`;
    }
    if (marketingTemplate === "exam_assistance") {
      return `അസ്സലാമു അലൈകും ${cleanName},\n\nവരാനിരിക്കുന്ന പരീക്ഷാ സീറ്റിംഗ് അറേഞ്ച്മെന്റ്, ടൈംടേബിൾ സെറ്റിംഗ് എന്നിവയിൽ എന്തെങ്കിലും സംശയങ്ങളോ സഹായമോ ആവശ്യമുണ്ടെങ്കിൽ ഞങ്ങളെ നേരിട്ട് വാട്സ്ആപ്പിൽ ബന്ധപ്പെടാം.\n\nവാട്സ്ആപ്പ് സപ്പോർട്ട്: ${systemConfig.adminWhatsAppPhone || "9633465267"}`;
    }
    return `അസ്സലാമു അലൈകും ${cleanName}, Seat Manager AI Studio ടീമിൽ നിന്നുള്ള സന്ദേശം.`;
  };

  const handleCopyAllPhones = (filteredList: CRMUser[]) => {
    const phones = filteredList
      .map(u => (u.phone || "").replace(/[^0-9]/g, ""))
      .filter(p => p.length >= 10)
      .map(p => p.startsWith("91") ? p : (p.length === 10 ? `91${p}` : p));
    
    const uniquePhones = Array.from(new Set(phones));
    if (uniquePhones.length === 0) {
      alert("No valid phone numbers found to copy.");
      return;
    }
    const textToCopy = uniquePhones.join(", ");
    navigator.clipboard.writeText(textToCopy);
    setCopyFeedback(`📋 ${uniquePhones.length} വാട്സ്ആപ്പ് നമ്പറുകൾ കോപ്പി ചെയ്തു! (WA Bulk Sender-ൽ പേസ്റ്റ് ചെയ്യാം)`);
    setTimeout(() => setCopyFeedback(null), 4500);
  };

  const handleExportCrmCsv = (filteredList: CRMUser[]) => {
    if (filteredList.length === 0) {
      alert("No user records to export.");
      return;
    }
    const headers = ["ID", "Madrasa Name", "WhatsApp Phone", "Reg No", "Place / District", "Email", "Total Students", "Total Halls", "Last Active At", "Last Action Taken", "Orders Count", "Source"];
    const rows = filteredList.map(u => [
      `"${u.id || ""}"`,
      `"${(u.name || "").replace(/"/g, '""')}"`,
      `"${u.phone || ""}"`,
      `"${u.regNo || ""}"`,
      `"${(u.place || "").replace(/"/g, '""')}"`,
      `"${u.email || ""}"`,
      u.studentCount || 0,
      u.hallCount || 0,
      `"${u.lastActiveAt || ""}"`,
      `"${(u.lastAction || "").replace(/"/g, '""')}"`,
      u.ordersCount || 0,
      `"${u.source || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Madrasa_Users_Marketing_CRM_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter CRM users
  const getFilteredCrmUsers = () => {
    const userMap = new Map<string, CRMUser>();

    // 1. Add tracked CRM users
    (crmUsers || []).forEach(u => {
      const key = (u.phone ? u.phone.replace(/[^0-9]/g, "").slice(-10) : "") || u.id || (u.name || "").toLowerCase();
      userMap.set(key, { ...u });
    });

    // 2. Unify with submissions so portal submissions are never hidden
    (submissions || []).forEach(s => {
      const key = (s.phone ? s.phone.replace(/[^0-9]/g, "").slice(-10) : "") || s.id || (s.name || "").toLowerCase();
      const existing = userMap.get(key);
      if (existing) {
        if (!existing.studentCount && s.students?.length) {
          existing.studentCount = s.students.length;
        }
        if (!existing.regNo && s.regNo) existing.regNo = s.regNo;
        if (!existing.place && s.place) existing.place = s.place;
        if (!existing.email && s.email) existing.email = s.email;
        if ((!existing.students || existing.students.length === 0) && Array.isArray(s.students)) {
          (existing as any).students = s.students;
        }
      } else {
        userMap.set(key, {
          id: s.id,
          name: s.name,
          phone: s.phone,
          regNo: s.regNo || "REG-2026",
          place: s.place || "Kerala",
          email: s.email || "",
          studentCount: s.students?.length || 0,
          hallCount: 0,
          students: s.students || [],
          lastActiveAt: s.updatedAt || s.submittedAt || new Date().toISOString(),
          firstSeenAt: s.submittedAt || new Date().toISOString(),
          lastAction: "Registered Madrasa",
          totalActionsCount: 1,
          ordersCount: 0,
          source: "Portal Submission",
          notes: ""
        } as any);
      }
    });

    let list = Array.from(userMap.values());

    if (crmSearchQuery.trim()) {
      const q = crmSearchQuery.toLowerCase();
      list = list.filter(u => 
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.place && u.place.toLowerCase().includes(q)) ||
        (u.regNo && u.regNo.toLowerCase().includes(q))
      );
    }

    if (crmFilter === "today") {
      const now = new Date();
      list = list.filter(u => {
        if (!u.lastActiveAt) return false;
        const d = new Date(u.lastActiveAt);
        return d.toDateString() === now.toDateString();
      });
    } else if (crmFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      list = list.filter(u => {
        if (!u.lastActiveAt) return false;
        return new Date(u.lastActiveAt) >= weekAgo;
      });
    } else if (crmFilter === "with_orders") {
      list = list.filter(u => u.ordersCount > 0);
    } else if (crmFilter === "large") {
      list = list.filter(u => u.studentCount >= 50);
    } else if (crmFilter === "paid") {
      list = list.filter(u => {
        const lic = licensesMap[u.id] || (u.regNo ? licensesMap[u.regNo] : null) || licensesMap[u.name];
        if (!lic) return false;
        if (lic.status !== "paid") return false;
        if (lic.expiresAt && new Date(lic.expiresAt) < new Date()) return false;
        return true;
      });
    } else if (crmFilter === "trial") {
      list = list.filter(u => {
        const lic = licensesMap[u.id] || (u.regNo ? licensesMap[u.regNo] : null) || licensesMap[u.name];
        return !lic || lic.status === "trial";
      });
    } else if (crmFilter === "expired") {
      list = list.filter(u => {
        const lic = licensesMap[u.id] || (u.regNo ? licensesMap[u.regNo] : null) || licensesMap[u.name];
        if (!lic) return false;
        if (lic.status === "expired") return true;
        if (lic.expiresAt && new Date(lic.expiresAt) < new Date()) return true;
        return false;
      });
    }

    return list;
  };

  const filteredCrmUsersList = getFilteredCrmUsers();

  const handleOpenLicenseModal = (user: CRMUser) => {
    setSelectedUserForLicense(user);
    const existing = licensesMap[user.id] || (user.regNo ? licensesMap[user.regNo] : null) || licensesMap[user.name];
    const activePrice = getActivePackagePrice();

    if (existing) {
      setLicenseStatus(existing.status);
      setLicensePlan(existing.plan || "bundle");
      setLicenseDurationMonths(existing.durationMonths || 12);
      setLicenseAmountPaid(existing.amountPaid ?? activePrice);
      setLicenseExpiresAt(existing.expiresAt && !isNaN(new Date(existing.expiresAt).getTime()) ? existing.expiresAt.split("T")[0] : "");
      setLicenseNotes(existing.notes || "");
    } else {
      setLicenseStatus("paid");
      setLicensePlan("bundle");
      setLicenseDurationMonths(12);
      setLicenseAmountPaid(activePrice);
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      setLicenseExpiresAt(d.toISOString().split("T")[0]);
      setLicenseNotes("");
    }
  };

  const handleSaveLicense = () => {
    if (!selectedUserForLicense) return;
    const key = selectedUserForLicense.id || selectedUserForLicense.regNo || selectedUserForLicense.name;
    const cleanPhone = (selectedUserForLicense.phone || "").replace(/\D/g, "");
    const p10 = cleanPhone.slice(-10);

    let safeExpiresAt: string;
    try {
      if (licenseExpiresAt && !isNaN(new Date(licenseExpiresAt).getTime())) {
        safeExpiresAt = new Date(licenseExpiresAt).toISOString();
      } else {
        safeExpiresAt = new Date(Date.now() + (licenseDurationMonths || 12) * 30 * 24 * 3600 * 1000).toISOString();
      }
    } catch (e) {
      safeExpiresAt = new Date(Date.now() + (licenseDurationMonths || 12) * 30 * 24 * 3600 * 1000).toISOString();
    }

    const newLic: MadrasaLicense = {
      madrasaId: key,
      madrasaName: selectedUserForLicense.name,
      phone: selectedUserForLicense.phone,
      regNo: selectedUserForLicense.regNo,
      status: licenseStatus,
      plan: licensePlan,
      durationMonths: licenseDurationMonths,
      amountPaid: licenseAmountPaid,
      activatedAt: new Date().toISOString(),
      expiresAt: safeExpiresAt,
      activatedBy: "Super Admin",
      notes: licenseNotes
    };

    const updated = {
      ...licensesMap,
      [key]: newLic,
      ...(selectedUserForLicense.regNo ? { [selectedUserForLicense.regNo]: newLic } : {}),
      ...(selectedUserForLicense.name ? { [selectedUserForLicense.name]: newLic } : {}),
      ...(cleanPhone ? { [cleanPhone]: newLic } : {}),
      ...(p10 && p10.length === 10 ? { [p10]: newLic, [`91${p10}`]: newLic } : {})
    };

    setLicensesMap(updated);
    try {
      localStorage.setItem("madrasa_licenses_map", JSON.stringify(updated));
      fetch("/api/licenses", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Email": "superadmin@meladportal.com"
        },
        body: JSON.stringify(newLic)
      }).catch(() => {});
    } catch (e) {}

    setLicenseFeedback(`✅ ${selectedUserForLicense.name} ലൈസൻസ് അപ്ഡേറ്റ് ചെയ്തു (${licenseStatus === "paid" ? "Paid Active" : licenseStatus})!`);
    setTimeout(() => {
      setLicenseFeedback(null);
      setSelectedUserForLicense(null);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* SUPERADMIN TOP BAR */}
      <div className="bg-slate-900/90 border border-purple-500/30 rounded-3xl p-5 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/40">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 font-mono">
                SuperAdmin License Control
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              SuperAdmin License Activation & Madrasa Portal
            </h1>
            <p className="text-xs text-slate-400">
              Manage Madrasa License Activations, Account Approvals, Expiration & Direct WhatsApp Activation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={fetchAdminData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={onSwitchToUserMode}
            className="flex-1 md:flex-none px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Switch to Madrasa App Workspace</span>
          </button>
        </div>
      </div>

      {/* METRIC HIGHLIGHT STATS - LICENSE ACTIVATION & CRM FOCUS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Registered Madrasas</span>
            <Building className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{crmUsers.length}</div>
          <span className="text-[10px] text-purple-300 font-semibold">{filteredCrmUsersList.length} active in list</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Paid Active Licenses</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {crmUsers.filter(u => {
              const key = u.id || u.regNo || u.name;
              const lic = licensesMap[key] || (u.regNo ? licensesMap[u.regNo] : null) || licensesMap[u.name];
              return lic && lic.status === "paid" && (!lic.expiresAt || new Date(lic.expiresAt) > new Date());
            }).length}
          </div>
          <span className="text-[10px] text-emerald-300">1-Year Print Pass Active</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Free Trial Madrasas</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {crmUsers.filter(u => {
              const key = u.id || u.regNo || u.name;
              const lic = licensesMap[key] || (u.regNo ? licensesMap[u.regNo] : null) || licensesMap[u.name];
              return !lic || lic.status === "trial";
            }).length}
          </div>
          <span className="text-[10px] text-amber-300">Awaiting Activation</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>License Control System</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400 font-mono">Active</div>
          <span className="text-[10px] text-indigo-300">Instant WhatsApp & Admin Sync</span>
        </div>
      </div>

      {/* SUPERADMIN TAB NAVIGATION BAR */}
      <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl flex flex-wrap items-center gap-1.5 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab("madrasas")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "madrasas"
              ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>മദ്റസ ലൈസൻസുകൾ (Licenses)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-200 font-mono">
            {crmUsers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("timetables")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "timetables"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>ബോർഡ് ടൈംടേബിൾ (Timetables)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-200 font-mono">
            {timetables.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "orders"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>കൊറിയർ ഓർഡറുകൾ (Orders)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-200 font-mono">
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("commercial")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "commercial"
              ? "bg-amber-600 text-white shadow-md shadow-amber-900/40"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>പാക്കേജ് നിരക്കുകൾ (Pricing)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("system_settings")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "system_settings"
              ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>സിസ്റ്റം ക്രമീകരണങ്ങൾ (Settings)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "analytics"
              ? "bg-cyan-600 text-white shadow-md shadow-cyan-900/40"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>ആക്റ്റിവിറ്റി CRM</span>
        </button>
      </div>

      {/* CONTENT AREA BASED ON TAB */}
      <div className="space-y-4">
        
        {/* TAB 1: COURIER & PRINT ORDERS */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            
            {/* SEARCH AND FILTER BAR */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="🔍 Search WhatsApp Number (e.g. 9847123456), Madrasa, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status & Partner Source filters */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <span className="text-[11px] text-slate-400 font-bold px-1.5">Source:</span>
                  <button
                    onClick={() => setPartnerFilter("all")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      partnerFilter === "all" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All ({orders.length})
                  </button>
                  <button
                    onClick={() => setPartnerFilter("partner")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                      partnerFilter === "partner" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>🤝 Partner ({orders.filter(o => o.isPartnerOrder).length})</span>
                  </button>
                  <button
                    onClick={() => setPartnerFilter("direct")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      partnerFilter === "direct" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Direct ({orders.filter(o => !o.isPartnerOrder).length})
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
                  <span className="text-[11px] text-slate-400 font-bold px-1.5">Status:</span>
                  {["All", "Pending", "Confirmed", "Printing", "Couriered", "Delivered", "Rejected"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                        statusFilter === st
                          ? "bg-purple-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {st === "Confirmed" ? "✓ Confirmed" : st === "Rejected" ? "✕ Rejected" : st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ORDERS TABLE */}
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-2">
                <Package className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-400">No print orders match your filter criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredOrders.map((order) => {
                  const isPartner = order.isPartnerOrder;
                  const partnerProfit = order.partnerProfit || 0;
                  const retailAmount = order.clientRetailPrice || order.totalAmount;
                  const wholesaleAmount = order.totalAmount;

                  return (
                    <div
                      key={order.id}
                      className={`bg-slate-900/90 border rounded-2xl p-5 transition space-y-4 shadow-lg ${
                        isPartner ? "border-indigo-500/40 hover:border-indigo-400" : "border-slate-800 hover:border-purple-500/40"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-extrabold text-sm text-purple-400">{order.id}</span>
                            
                            {isPartner ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 font-mono">
                                <span>🤝 Freelance Partner Order</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                                Direct Madrasa
                              </span>
                            )}

                            {order.verificationProof?.isVerified && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-mono">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Digital Proof Verified</span>
                              </span>
                            )}

                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                              order.status === "Confirmed" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" :
                              order.status === "Pending" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                              order.status === "Printing" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
                              order.status === "Couriered" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" :
                              order.status === "Rejected" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" :
                              "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}>
                              {order.status === "Confirmed" && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                              {order.status === "Rejected" && <XCircle className="w-3 h-3 text-rose-400" />}
                              <span>{order.status === "Confirmed" ? "Confirmed" : order.status === "Rejected" ? "Rejected / Duplicate" : order.status}</span>
                            </span>
                            {order.rejectionReason && (
                              <span className="text-[10px] text-rose-400 font-semibold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
                                Reason: {order.rejectionReason}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-500 font-mono">
                              {new Date(order.orderedAt).toLocaleString()}
                            </span>
                          </div>

                          <h3 className="font-extrabold text-base text-white pt-1 flex items-center gap-2">
                            <span>{order.madrasaName}</span>
                            {order.regNo && <span className="text-xs text-purple-400 font-mono">({order.regNo})</span>}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {order.place} • {order.contactName} ({order.phone})
                          </p>

                          {isPartner && order.partnerName && (
                            <div className="mt-1.5 inline-flex items-center gap-2 px-2.5 py-1 bg-indigo-950/60 rounded-lg border border-indigo-800/40 text-[11px] text-indigo-200">
                              <span className="font-bold">Prepared by Partner:</span>
                              <span className="font-semibold text-white">{order.partnerName}</span>
                              {order.partnerPhone && (
                                <span className="font-mono text-indigo-300">({order.partnerPhone})</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-right bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">
                              {isPartner ? "Wholesale Admin Bill" : "Total Bill"}
                            </div>
                            <div className="text-lg font-black text-emerald-400 font-mono">
                              ₹{wholesaleAmount}
                            </div>
                            {isPartner && (
                              <div className="text-[10px] text-indigo-300 font-semibold">
                                Retail: ₹{retailAmount} | <span className="text-emerald-400 font-bold">Partner Profit: ₹{partnerProfit}</span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleOpenEditModal(order, "order")}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Edit Order Info"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {onImportMadrasaToWorkspace && (
                            <button
                              onClick={() => {
                                onImportMadrasaToWorkspace({
                                  name: order.madrasaName,
                                  regNo: order.regNo,
                                  place: order.place,
                                  phone: order.phone,
                                  contactName: order.contactName,
                                  address: order.address,
                                  notes: order.notes,
                                  students: order.students,
                                  halls: order.halls,
                                  orderInfo: order
                                }, true);
                                onSwitchToUserMode();
                              }}
                              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-purple-950/40 cursor-pointer"
                              title="1-Click Consolidated PDF / Print all client ordered documents with Page 1 Order Routing Slip"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>🖨️ 1-Click Order Print</span>
                            </button>
                          )}

                          <a
                            href={`https://wa.me/${(order.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `Assalamu Alaikum ${order.contactName},\nRegarding your print order ${order.id} for ${order.madrasaName}:\nStatus: ${order.status}${order.trackingNo ? `\nTracking No: ${order.trackingNo} (${order.courierPartner || "Speed Post"})` : ""}\nThank you!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>

                      {/* ITEMS ORDERED BREAKDOWN */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Ordered Package Items</span>
                          {order.items && order.items.map((it: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-slate-300">
                              <div>
                                <span>• {it.name}</span>{" "}
                                <span className="text-slate-500 text-[11px]">({it.qty})</span>
                                {it.description && (
                                  <p className="text-3xs text-slate-500 pl-2">{it.description}</p>
                                )}
                              </div>
                              <span className="font-mono font-bold text-white">₹{it.price}</span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800 text-[11px]">
                            <span>Courier & Speed Post</span>
                            <span className="font-mono">₹{order.courierFee}</span>
                          </div>
                        </div>

                        <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                            {order.deliveryMethod === "partner_direct" ? "Delivery: Handover by Partner" : "Delivery: Direct Courier / Speed Post"}
                          </span>
                          <div className="text-slate-300">
                            <strong>Recipient:</strong> {order.contactName} ({order.phone})
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            <strong>Address:</strong> {order.address || "Local Pickup / Handover"}
                          </div>
                          {order.notes && (
                            <div className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-800/30">
                              <strong>Notes:</strong> {order.notes}
                            </div>
                          )}

                          {order.verificationProof && (
                            <div className="text-[10px] text-emerald-300 bg-emerald-950/50 p-2 rounded-lg border border-emerald-800/50 font-mono space-y-0.5">
                              <div className="font-bold flex items-center gap-1 text-emerald-200">
                                <span>🖨️ Workshop Print Job Specs:</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-slate-300">
                                <span>• Desk Sticker Sheets: <strong>{order.verificationProof.stickerSheetsCount || "Auto"} A4 Glossy</strong></span>
                                <span>• Door Sheets: <strong>{order.verificationProof.doorSheetsCount || "Auto"} Sheets</strong></span>
                                <span>• Hall Tickets: <strong>{order.verificationProof.hallTicketsCount || "Auto"} Copies</strong></span>
                                <span>• Duty Registers: <strong>{order.verificationProof.masterAttendanceSheetsCount || "Auto"} Sheets</strong></span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* STATUS WORKFLOW BUTTONS */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-400 font-bold">Fulfillment Action:</span>
                          
                          {/* ACCEPT / CONFIRM BUTTON */}
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, "Confirmed")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                              order.status === "Confirmed"
                                ? "bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-md shadow-emerald-950/50"
                                : "bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/60"
                            }`}
                            title="Accept and confirm this order"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accept / Confirm</span>
                          </button>

                          {/* REJECT / DUPLICATE BUTTON */}
                          <button
                            onClick={() => {
                              const reason = prompt("Enter reason for rejection or duplicate flag (e.g. Duplicate order, Cancelled by client):", order.rejectionReason || "Duplicate Order");
                              if (reason !== null) {
                                handleUpdateOrderStatus(order.id, "Rejected", undefined, undefined, reason);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                              order.status === "Rejected"
                                ? "bg-rose-600 text-white ring-2 ring-rose-400 shadow-md shadow-rose-950/50"
                                : "bg-rose-950/80 hover:bg-rose-800 text-rose-300 border border-rose-700/60"
                            }`}
                            title="Reject or mark as duplicate order to prevent double printing"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject / Duplicate</span>
                          </button>

                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, "Printing")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              order.status === "Printing" ? "bg-blue-600 text-white ring-1 ring-blue-400" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            Printing / Ready
                          </button>
                          <button
                            onClick={() => {
                              const tracking = prompt("Enter Speed Post / DTDC Tracking Number:", order.trackingNo || "");
                              if (tracking !== null) {
                                handleUpdateOrderStatus(order.id, "Couriered", tracking, "Speed Post / DTDC");
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              order.status === "Couriered" ? "bg-purple-600 text-white ring-1 ring-purple-400" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            Dispatched / Couriered
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, "Delivered")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              order.status === "Delivered" ? "bg-teal-600 text-white ring-1 ring-teal-400" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            Delivered
                          </button>
                        </div>

                        {order.trackingNo && (
                          <div className="text-xs font-mono text-sky-400 bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-800/50 flex items-center gap-1.5">
                            <span>📦</span>
                            <span>Tracking: {order.trackingNo} ({order.courierPartner || "Speed Post"})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* TAB: OFFICIAL BOARD TIMETABLES */}
        {activeTab === "timetables" && (
          <div className="space-y-6">
            {/* TIMETABLE HEADER BANNER */}
            <div className="bg-gradient-to-r from-sky-900/60 via-slate-900 to-indigo-900/60 border border-sky-500/30 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-3xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                    CENTRAL EXAMINATION BOARD TIMETABLE ENGINE
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-3xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Official Cloud Repository
                  </span>
                </div>
                <h3 className="font-black text-xl text-white pt-1 flex items-center gap-2">
                  <span>📅 Official Board Exam Timetable Management</span>
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl pt-1">
                  Configure official board exam schedules by class and academic year (Samastha SKIMVB, KJM Kerala, General). Madrasas and freelance partners can import this central timetable on demand without overriding their custom local edits.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                {/* BACKUP BUTTON */}
                <button
                  type="button"
                  onClick={handleDownloadTimetablesBackup}
                  disabled={isBackingUp || timetables.length === 0}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-300 font-bold rounded-xl text-xs border border-emerald-500/40 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                  title="ടൈംടേബിൾ ബാക്കപ്പ് ഫയലായി ഡൗൺലോഡ് ചെയ്യുക & സെർവറിൽ സുരക്ഷിതമാക്കുക"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>{isBackingUp ? "ബാക്കപ്പ് എടുക്കുന്നു..." : "ബാക്കപ്പ് (Backup)"}</span>
                </button>

                {/* RESTORE BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    setRestorePreviewData(null);
                    setRestoreError(null);
                    fetchServerSnapshotInfo();
                    setIsRestoreModalOpen(true);
                  }}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 font-bold rounded-xl text-xs border border-amber-500/40 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="ബാക്കപ്പ് ഫയലിൽ നിന്നോ സെർവറിൽ നിന്നോ ടൈംടേബിൾ റീസ്റ്റോർ ചെയ്യുക"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>റീസ്റ്റോർ (Restore)</span>
                </button>
                <ResetTimetableSection />

                <button
                  onClick={handleOpenBoardWizard}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold rounded-xl text-xs border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New Board</span>
                </button>

                <button
                  onClick={handleSaveBoardTimetable}
                  disabled={isSavingTimetable || !currentBoard}
                  className="flex-1 md:flex-none px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingTimetable ? "Publishing..." : "Save & Publish"}</span>
                </button>
              </div>
            </div>

            {/* TIMETABLE FEEDBACK NOTIFICATION */}
            {timetableFeedback && (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-xs text-emerald-200 font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{timetableFeedback}</span>
              </div>
            )}

            {/* SUB-NAVIGATION TABS: BOARD TIMETABLES vs MASTER SUBJECT DIRECTORY */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl w-fit shadow-md">
              <button
                type="button"
                onClick={() => setTimetableSubTab("timetables")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                  timetableSubTab === "timetables"
                    ? "bg-sky-600 text-white shadow-md shadow-sky-900/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>📅 ഔദ്യോഗിക പരീക്ഷാ ടൈംടേബിൾ (Board Timetables)</span>
              </button>

              <button
                type="button"
                onClick={() => setTimetableSubTab("directory")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                  timetableSubTab === "directory"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>📚 ക്ലാസ്-വൈസ് സിലബസ് ഡയറക്ടറി (Class Subject Directory)</span>
              </button>
            </div>

            {/* VIEW 1: TIMETABLES SUB-TAB */}
            {timetableSubTab === "timetables" && (
              <div className="space-y-6">
                {/* 3-STEP PROGRESSIVE BOARD CREATION WIZARD */}
                {isCreatingBoard && (
                  <div className="bg-slate-900 border-2 border-sky-500/50 rounded-3xl p-5 sm:p-6 space-y-6 shadow-2xl animate-in fade-in duration-200">
                    {/* WIZARD HEADER & PROGRESS INDICATOR */}
                    <div className="border-b border-slate-800 pb-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/40 font-black text-sm">
                            {boardWizardStep}/3
                          </div>
                          <div>
                            <h4 className="font-black text-base sm:text-lg text-white flex items-center gap-2">
                              <span>ഔദ്യോഗിക ബോർഡ് ടൈംടേബിൾ വിസാർഡ്</span>
                              <span className="text-3xs uppercase px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30 font-mono">
                                Step-by-Step Wizard
                              </span>
                            </h4>
                            <p className="text-xs text-slate-400">
                              ഘട്ടം 1: വിവരങ്ങൾ ➔ ഘട്ടം 2: ക്ലാസ് വിഷയങ്ങൾ ➔ ഘട്ടം 3: പരീക്ഷാ ടൈംടേബിൾ
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsCreatingBoard(false)}
                          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* STEP BUTTONS / PROGRESS TABS */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setBoardWizardStep(1)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                            boardWizardStep === 1
                              ? "bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-950/50"
                              : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200"
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-black/30 flex items-center justify-center text-3xs font-mono">1</span>
                          <span className="truncate">📋 ബോർഡ് വിവരങ്ങൾ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleWizardProceedToStep2()}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                            boardWizardStep === 2
                              ? "bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-950/50"
                              : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200"
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-black/30 flex items-center justify-center text-3xs font-mono">2</span>
                          <span className="truncate">📚 ക്ലാസ് വിഷയങ്ങൾ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleWizardProceedToStep3()}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                            boardWizardStep === 3
                              ? "bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/50"
                              : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200"
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-black/30 flex items-center justify-center text-3xs font-mono">3</span>
                          <span className="truncate">📅 പരീക്ഷാ ഷെഡ്യൂൾ</span>
                        </button>
                      </div>
                    </div>

                    {/* STEP 1: BOARD INFO & EXAM CALENDAR SETTINGS */}
                    {boardWizardStep === 1 && (
                      <form onSubmit={handleWizardProceedToStep2} className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">
                              ബോർഡ് നാമം ഇംഗ്ലീഷിൽ (Board Name - English) <span className="text-red-400">*</span>:
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="ഉദാ: Samastha Central Board അല്ലെങ്കിൽ KJM Examination Board"
                              value={newBoardForm.boardName}
                              onChange={(e) => setNewBoardForm({ ...newBoardForm, boardName: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white font-semibold outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 font-bold mb-1">
                              ബോർഡ് നാമം മലയാളത്തിൽ (Malayalam Title):
                            </label>
                            <input
                              type="text"
                              placeholder="ഉദാ: സമസ്ത കേരള ഇസ്‌ലാം മത വിദ്യാഭ്യാസ ബോർഡ്"
                              value={newBoardForm.boardNameMl}
                              onChange={(e) => setNewBoardForm({ ...newBoardForm, boardNameMl: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white font-semibold outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 font-bold mb-1">അധ്യയന വർഷം (Academic Year):</label>
                            <input
                              type="text"
                              placeholder="2025-2026"
                              value={newBoardForm.academicYear}
                              onChange={(e) => setNewBoardForm({ ...newBoardForm, academicYear: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white font-mono outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 font-bold mb-1">പരീക്ഷാ ടേം (Exam Term):</label>
                            <select
                              value={newBoardForm.term}
                              onChange={(e) => {
                                const termVal = e.target.value as ExamTermType;
                                const termObj = EXAM_TERMS.find(t => t.id === termVal);
                                setNewBoardForm({
                                  ...newBoardForm,
                                  term: termVal,
                                  termMl: termObj ? termObj.shortMl : "പാദവാർഷികം"
                                });
                              }}
                              className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white outline-none focus:ring-2 focus:ring-sky-500"
                            >
                              {EXAM_TERMS.map(term => (
                                <option key={term.id} value={term.id}>{term.labelMl}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-300 font-bold mb-1">മദ്റസ വിഭാഗം (Category):</label>
                            <select
                              value={newBoardForm.category}
                              onChange={(e) => setNewBoardForm({ ...newBoardForm, category: e.target.value as "general" | "school" })}
                              className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white outline-none focus:ring-2 focus:ring-sky-500"
                            >
                              <option value="general">ജനറൽ മദ്റസ (Morning / Evening Madrasa)</option>
                              <option value="school">സ്കൂൾ മദ്റസ (School-integrated Madrasa)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-300 font-bold mb-1">ഡിഫോൾട്ട് പരീക്ഷാ സമയം (Default Timing):</label>
                            <input
                              type="text"
                              value={wizardTimingToAll}
                              onChange={(e) => setWizardTimingToAll(e.target.value)}
                              placeholder="06:30 AM - 08:30 AM"
                              className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white font-mono outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>
                        </div>

                        {/* EXAM CALENDAR START DATE & SKIP FRIDAY */}
                        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">
                              പരീക്ഷാ ആരംഭ തീയതി (Exam Start Date):
                            </label>
                            <input
                              type="date"
                              value={wizardStartDate}
                              onChange={(e) => setWizardStartDate(e.target.value)}
                              style={{ colorScheme: "dark" }}
                              className="w-full bg-slate-900 border border-slate-700 p-2 rounded-xl text-sky-300 font-bold outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                            />
                            <p className="text-3xs text-slate-400 pt-1">
                              തുടർച്ചയായ പരീക്ഷാ ദിവസങ്ങൾ കണക്കാക്കാൻ ഈ തീയതി ഉപയോഗിക്കും.
                            </p>
                          </div>

                          <div className="pt-2 sm:pt-0">
                            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-900/80 p-3 rounded-xl border border-slate-800 hover:border-slate-700">
                              <input
                                type="checkbox"
                                checked={wizardSkipFriday}
                                onChange={(e) => setWizardSkipFriday(e.target.checked)}
                                className="w-4 h-4 rounded text-sky-500 focus:ring-0 cursor-pointer"
                              />
                              <div>
                                <span className="font-bold text-slate-200 block">വെള്ളിയാഴ്ച ഒഴിവാക്കുക (Skip Friday)</span>
                                <span className="text-3xs text-slate-400">വെള്ളിയാഴ്ചകളിൽ പരീക്ഷ ഒഴിവാക്കി അടുത്ത ദിവസത്തേക്ക് മാറ്റും</span>
                              </div>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-300 font-bold mb-1">വിവരണം / കുറിപ്പുകൾ (Description / Notes):</label>
                          <input
                            type="text"
                            placeholder="ഉദാ: 2025-2026 വർഷത്തെ കേന്ദ്രീകൃത പൊതുപരീക്ഷാ ടൈംടേബിൾ"
                            value={newBoardForm.description}
                            onChange={(e) => setNewBoardForm({ ...newBoardForm, description: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => setIsCreatingBoard(false)}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition cursor-pointer"
                          >
                            റദ്ദാക്കുക (Cancel)
                          </button>

                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-sky-950/50 cursor-pointer"
                          >
                            <span>അടുത്തത്: ക്ലാസ് വിഷയങ്ങൾ (Step 2)</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    )}

                    {/* STEP 2: CLASS SUBJECTS DIRECTORY BUILDER */}
                    {boardWizardStep === 2 && (
                      <div className="space-y-4 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-950/30 border border-purple-500/30 p-3.5 rounded-2xl">
                          <div>
                            <h5 className="font-extrabold text-sm text-purple-200">
                              📚 ക്ലാസ്-വൈസ് സിലബസ് വിഷയങ്ങൾ ചേർക്കുക
                            </h5>
                            <p className="text-3xs text-purple-300/80 pt-0.5">
                              ഓരോ ക്ലാസിലും നിങ്ങൾ ഇവിടെ നൽകുന്ന വിഷയങ്ങൾ മാത്രമേ അടുത്ത ഘട്ടത്തിൽ (Step 3) ടൈംടേബിളിൽ തിരഞ്ഞെടുക്കാൻ ലഭ്യമാകൂ!
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={handleLoadSamasthaTemplateToDirectory}
                              className="px-3 py-1.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 rounded-xl text-2xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="സമസ്ത കേരള ഇസ്‌ലാം മത വിദ്യാഭ്യാസ ബോർഡിന്റെ സ്റ്റാൻഡേർഡ് സിലബസ് ടെംപ്ലേറ്റ് ലോഡ് ചെയ്യുക"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>സമസ്ത ടെംപ്ലേറ്റ് ലോഡ് ചെയ്യുക</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleClearClassSubjectsInWizard(wizardActiveCls)}
                              className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 rounded-xl text-2xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title={`Clear subjects for ${wizardActiveCls}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{wizardActiveCls} ക്ലിയർ ചെയ്യുക</span>
                            </button>
                          </div>
                        </div>

                        {/* CLASS SELECTION PILLS */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                          {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).map((cls) => {
                            const count = (masterDir[cls] || []).length;
                            const isActive = wizardActiveCls === cls;
                            return (
                              <button
                                key={cls}
                                type="button"
                                onClick={() => setWizardActiveCls(cls)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                                  isActive
                                    ? "bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-950/40"
                                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
                                }`}
                              >
                                <span>{cls}</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-3xs font-mono font-bold ${
                                  isActive ? "bg-black/40 text-purple-200" : (count > 0 ? "bg-purple-950 text-purple-300" : "bg-slate-800 text-slate-500")
                                }`}>
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* INLINE SUBJECT ADDER FOR ACTIVE CLASS */}
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                          <span className="font-extrabold text-white text-xs block">
                            + {wizardActiveCls}-ലേക്ക് പുതിയ വിഷയം ചേർക്കുക (Add Subject to {wizardActiveCls}):
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                            <div className="sm:col-span-5">
                              <input
                                type="text"
                                placeholder="വിഷയത്തിന്റെ പേര് മലയാളത്തിൽ (ഉദാ: ഫിഖ്ഹ്)"
                                value={wizardNewSubMl}
                                onChange={(e) => setWizardNewSubMl(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-white font-bold outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <input
                                type="text"
                                placeholder="English / Romanized (Fiqh)"
                                value={wizardNewSubEn}
                                onChange={(e) => setWizardNewSubEn(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-slate-300 outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <select
                                value={wizardNewSubCat}
                                onChange={(e) => setWizardNewSubCat(e.target.value as any)}
                                className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                              >
                                <option value="fiqh">ഫിഖ്ഹ്</option>
                                <option value="quran">ഖുർആൻ</option>
                                <option value="aqeeda">അഖീദ</option>
                                <option value="thareekh">താരീഖ്</option>
                                <option value="lisan">ലിസാൻ</option>
                                <option value="akhlaq">അഖ്‌ലാഖ്</option>
                                <option value="general">ജനറൽ</option>
                              </select>
                            </div>

                            <div className="sm:col-span-2">
                              <button
                                type="button"
                                onClick={() => handleWizardAddSubject(wizardActiveCls)}
                                className="w-full h-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-md"
                              >
                                <Plus className="w-4 h-4" />
                                <span>ചേർക്കുക</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* LIST OF ADDED SUBJECTS FOR ACTIVE CLASS */}
                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                            <span className="font-extrabold text-slate-200">
                              {wizardActiveCls}-ലെ നിലവിലെ വിഷയങ്ങൾ ({(masterDir[wizardActiveCls] || []).length} വിഷയങ്ങൾ):
                            </span>
                            <span className="text-3xs text-slate-400">
                              ഈ ലിസ്റ്റിലുള്ള വിഷയങ്ങൾ മാത്രമേ Step 3 ലെ ഡ്രോപ്പ് ഡൗണിൽ കാണിക്കൂ
                            </span>
                          </div>

                          {(!masterDir[wizardActiveCls] || masterDir[wizardActiveCls].length === 0) ? (
                            <div className="p-6 text-center text-slate-500 text-xs">
                              {wizardActiveCls}-ലേക്ക് വിഷയങ്ങൾ ഒന്നും ചേർത്തിട്ടില്ല. മുകളിലെ ബോക്സ് വഴി വിഷയങ്ങൾ ചേർക്കുക.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                              {(masterDir[wizardActiveCls] || []).map((subj, idx) => (
                                <div
                                  key={subj.id || idx}
                                  className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <span className="w-5 h-5 rounded-md bg-purple-950 text-purple-300 font-mono text-3xs font-black flex items-center justify-center shrink-0">
                                      #{idx + 1}
                                    </span>
                                    <div className="truncate">
                                      <span className="font-bold text-white text-xs block truncate">{subj.nameMl}</span>
                                      <span className="text-3xs text-slate-400 truncate block">{subj.nameEn}</span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleWizardRemoveSubject(wizardActiveCls, subj.id)}
                                    className="p-1 text-red-400 hover:text-white hover:bg-red-950/80 rounded-lg transition shrink-0 cursor-pointer"
                                    title="വിഷയം ഒഴിവാക്കുക"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* WIZARD STEP 2 BUTTONS */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => setBoardWizardStep(1)}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <ArrowRight className="w-4 h-4 rotate-180" />
                            <span>പിന്നോട്ട് (Step 1)</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleWizardProceedToStep3}
                            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-purple-950/50 cursor-pointer"
                          >
                            <span>അടുത്തത്: പരീക്ഷാ ടൈംടേബിൾ തയ്യാറാക്കുക (Step 3)</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: EXAM SCHEDULE GRID BUILDER */}
                    {boardWizardStep === 3 && (
                      <div className="space-y-4 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-2xl">
                          <div>
                            <h5 className="font-extrabold text-sm text-emerald-200">
                              📅 പരീക്ഷാ തീയതികളും വിഷയങ്ങളും ക്രമീകരിക്കുക ({wizardActiveCls})
                            </h5>
                            <p className="text-3xs text-emerald-300/80 pt-0.5">
                              വിഷയങ്ങൾ തിരഞ്ഞെടുക്കാൻ താഴെയുള്ള ഡ്രോപ്പ് ഡൗണിൽ ക്ലിക്ക് ചെയ്യുക (Step 2 ൽ ചേർത്ത വിഷയങ്ങൾ മാത്രം കൃത്യമായി കാണിക്കും).
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleWizardAddDay(wizardActiveCls)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-2xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ ഒരു ദിവസം കൂടി ചേർക്കുക</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleWizardAutofillFromDirectory(wizardActiveCls)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-2xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="ഡയറക്ടറിയിലെ മുഴുവൻ വിഷയങ്ങളും തനിയെ ദിവസങ്ങളാക്കി മാറ്റുക"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>സിലബസ് മുഴുവൻ നിറയ്ക്കുക</span>
                            </button>
                          </div>
                        </div>

                        {/* CLASS SELECTION PILLS */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                          {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).map((cls) => {
                            const daysCount = (wizardClasses[cls] || []).length;
                            const isActive = wizardActiveCls === cls;
                            return (
                              <button
                                key={cls}
                                type="button"
                                onClick={() => setWizardActiveCls(cls)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                                  isActive
                                    ? "bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/40"
                                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
                                }`}
                              >
                                <span>{cls}</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-3xs font-mono font-bold ${
                                  isActive ? "bg-black/40 text-emerald-200" : (daysCount > 0 ? "bg-emerald-950 text-emerald-300" : "bg-slate-800 text-slate-500")
                                }`}>
                                  {daysCount} Days
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* BATCH HELPERS ROW */}
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="text-3xs text-slate-400 font-bold">തുടർച്ചയായ തീയതികൾ നൽകുക:</span>
                            <button
                              type="button"
                              onClick={() => handleWizardApplySequentialDates(wizardActiveCls)}
                              className="px-2.5 py-1 bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-500/30 rounded-lg text-3xs font-bold transition cursor-pointer"
                            >
                              ⚡ {wizardStartDate} മുതൽ തീയതികൾ നൽകുക
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-3xs text-slate-400 font-bold">പരീക്ഷാ സമയം:</span>
                            <button
                              type="button"
                              onClick={() => handleWizardApplyTimingToAllDays(wizardActiveCls)}
                              className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-500/30 rounded-lg text-3xs font-bold transition cursor-pointer"
                            >
                              ⏱️ മുഴുവൻ ദിവസങ്ങൾക്കും ({wizardTimingToAll}) നൽകുക
                            </button>
                          </div>
                        </div>

                        {/* EXAM DAYS TABLE FOR ACTIVE CLASS */}
                        <div className="space-y-2">
                          {(!wizardClasses[wizardActiveCls] || wizardClasses[wizardActiveCls].length === 0) ? (
                            <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                              <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
                              <p className="text-xs text-slate-400">
                                {wizardActiveCls}-ൽ പരീക്ഷാ ദിവസങ്ങൾ ഒന്നും ചേർത്തിട്ടില്ല.
                              </p>
                              <div className="flex justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleWizardAutofillFromDirectory(wizardActiveCls)}
                                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold transition"
                                >
                                  🔄 ഡയറക്ടറിയിലെ വിഷയങ്ങൾ വെച്ച് ഷെഡ്യൂൾ ഉണ്ടാക്കുക
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleWizardAddDay(wizardActiveCls)}
                                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition"
                                >
                                  + ഒരു ദിവസം ചേർക്കുക
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {wizardClasses[wizardActiveCls].map((dayEntry, dayIdx) => {
                                const classSubjects = masterDir[wizardActiveCls] || [];
                                const hasOptionMatch = classSubjects.some(s => s.nameMl === dayEntry.subject);

                                return (
                                  <div
                                    key={dayIdx}
                                    className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 hover:border-emerald-500/40 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center transition"
                                  >
                                    {/* DAY BADGE & DATE */}
                                    <div className="sm:col-span-4 flex items-center gap-2">
                                      <span className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-3xs font-black flex items-center justify-center shrink-0">
                                        #{dayIdx + 1}
                                      </span>
                                      <input
                                        type="date"
                                        value={toDateInputValue(dayEntry.dateStr)}
                                        onChange={(e) => handleUpdateWizardDayDate(wizardActiveCls, dayIdx, e.target.value)}
                                        style={{ colorScheme: "dark" }}
                                        className="w-full bg-slate-900 border border-slate-700 p-2 rounded-xl text-white font-bold text-xs outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                      />
                                    </div>

                                    {/* STRICT SUBJECT DROPDOWN */}
                                    <div className="sm:col-span-4">
                                      <select
                                        value={dayEntry.subject || ""}
                                        onChange={(e) => handleUpdateWizardDaySubject(wizardActiveCls, dayIdx, e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 p-2 rounded-xl text-white font-extrabold outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer text-xs"
                                      >
                                        <option value="">-- വിഷയം തിരഞ്ഞെടുക്കുക (Select Subject) --</option>
                                        {!hasOptionMatch && dayEntry.subject && (
                                          <option value={dayEntry.subject}>📌 {dayEntry.subject}</option>
                                        )}
                                        {classSubjects.length === 0 ? (
                                          <option value="" disabled>⚠️ ഈ ക്ലാസിൽ വിഷയങ്ങൾ ചേർത്തിട്ടില്ല (Step 2-ൽ പോവുക)</option>
                                        ) : (
                                          classSubjects.map((s) => (
                                            <option key={s.id} value={s.nameMl}>
                                              {s.nameMl} ({s.nameEn})
                                            </option>
                                          ))
                                        )}
                                      </select>
                                    </div>

                                    {/* TIMING INPUT */}
                                    <div className="sm:col-span-2">
                                      <input
                                        type="text"
                                        placeholder="06:30 AM - 08:30 AM"
                                        value={dayEntry.timeStr || ""}
                                        onChange={(e) => handleUpdateWizardDayTime(wizardActiveCls, dayIdx, e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 p-2 rounded-xl text-slate-300 font-mono text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                                      />
                                    </div>

                                    {/* ACTION CONTROLS */}
                                    <div className="sm:col-span-2 flex items-center justify-end gap-1">
                                      <button
                                        type="button"
                                        disabled={dayIdx === 0}
                                        onClick={() => handleWizardMoveDay(wizardActiveCls, dayIdx, "up")}
                                        className="p-1.5 text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                        title="മുകളിലേക്ക് നീക്കുക"
                                      >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        disabled={dayIdx === wizardClasses[wizardActiveCls].length - 1}
                                        onClick={() => handleWizardMoveDay(wizardActiveCls, dayIdx, "down")}
                                        className="p-1.5 text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                        title="താഴേക്ക് നീക്കുക"
                                      >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleWizardRemoveDay(wizardActiveCls, dayIdx)}
                                        className="p-1.5 text-red-400 hover:text-white bg-red-950/40 rounded-lg border border-red-500/30 hover:bg-red-900/80 cursor-pointer"
                                        title="ദിവസം ഒഴിവാക്കുക"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* WIZARD STEP 3 BOTTOM BUTTONS */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => setBoardWizardStep(2)}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <ArrowRight className="w-4 h-4 rotate-180" />
                            <span>പിന്നോട്ട്: ക്ലാസ് വിഷയങ്ങൾ (Step 2)</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleWizardSaveAndPublish}
                            disabled={isSavingTimetable}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold transition flex items-center gap-2 shadow-xl shadow-emerald-950/60 cursor-pointer disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            <span>{isSavingTimetable ? "സേവ് ചെയ്യുന്നു..." : "💾 ബോർഡ് ടൈംടേബിൾ സേവ് & പബ്ലിഷ് ചെയ്യുക"}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

            {/* BOARD SELECTOR & CLASS TABS */}
            {timetables.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-2">
                <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-400">No board timetables created yet. Click above to add one.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Board Switcher Pills */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-bold px-2">Select Active Board:</span>
                  {timetables.map((tb) => (
                    <button
                      key={tb.id}
                      onClick={() => setActiveBoardId(tb.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        activeBoardId === tb.id
                          ? "bg-sky-600 text-white shadow-md shadow-sky-900/40 font-extrabold"
                          : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <span>{tb.boardName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
                        {tb.academicYear}
                      </span>
                    </button>
                  ))}
                </div>

                {/* CURRENT BOARD DETAILS & CLASS SELECTOR */}
                {currentBoard && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-3xs uppercase font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/40">
                            {currentBoard.academicYear}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-950 text-purple-300 border border-purple-800/50">
                            {currentBoard.termMl || currentBoard.term || "പാദവാർഷികം"}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {currentBoard.categoryMl || (currentBoard.category === "school" ? "സ്കൂൾ മദ്റസ" : "ജനറൽ മദ്റസ")}
                          </span>
                          {currentBoard.isVerified ? (
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Verified Super Admin Data</span>
                            </span>
                          ) : (
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-amber-950/80 text-amber-300 border border-amber-500/50 flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3 text-amber-400" />
                              <span>Crowdsourced (Unverified)</span>
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 ml-auto">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>Last Updated: {currentBoard.lastUpdated ? new Date(currentBoard.lastUpdated).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : new Date(currentBoard.publishedAt).toLocaleDateString()}</span>
                            {currentBoard.updatedBy && <span className="text-slate-500">({currentBoard.updatedBy})</span>}
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-white pt-0.5">
                          {currentBoard.boardNameMl || currentBoard.boardName}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {currentBoard.boardName} • {currentBoard.description}
                        </p>

                        {/* METADATA QUICK TOGGLES FOR SUPERADMIN */}
                        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                            <input
                              type="checkbox"
                              checked={!!currentBoard.isVerified}
                              onChange={(e) => {
                                handleUpdateCurrentBoardMetadata("isVerified", e.target.checked);
                                handleUpdateCurrentBoardMetadata("source", e.target.checked ? "superadmin_verified" : "crowdsourced");
                                handleUpdateCurrentBoardMetadata("updatedBy", "Super Admin");
                              }}
                              className="accent-emerald-500 rounded"
                            />
                            <span className="text-slate-300 font-bold">Mark as Verified by Admin</span>
                          </label>

                          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                            <span className="text-slate-400 font-bold">Term:</span>
                            <select
                              value={currentBoard.term || "quarterly"}
                              onChange={(e) => {
                                const termVal = e.target.value as ExamTermType;
                                const termObj = EXAM_TERMS.find(t => t.id === termVal);
                                handleUpdateCurrentBoardMetadata("term", termVal);
                                handleUpdateCurrentBoardMetadata("termMl", termObj ? termObj.shortMl : "പാദവാർഷികം");
                              }}
                              className="bg-transparent text-sky-400 font-bold outline-none cursor-pointer"
                            >
                              {EXAM_TERMS.map(t => (
                                <option key={t.id} value={t.id} className="bg-slate-900 text-white">{t.labelMl}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                            <span className="text-slate-400 font-bold">Category:</span>
                            <select
                              value={currentBoard.category || "general"}
                              onChange={(e) => {
                                const catVal = e.target.value as "general" | "school";
                                handleUpdateCurrentBoardMetadata("category", catVal);
                                handleUpdateCurrentBoardMetadata("categoryMl", catVal === "school" ? "സ്കൂൾ മദ്റസ" : "ജനറൽ മദ്റസ");
                              }}
                              className="bg-transparent text-emerald-400 font-bold outline-none cursor-pointer"
                            >
                              <option value="general" className="bg-slate-900 text-white">ജനറൽ മദ്റസ</option>
                              <option value="school" className="bg-slate-900 text-white">സ്കൂൾ മദ്റസ</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                        <button
                          type="button"
                          onClick={() => setEditingBoardDetails({ ...currentBoard })}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Edit Board Details (പേര്, വർഷം, വിവരണം എഡിറ്റ് ചെയ്യുക)"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edit Board Details</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadSingleBoardBackup(currentBoard)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="ഈ ബോർഡ് മാത്രം ബാക്കപ്പ് ഫയലായി ഡൗൺലോഡ് ചെയ്യുക (Export Board JSON)"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Export Board JSON</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBoard(currentBoard.id)}
                          className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Delete this Board Timetable (ബോർഡ് ടൈംടേബിൾ ഡിലീറ്റ് ചെയ്യുക)"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span>Delete Board</span>
                        </button>

                        <button
                          onClick={() => handleAddDayToClass(activeClassKey)}
                          className="px-3.5 py-2 bg-sky-950/70 hover:bg-sky-900 text-sky-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-sky-600/40 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Exam Day to {activeClassKey}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCopySourceClass(activeClassKey);
                            setCopyTargetClasses(Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).filter(c => c !== activeClassKey));
                            setIsCopyModalOpen(true);
                          }}
                          className="px-3.5 py-2 bg-purple-950/70 hover:bg-purple-900 text-purple-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-purple-600/40 shadow-xs"
                          title="ഈ ക്ലാസിലെ പരീക്ഷാ ടൈംടേബിൾ മറ്റു ക്ലാസുകളിലേക്ക് പകർത്തി എഴുതുക (Copy Schedule)"
                        >
                          <Copy className="w-3.5 h-3.5 text-purple-400" />
                          <span>📋 മറ്റു ക്ലാസുകളിലേക്ക് പകർത്തുക (Copy)</span>
                        </button>
                      </div>
                    </div>

                    {/* CLASS SELECTION STRIP (Class 1 to Class 12) */}
                    <div className="space-y-2">
                      <label className="block text-xs text-slate-400 font-bold">
                        Select Madrasa Class to Edit Timetable:
                      </label>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                        {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).map((cls) => {
                          const entries = getBoardClassEntries(currentBoard, cls);
                          const hasSubjects = entries.length > 0;
                          return (
                            <button
                              key={cls}
                              onClick={() => setActiveClassKey(cls)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                                activeClassKey === cls
                                  ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                                  : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800"
                              }`}
                            >
                              <span>{cls}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                hasSubjects ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-500"
                              }`}>
                                {entries.length} days
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ACTIVE CLASS EXAM SUBJECTS TABLE */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-purple-400" />
                          <h5 className="font-extrabold text-sm text-white">
                            Exam Schedule for {activeClassKey}
                          </h5>
                          {currentBoard.isDefault && (
                            <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              ⭐ പ്രൈമറി ബോർഡ് (Default)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleBoardDefault(currentBoard.id)}
                            className={`px-2.5 py-1 rounded-lg text-2xs font-extrabold border transition cursor-pointer flex items-center gap-1 ${
                              currentBoard.isDefault
                                ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900"
                                : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                            }`}
                            title="എല്ലാ മദ്റസകളിലും ഡിഫോൾട്ടായി ഈ ബോർഡ് ടൈംടേബിൾ നൽകുക"
                          >
                            <span>{currentBoard.isDefault ? "⭐ പ്രൈമറി ബോർഡ്" : "☆ സെറ്റ് ആസ് പ്രൈമറി ബോർഡ്"}</span>
                          </button>
                          <span className="text-xs text-slate-400 font-mono">
                            {getBoardClassEntries(currentBoard, activeClassKey).length} Examination Papers
                          </span>
                        </div>
                      </div>

                      {/* BATCH SEQUENTIAL EXAM DATE GENERATOR */}
                      <div className="bg-slate-900/90 border border-sky-500/30 p-3 rounded-2xl space-y-2.5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="p-1 bg-sky-500/20 text-sky-400 rounded-md">
                              <Calendar className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-xs font-bold text-white">
                              📅 തീയതികൾ ക്രമീകരിക്കുക (Sequential Dates Generator):
                            </span>
                          </div>
                          <label className="flex items-center gap-1.5 text-2xs text-slate-300 font-bold cursor-pointer bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                            <input
                              type="checkbox"
                              checked={batchSkipFriday}
                              onChange={(e) => setBatchSkipFriday(e.target.checked)}
                              className="rounded text-sky-500 focus:ring-0 cursor-pointer"
                            />
                            <span>വെള്ളിയാഴ്ച ഒഴിവാക്കുക (Skip Friday)</span>
                          </label>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
                            <span className="text-[11px] text-slate-400 font-bold">ആരംഭ തീയതി:</span>
                            <input
                              type="date"
                              value={batchExamStartDate}
                              onChange={(e) => setBatchExamStartDate(e.target.value)}
                              style={{ colorScheme: "dark" }}
                              className="bg-transparent text-sky-300 font-bold text-xs outline-none cursor-pointer"
                              title="കലണ്ടറിൽ നിന്ന് ആരംഭ തീയതി തിരഞ്ഞെടുക്കുക"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleApplySequentialDates("current_class")}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <span>⚡ {activeClassKey}-ലേക്ക് നൽകുക</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("ഈ ആരംഭ തീയതി വെച്ച് 1 മുതൽ 12 വരെയുള്ള മുഴുവൻ ക്ലാസുകളിലെയും പരീക്ഷാ ദിവസങ്ങൾക്ക് തുടർച്ചയായ തീയതികൾ നൽകണോ?")) {
                                handleApplySequentialDates("all_classes");
                              }
                            }}
                            className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <span>🌐 മുഴുവൻ ക്ലാസുകളിലേക്കും (1-12)</span>
                          </button>
                        </div>
                      </div>

                      {/* QUICK SUBJECT SUGGESTION CHIPS FROM MASTER DIRECTORY */}
                      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-300 font-bold flex items-center gap-1.5">
                            <span>📚 Official & Custom Subjects for {activeClassKey} (ക്ലിക്ക് ചെയ്ത് ചേർക്കുക):</span>
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleReloadDirectorySubjectsForClass(activeClassKey)}
                              className="px-2.5 py-1 bg-sky-950/90 hover:bg-sky-900 text-sky-300 rounded-lg text-2xs font-extrabold border border-sky-500/40 flex items-center gap-1 transition cursor-pointer"
                              title="ഡയറക്ടറിയിലെ മുഴുവൻ സിലബസ് വിഷയങ്ങളും Day 1, Day 2 ക്രമത്തിൽ റീലോഡ് ചെയ്യുക"
                            >
                              <RotateCcw className="w-3 h-3 text-sky-400" />
                              <span>സിലബസ് റീലോഡ് (Reload All)</span>
                            </button>
                            <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 rounded-lg text-2xs font-extrabold border border-emerald-500/40 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>⬆️ ⬇️ ബോക്സ് മുകളിലേക്കും താഴേക്കും നീക്കാം</span>
                            </span>
                          </div>
                        </div>

                        {(() => {
                          const { defaultSubjects, customSubjects } = getSeparatedSubjectsForClass(activeClassKey);
                          const handleAddSubjectChip = (formattedSubj: string) => {
                            if (!currentBoard) return;
                            const updatedBoard: OfficialBoardTimetable = {
                              ...currentBoard,
                              classes: { ...(currentBoard.classes || {}) }
                            };
                            const entries = [...getBoardClassEntries(updatedBoard, activeClassKey)];
                            const emptyIdx = entries.findIndex(e => !e.subject || e.subject.includes("പുതിയ വിഷയം"));
                            if (emptyIdx !== -1) {
                              entries[emptyIdx] = { ...entries[emptyIdx], subject: formattedSubj };
                            } else {
                              const newDayNum = entries.length + 1;
                              let nextDate = formatDateWithDay(batchExamStartDate || "2026-07-18");
                              if (entries.length > 0 && entries[entries.length - 1].dateStr) {
                                const lastIso = toDateInputValue(entries[entries.length - 1].dateStr);
                                if (lastIso) {
                                  const parts = lastIso.split("-").map(Number);
                                  const d = new Date(parts[0], parts[1] - 1, parts[2]);
                                  d.setDate(d.getDate() + 1);
                                  if (batchSkipFriday && d.getDay() === 5) d.setDate(d.getDate() + 1);
                                  const yyyy = d.getFullYear();
                                  const mm = String(d.getMonth() + 1).padStart(2, "0");
                                  const dd = String(d.getDate()).padStart(2, "0");
                                  nextDate = formatDateWithDay(`${yyyy}-${mm}-${dd}`);
                                }
                              }
                              entries.push({
                                dayNum: newDayNum,
                                dateStr: nextDate,
                                subject: formattedSubj,
                                timeStr: "06:30 AM - 08:30 AM"
                              });
                            }
                            const plainNum = activeClassKey.replace(/\D/g, "");
                            const withClass = plainNum ? `Class ${plainNum}` : activeClassKey;
                            updatedBoard.classes[activeClassKey] = entries;
                            if (withClass) updatedBoard.classes[withClass] = entries;
                            if (plainNum) updatedBoard.classes[plainNum] = entries;
                            syncBoardTimetableToSystem(updatedBoard, timetables, true, true);
                          };

                          const classSubjects = masterDir[activeClassKey] || [];
                          return (
                            <div className="space-y-2">
                              {classSubjects.length === 0 ? (
                                <p className="text-xs text-slate-400">
                                  ⚠️ {activeClassKey}-ലേക്ക് വിഷയങ്ങൾ ഒന്നും ചേർത്തിട്ടില്ല. മുകളിലെ <em>"ക്ലാസ്-വൈസ് സിലബസ് ഡയറക്ടറി"</em> ടാബിൽ പോയി വിഷയങ്ങൾ ചേർക്കുക.
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {classSubjects.map((subj) => (
                                    <button
                                      key={subj.id}
                                      type="button"
                                      onClick={() => handleAddSubjectChip(subj.nameMl)}
                                      className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-lg text-xs border border-slate-700 hover:border-slate-500 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                      title={`ക്ലിക്ക് ചെയ്ത് ${subj.nameMl} ചേർക്കുക`}
                                    >
                                      <span>+ {subj.nameMl}</span>
                                      <span className="text-[10px] text-slate-400 font-sans">({subj.nameEn})</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* ACTIVE SWAP HINT BANNER */}
                      {swappingDayIndex !== null && (
                        <div className="p-3 bg-indigo-950/90 border border-indigo-400/60 rounded-2xl flex items-center justify-between gap-2 text-xs text-indigo-100 shadow-lg animate-in fade-in">
                          <div className="flex items-center gap-2">
                            <ArrowUpDown className="w-4 h-4 text-indigo-300 animate-bounce shrink-0" />
                            <span>
                              <strong>Day {swappingDayIndex + 1}</strong> തിരഞ്ഞെടുത്തു — പരസ്പരം മാറ്റേണ്ട മറ്റൊരു Day ബോക്സിലെ <strong>"🔄 ഇവിടേക്ക് മാറ്റുക (Swap Here)"</strong> ബട്ടണിൽ ക്ലിക്ക് ചെയ്യുക.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSwappingDayIndex(null)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-2xs font-bold border border-slate-700 cursor-pointer shrink-0"
                          >
                            റദ്ദാക്കുക (Cancel)
                          </button>
                        </div>
                      )}

                      {/* SUBJECTS LIST */}
                      {getBoardClassEntries(currentBoard, activeClassKey).length === 0 ? (
                        <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80 space-y-3">
                          <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                          <p className="text-xs text-slate-400">No exam papers added for {activeClassKey} yet.</p>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddDayToClass(activeClassKey)}
                              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              + Add Day 1 Subject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReloadDirectorySubjectsForClass(activeClassKey)}
                              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>സിലബസ് വിഷയങ്ങൾ ലോഡ് ചെയ്യുക</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {(() => {
                            const totalDaysCount = getBoardClassEntries(currentBoard, activeClassKey).length;
                            return getBoardClassEntries(currentBoard, activeClassKey).map((entry, dayIdx) => {
                              const isSelectedForSwap = swappingDayIndex === dayIdx;
                              const isSwapTarget = swappingDayIndex !== null && swappingDayIndex !== dayIdx;
                              return (
                                <div
                                  key={dayIdx}
                                  className={`grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3 rounded-2xl border items-center text-xs transition ${
                                    isSelectedForSwap
                                      ? "bg-indigo-950/60 border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg"
                                      : isSwapTarget
                                      ? "bg-slate-950/90 border-indigo-500/50 hover:border-indigo-400"
                                      : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                                  }`}
                                >
                                  {/* DAY NUMBER & REAL DATE PICKER COLUMN */}
                                  <div className="sm:col-span-4 space-y-1.5">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="w-7 h-7 rounded-xl bg-purple-900/70 border border-purple-500/50 flex items-center justify-center font-bold text-purple-200 font-mono shrink-0 shadow-xs"
                                        title={`Day ${entry.dayNum || dayIdx + 1}`}
                                      >
                                        {entry.dayNum || dayIdx + 1}
                                      </span>
                                      <div className="relative flex-1 flex items-center gap-1.5">
                                        <input
                                          type="date"
                                          value={toDateInputValue(entry.dateStr)}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            const newDate = val ? formatDateWithDay(val) : `Day ${entry.dayNum || dayIdx + 1}`;
                                            handleUpdateBoardClassSubject(activeClassKey, dayIdx, "dateStr", newDate);
                                          }}
                                          style={{ colorScheme: "dark" }}
                                          className="w-full bg-slate-900 border border-slate-700 hover:border-sky-500 focus:border-sky-500 p-2 rounded-xl text-white font-mono font-bold outline-none text-xs cursor-pointer shadow-inner"
                                          title="കലണ്ടറിൽ നിന്ന് തീയതി തിരഞ്ഞെടുക്കുക (Date Picker)"
                                        />
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            try {
                                              const inputEl = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              inputEl?.focus();
                                              inputEl?.showPicker?.();
                                            } catch (err) {}
                                          }}
                                          className="p-2 bg-sky-950/80 hover:bg-sky-900 border border-sky-600/40 text-sky-400 rounded-xl transition cursor-pointer shrink-0"
                                          title="കലണ്ടർ തുറക്കുക (Open Calendar)"
                                        >
                                          <Calendar className="w-4 h-4 text-sky-400" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] font-mono pl-9 pr-1">
                                      <span className="text-emerald-400 font-semibold truncate flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-emerald-400 inline shrink-0" />
                                        <span>{entry.dateStr ? formatDateWithDay(entry.dateStr) : `Day ${entry.dayNum || dayIdx + 1}`}</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const customPrompt = prompt("Enter custom date text (ഉദാ: 18-07-2026 (Sat) അല്ലെങ്കിൽ Day 1):", entry.dateStr || `Day ${dayIdx + 1}`);
                                          if (customPrompt !== null) {
                                            handleUpdateBoardClassSubject(activeClassKey, dayIdx, "dateStr", customPrompt.trim());
                                          }
                                        }}
                                        className="text-slate-400 hover:text-sky-300 text-3xs underline ml-2 shrink-0 cursor-pointer"
                                        title="കസ്റ്റം ടെക്സ്റ്റ് ആയി മാറ്റുക"
                                      >
                                        ✏️ Text
                                      </button>
                                    </div>
                                  </div>

                                  {/* SUBJECT DROPDOWN & CUSTOM INPUT COLUMN */}
                                  <div className="sm:col-span-4 space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      {(() => {
                                        const classSubjects = masterDir[activeClassKey] || [];
                                        const hasOptionMatch = classSubjects.some(
                                          s => entry.subject === s.nameMl || entry.subject === `${s.nameMl} (${s.nameEn})`
                                        );
                                        const isCustomMode = !!customEditingDays[`${activeClassKey}_${dayIdx}`];
                                        return (
                                          <>
                                            <select
                                              value={isCustomMode ? "__custom__" : (entry.subject || "")}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "__custom__") {
                                                  setCustomEditingDays(prev => ({ ...prev, [`${activeClassKey}_${dayIdx}`]: true }));
                                                } else {
                                                  setCustomEditingDays(prev => ({ ...prev, [`${activeClassKey}_${dayIdx}`]: false }));
                                                  handleUpdateBoardClassSubject(activeClassKey, dayIdx, "subject", val);
                                                }
                                              }}
                                              className="w-full bg-slate-900 border border-slate-700 p-2 rounded-xl text-white font-extrabold outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer text-xs"
                                            >
                                              <option value="">-- {activeClassKey} ലെ വിഷയം തിരഞ്ഞെടുക്കുക (Select Subject) --</option>
                                              {!hasOptionMatch && entry.subject && (
                                                <option value={entry.subject}>📌 {entry.subject}</option>
                                              )}
                                              {classSubjects.length === 0 ? (
                                                <option value="" disabled>⚠️ ഈ ക്ലാസിൽ വിഷയങ്ങൾ ചേർത്തിട്ടില്ല (Add in Subject Directory)</option>
                                              ) : (
                                                classSubjects.map((s) => (
                                                  <option key={s.id} value={s.nameMl}>
                                                    {s.nameMl} ({s.nameEn})
                                                  </option>
                                                ))
                                              )}
                                              <option value="__custom__">✏️ Custom / മറ്റൊരു വിഷയം ടൈപ്പ് ചെയ്യുക...</option>
                                            </select>

                                            <button
                                              type="button"
                                              title="Type custom subject"
                                              onClick={() => setCustomEditingDays(prev => ({
                                                ...prev,
                                                [`${activeClassKey}_${dayIdx}`]: !prev[`${activeClassKey}_${dayIdx}`]
                                              }))}
                                              className={`p-2 rounded-xl border text-xs shrink-0 transition cursor-pointer ${
                                                isCustomMode
                                                  ? "bg-sky-600 text-white border-sky-500 shadow-xs"
                                                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                                              }`}
                                            >
                                              ✏️
                                            </button>
                                          </>
                                        );
                                      })()}
                                    </div>

                                    {customEditingDays[`${activeClassKey}_${dayIdx}`] && (
                                      <input
                                        type="text"
                                        placeholder="Type custom subject name (ഉദാ: പ്രത്യേക ഫിഖ്ഹ് പരീക്ഷ)"
                                        value={entry.subject || ""}
                                        onChange={(e) => handleUpdateBoardClassSubject(activeClassKey, dayIdx, "subject", e.target.value)}
                                        className="w-full bg-slate-950 border border-sky-500/50 p-2 rounded-xl text-sky-200 font-bold outline-none focus:ring-1 focus:ring-sky-400 text-xs animate-in fade-in"
                                      />
                                    )}
                                  </div>

                                  {/* TIMING COLUMN */}
                                  <div className="sm:col-span-2">
                                    <input
                                      type="text"
                                      placeholder="Timing (07:30 - 09:30 AM)"
                                      value={entry.timeStr || ""}
                                      onChange={(e) => handleUpdateBoardClassSubject(activeClassKey, dayIdx, "timeStr", e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded-xl text-slate-300 font-mono outline-none focus:ring-1 focus:ring-sky-500 text-xs"
                                    />
                                  </div>

                                  {/* MOVE UP / MOVE DOWN / SWAP / DELETE CONTROLS COLUMN */}
                                  <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        disabled={dayIdx === 0}
                                        onClick={() => handleMoveDayInClass(activeClassKey, dayIdx, "up")}
                                        className="px-2.5 py-2 bg-slate-900 hover:bg-purple-950/80 text-purple-300 hover:text-white border border-slate-700 hover:border-purple-500/50 rounded-xl transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 font-bold text-2xs"
                                        title="ബോക്സ് മുകളിലേക്ക് നീക്കുക (Move Box Up)"
                                      >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                        <span className="sm:hidden">മുകളിലേക്ക്</span>
                                      </button>

                                      <button
                                        type="button"
                                        disabled={dayIdx === totalDaysCount - 1}
                                        onClick={() => handleMoveDayInClass(activeClassKey, dayIdx, "down")}
                                        className="px-2.5 py-2 bg-slate-900 hover:bg-purple-950/80 text-purple-300 hover:text-white border border-slate-700 hover:border-purple-500/50 rounded-xl transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 font-bold text-2xs"
                                        title="ബോക്സ് താഴേക്ക് നീക്കുക (Move Box Down)"
                                      >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                        <span className="sm:hidden">താഴേക്ക്</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (swappingDayIndex === null) {
                                            setSwappingDayIndex(dayIdx);
                                          } else if (swappingDayIndex === dayIdx) {
                                            setSwappingDayIndex(null);
                                          } else {
                                            handleSwapDaysInClass(activeClassKey, swappingDayIndex, dayIdx);
                                          }
                                        }}
                                        className={`px-2 py-2 rounded-xl border transition cursor-pointer flex items-center gap-1 font-bold text-2xs ${
                                          isSelectedForSwap
                                            ? "bg-indigo-600 text-white border-indigo-400 shadow-sm"
                                            : isSwapTarget
                                            ? "bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-400 animate-pulse"
                                            : "bg-slate-900 hover:bg-indigo-950/80 text-indigo-300 border-slate-700 hover:border-indigo-500/50"
                                        }`}
                                        title={
                                          isSelectedForSwap
                                            ? "റദ്ദാക്കാൻ ക്ലിക്ക് ചെയ്യുക (Cancel Swap)"
                                            : isSwapTarget
                                            ? `Day ${swappingDayIndex + 1}-ഉം Day ${dayIdx + 1}-ഉം പരസ്പരം മാറ്റുക`
                                            : "മറ്റൊരു ദിവസവുമായി പരസ്പരം മാറ്റുക (Swap Box)"
                                        }
                                      >
                                        <ArrowUpDown className="w-3.5 h-3.5" />
                                        <span className="sm:hidden">
                                          {isSelectedForSwap ? "തിരഞ്ഞെടുത്തു" : isSwapTarget ? "ഇവിടേക്ക് മാറ്റുക" : "Swap"}
                                        </span>
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveDayFromClass(activeClassKey, dayIdx)}
                                      className="px-2.5 py-2 bg-red-950/50 hover:bg-red-900/80 text-red-300 hover:text-white border border-red-500/30 hover:border-red-400 rounded-xl transition cursor-pointer flex items-center gap-1 font-bold text-2xs"
                                      title="ഈ ബോക്സ് ഒഴിവാക്കുക (Delete Box)"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span className="sm:hidden">Delete</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            });
                          })()}

                          <button
                            type="button"
                            onClick={() => handleAddDayToClass(activeClassKey)}
                            className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-dashed border-slate-700 hover:border-sky-500 text-sky-300 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>+ Add Next Exam Day to {activeClassKey}</span>
                          </button>

                          {/* DEDICATED SAVE & PUBLISH BUTTON FOR CURRENT CLASS & BOARD */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>{activeClassKey} ടൈംടേബിൾ മാറ്റങ്ങൾ ക്ലൗഡിൽ സേവ് ചെയ്യുക</span>
                              </div>
                              <p className="text-[11px] text-slate-400">
                                സേവ് ചെയ്യുമ്പോൾ എല്ലാ മദ്റസകളിലെയും യൂസർമാർക്ക് ഈ വിവരങ്ങൾ ക്ലൗഡിൽ നിന്ന് നേരിട്ട് ലഭ്യമാകും
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleSaveBoardTimetable}
                              disabled={isSavingTimetable}
                              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                              <span>{isSavingTimetable ? "സേവ് ചെയ്യുന്നു..." : "💾 ബോർഡ് ടൈംടേബിൾ ക്ലൗഡിൽ സേവ് ചെയ്യുക"}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
              </div>
            )}

            {/* VIEW 2: MASTER CLASS-WISE SUBJECT DIRECTORY SUB-TAB */}
            {timetableSubTab === "directory" && (
              <div className="space-y-6">
                {/* DIRECTORY HEADER & CONTROLS */}
                <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/30 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-3xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                        SAMASTHA SKJMCC / SKIMVB SYLLABUS DIRECTORY
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-3xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        Class-Specific Filter Engine
                      </span>
                    </div>
                    <h3 className="font-black text-xl text-white pt-1 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-purple-400" />
                      <span>ക്ലാസ് തിരിച്ചുള്ള ഔദ്യോഗിക സിലബസ് ഡയറക്ടറി</span>
                    </h3>
                    <p className="text-xs text-slate-300 max-w-2xl">
                      ഓരോ ക്ലാസിനും ബാധകമായ വിഷയങ്ങൾ കൃത്യമായി ഇവിടെ ക്രമീകരിച്ചിരിക്കുന്നു. ഇവിടെ നൽകിയിട്ടുള്ള വിഷയങ്ങൾ മാത്രമേ ടൈംടേബിൾ തയ്യാറാക്കുമ്പോൾ അതത് ക്ലാസിന്റെ ഡ്രോപ്പ് ഡൗണിൽ കാണിക്കുകയുള്ളൂ.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={handleSaveDirectoryToCloud}
                      disabled={isSavingDirectory}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="സിലബസ് മാറ്റങ്ങൾ ക്ലൗഡിലും സെർവറിലും സ്ഥിരമായി സേവ് ചെയ്യുക"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingDirectory ? "സേവ് ചെയ്യുന്നു..." : "💾 ക്ലൗഡിലേക്ക് സേവ് ചെയ്യുക (Save to Cloud)"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAddingSubjectToDir(true)}
                      className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ {dirSelectedClass} ലേക്ക് വിഷയം ചേർക്കുക</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetDirectoryToDefault}
                      title="Reset syllabus to official Samastha curriculum"
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl text-xs border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>റീസെറ്റ് (Reset Defaults)</span>
                    </button>
                  </div>
                </div>

                {/* ADD SUBJECT FORM (MODAL / INLINE) */}
                {isAddingSubjectToDir && (
                  <div className="bg-slate-900 border border-purple-500/50 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="font-extrabold text-sm text-purple-300 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-purple-400" />
                        <span>{dirSelectedClass} സിലബസിലേക്ക് പുതിയ വിഷയം ചേർക്കുക</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsAddingSubjectToDir(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">വിഷയത്തിന്റെ പേര് (മലയാളം - Required):</label>
                        <input
                          type="text"
                          required
                          placeholder="ഉദാ: ദുറൂസുൽ ഇഹ്സാൻ / ഫിഖ്ഹ്"
                          value={dirNewSubjectForm.nameMl}
                          onChange={(e) => setDirNewSubjectForm({ ...dirNewSubjectForm, nameMl: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white font-bold outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>

                        <label className="block text-slate-300 font-bold mb-1">ഇംഗ്ലീഷ് / റോമൻ പേര് (English Name):</label>
                        <input
                          type="text"
                          placeholder="e.g. Duroos-ul-Ihsan / Fiqh"
                          value={dirNewSubjectForm.nameEn}
                          onChange={(e) => setDirNewSubjectForm({ ...dirNewSubjectForm, nameEn: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">വിഭാഗം (Subject Category):</label>
                        <select
                          value={dirNewSubjectForm.category}
                          onChange={(e) => setDirNewSubjectForm({ ...dirNewSubjectForm, category: e.target.value as any })}
                          className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="quran">📖 ഖുർആൻ / തജ്‌വീദ് (Quran)</option>
                          <option value="fiqh">⚖️ ഫിഖ്ഹ് (Islamic Jurisprudence)</option>
                          <option value="aqeeda">🤲 അഖീദ (Faith / Theology)</option>
                          <option value="thareekh">📜 താരീഖ് (Islamic History)</option>
                          <option value="lisan">✍️ ലിസാൻ & അറബിക് (Arabic)</option>
                          <option value="akhlaq">🌟 അഖ്‌ലാഖ് & ദുആ (Morals)</option>
                          <option value="general">🏫 ജനറൽ / സ്കൂൾ വിഷയങ്ങൾ (General)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsAddingSubjectToDir(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                      >
                        റദ്ദാക്കുക (Cancel)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSubjectToDirectory(dirSelectedClass)}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition shadow-md flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" />
                        <span>സിലബസിൽ ചേർക്കുക (Save to {dirSelectedClass})</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* CLASS TABS */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                      ക്ലാസ് തിരഞ്ഞെടുക്കുക (Select Class):
                    </span>
                    <span className="text-xs text-purple-300 font-bold bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-full">
                      {dirSelectedClass} : {(masterDir[dirSelectedClass] || []).length} വിഷയങ്ങൾ
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).map((clsKey) => {
                      const count = (masterDir[clsKey] || []).length;
                      const isActive = dirSelectedClass === clsKey;
                      return (
                        <button
                          key={clsKey}
                          type="button"
                          onClick={() => setDirSelectedClass(clsKey)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                            isActive
                              ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                              : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80 border border-slate-700/60"
                          }`}
                        >
                          <span>{clsKey}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-3xs font-mono font-black ${
                            isActive ? "bg-purple-900/80 text-purple-200" : "bg-slate-900 text-slate-400"
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SUBJECTS LIST FOR SELECTED CLASS */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                        <span>{dirSelectedClass} ലെ സിലബസ് വിഷയങ്ങൾ (Official Curriculum)</span>
                      </h4>
                      <p className="text-xs text-slate-400 pt-0.5">
                        {dirSelectedClass} ന്റെ പരീക്ഷാ ടൈംടേബിളിൽ താഴെ പറയുന്ന വിഷയങ്ങൾ മാത്രമേ തിരഞ്ഞെടുക്കാൻ ലഭ്യമാകൂ:
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingSubjectToDir(true)}
                      className="px-3.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>വിഷയം ചേർക്കുക</span>
                    </button>
                  </div>

                  {(!masterDir[dirSelectedClass] || masterDir[dirSelectedClass].length === 0) ? (
                    <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80 space-y-2">
                      <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400">{dirSelectedClass} ലേക്ക് വിഷയങ്ങൾ ഒന്നും ചേർത്തിട്ടില്ല.</p>
                      <button
                        type="button"
                        onClick={() => setIsAddingSubjectToDir(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold transition"
                      >
                        + ആദ്യ വിഷയം ചേർക്കുക
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(masterDir[dirSelectedClass] || []).map((subject, idx) => {
                        const getCategoryBadge = (cat: string) => {
                          switch (cat) {
                            case "quran":
                              return { label: "ഖുർആൻ / തജ്‌വീദ്", color: "bg-emerald-950/80 text-emerald-300 border-emerald-500/30" };
                            case "fiqh":
                              return { label: "ഫിഖ്ഹ്", color: "bg-sky-950/80 text-sky-300 border-sky-500/30" };
                            case "aqeeda":
                              return { label: "അഖീദ", color: "bg-amber-950/80 text-amber-300 border-amber-500/30" };
                            case "thareekh":
                              return { label: "താരീഖ്", color: "bg-purple-950/80 text-purple-300 border-purple-500/30" };
                            case "lisan":
                              return { label: "ലിസാൻ", color: "bg-indigo-950/80 text-indigo-300 border-indigo-500/30" };
                            case "akhlaq":
                              return { label: "അഖ്‌ലാഖ്", color: "bg-rose-950/80 text-rose-300 border-rose-500/30" };
                            default:
                              return { label: "ജനറൽ", color: "bg-slate-800 text-slate-300 border-slate-700" };
                          }
                        };
                        const catBadge = getCategoryBadge(subject.category);

                        return (
                          <div
                            key={subject.id || idx}
                            className="bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 p-4 rounded-2xl flex flex-col justify-between transition gap-2.5 shadow-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-purple-900/50 border border-purple-500/40 text-purple-300 font-mono text-3xs font-black flex items-center justify-center shrink-0">
                                  #{idx + 1}
                                </span>
                                <div>
                                  <h5 className="text-sm font-extrabold text-white leading-tight">
                                    {subject.nameMl}
                                  </h5>
                                  <p className="text-[11px] text-slate-400 font-medium">
                                    {subject.nameEn}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveSubjectInDirectory(dirSelectedClass, idx, "up")}
                                  title="മുകളിലേക്ക് നീക്കുക (Move Up - Day Order)"
                                  className="p-1.5 text-purple-300 hover:text-white bg-slate-900 hover:bg-purple-900/70 border border-slate-800 hover:border-purple-500/40 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === (masterDir[dirSelectedClass] || []).length - 1}
                                  onClick={() => handleMoveSubjectInDirectory(dirSelectedClass, idx, "down")}
                                  title="താഴേക്ക് നീക്കുക (Move Down - Day Order)"
                                  className="p-1.5 text-purple-300 hover:text-white bg-slate-900 hover:bg-purple-900/70 border border-slate-800 hover:border-purple-500/40 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSubject({ classKey: dirSelectedClass, subject: { ...subject } })}
                                  title={`${dirSelectedClass}-ലെ "${subject.nameMl}" വിഷയം എഡിറ്റ് ചെയ്യുക`}
                                  className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-sky-950/60 border border-transparent hover:border-sky-500/30 rounded-lg transition cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubjectFromDirectory(dirSelectedClass, subject.id)}
                                  title="ഈ ബോക്സ് ഒഴിവാക്കുക (Delete Subject Box)"
                                  className="p-1.5 text-red-400 hover:text-white bg-red-950/40 hover:bg-red-900/80 border border-red-500/30 rounded-lg transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                              <span className={`px-2 py-0.5 rounded-md text-3xs font-bold border ${catBadge.color}`}>
                                {catBadge.label}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ID: {subject.id}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* INFO BOX */}
                  <div className="mt-4 p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs text-slate-300 flex items-start gap-2.5">
                    <span className="text-base">💡</span>
                    <p className="leading-relaxed text-[11px] text-slate-400">
                      <strong className="text-slate-200">സൂചന:</strong> ഇവിടെ കോൺഫിഗർ ചെയ്യുന്ന വിഷയങ്ങളാണ് സൂപ്പർ അഡ്മിൻ ബോർഡ് ടൈംടേബിളിലും മദ്റസ ടൈംടേബിൾ എഡിറ്ററിലും അതത് ക്ലാസിൻ്റെ ഡ്രോപ്പ് ഡൗണിൽ ലഭ്യമാവുക. കൂടുതൽ വിഷയങ്ങൾ ആവശ്യമുണ്ടെങ്കിൽ മുകളിലെ <em>+ വിഷയം ചേർക്കുക</em> ക്ലിക്ക് ചെയ്യുക.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: USER DIRECTORY & WHATSAPP MARKETING CRM */}
        {activeTab === "madrasas" && (
          <div className="space-y-6">
            
            {/* CRM HEADER & TOP ACTIONS */}
            <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/30 rounded-3xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 font-mono">
                    User Intelligence & CRM
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Tracking Active
                  </span>
                </div>
                <h3 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
                  👥 Madrasa User Directory & WhatsApp CRM
                </h3>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Real-time user directory with activity tracking, WhatsApp numbers, last used timestamps, and 1-click marketing broadcasts for upcoming paid software and exam printing packages.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleCopyAllPhones(filteredCrmUsersList)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
                  title="Copy all phone numbers for WhatsApp Bulk Sender tools"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy All WhatsApp Nos ({filteredCrmUsersList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportCrmCsv(filteredCrmUsersList)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                  title="Download CSV spreadsheet of all users"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={fetchAdminData}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
                  title="Refresh User Data"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* FEEDBACK TOAST FOR COPIED PHONE NUMBERS */}
            {copyFeedback && (
              <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs rounded-2xl flex items-center gap-2 shadow-lg animate-in fade-in">
                <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{copyFeedback}</span>
              </div>
            )}

            {/* CRM STATS ROW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Total Users / Madrasas</span>
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">{crmUsers.length || submissions.length}</div>
                <span className="text-[10px] text-purple-300">Registered in directory</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Active Today</span>
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {crmUsers.filter(u => {
                    if (!u.lastActiveAt) return false;
                    return new Date(u.lastActiveAt).toDateString() === new Date().toDateString();
                  }).length}
                </div>
                <span className="text-[10px] text-emerald-300">Engaged within 24 hours</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Total Students Enrolled</span>
                  <UserCheck className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-black text-sky-400 font-mono">
                  {crmUsers.reduce((sum, u) => sum + (u.studentCount || 0), 0) || 
                   submissions.reduce((sum, s) => sum + (s.students?.length || 0), 0)}
                </div>
                <span className="text-[10px] text-sky-300">Across all institutions</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Print & Courier Orders</span>
                  <Package className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400 font-mono">{orders.length}</div>
                <span className="text-[10px] text-amber-300">Total conversion rate</span>
              </div>
            </div>

            {/* MARKETING WHATSAPP CAMPAIGN COMPOSER */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">WhatsApp Marketing Campaign Message Template</h4>
                    <p className="text-[11px] text-slate-400">
                      Choose or write a marketing broadcast message. Clicking the green WhatsApp icon next to any user will automatically launch a direct WhatsApp chat with this message pre-filled!
                    </p>
                  </div>
                </div>
              </div>

              {/* TEMPLATE PICKER TABS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMarketingTemplate("software_launch")}
                  className={`p-3 rounded-2xl text-left border transition text-xs flex flex-col gap-1 cursor-pointer ${
                    marketingTemplate === "software_launch"
                      ? "bg-purple-950/60 border-purple-500/80 text-white shadow-md shadow-purple-950/30"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="font-bold flex items-center gap-1.5 text-purple-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    🚀 New Paid Software Suite
                  </span>
                  <span className="text-[10px] text-slate-400 line-clamp-2">
                    Announce upcoming complete madrasa management software, exam result portal & early bird discounts.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMarketingTemplate("printing_offer")}
                  className={`p-3 rounded-2xl text-left border transition text-xs flex flex-col gap-1 cursor-pointer ${
                    marketingTemplate === "printing_offer"
                      ? "bg-purple-950/60 border-purple-500/80 text-white shadow-md shadow-purple-950/30"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="font-bold flex items-center gap-1.5 text-emerald-300">
                    <Printer className="w-3.5 h-3.5" />
                    🖨️ Direct Printing & Courier Offer
                  </span>
                  <span className="text-[10px] text-slate-400 line-clamp-2">
                    Standard desk stickers, door attendance slips, and hall tickets delivered via Speed Post.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMarketingTemplate("custom")}
                  className={`p-3 rounded-2xl text-left border transition text-xs flex flex-col gap-1 cursor-pointer ${
                    marketingTemplate === "custom"
                      ? "bg-purple-950/60 border-purple-500/80 text-white shadow-md shadow-purple-950/30"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span className="font-bold flex items-center gap-1.5 text-amber-300">
                    <Edit className="w-3.5 h-3.5" />
                    ✏️ Custom Personalized Message
                  </span>
                  <span className="text-[10px] text-slate-400 line-clamp-2">
                    Write your own customized broadcast text with dynamic {"{name}"} substitution.
                  </span>
                </button>
              </div>

              {/* CUSTOM MESSAGE INPUT IF SELECTED */}
              {marketingTemplate === "custom" && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>Your Custom Broadcast Message:</span>
                    <span className="text-slate-500">Tip: Use {"{name}"} for Madrasa or Usthad Name</span>
                  </label>
                  <textarea
                    rows={3}
                    value={customMarketingMessage}
                    onChange={(e) => setCustomMarketingMessage(e.target.value)}
                    placeholder="അസ്സലാമു അലൈകും {name}, Seat Manager AI Studio-യിൽ നിന്നുള്ള പുതിയ അപ്‌ഡേറ്റ്..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 font-sans"
                  />
                </div>
              )}

              {/* PREVIEW BOX */}
              <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Eye className="w-3 h-3 text-slate-400" />
                  Live Preview of Message:
                </span>
                <p className="text-xs text-slate-300 whitespace-pre-line font-sans leading-relaxed">
                  {getMarketingMessage("ദാറുൽ ഉലൂം മദ്റസ")}
                </p>
              </div>
            </div>

            {/* DIRECT USER ACTIVATION BY PHONE / EMAIL (NO REQUEST NEEDED) */}
            <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-emerald-950/80 border-2 border-emerald-500/40 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                    ⚡
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <span>നേരിട്ടുള്ള ലൈസൻസ് ആക്റ്റിവേഷൻ (Direct User Activation)</span>
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-3xs font-mono px-2 py-0.5 rounded-full font-bold uppercase">
                        No Request Needed
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      യൂസർ മെസ്സേജ് അയക്കാതെ തന്നെ, ലോഗിൻ ചെയ്ത ഫോൺ നമ്പറോ ഇമെയിലോ നൽകി അഡ്മിന് തത്സമയം പ്രിന്റിംഗ് ആക്സസ് അൺലോക്ക് ചെയ്യാം.
                    </p>
                  </div>
                </div>
              </div>

              {directFeedback && (
                <div className={`p-3 rounded-xl text-xs font-bold ${directFeedback.startsWith("✅") ? "bg-emerald-950/80 border border-emerald-500/50 text-emerald-200" : "bg-red-950/80 border border-red-500/50 text-red-200"}`}>
                  {directFeedback}
                </div>
              )}

              <form onSubmit={handleDirectActivateByAdmin} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="WhatsApp Phone Number or Login Email (e.g. 9847012345 or usthad@gmail.com)"
                    value={directInput}
                    onChange={(e) => setDirectInput(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Madrasa Name (Optional)"
                    value={directMadrasaName}
                    onChange={(e) => setDirectMadrasaName(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={isDirectActivating}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                    <span>{isDirectActivating ? "Activating..." : "⚡ Activate 1-Year"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* SEARCH & FILTERS BAR */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
              {/* SEARCH INPUT */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by Madrasa Name, WhatsApp Phone, Reg No, or Place..."
                  value={crmSearchQuery}
                  onChange={(e) => setCrmSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                {crmSearchQuery && (
                  <button
                    onClick={() => setCrmSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* FILTER CHIPS */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setCrmFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    crmFilter === "all"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  All Users ({crmUsers.length || submissions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCrmFilter("paid")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    crmFilter === "paid"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  💳 Paid Licenses
                </button>
                <button
                  type="button"
                  onClick={() => setCrmFilter("trial")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    crmFilter === "trial"
                      ? "bg-amber-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  ⏳ Free Trial
                </button>
                <button
                  type="button"
                  onClick={() => setCrmFilter("expired")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    crmFilter === "expired"
                      ? "bg-rose-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  🔴 Expired
                </button>
                <button
                  type="button"
                  onClick={() => setCrmFilter("today")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    crmFilter === "today"
                      ? "bg-teal-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  🟢 Active Today
                </button>
                <button
                  type="button"
                  onClick={() => setCrmFilter("week")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    crmFilter === "week"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  🟡 Active This Week
                </button>
                <button
                  type="button"
                  onClick={() => setCrmFilter("with_orders")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    crmFilter === "with_orders"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  📦 Has Orders
                </button>
                <button
                  type="button"
                  onClick={() => setCrmFilter("large")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    crmFilter === "large"
                      ? "bg-sky-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  🎓 Large (&gt;50 Students)
                </button>
              </div>
            </div>

            {/* USERS LIST / CARDS */}
            {filteredCrmUsersList.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <Users className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="font-bold text-white text-base">No Madrasa Users Found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {crmSearchQuery 
                    ? `No users matched "${crmSearchQuery}". Try clearing search filters.`
                    : "Users will automatically be recorded here in real-time as they create seating arrangements, backup workspaces, or order prints."}
                </p>
                {crmSearchQuery && (
                  <button
                    onClick={() => { setCrmSearchQuery(""); setCrmFilter("all"); }}
                    className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl"
                  >
                    Clear Search Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCrmUsersList.map((user) => {
                  const cleanPhone = (user.phone || "").replace(/[^0-9]/g, "");
                  const hasValidPhone = cleanPhone.length >= 10;
                  const waPhone = hasValidPhone ? (cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone.slice(-10)}`) : "";
                  const marketingMsg = getMarketingMessage(user.name);
                  const waUrl = hasValidPhone 
                    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(marketingMsg)}`
                    : "#";

                  return (
                    <div 
                      key={user.id} 
                      className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 p-5 rounded-3xl space-y-3.5 shadow-lg transition-all duration-200 group flex flex-col justify-between"
                    >
                      {/* TOP BADGES */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] text-purple-400 font-bold bg-purple-950/70 px-2.5 py-0.5 rounded-full border border-purple-800/50">
                            {user.regNo || "REG-2026"}
                          </span>
                          
                          {/* LAST ACTIVE TIMESTAMP BADGE */}
                          <span 
                            className="text-[10px] font-semibold text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800 flex items-center gap-1 shrink-0"
                            title={`Full timestamp: ${user.lastActiveAt || 'Unknown'}`}
                          >
                            {formatRelativeTime(user.lastActiveAt)}
                          </span>
                        </div>

                        {/* NAME & CONTACT DETAILS */}
                        <div>
                          <h4 className="font-extrabold text-base text-white leading-snug group-hover:text-purple-300 transition-colors">
                            {user.name || "Unnamed Madrasa"}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                            <span>{user.place || "Kerala"}</span>
                            {user.phone && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-300 font-bold">{user.phone}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* ENGAGEMENT DETAILS & ACTION */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Students:</span>
                            <span className="font-mono font-black text-emerald-400">
                              {user.studentCount || 0}
                            </span>
                          </div>

                          <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Orders:</span>
                            <span className="font-mono font-black text-amber-400">
                              {user.ordersCount || 0}
                            </span>
                          </div>
                        </div>

                        {/* LAST ACTION TAKEN BADGE */}
                        <div className="text-[10px] text-slate-400 bg-slate-950/40 p-2 rounded-xl border border-slate-800/50 flex items-center justify-between">
                          <span className="truncate">Last Action: <strong className="text-slate-300">{user.lastAction || "Active in software"}</strong></span>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 bg-purple-950 text-purple-400 rounded font-mono shrink-0 ml-1">
                            {user.source || "Web"}
                          </span>
                        </div>

                        {/* LICENSE STATUS PILL */}
                        {(() => {
                          const lic = licensesMap[user.id] || (user.regNo ? licensesMap[user.regNo] : null) || licensesMap[user.name];
                          const isPaid = lic && lic.status === "paid";
                          const isExpired = lic && (lic.status === "expired" || (lic.expiresAt && new Date(lic.expiresAt) < new Date()));
                          
                          if (isExpired) {
                            return (
                              <div className="flex items-center justify-between p-2 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-[11px]">
                                <span className="font-bold flex items-center gap-1">
                                  <span>🔴 Expired License</span>
                                </span>
                                <span className="font-mono text-[10px]">
                                  {lic?.expiresAt ? new Date(lic.expiresAt).toLocaleDateString() : "Expired"}
                                </span>
                              </div>
                            );
                          }
                          if (isPaid) {
                            return (
                              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-[11px]">
                                <span className="font-bold flex items-center gap-1">
                                  <span>🟢 Paid ({lic.plan === "bundle" ? "All Apps" : lic.plan === "seating_only" ? "Seating" : lic.plan === "result_only" ? "Result" : "Tarbiyah"})</span>
                                  {lic.amountPaid ? <span className="font-mono text-white font-black bg-emerald-900/60 px-1.5 py-0.2 rounded">₹{lic.amountPaid}</span> : null}
                                </span>
                                <span className="font-mono text-[10px]">
                                  Till: {lic.expiresAt ? new Date(lic.expiresAt).toLocaleDateString() : `${lic.durationMonths || 12}M`}
                                </span>
                              </div>
                            );
                          }
                          return (
                            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-[11px]">
                              <span className="font-bold">⏳ Free Experience (Trial)</span>
                              <span className="text-[10px] text-amber-400/80">Unpaid</span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="pt-2 flex items-center gap-2 border-t border-slate-800/80">
                        {onImportMadrasaToWorkspace && (
                          <button
                            type="button"
                            onClick={() => {
                              onImportMadrasaToWorkspace({
                                ...user,
                                students: Array.isArray((user as any).students) ? (user as any).students : (Array.isArray((user as any).studentsData) ? (user as any).studentsData : [])
                              }, false);
                              onSwitchToUserMode();
                            }}
                            className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-md shadow-purple-950/40"
                            title="Open this user's data in the main workspace"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Workspace</span>
                          </button>
                        )}

                        {/* 1-CLICK QUICK TOGGLE LICENSE BUTTON */}
                        {(() => {
                          const key = user.id || user.regNo || user.name;
                          const lic = licensesMap[key] || (user.regNo ? licensesMap[user.regNo] : null) || licensesMap[user.name];
                          const isPaid = lic && lic.status === "paid" && (!lic.expiresAt || new Date(lic.expiresAt) > new Date());

                          return (
                            <button
                              type="button"
                              onClick={() => handleQuickToggleLicense(user)}
                              className={`py-2 px-2.5 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-md ${
                                isPaid 
                                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40"
                                  : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40"
                              }`}
                              title={isPaid ? "Deactivate License" : "Directly Activate License"}
                            >
                              {isPaid ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 text-amber-200" />}
                              <span>{isPaid ? "Paid Active" : "⚡ Activate"}</span>
                            </button>
                          );
                        })()}

                        {/* LICENSE BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleOpenLicenseModal(user)}
                          className="py-2 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-indigo-950/40"
                          title="Manage Dynamic License, Paid Status & Expiry"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>License</span>
                        </button>

                        {/* PERMANENT DELETE USER & DATA */}
                        <button
                          type="button"
                          onClick={() => handlePermanentDeleteUser(user)}
                          className="py-2 px-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-rose-950/40"
                          title="Permanently Delete User & Database Records"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* 1-CLICK WHATSAPP MARKETING BUTTON */}
                        {hasValidPhone ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
                            title="Open WhatsApp Chat with Pre-filled Marketing Message"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="px-3 py-2 bg-slate-800 text-slate-500 rounded-xl text-xs font-bold cursor-not-allowed flex items-center gap-1"
                            title="No valid phone number available"
                          >
                            <MessageCircle className="w-4 h-4 text-slate-600" />
                            <span>No Phone</span>
                          </button>
                        )}

                        {/* EDIT BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(user, "submission")}
                          className="p-2 text-slate-400 hover:text-amber-300 rounded-xl hover:bg-slate-800 transition cursor-pointer"
                          title="Edit details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* DYNAMIC LICENSE MANAGEMENT MODAL */}
            {selectedUserForLicense && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-white">
                          ലൈസൻസ് മാനേജ്മെന്റ് (License Control)
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                          {selectedUserForLicense.name} ({selectedUserForLicense.regNo || "No RegNo"})
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedUserForLicense(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {licenseFeedback && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold text-center">
                      {licenseFeedback}
                    </div>
                  )}

                  {/* 1. STATUS SELECTION */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">
                      ലൈസൻസ് സ്റ്റാറ്റസ് (Status):
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setLicenseStatus("paid")}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                          licenseStatus === "paid"
                            ? "bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-950/50"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span>🟢 Paid</span>
                        <span className="text-[10px] opacity-80">പെയ്ഡ് ആക്ടീവ്</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLicenseStatus("trial")}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                          licenseStatus === "trial"
                            ? "bg-amber-600 border-amber-400 text-white shadow-md shadow-amber-950/50"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span>⏳ Free Trial</span>
                        <span className="text-[10px] opacity-80">ഫ്രീ അനുഭവം</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLicenseStatus("expired")}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                          licenseStatus === "expired"
                            ? "bg-rose-600 border-rose-400 text-white shadow-md shadow-rose-950/50"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span>🔴 Expired</span>
                        <span className="text-[10px] opacity-80">കാലഹരണപ്പെട്ടത്</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. PLAN SELECTION */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">
                      പ്ലാൻ (Plan / Module):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLicensePlan("bundle");
                          if (licenseAmountPaid === 9 || licenseAmountPaid === 49) setLicenseAmountPaid(149);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          licensePlan === "bundle"
                            ? "bg-purple-950/80 border-purple-400 text-white"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="text-xs font-black text-purple-300">🌟 All Apps Bundle</div>
                        <div className="text-[10px] text-slate-400">സീറ്റിംഗ് + റിസൾട്ട് + തർബിയ്യത്ത്</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLicensePlan("seating_only");
                          setLicenseAmountPaid(9);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          licensePlan === "seating_only"
                            ? "bg-emerald-950/80 border-emerald-400 text-white"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="text-xs font-black text-emerald-300">🪑 Seating Suite Only</div>
                        <div className="text-[10px] text-slate-400">സീറ്റിംഗ് & ഹാൾടിക്കറ്റ് (₹9 / ₹49)</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLicensePlan("result_only");
                          setLicenseAmountPaid(49);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          licensePlan === "result_only"
                            ? "bg-purple-950/80 border-purple-400 text-white"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="text-xs font-black text-purple-300">📊 Result Suite Only</div>
                        <div className="text-[10px] text-slate-400">പരീക്ഷാ ഫല മാനേജ്മെന്റ് (₹49 / ₹99)</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLicensePlan("tarbiyah_only");
                          setLicenseAmountPaid(49);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          licensePlan === "tarbiyah_only"
                            ? "bg-teal-950/80 border-teal-400 text-white"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="text-xs font-black text-teal-300">🤲 Tarbiyah Suite Only</div>
                        <div className="text-[10px] text-slate-400">നിരന്തര മൂല്യനിർണ്ണയം (₹49 / ₹99)</div>
                      </button>
                    </div>
                  </div>

                  {/* 3. DYNAMIC DURATION & EXPIRY */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">
                      കാലാവധി (Dynamic License Duration):
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "1 Month", months: 1 },
                        { label: "3 Months", months: 3 },
                        { label: "6 Months", months: 6 },
                        { label: "1 Year", months: 12 },
                      ].map((item) => (
                        <button
                          key={item.months}
                          type="button"
                          onClick={() => {
                            setLicenseDurationMonths(item.months);
                            const d = new Date();
                            d.setMonth(d.getMonth() + item.months);
                            setLicenseExpiresAt(d.toISOString().split("T")[0]);
                          }}
                          className={`p-2 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                            licenseDurationMonths === item.months
                              ? "bg-indigo-600 border-indigo-400 text-white"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. EXPIRY DATE & AMOUNT RECEIVED */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400">
                        കാലാവധി തിയ്യതി (Expiry Date):
                      </label>
                      <input
                        type="date"
                        value={licenseExpiresAt}
                        onChange={(e) => setLicenseExpiresAt(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400">
                        വാങ്ങിയ തുക (Amount Paid ₹):
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                        <input
                          type="number"
                          value={licenseAmountPaid}
                          onChange={(e) => setLicenseAmountPaid(Number(e.target.value))}
                          placeholder="e.g. 9, 49, 99, 149"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. NOTES */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">
                      കുറിപ്പ് (SuperAdmin Notes / Payment Reference):
                    </label>
                    <input
                      type="text"
                      value={licenseNotes}
                      onChange={(e) => setLicenseNotes(e.target.value)}
                      placeholder="e.g. GPay received, Special concession for new madrasa, etc."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* SAVE & CANCEL BUTTONS */}
                  <div className="pt-3 flex items-center gap-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedUserForLicense(null)}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      റദ്ദാക്കുക (Cancel)
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveLicense}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition shadow-lg shadow-emerald-950/40 cursor-pointer"
                    >
                      ലൈസൻസ് സേവ് ചെയ്യുക
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMPLETE ITEM PRICING & DESCRIPTION MANAGEMENT */}
        {activeTab === "commercial" && (
          <div className="space-y-6">
            
            {/* HEADER BANNER WITH ACTION BUTTONS */}
            <div className="bg-gradient-to-r from-purple-900/60 via-slate-900 to-indigo-900/60 border border-purple-500/30 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-3xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    SUPERADMIN PRICING ENGINE
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-3xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Instant Live Sync
                  </span>
                </div>
                <h3 className="font-black text-xl text-white pt-1">
                  📦 Direct Courier Order Package & Item Pricing Management
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl pt-1">
                  Customise the exact price (₹), Malayalam title, English title, and detailed descriptions for each product/service item in the Madrasa Direct Courier order modal. Add new items or adjust delivery rates.
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <button
                  onClick={handleResetDefaults}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  onClick={handleSavePricingConfig}
                  disabled={isSavingPricing}
                  className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingPricing ? "Publishing..." : "Save & Publish Pricing"}</span>
                </button>
              </div>
            </div>

            {/* SAVE SUCCESS NOTIFICATION */}
            {saveFeedback && (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-xs text-emerald-200 font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveFeedback}</span>
              </div>
            )}

            {/* GRID: ITEM LISTING & LIVE PREVIEW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN: ITEM EDITORS (7 COLS) */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* SECTION 1: PACKAGE ITEMS LIST */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                        <Tag className="w-4 h-4 text-purple-400" />
                        <span>Package Items & Service Pricing</span>
                      </h4>
                      <p className="text-3xs text-slate-400">
                        Edit prices, calculations (Fixed / Per Seat / Per Hall), and bilingual descriptions for each line item.
                      </p>
                    </div>

                    <button
                      onClick={handleAddNewItem}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Item</span>
                    </button>
                  </div>

                  {/* ITEM CARDS */}
                  <div className="space-y-4">
                    {pricingConfig.items.map((item, index) => (
                      <div
                        key={item.id || index}
                        className={`p-4 rounded-2xl border transition-all ${
                          item.enabled 
                            ? "bg-slate-950/80 border-purple-500/30 shadow-md" 
                            : "bg-slate-950/40 border-slate-800 opacity-60"
                        }`}
                      >
                        {/* ITEM TOP CONTROLS */}
                        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-mono font-bold text-xs flex items-center justify-center border border-purple-500/30">
                              #{index + 1}
                            </span>
                            <span className="font-extrabold text-sm text-white">
                              {item.nameMl || item.name}
                            </span>
                            {item.isMandatory && (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-3xs font-bold">
                                Default Included
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* ACTIVE TOGGLE */}
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-300">
                              <input
                                type="checkbox"
                                checked={item.enabled}
                                onChange={(e) => handleUpdateItem(index, { enabled: e.target.checked })}
                                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
                              />
                              <span className="text-3xs">{item.enabled ? "Active" : "Disabled"}</span>
                            </label>

                            {/* DELETE ITEM */}
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* ITEM FORM FIELDS */}
                        <div className="space-y-3 pt-3 text-xs">
                          
                          {/* NAMES IN MALAYALAM & ENGLISH */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-400 font-semibold mb-1 text-3xs">
                                🇮🇳 Malayalam Title (മലയാളം പേര്):
                              </label>
                              <input
                                type="text"
                                value={item.nameMl}
                                onChange={(e) => handleUpdateItem(index, { nameMl: e.target.value })}
                                placeholder="ഉദാഹരണത്തിന്: ഡെസ്ക് സ്റ്റിക്കറുകൾ"
                                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white font-medium focus:border-purple-500 outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-400 font-semibold mb-1 text-3xs">
                                🌐 English Title:
                              </label>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateItem(index, { name: e.target.value })}
                                placeholder="e.g. Standard Desk Seating Stickers"
                                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white font-medium focus:border-purple-500 outline-none"
                              />
                            </div>
                          </div>

                          {/* DESCRIPTIONS IN MALAYALAM & ENGLISH */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-400 font-semibold mb-1 text-3xs">
                                🇮🇳 Malayalam Description (മലയാളം വിവരണം):
                              </label>
                              <textarea
                                rows={2}
                                value={item.descriptionMl}
                                onChange={(e) => handleUpdateItem(index, { descriptionMl: e.target.value })}
                                placeholder="ഉദാഹരണത്തിന്: സ്റ്റാൻഡേർഡ് ഡെസ്ക് സ്റ്റിക്കറുകൾ..."
                                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white text-3xs font-medium focus:border-purple-500 outline-none resize-y"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-400 font-semibold mb-1 text-3xs">
                                🌐 English Description:
                              </label>
                              <textarea
                                rows={2}
                                value={item.description}
                                onChange={(e) => handleUpdateItem(index, { description: e.target.value })}
                                placeholder="e.g. Standard desk stickers with roll number and Arabic student name..."
                                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white text-3xs font-medium focus:border-purple-500 outline-none resize-y"
                              />
                            </div>
                          </div>

                          {/* PAPER & MATERIAL SPECIFICATIONS */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
                            <div>
                              <label className="block text-slate-400 font-semibold mb-1 text-3xs">
                                📄 Paper Type & GSM (English):
                              </label>
                              <input
                                type="text"
                                value={item.paperType || ""}
                                onChange={(e) => handleUpdateItem(index, { paperType: e.target.value })}
                                placeholder="e.g. 250 GSM Self-Adhesive Glossy Vinyl/Sticker Sheet"
                                className="w-full bg-slate-900 border border-slate-700 p-1.5 rounded-lg text-white font-medium text-xs focus:border-purple-500 outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-400 font-semibold mb-1 text-3xs">
                                📄 Paper Type & GSM (Malayalam):
                              </label>
                              <input
                                type="text"
                                value={item.paperTypeMl || ""}
                                onChange={(e) => handleUpdateItem(index, { paperTypeMl: e.target.value })}
                                placeholder="ഉദാ: 250 GSM ലാമിനേറ്റഡ് വാട്ടർപ്രൂഫ് ഗ്ലോസി സ്റ്റിക്കർ പേപ്പർ"
                                className="w-full bg-slate-900 border border-slate-700 p-1.5 rounded-lg text-white font-medium text-xs focus:border-purple-500 outline-none"
                              />
                            </div>
                          </div>

                          {/* PRICING CALCULATION & UNIT PRICE */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                            <div>
                              <label className="block text-slate-400 font-semibold mb-1 text-3xs">
                                Calculation Model:
                              </label>
                              <select
                                value={item.pricingType || "per_page"}
                                onChange={(e) => handleUpdateItem(index, { pricingType: e.target.value as any })}
                                className="w-full bg-slate-900 border border-slate-700 p-1.5 rounded-lg text-white font-medium text-xs focus:border-purple-500 outline-none"
                              >
                                <option value="per_page">📄 ₹ Per A4 Sheet / Page (Estimated)</option>
                                <option value="fixed">💰 Fixed Flat Rate (₹)</option>
                                <option value="per_student">👤 ₹ Per Student / Seat</option>
                                <option value="per_hall">🏫 ₹ Per Exam Hall</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-slate-400 font-semibold mb-1 text-3xs">
                                {item.pricingType === "per_page" 
                                  ? "Items Per A4 Sheet (ഷീറ്റിലെ എണ്ണം):" 
                                  : "Unit / Items Per Page:"}
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={item.itemsPerPage || 1}
                                onChange={(e) => handleUpdateItem(index, { itemsPerPage: Math.max(1, Number(e.target.value)) })}
                                placeholder="e.g. 4 for desk stickers"
                                className="w-full bg-slate-900 border border-slate-700 px-2 py-1.5 rounded-lg text-amber-300 font-mono font-bold text-xs focus:border-purple-500 outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-400 font-semibold mb-1 text-3xs">
                                {item.pricingType === "per_page"
                                  ? "Rate Per Sheet / Page (₹ / ഷീറ്റ്):"
                                  : item.pricingType === "per_student"
                                  ? "Rate Per Student (₹):"
                                  : item.pricingType === "per_hall"
                                  ? "Rate Per Hall (₹):"
                                  : "Flat Amount (₹):"}
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.pricePerPage ?? (item.price || item.unitPrice || 0)}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    handleUpdateItem(index, { price: val, unitPrice: val, pricePerPage: val });
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 pl-6 pr-2 py-1.5 rounded-lg text-emerald-400 font-mono font-bold text-xs focus:border-purple-500 outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* LIVE PAGE CALCULATION FORMULA PREVIEW */}
                          {item.pricingType === "per_page" && (
                            <div className="p-2 bg-purple-950/40 border border-purple-800/40 rounded-xl text-3xs text-purple-200 flex items-center justify-between">
                              <span>
                                💡 <strong>Live Formula:</strong> 100 Students = <strong>{Math.ceil(100 / (item.itemsPerPage || 1))} Sheets</strong> of {item.paperType || "Paper"} @ ₹{item.pricePerPage || item.price || 16}/sheet = <strong>₹{Math.ceil(100 / (item.itemsPerPage || 1)) * (item.pricePerPage || item.price || 16)}</strong>
                              </span>
                              <span className="font-mono bg-purple-900/60 px-1.5 py-0.5 rounded text-purple-300">
                                {item.itemsPerPage || 1} items / sheet
                              </span>
                            </div>
                          )}

                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION 2: COURIER DELIVERY & WHATSAPP CONFIG */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4">
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-sky-400" />
                    <span>Courier & Delivery Charge Configuration</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1 text-3xs">
                        Courier Delivery Fee (₹):
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                        <input
                          type="number"
                          value={pricingConfig.courierFee}
                          onChange={(e) => setPricingConfig({ ...pricingConfig, courierFee: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 pl-6 pr-3 py-2 rounded-xl text-emerald-400 font-mono font-bold text-xs focus:border-sky-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1 text-3xs">
                        WhatsApp Business Phone for Receiving Orders:
                      </label>
                      <input
                        type="text"
                        value={pricingConfig.whatsappSupportPhone}
                        onChange={(e) => setPricingConfig({ ...pricingConfig, whatsappSupportPhone: e.target.value })}
                        placeholder="e.g. 919847000000"
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white font-mono text-xs focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* COURIER DESCRIPTIONS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1 text-3xs">
                        Courier Title (Malayalam):
                      </label>
                      <input
                        type="text"
                        value={pricingConfig.courierTitleMl || ""}
                        onChange={(e) => setPricingConfig({ ...pricingConfig, courierTitleMl: e.target.value })}
                        placeholder="സ്പീഡ് പോസ്റ്റ് / കൊറിയർ ഡെലിവറി"
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white text-3xs focus:border-sky-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1 text-3xs">
                        Courier Title (English):
                      </label>
                      <input
                        type="text"
                        value={pricingConfig.courierTitle || ""}
                        onChange={(e) => setPricingConfig({ ...pricingConfig, courierTitle: e.target.value })}
                        placeholder="Speed Post / Courier Delivery"
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white text-3xs focus:border-sky-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SAVE BUTTON */}
                <button
                  onClick={handleSavePricingConfig}
                  disabled={isSavingPricing}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-xs transition shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingPricing ? "Publishing Changes to Cloud..." : "Save & Publish Pricing Changes"}</span>
                </button>

              </div>

              {/* RIGHT COLUMN: LIVE INTERACTIVE PREVIEW (5 COLS) */}
              <div className="lg:col-span-5 space-y-4">
                
                <div className="sticky top-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
                  
                  {/* PREVIEW CONTROLS */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-xs text-white">Live Madrasa Order Preview</span>
                    </div>

                    {/* LANGUAGE TOGGLE FOR PREVIEW */}
                    <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                      <button
                        onClick={() => setPreviewLang("ml")}
                        className={`px-2 py-0.5 rounded text-3xs font-bold transition ${
                          previewLang === "ml" ? "bg-purple-600 text-white" : "text-slate-400"
                        }`}
                      >
                        മലയാളം
                      </button>
                      <button
                        onClick={() => setPreviewLang("en")}
                        className={`px-2 py-0.5 rounded text-3xs font-bold transition ${
                          previewLang === "en" ? "bg-purple-600 text-white" : "text-slate-400"
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>

                  {/* SAMPLE SEATS / HALLS ADJUSTER */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-3xs">
                    <div>
                      <span className="text-slate-400">Sample Seats:</span>
                      <input
                        type="number"
                        min="1"
                        value={previewSeats}
                        onChange={(e) => setPreviewSeats(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white font-mono mt-0.5 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400">Sample Halls:</span>
                      <input
                        type="number"
                        min="1"
                        value={previewHalls}
                        onChange={(e) => setPreviewHalls(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white font-mono mt-0.5 font-bold"
                      />
                    </div>
                  </div>

                  {/* PREVIEW CONTAINER SIMULATING USTHAD MODAL */}
                  <div className="bg-white rounded-2xl p-4 text-slate-800 space-y-3 shadow-inner border border-slate-200">
                    
                    <div className="flex items-center gap-2 text-emerald-800">
                      <Truck className="w-5 h-5" />
                      <div>
                        <h5 className="font-extrabold text-xs leading-tight">
                          {previewLang === "ml" 
                            ? (pricingConfig.packageTitleMl || "നേരിട്ടുള്ള കൊറിയർ ഡെലിവറി ഓർഡർ") 
                            : (pricingConfig.packageTitle || "Direct Courier Delivery Order")}
                        </h5>
                        <p className="text-3xs text-emerald-600">
                          {previewLang === "ml" 
                            ? (pricingConfig.packageSubtitleMl || "ഡെസ്ക് സ്റ്റിക്കറുകളും ഹാൾ രജിസ്റ്ററുകളും മദ്റസയിലേക്ക് നേരിട്ട് എത്തിക്കുന്നു") 
                            : (pricingConfig.packageSubtitle || "Standard desk stickers and door attendance registers delivered directly")}
                        </p>
                      </div>
                    </div>

                    {/* PRICING BREAKDOWN PREVIEW */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-emerald-950 font-extrabold text-xs">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          {previewLang === "ml" ? "പാക്കേജ് തുക വിവരങ്ങൾ" : "Package Summary"}
                        </span>
                        <span className="font-mono text-emerald-700 font-black">
                          ₹{
                            pricingConfig.items.filter(i => i.enabled).reduce((sum, it) => {
                              if (it.pricingType === "per_student") return sum + (it.unitPrice * previewSeats);
                              if (it.pricingType === "per_hall") return sum + (it.unitPrice * previewHalls);
                              return sum + (it.price || it.unitPrice || 0);
                            }, 0) + Number(pricingConfig.courierFee || 80)
                          }
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1 border-t border-emerald-200 text-3xs">
                        {pricingConfig.items.filter(i => i.enabled).map((item) => {
                          const itemPrice = item.pricingType === "per_student"
                            ? item.unitPrice * previewSeats
                            : item.pricingType === "per_hall"
                            ? item.unitPrice * previewHalls
                            : (item.price || item.unitPrice || 0);

                          const title = previewLang === "ml" ? (item.nameMl || item.name) : item.name;
                          const desc = previewLang === "ml" ? (item.descriptionMl || item.description) : item.description;

                          return (
                            <div key={item.id} className="p-1.5 bg-white/90 rounded-lg border border-emerald-200/80">
                              <div className="flex items-start justify-between">
                                <div className="font-bold text-slate-900">
                                  ✓ {title}
                                </div>
                                <span className="font-mono font-bold text-emerald-800">₹{itemPrice}</span>
                              </div>
                              {desc && (
                                <p className="text-3xs text-slate-500 pt-0.5 leading-snug">{desc}</p>
                              )}
                            </div>
                          );
                        })}

                        {/* COURIER ROW */}
                        <div className="flex items-center justify-between p-1.5 bg-white/90 rounded-lg border border-emerald-200/80 font-bold text-emerald-950">
                          <div>
                            <span>✓ {previewLang === "ml" ? (pricingConfig.courierTitleMl || "സ്പീഡ് പോസ്റ്റ് / കൊറിയർ ഡെലിവറി") : (pricingConfig.courierTitle || "Speed Post / Courier Delivery")}</span>
                            {pricingConfig.courierDescMl && (
                              <p className="text-3xs text-slate-500 font-normal">
                                {previewLang === "ml" ? pricingConfig.courierDescMl : (pricingConfig.courierDesc || "")}
                              </p>
                            )}
                          </div>
                          <span className="font-mono text-emerald-800">₹{pricingConfig.courierFee}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl text-3xs text-slate-500 text-center font-medium">
                      {previewLang === "ml" 
                        ? "ഉസ്താദുമാർക്ക് ഈ തുകയും ഡിസ്ക്രിപ്ഷനുമാണ് ഓർഡർ ഫോമിൽ കാണിക്കുക." 
                        : "This is the live pricing layout Usthad users will see when ordering."}
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB: SYSTEM & WHATSAPP / GPAY SETTINGS */}
        {activeTab === "system_settings" && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-emerald-400" />
                    <span>സിസ്റ്റം, വാട്സ്ആപ്പ് & പേയ്മെന്റ് ക്രമീകരണങ്ങൾ</span>
                  </h3>
                  <p className="text-xs text-slate-400 pt-0.5">
                    SuperAdmin-ന് സോഫ്റ്റ്‌വെയറിന്റെ വാട്സ്ആപ്പ് നമ്പർ, GPay UPI ID, പേര്, വില കാണിക്കണോ വേണ്ടയോ എന്നിവ ഇവിടെ നിന്ന് തത്സമയം മാറ്റാം.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAuditModalOpen(true)}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>ഡാറ്റാബേസ് പരിശോധിക്കുക (Audit)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSystemConfig}
                    disabled={isSavingSystemConfig}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingSystemConfig ? "സേവ് ചെയ്യുന്നു..." : "സേവ് ചെയ്യുക (Save Config)"}</span>
                  </button>
                </div>
              </div>

              {systemConfigFeedback && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-300 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{systemConfigFeedback}</span>
                </div>
              )}

              {/* APP MODULES VISIBILITY & MAINTENANCE CONTROLLER (User Requested Core Feature) */}
              <div className="bg-slate-950/90 border border-emerald-500/40 p-5 sm:p-6 rounded-3xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-700/50">
                        <Layers className="w-4 h-4" />
                      </span>
                      <h4 className="font-extrabold text-base text-white">
                        സ്യൂട്ട് ആപ്പ് വിസിബിലിറ്റി & മെയിന്റനൻസ് കൺട്രോളർ (App Modules Visibility Control)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      പൂർത്തിയാവാത്ത ആപ്പുകൾ പബ്ലിക്കിൽ നിന്ന് മറച്ചുവെക്കാനോ 'നിർമ്മാണത്തിലാണ്' (Under Maintenance) ആക്കാനോ ഇവിടെ നിയന്ത്രിക്കാം.
                    </p>
                  </div>

                  {/* QUICK PRESETS */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const updatedModules = {
                          seating: { ...(systemConfig.appModulesStatus?.seating || defaultAppModulesStatus.seating), status: "active" as AppVisibilityStatus },
                          result: { ...(systemConfig.appModulesStatus?.result || defaultAppModulesStatus.result), status: "maintenance" as AppVisibilityStatus, statusNoticeMl: "പരീക്ഷാ ഫല മാനേജ്‌മെന്റ് സിസ്റ്റം നിർമ്മാണത്തിലാണ്. ഉടൻ തന്നെ ലഭ്യമാകും." },
                          tarbiyah: { ...(systemConfig.appModulesStatus?.tarbiyah || defaultAppModulesStatus.tarbiyah), status: "maintenance" as AppVisibilityStatus, statusNoticeMl: "തർബിയ്യത്ത് നിരന്തര മൂല്യനിർണ്ണയ ആപ്പ് നിർമ്മാണത്തിലാണ്. ഉടൻ തന്നെ ലഭ്യമാകും." }
                        };
                        const updatedConfig = { ...systemConfig, appModulesStatus: updatedModules };
                        setSystemConfig(updatedConfig);
                        handleSaveSystemConfig(updatedConfig);
                      }}
                      className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="സീറ്റിംഗ് ആപ്പ് മാത്രം പബ്ലിക്കാക്കി ബാക്കി രണ്ടും നിർമ്മാണത്തിലാക്കുക"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>സീറ്റിംഗ് മാത്രം ലൈവ് (ബാക്കി രണ്ടും നിർമ്മാണത്തിൽ)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const updatedModules = {
                          seating: { ...(systemConfig.appModulesStatus?.seating || defaultAppModulesStatus.seating), status: "active" as AppVisibilityStatus },
                          result: { ...(systemConfig.appModulesStatus?.result || defaultAppModulesStatus.result), status: "active" as AppVisibilityStatus },
                          tarbiyah: { ...(systemConfig.appModulesStatus?.tarbiyah || defaultAppModulesStatus.tarbiyah), status: "active" as AppVisibilityStatus }
                        };
                        const updatedConfig = { ...systemConfig, appModulesStatus: updatedModules };
                        setSystemConfig(updatedConfig);
                        handleSaveSystemConfig(updatedConfig);
                      }}
                      className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>3 ആപ്പുകളും ലൈവാക്കുക (All 3 Live)</span>
                    </button>
                  </div>
                </div>

                {/* 3 APP MODULE CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(["seating", "result", "tarbiyah"] as AppModuleKey[]).map((key) => {
                    const currentMod = systemConfig.appModulesStatus?.[key] || defaultAppModulesStatus[key];
                    const isSeating = key === "seating";
                    const isResult = key === "result";

                    return (
                      <div
                        key={key}
                        className={`bg-slate-900 border ${
                          currentMod.status === "active" 
                            ? "border-emerald-600/50" 
                            : (currentMod.status === "hidden" ? "border-slate-700 opacity-80" : "border-amber-600/50")
                        } rounded-2xl p-4 space-y-3 flex flex-col justify-between`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white">
                              {isSeating ? "ആപ്പ് 1 • സീറ്റിംഗ്" : (isResult ? "ആപ്പ് 2 • റിസൾട്ട്" : "ആപ്പ് 3 • തർബിയ്യത്ത്")}
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              currentMod.status === "active"
                                ? "bg-emerald-950 text-emerald-300 border-emerald-600/40"
                                : (currentMod.status === "hidden" 
                                    ? "bg-slate-800 text-slate-300 border-slate-600" 
                                    : "bg-amber-950 text-amber-300 border-amber-600/40")
                            }`}>
                              {currentMod.status === "active" && "🟢 സജീവം (Live)"}
                              {currentMod.status === "coming_soon" && "⏳ ഉടൻ ലഭ്യമാകും"}
                              {currentMod.status === "maintenance" && "🛠️ നിർമ്മാണത്തിൽ"}
                              {currentMod.status === "hidden" && "👁️‍🗨️ മറച്ചിരിക്കുന്നു"}
                            </span>
                          </div>

                          <h5 className="font-extrabold text-sm text-slate-100">
                            {currentMod.nameMl}
                          </h5>

                          {/* STATUS SELECTOR */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">
                              പബ്ലിക് അവസ്ഥ (Public Visibility):
                            </label>
                            <select
                              value={currentMod.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as AppVisibilityStatus;
                                const updatedModules = {
                                  ...(systemConfig.appModulesStatus || defaultAppModulesStatus),
                                  [key]: {
                                    ...currentMod,
                                    status: newStatus
                                  }
                                };
                                setSystemConfig({
                                  ...systemConfig,
                                  appModulesStatus: updatedModules
                                });
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="active">🟢 സജീവം (Active / Public Access)</option>
                              <option value="coming_soon">⏳ ഉടൻ ലഭ്യമാകും (Coming Soon Notice)</option>
                              <option value="maintenance">🛠️ നിർമ്മാണത്തിലാണ് (Under Maintenance)</option>
                              <option value="hidden">👁️‍🗨️ പൂർണ്ണമായി മറച്ചുവെക്കുക (Hidden from Public)</option>
                            </select>
                          </div>

                          {/* STATUS NOTICE INPUT */}
                          {currentMod.status !== "active" && (
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                                യൂസർമാർ കാണേണ്ട കുറിപ്പ് (Notice message):
                              </label>
                              <textarea
                                rows={2}
                                value={currentMod.statusNoticeMl || ""}
                                onChange={(e) => {
                                  const updatedModules = {
                                    ...(systemConfig.appModulesStatus || defaultAppModulesStatus),
                                    [key]: {
                                      ...currentMod,
                                      statusNoticeMl: e.target.value
                                    }
                                  };
                                  setSystemConfig({
                                    ...systemConfig,
                                    appModulesStatus: updatedModules
                                  });
                                }}
                                placeholder="ഉദാ: ഈ ആപ്പ് നിർമ്മാണത്തിലാണ്. ഉടൻ ലഭ്യമാകും."
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          )}
                        </div>

                        <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-800">
                          {currentMod.status === "active" && "പൊതുജനങ്ങൾക്ക് പൂർണ്ണമായി ഉപയോഗിക്കാം."}
                          {currentMod.status === "coming_soon" && "കാർഡ് കാണിക്കും, ക്ലിക്ക് ചെയ്താൽ അറിയിപ്പ് ലഭിക്കും."}
                          {currentMod.status === "maintenance" && "നിർമ്മാണ പ്രവർത്തനങ്ങൾ നടക്കുന്നു എന്ന അറിയിപ്പ് കാണിക്കും."}
                          {currentMod.status === "hidden" && "ലാൻഡിംഗ് പേജിൽ നിന്നോ ലിങ്കുകളിൽ നിന്നോ പൂർണ്ണമായി മറച്ചു."}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ARCHITECTURAL GUARANTEE & RESTORE FAQ */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-extrabold text-emerald-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>ഡാറ്റാബേസ് സുരക്ഷാ ഗ്യാരണ്ടി & ബാക്കപ്പ് / റീസ്റ്റോർ മാർഗ്ഗനിർദ്ദേശം:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-slate-300">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                        <span>1. ഇത് ഡാറ്റാബേസിനെ ബാധിക്കുമോ?</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        <strong className="text-emerald-400">ഇല്ല, ഒട്ടും ബാധിക്കില്ല!</strong> ആപ്പുകൾ മറച്ചുവെക്കുന്നത് ഫ്രണ്ട്-എൻഡിൽ മാത്രമാണ്. ഫയർബേസ് ക്ലൗഡ് ഡാറ്റാബേസിലെ വിദ്യാർത്ഥികളോ മാർക്കുകളോ സീറ്റുകളോ ഒന്നും ഡിലീറ്റ് ആവില്ല.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                        <span>2. പിന്നീട് ഡാറ്റ നഷ്ടപ്പെടുമോ?</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        <strong className="text-emerald-400">ഡാറ്റ സുരക്ഷിതമാണ്.</strong> മാസങ്ങളോളം ഉപയോഗിച്ച് ലക്ഷക്കണക്കിന് വിവരങ്ങൾ വന്നാലും സോഫ്റ്റ്‌വെയറിലെ പുതിയ അപ്‌ഡേറ്റുകൾ പഴയ ഡാറ്റയെ പിന്തുണയ്ക്കുന്ന (Backward Compatible) രീതിയിലാണ് നിർമ്മിച്ചിട്ടുള്ളത്.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                        <span>3. ബാക്കപ്പും റീസ്റ്റോറും (Restore)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        ബാക്കപ്പ് JSON ഫയലായി ഡൗൺലോഡ് ചെയ്യപ്പെടുന്നു. പിന്നീട് റീസ്റ്റോർ ചെയ്യുമ്പോൾ സിസ്റ്റം ഫയൽ വാലിഡേഷൻ നടത്തിയ ശേഷം പൂർണ്ണമായി പഴയപടി തിരിച്ചു കൊണ്ടുവരും.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* CONTACT & APP IDENTITY */}
                <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                  <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                    <PhoneCall className="w-4 h-4" />
                    <span>Contact & Software Identity</span>
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1 text-[11px]">
                        Software Name (സോഫ്റ്റ്‌വെയർ പേര്):
                      </label>
                      <input
                        type="text"
                        value={systemConfig.appName}
                        onChange={(e) => setSystemConfig({ ...systemConfig, appName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1 text-[11px]">
                        Official Support & Order WhatsApp Number (വാട്സ്ആപ്പ് ചാറ്റ് & ഓർഡർ നമ്പർ):
                      </label>
                      <input
                        type="text"
                        value={systemConfig.adminWhatsApp}
                        onChange={(e) => setSystemConfig({ ...systemConfig, adminWhatsApp: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-emerald-400 font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. 9876543210"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        ഹോം പേജിലെ 'വാട്സാപ്പിൽ ചാറ്റ് ചെയ്യുക' ബട്ടണിലും ഓർഡറുകളിലും ഈ നമ്പറിലേക്കാണ് ചാറ്റ് തുറക്കുക. (നമ്പർ പരസ്യമായി പേജിൽ കാണിക്കില്ല)
                      </p>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1 text-[11px]">
                        Admin Calling Phone (വിളിക്കാനുള്ള നമ്പർ):
                      </label>
                      <input
                        type="text"
                        value={systemConfig.adminPhone}
                        onChange={(e) => setSystemConfig({ ...systemConfig, adminPhone: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-white font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="9633465267"
                      />
                    </div>
                  </div>
                </div>

                {/* GPAY & UPI QR SETTINGS */}
                <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                  <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    <span>Google Pay / UPI Payment Settings</span>
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1 text-[11px]">
                        GPay / UPI ID (ഗൂഗിൾ പേ UPI ഐഡി):
                      </label>
                      <input
                        type="text"
                        value={systemConfig.gpayUpiId}
                        onChange={(e) => setSystemConfig({ ...systemConfig, gpayUpiId: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-amber-400 font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="9633465267@okbizaxis"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1 text-[11px]">
                        Payee Name (അക്കൗണ്ട് ഉടമയുടെ പേര്):
                      </label>
                      <input
                        type="text"
                        value={systemConfig.payeeName}
                        onChange={(e) => setSystemConfig({ ...systemConfig, payeeName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Seat manager ai studio"
                      />
                    </div>

                    {/* LIVE QR CODE PREVIEW */}
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-3">
                      <div className="bg-white p-1.5 rounded-lg shrink-0">
                        <img
                          src={getUpiPaymentDetails(systemConfig).qrCodeUrl}
                          alt="Live GPay QR"
                          className="w-16 h-16"
                        />
                      </div>
                      <div className="text-[11px] text-slate-300">
                        <div className="font-bold text-emerald-400">Live Dynamic QR Code</div>
                        <div className="font-mono text-slate-400 text-[10px]">{systemConfig.gpayUpiId}</div>
                        <div className="text-[10px] text-slate-500">യൂസർമാർക്ക് സ്കാൻ ചെയ്യാൻ തത്സമയം ലഭ്യമാണ്.</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* PRICING VISIBILITY TOGGLE */}
              <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>പ്രിന്റിംഗ് വില വിവരങ്ങൾ ആപ്പിൽ കാണിക്കണോ? (Pricing Visibility in UI)</span>
                    </h4>
                    <p className="text-xs text-slate-400 pt-0.5">
                      വില ആപ്പിൽ കാണിക്കേണ്ടതില്ലെങ്കിൽ (WhatsApp വഴി സംസാരിച്ച് തീരുമാനിക്കാം) ഇത് ഓഫ് ചെയ്യുക.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSystemConfig({ ...systemConfig, showPricingInUI: !systemConfig.showPricingInUI })}
                    className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer ${
                      systemConfig.showPricingInUI
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {systemConfig.showPricingInUI ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-emerald-300" />
                        <span>വില കാണിക്കുന്നുണ്ട് (Pricing Visible)</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-slate-500" />
                        <span>വില മറച്ചിരിക്കുന്നു (Hidden - WhatsApp Deal)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* CUSTOM NOTICE / ANNOUNCEMENT */}
              <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl space-y-3">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  <span>WhatsApp & Banner Announcement (പ്രത്യേക അറിയിപ്പ്)</span>
                </h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Malayalam Notice:</label>
                    <input
                      type="text"
                      value={systemConfig.orderNoticeMl || ""}
                      onChange={(e) => setSystemConfig({ ...systemConfig, orderNoticeMl: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-white outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">English Notice:</label>
                    <input
                      type="text"
                      value={systemConfig.orderNotice || ""}
                      onChange={(e) => setSystemConfig({ ...systemConfig, orderNotice: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-white outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* SUPER ADMIN MANAGEMENT SECTION */}
              <div className="bg-slate-950/70 border border-purple-500/40 p-5 sm:p-6 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="font-extrabold text-base text-white flex items-center gap-2">
                      <span className="p-1.5 bg-purple-950 text-purple-400 rounded-lg border border-purple-800/50">
                        <Shield className="w-4 h-4" />
                      </span>
                      <span>🛡️ സൂപ്പർ അഡ്മിൻ മാനേജ്മെന്റ് (Super Admin Access Control)</span>
                    </h4>
                    <p className="text-xs text-slate-400 pt-0.5">
                      മറ്റ് സൂപ്പർ അഡ്മിൻമാരെ ആഡ് ചെയ്യാനും ഒഴിവാക്കാനും ഇവിടെ സാധിക്കും. (Add or remove authorized Super Admins)
                    </p>
                  </div>
                  <span className="text-[11px] bg-purple-950 text-purple-300 font-bold px-2.5 py-1 rounded-full border border-purple-800/50 self-start sm:self-center">
                    Authorized Admins
                  </span>
                </div>

                {/* FEEDBACK NOTICE */}
                {superAdminFeedback && (
                  <div className="p-3 bg-purple-950/80 border border-purple-500/50 rounded-xl text-purple-200 font-bold text-xs">
                    {superAdminFeedback}
                  </div>
                )}

                {/* CURRENT ACTIVE SUPER ADMINS LIST */}
                <div className="space-y-2">
                  <label className="block text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                    നിലവിലെ സൂപ്പർ അഡ്മിൻമാർ (CURRENT SUPER ADMINS):
                  </label>

                  <div className="grid grid-cols-1 gap-2">
                    {(systemConfig.superAdmins && systemConfig.superAdmins.length > 0 
                      ? systemConfig.superAdmins 
                      : getSuperAdminList()
                    ).map((admin) => {
                      const isRoot = admin.isRoot || admin.email.toLowerCase() === "edavachalniyas@gmail.com";

                      return (
                        <div
                          key={admin.email}
                          className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isRoot 
                                ? "bg-amber-950 text-amber-300 border border-amber-600/50" 
                                : "bg-purple-950 text-purple-300 border border-purple-700/50"
                            }`}>
                              {isRoot ? "👑" : "SA"}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-white truncate">{admin.name || admin.email}</span>
                                {isRoot ? (
                                  <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-600/40 shrink-0">
                                    പ്രൈമറി റൂട്ട് അഡ്മിൻ
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded-full font-bold border border-purple-700/40 shrink-0">
                                    സൂപ്പർ അഡ്മിൻ
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 truncate">
                                {admin.email}
                              </div>
                            </div>
                          </div>

                          <div>
                            {isRoot ? (
                              <span className="text-[10px] text-slate-500 font-bold px-2 py-1 bg-slate-950 rounded-lg border border-slate-800">
                                സുരക്ഷിതം (Protected)
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRemoveSuperAdmin(admin.email)}
                                className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-700/50 rounded-lg font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                                <span>ഒഴിവാക്കുക (Remove)</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* FORM TO ADD NEW SUPER ADMIN */}
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3 pt-3">
                  <h5 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                    <span>പുതിയ സൂപ്പർ അഡ്മിനെ ചേർക്കുക (Add New Super Admin)</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                        ഇമെയിൽ വിലാസം (Email Address) *:
                      </label>
                      <input
                        type="email"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="newadmin@example.com"
                        className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white font-mono outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                        പേര് (Name / Title):
                      </label>
                      <input
                        type="text"
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                        placeholder="ഉദാ: മുജീബ് ഉസ്താദ് (Admin)"
                        className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddSuperAdmin}
                      disabled={isAddingSuperAdmin}
                      className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-extrabold rounded-xl text-xs transition shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isAddingSuperAdmin ? "ചേർക്കുന്നു..." : "സൂപ്പർ അഡ്മിനായി ചേർക്കുക (+ Add Admin)"}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* ACCOUNTS TEAM MANAGEMENT SECTION */}
              <div className="bg-slate-950/70 border border-emerald-500/40 p-5 sm:p-6 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="font-extrabold text-base text-white flex items-center gap-2">
                      <span className="p-1.5 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-800/50">
                        <Users className="w-4 h-4" />
                      </span>
                      <span>💳 അക്കൗണ്ട്സ് ടീം മാനേജ്മെന്റ് (Accounts Team & WhatsApp Payment Approval)</span>
                    </h4>
                    <p className="text-xs text-slate-400 pt-0.5">
                      യൂസർമാർ WhatsApp വഴി പണമടച്ച് അയക്കുമ്പോൾ വെരിഫൈ ചെയ്ത് ലൈസൻസ് ആക്ടിവേറ്റ് ചെയ്യാൻ അക്കൗണ്ട്സ് ടീം അംഗങ്ങളെ ഇവിടെ ചുമതലപ്പെടുത്താം.
                    </p>
                  </div>
                  <span className="text-[11px] bg-emerald-950 text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-800/50 self-start sm:self-center">
                    {(systemConfig.accountsUsers && systemConfig.accountsUsers.length) || getAccountsUsersList().length} Accounts Staff
                  </span>
                </div>

                {/* ACCOUNTS FEEDBACK NOTICE */}
                {accountsFeedback && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 font-bold text-xs">
                    {accountsFeedback}
                  </div>
                )}

                {/* CURRENT ACTIVE ACCOUNTS USERS LIST */}
                <div className="space-y-2">
                  <label className="block text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                    നിലവിലെ അക്കൗണ്ട്സ് ടീം അംഗങ്ങൾ (CURRENT ACCOUNTS TEAM):
                  </label>

                  <div className="grid grid-cols-1 gap-2">
                    {(systemConfig.accountsUsers && systemConfig.accountsUsers.length > 0 
                      ? systemConfig.accountsUsers 
                      : getAccountsUsersList()
                    ).map((acc) => (
                      <div
                        key={acc.email}
                        className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700/50 flex items-center justify-center font-black text-xs shrink-0">
                            💳
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white truncate">{acc.name || acc.email}</span>
                              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-700/40 shrink-0">
                                അക്കൗണ്ട്സ് ടീം
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 truncate flex items-center gap-2">
                              <span>{acc.email}</span>
                              {acc.phone && <span>• 📱 {acc.phone}</span>}
                            </div>
                          </div>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAccountsUser(acc.email)}
                            className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-700/50 rounded-lg font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>ഒഴിവാക്കുക</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FORM TO ADD NEW ACCOUNTS TEAM MEMBER */}
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3 pt-3">
                  <h5 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>പുതിയ അക്കൗണ്ട്സ് ടീം അംഗത്തെ ചേർക്കുക (Assign Accounts Staff)</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                        ഇമെയിൽ വിലാസം (Email) *:
                      </label>
                      <input
                        type="email"
                        value={newAccountsEmail}
                        onChange={(e) => setNewAccountsEmail(e.target.value)}
                        placeholder="accounts@example.com"
                        className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                        പേര് (Staff Name):
                      </label>
                      <input
                        type="text"
                        value={newAccountsName}
                        onChange={(e) => setNewAccountsName(e.target.value)}
                        placeholder="ഉദാ: അർഷാദ് (Accounts)"
                        className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                        ഫോൺ / വാട്സ്ആപ്പ്:
                      </label>
                      <input
                        type="text"
                        value={newAccountsPhone}
                        onChange={(e) => setNewAccountsPhone(e.target.value)}
                        placeholder="9847123456"
                        className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddAccountsUser}
                      disabled={isAddingAccountsUser}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isAddingAccountsUser ? "ചേർക്കുന്നു..." : "+ അക്കൗണ്ട്സ് ടീമിലേക്ക് ചേർക്കുക"}</span>
                    </button>
                  </div>
                </div>

              </div>


            </div>
          </div>
        )}

        {/* TAB: REGISTERED PARTNERS */}
        {activeTab === "partners" && (
          <div className="space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <span>🤝 രജിസ്റ്റർ ചെയ്ത പാർട്ണേഴ്സ് ({partners.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400 pt-0.5">
                    പ്രിന്റിംഗ്, ഡിസൈനിംഗ്, ഇൻസ്റ്റലേഷൻ എന്നിവ ഏറ്റെടുത്ത് നടത്തുന്ന പ്രാദേശിക പ്രതിനിധികൾ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchAdminData}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {partners.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                  ഇതുവരെ പുതിയ പാർട്ണർ രജിസ്ട്രേഷനുകൾ ഒന്നും ലഭിച്ചിട്ടില്ല.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partners.map((partner: any, idx: number) => {
                    const cleanPhone = (partner.phone || "").replace(/[^0-9]/g, "");
                    return (
                      <div
                        key={partner.id || idx}
                        className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3 hover:border-indigo-500/50 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-extrabold text-base text-white flex items-center gap-2">
                              <span>{partner.name}</span>
                              {partner.businessName && (
                                <span className="text-xs text-indigo-400 font-normal">({partner.businessName})</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 font-mono">
                              📍 {partner.district || "Kerala"} • {partner.place || "Local"}
                            </div>
                          </div>

                          <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800/60 rounded-md text-[10px] font-bold">
                            {partner.profession || "Partner"}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1 text-slate-300">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Phone / WhatsApp:</span>
                            <span className="font-mono font-bold text-white">{partner.phone}</span>
                          </div>
                          {partner.targetMadrasas && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Expected Madrasas:</span>
                              <span className="font-bold text-emerald-400">{partner.targetMadrasas} Madrasas</span>
                            </div>
                          )}
                          {partner.registeredAt && (
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                              <span>Applied Date:</span>
                              <span>{new Date(partner.registeredAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {partner.notes && (
                          <p className="text-[11px] text-slate-400 italic">
                            "{partner.notes}"
                          </p>
                        )}

                        <div className="pt-2 flex items-center gap-2">
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                              `Assalamu Alaikum ${partner.name},\nRegarding your partner registration with Seat manager ai studio. Let's discuss onboarding and wholesale print fulfillment!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>WhatsApp Chat</span>
                          </a>

                          <a
                            href={`tel:${cleanPhone}`}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: REAL DYNAMIC WORKSPACE & ECOSYSTEM ANALYTICS */}
        {activeTab === "analytics" && (() => {
          const totalMadrasas = crmUsers.length || submissions.length;
          const totalStudents = crmUsers.reduce((sum, u) => sum + (u.studentCount || 0), 0);
          
          let paidCount = 0;
          let expiredCount = 0;
          let trialCount = 0;

          const now = new Date();
          const processedKeys = new Set<string>();

          (Object.values(licensesMap) as MadrasaLicense[]).forEach(lic => {
            if (!lic || !lic.madrasaId || processedKeys.has(lic.madrasaId)) return;
            processedKeys.add(lic.madrasaId);
            if (lic.status === "paid") {
              if (lic.expiresAt && new Date(lic.expiresAt) < now) {
                expiredCount++;
              } else {
                paidCount++;
              }
            } else if (lic.status === "expired") {
              expiredCount++;
            } else {
              trialCount++;
            }
          });

          // Unlicensed CRM users default to trial
          crmUsers.forEach(u => {
            const key = u.id || u.regNo || u.name;
            if (!processedKeys.has(key) && (!u.regNo || !processedKeys.has(u.regNo)) && (!u.name || !processedKeys.has(u.name))) {
              trialCount++;
            }
          });

          const totalOrders = orders.length;
          const fulfilledOrders = orders.filter(o => o.status === "Delivered" || o.status === "Dispatched").length;
          const pendingOrders = orders.filter(o => o.status === "Pending" || o.status === "Processing").length;
          
          const licenseRevenue = (Object.values(licensesMap) as MadrasaLicense[]).reduce((sum, l) => sum + (l?.amountPaid || 0), 0);
          const ordersRevenue = orders.reduce((sum, o) => sum + (Number(o.totalPrice || o.amount || 0)), 0);
          const totalRevenue = licenseRevenue + ordersRevenue;

          const activeBoardsCount = timetables.length;

          return (
            <div className="space-y-6">
              {/* HEADER BANNER */}
              <div className="bg-gradient-to-r from-purple-900/80 via-slate-900 to-indigo-900/80 border border-purple-500/30 rounded-3xl p-6 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-3xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      LIVE PLATFORM ANALYTICS
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>Real-time Computed</span>
                    </span>
                  </div>
                  <button
                    onClick={fetchAdminData}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Stats</span>
                  </button>
                </div>
                <h3 className="font-black text-xl text-white">
                  📊 തത്സമയ സിസ്റ്റം പ്രകടന റിപ്പോർട്ട് (Platform Activity & Metrics)
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl">
                  നിങ്ങളുടെ മദ്രസ സീറ്റിംഗ് മാനേജറിലെ യഥാർത്ഥ വിവരങ്ങളിൽ നിന്ന് നേരിട്ട് തത്സമയം കണക്കാക്കിയ ആക്റ്റിവിറ്റി സമറി.
                </p>
              </div>

              {/* TOP LEVEL KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                    <span>രജിസ്റ്റർ ചെയ്ത മദ്രസകൾ</span>
                    <Building className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-3xl font-black text-white font-mono">{totalMadrasas}</div>
                  <p className="text-[11px] text-purple-300 font-semibold">Total Active Institutions</p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                    <span>സീറ്റിംഗ് കാർഡുകൾ (വിദ്യാർത്ഥികൾ)</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-emerald-400 font-mono">{totalStudents.toLocaleString()}</div>
                  <p className="text-[11px] text-emerald-300/80 font-semibold">Total Students Allocated</p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                    <span>പ്രിന്റിംഗ് & കുറിയർ ഓർഡറുകൾ</span>
                    <Truck className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-3xl font-black text-sky-400 font-mono">{totalOrders}</div>
                  <p className="text-[11px] text-sky-300/80 font-semibold">{pendingOrders} Pending • {fulfilledOrders} Delivered</p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                    <span>ആകെ ശേഖരിച്ച വരുമാനം (Revenue)</span>
                    <DollarSign className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-amber-300 font-mono">₹{totalRevenue.toLocaleString()}</div>
                  <p className="text-[11px] text-amber-400/80 font-semibold">₹{licenseRevenue} Lic + ₹{ordersRevenue} Orders</p>
                </div>
              </div>

              {/* DETAILED STATS SECTIONS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* LICENSE DISTRIBUTION */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <span>ലൈസൻസ് വിതരണം (License Breakdown)</span>
                    </h4>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {paidCount + trialCount + expiredCount} Total Records
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-2xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-emerald-300">🟢 Paid Active Licenses</div>
                        <div className="text-[10px] text-slate-400">പെയ്ഡ് സബ്‌സ്‌ക്രിപ്‌ഷൻ എടുത്തവർ</div>
                      </div>
                      <span className="text-lg font-black font-mono text-emerald-400">{paidCount}</span>
                    </div>

                    <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-2xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-amber-300">⏳ Free Experience (Trial)</div>
                        <div className="text-[10px] text-slate-400">സൗജന്യ ഫീച്ചറുകൾ ഉപയോഗിക്കുന്നവർ</div>
                      </div>
                      <span className="text-lg font-black font-mono text-amber-400">{trialCount}</span>
                    </div>

                    <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-2xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-rose-300">🔴 Expired Licenses</div>
                        <div className="text-[10px] text-slate-400">കാലഹരണപ്പെട്ട അക്കൗണ്ടുകൾ</div>
                      </div>
                      <span className="text-lg font-black font-mono text-rose-400">{expiredCount}</span>
                    </div>
                  </div>
                </div>

                {/* TIMETABLE & SYSTEM HEALTH */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-sky-400" />
                      <span>ടൈംടേബിൾ & ബോർഡ് സ്റ്റാറ്റിസ്റ്റിക്സ് (Timetables & System)</span>
                    </h4>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {activeBoardsCount} Published Boards
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">പബ്ലിഷ് ചെയ്ത ബോർഡ് ടൈംടേബിളുകൾ</div>
                        <div className="text-[10px] text-slate-400">സൂപ്പർ അഡ്മിൻ സ്ഥിരീകരിച്ച ഔദ്യോഗിക പരീക്ഷാ ടൈംടേബിളുകൾ</div>
                      </div>
                      <span className="text-lg font-black font-mono text-sky-400">{activeBoardsCount}</span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">രജിസ്റ്റർ ചെയ്ത പാർട്ണർമാർ</div>
                        <div className="text-[10px] text-slate-400">പ്രാദേശിക പ്രിന്റിംഗ് & ഇൻസ്റ്റലേഷൻ പ്രതിനിധികൾ</div>
                      </div>
                      <span className="text-lg font-black font-mono text-indigo-400">{partners.length}</span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">കമ്പ്യൂട്ടർ സിസ്റ്റം സ്റ്റാറ്റസ്</div>
                        <div className="text-[10px] text-slate-400">ഓഫ്‌ലൈൻ ഫസ്റ്റ് സ്റ്റോറേജ് Sync & വെബ് സോക്കറ്റ്</div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 font-bold border border-emerald-700/50 rounded-full text-[10px]">
                        🟢 Healthy
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

      </div>

      {/* SUPERADMIN CORRECTION / EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative text-slate-100 animate-in fade-in zoom-in duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base text-white">
                  {editingType === "order" ? `Edit Order #${editingItem.id}` : `Edit Madrasa Record #${editingItem.id}`}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Madrasa Name (مدرسة):</label>
                <input
                  type="text"
                  value={editForm.madrasaName}
                  onChange={(e) => setEditForm({ ...editForm, madrasaName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white font-bold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Registration No:</label>
                  <input
                    type="text"
                    value={editForm.regNo}
                    onChange={(e) => setEditForm({ ...editForm, regNo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white font-mono outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Place / City:</label>
                  <input
                    type="text"
                    value={editForm.place}
                    onChange={(e) => setEditForm({ ...editForm, place: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Contact Representative:</label>
                  <input
                    type="text"
                    value={editForm.contactName}
                    onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Phone Number:</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white font-mono outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {editingType === "order" && (
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Courier Delivery Address:</label>
                  <textarea
                    rows={2}
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Corrections
              </button>
            </div>

          </div>
        </div>
      )}


      {/* EDIT SUBJECT MODAL (CLASS 5 & ALL CLASSES SYLLABUS DIRECTORY) */}
      {editingSubject && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-purple-950/80 text-purple-300 rounded-xl border border-purple-800/60">
                  <Edit className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-extrabold text-base text-white">
                    വിഷയ വിവരങ്ങൾ എഡിറ്റ് ചെയ്യുക (Edit Subject)
                  </h4>
                  <p className="text-xs text-purple-400 font-semibold">
                    {editingSubject.classKey} സിലബസ് വിഷയം
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  വിഷയത്തിന്റെ പേര് (മലയാളം - Malayalam Name) <span className="text-red-400">*</span>:
                </label>
                <input
                  type="text"
                  value={editingSubject.subject.nameMl}
                  onChange={(e) => setEditingSubject({
                    ...editingSubject,
                    subject: { ...editingSubject.subject, nameMl: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white font-bold outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="ഉദാ: ഫിഖ്ഹ് (Fiqh)"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  ഇംഗ്ലീഷ് നാമം (English / Romanized Name):
                </label>
                <input
                  type="text"
                  value={editingSubject.subject.nameEn}
                  onChange={(e) => setEditingSubject({
                    ...editingSubject,
                    subject: { ...editingSubject.subject, nameEn: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Fiqh / Islamic Jurisprudence"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  വിഭാഗം (Subject Category):
                </label>
                <select
                  value={editingSubject.subject.category}
                  onChange={(e) => setEditingSubject({
                    ...editingSubject,
                    subject: { ...editingSubject.subject, category: e.target.value as any }
                  })}
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="quran">📖 ഖുർആൻ / തജ്‌വീദ് (Quran)</option>
                  <option value="fiqh">⚖️ ഫിഖ്ഹ് (Islamic Jurisprudence)</option>
                  <option value="aqeeda">🤲 അഖീദ (Faith / Theology)</option>
                  <option value="thareekh">📜 താരീഖ് (Islamic History)</option>
                  <option value="lisan">✍️ ലിസാൻ & അറബിക് (Arabic)</option>
                  <option value="akhlaq">🌟 അഖ്‌ലാഖ് & ദുആ (Morals)</option>
                  <option value="general">🏫 ജനറൽ / സ്കൂൾ വിഷയങ്ങൾ (General)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                റദ്ദാക്കുക (Cancel)
              </button>
              <button
                type="button"
                onClick={() => handleUpdateSubjectInDirectory(editingSubject.classKey, editingSubject.subject)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-extrabold text-xs transition shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>മാറ്റങ്ങൾ സേവ് ചെയ്യുക (Save Changes)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BOARD DETAILS MODAL */}
      {editingBoardDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-950/80 text-amber-300 rounded-xl border border-amber-800/60">
                  <Edit className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-extrabold text-base text-white">
                    ബോർഡ് വിവരങ്ങൾ എഡിറ്റ് ചെയ്യുക (Edit Board Details)
                  </h4>
                  <p className="text-xs text-amber-400 font-semibold">
                    {editingBoardDetails.boardName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingBoardDetails(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  ബോർഡ് നാമം (Board Name - English) <span className="text-red-400">*</span>:
                </label>
                <input
                  type="text"
                  value={editingBoardDetails.boardName}
                  onChange={(e) => setEditingBoardDetails({
                    ...editingBoardDetails,
                    boardName: e.target.value
                  })}
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white font-bold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  ബോർഡ് നാമം മലയാളത്തിൽ (Malayalam Title):
                </label>
                <input
                  type="text"
                  value={editingBoardDetails.boardNameMl || ""}
                  onChange={(e) => setEditingBoardDetails({
                    ...editingBoardDetails,
                    boardNameMl: e.target.value
                  })}
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="ഉദാ: സമസ്ത കേരള ഇസ്‌ലാം മത വിദ്യാഭ്യാസ ബോർഡ്"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    അധ്യയന വർഷം (Academic Year):
                  </label>
                  <input
                    type="text"
                    value={editingBoardDetails.academicYear}
                    onChange={(e) => setEditingBoardDetails({
                      ...editingBoardDetails,
                      academicYear: e.target.value
                    })}
                    className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white font-mono outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="2025-2026"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    പരീക്ഷാ ടേം (Exam Term):
                  </label>
                  <select
                    value={editingBoardDetails.term || "quarterly"}
                    onChange={(e) => {
                      const termVal = e.target.value as ExamTermType;
                      const termObj = EXAM_TERMS.find(t => t.id === termVal);
                      setEditingBoardDetails({
                        ...editingBoardDetails,
                        term: termVal,
                        termMl: termObj ? termObj.shortMl : "പാദവാർഷികം"
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {EXAM_TERMS.map(t => (
                      <option key={t.id} value={t.id}>{t.labelMl}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  വിഭാഗം (Board Category):
                </label>
                <select
                  value={editingBoardDetails.category || "general"}
                  onChange={(e) => {
                    const catVal = e.target.value as "general" | "school";
                    setEditingBoardDetails({
                      ...editingBoardDetails,
                      category: catVal,
                      categoryMl: catVal === "school" ? "സ്കൂൾ മദ്റസ" : "ജനറൽ മദ്റസ"
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="general">ജനറൽ മദ്റസ (General Madrasa)</option>
                  <option value="school">സ്കൂൾ മദ്റസ (School Madrasa)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  വിവരണം (Description):
                </label>
                <textarea
                  rows={2}
                  value={editingBoardDetails.description || ""}
                  onChange={(e) => setEditingBoardDetails({
                    ...editingBoardDetails,
                    description: e.target.value
                  })}
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="ടൈംടേബിൾ സംബന്ധിച്ച പൊതുവിവരങ്ങൾ..."
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={!!editingBoardDetails.isVerified}
                    onChange={(e) => setEditingBoardDetails({
                      ...editingBoardDetails,
                      isVerified: e.target.checked,
                      source: e.target.checked ? "superadmin_verified" : "crowdsourced"
                    })}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <div>
                    <span className="text-white font-bold block">ഔദ്യോഗികമായി വെരിഫൈ ചെയ്തതായി അടയാളപ്പെടുത്തുക (Mark as SuperAdmin Verified)</span>
                    <span className="text-slate-400 text-3xs">യൂസർമാർക്ക് "Verified Super Admin Data" എന്ന ബാഡ്ജ് കാണിക്കും</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingBoardDetails(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                റദ്ദാക്കുക (Cancel)
              </button>
              <button
                type="button"
                onClick={handleSaveEditedBoardDetails}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>ബോർഡ് വിവരങ്ങൾ സേവ് ചെയ്യുക (Save Details)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TIMETABLE RESTORE MODAL */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 sm:p-6 max-w-xl w-full space-y-5 shadow-2xl text-xs text-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-white">
                    പരീക്ഷാ ടൈംടേബിൾ റീസ്റ്റോർ (Restore Timetable)
                  </h4>
                  <p className="text-3xs text-slate-400">
                    മുൻപ് ബാക്കപ്പ് എടുത്ത ഫയലിൽ നിന്നോ സെർവർ സ്നാപ്പ്ഷോട്ടിൽ നിന്നോ ടൈംടേബിൾ വിവരങ്ങൾ തിരികെ കൊണ്ടുവരിക
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsRestoreModalOpen(false);
                  setRestorePreviewData(null);
                  setRestoreError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {restoreError && (
              <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{restoreError}</span>
              </div>
            )}

            {/* OPTION 1: UPLOAD JSON BACKUP FILE */}
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>രീതി 1: ബാക്കപ്പ് JSON ഫയൽ അപ്‌ലോഡ് ചെയ്യുക (Upload JSON File)</span>
                </span>
                <span className="text-3xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  .json
                </span>
              </div>

              <input
                id="timetable-restore-file-input"
                type="file"
                accept=".json,application/json"
                onChange={handleSelectRestoreFile}
                className="hidden"
              />

              <div
                onClick={() => document.getElementById("timetable-restore-file-input")?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-4 text-center cursor-pointer transition hover:bg-slate-900/60"
              >
                <Upload className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
                <p className="font-bold text-slate-300 text-xs">
                  ബാക്കപ്പ് JSON ഫയൽ തിരഞ്ഞെടുക്കുക (Select Backup File)
                </p>
                <p className="text-3xs text-slate-500 pt-0.5">
                  നിങ്ങൾ മുൻപ് ഡൗൺലോഡ് ചെയ്ത് സൂക്ഷിച്ച .json ഫയൽ ഇവിടെ തിരഞ്ഞെടുക്കുക
                </p>
              </div>

              {/* RESTORE FILE PREVIEW */}
              {restorePreviewData && (
                <div className="p-3.5 bg-emerald-950/50 border border-emerald-500/40 rounded-xl space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>സാധുവായ ബാക്കപ്പ് ഫയൽ കണ്ടെത്തി ({restorePreviewData.source})</span>
                    </span>
                    <span className="text-3xs font-mono text-emerald-400">
                      {new Date(restorePreviewData.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-300 text-3xs">
                    <p className="font-semibold text-slate-200">അടങ്ങിയിട്ടുള്ള ബോർഡുകൾ ({restorePreviewData.totalBoards}):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {restorePreviewData.timetables.map((tb: any, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                          {tb.boardName} ({Object.keys(tb.classes || {}).filter((k: string) => k.startsWith("Class ")).length} Classes)
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={() => handleExecuteRestore(false)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isRestoring ? "റീസ്റ്റോർ ചെയ്യുന്നു..." : "✓ ഈ ഫയലിൽ നിന്ന് റീസ്റ്റോർ ചെയ്യുക"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* OPTION 2: RESTORE FROM SERVER SNAPSHOT */}
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-sky-400" />
                  <span>രീതി 2: സെർവർ സ്നാപ്പ്ഷോട്ടിൽ നിന്ന് റീസ്റ്റോർ ചെയ്യുക (Server Snapshot)</span>
                </span>
                <span className="text-3xs px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                  Cloud / Server
                </span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-300">
                    സെർവറിലെ അവസാന ബാക്കപ്പ്:
                  </p>
                  <p className="text-3xs text-slate-400 font-mono">
                    {serverSnapshotInfo?.hasBackup
                      ? `${serverSnapshotInfo.createdAt ? new Date(serverSnapshotInfo.createdAt).toLocaleString("en-IN") : "ലഭ്യമാണ്"} • (${serverSnapshotInfo.totalBoards || 0} ബോർഡുകൾ)`
                      : "സെർവറിൽ സ്നാപ്പ്ഷോട്ട് ബാക്കപ്പുകൾ നിലവിൽ ലഭ്യമല്ല"}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isRestoring || !serverSnapshotInfo?.hasBackup}
                  onClick={() => handleExecuteRestore(true)}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-xl text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isRestoring ? "റീസ്റ്റോർ ചെയ്യുന്നു..." : "സ്നാപ്പ്ഷോട്ട് റീസ്റ്റോർ"}</span>
                </button>
              </div>
            </div>

            {/* Note & Close */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-3xs text-slate-500">
                ⚠️ റീസ്റ്റോർ ചെയ്യുമ്പോൾ നിലവിലെ ടൈംടേബിളുകൾ ഇതിലേക്ക് മാറ്റിസ്ഥാപിക്കപ്പെടും.
              </span>

              <button
                type="button"
                onClick={() => {
                  setIsRestoreModalOpen(false);
                  setRestorePreviewData(null);
                  setRestoreError(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition cursor-pointer text-xs"
              >
                അടയ്ക്കുക (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COPY TIMETABLE SCHEDULE MODAL */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-left relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30 shrink-0">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-white">
                    മറ്റു ക്ലാസുകളിലേക്ക് പകർത്തുക (Copy Schedule)
                  </h4>
                  <p className="text-3xs text-purple-300">
                    സ്രോതസ്സ് ക്ലാസ്: <strong className="text-white">{copySourceClass}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* COPY MODE SELECTION */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                പകർത്തേണ്ട രീതി തിരഞ്ഞെടുക്കുക (Copy Mode):
              </label>
              <div className="grid grid-cols-1 gap-2">
                <label className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  copyMode === "dates_and_times_only" 
                    ? "bg-purple-950/60 border-purple-500/60 text-white" 
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}>
                  <input
                    type="radio"
                    name="copyMode"
                    value="dates_and_times_only"
                    checked={copyMode === "dates_and_times_only"}
                    onChange={() => setCopyMode("dates_and_times_only")}
                    className="mt-0.5 accent-purple-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs text-purple-200 block">
                      തീയതികളും സമയങ്ങളും മാത്രം പകർത്തുക (Dates & Timings Only)
                    </span>
                    <span className="text-3xs text-slate-400 block pt-0.5">
                      തിരഞ്ഞെടുത്ത ഓരോ ക്ലാസിന്റെയും സിലബസിൽ നിന്നുള്ള യഥാർത്ഥ വിഷയങ്ങൾ അതേക്രമത്തിൽ വരും.
                    </span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  copyMode === "full_schedule" 
                    ? "bg-purple-950/60 border-purple-500/60 text-white" 
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}>
                  <input
                    type="radio"
                    name="copyMode"
                    value="full_schedule"
                    checked={copyMode === "full_schedule"}
                    onChange={() => setCopyMode("full_schedule")}
                    className="mt-0.5 accent-purple-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs text-purple-200 block">
                      പൂർണ്ണ ഷെഡ്യൂൾ അതേപടി പകർത്തുക (Full Exact Copy including Subjects)
                    </span>
                    <span className="text-3xs text-slate-400 block pt-0.5">
                      തീയതി, സമയം, മലയാളം വിഷയത്തിന്റെ പേര് ഉൾപ്പെടെ {copySourceClass}-ലെ അതേ ക്രമം പകർത്തി മാറ്റിയെഴുതും.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* TARGET CLASSES CHECKBOX GRID */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">
                  ഏതൊക്കെ ക്ലാസുകളിലേക്ക് പകർത്തണം? (Target Classes):
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCopyTargetClasses(Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).filter(c => c !== copySourceClass))}
                    className="text-3xs text-purple-400 hover:text-purple-300 underline font-bold cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600 text-3xs">•</span>
                  <button
                    type="button"
                    onClick={() => setCopyTargetClasses([])}
                    className="text-3xs text-slate-400 hover:text-slate-300 underline font-bold cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).map((cls) => {
                  const isSource = cls === copySourceClass;
                  const isChecked = copyTargetClasses.includes(cls);
                  return (
                    <label
                      key={cls}
                      className={`p-2 rounded-xl text-xs font-bold flex items-center justify-between border transition ${
                        isSource 
                          ? "opacity-40 border-slate-800 bg-slate-900 text-slate-500 cursor-not-allowed"
                          : isChecked
                          ? "bg-purple-950/80 border-purple-500/60 text-purple-200 cursor-pointer"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                      }`}
                    >
                      <span>{cls}</span>
                      <input
                        type="checkbox"
                        disabled={isSource}
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCopyTargetClasses([...copyTargetClasses, cls]);
                          } else {
                            setCopyTargetClasses(copyTargetClasses.filter(c => c !== cls));
                          }
                        }}
                        className="accent-purple-500 rounded cursor-pointer disabled:cursor-not-allowed"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition cursor-pointer text-xs"
              >
                ക്യാൻസൽ (Cancel)
              </button>

              <button
                type="button"
                disabled={copyTargetClasses.length === 0}
                onClick={handleApplyCopyScheduleToClasses}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-purple-900/40 flex items-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <Check className="w-4 h-4" />
                <span>{copyTargetClasses.length} ക്ലാസുകളിലേക്ക് പകർത്തുക</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isAuditModalOpen && <DatabaseAuditModal onClose={() => setIsAuditModalOpen(false)} />}
    </div>
  );
}