export { }

// Note：点击图标时，打开 sidepanel
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tabId = activeInfo.tabId;
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url) {
        await chrome.sidePanel.setOptions({
            tabId,
            enabled: false
        });
        return;
    };
    const url = new URL(tab.url);
    if (url.origin === 'https://www.notion.so') {
        await chrome.sidePanel.setOptions({
            tabId,
            path: 'sidepanel.html',
            enabled: true
        });
    } else {
        // Disables the side panel on all other sites
        await chrome.sidePanel.setOptions({
            tabId,
            enabled: false
        });
    }
});
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    if (!tab.url) {
        await chrome.sidePanel.setOptions({
            tabId,
            enabled: false
        });
        return;
    };
    const url = new URL(tab.url);
    if (url.origin === 'https://www.notion.so') {
        await chrome.sidePanel.setOptions({
            tabId,
            path: 'sidepanel.html',
            enabled: true
        });
    } else {
        // Disables the side panel on all other sites
        await chrome.sidePanel.setOptions({
            tabId,
            enabled: false
        });
    }
});

// Note: sidePanel 无法发送跨域请求