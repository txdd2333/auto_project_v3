import { RectNode, RectNodeModel } from '@logicflow/core'

class SubprocessNodeModel extends RectNodeModel {
  initNodeData(data: any) {
    super.initNodeData(data)
    this.width = 120
    this.height = 70
    this.radius = 8
  }

  getNodeStyle() {
    const style = super.getNodeStyle()
    return {
      ...style,
      fill: '#a855f7',
      stroke: '#9333ea',
      strokeWidth: 3,
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
      fontWeight: '600',
    }
  }
}

class SubprocessNode extends RectNode {}

export default {
  type: 'subprocess',
  view: SubprocessNode,
  model: SubprocessNodeModel,
}
