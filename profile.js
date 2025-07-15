(async function () {
  console.log('[LinkedIn Auto Viewer] Visiting profile:', window.location.href);

  /**
   * Attempts to like the most recent post on the current LinkedIn profile page.
   * This is a conceptual function and requires up-to-date DOM selectors
   * for LinkedIn's ever-changing structure.
   */
  function likeLatestPost() {
    console.log('[LinkedIn Auto Viewer] Attempting to like latest post...');
    // Find all buttons that have an aria-label containing "Like"
    const likeButtons = document.querySelectorAll('button[aria-label*="Like"]');
    if (likeButtons.length > 0) {
      // Click the first found like button (assumed to be for the latest post)
      likeButtons[0].click();
      console.log('[LinkedIn Auto Viewer] Liked latest post.');
    } else {
      console.log('[LinkedIn Auto Viewer] No Like button found on this profile page.');
    }
  }

  /**
   * Extracts the follower count from the profile page.
   * This is a conceptual function and relies on specific text patterns.
   */
  function getFollowerCount() {
    // Search for elements that contain "followers" text
    const el = [...document.querySelectorAll('span, div')].find(e => /followers/i.test(e.innerText));
    // Use regex to extract the number
    const match = el?.innerText.match(/([\d,]+)\s+followers/i);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0; // Parse and return integer
  }

  /**
   * Extracts the location from the profile page.
   * This is a conceptual function and relies on specific keyword matching.
   */
  function getLocation() {
    // Search for elements containing common location keywords
    const locationBlock = [...document.querySelectorAll('span, div')].find(e => /\b(canada|united states|uk|australia|dubai)\b/i.test(e.innerText));
    return locationBlock?.innerText.toLowerCase() || '';
  }

  /**
   * Determines if a connection request should be sent based on follower count and location.
   */
  function shouldConnect(followers, location) {
    // Criteria: followers <= 20000 AND location matches one of the specified countries/regions
    return followers <= 20000 && /canada|united states|uk|australia|dubai/.test(location);
  }

  /**
   * Attempts to send a connection request.
   * This is a conceptual function and requires up-to-date DOM selectors.
   */
  function attemptConnection() {
    const followers = getFollowerCount();
    const location = getLocation();
    console.log(`[LinkedIn Auto Viewer] Profile details - Follower count: ${followers}, Location: ${location}`);

    if (!shouldConnect(followers, location)) {
      console.log('[LinkedIn Auto Viewer] Skipping connection — criteria not met or "Like Only" mode active.');
      return;
    }

    // Find the "Connect" button
    const connectBtn = [...document.querySelectorAll('button')].find(btn => btn.innerText.includes('Connect'));
    if (connectBtn) {
      console.log('[LinkedIn Auto Viewer] Sending connection request.');
      connectBtn.click(); // Click the connect button
      setTimeout(() => {
        // After clicking connect, look for the "Send without a note" button
        const sendBtn = document.querySelector('button[aria-label="Send without a note"]') ||
                        [...document.querySelectorAll('button')].find(b => b.innerText.includes('Send without a note'));
        if (sendBtn) {
          sendBtn.click(); // Click to send without a note
          console.log('[LinkedIn Auto Viewer] Connection request sent without a note.');
        } else {
          console.log('[LinkedIn Auto Viewer] "Send without a note" button not found.');
        }
      }, 1500); // Small delay to allow modal to appear
    } else {
      console.log('[LinkedIn Auto Viewer] No Connect button found on this profile page.');
    }
  }

  /**
   * Logs the visited profile URL to storage and closes the tab.
   */
  function logAndClose() {
    chrome.runtime.sendMessage({ type: "logVisitedProfile", url: window.location.href });
    console.log('[LinkedIn Auto Viewer] Logged profile and closing tab...');
    // Close the tab after a random delay (7-10 seconds)
    setTimeout(() => window.close(), 7000 + Math.random() * 3000);
  }

  // --- Main execution flow for profile.js ---
  // Wait for 4 seconds before performing actions to allow page to load fully
  setTimeout(() => {
    // Get the 'likeRecentPostOnly' setting from local storage
    chrome.storage.local.get('likeRecentPostOnly', (data) => {
      const likeOnly = data.likeRecentPostOnly || false;
      console.log(`[LinkedIn Auto Viewer] 'Like Most Recent Post Only' setting: ${likeOnly}`);

      likeLatestPost(); // Always attempt to like the latest post

      if (!likeOnly) {
        // If 'likeRecentPostOnly' is FALSE, then attempt to send connection requests
        attemptConnection();
      } else {
        console.log('[LinkedIn Auto Viewer] Skipping connection request as "Like Most Recent Post Only" is enabled.');
      }

      logAndClose(); // Always log and close the tab
    });
  }, 4000); // Delay for 4 seconds
})();
