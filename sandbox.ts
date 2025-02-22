import { logToRenderer } from "$utils"

/**
 * 本文件用来执行插件机制，输入为用户提供的插件（js 代码），返回为 markdown 插件
 */
window.addEventListener("message", async function (event) {
  const source = event.source as {
    window: WindowProxy
  }
  // Note: block 为实际数据
  //  func 为用户提供的 pluginCode，内容是 {bookmark: function(video){}, video: function(video){}} 类型的
  //  type 为模块的类型
  const { block, func, type, id } = event.data || {}
  try {
    let result = null
    const isExist = new Function(`return ${func}`)()?.[type]
    if (isExist) {
      result = new Function(`return ${func}`)()?.[type]?.(block) || ""
      source.window.postMessage({ id, result, type }, event.origin)
    } else {
      source.window.postMessage({ id, result: undefined, type }, event.origin)
    }
  } catch (e) {
    logToRenderer("error", "[Notion Flow] Plugin code run error", e)
    source.window.postMessage({ id, result: null, type }, event.origin)
  }
})
