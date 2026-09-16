import React, { useEffect, useState } from 'react';
import { X, Download, Printer, ExternalLink, FileText, AlertCircle } from 'lucide-react';
import { AnalysisResult } from '../types/report';
import { downloadReportPdf } from '../services/reportService';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  const [pdfSource, setPdfSource] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPdfSource(null);
      return;
    }

    if (result.pdf_base64) {
      const src = result.pdf_base64.startsWith('data:application/pdf')
        ? result.pdf_base64
        : `data:application/pdf;base64,${result.pdf_base64}`;
      setPdfSource(src);
    } else if (result.pdf_url) {
      setPdfSource(result.pdf_url);
    } else {
      setPdfSource(null);
    }
  }, [isOpen, result]);

  if (!isOpen) return null;

  const handleDownload = () => {
    downloadReportPdf(result);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        id="pdf-viewer-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 truncate">
                Diagnostic PDF Report: {result.uploaded_filename}
              </h2>
              <p className="text-xs text-slate-600">
                Patient: {result.patient_name || 'Patient'} • Analyzed on {new Date(result.analysis_timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors"
              id="pdf-modal-download-btn"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              id="pdf-modal-print-btn"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-600 hover:text-slate-700 rounded-lg hover:bg-slate-200/70 transition-colors"
              id="close-pdf-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Body Container */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center">
          {pdfSource ? (
            <iframe
              src={pdfSource}
              title="Medical Report PDF"
              className="w-full h-full border-0"
              id="pdf-render-frame"
            />
          ) : (
            <div className="p-8 max-w-md text-center space-y-4 bg-white rounded-xl border border-slate-200 shadow-xs m-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">PDF Direct Stream Not Attached</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The backend did not return an explicit PDF binary for this result. You can export or print this complete analysis summary report directly.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Print / Save as PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
