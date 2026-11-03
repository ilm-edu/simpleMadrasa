import React, { useState } from "react";
import { Cloud, CheckCircle2, ShieldCheck, ArrowRight, X, AlertTriangle } from "lucide-react";
import { Language } from "../translations";

interface SaveWorkPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
  studentsCount: number;
  hallsCount: number;
  madrasaName: string;
  lang: Language;
}

export default function SaveWorkPromptModal({
  isOpen,
  onClose,
  onLoginClick,
  studentsCount,
  hallsCount,
  madrasaName,
  lang
}: SaveWorkPromptModalProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  if (!isOpen) return null;

  const handleDismiss = () => {
    if (dontAskAgain) {
      localStorage.setItem("madrasa_never_ask_login", "true");
    }
    sessionStorage.setItem("madrasa_login_prompt_shown", "true");
    onClose();
  };

  const handleProceedLogin = () => {
    sessionStorage.setItem("madrasa_login_prompt_shown", "true");
    onClose();
    onLoginClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200 no-print">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden text-slate-800">
        {/* Header with Emerald & Amber Accent */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
              <Cloud className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-3xs font-extrabold uppercase tracking-widest text-amber-300 bg-amber-950/70 px-2 py-0.5 rounded-md border border-amber-500/30">
                {lang === "ml" ? "ഡാറ്റാ സുരക്ഷ" : "Data Preservation"}
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-1">
                {lang === "ml" ? "ഡാറ്റ പിന്നീട് ലഭിക്കാൻ ലോഗിൻ ചെയ്യണോ?" : "Save Your Entered Madrasa Data?"}
              </h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {lang === "ml" ? (
              <>
                നിങ്ങൾ ഇപ്പോൾ തയ്യാറാക്കിക്കൊണ്ടിരിക്കുന്ന വിവരങ്ങൾ ഭാവിയിൽ നഷ്ടപ്പെടാതെ സൂക്ഷിക്കാനും, 
                മറ്റൊരു ഫോണിലോ കമ്പ്യൂട്ടറിലോ ഇതേ ഡാറ്റ വീണ്ടും ഓപ്പൺ ചെയ്യാനും <strong className="text-emerald-800 font-bold">സൗജന്യമായി ലോഗിൻ ചെയ്യണോ?</strong>
              </>
            ) : (
              <>
                Would you like to log in so your entered student data, seating, and hall allocations are safely backed up to the cloud and retrievable on any device later?
              </>
            )}
          </p>

          {/* Current Progress Summary Badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs space-y-1.5">
            <div className="text-3xs font-extrabold uppercase tracking-wider text-slate-400">
              {lang === "ml" ? "നിങ്ങൾ തയ്യാറാക്കിയ ഡാറ്റ:" : "Current Workspace:"}
            </div>
            <div className="flex flex-wrap items-center gap-3 font-semibold text-slate-800">
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                👥 <strong className="text-emerald-700">{studentsCount}</strong> {lang === "ml" ? "വിദ്യാർത്ഥികൾ" : "Students"}
              </span>
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                🏫 <strong className="text-blue-700">{hallsCount}</strong> {lang === "ml" ? "ഹാളുകൾ" : "Halls"}
              </span>
            </div>
            {madrasaName && (
              <div className="text-2xs text-slate-500 truncate pt-1">
                🏫 {madrasaName}
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-2xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              {lang === "ml"
                ? "ലോഗിൻ ചെയ്യാതിരുന്നാൽ ബ്രൗസർ ഹിസ്റ്ററി ക്ലിയർ ചെയ്യുമ്പോഴോ മറ്റൊരു ഡിവൈസ് എടുക്കുമ്പോഴോ ഈ ഡാറ്റ നഷ്ടപ്പെടാൻ സാധ്യതയുണ്ട്."
                : "Without logging in, clearing your browser cache or switching devices will cause entered local data to be lost."}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleProceedLogin}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
            >
              <span>{lang === "ml" ? "✨ അതെ, ലോഗിൻ ചെയ്തു സേവ് ചെയ്യുക" : "✨ Yes, Log In & Save Progress"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              {lang === "ml" ? "ഇപ്പോൾ വേണ്ട, സാധാരണ പോലെ തുടരുക" : "Not Now, Continue Working Locally"}
            </button>
          </div>

          {/* Don't ask again checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="dontAskAgain"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="dontAskAgain" className="text-2xs text-slate-500 cursor-pointer select-none">
              {lang === "ml" ? "ഇനി ഈ സെഷനിൽ ഇത് ചോദിക്കരുത്" : "Don't show this reminder again on this device"}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
