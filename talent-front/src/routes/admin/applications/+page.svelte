<script>
    import { jobService } from "$lib/api/job.service";
    import { applicationService } from "$lib/api/application.service";
    import { Users } from "lucide-svelte";
    import PassFailBadge from "$lib/components/ui/PassFailBadge.svelte";
    import PageLoader from "$lib/components/ui/PageLoader.svelte";
    import EmptyState from "$lib/components/ui/EmptyState.svelte";
    import { showToast } from "$lib/stores/toast";
    import { goto } from "$app/navigation";

    let jobs = $state([]);
    let selectedJobId = $state("");
    let selectedJob = $state(null);
    let applications = $state([]);
    let loading = $state(true);

    $effect(() => {
        loadJobs();
    });

    async function loadJobs() {
        loading = true;
        try {
            jobs = await jobService.listPublishedJobs();
        } catch (error) {
            showToast("Failed to load jobs", "error");
            console.error(error);
        } finally {
            loading = false;
        }
    }

    $effect(() => {
        if (!selectedJobId) {
            selectedJob = null;
            applications = [];
            return;
        }
        const job = jobs.find((j) => (j.id || j.ID) === selectedJobId);
        selectedJob = job;
        loadApplications(selectedJobId);
    });

    async function loadApplications(jobId) {
        loading = true;
        applications = [];
        try {
            const data = await applicationService.getJobApplications(jobId);
            applications = (Array.isArray(data) ? data : []).filter(isFinishedQuiz);
        } catch (error) {
            showToast("Failed to load applications", "error");
            console.error(error);
        } finally {
            loading = false;
        }
    }

    function getVal(obj, ...keys) {
        for (const key of keys) {
            const val = obj[key];
            if (val != null && val !== "") return val;
        }
        return null;
    }

    function formatDate(dateStr) {
        if (!dateStr) return "—";
        try {
            return new Date(dateStr).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        } catch {
            return "—";
        }
    }

    function statusBadgeClass(status) {
        switch ((status || "").toLowerCase()) {
            case "submitted": return "badge-info";
            case "quiz_started": return "badge-warning";
            case "quiz_completed": return "badge-warning";
            case "under_review": return "badge-info";
            case "shortlisted": return "badge-primary";
            case "interviewed": return "badge-primary";
            case "accepted": return "badge-success";
            case "rejected": return "badge-error";
            case "withdrawn": return "badge-ghost";
            default: return "badge-ghost";
        }
    }

    function isFinishedQuiz(app) {
        return (app?.Status || app?.status || "").toLowerCase() === "quiz_completed";
    }

    async function openApplicationDetail(app) {
        const appId = app.ID || app.id;
        goto(`/admin/applications/${appId}`);
    }
</script>

<div class="space-y-6 max-w-full mx-auto">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 class="text-xl font-semibold text-gray-900 tracking-tight">Applications</h1>
            <p class="text-gray-500 mt-1 text-sm">
                Review and manage job applications.
            </p>
        </div>
    </div>

    <!-- Job dropdown -->
    <div class="bg-white rounded-lg border border-gray-100 p-4">
        <label for="job-select" class="block text-sm font-semibold text-gray-700 mb-2">Select Job</label>
        <select
            id="job-select"
            class="select select-bordered w-full max-w-md bg-gray-50 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
            bind:value={selectedJobId}
        >
            <option value="">— Choose a job —</option>
            {#each jobs as job (job.id || job.ID)}
                <option value={job.id || job.ID}>
                    {job.title || job.Title} ({job.location || job.Location || "Remote"})
                </option>
            {/each}
        </select>
    </div>

    <!-- Applications table -->
    <div class="bg-white rounded-lg border border-gray-100 overflow-hidden">
        {#if !selectedJob}
            <div class="py-20 text-center">
                <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-50 text-gray-300 rounded-full mb-4">
                    <Users size={32} />
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Select a job</h3>
                <p class="text-gray-500 text-sm mt-1">Choose a job from the dropdown above to view its applicants.</p>
            </div>
        {:else if loading}
            <PageLoader message="Loading applications..." />
        {:else if applications.length === 0}
            <EmptyState
                icon={Users}
                title="No finished quizzes yet"
                description={"Only applicants who finished the quiz appear for " + (selectedJob.title || selectedJob.Title) + "."}
            />
        {:else}
            <div class="px-4 py-3 border-b border-gray-100 bg-gray-50/30">
                <h3 class="text-sm font-semibold text-gray-700">
                    {selectedJob.title || selectedJob.Title}
                    <span class="font-normal text-gray-400"> &middot; {applications.length} applicant{applications.length !== 1 ? "s" : ""}</span>
                </h3>
            </div>
            <div class="overflow-x-auto">
                <table class="table">
                    <thead>
                        <tr class="text-gray-500 text-xs uppercase tracking-wider">
                            <th class="font-semibold">Applicant</th>
                            <th class="font-semibold">Status</th>
                            <th class="font-semibold">Submitted</th>
                            <th class="font-semibold">Quiz</th>
                            <th class="font-semibold text-right">Links</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50 text-sm">
                        {#each applications as app (app.ID || app.id)}
                            <tr class="hover:bg-gray-50/50 transition-colors">
                                <td>
                                    <div class="flex items-center gap-3">
                                        <div class="avatar">
                                            <div class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                                {#if getVal(app, "AvatarUrl", "AvatarURL", "avatar_url", "applicant_avatar_url")}
                                                    <img
                                                        src={getVal(app, "AvatarUrl", "AvatarURL", "avatar_url", "applicant_avatar_url")}
                                                        alt=""
                                                        class="w-full h-full object-cover"
                                                    />
                                                {:else}
                                                    <span class="text-xs font-bold text-gray-400">
                                                        {getVal(app, "Name", "name", "ApplicantName", "applicant_name", "GithubUsername", "github_username", "GithubUsername_2")?.charAt(0)?.toUpperCase() || "?"}
                                                    </span>
                                                {/if}
                                            </div>
                                        </div>
                                        <div>
                                            <p class="font-semibold text-gray-900">
                                                {getVal(app, "Name", "name", "ApplicantName", "applicant_name") || getVal(app, "GithubUsername_2", "GithubUsername", "github_username") || "—"}
                                            </p>
                                            <p class="text-xs text-gray-400">
                                                {getVal(app, "Email", "email", "ApplicantEmail", "applicant_email") || "—"}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge {statusBadgeClass(app.Status || app.status)} badge-sm font-medium border-none">
                                        {app.Status || app.status || "unknown"}
                                    </span>
                                </td>
                                <td class="text-gray-500 text-xs">
                                    {formatDate(app.SubmittedAt || app.submitted_at)}
                                </td>
                                <td>
                                    {#if app.QuizScore != null || app.quiz_score != null}
                                        <PassFailBadge score={getVal(app, 'QuizScore', 'quiz_score') || 0} passingThreshold={50} showScore size="sm" />
                                    {:else}
                                        <span class="text-gray-300">—</span>
                                    {/if}
                                </td>
                                <td class="text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        {#if getVal(app, 'QuizID', 'quiz_id')}
                                            <button
                                                onclick={() => goto(`/quizzes/${getVal(app, 'QuizID', 'quiz_id')}/result`)}
                                                class="btn btn-sm btn-ghost text-emerald-600 hover:bg-emerald-50"
                                            >
                                                Result
                                            </button>
                                        {/if}
                                        <button
                                            onclick={() => openApplicationDetail(app)}
                                            class="btn btn-sm btn-ghost text-purple-600 hover:bg-purple-50"
                                        >
                                            Details
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>
