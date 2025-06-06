// bor_app_frontend/src/api/sessionService.ts
import { appAxiosInstance } from './axiosInstance';
import type { Session, RawSessionListItem, RawSessionDetail } from '../types/session';
import type { ChatMessage, ChatMessageSender } from '../types/chat';

// 中文注释：提供与后端会话API交互的服务函数

const mapRawSessionToSession = (raw: RawSessionListItem): Session => ({
  id: raw.id,
  title: raw.title || `会话 ${raw.id.substring(0, 6)}...`, // 如果没有标题，给一个默认的
  createdAt: new Date(raw.created_at).getTime(),
  updatedAt: new Date(raw.updated_at).getTime(),
});

const mapRawMessageToChatMessage = (rawMsg: any, defaultSender: ChatMessageSender = 'assistant'): ChatMessage => ({
  // 后端消息结构可能与前端ChatMessage不完全一致，需要适配
  // 例如，后端的sender可能是 'ai' 或 'human'
  id: rawMsg.id || String(Date.now() + Math.random()), // 确保有ID
  sender: rawMsg.role === 'user' ? 'user' : (rawMsg.role === 'assistant' ? 'assistant' : defaultSender),
  content: rawMsg.content,
  timestamp: new Date(rawMsg.created_at || rawMsg.timestamp || Date.now()).getTime(), // 适配不同时间戳字段
  isLoading: rawMsg.isLoading || false,
  error: rawMsg.error,
});


export const getSessions = async (): Promise<Session[]> => {
  try {
    const response = await appAxiosInstance.get<RawSessionListItem[]>('/chats');
    return response.data.map(mapRawSessionToSession).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error: any) {
    console.error('获取会话列表错误:', error.original || error);
    const message = error.friendlyMessage || error.response?.data?.detail || '获取会话列表失败';
    throw new Error(message);
  }
};

export const createNewSessionAPI = async (title?: string): Promise<Session> => {
  try {
    const payload: { title?: string } = {};
    if (title) payload.title = title;
    const response = await appAxiosInstance.post<RawSessionListItem>('/chats', payload);
    return mapRawSessionToSession(response.data);
  } catch (error: any) {
    console.error('创建新会话错误:', error.original || error);
    const message = error.friendlyMessage || error.response?.data?.detail || '创建新会话失败';
    throw new Error(message);
  }
};

export const deleteSessionAPI = async (sessionId: string): Promise<void> => {
  try {
    await appAxiosInstance.delete(`/chats/${sessionId}`);
  } catch (error: any) {
    console.error(`删除会话 ${sessionId} 错误:`, error.original || error);
    const message = error.friendlyMessage || error.response?.data?.detail || '删除会话失败';
    throw new Error(message);
  }
};

export const getMessagesAPI = async (sessionId: string): Promise<ChatMessage[]> => {
    try {
        // 假设后端API是 /api/v1/chats/{chat_id}/messages
        // 或者 /api/v1/chats/{chat_id} 直接返回包含消息的会话详情
        const response = await appAxiosInstance.get<RawSessionDetail | { messages: any[] }>(`/chats/${sessionId}`);

        let messagesToMap: any[] = [];
        // Check if response.data exists and has a messages property that is an array
        if (response.data && 'messages' in response.data && Array.isArray(response.data.messages)) {
            messagesToMap = response.data.messages;
        } else if (response.data && (response.data as RawSessionDetail).messages && Array.isArray((response.data as RawSessionDetail).messages)) {
            // This handles the case where response.data is RawSessionDetail and messages are directly on it
             messagesToMap = (response.data as RawSessionDetail).messages;
        } else if (response.data && Array.isArray(response.data)) {
            // Fallback if response.data is directly an array of messages (less common for this specific endpoint)
             messagesToMap = response.data;
        }

        return messagesToMap.map(msg => mapRawMessageToChatMessage(msg))
                          .sort((a,b) => a.timestamp - b.timestamp);
    } catch (error: any) {
        console.error(`获取会话 ${sessionId} 的消息错误:`, error.original || error);
        const message = error.friendlyMessage || error.response?.data?.detail || '获取消息失败';
        throw new Error(message);
    }
};
