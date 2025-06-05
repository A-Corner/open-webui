import React from 'react';
import { Typography, Button, Space, Popconfirm, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'; // EditOutlined for future title edit
import type { Session } from '../../types/session'; // Adjust path
import { useSessionStore } from '../../store/sessionStore'; // Adjust path
import dayjs from 'dayjs'; // For formatting dates, ensure dayjs is installed
import relativeTime from 'dayjs/plugin/relativeTime'; // For "time ago" formatting

dayjs.extend(relativeTime);

interface SessionItemProps {
  session: Session;
  isActive: boolean;
}

const SessionItem: React.FC<SessionItemProps> = ({ session, isActive }) => {
  const setActiveSessionId = useSessionStore(state => state.setActiveSessionId);
  const deleteSession = useSessionStore(state => state.deleteSession);
  // const { isLoadingSessions } = useSessionStore(state => ({isLoadingSessions: state.isLoadingSessions}));


  const handleSelectSession = () => {
    if (!isActive) {
      setActiveSessionId(session.id);
    }
  };

  const handleDeleteSession = (e?: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation(); // Prevent selecting session when delete is clicked
    // Consider adding a loading state specific to this item or using a global one
    deleteSession(session.id);
  };

  // Determine how to display updatedAt - e.g., "5 minutes ago", "Yesterday", "YYYY-MM-DD"
  const displayTime = () => {
    const now = dayjs();
    const updatedAt = dayjs(session.updated_at);
    if (now.diff(updatedAt, 'hour') < 1) return updatedAt.fromNow(); // "X minutes ago"
    if (now.isSame(updatedAt, 'day')) return updatedAt.format('HH:mm'); // "14:30"
    if (now.subtract(1, 'day').isSame(updatedAt, 'day')) return 'Yesterday'; // "Yesterday"
    return updatedAt.format('YYYY-MM-DD');
  };

  return (
    <div
      onClick={handleSelectSession}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectSession(); }}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      style={{
        padding: '10px 12px',
        cursor: 'pointer',
        backgroundColor: isActive ? '#e6f7ff' : 'transparent', // Example active color
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        outlineOffset: '-2px', // For focus visibility
      }}
      className={`session-item ${isActive ? 'session-item-active' : ''} hover:bg-gray-100 dark:hover:bg-gray-800`}
    >
      <div style={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <Tooltip title={session.title} placement="topLeft">
          <Typography.Text strong style={{ display: 'block' }} ellipsis>
            {session.title}
          </Typography.Text>
        </Tooltip>
        <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
          {displayTime()}
        </Typography.Text>
      </div>
      <Space style={{ marginLeft: '8px' }}>
        {/* Placeholder for Edit Title button
        <Tooltip title="Rename session">
          <Button size="small" shape="circle" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); alert('Edit title TBD');}} />
        </Tooltip>
        */}
        <Tooltip title="Delete session">
          <Popconfirm
            title="Delete this chat session?"
            description="This action cannot be undone."
            onConfirm={handleDeleteSession}
            onCancel={(e) => e?.stopPropagation()}
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
            placement="topRight"
          >
            <Button
              size="small"
              danger
              shape="circle"
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()} // Prevent Popconfirm from triggering select
              // loading={isLoadingSessions} // This would be a global loading, not item-specific
            />
          </Popconfirm>
        </Tooltip>
      </Space>
    </div>
  );
};

export default SessionItem;
