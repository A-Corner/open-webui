<script lang="ts">
  import { onMount } from 'svelte';
  import { getAuthConfigs, updateAuthConfigs, type AuthConfig } from '$lib/apis/configs';
  import Button from '$lib/components/common/Button.svelte';
  import Input from '$lib/components/common/Input.svelte';
  import Toggle from '$lib/components/common/Toggle.svelte';
  import Select from '$lib/components/common/Select.svelte';
  import toast from 'svelte-french-toast';

  let configs: AuthConfig | null = null;
  let isLoading = true;
  let error: string | null = null;

  // Form field bindings
  let jwtExpiresIn: string;
  let enableOauthSignup: boolean;
  let enableApiKey: boolean;
  let defaultUserRole: string;

  // Options for default user role
  const userRoleOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' }
  ];

  onMount(async () => {
    await fetchConfigs();
  });

  async function fetchConfigs() {
    isLoading = true;
    error = null;
    try {
      configs = await getAuthConfigs();
      if (configs) {
        jwtExpiresIn = configs.JWT_EXPIRES_IN;
        enableOauthSignup = configs.ENABLE_OAUTH_SIGNUP;
        enableApiKey = configs.ENABLE_API_KEY;
        defaultUserRole = configs.DEFAULT_USER_ROLE;
      }
    } catch (e: any) {
      error = e.message || 'Failed to fetch Auth configurations.';
      toast.error(error);
    } finally {
      isLoading = false;
    }
  }

  async function handleSubmit() {
    if (!configs) return;

    isLoading = true;
    error = null;

    const updatePayload: Partial<AuthConfig> = {
      JWT_EXPIRES_IN: jwtExpiresIn,
      ENABLE_OAUTH_SIGNUP: enableOauthSignup,
      ENABLE_API_KEY: enableApiKey,
      DEFAULT_USER_ROLE: defaultUserRole,
    };

    try {
      await updateAuthConfigs(updatePayload);
      toast.success('Auth configurations updated successfully!');
      await fetchConfigs(); // Refresh data
    } catch (e: any) {
      error = e.message || 'Failed to update Auth configurations.';
      toast.error(error);
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="space-y-6">
  <h2 class="text-xl font-semibold">Authentication Settings</h2>

  {#if isLoading && !configs}
    <p>Loading Auth settings...</p>
  {:else if error && !configs}
    <p class="text-red-500">{error}</p>
  {:else if configs}
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div>
        <label for="jwtExpiresIn" class="block text-sm font-medium text-gray-700">JWT Expires In</label>
        <Input type="text" id="jwtExpiresIn" bind:value={jwtExpiresIn} placeholder="-1" />
        <p class="mt-1 text-xs text-gray-500">Session duration in minutes. Use -1 for indefinite. Changes require re-login.</p>
      </div>

      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
        <label for="enableOauthSignup" class="text-sm font-medium text-gray-700">Enable OAuth Sign Up</label>
        <Toggle bind:value={enableOauthSignup} id="enableOauthSignup" />
        <p class="mt-1 text-xs text-gray-500 pl-2 flex-grow">Allow new users to register via OAuth providers.</p>
      </div>

      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
        <label for="enableApiKey" class="text-sm font-medium text-gray-700">Enable API Key Usage</label>
        <Toggle bind:value={enableApiKey} id="enableApiKey" />
         <p class="mt-1 text-xs text-gray-500 pl-2 flex-grow">Allow users to generate and use API keys.</p>
      </div>

      <div>
        <label for="defaultUserRole" class="block text-sm font-medium text-gray-700">Default User Role</label>
        <Select id="defaultUserRole" bind:value={defaultUserRole} options={userRoleOptions} />
        <p class="mt-1 text-xs text-gray-500">Default role assigned to new users upon registration (if sign up is enabled).</p>
      </div>

      <div class="flex justify-end">
        <Button type="submit" color="primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Auth Settings'}
        </Button>
      </div>
    </form>
  {:else}
    <p>No Auth configurations available.</p>
  {/if}
</div>
