import React, { useEffect } from 'react';
import { Card, Descriptions, Spin, Alert, Typography, Tag, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useServerInfoStore } from '../../store/serverInfoStore'; // Adjust path

const { Title, Paragraph } = Typography;

const ServerInfoPage: React.FC = () => {
  const { info, isLoading, error, fetchServerInfo } = useServerInfoStore();

  useEffect(() => {
    fetchServerInfo();
  }, [fetchServerInfo]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Spin size="large" tip="Loading server information..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Fetching Server Information"
        description={error}
        type="error"
        showIcon
        action={
          <Button icon={<ReloadOutlined />} onClick={fetchServerInfo}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!info) {
    return <Paragraph>No server information available.</Paragraph>;
  }

  return (
    <Card>
      <Title level={3} style={{ marginBottom: 24 }}>Server Information</Title>
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Application Version">
          <Tag color="blue">{info.app_version}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Python Version">{info.python_version}</Descriptions.Item>

        {info.fastapi_version && (
          <Descriptions.Item label="FastAPI Version">{info.fastapi_version}</Descriptions.Item>
        )}
        {info.langchain_version && (
          <Descriptions.Item label="Langchain Version">{info.langchain_version}</Descriptions.Item>
        )}

        {/*
        CPU and Memory usage display (if backend provides it):
        {info.cpu_load_avg && (
          <Descriptions.Item label="CPU Load Average (1m, 5m, 15m)">
            {info.cpu_load_avg.join(', ')}
          </Descriptions.Item>
        )}
        {info.memory_usage && (
          <Descriptions.Item label="Memory Usage">
            {`Total: ${info.memory_usage.total_gb.toFixed(1)} GB,
              Used: ${info.memory_usage.used_gb.toFixed(1)} GB
              (${info.memory_usage.percent.toFixed(1)}%)`}
          </Descriptions.Item>
        )}
        */}
      </Descriptions>
      <Button icon={<ReloadOutlined />} onClick={fetchServerInfo} style={{ marginTop: 16 }} loading={isLoading}>
        Refresh Info
      </Button>
    </Card>
  );
};

export default ServerInfoPage;
