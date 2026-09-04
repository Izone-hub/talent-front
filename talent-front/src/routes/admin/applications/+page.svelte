<script>
    import { goto } from '$app/navigation';
    import { jobService } from '$lib/api/job.service';
    import { applicationService } from '$lib/api/application.service';
    import EmptyState from '$lib/components/ui/EmptyState.svelte';
    import AdminPageHeader from '$lib/components/ui/AdminPageHeader.svelte';
    import AdminApplicationsSkeleton from '$lib/components/ui/skeletons/AdminApplicationsSkeleton.svelte';
    import {
        RefreshCw,
        Users,
        Trophy,
        Star,
        CircleCheck,
        CircleX,
        GitBranch,
        Inbox,
        Calendar,
        User,
        ArrowRight,
        Circle,
        Send,
        Loader,
        MessageSquare,
        RotateCcw,
        ChevronDown,
        ChevronLeft,
        ChevronRight,
        MapPin,
        Clock,
        Zap,
        Hourglass,
    } from 'lucide-svelte';
    import { getCategoryConfig } from '$lib/utils/jobCategories';

    let jobs = $state([]);
    let jobCounts = $state({});
    let jobApps = $state({});
    let loading = $state(true);
    let loadingApps = $state(false);
    let expandedCard = $state(null);
    let appPages = $state({});
    let showAllJobs = $state(false);
    // At least 10 applicants are shown at once so a phone-sized viewport can
    // still see a full page of applicants without scrolling pagination.
    const APPS_PER_PAGE = 10;
    const INITIAL_JOBS = 4;

    const typeLabels = {
        full_time: 'Full Time',
        part_time: 'Part Time',
        contract: 'Contract',
        freelance: 'Freelance',
        internship: 'Internship',
    };

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

    // ---- Overview stats (kept reactive against the state above) ----
    let statTotal = $derived(Object.values(jobCounts).reduce((a, b) => a + b, 0));
    let statQuizDone = $derived(quizCompletedApps().length);
    let statShortlisted = $derived(countAppsInStatus('shortlisted'));
    let statAccepted = $derived(countAppsInStatus('accepted'));

    function getStatCards() {
        return [
            { label: 'Total Applicants', value: statTotal, icon: Users, color: '#6366f1', note: 'across all jobs' },
            { label: 'Quiz Done', value: statQuizDone, icon: Trophy, color: '#f59e0b', note: 'top performers' },
            { label: 'Shortlisted', value: statShortlisted, icon: Star, color: '#8b5cf6', note: 'moving forward' },
            { label: 'Accepted', value: statAccepted, icon: CircleCheck, color: '#059669', note: 'closed the loop' },
        ];
    }

    function countAppsInStatus(target) {
        let n = 0;
        for (const apps of Object.values(jobApps)) {
            for (const app of apps) {
                if ((app.Status || app.status || '').toLowerCase() === target) n++;
            }
        }
        return n;
    }

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
        if (jobApps[jobId]) return; // already fetched during loadJobs
        loadingApps = true;
        try {
            const data = await applicationService.getJobApplications(jobId);
            jobApps[jobId] = Array.isArray(data) ? data : [];
            jobCounts[jobId] = jobApps[jobId].length;
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

    function getPreviewApps(jobId) {
        return (jobApps[jobId] || []).slice(0, 3);
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
            quiz_started: { label: 'Quiz Started', class: 'bg-amber-50 text-amber-700', icon: Hourglass },
            quiz_completed: { label: 'Quiz Done', class: 'bg-indigo-50 text-indigo-700', icon: CircleCheck },
            under_review: { label: 'Review', class: 'bg-cyan-50 text-cyan-700', icon: Loader },
            shortlisted: { label: 'Shortlisted', class: 'bg-purple-50 text-purple-700', icon: Star },
            interviewed: { label: 'Interviewed', class: 'bg-violet-50 text-violet-700', icon: MessageSquare },
            accepted: { label: 'Accepted', class: 'bg-emerald-50 text-emerald-700', icon: Trophy },
            rejected: { label: 'Rejected', class: 'bg-rose-50 text-rose-700', icon: CircleX },
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

    function getScoreColor(score) {
        if (score >= 80) return 'text-emerald-600 bg-emerald-50';
        if (score >= 60) return 'text-amber-600 bg-amber-50';
        return 'text-rose-600 bg-rose-50';
    }

    function getApplicantName(app) {
        return getVal(app, 'Name', 'name', 'ApplicantName') || getVal(app, 'github_username', 'GithubUsername') || '—';
    }
</script>

<div class="space-y-6 max-w-full mx-auto">
    <AdminPageHeader
        title="Applications"
        subtitle={loading ? null : 'Tap a job card to review its applicants — 10 shown at once'}
    >
        <button
            class="btn btn-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 gap-2 rounded-xl"
            onclick={() => loadJobs()}
        >
            <RefreshCw size={14} />
            Refresh
        </button>
    </AdminPageHeader>

    {#if loading}
        <AdminApplicationsSkeleton />
    {:else if jobs.length === 0}
        <EmptyState
            icon={Inbox}
            title="No published jobs"
            description="Publish some jobs first to see applications here."
        />
    {:else}
        <!-- ============================================================ -->
        <!-- Overview stat strip                                            -->
        <!-- ============================================================ -->
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {#each getStatCards() as stat}
                <div class="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5">
                    <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                             style="background-color: {stat.color}">
                            <svelte:component this={stat.icon} size={16} />
                        </div>
                        <p class="text-2xl font-extrabold text-gray-900 leading-none">{stat.value}</p>
                    </div>
                    <p class="mt-2.5 text-xs font-bold text-gray-700">{stat.label}</p>
                    <p class="text-[10px] text-gray-400 font-medium">{stat.note}</p>
                </div>
            {/each}
        </div>

        <!-- Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- ============================================================ -->
            <!-- Special Card: Quiz Completed Users (top talent)               -->
            <!-- ============================================================ -->
            <div
                class="group text-left bg-white border rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden
                {expandedCard === 'quiz-completed'
                    ? 'border-amber-300 shadow-lg ring-4 ring-amber-50 sm:col-span-2 lg:col-span-3'
                    : 'border-gray-100 hover:border-amber-300 hover:shadow-lg hover:-translate-y-0.5'}"
            >
                <!-- Card Header (always visible) -->
                <button
                    class="w-full text-left p-4 sm:p-5"
                    onclick={() => expandedCard === 'quiz-completed' ? expandedCard = null : expandedCard = 'quiz-completed'}
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-110 transition-transform"
                            style="background: linear-gradient(135deg, #f59e0b, #fbbf24)"
                        >
                            <Trophy size={20} />
                        </div>
                        <div class="min-w-0 flex-1">
                            <h3 class="text-sm font-bold text-gray-900 truncate group-hover:text-amber-600 transition-colors">
                                Quiz Completed Users
                            </h3>
                            <p class="text-[11px] text-gray-400 font-medium truncate">Top performers across all jobs</p>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                            <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                                <Trophy size={11} />
                                {quizCompletedApps().length}
                            </span>
                            <span class="text-gray-300 transition-transform duration-300 {expandedCard === 'quiz-completed' ? 'rotate-180 text-amber-400' : ''}">
                                <ChevronDown size={16} />
                            </span>
                        </div>
                    </div>
                </button>

                <!-- Expanded Content -->
                {#if expandedCard === 'quiz-completed'}
                    <div class="px-4 sm:px-5 pb-5 border-t border-amber-100 pt-4">
                        {#if quizCompletedApps().length === 0}
                            <p class="text-sm text-gray-400 text-center py-4">No quiz completed users yet</p>
                        {:else}
                            <div class="grid gap-2 lg:grid-cols-2">
                                {#each quizCompletedApps().slice(0, 10) as app, i}
                                    {@const score = getVal(app, 'QuizScore', 'quiz_score') || 0}
                                    <div
                                        class="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                                        onclick={(e) => { e.stopPropagation(); goto(`/admin/applications/${app.ID || app.id}`); }}
                                    >
                                        {#if i === 0}
                                            <span class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-sm">
                                                <Trophy size={11} />
                                            </span>
                                        {:else}
                                            <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 bg-gray-100 text-gray-500">
                                                {i + 1}
                                            </span>
                                        {/if}
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
                                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold {getScoreColor(score)} shrink-0">
                                            <Star size={10} />
                                            {score}%
                                        </span>
                                    </div>
                                {/each}
                            </div>
                            {#if quizCompletedApps().length > 10}
                                <p class="text-xs text-gray-400 text-center mt-3">
                                    + {quizCompletedApps().length - 10} more users — expand a job below to see them
                                </p>
                            {/if}
                        {/if}
                    </div>
                {/if}
            </div>

            <!-- ============================================================ -->
            <!-- Job Cards with their applicant lists                          -->
            <!-- ============================================================ -->
            {#each visibleJobs() as job (job.id || job.ID)}
                {@const id = job.id || job.ID}
                {@const count = jobCounts[id] || 0}
                {@const catCfg = getCategoryConfig(job.category || job.Category || 'other')}
                {@const isExpanded = expandedCard === id}
                {@const pageApps = getPageApps(id)}
                {@const totalPages = getTotalPages(id)}
                {@const currentPage = (appPages[id] || 0) + 1}
                {@const previewApps = getPreviewApps(id)}
                {@const jobType = job.job_type || job.JobType}
                {@const jobLoc = job.location || job.Location}
                {@const isRemote = !!(job.remote_possible || job.RemotePossible)}

                <div
                    class="group text-left bg-white border rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden
                    {isExpanded
                        ? 'border-purple-300 shadow-lg ring-4 ring-purple-50 sm:col-span-2 lg:col-span-3'
                        : 'border-gray-100 hover:border-purple-200 hover:shadow-lg hover:-translate-y-0.5'}"
                >
                    <!-- Card Header (always visible) -->
                    <button
                        class="w-full text-left p-4 sm:p-5"
                        onclick={() => toggleCard(id)}
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-110 transition-transform"
                                style="background: linear-gradient(135deg, {catCfg.color}, {catCfg.color}cc)"
                            >
                                <catCfg.icon size={20} />
                            </div>
                            <div class="min-w-0 flex-1">
                                <h3 class="flex items-center gap-2 text-sm font-bold text-gray-900">
                                    <span class="truncate group-hover:text-purple-700 transition-colors">{job.title || job.Title}</span>
                                    {#if isRemote}
                                        <span class="shrink-0 inline-flex items-center gap-1 text-[9px] font-extrabold tracking-wide text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                            <Zap size={9} />
                                            REMOTE
                                        </span>
                                    {/if}
                                </h3>
                                <p class="mt-0.5 text-[11px] text-gray-400 font-medium truncate">{job.company || job.Company || catCfg.label}</p>
                            </div>
                        </div>

                        <div class="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
                            {#if jobLoc}
                                <span class="flex items-center gap-1 min-w-0">
                                    <MapPin size={11} class="shrink-0" />
                                    <span class="truncate">{jobLoc}</span>
                                </span>
                            {/if}
                            {#if jobType}
                                <span class="flex items-center gap-1 capitalize">
                                    <Clock size={11} />
                                    {typeLabels[jobType] || jobType.replace(/_/g, ' ')}
                                </span>
                            {/if}
                        </div>

                        <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                            <div class="flex items-center gap-2.5 min-w-0">
                                {#if previewApps.length > 0}
                                    <div class="flex -space-x-2 shrink-0">
                                        {#each previewApps as app, i (app.ID || app.id || i)}
                                            <div
                                                class="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-white"
                                                style="background: {getRandomColor(getApplicantName(app))}"
                                                title={getApplicantName(app)}
                                            >
                                                {getInitials(getApplicantName(app))}
                                            </div>
                                        {/each}
                                    </div>
                                {:else}
                                    <div class="w-6 h-6 rounded-full bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center shrink-0">
                                        <User size={11} class="text-gray-300" />
                                    </div>
                                {/if}
                                <span
                                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0"
                                    style="background-color: {catCfg.color}14; color: {catCfg.color}"
                                >
                                    <Users size={11} />
                                    {count} applicant{count === 1 ? '' : 's'}
                                </span>
                            </div>
                            <span
                                class="shrink-0 inline-flex items-center gap-1 text-xs font-bold transition-colors
                                {isExpanded ? 'text-purple-700' : 'text-gray-500 group-hover:text-purple-600'}"
                            >
                                {isExpanded ? 'Hide applicants' : 'Review applicants'}
                                <span class="transition-transform duration-300 {isExpanded ? 'rotate-180' : ''}">
                                    <ChevronDown size={15} />
                                </span>
                            </span>
                        </div>
                    </button>

                    <!-- Expanded Content: applicant list (10 per page) -->
                    {#if isExpanded}
                        <div class="px-4 sm:px-6 pb-5 border-t border-gray-100 pt-4">
                            {#if loadingApps}
                                <div class="flex items-center justify-center py-8">
                                    <span class="loading loading-spinner loading-sm text-purple-600"></span>
                                </div>
                            {:else if count === 0}
                                <p class="text-sm text-gray-400 text-center py-8">No applicants yet — check back soon</p>
                            {:else}
                                <div class="mb-3 flex items-center justify-between gap-3">
                                    <p class="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                        Showing {pageApps.length} of {count} applicants
                                    </p>
                                    {#if totalPages > 1}
                                        <p class="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                            Page {currentPage} of {totalPages}
                                        </p>
                                    {/if}
                                </div>

                                <div class="space-y-2">
                                    {#each pageApps as app}
                                        {@const cfg = getStatusConfig(app.Status || app.status || 'unknown')}
                                        {@const score = getVal(app, 'QuizScore', 'quiz_score')}
                                        {@const name = getApplicantName(app)}
                                        {@const gh = getVal(app, 'github_username', 'GithubUsername')}
                                        {@const appDate = app.SubmittedAt || app.submitted_at}
                                        <div
                                            class="group/app flex items-center gap-2.5 sm:gap-3 px-3 py-2.5 rounded-xl bg-white border border-gray-100 hover:border-purple-200 hover:bg-purple-50/40 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                                            onclick={(e) => { e.stopPropagation(); goto(`/admin/applications/${app.ID || app.id}`); }}
                                        >
                                            <div
                                                class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0 ring-2 ring-purple-50"
                                                style="background: {getRandomColor(name)}"
                                            >
                                                {getInitials(name)}
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <p class="text-sm font-semibold text-gray-900 truncate">{name}</p>
                                                <div class="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-gray-400">
                                                    {#if appDate}
                                                        <span class="inline-flex items-center gap-1">
                                                            <Calendar size={10} />
                                                            {formatDate(appDate)}
                                                        </span>
                                                    {/if}
                                                    {#if gh}
                                                        <span class="hidden sm:inline-flex items-center gap-1 min-w-0">
                                                            <GitBranch size={10} class="shrink-0" />
                                                            <span class="truncate">@{gh}</span>
                                                        </span>
                                                    {/if}
                                                </div>
                                            </div>
                                            <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                                {#if score != null}
                                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold {getScoreColor(score)}">
                                                        <Star size={10} />
                                                        {score}%
                                                    </span>
                                                {/if}
                                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold {cfg.class}">
                                                    <svelte:component this={cfg.icon} size={11} />
                                                    <span class="hidden sm:inline">{cfg.label}</span>
                                                </span>
                                                <ArrowRight size={14} class="hidden sm:block text-gray-200 group-hover/app:text-purple-500 group-hover/app:translate-x-0.5 transition-all" />
                                            </div>
                                        </div>
                                    {/each}
                                </div>

                                <!-- Pagination -->
                                {#if totalPages > 1}
                                    <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                                        <button
                                            class="btn btn-xs btn-ghost text-gray-500 gap-1 rounded-lg hover:bg-gray-50"
                                            onclick={(e) => { e.stopPropagation(); prevPage(id); }}
                                            disabled={(appPages[id] || 0) === 0}
                                        >
                                            <ChevronLeft size={14} />
                                            Prev
                                        </button>
                                        <div class="flex items-center gap-1.5">
                                            {#each Array(totalPages) as _, i}
                                                <button
                                                    class="w-7 h-7 rounded-lg text-xs font-bold transition-all
                                                    {i === (appPages[id] || 0)
                                                        ? 'bg-purple-600 text-white shadow-sm'
                                                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}"
                                                    onclick={(e) => { e.stopPropagation(); appPages = { ...appPages, [id]: i }; }}
                                                >
                                                    {i + 1}
                                                </button>
                                            {/each}
                                        </div>
                                        <button
                                            class="btn btn-xs btn-ghost text-gray-500 gap-1 rounded-lg hover:bg-gray-50"
                                            onclick={(e) => { e.stopPropagation(); nextPage(id); }}
                                            disabled={currentPage >= totalPages}
                                        >
                                            Next
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                {/if}
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>

        <!-- Show More / Show Less Buttons -->
        {#if sortedJobs().length > INITIAL_JOBS}
            <div class="text-center flex items-center justify-center gap-2">
                <button
                    class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:text-purple-700 hover:shadow-md transition-all cursor-pointer"
                    onclick={() => showAllJobs = !showAllJobs}
                >
                    {#if !showAllJobs}
                        Show {sortedJobs().length - INITIAL_JOBS} more jobs
                        <ChevronDown size={15} />
                    {:else}
                        <ChevronDown size={15} class="rotate-180" />
                        Show less
                    {/if}
                </button>
            </div>
        {/if}
    {/if}
</div>
