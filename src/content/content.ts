/**
 * InterviewCoach.AI Content Script
 * Monitors text inputs on YouTube, Google Meet, and any webpage
 * Captures user input and sends it to background for AI feedback
 */

interface MessagePayload {
  type: 'TEXT_CAPTURED' | 'REQUEST_FEEDBACK';
  text: string;
  url: string;
  timestamp: number;
}

class InterviewCoachContentScript {
  private lastCapturedText: string = '';
  private feedbackIcon: HTMLElement | null = null;
  private typingTimer: number | null = null;
  private readonly TYPING_DELAY = 1000; // 1 second after user stops typing

  constructor() {
    this.init();
  }

  private init(): void {
    console.log('InterviewCoach.AI: Content script initialized');
    this.createFloatingIcon();
    this.attachInputListeners();
    this.detectPageType();
  }

  /**
   * Detect the type of page we're on for specialized handling
   */
  private detectPageType(): void {
    const url = window.location.href;

    if (url.includes('youtube.com')) {
      console.log('InterviewCoach.AI: YouTube detected');
      this.handleYouTube();
    } else if (url.includes('meet.google.com')) {
      console.log('InterviewCoach.AI: Google Meet detected');
      this.handleGoogleMeet();
    } else {
      console.log('InterviewCoach.AI: Generic webpage detected');
    }
  }

