<script>
	import { pb } from '$lib/pocketbase';
	import '../app.css';
	import { loggedIn } from '$lib/store.svelte';
	import Login from '$lib/components/Login.svelte';

	function logout() {
		pb.authStore.clear();
		loggedIn.refresh();
	}

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col items-center justify-center">
	{#if loggedIn.value}
		{@render children()}
	{:else}
		<Login />
	{/if}
</div>
