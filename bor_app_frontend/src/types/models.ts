// bor_app_frontend/src/types/models.ts
// 中文注释：定义聊天模型相关的TypeScript接口

export interface ChatModelResponse {
  id: string; // 模型唯一ID，如 "ollama/llama3:latest", "openai/gpt-4"
  name: string; // 用户友好的显示名称
  provider: 'ollama' | 'openai_compatible' | string; // 提供者，可以是已知类型或自定义字符串
  description?: string; // 模型描述
  capabilities?: string[]; // 例如 "vision", "tool_use", "rag"
  // Potentially other fields like context_window, max_tokens, etc.
}
