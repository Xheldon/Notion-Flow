import { getPort } from "@plasmohq/messaging/port"

const AIGC_BLOCKS = [
    'header',
    'sub_header',
    'sub_sub_header',
    'numbered_list',
    'bulleted_list',
    'to_do',
    'toggle',
    'quote',
    'callout',
    'text',
];


// Note: 接受来自 sidePanel 的消息
chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
        console.log('content 收到:', msg);
        if (Math.random() > 0.5) {
            port.postMessage({ type: 'toc', content: '收到后再通知 sidePanel 哈'});
        }
        // port.postMessage({ type: 'toc', content: 'sidePanel 知道了'});
    });
});
window.addEventListener('load', () => {
    // toc.onMessage.addListener((msg) => {
    //     console.log('来自 msg 的广播 toc:', msg);
    // });
    console.log('div 数量:', document.querySelectorAll('div').length);
    let timer: NodeJS.Timeout;
    const eventCb = (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            if (window.getSelection()?.type === 'None') {
                // Note: 此时判断是否为块级选中
                const selectBlock = Array.from(document.querySelectorAll('.notion-selectable-halo'));
                if (selectBlock.length) {                        
                    // console.log('selectBlock:', selectBlock, target);
                    if (selectBlock.every(ele => {
                        return AIGC_BLOCKS.some(type => ele.parentElement?.classList.contains(`notion-${type}-block`))
                    })) {
                        // Note: 获取 block 选中的内容
                        const content = selectBlock.reduce((prev, curr) => {
                            return prev + curr?.parentElement?.textContent + '\n';
                        }, '');
                        // TODO: 通知内容给 bg，bg 发送给 sidePanel
                        // cb(content);
                        var port = chrome.runtime.connect({name: "toc"});
                        port.postMessage({type: "toc", content});
                    }
                }
            } else {
                // TODO: 通知内容给 bg，bg 发送给 sidePanel
                // cb(window.getSelection()?.toString());
                var port = chrome.runtime.connect({name: "toc"});
                port.postMessage({type: 'toc', content: window.getSelection()?.toString()});
            }
        }, 200);
    };
    // EventBus.on('heading-locate', (msg) => {
    //     console.log('来自 heading-locate 的广播:', msg);
    // });
    document.addEventListener('selectionchange', eventCb);
    document.addEventListener('mouseup', eventCb);
});