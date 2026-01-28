import { RectNode, RectNodeModel } from '@logicflow/core'

class ApprovalNodeModel extends RectNodeModel {
  initNodeData(data: any) {
    super.initNodeData(data)
    this.width = 100
    this.height = 60
    this.radius = 8
  }

  getNodeStyle() {
    const style = super.getNodeStyle()
    return {
      ...style,
      fill: '#f59e0b',
      stroke: '#d97706',
      strokeWidth: 2,
      rx: 8,
      ry: 8,
    }
  }

  getTextStyle() {
    const style = super.getTextStyle()
    return {
      ...style,
      fontSize: 13,
      fill: '#ffffff',
      fontWeight: '500',
    }
  }
}

class ApprovalNode extends RectNode {}

export default {
  type: 'approval',
  view: ApprovalNode,
  model: ApprovalNodeModel,
}
