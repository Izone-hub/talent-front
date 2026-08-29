<div class="animate-pulse space-y-6">
	<div class="flex items-center justify-between">
		<div class="h-5 w-40 rounded bg-slate-200"></div>
		<div class="h-5 w-24 rounded bg-slate-200"></div>
	</div>
	<div class="rounded-2xl border border-slate-200 bg-white p-6">
		<div class="mb-4 h-4 w-3/4 rounded bg-slate-200"></div>
		<div class="space-y-3">
			{#each Array(4) as _}
				<div class="flex items-center gap-3 rounded-xl border border-slate-100 p-4">
					<div class="h-4 w-4 rounded-full bg-slate-200"></div>
					<div class="h-3 flex-1 rounded bg-slate-200"></div>
				</div>
			{/each}
		</div>
	</div>
	<div class="flex justify-end">
		<div class="h-10 w-28 rounded-lg bg-slate-200"></div>
	</div>
</div>
