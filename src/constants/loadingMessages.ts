export const LOADING_MESSAGES = {
  // API Availability
  CHECKING_API: 'Checking AI availability...',
  DOWNLOADING_MODEL: 'Downloading Gemini Nano model...',
  DOWNLOADING_MODEL_SUB: 'This is a one-time download. Your data stays on-device.',
  LOADING_MODEL: 'Loading model into memory...',
  LOADING_MODEL_SUB: 'Almost ready! The model is being prepared for use.',
  INITIALIZING_CLIENT: 'Initializing AI client...',

  // Job Description Analysis
  ANALYZING_JD: 'Analyzing job description with AI...',
  ANALYZING_JD_SUB: 'Extracting key requirements and skills',

  // Interview Questions
  GENERATING_QUESTIONS: 'Generating interview questions...',
  GENERATING_QUESTIONS_SUB: 'Creating tailored questions based on job requirements',

  // Resume Processing
  UPLOADING_RESUME: 'Processing resume...',
  PARSING_RESUME: 'Extracting text from document...',
  EXTRACTING_IMAGE: 'Extracting text from image using AI...',
  EXTRACTING_IMAGE_SUB: 'Using on-device model for privacy',
  PROCESSING_RESUME_API: 'Processing resume via cloud API...',

  // Cover Letter
  CREATING_COVER_LETTER: 'Crafting personalized cover letter...',
  CREATING_COVER_LETTER_SUB: 'Matching your experience with job requirements',

  // Mock Interview
  TRANSCRIBING_AUDIO: 'Transcribing your answer...',
  TRANSCRIBING_AUDIO_SUB: 'Converting speech to text using AI',
  EVALUATING_ANSWER: 'Evaluating your answer...',
  EVALUATING_ANSWER_SUB: 'Analyzing content, clarity, and relevance',
  RECORDING: 'Recording in progress...',
  RECORDING_SUB: 'Speak clearly and take your time',

  // General
  AI_THINKING: 'AI is thinking...',
  PROCESSING: 'Processing...',
  PLEASE_WAIT: 'Please wait...',
} as const;

export type LoadingMessageKey = keyof typeof LOADING_MESSAGES;

export interface LoadingState {
  isLoading: boolean;
  message: string;
  subMessage?: string;
  operation?: string;
}
