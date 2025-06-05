import React, { useState, useRef } from 'react';
import { Input, Button, Tooltip, Upload } from 'antd'; // Removed Space, using gap style. Added Upload
import { SendOutlined, StopOutlined, PaperClipOutlined } from '@ant-design/icons'; // Added PaperClipOutlined
import KnowledgePicker from '../rag/KnowledgePicker';
import { useRagStore } from '../../store/ragStore';
import type { ChatOptions } from '../../types/chat'; // To type the options for onSendMessage

const { TextArea } = Input;

interface ChatInputProps {
  onSendMessage: (message: string, options?: ChatOptions) => void; // Modified to accept options
  onCancelStream?: () => void;
  isSending: boolean;
  disabled?: boolean; // Added disabled prop for overall control (e.g. when !activeSessionId)
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onCancelStream,
  isSending,
  disabled = false, // Default to false
}) => {
  const [inputValue, setInputValue] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null); // Corrected type for AntD TextArea ref if needed, though likely not strictly necessary for focus.
                                                    // AntD's TextArea ref might be InputRef from 'antd/es/input/Input' for full methods.
                                                    // For basic focus, HTMLTextAreaElement is okay.

  const selectedSourceId = useRagStore(state => state.selectedSourceId); // 获取选中的知识源ID

  const handleSend = () => {
    const message = inputValue.trim();
    if (message) {
      const chatOpts: ChatOptions = {};
      if (selectedSourceId) {
        chatOpts.knowledge_id = selectedSourceId;
      }
      onSendMessage(message, chatOpts);
      setInputValue('');
      // textAreaRef.current?.focus(); // Optional: re-focus after send
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) { // Also check disabled here
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '10px 0px' }}>
      <Tooltip title="图片上传功能即将推出">
        <Upload beforeUpload={() => false} showUploadList={false} disabled>
          <Button icon={<PaperClipOutlined />} disabled />
        </Upload>
      </Tooltip>
      <KnowledgePicker />
      <TextArea
        ref={textAreaRef as any}
        value={inputValue}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder={disabled ? "请先选择或创建一个会话" : "输入消息... (Shift+Enter 换行)"}
        autoSize={{ minRows: 1, maxRows: 5 }}
        disabled={disabled || (isSending && !onCancelStream)}
        style={{ flexGrow: 1 }}
      />

      {isSending && onCancelStream ? (
        <Tooltip title="停止生成">
          <Button icon={<StopOutlined />} onClick={onCancelStream} danger disabled={disabled} />
        </Tooltip>
      ) : (
        <Tooltip title="发送消息">
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={isSending}
            disabled={disabled || !inputValue.trim()}
          />
        </Tooltip>
      )}
    </div>
  );
};

export default ChatInput;
