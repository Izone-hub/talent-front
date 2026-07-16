<script>
	export let value = 0;
	export let max = 100;
	export let showLabel = false;
	export let size = 'md';
	export let color = 'primary';

	$: percentage = Math.min(Math.round((value / max) * 100), 100);
</script>

<div class="w-full">
	{#if showLabel}
		<div class="mb-1 flex justify-between text-xs text-gray-500">
			<span><slot name="label" /></span>
			<span>{percentage}%</span>
		</div>
	{/if}
	<progress
		class="progress w-full"
		class:progress-primary={color === 'primary'}
		class:progress-success={color === 'success'}
		class:progress-warning={color === 'warning'}
		class:progress-error={color === 'error'}
		class:progress-{size}
		{value}
		{max}
	></progress>
</div>
