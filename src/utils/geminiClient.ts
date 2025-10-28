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
   * Optimized to reuse sessions - system prompts are embedded in the user prompt
   */
  async generateContent(prompt: string, systemPrompt?: string): Promise<string> {
    await this.ensureSession();

    // Embed system prompt in the user prompt for better performance
    // This avoids destroying/recreating sessions which is very slow
    let fullPrompt = prompt;
    if (systemPrompt) {
      fullPrompt = `${systemPrompt}\n\n${prompt}`;
    }

    const result = await this.session.prompt(fullPrompt);

    // Update conversation history
    this.conversationHistory.push({ role: 'user', content: fullPrompt });
    this.conversationHistory.push({ role: 'assistant', content: result });

    return result;
  }

  /**
   * Generate content with streaming
   * Optimized to reuse sessions - system prompts are embedded in the user prompt
   */
  async *generateContentStreaming(prompt: string, systemPrompt?: string): AsyncGenerator<string> {
    await this.ensureSession();

    // Embed system prompt in the user prompt for better performance
    let fullPrompt = prompt;
    if (systemPrompt) {
      fullPrompt = `${systemPrompt}\n\n${prompt}`;
    }

    const stream = this.session.promptStreaming(fullPrompt);

    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse = chunk;
      yield chunk;
    }

    // Update conversation history
    this.conversationHistory.push({ role: 'user', content: fullPrompt });
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

  /**
   * Analyze job description and extract key information
   */
  async analyzeJobDescription(jobDescription: string): Promise<string> {
    const systemPrompt = `You are an expert career coach and job market analyst.
Analyze job descriptions and extract the most critical information that candidates need to prepare for interviews.
Format your response in a clear, structured way with bullet points.`;

    const prompt = `Analyze this job description and extract:

1. **Key Responsibilities** (top 3-5)
2. **Required Skills & Qualifications** (must-haves)
3. **Preferred Skills** (nice-to-haves)
4. **Technical Requirements** (tools, languages, frameworks)
5. **Experience Level** (years, seniority)
6. **Company Culture Indicators** (values, work style mentioned)

Job Description:
"${jobDescription}"

Provide a well-structured analysis:`;

    return this.generateContent(prompt, systemPrompt);
  }

  /**
   * Generate interview questions based on job description
   */
  async generateInterviewQuestions(jobDescription: string, questionCount: number = 10): Promise<string> {
    const systemPrompt = `You are an expert interview coach who understands what interviewers look for.
Generate realistic, relevant interview questions that hiring managers would actually ask based on the job description.
Include a mix of technical, behavioral, and situational questions.`;

    const prompt = `Based on this job description, generate ${questionCount} likely interview questions.

Categorize them as:
- **Behavioral Questions** (3-4 questions using STAR method)
- **Technical Questions** (3-4 questions about skills/tools mentioned)
- **Situational Questions** (2-3 questions about problem-solving)

Job Description:
"${jobDescription}"

Generate the questions:`;

    return this.generateContent(prompt, systemPrompt);
  }

  /**
   * Structure an answer using STAR method
   */
  async structureSTARAnswer(userStory: string): Promise<string> {
    const systemPrompt = `You are an expert interview coach specializing in the STAR method (Situation, Task, Action, Result).
Help candidates structure their stories into clear, impactful STAR format answers.
Make sure each component is distinct and the result shows measurable impact.`;

    const prompt = `Convert this story into a well-structured STAR format answer:

Story: "${userStory}"

Format as:
**Situation:** [Set the context]
**Task:** [Explain your responsibility]
**Action:** [Describe what you did]
**Result:** [Quantify the impact]

Provide the structured answer:`;

    return this.generateContent(prompt, systemPrompt);
  }

  /**
   * Reframe a weakness as a growth opportunity
   */
  async reframeWeakness(weakness: string): Promise<string> {
    const systemPrompt = `You are an expert career coach helping candidates answer "What's your biggest weakness?"
Turn weaknesses into growth stories that show self-awareness and commitment to improvement.
Use the format: acknowledge → explain context → show improvement steps → demonstrate progress.`;

    const prompt = `Help me reframe this weakness for an interview:

Weakness: "${weakness}"

Provide a professional, honest answer that:
1. Acknowledges the weakness genuinely
2. Shows self-awareness
3. Explains specific steps taken to improve
4. Demonstrates progress or results

Your reframed answer:`;

    return this.generateContent(prompt, systemPrompt);
  }

  /**
   * Generate personalized "Why this company?" answer
   */
  async generateWhyThisCompanyAnswer(companyInfo: string, userBackground?: string): Promise<string> {
    const systemPrompt = `You are an expert interview coach helping candidates craft authentic, compelling "Why do you want to work here?" answers.
Create answers that connect the candidate's values and goals with the company's mission and culture.`;

    let prompt = `Based on this company information, help me craft a compelling answer to "Why do you want to work here?"\n\nCompany Information:\n"${companyInfo}"\n`;

    if (userBackground) {
      prompt += `\nMy Background:\n"${userBackground}"\n`;
    }

    prompt += `\nCreate a sincere, specific answer (2-3 sentences) that shows genuine interest and research.`;

    return this.generateContent(prompt, systemPrompt);
  }

  /**
   * Improve resume bullet point
   */
  async improveResumeBullet(bulletPoint: string): Promise<string> {
    const systemPrompt = `You are an expert resume writer and career coach.
Transform weak resume bullets into powerful, results-driven statements.
Use action verbs, quantify impact, and follow the formula: Action Verb + Task + Result/Impact.`;

    const prompt = `Improve this resume bullet point:

Original: "${bulletPoint}"

Make it:
- Start with a strong action verb
- Include specific metrics/numbers if possible
- Show clear impact/results
- Be concise (1-2 lines max)

Improved version:`;

    return this.generateContent(prompt, systemPrompt);
  }

  /**
   * Generate salary negotiation talking points
   */
  async generateSalaryNegotiationScript(targetSalary: string, justification: string): Promise<string> {
    const systemPrompt = `You are an expert salary negotiation coach.
Help candidates confidently discuss compensation while remaining professional and collaborative.
Focus on value, market data, and mutual benefit.`;

    const prompt = `Help me prepare for salary negotiation:

Target Salary: "${targetSalary}"
My Justification: "${justification}"

Provide:
1. Opening statement (how to bring up salary)
2. Key talking points (value I bring)
3. Response to pushback
4. Closing statement (collaborative tone)

Keep it professional and confident:`;

    return this.generateContent(prompt, systemPrompt);
  }

  /**
   * Draft follow-up email after interview
   */
  async draftFollowUpEmail(interviewDetails: {
    interviewerName?: string;
    position: string;
    companyName: string;
    keyDiscussionPoints?: string;
    nextSteps?: string;
  }): Promise<string> {
    const systemPrompt = `You are an expert at writing professional follow-up emails after job interviews.
Create warm, professional thank-you emails that reinforce interest and professionalism.`;

    const prompt = `Draft a follow-up thank-you email for my interview:

Position: ${interviewDetails.position}
Company: ${interviewDetails.companyName}
${interviewDetails.interviewerName ? `Interviewer: ${interviewDetails.interviewerName}` : ''}
${interviewDetails.keyDiscussionPoints ? `Key Discussion Points: ${interviewDetails.keyDiscussionPoints}` : ''}
${interviewDetails.nextSteps ? `Next Steps: ${interviewDetails.nextSteps}` : ''}

Write a professional, warm email (3-4 paragraphs):
- Thank them for their time
- Reference specific discussion points
- Reiterate interest and fit
- Express enthusiasm for next steps

Email draft:`;

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

/**
 * Summarizer API Client Configuration
 */
export interface SummarizerConfig {
  sharedContext?: string;
  type?: 'key-points' | 'tldr' | 'teaser' | 'headline';
  format?: 'markdown' | 'plain-text';
  length?: 'short' | 'medium' | 'long';
  onDownloadProgress?: (progress: number) => void;
}

export interface SummarizerContextOptions {
  context?: string;
}

/**
 * Summarizer API Client
 * Uses Chrome's built-in Summarizer API for specialized summarization
 */
export class SummarizerClient {
  private session: any = null;
  private config: SummarizerConfig;

  constructor(config: SummarizerConfig = {}) {
    this.config = {
      type: 'key-points',
      format: 'markdown',
      length: 'medium',
      ...config
    };
  }

  /**
   * Check if Summarizer API is available
   */
  async checkAvailability(): Promise<'readily' | 'after-download' | 'unavailable'> {
    if (typeof Summarizer === 'undefined') {
      throw new Error('Summarizer API is not supported in this browser. Please use Chrome 127+ with Summarizer API enabled.');
    }

    const availability = await Summarizer.availability();
    return availability;
  }

  /**
   * Initialize summarizer session
   */
  async initializeSession(options?: SummarizerConfig): Promise<void> {
    if (typeof Summarizer === 'undefined') {
      throw new Error('Summarizer API is not supported in this browser');
    }

    const availability = await this.checkAvailability();

    if (availability === 'unavailable') {
      throw new Error('Summarizer API is not available on this device. Please check chrome://flags/#summarization-api-for-gemini-nano');
    }

    // Merge options with existing config
    const sessionConfig = { ...this.config, ...options };

    // Create session with monitoring for downloads
    this.session = await Summarizer.create({
      sharedContext: sessionConfig.sharedContext,
      type: sessionConfig.type,
      format: sessionConfig.format,
      length: sessionConfig.length,
      monitor: (m: any) => {
        m.addEventListener('downloadprogress', (e: any) => {
          const progress = e.loaded * 100;
          console.log(`Summarizer downloading: ${progress.toFixed(1)}%`);
          if (this.config.onDownloadProgress) {
            this.config.onDownloadProgress(progress);
          }
        });
      }
    });

    console.log('Summarizer API session initialized', {
      type: sessionConfig.type,
      format: sessionConfig.format,
      length: sessionConfig.length
    });
  }

  /**
   * Ensure session is initialized
   */
  private async ensureSession(options?: SummarizerConfig): Promise<void> {
    // If options changed, reinitialize
    if (options && this.session) {
      const needsReinit =
        options.type !== this.config.type ||
        options.format !== this.config.format ||
        options.length !== this.config.length ||
        options.sharedContext !== this.config.sharedContext;

      if (needsReinit) {
        await this.destroySession();
        this.config = { ...this.config, ...options };
      }
    }

    if (!this.session) {
      await this.initializeSession(options);
    }
  }

  /**
   * Batch summarization - processes input as a whole
   */
  async summarize(text: string, options?: SummarizerContextOptions & SummarizerConfig): Promise<string> {
    const { context, ...sessionOptions } = options || {};
    await this.ensureSession(sessionOptions);

    const result = await this.session.summarize(text, context ? { context } : undefined);
    return result;
  }

  /**
   * Streaming summarization - real-time results
   */
  async *summarizeStreaming(text: string, options?: SummarizerContextOptions & SummarizerConfig): AsyncGenerator<string> {
    const { context, ...sessionOptions } = options || {};
    await this.ensureSession(sessionOptions);

    const stream = this.session.summarizeStreaming(text, context ? { context } : undefined);

    for await (const chunk of stream) {
      yield chunk;
    }
  }

  /**
   * Quick summarization presets
   */
  async summarizeKeyPoints(text: string, length: 'short' | 'medium' | 'long' = 'medium', context?: string): Promise<string> {
    return this.summarize(text, {
      type: 'key-points',
      format: 'markdown',
      length,
      context
    });
  }

  async summarizeTLDR(text: string, length: 'short' | 'medium' | 'long' = 'short', context?: string): Promise<string> {
    return this.summarize(text, {
      type: 'tldr',
      format: 'plain-text',
      length,
      context
    });
  }

  async summarizeTeaser(text: string, length: 'short' | 'medium' | 'long' = 'short', context?: string): Promise<string> {
    return this.summarize(text, {
      type: 'teaser',
      format: 'plain-text',
      length,
      context
    });
  }

  async summarizeHeadline(text: string, length: 'short' | 'medium' | 'long' = 'short', context?: string): Promise<string> {
    return this.summarize(text, {
      type: 'headline',
      format: 'plain-text',
      length,
      context
    });
  }

  /**
   * Destroy session and free resources
   */
  async destroySession(): Promise<void> {
    if (this.session) {
      this.session.destroy();
      this.session = null;
    }
  }
}

/**
 * Create a Summarizer client instance
 */
export async function createSummarizerClient(config?: SummarizerConfig): Promise<SummarizerClient> {
  const client = new SummarizerClient(config);
  await client.initializeSession();
  return client;
}

/**
 * Check if Summarizer API is supported in the browser
 */
export function isSummarizerAPISupported(): boolean {
  return typeof Summarizer !== 'undefined';
}

/**
 * Get Summarizer API availability status with user-friendly message
 */
export async function getSummarizerAvailabilityStatus(): Promise<{
  status: 'readily' | 'after-download' | 'unavailable';
  message: string;
}> {
  if (!isSummarizerAPISupported()) {
    return {
      status: 'unavailable',
      message: 'Summarizer API not supported. Please use Chrome 127+ and enable Summarizer at chrome://flags/#summarization-api-for-gemini-nano'
    };
  }

  const availability = await Summarizer.availability();

  const messages = {
    readily: 'Summarizer API is ready!',
    'after-download': 'Summarizer is downloading... This may take a few minutes.',
    unavailable: 'Summarizer is not available on this device. Please check chrome://flags/#summarization-api-for-gemini-nano'
  };

  return {
    status: availability,
    message: messages[availability] || 'Unknown status'
  };
}
