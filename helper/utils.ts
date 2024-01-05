/**
 * 工具函数，不要导入任何环境相关的依赖如 electron，因为它会被 main 和 render 同时使用
 */
import reduxStore, { setPublisher, setAigc } from '$store';
import type { PublisherConfig, TocItem, Meta, AigcState, AigcData } from '$types';

// Note: callout/blockquote 颜色映射，其实 list 也能（其他可能也能？）设置颜色，但是没必要

const COLORS = {
    gray: 'rgb(120, 119, 116)',
    brown: 'rgb(159, 107, 83)',
    orange: 'rgb(217, 115, 13)',
    yellow: 'rgb(203, 145, 47)',
    green: 'rgb(68, 131, 97)',
    blue: 'rgb(51, 126, 169)',
    purple: 'rgb(144, 101, 176)',
    pink: 'rgb(193, 76, 138)',
    red: 'rgb(212, 76, 71)',
    gray_background: 'rgb(241, 241, 239)',
    brown_background: 'rgb(244, 238, 238)',
    orange_background: 'rgb(251, 236, 221)',
    yellow_background: 'rgb(251, 243, 219)',
    green_background: 'rgb(237, 243, 236)',
    blue_background: 'rgb(231, 243, 248)',
    purple_background: 'rgba(244, 240, 247, 0.8)',
    pink_background: 'rgba(249, 238, 243, 0.8)',
    red_background: 'rgb(253, 235, 236)',
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

// Note: 为了保持 main 和 render 接口一致
const logToRenderer = (..._msgs: any[]) => {
    if (process?.type === 'browser') {
        // console.log('_msgs::', _msgs);
        const msgs = _msgs.filter(Boolean).map(msg => {
            try {
                if (msg.toString() === '[object Object]') {
                    return JSON.stringify(msg);
                }
                // return JSON.stringify(msg);
                return msg.toString();
            } catch (err) {
                console.log('log error:', err);
                return ` [[log err: ${err.message}]] `;
            }
        }).join('');
        // viewRef.customView.webContents.send('dev-logs', msgs);
    } else {
        console.log('log:', _msgs);
        // window._toMain('dev-logs', ..._msgs);
    }
};

const getPublisherConfig = async (storage) => {
    // const config: Config = await window._toMain('config-get');
    const config: PublisherConfig = await storage.get('publisher-config');
    logToRenderer('get config:', config);
    if (!config || !config.notion) {
        const _config = {
            github: {
                token: '',
                branch: '',
                repo: '',
                owner: '',
            },
            oss: {
                secretId: '',
                secretKey: '',
                bucket: '',
                region: '',
            },
            notion: {
                token: '',
            },
            status: {
                configFold: false, // Note: 配置面板是否折叠
                functionFold: false, // Note: 功能面板是否折叠
                logFold: false, // Note: 日志面板是否折叠
            }
        };
        reduxStore.dispatch(setPublisher(_config));
    } else {
        reduxStore.dispatch(setPublisher(config));
    }
};

const getAigcConfig = async (storage) => {
    // const aigc: Aigc = await window._toMain('aigc-get');
    const aigc: AigcData = await storage.get('aigc-config');
    // TODO: 从持久化存储中获取
    logToRenderer('get aigc:', aigc);
    if (!aigc || (!aigc.model)) {
        const _aigc: AigcData = {
            key: {
                ChatGPT: '',
            },
            prompts: ['总结'],
            model: 'ChatGPT',
            temperature: '1.0',
            contextNum: '5',
            prompt: ''
        };
        reduxStore.dispatch(setAigc(_aigc));
    } else {
        reduxStore.dispatch(setAigc(aigc));
    }
}

// Note: contnet -> sidePanel
const _toSidePanel = (name, data?, cb?) => {
    var port = chrome.runtime.connect({name});
    port.postMessage({name, data});
    port.onMessage.addListener(cb);
};

const _toContent = (name, data?, cb?) => {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, ([tab]) => {
        const port = chrome.tabs.connect(tab.id, {name});
        port.postMessage({name, data});
        port.onMessage.addListener(cb);
    });
};

// Note: sidePanel -> content 要求更新 toc
const getToc = () => {
    // Note: 仅触发通知
    // window._toMain('toc-get');
    // _toContent('toc-update');
};

// Note: sidePanel -> content 要求定位到给定 heading
const locateHeading = (key: string) => {
    // _toContent('toc-locate', key);
    // window._toMain('toc-locate', {
    //     key,
    //     shouldNoti: true,
    // });
};

