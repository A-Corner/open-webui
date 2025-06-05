import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ExternalRagPage from './ExternalRagPage'; // Adjust path
import adminExternalRagService, { type ExternalRagService } from '../../api/adminExternalRagService'; // Adjust path

// Mock adminExternalRagService
vi.mock('../../api/adminExternalRagService');

// Mock Ant Design message API and Modal/Popconfirm if direct control is needed
const mockMessageSuccess = vi.fn();
const mockMessageError = vi.fn();
vi.mock('antd', async () => {
  const antd = await vi.importActual('antd');
  return {
    ...antd,
    message: { success: mockMessageSuccess, error: mockMessageError },
    // Popconfirm: (props) => <div onClick={props.onConfirm}>Popconfirm: {props.title}</div> // Simplified Popconfirm
  };
});

// Mock child modal component
vi.mock('../../components/rag/ExternalRagFormModal', () => ({
  default: ({ visible, onCancel, onSubmit, initialValues, isEditMode }) => visible ? (
    <div data-testid="external-rag-form-modal">
      <span>{isEditMode ? 'Edit RAG Service' : 'Create RAG Service'}</span>
      {initialValues && <div data-testid="initial-values-rag">{JSON.stringify(initialValues)}</div>}
      <button data-testid="modal-cancel-button" onClick={onCancel}>Cancel</button>
      <button data-testid="modal-submit-button" onClick={() => onSubmit({ name: 'test', url: 'http://test.com' })}>SubmitForm</button>
    </div>
  ) : null,
}));


describe('ExternalRagPage Component', () => {
  const mockServices: ExternalRagService[] = [
    { id: 1, name: 'Service Alpha', url: 'http://alpha.com', has_api_key: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, name: 'Service Beta', url: 'http://beta.com', has_api_key: false, created_at: new Date(Date.now() - 100000).toISOString(), updated_at: new Date(Date.now() - 100000).toISOString() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (adminExternalRagService.getExternalRagServices as vi.Mock).mockResolvedValue(mockServices);
    (adminExternalRagService.createExternalRagService as vi.Mock).mockResolvedValue(mockServices[0]); // Assume returns created
    (adminExternalRagService.updateExternalRagService as vi.Mock).mockResolvedValue(mockServices[0]); // Assume returns updated
    (adminExternalRagService.deleteExternalRagService as vi.Mock).mockResolvedValue(undefined);
  });

  afterEach(cleanup);

  const renderPage = () => render(<MemoryRouter><ExternalRagPage /></MemoryRouter>);

  it('fetches and displays external RAG services in a table on initial load', async () => {
    renderPage();
    expect(adminExternalRagService.getExternalRagServices).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByText('Service Alpha')).toBeInTheDocument();
      expect(screen.getByText('http://beta.com')).toBeInTheDocument();
      expect(screen.getAllByText('Yes').length).toBeGreaterThanOrEqual(1); // For has_api_key
      expect(screen.getAllByText('No').length).toBeGreaterThanOrEqual(1);  // For has_api_key
    });
  });

  it('opens create service modal when "Add External RAG Service" button is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /add external rag service/i }));
    await waitFor(() => {
      expect(screen.getByTestId('external-rag-form-modal')).toBeInTheDocument();
      expect(screen.getByText('Create RAG Service')).toBeInTheDocument(); // Check modal title part
    });
  });

  it('opens edit service modal with initial values when "Edit" button is clicked', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Service Alpha')).toBeInTheDocument());

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await userEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('external-rag-form-modal')).toBeInTheDocument();
      expect(screen.getByText('Edit RAG Service')).toBeInTheDocument();
      expect(screen.getByTestId('initial-values-rag')).toHaveTextContent(mockServices[0].name);
    });
  });

  it('calls deleteExternalRagService and refreshes list on delete confirmation', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Service Alpha')).toBeInTheDocument());

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]); // Click delete for Service Alpha

    // AntD Popconfirm interaction: Vitest doesn't run in a browser context that fully renders Popconfirm's portal.
    // We need to find the confirm button within the Popconfirm's content if it's rendered in the test DOM.
    // If Popconfirm is complex to interact with, its onConfirm prop could be called directly by finding the button.
    // For now, assume "Yes" button becomes available.
    await userEvent.click(await screen.findByText('Yes')); // Popconfirm's confirm button

    await waitFor(() => {
      expect(adminExternalRagService.deleteExternalRagService).toHaveBeenCalledWith(mockServices[0].id);
      expect(mockMessageSuccess).toHaveBeenCalledWith('External RAG service deleted successfully');
      expect(adminExternalRagService.getExternalRagServices).toHaveBeenCalledTimes(2); // Initial + refresh
    });
  });

  // Test form submission (create/edit) via modal interaction
  it('handles create service submission via modal', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /add external rag service/i }));
    await waitFor(() => expect(screen.getByTestId('external-rag-form-modal')).toBeInTheDocument());

    // Simulate form submission within the mocked modal
    const submitButtonInModal = screen.getByTestId('modal-submit-button');
    await userEvent.click(submitButtonInModal);

    await waitFor(() => {
      expect(adminExternalRagService.createExternalRagService).toHaveBeenCalledTimes(1);
      // The mock modal's submit button calls onSubmit with { name: 'test', url: 'http://test.com' }
      expect(adminExternalRagService.createExternalRagService).toHaveBeenCalledWith({ name: 'test', url: 'http://test.com' });
      expect(mockMessageSuccess).toHaveBeenCalledWith('External RAG service created successfully');
      expect(adminExternalRagService.getExternalRagServices).toHaveBeenCalledTimes(2); // Initial + refresh
    });
  });

});
