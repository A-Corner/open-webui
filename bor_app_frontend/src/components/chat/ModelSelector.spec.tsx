// bor_app_frontend/src/components/chat/ModelSelector.spec.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ConfigProvider, theme as antdTheme } from 'antd';
import ModelSelector from './ModelSelector';
import { useChatStore } from '../../store/chatStore';
import type { ChatModelResponse } from '../../types/models';

// Mock chatStore
vi.mock('../../store/chatStore');

const mockFetchAvailableChatModels = vi.fn();
const mockSetSelectedModelId = vi.fn();

const mockModels: ChatModelResponse[] = [
  { id: 'ollama/llama3', name: 'Llama 3 (Ollama)', provider: 'ollama', description: 'Latest Llama model' },
  { id: 'openai/gpt-4', name: 'GPT-4 (OpenAI)', provider: 'openai_compatible', description: 'Powerful OpenAI model' },
  { id: 'ollama/mistral', name: 'Mistral (Ollama)', provider: 'ollama' },
];

// Helper to render with AntD ConfigProvider
const renderWithAntD = (component: React.ReactElement) => {
  return render(
    <ConfigProvider theme={{ algorithm: antdTheme.defaultAlgorithm }}>
      {component}
    </ConfigProvider>
  );
};

describe('ModelSelector', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (useChatStore as any).mockReturnValue({
      availableModels: [],
      selectedModelId: null,
      isLoadingModels: false,
      errorModels: null,
      fetchAvailableChatModels: mockFetchAvailableChatModels,
      setSelectedModelId: mockSetSelectedModelId,
    });
  });

  it('calls fetchAvailableChatModels on initial render if models are empty and no error', () => {
    renderWithAntD(<ModelSelector />);
    expect(mockFetchAvailableChatModels).toHaveBeenCalledTimes(1);
  });

  it('does not call fetchAvailableChatModels if models are present', () => {
    (useChatStore as any).mockReturnValue({
        ...useChatStore(),
        availableModels: mockModels,
        fetchAvailableChatModels: mockFetchAvailableChatModels,
      });
    renderWithAntD(<ModelSelector />);
    expect(mockFetchAvailableChatModels).not.toHaveBeenCalled();
  });


  it('displays loading state', () => {
    (useChatStore as any).mockReturnValue({ ...useChatStore(), isLoadingModels: true, fetchAvailableChatModels: mockFetchAvailableChatModels });
    renderWithAntD(<ModelSelector />);
    expect(screen.getByText('加载中...')).toBeInTheDocument(); // from notFoundContent when loading
  });

  it('displays error message', async () => {
    const errorMsg = "Failed to load models";
    (useChatStore as any).mockReturnValue({ ...useChatStore(), errorModels: errorMsg, fetchAvailableChatModels: mockFetchAvailableChatModels });
    renderWithAntD(<ModelSelector />);
    // Tooltip shows the error
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-label', `加载模型错误: ${errorMsg}`); // Assuming placeholder or aria-label reflects error
  });

  it('renders model options grouped by provider and allows selection', async () => {
    (useChatStore as any).mockReturnValue({
      ...useChatStore(),
      availableModels: mockModels,
      fetchAvailableChatModels: mockFetchAvailableChatModels,
      setSelectedModelId: mockSetSelectedModelId,
    });
    renderWithAntD(<ModelSelector />);

    fireEvent.mouseDown(screen.getByRole('combobox')); // Open dropdown

    // Check for group labels (OptGroup)
    await waitFor(() => expect(screen.getByText('OLLAMA')).toBeInTheDocument()); // Provider name in uppercase
    expect(screen.getByText('OPENAI_COMPATIBLE')).toBeInTheDocument();

    // Check for model names
    expect(screen.getByText('Llama 3 (Ollama)')).toBeInTheDocument();
    expect(screen.getByText('GPT-4 (OpenAI)')).toBeInTheDocument();
    expect(screen.getByText('Mistral (Ollama)')).toBeInTheDocument();

    // Select a model
    fireEvent.click(screen.getByText('Llama 3 (Ollama)'));
    expect(mockSetSelectedModelId).toHaveBeenCalledWith('ollama/llama3');
  });

  it('shows selected model and allows clearing if selectedModelId is not null', () => {
    (useChatStore as any).mockReturnValue({
      ...useChatStore(),
      availableModels: mockModels,
      selectedModelId: 'ollama/llama3', // A model is selected
      fetchAvailableChatModels: mockFetchAvailableChatModels,
      setSelectedModelId: mockSetSelectedModelId,
    });
    renderWithAntD(<ModelSelector />);

    // The Select component should display the name of the selected model
    expect(screen.getByText('Llama 3 (Ollama)')).toBeInTheDocument();

    // Check if clear button is present (AntD Select adds a clear icon)
    const clearButton = screen.getByRole('img', { name: 'close-circle' }); // AntD's clear icon
    expect(clearButton).toBeInTheDocument();
    fireEvent.click(clearButton);
    expect(mockSetSelectedModelId).toHaveBeenCalledWith(null);
  });

  it('shows placeholder when no model is selected', () => {
    (useChatStore as any).mockReturnValue({
        ...useChatStore(),
        availableModels: mockModels, // Models are available
        selectedModelId: null,       // But none is selected
        fetchAvailableChatModels: mockFetchAvailableChatModels,
      });
    renderWithAntD(<ModelSelector />);
    expect(screen.getByText('选择模型')).toBeInTheDocument(); // Placeholder text
  });
});