const notionGetToc = (cb: (type: 'toc' | 'selection', toc: TocItem[] | string) => void) => {
    const toc: TocItem[] = []
    const main = document.querySelector('.notion-page-content');
    if (!main) {
        cb('toc', toc);
        return;
    }
    if (main) {
        const container: Element[] = Array.from(main.children);
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
        cb('toc', toc);
    }
};

const notionMutation = (cb: (type: 'toc' | 'selection', arg: TocItem[] | string) => void) => {
    // Note: notion 为页面内导航，触发 natigation 事件后，移步的将内容塞入 notion-frame，因此需要监听该 dom 的变化
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
                    notionGetToc(cb);
                }
            }, 200);
        };
        const observer = new MutationObserver(mutationCb);
        observer.observe(frame, {
            childList: true,
            subtree: true,
        });
    } else {
        cb('toc', []);
    }
};

const notionSelectionChange = (cb: (content: string) => void) => {
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
                        cb(content);
                    }
                }
            } else {
                cb(window.getSelection()?.toString());
            }
        }, 200);
    };
    document.addEventListener('selectionchange', eventCb);
    document.addEventListener('mouseup', eventCb);
}

const notionLocateHeading = (key: string, cb: (prop: {type: 'fail' | 'succ', error?: Error}) => void) => {
    try {
        document.querySelector('.notion-page-content')?.querySelector(`[data-block-id="${key}"]`)?.scrollIntoView({behavior: 'smooth'});
        cb({
            type: 'succ'
        });
    } catch (e) {
        cb({
            type: 'fail',
            error: e,
        });
    }
};

const _inline = (list: any): string => {
    if (!list.length) {
        return '';
    }
    return list.reduce((prev: any, curr: any) => {
        const annotations = Object.keys(curr?.annotations || []).reduce((prev, style) => {
            if (curr.annotations[style]) {
                switch (style) {
                    case 'code': {
                        return prev += '`';
                    }
                    case 'bold': {
                        return prev += '**';
                    }
                    case 'strikethrough': {
                        return prev += '~~';
                    }
                    case 'italic': {
                        return prev += '*';
                    }
                    default: {
                        return prev;
                    }
                    // Note: markdown 不支持 underline
                    /* case 'underline': {
                        return prev += '-';
                    } */
                }
            }
            return prev;
        }, '');
        const annotationsReverse = annotations.split('').reverse().join('');
        const content = curr[curr.type].content || curr[curr.type].expression;
        const isLink = curr[curr.type].link;
        if (isLink) {
            return prev += `[${annotations}${content}${annotationsReverse}](${isLink})`;
        }
        return prev += `${annotations}${content}${annotationsReverse}`;
    }, '');
};

