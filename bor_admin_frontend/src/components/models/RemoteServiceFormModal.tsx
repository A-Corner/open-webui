import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Select } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import type { RemoteModelServiceCreatePayload, RemoteModelServiceUpdatePayload, RemoteModelServiceConfig } from '../../api/adminModelService'; // Adjust path

const { Option } = Select;

interface RemoteServiceFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: RemoteModelServiceCreatePayload | RemoteModelServiceUpdatePayload) => Promise<void>;
  initialValues?: Partial<RemoteModelServiceConfig> | null;
  isEditMode: boolean;
  isLoading?: boolean;
}

const RemoteServiceFormModal: React.FC<RemoteServiceFormModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  initialValues,
  isEditMode,
  isLoading,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RemoteModelServiceCreatePayload | RemoteModelServiceUpdatePayload>();

  useEffect(() => {
    if (visible) {
      if (isEditMode && initialValues) {
        reset({
          name: initialValues.name,
          api_base_url: initialValues.api_base_url,
          description: initialValues.description,
          source_type: initialValues.source_type || 'openai_compatible',
          api_key: '', // API key is not pre-filled for security
        });
      } else {
        reset({
          name: '',
          api_base_url: '',
          api_key: '',
          description: '',
          source_type: 'openai_compatible',
        });
      }
    }
  }, [visible, isEditMode, initialValues, reset]);

  const handleFormSubmit = (data: RemoteModelServiceCreatePayload | RemoteModelServiceUpdatePayload) => {
    const payload = { ...data };
    if (isEditMode && payload.api_key === '') {
      delete payload.api_key; // Don't send empty api_key on update unless it means "clear key"
    }
    onSubmit(payload);
  };

  return (
    <Modal
      title={isEditMode ? 'Edit Remote Model Service' : 'Add New Remote Model Service'}
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      maskClosable={!isLoading}
      closable={!isLoading}
    >
      <Form layout="vertical" onFinish={handleSubmit(handleFormSubmit)} style={{ paddingTop: '20px' }}>
        <Form.Item
          label="Service Name / Alias"
          name="name"
          validateStatus={errors.name ? 'error' : ''}
          help={errors.name?.message as string}
          required
        >
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Service name is required' }}
            render={({ field }) => <Input {...field} placeholder="e.g., My OpenAI API, Local LM Studio" />}
          />
        </Form.Item>

        <Form.Item
          label="API Base URL"
          name="api_base_url"
          validateStatus={errors.api_base_url ? 'error' : ''}
          help={errors.api_base_url?.message as string}
          required
        >
          <Controller
            name="api_base_url"
            control={control}
            rules={{
              required: 'API Base URL is required',
              pattern: { value: /^https?:\/\/.+/i, message: 'Invalid URL format (must start with http/https)' },
            }}
            render={({ field }) => <Input {...field} type="url" placeholder="https://api.example.com/v1" />}
          />
        </Form.Item>

        <Form.Item
          label="Service Type"
          name="source_type"
          required
        >
          <Controller
            name="source_type"
            control={control}
            defaultValue="openai_compatible"
            rules={{ required: 'Service type is required' }}
            render={({ field }) => (
              <Select {...field}>
                <Option value="openai_compatible">OpenAI-Compatible</Option>
                {/* Add other types like 'anthropic', 'cohere', 'google_vertex' if backend/system supports them */}
                <Option value="other">Other</Option>
              </Select>
            )}
          />
        </Form.Item>

        <Form.Item
          label="API Key (Optional)"
          name="api_key"
          help={isEditMode && initialValues?.api_key_set ? "API key is set. Enter new key to change, or leave blank to keep." : "Enter API key if required by the service."}
        >
          <Controller
            name="api_key"
            control={control}
            render={({ field }) => <Input.Password {...field} placeholder={isEditMode ? "Enter new API key to change" : "Enter API key"} />}
          />
        </Form.Item>

        <Form.Item
          label="Description (Optional)"
          name="description"
        >
          <Controller
            name="description"
            control={control}
            render={({ field }) => <Input.TextArea {...field} rows={2} placeholder="Brief description of the service or models it provides." />}
          />
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            {isEditMode ? 'Save Changes' : 'Add Service'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RemoteServiceFormModal;
