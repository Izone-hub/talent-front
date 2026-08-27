<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/authStore";
    import CompilerPage from "$lib/components/CompilerPage.svelte";

    onMount(() => {
        waitForAuth();
    });

    async function waitForAuth() {
        if ($auth.loading) {
            const unsub = auth.subscribe((s) => {
                if (!s.loading) {
                    unsub();
                    if (!s.isAuthenticated) goto("/auth");
                }
            });
            return;
        }
        if (!$auth.isAuthenticated) goto("/auth");
    }
</script>

<CompilerPage />
