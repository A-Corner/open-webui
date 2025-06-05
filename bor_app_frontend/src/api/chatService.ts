import { appAxiosInstance } from './axiosInstance'; // Ensure axiosInstance is configured for the app
import type {
  ChatMessage,
  ChatOptions,
  ChatCompletionRequestBody,
  ChatCompletionResponseMessage,
  ChatStreamChunk, // For parsing stream
} from '../types/chat'; // From the new types file

// Base URL for chat related APIs - assumes v1 for now as per plan for app frontend
const CHAT_API_BASE_URL_V1 = '/api/v1/chats';

/**
 * Sends a chat message and gets a non-streaming response.
 * @param historyMessages - Array of previous messages (sender and content only).
 * @param userInput - The latest input from the user.
 * @param options - Chat options like model, temperature, knowledge_id.
 * @returns A ChatMessage object for the assistant's reply.
 */
export const sendChatMessage = async (
  historyMessages: Pick<ChatMessage, 'sender' | 'content'>[],
  userInput: string,
  options?: ChatOptions,
): Promise<ChatMessage> => {
  const requestBody: ChatCompletionRequestBody = {
    model: options?.model,
    messages: [
      ...historyMessages.map(msg => ({ role: msg.sender, content: msg.content })),
      { role: 'user', content: userInput },
    ],
    stream: false,
    knowledge_id: options?.knowledge_id || undefined, // Added knowledge_id
    // temperature: options?.temperature, // Add other options if supported by backend
  };

  try {
    // Assuming backend endpoint is /api/v1/chats (POST) handles both stream/non-stream based on 'stream' flag
    // or a more specific endpoint like /api/v1/chats/completions
    const response = await appAxiosInstance.post<ChatCompletionResponseMessage>( // Assuming direct response, not nested under 'message'
      `${CHAT_API_BASE_URL_V1}`, // Using base /chats as per typical simple API design
      requestBody,
    );

    const assistantMsgData = response.data; // Assuming direct response

    return {
      id: Date.now().toString(), // Consider generating UUID or using ID from backend if available
      sender: 'assistant',
      content: assistantMsgData.content,
      timestamp: Date.now(),
      isLoading: false,
    };
  } catch (error: any) {
    console.error('Chat API request error (non-streaming):', error);
    const detail = error.response?.data?.detail || error.message || 'Failed to send message.';
    throw new Error(detail);
  }
};

/**
 * Sends a chat message and handles a streaming response.
 * @param historyMessages - Array of previous messages.
 * @param userInput - The latest input from the user.
 * @param callbacks - Object with onChunk, onComplete, onError callbacks.
 * @param options - Chat options including knowledge_id.
 * @returns AbortController to allow aborting the stream.
 */
