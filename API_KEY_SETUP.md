# ⚠️ API Key No Longer Needed!

## 🎉 Good News!

This extension now uses **Chrome's Prompt API with Gemini Nano** - an on-device AI model that runs locally in your browser.

**You don't need an API key anymore!**

## What Changed?

- ❌ ~~External Gemini API~~ (required API key)
- ✅ **Chrome Prompt API** (no API key needed!)

## Setup Instructions

Please see **[PROMPT_API_SETUP.md](PROMPT_API_SETUP.md)** for the new setup instructions.

---

# Old API Key Setup Guide (DEPRECATED)

## Quick Setup (Developer Console)

The easiest way to set your Gemini API key for testing is through the browser console:

### Method 1: From Extension Popup Console

1. Click on the extension icon to open the popup
2. Right-click anywhere in the popup → "Inspect"
3. Go to the Console tab
4. Run this command:

```javascript
chrome.storage.sync.set({ geminiApiKey: 'YOUR_API_KEY_HERE' }, () => {
  console.log('API key saved!');
});
```

### Method 2: From Any Webpage Console

1. Open any webpage
2. Press F12 to open DevTools
3. Go to the Console tab
4. Run the same command:

```javascript
chrome.storage.sync.set({ geminiApiKey: 'YOUR_API_KEY_HERE' }, () => {
  console.log('API key saved!');
});
```

### Verify API Key is Set

```javascript
chrome.storage.sync.get(['geminiApiKey'], (result) => {
  if (result.geminiApiKey) {
    console.log('API key is set:', result.geminiApiKey.substring(0, 10) + '...');
  } else {
    console.log('API key not found');
  }
});
```

## Production Setup (Settings Page)

For a production extension, you should add a settings page. Here's a simple example:

### Create a Settings Page (`src/settings/settings.html`)

```html
<!DOCTYPE html>
<html>
<head>
  <title>InterviewCoach AI Settings</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      max-width: 500px;
      margin: 0 auto;
    }
    .container {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #667eea;
      margin-top: 0;
    }
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #2d3748;
    }
    input {
      width: 100%;
      padding: 10px;
      border: 2px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
    }
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 16px;
    }
    button:hover {
      opacity: 0.9;
    }
    .message {
      margin-top: 12px;
      padding: 10px;
      border-radius: 6px;
      display: none;
    }
    .message.success {
      background: #c6f6d5;
      color: #22543d;
      display: block;
    }
    .message.error {
      background: #fed7d7;
      color: #742a2a;
      display: block;
    }
    .help-text {
      color: #718096;
      font-size: 13px;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚙️ Settings</h1>

    <label for="apiKey">Gemini API Key</label>
    <input type="password" id="apiKey" placeholder="Enter your Gemini API key">
    <p class="help-text">
      Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a>
    </p>

    <button id="saveBtn">Save Settings</button>

    <div id="message" class="message"></div>
  </div>

  <script src="settings.js"></script>
</body>
</html>
```

### Create Settings Script (`src/settings/settings.ts`)

```typescript
// Load saved API key
document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const messageDiv = document.getElementById('message') as HTMLDivElement;

  // Load existing API key
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
  });

  // Save API key
  saveBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showMessage('Please enter an API key', 'error');
      return;
    }

    chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
      showMessage('API key saved successfully!', 'success');

      // Test the API key
      testApiKey(apiKey);
    });
  });

  function showMessage(text: string, type: 'success' | 'error') {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;

    if (type === 'success') {
      setTimeout(() => {
        messageDiv.className = 'message';
      }, 3000);
    }
  }

  async function testApiKey(apiKey: string) {
    // Optional: Test the API key by making a simple request
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'test' }] }]
          })
        }
      );

      if (response.ok) {
        showMessage('API key is valid and working!', 'success');
      } else {
        showMessage('API key saved, but validation failed. Please check your key.', 'error');
      }
    } catch (error) {
      console.error('Error testing API key:', error);
    }
  }
});
```

### Update manifest.json

Add an options page to the manifest:

```json
{
  "options_page": "settings.html",
  "options_ui": {
    "page": "settings.html",
    "open_in_tab": true
  }
}
```

### Update vite.config.ts

Add the settings page to the build:

```typescript
build: {
  rollupOptions: {
    input: {
      popup: resolve(__dirname, 'index.html'),
      settings: resolve(__dirname, 'settings.html'),
      content: resolve(__dirname, 'src/content/content.ts'),
      background: resolve(__dirname, 'src/background/background.ts'),
    },
    // ...
  }
}
```

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Select or create a Google Cloud project
5. Copy the API key
6. Paste it into the extension settings

## Security Best Practices

1. **Never hardcode API keys** in your source code
2. **Store in sync storage** - Chrome encrypts this data
3. **Don't log API keys** in console or error messages
4. **Use environment variables** during development
5. **Consider user authentication** for production apps
6. **Implement rate limiting** to prevent API abuse
7. **Monitor API usage** in Google Cloud Console

## Troubleshooting

### "API key not set" Error
- Make sure you've saved the API key using one of the methods above
- Check if the key is stored: `chrome.storage.sync.get(['geminiApiKey'], console.log)`

### "Invalid API key" Error
- Verify the API key is correct (no extra spaces)
- Check that the API is enabled in Google Cloud Console
- Ensure billing is set up (if required)

### API Not Responding
- Check your internet connection
- Verify Google AI services are operational
- Check the browser console for detailed error messages
- Review API quotas in Google Cloud Console
