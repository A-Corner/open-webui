import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import PrivateRoute from './PrivateRoute'; // Adjust path
import { useAuthStore } from '../../store/authStore'; // Adjust path

// Mock the authStore
let mockIsAuthenticated = false;
let mockIsLoading = false; // For more advanced scenarios if PrivateRoute handles loading state

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockIsLoading,
    // other store properties if needed by PrivateRoute or its logic
  })),
}));

// Mock a simple child component to render when authenticated
const MockProtectedComponent = () => <div data-testid="protected-content">Protected Content</div>;
const MockLoginPage = () => <div data-testid="login-page">Login Page</div>;


describe('PrivateRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock values for each test
    mockIsAuthenticated = false;
    mockIsLoading = false;
    (useAuthStore as any).mockImplementation(() => ({ // Re-apply mock with current values
        isAuthenticated: mockIsAuthenticated,
        isLoading: mockIsLoading,
    }));
  });

  afterEach(cleanup);

  it('renders child component (Outlet) when authenticated', () => {
    mockIsAuthenticated = true;
    (useAuthStore as any).mockImplementation(() => ({ isAuthenticated: true, isLoading: false }));

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/private" element={<PrivateRoute><MockProtectedComponent /></PrivateRoute>} />
          <Route path="/login" element={<MockLoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    mockIsAuthenticated = false;
    (useAuthStore as any).mockImplementation(() => ({ isAuthenticated: false, isLoading: false }));

    // To test navigation, we need to see if the content of the login page is rendered
    // or if the navigate function was called (if we were mocking useNavigate).
    // Here, MemoryRouter will handle the redirection and render the /login route's component.
    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/private" element={<PrivateRoute><MockProtectedComponent /></PrivateRoute>} />
          <Route path="/login" element={<MockLoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('redirects to /login preserving "from" location state', () => {
    mockIsAuthenticated = false;
    (useAuthStore as any).mockImplementation(() => ({ isAuthenticated: false, isLoading: false }));

    let navigatedState: any = null;
    const MockLoginWithStateCheck = () => {
      const location = (useNavigate() as any).mock.calls[0]?.[1]?.state || (window.history.state); // A bit hacky to get state
      navigatedState = location; // Check state passed to navigate
      return <div data-testid="login-page">Login Page</div>;
    };

    // We need a way to inspect what Navigate component does.
    // A more direct way is to mock Navigate component itself.
    const MockNavigate = vi.fn(({ to, state }) => {
      navigatedState = { to, state };
      return null; // Navigate doesn't render anything itself
    });

    vi.doMock('react-router-dom', async () => {
        const original = await vi.importActual('react-router-dom');
        return {
            ...original,
            Navigate: (props) => {
                MockNavigate(props); // Call our mock function with Navigate's props
                return <div data-testid="navigate-mock">{`Navigating to ${props.to}`}</div>;
            }
        };
    });


    render(
      <MemoryRouter initialEntries={['/privateResource']}>
        <Routes>
          <Route path="/privateResource" element={<PrivateRoute><MockProtectedComponent /></PrivateRoute>} />
          <Route path="/login" element={<MockLoginPage />} /> {/* LoginPage will be rendered by Navigate */}
        </Routes>
      </MemoryRouter>
    );

    // Check if the Navigate mock was called with the correct parameters
    // This is tricky because Navigate is a component, not a simple function.
    // The test above for redirection to /login already confirms navigation happens.
    // To check state, the LoginPage itself would typically use useLocation().state.
    // For this test, we'll assume the default Navigate behavior correctly passes state.
    // A more advanced test might involve a custom Navigate mock or checking location state on Login page.
    // For now, the fact that it redirects to /login is the primary test.
    // The actual state passing is a feature of react-router-dom's Navigate component.
    // We can verify this by rendering a login page that displays its location state.

    // Re-render with a login page that can expose its location state
    cleanup(); // Clean previous render

    const TestLoginPage = () => {
      const location = useLocation();
      return <div data-testid="login-page-for-state-test">{JSON.stringify(location.state)}</div>;
    };

    render(
      <MemoryRouter initialEntries={['/privateResourceForState']}>
        <Routes>
          <Route path="/privateResourceForState" element={<PrivateRoute><MockProtectedComponent /></PrivateRoute>} />
          <Route path="/login" element={<TestLoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('login-page-for-state-test')).toHaveTextContent(
      JSON.stringify({ from: { pathname: '/privateResourceForState', search: '', hash: '', state: null, key: expect.any(String) } })
    );
    vi.doUnmock('react-router-dom'); // Unmock for other tests
  });
});
