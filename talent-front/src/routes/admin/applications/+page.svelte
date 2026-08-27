<script>
    import { goto } from '$app/navigation';
    import { jobService } from '$lib/api/job.service';
    import { applicationService } from '$lib/api/application.service';
    import PageLoader from '$lib/components/ui/PageLoader.svelte';
    import EmptyState from '$lib/components/ui/EmptyState.svelte';
    import {
        Briefcase,
        RefreshCw,
        Search,
        Users,
        CheckCircle,
        Star,
        Inbox,
        Hourglass,
        User,
        Calendar,
        Brain,
        Mail,
        FileText,
        ArrowRight,
        Circle,
        Send,
        Play,
        Loader,
        MessageSquare,
        XCircle,
        RotateCcw,
        TrendingUp,
        ChevronRight,
        ChevronLeft,
        Zap,
        Award,
    } from 'lucide-svelte';

    let jobs = $state([]);
    let jobCounts = $state({});
    let jobApps = $state({});
    let selectedJobId = $state('');
    let loading = $state(true);
    let loadingApps = $state(false);
    let expandedCard = $state(null);
    let appPages = $state({});
    let showAllJobs = $state(false);
    const APPS_PER_PAGE = 3;
    const INITIAL_JOBS = 4;

    $effect(() => {
        loadJobs();
    });

    let sortedJobs = $derived(() => {
        const sorted = [...jobs].sort((a, b) => {
            const countA = jobCounts[a.id || a.ID] || 0;
            const countB = jobCounts[b.id || b.ID] || 0;
            return countB - countA;
        });
        return sorted;
    });

    let visibleJobs = $derived(() => {
        const all = sortedJobs();
        return showAllJobs ? all : all.slice(0, INITIAL_JOBS);
    });

    let quizCompletedApps = $derived(() => {
        const all = [];
        for (const [jobId, apps] of Object.entries(jobApps)) {
            for (const app of apps) {
                const status = (app.Status || app.status || '').toLowerCase();
                if (status === 'quiz_completed' || status === 'shortlisted' || status === 'accepted' || status === 'under_review') {
                    const job = jobs.find(j => (j.id || j.ID) === jobId);
                    all.push({ ...app, _jobTitle: job?.title || job?.Title || 'Unknown' });
                }
            }
        }
        return all.sort((a, b) => {
            const scoreA = getVal(a, 'QuizScore', 'quiz_score') || 0;
            const scoreB = getVal(b, 'QuizScore', 'quiz_score') || 0;
            return scoreB - scoreA;
        });
    });

    async function loadJobs() {
        loading = true;
        try {
            jobs = await jobService.listPublishedJobs();
            const counts = {};
            const appsMap = {};
            await Promise.all(
                jobs.map(async (job) => {
                    const id = job.id || job.ID;
                    try {
                        const apps = await applicationService.getJobApplications(id);
                        const appList = Array.isArray(apps) ? apps : [];
                        counts[id] = appList.length;
                        appsMap[id] = appList;
                    } catch {
                        counts[id] = 0;
                        appsMap[id] = [];
                    }
                })
            );
            jobCounts = counts;
            jobApps = appsMap;
        } catch (error) {
            console.error('Failed to load jobs:', error);
        } finally {
            loading = false;
        }
    }

    async function loadApplications(jobId) {
        loadingApps = true;
        try {
            if (!jobApps[jobId]) {
                const data = await applicationService.getJobApplications(jobId);
                jobApps[jobId] = Array.isArray(data) ? data : [];
                jobCounts[jobId] = jobApps[jobId].length;
            }
        } catch (error) {
            console.error('Failed to load applications:', error);
        } finally {
            loadingApps = false;
        }
    }

    function toggleCard(jobId) {
        if (expandedCard === jobId) {
            expandedCard = null;
        } else {
            expandedCard = jobId;
            appPages[jobId] = 0;
            loadApplications(jobId);
        }
    }

    function nextPage(jobId) {
        const apps = jobApps[jobId] || [];
        const maxPage = Math.ceil(apps.length / APPS_PER_PAGE) - 1;
        if ((appPages[jobId] || 0) < maxPage) {
            appPages = { ...appPages, [jobId]: (appPages[jobId] || 0) + 1 };
        }
    }

    function prevPage(jobId) {
        if ((appPages[jobId] || 0) > 0) {
            appPages = { ...appPages, [jobId]: (appPages[jobId] || 0) - 1 };
        }
    }

    function getPageApps(jobId) {
        const apps = jobApps[jobId] || [];
        const page = appPages[jobId] || 0;
        return apps.slice(page * APPS_PER_PAGE, (page + 1) * APPS_PER_PAGE);
    }

    function getTotalPages(jobId) {
        const apps = jobApps[jobId] || [];
        return Math.ceil(apps.length / APPS_PER_PAGE);
    }

    function getVal(obj, ...keys) {
        for (const key of keys) {
            const val = obj[key];
            if (val != null && val !== '') return val;
        }
        return null;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
            });
        } catch {
            return '—';
        }
    }

    function getStatusConfig(status) {
        const map = {
            submitted: { label: 'Submitted', class: 'bg-blue-50 text-blue-700', icon: Send },
            quiz_started: { label: 'Quiz Started', class: 'bg-amber-50 text-amber-700', icon: Play },
            quiz_completed: { label: 'Quiz Done', class: 'bg-indigo-50 text-indigo-700', icon: CheckCircle },
            under_review: { label: 'Review', class: 'bg-cyan-50 text-cyan-700', icon: Loader },
            shortlisted: { label: 'Shortlisted', class: 'bg-purple-50 text-purple-700', icon: Star },
            interviewed: { label: 'Interviewed', class: 'bg-violet-50 text-violet-700', icon: MessageSquare },
            accepted: { label: 'Accepted', class: 'bg-emerald-50 text-emerald-700', icon: CheckCircle },
            rejected: { label: 'Rejected', class: 'bg-rose-50 text-rose-700', icon: XCircle },
            withdrawn: { label: 'Withdrawn', class: 'bg-gray-50 text-gray-500', icon: RotateCcw },
        };
        return map[(status || '').toLowerCase()] || { label: status || 'Unknown', class: 'bg-gray-50 text-gray-600', icon: Circle };
    }

    function getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    function getRandomColor(seed) {
        const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
        return colors[seed ? seed.length % colors.length : 0];
    }

    function getCountColor(count) {
        if (count >= 20) return 'from-emerald-500 to-teal-500';
        if (count >= 10) return 'from-blue-500 to-indigo-500';
        if (count >= 5) return 'from-amber-500 to-orange-500';
        return 'from-gray-400 to-gray-500';
    }

    function getScoreColor(score) {
        if (score >= 80) return 'text-emerald-600 bg-emerald-50';
        if (score >= 60) return 'text-amber-600 bg-amber-50';
        return 'text-rose-600 bg-rose-50';
    }

    function getTotalApplications() {
        return Object.values(jobCounts).reduce((a, b) => a + b, 0);
    }
