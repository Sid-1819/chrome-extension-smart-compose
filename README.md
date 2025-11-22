# InterviewCoach AI - Chrome Extension

> AI-powered interview preparation assistant using Chrome's built-in Gemini Nano (on-device AI)

[![Chrome Version](https://img.shields.io/badge/Chrome-127%2B-blue)](https://www.google.com/chrome/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 🚀 Features

- ✅ **No API Key Required** - Uses Chrome's built-in Prompt API
- 🔒 **100% Private** - All AI processing happens on your device
- ⚡ **Lightning Fast** - No network latency, works offline
- 📋 **Job Description Analysis** - Extract key responsibilities, required skills, and technical stack
- 💭 **Interview Question Generator** - Generate tailored interview questions based on job descriptions
- 🎙️ **Mock Interview Practice** - Practice answering questions with voice or text input
- 🎤 **Voice Transcription** - Record your answers and get them transcribed using on-device AI
- 📄 **Resume Parsing** - Upload resumes in multiple formats (TXT, MD, PDF, DOCX, PNG, JPG)
- 🖼️ **Image Text Extraction** - Extract text from resume images using AI
- ✉️ **Cover Letter Generator** - Create personalized cover letters based on job descriptions and your resume
- 🎯 **AI Feedback & Rating** - Get detailed evaluation and ratings (out of 10) on your mock interview answers
- 🌐 **Context Menu Integration** - Right-click any job description on the web to analyze it instantly

## 🎯 Quick Start

### 1. Prerequisites

- **Chrome 127+** (Dev, Canary, or Beta recommended)
- **Operating System**: Windows 11+, macOS 13+, or Linux
- **RAM**: 4GB+ available (8GB+ recommended)
- **Storage**: 1-2GB free space for AI model

### 2. Enable Prompt API

1. Navigate to `chrome://flags/#optimization-guide-on-device-model`
2. Set to **"Enabled BypassPerfRequirement"**
3. Navigate to `chrome://flags/#prompt-api-for-gemini-nano`
4. Set to **"Enabled"**
5. **Restart Chrome**
6. Wait for Gemini Nano to download (~1-2GB, one-time)

📖 **Detailed setup guide:** [PROMPT_API_SETUP.md](PROMPT_API_SETUP.md)

### 3. Install Extension

```bash
# Clone repository
git clone https://github.com/Sid-1819/interview-coach-ai.git
cd interview-coach-ai

# Install dependencies
pnpm install

# Build extension
pnpm run build
```

### 4. Load in Chrome

1. Open `chrome://extensions/`
2. Enable **"Developer mode"**
3. Click **"Load unpacked"**
4. Select the `dist` folder

## 💡 How to Use

### Method 1: Using the Side Panel (Main Interface)

1. **Click the extension icon** in your Chrome toolbar to open the side panel
2. You'll see two tabs:
   - **Interview Prep** - Analyze job descriptions, generate questions, create cover letters
   - **Mock Interview** - Practice answering questions with voice or text

### Method 2: Context Menu (Quick Access)

1. **Select any job description text** on any webpage
2. **Right-click** and choose from the InterviewCoach AI menu:
   - 🔍 **Analyze Job Description** - Extracts key skills, responsibilities, and requirements
   - 💭 **Generate Interview Questions** - Creates tailored questions for the role
   - 💬 **Get Answer Feedback** - Get feedback on your interview answer
   - ✨ **Improve Text** - Improve any selected text
3. The side panel will open automatically with results

## 🎯 Feature Guide

### Interview Prep Tab

#### 1. Job Description Analysis
- Paste a job description in the text area
- Click **"Analyze JD"** to extract:
  - Key responsibilities
  - Must-have and nice-to-have skills
  - Technical stack requirements
  - Years of experience required
  - What to emphasize in the interview

#### 2. Interview Question Generation
- After pasting a job description, click **"Generate Questions"**
- Get 10 tailored questions categorized by:
  - Behavioral (STAR method)
  - Technical (specific to the role)
  - Situational/Problem-solving

#### 3. Resume & Cover Letter
- **Upload your resume** (supports TXT, MD, PDF, DOCX, or images)
  - Plain text files (TXT, MD) are processed instantly
  - PDF/DOCX files are parsed using cloud API
  - Image files (PNG, JPG) use on-device AI for text extraction
- **Create Cover Letter**:
  1. Analyze a job description first
  2. Upload/paste your resume
  3. Click **"Create Cover Letter"**
  4. Get a personalized, job-specific cover letter
  5. Click **"Copy"** to copy to clipboard

### Mock Interview Tab

#### 1. Use Generated Questions
- Questions from the Interview Prep tab automatically appear here
- Click any question to select it for practice

#### 2. Add Custom Questions
- Enter your own interview question in the custom question field
- Click **"Add"** to add it to the list

#### 3. Answer Questions
- **Type your answer** in the text area, OR
- **Use voice input**:
  1. Click **"Start Voice Recording"**
  2. Grant microphone permission if prompted
  3. Speak your answer clearly
  4. Click **"Stop Recording"** when done
  5. Your answer will be transcribed automatically

#### 4. Get AI Feedback
- Click **"Get AI Feedback & Rating"** after answering
- Receive detailed evaluation with:
  - **Rating** out of 10
  - **Strengths** in your answer
  - **Areas for Improvement** with actionable advice
  - **Key Takeaways** for next time
  - **Suggested Enhancement** (if needed)

#### 5. Navigate Questions
- Use **"Previous"** and **"Next"** buttons to move through questions
- Track your progress (e.g., "Question 3 of 10")

## 🏗️ Architecture

```
src/
├── App.tsx                  # Main UI (side panel with Interview Prep & Mock Interview tabs)
├── main.tsx                 # React entry point
├── mic-permission.tsx       # Microphone permission handler
├── background/
│   └── background.ts        # Background worker (context menus, storage, side panel)
├── content/
│   └── content.ts           # Content script (context menu integration, nudge badges)
├── utils/
│   └── geminiClient.ts      # Prompt API client (AI sessions, multimodal support)
└── ...
```

### Key Components

- **Side Panel (App.tsx)**: Main interface with two tabs
  - Interview Prep tab: Job description analysis, question generation, cover letter creation
  - Mock Interview tab: Question practice with voice/text input and AI feedback

- **GeminiClient**: Handles all AI operations using Chrome's Prompt API
  - Text generation (job analysis, questions, cover letters, feedback)
  - Audio transcription (voice recording → text)
  - Image text extraction (resume images → text)
  - Multimodal input support (text, audio, image)

- **Background Service**: Manages extension state
  - Context menu actions
  - Chrome storage
  - Side panel opening/closing

- **Content Script**: Integrates with web pages
  - Detects text selection for context menu
  - Shows nudge badges when actions are ready

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Development mode (watch)
pnpm run dev

# Build for production
pnpm run build

# Lint code
pnpm run lint

# Type check
pnpm run build  # (includes TypeScript check)
```

## 📚 Documentation

- [PROMPT_API_SETUP.md](PROMPT_API_SETUP.md) - Detailed setup instructions for Gemini Nano
- This README - Complete usage guide with all features explained

## 🔧 Troubleshooting

### Gemini Nano Setup Issues

#### "Prompt API not supported"
- Upgrade to Chrome 127+
- Try Chrome Dev/Canary/Beta
- Verify you enabled both required flags

#### "Gemini Nano is not available"
- Check flags are enabled correctly
- Restart Chrome after enabling flags
- Wait for model download to complete
- Verify in console: `await window.LanguageModel.availability()`

#### Model download stuck
- Keep Chrome running in foreground
- Check internet connection
- Ensure 1-2GB free disk space
- Check notifications for download progress

### Voice Recording Issues

#### Microphone permission denied
- Click the microphone icon in Chrome's address bar
- Select "Always allow" for this extension
- Reload the extension and try again

#### Recording fails or no audio captured
- Check if your microphone is working in other apps
- Try a different microphone if available
- Check Chrome's site settings (chrome://settings/content/microphone)

#### Transcription fails
- Ensure audio is clear and not too long (keep under 2 minutes)
- Speak clearly and at a moderate pace
- Check that Gemini Nano has audio input enabled

### Resume Parsing Issues

#### "Failed to parse resume"
- For PDF/DOCX: Ensure internet connection (uses cloud API)
- Try pasting the text directly instead
- For images: Ensure image is clear and text is readable

#### Text extraction incomplete
- Use high-resolution images
- Ensure good contrast between text and background
- Try uploading as PDF instead if available
- Manually paste missing sections

### Context Menu Not Working

#### Right-click menu doesn't show
- Refresh the webpage
- Make sure you've selected text before right-clicking
- Reload the extension (chrome://extensions → reload)

#### Side panel doesn't open
- Click the extension icon manually
- Check if popup blockers are interfering
- Try restarting Chrome

📖 **More help:** See [PROMPT_API_SETUP.md](PROMPT_API_SETUP.md#-troubleshooting)

## 🌐 Usage Across Websites

The extension works on **all websites** via:
- ✅ **Side Panel** - Always accessible by clicking the extension icon
- ✅ **Context Menu** - Right-click any selected text on any webpage
- ✅ **Job Boards** - Analyze job descriptions from LinkedIn, Indeed, Glassdoor, etc.
- ✅ **Company Career Pages** - Extract job requirements directly from career sites
- ✅ **Email** - Analyze job descriptions received via email

## 🔒 Privacy & Security

- ✅ **On-Device AI** - All AI processing (Gemini Nano) runs locally on your device
- ✅ **No API Keys** - No external API credentials needed for core features
- ✅ **Privacy-First** - Job descriptions, answers, and feedback never leave your device
- ✅ **Microphone Permission** - Voice recording stays on-device, only you control it
- ✅ **Open Source** - Fully auditable code
- ⚠️ **Resume Parsing** - PDF/DOCX files and image fallback use a cloud API for parsing
  - TXT/MD files are processed locally
  - Image resumes first attempt on-device extraction, fallback to cloud if needed
  - You can always paste text directly to avoid cloud processing

## ⚡ Performance

| Metric | Value |
|--------|-------|
| Model Size | 1-2GB (one-time download) |
| RAM Usage | 500MB-1GB (during AI use) |
| Response Time | <1-3s for most queries |
| Context Window | ~4000 tokens per session |
| Audio Transcription | ~2-5s (depends on length) |
| Image Text Extraction | ~3-8s (depends on complexity) |
| Resume Parsing (Cloud) | ~5-15s (PDF/DOCX) |
| Offline Capable | ✅ Yes (except PDF/DOCX parsing) |

## 🌟 Advanced Features

### Multimodal AI Support
- **Text Input**: Job descriptions, questions, answers
- **Audio Input**: Voice recording and transcription for interview practice
- **Image Input**: Extract text from resume images (PNG, JPG, etc.)
- All powered by Chrome's Prompt API with on-device processing

### Smart Session Management
- Automatic session reuse for efficiency
- Multimodal session initialization with audio and image support
- Context preservation across prompts
- Token usage monitoring

### Resume Parsing Pipeline
1. **Client-Side** (TXT, MD): Instant processing, no network needed
2. **On-Device AI** (Images): Attempts text extraction using Prompt API first
3. **Cloud API Fallback** (PDF, DOCX, Images): Uses Vercel API when needed
4. **Manual Paste**: Always available as an alternative

### Voice Recording Features
- Microphone permission handling with dedicated UI
- Supports multiple audio formats (WebM, OGG, MP4, WAV)
- Real-time recording status and feedback
- Automatic transcription using Gemini Nano's audio input
- No audio data sent to external servers

### Context Menu Integration
- Right-click any text on any webpage
- Instant analysis of selected job descriptions
- Side panel opens automatically with results
- Badge notifications for completed actions

## 🤝 Contributing

Contributions welcome! Please read the contributing guidelines first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- Uses Chrome's [Prompt API](https://developer.chrome.com/docs/ai/built-in-apis)
- Powered by [Gemini Nano](https://deepmind.google/technologies/gemini/nano/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Markdown rendering with [React Markdown](https://github.com/remarkjs/react-markdown)
- Resume parsing via [Vercel Functions](https://vercel.com/docs/functions)

## 📞 Support

- 📖 [Documentation](PROMPT_API_SETUP.md)
- 🐛 [Report Issues](https://github.com/Sid-1819/interview-coach-ai/issues)
- 💬 [Discussions](https://github.com/Sid-1819/interview-coach-ai/discussions)
- 💡 [GitHub Repository](https://github.com/Sid-1819/interview-coach-ai)

## 🔮 Roadmap

- [x] Voice input support with transcription
- [x] Image analysis for resume text extraction
- [x] Context menu integration
- [x] Side panel interface
- [ ] Streaming responses for real-time feedback
- [ ] Interview session history and progress tracking
- [ ] Export interview practice results
- [ ] Custom question templates
- [ ] Multiple resume profiles
- [ ] Company research integration
- [ ] Keyboard shortcuts for quick access
- [ ] Answer comparison (your answer vs. suggested improvements)
- [ ] STAR method structuring assistant
- [ ] Salary negotiation guidance

---

**Made with ❤️ using Chrome's built-in AI**
