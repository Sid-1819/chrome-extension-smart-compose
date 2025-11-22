import { useCallback } from "react";
import type { PersistedState, ContextMenuData } from "@/types";

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
      console.log("State saved to storage");
    } catch (error) {
      console.log("Not running in extension context or error:", error);
    }
  }, []);

  const restoreState = useCallback(async (): Promise<PersistedState | null> => {
    try {
      const result = await chrome.storage.local.get(["persistedState"]);
      if (result.persistedState) {
        console.log("Restoring persisted state:", result.persistedState);
        return result.persistedState as PersistedState;
      }
      return null;
    } catch (error) {
      console.log("Not running in extension context or error:", error);
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
      console.log("Not running in extension context or error:", error);
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
      console.log("Error clearing context menu action:", error);
    }
  }, []);

  const clearBadge = useCallback(async () => {
    try {
      await chrome.runtime.sendMessage({ type: "CLEAR_BADGE" });
    } catch (error) {
      console.log("Could not clear badge:", error);
    }
  }, []);

  const clearAllState = useCallback(async () => {
    try {
      await chrome.storage.local.remove(["persistedState"]);
      console.log("All persisted state cleared");
    } catch (error) {
      console.log("Not running in extension context or error:", error);
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
        console.log("New context menu action detected while panel is open");
        onContextMenuAction();
      }
    },
    [onContextMenuAction]
  );

  return { handleStorageChange };
}
