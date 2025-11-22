import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { AvailabilityStatus } from "@/types";

interface StatusCardProps {
  status: string;
  availability: AvailabilityStatus;
  onRefresh: () => void;
  onClearAllData?: () => void;
}

export function StatusCard({ status, availability, onRefresh, onClearAllData }: StatusCardProps) {

  return (
    <Card
      className={`mb-6 border-l-4 ${
        availability === "available"
          ? "border-l-primary"
          : availability === "downloading"
          ? "border-l-muted-foreground"
          : "border-l-destructive"
      }`}
    >
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="font-medium text-foreground">{status}</p>
          <div className="flex items-center gap-2">
            {onClearAllData && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive hover:border-destructive"
                    title="Clear all data"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" x2="10" y1="11" y2="17" />
                      <line x1="14" x2="14" y1="11" y2="17" />
                    </svg>
                    Clear
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your saved data including job
                      descriptions, analysis results, interview questions, resume
                      text, and cover letters. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onClearAllData}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Clear All Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Refresh
            </Button>
          </div>
        </div>

        {availability === "unavailable" && (
          <div className="mt-4">
            {/* Error Alert */}
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-destructive mt-0.5 flex-shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                <div>
                  <p className="font-semibold text-destructive mb-1">
                    Gemini Nano AI Model Not Available
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The on-device AI model couldn't be loaded. This is required for all features to work.
                  </p>
                </div>
              </div>
            </div>

            {/* Retry Button */}
            <Button
              onClick={onRefresh}
              className="w-full mb-4"
              variant="default"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
              Retry Loading AI Model
            </Button>

            {/* Setup Instructions */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform group-open:rotate-90"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
                First time? Setup instructions
              </summary>
              <div className="mt-3 pl-6 text-sm text-muted-foreground space-y-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-medium text-foreground mb-2">
                    Step 1: Enable Chrome Flags
                  </p>
                  <ol className="list-decimal ml-4 space-y-2">
                    <li>
                      Open{" "}
                      <code className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs">
                        chrome://flags/#optimization-guide-on-device-model
                      </code>
                      <br />
                      <span className="text-xs">Set to <strong>"Enabled BypassPerfRequirement"</strong></span>
                    </li>
                    <li>
                      Open{" "}
                      <code className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs">
                        chrome://flags/#prompt-api-for-gemini-nano
                      </code>
                      <br />
                      <span className="text-xs">Set to <strong>"Enabled"</strong></span>
                    </li>
                  </ol>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-medium text-foreground mb-2">
                    Step 2: Restart & Wait
                  </p>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Restart Chrome completely</li>
                    <li>Wait for the AI model to download (2-5 minutes)</li>
                    <li>Click "Retry Loading AI Model" above</li>
                  </ol>
                </div>

                <p className="text-xs text-muted-foreground/70">
                  Note: Gemini Nano requires Chrome 128+ and sufficient disk space (~1GB).
                </p>
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
