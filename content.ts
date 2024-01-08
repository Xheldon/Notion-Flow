import type { PlasmoCSConfig } from 'plasmo';
import { _toSidePanel } from '$utils';
import type { PublisherConfig, TocItem, Meta, AigcState, AigcData } from '$types';

export const config: PlasmoCSConfig = {
    matches: ['https://www.notion.so/*'],
    all_frames: true,
};

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

// Note: 此函数限定在 content 中调用，就不放到 helper 中了
function getNotionToc() {
    const toc: TocItem[] = []
    const main = document.querySelector('.notion-page-content');
    if (!main) {
        _toSidePanel('toc-update', toc);
        return;
    }
    if (main) {
        const container: Element[] = [...main.children];
        const getItem = (level: number, ele: Element) => {
            return {
                level,
                key: ele.getAttribute('data-block-id'),
                title: ele.textContent,
            }
        };
        container.forEach((ele, k) => {
            if (!ele || !ele.classList) {
                return;
            }
            if (ele && ele.classList.contains('notion-header-block')) {
                const item = getItem(1, ele);
                toc.push(item);
            }
            if (ele && ele.classList.contains('notion-sub_header-block')) {
                const item = getItem(2, ele);
                toc.push(item);
            }
            if (ele && ele.classList.contains('notion-sub_sub_header-block')) {
                const item = getItem(3, ele);
                toc.push(item);
            }
        });
        _toSidePanel('toc-update', toc);
    }
}

// Note: 接受来自 sidePanel 的消息
chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
        console.log('content 收到:', msg);
        const {name, data} = msg;
        // TODO: 滚动页面等
        switch (name) {
            case 'toc-update': { // Note: sidePanel 主动要求更新 toc
                getNotionToc();
                break;
            }
            case 'toc-locate': { // Note: sidePanel 主动要求定位到某个 heading
                try {
                    document.querySelector('.notion-page-content')?.querySelector(`[data-block-id="${data}"]`)?.scrollIntoView({behavior: 'smooth'});
                } catch (e) {
                    console.error('toc-locate fail:', e);
                }
                break;
            }
            case 'notion-block-id-get': { // Note: 获取当前 Notion 页面的 id
                const _url = location.href;
                console.log('_url:', _url);
                const url = new URL(_url);
                try {
                    const path = url.pathname.split('/');
                    const raw = path[path.length - 1].split('-');
                    const rawId = raw[raw.length - 1].split('');
                    const pos = [8, 13, 18, 23];
                    pos.forEach(p => {
                        rawId.splice(p, 0, '-');
                    });
                    // logToRenderer(`rawId:${rawId.join('')}`);
                    // FIXME: conect 是即时的，所以不用区分 name 了？
                    port.postMessage(rawId.join(''));
                    // return rawId.join('');
                } catch (e) {
                    port.postMessage(null);
                }
                break;
            }
            case 'notion-bookmark-desc-get': {
                const bookmarkDom = document.querySelector(`[data-block-id='${data}']`);
                if (!bookmarkDom) {
                    // Note: 该 bookmark 虽然类型是 bookmark 但是 dom 不存在，直接渲染链接
                    port.postMessage({});
                    break;
                }
                const title = bookmarkDom.querySelector('a > div:nth-child(1) > div:nth-child(1)')?.textContent || '';
                const desc = bookmarkDom.querySelector('a > div:nth-child(1) > div:nth-child(2)')?.textContent || '';
                const img = (bookmarkDom.querySelector('a > div:nth-child(2) img') as HTMLImageElement)?.src;
                // FIXME: img 可能存在于 notion 存储，需要转存一次
                port.postMessage({title, desc, img});
                break;
            }
            case 'reload' : { // Note: sidePanel 主动要求刷新页面
                break;
            }
            case 'back-to-top': { // Note: sidePanel 主动要求回到顶部
                break;
            }
            default: {
                break;
            }
        }
    });
});

window.addEventListener('load', () => {
    console.log('here');
    // Note: load 后短期内执行一次，不跟着 mouseup 或者 selectionchange 触发，以立即生成 toc
    getNotionToc();
    // Note: Notion 页面内导航是在 .notion-frame 中（也可能是 #notion-app 如数据表页面）
    //  因此需要监听该 dom 变化
    const frame = document.querySelector('#notion-app');
    if (frame) {
        let timer: NodeJS.Timeout;
        const mutationCb = (list: MutationRecord[]) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                if (list.some(muta => {
                    const target = muta.target as Element;
                    return (
                        target.closest
                            && target.closest('.notion-frame') // Note: page 和 database 等的共同父级是 notion-frame，不能直接用富文本的
                            && !target.querySelector('.dragHandle') // Note: 鼠标移入移出 block 的时候出现/消失拖拽按钮
                            && !document.querySelector('[data-overlay="true"]') // Note: 在 block 右键的时候会触发
                    );
                })) {
                    getNotionToc();
                }
            }, 200);
        };
        const observer = new MutationObserver(mutationCb);
        observer.observe(frame, {
            childList: true,
            subtree: true,
        });
    } else {
        _toSidePanel('toc-update', []);
    }

    // Note: selection change 的时候需要更新 aigc tab 的选区状态
    let timer: NodeJS.Timeout;
    const eventCb = (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            if (window.getSelection()?.type === 'None') {
                // Note: 此时判断是否为块级选中
                const selectBlock = [...document.querySelectorAll('.notion-selectable-halo')];
                if (selectBlock.length) {                        
                    // console.log('selectBlock:', selectBlock, target);
                    if (selectBlock.every(ele => {
                        return AIGC_BLOCKS.some(type => ele.parentElement?.classList.contains(`notion-${type}-block`))
                    })) {
                        // Note: 获取 block 选中的内容
                        const content = selectBlock.reduce((prev, curr) => {
                            return prev + curr?.parentElement?.textContent + '\n';
                        }, '');
                        _toSidePanel('aigc-select-content', content);
                    }
                }
            } else {
                _toSidePanel('aigc-select-content', window.getSelection()?.toString());
            }
        }, 200);
    };
    // EventBus.on('heading-locate', (msg) => {
    //     console.log('来自 heading-locate 的广播:', msg);
    // });
    document.addEventListener('selectionchange', eventCb);
    document.addEventListener('mouseup', eventCb);
});