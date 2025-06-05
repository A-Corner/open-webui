import React, { useEffect, useMemo } from 'react';
import { useForm, Controller, FormProvider, useFormContext } from 'react-hook-form';
import { Button, Form, Input, InputNumber, Switch, Select, Spin, message, Typography, Card, Tabs, Alert } from 'antd';
import type { TabsProps } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useSystemConfigStore } from '../../store/systemConfigStore'; // Adjust path
import type { ConfigValue, ConfigItem } from '../../api/adminConfigService'; // Adjust path

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Helper to determine input type based on value or key name pattern
const getControlType = (key: string, value: ConfigValue): string => {
  if (typeof value === 'boolean') return 'switch';
  if (typeof value === 'number') return 'number';
  if (Array.isArray(value)) {
    // Simple heuristic for list of strings that might be model IDs or tags
    if (key.includes('models') || key.includes('urls') || key.includes('keys') || key.includes('list')) return 'tags';
    return 'textarea'; // Default for other arrays (e.g. complex objects)
  }
  if (typeof value === 'object' && value !== null) return 'textarea'; // For JSON objects
  if (key.toLowerCase().includes('password') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')) return 'password';
  if (key.toLowerCase().includes('template') || key.length > 100 || (typeof value === 'string' && value.includes('\n'))) return 'textarea_long';
  return 'text';
};

// Helper to group configurations
const groupConfigs = (configs: Record<string, ConfigValue> | null): Record<string, Record<string, ConfigValue>> => {
  const grouped: Record<string, Record<string, ConfigValue>> = {};
  if (!configs) return grouped;

  Object.entries(configs).forEach(([key, value]) => {
    const groupKey = key.split('.')[0] || 'general'; // Group by first part of key path
    if (!grouped[groupKey]) {
      grouped[groupKey] = {};
    }
    grouped[groupKey][key] = value;
  });

  // Sort groups for consistent order, e.g., common groups first
  const preferredOrder = ['service', 'ui', 'auth', 'ollama', 'openai', 'rag', 'huggingface', 'frontend_branding'];
  const sortedGrouped: Record<string, Record<string, ConfigValue>> = {};
  for (const groupKey of preferredOrder) {
    if (grouped[groupKey]) {
      sortedGrouped[groupKey] = grouped[groupKey];
      delete grouped[groupKey]; // remove from original to avoid duplication
    }
  }
  // Add any remaining groups (dynamic or new ones)
  for (const groupKey in grouped) {
    sortedGrouped[groupKey] = grouped[groupKey];
  }
  return sortedGrouped;
};


const ConfigFormItem: React.FC<{ configKey: string; configValue: ConfigValue }> = ({ configKey, configValue }) => {
  const { control, formState: { errors } } = useFormContext(); // Get methods from FormProvider
  const controlType = getControlType(configKey, configValue);

  // Provide a more user-friendly label if possible
  const label = configKey.split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' > ');

  if (configValue === "********") { // Masked sensitive value
    return (
      <Form.Item label={label} key={configKey} help="This value is sensitive and not displayed. Update to set a new value.">
        <Input.Password placeholder="Enter new value to update" />
      </Form.Item>
    );
  }

  switch (controlType) {
    case 'switch':
      return (
        <Form.Item label={label} key={configKey} valuePropName="checked">
          <Controller name={configKey} control={control} render={({ field }) => <Switch {...field} checked={field.value} />} />
        </Form.Item>
      );
    case 'number':
      return (
        <Form.Item label={label} key={configKey} validateStatus={errors[configKey] ? 'error' : ''} help={errors[configKey]?.message as string}>
          <Controller name={configKey} control={control} render={({ field }) => <InputNumber {...field} style={{ width: '100%' }} />} />
        </Form.Item>
      );
    case 'tags': // For arrays of simple strings
      return (
        <Form.Item label={label} key={configKey} help="Enter comma-separated values or use Select tags if more complex.">
           <Controller
            name={configKey}
            control={control}
            render={({ field }) => (
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Add values"
                {...field}
                tokenSeparators={[',']}
                value={Array.isArray(field.value) ? field.value : (typeof field.value === 'string' && field.value ? field.value.split(',') : [])}
                onChange={(val) => field.onChange(val)}
              />
            )}
          />
        </Form.Item>
      );
    case 'textarea': // For arrays of objects or complex JSON
    case 'textarea_long': // For long strings or templates
      return (
        <Form.Item label={label} key={configKey} validateStatus={errors[configKey] ? 'error' : ''} help={errors[configKey]?.message as string}>
          <Controller
            name={configKey}
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                rows={controlType === 'textarea_long' ? 6 : 3}
                placeholder={typeof configValue === 'object' ? JSON.stringify(configValue, null, 2) : String(configValue)}
              />
            )}
          />
        </Form.Item>
      );
    case 'password':
       return (
        <Form.Item label={label} key={configKey} help="Sensitive value. Enter new value to update.">
          <Controller name={configKey} control={control} render={({ field }) => <Input.Password {...field} placeholder="Enter new value to update" />} />
        </Form.Item>
      );
    default: // text
      return (
        <Form.Item label={label} key={configKey} validateStatus={errors[configKey] ? 'error' : ''} help={errors[configKey]?.message as string}>
          <Controller name={configKey} control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>
      );
  }
};


