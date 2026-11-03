import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  serverTimestamp 
} from "firebase/firestore";
import app, { db, auth } from "./firebase";

import { getSuperAdminList } from "./systemConfig";

export const SUPERADMIN_EMAILS = [
  "edavachalniyas@gmail.com"
];

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  if (SUPERADMIN_EMAILS.includes(clean)) {
    return true;
  }
  try {
    const list = getSuperAdminList();
    return list.some(a => a.email.trim().toLowerCase() === clean);
  } catch (e) {
    return false;
  }
}

export interface SaaSInstitutionProfile {
  id: string;
  name: string;
  regNo: string;
  place: string;
  phone: string;
  email: string;
  ownerUid: string;
  role: "admin" | "institution" | "superadmin";
  createdAt?: any;
  updatedAt?: any;
}

export interface AppUserSession {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isAnonymous?: boolean;
}

const LOCAL_SESSION_KEY = "melad_saas_user_session";
const LOCAL_INSTITUTION_KEY = "melad_saas_institution_profile";

// Helper to generate consistent hash ID from email for fallback
function generateUidFromEmail(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return "inst_" + Math.abs(hash).toString(36) + "_" + email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Robust Google Login - Tries Popup first, detects blocks.
 */
export async function loginWithGoogle(method: "popup" | "redirect" = "popup"): Promise<{ session?: AppUserSession; profile?: SaaSInstitutionProfile } | void> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  if (method === "redirect") {
    return await signInWithRedirect(auth, provider);
  }

  try {
    const result = await signInWithPopup(auth, provider);
    return await processAuthResult(result.user);
  } catch (err: any) {
    console.warn("Google login error:", err);
    if (err.code === "auth/popup-blocked" || err.code === "auth/cancelled-popup-request") {
      throw new Error("POPUP_BLOCKED");
    }
    throw err;
  }
}

export async function processGoogleRedirectResult(): Promise<{ session: AppUserSession; profile: SaaSInstitutionProfile } | null> {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    return await processAuthResult(result.user);
  } catch (e) {
    console.error("processGoogleRedirectResult error:", e);
    return null;
  }
}

