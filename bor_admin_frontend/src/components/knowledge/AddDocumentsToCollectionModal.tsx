import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Table, message, Alert, Checkbox } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { DocumentResponse } from '../../api/adminKnowledgeService'; // Adjust path
import { useKnowledgeStore } from '../../store/knowledgeStore'; // Adjust path

interface AddDocumentsToCollectionModalProps {
  collectionId: string;
  excludedDocumentIds: string[]; // IDs of documents already in the target collection
  visible: boolean;
  onCancel: () => void;
  onAddDocuments: (selectedDocumentIds: string[]) => void; // Callback with selected IDs
  isLoading?: boolean; // For the add operation itself
}

const AddDocumentsToCollectionModal: React.FC<AddDocumentsToCollectionModalProps> = ({
  collectionId,
  excludedDocumentIds,
  visible,
  onCancel,
  onAddDocuments,
  isLoading: isAdding, // Renaming for clarity
}) => {
  const {
    documents: allDocuments, // All documents from the store (might need specific fetch if too many)
    totalDocuments,
    isLoadingDocuments,
    errorDocuments,
    fetchDocuments,
  } = useKnowledgeStore();

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [docTableParams, setDocTableParams] = useState<TablePaginationConfig>({ current: 1, pageSize: 5, total: 0 });

  // Filter out already included documents and documents not in 'completed' status
  const availableDocuments = allDocuments.filter(
    doc => !excludedDocumentIds.includes(doc.id) && doc.status === 'completed'
  );

  const loadAllDocuments = useCallback(() => {
    // Fetch all 'completed' documents for selection.
    // This could be refined with search/filters within this modal too if needed.
    fetchDocuments({
        page: docTableParams.current,
        per_page: docTableParams.pageSize,
        status: 'completed' // Only allow adding completed documents
    });
  }, [fetchDocuments, docTableParams.current, docTableParams.pageSize]);

  useEffect(() => {
    if (visible) {
      loadAllDocuments();
      setSelectedRowKeys([]); // Reset selection when modal opens
    }
  }, [visible, loadAllDocuments]);

  useEffect(() => {
    // This is tricky because totalDocuments in store is for the main documents page's last query.
    // We need total for "all completed documents" for this modal's pagination.
    // For now, let's assume fetchDocuments updates totalDocuments store appropriately for this context.
    // Ideally, this modal might have its own paginated fetch if the main store's documents list is not suitable.
    // Or, the API for "get documents eligible for adding to collection X" could be useful.
    setDocTableParams(prev => ({ ...prev, total: totalDocuments }));
  }, [totalDocuments]);


  const handleDocTableChange = (pagination: TablePaginationConfig) => {
    setDocTableParams(pagination);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
  };

  const handleOk = () => {
    onAddDocuments(selectedRowKeys as string[]);
  };

  const documentColumns: ColumnsType<DocumentResponse> = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a,b) => a.name.localeCompare(b.name) },
    { title: 'Filename', dataIndex: 'filename', key: 'filename' },
    { title: 'Size (KB)', dataIndex: 'size', key: 'size', render: (size) => size ? (size / 1024).toFixed(2) : '-' },
    { title: 'Uploaded At', dataIndex: 'uploaded_at', key: 'uploaded_at', render: (text) => new Date(text).toLocaleString() },
  ];

  return (
    <Modal
      title="Add Documents to Collection"
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Add Selected Documents"
      confirmLoading={isAdding}
      width={700}
      destroyOnClose
      maskClosable={!isAdding}
      closable={!isAdding}
    >
      {errorDocuments && <Alert message="Error fetching documents" description={errorDocuments} type="error" showIcon closable style={{marginBottom: 16}}/>}
      <Table
        rowSelection={rowSelection}
        columns={documentColumns}
        dataSource={availableDocuments} // Display filtered list
        rowKey="id"
        loading={isLoadingDocuments}
        pagination={docTableParams}
        onChange={handleDocTableChange}
        scroll={{ y: 300 }}
        size="small"
        summary={() => availableDocuments.length === 0 && !isLoadingDocuments ? "No more documents available to add or all are processed." : null}
      />
    </Modal>
  );
};

export default AddDocumentsToCollectionModal;
