// bor_app_frontend/src/types/chat.ts
// 中文注释：定义聊天相关的TypeScript接口

/**
 * 聊天消息发送者类型
 * user: 代表当前用户
 * assistant: 代表AI助手或机器人
 * system: 代表系统消息或错误提示
 */
export type ChatMessageSender = 'user' | 'assistant' | 'system';

/**
 * 单条聊天消息的结构
 */
export interface ChatMessage {
  id: string; // 消息的唯一ID，可以用uuid生成
  sender: ChatMessageSender; // 发送者
  content: string; // 消息内容 (支持Markdown)
  timestamp: number; // 消息发送的时间戳
  isLoading?: boolean; // 是否正在加载 (例如，等待AI回复时)
  error?: string; // 如果消息发送失败或AI处理出错，则包含错误信息
  // 根据需要可以添加更多字段，例如：
  // retrieved_sources?: Array<{ // RAG检索到的来源
  //   title: string;
  //   text: string;
  //   source_url?: string;
  //   document_id?: string;
  //   distance?: number;
  // }>;
  // model?: string; // 使用的模型名称
}

/**
 * 聊天API的通用选项
 */
export interface ChatOptions {
  model?: string; // 指定使用的模型
  temperature?: number; // 温度参数
  knowledge_id?: string | null; // RAG: 选中的知识库集合ID
  // 其他可能的参数...
}

/**
 * 后端 /api/v1/chats 接口发送消息时的请求体结构
 * (需要根据后端实际API调整)
 */
export interface ChatCompletionRequestBody {
  model?: string;
  messages: Array<{ role: ChatMessageSender; content: string }>; // 通常后端API需要这种格式
  stream?: boolean; // 是否使用流式响应
  knowledge_id?: string; // RAG: 选中的知识库集合ID
  // 其他参数如 temperature, max_tokens 等
}

/**
 * 后端 /api/v1/chats 接口返回的非流式响应中的消息结构 (简化版)
 * (需要根据后端实际API调整)
 */
export interface ChatCompletionResponseMessage {
  role: ChatMessageSender; // Should be 'assistant'
  content: string;
  // model?: string;
  // usage?: any;
}

/**
 * 后端 /api/v1/chats/stream 接口返回的流式响应中单个数据块的结构 (简化版)
 * (需要根据后端实际API调整，通常是Server-Sent Events (SSE))
 */
export interface ChatStreamChunk {
  // 通用化一些，具体解析在API服务中处理
  // For Ollama-like streams:
  model?: string;
  created_at?: string;
  message?: {
    role?: ChatMessageSender; // Should be 'assistant'
    content?: string;
  };
  done?: boolean; // Ollama uses this to signify end of current completion part or whole stream.

  // For OpenAI-like streams:
  id?: string;
  object?: string;
  created?: number;
  choices?: Array<{
    delta?: {
      content?: string;
      role?: ChatMessageSender; // Should be 'assistant'
    };
    finish_reason?: string | null;
    index?: number;
  }>;

  // General error field
  error?: string;
}
