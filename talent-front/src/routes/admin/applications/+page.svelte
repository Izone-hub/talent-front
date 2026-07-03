<script>
    import { jobService } from "$lib/api/job.service";
    import { applicationService } from "$lib/api/application.service";
    import { ExternalLink, Users, Check, X } from "lucide-svelte";
    import { showToast } from "$lib/stores/toast";

    let jobs = $state([]);
    let selectedJobId = $state("");
    let selectedJob = $state(null);
    let applications = $state([]);
    let loading = $state(true);
    let selectedApplication = $state(null);
    let detailModalOpen = $state(false);
    let isProcessing = $state(false);

    $effect(() => {
        loadJobs();
    });

    async function loadJobs() {
        loading = true;
        try {
            jobs = await jobService.listMyJobs();
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
            applications = data;
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

    function openApplicationDetail(app) {
        selectedApplication = app;
        detailModalOpen = true;
    }

    function closeDetailModal() {
        detailModalOpen = false;
        selectedApplication = null;
    }

    async function acceptApplication() {
        if (!selectedApplication) return;
        isProcessing = true;
        try {
            // Mock API call - replace with actual endpoint when backend is ready
            console.log("Accepting application:", selectedApplication.ID || selectedApplication.id);
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
            
            // Update local state
            const appId = selectedApplication.ID || selectedApplication.id;
            const appIndex = applications.findIndex(a => (a.ID || a.id) === appId);
            if (appIndex !== -1) {
                applications[appIndex] = {
                    ...applications[appIndex],
                    Status: "accepted",
                    status: "accepted"
                };
            }
            
            showToast("Application accepted", "success");
            closeDetailModal();
        } catch (error) {
            showToast("Failed to accept application", "error");
            console.error(error);
        } finally {
            isProcessing = false;
        }
    }

    async function rejectApplication() {
        if (!selectedApplication) return;
        isProcessing = true;
        try {
            // Mock API call - replace with actual endpoint when backend is ready
            console.log("Rejecting application:", selectedApplication.ID || selectedApplication.id);
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
            
            // Update local state
            const appId = selectedApplication.ID || selectedApplication.id;
            const appIndex = applications.findIndex(a => (a.ID || a.id) === appId);
            if (appIndex !== -1) {
                applications[appIndex] = {
                    ...applications[appIndex],
                    Status: "rejected",
                    status: "rejected"
                };
            }
            
            showToast("Application rejected", "success");
            closeDetailModal();
        } catch (error) {
            showToast("Failed to reject application", "error");
            console.error(error);
        } finally {
            isProcessing = false;
        }
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
            <div class="flex flex-col items-center justify-center py-20 gap-3">
                <span class="loading loading-spinner loading-lg text-purple-600"></span>
                <span class="text-gray-400 text-sm">Loading applications...</span>
            </div>
        {:else if applications.length === 0}
            <div class="py-16 text-center">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-50 text-gray-300 rounded-full mb-3">
                    <Users size={28} />
                </div>
                <h3 class="text-base font-semibold text-gray-900">No applications yet</h3>
                <p class="text-gray-500 text-sm mt-1">
                    No one has applied to <span class="font-medium text-gray-700">{selectedJob.title || selectedJob.Title}</span> yet.
                </p>
            </div>
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
                                        <span class="badge badge-sm {getVal(app, 'QuizPassed', 'quiz_passed') ? 'badge-success' : 'badge-ghost'} gap-1 font-medium">
                                            {getVal(app, 'QuizScore', 'quiz_score')}/100
                                        </span>
                                    {:else}
                                        <span class="text-gray-300">—</span>
                                    {/if}
                                </td>
                                <td class="text-right">
                                    <button
                                        onclick={() => openApplicationDetail(app)}
                                        class="btn btn-sm btn-ghost text-purple-600 hover:bg-purple-50"
                                    >
                                        Details
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>

<!-- Application Detail Modal -->
{#if detailModalOpen && selectedApplication}
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <!-- Modal Header -->
            <div class="sticky top-0 border-b border-gray-200 bg-white p-6 flex items-start justify-between">
                <div>
                    <h2 class="text-xl font-semibold text-gray-900">
                        {getVal(selectedApplication, "Name", "name", "ApplicantName", "applicant_name") || getVal(selectedApplication, "GithubUsername_2", "GithubUsername", "github_username") || "Applicant"}
                    </h2>
                    <p class="text-sm text-gray-500 mt-1">
                        Applied on {formatDate(selectedApplication.SubmittedAt || selectedApplication.submitted_at)}
                    </p>
                </div>
                <button
                    onclick={closeDetailModal}
                    class="text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isProcessing}
                >
                    <X size={24} />
                </button>
            </div>

            <!-- Modal Content -->
            <div class="p-6 space-y-6">
                <!-- Basic Info -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</div>
                        <p class="text-gray-900 font-medium mt-1">
                            {getVal(selectedApplication, "Email", "email", "ApplicantEmail", "applicant_email") || "—"}
                        </p>
                    </div>
                    <div>
                        <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</div>
                        <p class="mt-1">
                            <span class="badge {statusBadgeClass(selectedApplication.Status || selectedApplication.status)} font-medium border-none">
                                {selectedApplication.Status || selectedApplication.status || "unknown"}
                            </span>
                        </p>
                    </div>
                    {#if getVal(selectedApplication, "PhoneNumber", "phone_number", "PhoneNumber")}
                        <div>
                            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</div>
                            <p class="text-gray-900 font-medium mt-1">
                                {getVal(selectedApplication, "PhoneNumber", "phone_number")}
                            </p>
                        </div>
                    {/if}
                    {#if getVal(selectedApplication, "Location", "location") || getVal(selectedApplication, "GithubUsername", "github_username", "GithubUsername_2")}
                        <div>
                            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide">GitHub</div>
                            <p class="text-gray-900 font-medium mt-1">
                                {getVal(selectedApplication, "GithubUsername", "github_username", "GithubUsername_2") || "—"}
                            </p>
                        </div>
                    {/if}
                </div>

                <!-- Quiz Info -->
                {#if selectedApplication.QuizScore != null || selectedApplication.quiz_score != null}
                    <div class="border-t border-gray-200 pt-6">
                        <h3 class="text-sm font-semibold text-gray-900 mb-3">Quiz Results</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-gray-50 rounded-lg p-4">
                                <p class="text-xs text-gray-500 font-semibold uppercase tracking-wide">Score</p>
                                <p class="text-2xl font-bold text-gray-900 mt-2">
                                    {getVal(selectedApplication, "QuizScore", "quiz_score")}/100
                                </p>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-4">
                                <p class="text-xs text-gray-500 font-semibold uppercase tracking-wide">Status</p>
                                <p class="mt-2">
                                    <span class="badge {getVal(selectedApplication, 'QuizPassed', 'quiz_passed') ? 'badge-success' : 'badge-error'} gap-1 font-medium">
                                        {getVal(selectedApplication, 'QuizPassed', 'quiz_passed') ? 'Passed' : 'Failed'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- Cover Letter / Additional Info -->
                {#if getVal(selectedApplication, "CoverLetter", "cover_letter", "CoverLetterText", "cover_letter_text")}
                    <div class="border-t border-gray-200 pt-6">
                        <h3 class="text-sm font-semibold text-gray-900 mb-3">Cover Letter</h3>
                        <div class="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap break-words">
                            {getVal(selectedApplication, "CoverLetter", "cover_letter", "CoverLetterText", "cover_letter_text")}
                        </div>
                    </div>
                {/if}

                <!-- Links -->
                <div class="border-t border-gray-200 pt-6">
                    <h3 class="text-sm font-semibold text-gray-900 mb-3">Links</h3>
                    <div class="flex gap-3">
                        {#if getVal(selectedApplication, "GithubUsername", "github_username", "GithubUsername_2")}
                            <a
                                href="https://github.com/{getVal(selectedApplication, 'GithubUsername', 'github_username', 'GithubUsername_2')}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="btn btn-sm btn-outline gap-2"
                            >
                                <ExternalLink size={16} />
                                GitHub Profile
                            </a>
                        {/if}
                        {#if getVal(selectedApplication, "PortfolioUrl", "portfolio_url", "PortfolioURL", "portfolioUrl")}
                            <a
                                href={getVal(selectedApplication, "PortfolioUrl", "portfolio_url", "PortfolioURL", "portfolioUrl")}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="btn btn-sm btn-outline gap-2"
                            >
                                <ExternalLink size={16} />
                                Portfolio
                            </a>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Modal Footer with Action Buttons -->
            <div class="border-t border-gray-200 bg-gray-50 p-6 flex justify-end gap-3 sticky bottom-0">
                <button
                    onclick={closeDetailModal}
                    class="btn btn-ghost"
                    disabled={isProcessing}
                >
                    Cancel
                </button>
                <button
                    onclick={rejectApplication}
                    class="btn btn-error gap-2"
                    disabled={isProcessing || (selectedApplication.Status || selectedApplication.status) === 'rejected'}
                >
                    {#if isProcessing}
                        <span class="loading loading-spinner loading-sm"></span>
                    {:else}
                        <X size={18} />
                    {/if}
                    Reject
                </button>
                <button
                    onclick={acceptApplication}
                    class="btn btn-success gap-2"
                    disabled={isProcessing || (selectedApplication.Status || selectedApplication.status) === 'accepted'}
                >
                    {#if isProcessing}
                        <span class="loading loading-spinner loading-sm"></span>
                    {:else}
                        <Check size={18} />
                    {/if}
                    Accept
                </button>
            </div>
        </div>
    </div>
{/if}