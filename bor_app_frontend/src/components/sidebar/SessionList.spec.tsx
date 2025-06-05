// bor_app_frontend/src/components/sidebar/SessionList.spec.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '../../store/sessionStore';
import SessionList from './SessionList'; // Assuming path is correct
import type { Session } from '../../types/session';
import { ConfigProvider, theme as antdTheme } from 'antd';

// Mock sessionStore
vi.mock('../../store/sessionStore');

// Mock SessionItem to simplify SessionList testing (optional, but can make tests more focused)
vi.mock('./SessionItem', () => ({
  default: ({ session, isActive }: { session: Session; isActive: boolean }) => (
    <div data-testid={`session-item-${session.id}`} className={isActive ? 'active' : ''}>
      <span>{session.title}</span>
      <button aria-label={`Delete ${session.title}`}>Delete</button>
    </div>
  ),
}));


const mockFetchSessions = vi.fn();
const mockCreateNewSession = vi.fn();

const mockSessions: Session[] = [
  { id: 's1', title: 'Session Alpha', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 's2', title: 'Session Beta', createdAt: Date.now() - 1000, updatedAt: Date.now() - 1000 },
];

// Helper to render with AntD ConfigProvider
const renderWithAntD = (component: React.ReactElement) => {
  return render(
    <ConfigProvider theme={{ algorithm: antdTheme.defaultAlgorithm }}>
      {component}
    </ConfigProvider>
  );
};

describe('SessionList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (useSessionStore as any).mockReturnValue({
      sessions: [],
      activeSessionId: null,
      isLoading: false,
      error: null,
      fetchSessions: mockFetchSessions,
      createNewSession: mockCreateNewSession,
    });
  });

  it('calls fetchSessions on initial render if sessions are empty', () => {
    renderWithAntD(<SessionList />);
    expect(mockFetchSessions).toHaveBeenCalledTimes(1);
  });

  it('displays loading spinner when isLoading is true', () => {
    (useSessionStore as any).mockReturnValue({
      ...useSessionStore(), // Get default mocked values
      sessions: [],
      isLoading: true,
      fetchSessions: mockFetchSessions, // Ensure it's part of the return
    });
    renderWithAntD(<SessionList />);
    expect(screen.getByRole('status', { name: /loading sessions/i })).toBeInTheDocument(); // Assuming Spin has aria-label or similar
  });

  it('displays error message when error is present', () => {
    (useSessionStore as any).mockReturnValue({
      ...useSessionStore(),
      sessions: [],
      error: 'Failed to load sessions',
      fetchSessions: mockFetchSessions,
    });
    renderWithAntD(<SessionList />);
    expect(screen.getByText(/Failed to load sessions/i)).toBeInTheDocument();
    // Check if retry button is there and works
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);
    expect(mockFetchSessions).toHaveBeenCalledTimes(1); // Initial call + retry
  });

  it('displays "No Sessions" message and create button when sessions list is empty and not loading', () => {
    (useSessionStore as any).mockReturnValue({
      ...useSessionStore(),
      sessions: [],
      isLoading: false,
      error: null,
      fetchSessions: mockFetchSessions,
      createNewSession: mockCreateNewSession,
    });
    renderWithAntD(<SessionList />);
    expect(screen.getByText(/No sessions yet/i)).toBeInTheDocument(); // Or similar empty state text
    const newChatButton = screen.getByRole('button', { name: /New Chat/i }); // Assuming button text is "New Chat"
    expect(newChatButton).toBeInTheDocument();
    fireEvent.click(newChatButton);
    expect(mockCreateNewSession).toHaveBeenCalled();
  });

  it('renders list of sessions using mocked SessionItem', () => {
    (useSessionStore as any).mockReturnValue({
      ...useSessionStore(),
      sessions: mockSessions,
      activeSessionId: 's1', // Make s1 active for this test
      fetchSessions: mockFetchSessions,
    });
    renderWithAntD(<SessionList />);
    expect(screen.getByTestId('session-item-s1')).toBeInTheDocument();
    expect(screen.getByTestId('session-item-s1')).toHaveClass('active');
    expect(screen.getByText('Session Alpha')).toBeInTheDocument();

    expect(screen.getByTestId('session-item-s2')).toBeInTheDocument();
    expect(screen.getByTestId('session-item-s2')).not.toHaveClass('active');
    expect(screen.getByText('Session Beta')).toBeInTheDocument();
  });

  it('calls createNewSession when "New Chat" button is clicked', () => {
    (useSessionStore as any).mockReturnValue({
        ...useSessionStore(),
        sessions: mockSessions, // Provide some sessions so the empty state doesn't also render "New Chat"
        fetchSessions: mockFetchSessions,
        createNewSession: mockCreateNewSession,
      });
    renderWithAntD(<SessionList />);
    const newChatButton = screen.getAllByRole('button', { name: /New Chat/i })[0]; // Might be multiple if empty state also has one
    fireEvent.click(newChatButton);
    expect(mockCreateNewSession).toHaveBeenCalledTimes(1);
  });
});
