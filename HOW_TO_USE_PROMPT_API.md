# How to Use Chrome's Prompt API

A comprehensive guide to using the Prompt API (Gemini Nano) in your Chrome Extension.

## 📋 Table of Contents

1. [What is the Prompt API?](#what-is-the-prompt-api)
2. [Setup Instructions](#setup-instructions)
3. [Basic Usage](#basic-usage)
4. [Advanced Features](#advanced-features)
5. [Real Examples from This Extension](#real-examples-from-this-extension)
6. [Troubleshooting](#troubleshooting)

---

## What is the Prompt API?

The **Prompt API** is Chrome's built-in interface to **Gemini Nano**, a lightweight AI model that runs **directly on your device**. This means:

- ✅ No API keys needed
- ✅ No server calls - 100% private
- ✅ Works offline (after initial download)
- ✅ Fast inference (~1s per request)
- ✅ No rate limits

---

## Setup Instructions

### Step 1: Enable Chrome Flags

Open these URLs in Chrome and enable the flags:

**Flag 1: Enable On-Device Model**
```
chrome://flags/#optimization-guide-on-device-model
```
Set to: **"Enabled BypassPerfRequirement"**

**Flag 2: Enable Prompt API**
```
chrome://flags/#prompt-api-for-gemini-nano
```
Set to: **"Enabled"**

### Step 2: Restart Chrome

Click the "Relaunch" button or close and reopen Chrome.

### Step 3: Wait for Model Download

The ~1-2GB Gemini Nano model will download automatically. This happens in the background and may take 5-15 minutes depending on your internet speed.

---

## Basic Usage

### 1. Check Availability

Before using the API, always check if it's available:

```javascript
// Check if Prompt API is supported
if (!('LanguageModel' in window)) {
  console.error('Prompt API not supported');
  return;
}

// Check model availability
const availability = await window.LanguageModel.availability();

console.log(availability);
// Possible values:
// - "available"   → Ready to use
// - "downloading" → Model is downloading
// - "unavailable" → Not available on this device
```

### 2. Create a Session

```javascript
// Get model parameters
const params = await window.LanguageModel.params();
console.log(params);
// {
//   defaultTopK: 3,
//   maxTopK: 128,
//   defaultTemperature: 1,
//   maxTemperature: 2
// }

// Create a session
const session = await window.LanguageModel.create({
  temperature: params.defaultTemperature,
  topK: params.defaultTopK
});

console.log('Session created!');
```

### 3. Prompt the Model

**Non-Streaming (Simple)**
```javascript
const result = await session.prompt('Write a haiku about coding');
console.log(result);
// "Lines of logic flow,
//  Debugging through the night,
//  Code compiles at dawn."
```

**Streaming (Real-time)**
```javascript
const stream = session.promptStreaming('Tell me a story');

for await (const chunk of stream) {
  console.log(chunk); // Shows progressive output
}
```

### 4. Clean Up

```javascript
// Destroy session when done
session.destroy();
```

---

## Advanced Features

### 1. System Prompts (Initial Prompts)

Give the model context before conversations:

```javascript
const session = await window.LanguageModel.create({
  initialPrompts: [
    {
      role: 'system',
      content: 'You are a helpful coding assistant specialized in JavaScript.'
    },
    {
      role: 'user',
      content: 'What is a closure?'
    },
    {
      role: 'assistant',
      content: 'A closure is a function that has access to variables in its outer scope...'
    }
  ]
});

// Now ask follow-up questions
const answer = await session.prompt('Can you give me an example?');
```

### 2. Multi-turn Conversations

Keep context across multiple prompts:

```javascript
const session = await window.LanguageModel.create({
  initialPrompts: [
    { role: 'system', content: 'You are a friendly assistant.' }
  ]
});

// First prompt
const response1 = await session.prompt('My name is Alice');
// "Nice to meet you, Alice!"

// Second prompt - remembers context
const response2 = await session.prompt('What is my name?');
// "Your name is Alice!"
```

### 3. Response Constraints (JSON Schema)

Force the model to return structured data:

```javascript
const schema = {
  type: "object",
  properties: {
    sentiment: { type: "string", enum: ["positive", "negative", "neutral"] },
    score: { type: "number", minimum: 0, maximum: 1 }
  },
  required: ["sentiment", "score"]
};

const result = await session.prompt(
  'Analyze the sentiment: "I love this extension!"',
  { responseConstraint: schema }
);

const data = JSON.parse(result);
console.log(data);
// { sentiment: "positive", score: 0.95 }
```

### 4. Monitor Download Progress

```javascript
const session = await window.LanguageModel.create({
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${(e.loaded * 100).toFixed(1)}%`);
    });
  }
});
```

### 5. Token Usage Tracking

```javascript
console.log(`Used: ${session.inputUsage}`);
console.log(`Quota: ${session.inputQuota}`);
console.log(`Remaining: ${session.inputQuota - session.inputUsage}`);
```

### 6. Clone Sessions

Save resources by cloning instead of creating new sessions:

```javascript
const originalSession = await window.LanguageModel.create({
  initialPrompts: [
    { role: 'system', content: 'You are a helpful assistant.' }
  ]
});

// Clone preserves initial prompts but resets conversation
const clonedSession = await originalSession.clone();
```

### 7. Abort Requests

```javascript
const controller = new AbortController();

// Set up abort button
document.getElementById('stopButton').onclick = () => {
  controller.abort();
};

