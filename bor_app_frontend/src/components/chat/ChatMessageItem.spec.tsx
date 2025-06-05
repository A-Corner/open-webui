// bor_app_frontend/src/components/chat/ChatMessageItem.spec.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ConfigProvider, theme as antdTheme, message as antdMessageInstance } from 'antd'; // Import message for mocking
import ChatMessageItem from './ChatMessageItem';
import { useChatStore } from '../../store/chatStore';
import { useUserSessionStore } from '../../store/userSessionStore';
import type { ChatMessage } from '../../types/chat';
import type { User } from '../../types/user';

// Mock antd message
vi.mock('antd', async (importOriginal) => {
    const antd = await importOriginal<typeof import('antd')>();
    return {
        ...antd,
        message: {
            ...antd.message, // Spread original message properties like config, etc.
            success: vi.fn(),
            error: vi.fn(),
            info: vi.fn(),
        },
    };
});

// Mock stores
vi.mock('../../store/chatStore');
vi.mock('../../store/userSessionStore');

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
  },
  writable: true,
});

const mockStartEditMessage = vi.fn();
const mockRemoveMessage = vi.fn();
const mockCurrentUser: User = { id: 'currentUser123', name: 'Me', email: 'me@example.com', role: 'user' };

const mockUserMessage: ChatMessage = {
  id: 'msg1',
  sender: 'user', // Assuming 'user' sender means it's from the current user for this test
  content: 'Hello, this is a user message.',
  timestamp: Date.now() - 1000,
  isLoading: false,
};

const mockAssistantMessage: ChatMessage = {
  id: 'msg2',
  sender: 'assistant',
  content: 'Hello, this is an assistant reply.',
  timestamp: Date.now(),
  isLoading: false,
};

// Helper to render with AntD ConfigProvider
const renderWithAntD = (component: React.ReactElement) => {
  return render(
    <ConfigProvider theme={{ algorithm: antdTheme.defaultAlgorithm }}>
      {component}
    </ConfigProvider>
  );
};

describe('ChatMessageItem', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (useChatStore as any).mockReturnValue({
      startEditMessage: mockStartEditMessage,
      removeMessage: mockRemoveMessage,
    });
    (useUserSessionStore as any).mockReturnValue({
      user: mockCurrentUser,
    });
    (navigator.clipboard.writeText as vi.Mock).mockResolvedValue(undefined); // Default success for clipboard
  });

  it('renders user message content and timestamp', () => {
    renderWithAntD(<ChatMessageItem message={mockUserMessage} />);
    expect(screen.getByText(mockUserMessage.content)).toBeInTheDocument();
    expect(screen.getByText(new Date(mockUserMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))).toBeInTheDocument();
  });

  it('renders assistant message content and timestamp', () => {
    renderWithAntD(<ChatMessageItem message={mockAssistantMessage} />);
    expect(screen.getByText(mockAssistantMessage.content)).toBeInTheDocument();
    expect(screen.getByText(new Date(mockAssistantMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))).toBeInTheDocument();
  });

  describe('Copy Button', () => {
    it('copies message content to clipboard when copy button is clicked', async () => {
      renderWithAntD(<ChatMessageItem message={mockUserMessage} />);
      const copyButton = screen.getByRole('button', { name: /复制/i }); // Assuming "复制" is the tooltip/aria-label
      fireEvent.click(copyButton);
      await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockUserMessage.content));
      await waitFor(() => expect(antdMessageInstance.success).toHaveBeenCalledWith('内容已复制到剪贴板!'));
    });

    it('shows error message if copy fails', async () => {
      (navigator.clipboard.writeText as vi.Mock).mockRejectedValue(new Error('Copy failed'));
      renderWithAntD(<ChatMessageItem message={mockUserMessage} />);
      const copyButton = screen.getByRole('button', { name: /复制/i });
      fireEvent.click(copyButton);
      await waitFor(() => expect(antdMessageInstance.error).toHaveBeenCalledWith('复制失败'));
    });
  });

  describe('Edit Button (for user messages)', () => {
    it('is visible for user messages and calls startEditMessage on click', () => {
      renderWithAntD(<ChatMessageItem message={mockUserMessage} />);
      const editButton = screen.getByRole('button', { name: /编辑/i });
      expect(editButton).toBeInTheDocument();
      fireEvent.click(editButton);
      expect(mockStartEditMessage).toHaveBeenCalledWith(mockUserMessage.id, mockUserMessage.content);
      expect(antdMessageInstance.info).toHaveBeenCalledWith('请在输入框中编辑消息。');
    });

    it('is not visible for assistant messages', () => {
      renderWithAntD(<ChatMessageItem message={mockAssistantMessage} />);
      expect(screen.queryByRole('button', { name: /编辑/i })).not.toBeInTheDocument();
    });

    it('is not visible for user messages that are loading', () => {
      renderWithAntD(<ChatMessageItem message={{ ...mockUserMessage, isLoading: true }} />);
      expect(screen.queryByRole('button', { name: /编辑/i })).not.toBeInTheDocument();
    });
  });

  describe('Delete Button (for user messages)', () => {
    it('is visible for user messages and calls removeMessage on confirm', () => {
      renderWithAntD(<ChatMessageItem message={mockUserMessage} />);
      const deleteButton = screen.getByRole('button', { name: /删除/i });
      expect(deleteButton).toBeInTheDocument();

      fireEvent.click(deleteButton); // Open Popconfirm
      const confirmButton = screen.getByRole('button', { name: /删除/i }); // Find the "删除" confirm button in Popconfirm
      fireEvent.click(confirmButton);

      expect(mockRemoveMessage).toHaveBeenCalledWith(mockUserMessage.id);
    });

    it('is not visible for assistant messages (based on current implementation)', () => {
      // The current ChatMessageItem only shows delete for isCurrentUserSender
      renderWithAntD(<ChatMessageItem message={mockAssistantMessage} />);
      expect(screen.queryByRole('button', { name: /删除/i })).not.toBeInTheDocument();
    });
  });
});
