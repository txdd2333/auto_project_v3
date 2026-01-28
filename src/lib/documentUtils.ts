import mammoth from 'mammoth';
import TurndownService from 'turndown';
import { marked } from 'marked';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { getDocumentProxy, extractImages } from 'unpdf';

// 扩展的 unpdf 图片对象类型（实际运行时可能包含额外属性）
interface ExtendedImageObject {
  data?: Uint8ClampedArray;
  bitmap?: Uint8Array | Uint8ClampedArray;
  width: number;
  height: number;
  channels?: 1 | 3 | 4;
  kind?: string;
  key?: string;
}

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

turndownService.addRule('strikethrough', {
  filter: ['del', 's'] as (keyof HTMLElementTagNameMap)[],
  replacement: (content) => `~~${content}~~`,
});

export type ImportFormat = 'txt' | 'md' | 'docx' | 'pdf';
export type ExportFormat = 'txt' | 'md' | 'docx' | 'html' | 'pdf';

export async function importDocument(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.pdf')) {
    return importPdf(file);
  } else if (fileName.endsWith('.docx')) {
    return importDocx(file);
  } else if (fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
    return importMarkdown(file);
  } else if (fileName.endsWith('.txt')) {
    return importText(file);
  } else if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
    return importHtml(file);
  }

  throw new Error('不支持的文件格式。支持的格式：.txt, .md, .docx, .html, .pdf');
}

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
}

interface StructuredContent {
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'image';
  level?: number;
  content?: string;
  rows?: string[][];
  src?: string;
  items?: string[];
}

/**
 * 从 PDF 文件导入内容
 * 支持文本、图片、表格的提取
 */
