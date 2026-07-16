<script>
	export let show = false;
	export let message = 'Loading...';
</script>

{#if show}
	<div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm">
		<div class="flex flex-col items-center gap-3 rounded-xl bg-white px-8 py-6 shadow-2xl">
			<div class="loading loading-spinner loading-lg text-purple-600"></div>
			<p class="text-sm font-medium text-gray-600">{message}</p>
		</div>
	</div>
{/if}
