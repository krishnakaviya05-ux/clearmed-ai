export type PreferredLanguage = 'english' | 'tamil' | 'hindi';

export type TestStatus = 'NORMAL' | 'HIGH' | 'LOW' | 'UNKNOWN';

export interface TestItem {
  id?: string;
  name: string;
  result: string | number;
  unit?: string;
  reference_range?: string;
  status: TestStatus;
  explanation: string;
}

export interface AudioChunk {
  audio_url: string;
  language_code: string;
  chunk_index: number;
  total_chunks: number;
  title?: string;
  text?: string;
  duration_seconds?: number;
}

export interface ReportSummary {
  total_tests: number;
  normal: number;
  high: number;
  low: number;
  unknown: number;
}

export interface PatientInfo {
  name?: string;
  age?: number | string;
  sex?: string;
  patient_id?: string;
}

export interface AnalysisResult {
  id?: string;
  patient?: PatientInfo;
  patient_name?: string;
  age?: number | string;
  sex?: string;
  preferred_language: PreferredLanguage;
  uploaded_filename: string;
  file_size?: number;
  analysis_timestamp: string;
  summary: ReportSummary;
  tests: TestItem[];
  abnormal_values: TestItem[];
  simple_explanation: string;
  pdf_url?: string;
  pdf_base64?: string;
  voice_output?: AudioChunk[];
  voice_error?: string | null;
  disclaimer?: string;
}

export interface ProcessingStage {
  id: string;
  label: string;
  description: string;
}