async function importPdf(file: File): Promise<string> {
  try {
    console.log('=== PDF 导入开始 ===');
    console.log('文件名:', file.name);
    console.log('文件大小:', (file.size / 1024 / 1024).toFixed(2), 'MB');

    if (file.size > 50 * 1024 * 1024) {
      throw new Error('PDF 文件过大，请选择小于 50MB 的文件');
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const pdf = await getDocumentProxy(uint8Array);
    const numPages = pdf.numPages;

    console.log(`📄 PDF 解析成功，共 ${numPages} 页`);

    if (numPages === 0) {
      throw new Error('PDF 文件没有内容');
    }

    const allContent: StructuredContent[] = [];
    let totalTextBlocks = 0;
    let totalImages = 0;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        console.log(`\n📖 处理第 ${pageNum}/${numPages} 页...`);
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });

        const textContent = await page.getTextContent();
        const pageContent = await extractStructuredContent(textContent, viewport);

        // 尝试提取图片
        let images = await extractImagesFromPage(pdf, pageNum);
        console.log(`   unpdf 提取到 ${images.length} 张图片`);

        // 检查页面操作符，判断是否需要整页渲染
        let shouldUseFullPageRender = false;

        try {
          const operators = await page.getOperatorList();
          console.log(`   operators 数量: ${operators.fnArray.length}`);

          // 统计不同类型的操作符
          const imageOps = operators.fnArray.filter((fn: any) => [85, 86, 87].includes(fn));
          const formOps = operators.fnArray.filter((fn: any) => fn === 83);
          const pathOps = operators.fnArray.filter((fn: any) => [76, 77, 78, 79, 92, 93].includes(fn));

          console.log(`   - 图像操作符: ${imageOps.length}`);
          console.log(`   - 表单对象: ${formOps.length}`);
          console.log(`   - 路径/图形操作符: ${pathOps.length}`);
          console.log(`   - 文本内容块: ${pageContent.length}`);
          console.log(`   - 提取到的图片: ${images.length}`);

          // 决策：是否需要渲染整页
          // 只在以下情况使用整页渲染：
          // 1. 页面没有文本内容（扫描版 PDF）
          // 2. unpdf 无法提取图片，但页面有大量图像操作符（说明有图片但无法提取）
          // 3. 有表单对象（复杂交互内容）
          // 4. 有大量路径/图形操作符（复杂矢量图形）
          const hasNoText = pageContent.length === 0;
          const cannotExtractImages = images.length === 0 && imageOps.length > 0;
          const hasComplexForms = formOps.length > 0;
          const hasComplexGraphics = pathOps.length > 100; // 提高阈值，避免误判

          // 更严格的整页渲染条件
          shouldUseFullPageRender = hasNoText || cannotExtractImages || hasComplexForms || hasComplexGraphics;

          // 如果有文本内容和图片，优先使用文本+图片模式
          if (pageContent.length > 0 && !hasComplexForms && !hasComplexGraphics) {
            shouldUseFullPageRender = false;
            console.log(`   📝 页面有文本内容，使用文本+图片提取模式`);
          }

          if (shouldUseFullPageRender) {
            const reason = hasNoText ? '无文本内容（扫描版）' :
                          cannotExtractImages ? '无法提取图片' :
                          hasComplexForms ? '包含表单对象' :
                          hasComplexGraphics ? '包含复杂图形' : '未知原因';
            console.log(`   ✅ 检测到需要整页渲染 (${reason})，渲染整页为图片...`);
            const renderedImage = await renderPageAsImage(page);
            if (renderedImage) {
              images = [renderedImage];
              console.log(`   ✅ 页面渲染成功`);
            } else {
              console.warn(`   ⚠️ 页面渲染失败`);
              shouldUseFullPageRender = false;
            }
          }
        } catch (err) {
          console.error(`   ❌ 内容检测失败:`, err);
        }

        // 如果使用了整页渲染，只添加图片，忽略提取的文本（避免重复）
        if (shouldUseFullPageRender && images.length > 0) {
          allContent.push(...images);
          totalImages += images.length;
          console.log(`✅ 第 ${pageNum} 页完成 - 已渲染为整页图片`);
        } else {
          // 正常情况：文本+可能的嵌入图片
          if (pageContent.length > 0) {
            allContent.push(...pageContent);
            totalTextBlocks += pageContent.length;
          }

          if (images.length > 0) {
            allContent.push(...images);
            totalImages += images.length;
          }

          console.log(`✅ 第 ${pageNum} 页完成 - 文本块: ${pageContent.length}, 图片: ${images.length}`);
        }
      } catch (pageError) {
        console.error(`✗ 第 ${pageNum} 页处理失败:`, pageError);
      }
    }

    if (allContent.length === 0) {
      throw new Error('PDF 文件中没有可提取的内容，可能是扫描版或图片 PDF');
    }

    const html = convertStructuredContentToHtml(allContent);

    console.log('\n' + '='.repeat(50));
    console.log('📊 PDF 导入完成');
    console.log('   - 总内容块:', allContent.length);
    console.log('   - 文本块:', totalTextBlocks);
    console.log('   - 图片数:', totalImages);
    console.log('   - HTML 大小:', (html.length / 1024).toFixed(2), 'KB');

    // 内容类型统计
    const typeStats: Record<string, number> = {};
    allContent.forEach(c => {
      typeStats[c.type] = (typeStats[c.type] || 0) + 1;
    });
    console.log('   - 内容类型统计:', typeStats);

    // 检查图片内容
    const imageBlocks = allContent.filter(c => c.type === 'image');
    if (imageBlocks.length > 0) {
      console.log(`   - 图片详情: ${imageBlocks.length} 张图片`);
      imageBlocks.forEach((img, idx) => {
        const hasSrc = img.src ? '✅ 有src' : '❌ 无src';
        const srcSize = img.src ? (img.src.length / 1024).toFixed(1) + 'KB' : '0KB';
        console.log(`      图片 ${idx + 1}: ${hasSrc}, 大小: ${srcSize}`);
      });
    }

    console.log('   - HTML 前 300 字符:', html.substring(0, 300).replace(/\n/g, ' '));
    console.log('='.repeat(50));

    return html;

  } catch (error) {
    console.error('=== PDF 导入失败 ===');
    console.error('错误详情:', error);

    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        throw new Error('无效的 PDF 文件，请确保文件没有损坏');
      } else if (error.message.includes('password') || error.message.includes('encrypted')) {
        throw new Error('PDF 文件受密码保护，请先解除密码后再导入');
      } else if (error.message.includes('没有可提取的内容')) {
        throw error;
      } else {
        throw new Error(`PDF 导入失败: ${error.message}`);
      }
    }

    throw new Error('PDF 导入失败，请确保文件格式正确且未加密');
  }
}

