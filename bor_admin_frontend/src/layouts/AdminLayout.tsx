import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Breadcrumb, Typography, theme as antdTheme, Button } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  SettingOutlined,
  TeamOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  // Add other icons as needed for menu items
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore'; // Adjust path
// import { useBrandingStore } from '../store/brandingStore'; // If needed for logo/app_name in layout

const { Header, Content, Footer, Sider } = Layout;
const { Text } = Typography;
// const { useToken } = antdTheme; // For accessing theme tokens if needed

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logoutAction } = useAuthStore((state) => ({
    user: state.user,
    logoutAction: state.logoutAction,
  }));
  // const { config: brandingConfig } = useBrandingStore(state => ({config: state.config})); // Example

  const navigate = useNavigate();
  const location = useLocation();
  // const { token } = useToken(); // For custom styling with theme tokens

  const handleLogout = async () => {
    await logoutAction();
    navigate('/login'); // Ensure redirection to login after logout
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Profile', // Placeholder
      icon: <UserOutlined />,
      disabled: true, // TODO: Implement profile page
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  const siderMenuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>,
    },
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: <Link to="/users">User Management</Link>,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      children: [
        {
          key: '/settings/system',
          label: <Link to="/settings/system">System</Link>,
        },
        // Add other settings pages here
      ],
    },
  ];

  // Determine selected keys for Sider Menu based on current route
  const [currentSiderKeys, setCurrentSiderKeys] = useState<string[]>([]);
  useEffect(() => {
    const pathSnippets = location.pathname.split('/').filter(i => i);
    const keys = pathSnippets.map((_, index) => `/${pathSnippets.slice(0, index + 1).join('/')}`);
    setCurrentSiderKeys(keys);
  }, [location.pathname]);


  // Breadcrumb generation
  const pathSnippets = location.pathname.split('/').filter((i) => i);
  const breadcrumbItems = [
    { title: <Link to="/">Home</Link> }, // Or Dashboard
    ...pathSnippets.map((snippet, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      const name = snippet.charAt(0).toUpperCase() + snippet.slice(1); // Capitalize
      return {
        title: pathSnippets.length -1 === index ? name : <Link to={url}>{name}</Link> ,
      };
    }),
  ];

  // const appLogo = brandingConfig?.logo_path || '/default_logo.png';
  // const appName = brandingConfig?.app_name || 'Admin Panel';
  // For now, using text as logo placeholder
  const appLogoText = "BoR Admin"; // Replace with brandingConfig.app_name later

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', lineHeight: '32px', color: 'white', overflow: 'hidden' }}>
          {/* <img src={appLogo} alt="Logo" style={{height: '100%'}} /> */}
          {collapsed ? appLogoText.substring(0,1) : appLogoText}
        </div>
        <Menu theme="dark" selectedKeys={currentSiderKeys} mode="inline" items={siderMenuItems} />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: '#fff' /* token.colorBgContainer */ }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
            <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: '16px',
                  width: 64,
                  height: 64,
                }}
              />
            <div style={{ flexGrow: 1 }}>
                 {/* Breadcrumb can go here if not too long, or further right */}
            </div>
            <div>
              <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
                <a onClick={(e) => e.preventDefault()} style={{ display: 'inline-block', cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} src={user?.profile_image_url} style={{ marginRight: 8 }} />
                  <Text>{user?.username || user?.email || 'User'}</Text>
                </a>
              </Dropdown>
            </div>
          </div>
        </Header>
        <Content style={{ margin: '0 16px' }}>
          <Breadcrumb style={{ margin: '16px 0' }} items={breadcrumbItems} />
          <div style={{ padding: 24, minHeight: 360, background: '#fff' /* token.colorBgContainer */ }}>
            <Outlet /> {/* Child routes will render here */}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          {/* Placeholder for Footer Text - use brandingConfig.footer_text */}
          BoR Admin Panel ©{new Date().getFullYear()} Created by BoR Team
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
