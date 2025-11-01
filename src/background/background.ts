/**
 * InterviewCoach.AI Background Script
 * Handles storage, context menus, and coordination (AI operations are handled in the popup)
 */

interface MessagePayload {
  type: 'TEXT_CAPTURED' | 'JOB_DESCRIPTION_SELECTED' | 'CLEAR_BADGE' | 'SHOW_NUDGE' | 'HIDE_NUDGE' | 'OPEN_SIDE_PANEL';
  text?: string;
  url?: string;
  timestamp?: number;
  action?: string;
  badgeText?: string;
  badgeTitle?: string;
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
    this.setupActionButton();
    await this.loadStoredTexts();
  }

  /**
   * Set up extension icon click handler and panel behavior
   */
  private setupActionButton(): void {
    // Set panel to open automatically when action icon is clicked
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error('InterviewCoach.AI: Error setting panel behavior:', error));
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
        title: 'Analyze Job Description',
        contexts: ['selection']
      });

      // Generate Interview Questions
      chrome.contextMenus.create({
        id: 'generate-questions',
        parentId: 'interview-coach-parent',
        title: ' Generate Interview Questions',
        contexts: ['selection']
      });

      // Separator
      chrome.contextMenus.create({
        id: 'separator-1',
        parentId: 'interview-coach-parent',
        type: 'separator',
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

      // Open side panel FIRST (must be synchronous in user gesture handler)
      if (tab?.windowId) {
        try {
          await chrome.sidePanel.open({ windowId: tab.windowId });
          console.log('InterviewCoach.AI: Side panel opened');
        } catch (error) {
          console.log('InterviewCoach.AI: Could not open side panel:', error);
        }
      }

      // Then send nudge message (async, happens after side panel is already opening)
      if (tab?.id) {
        let badgeText = 'Ready';
        let badgeTitle = 'InterviewCoach.AI - Click to view';

        switch (info.menuItemId) {
          case 'analyze-job-description':
            badgeText = 'Job Analysis Ready';
            badgeTitle = 'Job Description Analysis Ready';
            break;
          case 'generate-questions':
            badgeText = 'Questions Ready';
            badgeTitle = 'Interview Questions Ready';
            break;
        }

        // Send message to content script to show nudge badge (non-blocking)
        this.sendNudgeMessage(tab.id, {
          type: 'SHOW_NUDGE',
          action: info.menuItemId as string,
          badgeText: badgeText,
          badgeTitle: badgeTitle
        }).catch(err => console.log('Nudge message failed:', err));
      }
    });
  }

  /**
   * Send nudge message to content script with retry
   */
  private async sendNudgeMessage(tabId: number, message: MessagePayload, retries = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        // First check if content script is ready
        const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });

        if (response && response.status === 'ready') {
          // Content script is ready, send the nudge message
          await chrome.tabs.sendMessage(tabId, message);
          console.log('InterviewCoach.AI: Nudge badge message sent');
          return;
        }
      } catch (error) {
        console.log(`InterviewCoach.AI: Content script not ready, attempt ${i + 1}/${retries}`);

        if (i < retries - 1) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.log('InterviewCoach.AI: Could not connect to content script after retries');
        }
      }
    }
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

          case 'CLEAR_BADGE':
            this.clearBadge(sender);
            sendResponse({ success: true, message: 'Badge cleared' });
            break;

          case 'OPEN_SIDE_PANEL':
            this.openSidePanel(sender);
            sendResponse({ success: true, message: 'Side panel opening' });
            break;

          default:
            sendResponse({ success: false, message: 'Unknown message type' });
        }

        return false;
      }
    );
  }

  /**
   * Clear the badge notification (now handled by content script nudge)
   */
  private async clearBadge(sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      // Send message to content script to hide nudge badge
      if (sender.tab?.id) {
        await chrome.tabs.sendMessage(sender.tab.id, {
          type: 'HIDE_NUDGE'
        });
      }
      console.log('InterviewCoach.AI: Nudge cleared');
    } catch (error) {
      console.error('InterviewCoach.AI: Error clearing nudge:', error);
    }
  }

  /**
   * Open the Chrome side panel
   */
  private async openSidePanel(sender: chrome.runtime.MessageSender): Promise<void> {
    try {
      const tab = sender.tab;
      if (!tab) return;

      // Try to open side panel with windowId first
      if (tab.windowId) {
        try {
          await chrome.sidePanel.open({ windowId: tab.windowId });
          console.log('InterviewCoach.AI: Side panel opened with windowId');
        } catch (error) {
          console.log('InterviewCoach.AI: Could not open side panel with windowId, trying tabId:', error);

          // Fallback to tabId
          if (tab.id) {
            await chrome.sidePanel.open({ tabId: tab.id });
            console.log('InterviewCoach.AI: Side panel opened with tabId');
          }
        }
      }
    } catch (error) {
      console.error('InterviewCoach.AI: Error opening side panel:', error);
    }
  }

  /**
   * Handle captured text from content script
   */
  private handleTextCaptured(message: MessagePayload, _sender: chrome.runtime.MessageSender): void {
    const storedText: StoredText = {
      text: message.text || '',
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
      textLength: message.text?.length || 0,
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
