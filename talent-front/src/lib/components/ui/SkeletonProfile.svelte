<div class="animate-pulse">
	<div class="flex items-center gap-6">
		<div class="h-20 w-20 rounded-full bg-slate-200"></div>
		<div class="flex-1">
			<div class="mb-2 h-5 w-48 rounded bg-slate-200"></div>
			<div class="h-3 w-32 rounded bg-slate-200"></div>
		</div>
	</div>
	<div class="mt-6 grid grid-cols-3 gap-4">
		{#each Array(3) as _}
			<div class="rounded-xl border border-slate-200 p-4">
				<div class="mb-2 h-3 w-20 rounded bg-slate-200"></div>
				<div class="h-6 w-12 rounded bg-slate-300"></div>
			</div>
		{/each}
	</div>
	<div class="mt-6 space-y-3">
		<div class="h-3 w-full rounded bg-slate-200"></div>
		<div class="h-3 w-5/6 rounded bg-slate-200"></div>
		<div class="h-3 w-3/4 rounded bg-slate-200"></div>
	</div>
</div>
