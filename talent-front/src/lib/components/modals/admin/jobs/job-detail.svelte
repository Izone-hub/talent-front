<script>
    import { createEventDispatcher } from "svelte";
    import {
        XCircle,
        MapPin,
        Building2,
        Globe,
        Clock,
        DollarSign,
        CheckCircle2,
        Archive,
        Pencil,
    } from "lucide-svelte";
    import { jobService } from "$lib/api/job.service";
    import { showToast } from "$lib/stores/toast";
    import EditJobModal from "./edit-job.svelte";

    const dispatch = createEventDispatcher();

    export let isOpen = false;
    export let job = null;

    let isLoadingAction = false;
    let isEditModalOpen = false;

    function close() {
        dispatch("close");
    }

    async function handlePublish() {
        if (!job || !job.id) return;
        isLoadingAction = true;
        try {
            await jobService.publishJob(job.id);
            showToast("Job published successfully", "success");
            dispatch("jobUpdated");
            close();
        } catch (error) {
            showToast("Failed to publish job", "error");
        } finally {
            isLoadingAction = false;
        }
    }

    async function handleArchive() {
        if (!job || !job.id) return;
        isLoadingAction = true;
        try {
            await jobService.archiveJob(job.id);
            showToast("Job archived successfully", "success");
            dispatch("jobUpdated");
            close();
        } catch (error) {
            showToast("Failed to archive job", "error");
        } finally {
            isLoadingAction = false;
        }
    }

    async function handleClose() {
        if (!job || !job.id) return;
        isLoadingAction = true;
        try {
            await jobService.closeJob(job.id);
            showToast("Job closed successfully", "success");
            dispatch("jobUpdated");
            close();
        } catch (error) {
            showToast("Failed to close job", "error");
        } finally {
            isLoadingAction = false;
        }
    }

    async function handleEditSubmit(event) {
        const { id, data } = event.detail;
        isLoadingAction = true;
        try {
            await jobService.updateJob(id, data);
            showToast("Job updated successfully", "success");
            isEditModalOpen = false;
            dispatch("jobUpdated");
            close();
        } catch (error) {
            showToast("Failed to update job", "error");
        } finally {
            isLoadingAction = false;
        }
    }

    // Function to gracefully render HTML from description or simple string
    function renderHTML(content) {
        if (!content) return "";
        // Replace newlines with <br /> if it's plain text, otherwise leave valid HTML
        return content.replace(/\n/g, "<br />");
    }
</script>

