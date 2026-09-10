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
        AlertTriangle,
        X,
        Send,
        Activity,
        ThumbsDown,
        MapPin,
        Eye,
    } from "@lucide/svelte";

	let applications = $state([]);
	let isLoading = $state(true);
	let showWarningModal = $state(false);
	let pendingQuizApp = $state(null);
	let selectedJob = $state(null);
	let isLoadingDetail = $state(false);

	// Stats are aggregated server-side (one request, one payload); the client
	// only renders them.
	let stats = $state({ total: 0, active: 0, accepted: 0, rejected: 0 });
	let activeTab = $state("all"); // "all" | "active" | "accepted" | "rejected"

	const isApplicationActive = (status) => {
		const s = String(status || "").toLowerCase();
		return (
			s === "submitted" ||
			s === "quiz_started" ||
			s === "quiz_completed" ||
			s === "under_review" ||
			s === "shortlisted" ||
			s === "interviewed"
		);
	};

	const isApplicationRejected = (status) => {
		const s = String(status || "").toLowerCase();
		return s === "rejected" || s === "withdrawn";
	};

	const tabCounts = $derived({
		all: applications.length,
		active: applications.filter((app) => isApplicationActive(app.Status)).length,
		accepted: applications.filter((app) => String(app.Status || "").toLowerCase() === "accepted").length,
		rejected: applications.filter((app) => isApplicationRejected(app.Status)).length,
	});

	const filteredApplications = $derived.by(() => {
		if (activeTab === "active") {
			return applications.filter((app) => isApplicationActive(app.Status));
		}
		if (activeTab === "accepted") {
			return applications.filter((app) => String(app.Status || "").toLowerCase() === "accepted");
		}
		if (activeTab === "rejected") {
			return applications.filter((app) => isApplicationRejected(app.Status));
		}
		return applications;
	});

	// A user who has accepted a job can no longer browse other positions:
	// their CTA should lead back to the accepted-job area instead.
	const hasAcceptedJob = $derived(
		$auth.isAuthenticated && Boolean($auth.user?.acceptance_job_id)
	);

    const statusConfig = {
        draft: { label: "Draft", cls: "bg-slate-100 text-slate-700 ring-slate-200/80" },
        submitted: { label: "Submitted", cls: "bg-blue-50 text-blue-700 ring-blue-200/70" },
        quiz_started: { label: "Quiz in Progress", cls: "bg-blue-50 text-blue-700 ring-blue-200/70" },
        quiz_completed: { label: "Quiz Done", cls: "bg-blue-50 text-blue-700 ring-blue-200/70" },
        under_review: { label: "Under Review", cls: "bg-blue-50 text-blue-700 ring-blue-200/70" },
        shortlisted: { label: "Shortlisted", cls: "bg-blue-50 text-blue-700 ring-blue-200/70" },
        interviewed: { label: "Interviewed", cls: "bg-blue-50 text-blue-700 ring-blue-200/70" },
        accepted: { label: "Accepted", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200/80" },
        rejected: { label: "Not Selected", cls: "bg-slate-100 text-slate-700 ring-slate-200/80" },
        withdrawn: { label: "Withdrawn", cls: "bg-slate-100 text-slate-500 ring-slate-200/80" },
    };

    function statusBadge(status) {
        const s = String(status || "").toLowerCase();
        return statusConfig[s] || { label: String(status || "N/A"), cls: "bg-slate-100 text-slate-600 ring-slate-200/70" };
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
        // Track route so data reloads on every navigation to this page.
        const route = $page.url.pathname;
        if ($auth.loading) return;
        if (!$auth.isAuthenticated) {
            showToast("Please login to view your applications", "warning");
            goto("/auth");
            return;
        }
        loadApplications(route);
    });

    // Guards against duplicate requests: the effect can re-run while the auth
    // store settles, but only the first run per page entry hits the API.
    let loadedRoute = null;
    async function loadApplications(route) {
        if (loadedRoute === route) return;
        loadedRoute = route;
        isLoading = true;
        try {
            const { applications: data, stats: serverStats } =
                await applicationService.getMyApplicationsOverview();
            applications = data;
            stats = serverStats;
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
                </h1>				<p class="mt-1.5 text-slate-500">
					Track and manage your job applications
				</p>
			</div>
			{#if !hasAcceptedJob}
				<a
					href="/jobs"
					class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:text-blue-600"
				>
					<Briefcase class="h-4 w-4" />
					Browse Jobs
				</a>
			{/if}
		</div>

        <!-- ─── Stats overview ─── -->
        {#if isLoading}
            <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-hidden="true">
                {#each [1, 2, 3, 4] as _}
                    <div class="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
                        <div class="skeleton h-11 w-11 shrink-0 rounded-xl"></div>
                        <div class="flex-1 space-y-2">
                            <div class="skeleton h-5 w-12 rounded"></div>
                            <div class="skeleton h-3 w-16 rounded"></div>
                        </div>
                    </div>
                {/each}
            </div>
        {:else if applications.length > 0}
            <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <button
                    type="button"
                    onclick={() => activeTab = 'all'}
                    class="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm text-left transition cursor-pointer {activeTab === 'all' ? 'border-blue-500 ring-2 ring-blue-200 shadow-sm' : 'border-slate-200/70 hover:border-slate-300'}"
                >
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <Send class="h-5 w-5" />
                    </div>
                    <div>
                        <div class="text-xl font-bold text-slate-900">{stats.total}</div>
                        <div class="text-xs font-medium text-slate-400">Total</div>
                    </div>
                </button>
                <button
                    type="button"
                    onclick={() => activeTab = 'active'}
                    class="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm text-left transition cursor-pointer {activeTab === 'active' ? 'border-blue-500 ring-2 ring-blue-200 shadow-sm' : 'border-slate-200/70 hover:border-slate-300'}"
                >
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200/70">
                        <Activity class="h-5 w-5" />
                    </div>
                    <div>
                        <div class="text-xl font-bold text-slate-900">{stats.active}</div>
                        <div class="text-xs font-medium text-slate-400">In Progress</div>
                    </div>
                </button>
                <button
                    type="button"
                    onclick={() => activeTab = 'accepted'}
                    class="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm text-left transition cursor-pointer {activeTab === 'accepted' ? 'border-emerald-500 ring-2 ring-emerald-200 shadow-sm' : 'border-slate-200/70 hover:border-slate-300'}"
                >
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70">
                        <CheckCircle2 class="h-5 w-5" />
                    </div>
                    <div>
                        <div class="text-xl font-bold text-slate-900">{stats.accepted}</div>
                        <div class="text-xs font-medium text-slate-400">Accepted</div>
                    </div>
                </button>
                <button
                    type="button"
                    onclick={() => activeTab = 'rejected'}
                    class="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm text-left transition cursor-pointer {activeTab === 'rejected' ? 'border-slate-500 ring-2 ring-slate-200 shadow-sm' : 'border-slate-200/70 hover:border-slate-300'}"
                >
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <ThumbsDown class="h-5 w-5" />
                    </div>
                    <div>
                        <div class="text-xl font-bold text-slate-900">{stats.rejected}</div>
                        <div class="text-xs font-medium text-slate-400">Not Selected</div>
                    </div>
                </button>
            </div>
        {/if}

        <!-- ─── Applications List ─── -->
        {#if isLoading}
            <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div class="skeleton h-6 w-36 rounded-lg"></div>
                <div class="skeleton h-9 w-80 max-w-full rounded-xl"></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" role="status" aria-busy="true" aria-label="Loading your applications">
                {#each [1, 2, 3, 4, 5, 6] as _}
                    <div class="flex flex-col justify-between rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5 shadow-sm">
                        <div>
                            <!-- Top: Status Badge + Date -->
                            <div class="flex items-center justify-between gap-2 mb-3">
                                <div class="skeleton h-5 w-20 rounded-full"></div>
                                <div class="skeleton h-3.5 w-16 rounded"></div>
                            </div>

                            <!-- Middle Content -->
                            <div class="space-y-2">
                                <div class="skeleton h-5 w-4/5 rounded-md"></div>
                                <div class="skeleton h-4 w-1/2 rounded"></div>
                                <div class="mt-3 flex flex-wrap gap-1.5 pt-0.5">
                                    <div class="skeleton h-5 w-20 rounded-md"></div>
                                    <div class="skeleton h-5 w-16 rounded-md"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Bottom Actions -->
                        <div class="mt-4 pt-3.5 border-t border-slate-100 flex items-center gap-2">
                            <div class="skeleton h-8 flex-1 rounded-xl"></div>
                            <div class="skeleton h-8 w-16 rounded-xl"></div>
                        </div>
                    </div>
                {/each}
            </div>
        {:else if applications.length === 0}
            <div class="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
                <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-blue-600">
                    <Briefcase class="h-8 w-8" />
                </div>
                <h3 class="text-lg font-bold text-slate-700">No applications yet</h3>
                <p class="mx-auto mt-1.5 max-w-sm text-sm text-slate-400">
                    Browse jobs and apply to get started
                </p>
                {#if !hasAcceptedJob}
                    <a
                        href="/jobs"
                        class="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
                    >
                        Browse Jobs
                        <ArrowRight class="h-4 w-4" />
                    </a>
                {/if}
            </div>
        {:else}
            <!-- ─── Tab List / Filter Header ─── -->
            <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                    <h2 class="text-base sm:text-lg font-bold text-slate-900">
                        {activeTab === 'all'
                            ? 'All Applications'
                            : activeTab === 'active'
                              ? 'In Progress'
                              : activeTab === 'accepted'
                                ? 'Accepted Applications'
                                : 'Not Selected Applications'}
                    </h2>
                    <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        {filteredApplications.length}
                    </span>
                </div>

                <!-- Tab list buttons -->
                <div class="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
                    <button
                        type="button"
                        onclick={() => activeTab = 'all'}
                        class="rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer {activeTab === 'all' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                    >
                        All ({tabCounts.all})
                    </button>
                    <button
                        type="button"
                        onclick={() => activeTab = 'active'}
                        class="rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer {activeTab === 'active' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                    >
                        In Progress ({tabCounts.active})
                    </button>
                    <button
                        type="button"
                        onclick={() => activeTab = 'accepted'}
                        class="rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer {activeTab === 'accepted' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                    >
                        Accepted ({tabCounts.accepted})
                    </button>
                    <button
                        type="button"
                        onclick={() => activeTab = 'rejected'}
                        class="rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer {activeTab === 'rejected' ? 'bg-slate-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
                    >
                        Not Selected ({tabCounts.rejected})
                    </button>
                </div>
            </div>

            {#if filteredApplications.length === 0}
                <div class="rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
                    <p class="text-sm font-medium text-slate-500">
                        No applications found in this category.
                    </p>
                    <button
                        type="button"
                        onclick={() => activeTab = 'all'}
                        class="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                        View all applications
                        <ArrowRight class="h-3.5 w-3.5" />
                    </button>
                </div>
            {:else}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {#each filteredApplications as app, index (app.ID)}
                    {@const statusKey = String(app.Status || "").toLowerCase()}
                    {@const st = statusBadge(app.Status)}
                    {@const canQuiz = canTakeQuiz(app)}
                    {@const canResult = canViewResult(app)}
                    {@const isThisAcceptedJob = hasAcceptedJob && String(app.JobID) === String($auth.user?.acceptance_job_id)}
                    <div
                        class="app-card group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                        style="animation-delay: {Math.min(index * 50, 300)}ms"
                    >
                        <div>
                            <!-- Top: Status Badge & Applied Date -->
                            <div class="flex items-center justify-between gap-2 mb-3">
                                <span class="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 {st.cls}">
                                    {st.label}
                                </span>
                                <span class="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                                    <Calendar class="h-3 w-3 text-slate-400 shrink-0" />
                                    {formatDate(app.SubmittedAt)}
                                </span>
                            </div>

                            <!-- Title & Company -->
                            <button
                                type="button"
                                onclick={() => openJobDetail(app)}
                                class="text-left text-base font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 hover:underline decoration-blue-300 underline-offset-2 line-clamp-1 w-full"
                                title={app.JobTitle}
                            >
                                {app.JobTitle || "Unknown Position"}
                            </button>

                            <p class="mt-1 text-xs sm:text-sm font-semibold text-slate-600 flex items-center gap-1.5 truncate">
                                <Building2 class="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span class="truncate">{app.JobCompany || "Unknown Company"}</span>
                            </p>

                            <!-- Metadata chips -->
                            {#if app.JobLocation || app.JobType}
                                <div class="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                                    {#if app.JobLocation}
                                        <span class="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] border border-slate-100 truncate max-w-[130px]">
                                            <MapPin class="h-3 w-3 text-slate-400 shrink-0" />
                                            <span class="truncate">{app.JobLocation}</span>
                                        </span>
                                    {/if}
                                    {#if app.JobType}
                                        <span class="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] border border-slate-100 capitalize">
                                            <Briefcase class="h-3 w-3 text-slate-400 shrink-0" />
                                            {app.JobType.replace(/_/g, " ")}
                                        </span>
                                    {/if}
                                </div>
                            {/if}
                        </div>

                        <!-- Bottom: Action Buttons -->
                        <div class="mt-4 pt-3.5 border-t border-slate-100 flex items-center gap-2">
                            {#if isThisAcceptedJob}
                                <a
                                    href="/applications/accepted"
                                    class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-700"
                                >
                                    <CheckCircle2 class="h-3.5 w-3.5" />
                                    View Details
                                    <ArrowRight class="h-3.5 w-3.5" />
                                </a>
                            {:else if canQuiz}
                                <button
                                    onclick={() => promptQuizWarning(app)}
                                    class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 cursor-pointer"
                                >
                                    <FileQuestion class="h-3.5 w-3.5" />
                                    {app.Status === "quiz_started" ? "Continue Quiz" : "Take Quiz"}
                                    <ArrowRight class="h-3.5 w-3.5" />
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
                                    class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-700 cursor-pointer"
                                >
                                    <CheckCircle2 class="h-3.5 w-3.5" />
                                    View Result
                                    <ArrowRight class="h-3.5 w-3.5" />
                                </button>
                            {/if}

                            {#if !isThisAcceptedJob}
                                <button
                                    onclick={() => openJobDetail(app)}
                                    class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs transition hover:border-blue-200 hover:bg-slate-50 hover:text-blue-600 cursor-pointer {!canQuiz && !canResult ? 'flex-1' : ''}"
                                >
                                    <Eye class="h-3.5 w-3.5 text-slate-400" />
                                    Details
                                </button>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    {/if}
</div>
</div>

{#if showWarningModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl">
            <div class="flex items-start justify-between">
                <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <AlertTriangle class="h-7 w-7" />
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
                    <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">1</span>
                    You cannot copy or paste answers
                </li>
                <li class="flex items-start gap-3 text-sm text-slate-700">
                    <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">2</span>
                    Do not open another browser tab
                </li>
                <li class="flex items-start gap-3 text-sm text-slate-700">
                    <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">3</span>
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
                    class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
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