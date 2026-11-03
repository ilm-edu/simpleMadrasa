import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { BrowserMultiFormatReader } from "@zxing/library";
import {
  User, 
  LogOut, 
  ShieldCheck, 
  CheckCircle2,
  AlertCircle,
  Calendar,
  Key,
  Package,
  Settings,
  ExternalLink,
  ArrowRight
} from "lucide-react";
import { 
  SaaSInstitutionProfile, 
  AppUserSession, 
  loginWithGoogle,
  loginWithDirectEmailOrPhone,
  logoutUser,
  isSuperAdminEmail
} from "../authService";
import { Language } from "../translations";

export type { SaaSInstitutionProfile };

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUserSession | null;
  currentInstitution: SaaSInstitutionProfile | null;
  onAuthSuccess: (user: AppUserSession, profile: SaaSInstitutionProfile) => void;
  lang: Language;
  saveDataPrompt?: boolean;
  isSuperAdmin?: boolean;
  onOpenSuperAdminTab?: (tab: "madrasas" | "timetables" | "orders" | "commercial" | "system_settings") => void;
  onOpenQuickLicenseModal?: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  currentInstitution,
  onAuthSuccess,
  lang,
  saveDataPrompt = false,
  isSuperAdmin = false,
  onOpenSuperAdminTab,
  onOpenQuickLicenseModal
}: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);

  const [showQRBox, setShowQRBox] = useState(false);
  const [qrCodeStr, setQrCodeStr] = useState<string>("");
  const [shortCodeStr, setShortCodeStr] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const pollTimerRef = useRef<any>(null);

  // Authorize Desktop States (from phone)
  const [showLinkComputerInput, setShowLinkComputerInput] = useState(false);
  const [linkQrInput, setLinkQrInput] = useState("");
  const [isAuthorizingDesktop, setIsAuthorizingDesktop] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);

  // Preview Iframe & Direct Login Fallbacks
  const [showFallbackEmailInput, setShowFallbackEmailInput] = useState(false);
  const [fallbackEmailVal, setFallbackEmailVal] = useState("");
  const [showDirectInput, setShowDirectInput] = useState(false);
  const [directInputVal, setDirectInputVal] = useState("");

  const startScanning = async () => {
    setShowScanner(true);
    setErrorMsg(null);
    scannerRef.current = new BrowserMultiFormatReader();
    try {
      await scannerRef.current.decodeFromVideoDevice(null, videoRef.current!, (result) => {
        if (result) {
          setLinkQrInput(result.getText());
          stopScanning();
        }
      });
    } catch (e: any) {
      console.warn("Scan error:", e);
      setShowScanner(false);
      setErrorMsg(
        e?.name === "NotAllowedError" || e?.name === "NotFoundError"
          ? (lang === "ml"
              ? "ക്യാമറ അനുമതി നിഷേധിച്ചു. ദയവായി ബ്രൗസർ സെറ്റിംഗ്സിൽ ക്യാമറ അനുമതി നൽകുക അല്ലെങ്കിൽ സ്ക്രീനിലുള്ള കോഡ് ഉപയോഗിക്കുക."
              : "Camera permission was denied. Please allow camera access in browser settings or use the code on screen.")
          : (lang === "ml" ? "ക്യാമറ പ്രവർത്തിപ്പിക്കുന്നതിൽ തടസ്സം." : "Could not initialize camera.")
      );
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.reset();
      scannerRef.current = null;
    }
    setShowScanner(false);
  };

  const handleAuthorizeDesktop = async () => {
    if (!linkQrInput.trim() || !currentUser) return;
    setIsAuthorizingDesktop(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/qr-authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: linkQrInput.trim(),
          session: currentUser,
          profile: currentInstitution
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(lang === "ml" ? "✅ ലാപ്‌ടോപ്പിലേക്ക് വിജയകരമായി ലോഗിൻ അനുമതി നൽകി!" : "✅ Successfully authorized computer login!");
        setLinkQrInput("");
        setShowLinkComputerInput(false);
      } else {
        setErrorMsg(data.error || "Failed to authorize computer login");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Authorization error");
    } finally {
      setIsAuthorizingDesktop(false);
    }
  };

  const initQrSession = async () => {
    try {
      const res = await fetch("/api/auth/qr-session", { method: "POST" });
      const data = await res.json();
      if (data.success && data.code) {
        setQrCodeStr(data.code);
        setShortCodeStr(data.shortCode);
        const url = await QRCode.toDataURL(data.code, {
          width: 250,
          margin: 1.5,
          color: { dark: "#064e3b", light: "#ffffff" }
        });
        setQrDataUrl(url);
      }
    } catch (e) {
      console.warn("QR init error:", e);
    }
  };

  useEffect(() => {
    if (isOpen && !currentUser && showQRBox) {
      initQrSession();
    }
  }, [isOpen, currentUser, showQRBox]);

  // Poll for QR login authorization from computer
  useEffect(() => {
    if (!isOpen || currentUser || !qrCodeStr || !showQRBox) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/qr-status/${qrCodeStr}`);
        const data = await res.json();
        if (data.success && data.status === "authorized" && data.sessionData) {
          clearInterval(pollTimerRef.current);
          const { session, profile } = data.sessionData;
          localStorage.setItem("melad_saas_user_session", JSON.stringify(session));
          localStorage.setItem("melad_saas_institution_profile", JSON.stringify(profile));
          onAuthSuccess(session, profile);
          setSuccessMsg(lang === "ml" ? "🎉 മൊബൈലിൽ നിന്ന് QR കോഡ് വഴി വിജയകരമായി ലോഗിൻ ചെയ്തു!" : "🎉 Successfully logged in via QR Code!");
          setTimeout(() => onClose(), 600);
        } else if (data.status === "expired") {
          clearInterval(pollTimerRef.current);
          initQrSession();
        }
      } catch (e) {}
    }, 2000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen, currentUser, qrCodeStr, showQRBox, lang, onClose]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async (method: "popup" | "redirect" = "popup") => {
    setLoading(true);
    setErrorMsg(null);
    setIsPopupBlocked(false);
    try {
      const result = await loginWithGoogle(method);
      if (result && result.session && result.profile) {
        onAuthSuccess(result.session, result.profile);
        setSuccessMsg(
          result.profile.role === "superadmin"
            ? (lang === "ml" ? "👑 സൂപ്പർ അഡ്മിൻ ഗൂഗിൾ അക്കൗണ്ട് വിജയകരമായി ലോഗിൻ ചെയ്തു!" : "👑 SuperAdmin Google Account Verified & Logged in!")
            : (lang === "ml" ? "ഗൂഗിൾ അക്കൗണ്ട് വഴി വിജയകരമായി ലോഗിൻ ചെയ്തു!" : "Logged in with Google successfully!")
        );
        setTimeout(() => onClose(), 500);
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      const code = err?.code || "";
      const msg = err?.message || "";
      if (msg === "POPUP_BLOCKED" || code === "auth/popup-blocked" || code === "auth/cancelled-popup-request" || msg.includes("popup")) {
        setIsPopupBlocked(true);
        setErrorMsg(
          lang === "ml" 
            ? "ഗൂഗിൾ ലോഗിൻ പോപ്പപ്പ് ബ്രൗസർ തടഞ്ഞു (Popup Blocked). താഴെ കാണുന്ന ബട്ടൺ വഴി ലോഗിൻ ചെയ്യാൻ ശ്രമിക്കുക."
            : "Google login popup was blocked. Please click 'Try Alternative Login' below."
        );
      } else if (code === "auth/popup-closed-by-user") {
        setErrorMsg(
          lang === "ml"
            ? "ലോഗിൻ വിൻഡോ ക്ലോസ് ചെയ്തു (Popup closed by user). വീണ്ടും ശ്രമിക്കുക."
            : "Sign-in popup was closed before completing. Please try again."
        );
      } else if (code === "auth/network-request-failed") {
        setErrorMsg(
          lang === "ml"
            ? "ഇന്റർനെറ്റ് കണക്ഷനിൽ തടസ്സം നേരിട്ടു. കണക്ഷൻ പരിശോധിക്കുക."
            : "Network error. Please check your internet connection and try again."
        );
      } else if (code === "auth/operation-not-supported-in-this-environment") {
        setErrorMsg(
          lang === "ml"
            ? "ഈ ബ്രൗസർ എൻവയോൺമെന്റിൽ ലോഗിൻ തടസ്സപ്പെട്ടു. ദയവായി താഴെയുള്ള ഡയറക്ട് ലോഗിൻ അല്ലെങ്കിൽ ക്വിക്ക് QR ഉപയോഗിക്കുക."
            : "Redirect login is not supported in this frame. Please use Direct Sign-in or QR Login."
        );
      } else {
        setErrorMsg(err.message || (lang === "ml" ? "ഗൂഗിൾ ലോഗിൻ ചെയ്യുന്നതിൽ തടസ്സം നേരിട്ടു." : "Google Sign-In failed. Please try again."));
      }
      setLoading(false);
    }
  };

  const handleDirectSignIn = async () => {
    if (!directInputVal.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const draftProfile = {
        name: localStorage.getItem("madrasa_name") || "",
        regNo: localStorage.getItem("madrasa_reg_no") || "",
        place: localStorage.getItem("madrasa_place") || "",
        phone: localStorage.getItem("madrasa_whatsapp") || ""
      };
      const { session, profile } = await loginWithDirectEmailOrPhone(directInputVal, undefined, draftProfile);
      onAuthSuccess(session, profile);
      setSuccessMsg(
        profile.role === "superadmin"
          ? (lang === "ml" ? "👑 സൂപ്പർ അഡ്മിൻ അക്കൗണ്ട് വിജയകരമായി ലോഗിൻ ചെയ്തു!" : "👑 SuperAdmin Account Verified & Logged in!")
          : (lang === "ml" ? "അക്കൗണ്ട് വഴി വിജയകരമായി ലോഗിൻ ചെയ്തു!" : "Logged in successfully!")
      );
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      console.error("Direct sign-in error:", err);
      setErrorMsg(err.message || (lang === "ml" ? "ലോഗിൻ ചെയ്യുന്നതിൽ തടസ്സം നേരിട്ടു." : "Sign-In failed."));
    } finally {
      setLoading(false);
    }
  };
  const handleSignOut = async () => {
    await logoutUser();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            ✕
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <span className="text-3xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                {saveDataPrompt ? (lang === "ml" ? "ഡാറ്റ സുരക്ഷിതമാക്കാം" : "Save Your Data") : "User Account"}
              </span>
              <h2 className="text-lg font-black tracking-tight text-white mt-1">
                {currentUser 
                  ? (lang === "ml" ? "സ്ഥാപനത്തിന്റെ അക്കൗണ്ട്" : "Institution Account") 
                  : saveDataPrompt
                  ? (lang === "ml" ? "ഡാറ്റ തിരികെ ലഭിക്കാൻ ലോഗിൻ ചെയ്യുക" : "Login to Save & Sync Data")
                  : (lang === "ml" ? "സ്ഥാപന ലോഗിൻ / രജിസ്ട്രേഷൻ" : "Institution Login & Portal Access")}
              </h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {saveDataPrompt && !currentUser && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
              <span className="text-base shrink-0">💾</span>
              <div>
                <strong className="font-bold block">
                  {lang === "ml" ? "തയ്യാറാക്കിയ വിവരങ്ങൾ നഷ്ടപ്പെടാതെ സൂക്ഷിക്കാം" : "Save Your Progress to Cloud"}
                </strong>
                <span className="text-amber-800 text-2xs leading-relaxed">
                  {lang === "ml"
                    ? "ഇപ്പോൾ ലോഗിൻ ചെയ്താൽ നിങ്ങൾ നൽകിയ കുട്ടികളുടെ ലിസ്റ്റും സീറ്റിംഗും ഏത് മൊബൈലിൽ നിന്നും കമ്പ്യൂട്ടറിൽ നിന്നും വീണ്ടും ലഭ്യമാകും."
                    : "Logging in ensures your entered students, halls, and seating arrangements are safely backed up to the cloud."}
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2 text-xs text-emerald-800 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {currentUser ? (
            /* Logged In State */
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider">Active Institution</span>
                    <h3 className="text-base font-black text-slate-900">{currentInstitution?.name || "Institution"}</h3>
                    <p className="text-xs text-slate-500 font-mono">{currentInstitution?.regNo} • {currentInstitution?.place}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-3xs font-extrabold rounded-full uppercase">
                    {currentInstitution?.role || "Active"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-3xs block">Logged in User:</span>
                    <span className="font-bold text-slate-700 font-mono truncate block">
                      {currentInstitution?.role === "superadmin"
                        ? (currentUser.displayName || "Super Admin")
                        : (currentUser.email || currentUser.displayName)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-3xs block">Cloud Sync:</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Connected
                    </span>
                  </div>
                </div>
              </div>

              {/* EXCLUSIVE SUPERADMIN POWER SUITE - STRICTLY RESTRICTED TO edavachalniyas@gmail.com */}
              {Boolean(
                currentUser &&
                (isSuperAdmin || (currentUser.email && isSuperAdminEmail(currentUser.email)) || currentUser.email === "edavachalniyas@gmail.com")
              ) && (
                <div className="rounded-2xl border-2 border-purple-500/40 bg-gradient-to-b from-purple-950/90 via-slate-900 to-slate-950 p-4 text-white shadow-xl space-y-3.5">
                  {/* Executive Header */}
                  <div className="flex items-center justify-between border-b border-purple-500/30 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-600/40 border border-purple-400/50 flex items-center justify-center text-amber-300 shadow-xs">
                        <ShieldCheck className="w-5 h-5 text-amber-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 font-mono">
                            Super Admin Executive Suite
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        </div>
                        <h4 className="text-xs font-black text-white">
                          {lang === "ml" ? "സൂപ്പർ അഡ്മിൻ എക്സിക്യൂട്ടീവ് ടൂളുകൾ" : "Master Admin Controls"}
                        </h4>
                      </div>
                    </div>
                    <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded-md bg-purple-900/80 text-purple-200 border border-purple-400/30">
                      edavachalniyas@gmail.com
                    </span>
                  </div>

                  {/* Primary Power Cards: Timetables & User License Issuance */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* 1. Timetable Management */}
                    <div className="bg-slate-900/90 border border-indigo-500/30 hover:border-indigo-400 rounded-xl p-3 flex flex-col justify-between gap-2.5 transition group shadow-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <span className="text-3xs font-mono font-bold text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-500/30">
                            SKIMVB · KJM
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                          {lang === "ml" ? "ടൈംടേബിൾ മാനേജ്മെന്റ്" : "Timetable Management"}
                        </h5>
                        <p className="text-3xs text-slate-400 leading-relaxed">
                          {lang === "ml"
                            ? "സമസ്ത (SKIMVB), KJM സെൻട്രൽ ബോർഡ് പരീക്ഷ ടൈംടേബിളുകൾ എഡിറ്റ് ചെയ്യുക, തീയതികൾ പബ്ലിഷ് ചെയ്യുക."
                            : "Central board exam timetables, master subjects catalog, dates & public release."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSuperAdminTab?.("timetables");
                        }}
                        className="w-full py-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold rounded-lg text-2xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>{lang === "ml" ? "ടൈംടേബിൾ മാറ്റം വരുത്തുക" : "Manage Timetables"}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* 2. User License Issuance */}
                    <div className="bg-slate-900/90 border border-amber-500/30 hover:border-amber-400 rounded-xl p-3 flex flex-col justify-between gap-2.5 transition group shadow-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                            <Key className="w-4 h-4" />
                          </div>
                          <span className="text-3xs font-mono font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30">
                            Quick Activate
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                          {lang === "ml" ? "മദ്റസ ലൈസൻസ് നൽകൽ" : "User License Issuance"}
                        </h5>
                        <p className="text-3xs text-slate-400 leading-relaxed">
                          {lang === "ml"
                            ? "മദ്റസകൾക്ക് 1-വർഷ പ്രിന്റ് പാസ് നൽകുക, ആക്റ്റിവേഷൻ കീ നൽകി WhatsApp വഴി അയക്കുക."
                            : "Activate 1-year licenses for institutions and send instant WhatsApp access keys."}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenQuickLicenseModal?.();
                          }}
                          className="flex-1 py-1.5 px-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-98 text-white font-extrabold rounded-lg text-2xs transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Key className="w-3 h-3" />
                          <span>{lang === "ml" ? "ലൈസൻസ് നൽകുക" : "Issue License"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenSuperAdminTab?.("madrasas");
                          }}
                          className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-2xs transition border border-slate-700 cursor-pointer"
                          title="Open Full Directory"
                        >
                          {lang === "ml" ? "ഡയറക്ടറി" : "Directory"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Power Action Shortcuts */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSuperAdminTab?.("orders");
                      }}
                      className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 rounded-xl flex items-center gap-2 text-left transition cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-white truncate">
                          {lang === "ml" ? "കൊറിയർ ഓർഡറുകൾ" : "Courier Orders"}
                        </div>
                        <div className="text-3xs text-slate-400 truncate">
                          {lang === "ml" ? "പ്രിന്റ് & ട്രാക്കിംഗ്" : "Print & Dispatch"}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSuperAdminTab?.("commercial");
                      }}
                      className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 rounded-xl flex items-center gap-2 text-left transition cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-purple-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-white truncate">
                          {lang === "ml" ? "സിസ്റ്റം കോൺഫിഗ്" : "System & Pricing"}
                        </div>
                        <div className="text-3xs text-slate-400 truncate">
                          {lang === "ml" ? "നിരക്കുകൾ & UPI" : "Pricing & Modules"}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Master SuperAdmin Console Full Access Button */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSuperAdminTab?.("madrasas");
                    }}
                    className="w-full py-2 px-3 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 hover:text-white rounded-xl text-2xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                    <span>{lang === "ml" ? "സൂപ്പർ അഡ്മിൻ പോർട്ടൽ മുഴുവനായി തുറക്കുക" : "Open Full Super Admin Console"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* LINK COMPUTER / OTHER DEVICE VIA QR BUTTON */}
              <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-purple-950">
                    <span>📲</span>
                    <span>{lang === "ml" ? "ലാപ്‌ടോപ്പ് / കമ്പ്യൂട്ടറിലേക്ക് ലോഗിൻ ചെയ്യാം" : "Link Computer via QR"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLinkComputerInput(!showLinkComputerInput)}
                    className="text-3xs font-extrabold text-purple-800 bg-purple-100 hover:bg-purple-200 px-2.5 py-1 rounded-lg transition"
                  >
                    {showLinkComputerInput ? (lang === "ml" ? "മറയ്ക്കുക" : "Hide") : (lang === "ml" ? "ലിങ്ക് ചെയ്യുക" : "Authorize")}
                  </button>
                </div>
                {showLinkComputerInput && (
                  <div className="space-y-3 pt-2">
                    <p className="text-[11px] text-slate-600">
                      {lang === "ml"
                        ? "ലാപ്‌ടോപ്പിലെ ലോഗിൻ കോഡ് ഇവിടെ നൽകുക അല്ലെങ്കിൽ സ്കാൻ ചെയ്യുക:"
                        : "Enter the code shown on your laptop screen or scan the QR code to authorize:"}
                    </p>

                    {showScanner ? (
                      <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500">
                        <video ref={videoRef} className="w-full h-48 object-cover" />
                        <button
                          type="button"
                          onClick={stopScanning}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={startScanning}
                        className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                      >
                        📷 {lang === "ml" ? "QR സ്കാൻ ചെയ്യുക" : "Scan QR Code"}
                      </button>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter QR Code (e.g. qr_1729...)"
                        value={linkQrInput}
                        onChange={(e) => setLinkQrInput(e.target.value)}
                        className="flex-1 bg-white border border-purple-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-850"
                      />
                      <button
                        type="button"
                        onClick={handleAuthorizeDesktop}
                        disabled={isAuthorizingDesktop || !linkQrInput.trim()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                      >
                        {isAuthorizingDesktop ? "..." : "Approve"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
                >
                  {lang === "ml" ? "ഡാഷ്‌ബോർഡിലേക്ക് തുടരുക" : "Continue to Dashboard"}
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 font-bold rounded-xl text-xs transition cursor-pointer border border-slate-200"
                >
                  <LogOut className="w-3.5 h-3.5 inline mr-1" /> {lang === "ml" ? "ലോഗ് ഔട്ട്" : "Sign Out"}
                </button>
              </div>
            </div>
          ) : (
            /* Non-Logged In State - Emerald Executive Design */
            <div className="space-y-4">
              <div className="bg-emerald-950/5 border border-emerald-900/10 p-4 rounded-2xl text-center space-y-1.5">
                <span className="text-3xs font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {lang === "ml" ? "സുരക്ഷിത ക്ലൗഡ് കണക്ഷൻ" : "Secure Cloud Authentication"}
                </span>
                <p className="text-xs text-slate-700 font-medium">
                  {lang === "ml"
                    ? "മദ്റസയുടെ വിവരങ്ങൾ സുരക്ഷിതമായി ക്ലൗഡിൽ സൂക്ഷിക്കാനും എവിടെനിന്നും മാനേജ് ചെയ്യാനും ലോഗിൻ ചെയ്യുക."
                    : "Sign in to securely sync and access your Madrasa exam data anywhere across devices."}
                </p>
              </div>

              {/* Google 1-Click Sign-In Button */}
              <button
                type="button"
                onClick={() => handleGoogleSignIn()}
                disabled={loading}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-900 font-black border-2 border-slate-300 hover:border-emerald-600 rounded-2xl text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-3 shadow-md hover:shadow-lg disabled:opacity-50 group"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="group-hover:text-emerald-950 font-extrabold">
                  {lang === "ml" ? "ഗൂഗിൾ അക്കൗണ്ട് വഴി ലോഗിൻ ചെയ്യുക" : "Continue with Google Account"}
                </span>
              </button>

              {/* Alternative Login Method (for mobile/popup issues) */}
              {(isPopupBlocked || errorMsg?.includes("Popup Blocked") || errorMsg?.includes("തടഞ്ഞു")) && (
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn("redirect")}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 animate-pulse"
                >
                  <span>🔄</span>
                  <span>{lang === "ml" ? "മറ്റൊരു രീതിയിൽ ലോഗിൻ ചെയ്യാൻ ശ്രമിക്കുക" : "Try Alternative Login Method"}</span>
                </button>
              )}




              {/* QR CODE QUICK CROSS-DEVICE LOGIN SECTION */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/80 shadow-2xs">
                <div className="p-3.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black">📱</span>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">
                        {lang === "ml" ? "ഫോൺ വഴി ക്വിക്ക് ലോഗിൻ (QR)" : "Instant QR Cross-Device Login"}
                      </span>
                      <span className="text-3xs text-slate-500 block">
                        {lang === "ml" ? "മൊബൈൽ ക്യാമറ ഉപയോഗിച്ച് സ്കാൻ ചെയ്യാം" : "Scan using your logged-in phone camera"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQRBox(!showQRBox)}
                    className="text-xs font-extrabold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
                  >
                    {showQRBox ? (lang === "ml" ? "മറയ്ക്കുക" : "Hide QR") : (lang === "ml" ? "QR കാണിക്കുക" : "Show QR Code")}
                  </button>
                </div>

                {showQRBox && (
                  <div className="p-4 space-y-3 bg-white animate-in fade-in duration-150 text-center">
                    <p className="text-[11px] text-slate-600 leading-relaxed max-w-xs mx-auto">
                      {lang === "ml"
                        ? "നിങ്ങളുടെ മൊബൈൽ ഫോണിൽ ഇതിനകം ലോഗിൻ ചെയ്ത അക്കൗണ്ട് തുറന്ന്, ഈ QR കോഡ് ക്യാമറ ഉപയോഗിച്ച് സ്കാൻ ചെയ്യുക."
                        : "Open your logged-in mobile phone camera and scan this QR code to instantly sign in on this computer."}
                    </p>

                    {qrDataUrl ? (
                      <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border-2 border-emerald-400/70 shadow-inner inline-block mx-auto">
                        <img src={qrDataUrl} alt="Login QR Code" className="w-44 h-44 object-contain rounded-xl bg-white p-1 border border-slate-200" />
                        <div className="mt-3 text-center">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">{lang === "ml" ? "അല്ലെങ്കിൽ ഈ കോഡ് നൽകുക" : "Or enter short code"}</p>
                          <span className="text-2xl font-black text-emerald-950 tracking-widest bg-emerald-100 px-3 py-1 rounded-xl border-2 border-emerald-300 font-mono">
                            {shortCodeStr}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold mt-2 animate-pulse flex items-center gap-1">
                          <span>⏳</span> <span>{lang === "ml" ? "മൊബൈൽ അനുമതിക്കായി കാത്തിരിക്കുന്നു..." : "Waiting for phone authorization..."}</span>
                        </span>
                      </div>
                    ) : (
                      <div className="py-8 text-xs text-slate-500 font-mono animate-pulse">
                        Generating QR Session...
                      </div>
                    )}

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={initQrSession}
                        className="text-3xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                      >
                        🔄 {lang === "ml" ? "QR കോഡ് റിഫ്രഷ് ചെയ്യുക" : "Refresh QR Code"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowDirectInput(!showDirectInput)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  {showDirectInput ? (lang === "ml" ? "ലോഗിൻ ബോക്സ് മറയ്ക്കുക" : "Hide Login Box") : (lang === "ml" ? "ഇമെയിൽ / ഫോൺ ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യുക" : "Sign in with Email / Phone")}
                </button>

                {showDirectInput && (
                  <div className="p-3.5 mt-3 bg-slate-50 border-2 border-emerald-500/30 rounded-2xl space-y-2.5 shadow-xs animate-in fade-in">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={lang === "ml" ? "ഇമെയിൽ അല്ലെങ്കിൽ വാട്ട്സ്ആപ്പ് ഫോൺ നമ്പർ" : "Email or WhatsApp Phone Number"}
                        value={directInputVal}
                        onChange={(e) => setDirectInputVal(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleDirectSignIn(); }}
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleDirectSignIn}
                        disabled={loading || !directInputVal.trim()}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black rounded-xl text-xs transition disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {loading ? "..." : (lang === "ml" ? "ലോഗിൻ" : "Sign In")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-1 text-2xs text-emerald-950">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{lang === "ml" ? "എൻക്രിപ്റ്റഡ് ക്ലൗഡ് ഡാറ്റ സിങ്ക്" : "Encrypted Cloud Data Sync"}</span>
                </div>
                <p className="leading-relaxed text-emerald-800 text-[11px]">
                  {lang === "ml"
                    ? "ഗൂഗിൾ അക്കൗണ്ട് വഴി ലോഗിൻ ചെയ്യുന്നതിലൂടെ നിങ്ങളുടെ ഡാറ്റ സുരക്ഷിതമായി ക്ലൗഡിൽ സൂക്ഷിക്കപ്പെടും."
                    : "Signing in with your Google Account ensures your entered students and seating remain safe in the cloud."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
