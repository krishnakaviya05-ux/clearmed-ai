import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import { Header } from './components/Header';
import { LandingView } from './components/LandingView';
import { UploadCard } from './components/UploadCard';
import { ProcessingView } from './components/ProcessingView';
import { ResultsDashboard } from './components/ResultsDashboard';
import { BackendSettingsModal } from './components/BackendSettingsModal';
import { AnalysisResult, PreferredLanguage } from './types/report';
import { uploadAndAnalyzeReport, checkBackendHealth } from './services/reportService';
import { getSampleAnalysisResult } from './services/sampleData';
import { isDemoModeEnabled, setDemoModeEnabled } from './services/apiConfig';
import { logoutUser, getCurrentUser } from './services/authService';
import { AlertCircle, RefreshCw, Settings, Sparkles } from 'lucide-react';

interface ClearMedUser {
  name: string;
  email: string;
}

type AppScreen = 'landing' | 'upload' | 'processing' | 'results';

export default function App() {
  // Authentication state initialized from localStorage
  const [user, setUser] = useState<ClearMedUser | null>(() => {
    const saved = localStorage.getItem('clearmed_user');
    if (!saved) return null;

    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.name && parsed.email) {
        return parsed as ClearMedUser;
      }
      return null;
    } catch {
      localStorage.removeItem('clearmed_user');
      return null;
    }
  });

  const [currentScreen, setCurrentScreen] = useState<AppScreen>('landing');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'offline' | 'demo' | 'checking'>('checking');
  
  // Active processing state
  const [processingStageId, setProcessingStageId] = useState('uploading');
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadingLanguage, setUploadingLanguage] = useState<PreferredLanguage>('english');

  // Completed analysis result
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Error alert state
  const [errorDetails, setErrorDetails] = useState<{
    message: string;
    isNetworkError?: boolean;
  } | null>(null);

  // Check initial backend health & verify session
  useEffect(() => {
    if (isDemoModeEnabled()) {
      setBackendStatus('demo');
      return;
    }

    const check = async () => {
      const res = await checkBackendHealth();
      setBackendStatus(res.ok ? 'connected' : 'offline');

      // If backend is connected and user is in localStorage, verify session cookie
      if (res.ok && user) {
        try {
          const verified = await getCurrentUser();
          if (verified) {
            setUser(verified);
            localStorage.setItem('clearmed_user', JSON.stringify(verified));
          } else {
            // Cookie invalid/expired
            localStorage.removeItem('clearmed_user');
            setUser(null);
          }
        } catch {
          // Keep local state on error
        }
      }
    };
    check();
  }, []);

  const handleStartAnalysis = () => {
    setCurrentScreen('upload');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadSample = (lang: PreferredLanguage = 'english') => {
    setErrorDetails(null);
    const sample = getSampleAnalysisResult(lang);
    setAnalysisResult(sample);
    setCurrentScreen('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalyze = async (file: File, language: PreferredLanguage) => {
    setUploadingFile(file);
    setUploadingLanguage(language);
    setProcessingStageId('uploading');
    setErrorDetails(null);
    setCurrentScreen('processing');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const result = await uploadAndAnalyzeReport(file, language, {
        onStageChange: (stageId) => {
          setProcessingStageId(stageId);
        },
      });

      setAnalysisResult(result);
      setCurrentScreen('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setErrorDetails({
        message: err.message || 'An unexpected error occurred during medical report analysis.',
        isNetworkError: err.isNetworkError,
      });
      setCurrentScreen('upload');
    }
  };

  const handleReset = () => {
    setUploadingFile(null);
    setErrorDetails(null);
    setCurrentScreen('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEnableDemoAndSample = () => {
    setDemoModeEnabled(true);
    setBackendStatus('demo');
    handleLoadSample(uploadingLanguage);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Backend logout failed:', err);
    }
    localStorage.removeItem('clearmed_user');
    setUser(null);
    setCurrentScreen('landing');
    setAnalysisResult(null);
    setUploadingFile(null);
  };

  // Gate: if user is not authenticated, show LoginPage first
  if (!user) {
    return (
      <LoginPage
        onLogin={(name, email) => {
          setUser({ name, email });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Universal Navigation Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReset={handleReset}
        showResetButton={currentScreen === 'results'}
        backendStatus={backendStatus}
        onLoadSample={() => handleLoadSample('english')}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-start">
        {/* Error notification banner if analysis failed */}
        {errorDetails && (
          <div className="max-w-2xl mx-auto w-full px-4 pt-6">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm space-y-3 shadow-xs">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="font-bold text-slate-900">Analysis Request Failed</p>
                  <p className="text-slate-700 leading-relaxed">{errorDetails.message}</p>
                </div>
              </div>

              {/* Helpful actions when backend is offline or network fails */}
              <div className="pt-2 border-t border-rose-200/80 flex flex-wrap items-center gap-2.5">
                {uploadingFile && (
                  <button
                    type="button"
                    onClick={() => handleAnalyze(uploadingFile, uploadingLanguage)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Analysis</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 hover:bg-rose-100/50 text-slate-800 font-medium text-xs transition-colors flex items-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configure FastAPI URL</span>
                </button>

                <button
                  type="button"
                  onClick={handleEnableDemoAndSample}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 ml-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Switch to Demo Mode &amp; Show Sample</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 1. LANDING SCREEN */}
        {currentScreen === 'landing' && (
          <div className="space-y-6">
            <LandingView
              onStartAnalysis={handleStartAnalysis}
              onLoadSample={() => handleLoadSample('english')}
            />
            {/* Embedded Upload Card preview directly on landing for streamlined UX */}
            <div className="pb-16">
              <UploadCard
                onAnalyze={handleAnalyze}
                onLoadSample={handleLoadSample}
              />
            </div>
          </div>
        )}

        {/* 2. REPORT UPLOAD SCREEN (When navigating to upload specifically) */}
        {currentScreen === 'upload' && (
          <div className="py-8">
            <UploadCard
              onAnalyze={handleAnalyze}
              onLoadSample={handleLoadSample}
            />
          </div>
        )}

        {/* 3. ANALYSIS PROCESSING SCREEN */}
        {currentScreen === 'processing' && uploadingFile && (
          <ProcessingView
            currentStageId={processingStageId}
            filename={uploadingFile.name}
            fileSize={uploadingFile.size}
            language={uploadingLanguage}
            onCancel={() => setCurrentScreen('upload')}
          />
        )}

        {/* 4. RESULTS DASHBOARD */}
        {currentScreen === 'results' && analysisResult && (
          <ResultsDashboard
            result={analysisResult}
            onNewAnalysis={() => setCurrentScreen('upload')}
          />
        )}
      </main>

      {/* Professional Healthcare Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">ClearMed</span>
            <span>•</span>
            <span>AI Diagnostic Explainer</span>
          </div>

          <p className="text-center sm:text-right text-slate-600 max-w-lg">
            For educational understanding only. Not a medical diagnosis. Consult qualified healthcare professionals.
          </p>
        </div>
      </footer>

      {/* Backend Settings / Connection Modal */}
      <BackendSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onStatusChange={(status) => setBackendStatus(status)}
      />
    </div>
  );
}
