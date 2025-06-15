<script>
	export let title = '';
	export let buttons = [];
</script>

<div class="overlay absolute inset-0 z-50 flex items-center justify-center bg-black/60">
	<div
		class="animate-fadeIn w-full max-w-md space-y-6 rounded-lg bg-white/90 p-6 text-center shadow-xl backdrop-blur-md"
	>
		{#if title}
			<h1 class="text-3xl font-bold text-gray-900">{title}</h1>
		{/if}

		<slot />

		<div class="flex flex-col gap-3">
			{#each buttons as btn}
				<button
					on:click={btn.onClick}
					class="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
				>
					{btn.label}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fadeIn {
		animation: fadeIn 0.6s ease-out;
	}

	.overlay {
		font-family: 'Press Start 2P', cursive, monospace;
	}

	h1 {
		color: #1e90ff;
		text-shadow: 2px 2px 0 #000;
		letter-spacing: 2px;
	}

	button {
		font-family: 'Press Start 2P', cursive, monospace;
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
		border: 2px solid #00bfff;
		color: white;
		text-shadow: 1px 1px 1px #000;
		font-size: 0.75rem;
		letter-spacing: 1px;
		transition:
			background 0.3s ease,
			transform 0.15s ease;
		box-shadow: 0 3px 5px rgba(0, 0, 0, 0.3);
	}

	button:hover {
		background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
		transform: scale(1.05);
		box-shadow: 0 5px 10px rgba(0, 0, 0, 0.5);
		cursor: pointer;
	}

	button:active {
		transform: scale(0.95);
		box-shadow: 0 2px 3px rgba(0, 0, 0, 0.6);
	}
</style>