export const sendChatMessageStream = (
  historyMessages: Pick<ChatMessage, 'sender' | 'content'>[],
  userInput: string,
  callbacks: {
    onChunk: (contentDelta: string) => void;
    onComplete: () => void;
    onError: (error: Error) => void;
    onStreamOpen?: () => void; // Optional: Called when stream connection is established
  },
  options?: ChatOptions,
): AbortController => {
  const controller = new AbortController();
  const { signal } = controller;

  const requestBody: ChatCompletionRequestBody = {
    model: options?.model,
    messages: [
      ...historyMessages.map(msg => ({ role: msg.sender, content: msg.content })),
      { role: 'user', content: userInput },
    ],
    stream: true,
    knowledge_id: options?.knowledge_id || undefined, // Added knowledge_id
  };

  const tokenItem = localStorage.getItem('bor-app-user-session'); // Adjusted key if it changed for userSessionStore
  let authToken = '';
  if (tokenItem) {
    try {
      const parsedTokenItem = JSON.parse(tokenItem);
      authToken = parsedTokenItem?.state?.token || ''; // Ensure path to token is correct
    } catch (e) {
      console.error("Failed to parse token from localStorage", e);
    }
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ""; // VITE_API_BASE_URL should include /api/v1 prefix or not, consistently
  // Ensure streamUrl correctly points to the streaming endpoint.
  // If VITE_API_BASE_URL is just "http://localhost:8000", then need "/api/v1" prefix.
  // If VITE_API_BASE_URL is "http://localhost:8000/api/v1", then it's fine.
  // Assuming CHAT_API_BASE_URL_V1 ('/api/v1/chats') is the correct base path for chat operations.
  const streamUrl = `${apiBaseUrl}${CHAT_API_BASE_URL_V1}`;

  fetch(streamUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(requestBody),
    signal,
  })
  .then(async response => {
    if (callbacks.onStreamOpen) {
        callbacks.onStreamOpen();
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    const processText = async ({ done, value }: ReadableStreamReadResult<Uint8Array>): Promise<void> => {
      if (done) {
        // Process any remaining buffer content
        if (buffer.trim()) {
            try {
                // Attempt to parse if it's a complete JSON object, otherwise might be partial
                // This simplified parser might not handle all edge cases of abruptly ended streams.
                const parsedChunk: ChatStreamChunk = JSON.parse(buffer.trim());
                const contentDelta = parsedChunk.message?.content || parsedChunk.choices?.[0]?.delta?.content;
                if (contentDelta) callbacks.onChunk(contentDelta);
            } catch (e) {
                // console.warn('Remaining buffer not valid JSON, or stream ended mid-object:', buffer, e);
            }
        }
        callbacks.onComplete();
        return;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process buffer line by line for SSE
      let lineEndIndex;
      while ((lineEndIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, lineEndIndex).trim();
        buffer = buffer.slice(lineEndIndex + 1);

        if (line.startsWith('data: ')) {
          const jsonData = line.substring(5).trim();
          if (jsonData === '[DONE]') { // OpenAI specific end signal
            callbacks.onComplete();
            return; // Stop processing
          }
          if (jsonData) {
            try {
              const parsedChunk: ChatStreamChunk = JSON.parse(jsonData);

              let contentDelta = "";
              if (parsedChunk.message?.content) { // Ollama
                contentDelta = parsedChunk.message.content;
              } else if (parsedChunk.choices && parsedChunk.choices[0]?.delta?.content) { // OpenAI
                contentDelta = parsedChunk.choices[0].delta.content;
              }

              if (contentDelta) {
                callbacks.onChunk(contentDelta);
              }

              if (parsedChunk.done || (parsedChunk.choices && parsedChunk.choices[0]?.finish_reason)) {
                callbacks.onComplete();
                // If there's a possibility of more data in 'value' after a 'done' or 'finish_reason' chunk,
                // this 'return' might be too early. However, typical SSE parsers process one event at a time.
                // For robust SSE, one would fully parse each "event" delimited by double newlines.
                return;
              }
            } catch (e) {
              console.warn('Stream chunk JSON parsing error:', e, 'Raw line data:', jsonData);
            }
          }
        }
        // If line is empty, it might be the end of an SSE event (double newline)
        // This basic parser doesn't explicitly handle event boundaries via double newlines,
        // but relies on each `data:` line being a self-contained JSON.
      }
      return reader.read().then(processText);
    };
    return reader.read().then(processText);
  })
  .catch(error => {
    if (error.name === 'AbortError') {
      console.log('Chat stream request aborted by user.');
      callbacks.onComplete();
      return;
    }
    console.error('Chat stream API error:', error);
    callbacks.onError(new Error(error.message || 'Failed to send streaming message.'));
  });

  return controller;
};

// Default export of all functions, or an object
// For consistency with other services, can export individually or as an object.
// The subtask doesn't specify, but previous stores used named imports.
// However, chatStore used `import chatService from ...` before.
// Let's keep the default export for now as it was.

const chatService = {
  sendChatMessage,
  sendChatMessageStream,
  editChatMessage,
  deleteChatMessage,
};

export default chatService;


// 中文注释：编辑聊天消息
export const editChatMessage = async (
  chatId: string,
  messageId: string,
  newContent: string
): Promise<ChatMessage> => {
  try {
    const response = await appAxiosInstance.put<ChatMessage>(
      `${CHAT_API_BASE_URL_V1}/${chatId}/messages/${messageId}`,
      { new_content: newContent }
    );
    // Assuming the backend returns the updated ChatMessage object
    return response.data;
  } catch (error: any) {
    console.error(`编辑消息 ${messageId} 错误:`, error);
    throw new Error(error.response?.data?.detail || '编辑消息失败');
  }
};

// 中文注释：删除聊天消息
export const deleteChatMessage = async (
  chatId: string,
  messageId: string
): Promise<void> => {
  try {
    await appAxiosInstance.delete(
      `${CHAT_API_BASE_URL_V1}/${chatId}/messages/${messageId}`
    );
  } catch (error: any) {
    console.error(`删除消息 ${messageId} 错误:`, error);
    throw new Error(error.response?.data?.detail || '删除消息失败');
  }
};
