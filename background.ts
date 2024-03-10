export { }

// Note：点击图标时，打开 sidepanel
/* chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error)); */

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    console.log('onActivated: ', activeInfo);
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
    console.log('onUpdated: ', tabId, info, tab);
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

// Note: 点击图标时，打开 sidepanel，如果不在 notion 页面上，通知
chrome.action.onClicked.addListener(async (tab) => {
    console.log('onClicked: ', tab);
    if (!tab.url) {
        return;
    };
    const url = new URL(tab.url);
    const tabId = tab.id;
    if (url.origin === 'https://www.notion.so' || url.origin.endsWith('.notion.site')) {
        await chrome.sidePanel.open({
            tabId,
        });
    } else {
        // Note: 显示一个弹窗说 Notion Flow 插件仅在 Notion 页面上可用以保持适当的边界感
        /* chrome.scripting.executeScript({
            target: {tabId: tab.id},
            files: [chrome.runtime.getURL('notify.js')]
          }); */
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('assets/icon.png'),
            title: 'Notion Flow',
            message: 'Notion Flow only work on Notion Page',
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
