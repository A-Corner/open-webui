import React, { useEffect, useState } from 'react';
import {
  Button, Card, Col, Form, Input, List, message, Popconfirm, Row, Select, Space, Spin, Switch, Table, Tag, Tooltip, Typography
} from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useForm, Controller } from 'react-hook-form';

import { useModelManagementStore } from '../../store/modelManagementStore'; // Adjust path
import type { ModelResponse, ModelPullPayload, ModelSettings, ModelSettingsUpdatePayload } from '../../api/adminModelService'; // Adjust path

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const ModelManagementPage: React.FC = () => {
  const {
    models, settings, isLoadingModels, isLoadingSettings, isPullingModel, isDeletingModel,
    errorModels, errorSettings, errorPulling, errorDeleting,
    fetchModels, pullModel, deleteModel, fetchSettings, saveSettings
  } = useModelManagementStore();

  const [ollamaModelToPull, setOllamaModelToPull] = useState<string>('');

  // For Model Settings Form
  const { control: settingsControl, handleSubmit: handleSettingsSubmit, reset: resetSettingsForm, formState: { isDirty: isSettingsDirty } } = useForm<ModelSettingsUpdatePayload>();

  useEffect(() => {
    fetchModels(); // Fetch all models initially
    fetchSettings();
  }, [fetchModels, fetchSettings]);

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
    const result = await pullModel(payload);
    if (result.success) {
      message.success(result.message || `Model pull initiated for '${payload.model_name}'. It may take some time.`);
      setOllamaModelToPull(''); // Clear input
      // Consider a delay or a more sophisticated refresh mechanism if pull is long
      setTimeout(() => fetchModels('ollama'), 5000); // Refresh Ollama models after a delay
    } else {
      message.error(result.message || `Failed to pull model '${payload.model_name}'.`);
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
  const openAICompatibleModels = models.filter(m => m.source === 'openai_compatible');
  // Add other sources if necessary

  const ollamaColumns: ColumnsType<ModelResponse> = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (name, record) => <Text strong>{name}</Text> },
    { title: 'ID', dataIndex: 'id', key: 'id', render: (id) => <Tag>{id}</Tag> },
    { title: 'Size', dataIndex: 'size', key: 'size', render: (size) => size ? (size / 1024 / 1024 / 1024).toFixed(2) + ' GB' : '-' },
    { title: 'Modified At', dataIndex: 'modified_at', key: 'modified_at', render: (ts) => ts ? new Date(ts).toLocaleString() : '-' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record: ModelResponse) => (
        <Popconfirm
          title={`Are you sure you want to delete model "${record.name}"? This cannot be undone.`}
          onConfirm={() => handleDeleteOllamaModel(record)}
          okText="Yes, Delete"
          cancelText="No"
          disabled={isDeletingModel[record.id]}
        >
          <Button icon={<DeleteOutlined />} danger loading={isDeletingModel[record.id]}>
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const otherModelsColumns: ColumnsType<ModelResponse> = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (name, record) => <Text strong>{name}</Text> },
    { title: 'ID', dataIndex: 'id', key: 'id', render: (id) => <Tag>{id}</Tag> },
    { title: 'Source', dataIndex: 'source', key: 'source', render: (source) => <Tag>{source}</Tag>},
  ];


  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={3}>Model Management</Title>

      {errorModels && <Alert message="Error fetching models" description={errorModels} type="error" showIcon closable />}
      {errorSettings && <Alert message="Error with model settings" description={errorSettings} type="error" showIcon closable />}
      {errorPulling && <Alert message="Error pulling model" description={errorPulling} type="error" showIcon closable />}
      {errorDeleting && <Alert message="Error deleting model" description={errorDeleting} type="error" showIcon closable />}

      <Card title="Ollama Models Management">
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
          loading={isLoadingModels && !isPullingModel} // Show loading only if not pulling
          pagination={{ pageSize: 5 }}
          size="small"
        />
      </Card>

      <Card title="Configured Remote Models (Read-only)">
        <Table
          columns={otherModelsColumns}
          dataSource={openAICompatibleModels} // Example, can add more sources
          rowKey="id"
          loading={isLoadingModels}
          pagination={{ pageSize: 5 }}
          size="small"
          summary={() => openAICompatibleModels.length === 0 ? <Text type="secondary">No OpenAI-compatible models configured or found.</Text> : null}
        />
      </Card>

      <Card title="Global Model Settings">
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
