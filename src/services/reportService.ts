import { AnalysisResult, PreferredLanguage, TestItem, TestStatus, AudioChunk } from '../types/report';
import { getDefaultBackendUrl, isDemoModeEnabled, setBackendUrl } from './apiConfig';
import { getSampleAnalysisResult } from './sampleData';

/**
 * Service adapter layer for communicating with FastAPI / SNS Agent Workbench.
 * Keeps all backend integration logic isolated for easy configuration.
 */

export interface AnalysisApiOptions {
  customEndpoint?: string;
  timeoutMs?: number;
  onStageChange?: (stageId: string, stageLabel: string) => void;
}

/**
 * Validates file type and size
 */
export function validateMedicalReportFile(file: File): { valid: boolean; error?: string } {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];

  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
  const mime = file.type.toLowerCase();

  const matchesExt = allowedExtensions.includes(ext);
  const matchesMime = allowedMimeTypes.includes(mime);

  if (!matchesExt && !matchesMime) {
    return {
      valid: false,
      error: `Unsupported file format "${file.name}". Please upload a PDF, JPG, JPEG, or PNG medical report.`,
    };
  }

  // 25MB max size limit for diagnostic reports
  const maxSizeBytes = 25 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: 'File size exceeds 25 MB limit. Please upload a smaller scan or PDF.',
    };
  }

  return { valid: true };
}

/**
 * Formats bytes to readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Checks connectivity to the FastAPI backend
 */
async function pingEndpoint(url: string, timeoutMs = 3000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${url.replace(/\/+$/, '')}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok || res.status === 404 || res.status === 405;
  } catch {
    return false;
  }
}

/**
 * Checks connectivity to the FastAPI backend with intelligent auto-discovery
 */
export async function checkBackendHealth(baseUrl?: string): Promise<{ ok: boolean; message: string; details?: any }> {
  const currentUrl = (baseUrl || getDefaultBackendUrl()).replace(/\/+$/, '');

  // 1. Check current configured URL
  if (await pingEndpoint(currentUrl, 2500)) {
    return { ok: true, message: `Connected to FastAPI server at ${currentUrl}` };
  }

  // 2. Auto-discovery: If local FastAPI is running on 127.0.0.1:8000, connect to it
  if (currentUrl !== 'http://127.0.0.1:8000' && await pingEndpoint('http://127.0.0.1:8000', 1500)) {
    return { ok: true, message: `Connected to local FastAPI server at http://127.0.0.1:8000` };
  }

  // 3. Auto-discovery: If hosted Render backend is live, connect to it
  if (currentUrl !== 'https://clearmed-ai-1.onrender.com' && await pingEndpoint('https://clearmed-ai-1.onrender.com', 4000)) {
    return { ok: true, message: `Connected to Render FastAPI server` };
  }

  // 4. Extended wait for waking up servers
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(`${currentUrl}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok || response.status === 404 || response.status === 405) {
      return { ok: true, message: `Connected to FastAPI server at ${currentUrl}` };
    }
    return { ok: false, message: `Server returned status HTTP ${response.status}` };
  } catch (err: any) {
    return {
      ok: false,
      message: err.name === 'AbortError' ? 'Connection timed out (backend may be waking up)' : (err.message || 'Cannot reach server'),
    };
  }
}

/**
 * Uploads medical report and triggers the backend analysis workflow
 */
export async function uploadAndAnalyzeReport(
  file: File,
  language: PreferredLanguage,
  options?: AnalysisApiOptions
): Promise<AnalysisResult> {
  const primaryUrl = getDefaultBackendUrl();

  // If user explicitly enabled Demo Mode
  if (isDemoModeEnabled()) {
    return simulateBackendWorkflow(file, language, options?.onStageChange);
  }

  const formData = new FormData();
  formData.append('medical_report', file);
  formData.append('preferred_language', language);

  options?.onStageChange?.('uploading', 'Uploading report');

  // Candidate backend endpoints to try in order
  const candidateBases = [
    primaryUrl,
    'http://127.0.0.1:8000',
    'https://clearmed-ai-1.onrender.com',
  ].filter((u, idx, arr) => arr.indexOf(u) === idx);

  let lastError: any = null;

  for (const candidateBase of candidateBases) {
    const endpoint = options?.customEndpoint || `${candidateBase}/analyze`;
    try {
      const controller = new AbortController();
      const timeoutMs = options?.timeoutMs || 90000; // 90s for analysis
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      simulateStageProgression(options?.onStageChange);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let parsedError = errorText;
        try {
          const json = JSON.parse(errorText);
          parsedError = json.detail || json.message || errorText;
        } catch {
          // Keep string
        }
        throw new Error(`Backend error (${response.status}): ${parsedError}`);
      }

      const data = await response.json();
      setBackendUrl(candidateBase);
      return normalizeBackendResponse(data, file.name, file.size, language);
    } catch (err: any) {
      lastError = err;
      const isNetworkError = err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError');
      if (isNetworkError) {
        console.warn(`Could not reach ${candidateBase}, trying next candidate...`);
        continue;
      }
      throw err;
    }
  }

  if (lastError) {
    if (lastError.name === 'AbortError') {
      throw new Error('The analysis request timed out. Please verify your backend server or network.');
    }
    const isNetworkError = lastError.message?.includes('Failed to fetch') || lastError.message?.includes('NetworkError');
    if (isNetworkError) {
      const enhancedError = new Error(
        `Unable to reach FastAPI backend. Please verify your server at http://127.0.0.1:8000 is active.`
      );
      (enhancedError as any).isNetworkError = true;
      (enhancedError as any).originalError = lastError;
      throw enhancedError;
    }
    throw lastError;
  }

  throw new Error('Unable to reach FastAPI backend server.');
}

