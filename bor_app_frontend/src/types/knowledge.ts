// bor_app_frontend/src/types/knowledge.ts
// 中文注释：知识库相关的TypeScript接口

export interface SelectableKnowledgeSource {
  id: string; // 集合ID 或 文档ID
  name: string; // 显示名称
  type: 'collection' | 'document'; // 来源类型 (初步主要用collection)
  description?: string;
}
