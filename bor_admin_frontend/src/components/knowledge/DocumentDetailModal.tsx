import React from 'react';
import { Modal, Descriptions, Tag, Button, message, Tooltip } from 'antd';
import type { DocumentResponse } from '../../api/adminKnowledgeService'; // Adjust path
import { useKnowledgeStore } from '../../store/knowledgeStore'; // For re-embed action
import { RetweetOutlined } from '@ant-design/icons';

interface DocumentDetailModalProps {
  document: DocumentResponse | null;
  visible: boolean;
  onCancel: () => void;
  // onReEmbed?: (documentId: string) => Promise<void>; // Optional, if re-embed action is here
}

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  visible,
  onCancel,
  // onReEmbed
}) => {
  const { reEmbedDocument, isLoadingDocuments } = useKnowledgeStore(state => ({ // Assuming a general loading flag for now
    reEmbedDocument: state.reEmbedDocument,
    isLoadingDocuments: state.isLoadingDocuments, // Or a specific isReEmbedding flag
  }));

  if (!document) return null;

  const handleReEmbed = async () => {
    if (document) {
      const success = await reEmbedDocument(document.id);
      if (success) {
        message.success(`Re-embedding process started for ${document.name}. Status will update.`);
        // Modal might close or refresh its content after a delay or based on status update
        onCancel(); // Close modal after initiating re-embed
      } else {
        message.error(`Failed to start re-embedding for ${document.name}.`);
      }
    }
  };

  const getStatusTagColor = (status: string) => {
    if (status === 'completed') return 'success';
    if (status === 'processing' || status === 'pending') return 'processing';
    if (status === 'failed') return 'error';
    return 'default';
  };

  return (
    <Modal
      title={`Document Details: ${document.name}`}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="re-embed" icon={<RetweetOutlined />} onClick={handleReEmbed} loading={isLoadingDocuments} disabled={document.status === 'processing'}>
          Re-Embed
        </Button>,
        <Button key="close" onClick={onCancel}>
          Close
        </Button>,
      ]}
      width={600}
    >
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="ID">{document.id}</Descriptions.Item>
        <Descriptions.Item label="Filename">{document.filename}</Descriptions.Item>
        <Descriptions.Item label="Content Type">{document.content_type}</Descriptions.Item>
        <Descriptions.Item label="Size (KB)">{(document.size / 1024).toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={getStatusTagColor(document.status)}>{document.status.toUpperCase()}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Uploaded At">{new Date(document.uploaded_at).toLocaleString()}</Descriptions.Item>

        {document.collections && document.collections.length > 0 && (
          <Descriptions.Item label="Part of Collections">
            {document.collections.map(col => <Tag key={col.id}>{col.name}</Tag>)}
          </Descriptions.Item>
        )}

        {document.status === 'failed' && document.error_message && (
          <Descriptions.Item label="Error Message">
            <pre style={{ whiteSpace: 'pre-wrap', background: '#fff0f0', padding: '8px', borderRadius: '4px' }}>
              {document.error_message}
            </pre>
          </Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  );
};

export default DocumentDetailModal;
