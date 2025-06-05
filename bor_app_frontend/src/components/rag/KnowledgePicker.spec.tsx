// bor_app_frontend/src/components/rag/KnowledgePicker.spec.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useRagStore } from '../../store/ragStore';
import KnowledgePicker from './KnowledgePicker';
import type { SelectableKnowledgeSource } from '../../types/knowledge';
import { ConfigProvider, theme as antdTheme } from 'antd';

// Mock ragStore
vi.mock('../../store/ragStore');

const mockFetchAvailableSources = vi.fn();
const mockSetSelectedSourceId = vi.fn();

const mockSources: SelectableKnowledgeSource[] = [
  { id: 'src1', name: 'Knowledge Base Alpha', type: 'collection', description: 'Alpha description' },
  { id: 'src2', name: 'Documents Beta', type: 'collection', description: 'Beta description' },
];

// Helper to render with AntD ConfigProvider
const renderWithAntD = (component: React.ReactElement) => {
  return render(
    <ConfigProvider theme={{ algorithm: antdTheme.defaultAlgorithm }}>
      {component}
    </ConfigProvider>
  );
};

describe('KnowledgePicker', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (useRagStore as any).mockReturnValue({
      availableSources: [],
      selectedSourceId: null,
      isLoadingSources: false,
      errorSources: null,
      fetchAvailableSources: mockFetchAvailableSources,
      setSelectedSourceId: mockSetSelectedSourceId,
    });
  });

  it('calls fetchAvailableSources on initial render if sources are empty', () => {
    renderWithAntD(<KnowledgePicker />);
    expect(mockFetchAvailableSources).toHaveBeenCalledTimes(1);
  });

  it('does not call fetchAvailableSources if sources are already present', () => {
    (useRagStore as any).mockReturnValue({
        ...useRagStore(),
        availableSources: mockSources, // Sources are present
        fetchAvailableSources: mockFetchAvailableSources,
      });
    renderWithAntD(<KnowledgePicker />);
    expect(mockFetchAvailableSources).not.toHaveBeenCalled();
  });


  it('displays loading state when isLoadingSources is true', () => {
    (useRagStore as any).mockReturnValue({
      ...useRagStore(),
      isLoadingSources: true,
      fetchAvailableSources: mockFetchAvailableSources,
    });
    renderWithAntD(<KnowledgePicker />);
    // AntD Select shows "Loading..." text or a spinner within its structure
    // We can check for the placeholder text or presence of spinner class
    expect(screen.getByText('加载中...')).toBeInTheDocument(); // Or check for AntD spinner class
  });

  it('displays "无可用知识库" when no sources and not loading', () => {
    (useRagStore as any).mockReturnValue({
      ...useRagStore(),
      availableSources: [],
      isLoadingSources: false,
      fetchAvailableSources: mockFetchAvailableSources,
    });
    renderWithAntD(<KnowledgePicker />);
    // Open the select to see the notFoundContent
    fireEvent.mouseDown(screen.getByRole('combobox')); // Open the dropdown
    expect(screen.getByText('无可用知识库')).toBeInTheDocument();
  });

  it('displays error message if errorSources is present', async () => {
    const errorMsg = "Failed to load";
    (useRagStore as any).mockReturnValue({
      ...useRagStore(),
      availableSources: [],
      isLoadingSources: false,
      errorSources: errorMsg,
      fetchAvailableSources: mockFetchAvailableSources,
    });
    renderWithAntD(<KnowledgePicker />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    await screen.findByText(`加载失败: ${errorMsg}`); // For notFoundContent with error
  });


  it('renders available sources in dropdown and allows selection', async () => {
    (useRagStore as any).mockReturnValue({
      ...useRagStore(),
      availableSources: mockSources,
      fetchAvailableSources: mockFetchAvailableSources,
      setSelectedSourceId: mockSetSelectedSourceId,
    });
    renderWithAntD(<KnowledgePicker />);

    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox); // Open dropdown

    // Wait for options to appear
    await waitFor(() => expect(screen.getByText(mockSources[0].name)).toBeInTheDocument());
    expect(screen.getByText(mockSources[1].name)).toBeInTheDocument();

    // Click on the first source
    fireEvent.click(screen.getByText(mockSources[0].name));
    expect(mockSetSelectedSourceId).toHaveBeenCalledWith(mockSources[0].id);
  });

  it('displays selected source as a Tag and allows clearing it', () => {
    (useRagStore as any).mockReturnValue({
      ...useRagStore(),
      availableSources: mockSources,
      selectedSourceId: 'src1', // src1 is selected
      fetchAvailableSources: mockFetchAvailableSources,
      setSelectedSourceId: mockSetSelectedSourceId,
    });
    renderWithAntD(<KnowledgePicker />);

    // Tag should be visible with the name of the selected source
    expect(screen.getByText(mockSources[0].name)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'book' })).toBeInTheDocument(); // BookOutlined

    // Find the close button on the Tag (AntD uses 'anticon-close')
    const closeButton = screen.getByRole('img', { name: 'close' }); // AntD Tag close icon
    fireEvent.click(closeButton);
    expect(mockSetSelectedSourceId).toHaveBeenCalledWith(null);
  });

  it('Select component is shown when no source is selected', () => {
    (useRagStore as any).mockReturnValue({
        ...useRagStore(),
        availableSources: mockSources,
        selectedSourceId: null, // No selection
        fetchAvailableSources: mockFetchAvailableSources,
      });
    renderWithAntD(<KnowledgePicker />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('选择知识库 (可选)')).toBeInTheDocument();
  });
});
