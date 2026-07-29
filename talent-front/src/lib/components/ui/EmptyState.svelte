<script>
	export let icon = undefined;
	export let title = '';
	export let description = '';
	export let actionLabel = '';
	export let actionHref = '';
	/** @param {() => void} handler */
	export let onAction = undefined;
</script>

<div class="flex flex-col items-center justify-center px-4 py-16 text-center">
	{#if icon}
		<div class="mb-4 text-gray-300">
			<svelte:component this={icon} size={48} />
		</div>
	{/if}
	<h3 class="text-lg font-semibold text-gray-700">{title}</h3>
	{#if description}
		<p class="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
	{/if}
	{#if actionLabel}
		<div class="mt-6">
			{#if actionHref}
				<a
					href={actionHref}
					class="inline-block rounded-md bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700"
				>
					{actionLabel}
				</a>
			{:else if onAction}
				<button
					type="button"
					onclick={onAction}
					class="inline-block rounded-md bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700"
				>
					{actionLabel}
				</button>
			{/if}
		</div>
	{/if}
</div>
