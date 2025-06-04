import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Outlet, useLocation, Link } from 'react-router-dom'; // Added Link
import AdminLayout from './AdminLayout'; // Adjust path
import { useAuthStore } from '../store/authStore'; // Adjust path
import type { User } from '../api/authService'; // Adjust path

// Mock the authStore
const mockLogoutAction = vi.fn();
let mockUser: User | null = {
  id: 'admin123',
  username: 'TestAdmin',
  email: 'admin@example.com',
  role: 'admin',
  profile_image_url: '/default-avatar.png',
  is_active: true,
};

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: mockUser,
    logoutAction: mockLogoutAction,
    // other store properties if AdminLayout uses them
  })),
}));

// Mock react-router-dom hooks used by AdminLayout
const mockNavigate = vi.fn();
let mockCurrentPathname = '/dashboard'; // Default for tests

vi.mock('react-router-dom', async () => {
  const original = await vi.importActual('react-router-dom');
  return {
    ...original,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: mockCurrentPathname, // Control current path for menu selection etc.
      search: '', hash: '', state: null, key: 'testkey'
    }),
    // Link might need to be a simple anchor if not wrapped in Router context properly by test
    // However, MemoryRouter should provide this context.
  };
});


// Mock Ant Design components or parts that might be problematic in JSDOM or are not central to this test
vi.mock('antd', async () => {
  const antd = await vi.importActual('antd');
  return {
    ...antd,
    // If Sider's collapsible behavior or other complex components cause issues,
    // they can be simplified here. For now, assume they work.
    // Layout: { ...antd.Layout, Sider: (props) => <aside data-testid="mock-sider">{props.children}</aside> },
  };
});

// Mock child components rendered by Outlet for testing navigation
const MockDashboardPage = () => <div data-testid="dashboard-page">Dashboard</div>;
const MockUserListPage = () => <div data-testid="userlist-page">User List</div>;
const MockSystemSettingsPage = () => <div data-testid="systemsettings-page">System Settings</div>;


describe('AdminLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentPathname = '/dashboard'; // Reset path
     // Reset user for each test if needed
    mockUser = { id: 'admin123', username: 'TestAdmin', email: 'admin@example.com', role: 'admin', profile_image_url: '/default-avatar.png', is_active: true };
    (useAuthStore as any).mockImplementation(() => ({
        user: mockUser,
        logoutAction: mockLogoutAction,
    }));
  });

  afterEach(cleanup);

  const renderWithRouter = (initialEntries = ['/dashboard']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/" element={<AdminLayout />}> {/* AdminLayout now renders Outlet for these */}
            <Route path="dashboard" element={<MockDashboardPage />} />
            <Route path="users" element={<MockUserListPage />} />
            <Route path="settings/system" element={<MockSystemSettingsPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders main layout sections (Sider, Header, Content, Footer)', () => {
    renderWithRouter();
    expect(screen.getByRole('complementary')).toBeInTheDocument(); // AntD Sider has 'complementary' role or use test-id
    expect(screen.getByRole('banner')).toBeInTheDocument();      // AntD Header has 'banner' role
    expect(screen.getByRole('main')).toBeInTheDocument();        // AntD Content has 'main' role
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // AntD Footer has 'contentinfo' role
  });

  it('displays user information in the header', () => {
    renderWithRouter();
    expect(screen.getByText(mockUser!.username)).toBeInTheDocument(); // Using non-null assertion
    const avatar = screen.getByRole('img'); // AntD Avatar renders an img role if src is provided, or a generic role for icon
    expect(avatar).toBeInTheDocument();
    if (mockUser?.profile_image_url) {
        expect(avatar).toHaveAttribute('src', mockUser.profile_image_url);
    }
  });

  it('calls logoutAction and navigates to /login on logout button click', async () => {
    renderWithRouter();
    // Click the avatar/username to open dropdown
    const userDropdownTrigger = screen.getByText(mockUser!.username);
    await userEvent.click(userDropdownTrigger);

    // Click the logout item in the dropdown
    // AntD Menu.Item might not have a simple role, find by text.
    const logoutButton = await screen.findByText('Logout'); // Wait for dropdown to appear
    await userEvent.click(logoutButton);

    expect(mockLogoutAction).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('renders navigation menu items in Sider', () => {
    renderWithRouter();
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('User Management').closest('a')).toHaveAttribute('href', '/users');
    expect(screen.getByText('System').closest('a')).toHaveAttribute('href', '/settings/system');
  });

  it('highlights the correct menu item based on current route', () => {
    mockCurrentPathname = '/users'; // Set current path for this test
    renderWithRouter(['/users']);

    const userManagementMenuItem = screen.getByText('User Management').closest('.ant-menu-item-selected');
    expect(userManagementMenuItem).toBeInTheDocument();

    const dashboardMenuItem = screen.getByText('Dashboard').closest('.ant-menu-item');
    expect(dashboardMenuItem).not.toHaveClass('ant-menu-item-selected');
  });

  it('renders breadcrumbs correctly based on route', () => {
    mockCurrentPathname = '/settings/system';
    renderWithRouter(['/settings/system']);

    const breadcrumbItems = screen.getAllByRole('listitem'); // AntD Breadcrumb items are listitems
    // Example: Home / Settings / System
    expect(breadcrumbItems.length).toBe(3);
    expect(breadcrumbItems[0]).toHaveTextContent('Home');
    expect(breadcrumbItems[1].querySelector('a')).toHaveTextContent('Settings');
    expect(breadcrumbItems[1].querySelector('a')).toHaveAttribute('href', '/settings');
    expect(breadcrumbItems[2]).toHaveTextContent('System');
  });

  it('renders child route component via Outlet', () => {
    mockCurrentPathname = '/users';
    renderWithRouter(['/users']);
    expect(screen.getByTestId('userlist-page')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
  });

});