</script>

<div class="space-y-6 max-w-full mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 class="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-3">
                Applications
                <span class="text-sm font-normal text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {getTotalApplications()} total
                </span>
            </h1>
            <p class="text-gray-500 mt-1 text-sm">
                Click a card to expand and view applicants
            </p>
        </div>
        <button
            class="btn btn-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 gap-2 rounded-xl"
            onclick={() => loadJobs()}
        >
            <RefreshCw size={14} />
            Refresh
        </button>
    </div>

    {#if loading}
        <PageLoader message="Loading jobs and applications..." />
    {:else if jobs.length === 0}
        <EmptyState
            icon={Inbox}
            title="No published jobs"
            description="Publish some jobs first to see applications here."
        />
    {:else}
        <!-- Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Special Card: Quiz Completed Users -->
            <button
                class="group relative text-left rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
                {expandedCard === 'quiz-completed'
                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg shadow-emerald-200 col-span-1 sm:col-span-2'
                    : 'border-gray-100 bg-white hover:border-emerald-200 hover:shadow-md'}"
                onclick={() => expandedCard === 'quiz-completed' ? expandedCard = null : expandedCard = 'quiz-completed'}
            >
                <!-- Card Header (always visible) -->
                <div class="p-4 flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shrink-0">
                        <Award size={20} />
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                            Quiz Completed Users
                        </h3>
                        <p class="text-xs text-gray-400">Top performers across all jobs</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                            {quizCompletedApps().length}
                        </span>
                        <ChevronRight size={16} class="text-gray-400 transition-transform {expandedCard === 'quiz-completed' ? 'rotate-90' : ''}" />
                    </div>
                </div>

                <!-- Expanded Content -->
                {#if expandedCard === 'quiz-completed'}
                    <div class="px-4 pb-4 border-t border-emerald-100 pt-3">
                        {#if quizCompletedApps().length === 0}
                            <p class="text-sm text-gray-400 text-center py-4">No quiz completed users yet</p>
                        {:else}
                            <div class="space-y-2">
                                {#each quizCompletedApps().slice(0, 6) as app}
                                    {@const score = getVal(app, 'QuizScore', 'quiz_score') || 0}
                                    <div
                                        class="flex items-center gap-3 p-3 rounded-xl bg-white/80 border border-emerald-100 hover:border-emerald-300 transition-colors cursor-pointer"
                                        onclick={(e) => { e.stopPropagation(); goto(`/admin/applications/${app.ID || app.id}`); }}
                                    >
                                        <div
                                            class="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0"
                                            style="background: {getRandomColor(getVal(app, 'Name', 'name', 'ApplicantName'))}"
                                        >
                                            {getInitials(getVal(app, 'Name', 'name', 'ApplicantName'))}
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p class="text-sm font-semibold text-gray-900 truncate">
                                                {getVal(app, 'Name', 'name', 'ApplicantName') || '—'}
                                            </p>
                                            <p class="text-xs text-gray-400 truncate">{app._jobTitle}</p>
                                        </div>
                                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold {getScoreColor(score)}">
                                            <Star size={10} />
                                            {score}%
                                        </span>
                                    </div>
                                {/each}
                            </div>
                            {#if quizCompletedApps().length > 6}
                                <p class="text-xs text-gray-400 text-center mt-2">
                                    + {quizCompletedApps().length - 6} more users
                                </p>
                            {/if}
                        {/if}
                    </div>
                {/if}
            </button>

            <!-- Job Cards -->
            {#each visibleJobs() as job, index (job.id || job.ID)}
                {@const count = jobCounts[job.id || job.ID] || 0}
                {@const isExpanded = expandedCard === (job.id || job.ID)}
                {@const pageApps = getPageApps(job.id || job.ID)}
                {@const totalPages = getTotalPages(job.id || job.ID)}
                {@const currentPage = (appPages[job.id || job.ID] || 0) + 1}

                <div class="rounded-2xl border-2 transition-all duration-300 overflow-hidden
                    {isExpanded
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg shadow-purple-200 sm:col-span-2'
                        : 'border-gray-100 bg-white hover:border-purple-200 hover:shadow-md'}">
                    <!-- Card Header (always visible) -->
                    <button
                        class="w-full text-left p-4 flex items-center gap-3 cursor-pointer"
                        onclick={() => toggleCard(job.id || job.ID)}
                    >
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br {getCountColor(count)} flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {#if index < 3}
                                #{index + 1}
                            {:else}
                                {count}
                            {/if}
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="text-sm font-bold text-gray-900 truncate">
                                {job.title || job.Title}
                            </h3>
                            <div class="flex items-center gap-2 mt-0.5">
                                <span class="text-xs text-gray-400">{job.company || job.Company || 'Company'}</span>
                                {#if job.location}
                                    <span class="text-xs text-gray-300">·</span>
                                    <span class="text-xs text-gray-400 truncate">{job.location}</span>
                                {/if}
                            </div>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <span class="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                                {count}
                            </span>
                            <ChevronRight size={16} class="text-gray-400 transition-transform {isExpanded ? 'rotate-90' : ''}" />
                        </div>
                    </button>

                    <!-- Expanded Content -->
                    {#if isExpanded}
                        <div class="px-4 pb-4 border-t border-purple-100 pt-3">
                            {#if loadingApps}
                                <div class="flex items-center justify-center py-6">
                                    <span class="loading loading-spinner loading-sm text-purple-600"></span>
                                </div>
                            {:else if count === 0}
                                <p class="text-sm text-gray-400 text-center py-6">No applicants yet</p>
                            {:else}
                                <!-- Applicant List (3 per page) -->
                                <div class="space-y-2">
                                    {#each pageApps as app}
                                        {@const appStatus = app.Status || app.status || 'unknown'}
                                        {@const cfg = getStatusConfig(appStatus)}
                                        {@const score = getVal(app, 'QuizScore', 'quiz_score')}
                                        <div
                                            class="flex items-center gap-3 p-3 rounded-xl bg-white/80 border border-purple-100 hover:border-purple-300 transition-colors cursor-pointer"
                                            onclick={(e) => { e.stopPropagation(); goto(`/admin/applications/${app.ID || app.id}`); }}
                                        >
                                            <div
                                                class="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0"
                                                style="background: {getRandomColor(getVal(app, 'Name', 'name', 'ApplicantName'))}"
                                            >
                                                {getInitials(getVal(app, 'Name', 'name', 'ApplicantName'))}
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <p class="text-sm font-semibold text-gray-900 truncate">
                                                    {getVal(app, 'Name', 'name', 'ApplicantName') || getVal(app, 'github_username', 'GithubUsername') || '—'}
                                                </p>
                                                <div class="flex items-center gap-2 mt-0.5">
                                                    <span class="text-xs text-gray-400">
                                                        {formatDate(app.SubmittedAt || app.submitted_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="flex items-center gap-2 shrink-0">
                                                {#if score != null}
                                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold {getScoreColor(score)}">
                                                        {score}%
                                                    </span>
                                                {/if}
                                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium {cfg.class}">
                                                    <svelte:component this={cfg.icon} size={10} />
                                                    {cfg.label}
                                                </span>
                                            </div>
                                        </div>
                                    {/each}
                                </div>

                                <!-- Pagination -->
                                {#if totalPages > 1}
                                    <div class="flex items-center justify-between mt-3 pt-3 border-t border-purple-100">
                                        <button
                                            class="btn btn-xs btn-ghost text-gray-500 gap-1"
                                            onclick={(e) => { e.stopPropagation(); prevPage(job.id || job.ID); }}
                                            disabled={(appPages[job.id || job.ID] || 0) === 0}
                                        >
                                            <ChevronLeft size={14} />
                                            Prev
                                        </button>
                                        <span class="text-xs text-gray-400">
                                            {currentPage} / {totalPages}
                                        </span>
                                        <button
                                            class="btn btn-xs btn-ghost text-gray-500 gap-1"
                                            onclick={(e) => { e.stopPropagation(); nextPage(job.id || job.ID); }}
                                            disabled={currentPage >= totalPages}
                                        >
                                            Next
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                {/if}

                                <!-- View All Link -->
                                <div class="mt-3 text-center">
                                    <button
                                        class="text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                                        onclick={(e) => { e.stopPropagation(); goto(`/admin/jobs/${job.id || job.ID}`); }}
                                    >
                                        View all {count} applicants →
                                    </button>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>

        <!-- Show More Button -->
        {#if sortedJobs().length > INITIAL_JOBS && !showAllJobs}
            <div class="text-center">
                <button
                    class="btn btn-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 gap-2 rounded-xl"
                    onclick={() => showAllJobs = true}
                >
                    Show {sortedJobs().length - INITIAL_JOBS} more jobs
                    <ChevronRight size={14} />
                </button>
            </div>
        {/if}
    {/if}
</div>
