import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Popconfirm, Tag, message, Tooltip, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';

import adminExternalRagService, {
  type ExternalRagService,
  type ExternalRagServiceCreatePayload,
  type ExternalRagServiceUpdatePayload,
} from '../../api/adminExternalRagService'; // Adjust path

import ExternalRagFormModal from '../../components/rag/ExternalRagFormModal'; // Will be created next

const { Title } = Typography;

interface TableParams {
  pagination?: TablePaginationConfig;
}

const ExternalRagPage: React.FC = () => {
  const [services, setServices] = useState<ExternalRagService[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<ExternalRagService | null>(null);
  const [tableParams, setTableParams] = useState<TableParams>({ // Not using pagination from API yet
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  });


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminExternalRagService.getExternalRagServices();
      setServices(response);
      setTableParams(prev => ({
        ...prev,
        pagination: {
          ...prev.pagination,
          total: response.length, // Assuming API returns full list for now
        }
      }));
    } catch (error: any) {
      message.error(error.response?.data?.detail || error.message || 'Failed to fetch external RAG services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setTableParams({ pagination });
    // If API supported pagination, fetchData would be called here with new params.
    // Since current API returns all, this just updates local pagination state.
  };

  const showCreateModal = () => {
    setEditingService(null);
    setIsModalVisible(true);
  };

  const showEditModal = (service: ExternalRagService) => {
    setEditingService(service);
    setIsModalVisible(true);
  };

  const handleFormSubmit = async (values: ExternalRagServiceCreatePayload | ExternalRagServiceUpdatePayload) => {
    setLoading(true); // Or a specific form loading state
    try {
      if (editingService) {
        await adminExternalRagService.updateExternalRagService(editingService.id, values as ExternalRagServiceUpdatePayload);
        message.success('External RAG service updated successfully');
      } else {
        await adminExternalRagService.createExternalRagService(values as ExternalRagServiceCreatePayload);
        message.success('External RAG service created successfully');
      }
      setIsModalVisible(false);
      fetchData(); // Refresh list
    } catch (error: any) {
      message.error(error.response?.data?.detail || error.message || 'Failed to save external RAG service');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    setLoading(true);
    try {
      await adminExternalRagService.deleteExternalRagService(serviceId);
      message.success('External RAG service deleted successfully');
      fetchData(); // Refresh list
    } catch (error: any) {
      message.error(error.response?.data?.detail || error.message || 'Failed to delete service');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<ExternalRagService> = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a,b) => a.name.localeCompare(b.name) },
    { title: 'URL', dataIndex: 'url', key: 'url', render: (url: string) => <a href={url} target="_blank" rel="noopener noreferrer">{url}</a> },
    {
      title: 'API Key Set',
      dataIndex: 'has_api_key', // Using the derived/sent field
      key: 'has_api_key',
      render: (hasKey: boolean) => hasKey ? <Tag color="green">Yes</Tag> : <Tag color="orange">No</Tag>
    },
    { title: 'Created At', dataIndex: 'created_at', key: 'created_at', render: (text) => new Date(text).toLocaleString(), sorter: (a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() },
    { title: 'Updated At', dataIndex: 'updated_at', key: 'updated_at', render: (text) => new Date(text).toLocaleString(), sorter: (a,b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime() },
    {
      title: 'Action',
      key: 'action',
      render: (_, record: ExternalRagService) => (
        <Space size="middle">
          <Tooltip title="Edit Service">
            <Button icon={<EditOutlined />} onClick={() => showEditModal(record)} />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this service?"
            onConfirm={() => handleDeleteService(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title={<Title level={3}>External RAG Services</Title>}>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={showCreateModal}
        style={{ marginBottom: 16 }}
      >
        Add External RAG Service
      </Button>
      <Table
        columns={columns}
        dataSource={services}
        rowKey="id"
        loading={loading}
        pagination={tableParams.pagination}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
      />
      {isModalVisible && (
        <ExternalRagFormModal
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onSubmit={handleFormSubmit}
          initialValues={editingService}
          isEditMode={!!editingService}
          // isLoading={formLoadingState} // Potentially a separate loading state for form
        />
      )}
    </Card>
  );
};

export default ExternalRagPage;
