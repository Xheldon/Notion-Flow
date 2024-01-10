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
    if (url.origin === 'https://www.notion.so' || url.origin.endsWith('.notion.site')) {
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
    if (url.origin === 'https://www.notion.so' || url.origin.endsWith('.notion.site')) {
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

// Note: 检测首次安装和更新
chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install" || details.reason == "update"){
        chrome.tabs.create({url:chrome.runtime.getURL("options.html")}, function (tab) {
            var thisVersion = chrome.runtime.getManifest().version;
            console.log(`Open Type: ${details.reason}; Version: ${details.previousVersion} to ${thisVersion} !`);
        });
    }
});
