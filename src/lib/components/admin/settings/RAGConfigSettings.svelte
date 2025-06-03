<script lang="ts">
  import { onMount } from 'svelte';
  import { getRAGConfigs, updateRAGConfigs, type RAGConfig } from '$lib/apis/configs';
  import Button from '$lib/components/common/Button.svelte';
  import Input from '$lib/components/common/Input.svelte';
  import Toggle from '$lib/components/common/Toggle.svelte';
  import Textarea from '$lib/components/common/Textarea.svelte';
  import Select from '$lib/components/common/Select.svelte'; // If needed for WEB_SEARCH_ENGINE
  import toast from 'svelte-french-toast';

  let configs: RAGConfig | null = null;
  let isLoading = true;
  let error: string | null = null;

  // Form field bindings
  let ragTemplate: string;
  let chunkSize: number;
  let chunkOverlap: number;
  let ragTopK: number;
  let ragRelevanceThreshold: number;
  let enableWebSearch: boolean;
  let webSearchEngine: string;
  let webSearchResultCount: number;
  let pdfExtractImages: boolean;

  // Options for WEB_SEARCH_ENGINE (example, can be expanded or fetched)
  const searchEngineOptions = [
    { value: 'searxng', label: 'SearXNG' },
    { value: 'google_pse', label: 'Google PSE' },
    { value: 'serpapi', label: 'SerpAPI' },
    { value: 'serper', label: 'Serper' },
    { value: 'bing', label: 'Bing' },
    // Add other engines as supported by the backend
  ];


  onMount(async () => {
    await fetchConfigs();
  });

  async function fetchConfigs() {
    isLoading = true;
    error = null;
    try {
      configs = await getRAGConfigs();
      if (configs) {
        ragTemplate = configs.RAG_TEMPLATE;
        chunkSize = configs.CHUNK_SIZE;
        chunkOverlap = configs.CHUNK_OVERLAP;
        ragTopK = configs.RAG_TOP_K;
        ragRelevanceThreshold = configs.RAG_RELEVANCE_THRESHOLD;
        enableWebSearch = configs.ENABLE_WEB_SEARCH;
        webSearchEngine = configs.WEB_SEARCH_ENGINE;
        webSearchResultCount = configs.WEB_SEARCH_RESULT_COUNT;
        pdfExtractImages = configs.PDF_EXTRACT_IMAGES;
      }
    } catch (e: any) {
      error = e.message || 'Failed to fetch RAG configurations.';
      toast.error(error);
    } finally {
      isLoading = false;
    }
  }

  async function handleSubmit() {
    if (!configs) return;

    isLoading = true;
    error = null;

    const updatePayload: Partial<RAGConfig> = {
      RAG_TEMPLATE: ragTemplate,
      CHUNK_SIZE: Number(chunkSize),
      CHUNK_OVERLAP: Number(chunkOverlap),
      RAG_TOP_K: Number(ragTopK),
      RAG_RELEVANCE_THRESHOLD: Number(ragRelevanceThreshold),
      ENABLE_WEB_SEARCH: enableWebSearch,
      WEB_SEARCH_ENGINE: webSearchEngine,
      WEB_SEARCH_RESULT_COUNT: Number(webSearchResultCount),
      PDF_EXTRACT_IMAGES: pdfExtractImages,
    };

    try {
      await updateRAGConfigs(updatePayload);
      toast.success('RAG configurations updated successfully!');
      await fetchConfigs(); // Refresh data
    } catch (e: any) {
      error = e.message || 'Failed to update RAG configurations.';
      toast.error(error);
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="space-y-6">
  <h2 class="text-xl font-semibold">Retrieval Augmented Generation (RAG) Settings</h2>

  {#if isLoading && !configs}
    <p>Loading RAG settings...</p>
  {:else if error && !configs}
    <p class="text-red-500">{error}</p>
  {:else if configs}
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div>
        <label for="ragTemplate" class="block text-sm font-medium text-gray-700">RAG Prompt Template</label>
        <Textarea id="ragTemplate" bind:value={ragTemplate} rows="10" placeholder="Enter your RAG prompt template..." />
        <p class="mt-1 text-xs text-gray-500">Template used to combine user query and context. Use {{CONTEXT}} and {{QUERY}} placeholders.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="chunkSize" class="block text-sm font-medium text-gray-700">Chunk Size</label>
          <Input type="number" id="chunkSize" bind:value={chunkSize} placeholder="1000" />
          <p class="mt-1 text-xs text-gray-500">Size of text chunks for document processing.</p>
        </div>
        <div>
          <label for="chunkOverlap" class="block text-sm font-medium text-gray-700">Chunk Overlap</label>
          <Input type="number" id="chunkOverlap" bind:value={chunkOverlap} placeholder="100" />
          <p class="mt-1 text-xs text-gray-500">Overlap between text chunks.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="ragTopK" class="block text-sm font-medium text-gray-700">Top K Results</label>
          <Input type="number" id="ragTopK" bind:value={ragTopK} placeholder="3" />
          <p class="mt-1 text-xs text-gray-500">Number of relevant chunks to retrieve.</p>
        </div>
        <div>
          <label for="ragRelevanceThreshold" class="block text-sm font-medium text-gray-700">Relevance Threshold</label>
          <Input type="number" step="0.01" id="ragRelevanceThreshold" bind:value={ragRelevanceThreshold} placeholder="0.1" />
          <p class="mt-1 text-xs text-gray-500">Minimum relevance score for chunks (0.0 to 1.0).</p>
        </div>
      </div>

      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
        <label for="pdfExtractImages" class="text-sm font-medium text-gray-700">Extract Images from PDFs</label>
        <Toggle bind:value={pdfExtractImages} id="pdfExtractImages" />
        <p class="mt-1 text-xs text-gray-500 pl-2 flex-grow">If enabled, attempt to extract images from PDF documents during processing.</p>
      </div>

      <hr class="my-6"/>
      <h3 class="text-lg font-medium">Web Search Settings</h3>

      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
        <label for="enableWebSearch" class="text-sm font-medium text-gray-700">Enable Web Search</label>
        <Toggle bind:value={enableWebSearch} id="enableWebSearch" />
        <p class="mt-1 text-xs text-gray-500 pl-2 flex-grow">Allow RAG to use web search as a knowledge source.</p>
      </div>

      {#if enableWebSearch}
        <div>
          <label for="webSearchEngine" class="block text-sm font-medium text-gray-700">Web Search Engine</label>
          <!-- TODO: Replace with a Select component if available and populated -->
          <Input type="text" id="webSearchEngine" bind:value={webSearchEngine} placeholder="e.g., searxng, google_pse" />
          <!-- <Select id="webSearchEngine" bind:value={webSearchEngine} options={searchEngineOptions} /> -->
          <p class="mt-1 text-xs text-gray-500">Specify the backend search engine to use.</p>
        </div>
        <div>
          <label for="webSearchResultCount" class="block text-sm font-medium text-gray-700">Web Search Result Count</label>
          <Input type="number" id="webSearchResultCount" bind:value={webSearchResultCount} placeholder="3" />
          <p class="mt-1 text-xs text-gray-500">Number of search results to fetch and process.</p>
        </div>
      {/if}

      <div class="flex justify-end mt-6">
        <Button type="submit" color="primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save RAG Settings'}
        </Button>
      </div>
    </form>
  {:else}
    <p>No RAG configurations available.</p>
  {/if}
</div>
