import React, { useState, useEffect } from 'react';
import { X, Server, CheckCircle2, AlertCircle, RefreshCw, Sparkles, ExternalLink, Code2 } from 'lucide-react';
import { getDefaultBackendUrl, setBackendUrl, isDemoModeEnabled, setDemoModeEnabled } from '../services/apiConfig';
import { checkBackendHealth } from '../services/reportService';

interface BackendSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (status: 'connected' | 'offline' | 'demo' | 'checking') => void;
}

export const BackendSettingsModal: React.FC<BackendSettingsModalProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [url, setUrl] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showDocs, setShowDocs] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrl(getDefaultBackendUrl());
      setDemoMode(isDemoModeEnabled());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setBackendUrl(url);
    setDemoModeEnabled(demoMode);
    if (demoMode) {
      onStatusChange('demo');
    } else {
      handleTest(url);
    }
    onClose();
  };

  const handleTest = async (testUrl?: string) => {
    setTesting(true);
    setTestResult(null);
    const target = testUrl || url;
    const res = await checkBackendHealth(target);
    setTesting(false);
    setTestResult(res);
    if (demoMode) {
      onStatusChange('demo');
    } else {
      onStatusChange(res.ok ? 'connected' : 'offline');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        id="backend-settings-modal"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Backend API Configuration</h2>
              <p className="text-xs text-slate-600">Connect to your FastAPI or SNS Agent Workbench service</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            id="close-settings-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Demo Mode Toggle */}
          <div className="p-3.5 rounded-xl border border-teal-200/80 bg-teal-50/50">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-xs text-teal-900">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Hackathon / Evaluation Demo Mode</span>
                </div>
                <p className="text-xs text-teal-700 leading-relaxed">
                  Enable simulated analysis with realistic laboratory data (CBC + Lipid + Thyroid) without needing a running FastAPI local server.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={demoMode}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setDemoMode(checked);
                    if (checked) {
                      setTestResult({ ok: true, message: 'Demo mode active — ready for testing' });
                    }
                  }}
                  className="sr-only peer"
                  id="toggle-demo-mode"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>
          </div>

          {/* FastAPI URL input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              FastAPI Base URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                id="fastapi-url-input"
              />
              <button
                type="button"
                onClick={() => handleTest()}
                disabled={testing}
                className="px-3.5 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-60"
                id="test-connection-btn"
              >
                {testing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Test</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-600">
              Analysis endpoint called: <code className="text-teal-700 font-mono">{url}/analyze</code>
            </p>
          </div>

          {/* Test connection result notice */}
          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                testResult.ok
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{testResult.ok ? 'Connection Successful' : 'Connection Failed'}</p>
                <p className="mt-0.5 opacity-90">{testResult.message}</p>
                {!testResult.ok && !demoMode && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    Tip: If running FastAPI on your local machine, enable CORS or toggle Demo Mode above for hackathon demonstration.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* API Contract Details Toggle */}
          <div className="border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowDocs(!showDocs)}
              className="text-xs font-medium text-teal-700 hover:text-teal-800 flex items-center gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showDocs ? 'Hide Backend Integration Specs' : 'View FastAPI Payload Specification'}</span>
            </button>

            {showDocs && (
              <div className="mt-2.5 p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono space-y-2 overflow-x-auto">
                <p className="text-teal-400 font-semibold">// POST /analyze (multipart/form-data)</p>
                <p><span className="text-slate-400">medical_report:</span> File (PDF | JPG | PNG)</p>
                <p><span className="text-slate-400">preferred_language:</span> &quot;english&quot; | &quot;tamil&quot; | &quot;hindi&quot;</p>
                <p className="text-slate-400 pt-1">// Expected JSON Response:</p>
                <pre className="text-[11px] text-teal-300">
{`{
  "patient_name": "string",
  "age": "string",
  "sex": "string",
  "summary": { "total_tests": 8, "normal": 5, "high": 1, "low": 2, "unknown": 0 },
  "tests": [
    { "name": "Hemoglobin", "result": 11.2, "unit": "g/dL", "reference_range": "13.0-17.0", "status": "LOW", "explanation": "..." }
  ],
  "abnormal_values": [...],
  "simple_explanation": "...",
  "pdf_url": "optional_url",
  "voice_output": [{ "audio_url": "...", "language_code": "en-US", "chunk_index": 1, "total_chunks": 2 }]
}`}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs"
            id="save-settings-btn"
          >
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
};
