import React, { ReactNode } from "react";
import { AlertTriangle, RefreshCw, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  showDetails: boolean;
}

export class ErrorBoundary extends (React.Component as any) {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an uncaught exception:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCacheAndReload = () => {
    try {
      localStorage.removeItem("madrasa_saved_shift_allocations");
      localStorage.removeItem("madrasa_cached_allocations");
      sessionStorage.clear();
    } catch (e) {
      console.error("Error clearing storage cache:", e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500" />

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-white">
                  സാങ്കേതിക തടസ്സം നേരിട്ടു
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Application Encountered an Unexpected Error
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
              ബ്രൗസറിലെ താൽക്കാലിക പ്രവർത്തന തകരാറോ കണക്കുകൂട്ടലിലെ പിശകോ കാരണമാണ് സ്ക്രീൻ നിർജ്ജീവമായത്. പേജ് റീലോഡ് ചെയ്തോ കാഷെ പുനഃക്രമീകരിച്ചോ എളുപ്പത്തിൽ ആപ്പ് സാധാരണ നിലയിലാക്കാം.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                <RefreshCw className="w-4 h-4" />
                <span>പേജ് റീലോഡ് ചെയ്യുക (Reload)</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCacheAndReload}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-600 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                title="Clears seating cache and reloads without losing students or halls list"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>കാഷെ മാറ്റി പുനഃസ്ഥാപിക്കുക (Reset Cache)</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="w-full flex items-center justify-between text-2xs text-slate-400 hover:text-slate-200 py-1 transition cursor-pointer"
              >
                <span>സാങ്കേതിക വിവരങ്ങൾ (Error Details)</span>
                {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 p-3 bg-black/50 border border-slate-800 rounded-lg text-3xs font-mono text-rose-300 overflow-x-auto max-h-48 whitespace-pre-wrap">
                  {this.state.error?.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-slate-400">
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
