import React, { useState } from "react";
import { 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  FileText, 
  CheckCircle2, 
  MessageCircle, 
  Printer, 
  Clock, 
  BarChart3, 
  GraduationCap,
  HeartHandshake,
  Wrench,
  Lock,
  EyeOff,
  X
} from "lucide-react";
import { SystemConfig, defaultAppModulesStatus, AppModuleKey, AppVisibilityStatus } from "../systemConfig";

import { AppUserSession, SaaSInstitutionProfile } from "../authService";

interface LandingPageProps {
  systemConfig: SystemConfig;
  isAdminLoggedIn?: boolean;
  currentUser?: AppUserSession | null;
  currentInstitution?: SaaSInstitutionProfile | null;
  onEnterWorkspace: () => void;
  onOpenResultPortal: () => void;
  onOpenResultManager: () => void;
  onOpenTarbiyahSuite: () => void;
  onOpenTarbiyahPortal: () => void;
  onOpenSuperAdmin: () => void;
  onOpenAuthModal?: () => void;
}

export default function LandingPage({
  systemConfig,
  isAdminLoggedIn = false,
  currentUser = null,
  currentInstitution = null,
  onEnterWorkspace,
  onOpenResultPortal,
  onOpenResultManager,
  onOpenTarbiyahSuite,
  onOpenTarbiyahPortal,
  onOpenSuperAdmin,
  onOpenAuthModal
}: LandingPageProps) {
  const cleanAdminWa = (systemConfig.adminWhatsApp || "9633465267").replace(/\D/g, "");
  const formattedWa = cleanAdminWa.startsWith("91") && cleanAdminWa.length > 10 ? cleanAdminWa : `91${cleanAdminWa}`;
  const whatsappUrl = `https://wa.me/${formattedWa}?text=${encodeURIComponent("അസ്സലാമു അലൈക്കും, മദ്റസ എക്സാം & റിസൾട്ട് പോർട്ടലിനെക്കുറിച്ച് കൂടുതൽ അറിയാൻ ആഗ്രഹിക്കുന്നു.")}`;

  // Module statuses configuration
  const modules = systemConfig.appModulesStatus || defaultAppModulesStatus;
  const seatingMod = modules.seating || defaultAppModulesStatus.seating;
  const resultMod = modules.result || defaultAppModulesStatus.result;
  const tarbiyahMod = modules.tarbiyah || defaultAppModulesStatus.tarbiyah;

  // State for Under Development / Maintenance informative popup
  const [maintenanceModal, setMaintenanceModal] = useState<{
    appName: string;
    appNameMl: string;
    status: AppVisibilityStatus;
    noticeMl: string;
    onProceedAnyway?: () => void;
  } | null>(null);

  const handleModuleClick = (
    moduleKey: AppModuleKey,
    defaultAction: () => void
  ) => {
    const mod = modules[moduleKey] || defaultAppModulesStatus[moduleKey];
    console.log("HandleModuleClick:", moduleKey, mod.status, isAdminLoggedIn);
    if (mod.status === "active" || moduleKey === "seating" || isAdminLoggedIn) {
      defaultAction();
    } else {
      setMaintenanceModal({
        appName: mod.nameEn,
        appNameMl: mod.nameMl,
        status: mod.status,
        noticeMl: mod.statusNoticeMl || (
          mod.status === "coming_soon" 
            ? "ഈ ആപ്ലിക്കേഷന്റെ നിർമ്മാണ പ്രവർത്തനങ്ങൾ നടന്നു വരികയാണ്. ഉടൻ തന്നെ ഇത് പൊതുജനങ്ങൾക്ക് ലഭ്യമാകും!"
            : "ഈ ആപ്ലിക്കേഷൻ നിലവിൽ അറ്റകുറ്റപ്പണിയിലാണ് (Under Maintenance). ഉടൻ തന്നെ പൂർത്തിയാകുന്നതാണ്."
        ),
        onProceedAnyway: isAdminLoggedIn ? defaultAction : undefined
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-600 selection:text-white">
      
      {/* MAINTENANCE / COMING SOON MODAL */}
      {maintenanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-slate-900 relative">
            <button
              onClick={() => setMaintenanceModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3.5 pr-8">
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                {maintenanceModal.status === "coming_soon" ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <Wrench className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div>
                <div className="text-[11px] font-bold text-amber-800">
                  {maintenanceModal.status === "coming_soon" ? "ഉടൻ ലഭ്യമാകും · Coming Soon" : "നിർമ്മാണത്തിൽ · Under Maintenance"}
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 leading-snug">
                  {maintenanceModal.appNameMl}
                </h3>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed space-y-2.5">
              <p className="font-medium text-slate-900">{maintenanceModal.noticeMl}</p>
              <div className="pt-2.5 border-t border-slate-200/80 flex items-start gap-2 text-[11px] text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>ഡാറ്റാബേസ് പൂർണ്ണമായും സുരക്ഷിതമാണ്. മുൻപ് രേഖപ്പെടുത്തിയ ഒരു വിവരവും നഷ്ടപ്പെടില്ല.</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>WhatsApp വഴി വിവരങ്ങൾ അറിയുക</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMaintenanceModal(null)}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  മടങ്ങിപ്പോവുക
                </button>

                {maintenanceModal.onProceedAnyway && (
                  <button
                    type="button"
                    onClick={() => {
                      const proceed = maintenanceModal.onProceedAnyway;
                      setMaintenanceModal(null);
                      proceed?.();
                    }}
                    title="അഡ്മിൻ പ്രിവ്യൂ മോഡിൽ ആപ്പ് തുറക്കുക"
                    className="py-2.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>അഡ്മിൻ പ്രിവ്യൂ</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP NOTIFICATION BANNER */}
      <div className="bg-emerald-900 text-emerald-50 text-[11px] sm:text-xs py-2 px-4 border-b border-emerald-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
          {resultMod.status === "active" ? (
            <>
              <span className="font-medium">
                ഓൺലൈൻ റിസൾട്ട് മാനേജ്മെന്റും വാട്സ്ആപ്പ് രക്ഷിതാക്കളുടെ പോർട്ടലും ഇപ്പോൾ ലഭ്യമാണ്
              </span>
              <button
                onClick={() => handleModuleClick("result", onOpenResultManager)}
                className="text-emerald-300 hover:text-white underline underline-offset-2 inline-flex items-center gap-1 cursor-pointer font-bold whitespace-nowrap"
              >
                <span>റിസൾട്ട് തയ്യാറാക്കുക</span>
                <ArrowRight className="w-3 h-3 shrink-0" />
              </button>
            </>
          ) : (
            <span className="font-medium">
              സ്മാർട്ട് മദ്റസ എക്സാം സീറ്റിംഗ് & ഹാൾടിക്കറ്റ് സിസ്റ്റം ലൈവായി പ്രവർത്തിക്കുന്നു
            </span>
          )}
        </div>
      </div>

      {/* NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Identity - Never wraps into multiple broken lines */}
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-xs shrink-0">
              M
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight leading-none whitespace-nowrap font-display">
                Seat Manager
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-1">
                മദ്റസ പരീക്ഷാ & പഠന പോർട്ടൽ
              </p>
            </div>
          </div>

          {/* Navigation Controls - Clean & Single-Line on Mobile, Full Links on Desktop */}
          <div className="flex items-center gap-2 shrink-0">
            {(resultMod.status !== "hidden" || isAdminLoggedIn) && (
              <>
                <button
                  onClick={() => handleModuleClick("result", onOpenResultPortal)}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                >
                  <span>റിസൾട്ട് പോർട്ടൽ</span>
                </button>

                <button
                  onClick={() => handleModuleClick("result", onOpenResultManager)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>റിസൾട്ട് ആപ്പ്</span>
                </button>
              </>
            )}

            <button
              onClick={onEnterWorkspace}
              className="px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>സീറ്റിംഗ് ആപ്പ്</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>

            {/* Account / Sign In button */}
            {currentUser ? (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200 shrink-0 flex items-center gap-1.5 shadow-2xs max-w-[140px] sm:max-w-[180px]"
                title={currentUser.email || "User Account"}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                <span className="truncate text-[11px] sm:text-xs">
                  {currentInstitution?.name || currentUser.displayName || currentUser.email?.split("@")[0] || "Account"}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-2.5 sm:px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-300 shrink-0 flex items-center gap-1 shadow-2xs"
              >
                <Users className="w-3.5 h-3.5 text-slate-600" />
                <span>ലോഗിൻ</span>
              </button>
            )}

            <button
              onClick={onOpenSuperAdmin}
              title="Super Admin Portal"
              aria-label="Super Admin Portal"
              className="px-2.5 py-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition cursor-pointer border border-purple-200 shrink-0 flex items-center gap-1.5 shadow-2xs"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span className="hidden sm:inline text-xs font-bold text-purple-900">Super Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO & APPLICATION LAUNCHPAD */}
      <section className="relative pt-6 pb-12 sm:pt-12 sm:pb-20 border-b border-slate-200 bg-gradient-to-b from-emerald-50/40 via-white to-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Editorial Hero Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
            <p className="text-[11px] sm:text-xs font-bold text-emerald-700 tracking-wide">
              SKIMVB · SKJMCC സിലബസ് അനുയോജ്യമായ മദ്റസ പ്ലാറ്റ്‌ഫോം
            </p>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.35] sm:leading-[1.22] font-display">
              കേരളത്തിലെ മദ്റസകൾക്കായുള്ള{" "}
              <span className="text-emerald-700">
                സമ്പൂർണ്ണ പരീക്ഷാ മാനേജ്മെന്റ്
              </span>{" "}
              സൊല്യൂഷൻ
            </h1>

            <p className="text-xs sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              സ്മാർട്ട് സീറ്റിംഗ് പ്ലാനിംഗ്, ഫോട്ടോയും ക്യുആർ കോഡുമുള്ള ഹാൾടിക്കറ്റുകൾ, അറ്റൻഡൻസ് ഷീറ്റുകൾ, ഓൺലൈൻ റിസൾട്ട് പോർട്ടൽ എന്നിവയെല്ലാം ഒരൊറ്റ പ്ലാറ്റ്‌ഫോമിൽ.
            </p>
          </div>

          {/* 3 MAIN APPLICATIONS LAUNCHPAD */}
          <div className="mt-7 sm:mt-10">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-[11px] sm:text-xs font-bold text-slate-500">
                ആവശ്യമുള്ള ആപ്ലിക്കേഷൻ തെരഞ്ഞെടുക്കുക
              </span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {/* APP 1: SEATING ARRANGEMENT & HALL TICKETS */}
              {(seatingMod.status !== "hidden" || isAdminLoggedIn) && (
                <div className={`bg-white border ${
                  seatingMod.status === "active" 
                    ? "border-slate-200 hover:border-emerald-500" 
                    : (seatingMod.status === "hidden" ? "border-dashed border-slate-300 bg-slate-50/50" : "border-amber-300")
                } p-5 sm:p-6 rounded-2xl transition shadow-2xs hover:shadow-md flex flex-col justify-between group`}>
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="text-[11px] font-bold text-slate-500">
                        {seatingMod.status === "hidden" && (
                          <span className="text-slate-600 inline-flex items-center gap-1">
                            <EyeOff className="w-3.5 h-3.5" /> ഒളിപ്പിച്ചത്
                          </span>
                        )}
                        {seatingMod.status === "maintenance" && (
                          <span className="text-amber-700 inline-flex items-center gap-1">
                            <Wrench className="w-3.5 h-3.5" /> നിർമ്മാണത്തിൽ
                          </span>
                        )}
                        {seatingMod.status === "coming_soon" && (
                          <span className="text-sky-700 inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> ഉടൻ വരുന്നു
                          </span>
                        )}
                        {seatingMod.status === "active" && (
                          <span className="text-emerald-700">01 · Seating Suite</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-emerald-700 transition leading-snug">
                        എക്സാം സീറ്റിംഗ് & ഹാൾടിക്കറ്റ്
                      </h2>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        സിഗ്-സാഗ് സീറ്റിംഗ് പ്ലാൻ, ബെഞ്ച് സ്റ്റിക്കറുകൾ, ഫോട്ടോ സഹിതം ഹാൾടിക്കറ്റുകൾ, ഇൻവിജിലേഷൻ അറ്റൻഡൻസ് ഷീറ്റുകൾ എന്നിവ തയ്യാറാക്കാം.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 font-medium">
                      <span>ബോയ്/ഗേൾ സീറ്റിംഗ്</span>
                      <span aria-hidden="true">·</span>
                      <span>ഹാൾടിക്കറ്റ് പ്രിന്റ്</span>
                      <span aria-hidden="true">·</span>
                      <span>അറ്റൻഡൻസ് ഷീറ്റ്</span>
                    </div>
                  </div>

                  <div className="pt-5">
                    <button
                      onClick={() => handleModuleClick("seating", onEnterWorkspace)}
                      className={`w-full py-3 px-4 ${
                        seatingMod.status === "active" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-slate-800 hover:bg-slate-700"
                      } text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer`}
                    >
                      <span>{seatingMod.status === "active" ? "സീറ്റിംഗ് വർക്ക്‌സ്‌പേസ് തുറക്കുക" : (seatingMod.status === "hidden" ? "അഡ്മിൻ പ്രിവ്യൂ" : "വിവരങ്ങൾ കാണുക")}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>
              )}

              {/* APP 2: EXAM RESULT MANAGER */}
              {(resultMod.status !== "hidden" || isAdminLoggedIn) && (
                <div className={`bg-white border ${
                  resultMod.status === "active" 
                    ? "border-slate-200 hover:border-purple-500" 
                    : (resultMod.status === "hidden" ? "border-dashed border-slate-300 bg-slate-50/50" : "border-amber-300")
                } p-5 sm:p-6 rounded-2xl transition shadow-2xs hover:shadow-md flex flex-col justify-between group`}>
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-700 shrink-0">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div className="text-[11px] font-bold text-slate-500">
                        {resultMod.status === "hidden" && (
                          <span className="text-slate-600 inline-flex items-center gap-1">
                            <EyeOff className="w-3.5 h-3.5" /> ഒളിപ്പിച്ചത്
                          </span>
                        )}
                        {resultMod.status === "maintenance" && (
                          <span className="text-amber-700 inline-flex items-center gap-1">
                            <Wrench className="w-3.5 h-3.5" /> നിർമ്മാണത്തിൽ
                          </span>
                        )}
                        {resultMod.status === "coming_soon" && (
                          <span className="text-sky-700 inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> ഉടൻ വരുന്നു
                          </span>
                        )}
                        {resultMod.status === "active" && (
                          <span className="text-purple-700">02 · Result Suite</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-purple-700 transition leading-snug">
                        പരീക്ഷാ ഫല മാനേജ്മെന്റ്
                      </h2>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        ക്ലാസ് മാർക്ക് എൻട്രി, ബോർഡ് ഗ്രേഡിംഗ് നിയമങ്ങൾ, ഫീസ് കുടിശ്ശികക്കാർക്കുള്ള Withhold, WhatsApp വഴി റിസൾട്ട് ലിങ്ക് ഷെയറിംഗ്.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 font-medium">
                      <span>ബോർഡ് ഗ്രേഡിംഗ്</span>
                      <span aria-hidden="true">·</span>
                      <span>Withhold സിസ്റ്റം</span>
                      <span aria-hidden="true">·</span>
                      <span>WhatsApp ലിങ്ക്</span>
                    </div>
                  </div>

                  <div className="pt-5">
                    <button
                      onClick={() => handleModuleClick("result", onOpenResultManager)}
                      className={`w-full py-3 px-4 ${
                        resultMod.status === "active" ? "bg-purple-600 hover:bg-purple-500" : "bg-slate-800 hover:bg-slate-700"
                      } text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer`}
                    >
                      <span>{resultMod.status === "active" ? "റിസൾട്ട് മാനേജർ തുറക്കുക" : (resultMod.status === "hidden" ? "അഡ്മിൻ പ്രിവ്യൂ" : "വിവരങ്ങൾ കാണുക")}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>
              )}

              {/* APP 3: TARBIYAH & CONTINUOUS EVALUATION SYSTEM */}
              {(tarbiyahMod.status !== "hidden" || isAdminLoggedIn) && (
                <div className={`bg-white border ${
                  tarbiyahMod.status === "active" 
                    ? "border-slate-200 hover:border-teal-600" 
                    : (tarbiyahMod.status === "hidden" ? "border-dashed border-slate-300 bg-slate-50/50" : "border-amber-300")
                } p-5 sm:p-6 rounded-2xl transition shadow-2xs hover:shadow-md flex flex-col justify-between group`}>
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 shrink-0">
                        <HeartHandshake className="w-5 h-5" />
                      </div>
                      <div className="text-[11px] font-bold text-slate-500">
                        {tarbiyahMod.status === "hidden" && (
                          <span className="text-slate-600 inline-flex items-center gap-1">
                            <EyeOff className="w-3.5 h-3.5" /> ഒളിപ്പിച്ചത്
                          </span>
                        )}
                        {tarbiyahMod.status === "maintenance" && (
                          <span className="text-amber-700 inline-flex items-center gap-1">
                            <Wrench className="w-3.5 h-3.5" /> നിർമ്മാണത്തിൽ
                          </span>
                        )}
                        {tarbiyahMod.status === "coming_soon" && (
                          <span className="text-sky-700 inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> ഉടൻ വരുന്നു
                          </span>
                        )}
                        {tarbiyahMod.status === "active" && (
                          <span className="text-teal-700">03 · Tarbiyah Suite</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-teal-700 transition leading-snug">
                        തർബിയ്യത്ത് & നിരന്തര മൂല്യനിർണ്ണയം
                      </h2>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        വുളൂഅ്, നിസ്കാരം, പഠനം, സ്വഭാവം എന്നിവയിൽ രക്ഷിതാക്കളും ഉസ്താദുമാരും ചേർന്ന് നടത്തുന്ന സമഗ്ര നിരന്തര മൂല്യനിർണ്ണയവും റാങ്ക് ലിസ്റ്റും.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 font-medium">
                      <span>രക്ഷിതാവ് + ഉസ്താദ് എൻട്രി</span>
                      <span aria-hidden="true">·</span>
                      <span>എഫർട്ട് ചാർട്ട്</span>
                    </div>
                  </div>

                  <div className="pt-5">
                    <button
                      onClick={() => handleModuleClick("tarbiyah", onOpenTarbiyahSuite)}
                      className={`w-full py-3 px-4 ${
                        tarbiyahMod.status === "active" ? "bg-teal-700 hover:bg-teal-600" : "bg-slate-800 hover:bg-slate-700"
                      } text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer`}
                    >
                      <span>{tarbiyahMod.status === "active" ? "തർബിയ്യത്ത് ആപ്പ് തുറക്കുക" : (tarbiyahMod.status === "hidden" ? "അഡ്മിൻ പ്രിവ്യൂ" : "വിവരങ്ങൾ കാണുക")}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* QUICK LINKS FOR PARENTS & STUDENTS (No text truncation on mobile) */}
            <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* PARENT EXAM RESULT CHECK */}
              {(resultMod.status !== "hidden" || isAdminLoggedIn) && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-700 shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        പരീക്ഷാ ഫലം പരിശോധിക്കാം
                      </div>
                      <div className="text-[11px] text-slate-500 leading-normal mt-0.5">
                        വിദ്യാർത്ഥിയുടെ പേരോ റോൾ നമ്പറോ നൽകി മാർക്ക് ലിസ്റ്റ് കാണാം
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleModuleClick("result", onOpenResultPortal)}
                    className="px-3.5 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap"
                  >
                    <span>ഫലം കാണുക</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              )}

              {/* PARENT TARBIYAH SUBMISSION */}
              {(tarbiyahMod.status !== "hidden" || isAdminLoggedIn) && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 shrink-0">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        രക്ഷിതാവിന്റെ തർബിയ്യത്ത് എൻട്രി
                      </div>
                      <div className="text-[11px] text-slate-500 leading-normal mt-0.5">
                        വുളൂഅ്, നിസ്കാരം, പെരുമാറ്റം എന്നിവ രേഖപ്പെടുത്താം
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleModuleClick("tarbiyah", onOpenTarbiyahPortal)}
                    className="px-3.5 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap"
                  >
                    <span>എൻട്രി നൽകുക</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* KEY PLATFORM METRICS */}
          <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <div className="text-center sm:text-left">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums">500+</div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">രജിസ്റ്റർ ചെയ്ത മദ്റസകൾ</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums">1,00,000+</div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">ജനറേറ്റ് ചെയ്ത ഹാൾടിക്കറ്റുകൾ</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums">100%</div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">കൃത്യതയുള്ള ഗ്രേഡിംഗ്</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums">24×7</div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">വാട്സ്ആപ്പ് സപ്പോർട്ട്</div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES SECTION */}
      <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <p className="text-xs font-bold text-emerald-700">പ്രധാന സവിശേഷതകൾ</p>
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
            ഒരു മദ്റസയ്ക്ക് ആവശ്യമുള്ള എല്ലാം ഒരൊറ്റ പ്ലാറ്റ്‌ഫോമിൽ
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            സീറ്റിംഗ് അറേഞ്ച്മെന്റ് മുതൽ പരീക്ഷാ ഫലപ്രഖ്യാപനം വരെ എല്ലാം നിമിഷങ്ങൾക്കുള്ളിൽ സാധ്യമാക്കാം.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          
          {/* FEATURE 1: SMART SEATING */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4">
            <div className="w-11 h-11 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center border border-emerald-200/80">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">01. സ്മാർട്ട് സീറ്റിംഗ് പ്ലാനർ</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              ആൺകുട്ടികൾക്കും പെൺകുട്ടികൾക്കും വെവ്വേറെ ഹാളുകൾ അല്ലെങ്കിൽ പാർട്ടീഷനുകൾ, ബെഞ്ച് കപ്പാസിറ്റി, വ്യത്യസ്ത ക്ലാസുകൾ ഇടകലർത്തിയുള്ള സിഗ്-സാഗ് സീറ്റിംഗ് എന്നിവ വളരെ ലളിതമായി തയ്യാറാക്കാം.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-3 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Boy/Girl സ്വതന്ത്ര സീറ്റിംഗ് മോഡുകൾ</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>ഡെസ്ക് ലെവൽ റോൾ നമ്പർ സ്റ്റിക്കറുകൾ</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>ഹാൾ നോട്ടീസ് ബോർഡ് മാപ്പുകൾ</span>
              </li>
            </ul>
          </div>

          {/* FEATURE 2: HALL TICKETS & TIMETABLE */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4">
            <div className="w-11 h-11 bg-sky-50 text-sky-700 rounded-xl flex items-center justify-center border border-sky-200/80">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">02. ഹാൾടിക്കറ്റുകളും ടൈംടേബിളും</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              സമസ്തയുടെ ഔദ്യോഗിക ബോർഡ് ടൈംടേബിളുകൾ ഒറ്റ ക്ലിക്കിൽ ലോഡ് ചെയ്യാം. മുഴുവൻ വിഷയങ്ങളും ക്യുആർ കോഡും സഹിതമുള്ള പ്രൊഫഷണൽ ഹാൾടിക്കറ്റുകൾ A4 ഷീറ്റിൽ പ്രിന്റ് ചെയ്യാം.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-3 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>മുഴുവൻ വിഷയങ്ങളും ഉൾക്കൊള്ളുന്ന ഹാൾടിക്കറ്റ്</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>ഓഫീഷ്യൽ സിലബസ് ഡയറക്ടറി എഡിറ്റ് സൗകര്യം</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>വിദ്യാർത്ഥികളുടെ ക്യുആർ വെരിഫിക്കേഷൻ</span>
              </li>
            </ul>
          </div>

          {/* FEATURE 3: RESULT MANAGEMENT */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4">
            <div className="w-11 h-11 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center border border-purple-200/80">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">03. ഓൺലൈൻ റിസൾട്ട് മാനേജ്മെന്റ്</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              ക്ലാസ് അടിസ്ഥാനത്തിൽ ലളിതമായ മാർക്ക് എൻട്രി, ഫീസ് കുടിശ്ശികയുള്ളവരുടെ ഫലം തടഞ്ഞുവെക്കൽ (Withhold with reason), വാട്സ്ആപ്പിലൂടെ രക്ഷിതാക്കൾക്ക് പങ്കുവെക്കാവുന്ന നേരിട്ടുള്ള റിസൾട്ട് ലിങ്ക്.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-3 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>ക്ലാസ്സും പേരും സെലക്ട് ചെയ്ത് റിസൾട്ട് കാണാം</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>വിത്ത്‌ഹെൽഡ് (Withheld) ചെയ്യാനുള്ള കാരണം കാണിക്കാം</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>ബൾക്ക് വിത്ത്‌ഹെൽഡും പിൻ സുരക്ഷയും</span>
              </li>
            </ul>
          </div>

        </div>

        {/* SECOND ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl flex items-start gap-4">
            <div className="w-11 h-11 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center border border-amber-200/80 shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm sm:text-base text-slate-900">ഡയറക്ട് കളർ പ്രിന്റിംഗ് & കൊറിയർ ഡെലിവറി</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                മദ്റസയിൽ പ്രിന്റർ ഇല്ലെങ്കിലും പ്രശ്നമില്ല. ഹാൾടിക്കറ്റുകളും ലേബലുകളും ഞങ്ങളുടെ ടീം ഹൈ-ക്വാളിറ്റിയിൽ പ്രിന്റ് ചെയ്ത് സ്പീഡ് പോസ്റ്റ് വഴി നിങ്ങളുടെ മദ്റസയിലെത്തിക്കുന്നു.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl flex items-start gap-4">
            <div className="w-11 h-11 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center border border-emerald-200/80 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm sm:text-base text-slate-900">ക്ലൗഡ് ബാക്കപ്പ് & ഡാറ്റാ സുരക്ഷ</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ഓരോ മദ്റസയുടെയും വിദ്യാർത്ഥികളുടെ വിവരങ്ങളും പരീക്ഷാ ക്രമീകരണങ്ങളും പൂർണ്ണ സ്വകാര്യതയോടെ സുരക്ഷിതമായി ക്ലൗഡിൽ സൂക്ഷിക്കുന്നു.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / WORKFLOW */}
      <section className="py-12 sm:py-16 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold text-emerald-700">ലളിതമായ 4 ഘട്ടങ്ങൾ</p>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900">മദ്റസ പരീക്ഷാ നടത്തിപ്പ് ഇനി എത്രയും എളുപ്പം</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="text-xs font-extrabold text-emerald-700 font-mono">01</div>
              <h4 className="font-bold text-sm text-slate-900">വിദ്യാർത്ഥികളെ ചേർക്കുക</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                എക്സൽ/CSV ഫയൽ അപ്‌ലോഡ് വഴിയോ വാട്സ്ആപ്പ് ലിസ്റ്റ് പേസ്റ്റ് ചെയ്തോ മിനിറ്റുകൾക്കുള്ളിൽ ഡാറ്റ നൽകാം.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="text-xs font-extrabold text-sky-700 font-mono">02</div>
              <h4 className="font-bold text-sm text-slate-900">സീറ്റിംഗ് പ്ലാൻ ചെയ്യുക</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ഹാളുകൾ നൽകി Boy/Girl ക്രമീകരണങ്ങൾ നിശ്ചയിച്ച് ഒറ്റ ക്ലിക്കിൽ ഓട്ടോമാറ്റിക് സീറ്റിംഗ് പ്ലാൻ ജനറേറ്റ് ചെയ്യാം.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="text-xs font-extrabold text-amber-700 font-mono">03</div>
              <h4 className="font-bold text-sm text-slate-900">ഹാൾടിക്കറ്റ് & ഷീറ്റുകൾ പ്രിന്റ്</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ഹാൾടിക്കറ്റുകൾ, ബെഞ്ച് സ്റ്റിക്കറുകൾ, ഇൻവിജിലേഷൻ അറ്റൻഡൻസ് ഷീറ്റുകൾ എന്നിവ പ്രിന്റ് ചെയ്യുക.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="text-xs font-extrabold text-purple-700 font-mono">04</div>
              <h4 className="font-bold text-sm text-slate-900">മാർക്ക് എൻട്രിയും റിസൾട്ടും</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                പരീക്ഷയ്ക്ക് ശേഷം മാർക്കുകൾ നൽകി വാട്സ്ആപ്പ് ഗ്രൂപ്പിൽ ലിങ്ക് ഷെയർ ചെയ്ത് റിസൾട്ട് പ്രഖ്യാപിക്കാം.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION FOOTER BANNER */}
      <section className="py-12 sm:py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white border border-slate-200 text-slate-900 p-6 sm:p-12 rounded-2xl shadow-2xs space-y-5">
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
            നിങ്ങളുടെ മദ്റസയിലെ പരീക്ഷാ നടത്തിപ്പ് ഇന്നുതന്നെ ലളിതമാക്കൂ
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            സങ്കീർണ്ണമായ കണക്കുകൂട്ടലുകളും മണിക്കൂറുകൾ നീളുന്ന ജോലിഭാരവും ഒഴിവാക്കി, ഡിജിറ്റൽ സാങ്കേതികവിദ്യയുടെ സഹായത്തോടെ ആധുനികമായ പരീക്ഷാ അനുഭവം ഉറപ്പാക്കൂ.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2 max-w-md sm:max-w-none mx-auto">
            <button
              onClick={() => handleModuleClick("seating", onEnterWorkspace)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>വർക്ക്‌സ്‌പേസിലേക്ക് പ്രവേശിക്കുക</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <button
              onClick={() => handleModuleClick("result", onOpenResultManager)}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-purple-600 shrink-0" />
              <span>റിസൾട്ട് മാനേജ്മെന്റ് തുറക്കുക</span>
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-8 sm:py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-600 rounded-md flex items-center justify-center text-white font-black text-xs shrink-0">
              M
            </div>
            <span className="font-bold text-slate-800">{systemConfig.appName}</span>
            <span aria-hidden="true">·</span>
            <span>Madrasa Exam & Result Suite</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-slate-600">
            <button onClick={() => handleModuleClick("seating", onEnterWorkspace)} className="hover:text-emerald-600 transition cursor-pointer">Workspace</button>
            <button onClick={() => handleModuleClick("result", onOpenResultPortal)} className="hover:text-sky-600 transition cursor-pointer">Result Portal</button>
            <button onClick={() => handleModuleClick("result", onOpenResultManager)} className="hover:text-purple-600 transition cursor-pointer">Result Manager</button>
            <button onClick={onOpenSuperAdmin} className="hover:text-purple-700 transition cursor-pointer font-semibold text-purple-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Super Admin</span>
            </button>
          </div>

          <div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-2xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>വാട്സാപ്പിൽ ചാറ്റ് ചെയ്യുക</span>
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
