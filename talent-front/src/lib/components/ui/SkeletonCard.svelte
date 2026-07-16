<script>
	export let count = 1;
	export let variant = 'card';
</script>

{#each Array(count) as _}
	{#if variant === 'list-item'}
		<div class="animate-pulse border-b border-slate-100 p-5 last:border-0">
			<div class="flex items-center justify-between">
				<div class="flex-1">
					<div class="mb-2 h-5 w-64 rounded bg-slate-200"></div>
					<div class="h-3 w-32 rounded bg-slate-200"></div>
				</div>
				<div class="ml-4 hidden h-3 w-48 rounded bg-slate-200 md:block"></div>
				<div class="ml-4 flex gap-2">
					<div class="h-6 w-16 rounded-full bg-slate-200"></div>
					<div class="h-6 w-16 rounded-full bg-slate-200"></div>
					<div class="h-6 w-24 rounded-full bg-slate-200"></div>
				</div>
			</div>
		</div>
	{:else}
		<div class="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
			<div class="mb-3 h-4 w-3/4 rounded bg-slate-200"></div>
			<div class="mb-2 h-3 w-1/2 rounded bg-slate-200"></div>
			<div class="mb-4 h-3 w-full rounded bg-slate-200"></div>
			<div class="flex gap-2">
				<div class="h-6 w-16 rounded-full bg-slate-200"></div>
				<div class="h-6 w-20 rounded-full bg-slate-200"></div>
			</div>
		</div>
	{/if}
{/each}
