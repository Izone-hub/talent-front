<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { showToast } from "$lib/stores/toast";

    onMount(() => {
        showToast("No quiz ID provided. Please select a quiz from your applications.", "warning");
        goto("/applications");
    });
</script>

<div class="container">
    <p>Redirecting...</p>
</div>

<style>
    .container {
        max-width: 850px;
        margin: 3rem auto;
        padding: 0 1.5rem;
        font-family: system-ui, sans-serif;
        text-align: center;
        color: #64748b;
    }
</style>
