<script>
	export let message = 'Loading...';
</script>

<div class="flex h-64 items-center justify-center">
	<div class="flex flex-col items-center gap-3">
		<div class="loading loading-spinner loading-lg text-purple-600"></div>
		<p class="text-sm text-gray-500">{message}</p>
	</div>
</div>
