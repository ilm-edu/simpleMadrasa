import React, { useState } from "react";
import { 
  AlertTriangle, 
  Trash2, 
  RefreshCcw, 
  ShieldAlert, 
  X, 
  CheckCircle2, 
  FileWarning, 
  HardDrive,
  Database
} from "lucide-react";
import { Language } from "../translations";

interface FactoryResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFactoryWipe: (mode?: "clean_slate" | "fresh_template") => void;
  totalStudents: number;
  totalHalls: number;
  madrasaName: string;
  lang: Language;
}

export default function FactoryResetModal({
  isOpen,
  onClose,
  onFactoryWipe,
  totalStudents,
  totalHalls,
  madrasaName,
  lang
}: FactoryResetModalProps) {
  const [resetType, setResetType] = useState<"clean_slate">("clean_slate");
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"choose" | "confirm">("choose");

  if (!isOpen) return null;

  const requiredWord = "RESET";
  const isConfirmed = confirmationInput.trim().toUpperCase() === requiredWord;

  const handleExecuteWipe = () => {
    if (!isConfirmed) return;
    setIsProcessing(true);
    setTimeout(() => {
      onFactoryWipe(resetType);
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200 no-print">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-red-200 max-w-lg w-full overflow-hidden text-slate-800">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-700 to-red-800 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-red-200 hover:text-white p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-white shrink-0 shadow-inner">
              <ShieldAlert className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <span className="text-3xs font-extrabold uppercase tracking-widest text-amber-300 bg-red-950/50 px-2.5 py-0.5 rounded-md border border-amber-300/30">
                Danger Zone • System Wipe
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-1">
                {lang === "ml" ? "ഫാക്ടറി ഡാറ്റ റീസെറ്റ് (Factory Wipe)" : "Factory Data Reset & Full Wipe"}
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {step === "choose" ? (
            <div className="space-y-4">
              <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-900 leading-relaxed">
                  <p className="font-bold">
                    {lang === "ml" 
                      ? "ശ്രദ്ധിക്കുക: ഈ പ്രവർത്തനം നിങ്ങളുടെ എല്ലാ വിദ്യാർത്ഥികളുടെയും ഹാളുകളുടെയും വിവരങ്ങൾ മായ്ച്ചുകളയും."
                      : "Warning: This action will permanently erase your current seating allocations, student directory, and hall configurations."}
                  </p>
                  <p className="mt-1 text-red-700 text-3xs font-mono">
                    Madrasa: {madrasaName || "Current Workspace"}
                  </p>
                </div>
              </div>

              {/* Data Summary Stats */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block">
                    {lang === "ml" ? "വിദ്യാർത്ഥികൾ" : "Active Students"}
                  </span>
                  <span className="text-xl font-black text-slate-800">{totalStudents}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block">
                    {lang === "ml" ? "പരീക്ഷാ ഹാളുകൾ" : "Exam Halls"}
                  </span>
                  <span className="text-xl font-black text-slate-800">{totalHalls}</span>
                </div>
              </div>

              {/* Reset Type Options */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === "ml" ? "റീസെറ്റ് ഓപ്ഷൻ തെരഞ്ഞെടുക്കുക:" : "Select Reset Method:"}
                </label>

                {/* Option 1: Clean Slate */}
                <div 
                  onClick={() => setResetType("clean_slate")}
                  className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                    resetType === "clean_slate" 
                      ? "border-red-500 bg-red-50/50 shadow-xs ring-2 ring-red-400/20" 
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="resetType" 
                    checked={resetType === "clean_slate"}
                    onChange={() => setResetType("clean_slate")}
                    className="mt-1 text-red-600 focus:ring-red-500"
                  />
                  <div className="text-xs">
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span>{lang === "ml" ? "പൂർണ്ണമായി മായ്ക്കുക (Clean Slate - Empty)" : "Complete Blank Wipe (Clean Slate)"}</span>
                    </div>
                    <p className="text-slate-500 text-3xs mt-1 leading-snug">
                      {lang === "ml" 
                        ? "എല്ലാ വിദ്യാർത്ഥികളെയും ഹാളുകളെയും സീറ്റിംഗ് പ്ലാനുകളെയും മായ്ച്ച് പൂർണ്ണമായും പുതിയ ബ്ലാങ്ക് സ്റ്റേറ്റാക്കി മാറ്റുന്നു." 
                        : "Erases all students, halls, and seating charts to zero records. Start fresh with 0 items."}
                    </p>
                  </div>
                </div>


              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  {lang === "ml" ? "റദ്ദാക്കുക (Cancel)" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("confirm")}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>{lang === "ml" ? "സ്ഥിരീകരണത്തിലേക്ക് (Proceed)" : "Proceed to Confirm"}</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ) : (
            /* Confirmation Step */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-4 text-center space-y-2">
                <FileWarning className="w-8 h-8 text-red-600 mx-auto" />
                <h3 className="text-sm font-black text-red-950 uppercase tracking-tight">
                  {lang === "ml" ? "അന്തിമ സ്ഥിരീകരണം ആവശ്യമാണ്" : "Final Verification Required"}
                </h3>
                <p className="text-xs text-red-800 leading-relaxed">
                  {lang === "ml" 
                    ? `തുടരാൻ താഴെ നൽകിയിരിക്കുന്ന ബോക്സിൽ "${requiredWord}" എന്ന് ടൈപ്പ് ചെയ്യുക:`
                    : `Please type "${requiredWord}" in the confirmation box below to proceed with the wipe:`}
                </p>
              </div>

              <div>
                <label className="block text-3xs font-black uppercase text-slate-500 mb-1">
                  Type <span className="text-red-600 font-mono font-bold text-xs">{requiredWord}</span> to confirm:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder={`Type ${requiredWord} here`}
                  className="w-full p-3 border-2 border-red-300 rounded-xl bg-red-50/50 font-mono font-black text-sm text-center tracking-widest text-red-900 focus:border-red-600 focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("choose");
                    setConfirmationInput("");
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  ← {lang === "ml" ? "പിന്നിലേക്ക്" : "Back"}
                </button>
                <button
                  type="button"
                  disabled={!isConfirmed || isProcessing}
                  onClick={handleExecuteWipe}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  {isProcessing ? (
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>
                    {lang === "ml" ? "ഡാറ്റ പൂർണ്ണമായി മായ്ക്കുക" : "Execute Full Reset"}
                  </span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
