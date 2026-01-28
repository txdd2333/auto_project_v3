import { DiamondNode, DiamondNodeModel } from '@logicflow/core'

class MergeNodeModel extends DiamondNodeModel {
  initNodeData(data: any) {
    super.initNodeData(data)
    this.rx = 30
    this.ry = 30
  }

  getNodeStyle() {
    const style = super.getNodeStyle()
    return {
      ...style,
      fill: '#64748b',
      stroke: '#475569',
      strokeWidth: 2,
    }
  }

  getTextStyle() {
    const style = super.getTextStyle()
    return {
      ...style,
      fontSize: 13,
      fill: '#ffffff',
      fontWeight: 'bold',
    }
  }
}

class MergeNode extends DiamondNode {}

export default {
  type: 'merge',
  view: MergeNode,
  model: MergeNodeModel,
}
