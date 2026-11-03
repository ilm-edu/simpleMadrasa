import React, { useState } from "react";
import { 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  Clock, 
  Copy, 
  Check, 
  X, 
  ArrowRight,
  ExternalLink,
  MessageCircle,
  AlertTriangle
} from "lucide-react";
import { MadrasaLicense } from "../types";

interface AdminQuickActivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  activationKey: string;
  madrasaName?: string;
  madrasaRegNo?: string;
  approverEmail: string;
  isAuthorized: boolean;
  onActivateSuccess: (license: MadrasaLicense) => void;
}

export const AdminQuickActivateModal: React.FC<AdminQuickActivateModalProps> = ({
  isOpen,
  onClose,
  activationKey,
  madrasaName = "",
  madrasaRegNo = "",
  approverEmail,
  isAuthorized,
  onActivateSuccess
}) => {
  const [inputKey, setInputKey] = useState<string>(activationKey || madrasaRegNo || madrasaName || "");
  const [inputName, setInputName] = useState<string>(madrasaName || "");
  const [inputRegNo, setInputRegNo] = useState<string>(madrasaRegNo || "");
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [amountPaid, setAmountPaid] = useState<number>(149);
  const [notes, setNotes] = useState<string>("WhatsApp payment screenshot verified");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activatedLicense, setActivatedLicense] = useState<MadrasaLicense | null>(null);
  const [hasCopiedReply, setHasCopiedReply] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setInputKey(activationKey || madrasaRegNo || madrasaName || "");
      setInputName(madrasaName || "");
      setInputRegNo(madrasaRegNo || "");
    }
  }, [isOpen, activationKey, madrasaName, madrasaRegNo]);

  if (!isOpen) return null;

  const targetKey = inputKey.trim() || inputRegNo.trim() || inputName.trim();

  const handleConfirmActivation = async () => {
    if (!targetKey) {
      setErrorMessage("ദയവായി മദ്റസ രജി. നമ്പറോ പേരോ നൽകുക (Madrasa Reg No or Name required)");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/licenses/activate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Email": approverEmail
        },
        body: JSON.stringify({
          key: targetKey,
          madrasaName: inputName.trim() || targetKey,
          regNo: inputRegNo.trim(),
          durationMonths,
          amountPaid,
          activatedBy: approverEmail,
          notes
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.license) {
        setActivatedLicense(data.license);
        onActivateSuccess(data.license);
      } else {
        setErrorMessage(data.error || "Failed to activate license.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error while activating license.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConfirmationReplyText = () => {
    return [
      "അസ്സലാമു അലൈകും,",
      `✅ നിങ്ങളുടെ മദ്റസയിലെ (${madrasaName || "Madrasa"}) എക്സാം സീറ്റിംഗ് പ്രിന്റ് ലൈസൻസ് വിജയകരമായി ആക്ടിവേറ്റ് ചെയ്തിരിക്കുന്നു!`,
      "",
      `🏛️ മദ്റസ: ${madrasaName || "—"}`,
      `🔢 രജി. നമ്പർ: ${madrasaRegNo || "—"}`,
      `⏳ കാലാവധി: ${durationMonths} മാസങ്ങൾ (Full Exam Season Pass)`,
      "",
      "ഇനി സോഫ്റ്റ്‌വെയർ റിഫ്രഷ് ചെയ്ത ശേഷം പ്രിന്റ് (Print/PDF) ഓപ്ഷൻ പരിധികളില്ലാതെ ഉപയോഗിക്കാവുന്നതാണ്.",
      "",
      "സഹായങ്ങൾക്ക് നന്ദി! - അക്കൗണ്ട്സ് ടീം"
    ].join("\n");
  };

  const handleCopyReply = () => {
    navigator.clipboard.writeText(getConfirmationReplyText());
    setHasCopiedReply(true);
    setTimeout(() => setHasCopiedReply(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border-2 border-indigo-500/40 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          <button 
            type="button" 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-400 flex items-center justify-center font-black shrink-0">
              <ShieldCheck className="w-7 h-7 text-indigo-300" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Admin / Accounts Verification
              </span>
              <h2 className="text-lg sm:text-xl font-display font-black text-white mt-1">
                മദ്റസ പ്രിന്റ് ലൈസൻസ് ആക്ടിവേഷൻ
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">

          {!isAuthorized ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-2">
              <div className="flex items-center gap-2 font-black text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>അനുമതിയില്ല (Unauthorized)</span>
              </div>
              <p className="text-xs leading-relaxed">
                ഈ മദ്റസയുടെ ലൈസൻസ് ആക്ടിവേറ്റ് ചെയ്യാൻ സൂപ്പർ അഡ്മിൻ അല്ലെങ്കിൽ അക്കൗണ്ട്സ് ടീം അംഗമായി ലോഗിൻ ചെയ്തിരിക്കണം. നിങ്ങളുടെ നിലവിലെ ഇമെയിൽ: <strong>{approverEmail || "ലോഗിൻ ചെയ്തിട്ടില്ല"}</strong>.
              </p>
            </div>
          ) : activatedLicense ? (
            /* Success View */
            <div className="space-y-4 py-2">
              <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-950 space-y-2 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h3 className="font-display font-black text-lg">
                  ലൈസൻസ് വിജയകരമായി ആക്ടിവേറ്റ് ചെയ്തു!
                </h3>
                <p className="text-xs text-emerald-800">
                  <strong>{madrasaName || activationKey}</strong> ഇനി മുതൽ പൂർണ്ണമായും പ്രിന്റിംഗ് അൺലോക്ക് ആയി പ്രവർത്തിക്കും.
                </p>
              </div>

              {/* WhatsApp Confirmation Message Copy Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-slate-600">
                    വാട്സ്ആപ്പിൽ യൂസർക്ക് അയക്കാനുള്ള മറുപടി:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyReply}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    {hasCopiedReply ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{hasCopiedReply ? "കോപ്പി ചെയ്തു!" : "കോപ്പി ചെയ്യുക"}</span>
                  </button>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                  {getConfirmationReplyText()}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-slate-900 hover:bg-black text-white font-black text-sm rounded-xl cursor-pointer transition"
              >
                പൂർത്തിയായി (Done)
              </button>
            </div>
          ) : (
            /* Activation Form View */
            <div className="space-y-4">
              
              {/* Madrasa Identity */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                    മദ്റസ വിവരങ്ങൾ (WhatsApp സന്ദേശം പ്രകാരം):
                  </span>
                  <span className="text-[10px] text-indigo-900 font-mono truncate max-w-[180px]">
                    Admin: <strong>{approverEmail}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      രജിസ്ട്രേഷൻ നമ്പർ (Reg No):
                    </label>
                    <input
                      type="text"
                      value={inputRegNo}
                      onChange={(e) => setInputRegNo(e.target.value)}
                      placeholder="ഉദാ: 12345"
                      className="w-full p-2 bg-white border border-indigo-200 rounded-xl font-mono font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      മദ്റസയുടെ പേര് (Name):
                    </label>
                    <input
                      type="text"
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      placeholder="മദ്റസയുടെ പേര്"
                      className="w-full p-2 bg-white border border-indigo-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                  {errorMessage}
                </div>
              )}

              {/* Options */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    കാലാവധി (Duration):
                  </label>
                  <select
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value={12}>12 മാസങ്ങൾ (1 വർഷം / Full Season)</option>
                    <option value={6}>6 മാസങ്ങൾ</option>
                    <option value={3}>3 മാസങ്ങൾ (One Exam)</option>
                    <option value={24}>24 മാസങ്ങൾ (2 വർഷം)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    ലഭിച്ച തുക (Amount):
                  </label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  കുറിപ്പ് (Internal Notes):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ഉദാ: GPay screenshot verified"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleConfirmActivation}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-display font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/25 transition cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>{isSubmitting ? "ആക്ടിവേറ്റ് ചെയ്യുന്നു..." : "✅ പ്രിന്റ് ലൈസൻസ് ആക്ടിവേറ്റ് ചെയ്യുക"}</span>
              </button>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