  /**
   * Handle YouTube-specific inputs (comments, search, etc.)
   */
  private handleYouTube(): void {
    // YouTube comment boxes load dynamically
    const observer = new MutationObserver(() => {
      const commentBoxes = document.querySelectorAll('#contenteditable-root, #simplebox-placeholder');
      commentBoxes.forEach(element => {
        if (!element.hasAttribute('data-coach-listener')) {
          element.setAttribute('data-coach-listener', 'true');
          element.addEventListener('input', this.handleInput.bind(this));
          element.addEventListener('keydown', this.handleKeyPress.bind(this) as EventListener);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Handle Google Meet-specific inputs (chat)
   */
  private handleGoogleMeet(): void {
    const observer = new MutationObserver(() => {
      const chatInputs = document.querySelectorAll('[aria-label*="chat" i], [placeholder*="message" i]');
      chatInputs.forEach(element => {
        if (!element.hasAttribute('data-coach-listener')) {
          element.setAttribute('data-coach-listener', 'true');
          element.addEventListener('input', this.handleInput.bind(this));
          element.addEventListener('keydown', this.handleKeyPress.bind(this) as EventListener);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Attach listeners to all text inputs and textareas on the page
   */
  private attachInputListeners(): void {
    // Listen for all existing inputs
    this.addListenersToExistingInputs();

    // Listen for dynamically added inputs
    const observer = new MutationObserver(() => {
      this.addListenersToExistingInputs();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Add listeners to all existing input elements
   */
  private addListenersToExistingInputs(): void {
    const inputs = document.querySelectorAll('input[type="text"], input[type="search"], textarea, [contenteditable="true"]');

    inputs.forEach(element => {
      if (!element.hasAttribute('data-coach-listener')) {
        element.setAttribute('data-coach-listener', 'true');
        element.addEventListener('input', this.handleInput.bind(this));
        element.addEventListener('keydown', this.handleKeyPress.bind(this) as EventListener);
      }
    });
  }

  /**
   * Handle input events (typing)
   */
  private handleInput(event: Event): void {
    const target = event.target as HTMLElement;

    // Clear previous timer
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    // Set new timer - capture text after user stops typing
    this.typingTimer = setTimeout(() => {
      this.captureText(target);
    }, this.TYPING_DELAY);
  }

  /**
   * Handle key press events (Enter key)
   */
  private handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      const target = event.target as HTMLElement;

      // Clear typing timer since we're submitting
      if (this.typingTimer) {
        clearTimeout(this.typingTimer);
      }

      // Capture immediately on Enter
      setTimeout(() => {
        this.captureText(target);
      }, 100);
    }
  }

  /**
   * Capture text from an input element
   */
  private captureText(element: HTMLElement): void {
    let text = '';

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      text = element.value;
    } else if (element.isContentEditable) {
      text = element.textContent || '';
    }

    text = text.trim();

    if (text && text.length > 0) {
      this.lastCapturedText = text;
      this.sendToBackground('TEXT_CAPTURED', text);
      this.showFeedbackIcon();
      console.log('InterviewCoach.AI: Text captured:', text.substring(0, 50) + '...');
    }
  }

  /**
   * Send message to background script
   */
  private sendToBackground(type: MessagePayload['type'], text: string): void {
    const message: MessagePayload = {
      type,
      text,
      url: window.location.href,
      timestamp: Date.now()
    };

    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.error('InterviewCoach.AI: Error sending message:', chrome.runtime.lastError);
      } else {
        console.log('InterviewCoach.AI: Message sent successfully:', response);
      }
    });
  }

  /**
   * Create floating feedback icon
   */
  private createFloatingIcon(): void {
    // Remove existing icon if present
    if (this.feedbackIcon) {
      this.feedbackIcon.remove();
    }

    // Create icon container
    const icon = document.createElement('div');
    icon.id = 'interview-coach-feedback-icon';
    icon.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
      </svg>
      <span>Get AI Feedback</span>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #interview-coach-feedback-icon {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 30px;
        cursor: pointer;
        z-index: 999999;
        display: none;
        align-items: center;
        gap: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        transition: all 0.3s ease;
        user-select: none;
      }

      #interview-coach-feedback-icon:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
      }

      #interview-coach-feedback-icon:active {
        transform: translateY(0);
      }

      #interview-coach-feedback-icon svg {
        width: 20px;
        height: 20px;
      }

      #interview-coach-feedback-icon.show {
        display: flex;
        animation: slideIn 0.3s ease;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(icon);
    this.feedbackIcon = icon;

    // Add click listener
    icon.addEventListener('click', () => {
      this.requestFeedback();
    });
  }

  /**
   * Show the feedback icon
   */
  private showFeedbackIcon(): void {
    if (this.feedbackIcon) {
      this.feedbackIcon.classList.add('show');
    }
  }

  /**
   * Request AI feedback for the last captured text
   */
  private async requestFeedback(): Promise<void> {
    if (!this.lastCapturedText) {
      console.warn('InterviewCoach.AI: No text captured yet');
      return;
    }

    // Show loading state
    if (this.feedbackIcon) {
      this.feedbackIcon.style.opacity = '0.6';
      this.feedbackIcon.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
          <path d="M12 2 A10 10 0 0 1 22 12" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
          </path>
        </svg>
        <span>Processing...</span>
      `;
    }

    try {
      const response = await this.sendToBackgroundAsync('REQUEST_FEEDBACK', this.lastCapturedText);

      if (response.success) {
        console.log('InterviewCoach.AI: Feedback received:', response.feedback);
        this.displayFeedback(response.feedback);
      } else {
        console.error('InterviewCoach.AI: Failed to get feedback:', response.error);
        this.displayError(response.error || 'Failed to get feedback');
      }
    } catch (error) {
      console.error('InterviewCoach.AI: Error requesting feedback:', error);
      this.displayError('Failed to connect to AI service');
    } finally {
      // Restore icon
      this.restoreFeedbackIcon();
    }
  }

  /**
   * Send message to background and wait for response
   */
  private sendToBackgroundAsync(type: MessagePayload['type'], text: string, options?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const message: MessagePayload = {
        type,
        text,
        url: window.location.href,
        timestamp: Date.now(),
        ...(options && { options })
      };

      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Display AI feedback to the user
   */
  private displayFeedback(feedback: string): void {
    // Create feedback panel
    const panel = document.createElement('div');
    panel.id = 'interview-coach-feedback-panel';
    panel.innerHTML = `
      <div class="feedback-header">
        <h3>AI Feedback</h3>
        <button class="close-btn">&times;</button>
      </div>
      <div class="feedback-content">
        ${this.formatFeedback(feedback)}
      </div>
      <div class="feedback-footer">
        <span class="original-text-label">Original text:</span>
        <p class="original-text">"${this.escapeHtml(this.lastCapturedText)}"</p>
      </div>
    `;

    // Add styles
    this.addFeedbackPanelStyles();

    // Add to page
    document.body.appendChild(panel);

    // Close button handler
    const closeBtn = panel.querySelector('.close-btn');
    closeBtn?.addEventListener('click', () => {
      panel.remove();
    });

    // Close on outside click
    panel.addEventListener('click', (e) => {
      if (e.target === panel) {
        panel.remove();
      }
    });
  }

  /**
   * Display error message
   */
  private displayError(error: string): void {
    const panel = document.createElement('div');
    panel.id = 'interview-coach-feedback-panel';

    // Check if it's a Prompt API setup error
    const isSetupError = error.includes('not supported') ||
                        error.includes('not available') ||
                        error.includes('chrome://flags');

    const setupInstructions = isSetupError ? `
      <div class="setup-instructions">
        <h4>Setup Required:</h4>
        <ol>
          <li>Open <code>chrome://flags/#optimization-guide-on-device-model</code></li>
          <li>Set it to <strong>"Enabled BypassPerfRequirement"</strong></li>
          <li>Open <code>chrome://flags/#prompt-api-for-gemini-nano</code></li>
          <li>Set it to <strong>"Enabled"</strong></li>
          <li>Restart Chrome</li>
          <li>The AI model will download automatically (may take a few minutes)</li>
        </ol>
      </div>
    ` : '';

    panel.innerHTML = `
      <div class="feedback-header error">
        <h3>${isSetupError ? 'Setup Required' : 'Error'}</h3>
        <button class="close-btn">&times;</button>
      </div>
      <div class="feedback-content">
        <p class="error-message">${this.escapeHtml(error)}</p>
        ${setupInstructions}
      </div>
    `;

    this.addFeedbackPanelStyles();
    document.body.appendChild(panel);

    const closeBtn = panel.querySelector('.close-btn');
    closeBtn?.addEventListener('click', () => {
      panel.remove();
    });
  }

  /**
   * Restore feedback icon to original state
   */
  private restoreFeedbackIcon(): void {
    if (this.feedbackIcon) {
      this.feedbackIcon.style.opacity = '1';
      this.feedbackIcon.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
        </svg>
        <span>Get AI Feedback</span>
      `;
    }
  }

  /**
   * Format feedback text with basic markdown support
   */
  private formatFeedback(text: string): string {
    return text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^(\d+\.)/gm, '<br>$1');
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Add styles for feedback panel
   */
  private addFeedbackPanelStyles(): void {
    if (document.getElementById('interview-coach-feedback-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'interview-coach-feedback-styles';
    style.textContent = `
      #interview-coach-feedback-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 1000000;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: slideIn 0.3s ease;
      }

      #interview-coach-feedback-panel .feedback-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      #interview-coach-feedback-panel .feedback-header.error {
        background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
      }

      #interview-coach-feedback-panel .feedback-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      #interview-coach-feedback-panel .close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 28px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;
      }

      #interview-coach-feedback-panel .close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      #interview-coach-feedback-panel .feedback-content {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
        line-height: 1.6;
        color: #2d3748;
      }

      #interview-coach-feedback-panel .feedback-content p {
        margin: 0 0 12px 0;
      }

      #interview-coach-feedback-panel .error-message {
        color: #c53030;
        font-weight: 600;
      }

      #interview-coach-feedback-panel .error-hint {
        color: #718096;
        font-size: 14px;
        margin-top: 12px;
      }

      #interview-coach-feedback-panel .feedback-footer {
        border-top: 1px solid #e2e8f0;
        padding: 16px 20px;
        background: #f7fafc;
      }

      #interview-coach-feedback-panel .original-text-label {
        font-size: 12px;
        color: #718096;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      #interview-coach-feedback-panel .original-text {
        margin: 8px 0 0 0;
        color: #4a5568;
        font-size: 14px;
        font-style: italic;
      }

      #interview-coach-feedback-panel .setup-instructions {
        margin-top: 16px;
        padding: 16px;
        background: #fff5f5;
        border-left: 4px solid #f56565;
        border-radius: 4px;
      }

      #interview-coach-feedback-panel .setup-instructions h4 {
        margin: 0 0 12px 0;
        color: #c53030;
        font-size: 16px;
      }

      #interview-coach-feedback-panel .setup-instructions ol {
        margin: 0;
        padding-left: 24px;
        color: #2d3748;
      }

      #interview-coach-feedback-panel .setup-instructions li {
        margin: 8px 0;
        line-height: 1.6;
      }

      #interview-coach-feedback-panel .setup-instructions code {
        background: #2d3748;
        color: #f7fafc;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 13px;
        font-family: 'Courier New', monospace;
      }

      #interview-coach-feedback-panel .setup-instructions strong {
        color: #c53030;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translate(-50%, -45%);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
      }
    `;

    document.head.appendChild(style);
  }
}

// Initialize the content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new InterviewCoachContentScript();
  });
} else {
  new InterviewCoachContentScript();
}
