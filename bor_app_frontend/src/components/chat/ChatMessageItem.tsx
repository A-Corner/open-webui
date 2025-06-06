import React, { useState } from 'react';
import { Avatar, Card, Spin, Typography, Alert, Button, Tooltip, Popconfirm, message as AntdMessage, Collapse, List, Tag, Space } from 'antd'; // Added Collapse, List, Tag, Space
import { UserOutlined, RobotOutlined, WarningOutlined, CopyOutlined, EditOutlined, DeleteOutlined, PaperClipOutlined, LinkOutlined } from '@ant-design/icons'; // Added PaperClipOutlined, LinkOutlined
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStore } from '../../store/chatStore';
import { useUserSessionStore } from '../../store/userSessionStore';
import RehypeHighlight from 'rehype-highlight';
// import 'highlight.js/styles/github-dark.css';
import type { ChatMessage } from '../../types/chat';
import type { RetrievedSource } from '../../types/rag'; // Import RetrievedSource type

const { Text, Paragraph } = Typography;

interface ChatMessageItemProps {
  message: ChatMessage;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const { id: messageId, sender, content, timestamp, isLoading, error, retrieved_sources } = message; // Destructure retrieved_sources
  const { startEditMessage, removeMessage } = useChatStore();
  const currentUser = useUserSessionStore(state => state.user);

  const [isEditingThisMessage, setIsEditingThisMessage] = useState(false); // Local state for inline editing UI if implemented here
  const [editedContent, setEditedContent] = useState(content);

  const isUser = sender === 'user';
  const isAssistant = sender === 'assistant';
  // const isSystem = sender === 'system'; // For system messages or errors not tied to assistant turn

  // Determine if the current user is the sender of this message
  // This logic might need adjustment based on how sender ID is stored in message vs currentUser.id
  // For simplicity, we assume 'user' sender type implies it's from the current logged-in user.
  const isCurrentUserSender = isUser; // Simplified assumption

  const avatarIcon = isUser ? <UserOutlined /> : <RobotOutlined />;
  // const finalAvatar = isUser && currentUser?.profile_image_url ? <Avatar src={currentUser.profile_image_url} /> : <Avatar icon={avatarIcon} /> ;
   const finalAvatar = <Avatar icon={avatarIcon} /> ;


  const cardStyle: React.CSSProperties = {
    maxWidth: '85%',
    width: 'fit-content', // Ensures card shrinks to content
    marginLeft: isUser ? 'auto' : '2px', // Slight offset for assistant for visual separation from avatar
    marginRight: isUser ? '2px' : 'auto', // Slight offset for user
    backgroundColor: isUser ? '#dcf8c6' : '#ffffff', // User color similar to WhatsApp
    position: 'relative', // For action buttons positioning
  };

