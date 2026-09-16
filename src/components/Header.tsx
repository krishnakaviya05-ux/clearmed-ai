import React from 'react';
import { Activity, Settings, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onReset: () => void;
  showResetButton?: boolean;
  backendStatus: 'connected' | 'offline' | 'demo' | 'checking';
  onLoadSample: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onReset,
  showResetButton,
  backendStatus,
  onLoadSample,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div 
          className="flex items-center gap-3 cursor-pointer group select-none"
          onClick={onReset}
          id="clearmed-brand-logo"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm shadow-teal-700/20 group-hover:bg-teal-700 transition-colors">
            <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xl tracking-tight text-slate-900">ClearMed</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-teal-50 text-teal-700 border border-teal-200/60 rounded">
                AI Diagnostic Explainer
              </span>
            </div>
            <p className="text-xs text-slate-600 hidden sm:block">
              Understand medical reports in simple language
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {/* Backend Connection Indicator */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
            title="Configure FastAPI Backend and test connection"
            id="backend-status-pill"
          >
            {backendStatus === 'connected' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline text-emerald-800 font-semibold">FastAPI Connected</span>
                <span className="sm:hidden text-emerald-800 font-semibold">API Live</span>
              </>
            )}
            {backendStatus === 'demo' && (
              <>
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-teal-800 font-semibold">Demo Mode</span>
              </>
            )}
            {backendStatus === 'offline' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="hidden sm:inline text-slate-700">Backend Offline</span>
                <span className="sm:hidden text-slate-700">Offline</span>
              </>
            )}
            {backendStatus === 'checking' && (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping" />
                <span className="text-slate-600">Checking...</span>
              </>
            )}
            <Settings className="w-3.5 h-3.5 text-slate-600 ml-0.5" />
          </button>

          {/* Quick Demo Sample Action */}
          <button
            onClick={onLoadSample}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 transition-colors"
            id="header-load-sample-btn"
            title="Load a complete specimen blood report for instant evaluation"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Sample Report</span>
          </button>

          {/* Reset / New Report Button */}
          {showResetButton && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-xs"
              id="header-new-report-btn"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Report</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
