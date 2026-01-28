import { useState, useEffect, useRef } from 'react';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { IDomEditor, IEditorConfig, IToolbarConfig, IButtonMenu, Boot } from '@wangeditor/editor';
import { authService, storageService } from '../services';
import { useToastContext } from '../contexts/ToastContext';
import '../styles/sop-content.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

type InsertFnType = (url: string, alt?: string, href?: string) => void;

// 自定义增加缩进菜单
class CustomIndentMenu implements IButtonMenu {
  title = '增加缩进';
  iconSvg = '<svg viewBox="0 0 1024 1024"><path d="M0 64h1024v128H0V64z m384 192h640v128H384V256z m0 192h640v128H384V448z m0 192h640v128H384V640zM0 832h1024v128H0V832zM0 256l256 192L0 640V256z"></path></svg>';
  tag = 'button';

  getValue(_editor: IDomEditor): string | boolean {
    return '';
  }

  isActive(_editor: IDomEditor): boolean {
    return false;
  }

  isDisabled(_editor: IDomEditor): boolean {
    return false;
  }

  exec(editor: IDomEditor, _value: string | boolean) {
    if (!editor) return;

    try {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const container = editor.getEditableContainer();

      // 获取所有段落元素
      const allParagraphs = container.querySelectorAll('p');
      const paragraphsToIndent: HTMLElement[] = [];

      // 找出所有在选区内的段落
      allParagraphs.forEach((p) => {
        const pElement = p as HTMLElement;
        // 检查段落是否与选区相交
        if (range.intersectsNode(pElement)) {
          paragraphsToIndent.push(pElement);
        }
      });

      // 如果没有找到段落，尝试找到光标所在的段落
      if (paragraphsToIndent.length === 0) {
        let element = selection.anchorNode as Node;
        while (element && element.nodeType !== 1) {
          element = element.parentNode as Node;
        }

        let paragraph = element as HTMLElement;
        while (paragraph && paragraph.tagName !== 'P') {
          paragraph = paragraph.parentNode as HTMLElement;
          if (!paragraph || paragraph === container) break;
        }

        if (paragraph && paragraph.tagName === 'P') {
          paragraphsToIndent.push(paragraph);
        }
      }

      // 对所有段落应用缩进
      paragraphsToIndent.forEach((paragraph) => {
        const currentPaddingStr = paragraph.style.paddingLeft || '0em';
        const currentPadding = parseFloat(currentPaddingStr) || 0;
        paragraph.style.paddingLeft = `${currentPadding + 2}em`;
        paragraph.style.textIndent = '0'; // 有 padding 时取消首行缩进
      });
    } catch (error) {
      console.error('Indent error:', error);
    }
  }
}

// 自定义减少缩进菜单
class CustomDelIndentMenu implements IButtonMenu {
  title = '减少缩进';
  iconSvg = '<svg viewBox="0 0 1024 1024"><path d="M0 64h1024v128H0V64z m384 192h640v128H384V256z m0 192h640v128H384V448z m0 192h640v128H384V640zM0 832h1024v128H0V832zM256 256L0 448l256 192V256z"></path></svg>';
  tag = 'button';

  getValue(_editor: IDomEditor): string | boolean {
    return '';
  }

  isActive(_editor: IDomEditor): boolean {
    return false;
  }

  isDisabled(_editor: IDomEditor): boolean {
    return false;
  }

  exec(editor: IDomEditor, _value: string | boolean) {
    if (!editor) return;

    try {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const container = editor.getEditableContainer();

      // 获取所有段落元素
      const allParagraphs = container.querySelectorAll('p');
      const paragraphsToIndent: HTMLElement[] = [];

      // 找出所有在选区内的段落
      allParagraphs.forEach((p) => {
        const pElement = p as HTMLElement;
        // 检查段落是否与选区相交
        if (range.intersectsNode(pElement)) {
          paragraphsToIndent.push(pElement);
        }
      });

      // 如果没有找到段落，尝试找到光标所在的段落
      if (paragraphsToIndent.length === 0) {
        let element = selection.anchorNode as Node;
        while (element && element.nodeType !== 1) {
          element = element.parentNode as Node;
        }

        let paragraph = element as HTMLElement;
        while (paragraph && paragraph.tagName !== 'P') {
          paragraph = paragraph.parentNode as HTMLElement;
          if (!paragraph || paragraph === container) break;
        }

        if (paragraph && paragraph.tagName === 'P') {
          paragraphsToIndent.push(paragraph);
        }
      }

      // 对所有段落应用减少缩进
      paragraphsToIndent.forEach((paragraph) => {
        const currentPaddingStr = paragraph.style.paddingLeft || '0em';
        const currentPadding = parseFloat(currentPaddingStr) || 0;
        const newPadding = Math.max(0, currentPadding - 2);

        if (newPadding > 0) {
          paragraph.style.paddingLeft = `${newPadding}em`;
        } else {
          paragraph.style.paddingLeft = '';
          paragraph.style.textIndent = ''; // 恢复默认的首行缩进
        }
      });
    } catch (error) {
      console.error('DelIndent error:', error);
    }
  }
}

