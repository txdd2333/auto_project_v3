import { DiamondNode, DiamondNodeModel } from '@logicflow/core'

class DecisionNodeModel extends DiamondNodeModel {
  initNodeData(data: any) {
    super.initNodeData(data)
    this.rx = 70
    this.ry = 50
  }

  getNodeStyle() {
    const style = super.getNodeStyle()
    return {
      ...style,
      fill: '#fbbf24',
      stroke: '#f59e0b',
      strokeWidth: 2,
      fillOpacity: 0.1,
    }
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

class DecisionNode extends DiamondNode {
  // 可选：自定义节点的 HTML
}

export default {
  type: 'decision',
  view: DecisionNode,
  model: DecisionNodeModel,
}
