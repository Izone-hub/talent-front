<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/authStore";
    import PageLoader from "$lib/components/ui/PageLoader.svelte";

    onMount(async () => {
        const token = $page.url.searchParams.get("token");

        if (token) {
            localStorage.setItem("auth_token", token);
            await auth.init(false);
            if ($auth.user?.role === "admin") {
                goto("/admin/dashboard");
            } else {
                goto("/jobs");
            }
        } else {
            await auth.init(false);
            goto("/");
        }
    });
</script>

<PageLoader message="Completing secure login..." />
