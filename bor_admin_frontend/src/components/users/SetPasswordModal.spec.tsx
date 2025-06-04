import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SetPasswordModal from './SetPasswordModal'; // Adjust path
import type { SetPasswordPayload } from '../../api/adminUserService'; // Adjust path

describe('SetPasswordModal Component', () => {
  const mockOnCancel = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    visible: true,
    onCancel: mockOnCancel,
    onSubmit: mockOnSubmit,
    userId: 'user123',
    username: 'testuser',
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = ''; // Clean up DOM
  });

  afterEach(cleanup);

  it('renders correctly with user information in title', () => {
    render(<SetPasswordModal {...defaultProps} />);
    expect(screen.getByText(`Set New Password for ${defaultProps.username}`)).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set password/i })).toBeInTheDocument();
  });

  it('renders title with User ID if username is not provided', () => {
    render(<SetPasswordModal {...defaultProps} username={undefined} />);
    expect(screen.getByText(`Set New Password for User ID: ${defaultProps.userId.substring(0,8)}...`)).toBeInTheDocument();
  });


  it('requires new password and confirmation', async () => {
    render(<SetPasswordModal {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /set password/i }));

    await waitFor(() => {
      expect(screen.getByText('New password is required')).toBeInTheDocument();
      expect(screen.getByText('Please confirm the new password')).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates password minimum length', async () => {
    render(<SetPasswordModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText(/new password/i), 'short');
    await userEvent.click(screen.getByRole('button', { name: /set password/i }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('validates password confirmation match', async () => {
    render(<SetPasswordModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText(/new password/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'passworddifferent');
    await userEvent.click(screen.getByRole('button', { name: /set password/i }));

    await waitFor(() => {
      expect(screen.getByText('The two passwords do not match')).toBeInTheDocument();
    });
  });

  it('calls onSubmit with correct data on successful submission', async () => {
    render(<SetPasswordModal {...defaultProps} />);
    const newPassword = 'newValidPassword123';

    await userEvent.type(screen.getByLabelText(/new password/i), newPassword);
    await userEvent.type(screen.getByLabelText(/confirm new password/i), newPassword);
    await userEvent.click(screen.getByRole('button', { name: /set password/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({ new_password: newPassword });
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    render(<SetPasswordModal {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on submit button', () => {
    render(<SetPasswordModal {...defaultProps} isLoading={true} />);
    expect(screen.getByRole('button', { name: /set password/i })).toBeDisabled();
    // Check for loading text if button text changes:
    // expect(screen.getByRole('button', { name: /setting password.../i })).toBeInTheDocument();
  });

  it('resets form fields when modal becomes visible again', async () => {
    const { rerender } = render(<SetPasswordModal {...defaultProps} visible={false} />);

    // Simulate opening the modal again (e.g. for a different user or retry)
    // Need to make sure initial state is clean.
    // First, interact to dirty the form (if it were visible)
    // This test is more about useEffect behavior.

    // For simplicity, check that if it was dirtied and re-opened, it's reset.
    // This requires the component to be initially visible to be dirtied.
    rerender(<SetPasswordModal {...defaultProps} visible={true} />);
    await userEvent.type(screen.getByLabelText(/new password/i), 'some_password');

    // Simulate closing and reopening
    rerender(<SetPasswordModal {...defaultProps} visible={false} />);
    rerender(<SetPasswordModal {...defaultProps} visible={true} />);

    expect(screen.getByLabelText(/new password/i)).toHaveValue('');
    expect(screen.getByLabelText(/confirm new password/i)).toHaveValue('');
  });
});