// Note: indent 表示子元素缩进层级
const notion2markdown = async function (list: any, meta: Meta, indent: number, debug: boolean,) {
    if (!Array.isArray(list)) {
        logToRenderer('notion2markdown参数不是数组');
        throw new Error('params is not array!');
    }
    /* if (!list.length) {
        return Promise.resolve('');
    } */
    // FIXME: 我时常在想，既然都写 render_xxx 的 Jekyll ruby 插件了，为啥不直接写 html 标签呢？我是不是傻 =_=
    return Promise.all(list.filter(item => item.object === 'block').map(item => {
        return (async (): Promise<any> => {
            const type = item.type;
            const block: {
                [key: string]: any;
            } = item[item.type];
            switch (type) {
                case 'paragraph': {
                    return `${_inline(block.rich_text)}\n`;
                }
                case 'bookmark': {
                    // FIXME: API 接口本身不含 bookmark 的图片信息，所以需要调用 api 直接查询 notion 的 dom
                    // await window._toMain('notion-bookmark-desc-get', item.id);
                    // Note: 接收来自 main 的通知
                    return await new Promise((res) => {
                        /* window._fromMainOnce(`send-bookmark-desc-${item.id}`, (_, props) => {
                            const {content: {title = '', desc = '', img = ''}} = props;
                            if (title || desc || img) {
                                res(`{% render_bookmark url="${block.url}" title="${title}" img="${img}" yid="" bid="" %}\n${desc}\n{% endrender_bookmark %}\n`);
                            } else {
                                // Note: 从 notion 获取 bookmark 信息失败，直接使用链接
                                res(`${block.url}\n`);
                            }
                        }); */
                    });
                }
                case 'image': {
                    // Note: unsplash 图片是 block.external，自己上传的是 block.file
                    const url = block[block.type]?.url;
                    if (url) {
                        // const ossUrl = await window._toMain('notion-image-upload', {url, meta, id: item.id, debug});
                        const ossUrl = await api.uploadNotionImageToOSS('notion-image-upload', {url, meta, id: item.id, debug});
                        const caption = _inline(block.caption);
                        return `{% render_caption caption="${caption}" img="${ossUrl}" %}\n![${caption}](${ossUrl})\n{% endrender_caption %}\n`
                    }
                    return `[图片 url 不存在]\n`;
                }
                case 'heading_1': {
                    return `# ${_inline(block.rich_text)}\n`
                }
                case 'heading_2': {
                    return `## ${_inline(block.rich_text)}\n`
                }
                case 'heading_3': {
                    return `### ${_inline(block.rich_text)}\n`
                }
                case 'table': {
                    // FIXME: 需要递归查找 table 元素内容 table_row
                    // const tableRows = await window._toMain('notion-content-get', item.id);
                    // Note: 构建一个表格
                    return tableRows.reduce((prev: any, curr: any, index: number) => {
                        const cells = curr[curr.type].cells;
                        let divider = '';
                        const cellsString = cells.map((cell: any, key: number) => {
                            const str = `| ${_inline(cell)} `;
                            if (key === cells.length - 1) {
                                divider += `| ---------- |\n`;
                                return `${str}|`
                            }
                            divider += `| ---------- `;
                            return str;
                        }).join('');
                        return prev += `${cellsString}\n${index === 0 ? divider : ''}`;
                    }, '')
                }
                case 'to_do': {
                    // Note: 又是一个富文本，注意需要 item.checked 来确定是否为 checked 了
                    // Note: 这几个 list 的后代也是 list，但是并不直接显示，需要查找子元素（无语了）
                    let children = [];
                    let _indent = indent;
                    if (item.has_children) {
                        // children = await window._toMain('notion-content-get', item.id);
                    }
                    const isChecked = block.checked;
                    return `${Array.from({length: indent * 4}).fill(' ').join('')}${isChecked ? '- [x] ' : '- [ ] '}${_inline(block.rich_text)}\n${(await notion2markdown(children, meta, ++_indent, debug)).join('')}`;
                }
                case 'numbered_list_item': {
                    let children = [];
                    let _indent = indent;
                    if (item.has_children) {
                        // children = await window._toMain('notion-content-get', item.id);
                    }
                    return `${Array.from({length: indent * 4}).fill(' ').join('')}1. ${_inline(block.rich_text)}\n${(await notion2markdown(children, meta, ++_indent, debug)).join('')}`;
                }
                case 'bulleted_list_item': {
                    let children = [];
                    let _indent = indent;
                    if (item.has_children) {
                        // children = await window._toMain('notion-content-get', item.id);
                    }
                    return `${Array.from({length: indent * 4}).fill(' ').join('')}* ${_inline(block.rich_text)}\n${(await notion2markdown(children, meta, ++_indent, debug)).join('')}`;
                }
                case 'quote': {
                    const text = _inline(block.rich_text);
                    // Note: notion 的 quote 还能设置背景色，但是我感觉太丑了，所以仅读取了 Notion 的颜色（左侧边框颜色+字体颜色）
                    // Note: 顺便设置一下颜色/背景色（与 Notion 同步）
                    return `{% render_quote color="${COLORS[block.color as keyof typeof COLORS] || ''}" %}${text}{% endrender_quote %}\n`;
                }
                case 'callout': {
                    // Note: callout markdown 不支持，也当成 quote
                    // TODO: jekyll 添加插件支持处理 callout
                    const icon = block.icon[block.icon.type];
                    const text = _inline(block.rich_text);
                    // Note: 顺便设置一下颜色/背景色（与 Notion 同步）
                    const blockColor = block.color.split('_');
                    const finalColor = COLORS[block.color as keyof typeof COLORS];
                    let color = '';
                    let bgColor = '';
                    blockColor.length === 2 ? (bgColor = finalColor || '') : (color = finalColor || '');
                    return `{% render_callout icon="${icon}" color="${color}" bgcolor="${bgColor}" %}${text}{% endrender_callout %}\n`;
                }
                case 'divider': {
                    return `---\n`;
                }
                case 'video': {
                    // Note: 分两种，一种是嵌入的在线视频如 Youtube，一种是自己上传的视频
                    const _url = block[block.type]?.url;
                    const caption = _inline(block.caption);
                    if (_url) {
                        if (block.type === 'file') {
                            // Note: 获取文件后缀
                            // const _ossUrl = await window._toMain('notion-image-upload', {url: _url, meta, id: item.id, debug});
                            let suffix = '';
                            const ossUrl = new URL(_ossUrl);
                            const arr = ossUrl.pathname.split('.');
                            if (arr.length > 1) {
                                suffix = arr[arr.length - 1];
                            }
                            return `{% render_video caption="${caption}" img="${ossUrl}" suffix="${suffix}" %}\n![${caption}](${ossUrl})\n{% endrender_video %}\n`;
                        } else if (block.type === 'external') {
                            // Note: 目前只支持 Youtube 和 Bilibili
                            const url = new URL(_url);
                            let yid = '';
                            let bid = '';
                            if (url.hostname === 'www.youtube.com') {
                                for (const i of url.searchParams) {
                                    if (i[0] === 'v') {
                                        yid = i[1];
                                    }
                                }
                            } else if (url.hostname === 'www.bilibili.com') {
                                bid = url.pathname.split('/').filter(Boolean)[1];
                            }
                            return `{% render_bookmark url="${_url}" title="${caption || ''}" img="" yid="${yid}" bid="${bid}" %}{% endrender_bookmark %}\n`;
                        }
                    }
                    return '[视频 url 不存在]\n';
                }
                case 'code': {
                    return `\`\`\`${block.language}\n${_inline(block.rich_text)}\n\`\`\`\n`;
                }
                case 'embed': {
                    // FIXME: 使用 jekyll 支持一下也不是不行
                    return '嵌入音乐暂不支持\n';
                }
                default: {
                    return `不支持的类型 ${item.type}\n`;
                }
            }
        })();
    }));
};

