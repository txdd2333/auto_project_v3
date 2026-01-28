import { DiamondNode, DiamondNodeModel } from '@logicflow/core'

class ParallelGatewayNodeModel extends DiamondNodeModel {
  initNodeData(data: any) {
    super.initNodeData(data)
    this.rx = 30
    this.ry = 30
  }

  getNodeStyle() {
    const style = super.getNodeStyle()
    return {
      ...style,
      fill: '#8b5cf6',
      stroke: '#7c3aed',
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

class ParallelGatewayNode extends DiamondNode {}

export default {
  type: 'parallel',
  view: ParallelGatewayNode,
  model: ParallelGatewayNodeModel,
}
