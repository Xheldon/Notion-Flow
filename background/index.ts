export {}

console.log('Hello from background!')

// chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
//     if (!tab.url) return;
//     const url = new URL(tab.url);
//     // Enables the side panel on google.com
//     if (url.origin === 'https://www.notion.so') {
//       await chrome.sidePanel.setOptions({
//         tabId,
//         path: 'sidepanel.html',
//         enabled: true
//       });
//     } else {
//       // Disables the side panel on all other sites
//       await chrome.sidePanel.setOptions({
//         tabId,
//         enabled: false
//       });
//     }
//   });