import { CircleNode, CircleNodeModel } from '@logicflow/core'

class EndNodeModel extends CircleNodeModel {
  initNodeData(data: any) {
    super.initNodeData(data)
    this.r = 35
  }

  getNodeStyle() {
    const style = super.getNodeStyle()
    return {
      ...style,
      fill: '#ef4444',
      stroke: '#dc2626',
      strokeWidth: 2,
    }
  }

  getTextStyle() {
    const style = super.getTextStyle()
    return {
      ...style,
      fontSize: 14,
      fill: '#ffffff',
      fontWeight: 'bold',
    }
  }
}

class EndNode extends CircleNode {
  // 可选：自定义节点的 HTML
}

export default {
  type: 'end',
  view: EndNode,
  model: EndNodeModel,
}
