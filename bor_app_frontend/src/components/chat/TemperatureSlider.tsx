// bor_app_frontend/src/components/chat/TemperatureSlider.tsx
import React from 'react';
import { Slider, Typography, Tooltip, Space } from 'antd';
import { BulbOutlined } from '@ant-design/icons'; // Icon for creativity/temperature
import { useChatStore } from '../../store/chatStore';

const { Text } = Typography;

// 中文注释：聊天温度设置滑动条组件

const TemperatureSlider: React.FC = () => {
  const { currentTemperature, setCurrentTemperature } = useChatStore();

  const handleChange = (value: number) => {
    setCurrentTemperature(value);
  };

  // Tooltip text based on temperature value
  const getTooltipTitle = (temp: number): string => {
    if (temp < 0.3) return "更精确和保守的回复";
    if (temp < 0.7) return "平衡的回复";
    if (temp < 1.0) return "更有创造性的回复";
    return "非常随机和富有想象力的回复";
  };

  return (
    <Space direction="vertical" style={{ minWidth: 150 }}>
      <Space align="center">
        <Tooltip title="调整AI回复的随机性。较低值更保守，较高值更具创造性。">
          <BulbOutlined style={{ marginRight: 0, color: '#faad14' }} />
          <Text style={{ marginRight: 8 }}>温度:</Text>
        </Tooltip>
        <Text strong>{currentTemperature.toFixed(1)}</Text>
      </Space>
      <Tooltip title={getTooltipTitle(currentTemperature)}>
        <Slider
          value={currentTemperature}
          min={0}
          max={1.5} // Common range for temperature, can be adjusted
          step={0.1}
          onChange={handleChange}
          // tipFormatter={(value) => `${value?.toFixed(1)}: ${getTooltipTitle(value || 0)}`} // Show detailed tip on hover/drag
          style={{ width: '100%' }}
        />
      </Tooltip>
    </Space>
  );
};

export default TemperatureSlider;
