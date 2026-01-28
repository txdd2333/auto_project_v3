import { RectNode, RectNodeModel } from '@logicflow/core'

class ApiCallNodeModel extends RectNodeModel {
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
      fill: '#06b6d4',
      stroke: '#0891b2',
      strokeWidth: 2,
      strokeDasharray: '5,5',
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

class ApiCallNode extends RectNode {}

export default {
  type: 'api',
  view: ApiCallNode,
  model: ApiCallNodeModel,
}
