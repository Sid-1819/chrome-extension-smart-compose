import { useState, useCallback } from "react";
import { GeminiClient } from "@/utils/geminiClient";
import type { LoadingState } from "@/types";
import { LOADING_MESSAGES } from "@/constants/loadingMessages";
import { logger } from "@/utils/logger";

interface UseVoiceRecordingOptions {
  geminiClient: GeminiClient | null;
  setGeminiClient: (client: GeminiClient) => void;
  availability: string;
  onTranscription: (text: string) => void;
  setStatus: (status: string) => void;
}

export function useVoiceRecording({
  geminiClient,
  setGeminiClient,
  availability,
  onTranscription,
  setStatus,
}: UseVoiceRecordingOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioLoading, setAudioLoading] = useState<LoadingState>({
    isLoading: false,
    message: "",
  });

  const startRecording = useCallback(async () => {
    logger.log("Starting voice recording...");

    try {
      // Check if Gemini Nano is available
      if (availability !== "available") {
        logger.warn("Gemini Nano not available");
        alert("Gemini Nano is not available. Please ensure it is enabled and downloaded.");
        return;
      }

      // Check microphone permission state first
      const permissionStatus = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      if (permissionStatus.state === "prompt") {
        setStatus("Opening permission dialog...");

        const popupUrl = chrome.runtime.getURL("mic-permission.html");
        await chrome.windows.create({
          url: popupUrl,
          type: "popup",
          width: 400,
          height: 300,
          focused: true,
        });

        setStatus("Please grant microphone permission in the popup window, then try recording again.");
        return;
      } else if (permissionStatus.state === "denied") {
        logger.error("Microphone permission denied");
        setStatus("Microphone permission denied. Please click the microphone icon in the address bar to allow access.");
        alert("Microphone permission denied. Please allow microphone access in your browser settings:\n\n1. Click the microphone icon in the address bar\n2. Select \"Always allow\"\n3. Try recording again");
        return;
      }

      // Permission already granted - proceed with audio recording
      setStatus("Starting recording...");

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Check supported MIME types
      const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "audio/wav",
      ];
      const availableTypes = supportedTypes.filter((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      // Create MediaRecorder to capture audio
      const mimeType = availableTypes[0] || "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstart = () => {
        setIsRecording(true);
        setStatus("Recording... Speak your answer");
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        setAudioLoading({
          isLoading: true,
          message: LOADING_MESSAGES.TRANSCRIBING_AUDIO,
          subMessage: LOADING_MESSAGES.TRANSCRIBING_AUDIO_SUB,
        });
        setStatus(LOADING_MESSAGES.TRANSCRIBING_AUDIO);

        // Combine all chunks into a single Blob
        const audioBlob = new Blob(chunks, { type: mimeType });

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        try {
          // Use Gemini client to transcribe audio
          let client = geminiClient;
          if (!client) {
            client = new GeminiClient({
              expectedInputs: [
                { type: "text", languages: ["en"] },
                { type: "audio", languages: ["en"] },
              ],
              expectedOutputs: [{ type: "text", languages: ["en"] }],
            });
            await client.initializeSession(undefined, { enableAudioInput: true });
            setGeminiClient(client);
          }

          const transcription = await client.transcribeAudio(audioBlob);
          onTranscription(transcription);
          setStatus("Audio transcribed successfully!");
          setAudioLoading({ isLoading: false, message: "" });
        } catch (error: any) {
          logger.error("Transcription error:", error);
          setStatus("Failed to transcribe audio. Please try again.");
          setAudioLoading({ isLoading: false, message: "" });
          alert(`Transcription failed: ${error.message}\n\nPlease try again or type your answer instead.`);
        }
      };

      recorder.onerror = (event: any) => {
        logger.error("MediaRecorder error:", event.error);
        setIsRecording(false);
        setStatus("Recording error occurred");
        alert(`Recording error: ${event.error}`);
        stream.getTracks().forEach((track) => track.stop());
      };

      // Store the recorder
      setMediaRecorder(recorder);

      // Start recording
      recorder.start();
    } catch (error: any) {
      logger.error("Error starting voice recording:", error);
      setIsRecording(false);

      let errorMessage = `Error: ${error.message}`;
      if (error.name === "NotAllowedError") {
        errorMessage = "Microphone permission denied. Please allow microphone access in your browser settings.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "No microphone found. Please connect a microphone and try again.";
      }

      setStatus(errorMessage);
      alert(errorMessage);
    }
  }, [availability, geminiClient, setGeminiClient, onTranscription, setStatus]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setStatus("Processing recording...");
    }
  }, [mediaRecorder, setStatus]);

  return {
    isRecording,
    audioLoading,
    startRecording,
    stopRecording,
  };
}
