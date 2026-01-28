import { RectNode, RectNodeModel } from '@logicflow/core'

class LoopNodeModel extends RectNodeModel {
  initNodeData(data: any) {
    super.initNodeData(data)
    this.width = 100
    this.height = 60
    this.radius = 30
  }

  getNodeStyle() {
    const style = super.getNodeStyle()
    return {
      ...style,
      fill: '#ec4899',
      stroke: '#db2777',
      strokeWidth: 2,
      rx: 30,
      ry: 30,
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

class LoopNode extends RectNode {}

export default {
  type: 'loop',
  view: LoopNode,
  model: LoopNodeModel,
}
