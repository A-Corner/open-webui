// bor_app_frontend/src/types/session.ts
// 中文注释：定义会话相关的TypeScript接口

import type { ChatMessage } from './chat'; // 确保ChatMessage已定义

export interface Session {
  id: string; // 会话的唯一ID
  title: string; // 会话标题
  createdAt: number; // 创建时间戳 (ms)
  updatedAt: number; // 最后更新时间戳 (ms)
  selectedModelId?: string; // 该会话特定的选用模型ID
  temperature?: number; // 该会话特定的温度设置
  // userId?: string; // 所属用户ID (通常在API层面处理)
}

// 用于从后端API获取的会话列表项的原始结构
export interface RawSessionListItem {
  id: string;
  title?: string; // 后端可能返回由首条消息生成的标题，或允许用户设置
  created_at: string; // ISO 8601 字符串
  updated_at: string; // ISO 8601 字符串
  user_id: string;
  // 其他可能的字段
}

// 用于从后端API获取的单个会话详情（可能包含消息）
export interface RawSessionDetail extends RawSessionListItem {
  messages: ChatMessage[]; // 后端返回的消息结构需要适配 ChatMessage
}
