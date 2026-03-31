<script>
    import { tagService } from "$lib/api/tag.service";
    import { showToast } from "$lib/stores/toast";
    import { Edit } from "lucide-svelte";

    let { tag, onSuccess } = $props();

    // Modal state
    let modalId = $derived(`edit-tag-modal-${tag.id || tag.ID}`);
    let isSubmitting = $state(false);

    // Form data - initialize with tag data
    let formData = $state({
        name: tag.Name || tag.name || "",
        category:
            (typeof tag.Category === "object"
                ? tag.Category.TagCategory || tag.Category.category
                : tag.Category) ||
            tag.category ||
            "skill",
        description: tag.Description || tag.description || "",
        color: tag.Color || tag.color || "#3B82F6",
    });

    // Category options (enum)
    const categories = [{ value: "skill", label: "Skill" }];

    // Open/Close logic
    function openModal() {
        const modal = document.getElementById(modalId);
        if (modal) modal.showModal();
    }

    function closeModal() {
        const modal = document.getElementById(modalId);
        if (modal) modal.close();
    }

    // Handle form submission
    async function handleSubmit(e) {
        if (e) e.preventDefault();

        if (!formData.name.trim()) {
            showToast("Tag name is required", "error");
            return;
        }

        isSubmitting = true;

        try {
            const payload = {
                name: formData.name.trim(),
                category: formData.category,
                description: formData.description.trim() || null,
                color: formData.color,
            };

            await tagService.updateTag(tag.id || tag.ID, payload);

            closeModal();
            if (onSuccess) onSuccess();
            showToast("Tag updated successfully", "success");
        } catch (error) {
            console.error("Failed to update tag:", error);
            showToast("Failed to update tag. Please try again.", "error");
        } finally {
            isSubmitting = false;
        }
    }
</script>

<!-- Trigger Button (Edit Icon) -->
<button
    class="btn btn-sm btn-ghost hover:bg-blue-50 text-blue-600"
    onclick={openModal}
    title="Edit Tag"
>
    <Edit size={16} />
</button>

<!-- Modal -->
<dialog id={modalId} class="modal">
    <div class="modal-box max-w-xl">
        <form method="dialog">
            <button
                class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onclick={closeModal}
                type="button"
            >
                ✕
            </button>
        </form>

        <h3 class="text-lg font-bold mb-2 text-gray-900">Edit Tag</h3>
        <p class="text-sm text-gray-500 mb-6">
            Modify details for tag: <span class="font-medium text-purple-600"
                >{tag.Name || tag.name}</span
            >
        </p>

        <form onsubmit={handleSubmit} novalidate>
            <!-- Tag Name -->
            <div class="form-control w-full mb-4 space-y-1">
                <label class="label" for="edit-tag-name-{tag.id || tag.ID}">
                    <span class="label-text font-medium text-gray-700"
                        >Tag Name <span class="text-error">*</span></span
                    >
                </label>
                <input
                    id="edit-tag-name-{tag.id || tag.ID}"
                    type="text"
                    bind:value={formData.name}
                    placeholder="e.g., AWS, Docker, React"
                    class="input input-bordered w-full focus:outline-none focus:border-purple-500 bg-white"
                    required
                />
            </div>

            <!-- Category Dropdown -->
            <div class="form-control w-full mb-4 space-y-1">
                <label class="label" for="edit-tag-category-{tag.id || tag.ID}">
                    <span class="label-text font-medium text-gray-700"
                        >Category <span class="text-error">*</span></span
                    >
                </label>
                <select
                    id="edit-tag-category-{tag.id || tag.ID}"
                    bind:value={formData.category}
                    class="select select-bordered w-full focus:outline-none focus:border-purple-500 bg-white"
                >
                    {#each categories as category}
                        <option value={category.value}>
                            {category.label}
                        </option>
                    {/each}
                </select>
            </div>

            <!-- Description -->
            <div class="form-control w-full mb-4 space-y-1">
                <label
                    class="label"
                    for="edit-tag-description-{tag.id || tag.ID}"
                >
                    <span class="label-text font-medium text-gray-700"
                        >Description</span
                    >
                </label>
                <textarea
                    id="edit-tag-description-{tag.id || tag.ID}"
                    bind:value={formData.description}
                    placeholder="Describe what this tag represents..."
                    class="textarea textarea-bordered h-24 w-full focus:outline-none focus:border-purple-500 bg-white"
                ></textarea>
            </div>

            <!-- Color Selection -->
            <div class="form-control w-full mb-4 space-y-1 text-gray-900">
                <label class="label" for="edit-tag-color-{tag.id || tag.ID}">
                    <span class="label-text font-medium text-gray-700"
                        >Color</span
                    >
                </label>

                <div class="flex items-center gap-3">
                    <input
                        type="color"
                        bind:value={formData.color}
                        class="w-12 h-12 p-1 bg-white border border-base-300 rounded-lg cursor-pointer"
                        title="Pick a color"
                    />
                    <input
                        id="edit-tag-color-{tag.id || tag.ID}"
                        type="text"
                        bind:value={formData.color}
                        placeholder="#HEXCODE"
                        class="input input-bordered flex-1 font-mono text-sm bg-white"
                        spellcheck="false"
                    />
                </div>
            </div>

            <!-- Modal Actions -->
            <div class="modal-action mt-6 gap-2">
                <button
                    type="button"
                    class="btn btn-ghost"
                    onclick={closeModal}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    class="btn btn-primary bg-purple-600 hover:bg-purple-700 border-none px-8"
                    disabled={isSubmitting}
                >
                    {#if isSubmitting}
                        <span class="loading loading-spinner loading-sm"></span>
                        Updating...
                    {:else}
                        Save Changes
                    {/if}
                </button>
            </div>
        </form>
    </div>

    <!-- Click outside to close -->
    <form method="dialog" class="modal-backdrop">
        <button onclick={closeModal}>close</button>
    </form>
</dialog>
