// bor_app_frontend/src/pages/settings/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Avatar, Button, Upload, message, Form, Input, Spin } from 'antd';
import { UserOutlined, UploadOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import { useUserSessionStore } from '../../store/userSessionStore'; // 获取当前用户信息
import { updateMyProfile, uploadMyAvatar, getMyProfile } from '../../api/appUserService'; // 更新用户信息的API
import type { RcFile } from 'antd/es/upload/interface';
import type { User } from '../../types/user'; // Assuming User type is in types/user.ts

// 中文注释：用户个人资料页面

const ProfilePage: React.FC = () => {
  const { user, setUser, token } = useUserSessionStore(); // setUser 用于更新store中的用户信息, token for auth check
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For general loading state
  const [isUploading, setIsUploading] = useState(false); // Specifically for avatar upload

  // Fetch profile if user data is minimal or not present (e.g. only token rehydrated)
  useEffect(() => {
    const fetchUserIfNeeded = async () => {
      if (token && (!user || !user.email)) { // Basic check if full user profile is missing
        setIsLoading(true);
        try {
          const fullUserProfile = await getMyProfile();
          setUser(fullUserProfile);
        } catch (error: any) {
          message.error(error.message || '获取用户详细信息失败');
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchUserIfNeeded();
  }, [user, setUser, token]);


  if (isLoading || !user) {
    return <Card style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px'}}><Spin tip="加载用户信息中..." /></Card>;
  }

  const handleAvatarUpload = async (file: RcFile) => {
    setIsUploading(true);
    try {
      const response = await uploadMyAvatar(file);
      setUser({ ...user, profile_image_url: response.profile_image_url });
      message.success('头像上传成功!');
    } catch (error: any) {
      message.error(error.message || '头像上传失败');
    } finally {
      setIsUploading(false);
    }
    return false; // Prevent antd Upload component's default upload behavior
  };

  const handleProfileUpdate = async (values: { name?: string; email?: string }) => {
    setIsLoading(true);
    try {
        const updatedUserData = await updateMyProfile(values);
        setUser(updatedUserData); // Update store
        message.success('个人信息更新成功!');
        setIsEditing(false);
    } catch (error: any) {
        message.error(error.message || '信息更新失败');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card title="个人资料">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Avatar size={128} src={user.profile_image_url} icon={<UserOutlined />} />
        <Upload
          name="avatar"
          showUploadList={false}
          beforeUpload={handleAvatarUpload}
          disabled={isUploading || isEditing}
        >
          <Button icon={<UploadOutlined />} style={{ marginTop: 16 }} loading={isUploading} disabled={isEditing}>
            更换头像
          </Button>
        </Upload>
      </div>

      {!isEditing ? (
        <>
          <Descriptions bordered column={1}>
            <Descriptions.Item label={<><IdcardOutlined style={{marginRight: 8}} /> 用户名</>}>{user.name || '未设置'}</Descriptions.Item>
            <Descriptions.Item label={<><MailOutlined style={{marginRight: 8}} /> 邮箱</>}>{user.email}</Descriptions.Item>
            <Descriptions.Item label="角色">{user.role || '未知'}</Descriptions.Item>
          </Descriptions>
          <Button
            type="primary"
            onClick={() => {
              form.setFieldsValue({name: user.name, email: user.email}); // Ensure form has current values
              setIsEditing(true);
            }}
            style={{ marginTop: 16 }}
            disabled={isUploading}
          >
            编辑信息
          </Button>
        </>
      ) : (
        <Form form={form} layout="vertical" onFinish={handleProfileUpdate} initialValues={{name: user.name, email: user.email}}>
          <Form.Item
            name="name"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ required: true, type: 'email', message: '请输入有效的邮箱地址!' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading} style={{ marginRight: 8 }}>
              保存更改
            </Button>
            <Button onClick={() => setIsEditing(false)} disabled={isLoading}>
              取消
            </Button>
          </Form.Item>
        </Form>
      )}
    </Card>
  );
};

export default ProfilePage;
