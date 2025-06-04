import React, { useEffect } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import type { SetPasswordPayload } from '../../api/adminUserService'; // Adjust path

interface SetPasswordModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: SetPasswordPayload) => Promise<void>;
  userId: string; // To display which user's password is being changed, if needed in title
  username?: string; // Optional username for display
  isLoading?: boolean;
}

const SetPasswordModal: React.FC<SetPasswordModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  userId,
  username,
  isLoading,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SetPasswordPayload & { confirm_password?: string }>({ // Add confirm_password for local validation
    defaultValues: {
      new_password: '',
      confirm_password: '',
    },
  });

  useEffect(() => {
    if (visible) {
      reset({ new_password: '', confirm_password: '' });
    }
  }, [visible, reset]);

  const handleFormSubmit = (data: SetPasswordPayload & { confirm_password?: string }) => {
    // onSubmit prop expects only SetPasswordPayload (new_password)
    onSubmit({ new_password: data.new_password });
  };

  const newPassword = watch('new_password');

  return (
    <Modal
      title={`Set New Password ${username ? `for ${username}` : `for User ID: ${userId.substring(0,8)}...`}`}
      open={visible}
      onCancel={onCancel}
      footer={null} // Custom footer
      destroyOnClose
    >
      <Form layout="vertical" onFinish={handleSubmit(handleFormSubmit)} style={{ paddingTop: '20px' }}>
        <Form.Item
          label="New Password"
          name="new_password"
          validateStatus={errors.new_password ? 'error' : ''}
          help={errors.new_password?.message}
          required
        >
          <Controller
            name="new_password"
            control={control}
            rules={{
              required: 'New password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
              // Add other strength rules if desired (e.g., regex for uppercase, number, symbol)
            }}
            render={({ field }) => <Input.Password {...field} placeholder="Enter new password" />}
          />
        </Form.Item>

        <Form.Item
          label="Confirm New Password"
          name="confirm_password"
          dependencies={['new_password']}
          validateStatus={errors.confirm_password ? 'error' : ''}
          help={errors.confirm_password?.message}
          required
        >
          <Controller
            name="confirm_password"
            control={control}
            rules={{
              required: 'Please confirm the new password',
              validate: (value) => value === newPassword || 'The two passwords do not match',
            }}
            render={({ field }) => <Input.Password {...field} placeholder="Confirm new password" />}
          />
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            {isLoading ? 'Setting Password...' : 'Set Password'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SetPasswordModal;
