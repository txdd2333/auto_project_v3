import ServiceFactory from '../ServiceFactory';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequestOptions {
  messages: AIMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIConfig {
  id: string;
  name: string;
  type: 'internet' | 'intranet';
  provider: string;
  model_name: string;
  api_base: string;
  api_key?: string;
  config_json?: any;
  is_active: boolean;
}

export class AIService {
  private static instance: AIService;

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async getActiveConfig(): Promise<AIConfig | null> {
    try {
      const dataService = ServiceFactory.getDataService();
      const user = await dataService.getSupabaseClient().auth.getUser();

      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      // First, try to find user's own active config
      const { data: userConfig, error: userError } = await dataService.getSupabaseClient()
        .from('ai_configs')
        .select('*')
        .eq('user_id', user.data.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (userError) throw userError;
      if (userConfig) return userConfig;

      // If no user config, try to find a global active config
      const { data: globalConfig, error: globalError } = await dataService.getSupabaseClient()
        .from('ai_configs')
        .select('*')
        .eq('is_global', true)
        .eq('is_active', true)
        .maybeSingle();

      if (globalError) throw globalError;
      return globalConfig;
    } catch (error) {
      console.error('Failed to get active AI config:', error);
      return null;
    }
  }

  async getAllConfigs(): Promise<AIConfig[]> {
    try {
      const dataService = ServiceFactory.getDataService();
      const user = await dataService.getSupabaseClient().auth.getUser();

      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      // Get both global configs and user's own configs
      // RLS policies will automatically filter the results
      const { data, error } = await dataService.getSupabaseClient()
        .from('ai_configs')
        .select('*')
        .order('is_global', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get AI configs:', error);
      return [];
    }
  }

  async chat(options: AIRequestOptions, configId?: string): Promise<AIResponse> {
    let config: AIConfig | null;

    if (configId) {
      config = await this.getConfigById(configId);
    } else {
      config = await this.getActiveConfig();
    }

    if (!config) {
      throw new Error('No AI configuration found. Please configure an AI model first.');
    }

    return this.makeAPICall(config, options);
  }

  private async getConfigById(configId: string): Promise<AIConfig | null> {
    try {
      const dataService = ServiceFactory.getDataService();
      const { data, error } = await dataService.getSupabaseClient()
        .from('ai_configs')
        .select('*')
        .eq('id', configId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get AI config by ID:', error);
      return null;
    }
  }

  private async makeAPICall(config: AIConfig, options: AIRequestOptions): Promise<AIResponse> {
    const {
      messages,
      temperature = config.config_json?.temperature || 0.7,
      max_tokens = config.config_json?.max_tokens || 2048,
      stream = false,
    } = options;

    const endpoint = this.getEndpoint(config);
    const headers = this.buildHeaders(config);
    const body = this.buildRequestBody(config, messages, temperature, max_tokens, stream);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return this.parseResponse(config, data);
    } catch (error: any) {
      console.error('AI API call failed:', error);
      throw new Error(`Failed to call AI API: ${error.message}`);
    }
  }

  private getEndpoint(config: AIConfig): string {
    let baseUrl = config.api_base.replace(/\/$/, '');

    if (config.provider === 'anthropic') {
      return `${baseUrl}/messages`;
    }

    if (baseUrl.includes('/chat/completions')) {
      return baseUrl;
    }

    return `${baseUrl}/chat/completions`;
  }

  private buildHeaders(config: AIConfig): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (config.api_key) {
      if (config.provider === 'anthropic') {
        headers['x-api-key'] = config.api_key;
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${config.api_key}`;
      }
    }

    if (config.config_json?.custom_headers) {
      Object.assign(headers, config.config_json.custom_headers);
    }

    return headers;
  }

  private buildRequestBody(
    config: AIConfig,
    messages: AIMessage[],
    temperature: number,
    max_tokens: number,
    stream: boolean
  ): any {
    if (config.provider === 'anthropic') {
      const systemMessage = messages.find(m => m.role === 'system');
      const nonSystemMessages = messages.filter(m => m.role !== 'system');

      return {
        model: config.model_name,
        messages: nonSystemMessages,
        ...(systemMessage && { system: systemMessage.content }),
        temperature,
        max_tokens,
        stream,
      };
    }

    return {
      model: config.model_name,
      messages,
      temperature,
      max_tokens,
      stream,
    };
  }

  private parseResponse(config: AIConfig, data: any): AIResponse {
    if (config.provider === 'anthropic') {
      return {
        content: data.content[0]?.text || '',
        model: data.model,
        usage: data.usage ? {
          prompt_tokens: data.usage.input_tokens,
          completion_tokens: data.usage.output_tokens,
          total_tokens: data.usage.input_tokens + data.usage.output_tokens,
        } : undefined,
      };
    }

    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: data.usage,
    };
  }

  async testConnection(configId: string): Promise<{ success: boolean; message: string }> {
    console.log('AIService.testConnection called with configId:', configId);
    try {
      const config = await this.getConfigById(configId);
      console.log('Config retrieved:', config);

      if (!config) {
        console.log('Config not found');
        return { success: false, message: '配置未找到' };
      }

      console.log('Making test API call...');
      const response = await this.makeAPICall(config, {
        messages: [
          { role: 'user', content: 'Hello, please respond with "OK" if you receive this message.' }
        ],
        temperature: 0.1,
        max_tokens: 50,
      });

      console.log('Test response:', response);
      return {
        success: true,
        message: `连接成功！模型: ${response.model}`,
      };
    } catch (error: any) {
      console.error('Test connection error:', error);
      return {
        success: false,
        message: `连接失败: ${error.message}`,
      };
    }
  }
}

export default AIService.getInstance();
