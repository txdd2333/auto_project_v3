import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useToastContext } from '../contexts/ToastContext'
import type { Module } from '../lib/database.types'

interface ModuleDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (moduleData: Partial<Module>) => Promise<void>
  module?: Module | null
}

const PLAYWRIGHT_ACTIONS = [
  { value: 'navigate', label: '导航到URL' },
  { value: 'click', label: '点击元素' },
  { value: 'fill', label: '填充输入框' },
  { value: 'wait', label: '等待' },
  { value: 'screenshot', label: '截图' },
  { value: 'getText', label: '获取文本' },
  { value: 'openTab', label: '打开标签页' },
  { value: 'closeTab', label: '关闭标签页' }
]

const BROWSER_TYPES = [
  { value: 'chromium', label: 'Chromium' },
  { value: 'firefox', label: 'Firefox' },
  { value: 'webkit', label: 'WebKit (Safari)' }
]

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
]

const PRESET_ICONS = ['🌐', '🔍', '✏️', '📸', '⏱️', '🔗', '📝', '🎯', '⚡', '🚀']

export default function ModuleDialog({ isOpen, onClose, onSave, module }: ModuleDialogProps) {
  const toast = useToastContext()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('playwright')
  const [action, setAction] = useState('navigate')
  const [url, setUrl] = useState('')
  const [selector, setSelector] = useState('')
  const [text, setText] = useState('')
  const [waitTime, setWaitTime] = useState('1000')
  const [browserType, setBrowserType] = useState('chromium')
  const [icon, setIcon] = useState('🌐')
  const [color, setColor] = useState('#3b82f6')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && module) {
      setName(module.name)
      setDescription(module.description || '')
      setType(module.type)
      setIcon(module.icon || '🌐')
      setColor(module.color || '#3b82f6')

      const config = module.config as any
      if (config) {
        setAction(config.action || 'navigate')
        setUrl(config.url || '')
        setSelector(config.selector || '')
        setText(config.text || '')
        setWaitTime(config.waitTime?.toString() || '1000')
        setBrowserType(config.browserType || 'chromium')
      }
    } else if (isOpen) {
      setName('')
      setDescription('')
      setType('playwright')
      setAction('navigate')
      setUrl('')
      setSelector('')
      setText('')
      setWaitTime('1000')
      setBrowserType('chromium')
      setIcon('🌐')
      setColor('#3b82f6')
    }
  }, [isOpen, module])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.warning('请输入模块名称')
      return
    }

    setSaving(true)
    try {
      const config: any = {
        action,
        browserType
      }

      if (action === 'navigate') {
        if (!url.trim()) {
          toast.warning('请输入URL')
          setSaving(false)
          return
        }
        config.url = url
      } else if (action === 'click' || action === 'fill' || action === 'getText') {
        if (!selector.trim()) {
          toast.warning('请输入选择器')
          setSaving(false)
          return
        }
        config.selector = selector
        if (action === 'fill') {
          config.text = text
        }
      } else if (action === 'wait') {
        config.waitTime = parseInt(waitTime)
      }

      const moduleData: Partial<Module> = {
        name: name.trim(),
        description: description.trim(),
        type,
        config,
        icon,
        color
      }

      if (module) {
        moduleData.id = module.id
      }

      await onSave(moduleData)
      toast.success('模块保存成功！')
      onClose()
    } catch (error) {
      console.error('Error saving module:', error)
      toast.error('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {module ? '编辑模块' : '新建模块'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              模块名称 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例如：打开百度首页"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="描述模块的功能"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              模块类型
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="playwright">Playwright (浏览器自动化)</option>
            </select>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">操作配置</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  操作类型 *
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {PLAYWRIGHT_ACTIONS.map((act) => (
                    <option key={act.value} value={act.value}>
                      {act.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  浏览器类型
                </label>
                <select
                  value={browserType}
                  onChange={(e) => setBrowserType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {BROWSER_TYPES.map((browser) => (
                    <option key={browser.value} value={browser.value}>
                      {browser.label}
                    </option>
                  ))}
                </select>
              </div>

              {action === 'navigate' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL *
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                    required
                  />
                </div>
              )}

              {(action === 'click' || action === 'fill' || action === 'getText') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSS选择器 *
                  </label>
                  <input
                    type="text"
                    value={selector}
                    onChange={(e) => setSelector(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#id 或 .class 或 button"
                    required
                  />
                </div>
              )}

              {action === 'fill' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    填充文本
                  </label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="要填充的文本"
                  />
                </div>
              )}

              {action === 'wait' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    等待时间 (毫秒)
                  </label>
                  <input
                    type="number"
                    value={waitTime}
                    onChange={(e) => setWaitTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="100"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">外观</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  图标
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_ICONS.map((presetIcon) => (
                    <button
                      key={presetIcon}
                      type="button"
                      onClick={() => setIcon(presetIcon)}
                      className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl transition-all ${
                        icon === presetIcon
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {presetIcon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  颜色
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((presetColor) => (
                    <button
                      key={presetColor}
                      type="button"
                      onClick={() => setColor(presetColor)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        color === presetColor
                          ? 'border-gray-900 scale-110'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: presetColor }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold text-xl"
                  style={{ backgroundColor: color }}
                >
                  {icon}
                </div>
                <div>
                  <div className="font-medium text-gray-900">预览</div>
                  <div className="text-sm text-gray-500">
                    {name || '模块名称'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={saving}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={saving}
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
