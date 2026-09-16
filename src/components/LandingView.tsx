import React from 'react';
import { ArrowRight, ShieldCheck, FileText, Globe2, Volume2, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface LandingViewProps {
  onStartAnalysis: () => void;
  onLoadSample: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onStartAnalysis,
  onLoadSample,
}) => {
  return (
    <div className="py-8 sm:py-12 max-w-5xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-5 max-w-3xl mx-auto px-4">
        {/* Quality Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/70 text-teal-800 text-xs font-semibold tracking-wide">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Patient-Centered Diagnostic Interpretation</span>
        </div>

        {/* Mandatory Tagline and Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Understand your medical report in{' '}
          <span className="text-teal-700 underline decoration-teal-300 decoration-wavy decoration-2">
            simple language.
          </span>
        </h1>

        {/* Mandatory Supporting text */}
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Upload your laboratory or diagnostic report and get a clear explanation of your results.
        </p>

        {/* Primary CTA and Demo button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onStartAnalysis}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm sm:text-base shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
            id="landing-analyze-report-btn"
          >
            <span>Analyze Report</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onLoadSample}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm sm:text-base border border-slate-300 shadow-2xs transition-colors"
            id="landing-try-sample-btn"
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Try Sample Report (CBC + Metabolic)</span>
          </button>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {/* Card 1: Plain Language Translation */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Lab Values Demystified</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Translates complex diagnostic terminology, units, and ranges into clear everyday explanations without altering medical facts.
          </p>
        </div>

        {/* Card 2: Multilingual Support */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Globe2 className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">English, Hindi &amp; Tamil</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Get explanations in your preferred vernacular language. Clear explanations with native script clarity for family members.
          </p>
        </div>

        {/* Card 3: Abnormal Value Flagging */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Attention Areas Highlighted</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Quickly highlights values that sit outside normal reference ranges so you know what questions to discuss with your doctor.
          </p>
        </div>
      </div>

      {/* Compliance & Educational Notice banner */}
      <div className="mx-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-900 font-semibold">Educational Purpose:</strong> ClearMed extracts and explains existing report data to improve patient health literacy. It never creates diagnoses or replaces the advice of your qualified healthcare provider.
        </p>
      </div>
    </div>
  );
};
