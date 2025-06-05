import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, InputNumber } from 'antd'; // Assuming InputNumber might be useful for embed_config if structured
import { useForm, Controller } from 'react-hook-form';
import type { CollectionCreatePayload, CollectionUpdatePayload, CollectionResponse } from '../../api/adminKnowledgeService'; // Adjust path

const { TextArea } = Input;

interface CollectionFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: CollectionCreatePayload | CollectionUpdatePayload) => Promise<void>;
  initialValues?: Partial<CollectionResponse> | null;
  isEditMode: boolean;
  isLoading?: boolean;
}

const CollectionFormModal: React.FC<CollectionFormModalProps> = ({
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
  } = useForm<CollectionCreatePayload | CollectionUpdatePayload>();

  useEffect(() => {
    if (visible) {
      if (isEditMode && initialValues) {
        reset({
          name: initialValues.name,
          description: initialValues.description,
          embed_config: initialValues.embed_config ? JSON.stringify(initialValues.embed_config, null, 2) : '', // Display as JSON string
        });
      } else {
        reset({
          name: '',
          description: '',
          embed_config: '',
        });
      }
    }
  }, [visible, isEditMode, initialValues, reset]);

  const handleFormSubmit = (data: any) => { // data will be CollectionCreatePayload | CollectionUpdatePayload
    const payload = { ...data };
    if (payload.embed_config && typeof payload.embed_config === 'string') {
      try {
        payload.embed_config = JSON.parse(payload.embed_config);
      } catch (e) {
        // Error will be caught by validator, but good to have a fallback or clear it
        // Form validation should ideally handle this.
        // If not, set to undefined or handle error more explicitly.
        // For now, assume validator catches it or backend handles empty/malformed string if not parsed.
        console.error("Embed config is not valid JSON", e);
        // If we want to prevent submission, we'd do it here or rely on RHF validation.
      }
    } else if (payload.embed_config === '') {
        delete payload.embed_config; // Send nothing or null if empty string
    }
    onSubmit(payload);
  };

  return (
    <Modal
      title={isEditMode ? 'Edit Collection' : 'Create New Collection'}
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
      maskClosable={!isLoading}
      closable={!isLoading}
    >
      <Form layout="vertical" onFinish={handleSubmit(handleFormSubmit)} style={{ paddingTop: '20px' }}>
        <Form.Item
          label="Collection Name"
          name="name"
          validateStatus={errors.name ? 'error' : ''}
          help={errors.name?.message as string}
          required
        >
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Collection name is required', maxLength: { value: 100, message: "Name too long (max 100 chars)"} }}
            render={({ field }) => <Input {...field} placeholder="e.g., Project Documents, Research Papers" />}
          />
        </Form.Item>

        <Form.Item
          label="Description (Optional)"
          name="description"
          validateStatus={errors.description ? 'error' : ''}
          help={errors.description?.message as string}
        >
          <Controller
            name="description"
            control={control}
            render={({ field }) => <TextArea {...field} rows={3} placeholder="Brief description of the collection's purpose or content." />}
          />
        </Form.Item>

        <Form.Item
          label="Embedding Configuration (Optional, JSON format)"
          name="embed_config" // Stored as JSON string in form, parsed on submit
          validateStatus={errors.embed_config ? 'error' : ''}
          help={errors.embed_config?.message as string || "Advanced: Specify custom embedding parameters if needed (e.g., model, chunking strategy)."}
        >
          <Controller
            name="embed_config"
            control={control}
            rules={{
                validate: (value) => {
                    if (!value || value.trim() === "") return true; // Empty is fine
                    try {
                        JSON.parse(value);
                        return true;
                    } catch (e) {
                        return "Must be valid JSON or empty.";
                    }
                }
            }}
            render={({ field }) => <TextArea {...field} rows={4} placeholder='e.g., { "model": "ollama/custom-embedder" }' />}
          />
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            {isEditMode ? 'Save Changes' : 'Create Collection'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CollectionFormModal;
