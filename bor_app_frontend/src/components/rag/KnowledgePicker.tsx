// bor_app_frontend/src/components/rag/KnowledgePicker.tsx
import React, { useEffect } from 'react';
import { Select, Tag, Tooltip, Typography } from 'antd';
import { BookOutlined } from '@ant-design/icons'; // CloseCircleOutlined removed as per code, can be re-added if needed
import { useRagStore } from '../../store/ragStore';

// 中文注释：知识库选择器组件

const { Option } = Select;

const KnowledgePicker: React.FC = () => {
  const {
    availableSources,
    selectedSourceId,
    fetchAvailableSources,
    setSelectedSourceId,
    isLoadingSources,
    errorSources // Can be used to display an error message to the user
  } = useRagStore();

  useEffect(() => {
    // Fetch sources only if they haven't been fetched yet or if an error occurred previously
    // This check `availableSources.length === 0 && !errorSources` helps prevent re-fetching if already loaded
    // or if there was an error and we don't want to immediately retry without user action.
    // Alternatively, a more robust approach might involve a `lastFetched` timestamp or explicit refresh action.
    if (availableSources.length === 0 && !isLoadingSources && !errorSources) {
      fetchAvailableSources();
    }
  }, [fetchAvailableSources, availableSources.length, isLoadingSources, errorSources]);

  const handleChange = (value: string | null) => {
    setSelectedSourceId(value);
  };

  const selectedSource = availableSources.find(s => s.id === selectedSourceId);

  // Display a compact tag if a source is selected
  if (selectedSourceId && selectedSource) {
    return (
      <Tooltip title={selectedSource.description || selectedSource.name}>
        <Tag
          closable
          onClose={(e) => {
            e.preventDefault(); // Prevent click event on parent if any
            setSelectedSourceId(null);
          }}
          color="blue"
          icon={<BookOutlined />}
          style={{ cursor: 'pointer', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', userSelect: 'none' }}
        >
          {selectedSource.name}
        </Tag>
      </Tooltip>
    );
  }

  // Display the Select dropdown for choosing a source
  return (
    <Select
      showSearch
      allowClear
      loading={isLoadingSources}
      value={selectedSourceId} // Controlled component
      onChange={handleChange}
      placeholder="选择知识库 (可选)"
      style={{ minWidth: 180, maxWidth: 250, marginRight: 8 }} // Adjusted style
      filterOption={(input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
      notFoundContent={isLoadingSources ? "加载中..." : (errorSources ? `加载失败: ${errorSources}` : "无可用知识库")}
    >
      {availableSources.map(source => (
        <Option key={source.id} value={source.id} label={source.name}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <BookOutlined style={{ marginRight: 8, color: '#1890ff' }}/>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Typography.Text ellipsis>{source.name}</Typography.Text>
              {source.description && (
                <Typography.Text type="secondary" style={{ fontSize: '0.8em' }} ellipsis>
                  {source.description}
                </Typography.Text>
              )}
            </div>
          </div>
        </Option>
      ))}
    </Select>
  );
};

export default KnowledgePicker;
