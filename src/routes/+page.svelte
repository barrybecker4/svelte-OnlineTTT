<!--h1>Welcome to SvelteKit</h1-->
<!--p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p-->


<script lang="ts">
	import { onMount } from 'svelte';

	let status = 'Setting up...';

	onMount(() => {
		status = 'SvelteKit + Cloudflare setup complete!';
	});
</script>

<svelte:head>
	<title>Online Tic-Tac-Toe</title>
</svelte:head>

<div class="container">
	<h1>Online Tic-Tac-Toe</h1>
	<p>Status: {status}</p>
	<p>Ready to migrate from GAS to SvelteKit!</p>
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		text-align: center;
	}

	h1 {
		color: #005588;
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}
</style>
