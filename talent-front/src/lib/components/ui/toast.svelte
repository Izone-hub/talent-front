<script>
    import { toast } from "$lib/stores/toast";
</script>

{#if $toast.show}
    <div class="toast toast-top toast-end z-50">
        <div
            class="alert text-base-content"
            class:alert-success={$toast.type === "success"}
            class:alert-error={$toast.type === "error"}
            class:alert-warning={$toast.type === "warning"}
            class:alert-info={$toast.type === "info"}
        >
            {$toast.message}
        </div>
    </div>
{/if}
