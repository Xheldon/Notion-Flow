/**
 * 工具函数，不要导入任何环境相关的依赖如 electron，因为它会被 main 和 render 同时使用
 */
import reduxStore, { setPublisher, setAigc, setLogs } from '$store';
import type { PublisherConfig, TocItem, Meta, AigcData, PublisherOptions } from '$types';
import { Storage, } from "@plasmohq/storage"

import * as Lang from '$lang';

// import api from '$api';

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

const EventBus = {
    events: {},
    on(id, cb) {
        this.events[id] = cb;
    },
    off(id, cb) {
        if (!this.events[id]) {
            return;
        }
        this.events[id] = null;
    },
    dispatch(id, ...args) {
        if (!this.events[id]) {
            return;
        }
        this.events[id](...args);
    },
};

// Note: 美化现实对象
function prettyFormat(str) {
    try {
        // 设置缩进为2个空格
        str = JSON.stringify(JSON.parse(str), null, 2);
        str = str
            .replace(/&/g, '&')
            .replace(/</g, '<')
            .replace(/>/g, '>');
        return str.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            var cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    } catch (e) {
        alert("Error Message:" + e);
    }
}


// Note: 为了保持 main 和 render 接口一致
const logToRenderer = (type, header, ..._msgs: any[]) => {
    const msgs = _msgs.filter(Boolean).map(msg => {
        try {
            if (msg.toString() === '[object Object]') {
                return (`<pre>${prettyFormat(JSON.stringify(msg))}</pre>`);
            }
            return msg.toString();
        } catch (err) {
            console.log('log error:', err);
            return ` [[log err: ${err.message}]] `;
        }
    }).join('');
    reduxStore.dispatch(setLogs({
        type,
        header,
        msgs,
    }));
};

const getPublisherConfig = async (storage) => {
    const config: PublisherConfig = await storage.get('publisher-config');
    const options: PublisherOptions = await storage.get('options');
    if (!config) {
        const _config = {
            pluginFold: false, // Note: 插件面板是否折叠
            functionFold: false, // Note: 功能面板是否折叠
            logFold: false, // Note: 日志面板是否折叠
        };
        reduxStore.dispatch(setPublisher(_config));
    } else {
        reduxStore.dispatch(setPublisher(config));
    }
    logToRenderer('info', options?.language  === 'cn' ? '[Notion Flow] 获取发布 tab 配置:' : '[Notion Flow] Get publisher config:', config);
};

const getAigcConfig = async (storage) => {
    const aigc: AigcData = await storage.get('aigc-config');
    const options: PublisherOptions = await storage.get('options');
    // TODO: 从持久化存储中获取
    logToRenderer('info',
    options?.language === 'cn' ? '[Notion Flow] 获取 AIGC 配置:' : '[Notion Flow] Get aigc config:', aigc);
    if (!aigc || !aigc.model) {
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
    chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
        const port = chrome.tabs.connect(tab.id, {name});
        port.postMessage({name, data});
        port.onMessage.addListener(cb);
    });
};