// 注册自定义菜单（只注册一次）
const customIndentMenuKey = 'customIndent';
const customDelIndentMenuKey = 'customDelIndent';

// 使用全局标志位防止重复注册（即使热重载也有效）
declare global {
  interface Window {
    __CUSTOM_INDENT_MENUS_REGISTERED__?: boolean;
  }
}

if (typeof window !== 'undefined' && !window.__CUSTOM_INDENT_MENUS_REGISTERED__) {
  try {
    Boot.registerMenu({
      key: customIndentMenuKey,
      factory() {
        return new CustomIndentMenu();
      },
    });

    Boot.registerMenu({
      key: customDelIndentMenuKey,
      factory() {
        return new CustomDelIndentMenu();
      },
    });

    window.__CUSTOM_INDENT_MENUS_REGISTERED__ = true;
    console.log('✅ Custom indent menus registered successfully');
  } catch (error) {
    console.error('❌ Error registering custom menus:', error);
  }
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const toast = useToastContext();
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const isInternalUpdate = useRef(false);

  const toolbarConfig: Partial<IToolbarConfig> = {
    toolbarKeys: [
      'undo',
      'redo',
      '|',
      'headerSelect',
      'fontFamily',
      'fontSize',
      '|',
      'bold',
      'italic',
      'underline',
      'through',
      'sub',
      'sup',
      'clearStyle',
      '|',
      'color',
      'bgColor',
      '|',
      'customIndent',
      'customDelIndent',
      'justifyLeft',
      'justifyCenter',
      'justifyRight',
      'justifyJustify',
      '|',
      'lineHeight',
      '|',
      'bulletedList',
      'numberedList',
      'todo',
      '|',
      'blockquote',
      'emotion',
      'insertLink',
      {
        key: 'group-image',
        title: '图片（支持拖拽和粘贴）',
        iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M959.877 128l0.123 0.123v767.775l-0.123 0.122H64.102l-0.122-0.122V128.123l0.122-0.123h895.775zM960 64H64C28.795 64 0 92.795 0 128v768c0 35.205 28.795 64 64 64h896c35.205 0 64-28.795 64-64V128c0-35.205-28.795-64-64-64zM832 288.01c0 53.023-42.988 96.01-96.01 96.01s-96.01-42.987-96.01-96.01S682.967 192 735.99 192 832 234.988 832 288.01zM896 832H128V704l224.01-384 256 320h64l224.01-192z"></path></svg>',
        menuKeys: ['uploadImage', 'insertImage'],
      },
      {
        key: 'group-video',
        title: '视频',
        iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M981.184 160.096C837.568 139.456 678.848 128 512 128S186.432 139.456 42.816 160.096C15.296 267.808 0 386.848 0 512s15.264 244.16 42.816 351.904C186.464 884.544 345.152 896 512 896s325.568-11.456 469.184-32.096C1008.704 756.192 1024 637.152 1024 512s-15.264-244.16-42.816-351.904zM384 704V320l320 192-320 192z"></path></svg>',
        menuKeys: ['uploadVideo', 'insertVideo'],
      },
      'insertTable',
      'codeBlock',
      'divider',
      '|',
      'fullScreen',
    ],
  };

  // 通用的图片上传处理函数
  const uploadImageToStorage = async (file: File, insertFn: InsertFnType) => {
    try {
      console.log('开始上传图片:', file.name, file.size, file.type);

      const user = await authService.getCurrentUser();
      console.log('当前用户:', user);

      if (!user) {
        console.error('用户未登录');
        toast.warning('请先登录后再上传图片');
        return;
      }

      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('上传路径:', filePath);

      const { error: uploadError } = await storageService.upload('sop-images', filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        toast.error(`图片上传失败: ${uploadError.message || '未知错误'}`);
        return;
      }

      console.log('上传成功，获取公共URL');
      const publicUrl = storageService.getPublicUrl('sop-images', filePath);
      console.log('公共URL:', publicUrl);

      insertFn(publicUrl, file.name, '');
      toast.success('图片上传成功');
    } catch (error) {
      console.error('Upload exception:', error);
      toast.error(`图片上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const editorConfig: Partial<IEditorConfig> = {
    placeholder: placeholder || '请输入文档内容...',
    // 允许所有 HTML 标签和属性（包括 base64 图片）
    hoverbarKeys: {
      image: {
        menuKeys: ['imageWidth30', 'imageWidth50', 'imageWidth100', 'deleteImage'],
      },
    },
    MENU_CONF: {
      indent: {
        // 配置缩进
        indentValue: '2em', // 每次缩进的值
      },
      delIndent: {
        // 配置取消缩进
      },
      uploadImage: {
        async customUpload(file: File, insertFn: InsertFnType) {
          await uploadImageToStorage(file, insertFn);
        },
        // 允许插入多张图片
        allowedFileTypes: ['image/*'],
        // 单个图片最大10MB
        maxFileSize: 10 * 1024 * 1024,
      },
      insertImage: {
        // 插入网络图片时自动下载到本地（可选）
        checkImage: undefined,
        // 上传前的钩子，可以在这里处理图片（如压缩）
        onInsertedImage: (imageNode: any) => {
          if (imageNode && imageNode.style) {
            // 确保插入的图片不会超出容器宽度
            imageNode.style.maxWidth = '100%';
            imageNode.style.height = 'auto';
          }
        },
      },
      uploadVideo: {
        customUpload(_file: File, _insertFn: (url: string, poster?: string) => void) {
          toast.info('视频上传功能暂未开放，请使用插入视频链接功能');
        },
      },
      fontFamily: {
        fontFamilyList: [
          '黑体',
          '仿宋',
          '楷体',
          '宋体',
          '微软雅黑',
          'Arial',
          'Tahoma',
          'Verdana',
          'Times New Roman',
          'Courier New',
        ],
      },
      fontSize: {
        fontSizeList: [
          '12px',
          '14px',
          '16px',
          '18px',
          '20px',
          '24px',
          '28px',
          '32px',
          '36px',
          '48px',
        ],
      },
      lineHeight: {
        lineHeightList: ['1', '1.15', '1.5', '1.75', '2', '2.5', '3'],
      },
    },
    // 自定义粘贴处理，支持粘贴图片
    customPaste: (editor: IDomEditor, event: ClipboardEvent): boolean => {
      // 获取粘贴的内容
      const clipboardData = event.clipboardData;
      if (!clipboardData) return false;

      // 检查是否有图片文件
      const items = clipboardData.items;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // 检查是否是图片类型
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();

          if (file) {
            // 阻止默认粘贴行为
            event.preventDefault();

            // 上传图片
            uploadImageToStorage(file, (url: string, alt?: string) => {
              // 在光标位置插入图片
              editor.dangerouslyInsertHtml(`<img src="${url}" alt="${alt || 'pasted-image'}" style="max-width: 100%;" />`);
            });

            return true; // 阻止默认粘贴
          }
        }
      }

      // 如果没有图片，使用默认粘贴行为
      return false;
    },
  };

  useEffect(() => {
    console.log('=== MarkdownEditor useEffect triggered ===');
    console.log('editor ready:', !!editor);
    console.log('value length:', value?.length || 0);
    console.log('value preview:', value?.substring(0, 100));

    if (!editor) {
      console.log('❌ Editor not ready yet');
      return;
    }

    // 如果是内部更新触发的，跳过
    if (isInternalUpdate.current) {
      console.log('⚠️ Skipping update: internal change');
      isInternalUpdate.current = false;
      return;
    }

    const currentHtml = editor.getHtml();
    // 规范化比较，移除空白差异
    const normalizedCurrent = currentHtml.replace(/\s+/g, ' ').trim();
    const normalizedValue = (value || '').replace(/\s+/g, ' ').trim();

    console.log('Editor update check:', {
      currentHtml: currentHtml.substring(0, 50),
      currentLength: normalizedCurrent.length,
      valuePreview: normalizedValue.substring(0, 50),
      valueLength: normalizedValue.length,
      isDifferent: normalizedCurrent !== normalizedValue
    });

    if (normalizedCurrent !== normalizedValue) {
      // 直接使用 setHtml 来设置所有 HTML 内容
      try {
        console.log('🔄 Updating editor with new content...');
        console.log('Content to set:', value.substring(0, 200));

        // 在设置新内容前，设置标志阻止 handleChange 回调
        isInternalUpdate.current = true;

        // 直接使用 setHtml，不要先 clear()
        editor.setHtml(value || '<p></p>');
        console.log('✓ setHtml called');

        // 验证插入后的内容
        setTimeout(() => {
          const afterHtml = editor.getHtml();
          console.log('✅ 设置后编辑器内容长度:', afterHtml.length);
          console.log('✅ 设置后编辑器内容前 300 字符:', afterHtml.substring(0, 300));

          // 重置标志，允许后续的用户编辑触发 onChange
          isInternalUpdate.current = false;
        }, 100);
      } catch (error) {
        console.error('❌ Error setting HTML:', error);
        isInternalUpdate.current = false;
      }
    }
  }, [value, editor]);

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  const handleChange = (newEditor: IDomEditor) => {
    const html = newEditor.getHtml();
    console.log('handleChange triggered, html length:', html.length, 'value length:', value.length);

    // 如果是内部更新（如通过 value prop 导致的），跳过 onChange 回调
    if (isInternalUpdate.current) {
      console.log('Skipping onChange: internal update in progress');
      return;
    }

    if (html !== value) {
      console.log('Content changed, calling onChange');
      onChange(html);
    } else {
      console.log('Content unchanged, skipping onChange');
    }
  };

  const handleEditorCreated = (editor: IDomEditor) => {
    setEditor(editor);

    // 为编辑器内容区域添加sop-content样式类和拖拽上传功能
    setTimeout(() => {
      const editorElem = editor.getEditableContainer();
      if (editorElem) {
        editorElem.classList.add('sop-content');

        // 添加拖拽上传图片功能
        editorElem.addEventListener('drop', async (e: Event) => {
          const dragEvent = e as DragEvent;
          dragEvent.preventDefault();
          dragEvent.stopPropagation();

          const files = dragEvent.dataTransfer?.files;
          if (!files || files.length === 0) return;

          // 处理所有图片文件
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
              await uploadImageToStorage(file, (url: string, alt?: string) => {
                editor.dangerouslyInsertHtml(`<img src="${url}" alt="${alt || file.name}" style="max-width: 100%;" />`);
              });
            }
          }
        });

        // 阻止默认的拖拽行为
        editorElem.addEventListener('dragover', (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
        });

        // 添加图片拖拽调整大小功能
        let currentResizingImage: HTMLImageElement | null = null;
        let resizeHandle: HTMLDivElement | null = null;
        let startX = 0;
        let startY = 0;
        let startWidth = 0;
        let startHeight = 0;

        // 监听图片点击事件
        editorElem.addEventListener('click', (e: Event) => {
          const target = e.target as HTMLElement;

          // 清除之前的手柄
          if (resizeHandle && resizeHandle.parentElement) {
            resizeHandle.remove();
            resizeHandle = null;
          }

          if (target.tagName === 'IMG') {
            const img = target as HTMLImageElement;
            currentResizingImage = img;

            // 创建调整大小手柄
            resizeHandle = document.createElement('div');
            resizeHandle.className = 'image-resize-handle';
            resizeHandle.style.position = 'absolute';

            // 计算手柄位置（图片右下角）
            const updateHandlePosition = () => {
              if (!currentResizingImage || !resizeHandle) return;
              const rect = currentResizingImage.getBoundingClientRect();
              const containerRect = editorElem.getBoundingClientRect();
              resizeHandle.style.left = `${rect.right - containerRect.left - 6}px`;
              resizeHandle.style.top = `${rect.bottom - containerRect.top - 6}px`;
            };

            // 将手柄添加到容器中
            (editorElem as HTMLElement).style.position = 'relative';
            editorElem.appendChild(resizeHandle);
            updateHandlePosition();

            // 手柄拖拽开始
            resizeHandle.addEventListener('mousedown', (e: MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();

              if (!currentResizingImage) return;

              startX = e.clientX;
              startY = e.clientY;
              startWidth = currentResizingImage.offsetWidth;
              startHeight = currentResizingImage.offsetHeight;

              currentResizingImage.classList.add('resizing');

              // 鼠标移动时调整图片大小
              const handleMouseMove = (e: MouseEvent) => {
                if (!currentResizingImage) return;

                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                // 使用对角线距离来计算新尺寸（保持宽高比）
                const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const scale = deltaX >= 0 ? 1 + delta / startWidth : 1 - delta / startWidth;

                const newWidth = Math.max(50, startWidth * scale);
                const newHeight = Math.max(50, startHeight * scale);

                currentResizingImage.style.width = `${newWidth}px`;
                currentResizingImage.style.height = `${newHeight}px`;

                updateHandlePosition();
              };

              // 鼠标释放时结束调整
              const handleMouseUp = () => {
                if (currentResizingImage) {
                  currentResizingImage.classList.remove('resizing');
                }
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            });
          }
        });

        // 点击其他区域时移除手柄
        document.addEventListener('click', (e: Event) => {
          const target = e.target as HTMLElement;
          if (target.tagName !== 'IMG' && !target.classList.contains('image-resize-handle')) {
            if (resizeHandle && resizeHandle.parentElement) {
              resizeHandle.remove();
              resizeHandle = null;
            }
            currentResizingImage = null;
          }
        });
      }
    }, 100);
  };

  return (
    <div className="h-full flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white">
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        className="border-b border-gray-200"
      />
      <div className="flex-1 overflow-auto">
        <Editor
          defaultConfig={editorConfig}
          value={value}
          onCreated={handleEditorCreated}
          onChange={handleChange}
          mode="default"
          className="h-full"
        />
      </div>
    </div>
  );
}
