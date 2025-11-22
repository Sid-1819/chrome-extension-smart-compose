import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LoadingOverlay, LoadingSpinner } from "@/components/shared/LoadingSpinner";
import Markdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { LoadingState } from "@/types";

interface ResumeUploadProps {
  resumeText: string;
  resumeFilename: string | null;
  resumeLoading: LoadingState;
  coverLetterLoading: LoadingState;
  coverLetterResult: string;
  copySuccess: boolean;
  disabled: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTextChange: (value: string) => void;
  onClear: () => void;
  onCreateCoverLetter: () => void;
  onCopyCoverLetter: () => void;
}

export function ResumeUpload({
  resumeText,
  resumeFilename,
  resumeLoading,
  coverLetterLoading,
  coverLetterResult,
  copySuccess,
  disabled,
  onFileChange,
  onTextChange,
  onClear,
  onCreateCoverLetter,
  onCopyCoverLetter,
}: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const event = {
          target: { files },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onFileChange(event);
      }
    },
    [onFileChange]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const hasResume = typeof resumeText === 'string' && resumeText.trim().length > 0;

  return (
    <Card className="mt-6 relative overflow-hidden">
      {resumeLoading.isLoading && (
        <LoadingOverlay
          message={resumeLoading.message}
          subMessage={resumeLoading.subMessage}
        />
      )}

      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Resume
          </CardTitle>
          {hasResume && (
            <Badge variant="secondary" className="text-xs">
              {(resumeText?.length || 0).toLocaleString()} characters
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="upload" className="gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload File
            </TabsTrigger>
            <TabsTrigger value="paste" className="gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Paste Text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-0">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf,.docx,.png,.jpg,.jpeg,.gif,.webp,text/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
              onChange={onFileChange}
              className="hidden"
            />

            {/* Drag and drop zone */}
            <div
              onClick={handleClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                resumeFilename && "border-primary/50 bg-primary/5"
              )}
            >
              {resumeFilename ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{resumeFilename}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click or drop to replace
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={cn(
                    "w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors",
                    isDragging ? "bg-primary/20" : "bg-muted"
                  )}>
                    <svg
                      className={cn(
                        "w-8 h-8 transition-colors",
                        isDragging ? "text-primary" : "text-muted-foreground"
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {isDragging ? "Drop your resume here" : "Drop your resume here"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or <span className="text-primary font-medium">browse files</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Supported formats */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <Badge variant="outline" className="text-xs font-normal">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5" />
                TXT, MD
              </Badge>
              <Badge variant="outline" className="text-xs font-normal">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1.5" />
                Images (AI)
              </Badge>
              <Badge variant="outline" className="text-xs font-normal">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-1.5" />
                PDF, DOCX
              </Badge>
            </div>
          </TabsContent>

          <TabsContent value="paste" className="mt-0">
            <div className="space-y-3">
              <Textarea
                value={resumeText}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Paste your resume content here...

Include your:
• Contact information
• Work experience
• Education
• Skills
• Projects & achievements"
                className="min-h-[200px] resize-none text-sm leading-relaxed"
              />
              <p className="text-xs text-muted-foreground text-right">
                {resumeText?.length || 0} characters
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Resume Preview (when loaded) */}
        {hasResume && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </span>
              <Button variant="ghost" size="sm" onClick={onClear} className="h-7 text-xs">
                Clear
              </Button>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {resumeText?.substring(0, 300)}
              {(resumeText?.length || 0) > 300 && "..."}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onCreateCoverLetter}
            disabled={coverLetterLoading.isLoading || disabled || !hasResume}
            className="flex-1 gap-2"
            size="lg"
          >
            {coverLetterLoading.isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {coverLetterLoading.message}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Generate Cover Letter
              </>
            )}
          </Button>
        </div>

        {/* Loading indicator */}
        {coverLetterLoading.isLoading && (
          <div className="pt-2">
            <LoadingSpinner message={coverLetterLoading.message} size="md" />
            {coverLetterLoading.subMessage && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                {coverLetterLoading.subMessage}
              </p>
            )}
          </div>
        )}

        {/* Cover Letter Result */}
        {coverLetterResult && (
          <CoverLetterResult
            result={coverLetterResult}
            onCopy={onCopyCoverLetter}
            copySuccess={copySuccess}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface CoverLetterResultProps {
  result: string;
  onCopy: () => void;
  copySuccess: boolean;
}

function CoverLetterResult({ result, onCopy, copySuccess }: CoverLetterResultProps) {
  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Generated Cover Letter
          </h4>
          <Button
            onClick={onCopy}
            variant={copySuccess ? "secondary" : "default"}
            size="sm"
            className="gap-2"
          >
            {copySuccess ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </Button>
        </div>
        <div className="prose prose-sm max-w-none text-muted-foreground bg-background rounded-lg p-4">
          <Markdown>{result}</Markdown>
        </div>
      </CardContent>
    </Card>
  );
}
