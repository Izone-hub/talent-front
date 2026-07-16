<script>
	export let score = 0;
	export let passingThreshold = 0;
	export let showScore = false;
	export let size = 'md';

	$: passed = score >= passingThreshold;
	$: percentage = Math.min(Math.round((score / passingThreshold) * 100), 100);
</script>

<span
	role="status"
	aria-label={passed ? 'Passed' : 'Failed'}
	class="inline-flex items-center gap-1.5 rounded-lg font-semibold {size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'} {passed ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700'}"
>
	{#if passed}
		<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
		PASS
	{:else}
		<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
		FAIL
	{/if}
	{#if showScore}
		<span class="opacity-70">({score}%)</span>
	{/if}
</span>
