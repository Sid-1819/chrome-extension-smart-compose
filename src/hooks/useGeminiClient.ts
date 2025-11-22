import { useState, useEffect, useCallback } from "react";
import { GeminiClient } from "@/utils/geminiClient";
import type { AvailabilityStatus } from "@/types";

interface UseGeminiClientOptions {
  autoInitialize?: boolean;
}

export function useGeminiClient(options: UseGeminiClientOptions = {}) {
  const { autoInitialize = true } = options;

  const [geminiClient, setGeminiClient] = useState<GeminiClient | null>(null);
  const [availability, setAvailability] = useState<AvailabilityStatus>("");
  const [status, setStatus] = useState("Checking API availability...");
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);

  const checkAvailability = useCallback(async () => {
    try {
      if (!("LanguageModel" in window)) {
        setStatus("Prompt API not supported. Please use Chrome 127+ and enable flags.");
        setAvailability("unavailable");
        return;
      }

      const availabilityStatus = await (window as any).LanguageModel.availability();
      setAvailability(availabilityStatus);

      if (availabilityStatus === "available") {
        setStatus("Gemini Nano is ready!");
      } else if (availabilityStatus === "downloading") {
        setStatus("Gemini Nano is downloading...");
        setDownloadProgress(0);
      } else {
        setStatus("Gemini Nano not available. Check setup instructions below.");
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      setStatus("Error checking API. Make sure flags are enabled.");
      setAvailability("unavailable");
    }
  }, []);

  const initializeClient = useCallback(async () => {
    try {
      console.log("Initializing Gemini client with multimodal support...");
      const client = new GeminiClient({
        expectedInputs: [
          { type: "text", languages: ["en"] },
          { type: "audio", languages: ["en"] },
          { type: "image", languages: ["en"] },
        ],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
        onDownloadProgress: (progress) => {
          setDownloadProgress(progress);
          setStatus(`Downloading Gemini Nano: ${progress.toFixed(0)}%`);
        },
        onModelLoading: () => {
          setIsModelLoading(true);
          setDownloadProgress(null);
          setStatus("Loading model into memory...");
        },
      });
      await client.initializeSession(undefined, { enableAudioInput: true });
      setGeminiClient(client);
      setDownloadProgress(null);
      setIsModelLoading(false);
      setStatus("Gemini Nano is ready!");
      console.log("Gemini client initialized with text, audio, and image input support");
    } catch (error) {
      console.error("Failed to initialize client at startup:", error);
      setDownloadProgress(null);
      setIsModelLoading(false);
    }
  }, []);

  // Check availability on mount
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Initialize client when API becomes available or is downloading
  useEffect(() => {
    if (autoInitialize && (availability === "available" || availability === "downloading") && !geminiClient) {
      initializeClient();
    }
  }, [availability, autoInitialize, geminiClient, initializeClient]);

  return {
    geminiClient,
    setGeminiClient,
    availability,
    status,
    setStatus,
    downloadProgress,
    isModelLoading,
    checkAvailability,
    initializeClient,
  };
}
