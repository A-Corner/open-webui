import React, { useEffect } from 'react';
import { Button, Spin, Empty, Alert, Input, Space } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import SessionItem from './SessionItem'; // Adjust path
import { useSessionStore } from '../../store/sessionStore'; // Adjust path
// import { useChatStore } from '../../store/chatStore'; // To create a new chat session in chatStore too

// 中文注释：会话列表组件

const SessionList: React.FC = () => {
  const {
    sessions,
    activeSessionId,
    fetchSessions,
    createNewSession, // From sessionStore
    isLoadingSessions,
    errorSessions,
    setActiveSessionId, // To select first after creation if needed
  } = useSessionStore();

  // const createNewChatInChatStore = useChatStore(state => state.createNewSession); // From chatStore

  useEffect(() => {
    fetchSessions(); // Load sessions when component mounts
  }, [fetchSessions]);

  const handleCreateNewSession = async () => {
    const newSession = await createNewSession('New Chat'); // sessionStore creates and activates
    // createNewChatInChatStore(newSession.id); // chatStore new session logic is called by sessionStore.setActiveSessionId
  };

  if (isLoadingSessions && sessions.length === 0) {
    // Changed tip to Chinese
    return <div style={{ textAlign: 'center', padding: '20px' }}><Spin tip="加载会话中..." /></div>;
  }

  if (errorSessions) {
    return (
      <Alert
        message="加载会话失败"
        description={errorSessions}
        type="error"
        showIcon
        style={{ margin: '10px' }}
        action={
          <Button size="small" type="primary" onClick={fetchSessions} loading={isLoadingSessions}>
            重试
          </Button>
        }
      />
    );
  }

  // TODO: Implement search/filter for sessions if needed
  // const [searchTerm, setSearchTerm] = useState('');
  // const filteredSessions = sessions.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredSessions = sessions; // For now, no local filtering

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid #f0f0f0' }}>
      <div style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>
        {/* Optional: Search input for sessions
        <Input
          placeholder="Search chats..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ marginBottom: '10px' }}
          allowClear
        />
        */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateNewSession}
          block
          loading={isLoadingSessions} // Or a specific isCreatingSession state from store
        >
          新建聊天
        </Button>
      </div>
      <div style={{ flexGrow: 1, overflowY: 'auto' }}>
        {filteredSessions.length === 0 && !isLoadingSessions ? (
          // Changed description to Chinese
          <Empty description="暂无会话，开始新的聊天吧！" style={{ marginTop: '20px'}} />
        ) : (
          filteredSessions.map(session => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SessionList;
