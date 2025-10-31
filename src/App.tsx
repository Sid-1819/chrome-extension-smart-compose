import { useState, useEffect } from "react";
import "./App.css";
import { GeminiClient } from "./utils/geminiClient";
import ReactMarkdown from "react-markdown";

function App() {
  const [status, setStatus] = useState("Checking API availability...");
  const [availability, setAvailability] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'interview-prep' | 'mock-interview'>('interview-prep');
  const [geminiClient, setGeminiClient] = useState<GeminiClient | null>(null);

  // Interview Prep states
  const [jobDescription, setJobDescription] = useState("");
  const [jdAnalysisResult, setJdAnalysisResult] = useState("");
  const [interviewQuestions, setInterviewQuestions] = useState("");
  // Resume / Cover letter states
  const [resumeText, setResumeText] = useState("");
  const [resumeFilename, setResumeFilename] = useState<string | null>(null);
  const [coverLetterResult, setCoverLetterResult] = useState("");
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  // Mock Interview states
  const [mockQuestion, setMockQuestion] = useState("");
  const [mockAnswer, setMockAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mockFeedback, setMockFeedback] = useState("");
  const [mockLoading, setMockLoading] = useState(false);
  const [questionsList, setQuestionsList] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1);
  const [customQuestion, setCustomQuestion] = useState("");
  // Audio recording state
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Check API availability on mount
  useEffect(() => {
    checkAvailability();
    checkContextMenuAction();
  }, []);

  // Initialize Gemini client when API becomes available
  useEffect(() => {
    if (availability === 'available' && !geminiClient) {
      initializeClient();
    }
  }, [availability]);

  // Parse interview questions into a list when they're generated
  useEffect(() => {
    if (interviewQuestions) {
      const parsed = parseQuestions(interviewQuestions);
      setQuestionsList(parsed);
    }
  }, [interviewQuestions]);

  // Initialize Gemini client once at startup with multimodal support (text, audio, image)
  async function initializeClient() {
    try {
      console.log('🔧 [INIT] Initializing Gemini client with multimodal support...');
      const client = new GeminiClient({
        expectedInputs: [
          { type: 'text', languages: ['en'] },
          { type: 'audio', languages: ['en'] },
          { type: 'image', languages: ['en'] }
        ],
        expectedOutputs: [
          { type: 'text', languages: ['en'] }
        ]
      });
      await client.initializeSession(undefined, { enableAudioInput: true });
      setGeminiClient(client);
      console.log('🔧 [INIT] ✅ Gemini client initialized with text, audio, and image input support');
    } catch (error) {
      console.error('🔧 [INIT] ❌ Failed to initialize client at startup:', error);
    }
  }

  // Parse questions from the generated interview questions string
  function parseQuestions(questionsText: string): string[] {
    // Split by numbered lines (1., 2., 3., etc.) or by newlines
    const lines = questionsText.split('\n').filter(line => line.trim());
    const questions: string[] = [];

    for (const line of lines) {
      // Remove numbering like "1.", "2.", etc."
      const cleaned = line.replace(/^\d+\.\s*/, '').trim();
      // Only add non-empty lines that look like questions or statements
      if (cleaned.length > 10) {
        questions.push(cleaned);
      }
    }

    return questions.length > 0 ? questions : [questionsText]; // Fallback to full text if parsing fails
  }

  // Add a custom question to the list
  function handleAddCustomQuestion() {
    if (!customQuestion.trim()) {
      alert('Please enter a question first!');
      return;
    }

    setQuestionsList(prev => [...prev, customQuestion.trim()]);
    setCustomQuestion('');
    setStatus('✅ Custom question added!');
  }

  // Select a question to answer
  function handleSelectQuestion(index: number) {
    setCurrentQuestionIndex(index);
    setMockQuestion(questionsList[index]);
    setMockAnswer('');
    setMockFeedback('');
    setStatus(`📝 Selected question ${index + 1} of ${questionsList.length}`);
  }

  // Navigate to next question
  function handleNextQuestion() {
    if (currentQuestionIndex < questionsList.length - 1) {
      handleSelectQuestion(currentQuestionIndex + 1);
    }
  }

  // Navigate to previous question
  function handlePreviousQuestion() {
    if (currentQuestionIndex > 0) {
      handleSelectQuestion(currentQuestionIndex - 1);
    }
  }

  // Check if user came from context menu
  async function checkContextMenuAction() {
    try {
      const result = await chrome.storage.local.get(['contextMenuAction', 'selectedText', 'timestamp']);

      if (result.contextMenuAction && result.selectedText) {
        const action = result.contextMenuAction as string;
        const text = result.selectedText as string;
        const timestamp = result.timestamp as number;

        // Only process if recent (within last 5 seconds)
        if (Date.now() - timestamp < 5000) {
          if (action === 'analyze-job-description') {
            setJobDescription(text);
            setActiveTab('interview-prep');
            // Auto-analyze immediately with the text
            handleAnalyzeJobDescription(text);
          } else if (action === 'generate-questions') {
            setJobDescription(text);
            setActiveTab('interview-prep');
            // Auto-generate immediately with the text
            handleGenerateQuestions(text);
          }

          // Clear the action after processing
          chrome.storage.local.remove(['contextMenuAction', 'selectedText', 'timestamp']);

          // Clear the badge notification
          chrome.runtime.sendMessage({ type: 'CLEAR_BADGE' }).catch(err =>
            console.log('Could not clear badge:', err)
          );
        }
      }
    } catch (error) {
      console.log('Not running in extension context or error:', error);
    }
  }

  async function checkAvailability() {
    try {
      // Check Prompt API
      if (!('LanguageModel' in window)) {
        setStatus(" Prompt API not supported. Please use Chrome 127+ and enable flags.");
        setAvailability("unavailable");
      } else {
        const availabilityStatus = await (window as any).LanguageModel.availability();
        setAvailability(availabilityStatus);

        if (availabilityStatus === 'available') {
          setStatus(" Gemini Nano is ready!");
        } else if (availabilityStatus === 'downloading') {
          setStatus(" Gemini Nano is downloading... Please wait.");
          pollForAvailability();
        } else {
          setStatus(" Gemini Nano not available. Check setup instructions below.");
        }
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setStatus(" Error checking API. Make sure flags are enabled.");
      setAvailability("unavailable");
    }
  }

  function pollForAvailability() {
    const interval = setInterval(async () => {
      try {
        const availabilityStatus = await (window as any).LanguageModel.availability();
        setAvailability(availabilityStatus);

        if (availabilityStatus === 'available') {
          setStatus(" Gemini Nano download complete! Ready to use.");
          clearInterval(interval);
        } else if (availabilityStatus === 'unavailable') {
          setStatus(" Download failed. Please check your setup.");
          clearInterval(interval);
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 5000); // Check every 5 seconds
  }

  async function handleAnalyzeJobDescription(textOverride?: string) {
    const text = textOverride || jobDescription;
    if (!text.trim()) {
      alert('Please paste a job description first!');
      return;
    }

    setLoading(true);
    setJdAnalysisResult('');
    setStatus('🔍 Analyzing job description...');

    try {
      // Use existing client or initialize
      let client = geminiClient;
      if (!client) {
        client = new GeminiClient();
        await client.initializeSession();
        setGeminiClient(client);
      }

      const analysis = await client.analyzeJobDescription(text);
      setJdAnalysisResult(analysis);
      setStatus('✅ Job description analyzed!');
    } catch (error) {
      setJdAnalysisResult(`Error: ${error}`);
      setStatus('❌ Failed to analyze job description.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateQuestions(textOverride?: string) {
    const text = textOverride || jobDescription;
    if (!text.trim()) {
      alert('Please paste a job description first!');
      return;
    }

    setLoading(true);
    setInterviewQuestions('');
    setStatus('💭 Generating interview questions...');

    try {
      // Use existing client or initialize
      let client = geminiClient;
      if (!client) {
        client = new GeminiClient();
        await client.initializeSession();
        setGeminiClient(client);
      }

      const questions = await client.generateInterviewQuestions(text);
      setInterviewQuestions(questions);
      setStatus('✅ Interview questions generated!');
    } catch (error) {
      setInterviewQuestions(`Error: ${error}`);
      setStatus('❌ Failed to generate questions.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handle resume file selection. Supports plain text (.txt, .md) client-side.
   * For PDF/DOCX files, sends to Vercel API for parsing.
   * For image files, uses Prompt API's image input to extract text.
   */
  async function handleResumeFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFilename(file.name);

    const name = file.name.toLowerCase();

    console.log('📄 [RESUME] File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInKB: (file.size / 1024).toFixed(2)
    });

    // Only read plain-text files client-side to avoid heavy dependencies
    if (file.type.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md')) {
      console.log('📄 [RESUME] Reading as text file...');
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || '');
        setResumeText(text);
        setStatus(`✅ Loaded resume: ${file.name}`);
        console.log('📄 [RESUME] Text file loaded:', text.length, 'characters');
      };
      reader.onerror = () => {
        console.error('📄 [RESUME] Failed to read text file');
        setStatus('❌ Failed to read file. Please paste your resume text below.');
      };
      reader.readAsText(file);
    }
    // Handle image files using Prompt API
    else if (
      file.type.startsWith('image/') ||
      name.endsWith('.png') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.gif') ||
      name.endsWith('.webp')
    ) {
      console.log('📄 [RESUME] Detected image file, using Prompt API for text extraction...');
      await handleResumeImageUpload(file);
    }
    // Handle PDF and DOCX files via API
    else if (
      file.type === 'application/pdf' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.pdf') ||
      name.endsWith('.docx')
    ) {
      console.log('📄 [RESUME] Detected PDF/DOCX file, using API for parsing...');
      await handleResumeAPIUpload(file);
    }
    else {
      // Unsupported file type
      console.warn('📄 [RESUME] Unsupported file type:', file.type);
      setStatus('⚠️ File type not supported. Please use PDF, DOCX, TXT, MD, or image files (PNG, JPG), or paste text below.');
      setResumeText('');
    }
  }

  /**
   * Extract text from image resume using Prompt API's image input, with fallback to Vercel API
   */
  async function handleResumeImageUpload(file: File) {
    setCoverLetterLoading(true);
    setStatus('🖼️ Extracting text from image...');
    setResumeText('');

    console.log('📄 [RESUME-IMAGE] Starting image text extraction...');

    // Try Prompt API first (on-device, private)
    if (availability === 'available') {
      try {
        console.log('📄 [RESUME-IMAGE] Attempting on-device extraction with Prompt API...');

        // Create blob from file
        const imageBlob = new Blob([file], { type: file.type });
        console.log('📄 [RESUME-IMAGE] Image blob created:', {
          size: imageBlob.size,
          type: imageBlob.type
        });

        // Use Gemini client to extract text from image
        let client = geminiClient;
        if (!client) {
          console.log('📄 [RESUME-IMAGE] Initializing Gemini client with image support...');
          client = new GeminiClient({
            expectedInputs: [
              { type: 'text', languages: ['en'] },
              { type: 'image', languages: ['en'] },
              { type: 'audio', languages: ['en'] }
            ],
            expectedOutputs: [
              { type: 'text', languages: ['en'] }
            ]
          });
          await client.initializeSession(undefined, { enableAudioInput: true });
          setGeminiClient(client);
          console.log('📄 [RESUME-IMAGE] Gemini client initialized with image support');
        }

        console.log('📄 [RESUME-IMAGE] Extracting text from image...');
        const extractedText = await client.extractTextFromImage(imageBlob);

        console.log('📄 [RESUME-IMAGE] Text extracted successfully:', {
          length: extractedText.length,
          preview: extractedText.substring(0, 100)
        });

        setResumeText(extractedText);
        setStatus(`✅ Successfully extracted text from ${file.name} (${extractedText.length} characters) using on-device AI`);
        setCoverLetterLoading(false);
        return; // Success! Exit early

      } catch (error: any) {
        console.warn('📄 [RESUME-IMAGE] ⚠️ Prompt API extraction failed, falling back to cloud API...');
        console.warn('📄 [RESUME-IMAGE] Error:', {
          name: error.name,
          message: error.message
        });
        setStatus('⚠️ On-device extraction failed, trying cloud API...');
      }
    } else {
      console.log('📄 [RESUME-IMAGE] Gemini Nano not available, using cloud API...');
      setStatus('🖼️ Using cloud API for text extraction...');
    }

    // Fallback: Use Vercel API (same as PDF/DOCX)
    try {
      console.log('📄 [RESUME-IMAGE] Falling back to Vercel API for image processing...');

      // Create FormData to send file
      const formData = new FormData();
      formData.append('file', file);

      // Use the same API endpoint (it should handle images too)
      const PRODUCTION_API_URL = import.meta.env.VITE_API_URL || 'https://interview-coach-ai-9vgs.vercel.app/api/parse-resume';

      console.log('📄 [RESUME-IMAGE] Sending image to API:', PRODUCTION_API_URL);

      const response = await fetch(PRODUCTION_API_URL, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Server error' }));
        throw new Error(error.error || 'Failed to extract text from image');
      }

      const data = await response.json();

      if (data.success && data.text) {
        setResumeText(data.text);
        setStatus(`✅ Successfully extracted text from ${file.name} (${data.cleanedLength} characters) using cloud API`);
        console.log('📄 [RESUME-IMAGE] ✅ Cloud API extraction successful');
      } else {
        throw new Error('No text extracted from image');
      }

    } catch (apiError: any) {
      console.error('📄 [RESUME-IMAGE] ❌ Cloud API also failed:', {
        name: apiError.name,
        message: apiError.message
      });

      let userFriendlyMessage = '';

      if (apiError.name === 'TypeError' && apiError.message.includes('Failed to fetch')) {
        userFriendlyMessage = 'Unable to reach the text extraction API. Please check your internet connection.';
      } else if (apiError.name === 'TimeoutError' || apiError.message.includes('timeout')) {
        userFriendlyMessage = 'Request timed out. Please try again.';
      } else {
        userFriendlyMessage = apiError.message;
      }

      setStatus(`❌ ${userFriendlyMessage} Please paste your resume text in the text area below.`);
      setResumeText('');
    } finally {
      setCoverLetterLoading(false);
    }
  }

  /**
   * Upload PDF/DOCX resume to Vercel API for parsing
   */
  async function handleResumeAPIUpload(file: File) {
    setCoverLetterLoading(true);
    setStatus('📄 Parsing resume file...');
    setResumeText('');

    try {
      // Create FormData to send file
      const formData = new FormData();
      formData.append('file', file);

      // Determine API URL
      // For Chrome extensions, we need to use the full Vercel URL since relative paths don't work
      // Default to the deployed Vercel URL, but allow override via environment variable
      const PRODUCTION_API_URL = import.meta.env.VITE_API_URL || 'https://interview-coach-ai-9vgs.vercel.app/api/parse-resume';
      const apiUrl = PRODUCTION_API_URL;

      console.log('Attempting to parse resume using API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(60000), 
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Server error' }));
        throw new Error(error.error || 'Failed to parse resume');
      }

      const data = await response.json();

      if (data.success && data.text) {
        setResumeText(data.text);
        setStatus(`✅ Successfully parsed ${file.name} (${data.cleanedLength} characters)`);
      } else {
        throw new Error('No text extracted from file');
      }

    } catch (error) {
      console.error('Resume API upload failed:', error);

      let errorMessage = '';
      let userFriendlyMessage = '';

      if (error instanceof Error) {
        errorMessage = error.message;

        // Check for specific error types
        if (error.name === 'TypeError' && errorMessage.includes('Failed to fetch')) {
          userFriendlyMessage = 'Unable to reach the resume parsing API. Please check your internet connection.';
        } else if (errorMessage.includes('GEMINI_API_KEY')) {
          userFriendlyMessage = 'API key not configured on the server.';
        } else if (error.name === 'TimeoutError' || errorMessage.includes('timeout')) {
          userFriendlyMessage = 'Request timed out. Please try again.';
        } else if (error.name === 'AbortError') {
          userFriendlyMessage = 'Request was cancelled due to timeout.';
        } else {
          userFriendlyMessage = errorMessage;
        }
      } else {
        userFriendlyMessage = 'Unknown error occurred';
      }

      setStatus(`❌ ${userFriendlyMessage} Please paste your resume text in the text area below.`);
      setResumeText('');
    } finally {
      setCoverLetterLoading(false);
    }
  }

  /**
   * Create a cover letter using the job description analysis + the user's resume text.
   * Uses the Gemini prompt API to generate, and optionally refines the result with the Summarizer API
   * if available on the device.
   */
  async function handleCreateCoverLetter() {
    if (!jdAnalysisResult.trim()) {
      alert('Please analyze the job description first.');
      return;
    }
    if (!resumeText.trim()) {
      alert('Please upload or paste your resume text first.');
      return;
    }

    setCoverLetterLoading(true);
    setCoverLetterResult('');
    setStatus('✉️ Generating cover letter...');

    try {
      let client = geminiClient;
      if (!client) {
        client = new GeminiClient();
        await client.initializeSession();
        setGeminiClient(client);
      }

  const systemPrompt = `You are an expert cover-letter writer. Write a compelling, concise, and highly tailored cover letter for a job application. You MUST use and reference both the provided job description analysis and the applicant's resume. Structure the letter in 3 short paragraphs: (1) Introduction and intent, (2) Why the candidate is a great fit—reference specific skills/experiences from the resume that match the job requirements, (3) Closing with a call to action. Be specific, professional, and persuasive. Avoid generic statements. Address the letter to the hiring manager (no name needed). IMPORTANT: Keep the cover letter under 250 words.`;

  const userPrompt = `---\nJob Description Analysis:\n${jdAnalysisResult}\n\n---\nApplicant Resume:\n${resumeText}\n\n---\nWrite a cover letter for this candidate applying to the job described above. Reference both the job requirements and the candidate's relevant experience. Make the letter unique to this application.`;

      const generated = await client.generateContent(userPrompt, systemPrompt);

      setCoverLetterResult(generated);

      setStatus('✅ Cover letter created!');
    } catch (error: any) {
      console.error('Cover letter generation failed:', error);
      setStatus('❌ Failed to create cover letter.');
      setCoverLetterResult(`Error: ${String(error)}`);
    } finally {
      setCoverLetterLoading(false);
    }
  }

  /**
   * Copy cover letter to clipboard
   */
  async function handleCopyCoverLetter() {
    try {
      await navigator.clipboard.writeText(coverLetterResult);
      setCopySuccess(true);
      setStatus('✅ Cover letter copied to clipboard!');

      // Reset copy success after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setStatus('❌ Failed to copy to clipboard');
    }
  }

  // Voice recording functionality using Prompt API audio input
  async function startVoiceRecording() {
    console.log('🎤 [AUDIO] Starting voice recording...');

    try {
      // Check if Gemini Nano is available
      console.log('🎤 [AUDIO] Checking Gemini Nano availability:', availability);
      if (availability !== 'available') {
        console.warn('🎤 [AUDIO] Gemini Nano not available');
        alert('Gemini Nano is not available. Please ensure it is enabled and downloaded.');
        return;
      }

      // Check microphone permission state first
      console.log('🎤 [AUDIO] Checking microphone permissions...');
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log('🎤 [AUDIO] Permission state:', permissionStatus.state);

      if (permissionStatus.state === 'prompt') {
        // Permission not yet granted - open popup to request it
        console.log('🎤 [AUDIO] Opening permission dialog...');
        setStatus('🎤 Opening permission dialog...');

        const popupUrl = chrome.runtime.getURL('mic-permission.html');
        await chrome.windows.create({
          url: popupUrl,
          type: 'popup',
          width: 400,
          height: 300,
          focused: true
        });

        setStatus('⏳ Please grant microphone permission in the popup window, then try recording again.');
        return;
      } else if (permissionStatus.state === 'denied') {
        console.error('🎤 [AUDIO] Microphone permission denied');
        setStatus('❌ Microphone permission denied. Please click the microphone icon in the address bar to allow access.');
        alert('Microphone permission denied. Please allow microphone access in your browser settings:\n\n1. Click the microphone icon in the address bar\n2. Select "Always allow"\n3. Try recording again');
        return;
      }

      // Permission already granted - proceed with audio recording
      console.log('🎤 [AUDIO] Permission granted, requesting microphone access...');
      setStatus('🎤 Starting recording...');

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('🎤 [AUDIO] Microphone stream obtained:', stream.getTracks().map(t => ({
        kind: t.kind,
        label: t.label,
        enabled: t.enabled,
        muted: t.muted
      })));

      // Check supported MIME types
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/wav'
      ];
      const availableTypes = supportedTypes.filter(type => MediaRecorder.isTypeSupported(type));
      console.log('🎤 [AUDIO] Supported MIME types:', availableTypes);

      // Create MediaRecorder to capture audio
      const mimeType = availableTypes[0] || 'audio/webm';
      console.log('🎤 [AUDIO] Using MIME type:', mimeType);

      const recorder = new MediaRecorder(stream, { mimeType });
      console.log('🎤 [AUDIO] MediaRecorder created:', {
        mimeType: recorder.mimeType,
        state: recorder.state,
        audioBitsPerSecond: recorder.audioBitsPerSecond
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        console.log('🎤 [AUDIO] Data available:', {
          size: event.data.size,
          type: event.data.type,
          chunkCount: chunks.length + 1
        });
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstart = () => {
        console.log('🎤 [AUDIO] Recording started');
        setIsRecording(true);
        setStatus('🎤 Recording... Speak your answer');
      };

      recorder.onstop = async () => {
        console.log('🎤 [AUDIO] Recording stopped, processing audio...');
        setIsRecording(false);
        setStatus('⏳ Transcribing audio...');

        // Combine all chunks into a single Blob
        const audioBlob = new Blob(chunks, { type: mimeType });
        console.log('🎤 [AUDIO] Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type,
          chunkCount: chunks.length,
          sizeInKB: (audioBlob.size / 1024).toFixed(2)
        });

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => {
          console.log('🎤 [AUDIO] Stopping track:', track.kind, track.label);
          track.stop();
        });

        try {
          console.log('🎤 [AUDIO] Initializing Gemini client for transcription...');
          // Use Gemini client to transcribe audio
          let client = geminiClient;
          if (!client) {
            console.log('🎤 [AUDIO] Creating new Gemini client with audio support...');
            client = new GeminiClient({
              expectedInputs: [
                { type: 'text', languages: ['en'] },
                { type: 'audio', languages: ['en'] }
              ],
              expectedOutputs: [
                { type: 'text', languages: ['en'] }
              ]
            });
            await client.initializeSession(undefined, { enableAudioInput: true });
            setGeminiClient(client);
            console.log('🎤 [AUDIO] Gemini client initialized with audio support');
          }

          console.log('🎤 [AUDIO] Sending audio to Prompt API for transcription...');
          const transcription = await client.transcribeAudio(audioBlob);
          console.log('🎤 [AUDIO] Transcription received:', {
            length: transcription.length,
            preview: transcription.substring(0, 100)
          });

          // Append transcription to existing answer
          setMockAnswer(prev => prev ? `${prev} ${transcription}` : transcription);
          setStatus('✅ Audio transcribed successfully!');
          console.log('🎤 [AUDIO] Transcription complete!');
        } catch (error: any) {
          console.error('🎤 [AUDIO] ❌ Transcription error:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          setStatus('❌ Failed to transcribe audio. Please try again.');
          alert(`Transcription failed: ${error.message}\n\nPlease try again or type your answer instead.`);
        }
      };

      recorder.onerror = (event: any) => {
        console.error('🎤 [AUDIO] ❌ MediaRecorder error:', event.error);
        setIsRecording(false);
        setStatus('❌ Recording error occurred');
        alert(`Recording error: ${event.error}`);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Store the recorder
      setMediaRecorder(recorder);

      // Start recording
      console.log('🎤 [AUDIO] Starting MediaRecorder...');
      recorder.start();

    } catch (error: any) {
      console.error('🎤 [AUDIO] ❌ Error starting voice recording:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setIsRecording(false);

      let errorMessage = `❌ Error: ${error.message}`;
      if (error.name === 'NotAllowedError') {
        errorMessage = '❌ Microphone permission denied. Please allow microphone access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '❌ No microphone found. Please connect a microphone and try again.';
      }

      setStatus(errorMessage);
      alert(errorMessage);
    }
  }

  function stopVoiceRecording() {
    console.log('🎤 [AUDIO] Stop recording requested');
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      console.log('🎤 [AUDIO] Stopping MediaRecorder...', {
        state: mediaRecorder.state,
        mimeType: mediaRecorder.mimeType
      });
      mediaRecorder.stop();
      setStatus('⏳ Processing recording...');
    } else {
      console.warn('🎤 [AUDIO] Cannot stop - MediaRecorder is inactive or null');
    }
  }

  async function handleEvaluateMockAnswer() {
    if (!mockQuestion.trim()) {
      alert('Please enter an interview question first!');
      return;
    }
    if (!mockAnswer.trim()) {
      alert('Please provide your answer (voice or text)!');
      return;
    }

    setMockLoading(true);
    setMockFeedback('');
    setStatus('🤔 Evaluating your answer...');

    try {
      let client = geminiClient;
      if (!client) {
        client = new GeminiClient();
        await client.initializeSession();
        setGeminiClient(client);
      }

      const evaluation = await client.evaluateMockInterviewAnswer(mockQuestion, mockAnswer);
      setMockFeedback(evaluation);
      setStatus('✅ Evaluation complete!');
    } catch (error: any) {
      console.error('Mock interview evaluation failed:', error);
      setStatus('❌ Failed to evaluate answer.');
      setMockFeedback(`Error: ${String(error)}`);
    } finally {
      setMockLoading(false);
    }
  }

  const tabs = [
    { id: 'interview-prep', label: 'Interview Prep', icon: '📋' },
    { id: 'mock-interview', label: 'Mock Interview', icon: '🎙️' }
  ] as const;

  // Check if running in iframe (sidebar mode)
  const isInSidebar = window.self !== window.top;

  return (
    <div className={`${isInSidebar ? 'min-h-full' : 'min-h-screen'} bg-blue-50 p-6`}>
      <div className={isInSidebar ? 'max-w-full' : 'max-w-4xl mx-auto'}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-600 mb-2">
            InterviewCoach.AI
          </h1>
          <p className="text-gray-600">AI-Powered Interview Prep • On-Device • No API Key Needed</p>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>Pro Tip:</strong> Highlight job descriptions on any webpage, right-click → <strong>"InterviewCoach.AI"</strong> → then click the extension icon to see results!
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div className={`p-4 rounded-lg mb-6 ${
          availability === 'available' ? 'bg-green-100 border-green-500' :
          availability === 'downloading' ? 'bg-yellow-100 border-yellow-500' :
          'bg-red-100 border-red-500'
        } border-l-4`}>
          <div className="flex items-center justify-between">
            <p className="font-medium">{status}</p>
            <button
              onClick={checkAvailability}
              className="px-3 py-1 text-sm bg-white rounded-md hover:bg-gray-100 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>

          {availability === 'unavailable' && (
            <div className="mt-4 text-sm">
              <p className="font-semibold mb-2">Setup Required:</p>

              {/* Prompt API Setup */}
              <div className="mb-3">
                <p className="font-medium text-purple-700 mb-1">For Prompt API (Interview Features):</p>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Open <code className="bg-gray-800 text-white px-2 py-0.5 rounded">chrome://flags/#optimization-guide-on-device-model</code></li>
                  <li>Set to <strong>"Enabled BypassPerfRequirement"</strong></li>
                  <li>Open <code className="bg-gray-800 text-white px-2 py-0.5 rounded">chrome://flags/#prompt-api-for-gemini-nano</code></li>
                  <li>Set to <strong>"Enabled"</strong></li>
                </ol>
              </div>

              <p className="mt-2 font-semibold">Finally:</p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Restart Chrome</li>
                <li>The AI model will download automatically (may take a few minutes)</li>
              </ol>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>


          {/* Tab Content */}
          <div className="space-y-4">
            {/* Interview Prep Tab */}
            {activeTab === 'interview-prep' && (
              <div>
                <p className="text-gray-600 mb-4">
                  Paste a job description to get AI-powered analysis and personalized interview questions.
                </p>

                {/* Job Description Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description:
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here..."
                    className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    disabled={availability !== 'available'}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {jobDescription.length} characters
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => handleAnalyzeJobDescription()}
                    disabled={loading || availability !== 'available'}
                    className="bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading && !interviewQuestions ? '⏳ Analyzing...' : '🔍 Analyze JD'}
                  </button>
                  <button
                    onClick={() => handleGenerateQuestions()}
                    disabled={loading || availability !== 'available'}
                    className="bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading && interviewQuestions !== jdAnalysisResult ? '⏳ Generating...' : '💭 Generate Questions'}
                  </button>
                </div>

                {/* Results */}
                {jdAnalysisResult && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      🔍 Job Description Analysis
                    </h3>
                    <div className="text-gray-700 prose prose-sm max-w-none">
                      <ReactMarkdown>{jdAnalysisResult}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {interviewQuestions && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      💭 Likely Interview Questions
                    </h3>
                    <div className="text-gray-700 prose prose-sm max-w-none">
                      <ReactMarkdown>{interviewQuestions}</ReactMarkdown>
                    </div>
                    <button
                      onClick={() => setActiveTab('mock-interview')}
                      className="mt-4 w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                      🎤 Start Mock Interview with These Questions
                    </button>
                  </div>
                )}

                {/* Resume upload + Cover Letter */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    📎 Upload / Paste Resume
                  </h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose file
                    </label>
                    <input
                      type="file"
                      accept=".txt,.md,.pdf,.docx,.png,.jpg,.jpeg,.gif,.webp,text/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                      onChange={handleResumeFileChange}
                      className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      📄 Supports: TXT, MD (instant), Images (AI extraction), PDF, DOCX (cloud parsing)
                    </p>
                    {resumeFilename && (
                      <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                        ✅ Loaded: <span className="font-medium">{resumeFilename}</span>
                      </p>
                    )}
                  </div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or paste resume text:
                  </label>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume or CV text here if file upload isn't supported (PDF/DOCX)."
                    className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleCreateCoverLetter}
                      disabled={coverLetterLoading || availability !== 'available' || !jdAnalysisResult || !resumeText}
                      className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {coverLetterLoading ? '⏳ Creating cover letter...' : '✉️ Create Cover Letter'}
                    </button>
                    <button
                      onClick={() => { setResumeText(''); setResumeFilename(null); setCoverLetterResult(''); }}
                      className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Clear
                    </button>
                  </div>

                  {coverLetterResult && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Generated Cover Letter</h4>
                        <button
                          onClick={handleCopyCoverLetter}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                            copySuccess
                              ? 'bg-green-600 text-white'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {copySuccess ? (
                            <>
                              ✓ 
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            
                            </>
                          )}
                        </button>
                      </div>
                      <div className="text-gray-800 prose prose-sm max-w-none">
                        <ReactMarkdown>{coverLetterResult}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mock Interview Tab */}
            {activeTab === 'mock-interview' && (
              <div>
                <p className="text-gray-600 mb-4">
                  Practice interview questions and get AI-powered feedback with ratings. Answer using voice or text.
                </p>

                {/* Microphone Permission Info */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    🎤 <strong>Voice Input:</strong> Using Gemini Nano's built-in audio transcription. Click "Start Voice Recording" to begin. You'll be prompted for microphone permission on first use.
                  </p>
                </div>

                {/* Questions List Section */}
                {questionsList.length > 0 && (
                  <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      📝 Generated Interview Questions ({questionsList.length})
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {questionsList.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelectQuestion(index)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            currentQuestionIndex === index
                              ? 'bg-purple-600 text-white border-purple-700'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-purple-100'
                          }`}
                        >
                          <span className="font-medium">Q{index + 1}:</span> {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Custom Question Section */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    ➕ Add Custom Question
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      placeholder="Enter your own interview question..."
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddCustomQuestion();
                        }
                      }}
                    />
                    <button
                      onClick={handleAddCustomQuestion}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Current Question Display */}
                {currentQuestionIndex >= 0 && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-blue-900">
                        Question {currentQuestionIndex + 1} of {questionsList.length}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={handlePreviousQuestion}
                          disabled={currentQuestionIndex === 0}
                          className="px-3 py-1 text-sm bg-white rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ← Previous
                        </button>
                        <button
                          onClick={handleNextQuestion}
                          disabled={currentQuestionIndex === questionsList.length - 1}
                          className="px-3 py-1 text-sm bg-white rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-800 text-lg">{mockQuestion}</p>
                  </div>
                )}

                {/* Fallback: Manual Question Input (if no questions selected) */}
                {currentQuestionIndex < 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Or Enter Question Manually:
                    </label>
                    <textarea
                      value={mockQuestion}
                      onChange={(e) => setMockQuestion(e.target.value)}
                      placeholder="Enter the interview question you want to practice..."
                      className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      disabled={availability !== 'available'}
                    />
                  </div>
                )}

                {/* Answer Input with Voice Support */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Answer:
                  </label>
                  <textarea
                    value={mockAnswer}
                    onChange={(e) => setMockAnswer(e.target.value)}
                    placeholder="Type your answer or use voice input..."
                    className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    disabled={availability !== 'available' || isRecording}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {mockAnswer.length} characters
                  </p>
                </div>

                {/* Voice Recording Controls */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {!isRecording ? (
                    <button
                      onClick={startVoiceRecording}
                      disabled={availability !== 'available'}
                      className="bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      🎤 Start Voice Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopVoiceRecording}
                      className="bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 animate-pulse"
                    >
                      ⏹️ Stop Recording
                    </button>
                  )}
                  <button
                    onClick={() => setMockAnswer('')}
                    disabled={isRecording || !mockAnswer}
                    className="bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    🗑️ Clear Answer
                  </button>
                </div>

                {/* Evaluate Button */}
                <button
                  onClick={handleEvaluateMockAnswer}
                  disabled={mockLoading || availability !== 'available' || isRecording || !mockQuestion.trim() || !mockAnswer.trim()}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {mockLoading ? '⏳ Evaluating...' : '🎯 Get AI Feedback & Rating'}
                </button>

                {/* Feedback Result */}
                {mockFeedback && (
                  <div className="mt-6 p-5 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-3">
                      AI Feedback
                    </h3>
                    <div className="text-gray-700 prose prose-sm max-w-none">
                      <ReactMarkdown>{mockFeedback}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            &copy; 2025 InterviewCoach.AI. All rights reserved.
          </p>
          <p>
            Built with ❤️ by Siddhesh Shirdhankar. Check out the <a href="https://github.com/Sid-1819/interview-coach-ai" target="_blank" className="text-purple-600 hover:underline">GitHub repo</a> for more info.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
