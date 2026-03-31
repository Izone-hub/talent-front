<script>
    import { onMount } from "svelte";
    import { jobService } from "$lib/api/job.service";
    import {
        Plus,
        Briefcase,
        MapPin,
        Clock,
        MoreVertical,
        ExternalLink,
        CheckCircle2,
        Archive,
        Search,
        Filter,
        XCircle,
    } from "lucide-svelte";
    import { showToast } from "$lib/stores/toast";
    import CreateJobModal from "$lib/components/modals/admin/jobs/CreateJobModal.svelte";
    import JobDetailModal from "$lib/components/modals/admin/jobs/job-detail.svelte";

    let jobs = [];
    let loading = true;
    let isCreateModalOpen = false;
    let isDetailModalOpen = false;
    let selectedJob = null;
    let searchQuery = "";
    let currentTab = "published";

    // Form state for new job
    let newJob = {
        title: "",
        company: "",
        company_logo: "",
        company_website: "",
        company_location: "",
        description: "",
        requirements: "",
        responsibilities: "",
        benefits: "",
        job_type: "full-time",
        experience_level: "entry",
        location: "",
        remote_possible: false,
        salary_min: null,
        salary_max: null,
        salary_currency: "USD",
        expires_at: "",
    };

    onMount(async () => {
        await loadJobs();
    });

    async function loadJobs() {
        loading = true;
        try {
            jobs = await jobService.listMyJobs();
        } catch (error) {
            showToast("Failed to load jobs", "error");
            console.error(error);
        } finally {
            loading = false;
        }
    }

    async function handleCreateJob(event) {
        const jobData = event.detail;
        try {
            await jobService.createJob(jobData);
            showToast("Job created successfully", "success");
            isCreateModalOpen = false;
            // Reset form
            newJob = {
                title: "",
                company: "",
                company_logo: "",
                company_website: "",
                company_location: "",
                description: "",
                requirements: "",
                responsibilities: "",
                benefits: "",
                job_type: "full-time",
                experience_level: "entry",
                location: "",
                remote_possible: false,
                salary_min: null,
                salary_max: null,
                salary_currency: "USD",
                expires_at: "",
            };
            await loadJobs();
        } catch (error) {
            showToast("Failed to create job", "error");
        }
    }

    async function updateJobStatus(id, action) {
        try {
            if (action === "publish") await jobService.publishJob(id);
            else if (action === "close") await jobService.closeJob(id);
            else if (action === "archive") await jobService.archiveJob(id);

            showToast(`Job ${action}ed successfuly`, "success");
            await loadJobs();
        } catch (error) {
            showToast(`Failed to ${action} job`, "error");
        }
    }

    function openJobDetail(job) {
        selectedJob = job;
        isDetailModalOpen = true;
    }

    function getStatusClass(status) {
        switch (status?.toLowerCase()) {
            case "published":
                return "badge-success";
            case "closed":
                return "badge-error";
            case "archived":
                return "badge-ghost";
            default:
                return "badge-warning";
        }
    }

    $: filteredJobs = jobs.filter((job) => {
        const matchesSearch =
            job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.location?.toLowerCase().includes(searchQuery.toLowerCase());

        const status = job.status?.toLowerCase() || "draft";
        const matchesTab = status === currentTab;

        return matchesSearch && matchesTab;
    });
</script>

