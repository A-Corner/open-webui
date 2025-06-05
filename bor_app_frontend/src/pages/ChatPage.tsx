// bor_app_frontend/src/pages/ChatPage.tsx (修改部分)
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Spin, Alert, Button, Space, Typography, Empty } from 'antd'; // Select and Option removed as ModelSelector handles it
import ChatHistory from '../components/chat/ChatHistory';
import ChatInput from '../components/chat/ChatInput';
import ModelSelector from '../components/chat/ModelSelector'; // Import ModelSelector
import TemperatureSlider from '../components/chat/TemperatureSlider'; // Import TemperatureSlider
import { useChatStore } from '../store/chatStore';
import { useSessionStore } from '../store/sessionStore';
import type { ChatOptions } from '../types/chat'; // To type options in handleSendMessage

const { Content } = Layout;
// const { Option } = Select; // No longer needed here

const ChatPage: React.FC = () => {
  const { chatId: chatIdFromUrl } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();

  // Chat Store
  const messages = useChatStore(state => state.messages);
  const sendMessageToStore = useChatStore(state => state.sendMessage);
  const clearChatInStore = useChatStore(state => state.clearChat);
  const isLoadingMessages = useChatStore(state => state.isLoadingMessages);
  const isSending = useChatStore(state => state.isSending);
  const chatError = useChatStore(state => state.error);
  const cancelStream = useChatStore(state => state.cancelStream);

  // Session Store
  const activeSessionId = useSessionStore(state => state.activeSessionId);
  const setActiveSession = useSessionStore(state => state.setActiveSession);
  const createNewSession = useSessionStore(state => state.createNewSession); // For creating new session on empty state
  const sessions = useSessionStore(state => state.sessions);
  const isLoadingSessions = useSessionStore(state => state.isLoading);

  // Chat Store - specific model/temp selectors are not needed here if ChatInput passes them through options
  // and chatStore.sendMessage internally uses its own selectedModelId and currentTemperature.
  // However, if ChatPage itself needs to display the current model/temp, then they can be selected.
  // For now, ModelSelector and TemperatureSlider will get values directly from chatStore.

  // When URL's chatId changes, or activeSessionId from store changes, sync them.
  useEffect(() => {
    if (chatIdFromUrl) {
      if (chatIdFromUrl !== activeSessionId) {
        // Check if chatIdFromUrl is a valid session before activating
        if (sessions.find(s => s.id === chatIdFromUrl)) {
          setActiveSession(chatIdFromUrl);
        } else if (!isLoadingSessions && sessions.length > 0) {
          // If URL ID is invalid and sessions are loaded, go to a valid one (e.g., first)
          // This handles cases where user navigates to a non-existent chat ID
          navigate(`/chat/${sessions[0].id}`, { replace: true });
        } else if (!isLoadingSessions && sessions.length === 0 && activeSessionId) {
            // If URL ID is invalid, no sessions loaded, but there was an active one (e.g. from localStorage)
            // that is now gone, navigate to root or create new.
            // For now, let sessionStore's fetch logic handle setting a new active ID if needed.
            // Or, if activeSessionId is null because sessions are empty:
             navigate(`/chat`, { replace: true }); // Go to base chat, will show Empty state or create new
        }
        // If sessions are still loading, wait for them to load before redirecting.
      }
    } else if (activeSessionId) {
      // If no chatId in URL, but there's an active session, navigate to it
      navigate(`/chat/${activeSessionId}`, { replace: true });
    } else if (!isLoadingSessions && sessions.length > 0 && !activeSessionId) {
        // Sessions loaded, no URL param, no active ID yet -> activate the first session
        setActiveSession(sessions[0].id);
        // navigate(`/chat/${sessions[0].id}`, { replace: true }); // setActiveSession will trigger this if it's different
    }
    // If !isLoadingSessions and sessions.length === 0 and !activeSessionId, it will fall through to the Empty state render.

  }, [chatIdFromUrl, activeSessionId, setActiveSession, sessions, navigate, isLoadingSessions]);


  const handleSendMessage = (input: string, options?: ChatOptions) => { // Accept options from ChatInput
    if (!activeSessionId) {
      console.error("没有活动的会话来发送消息。");
      // Optionally, create a new session here if none is active, then send.
      // This might involve awaiting createNewSession and then calling sendMessageToStore.
      // For now, ChatInput should be disabled if !activeSessionId.
      return;
    }
    const currentMessagesForHistory = [...messages]; // Get current messages for history
    // Options from ChatInput (e.g., knowledge_id) are passed through.
    // chatStore.sendMessage will internally use its own selectedModelId and currentTemperature.
    sendMessageToStore(input, options, currentMessagesForHistory);
  };

  const handleClearChat = () => {
    if (activeSessionId) {
      clearChatInStore();
      // Note: This only clears local UI. If backend needs to clear messages, an API call is needed.
      // Example: deleteMessagesForSession(activeSessionId);
    }
  };

  if (isLoadingSessions && !activeSessionId && sessions.length === 0) {
      return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}><Spin size="large" tip="加载会话中..." /></div>;
  }

  if (!activeSessionId && !isLoadingSessions && sessions.length === 0) {
    return (
        <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
            <Empty description="没有会话。开始一个新的聊天吧！" />
            <Button type="primary" style={{marginTop: 16}} onClick={() => createNewSession('新会话')}>开始新聊天</Button>
        </div>
    );
  }

  // If there's no active session ID but sessions ARE loaded, it might mean URL is base /chat
  // and useEffect is about to redirect. Show loading or a gentle message.
  if (!activeSessionId && !isLoadingSessions && sessions.length > 0) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}><Spin size="default" tip="选择会话中..." /></div>;
  }

  // If activeSessionId is set, but messages are still loading for it:
  if (activeSessionId && isLoadingMessages) {
     return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}><Spin size="large" tip="加载消息中..." /></div>;
  }


  return (
    <Layout style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Content style={{ padding: '0', flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar for Model, Temperature, and other controls */}
        <div
          style={{
            padding: '10px 15px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            flexWrap: 'wrap', // Allow wrapping on smaller screens
            alignItems: 'center',
            gap: '15px' // Spacing between items
          }}
        >
          <ModelSelector />
          <TemperatureSlider />
          <div style={{ flexGrow: 1, display:'flex', justifyContent:'flex-end'}}> {/* Pushes clear button to the right */}
            <Button onClick={handleClearChat} danger disabled={isSending || messages.length === 0 || !activeSessionId}>
              清空当前会话
            </Button>
          </div>
        </div>

        {chatError && <Alert message={`聊天错误: ${chatError}`} type="error" closable style={{ margin: '10px 15px 0' }} />}

        <ChatHistory messages={messages} isLoading={isSending && messages[messages.length -1]?.isLoading === true } />

        <div style={{ padding: '10px 20px', borderTop: '1px solid #f0f0f0' }}>
          <ChatInput
            onSendMessage={handleSendMessage}
            isSending={isSending}
            onCancelStream={cancelStream}
            disabled={!activeSessionId || isLoadingMessages} // Disable input if no active session or messages are loading
          />
        </div>
      </Content>
    </Layout>
  );
};

export default ChatPage;
