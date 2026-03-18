<script>
    import { auth } from "$lib/stores/authStore";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import AuthErrorModal from "$lib/components/modals/AuthErrorModal.svelte";

    let showModal = false;

    function handleClose() {
        showModal = false;
        goto("/");
    }

    // Reactive check for auth status
    $: {
        if (!$auth.loading) {
            if (!$auth.isAuthenticated || $auth.user?.role !== "admin") {
                showModal = true;
            } else {
                showModal = false;
            }
        }
    }
</script>

<AuthErrorModal isOpen={showModal} onClose={handleClose} />

{#if $auth.loading}
    <div class="flex h-screen w-full items-center justify-center">
        <div class="loading loading-spinner loading-lg text-purple-600"></div>
    </div>
{:else if $auth.isAuthenticated && $auth.user?.role === "admin"}
    <slot />
{:else}
    <!-- Hidden content for unauthorized users -->
    <div class="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div class="loading loading-dots loading-md text-gray-300"></div>
        <p class="text-sm font-medium text-gray-400">
            Verifying permissions...
        </p>
    </div>
{/if}
