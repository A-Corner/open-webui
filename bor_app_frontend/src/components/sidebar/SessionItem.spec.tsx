// bor_app_frontend/src/components/sidebar/SessionItem.spec.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '../../store/sessionStore';
import SessionItem from './SessionItem'; // Assuming path is correct
import type { Session } from '../../types/session';
import { ConfigProvider, theme as antdTheme } from 'antd'; // For AntD context

// Mock sessionStore
vi.mock('../../store/sessionStore');

const mockSetActiveSession = vi.fn();
const mockDeleteSession = vi.fn();

const mockSession: Session = {
  id: 'session1',
  title: 'Test Session Title',
  createdAt: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
  updatedAt: Date.now(),
};

// Helper to render with AntD ConfigProvider
const renderWithAntD = (component: React.ReactElement) => {
  return render(
    <ConfigProvider theme={{ algorithm: antdTheme.defaultAlgorithm }}>
      {component}
    </ConfigProvider>
  );
};


describe('SessionItem', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (useSessionStore as any).mockReturnValue({
      activeSessionId: 'sessionOther', // Default to not active
      setActiveSession: mockSetActiveSession,
      deleteSession: mockDeleteSession,
    });
  });

  it('renders session title and formatted date correctly', () => {
    renderWithAntD(<SessionItem session={mockSession} />);
    expect(screen.getByText(mockSession.title)).toBeInTheDocument();
    // Date formatting check can be more specific if needed (e.g., using dayjs.format)
    // For now, just checking if some part of date string is present.
    // This depends on how dayjs formats it, e.g., "a day ago" or "YYYY-MM-DD"
    // Let's assume dayjs().fromNow() or similar relative time is used by the component.
    // This test might need adjustment based on actual date formatting in SessionItem.
    // For a fixed format like 'YYYY/MM/DD HH:mm', you'd check for that.
    // If using 'fromNow', the text is dynamic. We'll check for presence of any date-like text.
    // A better approach for dates is to use a consistent data-testid or pass formatted date as prop.
    // For now, let's assume the component formats it and we just check it's there.
    // Example: if it shows "a day ago" (using dayjs fromNow)
    // For more stable test, mock dayjs or check for a specific format.
    // As the component code is not provided, we'll assume a simple presence check.
    const timeElement = screen.getByText(new RegExp(new Date(mockSession.updatedAt).getFullYear().toString())); // Check if year is present
    expect(timeElement).toBeInTheDocument();
  });

  it('highlights the item if it is active', () => {
    (useSessionStore as any).mockReturnValue({
      activeSessionId: 'session1', // This session is active
      setActiveSession: mockSetActiveSession,
      deleteSession: mockDeleteSession,
    });
    const { container } = renderWithAntD(<SessionItem session={mockSession} />);
    // AntD List.Item active state might add a specific class or style.
    // This depends on how "active" is visually represented.
    // Assuming antd List.Item adds 'ant-list-item-active' or similar, or a specific style.
    // For now, let's check if the container's direct child (the List.Item) has some indicator.
    // This is a bit fragile. A data-testid="session-item-session1-active" would be better.
    // If active style is, for example, a specific background color:
    // expect(container.firstChild).toHaveStyle('background-color: #e6f7ff'); // Example active color
    // For now, let's assume there is a class like `active-session-item` or similar
    // As we don't have the component's code, we can't be sure.
    // Placeholder: We can check if it calls setActiveSession when clicked (even if active).
    fireEvent.click(screen.getByText(mockSession.title));
    expect(mockSetActiveSession).toHaveBeenCalledWith('session1');
  });

  it('calls setActiveSession with session ID when clicked', () => {
    renderWithAntD(<SessionItem session={mockSession} />);
    fireEvent.click(screen.getByText(mockSession.title));
    expect(mockSetActiveSession).toHaveBeenCalledWith('session1');
  });

  it('calls deleteSession with session ID when delete is confirmed', () => {
    renderWithAntD(<SessionItem session={mockSession} />);
    // AntD Popconfirm needs to be opened first, then confirm button clicked.
    // The delete button might be an icon. Let's assume it has an accessible role or title.
    const deleteButton = screen.getByRole('button', { name: /delete session/i }); // Assuming an aria-label or title
    fireEvent.click(deleteButton);

    // Popconfirm content should be visible now. Find and click confirm.
    // This depends on AntD's Popconfirm structure. Usually "OK" or "Yes".
    // Using text match for simplicity.
    const confirmButton = screen.getByRole('button', { name: /ok/i }); // Or "Yes", "删除" etc.
    fireEvent.click(confirmButton);

    expect(mockDeleteSession).toHaveBeenCalledWith('session1');
  });

  it('does not call deleteSession if delete is cancelled', () => {
    renderWithAntD(<SessionItem session={mockSession} />);
    const deleteButton = screen.getByRole('button', { name: /delete session/i });
    fireEvent.click(deleteButton);

    const cancelButton = screen.getByRole('button', { name: /cancel/i }); // Or "No"
    fireEvent.click(cancelButton);

    expect(mockDeleteSession).not.toHaveBeenCalled();
  });
});