const notionGetToc = (cb: (type: 'toc' | 'selection', toc: TocItem[] | string) => void) => {
    const toc: TocItem[] = []
    const main = document.querySelector('.notion-page-content');
    if (!main) {
        cb('toc', toc);
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

// TODO: 引入插件系统，支持用户自定义 notion block 转换函数处理 markdown；增强健壮性。
// Note: indent 表示子元素缩进层级
const notion2markdown = async function (list: any, meta: Meta, indent: number, debug: boolean,) {
    const storage = new Storage();
    return storage.get<PublisherOptions>('options').then((props) => {
        const {language: lang} = props;
        const cn = lang === 'cn';
        if (!Array.isArray(list)) {
            logToRenderer('error',
                cn ? '[Notion] Notion 子元素需要是个数组:' : '[Notion] Notion child need to be an array:', list);
            return Promise.reject(null);
        }
        return Promise.all(list.filter(item => item.object === 'block').map(item => {
            return (async () => {
                const type = item.type;
                const id = item.id;
                const block: {
                    [key: string]: any;
                } = item[item.type];
                switch (type) {
                    case 'paragraph': {
                        const text = _inline(block.rich_text);
                        return new Promise((res) => {
                            block.text = text;
                            return this.postMessage({
                                type,
                                block,
                                id,
                            }).then(({result}) => {
                                if (result) {
                                    logToRenderer('info',
                                        cn ? '[Notion Flow] 启用自定义 「段落」 转换' : '[Notion Flow] Enable custom paragraph conversion');
                                    res(result + '\n');
                                } else {
                                    // Note: 为 null 表示插件 function 执行出错
                                    if (result === null) {
                                        logToRenderer('error',
                                            cn ? `[Notion Flow] ${type} 模块转换函数出错` : `[Notion Flow] Block ${type} conversion function error`);
                                    }
                                    logToRenderer('info',
                                    cn ? '[Notion Flow] 使用默认段落格式' : '[Notion Flow] Use default paragraph style');
                                    res(`${text}\n`);
                                }
                            });
                        });
                    }
                    case 'bookmark': {
                        // Note: API 接口本身不含 bookmark 的图片信息，所以需要调用 api 直接查询 notion 的 dom
                        return new Promise((res) => {
                            _toContent('notion-bookmark-desc-get', id, (props) => {
                                const {title = '', desc = '', img = ''} = props;
                                block.title = title;
                                block.desc = desc;
                                block.img = img;
                                if (title || desc || img) {
                                    return this.postMessage({
                                        type,
                                        block,
                                        id,
                                    }).then(({result}) => {
                                        if (result) {
                                            logToRenderer('info',
                                                cn ? '[Notion Flow] 启用自定义 「Bookmark」 转换' : '[Notion Flow] Enable custom bookmark conversion');
                                            res(result + '\n');
                                        } else {
                                            if (result === null) {
                                                logToRenderer('error',
                                                    cn ? `[Notion Flow] ${type} 模块转换函数出错` : `[Notion Flow] Block ${type} conversion function error`);
                                            }
                                            logToRenderer('info',
                                                cn ? '[Notion Flow] 使用默认 Bookmark 格式（链接）' : '[Notion Flow] Use default bookmark style');
                                            res(`[${block.url}](${block.url})\n`);
                                        }
                                    });
                                    // res(`{% render_bookmark url="${block.url}" title="${title}" img="${img}" yid="" bid="" %}\n${desc}\n{% endrender_bookmark %}\n`);
                                } else {
                                    logToRenderer('info',
                                        cn ? '[Notion Flow] 从页面中获取 Bookmark 信息错误，将使用默认链接格式' : '[Notion Flow] Get info from page error, use default bookmark style');
                                    // Note: 从 notion 获取 bookmark 信息失败，直接使用链接
                                    res(`[${block.url}](${block.url})\n`);
                                }
                            });
                        });
                    }
                    case 'image': {
                        // Note: unsplash 图片是 block.external，自己上传的是 block.file
                        const url = block[block.type]?.url;
                        if (url) {
                            return this.uploadNotionImageToOSS({url, meta, id, debug}).then(ossUrl => {
                                if (!ossUrl) {
                                    return Promise.resolve('');
                                }
                                const caption = _inline(block.caption);
                                return new Promise((res) => {
                                    block.url = ossUrl;
                                    block.caption = caption;
                                    return this.postMessage({
                                        type,
                                        block,
                                        id,
                                    }).then(({result}) => {
                                        if (result) {
                                            logToRenderer('info',
                                                cn ? '[Notion Flow] 启用自定义 「图片」 转换' : '[Notion Flow] Enable custom image conversion');
                                            res(result + '\n');
                                        } else {
                                            if (result === null) {
                                                logToRenderer('error',
                                                    cn ? `[Notion Flow] ${type} 模块转换函数出错` : `[Notion Flow] Block ${type} conversion function error`);
                                            }
                                            logToRenderer('info',
                                                cn ? '[Notion Flow] 使用默认图片格式' : '[Notion Flow] Use default image style');
                                            res(`![${caption}](${ossUrl})\n`);
                                        }
                                    });
                                });
                            });
                            // return `{% render_caption caption="${caption}" img="${ossUrl}" %}\n![${caption}](${ossUrl})\n{% endrender_caption %}\n`
                        }
                        return Promise.resolve('');
                    }
                    case 'heading_1': {
                        const text = _inline(block.rich_text);
                        return new Promise((res) => {
                            block.text = text;
                            return this.postMessage({
                                type,
                                block,
                                id,
                            }).then(({result}) => {
                                if (result) {
                                    logToRenderer('info',
                                        cn ? '[Notion Flow] 启用自定义 「Heading_1」 转换' : '[Notion Flow] Enable custom heading_1 conversion');
                                    res(result + '\n');
                                } else {
                                    if (result === null) {
                                        logToRenderer('error',
                                            cn ? `[Notion Flow] ${type} 模块转换函数出错` : `[Notion Flow] Block ${type} conversion function error`);
                                    }
                                    logToRenderer('info',
                                        cn ? '[Notion Flow] 使用默认 heading_1 格式' : '[Notion Flow] Use default heading_1 style');
                                    res(`# ${text}\n`);
                                }
                            });
                        });
                    }
                    case 'heading_2': {
                        const text = _inline(block.rich_text);
                        return new Promise((res) => {
                            block.text = text;
                            return this.postMessage({
                                type,
                                block,
                                id,
                            }).then(({result}) => {
                                if (result) {
                                    logToRenderer('info',
                                        cn ? '[Notion Flow] 启用自定义 「Heading_2」 转换' : '[Notion Flow] Enable custom heading_2 conversion');
                                    res(result + '\n');
                                } else {
                                    if (result === null) {
                                        logToRenderer('error',
                                            cn ? `[Notion Flow] ${type} 模块转换函数出错` : `[Notion Flow] Block ${type} conversion function error`);
                                    }
                                    logToRenderer('info',
                                        cn ? '[Notion Flow] 使用默认 heading_2 格式' : '[Notion Flow] Use default heading_2 style');
                                    res(`## ${text}\n`);
                                }
                            });
                        });
                    }
                    case 'heading_3': {
                        const text = _inline(block.rich_text);
                        return new Promise((res) => {
                            block.text = text;
                            return this.postMessage({
                                type,
                                block,
                                id,
                            }).then(({result}) => {
                                if (result) {
                                    logToRenderer('info',
                                        cn ? '[Notion Flow] 启用自定义 「Heading_3」 转换' : '[Notion Flow] Enable custom heading_3 conversion');
                                    res(result + '\n');
                                } else {
                                    if (result === null) {
                                        logToRenderer('error',
                                            cn ? `[Notion Flow] ${type} 模块转换函数出错` : `[Notion Flow] Block ${type} conversion function error`);
                                    }
                                    logToRenderer('info',
                                        cn ? '[Notion Flow] 使用默认 heading_3 格式' : '[Notion Flow] Use default heading_3 style');
                                    res(`### ${text}\n`);
                                }
                            });
                        });
                    }
                    case 'table': {
                        // FIXME: 需要递归查找 table 元素内容 table_row
                        return this.getNotionContent(id).then(tableRows => {
                            return new Promise((res) => {
                                block.rows = tableRows;
                                return this.postMessage({
                                    type,
                                    block,
                                    id,
                                }).then(({result}) => {
                                    if (result) {
                                        logToRenderer('info',
                                            cn ? '[Notion Flow] 启用自定义 「表格」 转换' : '[Notion Flow] Enable custom table conversion');
                                        res(result + '\n');
                                    } else {
                                        if (result === null) {
                                            logToRenderer('error',
                                                cn ? `[Notion Flow] ${type} 模块转换函数出错` : `[Notion Flow] Block ${type} conversion function error`);
                                        }
                                        logToRenderer('info',
                                            cn ? '[Notion Flow] 使用默认表格格式' : '[Notion Flow] Use default table style');
                                        res(tableRows.reduce((prev: any, curr: any, index: number) => {
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
                                        }, ''));
                                    }
                                });
                            });
                        });
                    }
                    case 'to_do': {
                        // Note: 又是一个富文本，注意需要 item.checked 来确定是否为 checked 了
                        // Note: 这几个 list 的后代也是 list，但是并不直接显示，需要查找子元素（无语了）
                        let children = [];
                        let _indent = indent;
                        if (item.has_children) {
                            children = await this.getNotionContent(id);
                        }
                        const isChecked = block.checked;    
                        try {
                            return `${Array.from({length: indent * 4}).fill(' ').join('')}${isChecked ? '- [x] ' : '- [ ] '}${_inline(block.rich_text)}\n${(await notion2markdown.bind(this)(children, meta, ++_indent, debug)).join('')}`;
                        } catch (e) {
                            logToRenderer('error', 
                                cn ? '[Notion Flow] to_do to markdown 发生错误:' : '[Notion Flow] Error happen when to_do to markdown:', e);
                            return Promise.reject(null);
                        } 
                    }
                    case 'numbered_list_item': {
                        let children = [];
                        let _indent = indent;
                        if (item.has_children) {
                            children = await this.getNotionContent(id);
                        }
                        try {
                            return `${Array.from({length: indent * 4}).fill(' ').join('')}1. ${_inline(block.rich_text)}\n${(await notion2markdown.bind(this)(children, meta, ++_indent, debug)).join('')}`;
                        } catch (e) {
                            logToRenderer('error', 
                                cn ? '[Notion Flow] numbered_list_item to markdown 发生错误:' : '[Notion Flow] Error happen when numbered_list_item to markdown:', e);
                            return Promise.reject(null);
                        }
                    }
                    case 'bulleted_list_item': {
                        let children = [];
                        let _indent = indent;
                        if (item.has_children) {
                            children = await this.getNotionContent(id);
                        }
                        try {
                            return `${Array.from({length: indent * 4}).fill(' ').join('')}* ${_inline(block.rich_text)}\n${(await notion2markdown.bind(this)(children, meta, ++_indent, debug)).join('')}`;
                        } catch (e) {
                            logToRenderer('error', 
                                cn ? '[Notion Flow] bulleted_list_item to markdown 发生错误:' : '[Notion Flow] Error happen when bulleted_list_item to markdown:', e);
                            return Promise.reject(null);
                        }
                    }
                    case 'quote': {
                        const text = _inline(block.rich_text);
                        block.text = text;
                        block.color = COLORS[block.color as keyof typeof COLORS];
                        // Note: notion 的 quote 还能设置背景色，但是我感觉太丑了，所以仅读取了 Notion 的颜色（左侧边框颜色+字体颜色）
                        // Note: 顺便设置一下颜色/背景色（与 Notion 同步）
                        return new Promise((res) => {
                            return this.postMessage({
                                type,
                                block,
                                id,
                            }).then(({result}) => {
                                if (result) {
                                    logToRenderer('info',
                                        cn ? '[Notion Flow] 启用自定义 「blockquote」 转换' : '[Notion Flow] Enable custom quote conversion');
                                    res(result + '\n');
                                } else {
                                    if (result === null) {
                                        logToRenderer('error',
                                            cn ? `[Notion Flow] ${type} 模块转换函数出错` : `[Notion Flow] Block ${type} conversion function error`);
                                    }
                                    logToRenderer('info',
                                        cn ? '[Notion Flow] 使用默认 blockquote 格式' : '[Notion Flow] Use default quote style');
                                    res(`> ${text}\n`);
                                }
                            });
                        });
                        // return `{% render_quote color="${COLORS[block.color as keyof typeof COLORS] || ''}" %}${text}{% endrender_quote %}\n`;
                    }
                    case 'callout': {
                        // Note: callout markdown 不支持，也当成 quote
                        const text = _inline(block.rich_text);
                        /* if (!transCallout) {
                            logToRenderer('info', '[Github] Disable Jekyll Image conversion，use Blockquote Markdown style');
                            return `> ${text}\n`;
                        } */
                        const icon = block.icon[block.icon.type];
                        // Note: 顺便设置一下颜色/背景色（与 Notion 同步）
                        const blockColor = block.color.split('_');
                        const finalColor = COLORS[block.color as keyof typeof COLORS];
                        let color = '';
                        let bgColor = '';
                        blockColor.length === 2 ? (bgColor = finalColor || '') : (color = finalColor || '');
                        return new Promise((res) => {
                            block.icon = icon;
                            block.text = text;
                            block.color = color;
                            block.bgColor = bgColor;
                            return this.postMessage({
                                type,
                                block,
                                id,
                            }).then(({result}) => {
                                if (result) {
                                    logToRenderer('info',
                                        cn ? '[Notion Flow] 启用自定义 「Callout」 转换' : '[Notion Flow] Enable custom callout conversion');
                                    res(result + '\n');
                                } else {
                                    if (result === null) {
                                        logToRenderer('error',
                                            cn ? `[Notion Flow] ${type} 模块转换函数出错` : `[Notion Flow] Block ${type} conversion function error`);
                                    }
                                    logToRenderer('info',
                                        cn ? '[Notion Flow] 使用默认 Callout 格式' : '[Notion Flow] Use default callout style');
                                    res(`> ${text}\n`);
                                }
                            });
                        });
                        // return `{% render_callout icon="${icon}" color="${color}" bgcolor="${bgColor}" %}${text}{% endrender_callout %}\n`;
                    }
                    case 'divider': {
                        return new Promise((res) => {
                            return this.postMessage({
                                type,
                                block,
                                id,
                            }).then(({result}) => {
                                if (result) {
                                    logToRenderer('info',
                                        cn ? '[Notion Flow] 启用自定义 「分隔线」 转换' : '[Notion Flow] Enable custom divider conversion');
                                    res(result + '\n');
                                } else {
                                    if (result === null) {
                                        logToRenderer('error',
                                            cn ? `[Notion Flow] ${type} 模块转换函数出错` : `[Notion Flow] Block ${type} conversion function error`);
                                    }
                                    logToRenderer('info',
                                        cn ? '[Notion Flow] 使用默认分隔线样式' : '[Notion Flow] Use default divider style');
                                    res(`---\n`);
                                }
                            });
                        });
                    }
                    case 'video': {
                        // Note: 分两种，一种是嵌入的在线视频如 Youtube，一种是自己上传的视频
                        const _url = block[block.type]?.url;
                        const caption = _inline(block.caption);
                        if (_url) {
                            if (block.type === 'file') {
                                // Note: 获取文件后缀
                                try {
                                    const _ossUrl = await this.uploadNotionImageToOSS({url: _url, meta, id: item.id, debug});
                                    if (!_ossUrl) {
                                        // Note: 如果 ossUrl 不存在，可能是 oss 服务未配置，忽略上传该文件
                                        return  Promise.resolve('');
                                    }
                                    let suffix = '';
                                    const ossUrl = new URL(_ossUrl);
                                    const arr = ossUrl.pathname.split('.');
                                    if (arr.length > 1) {
                                        suffix = arr[arr.length - 1];
                                    }
                                    return new Promise((res) => {
                                        block.url = _ossUrl;
                                        block.caption = caption;
                                        block.suffix = suffix;
                                        return this.postMessage({
                                            type,
                                            block,
                                            id,
                                        }).then(({result}) => {
                                            if (result) {
                                                logToRenderer('info',
                                                    cn ? '[Notion Flow] 启用自定义 「Video」 转换' : '[Notion Flow] Enable custom video conversion');
                                                res(result + '\n');
                                            } else {
                                                if (result === null) {
                                                    logToRenderer('error',
                                                        cn ? `[Notion Flow] ${type} 模块转换函数出错` : `[Notion Flow] Block ${type} conversion function error`);
                                                }
                                                logToRenderer('info', 
                                                    cn ? '[Notion Flow] 使用默认 video 格式（链接）' : '[Notion Flow] Use default video style');
                                                return `[${_ossUrl}](${_ossUrl})\n`;
                                            }
                                        });;
                                    });
                                } catch (e) {
                                    logToRenderer('error', 
                                        cn ? '[Notion Flow] 上传视频文件失败:' : '[Notion Flow] Upload video file error:', e);
                                        return Promise.reject(null);
                                }
                                // return `{% render_video caption="${caption}" img="${_ossUrl}" suffix="${suffix}" %}\n![${caption}](${_ossUrl})\n{% endrender_video %}\n`;
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
                                return new Promise((res) => {
                                    block.bid = bid;
                                    block.yid = yid;
                                    block.caption = caption;
                                    block.url = _url;
                                    return this.postMessage({
                                        type,
                                        block,
                                        id,
                                    }).then(({result}) => {
                                        if (result) {
                                            logToRenderer('info',
                                                cn ? '[Notion Flow] 自定义外部 「Video」 转换' : '[Notion Flow] Enable custom video conversion');
                                            res(result + '\n');
                                        } else {
                                            if (result === null) {
                                                logToRenderer('error',
                                                    cn ? `[Notion Flow] ${type} 模块转换函数出错` : `[Notion Flow] Block ${type} conversion function error`);
                                            }
                                            logToRenderer('info',
                                                cn ? '[Notion Flow] 使用默认外部视频格式（链接）' : '[Notion Flow] Use default external video style');
                                            return `[${_url}](${_url})\n`;
                                        }
                                    });;
                                });
                                // return `{% render_bookmark url="${_url}" title="${caption || ''}" img="" yid="${yid}" bid="${bid}" %}{% endrender_bookmark %}\n`;
                            }
                        }
                        return '[NO video url]\n';
                    }
                    case 'code': {
                        const text = _inline(block.rich_text);
                        return new Promise((res) => {
                            block.text = text;
                            return this.postMessage({
                                type,
                                block,
                                id,
                            }).then(({result}) => {
                                if (result) {
                                    logToRenderer('info',
                                        cn ? '[Notion Flow] 启用自定义 「blockcode」 转换' : '[Notion Flow] Enable custom blockcode conversion');
                                    res(result + '\n');
                                } else {
                                    if (result === null) {
                                        logToRenderer('error',
                                            cn ? `[Notion Flow] ${type} 模块转换函数出错` : `[Notion Flow] Block ${type} conversion function error`);
                                    }
                                    logToRenderer('info',
                                        cn ? '[Notion Flow] 使用默认 blockcode 格式' : '[Notion Flow] Use default blockcode style');
                                    res(`\`\`\`${block.language}\n${text}\n\`\`\`\n`);
                                }
                            });
                        });
                        // return `\`\`\`${block.language}\n${text}\n\`\`\`\n`;
                    }
                    case 'equation': {
                        const text = block.expression;
                        return new Promise((res) => {
                            block.text = text;
                            return this.postMessage({
                                type,
                                block,
                                id,
                            }).then(({result}) => {
                                if (result) {
                                    logToRenderer('info',
                                        cn ? '[Notion Flow] 启用自定义公式转换' : '[Notion Flow] Enable custom equation conversion');
                                    res(result + '\n');
                                } else {
                                    if (result === null) {
                                        logToRenderer('error',
                                            cn ? `[Notion Flow] ${type} 模块转换函数出错` : `[Notion Flow] Block ${type} conversion function error`);
                                    }
                                    logToRenderer('info',
                                        cn ? '[Notion Flow] 使用默认 equation 格式' : '[Notion Flow] Use default equation style');
                                    res(`$$${text}$$\n`);
                                }
                            });
                        });
                        // return `$$${text}$$\n`;
                    }
                    default: {
                        return new Promise((res) => {
                            return this.postMessage({
                                type,
                                block,
                                id,
                            }).then(({result}) => {
                                if (result) {
                                    logToRenderer('info',
                                        cn ? `[Notion Flow] 启用自定义「${type}」转换` : `[Notion Flow] Enable custom ${type} conversion`);
                                    res(result + '\n');
                                } else {
                                    if (result === null) {
                                        logToRenderer('error',
                                            cn ? `[Notion Flow] ${type} 模块转换函数出错` : `[Notion Flow] Block ${type} conversion function error`);
                                    }
                                    logToRenderer('warn',
                                    cn ? `不支持的模块类型，而且也未自定义模块类型转换，将返回空` : `No support type: ${type}, return empty`);
                                    res('');
                                }
                            });
                        });
                        // return `No support type: ${item.type}\n`;
                    }
                }
            })();
        }));
    });
};

const parserProperty = (value, {meta}) => {
    // Note: 可用的变量有 YYYY、YY、MM、DD 及 meta 属性
    const date = new Date(meta.date);
    const YYYY = `${date.getFullYear()}`;
    const YY = `${date.getFullYear()}`.slice(-2);
    const MM = `${date.getMonth() + 1}`;
    const DD = `${date.getDate()}`;
    const replacements = { YYYY, YY, DD, MM, ...meta };
    return value.replace(/{{(.*?)}}/g, (match, key) => {
        return replacements[key] || match;
    });
};

const notionMeta2string = (meta: Meta): Promise<string> => {
    const {
        title = '',
        date = '',
        name = '',
        lastUpdateTime = '',
        ...rest
    } = meta;
    const storage = new Storage();
    return storage.get<PublisherOptions>('options').then((props) => {
        const {language: lang, publisher} = props || {};
        const cn = lang === 'cn';
        const {frontMatter} = publisher || {};
        let fM = '';
        if (frontMatter) {
            try {
                const arr = frontMatter.split(',');
                arr.forEach((item, key) => {
                    fM += `${item.trim()}${key === arr.length - 1 ? '' : '\n'}`;
                });
            } catch (e) {
                logToRenderer('error',
                    cn ? '[Notion Flow] Front Matter 配置错误, 忽略之:' : '[Flow] Front Matter config error, it will be ignored:', e);
            }
        }
        // Note: 数组会被表示为 name: \n -item1\n -item2\n，典型的有 tags
        const _date = new Date(date);
        const dateString = `${_date.getFullYear()}-${_date.getMonth() + 1}-${_date.getDate()} ${_date.getHours()}:${_date.getMinutes()}:00 +0800`;
        let _lastUpdateTime = '';
        if (publisher.autoAddLastUpdateTime) {
            logToRenderer('info',
                cn ? '[Github] 添加 「lastUpdateTime」 Front Matter' : '[Github] Will add 「lastUpdateTime」 frontmatter');
            const _ = new Date();
            _lastUpdateTime = `${_.getFullYear()}-${_.getMonth() + 1}-${_.getDate()} ${_.getHours()}:${_.getMinutes()}:00 +0800`
        }
        return `---
    title: ${title}
    date: ${dateString}${_lastUpdateTime ? '\nlastUpdateTime: ' + _lastUpdateTime : ''}
    name: ${name}${fM ? '\n' + fM : ''}
    ${Object.keys(rest).reduce((prev, curr) => {
            return prev += `${curr}: ${Array.isArray(rest[curr]) ? `\n${(rest[curr] as string[]).map(item => `    - ${item}`).join('\n')}` : rest[curr]}\n`;
        }, '')}---
    
    `;
    });
};

const normalizeNum = (num: number) => {
    if (String(num).length > 1) {
        return String(num);
    }
    return '0' + String(num);
};

// Note: 返回符合 Notion API 要求的 ISO 8601 格式的日期字符串
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


const getPropertyValue = (obj: any) => {
    return obj?.[obj?.type];
};
const getPropertyCompuValue = (obj: any) => {
    return obj?.[obj?.type]?.[obj?.[obj?.type]?.type];
};


const logTypeMap = {
    'info': '✅',
    'warn': 'ℹ️',
    'error': '❌',
};


export {
    getPublisherConfig,
    getAigcConfig,
    notionGetToc,
    _inline,
    notionMutation,
    notionLocateHeading,
    notion2markdown,
    notionMeta2string,
    logToRenderer,
    getISODateTime,
    notionSelectionChange,
    getPropertyValue,
    getPropertyCompuValue,
    parserProperty,
    _toSidePanel,
    _toContent,
    logTypeMap,
    EventBus,
}