async function extractStructuredContent(textContent: any, viewport: any): Promise<StructuredContent[]> {
  const items: TextItem[] = textContent.items;
  const result: StructuredContent[] = [];

  if (items.length === 0) return result;

  const fontSizes: number[] = items.map(item => Math.abs(item.transform[0]));
  const avgFontSize = fontSizes.reduce((a, b) => a + b, 0) / fontSizes.length;

  const lines: Array<{ y: number; items: TextItem[]; fontSize: number }> = [];
  let currentLine: TextItem[] = [];
  let currentY = items[0].transform[5];
  let currentFontSize = Math.abs(items[0].transform[0]);

  items.forEach((item: TextItem, index: number) => {
    const itemY = item.transform[5];
    const itemFontSize = Math.abs(item.transform[0]);

    if (Math.abs(itemY - currentY) < 2) {
      currentLine.push(item);
      currentFontSize = Math.max(currentFontSize, itemFontSize);
    } else {
      if (currentLine.length > 0) {
        lines.push({
          y: currentY,
          items: currentLine,
          fontSize: currentFontSize
        });
      }
      currentLine = [item];
      currentY = itemY;
      currentFontSize = itemFontSize;
    }

    if (index === items.length - 1 && currentLine.length > 0) {
      lines.push({
        y: currentY,
        items: currentLine,
        fontSize: currentFontSize
      });
    }
  });

  lines.sort((a, b) => b.y - a.y);

  const tableLines: typeof lines = [];

  // 按顺序处理每一行，保持文档结构
  lines.forEach(line => {
    const xPositions = line.items.map(item => item.transform[4]);

    // 简化表格检测：检查是否有明显的列分隔
    const hasLargeGaps = checkForLargeGaps(line.items);
    const hasMultipleWidelySpacedItems = xPositions.length >= 3 &&
      Math.max(...xPositions) - Math.min(...xPositions) > viewport.width * 0.4;

    // 如果有大间隙或者内容横跨页面宽度的 40% 以上且有 3+ 个元素，认为是表格行
    const isTableRow = hasLargeGaps || (hasMultipleWidelySpacedItems && line.items.length >= 3);

    if (isTableRow) {
      // 这是表格行，累积起来
      tableLines.push(line);
    } else {
      // 这不是表格行，先输出之前累积的表格
      if (tableLines.length > 0) {
        // 至少需要 2 行才作为表格输出
        if (tableLines.length >= 2) {
          const table = convertToTable(tableLines, viewport.width);
          if (table) result.push(table);
        } else {
          // 单行表格，作为普通段落处理
          tableLines.forEach(tLine => {
            const text = tLine.items
              .sort((a, b) => a.transform[4] - b.transform[4])
              .map(item => item.str.trim())
              .filter(s => s)
              .join(' ');
            if (text.trim()) {
              result.push({ type: 'paragraph', content: text });
            }
          });
        }
        tableLines.length = 0;
      }

      // 处理当前行
      const sortedText = line.items
        .sort((a, b) => a.transform[4] - b.transform[4])
        .map(item => item.str.trim())
        .filter(s => s)
        .join(' ');

      if (!sortedText.trim()) return;

      const isLargeText = line.fontSize > avgFontSize * 1.3;
      const isVeryLargeText = line.fontSize > avgFontSize * 1.6;

      const isBulletOrNumber = /^[•●○▪▫■□◆◇→➢►✓✔]/.test(sortedText) ||
                                /^[\d+]+\.\s/.test(sortedText) ||
                                /^[\d+]+\)\s/.test(sortedText) ||
                                /^[一二三四五六七八九十]+[、.]\s/.test(sortedText);

      if (isBulletOrNumber) {
        const cleanText = sortedText.replace(/^[•●○▪▫■□◆◇→➢►✓✔]+\s*/, '')
                                    .replace(/^[\d+]+\.\s/, '')
                                    .replace(/^[\d+]+\)\s/, '')
                                    .replace(/^[一二三四五六七八九十]+[、.]\s*/, '');
        if (cleanText.trim()) {
          result.push({
            type: 'list',
            items: [cleanText]
          });
        }
      } else if (isVeryLargeText || (isLargeText && sortedText.length < 60)) {
        const level = isVeryLargeText ? 1 : 2;
        result.push({
          type: 'heading',
          level: level,
          content: sortedText
        });
      } else {
        result.push({
          type: 'paragraph',
          content: sortedText
        });
      }
    }
  });

  // 处理最后剩余的表格行
  if (tableLines.length > 0) {
    // 至少需要 2 行才作为表格输出
    if (tableLines.length >= 2) {
      const table = convertToTable(tableLines, viewport.width);
      if (table) result.push(table);
    } else {
      // 单行表格，作为普通段落处理
      tableLines.forEach(tLine => {
        const text = tLine.items
          .sort((a, b) => a.transform[4] - b.transform[4])
          .map(item => item.str.trim())
          .filter(s => s)
          .join(' ');
        if (text.trim()) {
          result.push({ type: 'paragraph', content: text });
        }
      });
    }
  }

  return result;
}

function checkForLargeGaps(items: TextItem[]): boolean {
  if (items.length < 2) return false;

  const sorted = items.slice().sort((a, b) => a.transform[4] - b.transform[4]);
  let largeGapCount = 0;

  for (let i = 1; i < sorted.length; i++) {
    const prevItem = sorted[i - 1];
    const currItem = sorted[i];
    const prevEnd = prevItem.transform[4] + prevItem.width;
    const gap = currItem.transform[4] - prevEnd;

    // 提高阈值到 80，减少误判
    if (gap > 80) {
      largeGapCount++;
    }
  }

  // 需要至少 1 个大间隙才认为是表格行
  return largeGapCount >= 1;
}

