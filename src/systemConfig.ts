import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { SuperAdminUser, AccountsUser } from "./types";

export type { SuperAdminUser, AccountsUser };

export type AppModuleKey = "seating" | "result" | "tarbiyah";
export type AppVisibilityStatus = "active" | "coming_soon" | "maintenance" | "hidden";

export interface AppModuleSetting {
  id: AppModuleKey;
  nameEn: string;
  nameMl: string;
  status: AppVisibilityStatus;
  statusNoticeMl?: string;
  statusNoticeEn?: string;
  badgeTextMl?: string;
  showToPublic: boolean;
}

export interface SystemConfig {
  appName: string;
  adminWhatsApp: string;
  adminPhone: string;
  gpayUpiId: string;
  payeeName: string;
  showPricingInUI: boolean; // default false as requested
  customPricingNoticeMl: string;
  customPricingNoticeEn: string;
  supportHours: string;
  freeDeliveryNoteMl: string;
  superAdmins?: SuperAdminUser[];
  accountsUsers?: AccountsUser[];
  appModulesStatus?: Record<AppModuleKey, AppModuleSetting>;
  updatedAt?: string;
}

export const defaultAppModulesStatus: Record<AppModuleKey, AppModuleSetting> = {
  seating: {
    id: "seating",
    nameEn: "Exam Seating & Hall Tickets",
    nameMl: "എക്സാം സീറ്റിംഗ് & ഹാൾടിക്കറ്റ്",
    status: "active",
    statusNoticeMl: "പൂർണ്ണമായും പ്രവർത്തനക്ഷമമാണ്.",
    statusNoticeEn: "Fully live and active.",
    badgeTextMl: "സജീവം • Live",
    showToPublic: true,
  },
  result: {
    id: "result",
    nameEn: "Exam Result Management",
    nameMl: "പരീക്ഷാ ഫല മാനേജ്മെന്റ്",
    status: "active", // can be toggled to maintenance/coming_soon/hidden
    statusNoticeMl: "പരീക്ഷാ ഫല മാനേജ്‌മെന്റ് സിസ്റ്റം ഉടൻ പൂർണ്ണമായും സജ്ജമാകും.",
    statusNoticeEn: "Exam result management system is being updated.",
    badgeTextMl: "സജീവം • Live",
    showToPublic: true,
  },
  tarbiyah: {
    id: "tarbiyah",
    nameEn: "Tarbiyah & Continuous Evaluation",
    nameMl: "തർബിയ്യത്ത് & നിരന്തര മൂല്യനിർണ്ണയം",
    status: "maintenance", // by default under maintenance/coming soon as user requested
    statusNoticeMl: "തർബിയ്യത്ത് & നിരന്തര മൂല്യനിർണ്ണയ ആപ്പ് നിർമ്മാണത്തിലാണ്. ഉടൻ തന്നെ ലഭ്യമാകും.",
    statusNoticeEn: "Tarbiyah continuous evaluation module is under development and will be live soon.",
    badgeTextMl: "നിർമ്മാണത്തിലാണ് • In Progress",
    showToPublic: true,
  }
};

export const defaultSuperAdmins: SuperAdminUser[] = [
  {
    email: "edavachalniyas@gmail.com",
    name: "Niyas Edavachal (Root SuperAdmin)",
    isRoot: true,
    addedAt: "2026-01-01T00:00:00.000Z"
  }
];

export const defaultAccountsUsers: AccountsUser[] = [];

export const defaultSystemConfig: SystemConfig = {
  appName: "Seat manager ai studio",
  adminWhatsApp: "9633465267",
  adminPhone: "9633465267",
  gpayUpiId: "9633465267@okbizaxis",
  payeeName: "Seat manager ai studio",
  showPricingInUI: false, // Hidden by default, discussed on WhatsApp
  customPricingNoticeMl: "വിലവിവരങ്ങൾക്കും നേരിട്ടുള്ള പ്രിന്റിംഗ് ഓർഡറുകൾക്കും WhatsApp വഴി ബന്ധപ്പെടുക.",
  customPricingNoticeEn: "Contact directly on WhatsApp for printing rates, custom packages & confirmation.",
  supportHours: "24x7 WhatsApp Support & Instant Help",
  freeDeliveryNoteMl: "കേരളത്തിലെവിടെയും സ്പീഡ് പോസ്റ്റ് / കൊറിയർ ഡെലിവറി ലഭ്യമാണ്.",
  superAdmins: defaultSuperAdmins,
  accountsUsers: defaultAccountsUsers,
  appModulesStatus: defaultAppModulesStatus,
};

