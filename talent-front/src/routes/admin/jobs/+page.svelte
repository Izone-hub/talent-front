<script>
    import { jobService } from "$lib/api/job.service";
    import {
        Plus,
        Briefcase,
        MapPin,
        Clock,
        Search,
        ChevronDown,
        ChevronRight,
        Eye,
        Globe,
        Layout,
        Server,
        Network,
        Smartphone,
        Code2,
        XCircle,
        HelpCircle,
        MoreHorizontal,
        Send,
        Archive,
        Ban,
    } from "lucide-svelte";
    import PageLoader from "$lib/components/ui/PageLoader.svelte";
    import EmptyState from "$lib/components/ui/EmptyState.svelte";
    import { showToast } from "$lib/stores/toast";
    import { goto } from "$app/navigation";
    import JobDetailModal from "$lib/components/modals/admin/jobs/job-detail.svelte";

    let jobs = $state([]);
    let loading = $state(true);
    let isDetailModalOpen = $state(false);
    let selectedJob = $state(null);
    let searchQuery = $state("");
    let expandedStatuses = $state(new Set(["published", "draft"]));
    let expandedCategories = $state(new Set());

    const statusOrder = ["published", "draft", "closed", "archived"];

    const statusCfg = {
        published: { label: "Published", dot: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100" },
        draft: { label: "Draft", dot: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100" },
        closed: { label: "Closed", dot: "bg-rose-500", text: "text-rose-600", bg: "bg-rose-50", ring: "ring-rose-100" },
        archived: { label: "Archived", dot: "bg-gray-400", text: "text-gray-600", bg: "bg-gray-100", ring: "ring-gray-200" },
    };

    const categories = [
        { value: "full_stack_developer", label: "Full Stack", icon: Code2 },
        { value: "web_developer", label: "Web Developer", icon: Globe },
        { value: "frontend_developer", label: "Frontend", icon: Layout },
        { value: "backend_developer", label: "Backend", icon: Server },
        { value: "system_architect", label: "System Architect", icon: Network },
        { value: "mobile_developer", label: "Mobile Dev", icon: Smartphone },
    ];

    const typeLabels = {
        full_time: "Full Time",
        part_time: "Part Time",
        contract: "Contract",
        freelance: "Freelance",
        internship: "Internship",
    };

    let tree = $derived(buildTree());

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

    function buildTree() {
        const q = searchQuery.trim()
            ? jobs.filter((job) =>
                  (job.title + " " + (job.location || "")).toLowerCase().includes(searchQuery.trim().toLowerCase())
              )
            : jobs;

        const byStatus = new Map();
        for (const job of q) {
            const s = (job.status || "draft").toLowerCase();
            if (!byStatus.has(s)) byStatus.set(s, []);
            byStatus.get(s).push(job);
        }

        const nodes = [];
        for (const s of Object.keys(statusCfg)) {
            const items = byStatus.get(s);
            if (!items) continue;
            const cfg = statusCfg[s];

            const byCat = new Map();
            for (const job of items) {
                const c = job.category || "other";
                if (!byCat.has(c)) byCat.set(c, []);
                byCat.get(c).push(job);
            }

            const catNodes = [];
            for (const cat of [...byCat.keys()]) {
                const catItems = byCat.get(cat);
                const catCfg = categories.find((c) => c.value === cat);
                catNodes.push({
                    value: cat,
                    label: catCfg?.label || cat.replace(/_/g, " "),
                    icon: catCfg?.icon || Briefcase,
                    jobs: catItems,
                });
            }

            nodes.push({
                value: s,
                label: cfg.label,
                dot: cfg.dot,
                text: cfg.text,
                bg: cfg.bg,
                ring: cfg.ring,
                count: items.length,
                categories: catNodes,
            });
        }
        return nodes;
    }

    function toggleStatus(s) {
        const next = new Set(expandedStatuses);
        if (next.has(s)) next.delete(s);
        else next.add(s);
        expandedStatuses = next;
    }

    function toggleCategory(key) {
        const next = new Set(expandedCategories);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        expandedCategories = next;
    }

    function openJobDetail(job) {
        selectedJob = job;
        isDetailModalOpen = true;
    }

    async function updateJobStatus(id, action) {
        try {
            if (action === "publish") await jobService.publishJob(id);
            else if (action === "close") await jobService.closeJob(id);
            else if (action === "archive") await jobService.archiveJob(id);
            showToast(`Job ${action}ed successfully`, "success");
            await loadJobs();
        } catch (error) {
            showToast(`Failed to ${action} job`, "error");
        }
    }
</script>

<div class="max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">Job Management</h1>
            <p class="text-gray-500 mt-0.5 text-sm">{jobs.length} jobs</p>
        </div>
        <button
            class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
            onclick={() => goto("/admin/jobs/create")}
        >
            <Plus size={16} />
            Post New Job
        </button>
    </div>

    <!-- Search -->
    <div class="relative">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
            type="text"
            placeholder="Search jobs..."
            class="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            bind:value={searchQuery}
        />
        {#if searchQuery}
            <button
                class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded"
                onclick={() => (searchQuery = "")}
            >
                <XCircle size={16} />
            </button>
        {/if}
    </div>

    <!-- Tree -->
    {#if loading}
        <PageLoader message="Fetching your job data..." />
    {:else if tree.length === 0}
        <div class="bg-white rounded-lg border border-gray-100 p-12">
            <EmptyState
                icon={Briefcase}
                title="No jobs found"
                description={searchQuery ? "Try a different search term" : "Start by posting your first job opportunity to attract talent."}
            />
        </div>
    {:else}
        <!-- Level 1: Status -->
        <div class="space-y-3">
            {#each tree as statusNode}
                {@const isStatusOpen = expandedStatuses.has(statusNode.value)}
                <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <button
                        class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        onclick={() => toggleStatus(statusNode.value)}
                    >
                        {#if isStatusOpen}
                            <ChevronDown size={16} class="text-gray-400 shrink-0" />
                        {:else}
                            <ChevronRight size={16} class="text-gray-400 shrink-0" />
                        {/if}
                        <span class="w-2.5 h-2.5 rounded-full {statusNode.dot} shrink-0"></span>
                        <span class="flex-1 font-semibold text-gray-800">{statusNode.label}</span>
                        <span class="text-xs font-semibold text-gray-400">{statusNode.count}</span>
                    </button>

                    {#if isStatusOpen}
                        <div class="border-t border-gray-100">
                            <!-- Level 2: Category -->
                            <div class="space-y-1 p-2">
                                {#each statusNode.categories as catNode}
                                    {@const catKey = `${statusNode.value}:${catNode.value}`}
                                    {@const isCatOpen = expandedCategories.has(catKey)}
                                    <div>
                                        <button
                                            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                            onclick={() => toggleCategory(catKey)}
                                        >
                                            {#if isCatOpen}
                                                <ChevronDown size={14} class="text-gray-400 shrink-0" />
                                            {:else}
                                                <ChevronRight size={14} class="text-gray-400 shrink-0" />
                                            {/if}
                                            <span class="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                <catNode.icon size={14} class="text-gray-500" />
                                            </span>
                                            <span class="flex-1 text-sm font-medium text-gray-700">{catNode.label}</span>
                                            <span class="text-xs font-medium text-gray-400">{catNode.jobs.length}</span>
                                        </button>

                                        {#if isCatOpen}
                                            <!-- Level 3: Job rows -->
                                            <div class="space-y-1.5 pl-10 pr-2 pb-2">
                                                {#each catNode.jobs as job (job.id)}
                                                    <div class="group flex items-center gap-3 bg-gray-50 hover:bg-white border border-gray-100 hover:border-indigo-200 rounded-lg px-3 py-2.5 transition-colors">
                                                        <div class="flex-1 min-w-0">
                                                            <div class="flex items-center gap-2">
                                                                <p class="text-sm font-semibold text-gray-800 truncate">{job.title}</p>
                                                                {#if job.remote_possible}
                                                                    <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">REMOTE</span>
                                                                {/if}
                                                            </div>
                                                            <div class="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                                {#if job.location}
                                                                    <span class="flex items-center gap-1"><MapPin size={12} class="text-gray-400" />{job.location}</span>
                                                                {/if}
                                                                {#if job.job_type}
                                                                    <span class="flex items-center gap-1"><Clock size={12} class="text-gray-400" />{typeLabels[job.job_type] || job.job_type.replace(/_/g, " ")}</span>
                                                                {/if}
                                                                {#if job.experience_level}
                                                                    <span class="text-gray-400 capitalize">{job.experience_level.replace(/_/g, " ")}</span>
                                                                {/if}
                                                                {#if job.salary_min}
                                                                    <span class="text-emerald-600 font-medium">
                                                                        {job.salary_currency}{job.salary_min}{#if job.salary_max}–{job.salary_max}{/if}
                                                                    </span>
                                                                {/if}
                                                                {#if job.applications_count > 0}
                                                                    <span class="text-gray-400">{job.applications_count} apps</span>
                                                                {/if}
                                                            </div>
                                                        </div>
                                                        <div class="flex items-center gap-1 shrink-0">
                                                            <button
                                                                class="p-1.5 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                                title="View details"
                                                                onclick={() => openJobDetail(job)}
                                                            >
                                                                <Eye size={15} />
                                                            </button>
                                                            <div class="dropdown dropdown-end">
                                                                <button
                                                                    tabindex="0"
                                                                    class="p-1.5 text-gray-300 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                                                >
                                                                    <MoreHorizontal size={15} />
                                                                </button>
                                                                <ul tabindex="0" class="dropdown-content menu bg-white border border-gray-200 rounded-lg shadow-lg p-1 w-44 z-10">
                                                                    {#if job.status?.toLowerCase() !== "published"}
                                                                        <li><button onclick={() => updateJobStatus(job.id, "publish")} class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 rounded"><Send size={14} /> Publish</button></li>
                                                                    {/if}
                                                                    {#if job.status?.toLowerCase() !== "closed"}
                                                                        <li><button onclick={() => updateJobStatus(job.id, "close")} class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-rose-50 rounded"><Ban size={14} /> Close</button></li>
                                                                    {/if}
                                                                    {#if job.status?.toLowerCase() !== "archived"}
                                                                        <li><button onclick={() => updateJobStatus(job.id, "archive")} class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"><Archive size={14} /> Archive</button></li>
                                                                    {/if}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
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
