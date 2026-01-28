import { EllipseNode, EllipseNodeModel } from '@logicflow/core'

class DelayNodeModel extends EllipseNodeModel {
  initNodeData(data: any) {
    super.initNodeData(data)
    this.rx = 50
    this.ry = 30
  }

  getNodeStyle() {
    const style = super.getNodeStyle()
    return {
      ...style,
      fill: '#6366f1',
      stroke: '#4f46e5',
      strokeWidth: 2,
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

class DelayNode extends EllipseNode {}

export default {
  type: 'delay',
  view: DelayNode,
  model: DelayNodeModel,
}
