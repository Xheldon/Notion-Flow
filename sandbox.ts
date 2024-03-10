// import { logToRenderer } from '$utils';

/**
 * 本文件用来执行插件机制，输入为用户提供的插件（js 代码），返回为 markdown 插件
 */
let block = null;
window.addEventListener("message", async function (event) {
    const source = event.source as {
        window: WindowProxy
    }
    const { block: _block, func } = event.data;
    block = _block;
    try {
        const result = new Function(`return ${func}`)()(block);
        console.log('result:', result);
        source.window.postMessage(result, event.origin);
    } catch (e) {
        // logToRenderer('error', '[Notion Flow] Plugin code run error', e);
        console.log('error', '[Notion Flow] Plugin code run error', e);
    }
})