/**
 * Simulates stage progression for visual feedback while waiting for long processing tasks
 */
function simulateStageProgression(onStageChange?: (stageId: string, stageLabel: string) => void) {
  if (!onStageChange) return;

  const stages = [
    { id: 'extracting', label: 'Extracting report text', delay: 1800 },
    { id: 'reading', label: 'Reading medical values', delay: 4200 },
    { id: 'detecting', label: 'Detecting abnormal values', delay: 7000 },
    { id: 'explaining', label: 'Creating patient-friendly explanation', delay: 10500 },
    { id: 'preparing', label: 'Preparing report', delay: 14000 },
  ];

  stages.forEach(({ id, label, delay }) => {
    setTimeout(() => {
      onStageChange(id, label);
    }, delay);
  });
}

/**
 * Simulates backend workflow with realistic timing for demonstrations
 */
async function simulateBackendWorkflow(
  file: File,
  language: PreferredLanguage,
  onStageChange?: (stageId: string, stageLabel: string) => void
): Promise<AnalysisResult> {
  const steps = [
    { id: 'uploading', label: 'Uploading report', delay: 800 },
    { id: 'extracting', label: 'Extracting report text', delay: 1200 },
    { id: 'reading', label: 'Reading medical values', delay: 1400 },
    { id: 'detecting', label: 'Detecting abnormal values', delay: 1200 },
    { id: 'explaining', label: 'Creating patient-friendly explanation', delay: 1600 },
    { id: 'preparing', label: 'Preparing report', delay: 1000 },
  ];

  for (const step of steps) {
    onStageChange?.(step.id, step.label);
    await new Promise((r) => setTimeout(r, step.delay));
  }

  const sample = getSampleAnalysisResult(language);
  sample.uploaded_filename = file.name;
  sample.file_size = file.size;
  return sample;
}

/**
 * Normalizes varied backend response shapes into the strict AnalysisResult interface
 */
