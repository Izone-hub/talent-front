<script>
    import { jobService } from "$lib/api/job.service";
    import {
        Plus,
        Briefcase,
        MapPin,
        Clock,
        Search,
        ArrowLeft,
        X,
    } from "lucide-svelte";
    import { getCategoryConfig } from "$lib/utils/jobCategories";
    import EmptyState from "$lib/components/ui/EmptyState.svelte";
    import AdminPageHeader from "$lib/components/ui/AdminPageHeader.svelte";
    import AdminJobsSkeleton from "$lib/components/ui/skeletons/AdminJobsSkeleton.svelte";
    import { showToast } from "$lib/stores/toast";
    import { goto } from "$app/navigation";
    import JobDetailModal from "$lib/components/modals/admin/jobs/job-detail.svelte";

    let jobs = $state([]);
    let loading = $state(true);
    let searchQuery = $state("");
    let selectedCategory = $state(null);
    let selectedStatus = $state("all");

    let isDetailModalOpen = $state(false);
    let selectedJob = $state(null);

    // Category icon/color visuals live in $lib/utils/jobCategories.js (shared with the Applications page)

    // ================================================================
    // [TEMP] Demo categories — UI testing only.
    // These are appended to the category grid (with 0 jobs) whenever a
    // category key is missing from the jobs returned by the backend, so the
    // grid still fills the page when there are only a few real categories.
    // Delete this list (and the demo visuals block above) once the backend
    // returns the real set of categories.
    // ================================================================
    const DEMO_CATEGORIES = [
        { key: "engineering", label: "Engineering" },
        { key: "design", label: "Design" },
        { key: "product", label: "Product" },
        { key: "marketing", label: "Marketing" },
        { key: "finance", label: "Finance" },
        { key: "human_resources", label: "Human Resources" },
        { key: "customer_support", label: "Customer Support" },
        { key: "other", label: "Other Jobs" },
    ];

    // Reuse the same large-card grid + demo fill for the loading skeleton.
    // Kept in one place so the skeleton always matches the real category grid.
    // Max 3 cards per row (like the rest of the admin section) so each card
    // keeps a comfortable width; extra rows simply wrap below.
    const CATEGORY_GRID_CLASS = "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    const CATEGORY_CARD_CLASS =
        "group flex min-h-[8.5rem] w-full items-center text-left bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer";

    const statusConfig = {
        all: { label: "All", badge: "bg-gray-100 text-gray-600" },
        published: { label: "Published", badge: "bg-emerald-50 text-emerald-600" },
        draft: { label: "Draft", badge: "bg-amber-50 text-amber-600" },
        closed: { label: "Closed", badge: "bg-rose-50 text-rose-600" },
        archived: { label: "Archived", badge: "bg-gray-100 text-gray-500" },
    };

    const statusTabs = ["all", "published", "draft", "closed", "archived"];

    const typeLabels = {
        full_time: "Full Time",
        part_time: "Part Time",
        contract: "Contract",
        freelance: "Freelance",
        internship: "Internship",
    };

    const filteredJobs = $derived(
        searchQuery.trim()
            ? jobs.filter((job) =>
                  (job.title + " " + (job.company || "") + " " + (job.location || "")).toLowerCase().includes(searchQuery.trim().toLowerCase())
              )
            : jobs
    );

    // Level 1: group by category
    const categoryGroups = $derived(() => {
        const groups = new Map();
        for (const job of filteredJobs) {
            const c = job.category || "other";
            if (!groups.has(c)) groups.set(c, []);
            groups.get(c).push(job);
        }
        const ordered = [];
        for (const c of ["full_stack_developer", "web_developer", "frontend_developer", "backend_developer", "system_architect", "mobile_developer"]) {
            if (groups.has(c)) {
                ordered.push({ category: c, jobs: groups.get(c) });
            }
        }
        for (const [c, js] of groups) {
            if (!["full_stack_developer", "web_developer", "frontend_developer", "backend_developer", "system_architect", "mobile_developer"].includes(c)) {
                ordered.push({ category: c, jobs: js });
            }
        }
        // [TEMP] Append demo categories that have no real jobs yet, so the
        // grid stays full while the backend only returns a few categories.
        for (const demo of DEMO_CATEGORIES) {
            if (!groups.has(demo.key)) {
                ordered.push({ category: demo.key, jobs: [] });
            }
        }
        return ordered;
    });

    // Level 2: jobs in selected category, filtered by status tab
    const categoryJobs = $derived(() => {
        if (!selectedCategory) return [];
        const catJobs = filteredJobs.filter((j) => (j.category || "other") === selectedCategory);
        if (selectedStatus === "all") return catJobs;
        return catJobs.filter((j) => (j.status || "draft").toLowerCase() === selectedStatus);
    });

    // Status counts for the current category
    const statusCounts = $derived(() => {
        if (!selectedCategory) return {};
        const catJobs = filteredJobs.filter((j) => (j.category || "other") === selectedCategory);
        const counts = { all: catJobs.length };
        for (const job of catJobs) {
            const s = (job.status || "draft").toLowerCase();
            counts[s] = (counts[s] || 0) + 1;
        }
        return counts;
    });

    function getStatusBadge(status) {
        return statusConfig[status]?.badge || "bg-gray-100 text-gray-500";
    }

    function getStatusLabel(status) {
        return statusConfig[status]?.label || status || "Other";
    }

    function selectCategory(cat) {
        selectedCategory = cat;
        selectedStatus = "all";
    }

    function goBack() {
        selectedCategory = null;
        selectedStatus = "all";
    }

    function openJobDetail(job) {
        selectedJob = job;
        isDetailModalOpen = true;
    }

    $effect(() => {
        loadJobs();
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
</script>

<div class="space-y-6 max-w-full mx-auto">
    <AdminPageHeader
        title="Jobs"
        subtitle={loading ? null : `${jobs.length} jobs — ${selectedCategory ? getCategoryConfig(selectedCategory).label : "click a category to explore"}`}
    >
        <button
            class="btn btn-primary bg-purple-600 hover:bg-purple-700 border-none px-6 shadow-none"
            onclick={() => goto("/admin/jobs/create")}
        >
            <Plus size={16} />
            Post New Job
        </button>
    </AdminPageHeader>

    {#if loading}
        <AdminJobsSkeleton />
    {:else if jobs.length === 0}
        <EmptyState
            icon={Briefcase}
            title="No jobs yet"
            description="Post your first job to get started"
        />
    {:else}
        <!-- Search -->
        <div class="relative">
            <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
                type="text"
                placeholder={selectedCategory ? `Search ${getCategoryConfig(selectedCategory).label} jobs...` : "Search jobs..."}
                class="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                bind:value={searchQuery}
            />
            {#if searchQuery}
                <button
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded"
                    onclick={() => (searchQuery = "")}
                >
                    <X size={16} />
                </button>
            {/if}
        </div>

        {#if selectedCategory === null}
            <!-- ============================================================ -->
            <!-- LEVEL 1: Category Cards (Tags-style grid)                     -->
            <!-- ============================================================ -->
            <div class="{CATEGORY_GRID_CLASS}">
                {#each categoryGroups() as group}
                    {@const cfg = getCategoryConfig(group.category)}
                    <button
                        class="{CATEGORY_CARD_CLASS}"
                        onclick={() => selectCategory(group.category)}
                    >
                        <div class="flex w-full items-center gap-4">
                            <div
                                class="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform"
                                style="background-color: {cfg.color}"
                            >
                                <cfg.icon size={22} />
                            </div>
                            <div class="min-w-0 flex-1">
                                <h3 class="text-base font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                                    {cfg.label}
                                </h3>
                                <p class="mt-1 text-xs text-gray-400 font-medium">
                                    {group.jobs.length} job{group.jobs.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                    </button>
                {/each}
            </div>

        {:else}
            <!-- ============================================================ -->
            <!-- LEVEL 2: Category Workspace (Back + Tabs + Job Cards)         -->
            <!-- ============================================================ -->
            {@const cfg = getCategoryConfig(selectedCategory)}
            {@const counts = statusCounts()}

            <div class="space-y-4">
                <!-- Back button + Category header -->
                <div class="flex items-center gap-3">
                    <button
                        class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        onclick={goBack}
                    >
                        <ArrowLeft size={20} class="text-gray-500" />
                    </button>
                    <div
                        class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                        style="background-color: {cfg.color}"
                    >
                        <cfg.icon size={18} />
                    </div>
                    <div class="flex-1 min-w-0">
                        <h2 class="text-lg font-bold text-gray-900">{cfg.label}</h2>
                        <p class="text-xs text-gray-400">{counts.all || 0} jobs</p>
                    </div>
                </div>

                <!-- Status Tabs -->
                <div class="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                    {#each statusTabs as tab}
                        {@const tabCfg = statusConfig[tab]}
                        {@const count = counts[tab] || 0}
                        <button
                            class="px-4 py-1.5 rounded-md text-xs font-semibold transition-all
                                {selectedStatus === tab
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'}"
                            onclick={() => (selectedStatus = tab)}
                        >
                            {tabCfg.label}
                            {#if count > 0}
                                <span class="ml-1 text-[10px] opacity-60">({count})</span>
                            {/if}
                        </button>
                    {/each}
                </div>

                <!-- Job Cards Grid -->
                {#if categoryJobs().length === 0}
                    <div class="text-center py-12 text-gray-400">
                        <Briefcase size={32} class="mx-auto mb-2 opacity-40" />
                        <p class="text-sm">
                            {searchQuery ? `No jobs match "${searchQuery}"` : `No ${selectedStatus === "all" ? "" : selectedStatus} jobs in this category`}
                        </p>
                    </div>
                {:else}
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {#each categoryJobs() as job (job.id)}
                            <button
                                class="group text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                                onclick={() => openJobDetail(job)}
                            >
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform"
                                        style="background-color: {cfg.color}"
                                    >
                                        <cfg.icon size={18} />
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <h3 class="text-sm font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                                            {job.title}
                                        </h3>
                                        <p class="text-[11px] text-gray-400 font-medium">{job.company || cfg.label}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2 mt-2">
                                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full {getStatusBadge(job.status)}">
                                        {getStatusLabel(job.status)}
                                    </span>
                                    {#if job.location}
                                        <span class="flex items-center gap-1 text-[10px] text-gray-400">
                                            <MapPin size={10} />
                                            {job.location}
                                        </span>
                                    {/if}
                                    {#if job.job_type}
                                        <span class="flex items-center gap-1 text-[10px] text-gray-400">
                                            <Clock size={10} />
                                            {typeLabels[job.job_type] || job.job_type.replace(/_/g, " ")}
                                        </span>
                                    {/if}
                                    {#if job.remote_possible}
                                        <span class="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">REMOTE</span>
                                    {/if}
                                </div>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    {/if}
</div>

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
