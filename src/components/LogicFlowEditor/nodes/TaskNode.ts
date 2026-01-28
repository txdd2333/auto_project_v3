import { RectNode, RectNodeModel } from '@logicflow/core'

class TaskNodeModel extends RectNodeModel {
  initNodeData(data: any) {
    super.initNodeData(data)
    this.width = 140
    this.height = 60
    this.radius = 8
  }

  getNodeStyle() {
    const style = super.getNodeStyle()
    const color = (this.properties?.color as string) || '#3b82f6'
    return {
      ...style,
      fill: color,
      stroke: color,
      strokeWidth: 2,
      fillOpacity: 0.1,
    } as any
  }

  getTextStyle() {
    const style = super.getTextStyle()
    return {
      ...style,
      fontSize: 13,
      fill: '#1f2937',
      fontWeight: '500',
    }
  }
}

class TaskNode extends RectNode {
  // 可选：自定义节点的 HTML
}

export default {
  type: 'task',
  view: TaskNode,
  model: TaskNodeModel,
}
