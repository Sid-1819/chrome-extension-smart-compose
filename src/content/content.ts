/**
 * InterviewCoach.AI Content Script
 * Monitors text inputs on YouTube, Google Meet, and any webpage
 * Captures user input and sends it to background for AI feedback
 * Injects sidebar for interview prep features
 */

interface MessagePayload {
  type: 'TEXT_CAPTURED' | 'REQUEST_FEEDBACK' | 'OPEN_SIDEBAR' | 'SHOW_NUDGE' | 'HIDE_NUDGE' | 'PING';
  text?: string;
  url?: string;
  timestamp?: number;
  action?: string;
  badgeText?: string;
  badgeTitle?: string;
}

/**
 * Sidebar Panel for Interview Prep
 */
class InterviewCoachSidebar {
  private sidebar: HTMLElement | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private isVisible: boolean = false;

  constructor() {
    console.log('InterviewCoach.AI: Sidebar class initialized');
    this.createSidebar();
    this.setupMessageListener();
  }

  private createSidebar(): void {
    // Check if sidebar already exists
    const existing = document.getElementById('interview-coach-sidebar');
    if (existing) {
      console.log('InterviewCoach.AI: Sidebar already exists, reusing');
      this.sidebar = existing;
      this.iframe = document.getElementById('interview-coach-iframe') as HTMLIFrameElement;
      return;
    }

    // Create sidebar container
    const sidebar = document.createElement('div');
    sidebar.id = 'interview-coach-sidebar';
    sidebar.className = 'interview-coach-sidebar-hidden';

    // Create header with close button
    const header = document.createElement('div');
    header.className = 'interview-coach-sidebar-header';
    header.innerHTML = `
      <div class="interview-coach-sidebar-title">
        <span class="interview-coach-logo">🎯</span>
        <span>InterviewCoach.AI</span>
      </div>
      <button class="interview-coach-close-btn" id="interview-coach-close">✕</button>
    `;

    // Create iframe to load extension popup
    const iframe = document.createElement('iframe');
    iframe.id = 'interview-coach-iframe';
    iframe.src = chrome.runtime.getURL('index.html');
    iframe.className = 'interview-coach-iframe';
    iframe.setAttribute('allow', 'web-share');

    // Ensure iframe loads properly
    iframe.onload = () => {
      console.log('InterviewCoach.AI: Iframe loaded successfully');
    };
    iframe.onerror = (error) => {
      console.error('InterviewCoach.AI: Iframe failed to load', error);
    };

    // Assemble sidebar
    sidebar.appendChild(header);
    sidebar.appendChild(iframe);
    document.body.appendChild(sidebar);

    // Add styles
    this.injectStyles();

    // Setup close button
    const closeBtn = document.getElementById('interview-coach-close');
    closeBtn?.addEventListener('click', () => this.hide());

    // Setup resize handle
    this.setupResizeHandle(sidebar);

    this.sidebar = sidebar;
    this.iframe = iframe;

    console.log('InterviewCoach.AI: Sidebar created');
  }

