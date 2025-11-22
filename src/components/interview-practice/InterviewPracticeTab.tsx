import { QuestionGenerator } from "./QuestionGenerator";
import { QuestionsDisplay } from "./QuestionsDisplay";
import { QuestionsList } from "./QuestionsList";
import { CustomQuestionInput } from "./CustomQuestionInput";
import { MockInterview } from "./MockInterview";
import type { LoadingState } from "@/types";

interface InterviewPracticeTabProps {
  jobDescription: string;
  interviewQuestions: string;
  questionsList: string[];
  currentQuestionIndex: number;
  customQuestion: string;
  mockQuestion: string;
  mockAnswer: string;
  mockFeedback: string;
  questionsLoading: LoadingState;
  mockLoading: LoadingState;
  audioLoading: LoadingState;
  isRecording: boolean;
  disabled: boolean;
  onJobDescriptionChange: (value: string) => void;
  onGenerateQuestions: () => void;
  onSelectQuestion: (index: number) => void;
  onCustomQuestionChange: (value: string) => void;
  onAddCustomQuestion: () => void;
  onMockQuestionChange: (value: string) => void;
  onMockAnswerChange: (value: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearAnswer: () => void;
  onEvaluate: () => void;
  onPreviousQuestion: () => void;
  onNextQuestion: () => void;
}

export function InterviewPracticeTab({
  jobDescription,
  interviewQuestions,
  questionsList,
  currentQuestionIndex,
  customQuestion,
  mockQuestion,
  mockAnswer,
  mockFeedback,
  questionsLoading,
  mockLoading,
  audioLoading,
  isRecording,
  disabled,
  onJobDescriptionChange,
  onGenerateQuestions,
  onSelectQuestion,
  onCustomQuestionChange,
  onAddCustomQuestion,
  onMockQuestionChange,
  onMockAnswerChange,
  onStartRecording,
  onStopRecording,
  onClearAnswer,
  onEvaluate,
  onPreviousQuestion,
  onNextQuestion,
}: InterviewPracticeTabProps) {
  return (
    <div>
      <p className="text-muted-foreground mb-6">
        Generate interview questions from a job description, then practice
        answering them with AI-powered feedback.
      </p>

      <QuestionGenerator
        jobDescription={jobDescription}
        onJobDescriptionChange={onJobDescriptionChange}
        onGenerate={onGenerateQuestions}
        isLoading={questionsLoading}
        disabled={disabled}
      />

      <QuestionsDisplay questions={interviewQuestions} />

      <QuestionsList
        questions={questionsList}
        currentIndex={currentQuestionIndex}
        onSelect={onSelectQuestion}
      />

      <CustomQuestionInput
        value={customQuestion}
        onChange={onCustomQuestionChange}
        onAdd={onAddCustomQuestion}
      />

      <MockInterview
        mockQuestion={mockQuestion}
        mockAnswer={mockAnswer}
        mockFeedback={mockFeedback}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questionsList.length}
        isRecording={isRecording}
        mockLoading={mockLoading}
        audioLoading={audioLoading}
        disabled={disabled}
        onQuestionChange={onMockQuestionChange}
        onAnswerChange={onMockAnswerChange}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
        onClearAnswer={onClearAnswer}
        onEvaluate={onEvaluate}
        onPrevious={onPreviousQuestion}
        onNext={onNextQuestion}
      />
    </div>
  );
}
