import { RectNode, RectNodeModel } from '@logicflow/core'

class PlaywrightNodeModel extends RectNodeModel {
  initNodeData(data: any) {
    super.initNodeData(data)
    this.width = 160
    this.height = 70
    this.radius = 8
  }

  getNodeStyle() {
    const style = super.getNodeStyle()
    const action = (this.properties?.action as string) || 'open_tabs'

    const colorMap: Record<string, string> = {
      open_tabs: '#8b5cf6',
      navigate: '#3b82f6',
      click: '#10b981',
      fill: '#f59e0b',
      wait: '#6366f1',
      screenshot: '#ec4899',
      extract_text: '#14b8a6',
      close_tab: '#ef4444'
    }

    const color = colorMap[action] || '#8b5cf6'

    return {
      ...style,
      fill: color,
      stroke: color,
      strokeWidth: 2,
      fillOpacity: 0.15,
    } as any
  }

  getTextStyle() {
    const style = super.getTextStyle()
    return {
      ...style,
      fontSize: 13,
      fill: '#1f2937',
      fontWeight: '600',
    }
  }
}

class PlaywrightNode extends RectNode {}

export default {
  type: 'playwright',
  view: PlaywrightNode,
  model: PlaywrightNodeModel,
}