  const timeString = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      AntdMessage.success('内容已复制到剪贴板!');
    } catch (err) {
      AntdMessage.error('复制失败');
      console.error('Failed to copy: ', err);
    }
  };

  const handleEdit = () => {
    // For inline editing, set local state and populate input
    // setIsEditingThisMessage(true);
    // setEditedContent(content);
    // For store-managed editing (simpler for now as per subtask):
    startEditMessage(messageId, content);
    // The actual input field might appear in ChatInput or a modal, triggered by store state.
    // This ChatMessageItem itself won't directly show the TextArea here to avoid complexity.
    AntdMessage.info('请在输入框中编辑消息。'); // Placeholder, actual editing UI is elsewhere
  };

  const handleDelete = () => {
    removeMessage(messageId);
  };

  const messageActions = (
    <Space size="small" style={{ position: 'absolute', top: 2, right: isUser ? -38 : -38, opacity: 0.8, transition: 'opacity 0.2s' }} className="message-actions">
      <Tooltip title="复制">
        <Button type="text" shape="circle" icon={<CopyOutlined />} onClick={handleCopy} size="small" />
      </Tooltip>
      {isCurrentUserSender && !isLoading && ( // Only current user can edit their own, non-loading messages
        <Tooltip title="编辑">
          <Button type="text" shape="circle" icon={<EditOutlined />} onClick={handleEdit} size="small" />
        </Tooltip>
      )}
      {/* Allow deleting user's own messages or all messages based on policy */}
      {/* For now, let's allow deleting own messages */}
      {isCurrentUserSender && !isLoading && (
         <Popconfirm title="确定删除此消息吗?" onConfirm={handleDelete} okText="删除" cancelText="取消">
            <Tooltip title="删除">
              <Button type="text" shape="circle" icon={<DeleteOutlined />} size="small" danger />
            </Tooltip>
        </Popconfirm>
      )}
      {/* Example: Allow deleting assistant messages too */}
      {/* {isAssistant && !isLoading && (
         <Popconfirm title="确定删除此AI回复吗?" onConfirm={handleDelete} okText="删除" cancelText="取消">
            <Tooltip title="删除回复">
              <Button type="text" shape="circle" icon={<DeleteOutlined />} size="small" />
            </Tooltip>
        </Popconfirm>
      )} */}
    </Space>
  );


  // Inline editing UI (simple example, could be a modal or more complex component)
  // if (isEditingThisMessage && isCurrentUserSender) {
  //   return (
  //     // ... UI for editing: TextArea + Save/Cancel buttons ...
  //     // On save: submitEditMessage(editedContent); setIsEditingThisMessage(false);
  //     // On cancel: setIsEditingThisMessage(false); setEditedContent(content);
  //   );
  // }

  return (
    <div style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', marginBottom: '10px', alignItems: 'flex-start', paddingRight: isUser ? 0 : 40, paddingLeft: isUser ? 40 : 0 }} className="message-container">
      <Tooltip title={isUser ? (currentUser?.name || '我') : '助手'}>
        {finalAvatar}
      </Tooltip>
      <Card
        size="small"
        style={cardStyle}
        bodyStyle={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 12 }}
      >
        {messageActions}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
            <Spin size="small" />
            <Text type="secondary" style={{ marginLeft: '8px', fontSize: '0.75em' }}>处理中...</Text>
          </div>
        )}

        {error && (
            <Alert message={error} type="error" showIcon style={{marginTop: '5px', fontSize: '0.85em', padding: '4px 8px'}}/>
        )}

        {/* Display Retrieved Sources */}
        {sender === 'assistant' && retrieved_sources && retrieved_sources.length > 0 && (
          <div style={{ marginTop: '10px', marginBottom: '5px' }}>
            <Collapse size="small" ghost>
              <Collapse.Panel
                header={
                  <Typography.Text type="secondary" style={{ fontSize: '0.85em' }}>
                    <PaperClipOutlined style={{ marginRight: '5px' }} />
                    引用来源 ({retrieved_sources.length} 条)
                  </Typography.Text>
                }
                key="sources"
              >
                <List
                  itemLayout="vertical"
                  dataSource={retrieved_sources}
                  renderItem={(source: RetrievedSource, index: number) => (
                    <List.Item
                      key={source.id || `source-${index}`}
                      style={{ paddingTop: '8px', paddingBottom: '8px' }}
                    >
                      <List.Item.Meta
                        title={
                          <Space size="small" wrap>
                            <Tag color="blue">来源 {index + 1}</Tag>
                            {source.name ? (
                              <Typography.Text strong style={{ fontSize: '0.9em' }}>
                                {source.name}
                              </Typography.Text>
                            ) : (
                              <Typography.Text type="secondary" italic style={{ fontSize: '0.9em' }}>未知来源</Typography.Text>
                            )}
                            {source.url && (
                              <Tooltip title={`打开链接: ${source.url}`}>
                                <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9em', marginLeft: '5px' }}>
                                  <LinkOutlined />
                                </a>
                              </Tooltip>
                            )}
                          </Space>
                        }
                        description={
                          source.content_snippet && (
                            <Typography.Paragraph
                              ellipsis={{ rows: 3, expandable: true, symbol: '更多' }}
                              type="secondary"
                              style={{ fontSize: '0.85em', whiteSpace: 'pre-wrap', margin: 0 }}
                            >
                              {source.content_snippet}
                            </Typography.Paragraph>
                          )
                        }
                      />
                      {typeof source.score === 'number' && ( // Optional: display score
                        <div style={{ fontSize: '0.8em', color: '#888', marginTop: '4px' }}>
                          相关性得分: {source.score.toFixed(4)}
                        </div>
                      )}
                    </List.Item>
                  )}
                  size="small"
                />
              </Collapse.Panel>
            </Collapse>
          </div>
        )}

        <Text type="secondary" style={{ fontSize: '0.7em', alignSelf: 'flex-end', marginTop: '5px', display: 'block', textAlign: isUser ? 'right': 'left' }}>
          {timeString}
        </Text>
      </Card>
    </div>
  );
};

export default ChatMessageItem;
