import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, Form, Input, Typography, Alert, Spin } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore'; // Adjust path

const { Title } = Typography;

// Assuming a global style for centering or specific layout for login page
// For example, in src/index.css or a layout component:
// .login-page-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f0f2f5; }
// <div className="login-page-container"> ... <Card> ... </Card> ... </div>

const LoginPage: React.FC = () => {
  const { loginAction, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/'; // Path to redirect to after login

  const {
    control,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm({
    defaultValues: {
      username_or_email: '',
      password: '',
    },
  });

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const onSubmit = async (data: any) => {
    clearError(); // Clear previous errors
    try {
      await loginAction(data);
      // Navigation on success is handled by the useEffect above
    } catch (loginError: any) {
      // Error is already set in store by loginAction, but we can log or handle further if needed
      console.error('Login page submission error:', loginError.message);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {/* Placeholder for Logo */}
          {/* <img src="/path-to-bor-logo.png" alt="BoR Logo" style={{ height: '60px', marginBottom: '20px' }} /> */}
          <Title level={2}>Admin Login</Title>
          {/* TODO: Replace "Admin Login" with value from brandingStore (e.g. app_name + " Admin") */}
        </div>

        <Form onFinish={handleSubmit(onSubmit)} layout="vertical">
          {error && (
            <Form.Item>
              <Alert message={error} type="error" showIcon closable onClose={clearError} />
            </Form.Item>
          )}

          <Form.Item
            name="username_or_email"
            label="Username or Email"
            validateStatus={formErrors.username_or_email ? 'error' : ''}
            help={formErrors.username_or_email?.message}
            rules={[{ required: true, message: 'Please input your Username or Email!' }]}
          >
            <Controller
              name="username_or_email"
              control={control}
              rules={{ required: 'Username or Email is required' }}
              render={({ field }) => (
                <Input {...field} prefix={<UserOutlined />} placeholder="Username or Email" />
              )}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            validateStatus={formErrors.password ? 'error' : ''}
            help={formErrors.password?.message}
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Controller
              name="password"
              control={control}
              rules={{ required: 'Password is required' }}
              render={({ field }) => (
                <Input.Password {...field} prefix={<LockOutlined />} placeholder="Password" />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading} style={{ width: '100%' }}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
