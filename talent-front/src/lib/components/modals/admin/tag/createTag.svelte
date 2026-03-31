<script>
    import { tagService } from "$lib/api/tag.service";
    import { showToast } from "$lib/stores/toast";
    import { Plus } from "lucide-svelte";

    let { onSuccess } = $props();

    // Modal state
    let modalId = "create-tag-modal";
    let isOpen = $state(false);
    let isSubmitting = $state(false);

    // Form data
    let formData = $state({
        name: "",
        category: "skill",
        description: "",
        color: "#3B82F6",
    });
    // Category options (enum)
    const categories = [{ value: "skill", label: "Skill" }];

    // Reset form
    function resetForm() {
        formData = {
            name: "",
            category: "skill",
            description: "",
            color: "#3B82F6",
        };
    }

    // Open modal
    function openModal() {
        resetForm();
        isOpen = true;
        const modal = document.getElementById(modalId);
        if (modal) modal.showModal();
    }

    // Close modal
    function closeModal() {
        isOpen = false;
        const modal = document.getElementById(modalId);
        if (modal) modal.close();
    }

    // Handle form submission
    async function handleSubmit(e) {
        if (e) e.preventDefault();
        console.log("handleSubmit triggered");

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

            console.log(
                "Creating tag with payload:",
                JSON.stringify(payload, null, 2),
            );

            await tagService.createTag(payload);

            // Close modal and refresh tags list
            closeModal();

            // Refresh the tags list
            if (onSuccess) onSuccess();
            showToast("Tag created successfully", "success");
        } catch (error) {
            console.error("Failed to create tag:", error);
            showToast("Failed to create tag. Please try again.", "error");
        } finally {
            isSubmitting = false;
        }
    }
</script>

<!-- Trigger Button -->
<button
    class="btn btn-primary bg-purple-600 hover:bg-purple-700 border-none px-6 shadow-none"
    onclick={openModal}
>
    <Plus size={20} class="mr-2" />
    Create New Tag
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

        <h3 class="text-lg font-bold mb-2">Create New Tag</h3>
        <p class="text-sm text-gray-500 mb-6">
            Fill in the details to create a new tag
        </p>

        <form onsubmit={handleSubmit} novalidate>
            <!-- Tag Name -->
            <div class="form-control w-full mb-4 space-y-1">
                <label class="label" for="tag-name">
                    <span class="label-text font-medium"
                        >Tag Name <span class="text-error">*</span></span
                    >
                </label>
                <input
                    id="tag-name"
                    type="text"
                    bind:value={formData.name}
                    placeholder="e.g., AWS, Docker, React"
                    class="input input-bordered w-full focus:outline-none focus:border-purple-500"
                    required
                />
            </div>

            <!-- Category Dropdown -->
            <div class="form-control w-full mb-4 space-y-1">
                <label class="label" for="tag-category">
                    <span class="label-text font-medium"
                        >Category <span class="text-error">*</span></span
                    >
                </label>
                <select
                    id="tag-category"
                    bind:value={formData.category}
                    class="select select-bordered w-full focus:outline-none focus:border-purple-500"
                >
                    {#each categories as category}
                        <option value={category.value}>
                            {category.label}
                        </option>
                    {/each}
                </select>
                <div class="label pt-1">
                    <span class="label-text-alt text-gray-500">
                        Current category: <span class="font-medium"
                            >{categories.find(
                                (c) => c.value === formData.category,
                            )?.label}</span
                        >
                    </span>
                </div>
            </div>

            <!-- Description -->
            <div class="form-control w-full mb-4 space-y-1">
                <label class="label" for="tag-description">
                    <span class="label-text font-medium">Description</span>
                </label>
                <textarea
                    id="tag-description"
                    bind:value={formData.description}
                    placeholder="Describe what this tag represents..."
                    class="textarea textarea-bordered h-24 w-full focus:outline-none focus:border-purple-500"
                ></textarea>
            </div>

            <!-- Color Selection -->
            <div class="form-control w-full mb-4 space-y-1">
                <label class="label" for="tag-color">
                    <span class="label-text font-medium">Color</span>
                </label>

                <div class="flex items-center gap-3">
                    <input
                        type="color"
                        bind:value={formData.color}
                        class="w-12 h-12 p-1 bg-base-100 border border-base-300 rounded-lg cursor-pointer"
                        title="Pick a color"
                    />
                    <input
                        id="tag-color"
                        type="text"
                        bind:value={formData.color}
                        placeholder="#HEXCODE"
                        class="input input-bordered flex-1 font-mono text-sm focus:outline-none focus:border-purple-500"
                        spellcheck="false"
                    />
                </div>
            </div>

            <!-- Modal Actions -->
            <div class="modal-action mt-6">
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
                    class="btn btn-primary bg-purple-600 hover:bg-purple-700 border-none"
                    disabled={isSubmitting}
                >
                    {#if isSubmitting}
                        <span class="loading loading-spinner loading-sm"></span>
                        Creating...
                    {:else}
                        Create Tag
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