const STORAGE_KEY = "seat_manager_system_config";

export function getLocalSystemConfig(): SystemConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...defaultSystemConfig, 
        ...parsed,
        accountsUsers: parsed.accountsUsers || defaultAccountsUsers,
        appModulesStatus: {
          ...defaultAppModulesStatus,
          ...(parsed.appModulesStatus || {})
        }
      };
    }
  } catch (e) {
    // fallback
  }
  return defaultSystemConfig;
}

export function saveLocalSystemConfig(config: SystemConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {}
}

export async function fetchRemoteSystemConfig(forceRefresh: boolean = false): Promise<SystemConfig> {
  // 0. Check session cache first so page reloads don't trigger repeated Firestore reads
  if (!forceRefresh) {
    try {
      const sessionCached = sessionStorage.getItem("madrasa_sys_cfg_loaded");
      if (sessionCached === "1") {
        return getLocalSystemConfig();
      }
    } catch (e) {}
  }

  // 1. Try Zero-Cost Server API First (0 Firestore reads)
  try {
    const res = await fetch("/api/system-config");
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.config) {
        const merged: SystemConfig = {
          ...defaultSystemConfig,
          ...result.config,
          appModulesStatus: {
            ...defaultAppModulesStatus,
            ...(result.config.appModulesStatus || {})
          }
        };
        saveLocalSystemConfig(merged);
        try { sessionStorage.setItem("madrasa_sys_cfg_loaded", "1"); } catch (e) {}
        return merged;
      }
    }
  } catch (e) {
    console.warn("Could not fetch system config from server API:", e);
  }

  // 2. Fallback to Firestore only if Server API had no config
  try {
    const docRef = doc(db, "system_settings", "global_config");
    const snap = await Promise.race([
      getDoc(docRef),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Firestore connection timeout")), 3000))
    ]);
    if (snap && snap.exists()) {
      const data = snap.data() as Partial<SystemConfig>;
      const merged: SystemConfig = { 
        ...defaultSystemConfig, 
        ...data,
        appModulesStatus: {
          ...defaultAppModulesStatus,
          ...(data.appModulesStatus || {})
        }
      };
      saveLocalSystemConfig(merged);
      try { sessionStorage.setItem("madrasa_sys_cfg_loaded", "1"); } catch (e) {}
      // Warm up server cache so subsequent visitors use 0 Firestore reads
      fetch("/api/system-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(merged)
      }).catch(() => {});
      return merged;
    }
  } catch (e) {
    console.warn("Could not fetch remote system config from Firestore (operating in local/offline mode):", e);
  }

  return getLocalSystemConfig();
}

export async function updateRemoteSystemConfig(config: SystemConfig): Promise<boolean> {
  saveLocalSystemConfig(config);
  let firestoreSuccess = false;
  let serverSuccess = false;

  // 1. Save to Cloud Firestore
  try {
    const docRef = doc(db, "system_settings", "global_config");
    await setDoc(docRef, {
      ...config,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    firestoreSuccess = true;
  } catch (e) {
    console.warn("Could not update remote system config on Firestore:", e);
  }

  // 2. Save to Server Persistence API
  try {
    const res = await fetch("/api/system-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    if (res.ok) {
      serverSuccess = true;
    }
  } catch (e) {
    console.warn("Could not sync system config to server API:", e);
  }

  return firestoreSuccess || serverSuccess;
}

/**
 * Retrieve the current active list of Super Admin users
 */
export function getSuperAdminList(): SuperAdminUser[] {
  const cfg = getLocalSystemConfig();
  if (cfg.superAdmins && cfg.superAdmins.length > 0) {
    return cfg.superAdmins;
  }
  return defaultSuperAdmins;
}

/**
 * Add a new Super Admin user
 */
export async function addSuperAdminUser(email: string, name?: string, addedBy?: string): Promise<{ success: boolean; error?: string; list: SuperAdminUser[] }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "സാധുവായ ഇമെയിൽ വിലാസം നൽകുക (Valid Email required)", list: getSuperAdminList() };
  }

  const cfg = await fetchRemoteSystemConfig();
  const currentList = cfg.superAdmins && cfg.superAdmins.length > 0 ? [...cfg.superAdmins] : [...defaultSuperAdmins];

  if (currentList.some(a => a.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: "ഈ ഇമെയിൽ ഇതിനകം സൂപ്പർ അഡ്മിൻ പട്ടികയിലുണ്ട് (Already a Super Admin)", list: currentList };
  }

  const newAdmin: SuperAdminUser = {
    email: cleanEmail,
    name: name?.trim() || cleanEmail.split("@")[0],
    isRoot: false,
    addedAt: new Date().toISOString(),
    addedBy: addedBy || "Super Admin"
  };

  const updatedList = [...currentList, newAdmin];
  const updatedConfig: SystemConfig = {
    ...cfg,
    superAdmins: updatedList,
    updatedAt: new Date().toISOString()
  };

  await updateRemoteSystemConfig(updatedConfig);
  return { success: true, list: updatedList };
}

