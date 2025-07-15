console.log('Background loaded');

// On extension installation, set initial storage values
chrome.runtime.onInstalled.addListener(() => {
  console.log('[LinkedIn Auto Viewer] Extension installed. Setting initial storage values.');
  chrome.storage.local.set({
    autoViewing: false, // Flag to control auto-viewing
    visitedProfiles: [], // Array to store URLs of visited profiles
    likeRecentPostOnly: false // New setting: true to only like, false to also connect
  });
});

// Listen for messages from content scripts (profile.js, content.js) or popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle message to open a new profile tab
  if (message.type === "openProfileTab") {
    console.log('[LinkedIn Auto Viewer] Creating tab:', message.url);
    // Create a new tab in the background, not active
    chrome.tabs.create({ url: message.url, active: false }, (tab) => {
      console.log(`[LinkedIn Auto Viewer] Tab ${tab.id} created for ${message.url}`);
      sendResponse({ status: "Tab created", tabId: tab.id });
    });
    return true; // Indicate that sendResponse will be called asynchronously
  }
  // Handle message to log a visited profile
  else if (message.type === "logVisitedProfile") {
    chrome.storage.local.get({ visitedProfiles: [] }, (data) => {
      const updated = [...data.visitedProfiles, message.url];
      console.log('[LinkedIn Auto Viewer] Logging visited profile:', message.url);
      chrome.storage.local.set({ visitedProfiles: updated }, () => {
        sendResponse({ status: "Profile logged" });
      });
    });
    return true; // Indicate that sendResponse will be called asynchronously
  }
  // Handle message to update settings from the popup
  else if (message.type === "updateSettings") {
    console.log(`[Background] Received setting update: ${message.setting} = ${message.value}`);
    chrome.storage.local.set({ [message.setting]: message.value }, () => {
      sendResponse({ status: "Setting updated" });
    });
    return true; // Indicate that sendResponse will be called asynchronously
  }
});

// Listen for tab updates to inject content scripts if needed (though manifest handles most)
// This can be useful for dynamic injection or ensuring scripts run on specific navigations
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // If the tab has finished loading and is a LinkedIn profile page
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('linkedin.com/in/')) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['profile.js'] // Ensure profile.js runs on profile pages
    }).then(() => {
      console.log('[Background] Injected profile.js into LinkedIn profile tab:', tab.url);
    }).catch(err => console.error('[Background] Failed to inject profile.js:', err));
  }
  // If the tab has finished loading and is a LinkedIn search/feed page
  else if (changeInfo.status === 'complete' && tab.url && (tab.url.includes('linkedin.com/search/results/people/') || tab.url.includes('linkedin.com/feed/update/'))) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js'] // Ensure content.js runs on search/feed pages
    }).then(() => {
      console.log('[Background] Injected content.js into LinkedIn search/feed tab:', tab.url);
    }).catch(err => console.error('[Background] Failed to inject content.js:', err));
  }
});
