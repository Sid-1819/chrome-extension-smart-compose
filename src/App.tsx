import { useState, useEffect } from "react";
import "./App.css";

// Hooks
import { useGeminiClient, useChromeStorage, useVoiceRecording } from "@/hooks";
import { logger } from "@/utils/logger";

// Components
import { Header, Footer, StatusCard, ModelStatusIndicator } from "@/components/layout";
import { DownloadProgress } from "@/components/shared";
import { JobAnalysisTab } from "@/components/job-analysis";
import { InterviewPracticeTab } from "@/components/interview-practice";

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types & Constants
import type { TabId, LoadingState } from "@/types";
import { LOADING_MESSAGES } from "@/constants/loadingMessages";
import { GeminiClient } from "@/utils/geminiClient";

function App() {
  // Gemini client hook
  const {
    geminiClient,
    setGeminiClient,
    availability,
    status,
    setStatus,
    downloadProgress,
    isModelLoading,
    checkAvailability,
  } = useGeminiClient();

  // Chrome storage hook
  const { persistState, restoreState, checkContextMenuAction, clearContextMenuAction, clearBadge, clearAllState } =
    useChromeStorage();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>("jd-coverletter");

  // Job Analysis states
  const [jobDescription, setJobDescription] = useState("");
  const [jdAnalysisResult, setJdAnalysisResult] = useState("");
  const [jdAnalysisLoading, setJdAnalysisLoading] = useState<LoadingState>({
    isLoading: false,
    message: "",
  });

  // Resume & Cover Letter states
  const [resumeText, setResumeText] = useState("");
  const [resumeFilename, setResumeFilename] = useState<string | null>(null);
  const [coverLetterResult, setCoverLetterResult] = useState("");
  const [coverLetterLoading, setCoverLetterLoading] = useState<LoadingState>({
    isLoading: false,
    message: "",
  });
  const [resumeLoading, setResumeLoading] = useState<LoadingState>({
    isLoading: false,
    message: "",
  });
  const [copySuccess, setCopySuccess] = useState(false);

  // Interview Questions states
  const [interviewQuestions, setInterviewQuestions] = useState("");
  const [questionsLoading, setQuestionsLoading] = useState<LoadingState>({
    isLoading: false,
    message: "",
  });
  const [questionsList, setQuestionsList] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [customQuestion, setCustomQuestion] = useState("");

  // Mock Interview states
  const [mockQuestion, setMockQuestion] = useState("");
  const [mockAnswer, setMockAnswer] = useState("");
  const [mockFeedback, setMockFeedback] = useState("");
  const [mockLoading, setMockLoading] = useState<LoadingState>({
    isLoading: false,
    message: "",
  });

  // Voice recording hook
  const { isRecording, audioLoading, startRecording, stopRecording } = useVoiceRecording({
    geminiClient,
    setGeminiClient,
    availability,
    onTranscription: (text) => setMockAnswer((prev) => (prev ? `${prev} ${text}` : text)),
    setStatus,
  });

  // Check if running in sidebar
  const isInSidebar = window.self !== window.top;

  // === Effects ===

  // Restore persisted state and check context menu action on mount
  useEffect(() => {
    const init = async () => {
      const state = await restoreState();
      if (state) {
        // Ensure all restored values are strings
        if (state.jobDescription && typeof state.jobDescription === 'string')
          setJobDescription(state.jobDescription);
        if (state.jdAnalysisResult && typeof state.jdAnalysisResult === 'string')
          setJdAnalysisResult(state.jdAnalysisResult);
        if (state.interviewQuestions && typeof state.interviewQuestions === 'string')
          setInterviewQuestions(state.interviewQuestions);
        if (state.resumeText && typeof state.resumeText === 'string')
          setResumeText(state.resumeText);
        if (state.resumeFilename && typeof state.resumeFilename === 'string')
          setResumeFilename(state.resumeFilename);
        if (state.coverLetterResult && typeof state.coverLetterResult === 'string')
          setCoverLetterResult(state.coverLetterResult);
        if (state.activeTab) setActiveTab(state.activeTab);
      }

      const contextAction = await checkContextMenuAction();
      if (contextAction) {
        if (contextAction.contextMenuAction === "analyze-job-description") {
          setJobDescription(contextAction.selectedText!);
          setActiveTab("jd-coverletter");
          handleAnalyzeJobDescription(contextAction.selectedText!);
        } else if (contextAction.contextMenuAction === "generate-questions") {
          setJobDescription(contextAction.selectedText!);
          setActiveTab("interview-practice");
          handleGenerateQuestions(contextAction.selectedText!);
        }
        await clearContextMenuAction();
        await clearBadge();
      }
    };
    init();
  }, []);

  // Listen for storage changes (context menu actions)
  useEffect(() => {
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === "local" && changes.contextMenuAction) {
        const init = async () => {
          const contextAction = await checkContextMenuAction();
          if (contextAction) {
            if (contextAction.contextMenuAction === "analyze-job-description") {
              setJobDescription(contextAction.selectedText!);
              setActiveTab("jd-coverletter");
              handleAnalyzeJobDescription(contextAction.selectedText!);
            } else if (contextAction.contextMenuAction === "generate-questions") {
              setJobDescription(contextAction.selectedText!);
              setActiveTab("interview-practice");
              handleGenerateQuestions(contextAction.selectedText!);
            }
            await clearContextMenuAction();
            await clearBadge();
          }
        };
        init();
      }
    };

    try {
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    } catch (error) {
      logger.debug("Not running in extension context:", error);
    }
  }, []);

  // Persist state changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      persistState({
        jobDescription,
        jdAnalysisResult,
        interviewQuestions,
        resumeText,
        resumeFilename,
        coverLetterResult,
        activeTab,
      });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [jobDescription, jdAnalysisResult, interviewQuestions, resumeText, resumeFilename, coverLetterResult, activeTab]);

  // Parse questions when generated
  useEffect(() => {
    if (interviewQuestions) {
      setQuestionsList(parseQuestions(interviewQuestions));
    }
  }, [interviewQuestions]);


  // === Handlers ===

  const parseQuestions = (text: string): string[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    const questions: string[] = [];

    // Patterns to identify section headers (not actual questions)
    const headingPatterns = [
      /^#+\s*/i,                                    // Markdown headers: # ## ###
      /^\*\*.*\*\*\s*$/,                            // Bold-only lines: **Something**
      /^(behavioral|technical|situational|problem-solving|coding|system design)/i,
      /\(STAR\s+(Method|Format)\)/i,               // (STAR Method) or (STAR Format)
      /questions?\s*:?\s*$/i,                       // Ends with "questions" or "questions:"
      /^questions?\s*$/i,                           // Just "questions"
      /^(section|part|category)\s*\d*/i,           // Section 1, Part 2, etc.
    ];

    for (const line of lines) {
      // Remove markdown formatting, numbering, and trim
      let cleaned = line
        .replace(/^\d+\.\s*/, "")      // Remove "1. ", "2. " etc.
        .replace(/^\*\*|\*\*$/g, "")   // Remove ** at start/end
        .replace(/^\*|\*$/g, "")       // Remove * at start/end
        .replace(/^#+\s*/, "")         // Remove # headers
        .trim();

      // Skip empty or very short lines
      if (cleaned.length <= 10) continue;

      // Skip lines that match heading patterns
      if (headingPatterns.some((p) => p.test(cleaned))) continue;

      // Skip lines that don't look like questions (no verb or question mark, and are short)
      // But keep longer lines that might be scenario descriptions
      const looksLikeHeading =
        cleaned.length < 50 &&
        !cleaned.includes("?") &&
        !/^(describe|tell|explain|how|what|why|when|where|provide|give|share|walk|imagine|a client|you need|you are)/i.test(cleaned);

      if (looksLikeHeading) continue;

      questions.push(cleaned);
    }
    return questions.length > 0 ? questions : [text];
  };

  const handleAnalyzeJobDescription = async (textOverride?: string) => {
    const text = textOverride || jobDescription;
    if (!text?.trim()) {
      alert("Please paste a job description first!");
      return;
    }

    setJdAnalysisLoading({
      isLoading: true,
      message: LOADING_MESSAGES.ANALYZING_JD,
      subMessage: LOADING_MESSAGES.ANALYZING_JD_SUB,
    });
    setJdAnalysisResult("");
    setStatus(LOADING_MESSAGES.ANALYZING_JD);

    try {
      let client = geminiClient;
      if (!client) {
        setStatus(LOADING_MESSAGES.INITIALIZING_CLIENT);
        client = new GeminiClient();
        await client.initializeSession();
        setGeminiClient(client);
      }

      const analysis = await client.analyzeJobDescription(text);
      setJdAnalysisResult(analysis);
      setStatus("Job description analyzed!");
    } catch (error) {
      setJdAnalysisResult(`Error: ${error}`);
      setStatus("Failed to analyze job description.");
    } finally {
      setJdAnalysisLoading({ isLoading: false, message: "" });
    }
  };

  const handleGenerateQuestions = async (textOverride?: string) => {
    const text = textOverride || jobDescription;
    if (!text?.trim()) {
      alert("Please paste a job description first!");
      return;
    }

    setQuestionsLoading({
      isLoading: true,
      message: LOADING_MESSAGES.GENERATING_QUESTIONS,
      subMessage: LOADING_MESSAGES.GENERATING_QUESTIONS_SUB,
    });
    setInterviewQuestions("");
    setStatus(LOADING_MESSAGES.GENERATING_QUESTIONS);

    try {
      let client = geminiClient;
      if (!client) {
        setStatus(LOADING_MESSAGES.INITIALIZING_CLIENT);
        client = new GeminiClient();
        await client.initializeSession();
        setGeminiClient(client);
      }

      const questions = await client.generateInterviewQuestions(text);
      setInterviewQuestions(questions);
      setStatus("Interview questions generated!");
    } catch (error) {
      setInterviewQuestions(`Error: ${error}`);
      setStatus("Failed to generate questions.");
    } finally {
      setQuestionsLoading({ isLoading: false, message: "" });
    }
  };

  const handleResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFilename(file.name);

    const name = file.name.toLowerCase();

    if (file.type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = () => {
        setResumeText(String(reader.result || ""));
        setStatus(`Loaded resume: ${file.name}`);
      };
      reader.onerror = () => setStatus("Failed to read file.");
      reader.readAsText(file);
    } else if (
      file.type.startsWith("image/") ||
      [".png", ".jpg", ".jpeg", ".gif", ".webp"].some((ext) => name.endsWith(ext))
    ) {
      await handleResumeImageUpload(file);
    } else if (
      file.type === "application/pdf" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".pdf") ||
      name.endsWith(".docx")
    ) {
      await handleResumeAPIUpload(file);
    } else {
      setStatus("File type not supported.");
      setResumeText("");
    }
  };

  const handleResumeImageUpload = async (file: File) => {
    setResumeLoading({
      isLoading: true,
      message: LOADING_MESSAGES.EXTRACTING_IMAGE,
      subMessage: LOADING_MESSAGES.EXTRACTING_IMAGE_SUB,
    });
    setStatus(LOADING_MESSAGES.EXTRACTING_IMAGE);
    setResumeText("");

    if (availability === "available") {
      try {
        const imageBlob = new Blob([file], { type: file.type });
        let client = geminiClient;
        if (!client) {
          client = new GeminiClient({
            expectedInputs: [
              { type: "text", languages: ["en"] },
              { type: "image", languages: ["en"] },
              { type: "audio", languages: ["en"] },
            ],
            expectedOutputs: [{ type: "text", languages: ["en"] }],
          });
          await client.initializeSession(undefined, { enableAudioInput: true });
          setGeminiClient(client);
        }
        const extractedText = await client.extractTextFromImage(imageBlob);
        setResumeText(extractedText);
        setStatus(`Successfully extracted text from ${file.name}`);
        setResumeLoading({ isLoading: false, message: "" });
        return;
      } catch (error) {
        setStatus("On-device extraction failed, trying cloud API...");
      }
    }

    // Fallback to cloud API
    await handleResumeAPIUpload(file);
  };

  const handleResumeAPIUpload = async (file: File) => {
    setResumeLoading({
      isLoading: true,
      message: LOADING_MESSAGES.PROCESSING_RESUME_API,
      subMessage: LOADING_MESSAGES.PARSING_RESUME,
    });
    setStatus(LOADING_MESSAGES.PROCESSING_RESUME_API);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const apiUrl = import.meta.env.VITE_API_URL || "https://interview-coach-ai-nu.vercel.app/api/parse-resume";

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Server error" }));
        throw new Error(error.error || "Failed to parse resume");
      }

      const data = await response.json();
      if (data.success && data.text) {
        setResumeText(data.text);
        setStatus(`Successfully parsed ${file.name}`);
      } else {
        throw new Error("No text extracted from file");
      }
    } catch (error: any) {
      setStatus(`${error.message}. Please paste your resume text.`);
      setResumeText("");
    } finally {
      setResumeLoading({ isLoading: false, message: "" });
    }
  };

  const handleCreateCoverLetter = async () => {
    if (!jobDescription?.trim()) {
      alert("Please paste a job description first.");
      return;
    }
    if (!resumeText?.trim()) {
      alert("Please upload or paste your resume text first.");
      return;
    }

    setCoverLetterLoading({
      isLoading: true,
      message: LOADING_MESSAGES.CREATING_COVER_LETTER,
      subMessage: LOADING_MESSAGES.CREATING_COVER_LETTER_SUB,
    });
    setCoverLetterResult("");

    try {
      let client = geminiClient;
      if (!client) {
        client = new GeminiClient();
        await client.initializeSession();
        setGeminiClient(client);
      }

      let analysis = jdAnalysisResult;
      if (!analysis?.trim()) {
        setStatus("Analyzing job description first...");
        analysis = await client.analyzeJobDescription(jobDescription);
        setJdAnalysisResult(analysis);
      }

      setStatus("Generating cover letter...");
      const systemPrompt = `You are an expert cover-letter writer. Write a compelling, concise, and highly tailored cover letter for a job application. You MUST use and reference both the provided job description analysis and the applicant's resume. Structure the letter in 3 short paragraphs: (1) Introduction and intent, (2) Why the candidate is a great fit—reference specific skills/experiences from the resume that match the job requirements, (3) Closing with a call to action. Be specific, professional, and persuasive. Avoid generic statements. Address the letter to the hiring manager (no name needed). IMPORTANT: Keep the cover letter under 250 words. remove salutations and do not add company address .`;
      const userPrompt = `---\nJob Description Analysis:\n${analysis}\n\n---\nApplicant Resume:\n${resumeText}\n\n---\nWrite a cover letter for this candidate applying to the job described above. Reference both the job requirements and the candidate's relevant experience. Make the letter unique to this application.`;

      const generated = await client.generateContent(userPrompt, systemPrompt);
      setCoverLetterResult(generated);
      setStatus("Cover letter created!");
    } catch (error) {
      setStatus("Failed to create cover letter.");
      setCoverLetterResult(`Error: ${error}`);
    } finally {
      setCoverLetterLoading({ isLoading: false, message: "" });
    }
  };

  const handleCopyCoverLetter = async () => {
    try {
      await navigator.clipboard.writeText(coverLetterResult);
      setCopySuccess(true);
      setStatus("Cover letter copied to clipboard!");
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      setStatus("Failed to copy to clipboard");
    }
  };

  const handleClearAllData = async () => {
    // Clear all state
    setJobDescription("");
    setJdAnalysisResult("");
    setInterviewQuestions("");
    setResumeText("");
    setResumeFilename(null);
    setCoverLetterResult("");
    setQuestionsList([]);
    setCurrentQuestionIndex(-1);
    setCustomQuestion("");
    setMockQuestion("");
    setMockAnswer("");
    setMockFeedback("");

    // Clear from Chrome storage
    await clearAllState();
    setStatus("All data cleared!");
  };

  const handleSelectQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setMockQuestion(questionsList[index]);
    setMockAnswer("");
    setMockFeedback("");
    setStatus(`Selected question ${index + 1} of ${questionsList.length}`);
  };

  const handleAddCustomQuestion = () => {
    if (!customQuestion?.trim()) {
      alert("Please enter a question first!");
      return;
    }
    setQuestionsList((prev) => [...prev, customQuestion?.trim() || ""]);
    setCustomQuestion("");
    setStatus("Custom question added!");
  };

  const handleEvaluateMockAnswer = async () => {
    if (!mockQuestion?.trim()) {
      alert("Please enter an interview question first!");
      return;
    }
    if (!mockAnswer?.trim()) {
      alert("Please provide your answer (voice or text)!");
      return;
    }

    setMockLoading({
      isLoading: true,
      message: LOADING_MESSAGES.EVALUATING_ANSWER,
      subMessage: LOADING_MESSAGES.EVALUATING_ANSWER_SUB,
    });
    setMockFeedback("");
    setStatus(LOADING_MESSAGES.EVALUATING_ANSWER);

    try {
      let client = geminiClient;
      if (!client) {
        client = new GeminiClient();
        await client.initializeSession();
        setGeminiClient(client);
      }

      const evaluation = await client.evaluateMockInterviewAnswer(mockQuestion, mockAnswer);
      setMockFeedback(evaluation);
      setStatus("Evaluation complete!");
    } catch (error) {
      setStatus("Failed to evaluate answer.");
      setMockFeedback(`Error: ${error}`);
    } finally {
      setMockLoading({ isLoading: false, message: "" });
    }
  };

  return (
    <div className={`${isInSidebar ? "min-h-full" : "min-h-screen"} bg-background p-6`}>
      <div className={isInSidebar ? "max-w-full" : "max-w-4xl mx-auto"}>
        <Header />

        <ModelStatusIndicator
          availability={availability}
          downloadProgress={downloadProgress}
          isModelLoading={isModelLoading}
        />

        {(availability === "downloading" || downloadProgress !== null || isModelLoading) && (
          <DownloadProgress
            progress={downloadProgress}
            status={isModelLoading ? "loading" : "downloading"}
          />
        )}

        <StatusCard
          status={status}
          availability={availability}
          onRefresh={checkAvailability}
          onClearAllData={handleClearAllData}
        />

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="jd-coverletter">Job Analysis & Cover Letter</TabsTrigger>
                <TabsTrigger value="interview-practice">Interview Practice</TabsTrigger>
              </TabsList>

              <TabsContent value="jd-coverletter">
                <JobAnalysisTab
                  jobDescription={jobDescription}
                  jdAnalysisResult={jdAnalysisResult}
                  resumeText={resumeText}
                  resumeFilename={resumeFilename}
                  coverLetterResult={coverLetterResult}
                  copySuccess={copySuccess}
                  jdAnalysisLoading={jdAnalysisLoading}
                  resumeLoading={resumeLoading}
                  coverLetterLoading={coverLetterLoading}
                  disabled={availability !== "available"}
                  onJobDescriptionChange={setJobDescription}
                  onAnalyze={handleAnalyzeJobDescription}
                  onResumeFileChange={handleResumeFileChange}
                  onResumeTextChange={setResumeText}
                  onClearResume={() => {
                    setResumeText("");
                    setResumeFilename(null);
                    setCoverLetterResult("");
                  }}
                  onCreateCoverLetter={handleCreateCoverLetter}
                  onCopyCoverLetter={handleCopyCoverLetter}
                />
              </TabsContent>

              <TabsContent value="interview-practice">
                <InterviewPracticeTab
                  jobDescription={jobDescription}
                  interviewQuestions={interviewQuestions}
                  questionsList={questionsList}
                  currentQuestionIndex={currentQuestionIndex}
                  customQuestion={customQuestion}
                  mockQuestion={mockQuestion}
                  mockAnswer={mockAnswer}
                  mockFeedback={mockFeedback}
                  questionsLoading={questionsLoading}
                  mockLoading={mockLoading}
                  audioLoading={audioLoading}
                  isRecording={isRecording}
                  disabled={availability !== "available"}
                  onJobDescriptionChange={setJobDescription}
                  onGenerateQuestions={handleGenerateQuestions}
                  onSelectQuestion={handleSelectQuestion}
                  onCustomQuestionChange={setCustomQuestion}
                  onAddCustomQuestion={handleAddCustomQuestion}
                  onMockQuestionChange={setMockQuestion}
                  onMockAnswerChange={setMockAnswer}
                  onStartRecording={startRecording}
                  onStopRecording={stopRecording}
                  onClearAnswer={() => setMockAnswer("")}
                  onEvaluate={handleEvaluateMockAnswer}
                  onPreviousQuestion={() =>
                    currentQuestionIndex > 0 && handleSelectQuestion(currentQuestionIndex - 1)
                  }
                  onNextQuestion={() =>
                    currentQuestionIndex < questionsList.length - 1 &&
                    handleSelectQuestion(currentQuestionIndex + 1)
                  }
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Footer />
      </div>
    </div>
  );
}

export default App;
