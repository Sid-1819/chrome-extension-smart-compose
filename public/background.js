chrome.runtime.onInstalled.addListener(() => {
  console.log("Smart Compose Extension installed!");
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});
