import React, { useEffect, useState, useCallback } from 'react';
import {
  Tabs, Button, Upload, Table, Tag, Progress, message, Alert, Space, Popconfirm, Input,
  Card, Typography, Select, Tooltip
} from 'antd';
import type { UploadProps } from 'antd';
import { InboxOutlined, PlusOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined, EditOutlined, EyeOutlined, FolderAddOutlined, FolderOpenOutlined, RetweetOutlined } from '@ant-design/icons'; // Added more icons
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';

import { useKnowledgeStore } from '../../store/knowledgeStore'; // Adjust path
import type {
    DocumentResponse, CollectionResponse, FileUploadResponse,
    CollectionCreatePayload, CollectionUpdatePayload
} from '../../api/adminKnowledgeService'; // Adjust path
import adminKnowledgeService from '../../api/adminKnowledgeService';

// Import Modals
import DocumentDetailModal from '../../components/knowledge/DocumentDetailModal';
import CollectionFormModal from '../../components/knowledge/CollectionFormModal';
import ManageCollectionDocumentsModal from '../../components/knowledge/ManageCollectionDocumentsModal';

const { Dragger } = Upload;
const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;


const KnowledgeBasePage: React.FC = () => {
  const {
    documents, totalDocuments, collections, totalCollections, uploadingFiles,
    isLoadingDocuments, isLoadingCollections, errorDocuments, errorCollections, errorUpload,
    fetchDocuments, fetchCollections, uploadFile, clearUploadingFile,
    deleteDocument, reEmbedDocument,
    createCollection, updateCollection, deleteCollection,
    reEmbedAllDocumentsInCollection, clearCollectionEmbeddings, // Added new store actions
    // currentCollectionDetail, fetchCollectionDetail, addDocumentsToCollection, removeDocumentsFromCollection
  } = useKnowledgeStore();

  // Documents Tab State
  const [docTableParams, setDocTableParams] = useState<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0 });
  const [docSearchQuery, setDocSearchQuery] = useState<string>('');
  const [docStatusFilter, setDocStatusFilter] = useState<string | undefined>(undefined);
  const [docCollectionFilter, setDocCollectionFilter] = useState<string | undefined>(undefined);
  const [selectedDocument, setSelectedDocument] = useState<DocumentResponse | null>(null);
  const [isDocDetailModalVisible, setIsDocDetailModalVisible] = useState<boolean>(false);

  // Collections Tab State
  const [collTableParams, setCollTableParams] = useState<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0 });
  const [collSearchQuery, setCollSearchQuery] = useState<string>('');
  const [isCollFormModalVisible, setIsCollFormModalVisible] = useState<boolean>(false);
  const [editingCollection, setEditingCollection] = useState<CollectionResponse | null>(null);
  const [isManageDocsModalVisible, setIsManageDocsModalVisible] = useState<boolean>(false);
  const [currentManagingCollection, setCurrentManagingCollection] = useState<CollectionResponse | null>(null);


  const loadDocuments = useCallback(() => {
    fetchDocuments({
      page: docTableParams.current,
      per_page: docTableParams.pageSize,
      query: docSearchQuery || undefined,
      status: docStatusFilter || undefined,
      collection_id: docCollectionFilter || undefined,
    });
  }, [fetchDocuments, docTableParams, docSearchQuery, docStatusFilter, docCollectionFilter]);

  const loadCollections = useCallback(() => {
    fetchCollections({
      page: collTableParams.current,
      per_page: collTableParams.pageSize,
      query: collSearchQuery || undefined,
    });
  }, [fetchCollections, collTableParams, collSearchQuery]);

  useEffect(() => {
    loadDocuments();
    loadCollections();
  }, [loadDocuments, loadCollections]);

  useEffect(() => {
    setDocTableParams(prev => ({ ...prev, total: totalDocuments }));
  }, [totalDocuments]);

  useEffect(() => {
    setCollTableParams(prev => ({ ...prev, total: totalCollections }));
  }, [totalCollections]);


  const handleDocTableChange = (pagination: TablePaginationConfig) => {
    setDocTableParams(pagination);
  };
  const handleCollTableChange = (pagination: TablePaginationConfig) => {
    setCollTableParams(pagination);
  };

  const draggerProps: UploadProps = {
    name: 'file',
    multiple: true,
    // listType: 'picture', // or 'text'
    showUploadList: false, // We'll manage display of uploading files manually
    customRequest: async ({ file, onSuccess, onError }) => {
      const aFile = file as File; // Type assertion
      try {
        const response = await uploadFile(aFile /*, selectedCollectionIdIfAny */);
        if (response && onSuccess) {
          onSuccess(response, new XMLHttpRequest()); // Simulate XHR success
          message.success(`${aFile.name} uploaded successfully, processing started.`);
          // Refresh documents after a short delay to allow backend processing to start
          setTimeout(loadDocuments, 2000);
        } else {
          throw new Error(`Failed to upload ${aFile.name}. Reason: ${useKnowledgeStore.getState().errorUpload || 'Unknown'}`);
        }
      } catch (error: any) {
        if (onError) {
          onError(error);
        }
        message.error(error.message || `Failed to upload ${aFile.name}.`);
      }
    },
    onChange(info) {
      const { status } = info.file;
      // Can update uploadingFiles here based on info.file.status if not using customRequest fully
      // For example, if customRequest only calls API and doesn't update store immediately.
      // But current store.uploadFile handles its own state updates.
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  const handleDeleteDocument = async (docId: string, docName: string) => {
    const success = await deleteDocument(docId); // Use store action
    if (success) {
      message.success(`Document '${docName}' deleted successfully.`);
      // Store action handles optimistic update or refetch can be added if needed
    } else {
      message.error(useKnowledgeStore.getState().errorDocuments || `Failed to delete document '${docName}'.`);
    }
  };

  const handleReEmbedDocument = async (docId: string, docName: string) => {
    const success = await reEmbedDocument(docId);
    if (success) {
      message.success(`Re-embedding started for document '${docName}'.`);
      // Store action might optimistically update status or trigger a refresh
    } else {
      message.error(useKnowledgeStore.getState().errorDocuments || `Failed to re-embed document '${docName}'.`);
    }
  };

  const handleCollectionFormSubmit = async (values: CollectionCreatePayload | CollectionUpdatePayload) => {
    let success = false;
    if (editingCollection) {
      const result = await updateCollection(editingCollection.id, values as CollectionUpdatePayload);
      if (result) {
        message.success('Collection updated successfully.');
        success = true;
      }
    } else {
      const result = await createCollection(values as CollectionCreatePayload);
      if (result) {
        message.success('Collection created successfully.');
        success = true;
      }
    }
    if (success) {
      setIsCollFormModalVisible(false);
      loadCollections(); // Refresh collections list
    } else {
      message.error(useKnowledgeStore.getState().errorUpdatingCollection || 'Failed to save collection.');
    }
  };

  const handleDeleteCollection = async (collId: string, collName: string) => {
    // TODO: Add checkbox for deleting documents within collection
    const success = await deleteCollection(collId, false); // false means don't delete documents by default
    if (success) {
      message.success(`Collection '${collName}' deleted successfully.`);
    } else {
      message.error(useKnowledgeStore.getState().errorUpdatingCollection || `Failed to delete collection '${collName}'.`);
    }
  };

  const documentColumns: ColumnsType<DocumentResponse> = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a,b) => a.name.localeCompare(b.name),
      render: (name, record) => <a onClick={() => { setSelectedDocument(record); setIsDocDetailModalVisible(true);}}>{name}</a>
    },
    { title: 'Filename', dataIndex: 'filename', key: 'filename', ellipsis: true },
    { title: 'Type', dataIndex: 'content_type', key: 'content_type', width: 150 },
    { title: 'Size (KB)', dataIndex: 'size', key: 'size', render: (size) => size ? (size / 1024).toFixed(2) : '-', sorter: (a,b) => (a.size || 0) - (b.size || 0), width: 120},
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 120,
      render: (status: string, record) => {
        let color = 'default';
        if (status === 'completed') color = 'success';
        else if (status === 'processing' || status === 'pending') color = 'processing';
        else if (status === 'failed') color = 'error';
        return <Tag color={color} style={{cursor: record.error_message ? 'pointer' : 'default'}} onClick={() => { if(record.error_message) {setSelectedDocument(record); setIsDocDetailModalVisible(true);}}}>{status.toUpperCase()}</Tag>;
      }
    },
    { title: 'Collections', dataIndex: 'collections', key: 'collections', render: (collections?: CollectionInfoShort[]) => collections?.map(c => <Tag key={c.id}>{c.name}</Tag>) || '-', width: 200, ellipsis: true},
    { title: 'Uploaded At', dataIndex: 'uploaded_at', key: 'uploaded_at', render: (text) => new Date(text).toLocaleString(), sorter: (a,b) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime(), width: 180 },
    {
      title: 'Action', key: 'action', fixed: 'right', width: 150,
      render: (_, record: DocumentResponse) => (
        <Space size="small">
          <Tooltip title="View Details/Re-embed">
            <Button icon={<EyeOutlined />} size="small" onClick={() => { setSelectedDocument(record); setIsDocDetailModalVisible(true);}} />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this document?"
            onConfirm={() => handleDeleteDocument(record.id, record.name)}
            okText="Yes" cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger size="small">Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const collectionColumns: ColumnsType<CollectionResponse> = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a,b) => a.name.localeCompare(b.name) },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Docs', dataIndex: 'document_count', key: 'document_count', sorter: (a,b) => (a.document_count || 0) - (b.document_count || 0), width: 80 },
    { title: 'Created At', dataIndex: 'created_at', key: 'created_at', render: (text) => new Date(text).toLocaleString(), sorter: (a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(), width: 180 },
    { title: 'Updated At', dataIndex: 'updated_at', key: 'updated_at', render: (text) => new Date(text).toLocaleString(), sorter: (a,b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(), width: 180 },
    {
      title: 'Action', key: 'action', fixed: 'right', width: 180,
      render: (_, record: CollectionResponse) => (
        <Space size="small">
          <Tooltip title="Manage Documents in Collection">
            <Button icon={<FolderOpenOutlined />} size="small" onClick={() => { setCurrentManagingCollection(record); setIsManageDocsModalVisible(true); }} />
          </Tooltip>
          <Tooltip title="Edit Collection">
            <Button icon={<EditOutlined />} size="small" onClick={() => { setEditingCollection(record); setIsCollFormModalVisible(true);}} />
          </Tooltip>
          <Popconfirm
            title="Delete this collection? Documents will not be deleted by default."
            description="This action only removes the collection, not the documents within it."
            onConfirm={() => handleDeleteCollection(record.id, record.name, false)} // Assuming deleteDocs = false by default
            okText="Yes, Delete Collection Only"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger size="small" title="Delete Collection (keeps documents)" />
          </Popconfirm>
          <Tooltip title="Re-embed all documents in this collection">
            <Popconfirm
              title={`Re-embed all documents in "${record.name}"? This may take a while.`}
              onConfirm={() => handleReEmbedAllInCollection(record.id, record.name)}
              okText="Yes, Re-embed All"
              cancelText="No"
              // disabled={isLoadingCollectionDetail || useKnowledgeStore.getState().isUpdatingCollection}
            >
              <Button icon={<RetweetOutlined />} size="small" /*loading={useKnowledgeStore.getState().isUpdatingCollection}*/ />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="Clear all vector embeddings for documents in this collection">
            <Popconfirm
              title={`Clear all vector embeddings for "${record.name}"? Documents will remain but will need re-embedding for RAG.`}
              onConfirm={() => handleClearCollectionEmbeddings(record.id, record.name)}
              okText="Yes, Clear Embeddings"
              cancelText="No"
              // disabled={isLoadingCollectionDetail || useKnowledgeStore.getState().isUpdatingCollection}
            >
              <Button icon={<DeleteOutlined style={{color: 'orange' }}/>} size="small" /*loading={useKnowledgeStore.getState().isUpdatingCollection}*/ />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    }
  ];

  const renderUploadingFiles = () => {
    const files = Object.entries(uploadingFiles);
    if (files.length === 0) return null;
    return (
      <Card title="Current Uploads" size="small" style={{ marginTop: 16 }}>
        <List
          itemLayout="horizontal"
          dataSource={files}
          renderItem={([key, fileState]) => (
            <List.Item
              actions={[<Button type="text" danger size="small" onClick={() => clearUploadingFile(key.split('-')[0])}>Clear</Button>]}
            >
              <List.Item.Meta
                title={key.substring(0, key.lastIndexOf('-'))}
                description={fileState.error ? <Text type="danger">{fileState.error}</Text> : `Status: ${fileState.status}`}
              />
              {fileState.status === 'uploading' && <Progress percent={fileState.progress || 0} size="small" />}
              {fileState.status === 'success' && <Tag color="success">Processed</Tag>}
            </List.Item>
          )}
        />
      </Card>
    );
  };


  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={3}>Knowledge Base Management</Title>

      {errorUpload && <Alert message="Upload Error" description={errorUpload} type="error" showIcon closable />}

      <Tabs defaultActiveKey="documents">
        <TabPane tab="Documents" key="documents">
          <Card title="Upload New Documents">
            <Dragger {...draggerProps} style={{padding: 20, marginBottom: 16}}>
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">Upload documents to be processed and added to your knowledge base.</p>
            </Dragger>
            {renderUploadingFiles()}
          </Card>

          <Card title="Documents" style={{marginTop: 20}} extra={
            <Button onClick={loadDocuments} icon={<ReloadOutlined />} loading={isLoadingDocuments}>Refresh Documents</Button>
          }>
            <Space style={{marginBottom: 16}}>
                <Input
                    placeholder="Search document name/filename"
                    value={docSearchQuery}
                    onChange={e => setDocSearchQuery(e.target.value)}
                    onPressEnter={loadDocuments} // Re-fetch on enter
                    style={{width: 240}}
                    allowClear
                    suffix={<SearchOutlined />}
                />
                <Select
                    placeholder="Filter by status"
                    value={docStatusFilter}
                    onChange={value => {setDocStatusFilter(value); loadDocuments();}} // Re-fetch on change
                    style={{width: 150}}
                    allowClear
                >
                    <Option value="pending">Pending</Option>
                    <Option value="processing">Processing</Option>
                    <Option value="completed">Completed</Option>
                    <Option value="failed">Failed</Option>
                </Select>
                <Select
                    placeholder="Filter by collection"
                    value={docCollectionFilter}
                    onChange={value => {setDocCollectionFilter(value); loadDocuments();}}
                    style={{width: 180}}
                    allowClear
                    loading={isLoadingCollections}
                >
                  {collections.map(col => <Option key={col.id} value={col.id}>{col.name}</Option>)}
                </Select>
                <Button onClick={() => {setDocSearchQuery(''); setDocStatusFilter(undefined); setDocCollectionFilter(undefined); loadDocuments();}} icon={<ReloadOutlined />}>Reset Filters</Button>
            </Space>
            {errorDocuments && <Alert message="Error fetching documents" description={errorDocuments} type="error" showIcon closable style={{marginBottom:16}} />}
            <Table
              columns={documentColumns}
              dataSource={documents}
              rowKey="id"
              loading={isLoadingDocuments}
              pagination={docTableParams}
              onChange={handleDocTableChange}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Collections" key="collections">
          <Card title="Knowledge Base Collections" style={{marginTop: 20}} extra={
             <Space>
                <Button onClick={loadCollections} icon={<ReloadOutlined />} loading={isLoadingCollections}>Refresh Collections</Button>
                <Button type="primary" icon={<FolderAddOutlined />} onClick={() => {setEditingCollection(null); setIsCollFormModalVisible(true);}}>
                    Create Collection
                </Button>
             </Space>
          }>
            {errorCollections && <Alert message="Error fetching collections" description={errorCollections} type="error" showIcon closable style={{marginBottom:16}}/>}
            <Table
              columns={collectionColumns}
              dataSource={collections}
              rowKey="id"
              loading={isLoadingCollections}
              pagination={collTableParams}
              onChange={handleCollTableChange}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {isDocDetailModalVisible && selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          visible={isDocDetailModalVisible}
          onCancel={() => setIsDocDetailModalVisible(false)}
        />
      )}

      {isCollFormModalVisible && (
        <CollectionFormModal
          visible={isCollFormModalVisible}
          onCancel={() => setIsCollFormModalVisible(false)}
          onSubmit={handleCollectionFormSubmit}
          initialValues={editingCollection}
          isEditMode={!!editingCollection}
          isLoading={useKnowledgeStore.getState().isUpdatingCollection}
        />
      )}

      {isManageDocsModalVisible && currentManagingCollection && (
        <ManageCollectionDocumentsModal
          collection={currentManagingCollection}
          visible={isManageDocsModalVisible}
          onCancel={() => setIsManageDocsModalVisible(false)}
        />
      )}

    </Space>
  );
};

export default KnowledgeBasePage;
