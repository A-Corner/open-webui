<script lang="ts">
  import ExternalRagConnections from '$lib/components/admin/ExternalRagConnections.svelte';
  import AdminSettingsLayout from '../AdminSettingsLayout.svelte'; // Assuming a layout component for admin settings pages
</script>

<AdminSettingsLayout>
  <svelte:fragment slot="title">External RAG Services</svelte:fragment>
  <ExternalRagConnections />
</AdminSettingsLayout>
