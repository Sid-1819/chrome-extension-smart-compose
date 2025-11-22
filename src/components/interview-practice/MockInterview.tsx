import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CurrentQuestion } from "./CurrentQuestion";
import { FeedbackResult } from "./FeedbackResult";
import type { LoadingState } from "@/types";

interface MockInterviewProps {
  mockQuestion: string;
  mockAnswer: string;
  mockFeedback: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  isRecording: boolean;
  mockLoading: LoadingState;
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

export function MockInterview({
  mockQuestion,
  mockAnswer,
  mockFeedback,
  currentQuestionIndex,
  totalQuestions,
  isRecording,
  mockLoading,
  audioLoading,
  disabled,
  onQuestionChange,
  onAnswerChange,
  onStartRecording,
  onStopRecording,
  onClearAnswer,
  onEvaluate,
  onPrevious,
  onNext,
}: MockInterviewProps) {
  return (
    <div className="space-y-4">
      <div className="my-8 border-t-2 border-border" />

      <h3 className="font-semibold text-foreground text-xl">
        Mock Interview Practice
      </h3>
      <p className="text-muted-foreground">
        Practice answering interview questions and get AI-powered feedback.
        Answer using voice or text.
      </p>

      {/* Microphone Permission Info */}
      <Alert>
        <AlertDescription>
          <strong>Voice Input:</strong> Using Gemini Nano's built-in audio
          transcription. Click "Start Voice Recording" to begin. You'll be
          prompted for microphone permission on first use.
        </AlertDescription>
      </Alert>

      {/* Current Question Display */}
      <CurrentQuestion
        question={mockQuestion}
        currentIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        onPrevious={onPrevious}
        onNext={onNext}
      />

      {/* Fallback: Manual Question Input */}
      {currentQuestionIndex < 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Or Enter Question Manually:
          </label>
          <Textarea
            value={mockQuestion}
            onChange={(e) => onQuestionChange(e.target.value)}
            placeholder="Enter the interview question you want to practice..."
            className="min-h-24 resize-none"
            disabled={disabled}
          />
        </div>
      )}

      {/* Answer Input */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Your Answer:
        </label>
        <Textarea
          value={mockAnswer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Type your answer or use voice input..."
          className="min-h-40 resize-none"
          disabled={disabled || isRecording}
        />
        <p className="text-sm text-muted-foreground mt-1">
          {mockAnswer.length} characters
        </p>
      </div>

      {/* Recording Status Banner */}
      {isRecording && (
        <Alert variant="destructive" className="border-2">
          <AlertDescription>
            <div className="flex items-center justify-center gap-3">
              <span className="flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive" />
              </span>
              <span className="font-semibold">
                Recording in progress... Speak clearly
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Audio Transcription Loading */}
      {audioLoading.isLoading && (
        <div>
          <LoadingSpinner message={audioLoading.message} size="md" />
          {audioLoading.subMessage && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              {audioLoading.subMessage}
            </p>
          )}
        </div>
      )}

      {/* Voice Recording Controls */}
      <div className="grid grid-cols-2 gap-3">
        {!isRecording ? (
          <Button onClick={onStartRecording} disabled={disabled} className="gap-2">
            <span className="inline-block w-3 h-3 bg-destructive rounded-full" />
            Start Voice Recording
          </Button>
        ) : (
          <Button
            onClick={onStopRecording}
            variant="destructive"
            className="gap-2"
          >
            <span className="inline-block w-3 h-3 bg-white rounded-full animate-pulse" />
            Stop Recording
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onClearAnswer}
          disabled={isRecording || !mockAnswer}
        >
          Clear Answer
        </Button>
      </div>

      {/* Evaluate Button */}
      <Button
        onClick={onEvaluate}
        disabled={
          mockLoading.isLoading ||
          disabled ||
          isRecording ||
          !mockQuestion?.trim() ||
          !mockAnswer?.trim()
        }
        className="w-full"
        size="lg"
      >
        {mockLoading.isLoading ? mockLoading.message : "Get AI Feedback & Rating"}
      </Button>

      {/* Loading Indicator */}
      {mockLoading.isLoading && (
        <div>
          <LoadingSpinner message={mockLoading.message} size="md" />
          {mockLoading.subMessage && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              {mockLoading.subMessage}
            </p>
          )}
        </div>
      )}

      {/* Feedback Result */}
      <FeedbackResult feedback={mockFeedback} />
    </div>
  );
}