const notionMeta2string = (meta: Meta): string => {
    const {
        title = '',
        cos = '',
        tags = [],
        date = '',
        categories = '',
        reference = '',
        headerStyle = '',
        headerMask = '',
        path = '',
        callout = '',
        noCatalog = '',
        lastUpdateTime = '',
        headerImg = '',
        notion = '',
    } = meta;
    const tagsString = `${tags.map((tag, k) => '    - ' + tag + (k === tags.length - 1 ? '' : '\n')).join('')}`
    const _date = new Date(date);
    const dateString = `${_date.getFullYear()}-${_date.getMonth() + 1}-${_date.getDate()} ${_date.getHours()}:${_date.getMinutes()}:00 +0800`
    const _lastUpdateTime = lastUpdateTime ? new Date(lastUpdateTime) : '';
    const lastUpdateString = _lastUpdateTime && `${_lastUpdateTime.getFullYear()}-${_lastUpdateTime.getMonth() + 1}-${_lastUpdateTime.getDate()} ${_date.getHours()}:${_date.getMinutes()}:00 +0800`;
    return `---
title: ${title}
layout: post
date: ${dateString}
cos: ${cos}
path: ${path}
header-mask: ${headerMask}
header-style: ${headerStyle}
callout: ${callout}
categories: ${categories}
reference: ${reference}
no-catalog: ${noCatalog}
lastUpdateTime: ${lastUpdateString}
header-img: ${headerImg}
notion: ${notion}
tags:
${tagsString}
---

`;
};

const normalizeNum = (num: number) => {
    if (String(num).length > 1) {
        return String(num);
    }
    return '0' + String(num);
};

const getISODateTime = (time: Date): string => {
    const year = time.getFullYear(),
    month = time.getMonth() + 1, // 月份取值0-11
    date = time.getDate(),
    hour = time.getHours(),
    minute = time.getMinutes(),
    second = time.getSeconds();
    // Note: Notion 接受 ISO 8601 格式的日期字符串
  return `${year}-${normalizeNum(month)}-${normalizeNum(date)}T${normalizeNum(hour)}:${normalizeNum(minute)}:${normalizeNum(second)}.000+08:00`;
}



export {
    getPublisherConfig,
    getToc,
    getAigcConfig,
    locateHeading,
    notionGetToc,
    _inline,
    notionMutation,
    notionLocateHeading,
    notion2markdown,
    notionMeta2string,
    logToRenderer,
    getISODateTime,
    notionSelectionChange,
    _toSidePanel,
    _toContent,
}