// Use signal in prompt
const result = await session.prompt('Write a long story', {
  signal: controller.signal
});
```

---

## Real Examples from This Extension

### Example 1: Get Interview Feedback

```typescript
// src/utils/geminiClient.ts
async getInterviewFeedback(userText: string, context?: string): Promise<string> {
  const systemPrompt = `You are an expert interview coach helping candidates improve their responses.
Analyze the following response and provide constructive feedback on:
1. Clarity and structure
2. Relevance and completeness
3. Communication style
4. Suggestions for improvement

Be encouraging but honest. Keep feedback concise and actionable.`;

  let prompt = `User's response: "${userText}"`;
  if (context) {
    prompt += `\n\nContext: ${context}`;
  }
  prompt += '\n\nProvide your feedback:';

  return this.generateContent(prompt, systemPrompt);
}
```

### Example 2: Improve Text with Style

```typescript
// src/utils/geminiClient.ts
async improveText(text: string, style?: 'professional' | 'casual' | 'concise'): Promise<string> {
  const stylePrompts = {
    professional: 'Make this text more professional and polished',
    casual: 'Make this text more casual and friendly',
    concise: 'Make this text more concise while keeping the key points'
  };

  const systemPrompt = stylePrompts[style || 'professional'];
  const prompt = `Original text: "${text}"\n\nImproved version:`;

  return this.generateContent(prompt, systemPrompt);
}
```

### Example 3: Background Script Integration

```typescript
// src/background/background.ts
private async handleFeedbackRequest(message: MessagePayload): Promise<string> {
  // Ensure Gemini client is initialized
  if (!this.geminiClient) {
    this.geminiClient = await createGeminiClient();
  }

  // Get AI feedback
  const feedback = await this.geminiClient.getInterviewFeedback(
    message.text,
    message.options?.context || message.url
  );

  return feedback;
}
```

### Example 4: Popup UI with React

```typescript
// src/App.tsx
async function handleGetFeedback() {
  setLoading(true);

  chrome.runtime.sendMessage({
    type: 'REQUEST_FEEDBACK',
    text: inputText
  }, (response) => {
    setLoading(false);
    if (response && response.success) {
      setFeedbackResult(response.feedback);
    }
  });
}
```

---

## Troubleshooting

### Issue: "LanguageModel is not defined"

**Cause:** Prompt API not enabled or Chrome version too old.

**Solution:**
1. Check Chrome version: `chrome://version/` (need 127+)
2. Enable both flags (see Setup Instructions)
3. Restart Chrome

### Issue: availability() returns "downloading"

**Cause:** Model is still downloading.

**Solution:**
- Wait 5-15 minutes for download to complete
- Keep Chrome running in foreground
- Check disk space (need 1-2GB free)
- Monitor with:
  ```javascript
  setInterval(async () => {
    const status = await window.LanguageModel.availability();
    console.log('Status:', status);
  }, 5000);
  ```

### Issue: availability() returns "unavailable"

**Possible Causes:**
1. Flags not enabled correctly
2. Chrome not restarted after enabling flags
3. Device doesn't meet minimum requirements
4. Download failed

**Solution:**
1. Double-check both flags are enabled
2. Restart Chrome completely
3. Check console for errors
4. Try clearing Chrome cache and restarting

### Issue: Session creation fails

**Solution:**
```javascript
try {
  const session = await window.LanguageModel.create();
} catch (error) {
  console.error('Session creation failed:', error);

  // Check availability again
  const status = await window.LanguageModel.availability();
  console.log('Current status:', status);
}
```

### Issue: Prompts timing out

**Possible Causes:**
- Very long input
- Complex processing
- Session quota exceeded

**Solution:**
```javascript
// Use abort signal with timeout
const controller = new AbortController();
setTimeout(() => controller.abort(), 10000); // 10s timeout

try {
  const result = await session.prompt(text, {
    signal: controller.signal
  });
} catch (error) {
  console.error('Timeout or error:', error);
}
```

---

## Best Practices

### 1. Always Check Availability First

```javascript
const availability = await window.LanguageModel.availability();
if (availability !== 'available') {
  // Show setup instructions to user
  return;
}
```

### 2. Reuse Sessions

```javascript
// ❌ Bad: Creating new session for each request
for (const text of texts) {
  const session = await window.LanguageModel.create();
  await session.prompt(text);
  session.destroy();
}

// ✅ Good: Reuse session
const session = await window.LanguageModel.create();
for (const text of texts) {
  await session.prompt(text);
}
session.destroy();
```

### 3. Monitor Token Usage

```javascript
if (session.inputUsage / session.inputQuota > 0.8) {
  console.warn('Session quota 80% used');
  // Consider creating a new session
}
```

### 4. Handle Errors Gracefully

```javascript
try {
  const result = await session.prompt(text);
  return result;
} catch (error) {
  console.error('Prompt failed:', error);

  // Try recreating session
  session.destroy();
  session = await window.LanguageModel.create();

  // Retry once
  return await session.prompt(text);
}
```

### 5. Clean Up Resources

```javascript
// When component unmounts or user leaves page
window.addEventListener('beforeunload', () => {
  if (session) {
    session.destroy();
  }
});
```

---

## Additional Resources

- [Chrome Prompt API Documentation](https://developer.chrome.com/docs/ai/built-in-apis)
- [Gemini Nano Announcement](https://developer.chrome.com/blog/on-device-ai)
- [Web AI CG](https://github.com/webmachinelearning/proposals/issues/4)

---

**Happy coding with on-device AI!** 🚀