const SystemConfigsPage: React.FC = () => {
  const { configs, isLoading, isUpdating, error, fetchConfigs, updateConfigs } = useSystemConfigStore();

  const methods = useForm({ defaultValues: configs || {} });
  const { handleSubmit, reset } = methods;

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  useEffect(() => {
    // Reset form when new configs are fetched (e.g., after save)
    if (configs) {
      // Transform complex objects/arrays to string for TextArea/Tags if needed by form
      const transformedConfigs = { ...configs };
      for (const key in transformedConfigs) {
        const value = transformedConfigs[key];
        if (Array.isArray(value) && getControlType(key, value) !== 'tags') {
          transformedConfigs[key] = JSON.stringify(value, null, 2);
        } else if (typeof value === 'object' && value !== null && getControlType(key, value) === 'textarea') {
           transformedConfigs[key] = JSON.stringify(value, null, 2);
        }
      }
      reset(transformedConfigs);
    }
  }, [configs, reset]);

  const onSubmit = async (formData: Record<string, ConfigValue>) => {
    const configsToUpdate: ConfigItem[] = [];
    for (const key in formData) {
      let value = formData[key];
      // Attempt to parse back if it was stringified for textarea
      if (configs && (Array.isArray(configs[key]) || typeof configs[key] === 'object') && typeof value === 'string') {
        if (getControlType(key, configs[key]!) === 'textarea' || (getControlType(key, configs[key]!) === 'tags' && !key.includes('models') && !key.includes('urls') && !key.includes('keys'))) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            message.error(`Invalid JSON format for ${key}. Changes for this field not saved.`);
            // Continue with other fields or stop? For now, continue.
          }
        }
      }
      // Only include if changed or if it's a field that should always be sent
      // For simplicity, sending all manageable fields that were rendered.
      // Backend PersistentConfig.save() only saves if value changed from its perspective.
      if (configs && configs[key] !== value || configs && configs[key] === "********" && value !== "") { // Include if changed or if it was masked and new value is provided
         configsToUpdate.push({ key, value });
      }
    }

    if (configsToUpdate.length === 0) {
      message.info('No changes detected.');
      return;
    }

    const success = await updateConfigs(configsToUpdate);
    if (success) {
      message.success('Configurations updated successfully!');
      fetchConfigs(); // Re-fetch to confirm and get any server-side adjustments
    } else {
      // Error message is set in store, could display it here too if not using global toasts from store error
      message.error(useSystemConfigStore.getState().error || 'Failed to update configurations.');
    }
  };

  const groupedConfigs = useMemo(() => groupConfigs(configs), [configs]);

  if (isLoading && !configs) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Spin size="large" /></div>;
  }

  if (error && !configs) { // Show error primarily if initial load failed
    return <Alert message="Error" description={error} type="error" showIcon closable onClose={fetchConfigs} />;
  }

  const tabItems: TabsProps['items'] = Object.entries(groupedConfigs).map(([groupName, groupConfigs]) => ({
    key: groupName,
    label: groupName.charAt(0).toUpperCase() + groupName.slice(1).replace(/_/g, ' '),
    children: (
      <FormProvider {...methods}>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          {Object.entries(groupConfigs).map(([key, value]) => (
            <ConfigFormItem key={key} configKey={key} configValue={value} />
          ))}
           {/* Save button per tab or one global save button? One global seems better for UX. */}
        </Form>
      </FormProvider>
    ),
  }));


  return (
    <Card title={<Title level={3}>System Configurations</Title>}>
       {error && <Alert message={error} type="warning" showIcon closable style={{marginBottom: 16}} />}
      <FormProvider {...methods}>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Tabs defaultActiveKey="service" items={tabItems} />
          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Button type="primary" htmlType="submit" loading={isUpdating} icon={<SaveOutlined />}>
              Save All Changes
            </Button>
          </Form.Item>
        </Form>
      </FormProvider>
    </Card>
  );
};

export default SystemConfigsPage;
