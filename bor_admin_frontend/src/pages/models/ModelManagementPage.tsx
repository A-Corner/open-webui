import React, { useEffect, useState } from 'react';
import {
  Button, Card, Col, Form, Input, List, message, Popconfirm, Row, Select, Space, Spin, Switch, Table, Tag, Tooltip, Typography, Modal
} from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined, DownloadOutlined, SettingOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useForm, Controller } from 'react-hook-form';

import { useModelManagementStore } from '../../store/modelManagementStore'; // Adjust path
import type {
  ModelResponse, ModelPullPayload, ModelSettings, ModelSettingsUpdatePayload,
  RemoteModelServiceConfig, RemoteModelServiceCreatePayload, RemoteModelServiceUpdatePayload
} from '../../api/adminModelService'; // Adjust path
import RemoteServiceFormModal from '../../components/models/RemoteServiceFormModal'; // Import the new modal

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const ModelManagementPage: React.FC = () => {
  const {
    models, settings, isLoadingModels, isLoadingSettings, isPullingModel, isDeletingModel,
    errorModels, errorSettings, errorPulling, errorDeleting,
    remoteModelServices, isLoadingRemoteServices, errorRemoteServices,
    fetchModels, pullModel, deleteModel, fetchSettings, saveSettings,
    fetchRemoteModelServices, addRemoteModelService, updateRemoteModelService, deleteRemoteModelService
  } = useModelManagementStore();

  const [ollamaModelToPull, setOllamaModelToPull] = useState<string>('');

  // For Model Settings Form
  const { control: settingsControl, handleSubmit: handleSettingsSubmit, reset: resetSettingsForm, formState: { isDirty: isSettingsDirty } } = useForm<ModelSettingsUpdatePayload>();

  // For Remote Service Modal
  const [isRemoteServiceModalVisible, setIsRemoteServiceModalVisible] = useState<boolean>(false);
  const [editingRemoteService, setEditingRemoteService] = useState<RemoteModelServiceConfig | null>(null);


  useEffect(() => {
    fetchModels();
    fetchSettings();
    fetchRemoteModelServices();
  }, [fetchModels, fetchSettings, fetchRemoteModelServices]);

  useEffect(() => {
    if (settings) {
      resetSettingsForm(settings);
    }
  }, [settings, resetSettingsForm]);

  const handlePullModel = async () => {
    if (!ollamaModelToPull.trim()) {
      message.error('Please enter a model name to pull.');
      return;
    }
    const payload: ModelPullPayload = { model_name: ollamaModelToPull.trim() };
    const response = await pullModel(payload);
    if (response.status === "pulling_started" || response.status === "already_exists") {
      message.success(response.message || `Model pull for '${payload.model_name}' started or model already exists.`);
      setOllamaModelToPull('');
      // fetchModels('ollama') is called by the store action on success already
    } else { // error status
      message.error(response.message || `Failed to pull model '${payload.model_name}'.`);
    }
  };

  const handleDeleteOllamaModel = async (model: ModelResponse) => {
    // Ollama model IDs are often like "namespace/model:tag" or "model:tag".
    // The delete API expects the name part after "/ollama/" prefix.
    // E.g. if model.id is "ollama/llama3:latest", then modelName for API is "llama3:latest".
    // If model.id is just "llama3:latest" (source=ollama), that's the name.
    let modelNameForApi = model.id;
    if (model.id.startsWith(`${model.source}/`)) {
      modelNameForApi = model.id.substring(model.source.length + 1);
    }

    const success = await deleteModel(model.id, modelNameForApi);
    if (success) {
      message.success(`Model '${model.name}' deleted successfully.`);
      // fetchModels('ollama'); // Store action already optimistically updates
    } else {
      message.error(errorDeleting || `Failed to delete model '${model.name}'.`);
    }
  };

  const onSaveSettings = async (data: ModelSettingsUpdatePayload) => {
    const success = await saveSettings(data);
    if (success) {
      message.success('Model settings updated successfully!');
      fetchSettings(); // Re-fetch to confirm
    } else {
      message.error(errorSettings || 'Failed to update model settings.');
    }
  };

  const ollamaModels = models.filter(m => m.source === 'ollama' && m.is_local);
  // Remote models are now managed as "RemoteModelServiceConfig" and displayed separately
  // The `models` list might still contain non-local OpenAI models if backend's GET /models includes them based on old v1 configs.
  // For v2, GET /models should ideally list discoverable models (Ollama local) and explicitly configured remote *models* if any.
  // For this section, we will list configured Remote Services separately.

  const ollamaColumns: ColumnsType<ModelResponse> = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (name, record) => <Text strong>{record.details?.family ? `${record.details.family} (${name})` : name}</Text> },
    { title: 'ID', dataIndex: 'id', key: 'id', render: (id) => <Tag>{id}</Tag>, width: '30%' },
    { title: 'Size', dataIndex: 'size', key: 'size', render: (size) => size ? (size / 1024 / 1024 / 1024).toFixed(2) + ' GB' : '-', sorter: (a,b) => (a.size || 0) - (b.size || 0) },
    { title: 'Quantization', dataIndex: ['details', 'quantization_level'], key: 'quantization', sorter: (a,b) => a.details?.quantization_level?.localeCompare(b.details?.quantization_level) },
    { title: 'Params', dataIndex: ['details', 'parameter_size'], key: 'params', sorter: (a,b) => a.details?.parameter_size?.localeCompare(b.details?.parameter_size) },
    { title: 'Modified At', dataIndex: 'modified_at', key: 'modified_at', render: (ts) => ts ? new Date(ts).toLocaleString() : '-', sorter: (a,b) => new Date(a.modified_at || 0).getTime() - new Date(b.modified_at || 0).getTime()},
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record: ModelResponse) => (
        <Popconfirm
          title={`Are you sure you want to delete model "${record.name}"? This cannot be undone.`}
          onConfirm={() => handleDeleteOllamaModel(record)}
          okText="Yes, Delete"
          cancelText="No"
          disabled={isDeletingModel[record.id]}
        >
          <Button icon={<DeleteOutlined />} danger loading={isDeletingModel[record.id]} />
        </Popconfirm>
      ),
    },
  ];

  const remoteServiceColumns: ColumnsType<RemoteModelServiceConfig> = [
    { title: 'Service Name', dataIndex: 'name', key: 'name', sorter: (a,b) => a.name.localeCompare(b.name) },
    { title: 'API Base URL', dataIndex: 'api_base_url', key: 'api_base_url', render: (url: string) => <a href={url} target="_blank" rel="noopener noreferrer">{url}</a> },
    { title: 'Type', dataIndex: 'source_type', key: 'source_type', render: type => <Tag>{type}</Tag>},
    { title: 'API Key Set', dataIndex: 'api_key_set', key: 'api_key_set', render: (set: boolean) => set ? <Tag color="green">Yes</Tag> : <Tag color="orange">No</Tag> },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record: RemoteModelServiceConfig) => (
        <Space>
          <Tooltip title="Edit Service">
            <Button icon={<EditOutlined />} onClick={() => handleEditRemoteService(record)} size="small" />
          </Tooltip>
          <Popconfirm
            title={`Delete remote service "${record.name}"?`}
            onConfirm={() => handleDeleteRemoteService(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    }
  ];

  const handleAddRemoteService = () => {
    setEditingRemoteService(null);
    setIsRemoteServiceModalVisible(true);
  };

  const handleEditRemoteService = (service: RemoteModelServiceConfig) => {
    setEditingRemoteService(service);
    setIsRemoteServiceModalVisible(true);
  };

  const handleRemoteServiceFormSubmit = async (values: RemoteModelServiceCreatePayload | RemoteModelServiceUpdatePayload) => {
    let success = false;
    if (editingRemoteService) {
      const result = await updateRemoteModelService(editingRemoteService.id, values as RemoteModelServiceUpdatePayload);
      if (result) {
        message.success('Remote model service updated successfully.');
        success = true;
      }
    } else {
      const result = await addRemoteModelService(values as RemoteModelServiceCreatePayload);
      if (result) {
        message.success('Remote model service added successfully.');
        success = true;
      }
    }
    if (success) {
      setIsRemoteServiceModalVisible(false);
      fetchRemoteModelServices(); // Refresh list
    } else {
      message.error(errorRemoteServices || 'Failed to save remote model service.');
    }
  };

  const handleDeleteRemoteService = async (serviceId: string) => {
    const success = await deleteRemoteModelService(serviceId);
    if (success) {
      message.success('Remote model service deleted successfully.');
      // fetchRemoteModelServices(); // Store action already optimistically updates
    } else {
      message.error(errorRemoteServices || 'Failed to delete remote model service.');
    }
  };


  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={3}>Model Management</Title>

      {errorModels && <Alert message="Error fetching local models" description={errorModels} type="error" showIcon closable />}
      {errorSettings && <Alert message="Error with model settings" description={errorSettings} type="error" showIcon closable />}
      {errorPulling && <Alert message="Error pulling model" description={errorPulling} type="error" showIcon closable />}
      {errorDeleting && <Alert message="Error deleting model" description={errorDeleting} type="error" showIcon closable />}
      {errorRemoteServices && <Alert message="Error with remote model services" description={errorRemoteServices} type="error" showIcon closable />}

      <Card title="Local Ollama Models">
        <Form layout="inline" style={{ marginBottom: 20 }}>
          <Form.Item label="Pull Ollama Model">
            <Input
              value={ollamaModelToPull}
              onChange={(e) => setOllamaModelToPull(e.target.value)}
              placeholder="e.g., llama3:latest or user/model:tag"
              style={{ width: 300 }}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handlePullModel} loading={isPullingModel} icon={<DownloadOutlined />}>
              Pull Model
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={() => fetchModels('ollama')} loading={isLoadingModels} icon={<ReloadOutlined />}>
              Refresh Ollama Models
            </Button>
          </Form.Item>
        </Form>
        <Table
          columns={ollamaColumns}
          dataSource={ollamaModels}
          rowKey="id"
          loading={isLoadingModels && !isPullingModel}
          pagination={{ pageSize: 5, total: ollamaModels.length }}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Card title="Configured Remote Model Services">
        <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddRemoteService}
            style={{ marginBottom: 16 }}
          >
            Add Remote Service
        </Button>
        <Table
          columns={remoteServiceColumns}
          dataSource={remoteModelServices}
          rowKey="id"
          loading={isLoadingRemoteServices}
          pagination={{ pageSize: 5, total: remoteModelServices.length }}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Card title="Global Model Display Settings">
        {isLoadingSettings && !settings ? <Spin /> : (
          <Form onFinish={handleSettingsSubmit(onSaveSettings)} layout="vertical">
            <Form.Item
              label="Default Models"
              help="Comma-separated list of model IDs (e.g., ollama/llama3, openai/gpt-4o) to be pre-selected for users."
            >
              <Controller
                name="default_models"
                control={settingsControl}
                render={({ field }) => (
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="Add model IDs"
                    {...field}
                    tokenSeparators={[',']}
                    options={models.map(m => ({label: m.name, value: m.id}))} // Suggest from all available models
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Model Order List"
              help="Define a specific order for models in selection dropdowns. Comma-separated model IDs. Unlisted models appear after."
            >
               <Controller
                name="model_order_list"
                control={settingsControl}
                render={({ field }) => (
                  <Select
                    mode="tags" // Using tags for ordered list input, can be improved with drag-drop list later
                    style={{ width: '100%' }}
                    placeholder="Add model IDs in preferred order"
                    {...field}
                    tokenSeparators={[',']}
                    options={models.map(m => ({label: m.name, value: m.id}))}
                  />
                )}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoadingSettings} icon={<SaveOutlined />} disabled={!isSettingsDirty}>
                Save Model Settings
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </Space>
  );
};

export default ModelManagementPage;
