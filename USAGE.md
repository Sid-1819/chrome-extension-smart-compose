# InterviewCoach AI - Usage Guide

## Overview
InterviewCoach AI is a Chrome extension that provides AI-powered feedback and text assistance using **Chrome's built-in Prompt API with Gemini Nano** - an on-device AI model.

## ✨ Features

- 🚫 **No API Key Required** - Uses Chrome's built-in AI
- 🔒 **Privacy First** - Everything runs on your device
- ⚡ **Fast & Offline** - No internet needed after initial setup
- 🎯 **Smart Feedback** - Interview coaching, proofreading, summarization, and more

## Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Enable Prompt API (One-time Setup)

**Important:** You need to enable Chrome's Prompt API first.

See **[PROMPT_API_SETUP.md](PROMPT_API_SETUP.md)** for detailed instructions.

**Quick version:**
1. Go to `chrome://flags/#optimization-guide-on-device-model`
2. Set to "Enabled BypassPerfRequirement"
3. Go to `chrome://flags/#prompt-api-for-gemini-nano`
4. Set to "Enabled"
5. Restart Chrome
6. Wait for Gemini Nano to download (~1-2GB, one-time)

### 3. Build the Extension
```bash
pnpm run build
```

### 4. Load in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

## Features

### 1. Automatic Text Capture
The content script automatically detects and listens to:
- Text inputs (`<input type="text">`)
- Textareas (`<textarea>`)
- Contenteditable elements
- YouTube comment boxes
- Google Meet chat inputs

Text is captured when:
- User stops typing for 1 second
- User presses Enter

### 2. AI Feedback
Click the floating "Get AI Feedback" button to receive:
- Clarity and structure analysis
- Relevance assessment
- Communication style feedback
- Suggestions for improvement

### 3. Available Message Types

The background script supports the following message types:

#### REQUEST_FEEDBACK
Get AI feedback for interview practice.

```typescript
chrome.runtime.sendMessage({
  type: 'REQUEST_FEEDBACK',
  text: 'Your interview response here',
  url: window.location.href,
  timestamp: Date.now(),
  options: {
    context: 'Optional context about the question'
  }
}, (response) => {
  if (response.success) {
    console.log('Feedback:', response.feedback);
  }
});
```

#### IMPROVE_TEXT
Improve text with a specific style.

```typescript
chrome.runtime.sendMessage({
  type: 'IMPROVE_TEXT',
  text: 'Text to improve',
  options: {
    style: 'professional' // or 'casual', 'concise'
  }
}, (response) => {
  if (response.success) {
    console.log('Improved:', response.result);
  }
});
```

#### PROOFREAD
Check grammar, spelling, and punctuation.

```typescript
chrome.runtime.sendMessage({
  type: 'PROOFREAD',
  text: 'Text to proofread'
}, (response) => {
  if (response.success) {
    console.log('Proofread:', response.result);
  }
});
```

#### SUMMARIZE
Summarize text with specified length.

```typescript
chrome.runtime.sendMessage({
  type: 'SUMMARIZE',
  text: 'Long text to summarize',
  options: {
    length: 'medium' // or 'short', 'long'
  }
}, (response) => {
  if (response.success) {
    console.log('Summary:', response.result);
  }
});
```

#### TRANSLATE
Translate text to another language.

```typescript
chrome.runtime.sendMessage({
  type: 'TRANSLATE',
  text: 'Text to translate',
  options: {
    targetLanguage: 'Spanish'
  }
}, (response) => {
  if (response.success) {
    console.log('Translation:', response.result);
  }
});
```

## Architecture

### Content Script (`src/content/content.ts`)
- Monitors text inputs across all web pages
- Captures user input
- Displays floating feedback button
- Shows AI feedback in a modal panel
- Communicates with background script

### Background Script (`src/background/background.ts`)
- Listens for messages from content script
- Manages Gemini API client
- Processes AI requests
- Stores recent texts in Chrome storage
- Returns responses to content script

### Gemini Client (`src/utils/geminiClient.ts`)
- Handles all communication with Google Gemini API
- Provides methods for:
  - Interview feedback
  - Text improvement
  - Proofreading
  - Summarization
  - Translation

## File Structure

```
src/
├── content/
│   └── content.ts          # Content script
├── background/
│   └── background.ts       # Background service worker
├── utils/
│   └── geminiClient.ts     # Gemini API client
├── popup/
│   └── popup.tsx           # Extension popup UI
└── ...

public/
└── manifest.json           # Extension manifest

dist/                       # Built files (load this in Chrome)
├── content.js
├── background.js
├── manifest.json
└── ...
```

## Usage from Popup

To use the API from your popup, you can create a React component that sends messages:

```typescript
const handleGetFeedback = async (text: string) => {
  chrome.runtime.sendMessage({
    type: 'REQUEST_FEEDBACK',
    text: text
  }, (response) => {
    if (response.success) {
      setFeedback(response.feedback);
    } else {
      setError(response.error);
    }
  });
};
```

## Error Handling

All message handlers return a response with this structure:

```typescript
// Success
{
  success: true,
  feedback?: string,  // For REQUEST_FEEDBACK
  result?: string     // For other operations
}

// Error
{
  success: false,
  error: string
}
```

## Development

### Watch Mode
```bash
pnpm run dev
```

### Build
```bash
pnpm run build
```

### Lint
```bash
pnpm run lint
```

## Troubleshooting

### "Prompt API not supported" Error
**Solution:**
- Make sure you're using Chrome 127+ (check `chrome://version/`)
- Enable required flags (see [PROMPT_API_SETUP.md](PROMPT_API_SETUP.md))
- Try Chrome Dev, Canary, or Beta channels

### "Gemini Nano is not available" Error
**Possible causes:**
1. Flags not enabled correctly
2. Chrome not restarted after enabling flags
3. Model still downloading
4. Device doesn't meet requirements

**Solution:**
1. Verify flags are enabled at:
   - `chrome://flags/#optimization-guide-on-device-model`
   - `chrome://flags/#prompt-api-for-gemini-nano`
2. Restart Chrome
3. Wait for download to complete (check notifications)
4. Test in console:
   ```javascript
   await window.LanguageModel.availability()
   ```

### Model Still Downloading
- Check Chrome is running in foreground
- Verify internet connection
- Check disk space (need 1-2GB free)
- Monitor progress in extension notifications

### Content Script Not Loading
- Check that the extension is enabled in `chrome://extensions/`
- Reload the webpage after installing the extension
- Check the console for any error messages

### Background Script Errors
- Open `chrome://extensions/`
- Click "Inspect views: service worker" under your extension
- Check the console for errors
- Verify Gemini Nano is downloaded and available

## Performance & Privacy

### On-Device Processing
- All AI processing happens **locally on your device**
- No data is sent to external servers
- Works completely offline (after initial model download)

### Session Management
- Sessions are reused for efficiency
- Each session has a context window (~4000 tokens)
- Unused sessions are automatically cleaned up
- Monitor usage with:
  ```javascript
  geminiClient.getUsage()
  ```

### Resource Usage
- Model size: ~1-2GB (downloaded once)
- RAM usage: ~500MB-1GB during active use
- CPU usage: Minimal (optimized for efficiency)