/**
 * Remove a Super Admin user
 */
export async function removeSuperAdminUser(email: string): Promise<{ success: boolean; error?: string; list: SuperAdminUser[] }> {
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === "edavachalniyas@gmail.com") {
    return { success: false, error: "പ്രൈമറി റൂട്ട് സൂപ്പർ അഡ്മിനെ (Primary Root Admin) ഒഴിവാക്കാൻ കഴിയില്ല.", list: getSuperAdminList() };
  }

  const cfg = await fetchRemoteSystemConfig();
  const currentList = cfg.superAdmins && cfg.superAdmins.length > 0 ? [...cfg.superAdmins] : [...defaultSuperAdmins];

  const target = currentList.find(a => a.email.toLowerCase() === cleanEmail);
  if (!target) {
    return { success: false, error: "ഈ ഇമെയിൽ പട്ടികയിൽ കണ്ടെത്താനായില്ല.", list: currentList };
  }

  if (target.isRoot) {
    return { success: false, error: "റൂട്ട് സൂപ്പർ അഡ്മിനെ ഒഴിവാക്കാൻ സാധ്യമല്ല.", list: currentList };
  }

  const updatedList = currentList.filter(a => a.email.toLowerCase() !== cleanEmail);
  const updatedConfig: SystemConfig = {
    ...cfg,
    superAdmins: updatedList,
    updatedAt: new Date().toISOString()
  };

  await updateRemoteSystemConfig(updatedConfig);
  return { success: true, list: updatedList };
}

/**
 * Retrieve the current active list of Accounts team users
 */
export function getAccountsUsersList(): AccountsUser[] {
  const cfg = getLocalSystemConfig();
  if (cfg.accountsUsers && cfg.accountsUsers.length > 0) {
    return cfg.accountsUsers;
  }
  return defaultAccountsUsers;
}

/**
 * Check if an email belongs to an Accounts team member
 */
export function isAccountsEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  const list = getAccountsUsersList();
  return list.some(u => u.email.trim().toLowerCase() === clean);
}

/**
 * Check if an email is either SuperAdmin or Accounts Team
 */
export function isAccountsOrSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  if (clean === "edavachalniyas@gmail.com") return true;
  return isAccountsEmail(clean) || getSuperAdminList().some(a => a.email.trim().toLowerCase() === clean);
}

/**
 * Add an Accounts team user (Assigned by SuperAdmin)
 */
export async function addAccountsUser(
  email: string,
  name?: string,
  phone?: string,
  addedBy?: string
): Promise<{ success: boolean; error?: string; list: AccountsUser[] }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "സാധുവായ ഇമെയിൽ വിലാസം നൽകുക (Valid Email required)", list: getAccountsUsersList() };
  }

  const cfg = await fetchRemoteSystemConfig();
  const currentList = cfg.accountsUsers && cfg.accountsUsers.length > 0 ? [...cfg.accountsUsers] : [...defaultAccountsUsers];

  if (currentList.some(a => a.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: "ഈ ഇമെയിൽ ഇതിനകം അക്കൗണ്ട്സ് ടീമിൽ ചേർത്തിട്ടുണ്ട്.", list: currentList };
  }

  const newUser: AccountsUser = {
    email: cleanEmail,
    name: name?.trim() || cleanEmail.split("@")[0],
    phone: phone?.trim() || "",
    addedAt: new Date().toISOString(),
    addedBy: addedBy || "edavachalniyas@gmail.com"
  };

  const updatedList = [...currentList, newUser];
  const updatedConfig: SystemConfig = {
    ...cfg,
    accountsUsers: updatedList,
    updatedAt: new Date().toISOString()
  };

  await updateRemoteSystemConfig(updatedConfig);
  return { success: true, list: updatedList };
}