function convertToTable(lines: Array<{ y: number; items: TextItem[]; fontSize: number }>, _pageWidth: number): StructuredContent | null {
  if (lines.length < 1) return null;

  const rows: string[][] = [];

  // 简化方法：基于 X 位置间隙来分列
  lines.forEach(line => {
    const sortedItems = line.items.sort((a, b) => a.transform[4] - b.transform[4]);
    const columns: string[] = [];
    let currentColumn = '';
    let lastEndX = 0;

    sortedItems.forEach((item, index) => {
      const itemStartX = item.transform[4];
      const gap = itemStartX - lastEndX;

      // 如果间隙超过 80 单位且已有内容，则开始新列（与检测逻辑一致）
      if (gap > 80 && currentColumn.trim()) {
        columns.push(currentColumn.trim());
        currentColumn = item.str;
      } else {
        // 同一列内，用空格连接
        if (currentColumn && item.str) {
          currentColumn += ' ' + item.str;
        } else {
          currentColumn += item.str;
        }
      }

      lastEndX = itemStartX + item.width;

      // 最后一个项目，添加到列中
      if (index === sortedItems.length - 1 && currentColumn.trim()) {
        columns.push(currentColumn.trim());
      }
    });

    if (columns.length > 0) {
      rows.push(columns);
    }
  });

  if (rows.length === 0) return null;

  // 统一列数
  const maxCols = Math.max(...rows.map(r => r.length));
  const normalizedRows = rows.map(row => {
    while (row.length < maxCols) {
      row.push('');
    }
    return row;
  });

  return {
    type: 'table',
    rows: normalizedRows
  };
}

/**
 * 使用 PDF.js 将整个页面渲染为图片
 * 当 unpdf 无法提取图片时使用此方法
 */
async function renderPageAsImage(page: any): Promise<StructuredContent | null> {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      console.error('无法创建 Canvas 上下文');
      return null;
    }

    // 使用 2x 缩放以提高清晰度
    const scale = 2.0;
    const scaledViewport = page.getViewport({ scale });

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
    };

    await page.render(renderContext).promise;

    const base64 = canvas.toDataURL('image/png');
    const sizeKB = (base64.length / 1024).toFixed(2);

    console.log(`✓ 页面渲染为图片: ${canvas.width}×${canvas.height}, ${sizeKB}KB`);

    return {
      type: 'image',
      src: base64,
    };
  } catch (error) {
    console.error('页面渲染失败:', error);
    return null;
  }
}

/**
 * 使用 unpdf 从 PDF 页面提取真实图片
 * 不是整页渲染，而是提取 PDF 内嵌的实际图片
 */
