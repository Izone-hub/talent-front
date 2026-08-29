<script>
	export let loading = false;
	export let disabled = false;
	export let variant = 'primary';
	export let color = '';
	export let size = 'md';
	export let type = 'button';
	export let onclick = null;

	$: classes = [
		'btn',
		!color && variant === 'primary' ? 'btn-primary' : '',
		variant === 'ghost' ? 'btn-ghost' : '',
		variant === 'outline' ? 'btn-outline' : '',
		color ? `btn-${color}` : '',
		`btn-${size}`,
		disabled || loading ? 'btn-disabled' : '',
		loading ? 'pointer-events-none' : '',
	].filter(Boolean).join(' ');
</script>

<button
	{type}
	{onclick}
	disabled={disabled || loading}
	class={classes}
>
	{#if loading}
		<span class="loading loading-spinner loading-xs"></span>
	{/if}
	<slot />
</button>
