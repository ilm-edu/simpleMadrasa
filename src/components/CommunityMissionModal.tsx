import React, { useState } from "react";
import { 
  Heart, 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  MessageSquare, 
  HelpCircle, 
  CheckCircle2, 
  X, 
  QrCode, 
  PhoneCall, 
  Mail, 
  Gift, 
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { Language } from "../translations";
import { getLocalSystemConfig } from "../systemConfig";

interface CommunityMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onAgreeAndContinue?: () => void;
  isFirstTimeConsent?: boolean;
}

export default function CommunityMissionModal({
  isOpen,
  onClose,
  lang,
  onAgreeAndContinue,
  isFirstTimeConsent = false
}: CommunityMissionModalProps) {
  const [copiedUPI, setCopiedUPI] = useState(false);
  const [ideaText, setIdeaText] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderMadrasa, setSenderMadrasa] = useState("");
  const [selectedTab, setSelectedTab] = useState<"mission" | "support" | "suggest">("mission");

  if (!isOpen) return null;

  const sysCfg = getLocalSystemConfig();
  const cleanPhone = (sysCfg.adminWhatsApp || "9633465267").replace(/\D/g, "");
  const formattedWaPhone = cleanPhone.startsWith("91") && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;
  const upiId = sysCfg.gpayUpiId || "9633465267@okbizaxis";
  const supportChatUrl = `https://wa.me/${formattedWaPhone}?text=${encodeURIComponent("അസ്സലാമു അലൈക്കും, മദ്റസ എക്സാം & റിസൾട്ട് പോർട്ടൽ സംബന്ധിച്ച സഹായത്തിനായി ബന്ധപ്പെടുന്നു.")}`;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUPI(true);
    setTimeout(() => setCopiedUPI(false), 2500);
  };

  const handleSendIdeaWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaText.trim()) return;

    const message = encodeURIComponent(
      `*മദ്റസ എക്സാം മാസ്റ്റർ - പുതിയ സോഫ്റ്റ്‌വെയർ നിർദ്ദേശം*\n\n` +
      `👤 *പേര്:* ${senderName.trim() || "അധ്യാപകൻ / രക്ഷാധികാരി"}\n` +
      `🏫 *സ്ഥാപനം:* ${senderMadrasa.trim() || "മദ്റസ / സ്കൂൾ"}\n` +
      `💡 *നിർദ്ദേശം / ആശയം:*\n${ideaText.trim()}\n\n` +
      `_സൗജന്യ സോഫ്റ്റ്‌വെയർ സംരംഭത്തിന് എല്ലാ ആശംസകളും!_`
    );

    window.open(`https://wa.me/${formattedWaPhone}?text=${message}`, "_blank");
    setIdeaText("");
  };

  const handleAgreeClick = () => {
    try {
      localStorage.setItem("madrasa_mission_agreed", "true");
    } catch (e) {}
    if (onAgreeAndContinue) {
      onAgreeAndContinue();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150 no-print overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-emerald-100 max-w-2xl w-full overflow-hidden text-slate-800 my-auto animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Banner Header */}
        <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 p-5 sm:p-6 text-white relative shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
                <Heart className="w-6 h-6 fill-emerald-400 text-emerald-400" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  {lang === "ml" ? "സൗജന്യ & ലാഭേച്ഛയില്ലാത്ത സേവനം" : "100% Free Non-Profit Initiative"}
                </div>
                <h2 className="text-lg sm:text-2xl font-black text-white leading-tight">
                  {lang === "ml" ? "വിദ്യാഭ്യാസ സ്ഥാപനങ്ങളുടെ പുരോഗതിക്കായി" : "For The Advancement of Institutions"}
                </h2>
              </div>
            </div>

            {!isFirstTimeConsent && (
              <button
                type="button"
                onClick={onClose}
                className="text-emerald-200/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Pills */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-emerald-700/50 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedTab("mission")}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer ${
                selectedTab === "mission" 
                  ? "bg-white text-emerald-950 shadow-sm" 
                  : "bg-emerald-950/60 text-emerald-200 hover:bg-emerald-800/60"
              }`}
            >
              📖 {lang === "ml" ? "സേവന ലക്ഷ്യം" : "Our Mission"}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab("support")}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedTab === "support" 
                  ? "bg-amber-400 text-amber-950 shadow-sm" 
                  : "bg-emerald-950/60 text-emerald-200 hover:bg-emerald-800/60"
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              {lang === "ml" ? "പിന്തുണ / സംഭാവന" : "Support & Donate"}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab("suggest")}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedTab === "suggest" 
                  ? "bg-white text-emerald-950 shadow-sm" 
                  : "bg-emerald-950/60 text-emerald-200 hover:bg-emerald-800/60"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {lang === "ml" ? "പുതിയ സോഫ്റ്റ്‌വെയറുകൾ ആവശ്യപ്പെടാം" : "Suggest Software"}
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {selectedTab === "mission" && (
            <div className="space-y-4 text-slate-700 leading-relaxed text-sm">
              {/* Highlight Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50/70 border border-emerald-200 text-slate-800">
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">🕌</span>
                  <div>
                    <h3 className="font-extrabold text-emerald-950 text-base mb-1">
                      {lang === "ml" 
                        ? "ഇതൊരു ബിസിനസ് സംരംഭമല്ല — തികച്ചും ഒരു സദ്‌സേവനം!"
                        : "This is NOT a commercial business — It's a non-profit educational service!"}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600">
                      {lang === "ml"
                        ? "മദ്റസകളുടെയും ഇസ്‌ലാമിക പാഠശാലകളുടെയും പൊതുവിദ്യാഭ്യാസ സ്ഥാപനങ്ങളുടെയും പരീക്ഷാ ജോലികൾ എളുപ്പമാക്കാനും അധ്യാപകരുടെ വിലയേറിയ സമയം ലാഭിക്കാനുമാണ് ഈ സോഫ്റ്റ്‌വെയർ രൂപകൽപ്പന ചെയ്തിട്ടുള്ളത്."
                        : "This software is built entirely to empower madrasas, religious institutions, and educational centers to effortlessly manage examinations and seating."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Point 1: Admin Expenses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2 mb-1.5 text-emerald-800 font-black text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{lang === "ml" ? "ചെലവുകൾ അഡ്മിൻ വഹിക്കുന്നു" : "All Server Costs Covered by Admin"}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {lang === "ml"
                      ? "ഈ സോഫ്റ്റ്‌വെയർ പ്രവർത്തിക്കാനാവശ്യമായ സെർവർ, ഡൊമൈൻ, ക്ലൗഡ് സ്റ്റോറേജ് തുടങ്ങിയ മുഴുവൻ സാമ്പത്തിക ചെലവുകളും അഡ്മിൻ സ്വന്തം നിലയ്ക്കാണ് വഹിക്കുന്നത്."
                      : "Server hosting, cloud storage, maintenance, and ongoing upgrades are completely sponsored by the developer."}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2 mb-1.5 text-blue-800 font-black text-xs">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{lang === "ml" ? "എപ്പോഴും സൗജന്യം (Zero Fee)" : "Forever Free for Institutions"}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {lang === "ml"
                      ? "വിദ്യാർത്ഥികളെ ചേർക്കുന്നതിനോ, സീറ്റിംഗ് തയ്യാറാക്കുന്നതിനോ, സ്മാർട്ട് ഡെസ്ക് സ്റ്റിക്കർ പ്രിന്റുകൾ ഡൗൺലോഡ് ചെയ്യുന്നതിനോ യാതൊരു ചാർജ്ജും ഈടാക്കുന്നില്ല."
                      : "No subscription fees or paywalls. All seat allocation tools, attendance sheets, and sticker exports are free."}
                  </p>
                </div>
              </div>

              {/* Du'a & Goodwill */}
              <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/80 text-amber-950 text-xs font-medium flex items-center gap-3">
                <span className="text-xl">🤲</span>
                <p>
                  {lang === "ml"
                    ? "വിദ്യാഭ്യാസ നന്മയ്ക്കായി തയ്യാറാക്കിയ ഈ സോഫ്റ്റ്‌വെയർ ഉപയോഗിക്കുമ്പോൾ നിങ്ങളുടെ പ്രാർത്ഥനകളിൽ അഡ്മിനെയും കുടുംബത്തെയും ഉൾപ്പെടുത്തണമെന്ന് വിനീതമായി അഭ്യർത്ഥിക്കുന്നു."
                    : "Please remember the developer and their family in your kind prayers while benefiting from this software."}
                </p>
              </div>
            </div>
          )}

          {selectedTab === "support" && (
            <div className="space-y-4 text-slate-700 leading-relaxed text-sm">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950">
                <div className="flex items-start gap-3">
                  <Gift className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-extrabold text-amber-950 text-base mb-1">
                      {lang === "ml" ? "സ്വമേധയാ ഉള്ള പിന്തുണ & സഹായം" : "Voluntary Support & Maintenance Contribution"}
                    </h3>
                    <p className="text-xs text-amber-900/90">
                      {lang === "ml"
                        ? "ഈ സോഫ്റ്റ്‌വെയർ ഭാവിയിലും തടസ്സമില്ലാതെ സൗജന്യമായി നിലനിർത്താനും പുതിയ ഫീച്ചറുകൾ ഉൾപ്പെടുത്താനുമുള്ള സെർവർ ചെലവുകൾക്കായി നിങ്ങൾക്ക് ഇഷ്ടമുള്ള ഒരു ചെറിയ തുക സംഭാവന (Hadya / Sadaqah) നൽകി അഡ്മിനെ പിന്തുണയ്ക്കാം."
                        : "If you find this software helpful and wish to support ongoing server hosting and new development, voluntary contributions are warmly welcome."}
                    </p>
                  </div>
                </div>
              </div>

              {/* UPI & Payment Box */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                    <QrCode className="w-4 h-4 text-slate-700" />
                    <span>UPI ID / GPay / PhonePe</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm tracking-wide select-all">
                    {upiId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUPI}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    {copiedUPI ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedUPI ? (lang === "ml" ? "കോപ്പി ചെയ്തു!" : "Copied!") : (lang === "ml" ? "കോപ്പി ചെയ്യുക" : "Copy")}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  {lang === "ml" 
                    ? "✨ ഏതൊരു തുകയും നിങ്ങളുടെ സൗകര്യത്തിനും ഇഷ്ടത്തിനും അനുസരിച്ച് നൽകാവുന്നതാണ്. യാതൊരു നിർബന്ധവുമില്ല."
                    : "Contributions are entirely voluntary with no minimum amount requirement."}
                </p>
              </div>
            </div>
          )}

          {selectedTab === "suggest" && (
            <div className="space-y-4 text-slate-700 text-sm">
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-extrabold text-blue-950 text-base mb-1">
                      {lang === "ml" ? "നിങ്ങൾക്ക് ആവശ്യമായ മറ്റ് സൗജന്യ സോഫ്റ്റ്‌വെയറുകൾ നിർദ്ദേശിക്കാം!" : "Suggest New Free Software Tools"}
                    </h3>
                    <p className="text-xs text-blue-900/90">
                      {lang === "ml"
                        ? "മദ്റസകൾക്കും സ്കൂളുകൾക്കും ഉപകാരപ്പെടുന്ന മറ്റ് സോഫ്റ്റ്‌വെയറുകൾ (ഉദാ: അഡ്മിഷൻ ഫോം, ഫീസ് രജിസ്റ്റർ, ഐഡി കാർഡ് മേക്കർ, സർട്ടിഫിക്കറ്റ് പ്രിന്റർ തുടങ്ങിയവ) വേണമെങ്കിൽ നിങ്ങളുടെ ആശയങ്ങൾ അഡ്മിനെ അറിയിക്കാം."
                        : "Have an idea for another free tool for your madrasa or school? Tell the admin and we will build it for you!"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggestion Form */}
              <form onSubmit={handleSendIdeaWhatsApp} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 mb-1">
                      {lang === "ml" ? "നിങ്ങളുടെ പേര് (ഓപ്ഷണൽ)" : "Your Name (Optional)"}
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder={lang === "ml" ? "ഉദാ: ഉസ്താദ് റഫീഖ്" : "e.g. Usthad Rafeeq"}
                      className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 mb-1">
                      {lang === "ml" ? "സ്ഥാപനത്തിന്റെ പേര് (ഓപ്ഷണൽ)" : "Institution Name (Optional)"}
                    </label>
                    <input
                      type="text"
                      value={senderMadrasa}
                      onChange={(e) => setSenderMadrasa(e.target.value)}
                      placeholder={lang === "ml" ? "ഉദാ: ദാറുസ്സലാം മദ്റസ" : "e.g. Darussalam Madrasa"}
                      className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">
                    {lang === "ml" ? "നിങ്ങളുടെ സോഫ്റ്റ്‌വെയർ നിർദ്ദേശം / ആശയം *" : "Your Software Idea / Feature Request *"}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={ideaText}
                    onChange={(e) => setIdeaText(e.target.value)}
                    placeholder={lang === "ml" ? "എന്തൊക്കെ ഫീച്ചറുകളാണ് അടുത്ത സൗജന്യ സോഫ്റ്റ്‌വെയറിൽ നിങ്ങൾക്ക് ആവശ്യമുള്ളത് എന്ന് ഇവിടെ എഴുതുക..." : "Describe the features you need in the next free software tool..."}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {lang === "ml" ? "വാട്സാപ്പ് വഴി അയക്കുക (WhatsApp)" : "Send via WhatsApp"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-2xs text-slate-600 font-medium text-center sm:text-left">
            <a
              href={supportChatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === "ml" ? "വാട്സാപ്പിൽ ചാറ്റ് ചെയ്യുക (WhatsApp Support)" : "Chat on WhatsApp Support"}</span>
            </a>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isFirstTimeConsent ? (
              <button
                type="button"
                onClick={handleAgreeClick}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {lang === "ml" ? "സമ്മതിക്കുന്നു & തുടരുക (Agree & Continue)" : "I Agree & Continue to Software"}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
              >
                {lang === "ml" ? "ശരി, മനസ്സിലായി" : "Close"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
