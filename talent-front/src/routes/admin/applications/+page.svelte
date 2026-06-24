<script>
    import { onMount } from "svelte";
    import { applicationService } from "$lib/api/applications.service";
    import { jobService } from "$lib/api/job.service";
    import { Briefcase, User, Mail, Check, X, Search } from "lucide-svelte";
    import { showToast } from "$lib/stores/toast";

    let jobs = [];
    let selectedJobId = "";
    let applications = [];
    let loadingJobs = true;
    let loadingApps = false;

    onMount(async () => {
        await loadJobs();
    });

    async function loadJobs() {
        loadingJobs = true;
        try {
            jobs = await jobService.listMyJobs();
            if (jobs && jobs.length > 0) {
                selectedJobId = jobs[0].id;
                await loadApplications(selectedJobId);
            }
        } catch (error) {
            showToast("Failed to load your jobs", "error");
        } finally {
            loadingJobs = false;
        }
    }

    async function loadApplications(jobId) {
        if (!jobId) return;
        loadingApps = true;
        try {
            applications = await applicationService.getJobApplications(jobId);
            if (!applications) applications = [];
        } catch (error) {
            showToast("Failed to load applications", "error");
        } finally {
            loadingApps = false;
        }
    }

    async function handleJobSelect(event) {
        selectedJobId = event.target.value;
        await loadApplications(selectedJobId);
    }

    async function acceptApplication(appId) {
        try {
            await applicationService.acceptApplication(appId);
            showToast("Application accepted!", "success");
            await loadApplications(selectedJobId); // refresh
        } catch (error) {
            showToast("Failed to accept application", "error");
        }
    }
</script>

<div class="min-h-screen bg-slate-50 p-4 md:p-6 font-sans">
    <div class="max-w-6xl mx-auto">
        <div
            class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
            <div>
                <h1 class="text-xl font-bold text-slate-800">
                    Manage Applications
                </h1>
                <p class="text-xs text-slate-500 mt-1">
                    Review candidates for your job postings.
                </p>
            </div>

            {#if !loadingJobs && jobs.length > 0}
                <select
                    class="select select-bordered select-sm w-full md:w-64 bg-white text-sm"
                    bind:value={selectedJobId}
                    on:change={handleJobSelect}
                >
                    <option value="" disabled>Select a job posting...</option>
                    {#each jobs as job}
                        <option value={job.id}>{job.title}</option>
                    {/each}
                </select>
            {/if}
        </div>

        {#if loadingJobs}
            <div class="flex justify-center p-12">
                <span class="loading loading-spinner text-purple-600"></span>
            </div>
        {:else if jobs.length === 0}
            <div
                class="bg-white rounded-xl p-12 text-center border border-slate-200"
            >
                <Briefcase class="mx-auto text-slate-300 mb-4" size={32} />
                <h3 class="font-bold text-slate-700">No Jobs Posted</h3>
                <p class="text-sm text-slate-500 mt-2">
                    You need to post a job before you can receive applications.
                </p>
            </div>
        {:else}
            <div
                class="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
                <div class="overflow-x-auto">
                    <table class="table w-full text-sm">
                        <thead class="bg-slate-50 text-slate-600">
                            <tr>
                                <th>Candidate</th>
                                <th>Status</th>
                                <th>Quiz Track</th>
                                <th>Applied On</th>
                                <th class="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#if loadingApps}
                                <tr>
                                    <td colspan="5" class="text-center py-8">
                                        <span
                                            class="loading loading-spinner text-purple-600"
                                        ></span>
                                    </td>
                                </tr>
                            {:else if applications.length === 0}
                                <tr>
                                    <td
                                        colspan="5"
                                        class="text-center py-12 text-slate-500"
                                    >
                                        No applications received for this job
                                        yet.
                                    </td>
                                </tr>
                            {:else}
                                {#each applications as app (app.id)}
                                    <tr
                                        class="hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td>
                                            <div
                                                class="flex items-center gap-3"
                                            >
                                                <div
                                                    class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold"
                                                >
                                                    {app.github_username
                                                        ? app.github_username
                                                              .charAt(0)
                                                              .toUpperCase()
                                                        : "U"}
                                                </div>
                                                <div>
                                                    <div
                                                        class="font-bold text-slate-800"
                                                    >
                                                        {app.github_username ||
                                                            "Unknown User"}
                                                    </div>
                                                    {#if app.applicant_email}
                                                        <div
                                                            class="text-xs text-slate-500 flex items-center gap-1 mt-0.5"
                                                        >
                                                            <Mail size={10} />
                                                            {app.applicant_email}
                                                        </div>
                                                    {/if}
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <span
                                                class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md
                                                {app.status === 'accepted'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : app.status === 'rejected'
                                                      ? 'bg-rose-50 text-rose-700'
                                                      : app.status ===
                                                          'submitted'
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'bg-violet-50 text-violet-700'}
                                            "
                                            >
                                                {app.status || "submitted"}
                                            </span>
                                        </td>

                                        <td>
                                            {#if app.quiz_score !== null && app.quiz_score !== undefined}
                                                <span
                                                    class="text-xs font-semibold {app.quiz_passed
                                                        ? 'text-emerald-600'
                                                        : 'text-rose-600'}"
                                                >
                                                    {app.quiz_passed
                                                        ? "✓ Passed"
                                                        : "✕ Failed"} ({app.quiz_score}%)
                                                </span>
                                            {:else}
                                                <span
                                                    class="text-xs text-amber-600 font-medium"
                                                    >⏱ In Progress / Not Taken</span
                                                >
                                            {/if}
                                        </td>

                                        <td class="text-slate-500 text-xs">
                                            {app.created_at
                                                ? new Date(
                                                      app.created_at,
                                                  ).toLocaleDateString()
                                                : "N/A"}
                                        </td>

                                        <td class="text-right">
                                            {#if app.status !== "accepted" && app.status !== "rejected"}
                                                <button
                                                    class="btn btn-xs btn-ghost text-emerald-600 hover:bg-emerald-50"
                                                    on:click={() =>
                                                        acceptApplication(
                                                            app.id,
                                                        )}
                                                >
                                                    <Check
                                                        size={14}
                                                        class="mr-1"
                                                    /> Accept
                                                </button>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            {/if}
                        </tbody>
                    </table>
                </div>
            </div>
        {/if}
    </div>
</div>
