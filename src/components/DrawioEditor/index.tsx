import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Download, Save } from 'lucide-react';

export interface DrawioEditorRef {
  getData: () => Promise<string | null>;
  loadData: (data: string) => void;
  exportImage: (format: 'png' | 'svg') => void;
}

interface DrawioEditorProps {
  initialData?: string;
  onDataChange?: (data: string) => void;
  onSave?: (data: string) => void;
}

const DrawioEditor = forwardRef<DrawioEditorRef, DrawioEditorProps>(
  ({ initialData, onDataChange, onSave }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const currentDataRef = useRef<string | null>(null);

    const DRAWIO_URL = 'https://embed.diagrams.net/?embed=1&ui=kennedy&spin=1&proto=json&saveAndExit=1&noSaveBtn=1&noExitBtn=1';

    useImperativeHandle(ref, () => ({
      getData: async () => {
        return new Promise((resolve) => {
          if (!iframeRef.current || !isReady) {
            resolve(currentDataRef.current);
            return;
          }

          const messageHandler = (event: MessageEvent) => {
            if (event.data && typeof event.data === 'string') {
              try {
                const msg = JSON.parse(event.data);
                if (msg.event === 'export') {
                  window.removeEventListener('message', messageHandler);
                  currentDataRef.current = msg.data;
                  resolve(msg.data);
                }
              } catch (e) {
                console.error('Failed to parse message:', e);
              }
            }
          };

          window.addEventListener('message', messageHandler);

          iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({ action: 'export', format: 'xml' }),
            '*'
          );

          setTimeout(() => {
            window.removeEventListener('message', messageHandler);
            resolve(currentDataRef.current);
          }, 5000);
        });
      },

      loadData: (data: string) => {
        if (iframeRef.current && isReady && data) {
          iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({ action: 'load', xml: data }),
            '*'
          );
          currentDataRef.current = data;
        }
      },

      exportImage: (format: 'png' | 'svg') => {
        if (iframeRef.current && isReady) {
          iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({ action: 'export', format }),
            '*'
          );
        }
      },
    }));

    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && typeof event.data === 'string') {
          try {
            const msg = JSON.parse(event.data);

            if (msg.event === 'init') {
              setIsReady(true);
              setIsLoading(false);

              if (initialData && iframeRef.current) {
                setTimeout(() => {
                  iframeRef.current?.contentWindow?.postMessage(
                    JSON.stringify({ action: 'load', xml: initialData }),
                    '*'
                  );
                  currentDataRef.current = initialData;
                }, 100);
              }
            }

            if (msg.event === 'autosave') {
              currentDataRef.current = msg.xml;
              onDataChange?.(msg.xml);
            }

            if (msg.event === 'save') {
              currentDataRef.current = msg.xml;
              onSave?.(msg.xml);
            }

            if (msg.event === 'export') {
              if (msg.format === 'png' || msg.format === 'svg') {
                const link = document.createElement('a');
                link.href = `data:${msg.format === 'png' ? 'image/png' : 'image/svg+xml'};base64,${msg.data}`;
                link.download = `flowchart.${msg.format}`;
                link.click();
              }
            }

            if (msg.event === 'exit') {
              console.log('Drawio exit event received');
            }
          } catch (e) {
            console.error('Failed to parse message:', e);
          }
        }
      };

      window.addEventListener('message', handleMessage);

      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }, [initialData, onDataChange, onSave, isReady]);

    const handleExportPNG = () => {
      if (iframeRef.current && isReady) {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({ action: 'export', format: 'png' }),
          '*'
        );
      }
    };

    const handleExportSVG = () => {
      if (iframeRef.current && isReady) {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({ action: 'export', format: 'svg' }),
          '*'
        );
      }
    };

    const handleSave = async () => {
      if (ref && typeof ref === 'object' && ref !== null && 'current' in ref && ref.current) {
        const data = await ref.current.getData();
        if (data) {
          onSave?.(data);
        }
      }
    };

    return (
      <div className="relative w-full h-full bg-white">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">加载流程图编辑器...</p>
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button
            onClick={handleSave}
            disabled={!isReady}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            title="保存流程图"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
          <button
            onClick={handleExportPNG}
            disabled={!isReady}
            className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            title="导出为PNG图片"
          >
            <Download className="w-4 h-4" />
            PNG
          </button>
          <button
            onClick={handleExportSVG}
            disabled={!isReady}
            className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            title="导出为SVG矢量图"
          >
            <Download className="w-4 h-4" />
            SVG
          </button>
        </div>

        <iframe
          ref={iframeRef}
          src={DRAWIO_URL}
          className="w-full h-full border-0"
          title="Drawio Editor"
        />
      </div>
    );
  }
);

DrawioEditor.displayName = 'DrawioEditor';

export default DrawioEditor;