async function extractImagesFromPage(pdf: any, pageNum: number): Promise<StructuredContent[]> {
  const images: StructuredContent[] = [];

  try {
    console.log(`正在提取第 ${pageNum} 页的图片...`);

    const extractedImages = await extractImages(pdf, pageNum);

    if (extractedImages.length === 0) {
      return images;
    }

    console.log(`第 ${pageNum} 页找到 ${extractedImages.length} 张图片`);

    for (let i = 0; i < extractedImages.length; i++) {
      const img = extractedImages[i] as unknown as ExtendedImageObject;

      try {
        // 详细日志：记录图片对象的所有关键属性
        console.log(`图片 ${i + 1} 属性:`, {
          width: img.width,
          height: img.height,
          channels: img.channels,
          hasData: !!img.data,
          hasBitmap: !!img.bitmap,
          dataLength: img.data?.length,
          bitmapLength: img.bitmap?.length,
          kind: img.kind,
          expectedRGBA: img.width * img.height * 4,
          expectedRGB: img.width * img.height * 3,
          expectedGray: img.width * img.height
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn(`无法创建 Canvas 上下文`);
          continue;
        }

        const imageData = new ImageData(img.width, img.height);
        let converted = false;

        // 方式 1: 使用 img.data + img.channels
        if (img.data && img.channels) {
          if (img.channels === 4) {
            imageData.data.set(img.data);
            converted = true;
            console.log(`✓ 使用 RGBA 格式 (${img.channels} 通道)`);
          } else if (img.channels === 3) {
            for (let j = 0, k = 0; j < img.data.length; j += 3, k += 4) {
              imageData.data[k] = img.data[j];
              imageData.data[k + 1] = img.data[j + 1];
              imageData.data[k + 2] = img.data[j + 2];
              imageData.data[k + 3] = 255;
            }
            converted = true;
            console.log(`✓ RGB 转 RGBA (${img.channels} 通道)`);
          } else if (img.channels === 1) {
            for (let j = 0, k = 0; j < img.data.length; j++, k += 4) {
              const gray = img.data[j];
              imageData.data[k] = gray;
              imageData.data[k + 1] = gray;
              imageData.data[k + 2] = gray;
              imageData.data[k + 3] = 255;
            }
            converted = true;
            console.log(`✓ 灰度转 RGBA (${img.channels} 通道)`);
          }
        }

        // 方式 2: 使用 img.bitmap（当 img.data 不存在时）
        if (!converted && img.bitmap) {
          const bitmap = img.bitmap;
          const expectedRGBA = img.width * img.height * 4;
          const expectedRGB = img.width * img.height * 3;
          const expectedGray = img.width * img.height;

          console.log(`尝试处理 bitmap 格式，长度: ${bitmap.length}`);

          if (bitmap.length === expectedRGBA) {
            // RGBA 格式
            imageData.data.set(bitmap);
            converted = true;
            console.log(`✓ bitmap RGBA 格式`);
          } else if (bitmap.length === expectedRGB) {
            // RGB 格式
            for (let j = 0, k = 0; j < bitmap.length; j += 3, k += 4) {
              imageData.data[k] = bitmap[j];
              imageData.data[k + 1] = bitmap[j + 1];
              imageData.data[k + 2] = bitmap[j + 2];
              imageData.data[k + 3] = 255;
            }
            converted = true;
            console.log(`✓ bitmap RGB 格式`);
          } else if (bitmap.length === expectedGray) {
            // 灰度格式
            for (let j = 0, k = 0; j < bitmap.length; j++, k += 4) {
              const gray = bitmap[j];
              imageData.data[k] = gray;
              imageData.data[k + 1] = gray;
              imageData.data[k + 2] = gray;
              imageData.data[k + 3] = 255;
            }
            converted = true;
            console.log(`✓ bitmap 灰度格式`);
          } else {
            console.error(`❌ 未知的 bitmap 格式，长度: ${bitmap.length}, 预期 RGBA: ${expectedRGBA}, RGB: ${expectedRGB}, 灰度: ${expectedGray}`);
          }
        }

        if (!converted) {
          console.warn(`⚠️ 图片 ${i + 1} 无法转换，跳过`);
          continue;
        }

        ctx.putImageData(imageData, 0, 0);

        const dataUrl = canvas.toDataURL('image/png');

        // 验证生成的图片是否有效（不是全黑/全白）
        const testCanvas = document.createElement('canvas');
        const testSize = Math.min(Math.min(img.width, img.height), 100);
        testCanvas.width = testSize;
        testCanvas.height = testSize;
        const testCtx = testCanvas.getContext('2d');

        let isValidImage = true;

        if (testCtx && testSize > 0) {
          try {
            testCtx.drawImage(canvas, 0, 0, testSize, testSize);
            const testData = testCtx.getImageData(0, 0, testSize, testSize);

            // 计算非透明像素的颜色方差
            let totalR = 0, totalG = 0, totalB = 0;
            let nonTransparentPixels = 0;

            for (let j = 0; j < testData.data.length; j += 4) {
              const alpha = testData.data[j + 3];
              if (alpha > 0) {
                totalR += testData.data[j];
                totalG += testData.data[j + 1];
                totalB += testData.data[j + 2];
                nonTransparentPixels++;
              }
            }

            if (nonTransparentPixels === 0) {
              console.warn(`⚠️ 图片 ${i + 1} 完全透明，跳过`);
              isValidImage = false;
            } else {
              const avgR = totalR / nonTransparentPixels;
              const avgG = totalG / nonTransparentPixels;
              const avgB = totalB / nonTransparentPixels;

              // 计算方差
              let varianceSum = 0;
              let sampleCount = 0;
              for (let j = 0; j < testData.data.length; j += 4) {
                const alpha = testData.data[j + 3];
                if (alpha > 0) {
                  const r = testData.data[j];
                  const g = testData.data[j + 1];
                  const b = testData.data[j + 2];
                  varianceSum += Math.pow(r - avgR, 2) + Math.pow(g - avgG, 2) + Math.pow(b - avgB, 2);
                  sampleCount++;
                }
              }

              const variance = sampleCount > 0 ? varianceSum / sampleCount : 0;

              // 如果方差太小，说明图片可能是纯色的
              if (variance < 1) {
                console.warn(`⚠️ 图片 ${i + 1} 可能是纯色 (方差: ${variance.toFixed(2)})，但仍保留`);
                // 注意：这里改为保留而不是跳过，因为可能是有用的背景色
              }

              console.log(`✓ 图片验证: 非透明像素=${nonTransparentPixels}, 平均颜色=(${avgR.toFixed(0)},${avgG.toFixed(0)},${avgB.toFixed(0)}), 方差=${variance.toFixed(2)}`);
            }
          } catch (testError) {
            console.warn(`⚠️ 图片 ${i + 1} 验证失败，但仍保留:`, testError);
            // 验证失败时，保守起见，仍然保留图片
          }
        }

        if (!isValidImage) {
          continue;
        }

        const sizeKB = Math.round(dataUrl.length / 1024);

        images.push({
          type: 'image' as const,
          src: dataUrl,
          content: `第 ${pageNum} 页 - 图片 ${i + 1} (${img.width}×${img.height}, ${sizeKB}KB)`
        });

        console.log(`✅ 图片 ${i + 1}: ${img.width}×${img.height}, ${sizeKB}KB`);
      } catch (imgError) {
        console.error(`第 ${pageNum} 页图片 ${i + 1} 转换失败:`, imgError);
      }
    }

    return images;
  } catch (error) {
    console.error(`第 ${pageNum} 页图片提取失败:`, error);
    return images;
  }
}

/**
 * 将结构化内容转换为 HTML
 */
function convertStructuredContentToHtml(contents: StructuredContent[]): string {
  const htmlParts: string[] = [];
  let inList = false;
  const listItems: string[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      htmlParts.push('<ul style="margin: 12px 0; padding-left: 28px; line-height: 1.8;">');
      listItems.forEach(item => {
        htmlParts.push(`<li style="margin: 6px 0;">${escapeHtml(item)}</li>`);
      });
      htmlParts.push('</ul>');
      listItems.length = 0;
      inList = false;
    }
  };

  contents.forEach(content => {
    if (content.type === 'list') {
      inList = true;
      if (content.items) {
        listItems.push(...content.items);
      }
    } else {
      flushList();

      switch (content.type) {
        case 'heading':
          const level = content.level || 2;
          const headingStyles: { [key: number]: string } = {
            1: 'font-size: 26px; font-weight: 700; margin-top: 28px; margin-bottom: 18px; color: #1a202c; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; line-height: 1.3;',
            2: 'font-size: 22px; font-weight: 700; margin-top: 24px; margin-bottom: 14px; color: #2d3748; border-bottom: 2px solid #60a5fa; padding-bottom: 8px; line-height: 1.3;',
            3: 'font-size: 18px; font-weight: 600; margin-top: 20px; margin-bottom: 10px; color: #374151; line-height: 1.4;'
          };
          const style = headingStyles[level] || headingStyles[2];
          htmlParts.push(`<h${level} style="${style}">${escapeHtml(content.content || '')}</h${level}>`);
          break;

        case 'paragraph':
          if (content.content && content.content.trim()) {
            htmlParts.push(`<p style="margin: 10px 0; line-height: 1.8; color: #374151; text-align: justify;">${escapeHtml(content.content)}</p>`);
          }
          break;

        case 'table':
          if (content.rows && content.rows.length > 0) {
            htmlParts.push('<div style="overflow-x: auto; margin: 20px 0;"><table style="border-collapse: collapse; width: 100%; border: 1px solid #d1d5db; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">');
            content.rows.forEach((row, rowIndex) => {
              const rowStyle = rowIndex === 0 ? 'background-color: #f3f4f6;' : (rowIndex % 2 === 1 ? 'background-color: #fafafa;' : '');
              htmlParts.push(`<tr style="${rowStyle}">`);
              row.forEach(cell => {
                const tag = rowIndex === 0 ? 'th' : 'td';
                const cellStyle = rowIndex === 0
                  ? 'border: 1px solid #d1d5db; padding: 12px; text-align: left; font-weight: 600; background-color: #e5e7eb; color: #1f2937;'
                  : 'border: 1px solid #e5e7eb; padding: 10px; text-align: left; color: #374151;';
                htmlParts.push(`<${tag} style="${cellStyle}">${escapeHtml(cell)}</${tag}>`);
              });
              htmlParts.push('</tr>');
            });
            htmlParts.push('</table></div>');
          }
          break;

        case 'image':
          if (content.src) {
            htmlParts.push(`<div style="text-align: center; margin: 24px 0; padding: 16px; background: #f9fafb; border-radius: 8px;">
              <img src="${content.src}" alt="${escapeHtml(content.content || '图片')}" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
              <p style="margin-top: 8px; font-size: 14px; color: #6b7280; font-style: italic;">${escapeHtml(content.content || '图片')}</p>
            </div>`);
          } else {
            htmlParts.push(`<div style="margin: 20px 0; padding: 24px; background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; text-align: center;">
              <p style="color: #9ca3af; font-style: italic; margin: 0;">${escapeHtml(content.content || '[图片渲染失败]')}</p>
            </div>`);
          }
          break;
      }
    }
  });

  flushList();

  return htmlParts.join('\n');
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function importDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value || '<p></p>';
}

