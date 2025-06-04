import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserFormModal from './UserFormModal'; // Adjust path
import type { User, UserCreatePayload, UserUpdatePayload } from '../../api/adminUserService'; // Adjust path

// Mock Ant Design components if they have complex internal logic not relevant to the test
// For Form, Input, Select, Switch, Button, Modal, usually not needed unless specific features are used.

describe('UserFormModal Component', () => {
  const mockOnCancel = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    visible: true,
    onCancel: mockOnCancel,
    onSubmit: mockOnSubmit,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  describe('Create Mode', () => {
    const propsCreate = { ...defaultProps, isEditMode: false, initialValues: null };

    it('renders create form with empty fields and all necessary inputs', () => {
      render(<UserFormModal {...propsCreate} />);
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument(); // Exact match for "Password"
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/active status/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeChecked(); // Default active
    });

    it('requires username, email, password, and confirm password', async () => {
      render(<UserFormModal {...propsCreate} />);
      await userEvent.click(screen.getByRole('button', { name: /create user/i }));

      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
        expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates email format', async () => {
      render(<UserFormModal {...propsCreate} />);
      await userEvent.type(screen.getByLabelText(/email/i), 'invalidemail');
      await userEvent.click(screen.getByRole('button', { name: /create user/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      });
    });

    it('validates password minimum length', async () => {
      render(<UserFormModal {...propsCreate} />);
      await userEvent.type(screen.getByLabelText(/^password$/i), 'short');
      await userEvent.click(screen.getByRole('button', { name: /create user/i }));

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
    });

    it('validates password confirmation match', async () => {
      render(<UserFormModal {...propsCreate} />);
      await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'passworddifferent');
      await userEvent.click(screen.getByRole('button', { name: /create user/i }));

      await waitFor(() => {
        expect(screen.getByText('The two passwords do not match')).toBeInTheDocument();
      });
    });

    it('calls onSubmit with correct data in create mode', async () => {
      render(<UserFormModal {...propsCreate} />);
      const userData: UserCreatePayload = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'admin',
        is_active: false,
      };

      await userEvent.type(screen.getByLabelText(/username/i), userData.username);
      await userEvent.type(screen.getByLabelText(/email/i), userData.email);
      await userEvent.type(screen.getByLabelText(/^password$/i), userData.password!);
      await userEvent.type(screen.getByLabelText(/confirm password/i), userData.password!);

      // Select role (AntD Select interaction)
      const roleSelect = screen.getByLabelText(/role/i).closest('.ant-select');
      if(roleSelect) await userEvent.click(roleSelect);
      await userEvent.click(await screen.findByText('Admin')); // Option text

      // Switch for is_active (AntD Switch interaction)
      const activeSwitch = screen.getByLabelText(/active status/i);
      await userEvent.click(activeSwitch); // Toggle to false as default is true

      await userEvent.click(screen.getByRole('button', { name: /create user/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith(userData);
      });
    });
  });

  describe('Edit Mode', () => {
    const initialUser: Partial<User> = {
      username: 'edituser',
      email: 'edit@example.com',
      role: 'user',
      is_active: true,
    };
    const propsEdit = { ...defaultProps, isEditMode: true, initialValues };

    it('renders edit form with initial values, username disabled, password fields hidden', () => {
      render(<UserFormModal {...propsEdit} />);

      expect(screen.getByLabelText(/username/i)).toBeDisabled();
      expect(screen.getByLabelText(/username/i)).toHaveValue(initialUser.username);
      expect(screen.getByLabelText(/email/i)).toHaveValue(initialUser.email);
      // Check selected role (AntD Select value is harder to check directly, check presence of text)
      expect(screen.getByText(initialUser.role!, { exact: false, selector: '.ant-select-selection-item' })).toBeInTheDocument();
      expect(screen.getByLabelText(/active status/i)).toBeChecked();

      expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('calls onSubmit with updated data in edit mode (excluding username and password)', async () => {
      render(<UserFormModal {...propsEdit} />);
      const updatedData: UserUpdatePayload = {
        email: 'updated@example.com',
        role: 'admin',
        is_active: false,
      };

      await userEvent.clear(screen.getByLabelText(/email/i));
      await userEvent.type(screen.getByLabelText(/email/i), updatedData.email!);

      const roleSelect = screen.getByLabelText(/role/i).closest('.ant-select');
      if(roleSelect) await userEvent.click(roleSelect);
      await userEvent.click(await screen.findByText('Admin'));

      const activeSwitch = screen.getByLabelText(/active status/i); // Currently true
      await userEvent.click(activeSwitch); // Toggle to false

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith(updatedData); // username & password should not be in payload
      });
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    render(<UserFormModal {...defaultProps} isEditMode={false} initialValues={null} />);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on submit button', () => {
    render(<UserFormModal {...defaultProps} isLoading={true} isEditMode={false} initialValues={null} />);
    expect(screen.getByRole('button', { name: /create user/i })).toBeDisabled(); // AntD button shows loading spinner and is disabled
    // Or check for loading text if button text changes:
    // expect(screen.getByRole('button', { name: /creating.../i })).toBeInTheDocument();
  });
});
