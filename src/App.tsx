import { useState, useEffect } from "react";
import "./App.css";
import { GeminiClient } from "./utils/geminiClient";

function App() {
  const [status, setStatus] = useState("Checking API availability...");
  const [availability, setAvailability] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [feedbackResult, setFeedbackResult] = useState("");
  const [improveResult, setImproveResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'interview-prep' | 'feedback' | 'improve'>('interview-prep');
  const [geminiClient, setGeminiClient] = useState<GeminiClient | null>(null);

  // Interview Prep states
  const [jobDescription, setJobDescription] = useState("");
  const [jdAnalysisResult, setJdAnalysisResult] = useState("");
  const [interviewQuestions, setInterviewQuestions] = useState("");

  // Check API availability on mount
  useEffect(() => {
    checkAvailability();
    checkContextMenuAction();
  }, []);

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
            // Auto-analyze after a short delay
            setTimeout(() => {
              handleAnalyzeJobDescription();
            }, 500);
          } else if (action === 'generate-questions') {
            setJobDescription(text);
            setActiveTab('interview-prep');
            // Auto-generate after a short delay
            setTimeout(() => {
              handleGenerateQuestions();
            }, 500);
          } else if (action === 'get-feedback') {
            setInputText(text);
            setActiveTab('feedback');
          } else if (action === 'improve-text') {
            setInputText(text);
            setActiveTab('improve');
          }

          // Clear the action after processing
          chrome.storage.local.remove(['contextMenuAction', 'selectedText', 'timestamp']);
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

  async function handleGetFeedback() {
    if (!inputText.trim()) {
      alert('Please enter some text first!');
      return;
    }

    setLoading(true);
    setFeedbackResult('');
    setStatus('🤔 Getting AI feedback...');

    try {
      // Initialize client if not already done
      let client = geminiClient;
      if (!client) {
        client = new GeminiClient();
        await client.initializeSession();
        setGeminiClient(client);
      }

      const feedback = await client.getInterviewFeedback(inputText);
      setFeedbackResult(feedback);
      setStatus('✅ Feedback received!');
    } catch (error) {
      setFeedbackResult(`Error: ${error}`);
      setStatus('❌ Failed to get feedback.');
    } finally {
      setLoading(false);
    }
  }

  async function handleImproveText(style: 'professional' | 'casual' | 'concise') {
    if (!inputText.trim()) {
      alert('Please enter some text first!');
      return;
    }

    setLoading(true);
    setImproveResult('');
    setStatus(`✍️ Improving text (${style} style)...`);

    try {
      // Initialize client if not already done
      let client = geminiClient;
      if (!client) {
        client = new GeminiClient();
        await client.initializeSession();
        setGeminiClient(client);
      }

      const improved = await client.improveText(inputText, style);
      setImproveResult(improved);
      setStatus('✅ Text improved!');
    } catch (error) {
      setImproveResult(`Error: ${error}`);
      setStatus('❌ Failed to improve text.');
    } finally {
      setLoading(false);
    }
  }


  async function handleAnalyzeJobDescription() {
    if (!jobDescription.trim()) {
      alert('Please paste a job description first!');
      return;
    }

    setLoading(true);
    setJdAnalysisResult('');
    setStatus('🔍 Analyzing job description...');

    try {
      let client = geminiClient;
      if (!client) {
        client = new GeminiClient();
        await client.initializeSession();
        setGeminiClient(client);
      }

      const analysis = await client.analyzeJobDescription(jobDescription);
      setJdAnalysisResult(analysis);
      setStatus('✅ Job description analyzed!');
    } catch (error) {
      setJdAnalysisResult(`Error: ${error}`);
      setStatus('❌ Failed to analyze job description.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateQuestions() {
    if (!jobDescription.trim()) {
      alert('Please paste a job description first!');
      return;
    }

    setLoading(true);
    setInterviewQuestions('');
    setStatus('💭 Generating interview questions...');

    try {
      let client = geminiClient;
      if (!client) {
        client = new GeminiClient();
        await client.initializeSession();
        setGeminiClient(client);
      }

      const questions = await client.generateInterviewQuestions(jobDescription);
      setInterviewQuestions(questions);
      setStatus('✅ Interview questions generated!');
    } catch (error) {
      setInterviewQuestions(`Error: ${error}`);
      setStatus('❌ Failed to generate questions.');
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'interview-prep', label: '🎯 Interview Prep', icon: '📋' },
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

          {/* Input Area */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your text:
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or paste your text here..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={availability !== 'available'}
            />
            <p className="text-sm text-gray-500 mt-1">
              {inputText.length} characters
            </p>
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
                    onClick={handleAnalyzeJobDescription}
                    disabled={loading || availability !== 'available'}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {loading && !interviewQuestions ? '⏳ Analyzing...' : '🔍 Analyze JD'}
                  </button>
                  <button
                    onClick={handleGenerateQuestions}
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
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <div>
                <p className="text-gray-600 mb-4">
                  Get AI-powered feedback on your interview responses, including analysis of clarity, structure, and communication style.
                </p>
                <button
                  onClick={handleGetFeedback}
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