<div class="space-y-8 max-w-full mx-auto">
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
        <div>
            <h1 class="text-xl font-semibold text-gray-900 tracking-tight">
                Job Management
            </h1>
            <p class="text-gray-500 mt-1 text-sm">
                Manage, publish, and track your job postings.
            </p>
        </div>
        <button
            class="btn btn-primary bg-purple-600 hover:bg-purple-700 border-none px-6 shadow-none"
            on:click={() => (isCreateModalOpen = true)}
        >
            <Plus size={20} class="mr-2" />
            Post New Job
        </button>
    </div>

    <!-- Filters & Search -->
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-4 rounded-lg border border-gray-100 px-6"
    >
        <div class="tabs tabs-boxed bg-gray-100/50 p-1 gap-1 rounded-lg">
            <button
                class="tab rounded-lg transition-all duration-200 h-10 px-4"
                class:bg-white={currentTab === "published"}
                class:text-purple-600={currentTab === "published"}
                on:click={() => (currentTab = "published")}
            >
                Published
                <!-- <span
                    class="ml-2 badge badge-sm badge-success text-white font-bold"
                >
                    {jobs.filter((j) => j.status?.toLowerCase() === "published")
                        .length}
                </span> -->
            </button>
            <button
                class="tab rounded-lg transition-all duration-200 h-10 px-4"
                class:bg-white={currentTab === "draft"}
                class:text-purple-600={currentTab === "draft"}
                on:click={() => (currentTab = "draft")}
            >
                Drafts
            </button>
            <button
                class="tab rounded-lg transition-all duration-200 h-10 px-4"
                class:bg-white={currentTab === "closed"}
                class:text-purple-600={currentTab === "closed"}
                on:click={() => (currentTab = "closed")}
            >
                Closed
            </button>
            <button
                class="tab rounded-lg transition-all duration-200 h-10 px-4"
                class:bg-white={currentTab === "archived"}
                class:text-purple-600={currentTab === "archived"}
                on:click={() => (currentTab = "archived")}
            >
                Archived
            </button>
        </div>

        <div class="relative w-full md:w-80">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
            />
            <input
                type="text"
                placeholder="Search within results..."
                class="input w-full pl-10 bg-gray-50 border-gray-100 focus:bg-white transition-all rounded-xl border-none focus:ring-1 focus:ring-purple-500 h-11"
                bind:value={searchQuery}
            />
        </div>
    </div>

    <!-- Jobs List -->
    <div class="bg-white rounded-lg border border-gray-100 overflow-hidden">
        {#if loading}
            <div class="flex flex-col items-center justify-center py-24 gap-4">
                <span class="loading loading-spinner loading-lg text-purple-600"
                ></span>
                <span class="text-gray-400 font-medium tracking-wide"
                    >Fetching your job data...</span
                >
            </div>
        {:else if filteredJobs.length === 0}
            <div class="py-24 text-center">
                <div
                    class="inline-flex items-center justify-center w-20 h-20 bg-gray-50 text-gray-300 rounded-full mb-4"
                >
                    <Briefcase size={32} />
                </div>
                <h3 class="text-lg font-semibold text-gray-900">
                    No jobs found
                </h3>
                <p class="text-gray-500 max-w-xs mx-auto mt-2">
                    {searchQuery
                        ? "We couldn't find any jobs matching your search."
                        : "Start by posting your first job opportunity to attract talent."}
                </p>
            </div>
        {:else}
            <div class="overflow-x-auto">
                <table class="table table-lg">
                    <thead>
                        <tr
                            class="bg-gray-50/50 text-gray-600 border-b border-gray-100"
                        >
                            <th class="font-bold py-5">Job Details</th>
                            <th class="font-bold">Status</th>
                            <th class="font-bold">Date Posted</th>
                            <th class="font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody
                        class="divide-y divide-gray-50 text-gray-900 font-medium"
                    >
                        {#each filteredJobs as job (job.id)}
                            <tr
                                class="hover:bg-gray-50/50 transition-colors group"
                            >
                                <td class="py-5">
                                    <div class="flex flex-col">
                                        <span
                                            class="text-base font-bold text-gray-900 group-hover:text-purple-600 transition-colors"
                                            >{job.title}</span
                                        >
                                        <div
                                            class="flex items-center gap-3 mt-1.5 text-sm text-gray-500"
                                        >
                                            <span
                                                class="flex items-center gap-1.5 bg-gray-100/80 px-2 py-0.5 rounded-md"
                                            >
                                                <MapPin
                                                    size={14}
                                                    class="text-gray-400"
                                                />
                                                {job.location}
                                            </span>
                                            <span
                                                class="flex items-center gap-1.5 bg-gray-100/80 px-2 py-0.5 rounded-md"
                                            >
                                                <Clock
                                                    size={14}
                                                    class="text-gray-400"
                                                />
                                                {job.job_type}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span
                                        class="badge {getStatusClass(
                                            job.status,
                                        )} badge-md font-bold px-3 py-3 border-none"
                                    >
                                        {job.status || "Draft"}
                                    </span>
                                </td>
                                <td>
                                    <div
                                        class="text-sm text-gray-500 font-medium"
                                    >
                                        {job.created_at
                                            ? new Date(
                                                  job.created_at,
                                              ).toLocaleDateString("en-US", {
                                                  month: "short",
                                                  day: "numeric",
                                                  year: "numeric",
                                              })
                                            : "---"}
                                    </div>
                                </td>
                                <td class="text-right">
                                    <div class="dropdown dropdown-end">
                                        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                                        <button
                                            on:click={() => openJobDetail(job)}
                                            class="text-purple-600 text-sm"
                                        >
                                            Details
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>

<!-- Create Job Modal Component -->
<CreateJobModal
    isOpen={isCreateModalOpen}
    jobData={newJob}
    on:close={() => (isCreateModalOpen = false)}
    on:submit={handleCreateJob}
/>

<JobDetailModal
    isOpen={isDetailModalOpen}
    job={selectedJob}
    on:close={() => {
        isDetailModalOpen = false;
        selectedJob = null;
    }}
    on:jobUpdated={async () => {
        await loadJobs();
    }}
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

    :global(.table thead tr th) {
        background-color: transparent !important;
    }
</style>
