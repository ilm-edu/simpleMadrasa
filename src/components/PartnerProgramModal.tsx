import React, { useState } from "react";
import {
  Users,
  Briefcase,
  Sparkles,
  CheckCircle2,
  X,
  Send,
  Award,
  BookOpen,
  DollarSign,
  Share2,
  Building2,
  Calendar,
  Layers,
  Star,
  Check,
  PhoneCall,
  Mail,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  HeartHandshake
} from "lucide-react";
import { Language } from "../translations";
import { getLocalSystemConfig } from "../systemConfig";

interface PartnerProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onOpenCourierOrder?: () => void;
}

export interface PartnerRegistrationData {
  fullName: string;
  phone: string;
  whatsapp: string;
  email: string;
  place: string;
  panchayath: string;
  district: string;
  profession: string; // e.g. "Usthad", "DTP Center Owner", "Youth Club Volunteer", "Student", "Other"
  experience: string;
  targetMadrasasCount: string;
  notes: string;
}

export default function PartnerProgramModal({
  isOpen,
  onClose,
  lang,
  onOpenCourierOrder
}: PartnerProgramModalProps) {
  const [activeTab, setActiveTab] = useState<"partner_info" | "register" | "future_apps" | "business_model">("partner_info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const [formData, setFormData] = useState<PartnerRegistrationData>({
    fullName: "",
    phone: "",
    whatsapp: "",
    email: "",
    place: "",
    panchayath: "",
    district: "Malappuram",
    profession: "Usthad / Teacher",
    experience: "",
    targetMadrasasCount: "5-10 Madrasas",
    notes: ""
  });

  if (!isOpen) return null;

  const districtsList = [
    "Malappuram",
    "Kozhikode",
    "Kannur",
    "Kasaragod",
    "Wayanad",
    "Palakkad",
    "Thrissur",
    "Ernakulam",
    "Kottayam",
    "Idukki",
    "Alappuzha",
    "Pathanamthitta",
    "Kollam",
    "Thiruvananthapuram",
    "Outside Kerala / GCC"
  ];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const systemConfig = getLocalSystemConfig();

    try {
      // Store locally
      const existing = JSON.parse(localStorage.getItem("madrasa_partner_applications") || "[]");
      const appRecord = {
        ...formData,
        submittedAt: new Date().toISOString(),
        status: "approved"
      };
      existing.push(appRecord);
      localStorage.setItem("madrasa_partner_applications", JSON.stringify(existing));
      localStorage.setItem("is_registered_partner", "true");

      // Post to backend
      await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.fullName,
          phone: formData.whatsapp || formData.phone,
          email: formData.email,
          place: `${formData.place}, ${formData.panchayath}, ${formData.district}`,
          experience: formData.profession,
          expectedMadrasas: formData.targetMadrasasCount,
          note: formData.notes
        })
      }).catch(() => {});
    } catch (err) {}

    // Prepare WhatsApp Message
    const msg = encodeURIComponent(
      `*🤝 SEAT MANAGER AI STUDIO - ഒഫീഷ്യൽ പാർട്ണർ രജിസ്ട്രേഷൻ*\n\n` +
      `👤 *പേര്:* ${formData.fullName}\n` +
      `📞 *ഫോൺ / WhatsApp:* ${formData.whatsapp || formData.phone}\n` +
      `📍 *സ്ഥലം & ജില്ല:* ${formData.place}, ${formData.panchayath}, ${formData.district}\n` +
      `💼 *തൊഴിൽ / പദവി:* ${formData.profession}\n` +
      `🏫 *ലക്ഷ്യമിടുന്ന മദ്റസകളുടെ എണ്ണം:* ${formData.targetMadrasasCount}\n` +
      `📝 *കുറിപ്പ്:* ${formData.notes || "നിർദ്ദേശങ്ങളൊന്നുമില്ല"}\n\n` +
      `_സീറ്റ് മാനേജർ പാർട്ണറായി രജിസ്റ്റർ ചെയ്യാൻ താല്പര്യപ്പെടുന്നു. അംഗീകാരം നൽകുമല്ലോ._`
    );

    setIsSubmitting(false);
    setSubmittedSuccess(true);

    // Open WhatsApp to dynamic number
    const adminPhone = (systemConfig.adminWhatsApp || "9633465267").replace(/\D/g, "");
    const formattedPhone = adminPhone.startsWith("91") ? adminPhone : `91${adminPhone}`;
    window.open(`https://wa.me/${formattedPhone}?text=${msg}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 no-print overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-indigo-100 max-w-3xl w-full overflow-hidden text-slate-800 my-auto animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-emerald-950 p-5 sm:p-6 text-white relative shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner shrink-0">
                <Briefcase className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  {lang === "ml" ? "മദ്റസ ടെക് പാർട്ണർ & റെവന്യൂ ഷെയറിംഗ്" : "Official Madrasa Tech Partner Program"}
                </div>
                <h2 className="text-lg sm:text-2xl font-black text-white leading-tight">
                  {lang === "ml" ? "പ്രാദേശിക പാർട്ണറായി വരുമാനം നേടാം" : "Become an Authorized Madrasa Partner"}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-indigo-800/50 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("partner_info")}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === "partner_info" 
                  ? "bg-white text-indigo-950 shadow-sm" 
                  : "bg-indigo-950/60 text-indigo-200 hover:bg-indigo-900/60"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              {lang === "ml" ? "പ്രോഗ്രാം വിവരങ്ങൾ" : "About Partner Role"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === "register" 
                  ? "bg-amber-400 text-amber-950 shadow-sm" 
                  : "bg-indigo-950/60 text-indigo-200 hover:bg-indigo-900/60"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {lang === "ml" ? "പാർട്ണർ രജിസ്ട്രേഷൻ" : "Register as Partner"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("future_apps")}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === "future_apps" 
                  ? "bg-white text-indigo-950 shadow-sm" 
                  : "bg-indigo-950/60 text-indigo-200 hover:bg-indigo-900/60"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {lang === "ml" ? "ഭാവി സോഫ്റ്റ്‌വെയറുകൾ" : "Future Apps Roadmap"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("business_model")}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === "business_model" 
                  ? "bg-emerald-400 text-emerald-950 shadow-sm" 
                  : "bg-indigo-950/60 text-indigo-200 hover:bg-indigo-900/60"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              {lang === "ml" ? "വരുമാന & ബിസിനസ് ഗൈഡ്" : "Revenue & Strategy"}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: Partner Info */}
          {activeTab === "partner_info" && (
            <div className="space-y-4 text-slate-700 text-sm">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border border-indigo-200">
                <div className="flex items-start gap-3">
                  <HeartHandshake className="w-6 h-6 text-indigo-700 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-extrabold text-indigo-950 text-base mb-1">
                      {lang === "ml" ? "എന്താണ് മദ്റസ ടെക് പാർട്ണർ പ്രോഗ്രാം?" : "What is the Madrasa Tech Partner Program?"}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {lang === "ml"
                        ? "നിങ്ങളുടെ മഹല്ലിലെയും പഞ്ചായത്തിലെയും മദ്റസകൾക്ക് സ്വന്തമായി കമ്പ്യൂട്ടറോ പ്രിന്ററോ ഇല്ലെങ്കിലും അവർക്ക് വേണ്ടി ഡാറ്റ എന്റർ ചെയ്തു കൊടുക്കാനും, സ്റ്റിക്കറുകൾ പ്രിന്റ് ചെയ്ത് നൽകാനും അല്ലെങ്കിൽ കൊറിയർ ഓർഡർ ചെയ്ത് നൽകാനും നിങ്ങൾക്ക് കഴിയും. നിങ്ങളുടെ സേവനത്തിനും സമയത്തിനും മാന്യമായ വരുമാനം നേടാനും ഇതിലൂടെ സാധിക്കുന്നു."
                        : "Help madrasas in your locality that lack computers or printers. You can enter their data, manage seating, print stickers locally or order courier delivery, earning a rewarding service fee or margin for your time."}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Pillars of Partner Revenue */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-indigo-800 font-black text-xs">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>{lang === "ml" ? "1. മദ്റസ സർവീസ് ചാർജ്" : "1. Local Service Fee"}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {lang === "ml"
                      ? "മദ്റസകൾക്ക് വേണ്ടി കുട്ടികളുടെ പേര് ടൈപ്പ് ചെയ്യൽ, ഹാൾ പ്ലാൻ സെറ്റ് ചെയ്യൽ എന്നിവയ്ക്ക് ഓരോ മദ്റസയിൽ നിന്നും ന്യായമായ സർവീസ് ചാർജ് (₹300 - ₹1000) ഈടാക്കാം."
                      : "Charge a nominal data entry & exam hall setup fee (₹300 - ₹1000) from each madrasa you assist."}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-black text-xs">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>{lang === "ml" ? "2. പ്രിന്റ് & കൊറിയർ മാർജിൻ" : "2. Print & Courier Margin"}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {lang === "ml"
                      ? "നിങ്ങൾക്ക് സ്വന്തമായി പ്രിന്ററുണ്ടെങ്കിൽ സ്വയം പ്രിന്റ് ചെയ്യാം; ഇല്ലെങ്കിൽ ഹോൾസെയിൽ നിരക്കിൽ ഞങ്ങളുടെ സെന്ററിൽ നിന്ന് കൊറിയർ വരുത്തി വിതരണം ചെയ്യാം."
                      : "Print stickers locally at your DTP center or order bulk wholesale prints from our central press with partner discounts."}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-purple-800 font-black text-xs">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>{lang === "ml" ? "3. ഭാവി ആപ്പുകളുടെ ഷെയർ" : "3. Future App Subscriptions"}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {lang === "ml"
                      ? "ഭാവിയിൽ വരുന്ന മീലാദ് ഫെസ്റ്റ്, റിസൾട്ട് മാനേജ്മെന്റ് തുടങ്ങിയ സോഫ്റ്റ്‌വെയറുകൾ മദ്റസകളിൽ എത്തിക്കുമ്പോൾ ഓരോ ഇൻസ്റ്റാളേഷനിലും മികച്ച റെവന്യൂ ഷെയർ ലഭിക്കും."
                      : "Earn 40%–60% direct revenue commission when introducing our upcoming Result & Meelad AI apps to madrasas."}
                  </p>
                </div>
              </div>

              {/* Who Can Become a Partner */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-2">
                <h4 className="font-extrabold flex items-center gap-2 text-amber-900">
                  <Award className="w-4 h-4 text-amber-700" />
                  {lang === "ml" ? "ആർക്കൊക്കെ പാർട്ണറാകാം?" : "Who is Eligible to Become a Partner?"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{lang === "ml" ? "മദ്റസ അധ്യാപകർ / സദർ മുഅല്ലിംമാർ" : "Madrasa Teachers & Headmasters"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{lang === "ml" ? "DTP / അക്ഷയ / പ്രിന്റിംഗ് ഷോപ്പ് ഉടമകൾ" : "DTP / Akshaya / Printing Centers"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{lang === "ml" ? "യൂത്ത് ക്ലബ്ബ് / മഹല്ല് വോളണ്ടിയർമാർ" : "Youth Club & Mahallu Volunteers"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{lang === "ml" ? "ടെക് താല്പര്യമുള്ള വിദ്യാർത്ഥികൾ" : "Tech-savvy Students & Freelancers"}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <span>{lang === "ml" ? "ഇപ്പോൾ പാർട്ണറായി രജിസ്റ്റർ ചെയ്യുക" : "Proceed to Partner Registration"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Registration Form */}
          {activeTab === "register" && (
            <div className="space-y-4">
              {submittedSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in zoom-in-95">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-black text-emerald-950">
                    {lang === "ml" ? "രജിസ്ട്രേഷൻ വിജയകരമായി സമർപ്പിച്ചു!" : "Partner Application Submitted!"}
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    {lang === "ml"
                      ? "നിങ്ങളുടെ വിവരങ്ങൾ അഡ്മിന് ലഭിച്ചിട്ടുണ്ട്. വാട്സാപ്പ് സന്ദേശം അയച്ചതിലൂടെ നിങ്ങളുടെ അപേക്ഷ ഉടൻ തന്നെ ആക്റ്റീവ് ആകുന്നതാണ്. ജസാക്കല്ലാഹു ഖൈർ!"
                      : "Your application has been received and opened in WhatsApp. The admin team will verify and activate your partner badge shortly."}
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSubmittedSuccess(false)}
                      className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition cursor-pointer"
                    >
                      {lang === "ml" ? "മറ്റൊരു അപേക്ഷ നൽകുക" : "Submit Another Application"}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-indigo-950 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold">{lang === "ml" ? "പാർട്ണർ അപേക്ഷാ ഫോം (സൗജന്യ രജിസ്ട്രേഷൻ)" : "Partner Application Form (Free Registration)"}</span>
                    </div>
                    <span className="text-2xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Zero Joining Fee
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {lang === "ml" ? "പൂർണ്ണ നാമം *" : "Full Name *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName || ""}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder={lang === "ml" ? "ഉദാ: മുഹമ്മദ് നിസാർ" : "e.g. Muhammed Nisar"}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {lang === "ml" ? "വാട്സാപ്പ് നമ്പർ *" : "WhatsApp Phone Number *"}
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.whatsapp || ""}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        placeholder="e.g. 9847123456"
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {lang === "ml" ? "സ്ഥലം / ടൗൺ *" : "Place / Town *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.place || ""}
                        onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                        placeholder={lang === "ml" ? "ഉദാ: മഞ്ചേരി" : "e.g. Manjeri"}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {lang === "ml" ? "പഞ്ചായത്ത് / മുനിസിപ്പാലിറ്റി *" : "Panchayath / Municipality *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.panchayath || ""}
                        onChange={(e) => setFormData({ ...formData, panchayath: e.target.value })}
                        placeholder={lang === "ml" ? "ഉദാ: എടവണ്ണ" : "e.g. Edavanna"}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {lang === "ml" ? "ജില്ല *" : "District *"}
                      </label>
                      <select
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {districtsList.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {lang === "ml" ? "നിങ്ങളുടെ പദവി / തൊഴിൽ *" : "Profession / Primary Role *"}
                      </label>
                      <select
                        value={formData.profession}
                        onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Usthad / Teacher">മദ്റസ അധ്യാപകൻ / ഉസ്താദ്</option>
                        <option value="Sadar Muallim / Principal">സദർ മുഅല്ലിം / പ്രിൻസിപ്പാൾ</option>
                        <option value="DTP / Akshaya / Printing Center">DTP / അക്ഷയ / പ്രിന്റിംഗ് സെന്റർ</option>
                        <option value="Youth Club / Mahallu Volunteer">യൂത്ത് ക്ലബ്ബ് / മഹല്ല് ഭാരവാഹി</option>
                        <option value="Student / Freelancer">വിദ്യാർത്ഥി / ഫ്രീലാൻസർ</option>
                        <option value="Other">മറ്റുള്ളവ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {lang === "ml" ? "സഹായിക്കാൻ കഴിയുന്ന മദ്റസകളുടെ എണ്ണം *" : "Target Madrasas in your area *"}
                      </label>
                      <select
                        value={formData.targetMadrasasCount}
                        onChange={(e) => setFormData({ ...formData, targetMadrasasCount: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="1-3 Madrasas">1 - 3 മദ്റസകൾ (ലോക്കൽ മഹല്ല്)</option>
                        <option value="5-10 Madrasas">5 - 10 മദ്റസകൾ (പഞ്ചായത്ത് തലം)</option>
                        <option value="15-30 Madrasas">15 - 30 മദ്റസകൾ (മേഖലാ / താലൂക്ക് തലം)</option>
                        <option value="50+ Madrasas">50+ മദ്റസകൾ (ജില്ലാ തലം)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {lang === "ml" ? "കൂടുതൽ വിവരങ്ങൾ / കുറിപ്പ് (ഓപ്ഷണൽ)" : "Additional Notes or Experience (Optional)"}
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={lang === "ml" ? "ഉദാ: ഞങ്ങൾക്ക് സ്വന്തമായി പ്രിന്റർ ഉണ്ട് / അല്ലെങ്കിൽ മറ്റ് മദ്റസകളിൽ കുട്ടികളുടെ എണ്ണം ശേഖരിക്കാൻ തയ്യാറാണ്..." : "Any relevant details about your area or printing facility..."}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      {lang === "ml" ? "റദ്ദാക്കുക" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.fullName.trim() || !formData.whatsapp.trim()}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {lang === "ml" ? "അപേക്ഷ സമർപ്പിക്കുക (WhatsApp)" : "Submit Application via WhatsApp"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: Future Apps Suite Roadmap */}
          {activeTab === "future_apps" && (
            <div className="space-y-4 text-slate-700 text-sm">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200">
                <div className="flex items-start gap-3">
                  <Layers className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-extrabold text-emerald-950 text-base mb-1">
                      {lang === "ml" ? "ഭാവിയിൽ വരുന്ന ഡിജിറ്റൽ മദ്റസ സോഫ്റ്റ്‌വെയർ സ്യൂട്ട്" : "Upcoming Next-Gen Madrasa Software Suite"}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {lang === "ml"
                        ? "മദ്റസ എക്സാം മാസ്റ്ററിന് പുറമെ, മദ്റസകളുടെ സമഗ്ര പുരോഗതിക്കായി അണിയറയിൽ ഒരുങ്ങുന്ന അടുത്ത തലമുറ പ്രൊഡക്റ്റുകൾ ഇതാ. ഇവയെല്ലാം പാർട്ണർമാർ വഴി എല്ലാ മദ്റസകളിലും എത്തിക്കപ്പെടും:"
                        : "Discover the upcoming paperless digital tools designed to modernize madrasas across Kerala. Partners will lead local distribution:"}
                    </p>
                  </div>
                </div>
              </div>

              {/* App Card 1: Result Management */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
                      📊
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">
                        {lang === "ml" ? "1. മദ്റസ എക്സാം റിസൾട്ട് & പ്രോഗ്രസ് കാർഡ് സിസ്റ്റം" : "1. Madrasa Result & Progress Report Card Engine"}
                      </h4>
                      <span className="text-3xs text-blue-600 font-bold uppercase tracking-wider">
                        Under Active Development
                      </span>
                    </div>
                  </div>
                  <span className="text-2xs font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                    Coming Next
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === "ml"
                    ? "വിദ്യാർത്ഥികളുടെ പരീക്ഷാ മാർക്കുകൾ സിമ്പിളായി എന്റർ ചെയ്താൽ ഓട്ടോമാറ്റിക് ഗ്രേഡിംഗ് (A+, A, B...), റാങ്ക് ലിസ്റ്റ്, ക്ലാസ് പെർഫോമൻസ് അനലിറ്റിക്സ്, ഫോട്ടോ സഹിതമുള്ള കളർ പ്രോഗ്രസ് കാർഡുകൾ, രക്ഷാകർത്താക്കളുടെ വാട്സാപ്പിലേക്ക് ഒറ്റ ക്ലിക്കിൽ മാർക്ക് ലിസ്റ്റ് അയക്കാനുള്ള സൗകര്യം."
                    : "Simple mark entry producing auto-grading (A+, A, B), class rank sheets, and personalized student report cards sent straight to parents via WhatsApp."}
                </p>
              </div>

              {/* App Card 2: AI Meelad & Fest Manager */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-sm">
                      🎤
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">
                        {lang === "ml" ? "2. അഡ്വാൻസ്ഡ് മീലാദ് & ഫെസ്റ്റ് പ്രോഗ്രാം മാനേജ്മെന്റ് (AI Powered)" : "2. Advanced AI Meelad & Fest Competition Manager"}
                      </h4>
                      <span className="text-3xs text-indigo-600 font-bold uppercase tracking-wider">
                        AI Stage & Score Engine
                      </span>
                    </div>
                  </div>
                  <span className="text-2xs font-extrabold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
                    Festival Edition
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === "ml"
                    ? "ഖുർആൻ പാരായണം, പ്രസംഗം, ഗാനം, ദഫ്, കോൽക്കളി മത്സരങ്ങളുടെ രജിസ്ട്രേഷൻ, ഗ്രൂപ്പ് പോയിന്റ് ടേബിൾ, ജഡ്ജ് മാർക്കിംഗ് ഷീറ്റുകൾ, ലൈവ് സ്ക്രീൻ സ്കോർബോർഡ്, മനോഹരമായ സർട്ടിഫിക്കറ്റുകൾ തത്സമയം തയ്യാറാക്കൽ."
                    : "Complete stage program manager for Meelad/Fests: item registration, group points tally, digital judge scorecards, live projector scoreboards, and instant certificate generation."}
                </p>
              </div>

              {/* App Card 3: Student Character & Deen Evaluation */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 transition shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
                      🌟
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">
                        {lang === "ml" ? "3. സ്റ്റുഡന്റ് ദീൻ & അഖ്‌ലാഖ് പേപ്പർലെസ് ട്രാക്കർ (ബെസ്റ്റ് സ്റ്റുഡന്റ് സെലക്ഷൻ)" : "3. Student Deen & Character Evaluation System (Paperless)"}
                      </h4>
                      <span className="text-3xs text-purple-600 font-bold uppercase tracking-wider">
                        Holistic Tarbiyyah Tool
                      </span>
                    </div>
                  </div>
                  <span className="text-2xs font-extrabold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200">
                    Tarbiyyah Suite
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === "ml"
                    ? "വിദ്യാർത്ഥികളുടെ നിസ്കാരം, സ്വഭാവം, പെരുമാറ്റം, വസ്ത്രധാരണം, അച്ചടക്കം, പഠനം, വൃത്തി തുടങ്ങിയവ ആഴ്ചയിലോ മാസത്തിലോ അധ്യാപകർക്ക് മൊബൈലിൽ വിലയിരുത്താം. പേപ്പർലെസ് ആയി ഓരോ ക്ലാസ്സിലെയും മദ്റസയിലെയും 'ബെസ്റ്റ് സ്റ്റുഡന്റിനെ' തിരഞ്ഞെടുക്കാനും സ്റ്റാർ ബാഡ്ജ് സർട്ടിഫിക്കറ്റ് നൽകാനും സാധിക്കുന്നു."
                    : "Digital tracking for prayer regularity, manners, dressing, discipline, hygiene, and learning. Effortlessly identifies the 'Best Student of the Month' with star recognition certificates."}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Strategic Business & Monetization Model Advice */}
          {activeTab === "business_model" && (
            <div className="space-y-4 text-slate-700 text-sm">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-300">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 text-emerald-800 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-extrabold text-emerald-950 text-base mb-1">
                      {lang === "ml" ? "തന്ത്രപരമായ ബിസിനസ് & വരുമാന മാർഗ്ഗനിർദ്ദേശം" : "Strategic Monetization & Distribution Advice"}
                    </h3>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      {lang === "ml"
                        ? "താങ്കൾ ചോദിച്ച പ്രധാന ചോദ്യത്തിനുള്ള (ഈ സോഫ്റ്റ്‌വെയർ ഫ്രീയായി കൊടുത്ത് ഭാവി ആപ്പുകളിൽ നിന്ന് വരുമാനം ഉണ്ടാക്കണോ അതോ റീസെൽ ചെയ്യണോ?) വിദഗ്ദ്ധ വിലയിരുത്തൽ താഴെ നൽകുന്നു:"
                        : "Detailed strategic analysis regarding Free Seating Software vs Reselling & Future App Revenue Sharing:"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Core Recommendation: The "Trojan Horse" Freemium Strategy */}
              <div className="p-4 rounded-2xl border-2 border-emerald-400 bg-white space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{lang === "ml" ? "വിജയകരമായ സ്ട്രാറ്റജി: 'ഫ്രീ എൻട്രി + പ്രിന്റ് സർവീസ് + പ്രീമിയം ആപ്പ് ഷെയറിംഗ്'" : "Recommended Strategy: Freemium Ecosystem Model"}</span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                  <p>
                    {lang === "ml" ? (
                      <>
                        <strong>1. ലേബൽ & സീറ്റിംഗ് സോഫ്റ്റ്‌വെയർ 100% സൗജന്യമായി നൽകുക (Trust & Adoption):</strong><br />
                        ഒരു സോഫ്റ്റ്‌വെയർ തുടക്കത്തിൽ തന്നെ വില പറഞ്ഞ് വിൽക്കാൻ (Resell) ശ്രമിച്ചാൽ മദ്റസ കമ്മിറ്റികൾ മടിക്കും. എന്നാൽ ഈ ലേബൽ & സീറ്റിംഗ് സോഫ്റ്റ്‌വെയർ പൂർണ്ണമായും സൗജന്യമായി നൽകുമ്പോൾ കേരളത്തിലെ ആയിരക്കണക്കിന് മദ്റസകൾ ഇത് സന്തോഷത്തോടെ ഉപയോഗിക്കുകയും <strong>നമ്മുടെ ബ്രാൻഡിൽ 100% വിശ്വാസ്യത നേടുകയും ചെയ്യും</strong>.
                      </>
                    ) : (
                      <>
                        <strong>1. Keep Seating & Desk Label Creation 100% Free:</strong> Builds massive viral adoption and unmatched trust among thousands of institutions without sales resistance.
                      </>
                    )}
                  </p>

                  <p>
                    {lang === "ml" ? (
                      <>
                        <strong>2. പ്രിന്റ് & കൊറിയർ സർവീസിലൂടെ ഉടനടി വരുമാനം (Instant Cashflow):</strong><br />
                        പ്രിന്ററില്ലാത്ത മദ്റസകളിൽ നിന്ന് ഓർഡറുകൾ സ്വീകരിച്ച് അവർക്ക് പ്രിന്റ് ചെയ്ത സ്റ്റിക്കറുകൾ അയച്ചു നൽകുമ്പോൾ ആദ്യ ദിവസം മുതൽ തന്നെ വരുമാനം ഉറപ്പാക്കാം. പാർട്ണർമാർക്കും ഇതിൽ വ്യക്തമായ മാർജിൻ ലഭിക്കും.
                      </>
                    ) : (
                      <>
                        <strong>2. Immediate Revenue via Print & Courier Delivery:</strong> Madrasas without color sticker printers happily pay for finished physical stickers delivered to their doorsteps.
                      </>
                    )}
                  </p>

                  <p>
                    {lang === "ml" ? (
                      <>
                        <strong>3. ഭാവി ആപ്പുകൾക്ക് വാർഷിക സബ്സ്ക്രിപ്ഷൻ (High-Value Premium Modules):</strong><br />
                        റിസൾട്ട് സിസ്റ്റം, മീലാദ് ഫെസ്റ്റ് മാനേജർ, അഖ്‌ലാഖ് ട്രാക്കർ എന്നിവയ്ക്ക് ചെറിയ വാർഷിക ഫീസ് (ഉദാ: ഒരു മദ്റസയ്ക്ക് ₹500 മുതൽ ₹1500 വരെ മാത്രം) നിശ്ചയിക്കുക. 
                        <strong> ഇതിൽ 50% പാർട്ണർമാർക്കും 50% സെർവർ/ഡെവലപ്‌മെന്റ് ടീമിനും</strong> വിഭജിക്കുന്നത് വഴി പാർട്ണർമാർ ഉത്സാഹത്തോടെ കൂടുതൽ മദ്റസകളിലേക്ക് ഇത് എത്തിക്കും!
                      </>
                    ) : (
                      <>
                        <strong>3. 50-50 Revenue Share on Future Premium Apps:</strong> Charging an affordable annual fee (₹500-₹1500/yr) for advanced AI Meelad & Result systems with a 50% cut to local partners creates an unstoppable referral engine.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Summary Conclusion */}
              <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-xs space-y-1">
                <p className="font-bold text-amber-300">
                  🎯 {lang === "ml" ? "തീരുമാനം (Verdict):" : "Strategic Verdict:"}
                </p>
                <p className="leading-relaxed text-slate-300">
                  {lang === "ml"
                    ? "സീറ്റിംഗ് സോഫ്റ്റ്‌വെയർ സൗജന്യമായി നൽകി ജനകീയമാക്കുകയും, കൊറിയർ പ്രിന്റിംഗിലൂടെയും ഭാവിയിലെ അഡ്വാൻസ്ഡ് സോഫ്റ്റ്‌വെയറുകളിലൂടെയും പാർട്ണർമാർക്ക് സ്ഥിരവരുമാനം നൽകുന്നതുമാണ് ഏറ്റവും മികച്ചതും ദീർഘകാലാടിസ്ഥാനത്തിൽ ലക്ഷങ്ങൾ നേടിത്തരുന്നതുമായ രീതി."
                    : "Free entry-level seating combined with doorstep print deliveries and high-margin future SaaS modules is the proven, highest-growth roadmap for Madrasa digitisation."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-2xs text-slate-500 font-medium">
            <span>🤝 {lang === "ml" ? "പാർട്ണർ സപ്പോർട്ട് ഹെൽപ്പ്‌ലൈൻ:" : "Partner Helpline:"} <b className="text-slate-800 font-mono">+91 9847123456</b></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              {lang === "ml" ? "അടയ്ക്കുക" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
