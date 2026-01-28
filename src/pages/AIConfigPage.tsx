import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Settings, Globe, Server, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../contexts/ToastContext';
import ServiceFactory from '../services/ServiceFactory';
import AIService from '../services/ai/AIService';

// AI Provider presets with templates
const AI_PROVIDERS = [
  // International Top Providers
  { category: '国际顶级AI厂商', providers: [
    { id: 'openai', name: 'OpenAI (GPT)', apiBase: 'https://api.openai.com/v1', models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    { id: 'google', name: 'Google (Gemini)', apiBase: 'https://generativelanguage.googleapis.com/v1', models: ['gemini-pro', 'gemini-ultra'] },
    { id: 'anthropic', name: 'Anthropic (Claude)', apiBase: 'https://api.anthropic.com/v1', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
    { id: 'xai', name: 'xAI (Grok)', apiBase: 'https://api.x.ai/v1', models: ['grok-1', 'grok-2'] },
  ]},
  // Chinese Major Providers
  { category: '国产头部大厂', providers: [
    { id: 'qwen', name: '阿里云 - 通义千问', apiBase: 'https://dashscope.aliyuncs.com/api/v1', models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'Qwen2.5-72B'] },
    { id: 'ernie', name: '百度 - 文心一言', apiBase: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1', models: ['ernie-4.0', 'ernie-3.5', 'ernie-bot'] },
    { id: 'doubao', name: '字节跳动 - 豆包', apiBase: 'https://ark.cn-beijing.volces.com/api/v3', models: ['doubao-pro', 'doubao-lite'] },
    { id: 'hunyuan', name: '腾讯 - 混元', apiBase: 'https://api.hunyuan.cloud.tencent.com/v1', models: ['hunyuan-pro', 'hunyuan-standard'] },
    { id: 'spark', name: '讯飞 - 星火', apiBase: 'https://spark-api.xf-yun.com/v1', models: ['spark-3.5', 'spark-3.0'] },
    { id: 'pangu', name: '华为 - 盘古', apiBase: 'https://pangu.huaweicloud.com/v1', models: ['pangu-alpha'] },
  ]},
  // Chinese Unicorns
  { category: '国产新锐独角兽', providers: [
    { id: 'zhipu', name: '智谱AI - ChatGLM', apiBase: 'https://open.bigmodel.cn/api/paas/v4', models: ['glm-4', 'glm-3-turbo'] },
    { id: 'moonshot', name: '月之暗面 - Kimi', apiBase: 'https://api.moonshot.cn/v1', models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'] },
    { id: 'deepseek', name: 'DeepSeek', apiBase: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-coder', 'DeepSeek-V3-0324'] },
    { id: 'minimax', name: 'MiniMax', apiBase: 'https://api.minimax.chat/v1', models: ['abab5.5-chat', 'abab6-chat'] },
    { id: 'baichuan', name: '百川智能 - Baichuan', apiBase: 'https://api.baichuan-ai.com/v1', models: ['baichuan2-53b', 'baichuan2-13b'] },
    { id: 'yi', name: '零一万物 - Yi', apiBase: 'https://api.lingyiwanwu.com/v1', models: ['yi-34b-chat', 'yi-6b-chat'] },
    { id: 'cpm', name: '面壁智能 - CPM', apiBase: 'https://api.modelbest.cn/v1', models: ['cpm-bee'] },
    { id: 'sensenova', name: '商汤 - SenseNova', apiBase: 'https://api.sensenova.cn/v1', models: ['sensenova-xl'] },
  ]},
  // International Emerging
  { category: '国际新兴服务商', providers: [
    { id: 'mistral', name: 'Mistral AI', apiBase: 'https://api.mistral.ai/v1', models: ['mistral-large', 'mistral-medium', 'mistral-small'] },
    { id: 'cohere', name: 'Cohere', apiBase: 'https://api.cohere.ai/v1', models: ['command', 'command-light'] },
    { id: 'perplexity', name: 'Perplexity AI', apiBase: 'https://api.perplexity.ai', models: ['pplx-70b-online', 'pplx-7b-chat'] },
  ]},
  // AI Platforms
  { category: 'AI推理平台/聚合服务', providers: [
    { id: 'together', name: 'Together AI', apiBase: 'https://api.together.xyz/v1', models: ['together-llama-2-70b'] },
    { id: 'replicate', name: 'Replicate', apiBase: 'https://api.replicate.com/v1', models: ['replicate/llama-2-70b'] },
    { id: 'huggingface', name: 'Hugging Face', apiBase: 'https://api-inference.huggingface.co/models', models: ['meta-llama/Llama-2-70b'] },
    { id: 'groq', name: 'Groq', apiBase: 'https://api.groq.com/openai/v1', models: ['llama2-70b-4096', 'mixtral-8x7b-32768'] },
    { id: 'openrouter', name: 'OpenRouter', apiBase: 'https://openrouter.ai/api/v1', models: ['openrouter/auto'] },
  ]},
  // Custom option
  { category: '其他', providers: [
    { id: 'custom', name: '自定义配置', apiBase: '', models: [] },
  ]},
];

interface AIConfig {
  id: string;
  name: string;
  type: 'internet' | 'intranet';
  provider: string;
  model_name: string;
  api_base: string;
  api_key?: string;
  config_json?: any;
  is_active: boolean;
  is_global?: boolean;
  created_by?: string;
  user_id?: string;
  created_at: string;
}

export default function AIConfigPage() {
  const { user } = useAuth();
  const toast = useToastContext();
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
  const [testingConfigId, setTestingConfigId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'internet' as 'internet' | 'intranet',
    provider: '',
    model_name: '',
    api_base: '',
    api_key: '',
    temperature: 0.7,
    max_tokens: 2048,
    custom_headers: '',
    is_global: false,
  });

  useEffect(() => {
    loadUserRole();
    loadConfigs();
  }, []);

  const loadUserRole = async () => {
    try {
      const dataService = ServiceFactory.getDataService();
      const { data, error } = await dataService.getSupabaseClient()
        .from('user_profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserRole(data?.role || '');
    } catch (error: any) {
      console.error('Failed to load user role:', error);
    }
  };

  const loadConfigs = async () => {
    try {
      const dataService = ServiceFactory.getDataService();
      // RLS policies will automatically return global configs + user's own configs
      const { data, error } = await dataService.getSupabaseClient()
        .from('ai_configs')
        .select('*')
        .order('is_global', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error: any) {
      toast.error(error.message || '加载AI配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (providerId: string) => {
    const provider = AI_PROVIDERS.flatMap(cat => cat.providers).find(p => p.id === providerId);
    if (provider && provider.id !== 'custom') {
      setFormData(prev => ({
        ...prev,
        provider: providerId,
        api_base: provider.apiBase,
        model_name: provider.models[0] || '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        provider: providerId,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataService = ServiceFactory.getDataService();
      const configJson: any = {
        temperature: formData.temperature,
        max_tokens: formData.max_tokens,
      };

      if (formData.custom_headers) {
        try {
          configJson.custom_headers = JSON.parse(formData.custom_headers);
        } catch {
          toast.error('自定义headers格式错误，请使用JSON格式');
          return;
        }
      }

      const isAdmin = userRole === 'admin' || userRole === 'super_admin';

      const payload: any = {
        name: formData.name,
        type: formData.type,
        provider: formData.provider,
        model_name: formData.model_name,
        api_base: formData.api_base,
        api_key: formData.api_key || null,
        config_json: configJson,
        is_global: isAdmin && formData.is_global,
        created_by: user?.id,
      };

      // Only set user_id for personal configs
      if (!formData.is_global) {
        payload.user_id = user?.id;
      }

      if (editingConfig) {
        const { error } = await dataService.getSupabaseClient()
          .from('ai_configs')
          .update(payload)
          .eq('id', editingConfig.id);

        if (error) throw error;
        toast.success('AI配置更新成功');
      } else {
        const { error } = await dataService.getSupabaseClient()
          .from('ai_configs')
          .insert(payload);

        if (error) throw error;
        toast.success('AI配置添加成功');
      }

      resetForm();
      loadConfigs();
    } catch (error: any) {
      toast.error(error.message || '保存AI配置失败');
    }
  };

  const handleEdit = (config: AIConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      type: config.type,
      provider: config.provider,
      model_name: config.model_name,
      api_base: config.api_base,
      api_key: config.api_key || '',
      temperature: config.config_json?.temperature || 0.7,
      max_tokens: config.config_json?.max_tokens || 2048,
      custom_headers: config.config_json?.custom_headers ? JSON.stringify(config.config_json.custom_headers, null, 2) : '',
      is_global: config.is_global || false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个AI配置吗？')) return;

    try {
      const dataService = ServiceFactory.getDataService();
      const { error } = await dataService.getSupabaseClient()
        .from('ai_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('AI配置删除成功');
      loadConfigs();
    } catch (error: any) {
      toast.error(error.message || '删除AI配置失败');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const dataService = ServiceFactory.getDataService();

      // If activating, deactivate all others first
      if (!currentActive) {
        await dataService.getSupabaseClient()
          .from('ai_configs')
          .update({ is_active: false })
          .eq('user_id', user?.id);
      }

      const { error } = await dataService.getSupabaseClient()
        .from('ai_configs')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;
      toast.success(`AI配置已${!currentActive ? '激活' : '停用'}`);
      loadConfigs();
    } catch (error: any) {
      toast.error(error.message || '更新配置状态失败');
    }
  };

  const handleTest = async (id: string) => {
    console.log('Testing AI config:', id);
    setTestingConfigId(id);
    toast.success('开始测试连接...');

    try {
      console.log('Calling AIService.testConnection...');
      const result = await AIService.testConnection(id);
      console.log('Test result:', result);

      if (result.success) {
        toast.success(result.message || '连接测试成功！');
      } else {
        toast.error(result.message || '连接测试失败');
      }
    } catch (error: any) {
      console.error('Test error:', error);
      toast.error(error.message || '测试过程出错');
    } finally {
      setTestingConfigId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'internet',
      provider: '',
      model_name: '',
      api_base: '',
      api_key: '',
      temperature: 0.7,
      max_tokens: 2048,
      custom_headers: '',
      is_global: false,
    });
    setEditingConfig(null);
    setShowForm(false);
  };

  const selectedProvider = AI_PROVIDERS.flatMap(cat => cat.providers).find(p => p.id === formData.provider);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-8 h-8" />
            AI配置管理
          </h1>
          <p className="text-gray-600 mt-2">配置和管理您的AI模型接入</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? '取消' : '添加AI配置'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingConfig ? '编辑AI配置' : '新建AI配置'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  配置名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：我的GPT-4配置"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  配置类型
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="internet"
                      checked={formData.type === 'internet'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'internet' })}
                      className="mr-2"
                    />
                    <Globe className="w-4 h-4 mr-1" />
                    联网AI
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="intranet"
                      checked={formData.type === 'intranet'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'intranet' })}
                      className="mr-2"
                    />
                    <Server className="w-4 h-4 mr-1" />
                    内网AI
                  </label>
                </div>
              </div>
            </div>

            {(userRole === 'admin' || userRole === 'super_admin') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_global}
                    onChange={(e) => setFormData({ ...formData, is_global: e.target.checked })}
                    className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">设为全局配置</span>
                    <p className="text-sm text-gray-600 mt-1">
                      启用后，此配置将对所有用户可见和可用
                    </p>
                  </div>
                </label>
              </div>
            )}

            {formData.type === 'internet' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择AI提供商
                </label>
                <select
                  value={formData.provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">请选择...</option>
                  {AI_PROVIDERS.map((category) => (
                    <optgroup key={category.category} label={category.category}>
                      {category.providers.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}

            {formData.type === 'intranet' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  提供商标识
                </label>
                <input
                  type="text"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：local-qwen"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  模型名称
                </label>
                {selectedProvider && selectedProvider.models.length > 0 ? (
                  <select
                    value={formData.model_name}
                    onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">请选择模型...</option>
                    {selectedProvider.models.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                    <option value="custom">其他（自定义）</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.model_name}
                    onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如：Qwen2.5-72B"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Base URL
                </label>
                <input
                  type="text"
                  value={formData.api_base}
                  onChange={(e) => setFormData({ ...formData, api_base: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://api.example.com/v1 或 http://10.125.144.84:30548/v1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key {formData.type === 'intranet' && <span className="text-gray-500">(可选)</span>}
              </label>
              <input
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="sk-xxxxxxxxxxxxx"
                required={formData.type === 'internet'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature (0-2)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={formData.max_tokens}
                  onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                自定义Headers (JSON格式，可选)
              </label>
              <textarea
                value={formData.custom_headers}
                onChange={(e) => setFormData({ ...formData, custom_headers: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={3}
                placeholder='{"Authorization": "Bearer xxx", "Custom-Header": "value"}'
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingConfig ? '更新配置' : '创建配置'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {configs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Settings className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">还没有AI配置</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              创建第一个AI配置
            </button>
          </div>
        ) : (
          configs.map((config) => (
            <div
              key={config.id}
              className={`bg-white rounded-lg shadow-md p-6 ${
                config.is_active ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {config.type === 'internet' ? (
                      <Globe className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Server className="w-5 h-5 text-orange-600" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {config.name}
                    </h3>
                    {config.is_global && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        全局配置
                      </span>
                    )}
                    {config.is_active && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        已激活
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">提供商：</span>
                      <span className="text-gray-900 ml-2">{config.provider}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">模型：</span>
                      <span className="text-gray-900 ml-2">{config.model_name}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">API地址：</span>
                      <span className="text-gray-900 ml-2 font-mono text-xs">{config.api_base}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTest(config.id)}
                    disabled={testingConfigId === config.id}
                    className={`p-2 rounded-lg transition-colors ${
                      testingConfigId === config.id
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    }`}
                    title="测试连接"
                  >
                    <Zap className={`w-5 h-5 ${testingConfigId === config.id ? 'animate-pulse' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleToggleActive(config.id, config.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      config.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={config.is_active ? '停用' : '激活'}
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  {(!config.is_global || userRole === 'admin' || userRole === 'super_admin') && (
                    <>
                      <button
                        onClick={() => handleEdit(config)}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