{#if isOpen && job}
    <div
        class="modal modal-open bg-black/40 backdrop-blur-sm transition-all duration-300 z-[100]"
    >
        <div
            class="modal-box max-w-4xl rounded-lg p-0 overflow-hidden border-none scale-95"
        >
            <!-- Header -->
            <div
                class="bg-gray-50 p-6 border-b border-gray-100 flex items-start justify-between relative"
            >
                <div class="flex items-center gap-4">
                    <div
                        class="w-16 h-16 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center p-2"
                    >
                        {#if job.company_logo}
                            <img
                                src={job.company_logo}
                                alt={job.company}
                                class="w-full h-full object-contain"
                            />
                        {:else}
                            <Building2 class="text-gray-400" size={32} />
                        {/if}
                    </div>
                    <div>
                        <h2
                            class="text-2xl font-bold font-display text-gray-900"
                        >
                            {job.title}
                        </h2>
                        <div
                            class="flex items-center gap-3 mt-1 text-sm text-gray-500 font-medium"
                        >
                            <span class="flex items-center gap-1">
                                <Building2 size={16} />
                                {job.company}
                            </span>
                            {#if job.location}
                                <span class="flex items-center gap-1">
                                    <MapPin size={16} />
                                    {job.location}
                                </span>
                            {/if}
                            <span class="flex items-center gap-1">
                                <Clock size={16} />
                                {job.job_type}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    class="btn btn-ghost btn-circle btn-sm text-gray-400 hover:text-gray-700"
                    on:click={close}
                >
                    <XCircle size={22} />
                </button>
            </div>

            <!-- Body -->
            <div
                class="p-8 max-h-[65vh] overflow-y-auto custom-scrollbar bg-white text-gray-700"
            >
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <!-- Left Column: Main Content -->
                    <div class="md:col-span-2 space-y-8">
                        <div>
                            <h3
                                class="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3 block"
                            >
                                Description
                            </h3>
                            <div
                                class="prose prose-sm max-w-none text-gray-600 leading-relaxed"
                            >
                                {@html renderHTML(job.description)}
                            </div>
                        </div>

                        {#if job.requirements}
                            <div>
                                <h3
                                    class="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3 block"
                                >
                                    Requirements
                                </h3>
                                <div
                                    class="prose prose-sm max-w-none text-gray-600 leading-relaxed"
                                >
                                    {@html renderHTML(job.requirements)}
                                </div>
                            </div>
                        {/if}

                        {#if job.responsibilities}
                            <div>
                                <h3
                                    class="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3 block"
                                >
                                    Responsibilities
                                </h3>
                                <div
                                    class="prose prose-sm max-w-none text-gray-600 leading-relaxed"
                                >
                                    {@html renderHTML(job.responsibilities)}
                                </div>
                            </div>
                        {/if}

                        {#if job.benefits}
                            <div>
                                <h3
                                    class="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3 block"
                                >
                                    Benefits
                                </h3>
                                <div
                                    class="prose prose-sm max-w-none text-gray-600 leading-relaxed"
                                >
                                    {@html renderHTML(job.benefits)}
                                </div>
                            </div>
                        {/if}
                    </div>

                    <!-- Right Column: Sidebar -->
                    <div class="space-y-6">
                        <div
                            class="bg-gray-50 p-5 rounded-2xl ring-1 ring-gray-100"
                        >
                            <h4
                                class="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 block"
                            >
                                Job Details
                            </h4>

                            <ul class="space-y-4">
                                <li>
                                    <span
                                        class="text-xs font-semibold text-gray-400 block mb-1"
                                        >Status</span
                                    >
                                    <span
                                        class="badge badge-lg font-bold
                                        {job.status === 'published'
                                            ? 'badge-success text-white'
                                            : job.status === 'archived'
                                              ? 'badge-ghost'
                                              : job.status === 'closed'
                                                ? 'badge-error'
                                                : 'badge-warning'}"
                                    >
                                        {(job.status || "Draft").toUpperCase()}
                                    </span>
                                </li>

                                <li>
                                    <span
                                        class="text-xs font-semibold text-gray-400 block mb-1"
                                        >Experience Level</span
                                    >
                                    <span
                                        class="font-medium text-gray-700 capitalize"
                                        >{job.experience_level ||
                                            "Not specified"}</span
                                    >
                                </li>

                                <li>
                                    <span
                                        class="text-xs font-semibold text-gray-400 block mb-1"
                                        >Salary Range</span
                                    >
                                    <span class="font-medium text-gray-700">
                                        {#if job.salary_min && job.salary_max}
                                            {job.salary_currency}
                                            {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()}
                                        {:else if job.salary_min}
                                            From {job.salary_currency}
                                            {job.salary_min.toLocaleString()}
                                        {:else}
                                            Not provided
                                        {/if}
                                    </span>
                                </li>

                                <li>
                                    <span
                                        class="text-xs font-semibold text-gray-400 block mb-1"
                                        >Remote Available</span
                                    >
                                    <span class="font-medium text-gray-700"
                                        >{job.remote_possible
                                            ? "Yes"
                                            : "No"}</span
                                    >
                                </li>
                            </ul>
                        </div>

                        {#if job.company_website || job.company_location}
                            <div
                                class="bg-gray-50 p-5 rounded-2xl ring-1 ring-gray-100"
                            >
                                <h4
                                    class="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 block"
                                >
                                    Company Info
                                </h4>
                                <ul class="space-y-3">
                                    {#if job.company_website}
                                        <li>
                                            <a
                                                href={job.company_website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium whitespace-break-spaces"
                                            >
                                                <Globe size={16} />
                                                <span
                                                    class="truncate max-w-[200px] block"
                                                    >{job.company_website}</span
                                                >
                                            </a>
                                        </li>
                                    {/if}
                                    {#if job.company_location}
                                        <li
                                            class="flex items-center gap-2 text-sm text-gray-600 font-medium"
                                        >
                                            <MapPin size={16} />
                                            {job.company_location}
                                        </li>
                                    {/if}
                                </ul>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Footer Actions -->
            <div
                class="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between"
            >
                <div>
                    {#if job.created_at}
                        <span class="text-xs text-gray-400 font-medium"
                            >Created: {new Date(
                                job.created_at,
                            ).toLocaleDateString()}</span
                        >
                    {/if}
                </div>

                <div class="flex items-center gap-3">
                    <button
                        class="btn btn-ghost rounded-lg font-bold text-gray-500"
                        on:click={close}
                        disabled={isLoadingAction}
                    >
                        Close
                    </button>

                    {#if !job.status || job.status.toLowerCase() === "draft"}
                        <button
                            class="btn btn-outline border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 rounded-lg font-bold"
                            on:click={() => (isEditModalOpen = true)}
                            disabled={isLoadingAction}
                        >
                            <Pencil size={18} /> Edit
                        </button>
                        <button
                            class="btn btn-outline border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 rounded-lg font-bold"
                            on:click={handleArchive}
                            disabled={isLoadingAction}
                        >
                            {#if isLoadingAction}
                                <span class="loading loading-spinner loading-sm"
                                ></span>
                            {:else}
                                <Archive size={18} /> Archive Draft
                            {/if}
                        </button>
                        <button
                            class="btn btn-primary bg-purple-600 hover:bg-purple-700 border-none rounded-lg shadow-lg shadow-purple-100 font-bold px-8"
                            on:click={handlePublish}
                            disabled={isLoadingAction}
                        >
                            {#if isLoadingAction}
                                <span
                                    class="loading loading-spinner loading-sm gap-2"
                                    >Publishing...</span
                                >
                            {:else}
                                <CheckCircle2 size={18} /> Publish Job
                            {/if}
                        </button>
                    {/if}

                    {#if job.status?.toLowerCase() === "published"}
                        <button
                            class="btn btn-outline border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 rounded-lg font-bold"
                            on:click={handleClose}
                            disabled={isLoadingAction}
                        >
                            {#if isLoadingAction}
                                <span class="loading loading-spinner loading-sm"
                                ></span>
                            {:else}
                                <Archive size={18} /> Close Job
                            {/if}
                        </button>
                        <button
                            class="btn btn-primary bg-purple-600 hover:bg-purple-700 border-none rounded-lg shadow-lg shadow-purple-100 font-bold px-8"
                            on:click={handleArchive}
                            disabled={isLoadingAction}
                        >
                            {#if isLoadingAction}
                                <span
                                    class="loading loading-spinner loading-sm gap-2"
                                    >Archiving...</span
                                >
                            {:else}
                                <Archive size={18} /> Archive Job
                            {/if}
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}

<EditJobModal
    isOpen={isEditModalOpen}
    {job}
    on:close={() => (isEditModalOpen = false)}
    on:submit={handleEditSubmit}
/>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #ddd;
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #ccc;
    }

    .font-display {
        font-family: "Inter", sans-serif;
    }
</style>
