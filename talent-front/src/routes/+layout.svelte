<script>
	import { onMount } from "svelte";
	import { auth } from "$lib/stores/authStore";
	import DefaultLayout from "$lib/components/layout/DefaultLayout.svelte";
	import AdminLayout from "$lib/components/layout/AdminLayout.svelte";
	import Toast from "$lib/components/ui/toast.svelte";
	import "./layout.css";
	import favicon from "$lib/assets/icons/izone-favicon.svg";

	onMount(() => {
		auth.init();
	});
</script>

<svelte:head>
	<title>iZone | Technology Talent Platform</title>
	<meta
		name="description"
		content="Connecting top technology talent with innovative companies and startups."
	/>
	<link rel="icon" href={favicon} />
	<meta property="og:title" content="iZone | Technology Talent Platform" />
	<meta
		property="og:description"
		content="Connecting top technology talent with innovative companies and startups."
	/>
</svelte:head>

{#if $auth.loading}
	<div class="flex h-screen items-center justify-center bg-gray-50">
		<div class="loading loading-spinner loading-lg text-purple-600"></div>
	</div>
{:else if $auth.isAuthenticated && $auth.user?.role === "admin"}
	<AdminLayout>
		<slot />
		<Toast />
	</AdminLayout>
{:else}
	<DefaultLayout>
		<slot />
	</DefaultLayout>
{/if}