  private setupResizeHandle(sidebar: HTMLElement): void {
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'interview-coach-resize-handle';
    sidebar.appendChild(resizeHandle);

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startWidth = sidebar.offsetWidth;
      document.body.style.cursor = 'ew-resize';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const deltaX = startX - e.clientX;
      const newWidth = startWidth + deltaX;

      // Clamp width between 300px and 800px
      const clampedWidth = Math.max(300, Math.min(800, newWidth));
      sidebar.style.width = `${clampedWidth}px`;
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
      }
    });
  }

  private setupMessageListener(): void {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      console.log('InterviewCoach.AI Sidebar: Received message:', message.type);

      if (message.type === 'PING') {
        // Respond to ping to confirm content script is loaded
        sendResponse({ status: 'ready' });
        return true;
      }

      if (message.type === 'OPEN_SIDEBAR') {
        this.show(message.action, message.text);
        sendResponse({ success: true });
        return true;
      }

      return false;
    });
  }

  private injectStyles(): void {
    if (document.getElementById('interview-coach-sidebar-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'interview-coach-sidebar-styles';
    style.textContent = `
      .interview-coach-sidebar-hidden {
        position: fixed;
        top: 0;
        right: -500px;
        width: 450px;
        height: 100vh;
        background: white;
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        transition: right 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .interview-coach-sidebar-visible {
        right: 0 !important;
      }

      .interview-coach-sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        flex-shrink: 0;
      }

      .interview-coach-sidebar-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 18px;
        font-weight: 600;
      }

      .interview-coach-logo {
        font-size: 24px;
      }

      .interview-coach-close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }

      .interview-coach-close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .interview-coach-iframe {
        flex: 1;
        border: none;
        width: 100%;
        height: 100%;
        overflow: auto;
        background: white;
        display: block;
      }

      .interview-coach-resize-handle {
        position: absolute;
        left: 0;
        top: 0;
        width: 5px;
        height: 100%;
        cursor: ew-resize;
        background: transparent;
        transition: background 0.2s;
      }

      .interview-coach-resize-handle:hover {
        background: rgba(102, 126, 234, 0.3);
      }

      /* Don't adjust page content - overlay instead */
      body.interview-coach-sidebar-open {
        /* Removed margin adjustment to prevent layout issues */
      }
    `;

    document.head.appendChild(style);
  }

  public show(action?: string, text?: string): void {
    if (!this.sidebar) return;

    this.sidebar.classList.remove('interview-coach-sidebar-hidden');
    this.sidebar.classList.add('interview-coach-sidebar-visible');
    document.body.classList.add('interview-coach-sidebar-open');
    this.isVisible = true;

    // Send data to iframe if needed
    if (action && text && this.iframe) {
      // Wait for iframe to load
      setTimeout(() => {
        chrome.storage.local.set({
          contextMenuAction: action,
          selectedText: text,
          timestamp: Date.now()
        });
      }, 500);
    }

    console.log('InterviewCoach.AI: Sidebar shown', action);
  }

  public hide(): void {
    if (!this.sidebar) return;

    this.sidebar.classList.remove('interview-coach-sidebar-visible');
    this.sidebar.classList.add('interview-coach-sidebar-hidden');
    document.body.classList.remove('interview-coach-sidebar-open');
    this.isVisible = false;

    console.log('InterviewCoach.AI: Sidebar hidden');
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}

/**
 * Nudge Badge for Context Menu Actions
 */
class NudgeBadge {
  private nudge: HTMLElement | null = null;
  private isVisible: boolean = false;

  constructor() {
    this.createNudge();
    console.log('InterviewCoach.AI: Nudge badge initialized');
  }

  private createNudge(): void {
    // Check if nudge already exists
    const existing = document.getElementById('interview-coach-nudge');
    if (existing) {
      this.nudge = existing;
      return;
    }

    // Create nudge container
    const nudge = document.createElement('div');
    nudge.id = 'interview-coach-nudge';
    nudge.className = 'interview-coach-nudge-hidden';
    nudge.innerHTML = `
      <div class="nudge-icon">🎯</div>
      <div class="nudge-content">
        <div class="nudge-title"></div>
        <div class="nudge-subtitle">Click to view</div>
      </div>
    `;

    // Add styles
    this.injectStyles();

    // Add click handler
    nudge.addEventListener('click', () => this.handleClick());

    // Add to page
    document.body.appendChild(nudge);
    this.nudge = nudge;

    console.log('InterviewCoach.AI: Nudge badge created');
  }

  private injectStyles(): void {
    if (document.getElementById('interview-coach-nudge-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'interview-coach-nudge-styles';
    style.textContent = `
      #interview-coach-nudge {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 16px;
        cursor: pointer;
        z-index: 2147483646;
        display: none;
        align-items: center;
        gap: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.5);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
        min-width: 280px;
        max-width: 350px;
      }

      #interview-coach-nudge.show {
        display: flex;
        animation: nudgeSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }

      #interview-coach-nudge:hover {
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 12px 32px rgba(102, 126, 234, 0.7);
      }

      #interview-coach-nudge:active {
        transform: translateY(-2px) scale(1.01);
      }

      .interview-coach-nudge-hidden {
        display: none !important;
      }

      .nudge-icon {
        font-size: 32px;
        line-height: 1;
        flex-shrink: 0;
        animation: nudgePulse 2s ease-in-out infinite;
      }

      .nudge-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .nudge-title {
        font-size: 15px;
        font-weight: 600;
        line-height: 1.3;
      }

      .nudge-subtitle {
        font-size: 13px;
        opacity: 0.9;
        font-weight: 400;
      }

      @keyframes nudgeSlideIn {
        0% {
          transform: translateX(400px);
          opacity: 0;
        }
        60% {
          transform: translateX(-10px);
        }
        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes nudgePulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
      }
    `;

    document.head.appendChild(style);
  }

  public show(badgeText: string, badgeTitle: string): void {
    if (!this.nudge) return;

    // Update content
    const titleElement = this.nudge.querySelector('.nudge-title');
    if (titleElement) {
      titleElement.textContent = badgeText;
    }

    // Set title attribute for tooltip
    this.nudge.setAttribute('title', badgeTitle);

    // Show nudge
    this.nudge.classList.remove('interview-coach-nudge-hidden');
    this.nudge.classList.add('show');
    this.isVisible = true;

    console.log('InterviewCoach.AI: Nudge badge shown -', badgeText);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      this.hide();
    }, 10000);
  }

  public hide(): void {
    if (!this.nudge) return;

    this.nudge.classList.remove('show');
    this.nudge.classList.add('interview-coach-nudge-hidden');
    this.isVisible = false;

    console.log('InterviewCoach.AI: Nudge badge hidden');
  }

  private async handleClick(): Promise<void> {
    console.log('InterviewCoach.AI: Nudge badge clicked');

    // Send message to background to open Chrome side panel
    try {
      await chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
      console.log('InterviewCoach.AI: Side panel open request sent');
    } catch (error) {
      console.error('InterviewCoach.AI: Error opening side panel:', error);
    }

    // Hide nudge
    this.hide();
  }

  public isShowing(): boolean {
    return this.isVisible;
  }
}

class InterviewCoachContentScript {
  private lastCapturedText: string = '';
  private feedbackIcon: HTMLElement | null = null;
  private typingTimer: number | null = null;
  private readonly TYPING_DELAY = 1000; // 1 second after user stops typing
  private nudgeBadge: NudgeBadge;

  constructor() {
    // Initialize sidebar (it sets up its own listeners for OPEN_SIDEBAR messages)
    new InterviewCoachSidebar();

    // Initialize nudge badge
    this.nudgeBadge = new NudgeBadge();

    this.init();
  }

  private init(): void {
    console.log('InterviewCoach.AI: Content script initialized');
    this.setupNudgeMessageListener();
    this.createFloatingIcon();
    this.attachInputListeners();
    this.detectPageType();
  }

  /**
   * Set up message listener for nudge badge
   */
  private setupNudgeMessageListener(): void {
    chrome.runtime.onMessage.addListener((message: MessagePayload, _sender, sendResponse) => {
      if (message.type === 'SHOW_NUDGE') {
        console.log('InterviewCoach.AI: Received SHOW_NUDGE message', message);
        if (message.badgeText && message.badgeTitle) {
          this.nudgeBadge.show(message.badgeText, message.badgeTitle);
        }
        sendResponse({ success: true });
        return true;
      }

      if (message.type === 'HIDE_NUDGE') {
        console.log('InterviewCoach.AI: Received HIDE_NUDGE message');
        this.nudgeBadge.hide();
        sendResponse({ success: true });
        return true;
      }

      return false;
    });
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

// Prevent multiple initializations
if (!(window as any).__interviewCoachInitialized) {
  (window as any).__interviewCoachInitialized = true;

  console.log('InterviewCoach.AI: Initializing content script, readyState:', document.readyState);

  // Initialize the content script when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('InterviewCoach.AI: DOM loaded, creating content script');
      new InterviewCoachContentScript();
    });
  } else {
    console.log('InterviewCoach.AI: DOM already loaded, creating content script immediately');
    new InterviewCoachContentScript();
  }
} else {
  console.log('InterviewCoach.AI: Content script already initialized, skipping');
}
