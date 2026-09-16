import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  AlertCircle, 
  ArrowRight, 
  Check, 
  Sparkles,
  Info,
  Globe
} from 'lucide-react';
import { PreferredLanguage } from '../types/report';
import { formatBytes, validateMedicalReportFile } from '../services/reportService';

interface UploadCardProps {
  onAnalyze: (file: File, language: PreferredLanguage) => void;
  onLoadSample: (language: PreferredLanguage) => void;
  isProcessing?: boolean;
}

export const UploadCard: React.FC<UploadCardProps> = ({
  onAnalyze,
  onLoadSample,
  isProcessing = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>('english');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const validation = validateMedicalReportFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file type. Please upload a PDF, JPG, JPEG, or PNG.');
      setSelectedFile(null);
      return;
    }
    setErrorMessage(null);
    setSelectedFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    onAnalyze(selectedFile, preferredLanguage);
  };

  // Helper to get friendly file type label
  const getFileTypeLabel = (file: File) => {
    const ext = (file.name.split('.').pop() || '').toUpperCase();
    if (ext === 'PDF') return 'PDF Document';
    if (['JPG', 'JPEG'].includes(ext)) return 'JPEG Image Scan';
    if (ext === 'PNG') return 'PNG Image Scan';
    return `${ext} File`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <div 
        className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden"
        id="report-upload-card"
      >
        {/* Card Header */}
        <div className="p-6 sm:p-7 border-b border-slate-100 bg-linear-to-b from-slate-50/70 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/10 text-teal-700 flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Upload Medical Report</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Select your diagnostic report and preferred language for interpretation.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-6">
          {/* File Upload Section */}
          <div className="space-y-2">
            <label 
              htmlFor="medical_report"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Medical Report File <span className="text-rose-500">*</span>
            </label>

            {/* Hidden Input with required backend field name */}
            <input
              ref={fileInputRef}
              id="medical_report"
              name="medical_report"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={handleInputChange}
              disabled={isProcessing}
            />

            {!selectedFile ? (
              /* Drag and Drop Zone */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-teal-500 bg-teal-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-teal-500 hover:bg-slate-50/80 bg-slate-50/40'
                }`}
                id="dropzone-area"
              >
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800">
                      Drag and drop your report here, or{' '}
                      <span className="text-teal-700 underline underline-offset-2">browse files</span>
                    </p>
                    <p className="text-xs text-slate-600">
                      Accepted formats: <strong className="font-semibold text-slate-700">PDF, JPG, JPEG, PNG</strong> (max 25 MB)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                    id="browse-files-btn"
                  >
                    Browse Files
                  </button>
                </div>
              </div>
            ) : (
              /* Selected File Details Box */
              <div 
                className="p-4 rounded-xl border border-teal-200 bg-teal-50/30 flex items-center justify-between gap-4"
                id="selected-file-preview"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                    {selectedFile.type.includes('pdf') || selectedFile.name.endsWith('.pdf') ? (
                      <FileText className="w-6 h-6" />
                    ) : (
                      <ImageIcon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate" title={selectedFile.name}>
                      {selectedFile.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-white border border-slate-200 text-slate-700">
                        {getFileTypeLabel(selectedFile)}
                      </span>
                      <span>•</span>
                      <span>{formatBytes(selectedFile.size)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                  title="Remove selected file"
                  id="remove-file-btn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Validation Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Preferred Language Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label 
                htmlFor="preferred_language"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Preferred Language <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-600 flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-600" />
                Language for simple explanation
              </span>
            </div>

            {/* Language Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" id="preferred-language-options">
              {/* English */}
              <label
                className={`relative flex items-center p-3.5 rounded-xl border cursor-pointer transition-all ${
                  preferredLanguage === 'english'
                    ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="preferred_language"
                  value="english"
                  checked={preferredLanguage === 'english'}
                  onChange={() => setPreferredLanguage('english')}
                  className="sr-only"
                  id="lang-option-english"
                />
                <div className="flex items-center justify-between w-full">
                  <div>
                    <span className="block text-sm font-semibold text-slate-900">English</span>
                    <span className="block text-xs text-slate-600">Standard English</span>
                  </div>
                  {preferredLanguage === 'english' && (
                    <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </label>

              {/* Tamil */}
              <label
                className={`relative flex items-center p-3.5 rounded-xl border cursor-pointer transition-all ${
                  preferredLanguage === 'tamil'
                    ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="preferred_language"
                  value="tamil"
                  checked={preferredLanguage === 'tamil'}
                  onChange={() => setPreferredLanguage('tamil')}
                  className="sr-only"
                  id="lang-option-tamil"
                />
                <div className="flex items-center justify-between w-full">
                  <div>
                    <span className="block text-sm font-semibold text-slate-900">தமிழ் (Tamil)</span>
                    <span className="block text-xs text-slate-600">தமிழ் விளக்கம்</span>
                  </div>
                  {preferredLanguage === 'tamil' && (
                    <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </label>

              {/* Hindi */}
              <label
                className={`relative flex items-center p-3.5 rounded-xl border cursor-pointer transition-all ${
                  preferredLanguage === 'hindi'
                    ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="preferred_language"
                  value="hindi"
                  checked={preferredLanguage === 'hindi'}
                  onChange={() => setPreferredLanguage('hindi')}
                  className="sr-only"
                  id="lang-option-hindi"
                />
                <div className="flex items-center justify-between w-full">
                  <div>
                    <span className="block text-sm font-semibold text-slate-900">हिन्दी (Hindi)</span>
                    <span className="block text-xs text-slate-600">सरल हिंदी विवरण</span>
                  </div>
                  {preferredLanguage === 'hindi' && (
                    <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Primary Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!selectedFile || isProcessing}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-xs ${
                !selectedFile || isProcessing
                  ? 'bg-slate-200 text-slate-600 cursor-not-allowed border border-slate-200'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-700/20 hover:shadow-md active:scale-[0.99]'
              }`}
              id="analyze-report-submit-btn"
            >
              <span>Analyze Report</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick sample option */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-600" />
            <span>Don&apos;t have a medical report on hand?</span>
          </div>
          <button
            type="button"
            onClick={() => onLoadSample(preferredLanguage)}
            className="text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1 hover:underline"
            id="upload-card-load-sample-btn"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Test with Sample CBC Report ({preferredLanguage.toUpperCase()})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
