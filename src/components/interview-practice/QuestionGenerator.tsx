import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { LoadingState } from "@/types";

interface QuestionGeneratorProps {
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  onGenerate: () => void;
  isLoading: LoadingState;
  disabled: boolean;
}

export function QuestionGenerator({
  jobDescription,
  onJobDescriptionChange,
  onGenerate,
  isLoading,
  disabled,
}: QuestionGeneratorProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Generate Interview Questions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Job Description:
          </label>
          <Textarea
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            placeholder="Paste the job description here to generate relevant interview questions..."
            className="min-h-32 resize-none"
            disabled={disabled}
          />
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            {jobDescription?.length || 0} characters
          </p>
        </div>

        <Button
          onClick={onGenerate}
          disabled={isLoading.isLoading || disabled}
          className="w-full"
          size="lg"
        >
          {isLoading.isLoading ? isLoading.message : "Generate Interview Questions"}
        </Button>

        {isLoading.isLoading && (
          <div>
            <LoadingSpinner message={isLoading.message} size="md" />
            {isLoading.subMessage && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                {isLoading.subMessage}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
