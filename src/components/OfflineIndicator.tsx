import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:right-auto md:max-w-md z-50 flex items-center justify-between gap-3 rounded-xl bg-amber-600 px-4 py-3 text-sm font-medium text-white shadow-2xl border border-amber-400/30 backdrop-blur-md animate-bounce-short">
      <div className="flex items-center gap-2.5">
        <WifiOff className="w-5 h-5 text-amber-200 shrink-0 animate-pulse" />
        <div>
          <p className="font-bold text-xs uppercase tracking-wider text-amber-200">Offline Mode Active</p>
          <p className="text-xs text-amber-50 leading-tight">ഓഫ്‌ലൈനിൽ പ്രവർത്തിക്കുന്നു — കാഷെ ചെയ്ത ഡാറ്റ ലഭ്യമാണ്</p>
        </div>
      </div>
      <div className="shrink-0 bg-amber-700/60 text-amber-200 text-[10px] px-2 py-1 rounded font-mono">
        NO INTERNET
      </div>
    </div>
  );
};
