<script>
	import { onMount } from "svelte";
	import { navigating } from "$app/stores";
	import { auth } from "$lib/stores/authStore";
	import DefaultLayout from "$lib/components/layout/DefaultLayout.svelte";
	import AdminLayout from "$lib/components/layout/AdminLayout.svelte";
	import Toast from "$lib/components/ui/toast.svelte";
	import GlobalLoadingOverlay from "$lib/components/ui/GlobalLoadingOverlay.svelte";
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

{#if $navigating}
	<progress class="progress progress-primary fixed left-0 top-0 z-[99999] h-1 w-full rounded-none"></progress>
{/if}

<GlobalLoadingOverlay show={$auth.loading} message="Authenticating..." />

{#if $auth.isAuthenticated && $auth.user?.role === "admin"}
	<AdminLayout>
		<slot />
	</AdminLayout>
{:else}
	<DefaultLayout>
		<slot />
	</DefaultLayout>
{/if}
<Toast />
