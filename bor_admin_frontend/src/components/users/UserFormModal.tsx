import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, Button } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import type { User, UserCreatePayload, UserUpdatePayload } from '../../api/adminUserService'; // Adjust path

const { Option } = Select;

interface UserFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: UserCreatePayload | UserUpdatePayload) => Promise<void>;
  initialValues?: Partial<User> | null; // User type from adminUserService might be slightly different from form values
  isEditMode: boolean;
  isLoading?: boolean;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
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
    watch,
  } = useForm<UserCreatePayload | UserUpdatePayload>({
    // Default values are set by useEffect when initialValues change
  });

  useEffect(() => {
    if (visible) {
      if (isEditMode && initialValues) {
        reset({
          username: initialValues.username, // Username is not editable, but good to have in form state
          email: initialValues.email,
          role: initialValues.role,
          is_active: initialValues.is_active !== undefined ? initialValues.is_active : true,
        });
      } else {
        reset({
          username: '',
          email: '',
          password: '',
          confirm_password: '', // Specific to create/password change
          role: 'user',
          is_active: true,
        });
      }
    }
  }, [visible, isEditMode, initialValues, reset]);

  const handleFormSubmit = (data: UserCreatePayload | UserUpdatePayload) => {
    const payload = { ...data };
    // Remove confirm_password if it exists, as it's not part of the backend payload
    if ('confirm_password' in payload) {
      delete (payload as any).confirm_password;
    }
    // In edit mode, don't send username or password (unless password change is part of this form)
    if (isEditMode) {
      delete (payload as any).username; // Username should not be changeable
      delete (payload as any).password; // Password change is separate or conditional
    }
    onSubmit(payload);
  };

  const password = watch('password');

  return (
    <Modal
      title={isEditMode ? 'Edit User' : 'Create New User'}
      open={visible} // AntD v5 uses 'open' prop
      onCancel={onCancel}
      footer={null} // Custom footer with AntD Form buttons
      destroyOnClose // Reset form fields when modal is closed
    >
      <Form layout="vertical" onFinish={handleSubmit(handleFormSubmit)} style={{ paddingTop: '20px' }}>
        <Form.Item
          label="Username"
          name="username"
          validateStatus={errors.username ? 'error' : ''}
          help={errors.username?.message}
          required={!isEditMode}
        >
          <Controller
            name="username"
            control={control}
            rules={{ required: !isEditMode ? 'Username is required' : false }}
            render={({ field }) => <Input {...field} disabled={isEditMode} placeholder="Enter username" />}
          />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          validateStatus={errors.email ? 'error' : ''}
          help={errors.email?.message}
          required
        >
          <Controller
            name="email"
            control={control}
            rules={{
              required: 'Email is required',
              pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
            }}
            render={({ field }) => <Input {...field} type="email" placeholder="Enter email address" />}
          />
        </Form.Item>

        {!isEditMode && (
          <>
            <Form.Item
              label="Password"
              name="password"
              validateStatus={errors.password ? 'error' : ''}
              help={errors.password?.message}
              required
            >
              <Controller
                name="password"
                control={control}
                rules={{
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                }}
                render={({ field }) => <Input.Password {...field} placeholder="Enter password" />}
              />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="confirm_password"
              dependencies={['password']}
              validateStatus={errors.confirm_password ? 'error' : ''}
              help={errors.confirm_password?.message}
              required
            >
              <Controller
                name="confirm_password"
                control={control}
                rules={{
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'The two passwords do not match',
                }}
                render={({ field }) => <Input.Password {...field} placeholder="Confirm password" />}
              />
            </Form.Item>
          </>
        )}

        <Form.Item label="Role" name="role" required>
          <Controller
            name="role"
            control={control}
            defaultValue="user"
            render={({ field }) => (
              <Select {...field}>
                <Option value="user">User</Option>
                <Option value="admin">Admin</Option>
                <Option value="pending">Pending</Option>
              </Select>
            )}
          />
        </Form.Item>

        <Form.Item label="Active Status" name="is_active" valuePropName="checked">
          <Controller
            name="is_active"
            control={control}
            defaultValue={true}
            render={({ field }) => <Switch {...field} checked={field.value} />}
          />
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            {isEditMode ? 'Save Changes' : 'Create User'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserFormModal;
