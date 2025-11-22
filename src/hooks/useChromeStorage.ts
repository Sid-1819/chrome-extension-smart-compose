import { useCallback } from "react";
import type { PersistedState, ContextMenuData } from "@/types";
import { logger } from "@/utils/logger";

interface UseChromeStorageReturn {
  persistState: (state: PersistedState) => Promise<void>;
  restoreState: () => Promise<PersistedState | null>;
  checkContextMenuAction: () => Promise<ContextMenuData | null>;
  clearContextMenuAction: () => Promise<void>;
  clearBadge: () => Promise<void>;
  clearAllState: () => Promise<void>;
}

export function useChromeStorage(): UseChromeStorageReturn {
  const persistState = useCallback(async (state: PersistedState) => {
    try {
      await chrome.storage.local.set({ persistedState: state });
      logger.debug("State saved to storage");
    } catch (error) {
      logger.debug("Not running in extension context or error:", error);
    }
  }, []);

  const restoreState = useCallback(async (): Promise<PersistedState | null> => {
    try {
      const result = await chrome.storage.local.get(["persistedState"]);
      if (result.persistedState) {
        logger.debug("Restoring persisted state:", result.persistedState);
        return result.persistedState as PersistedState;
      }
      return null;
    } catch (error) {
      logger.debug("Not running in extension context or error:", error);
      return null;
    }
  }, []);

  const checkContextMenuAction = useCallback(async (): Promise<ContextMenuData | null> => {
    try {
      const result = await chrome.storage.local.get([
        "contextMenuAction",
        "selectedText",
        "timestamp",
      ]);

      if (result.contextMenuAction && result.selectedText) {
        const timestamp = result.timestamp as number;

        // Only process if recent (within last 5 seconds)
        if (Date.now() - timestamp < 5000) {
          return {
            contextMenuAction: result.contextMenuAction as ContextMenuData["contextMenuAction"],
            selectedText: result.selectedText as string,
            timestamp,
          };
        }
      }
      return null;
    } catch (error) {
      logger.debug("Not running in extension context or error:", error);
      return null;
    }
  }, []);

  const clearContextMenuAction = useCallback(async () => {
    try {
      await chrome.storage.local.remove([
        "contextMenuAction",
        "selectedText",
        "timestamp",
      ]);
    } catch (error) {
      logger.debug("Error clearing context menu action:", error);
    }
  }, []);

  const clearBadge = useCallback(async () => {
    try {
      await chrome.runtime.sendMessage({ type: "CLEAR_BADGE" });
    } catch (error) {
      logger.debug("Could not clear badge:", error);
    }
  }, []);

  const clearAllState = useCallback(async () => {
    try {
      await chrome.storage.local.remove(["persistedState"]);
      logger.debug("All persisted state cleared");
    } catch (error) {
      logger.debug("Not running in extension context or error:", error);
    }
  }, []);

  return {
    persistState,
    restoreState,
    checkContextMenuAction,
    clearContextMenuAction,
    clearBadge,
    clearAllState,
  };
}

// Hook for listening to storage changes
export function useChromeStorageListener(
  onContextMenuAction: () => void
) {
  const handleStorageChange = useCallback(
    (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === "local" && changes.contextMenuAction) {
        logger.debug("New context menu action detected while panel is open");
        onContextMenuAction();
      }
    },
    [onContextMenuAction]
  );

  return { handleStorageChange };
}
