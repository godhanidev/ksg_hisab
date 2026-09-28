import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReset = () => {
    try {
      // Clear session only, preserve config
      localStorage.removeItem("ksg_user_session_v5");
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-8 text-white">
          <div className="max-w-md w-full rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-4">
              <AlertTriangle size={32} />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white mb-2">
              કંઈક ખોટું થયું છે (App Error)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
              એપ્લિકેશન લોડ કરવામાં સમસ્યા આવી છે. નીચેના બટન પર ક્લિક કરીને એપ ફરી શરૂ કરો.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-3 text-sm transition shadow-lg"
              >
                <RefreshCw size={16} />
                <span>ફરીથી શરૂ કરો (Reload App)</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearAndReset}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 text-xs transition border border-white/10"
              >
                <Home size={14} />
                <span>લોગિન પેજ પર જાઓ (Go to Login)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
