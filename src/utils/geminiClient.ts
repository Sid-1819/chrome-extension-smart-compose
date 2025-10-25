/**
 * Prompt API Client for InterviewCoach.AI
 * Uses Chrome's built-in Gemini Nano model (on-device AI)
 */

// Extend Window interface to include LanguageModel
declare global {
  interface Window {
    LanguageModel?: any;
  }
}

export interface PromptAPIConfig {
  temperature?: number;
  topK?: number;
  systemPrompt?: string;
  onDownloadProgress?: (progress: number) => void;
}

export interface PromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  prefix?: boolean;
}

export class GeminiClient {
  private session: any = null;
  private config: PromptAPIConfig;
  private conversationHistory: PromptMessage[] = [];

  constructor(config: PromptAPIConfig = {}) {
    this.config = config;
  }

  /**
   * Check if Prompt API is available
   */
  async checkAvailability(): Promise<'available' | 'downloading' | 'unavailable'> {
    if (!window.LanguageModel) {
      throw new Error('Prompt API is not supported in this browser. Please use Chrome 127+ with Gemini Nano enabled.');
    }

    const availability = await window.LanguageModel.availability();
    return availability;
  }

  /**
   * Get model parameters
   */
  async getParams() {
    if (!window.LanguageModel) {
      throw new Error('Prompt API is not supported');
    }
    return await window.LanguageModel.params();
  }

  /**
   * Initialize session with optional system prompt
   */
  async initializeSession(systemPrompt?: string): Promise<void> {
    if (!window.LanguageModel) {
      throw new Error('Prompt API is not supported in this browser');
    }

    const availability = await this.checkAvailability();

    if (availability === 'unavailable') {
      throw new Error('Gemini Nano is not available on this device. Please check chrome://flags/#optimization-guide-on-device-model');
    }

    // Get default parameters
    const params = await this.getParams();

    // Prepare initial prompts
    const initialPrompts: PromptMessage[] = [];

    if (systemPrompt || this.config.systemPrompt) {
      initialPrompts.push({
        role: 'system',
        content: systemPrompt || this.config.systemPrompt || ''
      });
    }

    // Create session with monitoring for downloads
    this.session = await window.LanguageModel.create({
      temperature: this.config.temperature || params.defaultTemperature,
      topK: this.config.topK || params.defaultTopK,
      initialPrompts: initialPrompts.length > 0 ? initialPrompts : undefined,
      monitor: (m: any) => {
        m.addEventListener('downloadprogress', (e: any) => {
          const progress = e.loaded * 100;
          console.log(`Gemini Nano downloading: ${progress.toFixed(1)}%`);
          if (this.config.onDownloadProgress) {
            this.config.onDownloadProgress(progress);
          }
        });
      }
    });

    // Store initial prompts in conversation history
    this.conversationHistory = [...initialPrompts];

    console.log('Prompt API session initialized', {
      temperature: this.config.temperature || params.defaultTemperature,
      topK: this.config.topK || params.defaultTopK,
      inputQuota: this.session.inputQuota,
      inputUsage: this.session.inputUsage
    });
  }

  /**
   * Ensure session is initialized
   */
  private async ensureSession(): Promise<void> {
    if (!this.session) {
      await this.initializeSession();
    }
  }

  /**
   * Generate content using Prompt API
   */
  async generateContent(prompt: string, systemPrompt?: string): Promise<string> {
    await this.ensureSession();

    // If a different system prompt is provided, reinitialize
    if (systemPrompt && systemPrompt !== this.config.systemPrompt) {
      await this.destroySession();
      await this.initializeSession(systemPrompt);
    }

    const result = await this.session.prompt(prompt);

    // Update conversation history
    this.conversationHistory.push({ role: 'user', content: prompt });
    this.conversationHistory.push({ role: 'assistant', content: result });

    return result;
  }

  /**
   * Generate content with streaming
   */
  async *generateContentStreaming(prompt: string, systemPrompt?: string): AsyncGenerator<string> {
    await this.ensureSession();

    // If a different system prompt is provided, reinitialize
    if (systemPrompt && systemPrompt !== this.config.systemPrompt) {
      await this.destroySession();
      await this.initializeSession(systemPrompt);
    }

    const stream = this.session.promptStreaming(prompt);

    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse = chunk;
      yield chunk;
    }

