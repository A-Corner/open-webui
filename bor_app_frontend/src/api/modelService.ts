// bor_app_frontend/src/api/modelService.ts
import { appAxiosInstance } from './axiosInstance';
import type { ChatModelResponse } from '../types/models';

// 中文注释：提供与聊天模型API交互的服务函数

/**
 * 获取当前用户在聊天中可选用的模型列表
 */
export const getSelectableChatModels = async (): Promise<ChatModelResponse[]> => {
  try {
    // 假设API路径为 /api/v1/models/selectable-chat
    const response = await appAxiosInstance.get<ChatModelResponse[]>('/models/selectable-chat');
    // It's good practice to ensure the response is an array, even if backend should guarantee it.
    if (!Array.isArray(response.data)) {
        console.error('获取可选聊天模型列表错误: 响应数据不是数组格式', response.data);
        // Return empty array or throw specific error based on how you want to handle this
        return [];
    }
    return response.data.map(model => ({
      ...model,
      name: model.name || `模型 ${model.id}`, // Provide a default name if missing
    }));
  } catch (error: any) {
    console.error('获取可选聊天模型列表错误:', error.original || error);
    const message = error.friendlyMessage || error.response?.data?.detail || '获取可选聊天模型失败';
    throw new Error(message);
  }
};
