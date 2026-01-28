import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Folder, FolderOpen, Eye, Edit, Trash2, Plus, FolderPlus, Copy, FolderInput } from 'lucide-react';
import { dataService } from '../services';
import { useToastContext } from '../contexts/ToastContext';
import type { Scenario } from '../lib/database.types';

interface FolderGroup {
  id: string;
  name: string;
  scenarios: Scenario[];
  expanded: boolean;
}

export default function SOPLibraryPage() {
  const navigate = useNavigate();
  const toast = useToastContext();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [folders, setFolders] = useState<FolderGroup[]>([
    { id: 'all', name: '全部文档', scenarios: [], expanded: true },
    { id: 'ungrouped', name: '未分组', scenarios: [], expanded: true },
  ]);
  const [loading, setLoading] = useState(true);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  useEffect(() => {
    fetchScenarios();
  }, []);

  useEffect(() => {
    organizeScenarios();
  }, [scenarios]);

  const fetchScenarios = async () => {
    try {
      const { data, error } = await dataService.query<Scenario>('scenarios', {
        order: { column: 'created_at', ascending: false }
      });

      if (error) throw error;
      setScenarios(data || []);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizeScenarios = () => {
    const updatedFolders = [...folders];
    const allFolder = updatedFolders.find(f => f.id === 'all')!;
    const ungroupedFolder = updatedFolders.find(f => f.id === 'ungrouped')!;

    allFolder.scenarios = scenarios;

    const groupedScenarioIds = new Set<string>();
    updatedFolders.forEach(folder => {
      if (folder.id !== 'all' && folder.id !== 'ungrouped') {
        folder.scenarios.forEach(s => groupedScenarioIds.add(s.id));
      }
    });

    ungroupedFolder.scenarios = scenarios.filter(s => !groupedScenarioIds.has(s.id));

    setFolders(updatedFolders);
  };

  const toggleFolder = (folderId: string) => {
    setFolders(folders.map(f =>
      f.id === folderId ? { ...f, expanded: !f.expanded } : f
    ));
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: FolderGroup = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      scenarios: [],
      expanded: true,
    };

    setFolders([...folders.slice(0, -1), newFolder, folders[folders.length - 1]]);
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  const deleteFolder = (folderId: string) => {
    if (folderId === 'all' || folderId === 'ungrouped') return;
    if (!confirm('确定要删除此文件夹吗？文档不会被删除。')) return;

    setFolders(folders.filter(f => f.id !== folderId));
  };

  const deleteScenario = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个SOP文档吗？')) return;

    try {
      const { error } = await dataService.delete('scenarios', id);
      if (error) throw error;
      toast.success('文档删除成功');
      fetchScenarios();
    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast.error('删除失败');
    }
  };

  const copyScenario = async (scenario: Scenario, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await dataService.insert('scenarios', {
        name: `${scenario.name} (副本)`,
        description: scenario.description,
        sop_content: scenario.sop_content,
        flowchart_data: scenario.flowchart_data,
        workflow_id: scenario.workflow_id,
        parameters: scenario.parameters,
        user_id: scenario.user_id,
      });
      if (error) throw error;
      toast.success('文档复制成功');
      fetchScenarios();
    } catch (error) {
      console.error('Error copying scenario:', error);
      toast.error('复制失败');
    }
  };

  const openMoveModal = (scenario: Scenario, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedScenario(scenario);
    setShowMoveModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SOP 文档库</h1>
            <p className="mt-1 text-sm text-gray-500">
              浏览和管理所有应急处理标准操作程序文档
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              新建文件夹
            </button>
            <button
              onClick={() => navigate('/scenarios')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新建 SOP
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6">
        {folders.map((folder) => (
          <div key={folder.id} className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => toggleFolder(folder.id)}
                className="flex items-center gap-2 text-lg font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                {folder.expanded ? (
                  <FolderOpen className="w-5 h-5 text-amber-500" />
                ) : (
                  <Folder className="w-5 h-5 text-amber-500" />
                )}
                {folder.name}
                <span className="text-sm font-normal text-gray-500">
                  ({folder.scenarios.length})
                </span>
              </button>
              {folder.id !== 'all' && folder.id !== 'ungrouped' && (
                <button
                  onClick={() => deleteFolder(folder.id)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                  title="删除文件夹"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {folder.expanded && (
              <div className="ml-7 space-y-1">
                {folder.scenarios.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    {folder.id === 'all' ? '暂无 SOP 文档' : '暂无文档'}
                  </div>
                ) : (
                  folder.scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="group flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/sop-viewer/${scenario.id}`)}>
                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {scenario.name}
                          </h3>
                          {scenario.description && (
                            <p className="text-sm text-gray-500 truncate">
                              {scenario.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(scenario.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/sop-viewer/${scenario.id}`);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="查看"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/scenarios/${scenario.id}`);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => openMoveModal(scenario, e)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          title="移动"
                        >
                          <FolderInput className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => copyScenario(scenario, e)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          title="复制"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => deleteScenario(scenario.id, e)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">新建文件夹</h2>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createFolder()}
              placeholder="输入文件夹名称"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName('');
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={createFolder}
                disabled={!newFolderName.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showMoveModal && selectedScenario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">移动文档</h2>
            <p className="text-sm text-gray-600 mb-4">
              选择要将 "{selectedScenario.name}" 移动到的文件夹
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {folders.filter(f => f.id !== 'all' && f.id !== 'ungrouped').map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    setShowMoveModal(false);
                    setSelectedScenario(null);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                >
                  <Folder className="w-5 h-5 text-amber-500" />
                  <span className="font-medium text-gray-900">{folder.name}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowMoveModal(false);
                  setSelectedScenario(null);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
