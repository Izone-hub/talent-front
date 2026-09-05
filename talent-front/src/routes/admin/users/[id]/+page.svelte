<script>
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { usersService } from '$lib/api/users.service';
    import { quizService } from '$lib/api/quiz.service';
    import { intelligenceService } from '$lib/api/intelligence.service';
    import { showToast } from '$lib/stores/toast';
    import {
        ChevronLeft,
        GitBranch,
        Mail,
        Briefcase,
        FileText,
        Download,
        Star,
        BrainCircuit,
        Trophy,
        Calendar,
        Clock,
        Check,
        X,
        AlertTriangle,
        Sparkles,
        Loader2,
        User,
        MapPin,
        ShieldCheck,
    } from 'lucide-svelte';

    const statusConfig = {
        submitted: { label: 'Submitted', class: 'bg-blue-50 text-blue-700' },
        quiz_started: { label: 'Quiz Started', class: 'bg-amber-50 text-amber-700' },
        quiz_completed: { label: 'Quiz Done', class: 'bg-indigo-50 text-indigo-700' },
        under_review: { label: 'Review', class: 'bg-cyan-50 text-cyan-700' },
        shortlisted: { label: 'Shortlisted', class: 'bg-purple-50 text-purple-700' },
        interviewed: { label: 'Interviewed', class: 'bg-violet-50 text-violet-700' },
        accepted: { label: 'Accepted', class: 'bg-emerald-50 text-emerald-700' },
        rejected: { label: 'Rejected', class: 'bg-rose-50 text-rose-700' },
        withdrawn: { label: 'Withdrawn', class: 'bg-gray-50 text-gray-500' },
    };

    const quizStatusConfig = {
        in_progress: { label: 'In Progress', class: 'bg-amber-50 text-amber-700' },
        completed: { label: 'Completed', class: 'bg-emerald-50 text-emerald-700' },
        submitted: { label: 'Submitted', class: 'bg-blue-50 text-blue-700' },
        expired: { label: 'Expired', class: 'bg-gray-50 text-gray-500' },
    };

    let userId = $state('');
    let user = $state(null);
    let applications = $state([]);
    let quizzes = $state([]);
    let summary = $state(null);
    let cvs = $state([]);
    let loading = $state(true);
    let notFound = $state(false);
    let loadingATS = $state(false);
    let activeTab = $state('applications');

    $effect(() => {
        const id = $page.params.id;
        if (id && id !== userId) {
            userId = id;
            loadUser();
        }
    });

    async function loadUser() {
        loading = true;
        notFound = false;
        applications = [];
        quizzes = [];
        summary = null;
        cvs = [];
        try {
            const [u, apps, quizRows, cvData] = await Promise.all([
                usersService.getUser(userId),
                usersService.getUserApplications(userId),
                quizService.listUserQuizzes(userId),
                usersService.getUserCVs(userId),
            ]);
            user = u || null;
            applications = Array.isArray(apps) ? apps : [];
            quizzes = Array.isArray(quizRows) ? quizRows : [];
            cvs = cvData.versions || [];
            loadATS();
        } catch (error) {
            console.error('Failed to load user:', error);
            notFound = true;
        } finally {
            loading = false;
        }
    }

    async function loadATS() {
        loadingATS = true;
        try {
            summary = await intelligenceService.getUserSummary(userId);
        } catch (error) {
            summary = null;
        } finally {
            loadingATS = false;
        }
    }

    function getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    function getRandomColor(seed) {
        const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
        return colors[seed ? seed.length % colors.length : 0];
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

    function getStatusCfg(status) {
        return statusConfig[(status || '').toLowerCase()] || { label: status || 'Unknown', class: 'bg-gray-50 text-gray-600' };
    }

    function getQuizStatusCfg(status) {
        return quizStatusConfig[(status || '').toLowerCase()] || { label: status || 'Unknown', class: 'bg-gray-50 text-gray-600' };
    }

    function getScoreColor(score) {
        if (score == null) return '';
        if (score >= 80) return 'text-emerald-600 bg-emerald-50';
        if (score >= 60) return 'text-amber-600 bg-amber-50';
        return 'text-rose-600 bg-rose-50';
    }

    function getVal(obj, ...keys) {
        if (!obj) return null;
        for (const key of keys) {
            const val = obj[key];
            if (val != null && val !== '') return val;
        }
        return null;
    }

    // ---- ATS parsing (mirrors the admin application detail page) ----
    const parsedAnalysis = $derived.by(() => {
        if (!summary?.summary) return null;
        try {
            const parsed = typeof summary.summary === 'string'
                ? JSON.parse(summary.summary)
                : summary.summary;
            return parsed?.analysis || parsed || null;
        } catch {
            return null;
        }
    });

    const atsScore = $derived(parsedAnalysis?.ats_score ?? null);
    const scoreBreakdown = $derived(parsedAnalysis?.score_breakdown || null);
    const checks = $derived(parsedAnalysis?.checks || []);
    const suggestedSkills = $derived(parsedAnalysis?.suggested_fields?.skills || []);
    const suggestedHeadline = $derived(parsedAnalysis?.suggested_fields?.headline || null);

    function getStrengths() {
        if (!summary?.strengths) return [];
        return summary.strengths.split(';').map(s => s.trim()).filter(Boolean);
    }

    function getWeaknesses() {
        if (!summary?.weaknesses) return [];
        return summary.weaknesses.split(';').map(s => s.trim()).filter(Boolean);
    }

    // ---- CV download ----
    async function downloadCV(cv) {
        try {
            const blob = await usersService.downloadUserCV(userId, cv.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = cv.file_name || 'cv.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download CV:', error);
            showToast('Failed to download CV', 'error');
        }
    }

    function formatFileSize(bytes) {
        if (!bytes) return '—';
        return `${(bytes / 1024).toFixed(0)} KB`;
    }
</script>

<div class="min-h-screen bg-gray-50">
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <!-- Top bar -->
        <div class="mb-6 flex items-center gap-3">
            <button
                onclick={() => goto('/admin/users')}
                class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="Back to Users"
            >
                <ChevronLeft size={20} />
            </button>
            <div class="h-6 w-px bg-gray-200"></div>
            <div>
                <h1 class="text-lg font-semibold text-gray-900">User Activity</h1>
                <p class="text-xs text-gray-400">Applications, quizzes, ATS analysis and CV</p>
            </div>
        </div>

        {#if loading}
            <div class="space-y-6 animate-pulse">
                <div class="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/50 p-6">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-gray-100"></div>
                        <div class="space-y-2">
                            <div class="h-4 bg-gray-100 rounded w-40"></div>
                            <div class="h-3 bg-gray-50 rounded w-56"></div>
                        </div>
                    </div>
                </div>
                <div class="flex gap-1 bg-white rounded-xl p-1">
                    {#each Array(4) as _}
                        <div class="flex-1 h-10 bg-gray-100 rounded-lg"></div>
                    {/each}
                </div>
                <div class="h-40 bg-white rounded-2xl shadow-sm ring-1 ring-gray-200/50"></div>
            </div>

        {:else if notFound || !user}
            <div class="flex min-h-[50vh] items-center justify-center">
                <div class="text-center max-w-md">
                    <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <User size={32} class="text-gray-400" />
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900">User Not Found</h3>
                    <p class="mt-2 text-sm text-gray-500">This user doesn't exist or has been removed.</p>
                    <button
                        onclick={() => goto('/admin/users')}
                        class="mt-6 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                    >
                        <ChevronLeft size={16} />
                        Back to Users
                    </button>
                </div>
            </div>

        {:else}
            <!-- User hero card -->
            <div class="mb-6 overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-gray-200/50">
                <div class="relative bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 px-6 py-8 sm:px-8 overflow-hidden">
                    <div class="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/5"></div>
                    <div class="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/5"></div>
                    <div class="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div class="flex items-center gap-5">
                            {#if user.avatar_url}
                                <img
                                    src={user.avatar_url}
                                    alt=""
                                    class="w-16 h-16 rounded-full object-cover ring-4 ring-white/30 shadow-lg shrink-0"
                                />
                            {:else}
                                <div
                                    class="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white ring-4 ring-white/30 shadow-lg shrink-0"
                                    style="background: {getRandomColor(user.github_username)}"
                                >
                                    {getInitials(user.name || user.github_username)}
                                </div>
                            {/if}
                            <div>
                                <h2 class="text-2xl font-bold text-white">{user.name || user.github_username || 'Unknown'}</h2>
                                <div class="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/80">
                                    {#if user.email}
                                        <span class="flex items-center gap-1">
                                            <Mail size={13} class="text-white/50" />
                                            {user.email}
                                        </span>
                                    {/if}
                                    {#if user.github_username}
                                        <span class="flex items-center gap-1">
                                            <GitBranch size={13} class="text-white/50" />
                                            @{user.github_username}
                                        </span>
                                    {/if}
                                    {#if user.location}
                                        <span class="flex items-center gap-1">
                                            <MapPin size={13} class="text-white/50" />
                                            {user.location}
                                        </span>
                                    {/if}
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div class="rounded-xl bg-white/15 p-3 backdrop-blur-sm ring-1 ring-white/20">
                                <p class="text-[10px] uppercase tracking-wider text-white/60">Applications</p>
                                <p class="mt-1 text-sm font-semibold text-white">{applications.length}</p>
                            </div>
                            <div class="rounded-xl bg-white/15 p-3 backdrop-blur-sm ring-1 ring-white/20">
                                <p class="text-[10px] uppercase tracking-wider text-white/60">Quizzes</p>
                                <p class="mt-1 text-sm font-semibold text-white">{quizzes.length}</p>
                            </div>
                            <div class="rounded-xl bg-white/15 p-3 backdrop-blur-sm ring-1 ring-white/20">
                                <p class="text-[10px] uppercase tracking-wider text-white/60">ATS Score</p>
                                <p class="mt-1 text-sm font-semibold text-white">{atsScore ?? '—'}</p>
                            </div>
                            <div class="rounded-xl bg-white/15 p-3 backdrop-blur-sm ring-1 ring-white/20">
                                <p class="text-[10px] uppercase tracking-wider text-white/60">CVs</p>
                                <p class="mt-1 text-sm font-semibold text-white">{cvs.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="mb-6 flex gap-1 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-gray-200/50">
                <button
                    class="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200
                        {activeTab === 'applications' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}"
                    onclick={() => activeTab = 'applications'}
                >
                    <span class="hidden sm:inline">Applications</span>
                    <span class="sm:hidden">Apps</span>
                </button>
                <button
                    class="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200
                        {activeTab === 'quizzes' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}"
                    onclick={() => activeTab = 'quizzes'}
                >
                    Quizzes
                </button>
                <button
                    class="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200
                        {activeTab === 'ats' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}"
                    onclick={() => activeTab = 'ats'}
                >
                    ATS
                </button>
                <button
                    class="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200
                        {activeTab === 'cv' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}"
                    onclick={() => activeTab = 'cv'}
                >
                    CV
                </button>
            </div>

            <!-- ================= Applications tab ================= -->
            {#if activeTab === 'applications'}
                {#if applications.length === 0}
                    <div class="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-200/50">
                        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                            <Briefcase size={28} class="text-gray-300" />
                        </div>
                        <h3 class="text-sm font-semibold text-gray-700">No applications yet</h3>
                        <p class="mt-1 text-xs text-gray-400">This user hasn't applied to any jobs.</p>
                    </div>
                {:else}
                    <div class="space-y-3">
                        {#each applications as app}
                            {@const cfg = getStatusCfg(app.Status)}
                            {@const score = getVal(app, 'QuizScore', 'quiz_score')}
                            <button
                                class="w-full text-left flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/50 hover:ring-purple-200 hover:shadow-md transition-all cursor-pointer"
                                onclick={() => goto(`/admin/applications/${app.ID}`)}
                            >
                                <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                                    <Briefcase size={18} class="text-purple-500" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-semibold text-gray-900 truncate">{app.JobTitle || 'Unknown job'}</p>
                                    <p class="text-xs text-gray-400 truncate mt-0.5">
                                        {app.JobCompany}
                                        {#if app.JobLocation}
                                            · {app.JobLocation}
                                        {/if}
                                    </p>
                                    <p class="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1">
                                        <Calendar size={10} />
                                        {formatDate(app.SubmittedAt)}
                                    </p>
                                </div>
                                <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                    {#if score != null}
                                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold {getScoreColor(score)}">
                                            <Star size={10} />
                                            {score}%
                                        </span>
                                    {/if}
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold {cfg.class}">
                                        {cfg.label}
                                    </span>
                                </div>
                            </button>
                        {/each}
                    </div>
                {/if}
            {/if}

            <!-- ================= Quizzes tab ================= -->
            {#if activeTab === 'quizzes'}
                {#if quizzes.length === 0}
                    <div class="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-200/50">
                        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                            <Trophy size={28} class="text-gray-300" />
                        </div>
                        <h3 class="text-sm font-semibold text-gray-700">No quizzes taken</h3>
                        <p class="mt-1 text-xs text-gray-400">This user hasn't attempted any job quizzes.</p>
                    </div>
                {:else}
                    <div class="space-y-3">
                        {#each quizzes as quiz}
                            {@const qcfg = getQuizStatusCfg(quiz.status)}
                            {@const score = quiz.score}
                            <div class="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/50">
                                <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                    <Trophy size={18} class="text-amber-500" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-semibold text-gray-900 truncate">{quiz.job_title || 'Unknown job'}</p>
                                    <p class="text-xs text-gray-400 truncate mt-0.5">{quiz.job_company || ''}</p>
                                    <p class="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1">
                                        <Clock size={10} />
                                        {formatDate(quiz.completed_at || quiz.started_at)}
                                        {#if quiz.correct_answers != null}
                                            · {quiz.correct_answers}/{quiz.questions_per_quiz ?? '?'} correct
                                        {/if}
                                    </p>
                                </div>
                                <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                    {#if score != null}
                                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold {getScoreColor(score)}">
                                            <Star size={10} />
                                            {score}%
                                        </span>
                                    {/if}
                                    {#if quiz.passed != null}
                                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold
                                            {quiz.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">
                                            {#if quiz.passed}
                                                <Check size={11} />
                                            {:else}
                                                <X size={11} />
                                            {/if}
                                            {quiz.passed ? 'Passed' : 'Failed'}
                                        </span>
                                    {/if}
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold {qcfg.class}">
                                        {qcfg.label}
                                    </span>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            {/if}

            <!-- ================= ATS tab ================= -->
            {#if activeTab === 'ats'}
                {#if loadingATS}
                    <div class="flex items-center justify-center rounded-2xl bg-white p-12 shadow-sm ring-1 ring-gray-200/50">
                        <Loader2 size={24} class="animate-spin text-purple-600" />
                        <span class="ml-3 text-sm text-gray-500">Loading ATS analysis...</span>
                    </div>
                {:else if summary}
                    <div class="space-y-5">
                        <div class="grid gap-4 lg:grid-cols-3">
                            <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/50">
                                <p class="text-xs font-medium uppercase tracking-wider text-gray-400">ATS Score</p>
                                <div class="mt-2 flex items-end gap-2">
                                    <span class="text-3xl font-bold text-gray-900">{atsScore ?? '—'}</span>
                                    <span class="text-sm text-gray-400">/100</span>
                                </div>
                                {#if atsScore != null}
                                    <div class="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                        <div class="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
                                             style="width: {atsScore}%; transition: width 0.6s ease;">
                                        </div>
                                    </div>
                                {/if}
                                {#if scoreBreakdown}
                                    <div class="mt-3 flex flex-wrap gap-1.5">
                                        {#each Object.entries(scoreBreakdown) as [key, value]}
                                            {#if value != null}
                                                <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                                                    {key}: {value}
                                                </span>
                                            {/if}
                                        {/each}
                                    </div>
                                {/if}
                            </div>

                            <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/50">
                                <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Strengths</p>
                                {#if getStrengths().length > 0}
                                    <ul class="mt-3 space-y-2">
                                        {#each getStrengths() as s}
                                            <li class="flex items-start gap-2.5 text-sm text-gray-700">
                                                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"></span>
                                                {s}
                                            </li>
                                        {/each}
                                    </ul>
                                {:else}
                                    <p class="mt-3 text-sm text-gray-400">No strengths recorded.</p>
                                {/if}
                            </div>

                            <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/50">
                                <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Areas to Improve</p>
                                {#if getWeaknesses().length > 0}
                                    <ul class="mt-3 space-y-2">
                                        {#each getWeaknesses() as w}
                                            <li class="flex items-start gap-2.5 text-sm text-gray-700">
                                                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400"></span>
                                                {w}
                                            </li>
                                        {/each}
                                    </ul>
                                {:else}
                                    <p class="mt-3 text-sm text-gray-400">No weaknesses recorded.</p>
                                {/if}
                            </div>
                        </div>

                        {#if checks.length > 0}
                            <div class="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/50 overflow-hidden">
                                <div class="border-b border-gray-100 px-5 py-3 flex items-center gap-2">
                                    <ShieldCheck size={16} class="text-gray-400" />
                                    <h3 class="text-sm font-semibold text-gray-700">Field Validation</h3>
                                    <span class="ml-auto flex items-center gap-1.5 text-xs">
                                        <span class="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                                            <Check size={10} /> {checks.filter(c => c.status === 'pass').length}
                                        </span>
                                        <span class="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                                            <AlertTriangle size={10} /> {checks.filter(c => c.status === 'warn').length}
                                        </span>
                                        <span class="inline-flex items-center gap-0.5 rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">
                                            <X size={10} /> {checks.filter(c => c.status === 'fail').length}
                                        </span>
                                    </span>
                                </div>
                                <div class="divide-y divide-gray-100">
                                    {#each checks as check}
                                        <div class="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                                            <div class="mt-0.5 shrink-0">
                                                {#if check.status === 'pass'}
                                                    <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                                        <Check size={12} />
                                                    </span>
                                                {:else if check.status === 'warn'}
                                                    <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                                        <AlertTriangle size={12} />
                                                    </span>
                                                {:else}
                                                    <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                                                        <X size={12} />
                                                    </span>
                                                {/if}
                                            </div>
                                            <div class="min-w-0 flex-1">
                                                <p class="text-sm font-medium text-gray-800">{check.field || check.label || '—'}</p>
                                                <p class="text-xs text-gray-500">{check.message || check.detail || ''}</p>
                                            </div>
                                            <span class="text-[10px] font-medium capitalize text-gray-400">{check.status}</span>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}

                        {#if suggestedHeadline || suggestedSkills.length > 0}
                            <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/50">
                                <div class="flex items-center gap-2">
                                    <Sparkles size={16} class="text-purple-500" />
                                    <h3 class="text-sm font-semibold text-gray-700">AI Suggestions</h3>
                                </div>
                                {#if suggestedHeadline}
                                    <div class="mt-3 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 p-3 text-sm font-medium text-purple-900">
                                        💡 {suggestedHeadline}
                                    </div>
                                {/if}
                                {#if suggestedSkills.length > 0}
                                    <div class="mt-3">
                                        <p class="text-xs text-gray-400">Suggested Skills</p>
                                        <div class="mt-1.5 flex flex-wrap gap-1.5">
                                            {#each suggestedSkills as skill}
                                                <span class="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                                                    {skill}
                                                </span>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {:else}
                    <div class="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-200/50">
                        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                            <BrainCircuit size={28} class="text-gray-300" />
                        </div>
                        <h3 class="text-sm font-semibold text-gray-700">No ATS analysis</h3>
                        <p class="mt-1 text-xs text-gray-400 max-w-xs mx-auto">Resume intelligence hasn't been generated for this user yet.</p>
                    </div>
                {/if}
            {/if}

            <!-- ================= CV tab ================= -->
            {#if activeTab === 'cv'}
                {#if cvs.length === 0}
                    <div class="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-200/50">
                        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                            <FileText size={28} class="text-gray-300" />
                        </div>
                        <h3 class="text-sm font-semibold text-gray-700">No CV uploaded</h3>
                        <p class="mt-1 text-xs text-gray-400">This user hasn't uploaded a raw CV yet.</p>
                    </div>
                {:else}
                    <div class="space-y-3">
                        {#each cvs as cv}
                            <div class="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/50 hover:ring-purple-200 transition-all">
                                <div class="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                                    <FileText size={18} class="text-rose-500" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="flex items-center gap-2 text-sm font-semibold text-gray-900 truncate">
                                        {cv.file_name}
                                        {#if cv.is_current}
                                            <span class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                                Current
                                            </span>
                                        {/if}
                                    </p>
                                    <p class="text-xs text-gray-400 mt-0.5">
                                        v{cv.version} · {formatFileSize(cv.file_size)} · uploaded {formatDate(cv.created_at)}
                                    </p>
                                </div>
                                <button
                                    class="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700 transition-colors"
                                    onclick={() => downloadCV(cv)}
                                >
                                    <Download size={13} />
                                    Download
                                </button>
                            </div>
                        {/each}
                    </div>
                {/if}
            {/if}
        {/if}
    </div>
</div>