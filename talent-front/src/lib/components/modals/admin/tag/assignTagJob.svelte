<script>
    import { onMount } from "svelte";
    import { tagService } from "$lib/api/tag.service";
    import { jobService } from "$lib/api/job.service";
    import { showToast } from "$lib/stores/toast";
    import { Link, Search, X, Check, Briefcase, Info } from "lucide-svelte";

    let { tag, onSuccess } = $props();

    // Modal state
    let modalId = $derived(`assign-jobs-modal-${tag.id || tag.ID}`);
    let isSubmitting = $state(false);
    let isLoadingJobs = $state(true);
    let allJobs = $state([]);
    let searchQuery = $state("");
    let selectedJobIds = $state([]);

    // Open/Close logic
    async function openModal() {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.showModal();
            await loadJobs();
        }
    }

    function closeModal() {
        const modal = document.getElementById(modalId);
        if (modal) modal.close();
    }

    async function loadJobs() {
        isLoadingJobs = true;
        try {
            // We fetch all jobs first
            const jobs = await jobService.listMyJobs();
            allJobs = jobs;

            // To-do: In a real app, we would also fetch which jobs ALREADY have this tag
            // For now, we'll assume we start fresh or the tag object has some info
            // selectedJobIds = tag.JobIDs || [];
        } catch (error) {
            console.error("Failed to load jobs for assignment:", error);
            showToast("Failed to load jobs list", "error");
        } finally {
            isLoadingJobs = false;
        }
    }

    // Filtered jobs based on search
    let filteredJobs = $derived(
        allJobs.filter(
            (job) =>
                job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.company?.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );

    function toggleJobSelection(jobId) {
        if (selectedJobIds.includes(jobId)) {
            selectedJobIds = selectedJobIds.filter((id) => id !== jobId);
        } else {
            selectedJobIds = [...selectedJobIds, jobId];
        }
    }

    // Handle form submission
    async function handleSubmit() {
        if (selectedJobIds.length === 0) {
            showToast("Please select at least one job", "info");
            return;
        }

        isSubmitting = true;

        try {
            await tagService.assignJobs(tag.id || tag.ID, selectedJobIds);
            console.log("tag-id:", tag.id || tag.ID);
            console.log("selectedJobIds:", selectedJobIds);

            showToast(
                `Tag successfully assigned to ${selectedJobIds.length} jobs`,
                "success",
            );
            closeModal();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Failed to assign tag to jobs:", error);
            showToast(
                "Failed to update assignments. Please try again.",
                "error",
            );
        } finally {
            isSubmitting = false;
        }
    }
</script>

<!-- Trigger Button -->
<button
    class="btn btn-sm btn-ghost hover:bg-purple-50 text-purple-600"
    onclick={openModal}
    title="Assign to Jobs"
>
    <Link size={16} />
</button>

<!-- Modal -->
<dialog id={modalId} class="modal">
    <div class="modal-box max-w-2xl p-0 overflow-hidden bg-white">
        <!-- Header -->
        <div
            class="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50"
        >
            <div class="flex items-center gap-3">
                <div>
                    <h3 class="text-xl font-bold text-gray-900">Assign Jobs</h3>
                    <p class="text-sm text-gray-500">
                        Tag: <span class="font-medium text-purple-600"
                            >{tag.name || tag.Name}</span
                        >
                    </p>
                </div>
            </div>
            <button
                class="btn btn-sm btn-circle btn-ghost"
                onclick={closeModal}
                type="button"
            >
                <X size={20} />
            </button>
        </div>

        <!-- Search Bar -->
        <div class="p-4 border-b border-gray-50 bg-white">
            <div class="relative">
                <Search
                    size={18}
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search by job title or company..."
                    class="input input-bordered w-full pl-10 focus:outline-none focus:border-purple-500 bg-gray-50/50"
                />
            </div>
        </div>

        <!-- Jobs List -->
        <div class="max-h-96 overflow-y-auto p-2 bg-white custom-scrollbar">
            {#if isLoadingJobs}
                <div
                    class="flex flex-col items-center justify-center py-20 gap-3"
                >
                    <span
                        class="loading loading-spinner loading-lg text-purple-600"
                    ></span>
                    <span class="text-sm text-gray-400 font-medium"
                        >Loading your jobs list...</span
                    >
                </div>
            {:else if filteredJobs.length === 0}
                <div
                    class="flex flex-col items-center justify-center py-20 text-center"
                >
                    <div
                        class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4"
                    >
                        <Briefcase size={32} />
                    </div>
                    <p class="text-gray-500 font-medium">
                        No matching jobs found
                    </p>
                    <p class="text-xs text-gray-400 mt-1">
                        Try a different search term or check your job listings.
                    </p>
                </div>
            {:else}
                <div class="grid grid-cols-1 gap-1">
                    {#each filteredJobs as job (job.id)}
                        <button
                            type="button"
                            class="flex items-center gap-4 p-4 rounded-xl transition-all text-left group {selectedJobIds.includes(
                                job.id,
                            )
                                ? 'bg-purple-50 border-purple-100'
                                : 'hover:bg-gray-50 border-transparent'}"
                            onclick={() => toggleJobSelection(job.id)}
                        >
                            <!-- Selection Checkbox -->
                            <div
                                class="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all {selectedJobIds.includes(
                                    job.id,
                                )
                                    ? 'bg-purple-600 border-purple-600'
                                    : 'border-gray-200 group-hover:border-purple-300'}"
                            >
                                {#if selectedJobIds.includes(job.id)}
                                    <Check size={14} class="text-white" />
                                {/if}
                            </div>

                            <!-- Job Info -->
                            <div class="flex-1">
                                <h4
                                    class="font-bold text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-1"
                                >
                                    {job.title}
                                </h4>
                                <div class="flex items-center gap-3 mt-1">
                                    <span
                                        class="text-xs text-gray-500 font-medium"
                                        >{job.company || "Your Company"}</span
                                    >
                                    <span
                                        class="w-1 h-1 bg-gray-300 rounded-full"
                                    ></span>
                                    <span class="text-xs text-gray-400"
                                        >{job.location}</span
                                    >
                                </div>
                            </div>

                            <!-- Status Badge (Optional) -->
                            <div class="hidden sm:block">
                                <span
                                    class="badge badge-sm {job.status ===
                                    'published'
                                        ? 'badge-success'
                                        : 'badge-ghost'} text-xs opacity-70"
                                >
                                    {job.status}
                                </span>
                            </div>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Footer -->
        <div
            class="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50"
        >
            <div class="text-sm font-medium text-gray-500">
                {#if selectedJobIds.length > 0}
                    <span class="text-purple-600 font-bold"
                        >{selectedJobIds.length}</span
                    >
                    job{selectedJobIds.length > 1 ? "s" : ""} selected
                {:else}
                    Select jobs to assign
                {/if}
            </div>
            <div class="flex gap-3">
                <button
                    type="button"
                    class="btn btn-ghost"
                    onclick={closeModal}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    class="btn btn-primary bg-purple-600 hover:bg-purple-700 border-none shadow-lg shadow-purple-200 px-8"
                    onclick={handleSubmit}
                    disabled={isSubmitting || isLoadingJobs}
                >
                    {#if isSubmitting}
                        <span class="loading loading-spinner loading-sm"></span>
                        Saving...
                    {:else}
                        Assign Tag
                    {/if}
                </button>
            </div>
        </div>
    </div>

    <!-- Click outside to close -->
    <form method="dialog" class="modal-backdrop">
        <button onclick={closeModal}>close</button>
    </form>
</dialog>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: #f8fafc;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #cbd5e1;
    }
</style>
