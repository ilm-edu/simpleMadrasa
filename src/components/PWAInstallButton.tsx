import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share2, PlusSquare, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGeneralGuide, setShowGeneralGuide] = useState(false);

  // If already running in standalone mode (installed app), hide the install button
  if (isInstalled) {
    return (
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-xs font-medium">
        <CheckCircle2 className="w-4 h-4" />
        <span>Installed App</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow with beforeinstallprompt
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-2 text-xs font-bold shadow-lg shadow-emerald-900/40 transition-all hover:scale-105 active:scale-95 border border-emerald-400/30"
        title="Install Madrasa App on Home Screen"
      >
        <Download className="w-4 h-4 animate-bounce" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold transition shadow-sm"
        >
          <Smartphone className="w-4 h-4" />
          <span>Install App (iOS)</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-emerald-500/30 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <p className="font-medium text-emerald-300">
                  ആപ്പ് ഹോം സ്‌ക്രീനിലേക്ക് ആഡ് ചെയ്യാൻ താഴെ കാണുന്ന സ്റ്റെപ്പുകൾ ചെയ്യുക:
                </p>

                <div className="flex items-start gap-3 rounded-xl bg-slate-800/80 p-3 border border-slate-700">
                  <Share2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white mb-0.5">Step 1</p>
                    <p>സഫാരി (Safari) ബ്രൗസറിൽ താഴെയുള്ള <strong className="text-sky-400">Share</strong> ഐക്കണിൽ അമർത്തുക.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-slate-800/80 p-3 border border-slate-700">
                  <PlusSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white mb-0.5">Step 2</p>
                    <p>താഴോട്ട് സ്‌ക്രോൾ ചെയ്ത് <strong className="text-emerald-400">Add to Home Screen</strong> സെലക്ട് ചെയ്യുക.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white transition shadow-md"
              >
                മനസ്സിലായി (Got It)
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for desktop / browsers where beforeinstallprompt hasn't fired yet or manually triggering guide
  return (
    <>
      <button
        onClick={() => setShowGeneralGuide(true)}
        className="flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 px-3 py-1.5 text-xs font-medium transition"
        title="Add to Home Screen / Mobile App"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Add App</span>
      </button>

      {showGeneralGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-emerald-500/30 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Install Mobile App</h3>
              </div>
              <button
                onClick={() => setShowGeneralGuide(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              ഈ ആപ്പ് നിങ്ങളുടെ ഫോണിലോ കമ്പ്യൂട്ടറിലോ ഇൻസ്റ്റാൾ ചെയ്ത് പ്ലേ സ്റ്റോർ ആപ്പ് പോലെ ഉപയോഗിക്കാം:
            </p>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700">
                <strong className="text-emerald-400 block mb-1">Android / Chrome PC:</strong>
                ബ്രൗസർ മെനുവിലെ (3 Dots) <span className="text-white font-semibold">Install App</span> അല്ലെങ്കിൽ <span className="text-white font-semibold">Add to Home Screen</span> ക്ലിക്ക് ചെയ്യുക.
              </div>
              <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700">
                <strong className="text-sky-400 block mb-1">iPhone / iPad Safari:</strong>
                Safari മെനുവിലെ <span className="text-white font-semibold">Share</span> അമർത്തി <span className="text-white font-semibold">Add to Home Screen</span> സെലക്ട് ചെയ്യുക.
              </div>
            </div>

            <button
              onClick={() => setShowGeneralGuide(false)}
              className="mt-5 w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-bold text-white transition border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
