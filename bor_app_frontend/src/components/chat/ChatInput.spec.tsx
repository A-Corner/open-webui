// bor_app_frontend/src/components/chat/ChatInput.spec.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ConfigProvider, theme as antdTheme } from 'antd';
import ChatInput from './ChatInput';
import { useRagStore } from '../../store/ragStore'; // KnowledgePicker uses this
// ChatOptions is needed if we are specific about the second argument of onSendMessage
import type { ChatOptions } from '../../types/chat';

// Mock child components and stores
vi.mock('./KnowledgePicker', () => ({
  default: () => <div data-testid="knowledge-picker-mock">KnowledgePicker</div>,
}));

vi.mock('../../store/ragStore');

const mockOnSendMessage = vi.fn();
const mockOnCancelStream = vi.fn();

// Helper to render with AntD ConfigProvider
const renderWithAntD = (component: React.ReactElement) => {
  return render(
    <ConfigProvider theme={{ algorithm: antdTheme.defaultAlgorithm }}>
      {component}
    </ConfigProvider>
  );
};

describe('ChatInput', () => {
  const mockSelectedKnowledgeId = 'kb123';

  beforeEach(() => {
    vi.resetAllMocks();
    (useRagStore as any).mockReturnValue({
      selectedSourceId: null, // Default: no knowledge source selected
    });
  });

  it('renders KnowledgePicker, TextArea, and Send button', () => {
    renderWithAntD(
      <ChatInput onSendMessage={mockOnSendMessage} isSending={false} onCancelStream={mockOnCancelStream} />
    );
    expect(screen.getByTestId('knowledge-picker-mock')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('输入消息... (Shift+Enter 换行)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /发送消息/i })).toBeInTheDocument(); // SendOutlined
    // Check for multimodal placeholder button
    expect(screen.getByRole('button', { name: /paper clip/i })).toBeInTheDocument(); // PaperClipOutlined
    expect(screen.getByRole('button', { name: /paper clip/i })).toBeDisabled();
  });

  it('calls onSendMessage with input value and knowledge_id when send button is clicked', () => {
    // Simulate a knowledge source being selected
    (useRagStore as any).mockReturnValue({
      selectedSourceId: mockSelectedKnowledgeId,
    });

    renderWithAntD(
      <ChatInput onSendMessage={mockOnSendMessage} isSending={false} />
    );

    const textArea = screen.getByPlaceholderText('输入消息... (Shift+Enter 换行)');
    fireEvent.change(textArea, { target: { value: 'Hello there!' } });

    const sendButton = screen.getByRole('button', { name: /发送消息/i });
    fireEvent.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith('Hello there!', { knowledge_id: mockSelectedKnowledgeId });
    expect(textArea).toHaveValue(''); // Input should clear after send
  });

  it('calls onSendMessage without knowledge_id if none is selected', () => {
    // Ensure no knowledge source is selected (default mock behavior)
    renderWithAntD(
        <ChatInput onSendMessage={mockOnSendMessage} isSending={false} />
      );
      const textArea = screen.getByPlaceholderText('输入消息... (Shift+Enter 换行)');
      fireEvent.change(textArea, { target: { value: 'Test message' } });
      fireEvent.click(screen.getByRole('button', { name: /发送消息/i }));
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message', { knowledge_id: undefined });
  });


  it('disables send button when input is empty or only whitespace', () => {
    renderWithAntD(
      <ChatInput onSendMessage={mockOnSendMessage} isSending={false} />
    );
    expect(screen.getByRole('button', { name: /发送消息/i })).toBeDisabled();

    const textArea = screen.getByPlaceholderText('输入消息... (Shift+Enter 换行)');
    fireEvent.change(textArea, { target: { value: '   ' } }); // Input with only spaces
    expect(screen.getByRole('button', { name: /发送消息/i })).toBeDisabled();
  });

  it('shows Stop button when isSending is true and onCancelStream is provided', () => {
    renderWithAntD(
      <ChatInput onSendMessage={mockOnSendMessage} isSending={true} onCancelStream={mockOnCancelStream} />
    );
    expect(screen.getByRole('button', { name: /停止生成/i })).toBeInTheDocument(); // StopOutlined
  });

  it('calls onCancelStream when Stop button is clicked', () => {
    renderWithAntD(
      <ChatInput onSendMessage={mockOnSendMessage} isSending={true} onCancelStream={mockOnCancelStream} />
    );
    fireEvent.click(screen.getByRole('button', { name: /停止生成/i }));
    expect(mockOnCancelStream).toHaveBeenCalledTimes(1);
  });

  it('disables input and send button when disabled prop is true', () => {
    renderWithAntD(
      <ChatInput onSendMessage={mockOnSendMessage} isSending={false} disabled={true} />
    );
    expect(screen.getByPlaceholderText('请先选择或创建一个会话')).toBeDisabled();
    expect(screen.getByRole('button', { name: /发送消息/i })).toBeDisabled();
  });

  it('sends message on Enter key press (without Shift)', () => {
    renderWithAntD(
      <ChatInput onSendMessage={mockOnSendMessage} isSending={false} />
    );
    const textArea = screen.getByPlaceholderText('输入消息... (Shift+Enter 换行)');
    fireEvent.change(textArea, { target: { value: 'Enter key test' } });
    fireEvent.keyPress(textArea, { key: 'Enter', code: 'Enter', charCode: 13, shiftKey: false });
    expect(mockOnSendMessage).toHaveBeenCalledWith('Enter key test', { knowledge_id: undefined });
  });

  it('does not send message on Enter key press if disabled', () => {
    renderWithAntD(
      <ChatInput onSendMessage={mockOnSendMessage} isSending={false} disabled={true} />
    );
    const textArea = screen.getByPlaceholderText('请先选择或创建一个会话');
    fireEvent.change(textArea, { target: { value: 'No send' } });
    fireEvent.keyPress(textArea, { key: 'Enter', code: 'Enter', charCode: 13, shiftKey: false });
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });
});
