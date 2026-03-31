<script>
    import { tagService } from "$lib/api/tag.service";
    import { showToast } from "$lib/stores/toast";
    import { Trash2, AlertTriangle } from "lucide-svelte";

    let { tag, onSuccess } = $props();

    // Modal state
    let modalId = $derived(`delete-tag-modal-${tag.id || tag.ID}`);
    let isDeleting = $state(false);

    function openModal() {
        const modal = document.getElementById(modalId);
        if (modal) modal.showModal();
    }

    function closeModal() {
        const modal = document.getElementById(modalId);
        if (modal) modal.close();
    }

    async function handleDelete() {
        isDeleting = true;
        try {
            await tagService.deleteTag(tag.id || tag.ID);
            closeModal();
            if (onSuccess) onSuccess();
            showToast("Tag deleted successfully", "success");
        } catch (error) {
            console.error("Failed to delete tag:", error);
            showToast("Failed to delete tag. Please try again.", "error");
        } finally {
            isDeleting = false;
        }
    }
</script>

<!-- Trigger Button (Delete Icon) -->
<button
    class="btn btn-sm btn-ghost hover:bg-red-50 text-red-600"
    onclick={openModal}
    title="Delete Tag"
>
    <Trash2 size={16} />
</button>

<!-- Modal -->
<dialog id={modalId} class="modal">
    <div class="modal-box max-w-sm text-center border-2 border-red-50">
        <form method="dialog">
            <button
                class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onclick={closeModal}
                type="button"
            >
                ✕
            </button>
        </form>

        <div class="flex flex-col items-center justify-center gap-4 py-4">
            <div
                class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2"
            >
                <AlertTriangle size={32} />
            </div>

            <div class="space-y-2">
                <h3 class="text-xl font-bold text-gray-900">Delete Tag?</h3>
                <p class="text-gray-500">
                    Are you sure you want to delete the tag <span
                        class="font-bold text-gray-900"
                        >"{tag.Name || tag.name}"</span
                    >? This action cannot be undone.
                </p>
            </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 mt-8">
            <button
                type="button"
                class="btn btn-ghost flex-1 sm:order-1"
                onclick={closeModal}
                disabled={isDeleting}
            >
                Cancel
            </button>
            <button
                type="button"
                class="btn btn-error bg-red-600 hover:bg-red-700 text-white border-none flex-1 sm:order-2"
                onclick={handleDelete}
                disabled={isDeleting}
            >
                {#if isDeleting}
                    <span class="loading loading-spinner loading-sm"></span>
                    Deleting...
                {:else}
                    Yes, Delete Tag
                {/if}
            </button>
        </div>
    </div>

    <!-- Click outside to close -->
    <form method="dialog" class="modal-backdrop">
        <button onclick={closeModal}>close</button>
    </form>
</dialog>

<style>
    .modal-box {
        overflow: hidden;
    }
</style>
