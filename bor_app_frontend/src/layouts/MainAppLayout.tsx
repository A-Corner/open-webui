import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Button, theme as antdTheme } from 'antd';
import type { MenuProps } from 'antd';
import {
  MessageOutlined, // For Chat
  UserOutlined,    // For Profile / User menu
  SettingOutlined, // For User Settings
  LogoutOutlined,  // For Logout
  ProfileOutlined, // Added for clarity, though UserOutlined might be used for profile link
  BgColorsOutlined, // For Appearance Settings
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  // Potentially a custom logo component or direct img tag
} from '@ant-design/icons';
import { useUserSessionStore } from '../store/userSessionStore';
// import { useBrandingStore } from '../store/brandingStore';
import SessionList from '../components/sidebar/SessionList'; // Import SessionList

const { Header, Content, Footer, Sider } = Layout;
const { Text } = Typography;
// const { useToken } = antdTheme;

const MainAppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false); // Sider collapse state
  const { user, logoutAction } = useUserSessionStore((state) => ({
    user: state.user,
    logoutAction: state.logoutAction,
  }));
  const navigate = useNavigate();
  // const { token: antdDesignToken } = useToken();

  // const { config: brandingConfig } = useBrandingStore();
  // const appName = brandingConfig?.app_name || "BoR App";
  // const logoPath = brandingConfig?.logo_path || "/static/default_logo_app.png";
  const appName = "BoR Application"; // Placeholder
  // const logoPath = "/static/logo.png"; // Placeholder for logo in header if not using text


  const handleLogout = async () => {
    await logoutAction();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: <Link to="/profile">个人资料</Link>, icon: <ProfileOutlined /> }, // Updated label and icon
    { key: 'appearance', label: <Link to="/settings/appearance">外观设置</Link>, icon: <BgColorsOutlined /> }, // New item for appearance
    // { key: 'settings', label: <Link to="/settings">General Settings</Link>, icon: <SettingOutlined /> }, // Example if a general settings page is also needed
    { type: 'divider' },
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: handleLogout }, // Updated label
  ];

  // Main navigation items (if any besides chat sessions) could go into a separate Menu
  // For this layout, Sider will primarily be for SessionList.
  // Example if other nav items were needed:
  // const mainNavItems: MenuProps['items'] = [
  //   { key: '/chat', icon: <MessageOutlined />, label: 'Chat' },
  //   { key: '/some-other-feature', icon: <SomeIcon />, label: 'Other Feature'},
  // ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={280} // Adjust width as needed for session items
        theme="light" // Or dark, depending on desired theme for session list
        style={{ borderRight: '1px solid #f0f0f0'}} // Example border
      >
        <div
          style={{
            height: '32px',
            margin: '16px',
            // background: 'rgba(0, 0, 0, 0.1)',
            display:'flex',
            alignItems:'center',
            justifyContent: collapsed ? 'center': 'flex-start',
            overflow:'hidden'
          }}
        >
          {/* Placeholder for logo - can be part of SessionList or here */}
          {/* <img src={logoPath} alt="Logo" style={{ height: '100%', marginRight: collapsed ? 0 : 8 }} /> */}
          {!collapsed && <Text strong style={{ whiteSpace: 'nowrap', fontSize:'large' }}>{appName}</Text>}
        </div>
        <SessionList /> {/* SessionList component now populates the Sider */}
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
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
