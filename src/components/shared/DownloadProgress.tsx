import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

interface DownloadProgressProps {
  progress: number | null;
  status: "downloading" | "loading";
}

export function DownloadProgress({ progress, status }: DownloadProgressProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {status === "downloading"
                ? "Downloading Gemini Nano..."
                : "Loading model into memory..."}
            </span>
            {progress !== null && (
              <span className="text-sm text-muted-foreground">
                {progress.toFixed(0)}%
              </span>
            )}
          </div>

          {progress !== null ? (
            <Progress value={progress} className="h-2" />
          ) : (
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-primary rounded-full animate-pulse" />
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {status === "downloading"
              ? "This is a one-time download. The model will be cached locally."
              : "Preparing the AI model for use..."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
