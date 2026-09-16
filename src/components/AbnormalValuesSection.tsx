import React from 'react';
import { AlertTriangle, ArrowUpRight, ArrowDownRight, HelpCircle, CheckCircle2 } from 'lucide-react';
import { TestItem, TestStatus } from '../types/report';

interface AbnormalValuesSectionProps {
  abnormalValues: TestItem[];
}

export const AbnormalValuesSection: React.FC<AbnormalValuesSectionProps> = ({
  abnormalValues,
}) => {
  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
            HIGH
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
            <ArrowDownRight className="w-3.5 h-3.5 text-amber-700" />
            LOW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
            <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
            UNKNOWN
          </span>
        );
    }
  };

  return (
    <section className="space-y-4" id="abnormal-values-section">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Values That Need Attention
            </h2>
            <p className="text-xs text-slate-600">
              Biomarkers outside typical standard reference intervals
            </p>
          </div>
        </div>

        {abnormalValues.length > 0 && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-900">
            {abnormalValues.length} {abnormalValues.length === 1 ? 'flagged result' : 'flagged results'}
          </span>
        )}
      </div>

      {/* When NO abnormal values are found */}
      {abnormalValues.length === 0 ? (
        <div 
          className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 text-center space-y-2"
          id="no-abnormal-values-banner"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm font-semibold text-emerald-950">
            No abnormal values were detected in the available report data.
          </p>
          <p className="text-xs text-emerald-800 max-w-md mx-auto">
            All identified laboratory markers in this analyzed report appear within typical reference intervals.
          </p>
        </div>
      ) : (
        /* Abnormal Values Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="abnormal-values-cards">
          {abnormalValues.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow space-y-3.5"
              id={`abnormal-card-${item.id || idx}`}
            >
              {/* Header: Test Name + Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{item.name}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Reference: <span className="font-medium text-slate-700">{item.reference_range || 'Standard interval'}</span>
                  </p>
                </div>
                {getStatusBadge(item.status)}
              </div>

              {/* Numerical Finding */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  {item.result}
                </span>
                {item.unit && (
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    {item.unit}
                  </span>
                )}
              </div>

              {/* Simple Explanation provided by backend */}
              {item.explanation && (
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed pt-1 border-t border-slate-100">
                  <span className="font-semibold text-slate-900 block text-xs mb-1">What this means:</span>
                  <p className="bg-amber-50/40 p-2.5 rounded-lg border border-amber-100/60 text-slate-800">
                    {item.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