async function processAuthResult(user: FirebaseUser): Promise<{ session: AppUserSession; profile: SaaSInstitutionProfile }> {
  const sessionUid = user.uid;
  const userEmail = (user.email || "").toLowerCase();
  const userName = user.displayName || userEmail.split("@")[0];
  const userPhoto = user.photoURL;

  const userSession: AppUserSession = {
    uid: sessionUid,
    email: userEmail,
    displayName: userName,
    photoURL: userPhoto,
    isAnonymous: false
  };

  const isSuper = isSuperAdminEmail(userEmail);
  const userRole = isSuper ? "superadmin" : "institution";

  // Load or create Institution Profile from Firestore
  let profile: SaaSInstitutionProfile;
  try {
    const instDocRef = doc(db, "institutions", sessionUid);
    const instDocSnap = await getDoc(instDocRef);

    if (instDocSnap.exists()) {
      profile = instDocSnap.data() as SaaSInstitutionProfile;
      if (isSuper && profile.role !== "superadmin") {
        profile.role = "superadmin";
        await setDoc(instDocRef, { role: "superadmin" }, { merge: true });
      }
    } else {
      profile = {
        id: sessionUid,
        name: isSuper ? "State Central Board SuperAdmin" : (userName ? `${userName}'s Institution` : "My Madrasa"),
        regNo: isSuper ? "CENTRAL-BOARD-DIRECT" : ("REG-" + sessionUid.slice(-6).toUpperCase()),
        place: "Kerala",
        phone: "",
        email: userEmail,
        ownerUid: sessionUid,
        role: userRole
      };

      await setDoc(instDocRef, {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (dbErr) {
    console.warn("Firestore profile fetch fallback:", dbErr);
    profile = {
      id: sessionUid,
      name: userName || "My Madrasa",
      regNo: "REG-DEFAULT",
      place: "Kerala",
      phone: "",
      email: userEmail,
      ownerUid: sessionUid,
      role: userRole
    };
  }

  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(userSession));
  localStorage.setItem(LOCAL_INSTITUTION_KEY, JSON.stringify(profile));

  return { session: userSession, profile };
}

export async function loginWithDirectEmailOrPhone(
  identifier: string,
  providedName?: string,
  draftProfile?: Partial<SaaSInstitutionProfile>
): Promise<{ session: AppUserSession; profile: SaaSInstitutionProfile }> {
  const clean = identifier.trim().toLowerCase();
  if (!clean) {
    throw new Error("Please enter your Google Email or WhatsApp Phone Number.");
  }

  const isEmail = clean.includes("@");
  let userEmail = isEmail ? clean : "";
  let userPhone = isEmail ? "" : clean.replace(/[^0-9]/g, "");
  let sessionUid = "";

  const isSuper = isEmail && isSuperAdminEmail(userEmail);
  if (isSuper) {
    throw new Error("Super Admin accounts must sign in using verified Google Authentication.");
  }
  const userRole = "institution";

  // Try anonymous auth or get current auth UID if available
  try {
    if (!auth.currentUser) {
      const anon = await signInAnonymously(auth);
      sessionUid = anon.user.uid;
    } else {
      sessionUid = auth.currentUser.uid;
    }
  } catch (e) {
    sessionUid = isEmail ? generateUidFromEmail(clean) : "inst_ph_" + (userPhone || "guest");
  }

  // Check draft data
  const localDraftName = draftProfile?.name || localStorage.getItem("madrasa_name") || "";
  const isDraftRealName = localDraftName.trim() !== "" && localDraftName !== "My Madrasa" && localDraftName !== "Default Madrasa";
  const localDraftReg = draftProfile?.regNo || localStorage.getItem("madrasa_reg_no") || "";
  const localDraftPlace = draftProfile?.place || localStorage.getItem("madrasa_place") || "Kerala";
  const localDraftPhone = draftProfile?.phone || localStorage.getItem("madrasa_whatsapp") || userPhone;

  const displayName = providedName?.trim() || 
    (isDraftRealName ? localDraftName : isEmail ? userEmail.split("@")[0] : `Madrasa (${userPhone})`);

  const userSession: AppUserSession = {
    uid: sessionUid,
    email: userEmail || `${userPhone}@madrasa.local`,
    displayName: displayName,
    photoURL: null,
    isAnonymous: !isSuper
  };

  // Fetch or create profile
  let profile: SaaSInstitutionProfile;
  try {
    const instDocRef = doc(db, "institutions", sessionUid);
    const instDocSnap = await getDoc(instDocRef);

    if (instDocSnap.exists()) {
      profile = instDocSnap.data() as SaaSInstitutionProfile;
      if (isSuper && profile.role !== "superadmin") {
        profile.role = "superadmin";
        await setDoc(instDocRef, { role: "superadmin" }, { merge: true });
      } else if (!isSuper && isDraftRealName && (!profile.name || profile.name === "My Madrasa" || profile.name.endsWith("'s Institution"))) {
        profile.name = localDraftName;
        if (localDraftReg) profile.regNo = localDraftReg;
        if (localDraftPlace) profile.place = localDraftPlace;
        if (localDraftPhone) profile.phone = localDraftPhone;
        await setDoc(instDocRef, { 
          name: profile.name, 
          regNo: profile.regNo, 
          place: profile.place, 
          phone: profile.phone,
          updatedAt: serverTimestamp() 
        }, { merge: true });
      }
    } else {
      profile = {
        id: sessionUid,
        name: isSuper ? "State Central Board SuperAdmin" : (isDraftRealName ? localDraftName : displayName),
        regNo: isSuper ? "CENTRAL-BOARD-DIRECT" : (localDraftReg && localDraftReg !== "REG-2026" ? localDraftReg : "REG-" + sessionUid.slice(-6).toUpperCase()),
        place: localDraftPlace || "Kerala",
        phone: localDraftPhone || userPhone,
        email: userEmail,
        ownerUid: sessionUid,
        role: userRole
      };

      await setDoc(instDocRef, {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (dbErr) {
    console.warn("Firestore fallback profile:", dbErr);
    profile = {
      id: sessionUid,
      name: isSuper ? "State Central Board SuperAdmin" : (isDraftRealName ? localDraftName : displayName),
      regNo: isSuper ? "CENTRAL-BOARD-DIRECT" : (localDraftReg || "REG-DEFAULT"),
      place: localDraftPlace || "Kerala",
      phone: localDraftPhone || userPhone,
      email: userEmail,
      ownerUid: sessionUid,
      role: userRole
    };
  }

  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(userSession));
  localStorage.setItem(LOCAL_INSTITUTION_KEY, JSON.stringify(profile));

  return { session: userSession, profile };
}

export async function loginUser(email: string, password: string): Promise<{ session: AppUserSession; profile: SaaSInstitutionProfile }> {
  const cleanEmail = email.trim().toLowerCase();
  let sessionUid = "";
  let userSession: AppUserSession;

  // Try Firebase Auth first
  try {
    const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    sessionUid = userCred.user.uid;
    userSession = {
      uid: userCred.user.uid,
      email: userCred.user.email,
      displayName: userCred.user.displayName
    };
  } catch (err: any) {
    console.warn("Firebase Auth signIn failed/disabled, using robust cloud tenant fallback:", err.code || err.message);
    
    // If operation not allowed, try anonymous auth or deterministic cloud UID
    if (err.code === "auth/operation-not-allowed" || err.code === "auth/admin-restricted-operation" || !auth.currentUser) {
      try {
        const anon = await signInAnonymously(auth);
        sessionUid = anon.user.uid;
      } catch (anonErr) {
        sessionUid = generateUidFromEmail(cleanEmail);
      }
    } else {
      // For actual wrong password / invalid user credentials
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
        // Check Firestore fallback in case user registered via cloud fallback
        sessionUid = generateUidFromEmail(cleanEmail);
      } else {
        sessionUid = generateUidFromEmail(cleanEmail);
      }
    }

    userSession = {
      uid: sessionUid,
      email: cleanEmail,
      displayName: cleanEmail.split("@")[0]
    };
  }

  // Check pre-entered local data before logging in
  const localSavedName = localStorage.getItem("madrasa_name") || "";
  const isLocalRealName = localSavedName.trim() !== "" && localSavedName !== "My Madrasa" && localSavedName !== "Default Madrasa";
  const localSavedReg = localStorage.getItem("madrasa_reg_no") || "";
  const localSavedPlace = localStorage.getItem("madrasa_place") || "Kerala";
  const localSavedPhone = localStorage.getItem("madrasa_whatsapp") || "";

  // Load Institution Profile from Firestore
  let profile: SaaSInstitutionProfile;
  try {
    const instDocRef = doc(db, "institutions", sessionUid);
    const instDocSnap = await getDoc(instDocRef);

    if (instDocSnap.exists()) {
      profile = instDocSnap.data() as SaaSInstitutionProfile;
      const isSuper = !userSession.isAnonymous && isSuperAdminEmail(cleanEmail);
      const isAutoEmailName = profile.name === (cleanEmail.split("@")[0].toUpperCase() + " Madrasa");
      const isPlaceholder = !profile.name || profile.name === "My Madrasa" || profile.name === "Default Madrasa" || profile.name.endsWith("'s Institution") || profile.name.endsWith("'s Madrasa") || isAutoEmailName;

      if (!isSuper && isLocalRealName && isPlaceholder) {
        profile.name = localSavedName;
        if (localSavedReg && (!profile.regNo || profile.regNo.startsWith("REG-"))) profile.regNo = localSavedReg;
        if (localSavedPlace) profile.place = localSavedPlace;
        if (localSavedPhone) profile.phone = localSavedPhone;
        await setDoc(instDocRef, {
          name: profile.name,
          regNo: profile.regNo,
          place: profile.place,
          phone: profile.phone,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } else {
      const isSuper = !userSession.isAnonymous && isSuperAdminEmail(cleanEmail);
      profile = {
        id: sessionUid,
        name: isSuper ? "State Central Board Admin" : (isLocalRealName ? localSavedName : (cleanEmail.split("@")[0].toUpperCase() + " Madrasa")),
        regNo: isSuper ? "CENTRAL-BOARD-DIRECT" : (localSavedReg && localSavedReg !== "REG-2026" ? localSavedReg : ("REG-" + sessionUid.slice(-6).toUpperCase())),
        place: localSavedPlace || "Kerala",
        phone: localSavedPhone || "",
        email: cleanEmail,
        ownerUid: sessionUid,
        role: isSuper ? "superadmin" : "institution"
      };

      await setDoc(instDocRef, {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (dbErr) {
    console.warn("Firestore profile fetch fallback:", dbErr);
    profile = {
      id: sessionUid,
      name: isLocalRealName ? localSavedName : (cleanEmail.split("@")[0].toUpperCase() + " Madrasa"),
      regNo: localSavedReg || "REG-DEFAULT",
      place: localSavedPlace || "Kerala",
      phone: localSavedPhone || "",
      email: cleanEmail,
      ownerUid: sessionUid,
      role: "institution"
    };
  }

  // Save to LocalStorage for persistent seamless session
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(userSession));
  localStorage.setItem(LOCAL_INSTITUTION_KEY, JSON.stringify(profile));

  return { session: userSession, profile };
}

export async function signupInstitution(
  email: string, 
  password: string, 
  madrasaName: string, 
  regNo: string, 
  place: string, 
  phone: string
): Promise<{ session: AppUserSession; profile: SaaSInstitutionProfile }> {
  const cleanEmail = email.trim().toLowerCase();
  let sessionUid = "";
  let userSession: AppUserSession;

  try {
    const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    sessionUid = userCred.user.uid;
    userSession = {
      uid: userCred.user.uid,
      email: userCred.user.email,
      displayName: madrasaName
    };
  } catch (err: any) {
    console.warn("Firebase Auth createUser fallback:", err.code || err.message);
    
    // In sandbox or when Email/Password provider isn't enabled in console
    try {
      const anon = await signInAnonymously(auth);
      sessionUid = anon.user.uid;
    } catch (anonErr) {
      sessionUid = generateUidFromEmail(cleanEmail);
    }

    userSession = {
      uid: sessionUid,
      email: cleanEmail,
      displayName: madrasaName
    };
  }

  const profile: SaaSInstitutionProfile = {
    id: sessionUid,
    name: madrasaName.trim(),
    regNo: regNo.trim() || "REG-2026",
    place: place.trim() || "Kerala",
    phone: phone.trim() || "",
    email: cleanEmail,
    ownerUid: sessionUid,
    role: "institution"
  };

  try {
    await setDoc(doc(db, "institutions", sessionUid), {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (dbErr) {
    console.error("Firestore setDoc profile warning:", dbErr);
  }

  // Also sync to backend API leads database so SuperAdmin can access all registered users & phone numbers
  try {
    fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: sessionUid,
        name: profile.name,
        regNo: profile.regNo,
        place: profile.place,
        phone: profile.phone,
        email: profile.email,
        students: []
      })
    }).catch((apiErr) => console.warn("Backend lead sync warning:", apiErr));
  } catch (e) {
    // Non-blocking
  }

  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(userSession));
  localStorage.setItem(LOCAL_INSTITUTION_KEY, JSON.stringify(profile));

  return { session: userSession, profile };
}

export async function quickDemoLogin(demoRole: "institution" | "superadmin"): Promise<{ session: AppUserSession; profile: SaaSInstitutionProfile }> {
  const demoEmail = demoRole === "superadmin" ? "superadmin@meladportal.com" : "principal.anwar@madrasa.org";
  const sessionUid = demoRole === "superadmin" ? "superadmin_state_board" : "demo_inst_anwar_madaris";

  const userSession: AppUserSession = {
    uid: sessionUid,
    email: demoEmail,
    displayName: demoRole === "superadmin" ? "State Central Board Admin" : "أنوار المدارس (Anwar-ul-Madaris)"
  };

  const profile: SaaSInstitutionProfile = {
    id: sessionUid,
    name: demoRole === "superadmin" ? "State Central Board Admin" : "أنوار المدارس (Anwar-ul-Madaris)",
    regNo: demoRole === "superadmin" ? "STATE-BOARD-2026" : "Reg No: 4892 / SKIMVB",
    place: "Malappuram, Kerala",
    phone: "+91 98470 12345",
    email: demoEmail,
    ownerUid: sessionUid,
    role: demoRole
  };

  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(userSession));
  localStorage.setItem(LOCAL_INSTITUTION_KEY, JSON.stringify(profile));

  return { session: userSession, profile };
}

export async function logoutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.warn("Firebase signOut:", e);
  }
  // Clear user identity and profile
  localStorage.removeItem(LOCAL_SESSION_KEY);
  localStorage.removeItem(LOCAL_INSTITUTION_KEY);
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_phone");

  // Comprehensive reset: Clear all madrasa workspace keys so Madrassa A data does not bleed into Madrassa B on account switch
  const keysToRemove = [
    "madrasa_students",
    "madrasa_halls",
    "madrasa_name",
    "madrasa_reg_no",
    "madrasa_place",
    "madrasa_whatsapp",
    "madrasas_list",
    "active_madrasa_id",
    "madrasa_class_divisions_map",
    "madrasa_class_shifts",
    "madrasa_saved_shift_allocations",
    "madrasa_attendance_days",
    "madrasa_exam_timetable",
    "madrasa_hall_ticket_instructions",
    "madrasa_official_boards_cache",
    "madrasa_active_board_metadata",
    "madrasa_seating_locked"
  ];
  keysToRemove.forEach(k => {
    try { localStorage.removeItem(k); } catch (e) {}
  });

  try { sessionStorage.clear(); } catch (e) {}
}

export async function requestLicenseActivation(
  userId: string,
  data: {
    madrasaName: string;
    regNo: string;
    place: string;
    phone: string;
    totalStudents: number;
    totalHalls: number;
  }
): Promise<void> {
  const reqDocRef = doc(db, "licenseRequests", userId);
  await setDoc(reqDocRef, {
    ...data,
    status: "pending",
    requestedAt: serverTimestamp(),
  }, { merge: true });
}

export function getSavedLocalSession(): { session: AppUserSession | null; profile: SaaSInstitutionProfile | null } {
  try {
    const savedS = localStorage.getItem(LOCAL_SESSION_KEY);
    const savedP = localStorage.getItem(LOCAL_INSTITUTION_KEY);
    const session: AppUserSession | null = savedS ? JSON.parse(savedS) : null;
    const profile: SaaSInstitutionProfile | null = savedP ? JSON.parse(savedP) : null;

    if (profile) {
      if (session && isSuperAdminEmail(session.email)) {
        profile.role = "superadmin";
      } else if (profile.role === "superadmin") {
        if (!session || !isSuperAdminEmail(session.email)) {
          profile.role = "institution";
        }
      }
    }

    return { session, profile };
  } catch (e) {
    return { session: null, profile: null };
  }
}

/**
 * Automatically logs user action and syncs WhatsApp & details to SuperAdmin CRM
 */
export async function trackUserActivity(data: {
  id?: string;
  name?: string;
  madrasaName?: string;
  phone?: string;
  regNo?: string;
  place?: string;
  email?: string;
  studentCount?: number;
  hallCount?: number;
  action?: string;
}): Promise<void> {
  try {
    const payload = {
      ...data,
      name: data.name || data.madrasaName,
      timestamp: new Date().toISOString()
    };

    // 1. Post to backend CRM endpoint (0 Firestore writes)
    fetch("/api/track-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (e) {
    // Non-blocking
  }
}

/**
 * Saves complete user workspace to cloud under their WhatsApp phone number (Data Loss Prevention)
 */
export async function saveCloudBackupByPhone(
  phone: string, 
  madrasaName: string, 
  regNo: string, 
  place: string, 
  payload: any
): Promise<{ success: boolean; message: string; updatedAt?: string }> {
  try {
    const res = await fetch("/api/cloud-backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, madrasaName, regNo, place, payload })
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, message: e.message || "Failed to save cloud backup" };
  }
}

/**
 * Restores user workspace from cloud using their WhatsApp phone number
 */
export async function restoreCloudBackupByPhone(
  phone: string
): Promise<{ success: boolean; backup?: any; error?: string }> {
  try {
    const res = await fetch(`/api/cloud-backup/${encodeURIComponent(phone)}`);
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, backup: data.backup };
    }
    return { success: false, error: data.error || "No backup found" };
  } catch (e: any) {
    return { success: false, error: e.message || "Network error" };
  }
}
