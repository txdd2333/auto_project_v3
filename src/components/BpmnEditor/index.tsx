import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import BpmnModeler from 'bpmn-js/lib/Modeler'
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'
import './styles.css'

const initialDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="开始" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="180" y="145" width="22" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

export interface BpmnEditorProps {
  initialData?: string
  onDataChange?: (xml: string) => void
}

export interface BpmnEditorRef {
  getXML: () => Promise<string>
  getSVG: () => Promise<string>
  setXML: (xml: string) => Promise<void>
  getModeler: () => BpmnModeler | null
}

const BpmnEditor = forwardRef<BpmnEditorRef, BpmnEditorProps>(
  ({ initialData, onDataChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const modelerRef = useRef<BpmnModeler | null>(null)

    useImperativeHandle(ref, () => ({
      getXML: async () => {
        if (!modelerRef.current) return ''
        const { xml } = await modelerRef.current.saveXML({ format: true })
        return xml || ''
      },
      getSVG: async () => {
        if (!modelerRef.current) return ''
        const { svg } = await modelerRef.current.saveSVG()
        return svg || ''
      },
      setXML: async (xml: string) => {
        if (modelerRef.current) {
          await modelerRef.current.importXML(xml)
        }
      },
      getModeler: () => modelerRef.current,
    }))

    useEffect(() => {
      if (!containerRef.current || modelerRef.current) return

      const modeler = new BpmnModeler({
        container: containerRef.current,
        keyboard: {
          bindTo: document,
        },
      })

      modelerRef.current = modeler

      const loadDiagram = async () => {
        try {
          const xmlToLoad = initialData || initialDiagram
          await modeler.importXML(xmlToLoad)

          const canvas = modeler.get('canvas') as any
          canvas.zoom('fit-viewport')
        } catch (err) {
          console.error('Error loading diagram:', err)
        }
      }

      loadDiagram()

      modeler.on('commandStack.changed', async () => {
        if (onDataChange) {
          try {
            const { xml } = await modeler.saveXML({ format: true })
            if (xml) {
              onDataChange(xml)
            }
          } catch (err) {
            console.error('Error saving XML:', err)
          }
        }
      })

      return () => {
        if (modelerRef.current) {
          modelerRef.current.destroy()
          modelerRef.current = null
        }
      }
    }, [])

    return (
      <div className="bpmn-editor-container">
        <div ref={containerRef} className="bpmn-canvas" />
      </div>
    )
  }
)

BpmnEditor.displayName = 'BpmnEditor'

export default BpmnEditor
