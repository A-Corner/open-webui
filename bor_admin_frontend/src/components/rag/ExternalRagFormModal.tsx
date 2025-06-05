import React, { useEffect } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import type { ExternalRagService, ExternalRagServiceCreatePayload, ExternalRagServiceUpdatePayload } from '../../api/adminExternalRagService'; // Adjust path

interface ExternalRagFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: ExternalRagServiceCreatePayload | ExternalRagServiceUpdatePayload) => Promise<void>;
  initialValues?: Partial<ExternalRagService> | null;
  isEditMode: boolean;
  isLoading?: boolean;
}

const ExternalRagFormModal: React.FC<ExternalRagFormModalProps> = ({
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
    setValue,
  } = useForm<ExternalRagServiceCreatePayload | ExternalRagServiceUpdatePayload>({
    // Default values are set by useEffect
  });

  useEffect(() => {
    if (visible) {
      if (isEditMode && initialValues) {
        reset({
          name: initialValues.name,
          url: initialValues.url,
          // API key is not pre-filled for security, user must re-enter if they want to change it.
          // If the API key is to be shown/editable, careful consideration for security is needed.
          // For now, assume api_key field is for entering/updating, not displaying existing.
          api_key: '', // Always start empty or provide specific "change API key" UI
        });
      } else {
        reset({
          name: '',
          url: '',
          api_key: '',
        });
      }
    }
  }, [visible, isEditMode, initialValues, reset]);

  const handleFormSubmit = (data: ExternalRagServiceCreatePayload | ExternalRagServiceUpdatePayload) => {
    const payload = { ...data };
    // If API key is empty string and we're editing, we might not want to send it,
    // signifying "do not change key". Backend PUT should handle exclude_unset=True.
    // If creating and it's empty, it should be sent as empty or omitted based on backend.
    if (isEditMode && payload.api_key === '') {
      delete payload.api_key; // Don't send empty api_key on update unless it means "clear key"
    }
    onSubmit(payload);
  };

  return (
    <Modal
      title={isEditMode ? 'Edit External RAG Service' : 'Add New External RAG Service'}
      open={visible}
      onCancel={onCancel}
      footer={null} // Custom footer
      destroyOnClose
      maskClosable={!isLoading}
      closable={!isLoading}
    >
      <Form layout="vertical" onFinish={handleSubmit(handleFormSubmit)} style={{ paddingTop: '20px' }}>
        <Form.Item
          label="Service Name"
          name="name"
          validateStatus={errors.name ? 'error' : ''}
          help={errors.name?.message as string}
          required
        >
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Service name is required' }}
            render={({ field }) => <Input {...field} placeholder="e.g., My Company RAG" />}
          />
        </Form.Item>

        <Form.Item
          label="Service URL"
          name="url"
          validateStatus={errors.url ? 'error' : ''}
          help={errors.url?.message as string}
          required
        >
          <Controller
            name="url"
            control={control}
            rules={{
              required: 'Service URL is required',
              pattern: {
                value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i, // Basic URL pattern
                message: 'Invalid URL format',
              },
            }}
            render={({ field }) => <Input {...field} type="url" placeholder="https://api.example.com/rag-service" />}
          />
        </Form.Item>

        <Form.Item
          label="API Key (Optional)"
          name="api_key"
          validateStatus={errors.api_key ? 'error' : ''}
          help={errors.api_key?.message as string}
        >
          <Controller
            name="api_key"
            control={control}
            render={({ field }) => <Input.Password {...field} placeholder={isEditMode ? "Enter new API key to change" : "Enter API key if required"} />}
          />
           {isEditMode && initialValues?.has_api_key && (
            <small>API key is currently set. Enter a new key above to change it, or leave blank to keep the existing key.</small>
          )}
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            {isEditMode ? 'Save Changes' : 'Create Service'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExternalRagFormModal;
