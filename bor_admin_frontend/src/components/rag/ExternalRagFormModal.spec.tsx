import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExternalRagFormModal from './ExternalRagFormModal'; // Adjust path
import type { ExternalRagServiceCreatePayload, ExternalRagServiceUpdatePayload } from '../../api/adminExternalRagService'; // Adjust path

describe('ExternalRagFormModal Component', () => {
  const mockOnCancel = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    visible: true,
    onCancel: mockOnCancel,
    onSubmit: mockOnSubmit,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  describe('Create Mode', () => {
    const propsCreate = { ...defaultProps, isEditMode: false, initialValues: null };

    it('renders create form with all necessary inputs', () => {
      render(<ExternalRagFormModal {...propsCreate} />);
      expect(screen.getByLabelText(/service name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/service url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/api key \(optional\)/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create service/i })).toBeInTheDocument();
    });

    it('requires service name and URL', async () => {
      render(<ExternalRagFormModal {...propsCreate} />);
      await userEvent.click(screen.getByRole('button', { name: /create service/i }));

      await waitFor(() => {
        expect(screen.getByText('Service name is required')).toBeInTheDocument();
        expect(screen.getByText('Service URL is required')).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates URL format', async () => {
      render(<ExternalRagFormModal {...propsCreate} />);
      await userEvent.type(screen.getByLabelText(/service url/i), 'invalidurl');
      await userEvent.click(screen.getByRole('button', { name: /create service/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
      });
    });

    it('calls onSubmit with correct data in create mode (with API key)', async () => {
      render(<ExternalRagFormModal {...propsCreate} />);
      const serviceData: ExternalRagServiceCreatePayload = {
        name: 'My RAG',
        url: 'http://myrag.com/api',
        api_key: 'secret123',
      };

      await userEvent.type(screen.getByLabelText(/service name/i), serviceData.name);
      await userEvent.type(screen.getByLabelText(/service url/i), serviceData.url);
      await userEvent.type(screen.getByLabelText(/api key \(optional\)/i), serviceData.api_key!);
      await userEvent.click(screen.getByRole('button', { name: /create service/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith(serviceData);
      });
    });

    it('calls onSubmit with correct data in create mode (without API key)', async () => {
      render(<ExternalRagFormModal {...propsCreate} />);
      const serviceData: ExternalRagServiceCreatePayload = {
        name: 'My RAG NoKey',
        url: 'http://myrag-nokey.com/api',
      }; // api_key is optional

      await userEvent.type(screen.getByLabelText(/service name/i), serviceData.name);
      await userEvent.type(screen.getByLabelText(/service url/i), serviceData.url);
      // API Key field is left empty
      await userEvent.click(screen.getByRole('button', { name: /create service/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith({ ...serviceData, api_key: "" }); // react-hook-form will submit empty string if field is touched
      });
    });
  });

  describe('Edit Mode', () => {
    const initialService = {
      id: 1, name: 'Editable RAG', url: 'http://editable.com/api', has_api_key: true,
      created_at: '', updated_at: '' // Timestamps not used in form
    };
    const propsEdit = { ...defaultProps, isEditMode: true, initialValues: initialService };

    it('renders edit form with initial values', () => {
      render(<ExternalRagFormModal {...propsEdit} />);
      expect(screen.getByLabelText(/service name/i)).toHaveValue(initialService.name);
      expect(screen.getByLabelText(/service url/i)).toHaveValue(initialService.url);
      // API key field should be empty for editing, prompting for new key if change needed
      expect(screen.getByLabelText(/api key \(optional\)/i)).toHaveValue('');
      expect(screen.getByText('API key is currently set. Enter a new key above to change it, or leave blank to keep the existing key.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('calls onSubmit with updated data (api key unchanged if left blank)', async () => {
      render(<ExternalRagFormModal {...propsEdit} />);
      const updatedData: ExternalRagServiceUpdatePayload = {
        name: 'Updated RAG Name',
        url: 'http://updatedrag.com/api',
        // api_key is left blank, meaning "do not change"
      };

      await userEvent.clear(screen.getByLabelText(/service name/i));
      await userEvent.type(screen.getByLabelText(/service name/i), updatedData.name!);
      await userEvent.clear(screen.getByLabelText(/service url/i));
      await userEvent.type(screen.getByLabelText(/service url/i), updatedData.url!);

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        // api_key should be undefined in payload if left blank in edit mode, due to form submit logic
        expect(mockOnSubmit).toHaveBeenCalledWith(updatedData);
      });
    });

    it('calls onSubmit with updated data (api key changed)', async () => {
      render(<ExternalRagFormModal {...propsEdit} />);
      const updatedData: ExternalRagServiceUpdatePayload = {
        name: 'Updated RAG Name Again',
        url: 'http://updatedragagain.com/api',
        api_key: "newSecretKey"
      };

      await userEvent.clear(screen.getByLabelText(/service name/i));
      await userEvent.type(screen.getByLabelText(/service name/i), updatedData.name!);
      await userEvent.clear(screen.getByLabelText(/service url/i));
      await userEvent.type(screen.getByLabelText(/service url/i), updatedData.url!);
      await userEvent.type(screen.getByLabelText(/api key \(optional\)/i), updatedData.api_key!);

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith(updatedData);
      });
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    render(<ExternalRagFormModal {...defaultProps} isEditMode={false} initialValues={null} />);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
