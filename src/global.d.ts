interface AILanguageModelMonitor {
  addEventListener(
    type: "downloadprogress",
    listener: (event: { loaded: number; total: number }) => void
  ): void;
}

interface AILanguageModelCreateOptions {
  language?: string;
  monitor?: (monitor: AILanguageModelMonitor) => void;
}

interface AILanguageModelSession {
  prompt(input: string): Promise<string>;
  destroy(): void;
}

interface AILanguageModel {
  availability(): Promise<"readily" | "after-download" | "unavailable">;
  create(options?: AILanguageModelCreateOptions): Promise<AILanguageModelSession>;
}

interface AISummarizerMonitor {
  addEventListener(
    type: "downloadprogress",
    listener: (event: { loaded: number; total: number }) => void
  ): void;
}

interface AISummarizerCreateOptions {
  sharedContext?: string;
  type?: "key-points" | "tldr" | "teaser"| "headline";
  format?: "markdown" | "plain-text";
  length?: "short" | "medium" | "long";
  monitor?: (monitor: AISummarizerMonitor) => void;
}

interface AISummarizerContext {
  context?: string;
}

interface AISummarizerSession {
  summarize(input: string, options?: AISummarizerContext): Promise<string>;
  summarizeStreaming(input: string, options?: AISummarizerContext): AsyncIterable<string>;
  destroy(): void;
}

interface AISummarizer {
  availability(): Promise<"readily" | "after-download" | "unavailable">;
  create(options?: AISummarizerCreateOptions): Promise<AISummarizerSession>;
}

declare const LanguageModel: AILanguageModel;
declare const Summarizer: AISummarizer;
