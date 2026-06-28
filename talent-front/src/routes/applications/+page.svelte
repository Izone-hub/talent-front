<script>
    import { onMount } from "svelte";
    import { applicationService } from "$lib/api/applications.service";
    import {
        Briefcase,
        MapPin,
        Clock,
        Search,
        ExternalLink,
    } from "lucide-svelte";
    import { showToast } from "$lib/stores/toast";

    let applications = $state([]);
    let loading = $state(true);
    let searchQuery = $state("");
    let currentTab = $state("submitted");

    onMount(async () => {
        await loadApplications();
    });

    async function loadApplications() {
        loading = true;
        try {
            const res = await applicationService.getMyApplications();
            applications = res?.data || res || [];
        } catch (error) {
            showToast("Failed to load applications", "error");
            console.error(error);
        } finally {
            loading = false;
        }
    }

    function getStatusTheme(status) {
        switch (status?.toLowerCase()) {
            case "accepted":
                return "emerald";
            case "rejected":
                return "rose";
            case "shortlisted":
            case "under_review":
                return "blue";
            case "submitted":
            case "quiz_started":
            case "quiz_completed":
                return "violet";
            default:
                return "slate";
        }
    }

    let filteredApplications = $derived(
        applications.filter((app) => {
            const matchesSearch =
                (app.JobTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (app.JobCompany || "").toLowerCase().includes(searchQuery.toLowerCase());
            const status = (app.Status || "submitted").toLowerCase();

            let tabGroup = "submitted";
            if (["quiz_started", "quiz_completed"].includes(status))
                tabGroup = "quizzes";
            else if (
                ["under_review", "shortlisted", "interviewed"].includes(status)
            )
                tabGroup = "in review";
            else if (["accepted", "rejected", "withdrawn"].includes(status))
                tabGroup = "closed";

            return matchesSearch && tabGroup === currentTab;
        })
    );
</script>

<div class="min-h-screen bg-slate-50 p-4 md:p-6 font-sans flex justify-center">
    <div class="w-full max-w-4xl">
        <div class="mb-6">
            <h1 class="text-xl font-bold text-slate-800">My Applications</h1>
            <p class="text-xs text-slate-400 font-medium mt-0.5">
                Track the status of your job applications and quizzes.
            </p>
        </div>

        <div
            class="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white border border-slate-200 rounded-xl p-2 mb-4 shadow-sm"
        >
            <div class="flex bg-slate-100 p-1 rounded-lg gap-1 overflow-x-auto">
                {#each ["submitted", "quizzes", "in review", "closed"] as tab}
                    <button
                        class="px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors"
                        class:bg-white={currentTab === tab}
                        class:text-purple-600={currentTab === tab}
                        class:text-slate-500={currentTab !== tab}
                        onclick={() => (currentTab = tab)}
                    >
                        {tab}
                    </button>
                {/each}
            </div>

            <div class="relative flex-1 md:max-w-xs">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={14}
                />
                <input
                    type="text"
                    placeholder="Search roles or companies..."
                    class="w-full pl-9 pr-3 py-1.5 bg-slate-50 text-xs rounded-lg border-none focus:outline-none focus:ring-1 focus:ring-purple-500 h-8"
                    bind:value={searchQuery}
                />
            </div>
        </div>

        {#if loading}
            <div
                class="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-200 rounded-xl"
            >
                <span class="loading loading-spinner loading-md text-purple-600"
                ></span>
                <span class="text-xs text-slate-400 font-medium"
                    >Loading items...</span
                >
            </div>
        {:else if filteredApplications.length === 0}
            <div
                class="py-16 text-center bg-white border border-slate-200 rounded-xl p-6"
            >
                <div
                    class="inline-flex items-center justify-center w-12 h-12 bg-slate-50 text-slate-300 rounded-xl mb-3"
                >
                    <Briefcase size={20} />
                </div>
                <h3 class="text-sm font-bold text-slate-800">
                    No applications found
                </h3>
                <p class="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    {searchQuery
                        ? "Refine your keyword search queries."
                        : "There are no entries currently recorded in this status."}
                </p>
            </div>
        {:else}
            <div class="flex flex-col gap-2">
                {#each filteredApplications as app (app.ID)}
                    {@const theme = getStatusTheme(app.Status)}
                    <div
                        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm transition-colors hover:bg-slate-50/50"
                    >
                        <div class="min-w-[200px]">
                            <h2
                                class="font-bold text-slate-900 text-sm leading-tight"
                            >
                                {app.JobTitle}
                            </h2>
                            <div
                                class="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-medium"
                            >
                                <span class="flex items-center gap-1"
                                    ><Briefcase
                                        size={11}
                                    />{app.JobCompany}</span
                                >
                            </div>
                        </div>

                        <div class="w-28 shrink-0">
                            <span
                                class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase
                                {theme === 'emerald'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : ''}
                                {theme === 'rose'
                                    ? 'bg-rose-50 text-rose-700'
                                    : ''}
                                {theme === 'blue'
                                    ? 'bg-blue-50 text-blue-700'
                                    : ''}
                                {theme === 'slate'
                                    ? 'bg-slate-100 text-slate-600'
                                    : ''}
                                {theme === 'violet'
                                    ? 'bg-violet-50 text-violet-700'
                                    : ''}"
                            >
                                <span
                                    class="h-1.5 w-1.5 rounded-full
                                    {theme === 'emerald'
                                        ? 'bg-emerald-500'
                                        : ''}
                                    {theme === 'rose'
                                        ? 'bg-rose-500'
                                        : ''}
                                    {theme === 'blue'
                                        ? 'bg-blue-500'
                                        : ''}
                                    {theme === 'slate'
                                        ? 'bg-slate-500'
                                        : ''}
                                    {theme === 'violet'
                                        ? 'bg-violet-500'
                                        : ''}"
                                ></span>
                                {app.Status || "Submitted"}
                            </span>
                        </div>

                        <div class="text-xs text-slate-500 w-28 shrink-0">
                            <span
                                class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold"
                                >Applied</span
                            >
                            <span class="font-medium text-slate-600 font-mono">
                                {app.CreatedAt
                                    ? new Date(
                                          app.CreatedAt,
                                      ).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                      })
                                    : "---"}
                            </span>
                        </div>

                        <div
                            class="text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 flex-1 flex justify-start sm:justify-end"
                        >
                            {#if ["submitted", "quiz_started", "quiz_completed"].includes(app.Status?.toLowerCase()) && app.QuizID && app.QuizID !== "00000000-0000-0000-0000-000000000000"}
                                <a
                                    href="/quizzes/{app.QuizID}?application_id={app.ID}&job_id={app.JobID}"
                                    class="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                                >
                                    View Quiz <ExternalLink size={12} />
                                </a>
                            {:else if ["submitted", "quiz_started", "quiz_completed"].includes(app.Status?.toLowerCase())}
                                <span class="text-xs font-bold text-slate-400"
                                    >Quiz not assigned yet</span
                                >
                            {:else}
                                <span class="text-xs font-bold text-slate-400"
                                    >No action</span
                                >
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>
