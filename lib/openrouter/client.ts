/**
 * OpenRouter Client
 * Integração com API do OpenRouter para usar modelos LLM
 * Modelo padrão: x-ai/grok-4-fast (rápido e eficiente)
 */

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private defaultModel: string;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not found in environment variables');
    }
    this.apiKey = apiKey;
    this.defaultModel = process.env.OPENROUTER_DEFAULT_MODEL || 'x-ai/grok-2-1212';
  }

  /**
   * Completa um prompt e retorna a resposta
   */
  async complete(
    prompt: string,
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      system?: string;
      jsonMode?: boolean;
    } = {}
  ): Promise<string> {
    const messages: OpenRouterMessage[] = [];

    // System message (opcional)
    if (options.system) {
      messages.push({
        role: 'system',
        content: options.system
      });
    }

    // User prompt
    messages.push({
      role: 'user',
      content: prompt
    });

    const request: OpenRouterRequest = {
      model: options.model || this.defaultModel,
      messages,
      temperature: options.temperature ?? 0.3, // Baixa temperatura para mais consistência
      max_tokens: options.max_tokens ?? 2000
    };

    // JSON mode (força resposta em JSON válido)
    if (options.jsonMode) {
      request.response_format = { type: 'json_object' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
          'X-Title': 'Importador de Licitações MG'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
      }

      const data: OpenRouterResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenRouter API');
      }

      const content = data.choices[0].message.content;

      // Log de uso (opcional)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[OpenRouter] Model: ${data.model}`);
        console.log(`[OpenRouter] Tokens: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`);
      }

      return content;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[OpenRouter] Error:', message);
      throw error;
    }
  }

  /**
   * Completa e retorna JSON parseado
   */
  async completeJSON<T = any>(
    prompt: string,
    options: Omit<Parameters<typeof this.complete>[1], 'jsonMode'> = {}
  ): Promise<T> {
    const response = await this.complete(prompt, {
      ...options,
      jsonMode: true
    });

    try {
      return JSON.parse(response) as T;
    } catch (error) {
      console.error('[OpenRouter] Failed to parse JSON response:', response);
      throw new Error('Invalid JSON response from AI');
    }
  }

  /**
   * Testa a conexão com a API
   */
  async test(): Promise<boolean> {
    try {
      const response = await this.complete('Responda apenas "OK"', {
        max_tokens: 10
      });
      return response.trim().toLowerCase().includes('ok');
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
let instance: OpenRouterClient | null = null;

export function getOpenRouterClient(): OpenRouterClient {
  if (!instance) {
    instance = new OpenRouterClient();
  }
  return instance;
}

export default OpenRouterClient;
