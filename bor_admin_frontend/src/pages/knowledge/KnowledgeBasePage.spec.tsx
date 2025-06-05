import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import KnowledgeBasePage from './KnowledgeBasePage'; // Adjust path
import { useKnowledgeStore } from '../../store/knowledgeStore'; // Adjust path
import adminKnowledgeService, { type DocumentResponse, type CollectionResponse, type FileUploadResponse } from '../../api/adminKnowledgeService'; // Adjust path

// Mock the knowledgeStore
const mockFetchDocuments = vi.fn();
const mockFetchCollections = vi.fn();
const mockUploadFile = vi.fn();
const mockClearUploadingFile = vi.fn();
const mockDeleteDocumentLocal = vi.fn(); // For optimistic UI update test

let mockStoreState = {
  documents: [] as DocumentResponse[],
  totalDocuments: 0,
  collections: [] as CollectionResponse[],
  totalCollections: 0,
  uploadingFiles: {} as Record<string, any>,
  isLoadingDocuments: false,
  isLoadingCollections: false,
  errorDocuments: null as string | null,
  errorCollections: null as string | null,
  errorUpload: null as string | null,
};

vi.mock('../../store/knowledgeStore', () => ({
  useKnowledgeStore: vi.fn(() => ({
    ...mockStoreState,
    fetchDocuments: mockFetchDocuments,
    fetchCollections: mockFetchCollections,
    uploadFile: mockUploadFile,
    clearUploadingFile: mockClearUploadingFile,
    deleteDocumentLocal: mockDeleteDocumentLocal,
  })),
}));

// Mock adminKnowledgeService for direct calls like deleteDocument
vi.mock('../../api/adminKnowledgeService');
const mockAdminKnowledgeService = adminKnowledgeService as vi.Mocked<typeof adminKnowledgeService>;


// Mock Ant Design message API and Upload component internals if needed
const mockMessageSuccess = vi.fn();
const mockMessageError = vi.fn();
vi.mock('antd', async () => {
  const antd = await vi.importActual('antd');
  const Upload = (props) => {
    // Simplified mock for Upload.Dragger
    const handleChange = (file: File) => {
      if (props.customRequest) {
        props.customRequest({ file, onSuccess: () => {}, onError: () => {} });
      }
    };
    return (
      <div data-testid="mock-dragger" onClick={() => handleChange(new File(["content"], "testfile.pdf", {type: "application/pdf"}))}>
        {props.children}
      </div>
    );
  };
  Upload.Dragger = Upload; // Make Upload.Dragger available
  return {
    ...antd,
    Upload,
    message: { success: mockMessageSuccess, error: mockMessageError },
  };
});


