<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getExternalRagServices,
    createExternalRagService,
    updateExternalRagService,
    deleteExternalRagService,
    type RagService
  } from '$lib/apis/external_rag';
  import Modal from '$lib/components/common/Modal.svelte'; // Assuming a generic Modal component exists
  import Button from '$lib/components/common/Button.svelte'; // Assuming a Button component
  import Input from '$lib/components/common/Input.svelte';   // Assuming an Input component
  import toast from 'svelte-french-toast'; // For notifications

  let services: RagService[] = [];
  let isLoading = true;
  let error: string | null = null;

  // For Create/Edit Modal
  let showModal = false;
  let isEditing = false;
  let currentServiceId: number | null = null;
  let serviceName = '';
  let serviceUrl = '';
  let serviceApiKey = '';

  onMount(fetchServices);

  async function fetchServices() {
    isLoading = true;
    error = null;
    try {
      services = await getExternalRagServices();
    } catch (e: any) {
      error = e.message || 'Failed to fetch services.';
      toast.error(error);
    } finally {
      isLoading = false;
    }
  }

  function openNewModal() {
    isEditing = false;
    currentServiceId = null;
    serviceName = '';
    serviceUrl = '';
    serviceApiKey = '';
    showModal = true;
  }

  function openEditModal(service: RagService) {
    isEditing = true;
    currentServiceId = service.id;
    serviceName = service.name;
    serviceUrl = service.url;
    serviceApiKey = service.api_key || '';
    showModal = true;
  }

  function closeModal() {
    showModal = false;
  }

  async function handleSubmit() {
    if (!serviceName.trim() || !serviceUrl.trim()) {
      toast.error('Name and URL are required.');
      return;
    }

    isLoading = true;
    try {
      if (isEditing && currentServiceId !== null) {
        await updateExternalRagService(
          currentServiceId.toString(),
          serviceName,
          serviceUrl,
          serviceApiKey || undefined
        );
        toast.success('Service updated successfully!');
      } else {
        await createExternalRagService(serviceName, serviceUrl, serviceApiKey || undefined);
        toast.success('Service created successfully!');
      }
      await fetchServices(); // Refresh list
      closeModal();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save service.');
    } finally {
      isLoading = false;
    }
  }

  async function handleDelete(serviceId: number, serviceName: string) {
    if (confirm(`Are you sure you want to delete the service "${serviceName}"?`)) {
      isLoading = true;
      try {
        await deleteExternalRagService(serviceId.toString());
        toast.success(`Service "${serviceName}" deleted successfully!`);
        await fetchServices(); // Refresh list
      } catch (e: any) {
        toast.error(e.message || 'Failed to delete service.');
      } finally {
        isLoading = false;
      }
    }
  }
</script>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-semibold">External RAG Services</h1>
    <Button type="button" color="primary" onClick={openNewModal} disabled={isLoading}>
      Add New Service
    </Button>
  </div>

  {#if isLoading && services.length === 0}
    <p>Loading services...</p>
  {:else if error}
    <p class="text-red-500">{error}</p>
  {:else if services.length === 0}
    <p>No external RAG services configured yet.</p>
  {:else}
    <div class="overflow-x-auto bg-white shadow-md rounded-lg">
      <table class="min-w-full table-auto">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Key</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each services as service (service.id)}
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">{service.name}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <a href={service.url} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline truncate max-w-xs block">
                  {service.url}
                </a>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {service.api_key ? '********' : 'Not Set'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <Button type="button" size="sm" class="mr-2" onClick={() => openEditModal(service)} disabled={isLoading}>
                  Edit
                </Button>
                <Button type="button" color="error" size="sm" onClick={() => handleDelete(service.id, service.name)} disabled={isLoading}>
                  Delete
                </Button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

{#if showModal}
  <Modal title={isEditing ? 'Edit RAG Service' : 'Add New RAG Service'} onCancel={closeModal}>
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div>
        <label for="serviceName" class="block text-sm font-medium text-gray-700">Name*</label>
        <Input type="text" id="serviceName" bind:value={serviceName} required placeholder="My Custom RAG" />
      </div>
      <div>
        <label for="serviceUrl" class="block text-sm font-medium text-gray-700">URL*</label>
        <Input type="url" id="serviceUrl" bind:value={serviceUrl} required placeholder="https://api.example.com/rag" />
      </div>
      <div>
        <label for="serviceApiKey" class="block text-sm font-medium text-gray-700">API Key (Optional)</label>
        <Input type="password" id="serviceApiKey" bind:value={serviceApiKey} placeholder="Enter API Key if required" />
      </div>
      <div class="flex justify-end space-x-2 pt-2">
        <Button type="button" color="secondary" onClick={closeModal} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" color="primary" disabled={isLoading}>
          {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Service' : 'Create Service')}
        </Button>
      </div>
    </form>
  </Modal>
{/if}

<style>
  /* Basic styling for table elements, assuming TailwindCSS or similar utility classes are available globally */
  /* If not, more specific CSS would be needed here or in a global stylesheet */
  .container { max-width: 1024px; } /* Example width */
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .max-w-xs { /* For URL truncation example */
    max-width: 20rem; /* Adjust as needed */
  }
</style>
