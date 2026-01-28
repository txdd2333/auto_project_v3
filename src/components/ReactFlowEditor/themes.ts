export interface FlowchartTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    start: string;
    process: string;
    decision: string;
    dataIO: string;
    storage: string;
    document: string;
    end: string;
    default: string;
  };
  textColor: string;
  borderColor: string;
  borderWidth: number;
  edgeColor: string;
  edgeWidth: number;
  edgeAnimated: boolean;
}

export const flowchartThemes: FlowchartTheme[] = [
  {
    id: 'classic',
    name: '经典蓝',
    description: '传统流程图配色，专业简洁',
    colors: {
      start: '#e1f5e1',
      process: '#e3f2fd',
      decision: '#fff9c4',
      dataIO: '#f3e5f5',
      storage: '#e0f2f1',
      document: '#fce4ec',
      end: '#ffebee',
      default: '#ffffff',
    },
    textColor: '#1a1a1a',
    borderColor: '#2c3e50',
    borderWidth: 2,
    edgeColor: '#2c3e50',
    edgeWidth: 2,
    edgeAnimated: false,
  },
  {
    id: 'modern',
    name: '现代渐变',
    description: '渐变色彩，视觉冲击力强',
    colors: {
      start: '#a8e6cf',
      process: '#dcedc1',
      decision: '#ffd3b6',
      dataIO: '#ffaaa5',
      storage: '#ff8b94',
      document: '#d4a5a5',
      end: '#9aa5ce',
      default: '#f0f4f8',
    },
    textColor: '#2d3748',
    borderColor: '#4a5568',
    borderWidth: 2,
    edgeColor: '#4a5568',
    edgeWidth: 2,
    edgeAnimated: false,
  },
  {
    id: 'dark',
    name: '深色主题',
    description: '深色背景，适合暗色环境',
    colors: {
      start: '#2d3748',
      process: '#4a5568',
      decision: '#718096',
      dataIO: '#2c5282',
      storage: '#2c7a7b',
      document: '#276749',
      end: '#744210',
      default: '#1a202c',
    },
    textColor: '#e2e8f0',
    borderColor: '#cbd5e0',
    borderWidth: 2,
    edgeColor: '#cbd5e0',
    edgeWidth: 2,
    edgeAnimated: false,
  },
  {
    id: 'vibrant',
    name: '活力彩虹',
    description: '鲜艳色彩，充满活力',
    colors: {
      start: '#ff6b6b',
      process: '#4ecdc4',
      decision: '#ffe66d',
      dataIO: '#a8dadc',
      storage: '#f1faee',
      document: '#e63946',
      end: '#1d3557',
      default: '#ffffff',
    },
    textColor: '#2b2d42',
    borderColor: '#8d99ae',
    borderWidth: 2,
    edgeColor: '#8d99ae',
    edgeWidth: 2,
    edgeAnimated: true,
  },
  {
    id: 'minimal',
    name: '极简黑白',
    description: '简约风格，黑白配色',
    colors: {
      start: '#f8f9fa',
      process: '#e9ecef',
      decision: '#dee2e6',
      dataIO: '#ced4da',
      storage: '#adb5bd',
      document: '#6c757d',
      end: '#495057',
      default: '#ffffff',
    },
    textColor: '#212529',
    borderColor: '#212529',
    borderWidth: 1,
    edgeColor: '#212529',
    edgeWidth: 1,
    edgeAnimated: false,
  },
  {
    id: 'nature',
    name: '自然绿',
    description: '自然清新，护眼舒适',
    colors: {
      start: '#d4edda',
      process: '#c3e6cb',
      decision: '#b1dfbb',
      dataIO: '#bee5eb',
      storage: '#d1ecf1',
      document: '#cfe2ff',
      end: '#f8d7da',
      default: '#ffffff',
    },
    textColor: '#155724',
    borderColor: '#28a745',
    borderWidth: 2,
    edgeColor: '#28a745',
    edgeWidth: 2,
    edgeAnimated: false,
  },
  {
    id: 'corporate',
    name: '企业蓝',
    description: '商务专业，适合企业展示',
    colors: {
      start: '#cfe2ff',
      process: '#b6d7ff',
      decision: '#9ec5fe',
      dataIO: '#6ea8fe',
      storage: '#3d8bfd',
      document: '#0a58ca',
      end: '#084298',
      default: '#ffffff',
    },
    textColor: '#ffffff',
    borderColor: '#0d6efd',
    borderWidth: 2,
    edgeColor: '#0d6efd',
    edgeWidth: 2,
    edgeAnimated: false,
  },
  {
    id: 'warm',
    name: '温暖橙',
    description: '积极温暖，充满活力',
    colors: {
      start: '#ffe5d0',
      process: '#fed7aa',
      decision: '#fec89a',
      dataIO: '#feb272',
      storage: '#fd9843',
      document: '#fd7e14',
      end: '#dc6502',
      default: '#ffffff',
    },
    textColor: '#ffffff',
    borderColor: '#fd7e14',
    borderWidth: 2,
    edgeColor: '#fd7e14',
    edgeWidth: 2,
    edgeAnimated: false,
  },
  {
    id: 'tech',
    name: '科技紫',
    description: '现代科技感，创新前沿',
    colors: {
      start: '#e0cffc',
      process: '#d0b7f8',
      decision: '#bf9ef4',
      dataIO: '#a78bfa',
      storage: '#8b5cf6',
      document: '#7c3aed',
      end: '#6d28d9',
      default: '#ffffff',
    },
    textColor: '#ffffff',
    borderColor: '#7c3aed',
    borderWidth: 2,
    edgeColor: '#7c3aed',
    edgeWidth: 2,
    edgeAnimated: true,
  },
  {
    id: 'elegant',
    name: '简约灰',
    description: '优雅简约，商务专业',
    colors: {
      start: '#f8f9fa',
      process: '#e9ecef',
      decision: '#dee2e6',
      dataIO: '#ced4da',
      storage: '#adb5bd',
      document: '#6c757d',
      end: '#495057',
      default: '#ffffff',
    },
    textColor: '#212529',
    borderColor: '#6c757d',
    borderWidth: 2,
    edgeColor: '#6c757d',
    edgeWidth: 2,
    edgeAnimated: false,
  },
  {
    id: 'ocean',
    name: '海洋蓝',
    description: '清新海洋，宁静专注',
    colors: {
      start: '#cff4fc',
      process: '#9eeaf9',
      decision: '#6edff6',
      dataIO: '#3dd5f3',
      storage: '#0dcaf0',
      document: '#0aa2c0',
      end: '#087990',
      default: '#ffffff',
    },
    textColor: '#ffffff',
    borderColor: '#0dcaf0',
    borderWidth: 2,
    edgeColor: '#0dcaf0',
    edgeWidth: 2,
    edgeAnimated: false,
  },
  {
    id: 'sunset',
    name: '日落红',
    description: '温馨日落，优雅浪漫',
    colors: {
      start: '#f8d7da',
      process: '#f5c2c7',
      decision: '#f1aeb5',
      dataIO: '#ea868f',
      storage: '#dc3545',
      document: '#b02a37',
      end: '#842029',
      default: '#ffffff',
    },
    textColor: '#ffffff',
    borderColor: '#dc3545',
    borderWidth: 2,
    edgeColor: '#dc3545',
    edgeWidth: 2,
    edgeAnimated: false,
  },
];

export function getColorForNodeType(theme: FlowchartTheme, nodeType: string): string {
  switch (nodeType) {
    case 'roundedRectangle':
      return theme.colors.start;
    case 'rectangle':
      return theme.colors.process;
    case 'diamond':
      return theme.colors.decision;
    case 'parallelogram':
      return theme.colors.dataIO;
    case 'cylinder':
      return theme.colors.storage;
    case 'document':
      return theme.colors.document;
    case 'circle':
      return theme.colors.end;
    case 'hexagon':
      return theme.colors.storage;
    default:
      return theme.colors.default;
  }
}
