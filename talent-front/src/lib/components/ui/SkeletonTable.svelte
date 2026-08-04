<script>
	// Reusable DaisyUI skeleton table.
	// - Table mode: pass `columns` (array of header labels) to render a real
	//   <table> skeleton with a header row + `rows` skeleton rows.
	// - Grid mode (backward-compatible): pass `rows` + `cols` for a simple
	//   column-grid skeleton.
	export let rows = 5;
	export let cols = 4;
	export let columns = [];
	export let headerBar = false;
	export let firstColumnAvatar = false;
</script>

{#if columns.length > 0}
	<div class="overflow-hidden rounded-lg border border-gray-100 bg-white">
		{#if headerBar}
			<div class="border-b border-gray-100 bg-gray-50/30 px-4 py-3">
				<div class="skeleton h-4 w-64"></div>
			</div>
		{/if}
		<div class="overflow-x-auto">
			<table class="table">
				<thead>
					<tr class="text-gray-500 text-xs uppercase tracking-wider">
						{#each columns as col}
							<th class="font-semibold">{col}</th>
						{/each}
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-50 text-sm">
					{#each Array(rows) as _}
						<tr>
							{#each columns as col, i}
								<td>
									{#if firstColumnAvatar && i === 0}
										<div class="flex items-center gap-3">
											<div class="skeleton h-9 w-9 rounded-full shrink-0"></div>
											<div class="space-y-2">
												<div class="skeleton h-3 w-32"></div>
												<div class="skeleton h-2.5 w-24"></div>
											</div>
										</div>
									{:else if col === "Links"}
										<div class="flex items-center justify-end gap-2">
											<div class="skeleton h-8 w-16 rounded-lg"></div>
											<div class="skeleton h-8 w-16 rounded-lg"></div>
										</div>
									{:else if col === "Status" || col === "Quiz"}
										<div class="skeleton h-5 w-16 rounded-full"></div>
									{:else}
										<div class="skeleton h-3 w-20"></div>
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{:else}
	<div class="animate-pulse overflow-hidden rounded-lg border border-gray-100 bg-white">
		<div
			class="grid gap-4 border-b border-gray-100 bg-gray-50/50 p-4"
			style="grid-template-columns: repeat({cols}, 1fr)"
		>
			{#each Array(cols) as _}
				<div class="skeleton h-3 w-3/4"></div>
			{/each}
		</div>
		{#each Array(rows) as _}
			<div
				class="grid gap-4 border-b border-gray-100 p-4 last:border-0"
				style="grid-template-columns: repeat({cols}, 1fr)"
			>
				{#each Array(cols) as _}
					<div class="skeleton h-3 w-full"></div>
				{/each}
			</div>
		{/each}
	</div>
{/if}
