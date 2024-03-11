import { logToRenderer } from '$utils';

/**
 * 本文件用来执行插件机制，输入为用户提供的插件（js 代码），返回为 markdown 插件
 */
let block = null;
let beforeFunc = null;
let cache = null;
let results = {};
window.addEventListener("message", async function (event) {
    const source = event.source as {
        window: WindowProxy
    }
    // Note: block 为实际数据
    //  func 为用户提供的 pluginCode，内容是 {bookmark: function(video){}, video: function(video){}} 类型的
    //  type 为模块的类型
    const { block: _block, func, type, id } = event.data;
    block = _block;
    try {
        let result = null;
        if ((beforeFunc === func) && cache?.[type]) {
            result = cache[type](block);
        } else {
            cache = new Function(`return ${func}`)();
            result = cache[type]?.(block) || '';
            beforeFunc = func;
        }
        console.log('result:', result);
        results[id] = result;
        source.window.postMessage(results, event.origin);
    } catch (e) {
        logToRenderer('error', '[Notion Flow] Plugin code run error', e);
        // console.log('error', '[Notion Flow] Plugin code run error', e);
    }
});