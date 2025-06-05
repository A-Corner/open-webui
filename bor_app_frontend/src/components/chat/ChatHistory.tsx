import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types/chat'; // Adjust path
import ChatMessageItem from './ChatMessageItem'; // Adjust path
import { Spin, Empty } from 'antd';

interface ChatHistoryProps {
  messages: ChatMessage[];
  isLoading?: boolean; // For initial load or if more history is being fetched
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Scroll to bottom whenever messages change

  if (isLoading && messages.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin tip="Loading chat history..." />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', padding: '20px' }}>
        <Empty description="No messages yet. Start the conversation!" />
        {/* Placeholder for new chat suggestions if any brandingConfig.prompt_suggestions */}
      </div>
    );
  }

  return (
    <div style={{ flexGrow: 1, overflowY: 'auto', padding: '20px' }}>
      {messages.map((msg) => (
        <ChatMessageItem key={msg.id} message={msg} />
      ))}
      <div ref={messagesEndRef} /> {/* Anchor for scrolling to bottom */}
    </div>
  );
};

export default ChatHistory;
