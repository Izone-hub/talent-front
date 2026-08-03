<script>
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/authStore";
    import { applicationService } from "$lib/api/application.service";
    import { jobService } from "$lib/api/job.service";
    import { showToast } from "$lib/stores/toast";
    import JobDetailModal from "$lib/components/jobs/JobDetailModal.svelte";
    import {
        Briefcase,
        Building2,
        Clock,
        Calendar,
        ArrowRight,
        FileQuestion,
        CheckCircle2,
        XCircle,
        Loader2,
        AlertTriangle,
        X,
    } from "@lucide/svelte";

    let applications = $state([]);
    let isLoading = $state(true);
    let showWarningModal = $state(false);
    let pendingQuizApp = $state(null);
    let selectedJob = $state(null);
    let isLoadingDetail = $state(false);

    const statusConfig = {
        draft: { label: "Draft", class: "badge-ghost" },
        submitted: { label: "Submitted", class: "badge-info" },
        quiz_started: { label: "Quiz in Progress", class: "badge-warning" },
        quiz_completed: { label: "Quiz Completed", class: "badge-success" },
        under_review: { label: "Under Review", class: "badge-primary" },
        shortlisted: { label: "Shortlisted", class: "badge-success" },
        interviewed: { label: "Interviewed", class: "badge-accent" },
        accepted: { label: "Accepted", class: "badge-success" },
        rejected: { label: "Rejected", class: "badge-error" },
        withdrawn: { label: "Withdrawn", class: "badge-ghost" },
    };

    function statusBadge(status) {
        const cfg = statusConfig[status] || { label: status, class: "badge-ghost" };
        return cfg;
    }

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
        if ($auth.loading) return;
        if (!$auth.isAuthenticated) {
            showToast("Please login to view your applications", "warning");
            goto("/auth");
            return;
        }
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
</script>

<div class="min-h-screen bg-slate-50 font-sans">
    <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div class="mb-8">
            <h1 class="text-3xl font-bold tracking-tight text-slate-800">
                My Applications
            </h1>
            <p class="mt-2 text-slate-500">
                Track and manage your job applications
            </p>
        </div>

        {#if isLoading}
            <div class="space-y-4" role="status" aria-busy="true" aria-label="Loading your applications">
                {#each [1, 2, 3] as i}
                    <div class="rounded-xl border border-slate-200 bg-white p-6">
                        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-2">
                                    <div class="skeleton h-5 w-48"></div>
                                    <div class="skeleton h-5 w-16 rounded-full"></div>
                                </div>
                                <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                                    <div class="skeleton h-3 w-32"></div>
                                    <div class="skeleton h-3 w-24"></div>
                                    <div class="skeleton h-3 w-20"></div>
                                </div>
                            </div>
                            <div class="flex shrink-0 gap-2">
                                <div class="skeleton h-10 w-28 rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {:else if applications.length === 0}
            <div class="rounded-2xl border border-slate-200 bg-white py-20 text-center">
                <Briefcase class="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <h3 class="text-lg font-semibold text-slate-800">
                    No applications yet
                </h3>
                <p class="mt-1 text-slate-500">
                    Browse jobs and apply to get started
                </p>
                <a href="/jobs" class="btn btn-primary mt-6 bg-indigo-600 text-white hover:bg-indigo-700">
                    Browse Jobs
                </a>
            </div>
        {:else}
            <div class="space-y-4">
                {#each applications as app (app.ID)}
                    <div class="rounded-xl border border-slate-200 bg-white p-6 transition-all hover:shadow-md">
                        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div class="min-w-0 flex-1 cursor-pointer" onclick={() => openJobDetail(app)}>
                                <div class="flex items-center gap-2">
                                    <h2 class="truncate text-lg font-bold text-slate-800 hover:text-indigo-600">
                                        {app.JobTitle || "Unknown Position"}
                                    </h2>
                                    <span class="badge {statusBadge(app.Status).class} badge-sm">
                                        {statusBadge(app.Status).label}
                                    </span>
                                </div>
                                <div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                    <span class="flex items-center gap-1">
                                        <Building2 class="h-3.5 w-3.5" />
                                        {app.JobCompany || "Unknown Company"}
                                    </span>
                                    <span class="flex items-center gap-1">
                                        <Calendar class="h-3.5 w-3.5" />
                                        Applied {formatDate(app.SubmittedAt)}
                                    </span>
                                    {#if app.QuizScore !== null && app.QuizScore !== undefined}
                                        <span class="flex items-center gap-1">
                                            <CheckCircle2 class="h-3.5 w-3.5 text-emerald-600" />
                                            Score: {app.QuizScore}%
                                        </span>
                                    {/if}
                                </div>
                            </div>

                            <div class="flex shrink-0 gap-2">
                                {#if canTakeQuiz(app)}
                                    <button
                                        onclick={() => promptQuizWarning(app)}
                                        class="btn gap-2 border-indigo-600/90 bg-indigo-600 text-white hover:bg-indigo-700"
                                    >
                                        <FileQuestion class="h-4 w-4" />
                                        {app.Status === "quiz_started" ? "Continue Quiz" : "Take Quiz"}
                                        <ArrowRight class="h-4 w-4" />
                                    </button>
                                {:else if canViewResult(app)}
                                    <button
                                        onclick={() => {
                                            const params = new URLSearchParams({
                                                application_id: app.ID,
                                                job_title: app.JobTitle || "",
                                                job_company: app.JobCompany || "",
                                            });
                                            goto(`/quizzes/${app.QuizID}/result?${params}`);
                                        }}
                                        class="btn gap-2 border-emerald-600/90 bg-emerald-600 text-white hover:bg-emerald-700"
                                    >
                                        <CheckCircle2 class="h-4 w-4" />
                                        View Result
                                        <ArrowRight class="h-4 w-4" />
                                    </button>
                                {:else if app.Status === "under_review" || app.Status === "shortlisted" || app.Status === "interviewed"}
                                    <span class="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                                        <Loader2 class="h-4 w-4 animate-spin" />
                                        In Review
                                    </span>
                                {:else if app.Status === "accepted"}
                                    <span class="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                                        <CheckCircle2 class="h-4 w-4" />
                                        Accepted
                                    </span>
                                {:else if app.Status === "rejected"}
                                    <span class="flex items-center gap-1.5 text-sm font-medium text-red-600">
                                        <XCircle class="h-4 w-4" />
                                        Not Selected
                                    </span>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

{#if showWarningModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl">
            <div class="flex items-start justify-between">
                <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
                    <AlertTriangle class="h-7 w-7 text-amber-600" />
                </div>
                <button onclick={cancelQuiz} class="btn btn-ghost btn-sm btn-square text-slate-400 hover:bg-slate-100">
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
                    class="btn flex-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                >
                    Cancel
                </button>
                <button
                    onclick={confirmQuiz}
                    class="btn flex-1 gap-2 border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700"
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
