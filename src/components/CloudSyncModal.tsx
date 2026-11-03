import React, { useState } from "react";
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Phone, 
  Building2, 
  Sparkles,
  Lock,
  RotateCcw
} from "lucide-react";
import { saveCloudBackupByPhone, restoreCloudBackupByPhone, trackUserActivity } from "../authService";
import { Language } from "../translations";

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  madrasaName: string;
  madrasaRegNo: string;
  madrasaPlace: string;
  madrasaWhatsapp: string;
  onSaveWhatsapp: (phone: string) => void;
  getCurrentWorkspacePayload: () => any;
  onRestoreWorkspace: (payload: any) => void;
  studentCount: number;
  hallCount: number;
}

export default function CloudSyncModal({
  isOpen,
  onClose,
  lang,
  madrasaName,
  madrasaRegNo,
  madrasaPlace,
  madrasaWhatsapp,
  onSaveWhatsapp,
  getCurrentWorkspacePayload,
  onRestoreWorkspace,
  studentCount,
  hallCount
}: CloudSyncModalProps) {
  const [phone, setPhone] = useState(madrasaWhatsapp || "");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeMode, setActiveMode] = useState<"backup" | "restore">("backup");

  if (!isOpen) return null;

  const handleBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 9) {
      setStatusMsg({
        type: "error",
        text: lang === "ml" ? "ദയവായി സാധുവായ വാട്സ്ആപ്പ് ഫോൺ നമ്പർ നൽകുക." : "Please enter a valid WhatsApp phone number."
      });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const payload = getCurrentWorkspacePayload();
      const res = await saveCloudBackupByPhone(phone, madrasaName, madrasaRegNo, madrasaPlace, payload);

      if (res.success) {
        onSaveWhatsapp(phone);
        // Track activity in CRM
        trackUserActivity({
          madrasaName,
          phone,
          regNo: madrasaRegNo,
          place: madrasaPlace,
          studentCount,
          hallCount,
          action: `Cloud Backup Saved (${studentCount} Students)`
        });

        setStatusMsg({
          type: "success",
          text: lang === "ml" 
            ? "✅ മദ്റസയിലെ എല്ലാ വിദ്യാർത്ഥികളുടെ വിവരങ്ങളും സീറ്റിംഗ് പ്ലാനും ക്ലൗഡിൽ സുരക്ഷിതമായി സേവ് ചെയ്തു!" 
            : "✅ Full Madrasa Workspace backed up to Cloud securely!"
        });

        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMsg({ type: "error", text: res.message || "Failed to backup data." });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Backup failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 9) {
      setStatusMsg({
        type: "error",
        text: lang === "ml" ? "ദയവായി വാട്സ്ആപ്പ് നമ്പർ നൽകുക." : "Please enter WhatsApp phone number."
      });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await restoreCloudBackupByPhone(phone);
      if (res.success && res.backup) {
        onRestoreWorkspace(res.backup.payload);
        onSaveWhatsapp(phone);
        
        // Track activity
        trackUserActivity({
          madrasaName: res.backup.madrasaName || madrasaName,
          phone,
          regNo: res.backup.regNo || madrasaRegNo,
          place: res.backup.place || madrasaPlace,
          studentCount: res.backup.payload?.students?.length || studentCount,
          hallCount: res.backup.payload?.halls?.length || hallCount,
          action: "Restored Workspace from Cloud Backup"
        });

        setStatusMsg({
          type: "success",
          text: lang === "ml" 
            ? `✅ "${res.backup.madrasaName || "മദ്റസ"}" വിവരങ്ങൾ വിജയകരമായി വീണ്ടെടുത്തു!` 
            : `✅ Successfully restored workspace for ${res.backup.madrasaName}!`
        });

        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMsg({
          type: "error",
          text: res.error || (lang === "ml" ? "ഈ നമ്പറിൽ ബാക്കപ്പ് കണ്ടെത്തിയില്ല." : "No backup found for this number.")
        });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Restore failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            ✕
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Cloud className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-3xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                Data Protection & Cloud Sync
              </span>
              <h2 className="text-lg font-black tracking-tight text-white mt-1">
                {lang === "ml" ? "ക്ലൗഡ് ബാക്കപ്പ് & ഡാറ്റ സംരക്ഷണം" : "Cloud Backup & Data Sync"}
              </h2>
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setActiveMode("backup"); setStatusMsg(null); }}
            className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              activeMode === "backup"
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <CloudUpload className="w-4 h-4" />
            <span>{lang === "ml" ? "ഇപ്പോൾ സേവ് ചെയ്യുക (Backup)" : "Save Cloud Backup"}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveMode("restore"); setStatusMsg(null); }}
            className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              activeMode === "restore"
                ? "bg-indigo-700 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <CloudDownload className="w-4 h-4" />
            <span>{lang === "ml" ? "ഡാറ്റ വീണ്ടെടുക്കുക (Restore)" : "Restore from Number"}</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {statusMsg && (
            <div className={`p-3 rounded-2xl flex items-start gap-2 text-xs font-bold ${
              statusMsg.type === "success" 
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800" 
                : "bg-red-50 border border-red-200 text-red-800"
            }`}>
              {statusMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {activeMode === "backup" ? (
            <form onSubmit={handleBackup} className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-1 text-xs text-emerald-950">
                <div className="font-extrabold flex items-center gap-1.5 text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{lang === "ml" ? "വിവരങ്ങൾ ഒരിക്കലും നഷ്ടപ്പെടില്ല" : "Never Lose Your Work"}</span>
                </div>
                <p className="text-2xs text-emerald-800 leading-relaxed">
                  {lang === "ml"
                    ? "നിങ്ങൾ എന്റർ ചെയ്ത വിദ്യാർത്ഥികളുടെ പേരുകൾ, ക്ലാസുകൾ, പരീക്ഷാ ഹാളുകൾ എന്നിവ നിങ്ങളുടെ WhatsApp നമ്പറുമായി ബന്ധിപ്പിച്ച് ക്ലൗഡിൽ സുരക്ഷിതമായി സൂക്ഷിക്കുന്നു."
                    : "Your students, classes, and seating allocations are saved to high-speed cloud under your WhatsApp number."}
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{lang === "ml" ? "ഉസ്താദ് / മദ്റസ WhatsApp നമ്പർ:" : "Usthad / Madrasa WhatsApp Number:"} *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    autoComplete="off"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={lang === "ml" ? "ഉദാ: 9876543210" : "e.g. 9876543210"}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-slate-900 font-mono font-bold text-sm outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-3xs">
                  <div>
                    <span className="text-slate-400">Madrasa:</span>
                    <p className="font-bold text-slate-800 truncate">{madrasaName || "My Madrasa"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Current Items:</span>
                    <p className="font-bold text-emerald-700 font-mono">{studentCount} Students • {hallCount} Halls</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold rounded-2xl text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <CloudUpload className="w-4 h-4" />
                <span>
                  {loading 
                    ? (lang === "ml" ? "ക്ലൗഡിലേക്ക് സേവ് ചെയ്യുന്നു..." : "Saving to Cloud...") 
                    : (lang === "ml" ? "ക്ലൗഡിൽ ബാക്കപ്പ് ചെയ്യുക" : "Save & Sync to Cloud")}
                </span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRestore} className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 space-y-1 text-xs text-indigo-950">
                <div className="font-extrabold flex items-center gap-1.5 text-indigo-900">
                  <RotateCcw className="w-4 h-4 text-indigo-600" />
                  <span>{lang === "ml" ? "മറ്റൊരു ഫോണിൽ നിന്ന് വർക്ക് തുടരാം" : "Seamlessly Switch Devices"}</span>
                </div>
                <p className="text-2xs text-indigo-800 leading-relaxed">
                  {lang === "ml"
                    ? "നേരത്തെ സേവ് ചെയ്ത WhatsApp നമ്പർ നൽകി ഏതൊരു കമ്പ്യൂട്ടറിലോ ഫോണിലോ നിങ്ങളുടെ ഡാറ്റ തത്സമയം തിരിച്ചെടുക്കാം."
                    : "Enter your registered WhatsApp number to restore all student data, halls, and seating charts onto any screen."}
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{lang === "ml" ? "രജിസ്റ്റർ ചെയ്ത WhatsApp നമ്പർ നൽകുക:" : "Enter Registered WhatsApp Number:"} *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    autoComplete="off"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={lang === "ml" ? "ഉദാ: 9876543210" : "e.g. 9876543210"}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 rounded-xl p-3 text-slate-900 font-mono font-bold text-sm outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-extrabold rounded-2xl text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <CloudDownload className="w-4 h-4" />
                <span>
                  {loading 
                    ? (lang === "ml" ? "ഡാറ്റ കണ്ടെത്തുന്നു..." : "Restoring...") 
                    : (lang === "ml" ? "ഡാറ്റ വീണ്ടെടുക്കുക (Restore Data)" : "Fetch & Restore Data")}
                </span>
              </button>
            </form>
          )}

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-2 text-3xs text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{lang === "ml" ? "100% സുരക്ഷിതം. നിങ്ങളുടെ വിവരങ്ങൾ സ്വകാര്യമായിരിക്കും." : "Encrypted & secure. Only accessible via your number."}</span>
          </div>

        </div>

      </div>
    </div>
  );
}
