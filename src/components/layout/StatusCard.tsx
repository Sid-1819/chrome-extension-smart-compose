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
          <div className="mt-4 text-sm text-muted-foreground">
            <p className="font-semibold mb-2 text-foreground">Setup Required:</p>

            {/* Prompt API Setup */}
            <div className="mb-3">
              <p className="font-medium text-foreground mb-1">
                For Prompt API (Interview Features):
              </p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>
                  Open{" "}
                  <code className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs">
                    chrome://flags/#optimization-guide-on-device-model
                  </code>
                </li>
                <li>
                  Set to <strong>"Enabled BypassPerfRequirement"</strong>
                </li>
                <li>
                  Open{" "}
                  <code className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs">
                    chrome://flags/#prompt-api-for-gemini-nano
                  </code>
                </li>
                <li>
                  Set to <strong>"Enabled"</strong>
                </li>
              </ol>
            </div>

            <p className="mt-2 font-semibold text-foreground">Finally:</p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Restart Chrome</li>
              <li>
                The AI model will download automatically (may take a few minutes)
              </li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
