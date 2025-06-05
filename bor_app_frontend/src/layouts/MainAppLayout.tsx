import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Button, theme as antdTheme } from 'antd';
import type { MenuProps } from 'antd';
import {
  MessageOutlined, // For Chat
  UserOutlined,    // For Profile / User menu
  SettingOutlined, // For User Settings
  LogoutOutlined,  // For Logout
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  // Potentially a custom logo component or direct img tag
} from '@ant-design/icons';
import { useUserSessionStore } from '../store/userSessionStore'; // Adjust path
// import { useBrandingStore } from '../store/brandingStore'; // For app_name, logo etc. from branding

const { Header, Content, Footer, Sider } = Layout;
const { Text } = Typography;
// const { useToken } = antdTheme; // For theme tokens

const MainAppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logoutAction } = useUserSessionStore((state) => ({
    user: state.user,
    logoutAction: state.logoutAction,
  }));
  const navigate = useNavigate();
  // const { token: antdDesignToken } = useToken();

  // const { config: brandingConfig } = useBrandingStore();
  // const appName = brandingConfig?.app_name || "BoR App";
  // const logoPath = brandingConfig?.logo_path || "/static/default_logo_app.png";
  // For now, hardcode app name for placeholder
  const appName = "BoR Application";
  const logoPath = "/static/logo.png"; // Placeholder


  const handleLogout = async () => {
    await logoutAction();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: <Link to="/profile">Profile</Link>, icon: <UserOutlined /> },
    { key: 'settings', label: <Link to="/settings">Settings</Link>, icon: <SettingOutlined /> },
    { type: 'divider' },
    { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout },
  ];

  const siderMenuItems: MenuProps['items'] = [
    {
      key: '/chat',
      icon: <MessageOutlined />,
      label: <Link to="/chat">Chat</Link>,
    },
    // Add other top-level navigation items here if needed
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
          {/* <img src={logoPath} alt="Logo" style={{ height: '100%', display: collapsed ? 'none': 'inline' }} /> */}
          <Text style={{color: 'white', fontSize: collapsed? 'small' : 'medium', whiteSpace: 'nowrap'}}>
            {collapsed ? appName.substring(0,1) : appName}
          </Text>
        </div>
        <Menu theme="dark" defaultSelectedKeys={['/chat']} mode="inline" items={siderMenuItems} />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: '#fff' /*antdDesignToken.colorBgContainer*/ }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <div style={{ flexGrow: 1 }}>
              {/* Breadcrumbs or other header content can go here */}
            </div>
            <div>
              <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
                <a onClick={(e) => e.preventDefault()} style={{ display: 'inline-block', cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} src={user?.profile_image_url} style={{ marginRight: 8 }} />
                  <Text>{user?.name || user?.username || user?.email || 'User'}</Text>
                </a>
              </Dropdown>
            </div>
          </div>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div style={{ padding: 24, minHeight: 'calc(100vh - 64px - 32px - 69px - 32px)', background: '#fff' /*antdDesignToken.colorBgContainer*/ }}> {/* Adjust minHeight based on header/footer */}
            <Outlet /> {/* Child routes render here */}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          {/* Placeholder for Footer Text - use brandingConfig.footer_text */}
          BoR Application ©{new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
};

export default MainAppLayout;
