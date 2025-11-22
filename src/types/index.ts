import type { GeminiClient } from "@/utils/geminiClient";

// Loading state for various operations
export interface LoadingState {
  isLoading: boolean;
  message: string;
  subMessage?: string;
}

// Availability status for Gemini Nano
export type AvailabilityStatus = "available" | "downloading" | "unavailable" | "";

// Tab identifiers
export type TabId = "jd-coverletter" | "interview-practice";

// Tab configuration
export interface Tab {
  id: TabId;
  label: string;
}

// Persisted state structure for chrome.storage
export interface PersistedState {
  jobDescription?: string;
  jdAnalysisResult?: string;
  interviewQuestions?: string;
  resumeText?: string;
  resumeFilename?: string | null;
  coverLetterResult?: string;
  activeTab?: TabId;
}

// Context menu action types
export type ContextMenuAction = "analyze-job-description" | "generate-questions";

// Context menu storage data
export interface ContextMenuData {
  contextMenuAction?: ContextMenuAction;
  selectedText?: string;
  timestamp?: number;
}

// Gemini client configuration
export interface GeminiClientConfig {
  expectedInputs?: Array<{ type: string; languages: string[] }>;
  expectedOutputs?: Array<{ type: string; languages: string[] }>;
  onDownloadProgress?: (progress: number) => void;
  onModelLoading?: () => void;
}

// Voice recording state
export interface VoiceRecordingState {
  isRecording: boolean;
  mediaRecorder: MediaRecorder | null;
}

// Hook return types
export interface UseGeminiClientReturn {
  geminiClient: GeminiClient | null;
  availability: AvailabilityStatus;
  status: string;
  downloadProgress: number | null;
  isModelLoading: boolean;
  checkAvailability: () => Promise<void>;
  initializeClient: () => Promise<void>;
  setStatus: (status: string) => void;
}

export interface UseVoiceRecordingReturn {
  isRecording: boolean;
  audioLoading: LoadingState;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export interface UseChromeStorageReturn {
  persistState: (state: PersistedState) => Promise<void>;
  restoreState: () => Promise<PersistedState | null>;
  checkContextMenuAction: () => Promise<ContextMenuData | null>;
  clearContextMenuAction: () => Promise<void>;
}

// Component props types
export interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export interface AnalysisResultProps {
  result: string;
}

export interface ResumeUploadProps {
  resumeText: string;
  resumeFilename: string | null;
  isLoading: boolean;
  loadingMessage?: string;
  loadingSubMessage?: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTextChange: (value: string) => void;
  onClear: () => void;
}

export interface CoverLetterResultProps {
  result: string;
  onCopy: () => void;
  copySuccess: boolean;
}

export interface QuestionGeneratorProps {
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  loadingMessage?: string;
  loadingSubMessage?: string;
  disabled: boolean;
}

export interface QuestionsListProps {
  questions: string[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export interface MockInterviewProps {
  mockQuestion: string;
  mockAnswer: string;
  mockFeedback: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  isRecording: boolean;
  isEvaluating: boolean;
  evaluatingMessage?: string;
  evaluatingSubMessage?: string;
  audioLoading: LoadingState;
  disabled: boolean;
  onQuestionChange: (value: string) => void;
  onAnswerChange: (value: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearAnswer: () => void;
  onEvaluate: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export interface StatusCardProps {
  status: string;
  availability: AvailabilityStatus;
  onRefresh: () => void;
}

export interface HeaderProps {
  isInSidebar: boolean;
}
