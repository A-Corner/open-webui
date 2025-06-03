<script lang="ts">
  import { onMount } from 'svelte';
  import { getUIConfigs, updateUIConfigs, type UIConfig } from '$lib/apis/configs';
  import Button from '$lib/components/common/Button.svelte';
  import Input from '$lib/components/common/Input.svelte';
  import Toggle from '$lib/components/common/Toggle.svelte';
  import Textarea from '$lib/components/common/Textarea.svelte';
  import toast from 'svelte-french-toast';

  let configs: UIConfig | null = null;
  let isLoading = true;
  let error: string | null = null;

  // Form field bindings
  let enableSignup: boolean;
  let defaultModelsStr: string; // Storing array as comma-separated string for simple input
  let webuiUrl: string;
  let defaultLocale: string;
  let enableCommunitySharing: boolean;
  let enableMessageRating: boolean;
  let defaultPromptSuggestionsStr: string; // Storing JSON as string

  onMount(async () => {
    await fetchConfigs();
  });

  async function fetchConfigs() {
    isLoading = true;
    error = null;
    try {
      configs = await getUIConfigs();
      if (configs) {
        enableSignup = configs.ENABLE_SIGNUP;
        defaultModelsStr = configs.DEFAULT_MODELS ? configs.DEFAULT_MODELS.join(', ') : '';
        webuiUrl = configs.WEBUI_URL;
        defaultLocale = configs.DEFAULT_LOCALE;
        enableCommunitySharing = configs.ENABLE_COMMUNITY_SHARING;
        enableMessageRating = configs.ENABLE_MESSAGE_RATING;
        defaultPromptSuggestionsStr = JSON.stringify(configs.DEFAULT_PROMPT_SUGGESTIONS, null, 2);
      }
    } catch (e: any) {
      error = e.message || 'Failed to fetch UI configurations.';
      toast.error(error);
    } finally {
      isLoading = false;
    }
  }

  async function handleSubmit() {
    if (!configs) return;

    isLoading = true;
    error = null;

    let parsedDefaultModels: string[] | null = null;
    if (defaultModelsStr.trim()) {
      parsedDefaultModels = defaultModelsStr.split(',').map(s => s.trim()).filter(s => s);
    }

    let parsedDefaultPromptSuggestions: any[] = [];
    try {
      if (defaultPromptSuggestionsStr.trim()) {
        parsedDefaultPromptSuggestions = JSON.parse(defaultPromptSuggestionsStr);
      }
    } catch (e) {
      toast.error('Default Prompt Suggestions is not valid JSON.');
      isLoading = false;
      return;
    }

    const updatePayload: Partial<UIConfig> = {
      ENABLE_SIGNUP: enableSignup,
      DEFAULT_MODELS: parsedDefaultModels,
      WEBUI_URL: webuiUrl,
      DEFAULT_LOCALE: defaultLocale,
      ENABLE_COMMUNITY_SHARING: enableCommunitySharing,
      ENABLE_MESSAGE_RATING: enableMessageRating,
      DEFAULT_PROMPT_SUGGESTIONS: parsedDefaultPromptSuggestions
    };

    try {
      await updateUIConfigs(updatePayload);
      toast.success('UI configurations updated successfully!');
      await fetchConfigs(); // Refresh data
    } catch (e: any) {
      error = e.message || 'Failed to update UI configurations.';
      toast.error(error);
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="space-y-6">
  <h2 class="text-xl font-semibold">UI Settings</h2>

  {#if isLoading && !configs}
    <p>Loading UI settings...</p>
  {:else if error && !configs}
    <p class="text-red-500">{error}</p>
  {:else if configs}
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
        <label for="enableSignup" class="text-sm font-medium text-gray-700">Enable Sign Up</label>
        <Toggle bind:value={enableSignup} id="enableSignup" />
      </div>

      <div>
        <label for="webuiUrl" class="block text-sm font-medium text-gray-700">WebUI URL</label>
        <Input type="url" id="webuiUrl" bind:value={webuiUrl} placeholder="http://localhost:3000" />
        <p class="mt-1 text-xs text-gray-500">The public URL for the WebUI.</p>
      </div>

      <div>
        <label for="defaultLocale" class="block text-sm font-medium text-gray-700">Default Locale</label>
        <Input type="text" id="defaultLocale" bind:value={defaultLocale} placeholder="en-US" />
        <p class="mt-1 text-xs text-gray-500">Leave empty for browser default. E.g., en-US, de-DE.</p>
      </div>

      <div>
        <label for="defaultModels" class="block text-sm font-medium text-gray-700">Default Models</label>
        <Textarea id="defaultModels" bind:value={defaultModelsStr} rows="3" placeholder="model1, model2, model3" />
        <p class="mt-1 text-xs text-gray-500">Comma-separated list of model IDs to be selected by default. Applied if user has no selection or previous selection is invalid.</p>
      </div>

      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
        <label for="enableCommunitySharing" class="text-sm font-medium text-gray-700">Enable Community Sharing</label>
        <Toggle bind:value={enableCommunitySharing} id="enableCommunitySharing" />
      </div>

      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
        <label for="enableMessageRating" class="text-sm font-medium text-gray-700">Enable Message Rating</label>
        <Toggle bind:value={enableMessageRating} id="enableMessageRating" />
      </div>

      <div>
        <label for="defaultPromptSuggestions" class="block text-sm font-medium text-gray-700">Default Prompt Suggestions</label>
        <Textarea id="defaultPromptSuggestions" bind:value={defaultPromptSuggestionsStr} rows="6" placeholder='[{"title": ["Suggest","Something"],"content":"Content of suggestion"}]' />
        <p class="mt-1 text-xs text-gray-500">JSON array for default prompt suggestions shown on new chat page.</p>
      </div>

      <div class="flex justify-end">
        <Button type="submit" color="primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save UI Settings'}
        </Button>
      </div>
    </form>
  {:else}
    <p>No UI configurations available.</p>
  {/if}
</div>
