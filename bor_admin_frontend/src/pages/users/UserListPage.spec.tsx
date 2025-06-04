import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom'; // For components using Link
import UserListPage from './UserListPage'; // Adjust path
import adminUserService, { type User, type UserListResponse } from '../../api/adminUserService'; // Adjust path
import { useAuthStore } from '../../store/authStore'; // Adjust path

// Mock adminUserService
vi.mock('../../api/adminUserService');

// Mock Ant Design message API
const mockMessageSuccess = vi.fn();
const mockMessageError = vi.fn();
vi.mock('antd', async () => {
  const antd = await vi.importActual('antd');
  return {
    ...antd,
    message: {
      success: mockMessageSuccess,
      error: mockMessageError,
    },
  };
});

// Mock child modal components
vi.mock('../../components/users/UserFormModal', () => ({
  default: ({ visible, onCancel, onSubmit, initialValues, isEditMode }) => visible ? (
    <div data-testid="user-form-modal">
      <span>{isEditMode ? 'Edit Mode' : 'Create Mode'}</span>
      {initialValues && <div data-testid="initial-values">{JSON.stringify(initialValues)}</div>}
      <button onClick={onCancel}>Cancel</button>
      <button onClick={() => onSubmit({})}>SubmitForm</button> {/* Simplified submit */}
    </div>
  ) : null,
}));

vi.mock('../../components/users/SetPasswordModal', () => ({
  default: ({ visible, onCancel, onSubmit, userId }) => visible ? (
    <div data-testid="set-password-modal">
      <span>UserID: {userId}</span>
      <button onClick={onCancel}>CancelPassModal</button>
      <button onClick={() => onSubmit({new_password: 'newPass'})}>SubmitPassForm</button>
    </div>
  ) : null,
}));

// Mock authStore to provide current user ID for "delete self" check
const mockCurrentUserId = 'current-admin-id';
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: mockCurrentUserId }
  })),
}));


describe('UserListPage Component', () => {
  const mockUsers: User[] = [
    { id: '1', username: 'Alice', email: 'alice@example.com', role: 'admin', is_active: true, created_at: Date.now()/1000, updated_at: Date.now()/1000, last_active_at: Date.now()/1000, profile_image_url:'' },
    { id: '2', username: 'Bob', email: 'bob@example.com', role: 'user', is_active: false, created_at: (Date.now()/1000) - 3600, updated_at: (Date.now()/1000) - 3600, last_active_at: null, profile_image_url:'' },
  ];
  const mockUserListResponse: UserListResponse = {
    users: mockUsers,
    total: mockUsers.length,
    page: 1,
    per_page: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (adminUserService.getUsers as vi.Mock).mockResolvedValue(mockUserListResponse);
    (adminUserService.deleteUser as vi.Mock).mockResolvedValue(undefined);
    (adminUserService.updateUser as vi.Mock).mockResolvedValue(mockUsers[0]); // Assuming update returns the user
    (adminUserService.createUser as vi.Mock).mockResolvedValue(mockUsers[0]);
    (adminUserService.setUserPassword as vi.Mock).mockResolvedValue(undefined);
  });

  afterEach(cleanup);

  const renderPage = () => render(<MemoryRouter><UserListPage /></MemoryRouter>);

  it('fetches and displays users in a table on initial load', async () => {
    renderPage();
    expect(adminUserService.getUsers).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    });
  });

  it('allows searching for users', async () => {
    renderPage();
    const searchInput = screen.getByPlaceholderText('Search Username/Email');
    await userEvent.type(searchInput, 'Alice');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(adminUserService.getUsers).toHaveBeenCalledWith(expect.objectContaining({ query: 'Alice' }));
    });
  });

  it('allows filtering by role', async () => {
    renderPage();
    // AntD Select uses specific roles for dropdown and items.
    // Click the select to open it.
    const roleSelect = screen.getByPlaceholderText('Filter by Role').closest('.ant-select');
    if (roleSelect) await userEvent.click(roleSelect);

    // Wait for options to appear and click 'Admin'
    const adminOption = await screen.findByText('Admin', {}, {timeout: 2000}); // text in the dropdown option
    await userEvent.click(adminOption);

    await waitFor(() => {
      expect(adminUserService.getUsers).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }));
    });
  });

  it('opens create user modal when "Create User" button is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /create user/i }));
    await waitFor(() => {
      expect(screen.getByTestId('user-form-modal')).toBeInTheDocument();
      expect(screen.getByText('Create Mode')).toBeInTheDocument();
    });
  });

  it('opens edit user modal with initial values when "Edit" button is clicked', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument()); // Wait for table to populate

    const editButtons = screen.getAllByRole('button', { name: /edit/i }); // AntD uses aria-label for icon buttons
    await userEvent.click(editButtons[0]); // Click edit for Alice

    await waitFor(() => {
      expect(screen.getByTestId('user-form-modal')).toBeInTheDocument();
      expect(screen.getByText('Edit Mode')).toBeInTheDocument();
      expect(screen.getByTestId('initial-values')).toHaveTextContent(mockUsers[0].username);
    });
  });

  it('calls deleteUser and refreshes list on delete confirmation', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]); // Click delete for Alice

    // AntD Popconfirm: find "Yes" or "OK" button
    await userEvent.click(await screen.findByText('Yes'));

    await waitFor(() => {
      expect(adminUserService.deleteUser).toHaveBeenCalledWith(mockUsers[0].id);
      expect(mockMessageSuccess).toHaveBeenCalledWith('User deleted successfully');
      expect(adminUserService.getUsers).toHaveBeenCalledTimes(2); // Initial + refresh
    });
  });

  it('opens set password modal when "Set Password" button is clicked', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

    const setPasswordButtons = screen.getAllByRole('button', { name: /key/i }); // Assuming KeyOutlined gives 'key' aria-label
    await userEvent.click(setPasswordButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('set-password-modal')).toBeInTheDocument();
      expect(screen.getByText(`UserID: ${mockUsers[0].id.substring(0,8)}...`)).toBeInTheDocument();
    });
  });

  it('toggles user active status', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument()); // Alice is active (true)

    // Find the switch for Alice. AntD Switch has role 'switch'.
    // This is tricky as there are multiple switches. We need to find the one in Alice's row.
    const aliceRow = screen.getByText('Alice').closest('tr');
    const switchForAlice = aliceRow?.querySelector('[role="switch"]');
    expect(switchForAlice).not.toBeNull();

    if (switchForAlice) {
        await userEvent.click(switchForAlice);
        await waitFor(() => {
            expect(adminUserService.updateUser).toHaveBeenCalledWith(mockUsers[0].id, { is_active: !mockUsers[0].is_active });
            expect(mockMessageSuccess).toHaveBeenCalled();
            expect(adminUserService.getUsers).toHaveBeenCalledTimes(2); // Initial + refresh
        });
    }
  });
});
