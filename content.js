console.log('Content script loaded');

// This event listener is triggered by popup.js when the "Start Auto Viewing" button is clicked.
window.addEventListener('startAutoView', () => {
  console.log('[LinkedIn Auto Viewer] Starting profile detection...');

  // Select all anchor tags that likely link to a LinkedIn profile
  const profileAnchors = [...document.querySelectorAll('a[href*="/in/"]')];

  // Filter for 2nd-degree connections and extract unique profile URLs
  const profileLinks = profileAnchors
    .filter(a => {
      // Check if the closest parent div contains "2nd" to identify 2nd-degree connections
      const is2ndConnection = a.closest('div')?.innerText.includes('2nd');
      return is2ndConnection;
    })
    .map(a => a.href.split('?')[0]) // Get base URL, remove query parameters
    .filter((href, i, arr) => href.includes('/in/') && arr.indexOf(href) === i); // Ensure it's a profile link and unique

  console.log(`[LinkedIn Auto Viewer] Found ${profileLinks.length} 2nd-degree profile links.`);

  if (profileLinks.length === 0) {
    console.warn("[LinkedIn Auto Viewer] No valid 2nd-degree profile links found on this page.");
    return;
  }

  let i = 0;
  // Define a delay function to simulate human-like browsing
  const delay = () => new Promise(res => setTimeout(res, 8000 + Math.random() * 4000)); // 8-12 seconds

  // Asynchronous function to view profiles sequentially
  async function viewProfiles() {
    // Check if auto-viewing is still enabled in storage
    chrome.storage.local.get('autoViewing', async (data) => {
      if (!data.autoViewing) {
        console.log('[LinkedIn Auto Viewer] Auto viewing stopped by user.');
        return;
      }

      if (i < profileLinks.length) {
        const profile = profileLinks[i];
        console.log(`[LinkedIn Auto Viewer] Opening profile ${i + 1}/${profileLinks.length}: ${profile}`);
        // Send message to background script to open the profile in a new tab
        chrome.runtime.sendMessage({ type: "openProfileTab", url: profile });
        i++;
        await delay(); // Wait for the defined delay
        viewProfiles(); // Recursively call to view next profile
      } else {
        console.log('[LinkedIn Auto Viewer] All profiles on this page have been viewed.');
        // Optionally, you could navigate to the next page of results here
      }
    });
  }

  viewProfiles(); // Start the process
});

// Listen for messages from popup.js (e.g., when settings are updated)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateSettings") {
    // This content script doesn't directly use the 'likeRecentPostOnly' setting
    // for its primary function (opening tabs). The 'profile.js' script
    // running on the opened profile tabs will read this setting.
    console.log(`[Content Script] Received setting update: ${message.setting} = ${message.value}`);
    sendResponse({ status: "Settings received by content script" });
  }
  return true; // Indicates that sendResponse will be called asynchronously
});
