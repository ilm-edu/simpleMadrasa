import React, { useState, useEffect } from "react";
import { Download, Smartphone, Monitor, CheckCircle2, X, Share, PlusSquare, ArrowRight, ShieldCheck } from "lucide-react";
import { Language } from "../translations";

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onNativeInstall?: () => void;
  canNativeInstall: boolean;
  isInstalled: boolean;
}

export default function InstallAppModal({
  isOpen,
  onClose,
  lang,
  onNativeInstall,
  canNativeInstall,
  isInstalled
}: InstallAppModalProps) {
  const [deviceType, setDeviceType] = useState<"android" | "ios" | "desktop">("android");

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      setDeviceType("ios");
    } else if (/android/i.test(userAgent)) {
      setDeviceType("android");
    } else {
      setDeviceType("desktop");
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 no-print overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-slate-800 my-auto animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-black uppercase tracking-wider mb-0.5">
                ⚡ Progressive Web App (PWA)
              </div>
              <h2 className="text-lg font-black leading-tight">
                {lang === "ml" ? "ആപ്പ് ഫോണിലും കമ്പ്യൂട്ടറിലും ഇൻസ്റ്റാൾ ചെയ്യാം" : "Install App on Phone & Desktop"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-black text-sm">
                {lang === "ml" ? "ആപ്പ് ഇതിനകം ഇൻസ്റ്റാൾ ചെയ്തിട്ടുണ്ട്!" : "Application is already installed!"}
              </h3>
              <p className="text-slate-600">
                {lang === "ml"
                  ? "നിങ്ങളുടെ ഹോം സ്ക്രീനിൽ നിന്നോ ആപ്പ് ലിസ്റ്റിൽ നിന്നോ നേരിട്ട് തുറക്കാവുന്നതാണ്."
                  : "You can launch it directly from your home screen or application menu."}
              </p>
            </div>
          ) : (
            <>
              {/* Native Quick Install Button if supported */}
              {canNativeInstall && onNativeInstall && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-950 text-sm">
                      {lang === "ml" ? "ഡയറക്റ്റ് വൺ-ക്ലിക്ക് ഇൻസ്റ്റാളേഷൻ:" : "Direct 1-Click Installation:"}
                    </span>
                    <span className="text-[10px] font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                      Fastest
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onNativeInstall();
                      onClose();
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{lang === "ml" ? "ഇപ്പോൾ ഇൻസ്റ്റാൾ ചെയ്യുക (Install App)" : "Install App Now"}</span>
                  </button>
                </div>
              )}

              {/* Device Selector Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDeviceType("android")}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    deviceType === "android" ? "bg-white text-emerald-900 shadow-2xs" : "text-slate-600"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Android</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceType("ios")}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    deviceType === "ios" ? "bg-white text-emerald-900 shadow-2xs" : "text-slate-600"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>iPhone / iPad</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceType("desktop")}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    deviceType === "desktop" ? "bg-white text-emerald-900 shadow-2xs" : "text-slate-600"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Computer / PC</span>
                </button>
              </div>

              {/* Manual Steps Guide */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-slate-700 leading-relaxed">
                {deviceType === "android" && (
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-900">
                      {lang === "ml" ? "ആൻഡ്രോയിഡ് ഫോണിൽ ചേർക്കാൻ:" : "Steps for Android Chrome:"}
                    </p>
                    <p>1. {lang === "ml" ? "ബ്രൗസറിന്റെ മുകളിലെ 3 ഡോട്ടുകളിൽ (⋮) ക്ലിക്ക് ചെയ്യുക." : "Tap the 3 dots (⋮) menu in Chrome."}</p>
                    <p>2. <strong>"Install app"</strong> അല്ലെങ്കിൽ <strong>"Add to Home screen"</strong> തിരഞ്ഞെടുക്കുക.</p>
                    <p>3. ഹോം സ്ക്രീനിൽ ഐക്കൺ വരുന്നതോടെ സാധാരണ ആപ്പ് പോലെ എപ്പോഴും ഉപയോഗിക്കാം.</p>
                  </div>
                )}

                {deviceType === "ios" && (
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Share className="w-3.5 h-3.5 text-blue-600" />
                      {lang === "ml" ? "ഐഫോൺ സഫാരിയിൽ ചേർക്കാൻ:" : "Steps for iOS Safari:"}
                    </p>
                    <p>1. {lang === "ml" ? "താഴെയുള്ള Share ബട്ടണിൽ ക്ലിക്ക് ചെയ്യുക." : "Tap the Share button at the bottom of Safari."}</p>
                    <p>2. താഴേക്ക് സ്ക്രോൾ ചെയ്ത് <strong>"Add to Home Screen" (ഹോം സ്ക്രീനിലേക്ക് ചേർക്കുക)</strong> അമർത്തുക.</p>
                    <p>3. മുകളിൽ <strong>"Add"</strong> ക്ലിക്ക് ചെയ്യുക.</p>
                  </div>
                )}

                {deviceType === "desktop" && (
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-900">
                      {lang === "ml" ? "കമ്പ്യൂട്ടറിൽ (Chrome / Edge):" : "Steps for PC / Mac:"}
                    </p>
                    <p>1. {lang === "ml" ? "അഡ്രസ്സ് ബാറിന്റെ വലതുവശത്തുള്ള Install ഐക്കണിൽ ക്ലിക്ക് ചെയ്യുക." : "Click the Install icon in the browser address bar."}</p>
                    <p>2. <strong>"Install"</strong> കൺഫേം ചെയ്യുക. ഡെസ്ക്ടോപ്പ് ആപ്പായി തനിയെ പ്രവർത്തിക്കും.</p>
                  </div>
                )}
              </div>

              {/* What happens on Updates Note */}
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>{lang === "ml" ? "ആപ്പിൽ അപ്ഡേറ്റ് വന്നാൽ എന്ത് സംഭവിക്കും?" : "What happens when app is updated?"}</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {lang === "ml"
                    ? "ആപ്പിൽ പുതിയ ഫീച്ചറുകളോ അപ്ഡേറ്റുകളോ വരുമ്പോൾ നിങ്ങൾ വീണ്ടും ഇൻസ്റ്റാൾ ചെയ്യേണ്ടതില്ല! നിങ്ങൾ ആപ്പ് ഓപ്പൺ ചെയ്യുമ്പോൾ തന്നെ തനിയെ (Automatic Background Update) അപ്ഡേറ്റ് ആകും. നിങ്ങളുടെ മദ്റസയിലെ ഡാറ്റകൾ സുരക്ഷിതമായി നിലനിൽക്കും."
                    : "Automatic seamless background updates! Whenever new features are released, opening the app automatically loads the latest version while keeping your saved students and data 100% safe."}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            {lang === "ml" ? "ശരി, മനസ്സിലായി" : "Got It"}
          </button>
        </div>
      </div>
    </div>
  );
}
