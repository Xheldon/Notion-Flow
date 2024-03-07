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
    const result = new Function('block', `return ${func}`)(block);
    source.window.postMessage(result, event.origin);
})