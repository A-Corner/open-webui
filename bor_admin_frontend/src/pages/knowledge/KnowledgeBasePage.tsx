import React, { useEffect, useState, useCallback } from 'react';
import {
  Tabs, Button, Upload, Table, Tag, Progress, message, Alert, Space, Popconfirm, Input,
  Card, Typography, Select
} from 'antd';
import type { UploadProps } from 'antd';
import { InboxOutlined, PlusOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';

import { useKnowledgeStore } from '../../store/knowledgeStore'; // Adjust path
import type { DocumentResponse, CollectionResponse, FileUploadResponse } from '../../api/adminKnowledgeService'; // Adjust path
import adminKnowledgeService from '../../api/adminKnowledgeService'; // For direct calls if not all in store

const { Dragger } = Upload;
const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;


const KnowledgeBasePage: React.FC = () => {
  const {
    documents, totalDocuments, collections, totalCollections, uploadingFiles,
    isLoadingDocuments, isLoadingCollections, errorDocuments, errorCollections, errorUpload,
    fetchDocuments, fetchCollections, uploadFile, clearUploadingFile, deleteDocumentLocal
  } = useKnowledgeStore();

  // Documents Tab State
  const [docTableParams, setDocTableParams] = useState<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0 });
  const [docSearchQuery, setDocSearchQuery] = useState<string>('');
  const [docStatusFilter, setDocStatusFilter] = useState<string | undefined>(undefined);

  // Collections Tab State (basic for now)
  const [collTableParams, setCollTableParams] = useState<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0 });
  const [collSearchQuery, setCollSearchQuery] = useState<string>('');

  // TODO: Add state for Create/Edit Collection Modal

  const loadDocuments = useCallback(() => {
    fetchDocuments({
      page: docTableParams.current,
      per_page: docTableParams.pageSize,
      query: docSearchQuery || undefined,
      status: docStatusFilter || undefined,
    });
  }, [fetchDocuments, docTableParams, docSearchQuery, docStatusFilter]);

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
    try {
      await adminKnowledgeService.deleteDocument(docId); // Call API directly
      message.success(`Document '${docName}' deleted successfully.`);
      deleteDocumentLocal(docId); // Optimistic UI update from store action
      // Or: await loadDocuments(); // Full refresh
    } catch (error: any) {
      message.error(error.response?.data?.detail || error.message || `Failed to delete document '${docName}'.`);
    }
  };


  const documentColumns: ColumnsType<DocumentResponse> = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a,b) => a.name.localeCompare(b.name) },
    { title: 'Filename', dataIndex: 'filename', key: 'filename' },
    { title: 'Type', dataIndex: 'content_type', key: 'content_type' },
    { title: 'Size (KB)', dataIndex: 'size', key: 'size', render: (size) => size ? (size / 1024).toFixed(2) : '-', sorter: (a,b) => (a.size || 0) - (b.size || 0)},
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'completed') color = 'success';
        else if (status === 'processing' || status === 'pending') color = 'processing';
        else if (status === 'failed') color = 'error';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      }
    },
    { title: 'Uploaded At', dataIndex: 'uploaded_at', key: 'uploaded_at', render: (text) => new Date(text).toLocaleString(), sorter: (a,b) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime() },
    {
      title: 'Action', key: 'action',
      render: (_, record: DocumentResponse) => (
        <Space size="middle">
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
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Documents', dataIndex: 'document_count', key: 'document_count', sorter: (a,b) => (a.document_count || 0) - (b.document_count || 0) },
    { title: 'Created At', dataIndex: 'created_at', key: 'created_at', render: (text) => new Date(text).toLocaleString(), sorter: (a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() },
    // Actions for collections (Edit, Delete, View Documents) to be added later
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
            <Dragger {...draggerProps} style={{padding: 20}}>
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">Support for single or bulk upload. Strictly prohibit from uploading company data or other band files</p>
            </Dragger>
            {renderUploadingFiles()}
          </Card>

          <Card title="Uploaded Documents" style={{marginTop: 20}}>
            <Space style={{marginBottom: 16}}>
                <Input
                    placeholder="Search document name/filename"
                    value={docSearchQuery}
                    onChange={e => setDocSearchQuery(e.target.value)}
                    onPressEnter={loadDocuments}
                    style={{width: 240}}
                    suffix={<SearchOutlined />}
                />
                <Select
                    placeholder="Filter by status"
                    value={docStatusFilter}
                    onChange={value => setDocStatusFilter(value)}
                    onSelect={loadDocuments}
                    style={{width: 150}}
                    allowClear
                >
                    <Option value="pending">Pending</Option>
                    <Option value="processing">Processing</Option>
                    <Option value="completed">Completed</Option>
                    <Option value="failed">Failed</Option>
                </Select>
                <Button onClick={() => {setDocSearchQuery(''); setDocStatusFilter(undefined); loadDocuments();}} icon={<ReloadOutlined />}>Reset</Button>
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
          <Card title="Knowledge Base Collections">
            <Paragraph>
              Manage collections of documents. (Functionality for creating and managing collections will be implemented in a future update.)
            </Paragraph>
            {/* <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} disabled>Create Collection</Button> */}
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
    </Space>
  );
};

export default KnowledgeBasePage;