/**
 * Remove an Accounts team user
 */
export async function removeAccountsUser(email: string): Promise<{ success: boolean; error?: string; list: AccountsUser[] }> {
  const cleanEmail = email.trim().toLowerCase();
  const cfg = await fetchRemoteSystemConfig();
  const currentList = cfg.accountsUsers && cfg.accountsUsers.length > 0 ? [...cfg.accountsUsers] : [...defaultAccountsUsers];

  const updatedList = currentList.filter(a => a.email.toLowerCase() !== cleanEmail);
  const updatedConfig: SystemConfig = {
    ...cfg,
    accountsUsers: updatedList,
    updatedAt: new Date().toISOString()
  };

  await updateRemoteSystemConfig(updatedConfig);
  return { success: true, list: updatedList };
}

/**
 * Generate UPI deep link & QR code image URL
 */
export function getUpiPaymentDetails(config: SystemConfig, amount?: number, note?: string) {
  const upiId = config.gpayUpiId || "9633465267@okbizaxis";
  const name = encodeURIComponent(config.payeeName || "Seat manager ai studio");
  const transactionNote = encodeURIComponent(note || "Madrasa Exam Seating Print Order");
  
  let upiUrl = `upi://pay?pa=${upiId}&pn=${name}&tn=${transactionNote}&cu=INR`;
  if (amount && amount > 0) {
    upiUrl += `&am=${amount}`;
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  return {
    upiId,
    upiUrl,
    qrCodeUrl,
  };
}

/**
 * Generate standard WhatsApp direct chat link with pre-filled message
 */
export function getWhatsAppOrderUrl(config: SystemConfig, details: {
  madrasaName: string;
  regNo?: string;
  place?: string;
  contactName?: string;
  phone?: string;
  totalSeats?: number;
  totalHalls?: number;
  selectedItems?: string[];
  notes?: string;
  hasPdfReady?: boolean;
}): string {
  const phone = (config.adminWhatsApp || "9633465267").replace(/\D/g, "");
  const formattedPhone = phone.startsWith("91") ? phone : `91${phone}`;

  const lines = [
    `*📋 SEAT MANAGER AI STUDIO - PRINT ORDER / INQUIRY*`,
    ``,
    `🏫 *മദ്റസ:* ${details.madrasaName || "Madrasa"}`,
  ];

  if (details.regNo) lines.push(`🔢 *രജി. നമ്പർ:* ${details.regNo}`);
  if (details.place) lines.push(`📍 *സ്ഥലം:* ${details.place}`);
  if (details.contactName) lines.push(`👤 *കോൺടാക്ട്:* ${details.contactName}`);
  if (details.phone) lines.push(`📞 *ഫോൺ:* ${details.phone}`);
  if (details.totalSeats) lines.push(`👥 *ആകെ വിദ്യാർത്ഥികൾ / സീറ്റുകൾ:* ${details.totalSeats}`);
  if (details.totalHalls) lines.push(`🏢 *ആകെ ഹാളുകൾ:* ${details.totalHalls}`);

  if (details.selectedItems && details.selectedItems.length > 0) {
    lines.push(``);
    lines.push(`📦 *ആവശ്യമുള്ള പ്രിന്റുകൾ:*`);
    details.selectedItems.forEach(item => lines.push(`  • ${item}`));
  }

  if (details.hasPdfReady) {
    lines.push(``);
    lines.push(`📄 *സോഫ്റ്റ്‌വെയർ വഴി തയ്യാറാക്കിയ PDF ഫയൽ ഇതോടൊപ്പം താഴെ അറ്റാച്ച് ചെയ്ത് അയക്കുന്നുണ്ട്.*`);
  }

  if (details.notes) {
    lines.push(``);
    lines.push(`📝 *കുറിപ്പ് / നിർദ്ദേശങ്ങൾ:* ${details.notes}`);
  }

  lines.push(``);
  lines.push(`_പ്രിന്റിംഗ് നിരക്കുകളും കൊറിയർ വിവരങ്ങളും ദയവായി അറിയിക്കുമല്ലോ._`);

  const message = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${formattedPhone}?text=${message}`;
}
