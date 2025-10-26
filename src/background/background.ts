/**
 * InterviewCoach.AI Background Script
 * Handles storage and coordination (AI operations are handled in the popup)
 */

interface MessagePayload {
  type: 'TEXT_CAPTURED';
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
    await this.loadStoredTexts();
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
