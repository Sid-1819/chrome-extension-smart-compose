import { useState, useEffect } from "react";
import "./App.css";
import { GeminiClient } from "./utils/geminiClient";

function App() {
  const [status, setStatus] = useState("Checking Prompt API availability...");
  const [availability, setAvailability] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [feedbackResult, setFeedbackResult] = useState("");
  const [improveResult, setImproveResult] = useState("");
  const [proofreadResult, setProofreadResult] = useState("");
  const [summarizeResult, setSummarizeResult] = useState("");
  const [translateResult, setTranslateResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'feedback' | 'improve' | 'proofread' | 'summarize' | 'translate'>('feedback');
  const [geminiClient, setGeminiClient] = useState<GeminiClient | null>(null);

  // Check Prompt API availability on mount
  useEffect(() => {
    checkAvailability();
  }, []);

  async function checkAvailability() {
    try {
      if (!('LanguageModel' in window)) {
        setStatus("❌ Prompt API not supported. Please use Chrome 127+ and enable flags.");
        setAvailability("unavailable");
        return;
      }

      const availabilityStatus = await (window as any).LanguageModel.availability();
      setAvailability(availabilityStatus);

      if (availabilityStatus === 'available') {
        setStatus("✅ Gemini Nano is ready! Try the features below.");
      } else if (availabilityStatus === 'downloading') {
        setStatus("⏳ Gemini Nano is downloading... Please wait (this may take a few minutes).");
        // Poll for completion
        pollForAvailability();
      } else {
        setStatus("❌ Gemini Nano not available. Check setup instructions below.");
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setStatus("❌ Error checking Prompt API. Make sure flags are enabled.");
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

  async function handleProofread() {
    if (!inputText.trim()) {
      alert('Please enter some text first!');
      return;
    }

    setLoading(true);
    setProofreadResult('');
    setStatus('📝 Proofreading text...');

    try {
      // Initialize client if not already done
      let client = geminiClient;
      if (!client) {
        client = new GeminiClient();
        await client.initializeSession();
        setGeminiClient(client);
      }

      const proofread = await client.proofread(inputText);
      setProofreadResult(proofread);
      setStatus('✅ Proofreading complete!');
    } catch (error) {
      setProofreadResult(`Error: ${error}`);
      setStatus('❌ Failed to proofread.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSummarize(length: 'short' | 'medium' | 'long') {
    if (!inputText.trim()) {
      alert('Please enter some text first!');
      return;
    }

    setLoading(true);
    setSummarizeResult('');
    setStatus(`📊 Creating ${length} summary...`);

    try {
      // Initialize client if not already done
      let client = geminiClient;
      if (!client) {
        client = new GeminiClient();
        await client.initializeSession();
        setGeminiClient(client);
      }

      const summary = await client.summarize(inputText, length);
      setSummarizeResult(summary);
      setStatus('✅ Summary created!');
    } catch (error) {
      setSummarizeResult(`Error: ${error}`);
      setStatus('❌ Failed to summarize.');
    } finally {
      setLoading(false);
    }
  }

  async function handleTranslate(targetLanguage: string) {
    if (!inputText.trim()) {
      alert('Please enter some text first!');
      return;
    }

    if (!targetLanguage.trim()) {
      alert('Please enter a target language!');
      return;
    }

    setLoading(true);
    setTranslateResult('');
    setStatus(`🌍 Translating to ${targetLanguage}...`);

    try {
      // Initialize client if not already done
      let client = geminiClient;
      if (!client) {
        client = new GeminiClient();
        await client.initializeSession();
        setGeminiClient(client);
      }

      const translation = await client.translate(inputText, targetLanguage);
      setTranslateResult(translation);
      setStatus('✅ Translation complete!');
    } catch (error) {
      setTranslateResult(`Error: ${error}`);
      setStatus('❌ Failed to translate.');
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'feedback', label: '🎯 Interview Feedback', icon: '💬' },
    { id: 'improve', label: '✍️ Improve Text', icon: '✨' },
    { id: 'proofread', label: '📝 Proofread', icon: '✓' },
    { id: 'summarize', label: '📊 Summarize', icon: '📄' },
    { id: 'translate', label: '🌍 Translate', icon: '🗣️' }
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            InterviewCoach.AI
          </h1>
          <p className="text-gray-600">AI-Powered Writing Assistant • On-Device • No API Key Needed</p>
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
              <ol className="list-decimal ml-5 space-y-1">
                <li>Open <code className="bg-gray-800 text-white px-2 py-0.5 rounded">chrome://flags/#optimization-guide-on-device-model</code></li>
                <li>Set to <strong>"Enabled BypassPerfRequirement"</strong></li>
                <li>Open <code className="bg-gray-800 text-white px-2 py-0.5 rounded">chrome://flags/#prompt-api-for-gemini-nano</code></li>
                <li>Set to <strong>"Enabled"</strong></li>
                <li>Restart Chrome</li>
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

            {/* Proofread Tab */}
            {activeTab === 'proofread' && (
              <div>
                <p className="text-gray-600 mb-4">
                  Check grammar, spelling, and punctuation errors.
                </p>
                <button
                  onClick={handleProofread}
                  disabled={loading || availability !== 'available'}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {loading ? '⏳ Processing...' : '📝 Proofread Text'}
                </button>
                {proofreadResult && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-2">Proofread Version:</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{proofreadResult}</p>
                  </div>
                )}
              </div>
            )}

            {/* Summarize Tab */}
            {activeTab === 'summarize' && (
              <div>
                <p className="text-gray-600 mb-4">
                  Create summaries of different lengths.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleSummarize('short')}
                    disabled={loading || availability !== 'available'}
                    className="bg-yellow-600 text-white py-3 rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    📄 Short
                  </button>
                  <button
                    onClick={() => handleSummarize('medium')}
                    disabled={loading || availability !== 'available'}
                    className="bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    📋 Medium
                  </button>
                  <button
                    onClick={() => handleSummarize('long')}
                    disabled={loading || availability !== 'available'}
                    className="bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    📰 Long
                  </button>
                </div>
                {summarizeResult && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h3 className="font-semibold text-yellow-900 mb-2">Summary:</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{summarizeResult}</p>
                  </div>
                )}
              </div>
            )}

            {/* Translate Tab */}
            {activeTab === 'translate' && (
              <div>
                <p className="text-gray-600 mb-4">
                  Translate text to another language.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    onClick={() => handleTranslate('Spanish')}
                    disabled={loading || availability !== 'available'}
                    className="bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    🇪🇸 Spanish
                  </button>
                  <button
                    onClick={() => handleTranslate('French')}
                    disabled={loading || availability !== 'available'}
                    className="bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    🇫🇷 French
                  </button>
                  <button
                    onClick={() => handleTranslate('German')}
                    disabled={loading || availability !== 'available'}
                    className="bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    🇩🇪 German
                  </button>
                  <button
                    onClick={() => handleTranslate('Japanese')}
                    disabled={loading || availability !== 'available'}
                    className="bg-pink-600 text-white py-3 rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    🇯🇵 Japanese
                  </button>
                </div>
                {translateResult && (
                  <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h3 className="font-semibold text-indigo-900 mb-2">Translation:</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{translateResult}</p>
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
