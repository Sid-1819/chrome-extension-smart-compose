# InterviewCoach.AI - Chrome Extension

> AI-powered writing assistant using Chrome's built-in Gemini Nano (on-device AI)

[![Chrome Version](https://img.shields.io/badge/Chrome-127%2B-blue)](https://www.google.com/chrome/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 🚀 Features

- ✅ **No API Key Required** - Uses Chrome's built-in Prompt API
- 🔒 **100% Private** - All AI processing happens on your device
- ⚡ **Lightning Fast** - No network latency, works offline
- 🎯 **Interview Coaching** - Get AI feedback on your interview responses
- ✍️ **Text Improvement** - Enhance writing with professional/casual/concise styles
- 📝 **Proofreading** - Fix grammar, spelling, and punctuation
- 📊 **Summarization** - Create concise summaries of long text
- 🌍 **Translation** - Translate text to multiple languages
- 🎨 **Beautiful UI** - Floating feedback button with modal panel
- 🌐 **Works Everywhere** - YouTube, Google Meet, and all web pages

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
git clone <repository-url>
cd chrome-extension-smart-compose

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

### Automatic Text Capture

1. Visit any webpage (YouTube, Google Meet, or any site with text inputs)
2. Start typing in a text field
3. The floating **"Get AI Feedback"** button appears after you:
   - Stop typing for 1 second, OR
   - Press Enter

### Get AI Feedback

1. Click the **"Get AI Feedback"** button
2. Wait a moment for on-device AI processing
3. View feedback in a beautiful modal panel
4. Get insights on:
   - Clarity and structure
   - Relevance and completeness
   - Communication style
   - Actionable improvements

### From Popup/Code

```typescript
// Request feedback
chrome.runtime.sendMessage({
  type: 'REQUEST_FEEDBACK',
  text: 'Your text here'
}, (response) => {
  console.log(response.feedback);
});

// Improve text
chrome.runtime.sendMessage({
  type: 'IMPROVE_TEXT',
  text: 'Text to improve',
  options: { style: 'professional' }
}, (response) => {
  console.log(response.result);
});

// Proofread
chrome.runtime.sendMessage({
  type: 'PROOFREAD',
  text: 'Text with erors'
}, (response) => {
  console.log(response.result);
});

// Summarize
chrome.runtime.sendMessage({
  type: 'SUMMARIZE',
  text: 'Long text...',
  options: { length: 'medium' }
}, (response) => {
  console.log(response.result);
});

// Translate
chrome.runtime.sendMessage({
  type: 'TRANSLATE',
  text: 'Hello world',
  options: { targetLanguage: 'Spanish' }
}, (response) => {
  console.log(response.result);
});
```

## 🏗️ Architecture

```
src/
├── content/
│   └── content.ts          # Content script (monitors inputs, shows UI)
├── background/
│   └── background.ts       # Background worker (handles AI requests)
├── utils/
│   └── geminiClient.ts     # Prompt API client (manages AI sessions)
├── popup/
│   └── popup.tsx           # Extension popup UI
└── ...
```

### Message Flow

```
User Input → Content Script → Background Script → Prompt API → Gemini Nano
                                                                    ↓
User sees feedback ← Content Script ← Background Script ← AI Response
```

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

- [PROMPT_API_SETUP.md](PROMPT_API_SETUP.md) - Detailed setup instructions
- [USAGE.md](USAGE.md) - Complete usage guide with examples
- [API_KEY_SETUP.md](API_KEY_SETUP.md) - ~~Deprecated~~ (no API key needed!)

## 🔧 Troubleshooting

### "Prompt API not supported"
- Upgrade to Chrome 127+
- Try Chrome Dev/Canary/Beta
- Verify you enabled both required flags

### "Gemini Nano is not available"
- Check flags are enabled correctly
- Restart Chrome after enabling flags
- Wait for model download to complete
- Verify in console: `await window.LanguageModel.availability()`

### Model download stuck
- Keep Chrome running in foreground
- Check internet connection
- Ensure 1-2GB free disk space
- Check notifications for download progress

📖 **More help:** See [PROMPT_API_SETUP.md](PROMPT_API_SETUP.md#-troubleshooting)

## 🎨 Supported Sites

Works on **all websites**, with special detection for:
- ✅ YouTube (comments, search)
- ✅ Google Meet (chat)
- ✅ Any webpage with text inputs/textareas
- ✅ Contenteditable elements
- ✅ Rich text editors

## 🔒 Privacy & Security

- ✅ **100% On-Device** - All AI runs locally, nothing sent to servers
- ✅ **No API Keys** - No external API credentials needed
- ✅ **No Data Collection** - Your text never leaves your device
- ✅ **Works Offline** - Once model is downloaded, no internet needed
- ✅ **Open Source** - Fully auditable code

## ⚡ Performance

| Metric | Value |
|--------|-------|
| Model Size | 1-2GB (one-time download) |
| RAM Usage | 500MB-1GB (during use) |
| Response Time | <1s for most queries |
| Context Window | ~4000 tokens per session |
| Offline Capable | ✅ Yes |

## 🌟 Advanced Features

### Session Management
- Automatic session reuse for efficiency
- Context preservation across prompts
- Token usage monitoring
- Automatic cleanup of unused sessions

### Custom Configuration
```typescript
const client = new GeminiClient({
  temperature: 1.2,  // Creativity (0-2)
  topK: 40,          // Token selection (1-128)
  systemPrompt: 'You are a helpful assistant...'
});
```

### Download Progress
The extension shows notifications during Gemini Nano download:
- "Downloading AI Model: 45%"
- "AI Model Ready!"

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

## 📞 Support

- 📖 [Documentation](PROMPT_API_SETUP.md)
- 🐛 [Report Issues](https://github.com/your-repo/issues)
- 💬 [Discussions](https://github.com/your-repo/discussions)

## 🔮 Roadmap

- [ ] Add streaming responses for real-time feedback
- [ ] Support for more languages
- [ ] Custom system prompts per website
- [ ] Voice input support
- [ ] Image analysis capabilities
- [ ] Browser action popup with history
- [ ] Keyboard shortcuts

---

**Made with ❤️ using Chrome's built-in AI**
