// bor_app_frontend/src/api/knowledgeService.ts
import { appAxiosInstance } from './axiosInstance';
import type { SelectableKnowledgeSource } from '../types/knowledge';
// 中文注释：提供与知识库(用户视图)API交互的服务函数

/**
 * 获取当前用户可选的知识库源列表 (例如，知识库集合)
 */
export const getSelectableKnowledgeSources = async (): Promise<SelectableKnowledgeSource[]> => {
  try {
    // 假设API路径为 /api/v1/knowledge/collections/selectable 或 /api/v1/me/knowledge/collections
    // 后端应返回适合当前用户选择的知识源列表
    // For the subtask, we assume GET /api/v1/knowledge/collections/selectable
    const response = await appAxiosInstance.get<any[]>('/knowledge/collections/selectable');
    // 假设返回的是 CollectionResponse[] 类似结构, 包含 id, name, description
    return response.data.map(item => ({
      id: item.id,
      name: item.name || `知识源 ${item.id.substring(0,6)}`, // Default name if backend's is missing
      type: 'collection', // Assuming currently only collections are selectable
      description: item.description,
    }));
  } catch (error: any) {
    console.error('获取可选知识源列表错误:', error);
    throw new Error(error.response?.data?.detail || '获取可选知识源失败');
  }
};
