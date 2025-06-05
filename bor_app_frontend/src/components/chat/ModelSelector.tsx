// bor_app_frontend/src/components/chat/ModelSelector.tsx
import React, { useEffect } from 'react';
import { Select, Typography, Tooltip } from 'antd';
import { RobotOutlined } from '@ant-design/icons'; // Or any other relevant icon
import { useChatStore } from '../../store/chatStore';

const { Option, OptGroup } = Select;

// 中文注释：聊天模型选择器组件

const ModelSelector: React.FC = () => {
  const {
    availableModels,
    selectedModelId,
    isLoadingModels,
    errorModels,
    fetchAvailableChatModels,
    setSelectedModelId,
  } = useChatStore();

  useEffect(() => {
    // Fetch models only if they haven't been fetched yet, or if an error occurred previously
    // This helps prevent re-fetching on every render if models are already loaded.
    if (availableModels.length === 0 && !isLoadingModels && !errorModels) {
      fetchAvailableChatModels();
    }
  }, [fetchAvailableChatModels, availableModels.length, isLoadingModels, errorModels]);

  const handleChange = (value: string | null) => {
    setSelectedModelId(value);
  };

  // Group models by provider for better organization in dropdown
  const groupedModels = availableModels.reduce((acc, model) => {
    const provider = model.provider || 'other';
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(model);
    return acc;
  }, {} as Record<string, typeof availableModels>);


  return (
    <Tooltip title={errorModels ? `加载模型错误: ${errorModels}` : "选择聊天模型"}>
      <Select
        showSearch
        value={selectedModelId}
        loading={isLoadingModels}
        onChange={handleChange}
        placeholder="选择模型"
        style={{ minWidth: 180, width: 'auto' }} // Adjusted width to be more flexible
        filterOption={(input, option) => {
          // Option.label is a ReactNode, need to access its string content for filtering
          // This is a simplified filter; for complex labels, a custom filter function or antd's default might be better.
          const label = option?.label?.toString() || '';
          return label.toLowerCase().includes(input.toLowerCase());
        }}
        notFoundContent={isLoadingModels ? "加载中..." : (errorModels || "无可用模型")}
        allowClear={selectedModelId !== null} // Allow clearing only if a model is selected
      >
        {Object.entries(groupedModels).map(([provider, models]) => (
          <OptGroup key={provider} label={provider.toUpperCase()}>
            {models.map(model => (
              <Option key={model.id} value={model.id} label={model.name}> {/* label prop for search */}
                <RobotOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                <span style={{ fontWeight: model.id === selectedModelId ? 'bold' : 'normal' }}>
                  {model.name}
                </span>
                {model.description && (
                  <Typography.Text type="secondary" style={{ fontSize: '0.8em', display: 'block', whiteSpace: 'normal' }}>
                    {model.description}
                  </Typography.Text>
                )}
              </Option>
            ))}
          </OptGroup>
        ))}
      </Select>
    </Tooltip>
  );
};

export default ModelSelector;
