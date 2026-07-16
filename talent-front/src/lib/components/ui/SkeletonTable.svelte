<script>
	export let rows = 5;
	export let cols = 4;
</script>

<div class="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white">
	<div class="grid gap-4 border-b border-slate-100 bg-slate-50/50 p-4" style="grid-template-columns: repeat({cols}, 1fr)">
		{#each Array(cols) as _}
			<div class="h-3 w-3/4 rounded bg-slate-300"></div>
		{/each}
	</div>
	{#each Array(rows) as _}
		<div class="grid gap-4 border-b border-slate-100 p-4 last:border-0" style="grid-template-columns: repeat({cols}, 1fr)">
			{#each Array(cols) as _}
				<div class="h-3 w-full rounded bg-slate-200"></div>
			{/each}
		</div>
	{/each}
</div>
