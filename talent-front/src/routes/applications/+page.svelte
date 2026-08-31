<script>
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/authStore";
    import { applicationService } from "$lib/api/application.service";
    import { jobService } from "$lib/api/job.service";
    import { showToast } from "$lib/stores/toast";
    import JobDetailModal from "$lib/components/jobs/JobDetailModal.svelte";
    import {
        Briefcase,
        Building2,
        Calendar,
        ArrowRight,
        FileQuestion,
        CheckCircle2,
        XCircle,
        Loader2,
        AlertTriangle,
        X,
        PartyPopper,
        Sparkles,
        Send,
        Activity,
        ThumbsDown,
    } from "@lucide/svelte";

    let applications = $state([]);
    let isLoading = $state(true);
    let showWarningModal = $state(false);
    let pendingQuizApp = $state(null);
    let selectedJob = $state(null);
    let isLoadingDetail = $state(false);

    const statusConfig = {
        draft: { label: "Draft", cls: "bg-slate-100 text-slate-600 ring-slate-200/70" },
        submitted: { label: "Submitted", cls: "bg-blue-50 text-blue-700 ring-blue-200/70" },
        quiz_started: { label: "Quiz in Progress", cls: "bg-amber-50 text-amber-700 ring-amber-200/70" },
        quiz_completed: { label: "Quiz Done", cls: "bg-teal-50 text-teal-700 ring-teal-200/70" },
        under_review: { label: "Under Review", cls: "bg-indigo-50 text-indigo-700 ring-indigo-200/70" },
        shortlisted: { label: "Shortlisted", cls: "bg-violet-50 text-violet-700 ring-violet-200/70" },
        interviewed: { label: "Interviewed", cls: "bg-purple-50 text-purple-700 ring-purple-200/70" },
        accepted: { label: "Accepted", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200/70" },
        rejected: { label: "Not Selected", cls: "bg-rose-50 text-rose-600 ring-rose-200/70" },
        withdrawn: { label: "Withdrawn", cls: "bg-slate-100 text-slate-500 ring-slate-200/70" },
    };

    const activeStatuses = [
        "submitted", "quiz_started", "quiz_completed",
        "under_review", "shortlisted", "interviewed",
    ];

    const statusProgress = {
        draft: 8, submitted: 20, quiz_started: 35, quiz_completed: 50,
        under_review: 60, shortlisted: 75, interviewed: 85,
        accepted: 100, rejected: 100, withdrawn: 100,
    };

    function statusBadge(status) {
        const s = String(status || "").toLowerCase();
        return statusConfig[s] || { label: String(status || "N/A"), cls: "bg-slate-100 text-slate-600 ring-slate-200/70" };
    }

    let stats = $derived({
        total: applications.length,
        active: applications.filter((a) => activeStatuses.includes(String(a.Status || "").toLowerCase())).length,
        accepted: applications.filter((a) => String(a.Status || "").toLowerCase() === "accepted").length,
        rejected: applications.filter((a) => String(a.Status || "").toLowerCase() === "rejected").length,
    });

    function canTakeQuiz(app) {
        return (
            app.QuizID &&
            (app.Status === "submitted" || app.Status === "quiz_started")
        );
    }

    function canViewResult(app) {
        return app.QuizID && (
            app.Status === "quiz_completed" ||
            app.Status === "under_review" ||
            app.Status === "shortlisted" ||
            app.Status === "interviewed" ||
            app.Status === "accepted" ||
            app.Status === "rejected"
        );
    }

    function formatDate(dateStr) {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    function promptQuizWarning(app) {
        pendingQuizApp = app;
        showWarningModal = true;
    }

    function confirmQuiz() {
        if (!pendingQuizApp) return;
        const params = new URLSearchParams({
            application_id: pendingQuizApp.ID,
            job_id: pendingQuizApp.JobID,
        });
        const url = `/quizzes/${pendingQuizApp.QuizID}?${params}`;
        pendingQuizApp = null;
        showWarningModal = false;
        goto(url);
    }

    function cancelQuiz() {
        pendingQuizApp = null;
        showWarningModal = false;
    }

    async function openJobDetail(app) {
        selectedJob = {
            id: app.JobID,
            title: app.JobTitle,
            company: app.JobCompany,
        };
        isLoadingDetail = true;
        const modal = document.getElementById("application-job-detail-modal");
        if (modal) modal.checked = true;

        try {
            const full = await jobService.getPublishedJob(app.JobID);
            if (full) {
                full.user_application = { applied: true };
                selectedJob = full;
            }
        } catch (err) {
            console.error("Failed to load job details:", err);
        } finally {
            isLoadingDetail = false;
        }
    }

    $effect(() => {
        // Track route so data reloads on every navigation to this page
        const _route = $page.url.pathname;
        if ($auth.loading) return;
        if (!$auth.isAuthenticated) {
            showToast("Please login to view your applications", "warning");
            goto("/auth");
            return;
        }
        isLoading = true;
        loadApplications();
    });

    async function loadApplications() {
        try {
            const data = await applicationService.getMyApplications();
            applications = Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("Failed to load applications:", error);
            showToast("Failed to load applications", "error");
        } finally {
            isLoading = false;
        }
    }

    function initials(name = "") {
        const parts = String(name || "").split(" ").filter(Boolean);
        return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "IZ";
    }

    function avatarTone(name = "") {
        const tones = [
            "from-indigo-500 to-violet-500",
            "from-sky-500 to-blue-500",
            "from-emerald-500 to-teal-500",
            "from-amber-500 to-orange-500",
            "from-rose-500 to-pink-500",
            "from-fuchsia-500 to-purple-500",
        ];
        let h = 0;
        for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % 9973;
        return tones[h % tones.length];
    }
</script>

<div class="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50/60 to-white">
    <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <!-- ─── Header ─── -->
        <div class="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    My Applications
                </h1>
                <p class="mt-1.5 text-slate-500">
                    Track and manage your job applications
                </p>
            </div>
            <a
                href="/jobs"
                class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-indigo-200 hover:text-indigo-600"
            >
                <Briefcase class="h-4 w-4" />
                Browse Jobs
            </a>
        </div>

        <!-- ─── Stats overview ─── -->
        {#if !isLoading && applications.length > 0}
            <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div class="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                        <Send class="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                        <div class="text-xl font-bold text-slate-900">{stats.total}</div>
                        <div class="text-xs font-medium text-slate-400">Total</div>
                    </div>
                </div>
                <div class="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
                        <Activity class="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <div class="text-xl font-bold text-slate-900">{stats.active}</div>
                        <div class="text-xs font-medium text-slate-400">In Progress</div>
                    </div>
                </div>
                <div class="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                        <CheckCircle2 class="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <div class="text-xl font-bold text-slate-900">{stats.accepted}</div>
                        <div class="text-xs font-medium text-slate-400">Accepted</div>
                    </div>
                </div>
                <div class="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                        <ThumbsDown class="h-5 w-5 text-rose-500" />
                    </div>
                    <div>
                        <div class="text-xl font-bold text-slate-900">{stats.rejected}</div>
                        <div class="text-xs font-medium text-slate-400">Not Selected</div>
                    </div>
                </div>
            </div>
        {/if}

        {#if !isLoading && applications.length > 0 && stats.accepted > 0}
            {@const acceptedApps = applications.filter((a) => String(a.Status || "").toLowerCase() === "accepted")}
            <div class="relative mb-6 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-green-50 p-6 shadow-lg shadow-emerald-100/50 sm:p-7">
                <div class="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-200/30 blur-2xl"></div>
                <div class="relative flex items-start gap-4">
                    <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-200">
                        <PartyPopper class="h-7 w-7 text-white" />
                    </div>
                    <div class="min-w-0 flex-1">
                        <h2 class="text-xl font-bold text-emerald-800">
                            🎉 Congratulations!
                        </h2>
                        <p class="mt-1 text-sm text-emerald-700">
                            {#if acceptedApps.length === 1}
                                Your application for <strong>{acceptedApps[0].JobTitle}</strong> at <strong>{acceptedApps[0].JobCompany}</strong> has been accepted!
                            {:else}
                                You have {acceptedApps.length} accepted application{acceptedApps.length > 1 ? "s" : ""}!
                            {/if}
                        </p>
                        <a
                            href="/applications/accepted"
                            class="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700"
                        >
                            <Sparkles class="h-4 w-4" />
                            View Next Steps
                            <ArrowRight class="h-4 w-4" />
                        </a>
                    </div>
                </div>
            </div>
        {/if}

        {#if isLoading}
            <div class="space-y-4" role="status" aria-busy="true" aria-label="Loading your applications">
                {#each [1, 2, 3] as _}
                    <div class="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
                        <div class="flex items-start gap-4">
                            <div class="skeleton h-12 w-12 shrink-0 rounded-xl"></div>
                            <div class="min-w-0 flex-1">
                                <div class="skeleton mb-2 h-5 w-2/3 rounded-lg"></div>
                                <div class="skeleton h-4 w-1/3 rounded-lg"></div>
                            </div>
                        </div>
                        <div class="skeleton mt-5 h-1.5 w-full rounded-full"></div>
                    </div>
                {/each}
            </div>
        {:else if applications.length === 0}
            <div class="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
                <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100">
                    <Briefcase class="h-8 w-8 text-indigo-500" />
                </div>
                <h3 class="text-lg font-bold text-slate-700">
                    No applications yet
                </h3>
                <p class="mx-auto mt-1.5 max-w-sm text-sm text-slate-400">
                    Browse jobs and apply to get started
                </p>
                <a
                    href="/jobs"
                    class="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
                >
                    Browse Jobs
                    <ArrowRight class="h-4 w-4" />
                </a>
            </div>
        {:else}
            <div class="space-y-4">
                {#each applications as app, index (app.ID)}
                    {@const statusKey = String(app.Status || "").toLowerCase()}
                    {@const st = statusBadge(app.Status)}
                    {@const progress = statusProgress[statusKey] ?? 0}
                    {@const isAccepted = statusKey === "accepted"}
                    {@const isRejected = statusKey === "rejected"}
                    {@const canQuiz = canTakeQuiz(app)}
                    {@const canResult = canViewResult(app)}
                    <div
                        class="app-card group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg {isAccepted
                            ? 'border-emerald-200 hover:shadow-emerald-100/60'
                            : isRejected
                                ? 'border-slate-200/70 hover:shadow-indigo-100/60'
                                : 'border-slate-200/70 hover:border-indigo-200 hover:shadow-indigo-100/60'}"
                        style="animation-delay: {Math.min(index * 60, 360)}ms"
                    >
                        {#if isAccepted}
                            <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400"></div>
                        {/if}

                        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <!-- Left: job info -->
                            <div
                                class="flex min-w-0 flex-1 cursor-pointer items-start gap-4"
                                role="button"
                                tabindex="0"
                                onclick={() => openJobDetail(app)}
                                onkeydown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        openJobDetail(app);
                                    }
                                }}
                            >
                                <span
                                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br {avatarTone(app.JobCompany)} text-base font-bold text-white shadow-sm"
                                >
                                    {initials(app.JobCompany)}
                                </span>
                                <div class="min-w-0">
                                    <div class="flex flex-wrap items-center gap-2">
                                        <h2 class="truncate text-lg font-bold tracking-tight text-slate-800 transition-colors group-hover:text-indigo-600">
                                            {app.JobTitle || "Unknown Position"}
                                        </h2>
                                        <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 {st.cls}">
                                            {#if isAccepted}
                                                <Sparkles class="mr-1 h-3 w-3" />
                                            {/if}
                                            {st.label}
                                        </span>
                                    </div>
                                    <div class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                        <span class="inline-flex items-center gap-1.5">
                                            <Building2 class="h-3.5 w-3.5 text-slate-400" />
                                            {app.JobCompany || "Unknown Company"}
                                        </span>
                                        <span class="inline-flex items-center gap-1.5">
                                            <Calendar class="h-3.5 w-3.5 text-slate-400" />
                                            Applied {formatDate(app.SubmittedAt)}
                                        </span>
                                        {#if app.QuizScore !== null && app.QuizScore !== undefined}
                                            <span class="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600 ring-1 ring-emerald-100">
                                                <CheckCircle2 class="h-3.5 w-3.5" />
                                                Score {app.QuizScore}%
                                            </span>
                                        {/if}
                                    </div>
                                </div>
                            </div>

                            <!-- Right: action -->
                            <div class="flex shrink-0 flex-col items-end gap-2 sm:pl-4">
                                {#if canQuiz}
                                    <button
                                        onclick={() => promptQuizWarning(app)}
                                        class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
                                    >
                                        <FileQuestion class="h-4 w-4" />
                                        {app.Status === "quiz_started" ? "Continue Quiz" : "Take Quiz"}
                                        <ArrowRight class="h-4 w-4" />
                                    </button>
                                {:else if canResult}
                                    <button
                                        onclick={() => {
                                            const params = new URLSearchParams({
                                                application_id: app.ID,
                                                job_title: app.JobTitle || "",
                                                job_company: app.JobCompany || "",
                                            });
                                            goto(`/quizzes/${app.QuizID}/result?${params}`);
                                        }}
                                        class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700"
                                    >
                                        <CheckCircle2 class="h-4 w-4" />
                                        View Result
                                        <ArrowRight class="h-4 w-4" />
                                    </button>
                                {:else if ["under_review", "shortlisted", "interviewed"].includes(statusKey)}
                                    <span class="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-100">
                                        <Loader2 class="h-4 w-4 animate-spin" />
                                        In Review
                                    </span>
                                {:else if isAccepted}
                                    <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1.5 text-sm font-semibold text-emerald-700">
                                        <CheckCircle2 class="h-4 w-4" />
                                        Accepted!
                                    </span>
                                    <a
                                        href="/applications/accepted"
                                        class="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-800"
                                    >
                                        View next steps
                                        <ArrowRight class="h-3 w-3" />
                                    </a>
                                {:else if isRejected}
                                    <span class="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 ring-1 ring-rose-100">
                                        <XCircle class="h-4 w-4" />
                                        Not Selected
                                    </span>
                                {/if}
                            </div>
                        </div>

                        <!-- Progress -->
                        <div class="mt-4">
                            <div class="mb-1.5 flex items-center justify-between">
                                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Progress
                                </span>
                                <span class="text-[11px] font-bold {isAccepted ? 'text-emerald-600' : isRejected ? 'text-rose-500' : 'text-indigo-600'}">
                                    {progress}%
                                </span>
                            </div>
                            <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    class="h-full rounded-full transition-all duration-500 {isAccepted
                                        ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                        : isRejected
                                            ? 'bg-rose-400'
                                            : 'bg-gradient-to-r from-indigo-500 to-violet-500'}"
                                    style="width: {progress}%"
                                ></div>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

{#if showWarningModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl">
            <div class="flex items-start justify-between">
                <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
                    <AlertTriangle class="h-7 w-7 text-amber-600" />
                </div>
                <button onclick={cancelQuiz} class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                    <X class="h-5 w-5" />
                </button>
            </div>
            <h2 class="mt-4 text-xl font-bold text-slate-800">Before You Start</h2>
            <p class="mt-1 text-sm text-slate-500">
                Please read the following rules carefully before starting the quiz:
            </p>
            <ul class="mt-5 space-y-3">
                <li class="flex items-start gap-3 text-sm text-slate-700">
                    <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">1</span>
                    You cannot copy or paste answers
                </li>
                <li class="flex items-start gap-3 text-sm text-slate-700">
                    <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">2</span>
                    Do not open another browser tab
                </li>
                <li class="flex items-start gap-3 text-sm text-slate-700">
                    <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">3</span>
                    Do not refresh or leave this page
                </li>
            </ul>
            <div class="mt-6 flex gap-3">
                <button
                    onclick={cancelQuiz}
                    class="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    Cancel
                </button>
                <button
                    onclick={confirmQuiz}
                    class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
                >
                    Continue
                    <ArrowRight class="h-4 w-4" />
                </button>
            </div>
        </div>
    </div>
{/if}

<JobDetailModal
    job={selectedJob}
    modalId="application-job-detail-modal"
    loading={isLoadingDetail}
    isApplied={true}
/>

<style>
    @keyframes cardFadeIn {
        from {
            opacity: 0;
            transform: translateY(12px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    :global(.app-card) {
        animation: cardFadeIn 0.35s ease-out both;
    }
</style>