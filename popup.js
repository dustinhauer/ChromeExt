console.log('Popup loaded');

document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('start');
  const stopButton = document.getElementById('stop');
  const likeRecentPostOnlyCheckbox = document.getElementById('likeRecentPostOnly');
  const dashboard = document.getElementById('dashboard');

  // --- Initialize UI state from storage ---
  chrome.storage.local.get(['autoViewing', 'visitedProfiles', 'likeRecentPostOnly'], (data) => {
    // Set initial state for autoViewing buttons (though content script handles actual auto-viewing)
    // This is more for visual feedback in the popup
    if (data.autoViewing) {
      startButton.textContent = 'Auto Viewing Active';
      startButton.disabled = true;
      stopButton.disabled = false;
    } else {
      startButton.textContent = 'Start Auto Viewing';
      startButton.disabled = false;
      stopButton.disabled = true;
    }

    // Set initial state for the 'likeRecentPostOnly' checkbox
    likeRecentPostOnlyCheckbox.checked = data.likeRecentPostOnly || false;
    console.log('[Popup] Initial likeRecentPostOnly state:', likeRecentPostOnlyCheckbox.checked);

    // Update the dashboard display
    updateDashboard(data.visitedProfiles);
  });

  // --- Event Listeners ---

  startButton.addEventListener('click', () => {
    console.log('[Popup] Start button clicked.');
    chrome.storage.local.set({ autoViewing: true }, () => {
      startButton.textContent = 'Auto Viewing Active';
      startButton.disabled = true;
      stopButton.disabled = false;
      // Dispatch event to content script to start auto-viewing
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: () => window.dispatchEvent(new Event('startAutoView'))
          }).then(() => console.log('[Popup] Dispatched startAutoView event.')).catch(err => console.error(err));
        }
      });
    });
  });

  stopButton.addEventListener('click', () => {
    console.log('[Popup] Stop button clicked.');
    chrome.storage.local.set({ autoViewing: false }, () => {
      startButton.textContent = 'Start Auto Viewing';
      startButton.disabled = false;
      stopButton.disabled = true;
      // No explicit stop event needed for content script, as it checks `autoViewing` state
    });
  });

  likeRecentPostOnlyCheckbox.addEventListener('change', () => {
    const isChecked = likeRecentPostOnlyCheckbox.checked;
    console.log('[Popup] Like Recent Post Only checkbox changed to:', isChecked);
    chrome.storage.local.set({ likeRecentPostOnly: isChecked }, () => {
      // Send message to active tab's content script to update its behavior
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: "updateSettings",
            setting: "likeRecentPostOnly",
            value: isChecked
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('[Popup] Error sending message to content script:', chrome.runtime.lastError.message);
            } else {
              console.log('[Popup] Message sent to content script:', response);
            }
          });
        }
      });
    });
  });

  // --- Dashboard Update Logic ---
  function updateDashboard(visitedProfilesData) {
    const count = (visitedProfilesData || []).length;
    dashboard.innerHTML = `<strong>Visited Profiles:</strong> ${count}`;
  }

  // Set up an interval to periodically update the dashboard
  // This listens for changes in `visitedProfiles` from the background script
  setInterval(() => {
    chrome.storage.local.get('visitedProfiles', (data) => {
      updateDashboard(data.visitedProfiles);
    });
  }, 2000); // Update every 2 seconds
});
