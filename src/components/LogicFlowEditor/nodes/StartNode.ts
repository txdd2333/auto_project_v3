import { CircleNode, CircleNodeModel } from '@logicflow/core'

class StartNodeModel extends CircleNodeModel {
  initNodeData(data: any) {
    super.initNodeData(data)
    this.r = 35
  }

  getNodeStyle() {
    const style = super.getNodeStyle()
    return {
      ...style,
      fill: '#10b981',
      stroke: '#059669',
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

class StartNode extends CircleNode {
  // 可选：自定义节点的 HTML
}

export default {
  type: 'start',
  view: StartNode,
  model: StartNodeModel,
}
