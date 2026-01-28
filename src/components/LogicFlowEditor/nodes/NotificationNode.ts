import { RectNode, RectNodeModel } from '@logicflow/core'

class NotificationNodeModel extends RectNodeModel {
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
      fill: '#14b8a6',
      stroke: '#0d9488',
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

class NotificationNode extends RectNode {}

export default {
  type: 'notification',
  view: NotificationNode,
  model: NotificationNodeModel,
}
