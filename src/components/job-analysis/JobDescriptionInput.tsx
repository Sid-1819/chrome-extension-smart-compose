import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { LoadingState } from "@/types";

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  isLoading: LoadingState;
  disabled: boolean;
}

export function JobDescriptionInput({
  value,
  onChange,
  onAnalyze,
  isLoading,
  disabled,
}: JobDescriptionInputProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Job Description:
        </label>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste the full job description here..."
          className="min-h-48 resize-none"
          disabled={disabled}
        />
        <p className="text-sm text-muted-foreground mt-1">
          {value?.length || 0} characters
        </p>
      </div>

      <Button
        onClick={onAnalyze}
        disabled={isLoading.isLoading || disabled}
        className="w-full"
        size="lg"
      >
        {isLoading.isLoading ? isLoading.message : "Analyze Job Description"}
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
    </div>
  );
}
