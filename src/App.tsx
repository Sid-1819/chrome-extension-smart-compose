import { useState, useEffect } from "react";
import "./App.css";
import { GeminiClient } from "./utils/geminiClient";

function App() {
  const [status, setStatus] = useState("Checking API availability...");
  const [availability, setAvailability] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [_, setFeedbackResult] = useState("");
  const [improveResult, setImproveResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'interview-prep' | 'feedback' | 'improve' | 'mock-interview'>('interview-prep');
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
  // Mock Interview states
  const [mockQuestion, setMockQuestion] = useState("");
  const [mockAnswer, setMockAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mockFeedback, setMockFeedback] = useState("");
  const [mockLoading, setMockLoading] = useState(false);

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

  // Initialize Gemini client once at startup
  async function initializeClient() {
    try {
      const client = new GeminiClient();
      await client.initializeSession();
      setGeminiClient(client);
      console.log('Gemini client initialized at startup');
    } catch (error) {
      console.log('Failed to initialize client at startup:', error);
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
          } else if (action === 'get-feedback') {
            setInputText(text);
            setActiveTab('feedback');
            // Auto-get feedback immediately with the text
            handleGetFeedback(text);
          } else if (action === 'improve-text') {
            setInputText(text);
            setActiveTab('improve');
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
        setStatus("❌ Prompt API not supported. Please use Chrome 127+ and enable flags.");
        setAvailability("unavailable");
      } else {
        const availabilityStatus = await (window as any).LanguageModel.availability();
        setAvailability(availabilityStatus);

        if (availabilityStatus === 'available') {
          setStatus("✅ Gemini Nano is ready!");
        } else if (availabilityStatus === 'downloading') {
          setStatus("⏳ Gemini Nano is downloading... Please wait.");
          pollForAvailability();
        } else {
          setStatus("❌ Gemini Nano not available. Check setup instructions below.");
        }
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setStatus("❌ Error checking API. Make sure flags are enabled.");
      setAvailability("unavailable");
    }
  }

  function pollForAvailability() {
    const interval = setInterval(async () => {
      try {
        const availabilityStatus = await (window as any).LanguageModel.availability();
        setAvailability(availabilityStatus);

        if (availabilityStatus === 'available') {
          setStatus("✅ Gemini Nano download complete! Ready to use.");
          clearInterval(interval);
        } else if (availabilityStatus === 'unavailable') {
          setStatus("❌ Download failed. Please check your setup.");
          clearInterval(interval);
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 5000); // Check every 5 seconds
  }

  async function handleGetFeedback(textOverride?: string) {
    const text = textOverride || inputText;
    if (!text.trim()) {
      alert('Please enter some text first!');
      return;
    }

    setLoading(true);
    setFeedbackResult('');
    setStatus('🤔 Getting AI feedback...');

    try {
      // Use existing client or initialize
      let client = geminiClient;
      if (!client) {
        client = new GeminiClient();
        await client.initializeSession();
        setGeminiClient(client);
      }

      const feedback = await client.getInterviewFeedback(text);
      setFeedbackResult(feedback);
      setStatus('✅ Feedback received!');
    } catch (error) {
      setFeedbackResult(`Error: ${error}`);
      setStatus('❌ Failed to get feedback.');
    } finally {
      setLoading(false);
    }
  }

  async function handleImproveText(style: 'professional' | 'casual' | 'concise', textOverride?: string) {
    const text = textOverride || inputText;
    if (!text.trim()) {
      alert('Please enter some text first!');
      return;
    }

    setLoading(true);
    setImproveResult('');
    setStatus(`✍️ Improving text (${style} style)...`);

    try {
      // Use existing client or initialize
      let client = geminiClient;
      if (!client) {
        client = new GeminiClient();
        await client.initializeSession();
        setGeminiClient(client);
      }

      const improved = await client.improveText(text, style);
      setImproveResult(improved);
      setStatus('✅ Text improved!');
    } catch (error) {
      setImproveResult(`Error: ${error}`);
      setStatus('❌ Failed to improve text.');
    } finally {
      setLoading(false);
    }
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
   * Handle resume file selection. Supports plain text (.txt, .md). For other formats
   * the user will be prompted to paste text into the textarea fallback.
   */
  function handleResumeFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFilename(file.name);

    const name = file.name.toLowerCase();
    // Only read plain-text files client-side to avoid heavy dependencies
    if (file.type.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || '');
        setResumeText(text);
        setStatus(`Loaded resume: ${file.name}`);
      };
      reader.onerror = () => {
        setStatus('Failed to read file. Please paste your resume text below.');
      };
      reader.readAsText(file);
    } else {
      // For PDFs/DOCs show guidance; user can paste text into the textarea instead
      setStatus('File type not supported for auto-extraction. Please paste resume text into the field below.');
      setResumeText('');
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

  const systemPrompt = `You are an expert cover-letter writer. Write a compelling, concise, and highly tailored cover letter for a job application. You MUST use and reference both the provided job description analysis and the applicant's resume. Structure the letter in 3 short paragraphs: (1) Introduction and intent, (2) Why the candidate is a great fit—reference specific skills/experiences from the resume that match the job requirements, (3) Closing with a call to action. Be specific, professional, and persuasive. Avoid generic statements. Address the letter to the hiring manager (no name needed). Make sure you wrap up the cover letter in 250 to 300 words.`;

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

  // Voice recording functionality
  async function startVoiceRecording() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please use Chrome.');
      return;
    }

    try {
      // Request microphone permission first
      setStatus('🎤 Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());

      // Now start speech recognition
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setStatus('🎤 Recording... Speak your answer');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = mockAnswer;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setMockAnswer(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);

        let errorMessage = '❌ Speech recognition error';
        if (event.error === 'not-allowed') {
          errorMessage = '❌ Microphone permission denied. Please allow microphone access in your browser settings.';
        } else if (event.error === 'no-speech') {
          errorMessage = '⚠️ No speech detected. Please try again.';
        } else if (event.error === 'network') {
          errorMessage = '❌ Network error. Please check your connection.';
        } else {
          errorMessage = `❌ Speech recognition error: ${event.error}`;
        }

        setStatus(errorMessage);
        alert(errorMessage);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setStatus('✅ Recording stopped');
      };

      // Store recognition instance for stopping
      (window as any).currentRecognition = recognition;
      recognition.start();

    } catch (error: any) {
      console.error('Microphone permission error:', error);
      setIsRecording(false);

      let errorMessage = '❌ Could not access microphone';
      if (error.name === 'NotAllowedError') {
        errorMessage = '❌ Microphone permission denied. Please allow microphone access in your browser settings and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '❌ No microphone found. Please connect a microphone and try again.';
      } else {
        errorMessage = `❌ Microphone error: ${error.message}`;
      }

      setStatus(errorMessage);
      alert(errorMessage);
    }
  }

  function stopVoiceRecording() {
    const recognition = (window as any).currentRecognition;
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
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
    { id: 'interview-prep', label: '🎯 Interview Prep', icon: '📋' },
    { id: 'mock-interview', label: '🎤 Mock Interview', icon: '🎙️' },
    { id: 'feedback', label: '💬 Answer Feedback', icon: '🎤' },
    { id: 'improve', label: '✍️ Improve Text', icon: '✨' }
  ] as const;

  // Check if running in iframe (sidebar mode)
  const isInSidebar = window.self !== window.top;

  return (
    <div className={`${isInSidebar ? 'min-h-full' : 'min-h-screen'} bg-gradient-to-br from-purple-50 to-blue-50 p-6`}>
      <div className={isInSidebar ? 'max-w-full' : 'max-w-4xl mx-auto'}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
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
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
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
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {loading && !interviewQuestions ? '⏳ Analyzing...' : '🔍 Analyze JD'}
                  </button>
                  <button
                    onClick={() => handleGenerateQuestions()}
                    disabled={loading || availability !== 'available'}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
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
                    <div className="text-gray-700 whitespace-pre-wrap">{jdAnalysisResult}</div>
                  </div>
                )}

                {interviewQuestions && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      💭 Likely Interview Questions
                    </h3>
                    <div className="text-gray-700 whitespace-pre-wrap">{interviewQuestions}</div>
                  </div>
                )}

                {/* Resume upload + Cover Letter */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">📎 Upload / Paste Resume</h3>

                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="file"
                      accept=".txt,.md,text/*"
                      onChange={handleResumeFileChange}
                      className=""
                    />
                    <span className="text-sm text-gray-500">(Plain-text files recommended)</span>
                    {resumeFilename && (
                      <span className="ml-2 text-sm text-gray-600">Loaded: {resumeFilename}</span>
                    )}
                  </div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">Or paste resume text:</label>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume or CV text here if file upload isn't supported (PDF/DOCX)."
                    className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />

                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={handleCreateCoverLetter}
                      disabled={coverLetterLoading || availability !== 'available' || !jdAnalysisResult || !resumeText}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      {coverLetterLoading ? '⏳ Creating cover letter...' : '✉️ Create Cover Letter'}
                    </button>
                    <button
                      onClick={() => { setResumeText(''); setResumeFilename(null); setCoverLetterResult(''); }}
                      className="bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50"
                    >
                      Clear
                    </button>
                  </div>

                  {coverLetterResult && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                      <h4 className="font-semibold mb-2">Generated Cover Letter</h4>
                      <div className="text-gray-800 whitespace-pre-wrap">{coverLetterResult}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Feedback Tab */}
            {/* {activeTab === 'feedback' && (
              <div>
                <p className="text-gray-600 mb-4">
                  Get AI-powered feedback on your interview responses, including analysis of clarity, structure, and communication style.
                </p>
                <button
                  onClick={() => handleGetFeedback()}
                  disabled={loading || availability !== 'available'}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {loading ? '⏳ Processing...' : '🎯 Get AI Feedback'}
                </button>
                {feedbackResult && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-2">AI Feedback:</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{feedbackResult}</p>
                  </div>
                )}
              </div>
            )} */}

            {/* Mock Interview Tab */}
            {activeTab === 'mock-interview' && (
              <div>
                <p className="text-gray-600 mb-4">
                  Practice interview questions and get AI-powered feedback with ratings. Answer using voice or text.
                </p>

                {/* Microphone Permission Info */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    🎤 <strong>Voice Input:</strong> Click "Start Voice Recording" to allow microphone access. You'll be prompted for permission on first use.
                  </p>
                </div>

                {/* Interview Question Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Question:
                  </label>
                  <textarea
                    value={mockQuestion}
                    onChange={(e) => setMockQuestion(e.target.value)}
                    placeholder="Enter the interview question you want to practice..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    disabled={availability !== 'available'}
                  />
                </div>

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
                      className="bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
                    >
                      🎤 Start Voice Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopVoiceRecording}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 animate-pulse"
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
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {mockLoading ? '⏳ Evaluating...' : '🎯 Get AI Feedback & Rating'}
                </button>

                {/* Feedback Result */}
                {mockFeedback && (
                  <div className="mt-6 p-5 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-3 text-lg flex items-center gap-2">
                      📊 AI Evaluation & Feedback
                    </h3>
                    <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">{mockFeedback}</div>
                  </div>
                )}
              </div>
            )}

            {/* Improve Tab */}
            {activeTab === 'improve' && (
              <div>
                <p className="text-gray-600 mb-4">
                  Enhance your text with different writing styles.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleImproveText('professional')}
                    disabled={loading || availability !== 'available'}
                    className="bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    💼 Professional
                  </button>
                  <button
                    onClick={() => handleImproveText('casual')}
                    disabled={loading || availability !== 'available'}
                    className="bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    😊 Casual
                  </button>
                  <button
                    onClick={() => handleImproveText('concise')}
                    disabled={loading || availability !== 'available'}
                    className="bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ✂️ Concise
                  </button>
                </div>
                {improveResult && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">Improved Text:</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{improveResult}</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>🔒 100% Private • All processing happens on your device</p>
          <p className="mt-1">Powered by Chrome's Gemini Nano</p>
        </div>
      </div>
    </div>
  );
}

export default App;
