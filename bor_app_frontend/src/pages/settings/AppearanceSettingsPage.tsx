// bor_app_frontend/src/pages/settings/AppearanceSettingsPage.tsx
import React from 'react';
import { Card, Typography, Radio, Space } from 'antd';
import { useUserSettingsStore } from '../../store/userSettingsStore';
import type { ThemePreference } from '../../types/settings';

const { Title, Text } = Typography;

// 中文注释：外观设置页面，例如主题切换

const AppearanceSettingsPage: React.FC = () => {
  const { theme, setTheme } = useUserSettingsStore();

  const handleThemeChange = (e: any) => { // AntD RadioChangeEvent from antd/es/radio/interface
    setTheme(e.target.value as ThemePreference);
  };

  return (
    <Card title="外观设置">
      <Space direction="vertical" size="large">
        <div>
          <Title level={5}>应用主题</Title>
          <Text type="secondary">选择您偏好的应用界面主题。</Text>
          <Radio.Group onChange={handleThemeChange} value={theme} style={{ marginTop: 8 }}>
            <Radio.Button value="light">明亮</Radio.Button>
            <Radio.Button value="dark">暗黑</Radio.Button>
            <Radio.Button value="system">跟随系统</Radio.Button>
          </Radio.Group>
        </div>
        {/* 未来可以添加更多外观设置，如字体大小、紧凑模式等 */}
      </Space>
    </Card>
  );
};
export default AppearanceSettingsPage;
