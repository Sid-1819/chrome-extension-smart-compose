import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AvailabilityStatus } from "@/types";

interface StatusCardProps {
  status: string;
  availability: AvailabilityStatus;
  onRefresh: () => void;
}

export function StatusCard({ status, availability, onRefresh }: StatusCardProps) {

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
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
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
