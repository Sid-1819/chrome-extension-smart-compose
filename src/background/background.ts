/**
 * InterviewCoach.AI Background Script
 * Handles storage, context menus, and coordination (AI operations are handled in the popup)
 */

interface MessagePayload {
  type: 'TEXT_CAPTURED' | 'JOB_DESCRIPTION_SELECTED';
  text: string;
  url?: string;
  timestamp?: number;
}

interface StoredText {
  text: string;
  url: string;
  timestamp: number;
}

class InterviewCoachBackground {
  private recentTexts: StoredText[] = [];
  private readonly MAX_STORED_TEXTS = 50;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    console.log('InterviewCoach.AI: Background script initialized');
    this.setupMessageListener();
    this.setupContextMenus();
    await this.loadStoredTexts();
  }

  /**
   * Set up context menus (right-click options)
   */
  private setupContextMenus(): void {
    // Remove existing menus first
    chrome.contextMenus.removeAll(() => {
      // Create parent menu
      chrome.contextMenus.create({
        id: 'interview-coach-parent',
        title: 'InterviewCoach.AI',
        contexts: ['selection']
      });

      // Analyze Job Description
      chrome.contextMenus.create({
        id: 'analyze-job-description',
        parentId: 'interview-coach-parent',
        title: '🔍 Analyze Job Description',
        contexts: ['selection']
      });

      // Generate Interview Questions
      chrome.contextMenus.create({
        id: 'generate-questions',
        parentId: 'interview-coach-parent',
        title: '💭 Generate Interview Questions',
        contexts: ['selection']
      });

      // Separator
      chrome.contextMenus.create({
        id: 'separator-1',
        parentId: 'interview-coach-parent',
        type: 'separator',
        contexts: ['selection']
      });

      // Get Interview Feedback
      chrome.contextMenus.create({
        id: 'get-feedback',
        parentId: 'interview-coach-parent',
        title: '💬 Get Answer Feedback',
        contexts: ['selection']
      });

      // Improve Text
      chrome.contextMenus.create({
        id: 'improve-text',
        parentId: 'interview-coach-parent',
        title: '✨ Improve Text',
        contexts: ['selection']
      });

      console.log('InterviewCoach.AI: Context menus created');
    });

    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
      if (!info.selectionText || !tab?.id) return;

      console.log('InterviewCoach.AI: Context menu action:', info.menuItemId);

      // Store the selected text and action for the popup to access
      await chrome.storage.local.set({
        contextMenuAction: info.menuItemId,
        selectedText: info.selectionText,
        timestamp: Date.now()
      });

      // Open extension popup (which has full API access)
      // Note: chrome.action.openPopup() only works in response to user action
      // So we'll use a different approach - open a new window with the extension

      try {
        // Try to open popup directly (works on Chrome 99+)
        await chrome.action.openPopup();
        console.log('InterviewCoach.AI: Popup opened');
      } catch (error) {
        console.log('InterviewCoach.AI: Could not open popup, trying alternative...');

        // Alternative: Create a small notification to click the extension icon
        chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icon.png'),
          title: 'InterviewCoach.AI',
          message: 'Click the extension icon to view results',
          priority: 2
        });
      }
    });
  }

  /**
   * Set up listener for messages from content scripts
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener(
      (
        message: MessagePayload,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: any) => void
      ) => {
        console.log('InterviewCoach.AI: Received message:', message.type, sender.tab?.url);

        switch (message.type) {
          case 'TEXT_CAPTURED':
            this.handleTextCaptured(message, sender);
            sendResponse({ success: true, message: 'Text captured successfully' });
            break;

          default:
            sendResponse({ success: false, message: 'Unknown message type' });
        }

        return false;
      }
    );
  }

  /**
   * Handle captured text from content script
   */
  private handleTextCaptured(message: MessagePayload, _sender: chrome.runtime.MessageSender): void {
    const storedText: StoredText = {
      text: message.text,
      url: message.url || '',
      timestamp: message.timestamp || Date.now()
    };

    // Add to recent texts
    this.recentTexts.unshift(storedText);

    // Keep only the most recent texts
    if (this.recentTexts.length > this.MAX_STORED_TEXTS) {
      this.recentTexts = this.recentTexts.slice(0, this.MAX_STORED_TEXTS);
    }

    // Save to storage
    this.saveTextsToStorage();

    console.log('InterviewCoach.AI: Text captured and stored', {
      textLength: message.text.length,
      url: message.url,
      totalStored: this.recentTexts.length
    });
  }

  /**
   * Save texts to Chrome storage
   */
  private async saveTextsToStorage(): Promise<void> {
    try {
      await chrome.storage.local.set({
        recentTexts: this.recentTexts
      });
    } catch (error) {
      console.error('InterviewCoach.AI: Error saving to storage:', error);
    }
  }

  /**
   * Load stored texts from Chrome storage
   */
  private async loadStoredTexts(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['recentTexts']);
      if (result.recentTexts) {
        this.recentTexts = result.recentTexts;
        console.log('InterviewCoach.AI: Loaded', this.recentTexts.length, 'stored texts');
      }
    } catch (error) {
      console.error('InterviewCoach.AI: Error loading from storage:', error);
    }
  }

}

// Initialize background script
new InterviewCoachBackground();
