import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, Form, Input, Typography, Alert, Spin } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useUserSessionStore } from '../store/userSessionStore'; // App-specific store
// import { useBrandingStore } from '../store/brandingStore'; // For app_name, login_slogan

const { Title } = Typography;

const LoginPage: React.FC = () => {
  const { loginAction, isLoading, error, clearError, isAuthenticated } = useUserSessionStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/'; // Path to redirect to after login

  // const { config: brandingConfig } = useBrandingStore();
  // const appName = brandingConfig?.app_name || "BoR App";
  // const loginSlogan = brandingConfig?.login_slogan;
  // For now, hardcode:
  const appName = "BoR Application";
  const loginSlogan = "Welcome to your personalized AI experience.";


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
    clearError();
    try {
      await loginAction(data);
      // Navigation on success is handled by useEffect
    } catch (loginError: any) {
      // Error is set in store by loginAction
      console.error('App Login page submission error:', loginError.message);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {/* <img src={brandingConfig?.logo_path || "/static/default_logo_app.png"} alt="Logo" style={{ height: '60px', marginBottom: '20px' }} /> */}
          <Title level={2}>{appName} Login</Title>
          {loginSlogan && <Typography.Paragraph>{loginSlogan}</Typography.Paragraph>}
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
            help={formErrors.username_or_email?.message as string}
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
            help={formErrors.password?.message as string}
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
