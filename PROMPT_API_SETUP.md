# Prompt API Setup Guide

InterviewCoach.AI now uses Chrome's **Prompt API with Gemini Nano** - an on-device AI model that runs locally in your browser!

## 🎉 Benefits

- ✅ **No API Key Required** - No need for external API keys
- ✅ **Privacy First** - All processing happens on your device
- ✅ **Blazing Fast** - No network latency
- ✅ **No Rate Limits** - Use as much as you want
- ✅ **Works Offline** - Once downloaded, works without internet

## 🚀 Prerequisites

- **Chrome 127+** (Chrome Dev, Canary, or Beta recommended)
- **Operating System**: Windows 11+, macOS 13+, or Linux
- **RAM**: At least 4GB available (8GB+ recommended)
- **Storage**: ~1-2GB for the Gemini Nano model

## 📝 Setup Instructions

### Step 1: Enable Prompt API Flags

1. Open a new tab and navigate to:
   ```
   chrome://flags/#optimization-guide-on-device-model
   ```

2. Set the dropdown to: **"Enabled BypassPerfRequirement"**

3. Open another flag:
   ```
   chrome://flags/#prompt-api-for-gemini-nano
   ```

4. Set it to: **"Enabled"**

5. **Restart Chrome** (click the "Relaunch" button that appears)

### Step 2: Wait for Model Download

After restarting Chrome:

1. The Gemini Nano model will start downloading automatically
2. This is a **one-time download** of ~1-2GB
3. You'll see a download progress notification from the extension
4. Download time depends on your internet speed (typically 5-15 minutes)

### Step 3: Verify Installation

To check if Gemini Nano is ready:

1. Open Chrome DevTools (F12)
2. Go to the Console
3. Run this command:
   ```javascript
   (async () => {
     const status = await window.LanguageModel.availability();
     console.log('Gemini Nano status:', status);
   })();
   ```

Expected responses:
- `"available"` - ✅ Ready to use!
- `"downloading"` - ⏳ Still downloading, please wait
- `"unavailable"` - ❌ Check your flags and Chrome version

### Step 4: Test the Extension

1. Build and load the extension:
   ```bash
   pnpm run build
   ```

2. Load the `dist` folder in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

3. Visit any webpage and type in a text input
4. Click the "Get AI Feedback" button that appears
5. Enjoy on-device AI feedback!

## 🔧 Troubleshooting

### "Prompt API not supported" Error

**Solution:**
- Make sure you're using Chrome 127+ (check `chrome://version/`)
- Try Chrome Dev, Canary, or Beta channels
- Verify both flags are enabled correctly

### "Gemini Nano is not available" Error

**Possible causes:**
1. Flags not enabled - Double-check both flags
2. Need to restart - Make sure you restarted Chrome after enabling flags
3. Device limitations - Your device might not meet minimum requirements
4. Model not downloaded yet - Wait for the download to complete

**Try this:**
1. Open DevTools Console
2. Check availability:
   ```javascript
   await window.LanguageModel.availability()
   ```

### Model Still Downloading

If the model is stuck downloading:

1. Check your internet connection
2. Make sure Chrome is running in the foreground
3. Check disk space (need 1-2GB free)
4. Try clearing Chrome cache and restarting

### Session Creation Fails

If you get errors when creating a session:

1. Check console for detailed error messages
2. Verify model is fully downloaded (`availability()` returns `"available"`)
3. Try creating a simple test session:
   ```javascript
   const session = await window.LanguageModel.create();
   const result = await session.prompt("Hello!");
   console.log(result);
   ```

## 🔍 Advanced Configuration

### Checking Model Parameters

```javascript
const params = await window.LanguageModel.params();
console.log(params);
// {
//   defaultTopK: 3,
//   maxTopK: 128,
//   defaultTemperature: 1,
//   maxTemperature: 2
// }
```

### Custom Temperature & TopK

The extension uses default values, but you can modify them in `src/utils/geminiClient.ts`:

```typescript
const client = new GeminiClient({
  temperature: 1.2,  // Higher = more creative
  topK: 40          // Number of top tokens to consider
});
```

### Monitor Session Usage

```javascript
// In background script console
const usage = geminiClient.getUsage();
console.log(`Using ${usage.inputUsage} / ${usage.inputQuota} tokens`);
```

## 📊 Performance Tips

1. **Session Reuse**: The extension reuses sessions to save resources
2. **Context Window**: Each session has a token limit (~4000 tokens)
3. **Clone Sessions**: Heavy users can clone sessions to preserve context
4. **Destroy Sessions**: Unused sessions are automatically destroyed

## 🆘 Getting Help

### Check Extension Logs

1. Go to `chrome://extensions/`
2. Find "Smart Compose" extension
3. Click "Inspect views: service worker"
4. Check Console for errors

### Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Prompt API is not supported" | Chrome version too old | Upgrade to Chrome 127+ |
| "Gemini Nano is not available" | Model not ready | Enable flags, restart, wait for download |
| "Session destroyed" | Session was terminated | Don't reuse destroyed sessions |
| "No response from model" | Model failed to respond | Try again, check session usage |

## 🌐 Browser Compatibility

| Browser | Status |
|---------|--------|
| Chrome 127+ (Dev/Canary) | ✅ Fully Supported |
| Chrome 127+ (Beta) | ✅ Fully Supported |
| Chrome 127+ (Stable) | ⚠️ Requires flags |
| Chrome <127 | ❌ Not Supported |
| Edge | ⏳ Coming Soon |
| Other Browsers | ❌ Not Supported |

## 📚 Additional Resources

- [Chrome Prompt API Documentation](https://developer.chrome.com/docs/ai/built-in-apis)
- [Gemini Nano Announcement](https://developer.chrome.com/blog/on-device-ai)
- [GitHub Issues](https://github.com/anthropics/claude-code/issues) - Report bugs here

## 🔄 Updating

When Chrome updates the Prompt API or Gemini Nano:

1. Chrome will automatically download updates
2. No action needed from you
3. Extension will continue to work seamlessly

## 🎯 What's Next?

Once setup is complete, you can:

- Get AI feedback on interview responses
- Improve text with different styles (professional, casual, concise)
- Proofread your writing
- Summarize long text
- Translate to other languages

All powered by AI running **locally on your device**! 🚀
