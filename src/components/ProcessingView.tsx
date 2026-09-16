import React from 'react';
import { 
  FileUp, 
  FileSearch, 
  Binary, 
  AlertCircle, 
  MessageSquareHeart, 
  ClipboardCheck, 
  CheckCircle2, 
  Loader2,
  XCircle,
  FileText
} from 'lucide-react';
import { PreferredLanguage } from '../types/report';
import { formatBytes } from '../services/reportService';

interface ProcessingViewProps {
  currentStageId: string;
  filename: string;
  fileSize?: number;
  language: PreferredLanguage;
  onCancel?: () => void;
}

interface StageDefinition {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGES: StageDefinition[] = [
  {
    id: 'uploading',
    label: 'Uploading report',
    description: 'Securing payload and sending to analysis pipeline',
    icon: FileUp,
  },
  {
    id: 'extracting',
    label: 'Extracting report text',
    description: 'Parsing scanned characters, OCR tables, and document layout',
    icon: FileSearch,
  },
  {
    id: 'reading',
    label: 'Reading medical values',
    description: 'Identifying biomarkers, reference ranges, and test units',
    icon: Binary,
  },
  {
    id: 'detecting',
    label: 'Detecting abnormal values',
    description: 'Evaluating results against physiological reference intervals',
    icon: AlertCircle,
  },
  {
    id: 'explaining',
    label: 'Creating patient-friendly explanation',
    description: 'Generating plain language summary and medical translations',
    icon: MessageSquareHeart,
  },
  {
    id: 'preparing',
    label: 'Preparing report',
    description: 'Formatting test table, voice chunks, and safety disclosures',
    icon: ClipboardCheck,
  },
];

export const ProcessingView: React.FC<ProcessingViewProps> = ({
  currentStageId,
  filename,
  fileSize,
  language,
  onCancel,
}) => {
  const currentStageIndex = Math.max(
    0,
    STAGES.findIndex((s) => s.id === currentStageId)
  );

  const getLanguageLabel = (lang: PreferredLanguage) => {
    if (lang === 'tamil') return 'Tamil (தமிழ்)';
    if (lang === 'hindi') return 'Hindi (हिन्दी)';
    return 'English';
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        id="analysis-processing-screen"
      >
        {/* Header with active pulsing badge */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/10 text-teal-700 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Analyzing Your Report</h2>
              <p className="text-xs text-slate-600">Please keep this window open while processing completes</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse mr-1.5" />
              In Progress
            </span>
          </div>
        </div>

        {/* Uploaded report metadata preview */}
        <div className="px-6 py-3.5 bg-slate-100/60 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 min-w-0">
            <FileText className="w-4 h-4 text-teal-700 shrink-0" />
            <span className="font-medium truncate max-w-xs">{filename}</span>
            {fileSize ? <span className="text-slate-600">({formatBytes(fileSize)})</span> : null}
          </div>
          <div className="text-slate-600">
            Target Language: <span className="font-semibold text-slate-800">{getLanguageLabel(language)}</span>
          </div>
        </div>

        {/* Processing Stages List */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {STAGES.map((stage, idx) => {
              const isDone = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const isPending = idx > currentStageIndex;
              const Icon = stage.icon;

              return (
                <div
                  key={stage.id}
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl transition-all duration-300 ${
                    isCurrent
                      ? 'bg-teal-50/70 border border-teal-200 shadow-xs'
                      : isDone
                      ? 'bg-slate-50/50 border border-slate-100 opacity-90'
                      : 'border border-transparent opacity-60'
                  }`}
                  id={`stage-item-${stage.id}`}
                >
                  {/* Status Indicator Icon */}
                  <div className="shrink-0 mt-0.5">
                    {isDone ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                        <span className="text-[11px] font-semibold">{idx + 1}</span>
                      </div>
                    )}
                  </div>

                  {/* Stage Text */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-semibold tracking-tight ${
                          isCurrent
                            ? 'text-teal-900'
                            : isDone
                            ? 'text-slate-800'
                            : 'text-slate-600'
                        }`}
                      >
                        {stage.label}
                      </p>
                      {isCurrent && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{stage.description}</p>
                  </div>

                  {/* Stage Category Icon */}
                  <div className="shrink-0">
                    <Icon
                      className={`w-4 h-4 ${
                        isCurrent
                          ? 'text-teal-700'
                          : isDone
                          ? 'text-emerald-700'
                          : 'text-slate-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Indeterminate smooth progression bar */}
          <div className="pt-2">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-teal-600 h-1.5 rounded-full transition-all duration-500 relative"
                style={{
                  width: `${((currentStageIndex + 1) / STAGES.length) * 100}%`,
                }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-600">
              <span>Stage {currentStageIndex + 1} of {STAGES.length}</span>
              <span>Processing without altering diagnostic values</span>
            </div>
          </div>
        </div>

        {/* Footer with cancel button */}
        {onCancel && (
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-600">Taking longer than expected?</p>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
              id="cancel-analysis-btn"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Analysis</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
