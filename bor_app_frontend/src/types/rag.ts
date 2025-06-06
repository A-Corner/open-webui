// bor_app_frontend/src/types/rag.ts
// 中文注释：定义RAG检索结果中单个来源的TypeScript接口

export interface RetrievedSource {
  id?: string; // 文档ID或块ID (如果后端提供)
  document_id?: string; // 所属文档的ID
  collection_id?: string; // 所属集合的ID (如果适用)
  name?: string; // 文档或来源的名称/标题
  content_snippet?: string; // 检索到的文本片段/摘要
  url?: string; // 指向原始文档或来源的URL (如果可用)
  score?: number; // 相似度得分 (如果可用)
  // 根据后端实际返回情况，可以添加其他元数据字段，例如：
  // page_number?: number;
  // source_type?: 'document' | 'web_page' | 'api';
}
