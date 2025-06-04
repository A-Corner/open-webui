import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'; // For simulating navigation
import LoginPage from './LoginPage'; // Adjust path
import { useAuthStore } from '../../store/authStore'; // Adjust path

// Mock the authStore
const mockLoginAction = vi.fn();
const mockClearError = vi.fn();
let mockIsAuthenticated = false;
let mockIsLoading = false;
let mockError: string | null = null;

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    loginAction: mockLoginAction,
    isLoading: mockIsLoading,
    error: mockError,
    clearError: mockClearError,
    isAuthenticated: mockIsAuthenticated,
  })),
}));

// Mock react-router-dom's useNavigate and useLocation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const original = await vi.importActual('react-router-dom');
  return {
    ...original,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: { from: { pathname: '/dashboard' } }, pathname: '/login', search:'', hash:'', key:'' }),
  };
});

// Mock Ant Design components that might have complex internal state or side effects not relevant to this test
vi.mock('antd', async () => {
  const antd = await vi.importActual('antd');
  return {
    ...antd,
    Spin: (props) => props.spinning ? <div>Loading...</div> : null, // Simplify Spin for tests
  };
});


describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = false;
    mockIsLoading = false;
    mockError = null;
    // Reset the store mock state for each test
    (useAuthStore as any).mockImplementation(() => ({
        loginAction: mockLoginAction,
        isLoading: mockIsLoading,
        error: mockError,
        clearError: mockClearError,
        isAuthenticated: mockIsAuthenticated,
    }));
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={ui} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders login form correctly', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByPlaceholderText('Username or Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('calls loginAction on form submission with valid data', async () => {
    mockLoginAction.mockResolvedValueOnce(undefined); // Simulate successful login
    renderWithRouter(<LoginPage />);

    await userEvent.type(screen.getByPlaceholderText('Username or Email'), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockLoginAction).toHaveBeenCalledTimes(1);
      expect(mockLoginAction).toHaveBeenCalledWith({
        username_or_email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('displays error message if loginAction throws an error', async () => {
    const errorMessage = 'Invalid credentials';
    mockLoginAction.mockRejectedValueOnce(new Error(errorMessage));
    // Update store mock to reflect error state after action
    (useAuthStore as any).mockImplementation(() => ({
        loginAction: mockLoginAction,
        isLoading: false, // isLoading would become false
        error: errorMessage, // error would be set
        clearError: mockClearError,
        isAuthenticated: false,
    }));

    renderWithRouter(<LoginPage />);

    await userEvent.type(screen.getByPlaceholderText('Username or Email'), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    expect(mockClearError).toHaveBeenCalledTimes(1); // Called on submit before loginAction
  });

  it('shows loading state when loginAction is in progress', async () => {
     (useAuthStore as any).mockImplementation(() => ({
        loginAction: mockLoginAction,
        isLoading: true, // Simulate loading
        error: null,
        clearError: mockClearError,
        isAuthenticated: false,
    }));

    renderWithRouter(<LoginPage />);
    expect(screen.getByRole('button', { name: /logging in.../i })).toBeInTheDocument();
    // Or check for AntD Spin component if not simplified by mock:
    // expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects to "from" location if already authenticated', async () => {
    mockIsAuthenticated = true;
    (useAuthStore as any).mockImplementation(() => ({
        loginAction: mockLoginAction,
        isLoading: false,
        error: null,
        clearError: mockClearError,
        isAuthenticated: true, // User is authenticated
    }));

    renderWithRouter(<LoginPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('validates required fields', async () => {
    renderWithRouter(<LoginPage />);
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    // react-hook-form integrated with AntD Form.Item's help/validateStatus
    // will show messages. AntD renders help text in specific divs.
    await waitFor(() => {
      // Default AntD messages might be "Username or Email is required" or similar based on Form.Item rules
      expect(screen.getByText('Username or Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
    expect(mockLoginAction).not.toHaveBeenCalled();
  });
});
