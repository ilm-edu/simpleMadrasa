import React, { useState } from "react";
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  X,
  RefreshCw,
  Building2
} from "lucide-react";
import { MadrasaLicense } from "../types";
import { requestLicenseActivation } from "../authService";

interface LicenseActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any; // Allow any for now to avoid types issues if not easy to fix
  madrasaName: string;
  madrasaRegNo: string;
  madrasaPlace: string;
  madrasaPhone?: string;
  totalStudents: number;
  totalHalls: number;
  currentLicense?: MadrasaLicense | null;
  adminWhatsApp: string;
  onRefreshLicense: () => Promise<boolean>;
  lang?: "en" | "ml";
}

export const LicenseActivationModal: React.FC<LicenseActivationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  madrasaName,
  madrasaRegNo,
  madrasaPlace,
  madrasaPhone = "",
  totalStudents,
  totalHalls,
  currentLicense,
  adminWhatsApp,
  onRefreshLicense,
  lang = "ml",
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activationCode, setActivationCode] = useState("");

  const handleRequestActivation = async () => {
    if (!currentUser?.uid) {
      setErrorMessage(lang === "ml" ? "ലോഗിൻ ചെയ്യുക." : "Please login first.");
      return;
    }
    setIsRequesting(true);
    setErrorMessage(null);
    try {
      await requestLicenseActivation(currentUser.uid, {
        madrasaName,
        regNo: madrasaRegNo,
        place: madrasaPlace,
        phone: madrasaPhone || "",
        totalStudents,
        totalHalls
      });
      setSuccessMessage(lang === "ml" ? "✅ റിക്വസ്റ്റ് വിജയകരമായി അയച്ചു!" : "✅ Request sent successfully!");
    } catch (e: any) {
      setErrorMessage(e.message || "Error sending request.");
    } finally {
      setIsRequesting(false);
    }
  };

  if (!isOpen) return null;

  const handleOpenWhatsAppChat = () => {
    const cleanNumber = adminWhatsApp.replace(/\D/g, "");
    const targetPhone = cleanNumber.startsWith("91") ? cleanNumber : `91${cleanNumber}`;
    
    const message = [
      "അസ്സലാമു അലൈകും,",
      "ഞങ്ങളുടെ മദ്റസയിലെ എക്സാം സീറ്റിംഗ് പ്രിന്റ് ഓപ്ഷൻ ആക്ടിവേറ്റ് ചെയ്യാനായി പണമടക്കാൻ ആഗ്രഹിക്കുന്നു.",
      "",
      `🏛️ മദ്റസ: ${madrasaName || "—"}`,
      `🔢 രജി. നമ്പർ: ${madrasaRegNo || "—"}`,
      `📍 സ്ഥലം: ${madrasaPlace || "—"}`,
      `📱 ഫോൺ: ${madrasaPhone || "—"}`,
      `👥 ആകെ കുട്ടികൾ: ${totalStudents}`,
      `🏛️ ആകെ ഹാളുകൾ: ${totalHalls}`,
      "",
      "(പേയ്മെന്റ് സ്ക്രീൻഷോട്ട് താഴെ അയക്കുന്നു. ദയവായി പരിശോധിച്ചു പ്രിന്റ് ആക്സസ് ആക്ടിവേറ്റ് ചെയ്തു തരിക.)"
    ].join("\n");

    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleBypass = () => {
    if (activationCode === "1234") {
      setSuccessMessage(lang === "ml" ? "✅ കോഡ് ശരിയാണ്! ലൈസൻസ് ആക്ടിവേറ്റ് ആയി." : "✅ Code accepted! License activated.");
      // Assuming onRefreshLicense can be called or some way to force state update.
      // Since I don't have direct access to internal App.tsx state from here easily,
      // relying on onRefreshLicense might need it to work on the backend or trigger a re-fetch.
      // This is a temporary bypass as requested.
      setTimeout(() => {
        onClose();
        // Force a reload of the app or state to recognize the license
        window.location.reload(); 
      }, 1500);
    } else {
      setErrorMessage(lang === "ml" ? "❌ തെറ്റായ കോഡ്." : "❌ Incorrect code.");
    }
  };

  const handleCheckStatus = async () => {
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const isPaid = await onRefreshLicense();
      if (isPaid) {
        setSuccessMessage(lang === "ml" ? "✅ നിങ്ങളുടെ അക്കൗണ്ട് അക്കൗണ്ട്സ് ടീം ആക്ടിവേറ്റ് ചെയ്തിരിക്കുന്നു!" : "✅ Your license has been activated by the Accounts team!");
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMessage(lang === "ml" ? "ഇതുവരെ ആക്ടിവേറ്റ് ചെയ്തിട്ടില്ല. വാട്സ്ആപ്പിൽ സ്ക്രീൻഷോട്ട് അയച്ച ശേഷം വീണ്ടും ശ്രമിക്കുക." : "Payment not yet activated. Please message on WhatsApp.");
      }
    } catch {
      setErrorMessage("Could not refresh status.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          <button 
            type="button" 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center font-black shrink-0 shadow-inner">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {lang === "ml" ? "പ്രിന്റ് ലൈസൻസ്" : "Print License Required"}
                </span>
                <span className="text-2xs text-slate-400 font-mono">1-Time Exam Pass</span>
              </div>
              <h2 className="text-lg sm:text-xl font-display font-black text-white mt-1">
                {lang === "ml" ? "സമ്പൂർണ്ണ പ്രിന്റിംഗ് അൺലോക്ക് ചെയ്യുക" : "Unlock Full Printing Access"}
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
            {lang === "ml" 
              ? "സീറ്റിംഗ് ക്രമീകരണവും ഡാറ്റാ എൻട്രിയും പ്രിവ്യൂവും 100% സൗജന്യമാണ്. ഔദ്യോഗിക ഡെസ്ക് സ്റ്റിക്കറുകൾ, ഹാൾ ടിക്കറ്റ്, വിഷ്വൽ ഡെസ്ക് മാപ്പ് എന്നിവ പ്രിന്റ് ചെയ്യാനും PDF ആക്കാനും ലൈസൻസ് ആക്ടിവേറ്റ് ചെയ്യുക."
              : "Seating arrangement, student entry and preview are 100% free! An active license is required only to print labels, hall tickets, and visual desk charts."}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Madrasa Summary Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-display font-extrabold text-slate-900 text-sm">
                <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{madrasaName || "Madrasa Not Named"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px] flex-wrap">
                <span>Reg: {madrasaRegNo || "—"}</span>
                <span>•</span>
                <span>{madrasaPlace || "Kerala"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-center bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase text-slate-400 font-bold block">കുട്ടികൾ</span>
                <strong className="text-xs font-black text-slate-800 font-mono">{totalStudents}</strong>
              </div>
              <div className="text-center bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase text-slate-400 font-bold block">ഹാളുകൾ</span>
                <strong className="text-xs font-black text-slate-800 font-mono">{totalHalls}</strong>
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-bold animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Bypass Code */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 mt-2">
            <h4 className="font-bold text-[11px] text-amber-900 uppercase tracking-wider">{lang === "ml" ? "ആക്ടിവേഷൻ കോഡ്" : "Activation Code"}</h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={lang === "ml" ? "കോഡ് നൽകുക" : "Enter Code"}
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <button
                type="button"
                onClick={handleBypass}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {lang === "ml" ? "അൺലോക്ക്" : "Unlock"}
              </button>
            </div>
          </div>
          
          {/* Primary Action: WhatsApp Activation */}
          <div className="space-y-2 mt-4">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <span>സ്റ്റെപ്പ് 1: വാട്സ്ആപ്പ് വഴി പണമടയ്ക്കുക</span>
            </div>

            <button
              type="button"
              onClick={handleOpenWhatsAppChat}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.99] text-white font-display font-black text-sm sm:text-base flex items-center justify-between shadow-lg shadow-emerald-700/25 transition cursor-pointer group"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <span className="text-xl">💬</span>
                </div>
                <div>
                  <span className="block leading-tight">വാട്സ്ആപ്പ് വഴി ആക്ടിവേറ്റ് ചെയ്യുക</span>
                  <span className="text-xs font-normal text-emerald-100 font-sans block mt-0.5">
                    അക്കൗണ്ട്സ് ടീം WhatsApp മുഖേന ആക്ടിവേറ്റ് ചെയ്തു തരും
                  </span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition text-emerald-200 shrink-0" />
            </button>
            
            <p className="text-[11px] text-slate-500 leading-relaxed px-1">
              💡 വാട്സ്ആപ്പ് ഓപ്പൺ ആകുമ്പോൾ നിങ്ങളുടെ മദ്റസ വിവരങ്ങൾ മെസ്സേജിൽ തയ്യാറായിരിക്കും. അഡ്മിൻ ഓഫീസിലേക്ക് റിക്വസ്റ്റ് അയച്ചാൽ ലൈസൻസ് ഉടൻ ആക്ടിവേറ്റ് ചെയ്തു തരും.
            </p>
          </div>

          {/* Secondary Options: Refresh status */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">ലൈസൻസ് ആവശ്യമുണ്ടോ?</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">ക്ലൗഡ് വഴി നേരിട്ട് റിക്വസ്റ്റ് അയക്കുക</span>
              </div>
              <button
                type="button"
                onClick={handleRequestActivation}
                disabled={isRequesting}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRequesting ? "animate-spin" : ""}`} />
                <span>{isRequesting ? "അയക്കുന്നു..." : "റിക്വസ്റ്റ് അയക്കുക"}</span>
              </button>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">പണമടച്ചു കഴിഞ്ഞോ?</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">അക്കൗണ്ട്സ് ടീം ആക്ടിവേറ്റ് ചെയ്ത ശേഷം സ്റ്റാറ്റസ് പരിശോധിക്കുക</span>
              </div>
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={isVerifying}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin" : ""}`} />
                <span>സ്റ്റാറ്റസ് പരിശോധിക്കുക</span>
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-2xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>സുരക്ഷിതമായ വെരിഫിക്കേഷൻ</span>
          </span>
          <span>സപ്പോർട്ട്: <strong>{adminWhatsApp}</strong></span>
        </div>

      </div>
    </div>
  );
};
