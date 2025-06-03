<script lang="ts">
  import AdminSettingsLayout from '../AdminSettingsLayout.svelte';
  import UIConfigSettings from '$lib/components/admin/settings/UIConfigSettings.svelte';
  import AuthConfigSettings from '$lib/components/admin/settings/AuthConfigSettings.svelte';
  import RAGConfigSettings from '$lib/components/admin/settings/RAGConfigSettings.svelte';
  import ExternalRagConnections from '$lib/components/admin/ExternalRagConnections.svelte'; // From previous subtask

  type Tab = 'ui' | 'auth' | 'rag' | 'external_rag';
  let activeTab: Tab = 'ui';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'ui', label: 'UI Settings' },
    { id: 'auth', label: 'Auth Settings' },
    { id: 'rag', label: 'RAG Settings' },
    { id: 'external_rag', label: 'External RAG Services' }
  ];
</script>

<AdminSettingsLayout>
  <svelte:fragment slot="title">System Settings</svelte:fragment>

  <div class="flex border-b mb-6">
    {#each tabs as tab}
      <button
        class="px-4 py-2 -mb-px border-b-2 hover:bg-gray-100 focus:outline-none"
        class:border-blue-500={activeTab === tab.id}
        class:border-transparent={activeTab !== tab.id}
        on:click={() => (activeTab = tab.id)}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <div class="p-1">
    {#if activeTab === 'ui'}
      <UIConfigSettings />
    {:else if activeTab === 'auth'}
      <AuthConfigSettings />
    {:else if activeTab === 'rag'}
      <RAGConfigSettings />
    {:else if activeTab === 'external_rag'}
      <ExternalRagConnections />
    {/if}
  </div>
</AdminSettingsLayout>

<style>
  /* Basic styling for active tab, can be enhanced */
  .border-blue-500 {
    border-color: #3b82f6; /* Tailwind blue-500 */
    font-weight: 600;
  }
  .hover\:bg-gray-100:hover {
    background-color: #f3f4f6; /* Tailwind gray-100 */
  }
</style>
