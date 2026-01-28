import { Palette, Check } from 'lucide-react';
import { flowchartThemes, FlowchartTheme } from './themes';

interface ThemeSelectorProps {
  currentThemeId?: string;
  onThemeChange: (theme: FlowchartTheme) => void;
}

export const ThemeSelector = ({ currentThemeId, onThemeChange }: ThemeSelectorProps) => {
  return (
    <div className="absolute right-4 top-20 z-10 bg-white rounded-lg shadow-lg border border-gray-200 w-72">
      <div className="p-3 border-b border-gray-200 flex items-center gap-2">
        <Palette className="w-4 h-4 text-gray-600" />
        <h3 className="font-semibold text-sm text-gray-700">流程图主题</h3>
      </div>

      <div className="p-2 max-h-[calc(100vh-200px)] overflow-y-auto">
        <div className="space-y-2">
          {flowchartThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme)}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                currentThemeId === theme.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-sm text-gray-900">{theme.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{theme.description}</div>
                </div>
                {currentThemeId === theme.id && (
                  <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                )}
              </div>

              <div className="flex gap-1.5 mt-2">
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: theme.colors.start }}
                  title="开始"
                />
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: theme.colors.process }}
                  title="处理"
                />
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: theme.colors.decision }}
                  title="决策"
                />
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: theme.colors.dataIO }}
                  title="数据"
                />
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: theme.colors.storage }}
                  title="存储"
                />
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: theme.colors.document }}
                  title="文档"
                />
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: theme.colors.end }}
                  title="结束"
                />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 leading-relaxed">
            选择主题后将自动应用到所有流程图元素。可随时切换不同主题。
          </p>
        </div>
      </div>
    </div>
  );
};
