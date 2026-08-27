<script>
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/authStore";
    import { applicationService } from "$lib/api/application.service";
    import { showToast } from "$lib/stores/toast";
    import {
        PartyPopper,
        Sparkles,
        CheckCircle2,
        Building2,
        Calendar,
        ArrowLeft,
        FileText,
        Mail,
        MapPin,
        MessageSquare,
        Trophy,
        Clock,
    } from "@lucide/svelte";

    let acceptedApplications = $state([]);
    let isLoading = $state(true);

    function formatDate(dateStr) {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

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
            showToast("Please login to view accepted applications", "warning");
            goto("/auth");
            return;
        }
        loadAcceptedApplications();
    });

    async function loadAcceptedApplications() {
        try {
            const data = await applicationService.getMyApplications();
            const apps = Array.isArray(data) ? data : [];
            acceptedApplications = apps.filter(
                (a) => a.Status === "accepted"
            );
        } catch (error) {
            console.error("Failed to load accepted applications:", error);
            showToast("Failed to load accepted applications", "error");
        } finally {
            isLoading = false;
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

        {#if isLoading}
            <div class="space-y-6">
                <!-- Header skeleton -->
                <div class="rounded-2xl border border-slate-200 bg-white p-8">
                    <div class="skeleton mb-4 h-8 w-64"></div>
                    <div class="skeleton h-4 w-96"></div>
                </div>
                <!-- Card skeletons -->
                {#each [1, 2] as i}
                    <div class="rounded-xl border border-slate-200 bg-white p-6">
                        <div class="skeleton mb-4 h-6 w-48"></div>
                        <div class="skeleton mb-2 h-4 w-32"></div>
                        <div class="skeleton h-4 w-full"></div>
                    </div>
                {/each}
            </div>
        {:else if acceptedApplications.length === 0}
            <div class="rounded-2xl border border-slate-200 bg-white py-20 text-center">
                <CheckCircle2 class="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <h3 class="text-lg font-semibold text-slate-800">
                    No accepted applications
                </h3>
                <p class="mt-1 text-slate-500">
                    Keep applying — your next opportunity is around the corner!
                </p>
                <a
                    href="/jobs"
                    class="btn btn-primary mt-6 bg-indigo-600 text-white hover:bg-indigo-700"
                >
                    Browse Jobs
                </a>
            </div>
        {:else}
            <!-- Celebration Header -->
            <div
                class="mb-8 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-8 shadow-lg shadow-emerald-100/50"
            >
                <div class="flex items-center gap-4">
                    <div
                        class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-100"
                    >
                        <PartyPopper class="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                        <h1
                            class="text-2xl font-bold text-emerald-800 sm:text-3xl"
                        >
                            🎉 Congratulations!
                        </h1>
                        <p class="mt-1 text-emerald-700">
                            {#if acceptedApplications.length === 1}
                                Your application has been accepted! Here's what
                                you need to know.
                            {:else}
                                You have {acceptedApplications.length} accepted
                                application{acceptedApplications.length > 1
                                    ? "s"
                                    : ""}! Here's what you need to know.
                            {/if}
                        </p>
                    </div>
                </div>

                <!-- Next Steps Card -->
                <div
                    class="mt-6 rounded-xl border border-emerald-200/60 bg-white/60 p-5"
                >
                    <h3
                        class="mb-3 flex items-center gap-2 text-base font-semibold text-emerald-800"
                    >
                        <Sparkles class="h-5 w-5 text-emerald-600" />
                        Next Steps
                    </h3>
                    <ol class="space-y-2.5 text-sm text-emerald-700">
                        <li class="flex items-start gap-2.5">
                            <span
                                class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-bold text-emerald-700"
                                >1</span
                            >
                            Check your email for an official offer letter from the
                            employer.
                        </li>
                        <li class="flex items-start gap-2.5">
                            <span
                                class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-bold text-emerald-700"
                                >2</span
                            >
                            Review the employer feedback below for any additional
                            notes.
                        </li>
                        <li class="flex items-start gap-2.5">
                            <span
                                class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-bold text-emerald-700"
                                >3</span
                            >
                            Reach out to the employer to discuss start dates and
                            onboarding.
                        </li>
                    </ol>
                </div>
            </div>

            <!-- Accepted Application Cards -->
            <div class="space-y-6">
                {#each acceptedApplications as app (app.ID)}
                    <div
                        class="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-md shadow-emerald-100/30 transition-all hover:shadow-lg"
                    >
                        <!-- Card Header -->
                        <div
                            class="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50/50 px-6 py-5"
                        >
                            <div
                                class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <div
                                        class="flex items-center gap-2.5"
                                    >
                                        <h2
                                            class="text-xl font-bold text-slate-800"
                                        >
                                            {app.JobTitle || "Unknown Position"}
                                        </h2>
                                        <span
                                            class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"
                                        >
                                            <CheckCircle2
                                                class="h-3.5 w-3.5"
                                            />
                                            Accepted
                                        </span>
                                    </div>
                                    <div
                                        class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500"
                                    >
                                        <span
                                            class="flex items-center gap-1"
                                        >
                                            <Building2
                                                class="h-3.5 w-3.5"
                                            />
                                            {app.JobCompany ||
                                                "Unknown Company"}
                                        </span>
                                        <span
                                            class="flex items-center gap-1"
                                        >
                                            <Calendar
                                                class="h-3.5 w-3.5"
                                            />
                                            Applied {formatDate(
                                                app.SubmittedAt
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Card Body -->
                        <div class="px-6 py-5">
                            <!-- Quiz Score (if available) -->
                            {#if app.QuizScore !== null && app.QuizScore !== undefined}
                                <div
                                    class="mb-5 flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-3"
                                >
                                    <Trophy
                                        class="h-5 w-5 text-amber-600"
                                    />
                                    <div>
                                        <p
                                            class="text-sm font-medium text-amber-800"
                                        >
                                            Quiz Score: {app.QuizScore}%
                                        </p>
                                        <p
                                            class="text-xs text-amber-600/80"
                                        >
                                            {app.QuizPassed
                                                ? "Passed ✓"
                                                : "Completed"}
                                        </p>
                                    </div>
                                </div>
                            {/if}

                            <!-- Employer Feedback -->
                            {#if app.EmployerFeedback}
                                <div class="mb-5">
                                    <h3
                                        class="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                                    >
                                        <MessageSquare
                                            class="h-4 w-4 text-indigo-500"
                                        />
                                        Message from Employer
                                    </h3>
                                    <div
                                        class="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600"
                                    >
                                        {app.EmployerFeedback}
                                    </div>
                                </div>
                            {/if}

                            <!-- Application Details -->
                            <div class="grid gap-4 sm:grid-cols-2">
                                <div
                                    class="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3"
                                >
                                    <Calendar
                                        class="h-4 w-4 text-slate-400"
                                    />
                                    <div>
                                        <p
                                            class="text-xs font-medium text-slate-400"
                                        >
                                            Accepted On
                                        </p>
                                        <p
                                            class="text-sm font-medium text-slate-700"
                                        >
                                            {formatDateTime(
                                                app.UpdatedAt
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    class="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3"
                                >
                                    <Clock
                                        class="h-4 w-4 text-slate-400"
                                    />
                                    <div>
                                        <p
                                            class="text-xs font-medium text-slate-400"
                                        >
                                            Applied On
                                        </p>
                                        <p
                                            class="text-sm font-medium text-slate-700"
                                        >
                                            {formatDateTime(
                                                app.SubmittedAt
                                            )}
                                        </p>
                                    </div>
                                </div>
                                {#if app.ApplicantEmail}
                                    <div
                                        class="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3"
                                    >
                                        <Mail
                                            class="h-4 w-4 text-slate-400"
                                        />
                                        <div>
                                            <p
                                                class="text-xs font-medium text-slate-400"
                                            >
                                                Your Email
                                            </p>
                                            <p
                                                class="text-sm font-medium text-slate-700"
                                            >
                                                {app.ApplicantEmail}
                                            </p>
                                        </div>
                                    </div>
                                {/if}
                            </div>

                            <!-- Action -->
                            <div class="mt-5">
                                <a
                                    href="/jobs/{app.JobID}"
                                    class="btn gap-2 border-indigo-600/90 bg-indigo-600 text-white hover:bg-indigo-700"
                                >
                                    <FileText class="h-4 w-4" />
                                    View Job Details
                                </a>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>
