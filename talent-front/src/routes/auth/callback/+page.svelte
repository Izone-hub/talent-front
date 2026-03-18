<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/authStore";

    onMount(async () => {
        // This page handles the redirect back from your backend
        // Your backend should redirect here: http://localhost:5173/auth/callback?token=...&user=...

        const token = $page.url.searchParams.get("token");

        if (token) {
            // If the backend sends the token in the URL, we save it
            localStorage.setItem("auth_token", token);
            await auth.init(); // Re-verify and load user
            if ($auth.user?.role === "admin") {
                goto("/admin/dashboard");
            } else {
                goto("/jobs");
            }
        } else {
            // If there's no token in URL, maybe the backend set a cookie?
            // Or maybe it's an error.
            await auth.init();
            goto("/");
        }
    });
</script>

<div class="flex flex-col items-center justify-center min-h-screen">
    <div class="loading loading-spinner loading-lg text-primary"></div>
    <p class="mt-4 text-gray-500 font-medium">Completing secure login...</p>
</div>
