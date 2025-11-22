import { cn } from "@/lib/utils";
import type { AvailabilityStatus } from "@/types";

interface ModelStatusIndicatorProps {
  availability: AvailabilityStatus;
  downloadProgress: number | null;
  isModelLoading: boolean;
}

export function ModelStatusIndicator({
  availability,
  downloadProgress,
  isModelLoading,
}: ModelStatusIndicatorProps) {
  const getStatusConfig = () => {
    if (isModelLoading) {
      return {
        color: "bg-blue-500",
        pulseColor: "bg-blue-400",
        text: "Loading model...",
        showPulse: true,
      };
    }

    if (availability === "downloading" || downloadProgress !== null) {
      return {
        color: "bg-amber-500",
        pulseColor: "bg-amber-400",
        text: downloadProgress !== null
          ? `Downloading ${downloadProgress.toFixed(0)}%`
          : "Downloading...",
        showPulse: true,
      };
    }

    if (availability === "available") {
      return {
        color: "bg-emerald-500",
        pulseColor: "bg-emerald-400",
        text: "Gemini Nano Ready",
        showPulse: false,
      };
    }

    return {
      color: "bg-red-500",
      pulseColor: "bg-red-400",
      text: "Model Unavailable",
      showPulse: false,
    };
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center justify-center mb-4">
      <div
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
          availability === "available"
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : availability === "downloading" || downloadProgress !== null || isModelLoading
            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
            : "bg-red-500/10 text-red-700 dark:text-red-400"
        )}
      >
        {/* Status dot with optional pulse animation */}
        <span className="relative flex h-2 w-2">
          {config.showPulse && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                config.pulseColor
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              config.color
            )}
          />
        </span>

        {/* Status text */}
        <span>{config.text}</span>

        {/* Progress bar for downloading */}
        {(availability === "downloading" || downloadProgress !== null) && !isModelLoading && (
          <div className="w-16 h-1.5 bg-amber-200 dark:bg-amber-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress || 0}%` }}
            />
          </div>
        )}

        {/* AI chip icon */}
        <svg
          className={cn(
            "w-3.5 h-3.5",
            availability === "available"
              ? "text-emerald-600 dark:text-emerald-400"
              : availability === "downloading" || downloadProgress !== null || isModelLoading
              ? "text-amber-600 dark:text-amber-400"
              : "text-red-600 dark:text-red-400"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
          />
        </svg>
      </div>
    </div>
  );
}