describe('KnowledgeBasePage Component', () => {
  const mockDoc1: DocumentResponse = { id: 'doc1', name: 'Document Alpha', filename: 'alpha.pdf', content_type: 'application/pdf', size: 204800, status: 'completed', uploaded_at: new Date().toISOString() };
  const mockColl1: CollectionResponse = { id: 'col1', name: 'Collection Alpha', document_count: 3, created_at: new Date().toISOString() };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState = {
      documents: [mockDoc1],
      totalDocuments: 1,
      collections: [mockColl1],
      totalCollections: 1,
      uploadingFiles: {},
      isLoadingDocuments: false,
      isLoadingCollections: false,
      errorDocuments: null,
      errorCollections: null,
      errorUpload: null,
    };
    (useKnowledgeStore as any).mockImplementation(() => ({
      ...mockStoreState,
      fetchDocuments: mockFetchDocuments,
      fetchCollections: mockFetchCollections,
      uploadFile: mockUploadFile,
      clearUploadingFile: mockClearUploadingFile,
      deleteDocumentLocal: mockDeleteDocumentLocal,
    }));
  });

  afterEach(cleanup);

  const renderPage = () => render(<MemoryRouter><KnowledgeBasePage /></MemoryRouter>);

  it('fetches documents and collections on mount and displays them', async () => {
    renderPage();
    expect(mockFetchDocuments).toHaveBeenCalledTimes(1);
    expect(mockFetchCollections).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText('Document Alpha')).toBeInTheDocument(); // Document list
      expect(screen.getByText('Collection Alpha')).toBeInTheDocument(); // Collection list
    });
  });

  it('handles document upload via Dragger', async () => {
    const mockFileUploadResponse: FileUploadResponse = {id: 'newDoc', filename: 'testfile.pdf', message: 'Uploaded', status: 'pending'};
    mockUploadFile.mockResolvedValue(mockFileUploadResponse);

    renderPage();
    // AntD Dragger is complex. We've mocked Upload.Dragger to call customRequest on click.
    const dragger = screen.getByTestId('mock-dragger');
    await userEvent.click(dragger); // This will trigger our mocked handleChange in the Upload mock
                                     // which then calls customRequest, leading to uploadFile call.

    await waitFor(() => {
      expect(mockUploadFile).toHaveBeenCalledTimes(1);
      // The file passed to uploadFile will be the one created in the Upload mock.
      expect(mockUploadFile.mock.calls[0][0].name).toBe('testfile.pdf');
      expect(mockMessageSuccess).toHaveBeenCalledWith('testfile.pdf uploaded successfully, processing started.');
    });
  });

  it('displays uploading files progress/status', () => {
    const tempFileKey = 'uploading.pdf-12345';
    mockStoreState.uploadingFiles = {
      [tempFileKey]: { status: 'uploading', progress: 50 }
    };
    (useKnowledgeStore as any).mockImplementation(() => ({ ...mockStoreState, fetchDocuments:mockFetchDocuments, fetchCollections:mockFetchCollections })); // update store mock

    renderPage();
    expect(screen.getByText('uploading.pdf')).toBeInTheDocument(); // Filename part
    expect(screen.getByText('Status: uploading')).toBeInTheDocument();
    // Progress bar would be harder to assert specifically without more detailed DOM structure
  });

  it('allows searching and filtering documents', async () => {
    renderPage();
    const searchInput = screen.getByPlaceholderText('Search document name/filename');
    await userEvent.type(searchInput, 'Alpha');
    await userEvent.click(searchInput.closest('form')?.querySelector('button[type="submit"]') || screen.getByRole('button', {name: /search/i})); // Assuming search on enter or button

    // The search button isn't standard, it's an icon suffix or separate button.
    // If it's an icon suffix that triggers on Enter or blur, that's harder to test.
    // Let's assume there's a Search button or Enter key press on input field for now.
    // The current page code uses onPressEnter on Input, or a separate Search button.
    // We'll simulate pressing Enter on the input.
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });


    await waitFor(() => {
      expect(mockFetchDocuments).toHaveBeenCalledWith(expect.objectContaining({ query: 'Alpha' }));
    });

    // Select status filter
    const statusSelect = screen.getByPlaceholderText('Filter by status').closest('.ant-select');
    if (statusSelect) await userEvent.click(statusSelect);
    await userEvent.click(await screen.findByText('Completed')); // Option text

    await waitFor(() => {
      expect(mockFetchDocuments).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }));
    });
  });

  it('handles document deletion with confirmation', async () => {
    mockAdminKnowledgeService.deleteDocument.mockResolvedValue(undefined); // Mock the direct API call
    renderPage();
    await waitFor(() => expect(screen.getByText('Document Alpha')).toBeInTheDocument());

    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    await userEvent.click(deleteButton);

    await userEvent.click(await screen.findByText('Yes')); // Popconfirm

    await waitFor(() => {
      expect(mockAdminKnowledgeService.deleteDocument).toHaveBeenCalledWith(mockDoc1.id);
      expect(mockMessageSuccess).toHaveBeenCalledWith(`Document '${mockDoc1.name}' deleted successfully.`);
      expect(mockDeleteDocumentLocal).toHaveBeenCalledWith(mockDoc1.id); // Check optimistic update
    });
  });
});
