<script>
    import { Plus, Edit, Trash2 } from "lucide-svelte";
    import { tagService } from "$lib/api/tag.service";
    import CreateTagModal from "$lib/components/modals/admin/tag/createTag.svelte";
    import EditTagModal from "$lib/components/modals/admin/tag/editTag.svelte";
    import DeleteConfirmationModal from "$lib/components/modals/admin/tag/deletComfirmation.svelte";
    import AssignTagJobModal from "$lib/components/modals/admin/tag/assignTagJob.svelte";

    let loading = $state(true);
    let tags = $state([]);

    async function loadTags() {
        loading = true;
        try {
            const data = await tagService.listTags();
            tags = data;
            console.log("tags loaded:", tags);
        } catch (error) {
            console.error("Failed to load tags:", error);
        } finally {
            loading = false;
        }
    }

    $effect(() => {
        loadTags();
    });
</script>

<div class="space-y-8 max-w-full mx-auto">
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
        <div>
            <h1 class="text-xl font-semibold text-gray-900 tracking-tight">
                Tags Management
            </h1>
            <p class="text-gray-500 mt-1 text-sm">
                Manage, and Assign Jobs to your tags.
            </p>
        </div>
        <CreateTagModal onSuccess={loadTags} />
    </div>

    <!-- tag list -->
    <div class="bg-white rounded-lg border border-gray-100 overflow-hidden">
        {#if loading}
            <div class="flex flex-col items-center justify-center py-24 gap-4">
                <span class="loading loading-spinner loading-lg text-purple-600"
                ></span>
                <span class="text-gray-400 font-medium tracking-wide"
                    >Fetching Tags data...</span
                >
            </div>
        {:else}
            <div
                class="overflow-x-auto rounded-box border border-base-content/5 bg-base-100"
            >
                <table class="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Color</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each tags as tag (tag.ID || tag.id)}
                            <tr>
                                <td class="font-medium"
                                    >{tag.Name || tag.name}</td
                                >
                                <td>
                                    <span class="badge">
                                        {#if typeof tag.Category === "object"}
                                            {tag.Category.TagCategory ||
                                                tag.Category.category ||
                                                "General"}
                                        {:else}
                                            {tag.Category ||
                                                tag.category ||
                                                "General"}
                                        {/if}
                                    </span>
                                </td>
                                <td class="max-w-xs truncate"
                                    >{tag.Description ||
                                        tag.description ||
                                        "-"}</td
                                >
                                <td>
                                    <div class="flex items-center gap-2">
                                        <div
                                            class="w-4 h-4 rounded-full"
                                            style="background-color: {tag.Color ||
                                                tag.color ||
                                                '#CCCCCC'}"
                                        ></div>
                                        <span class="text-xs font-mono"
                                            >{tag.Color ||
                                                tag.color ||
                                                "Default"}</span
                                        >
                                    </div>
                                </td>
                                <td class="text-sm">
                                    {new Date(
                                        tag.CreatedAt || tag.created_at,
                                    ).toLocaleDateString()}
                                </td>
                                <td>
                                    <div class="flex items-center gap-1">
                                        <AssignTagJobModal
                                            {tag}
                                            onSuccess={loadTags}
                                        />
                                        <EditTagModal
                                            {tag}
                                            onSuccess={loadTags}
                                        />
                                        <DeleteConfirmationModal
                                            {tag}
                                            onSuccess={loadTags}
                                        />
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <!-- Optional: Show empty state -->
            {#if tags.length === 0}
                <div class="text-center py-12">
                    <p class="text-gray-400">
                        No tags found. Create your first tag!
                    </p>
                </div>
            {/if}
        {/if}
    </div>
</div>
