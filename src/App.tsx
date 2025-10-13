import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState("");
  const [summarizerResult, setSummarizerResult] = useState("");
  const [streamingResult, setStreamingResult] = useState("");

  async function handleRun() {
    try {
      setStatus("Checking model availability...");
      console.log("Checking availability...");

      const availability = await LanguageModel.availability();
      console.log("Availability:", availability);
      setStatus(`Model status: ${availability}`);

      if (availability === "unavailable") {
        setStatus("Gemini Nano not supported on this device.");
        return;
      }

      setStatus("Creating session...");
      console.log("Creating language model session...");

      const session = await LanguageModel.create({
        language: "en",
        monitor(monitor) {
          console.log("Monitor attached");
          monitor.addEventListener("downloadprogress", (e: any) => {
            console.log("Download progress:", e.loaded);
            setStatus(`Downloading model: ${(e.loaded * 100).toFixed(1)}%`);
          });
        },
      });

      console.log("Session created successfully");
      setStatus("Running prompt...");
      const output = await session.prompt(
        "Write a one-line poem about the Chrome Prompt API."
      );

      console.log("Prompt completed");
      setResult(output);
      setStatus("Done!");
    } catch (err: any) {
      console.error("Error:", err);
      setStatus("Error: " + err.message);
    }
  }

  async function handleSummarizer() {
    try {
      setStatus("Checking model availability...");
      console.log("Checking availability...");

      const availability = await Summarizer.availability();
      console.log("Availability:", availability);
      setStatus(`Model status: ${availability}`);

      if (availability === "unavailable") {
        setStatus("Summarizer not supported on this device.");
        return;
      }

      setStatus("Creating session...");
      console.log("Creating summarizer session...");

      const session = await Summarizer.create({
        sharedContext: 'This is a technical article',
        type: 'key-points',
        format: 'markdown',
        length: 'medium',
        monitor(monitor) {
          monitor.addEventListener('downloadprogress', (e) => {
            console.log(`Downloaded ${e.loaded * 100}%`);
            setStatus(`Downloading model: ${(e.loaded * 100).toFixed(1)}%`);
          });
        }
      });

      console.log("Session created successfully");
      setStatus("Running batch summarization...");
      
      const longText = "The Chrome Prompt API allows developers to integrate advanced language models directly into web applications, enabling features like text generation, summarization, and more, all while ensuring user data privacy by running models locally on the user's device. This revolutionary approach eliminates the need for server-side processing and ensures that sensitive user data never leaves their device. The API provides multiple capabilities including text generation through Gemini Nano, text summarization for creating concise versions of long content, and various other AI-powered features that can enhance user experiences across web applications.";
      
      const output = await session.summarize(longText, {
        context: 'This article is intended for a tech-savvy audience.'
      });

      console.log("Batch summarization completed");
      setSummarizerResult(output);
      setStatus("Done!");
    } catch (err: any) {
      console.error("Error:", err);
      setStatus("Error: " + err.message);
    }
  }

  async function handleStreamingSummarizer() {
    try {
      setStatus("Checking model availability...");
      setStreamingResult("");

      const availability = await Summarizer.availability();
      if (availability === "unavailable") {
        setStatus("Summarizer not supported on this device.");
        return;
      }

      setStatus("Creating session...");
      const session = await Summarizer.create({
        sharedContext: 'This is a technical article for developers',
        type: 'tldr',
        format: 'plain-text',
        length: 'short',
        monitor(monitor) {
          monitor.addEventListener('downloadprogress', (e) => {
            setStatus(`Downloading model: ${(e.loaded * 100).toFixed(1)}%`);
          });
        }
      });

      setStatus("Running streaming summarization...");
      
      const longText = "The Chrome Prompt API allows developers to integrate advanced language models directly into web applications, enabling features like text generation, summarization, and more, all while ensuring user data privacy by running models locally on the user's device. This revolutionary approach eliminates the need for server-side processing and ensures that sensitive user data never leaves their device. The API provides multiple capabilities including text generation through Gemini Nano, text summarization for creating concise versions of long content, and various other AI-powered features that can enhance user experiences across web applications. Developers can now build intelligent applications that respect user privacy while providing powerful AI capabilities.";
      
      const stream = session.summarizeStreaming(longText, {
        context: 'This article is intended for junior developers.'
      });

      let fullResult = "";
      for await (const chunk of stream) {
        fullResult += chunk;
        setStreamingResult(fullResult);
        console.log("Streaming chunk:", chunk);
      }

      setStatus("Streaming summarization completed!");
    } catch (err: any) {
      console.error("Error:", err);
      setStatus("Error: " + err.message);
    }
  }

  return (
    <>
      <div className="flex justify-center gap-8 my-8">
        <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
          <img
            src={viteLogo}
            className="h-24 w-24 transition-transform hover:scale-110"
            alt="Vite logo"
          />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          <img
            src={reactLogo}
            className="h-24 w-24 transition-transform hover:scale-110"
            alt="React logo"
          />
        </a>
      </div>

      <h1 className="text-4xl font-bold text-center mb-6">Vite + React</h1>

      <div className="card bg-white rounded-lg shadow p-6 mx-auto max-w-md text-center">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors mb-4"
          onClick={() => setCount((c) => c + 1)}
        >
          count is {count}
        </button>

        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors mb-4"
          onClick={handleRun}
        >
          Run Gemini Nano
        </button>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors mb-4 mr-2"
          onClick={handleSummarizer}
        >
          Batch Summarizer
        </button>

        <button
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors mb-4"
          onClick={handleStreamingSummarizer}
        >
          Streaming Summarizer
        </button>


        <p>{status}</p>
        {result && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-left">
            <h3 className="font-semibold mb-2">Language Model Result:</h3>
            <p>{result}</p>
          </div>
        )}
        {summarizerResult && (
          <div className="mt-4 p-2 bg-blue-50 rounded text-left">
            <h3 className="font-semibold mb-2">Batch Summary:</h3>
            <p>{summarizerResult}</p>
          </div>
        )}
        {streamingResult && (
          <div className="mt-4 p-2 bg-purple-50 rounded text-left">
            <h3 className="font-semibold mb-2">Streaming Summary:</h3>
            <p>{streamingResult}</p>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
