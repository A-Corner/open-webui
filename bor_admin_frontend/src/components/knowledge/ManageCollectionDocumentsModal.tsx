import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Table, Space, Popconfirm, message, Tag, Tooltip } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { PlusOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';

import { useKnowledgeStore } from '../../store/knowledgeStore'; // Adjust path
import type { CollectionResponse, DocumentResponse } from '../../api/adminKnowledgeService'; // Adjust path
import AddDocumentsToCollectionModal from './AddDocumentsToCollectionModal'; // Will be created next

interface ManageCollectionDocumentsModalProps {
  collection: CollectionResponse | null;
  visible: boolean;
  onCancel: () => void;
  // No onSubmit directly, actions are internal or via AddDocumentsToCollectionModal
}

const ManageCollectionDocumentsModal: React.FC<ManageCollectionDocumentsModalProps> = ({
  collection,
  visible,
  onCancel,
}) => {
  const {
    currentCollectionDetail,
    isLoadingCollectionDetail,
    errorCollectionDetail,
    fetchCollectionDetail,
    removeDocumentsFromCollection,
    // documents: allDocuments, // For Add modal
    // fetchDocuments: fetchAllDocuments, // For Add modal
  } = useKnowledgeStore();

  const [isAddDocsModalVisible, setIsAddDocsModalVisible] = useState(false);
  const [docTableParams, setDocTableParams] = useState<TablePaginationConfig>({ current: 1, pageSize: 5, total: 0 });

  const documentsInCollection = currentCollectionDetail?.collection.id === collection?.id
    ? currentCollectionDetail.documents.items
    : [];
  const totalDocumentsInCollection = currentCollectionDetail?.collection.id === collection?.id
    ? currentCollectionDetail.documents.total
    : 0;

  const loadCollectionDocuments = useCallback(() => {
    if (collection) {
      fetchCollectionDetail(collection.id, { page: docTableParams.current, per_page: docTableParams.pageSize });
    }
  }, [collection, fetchCollectionDetail, docTableParams.current, docTableParams.pageSize]);

  useEffect(() => {
    if (visible && collection) {
      loadCollectionDocuments();
    }
  }, [visible, collection, loadCollectionDocuments]);

  useEffect(() => {
     if (currentCollectionDetail?.collection.id === collection?.id) {
        setDocTableParams(prev => ({
            ...prev,
            total: currentCollectionDetail.documents.total,
            current: currentCollectionDetail.documents.page,
            pageSize: currentCollectionDetail.documents.per_page,
        }));
     }
  }, [currentCollectionDetail, collection]);


  const handleDocTableChange = (pagination: TablePaginationConfig) => {
    setDocTableParams(pagination); // This will trigger loadCollectionDocuments via useEffect on params change
  };

  const handleRemoveDocument = async (documentId: string) => {
    if (!collection) return;
    const success = await removeDocumentsFromCollection(collection.id, [documentId]);
    if (success) {
      message.success('Document removed from collection successfully.');
      // Store action should refresh currentCollectionDetail or we call loadCollectionDocuments()
    } else {
      message.error(useKnowledgeStore.getState().errorUpdatingCollection || 'Failed to remove document from collection.');
    }
  };

  const handleAddDocuments = async (selectedDocIds: string[]) => {
    if (!collection || selectedDocIds.length === 0) return;
    const success = await useKnowledgeStore.getState().addDocumentsToCollection(collection.id, selectedDocIds);
    if (success) {
        message.success(`${selectedDocIds.length} document(s) added to collection.`);
        setIsAddDocsModalVisible(false);
        // Store action should refresh currentCollectionDetail or we call loadCollectionDocuments()
    } else {
        message.error(useKnowledgeStore.getState().errorUpdatingCollection || 'Failed to add documents to collection.');
    }
  };


  const documentColumns: ColumnsType<DocumentResponse> = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a,b) => a.name.localeCompare(b.name) },
    { title: 'Filename', dataIndex: 'filename', key: 'filename' },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (status: string) => <Tag color={status === 'completed' ? 'success' : 'processing'}>{status.toUpperCase()}</Tag>
    },
    {
      title: 'Action', key: 'action', width: 100, fixed: 'right',
      render: (_, record: DocumentResponse) => (
        <Popconfirm
          title="Are you sure you want to remove this document from the collection?"
          onConfirm={() => handleRemoveDocument(record.id)}
          okText="Yes, Remove"
          cancelText="No"
        >
          <Button icon={<DeleteOutlined />} danger size="small">Remove</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={`Manage Documents in Collection: ${collection?.name || ''}`}
        open={visible}
        onCancel={onCancel}
        footer={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={loadCollectionDocuments} loading={isLoadingCollectionDetail}>
            Refresh
          </Button>,
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setIsAddDocsModalVisible(true)}>
            Add Documents to Collection
          </Button>,
          <Button key="close" onClick={onCancel}>
            Close
          </Button>,
        ]}
        width={900}
        destroyOnClose
      >
        {errorCollectionDetail && <Alert message="Error loading documents in collection" description={errorCollectionDetail} type="error" showIcon closable />}
        <Table
          columns={documentColumns}
          dataSource={documentsInCollection}
          rowKey="id"
          loading={isLoadingCollectionDetail}
          pagination={docTableParams}
          onChange={handleDocTableChange}
          scroll={{ x: 'max-content', y: 300 }}
          size="small"
        />
      </Modal>

      {collection && (
        <AddDocumentsToCollectionModal
            collectionId={collection.id}
            // Pass IDs of docs already in this collection to exclude them from selection
            excludedDocumentIds={documentsInCollection.map(doc => doc.id)}
            visible={isAddDocsModalVisible}
            onCancel={() => setIsAddDocsModalVisible(false)}
            onAddDocuments={handleAddDocuments}
        />
      )}
    </>
  );
};

export default ManageCollectionDocumentsModal;
