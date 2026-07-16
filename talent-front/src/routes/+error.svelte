<script>
	import { page } from '$app/stores';
	import { building } from '$app/environment';
	import IZoneLogo from '$lib/assets/icons/IZone-logo.png';

	let mounted = false;
	$effect(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>iZone | {$page.status === 404 ? 'Page Not Found' : $page.status === 403 ? 'Access Denied' : 'Something went wrong'}</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-gray-50">
	<nav class="sticky top-0 z-80 w-full border-b border-gray-200 bg-gray-50 opacity-90">
		<div class="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
			<a href="/" class="flex items-center gap-2">
				<img src={IZoneLogo} alt="iZone" class="h-7 w-auto" />
				<div class="flex flex-col leading-tight">
					<span class="text-lg font-bold text-purple-700">Talent</span>
					<span class="text-xs text-gray-500">connect your first job</span>
				</div>
			</a>
		</div>
	</nav>

	<main class="flex grow items-center justify-center px-4">
		{#if $page.status === 404}
			<div class="text-center">
				<h1 class="font-poppins text-8xl font-bold text-purple-600">404</h1>
				<h2 class="mt-4 text-2xl font-semibold text-gray-800">Page not found</h2>
				<p class="mt-2 max-w-md text-gray-500">
					The page you are looking for doesn't exist or has been moved.
				</p>
				<a href="/" class="mt-6 inline-block rounded-md bg-purple-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-purple-700">
					Return home
				</a>
			</div>
		{:else if $page.status === 403}
			<div class="text-center">
				<h1 class="font-poppins text-8xl font-bold text-orange-500">403</h1>
				<h2 class="mt-4 text-2xl font-semibold text-gray-800">Access denied</h2>
				<p class="mt-2 max-w-md text-gray-500">
					You do not have permission to access this page.
				</p>
				<a href="/" class="mt-6 inline-block rounded-md bg-purple-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-purple-700">
					Return home
				</a>
			</div>
		{:else}
			<div class="text-center">
				<h1 class="font-poppins text-8xl font-bold text-red-500">500</h1>
				<h2 class="mt-4 text-2xl font-semibold text-gray-800">Something went wrong</h2>
				<p class="mt-2 max-w-md text-gray-500">
					An unexpected error occurred. Please try again.
				</p>
				<button
					type="button"
					on:click={() => window.location.reload()}
					class="mt-6 inline-block rounded-md bg-purple-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-purple-700"
				>
					Try again
				</button>
			</div>
		{/if}
	</main>

	<footer class="border-t border-gray-200 bg-white py-6 text-center">
		<p class="text-sm text-gray-400">&copy; 2025 iZone Talent. All rights reserved.</p>
	</footer>
</div>