export function normalizeBackendResponse(
  data: any,
  fallbackFilename: string,
  fallbackFileSize: number,
  fallbackLanguage: PreferredLanguage
): AnalysisResult {
  const patientName = data.patient_name || data.patient?.name || 'Patient';
  const age = data.age || data.patient?.age || '—';
  const sex = data.sex || data.gender || data.patient?.sex || '—';
  const language = data.preferred_language || fallbackLanguage;
  const filename = data.uploaded_filename || data.filename || fallbackFilename;
  const timestamp = data.analysis_timestamp || data.timestamp || new Date().toISOString();

  // Normalize tests array
  const rawTests: any[] = Array.isArray(data.tests)
    ? data.tests
    : Array.isArray(data.test_results)
    ? data.test_results
    : Array.isArray(data.results)
    ? data.results
    : [];

  const tests: TestItem[] = rawTests.map((t, idx) => {
    const rawStatus = (t.status || 'UNKNOWN').toString().toUpperCase();
    let status: TestStatus = 'UNKNOWN';
    if (rawStatus.includes('NORM')) status = 'NORMAL';
    else if (rawStatus.includes('HIGH')) status = 'HIGH';
    else if (rawStatus.includes('LOW')) status = 'LOW';

    return {
      id: t.id || `test-${idx + 1}`,
      name: t.name || t.test_name || t.test || `Test ${idx + 1}`,
      result: t.result !== undefined ? t.result : t.value ?? '—',
      unit: t.unit || t.units || '',
      reference_range: t.reference_range || t.reference || t.range || 'Not specified',
      status,
      explanation: t.explanation || t.simple_explanation || t.meaning || '',
    };
  });

  // Normalize abnormal values
  let abnormalValues: TestItem[] = [];
  if (Array.isArray(data.abnormal_values)) {
    abnormalValues = data.abnormal_values.map((t: any, idx: number) => {
      const rawStatus = (t.status || 'UNKNOWN').toString().toUpperCase();
      let status: TestStatus = 'UNKNOWN';
      if (rawStatus.includes('HIGH')) status = 'HIGH';
      else if (rawStatus.includes('LOW')) status = 'LOW';

      return {
        id: t.id || `abnormal-${idx + 1}`,
        name: t.name || t.test_name || `Test ${idx + 1}`,
        result: t.result !== undefined ? t.result : t.value ?? '—',
        unit: t.unit || '',
        reference_range: t.reference_range || t.reference || '',
        status,
        explanation: t.explanation || '',
      };
    });
  } else {
    // Derive from tests
    abnormalValues = tests.filter((t) => t.status === 'HIGH' || t.status === 'LOW');
  }

  // Summary counts
  const summary = {
    total_tests: data.summary?.total_tests ?? tests.length,
    normal: data.summary?.normal ?? tests.filter((t) => t.status === 'NORMAL').length,
    high: data.summary?.high ?? tests.filter((t) => t.status === 'HIGH').length,
    low: data.summary?.low ?? tests.filter((t) => t.status === 'LOW').length,
    unknown: data.summary?.unknown ?? tests.filter((t) => t.status === 'UNKNOWN').length,
  };

  // Voice output chunks with intelligent audio URL resolution
  const baseUrl = getDefaultBackendUrl().replace(/\/+$/, '');
  let voiceOutput: AudioChunk[] | undefined;
  const rawAudio = data.voice_output || data.audio_chunks || data.voice_chunks || data.audio;
  if (Array.isArray(rawAudio)) {
    voiceOutput = rawAudio.map((chunk: any, i: number) => {
      let audioUrl = (chunk.audio_url || chunk.url || '').trim();
      if (audioUrl) {
        if (audioUrl.startsWith('/')) {
          audioUrl = `${baseUrl}${audioUrl}`;
        } else if (
          (audioUrl.includes('localhost') || audioUrl.includes('127.0.0.1')) &&
          !baseUrl.includes('localhost') &&
          !baseUrl.includes('127.0.0.1')
        ) {
          try {
            const urlObj = new URL(audioUrl);
            audioUrl = `${baseUrl}${urlObj.pathname}${urlObj.search}`;
          } catch {
            audioUrl = `${baseUrl}/audio/${chunk.file_name || ''}`;
          }
        }
      }

      return {
        audio_url: audioUrl,
        audio_base64: chunk.audio_base64 || chunk.base64 || chunk.base64_audio || undefined,
        language_code: chunk.language_code || 'en-US',
        chunk_index: chunk.chunk_index ?? i + 1,
        total_chunks: chunk.total_chunks ?? rawAudio.length,
        title: chunk.title || `Audio Part ${i + 1}`,
        text: chunk.text,
        duration_seconds: chunk.duration_seconds,
      };
    });
  }

  return {
    id: data.id || `report-${Date.now()}`,
    patient_name: patientName,
    age,
    sex,
    preferred_language: language,
    uploaded_filename: filename,
    file_size: fallbackFileSize,
    analysis_timestamp: timestamp,
    summary,
    tests,
    abnormal_values: abnormalValues,
    simple_explanation:
      data.simple_explanation ||
      data.explanation ||
      data.patient_explanation ||
      'No explanation text was returned by the analysis system.',
    pdf_url: data.pdf_url,
    pdf_base64: data.pdf_base64 || data.base64_pdf,
    voice_output: voiceOutput,
    voice_error: data.voice_error || null,
    disclaimer: data.disclaimer,
  };
}

/**
 * Downloads or views a PDF from either base64, direct URL, or blob response
 */
export async function downloadReportPdf(result: AnalysisResult): Promise<void> {
  if (result.pdf_base64) {
    const base64Data = result.pdf_base64.replace(/^data:application\/pdf;base64,/, '');
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    triggerBrowserDownload(blobUrl, `ClearMed_${result.uploaded_filename.replace(/\.[^/.]+$/, '')}_Report.pdf`);
    return;
  }

  if (result.pdf_url) {
    // If it's a direct url or relative path
    const fullUrl = result.pdf_url.startsWith('http')
      ? result.pdf_url
      : `${getDefaultBackendUrl()}${result.pdf_url.startsWith('/') ? '' : '/'}${result.pdf_url}`;
    
    try {
      const res = await fetch(fullUrl);
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        triggerBrowserDownload(blobUrl, `ClearMed_Summary_${result.uploaded_filename.replace(/\.[^/.]+$/, '')}.pdf`);
        return;
      }
    } catch {
      // If CORS or direct download fails, open in new tab
      window.open(fullUrl, '_blank');
      return;
    }
  }

  // If no backend PDF was supplied, generate a clean printable summary format or browser print
  window.print();
}

function triggerBrowserDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
