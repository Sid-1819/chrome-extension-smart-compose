/**
 * InterviewCoach AI Content Script
 * Monitors text inputs on YouTube, Google Meet, and any webpage
 * Captures user input and sends it to background for AI feedback
 * Injects sidebar for interview prep features
 */

interface MessagePayload {
  type: 'TEXT_CAPTURED' | 'OPEN_SIDEBAR' | 'SHOW_NUDGE' | 'HIDE_NUDGE' | 'PING';
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
    console.log('InterviewCoach AI: Sidebar class initialized');
    this.createSidebar();
    this.setupMessageListener();
  }

  private createSidebar(): void {
    // Check if sidebar already exists
    const existing = document.getElementById('interview-coach-sidebar');
    if (existing) {
      console.log('InterviewCoach AI: Sidebar already exists, reusing');
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
        <span>InterviewCoach AI</span>
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
      console.log('InterviewCoach AI: Iframe loaded successfully');
    };
    iframe.onerror = (error) => {
      console.error('InterviewCoach AI: Iframe failed to load', error);
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

    console.log('InterviewCoach AI: Sidebar created');
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
      console.log('InterviewCoach AI Sidebar: Received message:', message.type);

      if (message.type === 'OPEN_SIDEBAR') {
        this.show(message.action, message.text);
        sendResponse({ success: true });
        return true;
      }

      // Don't handle other messages - let other listeners handle them
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

    console.log('InterviewCoach AI: Sidebar shown', action);
  }

  public hide(): void {
    if (!this.sidebar) return;

    this.sidebar.classList.remove('interview-coach-sidebar-visible');
    this.sidebar.classList.add('interview-coach-sidebar-hidden');
    document.body.classList.remove('interview-coach-sidebar-open');
    this.isVisible = false;

    console.log('InterviewCoach AI: Sidebar hidden');
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
    console.log('InterviewCoach AI: Nudge badge initialized');
  }

  private createNudge(): void {
    // Check if nudge already exists
    const existing = document.getElementById('interview-coach-nudge');
    if (existing) {
      // Remove old element and recreate to ensure fresh click handlers
      existing.remove();
      console.log('InterviewCoach AI: Removed old nudge badge, creating fresh one');
    }

    // Create nudge container
    const nudge = document.createElement('div');
    nudge.id = 'interview-coach-nudge';
    nudge.className = 'interview-coach-nudge-hidden';
    nudge.innerHTML = `
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

    console.log('InterviewCoach AI: Nudge badge created');
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
        background: linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 16px;
        cursor: pointer;
        z-index: 2147483646;
        display: none;
        align-items: center;
        gap: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
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
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
      }

      #interview-coach-nudge:active {
        transform: translateY(-2px) scale(1.01);
      }

      .interview-coach-nudge-hidden {
        display: none !important;
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

    console.log('InterviewCoach AI: Nudge badge shown -', badgeText);

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

    console.log('InterviewCoach AI: Nudge badge hidden');
  }

  private async handleClick(): Promise<void> {
    console.log('InterviewCoach AI: Nudge badge clicked');

    // Hide nudge first
    this.hide();

    // Send message to background to open Chrome side panel
    try {
      // Check if extension context is still valid
      if (chrome.runtime?.id) {
        await chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
        console.log('InterviewCoach AI: Side panel open request sent');
      } else {
        console.log('InterviewCoach AI: Extension context invalid, user should click extension icon');
      }
    } catch (error: any) {
      // If context is invalidated, just log it - the user can click the extension icon
      if (error.message?.includes('Extension context invalidated')) {
        console.log('InterviewCoach AI: Extension context invalidated, please click extension icon');
      } else {
        console.error('InterviewCoach AI: Error opening side panel:', error);
      }
    }
  }

  public isShowing(): boolean {
    return this.isVisible;
  }
}

class InterviewCoachContentScript {
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
    console.log('InterviewCoach AI: Content script initialized');
    this.setupNudgeMessageListener();
    this.attachInputListeners();
    this.detectPageType();
  }

  /**
   * Set up message listener for nudge badge and other content script messages
   */
  private setupNudgeMessageListener(): void {
    chrome.runtime.onMessage.addListener((message: MessagePayload, _sender, sendResponse) => {
      console.log('InterviewCoach AI Content: Received message:', message.type);

      // Handle PING to confirm content script is ready
      if (message.type === 'PING') {
        sendResponse({ status: 'ready' });
        return true;
      }

      // Handle SHOW_NUDGE
      if (message.type === 'SHOW_NUDGE') {
        console.log('InterviewCoach AI: Showing nudge badge', message);
        if (message.badgeText && message.badgeTitle) {
          this.nudgeBadge.show(message.badgeText, message.badgeTitle);
        }
        sendResponse({ success: true });
        return true;
      }

      // Handle HIDE_NUDGE
      if (message.type === 'HIDE_NUDGE') {
        console.log('InterviewCoach AI: Hiding nudge badge');
        this.nudgeBadge.hide();
        sendResponse({ success: true });
        return true;
      }

      // Don't handle other messages - let other listeners handle them
      return false;
    });
  }

  /**
   * Detect the type of page we're on for specialized handling
   */
  private detectPageType(): void {
    const url = window.location.href;

    if (url.includes('youtube.com')) {
      console.log('InterviewCoach AI: YouTube detected');
      this.handleYouTube();
    } else if (url.includes('meet.google.com')) {
      console.log('InterviewCoach AI: Google Meet detected');
      this.handleGoogleMeet();
    } else {
      console.log('InterviewCoach AI: Generic webpage detected');
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
      this.sendToBackground('TEXT_CAPTURED', text);
      console.log('InterviewCoach AI: Text captured:', text.substring(0, 50) + '...');
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
        console.error('InterviewCoach AI: Error sending message:', chrome.runtime.lastError);
      } else {
        console.log('InterviewCoach AI: Message sent successfully:', response);
      }
    });
  }

}

// Prevent multiple initializations
if (!(window as any).__interviewCoachInitialized) {
  (window as any).__interviewCoachInitialized = true;

  console.log('InterviewCoach AI: Initializing content script, readyState:', document.readyState);

  // Initialize the content script when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('InterviewCoach AI: DOM loaded, creating content script');
      new InterviewCoachContentScript();
    });
  } else {
    console.log('InterviewCoach AI: DOM already loaded, creating content script immediately');
    new InterviewCoachContentScript();
  }
} else {
  console.log('InterviewCoach AI: Content script already initialized, skipping');
}
