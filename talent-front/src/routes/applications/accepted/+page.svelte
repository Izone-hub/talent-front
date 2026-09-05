<script>
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/authStore";
    import { applicationService } from "$lib/api/application.service";
    import { jobService } from "$lib/api/job.service";
    import { showToast } from "$lib/stores/toast";
    import JobDetailModal from "$lib/components/jobs/JobDetailModal.svelte";
    import {
        ArrowLeft,
        Briefcase,
        Building2,
        Calendar,
        Clock,
        Mail,
        MessageSquare,
        FileText,
    } from "@lucide/svelte";

    let application = $state(null);
    let isLoading = $state(true);
    let selectedJob = $state(null);
    let isLoadingDetail = $state(false);

    // Canonical source of truth: users.acceptance_job_id tells us which job
    // this user accepted. We never derive acceptance from anything else.
    const acceptedJobId = $derived($auth.user?.acceptance_job_id || null);

    function formatDateTime(dateStr) {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    $effect(() => {
        if ($auth.loading) return;
        if (!$auth.isAuthenticated) {
            showToast("Please login to view your accepted job", "warning");
            goto("/auth");
            return;
        }
        loadAcceptedApplication();
    });

    async function loadAcceptedApplication() {
        isLoading = true;
        try {
            if (!acceptedJobId) {
                application = null;
                return;
            }
            // The backend only returns the application for the accepted job
            // when users.acceptance_job_id is set; match by the canonical ID
            // so an unrelated application can never take its place.
            const data = await applicationService.getMyApplications();
            const apps = Array.isArray(data) ? data : [];
            application =
                apps.find((a) => String(a.JobID) === String(acceptedJobId)) || null;
        } catch (error) {
            console.error("Failed to load accepted application:", error);
            showToast("Failed to load accepted application", "error");
            application = null;
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

    async function openJobDetail(app) {
        selectedJob = {
            id: app.JobID,
            title: app.JobTitle,
            company: app.JobCompany,
        };
        isLoadingDetail = true;
        const modal = document.getElementById("accepted-job-detail-modal");
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
</script>

<div class="min-h-screen bg-slate-50 font-sans">
    <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <!-- Back link -->
        <a
            href="/applications"
            class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
        >
            <ArrowLeft class="h-4 w-4" />
            Back to My Applications
        </a>

        <!-- Heading -->
        <div class="mb-6">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Accepted Job
            </h1>
            <p class="mt-1.5 text-slate-500">
                The position you have been accepted for, with your application details.
            </p>
        </div>

        {#if isLoading}
            <!-- Loading skeleton (same style as the rest of the app) -->
            <div class="space-y-6" role="status" aria-busy="true" aria-label="Loading accepted job">
                <div class="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
                    <div class="flex items-start gap-4">
                        <div class="skeleton h-14 w-14 shrink-0 rounded-xl"></div>
                        <div class="min-w-0 flex-1">
                            <div class="skeleton mb-2 h-5 w-2/3 rounded-lg"></div>
                            <div class="skeleton h-4 w-1/3 rounded-lg"></div>
                        </div>
                    </div>
                    <div class="skeleton mt-5 h-1.5 w-full rounded-full"></div>
                </div>
            </div>
        {:else if !acceptedJobId || !application}
            <div class="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
                <Briefcase class="mx-auto mb-5 h-12 w-12 text-slate-300" />
                <h3 class="text-lg font-bold text-slate-700">
                    No accepted job yet
                </h3>
                <p class="mx-auto mt-1.5 max-w-sm text-sm text-slate-400">
                    Once your application is accepted, it will appear here.
                </p>
                <a
                    href="/applications"
                    class="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
                >
                    Back to My Applications
                    <ArrowLeft class="h-4 w-4" />
                </a>
            </div>
        {:else}
            {@const app = application}
            <!-- Accepted application, displayed like any other application -->
            <div
                role="button"
                tabindex="0"
                onclick={() => openJobDetail(app)}
                onkeydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openJobDetail(app);
                    }
                }}
                class="app-card group overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
            >
                <!-- Card header -->
                <div class="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex items-center gap-4">
                        <span
                            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br {avatarTone(app.JobCompany)} text-base font-bold text-white shadow-sm"
                        >
                            {initials(app.JobCompany)}
                        </span>
                        <div class="min-w-0">
                            <h2 class="truncate text-lg font-bold tracking-tight text-slate-800 transition-colors group-hover:text-indigo-600 sm:text-xl">
                                {app.JobTitle || "Unknown Position"}
                            </h2>
                            <div class="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                <span class="inline-flex items-center gap-1.5">
                                    <Building2 class="h-3.5 w-3.5 text-slate-400" />
                                    {app.JobCompany || "Unknown Company"}
                                </span>
                                <span class="inline-flex items-center gap-1.5">
                                    <Calendar class="h-3.5 w-3.5 text-slate-400" />
                                    Applied {formatDateTime(app.SubmittedAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <span
                        class="inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 {String(
                            app.Status || ""
                        ).toLowerCase() === 'accepted'
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/70'
                            : 'bg-slate-100 text-slate-600 ring-slate-200/70'}"
                    >
                        {String(app.Status || "Accepted").replace(/_/g, " ")}
                    </span>
                </div>

                <!-- Card body -->
                <div class="px-6 py-5">
                    <!-- Quiz score (if available) -->
                    {#if app.QuizScore !== null && app.QuizScore !== undefined}
                        <div class="mb-5 flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3">
                            <FileText class="h-4 w-4 shrink-0 text-indigo-500" />
                            <div class="min-w-0">
                                <p class="text-sm font-medium text-slate-700">
                                    Quiz Score: {app.QuizScore}%
                                </p>
                                <p class="text-xs text-slate-400">
                                    {app.QuizPassed ? "Passed ✓" : "Completed"}
                                </p>
                            </div>
                        </div>
                    {/if}

                    <!-- Employer feedback -->
                    {#if app.EmployerFeedback}
                        <div class="mb-5">
                            <h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <MessageSquare class="h-4 w-4 text-indigo-500" />
                                Message from Employer
                            </h3>
                            <div class="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                                {app.EmployerFeedback}
                            </div>
                        </div>
                    {/if}

                    <!-- Application details -->
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div class="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                            <Clock class="h-4 w-4 shrink-0 text-slate-400" />
                            <div class="min-w-0">
                                <p class="text-xs font-medium text-slate-400">
                                    Last Updated
                                </p>
                                <p class="truncate text-sm font-medium text-slate-700">
                                    {formatDateTime(app.UpdatedAt)}
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                            <Calendar class="h-4 w-4 shrink-0 text-slate-400" />
                            <div class="min-w-0">
                                <p class="text-xs font-medium text-slate-400">
                                    Applied On
                                </p>
                                <p class="truncate text-sm font-medium text-slate-700">
                                    {formatDateTime(app.SubmittedAt)}
                                </p>
                            </div>
                        </div>
                        {#if app.ApplicantEmail}
                            <div class="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                                <Mail class="h-4 w-4 shrink-0 text-slate-400" />
                                <div class="min-w-0">
                                    <p class="text-xs font-medium text-slate-400">
                                        Your Email
                                    </p>
                                    <p class="truncate text-sm font-medium text-slate-700">
                                        {app.ApplicantEmail}
                                    </p>
                                </div>
                            </div>
                        {/if}
                    </div>

                    <!-- Action -->
                    <div class="mt-5 flex justify-end">
                        <button
                            onclick={() => openJobDetail(app)}
                            class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-indigo-200 hover:text-indigo-600"
                        >
                            <FileText class="h-4 w-4" />
                            View Job Details
                        </button>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

<JobDetailModal
    job={selectedJob}
    modalId="accepted-job-detail-modal"
    loading={isLoadingDetail}
    isApplied={true}
/>
