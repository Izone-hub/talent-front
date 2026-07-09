<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/authStore";
    import { applicationService } from "$lib/api/application.service";
    import { showToast } from "$lib/stores/toast";
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
    } from "@lucide/svelte";

    let applications = $state([]);
    let isLoading = $state(true);

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

    function formatDate(dateStr) {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    function viewQuiz(app) {
        const params = new URLSearchParams({
            application_id: app.ID,
            job_id: app.JobID,
        });
        goto(`/quizzes/${app.QuizID}?${params}`);
    }

    onMount(async () => {
        if (!$auth.isAuthenticated) {
            showToast("Please login to view your applications", "warning");
            goto("/auth");
            return;
        }

        try {
            const data = await applicationService.getMyApplications();
            applications = Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("Failed to load applications:", error);
            showToast("Failed to load applications", "error");
        } finally {
            isLoading = false;
        }
    });
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
            <div class="flex items-center justify-center py-20">
                <Loader2 class="h-8 w-8 animate-spin text-indigo-600" />
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
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-2">
                                    <h2 class="truncate text-lg font-bold text-slate-800">
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
                                        onclick={() => viewQuiz(app)}
                                        class="btn gap-2 border-indigo-600/90 bg-indigo-600 text-white hover:bg-indigo-700"
                                    >
                                        <FileQuestion class="h-4 w-4" />
                                        {app.Status === "quiz_started" ? "Continue Quiz" : "Take Quiz"}
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
