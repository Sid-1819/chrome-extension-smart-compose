import { JobDescriptionInput } from "./JobDescriptionInput";
import { AnalysisResult } from "./AnalysisResult";
import { ResumeUpload } from "./ResumeUpload";
import type { LoadingState } from "@/types";

interface JobAnalysisTabProps {
  jobDescription: string;
  jdAnalysisResult: string;
  resumeText: string;
  resumeFilename: string | null;
  coverLetterResult: string;
  copySuccess: boolean;
  jdAnalysisLoading: LoadingState;
  resumeLoading: LoadingState;
  coverLetterLoading: LoadingState;
  disabled: boolean;
  onJobDescriptionChange: (value: string) => void;
  onAnalyze: () => void;
  onResumeFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResumeTextChange: (value: string) => void;
  onClearResume: () => void;
  onCreateCoverLetter: () => void;
  onCopyCoverLetter: () => void;
}

export function JobAnalysisTab({
  jobDescription,
  jdAnalysisResult,
  resumeText,
  resumeFilename,
  coverLetterResult,
  copySuccess,
  jdAnalysisLoading,
  resumeLoading,
  coverLetterLoading,
  disabled,
  onJobDescriptionChange,
  onAnalyze,
  onResumeFileChange,
  onResumeTextChange,
  onClearResume,
  onCreateCoverLetter,
  onCopyCoverLetter,
}: JobAnalysisTabProps) {
  return (
    <div>
      <p className="text-muted-foreground mb-4">
        Paste a job description to get AI-powered analysis and create a tailored
        cover letter.
      </p>

      <JobDescriptionInput
        value={jobDescription}
        onChange={onJobDescriptionChange}
        onAnalyze={onAnalyze}
        isLoading={jdAnalysisLoading}
        disabled={disabled}
      />

      <AnalysisResult result={jdAnalysisResult} />

      <ResumeUpload
        resumeText={resumeText}
        resumeFilename={resumeFilename}
        resumeLoading={resumeLoading}
        coverLetterLoading={coverLetterLoading}
        coverLetterResult={coverLetterResult}
        copySuccess={copySuccess}
        disabled={disabled || !(typeof jobDescription === 'string' && jobDescription.trim())}
        onFileChange={onResumeFileChange}
        onTextChange={onResumeTextChange}
        onClear={onClearResume}
        onCreateCoverLetter={onCreateCoverLetter}
        onCopyCoverLetter={onCopyCoverLetter}
      />
    </div>
  );
}