async function importMarkdown(file: File): Promise<string> {
  const text = await file.text();
  const html = await marked(text);
  return html || '<p></p>';
}

async function importText(file: File): Promise<string> {
  const text = await file.text();
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  if (paragraphs.length === 0) return '<p></p>';
  return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}

async function importHtml(file: File): Promise<string> {
  const html = await file.text();
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : html;
}

export async function exportDocument(html: string, format: ExportFormat, fileName: string): Promise<void> {
  switch (format) {
    case 'txt':
      exportAsText(html, fileName);
      break;
    case 'md':
      exportAsMarkdown(html, fileName);
      break;
    case 'docx':
      await exportAsDocx(html, fileName);
      break;
    case 'html':
      exportAsHtml(html, fileName);
      break;
    case 'pdf':
      await exportAsPdf(html, fileName);
      break;
    default:
      throw new Error('不支持的导出格式');
  }
}

function htmlToPlainText(html: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = html;

  const blocks = temp.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, tr, div');
  blocks.forEach(block => {
    block.insertAdjacentText('afterend', '\n');
  });

  const brs = temp.querySelectorAll('br');
  brs.forEach(br => {
    br.replaceWith('\n');
  });

  return (temp.textContent || temp.innerText || '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}

function exportAsText(html: string, fileName: string): void {
  const text = htmlToPlainText(html);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${fileName}.txt`);
}

function exportAsMarkdown(html: string, fileName: string): void {
  const markdown = htmlToMarkdown(html);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `${fileName}.md`);
}

function exportAsHtml(html: string, fileName: string): void {
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${fileName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1, h2, h3 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background-color: #f5f5f5; }
    code { background-color: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
    pre { background-color: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; }
    blockquote { border-left: 4px solid #ddd; margin: 16px 0; padding-left: 16px; color: #666; }
    img { max-width: 100%; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  saveAs(blob, `${fileName}.html`);
}

interface ParsedElement {
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'blockquote' | 'code';
  level?: number;
  content?: string;
  items?: string[];
  rows?: string[][];
  listType?: 'bullet' | 'number';
}

function parseHtmlToElements(html: string): ParsedElement[] {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const elements: ParsedElement[] = [];

  const children = temp.children;
  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    const tagName = el.tagName.toLowerCase();

    if (/^h[1-6]$/.test(tagName)) {
      const level = parseInt(tagName[1]);
      elements.push({
        type: 'heading',
        level,
        content: el.textContent || '',
      });
    } else if (tagName === 'p') {
      elements.push({
        type: 'paragraph',
        content: el.textContent || '',
      });
    } else if (tagName === 'ul' || tagName === 'ol') {
      const items: string[] = [];
      const lis = el.querySelectorAll('li');
      lis.forEach(li => items.push(li.textContent || ''));
      elements.push({
        type: 'list',
        listType: tagName === 'ul' ? 'bullet' : 'number',
        items,
      });
    } else if (tagName === 'table') {
      const rows: string[][] = [];
      const trs = el.querySelectorAll('tr');
      trs.forEach(tr => {
        const cells: string[] = [];
        const tds = tr.querySelectorAll('th, td');
        tds.forEach(td => cells.push(td.textContent || ''));
        rows.push(cells);
      });
      elements.push({ type: 'table', rows });
    } else if (tagName === 'blockquote') {
      elements.push({
        type: 'blockquote',
        content: el.textContent || '',
      });
    } else if (tagName === 'pre') {
      elements.push({
        type: 'code',
        content: el.textContent || '',
      });
    } else if (el.textContent?.trim()) {
      elements.push({
        type: 'paragraph',
        content: el.textContent || '',
      });
    }
  }

  return elements;
}

function getHeadingLevel(level: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  const levels: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
    5: HeadingLevel.HEADING_5,
    6: HeadingLevel.HEADING_6,
  };
  return levels[level] || HeadingLevel.HEADING_1;
}

async function exportAsDocx(html: string, fileName: string): Promise<void> {
  const elements = parseHtmlToElements(html);
  const children: (Paragraph | Table)[] = [];

  elements.forEach((el) => {
    switch (el.type) {
      case 'heading':
        children.push(
          new Paragraph({
            text: el.content || '',
            heading: getHeadingLevel(el.level || 1),
          })
        );
        break;
      case 'paragraph':
        children.push(
          new Paragraph({
            children: [new TextRun(el.content || '')],
          })
        );
        break;
      case 'list':
        el.items?.forEach((item, i) => {
          children.push(
            new Paragraph({
              children: [new TextRun(el.listType === 'number' ? `${i + 1}. ${item}` : `- ${item}`)],
              indent: { left: 720 },
            })
          );
        });
        break;
      case 'table':
        if (el.rows && el.rows.length > 0) {
          const table = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: el.rows.map((row, rowIdx) =>
              new TableRow({
                children: row.map(cell =>
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({
                        text: cell,
                        bold: rowIdx === 0,
                      })],
                    })],
                  })
                ),
              })
            ),
          });
          children.push(table);
        }
        break;
      case 'blockquote':
        children.push(
          new Paragraph({
            children: [new TextRun({
              text: el.content || '',
              italics: true,
            })],
            indent: { left: 720 },
          })
        );
        break;
      case 'code':
        children.push(
          new Paragraph({
            children: [new TextRun({
              text: el.content || '',
              font: 'Consolas',
              size: 20,
            })],
            shading: { fill: 'F5F5F5' },
          })
        );
        break;
    }
  });

  if (children.length === 0) {
    children.push(new Paragraph({ text: '' }));
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
}

async function exportAsPdf(html: string, fileName: string): Promise<void> {
  try {
    console.log('=== 导出 PDF 调试信息 ===');
    console.log('HTML 长度:', html?.length);
    console.log('HTML 前200字符:', html?.substring(0, 200));
    console.log('文件名:', fileName);

    if (!html || html.trim() === '') {
      throw new Error('文档内容为空，无法导出');
    }

    const safeName = String(fileName).replace(/[<>"'`]/g, '');

    const printContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeName}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      background: white;
      padding: 20px;
      margin: 0;
      max-width: 210mm;
    }

    h1 {
      font-size: 20pt;
      font-weight: bold;
      margin: 16pt 0 10pt 0;
      color: #1a1a1a;
      border-bottom: 2pt solid #3b82f6;
      padding-bottom: 8pt;
      page-break-after: avoid;
    }

    h2 {
      font-size: 18pt;
      font-weight: bold;
      margin: 14pt 0 8pt 0;
      color: #2a2a2a;
      border-bottom: 1pt solid #60a5fa;
      padding-bottom: 6pt;
      page-break-after: avoid;
    }

    h3 {
      font-size: 16pt;
      font-weight: bold;
      margin: 12pt 0 6pt 0;
      color: #3a3a3a;
      page-break-after: avoid;
    }

    h4 {
      font-size: 14pt;
      font-weight: bold;
      margin: 10pt 0 6pt 0;
      color: #4a4a4a;
      page-break-after: avoid;
    }

    h5, h6 {
      font-size: 12pt;
      font-weight: bold;
      margin: 8pt 0 4pt 0;
      color: #5a5a5a;
      page-break-after: avoid;
    }

    p {
      margin: 8pt 0;
      page-break-inside: avoid;
    }

    ul, ol {
      margin: 8pt 0;
      padding-left: 24pt;
    }

    li {
      margin: 4pt 0;
      page-break-inside: avoid;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0;
      border: 1pt solid #ddd;
    }

    th, td {
      border: 1pt solid #ddd;
      padding: 6pt 10pt;
      text-align: left;
    }

    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }

    tr:nth-child(even) {
      background-color: #fafafa;
    }

    blockquote {
      margin: 10pt 0;
      padding: 10pt;
      background-color: #f9fafb;
      border-left: 4pt solid #3b82f6;
      font-style: italic;
      color: #4b5563;
    }

    pre {
      background-color: #f8f8f8;
      padding: 10pt;
      border: 1pt solid #e5e5e5;
      border-radius: 3pt;
      font-family: "Courier New", Consolas, monospace;
      font-size: 9pt;
      white-space: pre-wrap;
      word-wrap: break-word;
      margin: 10pt 0;
    }

    code {
      background-color: #f5f5f5;
      padding: 2pt 4pt;
      border-radius: 2pt;
      font-family: "Courier New", Consolas, monospace;
      font-size: 9pt;
    }

    pre code {
      background-color: transparent;
      padding: 0;
    }

    strong, b {
      font-weight: bold;
    }

    em, i {
      font-style: italic;
    }

    hr {
      margin: 12pt 0;
      border: none;
      border-top: 1pt solid #ddd;
    }

    img {
      max-width: 100%;
      height: auto;
      margin: 10pt 0;
      display: block;
    }

    a {
      color: #3b82f6;
      text-decoration: underline;
    }

    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
      z-index: 1000;
    }

    .print-button:hover {
      background-color: #2563eb;
    }

    @media print {
      .print-button {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <button class="print-button" onclick="window.print()">打印 / 另存为 PDF</button>
  <div class="content">
` + html + `
  </div>
</body>
</html>`;

    console.log('准备创建 Blob，内容长度:', printContent.length);

    const blob = new Blob([printContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    console.log('Blob URL 创建成功:', url);

    const printWindow = window.open(url, '_blank');

    if (!printWindow) {
      URL.revokeObjectURL(url);
      throw new Error('无法打开打印窗口，请允许弹窗');
    }

    console.log('新窗口已打开');

    setTimeout(() => {
      URL.revokeObjectURL(url);
      console.log('Blob URL 已释放');
    }, 10000);

  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw new Error('PDF 导出失败：' + (error instanceof Error ? error.message : '未知错误'));
  }
}

export function getAcceptedFileTypes(): string {
  return '.txt,.md,.markdown,.docx,.doc,.html,.htm,.pdf';
}
