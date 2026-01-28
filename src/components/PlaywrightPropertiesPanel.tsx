import { useState, useEffect } from 'react'

interface PlaywrightPropertiesPanelProps {
  node: any
  onUpdate: (properties: any) => void
}

export default function PlaywrightPropertiesPanel({
  node,
  onUpdate,
}: PlaywrightPropertiesPanelProps) {
  const [action, setAction] = useState(node?.properties?.action || 'open_tabs')
  const [browserType, setBrowserType] = useState(node?.properties?.browserType || 'chromium')
  const [count, setCount] = useState(node?.properties?.count || 1)
  const [urls, setUrls] = useState(node?.properties?.urls || '')
  const [url, setUrl] = useState(node?.properties?.url || '')
  const [selector, setSelector] = useState(node?.properties?.selector || '')
  const [text, setText] = useState(node?.properties?.text || '')
  const [milliseconds, setMilliseconds] = useState(
    node?.properties?.milliseconds || 1000
  )
  const [pageIndex, setPageIndex] = useState(node?.properties?.pageIndex || 0)

  useEffect(() => {
    if (node?.properties) {
      setAction(node.properties.action || 'open_tabs')
      setBrowserType(node.properties.browserType || 'chromium')
      setCount(node.properties.count || 1)
      setUrls(node.properties.urls || '')
      setUrl(node.properties.url || '')
      setSelector(node.properties.selector || '')
      setText(node.properties.text || '')
      setMilliseconds(node.properties.milliseconds || 1000)
      setPageIndex(node.properties.pageIndex || 0)
    }
  }, [node])

  useEffect(() => {
    const properties = {
      action,
      browserType,
      count,
      urls,
      url,
      selector,
      text,
      milliseconds,
      pageIndex,
    }
    onUpdate(properties)
  }, [action, browserType, count, urls, url, selector, text, milliseconds, pageIndex])

  if (!node || node.type !== 'playwright') {
    return null
  }

  return (
    <div className="bg-white border-l border-gray-200 w-80 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Playwright 节点配置
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            浏览器类型
          </label>
          <select
            value={browserType}
            onChange={(e) => setBrowserType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="chromium">Chromium</option>
            <option value="firefox">Firefox</option>
            <option value="webkit">WebKit (Safari)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            选择要使用的浏览器引擎
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            操作类型
          </label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="open_tabs">打开标签页</option>
            <option value="navigate">导航到URL</option>
            <option value="click">点击元素</option>
            <option value="fill">填充输入框</option>
            <option value="wait">等待</option>
            <option value="screenshot">截图</option>
            <option value="extract_text">提取文本</option>
            <option value="close_tab">关闭标签页</option>
          </select>
        </div>

        {action === 'open_tabs' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签页数量
              </label>
              <input
                type="number"
                min="1"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL列表（逗号分隔，可选）
              </label>
              <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="https://example.com, https://google.com"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {action === 'navigate' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              目标URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {(action === 'click' || action === 'extract_text') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CSS选择器
            </label>
            <input
              type="text"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              placeholder="#button-id 或 .button-class"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {action === 'fill' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CSS选择器
              </label>
              <input
                type="text"
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                placeholder="#input-id"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                填充文本
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="要输入的文本"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {action === 'wait' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                等待时间（毫秒）
              </label>
              <input
                type="number"
                min="0"
                value={milliseconds}
                onChange={(e) => setMilliseconds(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                等待选择器（可选）
              </label>
              <input
                type="text"
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                placeholder="#element-id"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {action !== 'open_tabs' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标签页索引
            </label>
            <input
              type="number"
              min="0"
              value={pageIndex}
              onChange={(e) => setPageIndex(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              0 表示第一个标签页
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>提示：</strong> 配置会自动保存到节点。
          <br />
          执行前请点击顶部"保存"按钮保存工作流。
        </p>
      </div>
    </div>
  )
}
