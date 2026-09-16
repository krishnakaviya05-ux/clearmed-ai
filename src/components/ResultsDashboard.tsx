import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  User, 
  Globe2, 
  Download, 
  Eye, 
  Printer, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  HelpCircle, 
  Layers, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { AnalysisResult, PreferredLanguage } from '../types/report';
import { AbnormalValuesSection } from './AbnormalValuesSection';
import { CompleteResultsTable } from './CompleteResultsTable';
import { VoiceExplainer } from './VoiceExplainer';
import { PdfViewerModal } from './PdfViewerModal';
import { downloadReportPdf } from '../services/reportService';

interface ResultsDashboardProps {
  result: AnalysisResult;
  onNewAnalysis: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  result,
  onNewAnalysis,
}) => {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const hasPdfAvailable = Boolean(result.pdf_url || result.pdf_base64);

  const getLanguageLabel = (lang: PreferredLanguage) => {
    if (lang === 'tamil') return 'Tamil (தமிழ்)';
    if (lang === 'hindi') return 'Hindi (हिन्दी)';
    return 'English';
  };

  const handleDownloadPdf = () => {
    downloadReportPdf(result);
  };

  return (
    <div className="py-6 sm:py-8 max-w-5xl mx-auto px-4 sm:px-6 space-y-8" id="clearmed-results-dashboard">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
        <button
          type="button"
          onClick={onNewAnalysis}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
          id="back-to-upload-btn"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Upload Another Report</span>
        </button>

        <div className="flex items-center gap-2">
          {/* View PDF button */}
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            id="view-pdf-btn"
            title="Preview medical report PDF"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span>View PDF</span>
          </button>

          {/* Download PDF button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors"
            id="download-pdf-btn"
            title="Download report PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* 4. HEADER: "Your Report Summary" with Patient details */}
      <div 
        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-7 space-y-5"
        id="report-summary-header"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Your Report Summary
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Verified extraction from uploaded laboratory specimen
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            <span>
              Analysis date/time:{' '}
              <strong className="text-slate-800 font-semibold">
                {new Date(result.analysis_timestamp).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </strong>
            </span>
          </div>
        </div>

        {/* Patient Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 text-xs">
          {/* Patient name */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-600 block text-[11px] font-semibold uppercase tracking-wider">
              Patient Name
            </span>
            <span className="font-bold text-slate-900 text-sm truncate block mt-0.5" id="patient-name-val">
              {result.patient_name || result.patient?.name || 'Not specified'}
            </span>
          </div>

          {/* Age */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-600 block text-[11px] font-semibold uppercase tracking-wider">
              Age
            </span>
            <span className="font-bold text-slate-900 text-sm block mt-0.5" id="patient-age-val">
              {result.age || result.patient?.age || '—'}
            </span>
          </div>

          {/* Sex */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-600 block text-[11px] font-semibold uppercase tracking-wider">
              Sex
            </span>
            <span className="font-bold text-slate-900 text-sm block mt-0.5" id="patient-sex-val">
              {result.sex || result.patient?.sex || '—'}
            </span>
          </div>

          {/* Selected language */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-600 block text-[11px] font-semibold uppercase tracking-wider">
              Selected Language
            </span>
            <span className="font-bold text-teal-800 text-sm block mt-0.5" id="patient-language-val">
              {getLanguageLabel(result.preferred_language)}
            </span>
          </div>

          {/* Uploaded report filename */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
            <span className="text-slate-600 block text-[11px] font-semibold uppercase tracking-wider">
              Report File
            </span>
            <span className="font-bold text-slate-900 text-sm truncate block mt-0.5" title={result.uploaded_filename} id="report-filename-val">
              {result.uploaded_filename}
            </span>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS: Total Tests, Normal, High, Low, Unknown */}
      {/* Colors used only as visual aid; includes distinct text labels and icons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5" id="summary-metrics-cards">
        {/* Total Tests */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Tests</span>
            <Layers className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900" id="metric-total-tests">
            {result.summary.total_tests}
          </p>
          <p className="text-[11px] text-slate-600 font-medium">Extracted biomarkers</p>
        </div>

        {/* Normal */}
        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-semibold uppercase tracking-wider">Normal</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-800" id="metric-normal-tests">
            {result.summary.normal}
          </p>
          <p className="text-[11px] text-emerald-800 font-medium">Within standard range</p>
        </div>

        {/* High */}
        <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-xs font-semibold uppercase tracking-wider">High</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-800" id="metric-high-tests">
            {result.summary.high}
          </p>
          <p className="text-[11px] text-rose-800 font-medium">Above reference interval</p>
        </div>

        {/* Low */}
        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-xs font-semibold uppercase tracking-wider">Low</span>
            <ArrowDownRight className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-900" id="metric-low-tests">
            {result.summary.low}
          </p>
          <p className="text-[11px] text-amber-900 font-medium">Below reference interval</p>
        </div>

        {/* Unknown */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-xs font-semibold uppercase tracking-wider">Unknown</span>
            <HelpCircle className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-800" id="metric-unknown-tests">
            {result.summary.unknown}
          </p>
          <p className="text-[11px] text-slate-600 font-medium">Requires clinician review</p>
        </div>
      </div>

      {/* 10. VOICE RESULT: "Listen to Your Explanation" */}
      {result.voice_output && result.voice_output.length > 0 && (
        <VoiceExplainer
          chunks={result.voice_output}
          preferredLanguage={result.preferred_language}
        />
      )}
      {result.voice_error && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3" role="status">
          {result.voice_error}
        </p>
      )}

      {/* 5. ABNORMAL VALUES SECTION: "Values That Need Attention" */}
      <AbnormalValuesSection abnormalValues={result.abnormal_values} />

      {/* 7. PATIENT-FRIENDLY EXPLANATION: "Simple Explanation" */}
      <section 
        className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4"
        id="simple-explanation-section"
      >
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-teal-700" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Simple Explanation
            </h2>
            <p className="text-xs text-slate-600">
              Plain language interpretation prepared for patient understanding
            </p>
          </div>
        </div>

        {/* Formatted Explanation Content */}
        <div 
          className="text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-line space-y-3 font-normal"
          id="explanation-content-body"
        >
          {result.simple_explanation}
        </div>
      </section>

      {/* 6. COMPLETE TEST RESULTS TABLE */}
      <CompleteResultsTable tests={result.tests} />

      {/* 8. SAFETY NOTICE: Clearly visible educational notice */}
      <section 
        className="p-5 sm:p-6 rounded-2xl bg-amber-50/60 border-2 border-amber-300/80 shadow-xs flex items-start gap-4"
        id="safety-notice-disclaimer"
      >
        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5 text-amber-700" />
        </div>
        <div className="space-y-1 text-slate-900">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-900">
            Important Medical Disclaimer
          </h3>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
            This explanation is for educational purposes only and is not a medical diagnosis. Please consult a qualified healthcare professional for medical advice or interpretation of your results.
          </p>
        </div>
      </section>

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        result={result}
      />
    </div>
  );
};