    // Update conversation history
    this.conversationHistory.push({ role: 'user', content: prompt });
    this.conversationHistory.push({ role: 'assistant', content: fullResponse });
  }

  /**
   * Prompt with conversation context
   */
  async promptWithContext(messages: PromptMessage[]): Promise<string> {
    await this.ensureSession();

    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      throw new Error('No user message found in conversation');
    }

    // Use append for context if needed
    const contextMessages = messages.filter(m => m !== lastUserMessage);
    if (contextMessages.length > 0) {
      await this.session.append(contextMessages);
    }

    const result = await this.session.prompt(lastUserMessage.content);
    return result;
  }

  /**
   * Get session usage information
   */
  getUsage() {
    if (!this.session) {
      return { inputUsage: 0, inputQuota: 0, available: 0 };
    }

    return {
      inputUsage: this.session.inputUsage,
      inputQuota: this.session.inputQuota,
      available: this.session.inputQuota - this.session.inputUsage
    };
  }

  /**
   * Clone current session
   */
  async cloneSession(): Promise<GeminiClient> {
    if (!this.session) {
      throw new Error('No session to clone');
    }

    const clonedClient = new GeminiClient(this.config);
    clonedClient.session = await this.session.clone();
    clonedClient.conversationHistory = [...this.conversationHistory];
    return clonedClient;
  }

  /**
   * Destroy session and free resources
   */
  async destroySession(): Promise<void> {
    if (this.session) {
      this.session.destroy();
      this.session = null;
      this.conversationHistory = [];
    }
  }

  /**
   * Get AI feedback for interview practice
   */
  async getInterviewFeedback(userText: string, context?: string): Promise<string> {
    const systemPrompt = `You are an expert interview coach helping candidates improve their responses.
Analyze the following response and provide constructive feedback on:
1. Clarity and structure
2. Relevance and completeness
3. Communication style
4. Suggestions for improvement

Be encouraging but honest. Keep feedback concise and actionable.`;

    let prompt = `User's response: "${userText}"`;
    if (context) {
      prompt += `\n\nContext: ${context}`;
    }
    prompt += '\n\nProvide your feedback:';

    return this.generateContent(prompt, systemPrompt);
  }

  /**
   * Improve text (rewriting)
   */
  async improveText(text: string, style?: 'professional' | 'casual' | 'concise'): Promise<string> {
    const stylePrompts = {
      professional: 'Make this text more professional and polished',
      casual: 'Make this text more casual and friendly',
      concise: 'Make this text more concise while keeping the key points'
    };

    const systemPrompt = stylePrompts[style || 'professional'];
    const prompt = `Original text: "${text}"\n\nImproved version:`;

    return this.generateContent(prompt, systemPrompt);
  }

  /**
   * Proofread text
   */
  async proofread(text: string): Promise<string> {
    const systemPrompt = `You are a professional proofreader. Fix grammar, spelling, and punctuation errors in the text.
If there are no errors, return the original text. Only return the corrected text, no explanations.`;

    const prompt = `Text to proofread: "${text}"`;

    return this.generateContent(prompt, systemPrompt);
  }

  /**
   * Summarize text
   */
  async summarize(text: string, length: 'short' | 'medium' | 'long' = 'medium'): Promise<string> {
    const lengthPrompts = {
      short: 'Provide a brief 1-2 sentence summary',
      medium: 'Provide a concise paragraph summary',
      long: 'Provide a detailed summary with key points'
    };

    const systemPrompt = `You are a professional summarizer. ${lengthPrompts[length]} of the given text.`;
    const prompt = `Text to summarize: "${text}"`;

    return this.generateContent(prompt, systemPrompt);
  }

  /**
   * Translate text
   */
  async translate(text: string, targetLanguage: string): Promise<string> {
    const systemPrompt = `You are a professional translator. Translate the given text to ${targetLanguage}.
Only return the translation, no explanations.`;

    const prompt = `Text to translate: "${text}"`;

    return this.generateContent(prompt, systemPrompt);
  }
}

/**
 * Create a Gemini client instance (using Prompt API - no API key needed!)
 */
export async function createGeminiClient(config?: PromptAPIConfig): Promise<GeminiClient> {
  const client = new GeminiClient(config);
  await client.initializeSession();
  return client;
}

/**
 * Check if Prompt API is supported in the browser
 */
export function isPromptAPISupported(): boolean {
  return typeof window !== 'undefined' && 'LanguageModel' in window;
}

/**
 * Get availability status with user-friendly message
 */
export async function getAvailabilityStatus(): Promise<{
  status: 'available' | 'downloading' | 'unavailable';
  message: string;
}> {
  if (!isPromptAPISupported()) {
    return {
      status: 'unavailable',
      message: 'Prompt API not supported. Please use Chrome 127+ and enable Gemini Nano at chrome://flags/#optimization-guide-on-device-model'
    };
  }

  const availability = await window.LanguageModel.availability();

  const messages = {
    available: 'Gemini Nano is ready!',
    downloading: 'Gemini Nano is downloading... This may take a few minutes.',
    unavailable: 'Gemini Nano is not available on this device. Please check chrome://flags/#optimization-guide-on-device-model'
  };

  return {
    status: availability,
    message: messages[availability as keyof typeof messages] || 'Unknown status'
  };
}
