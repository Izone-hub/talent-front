<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { savedJobService } from "$lib/api/savedJob.service";
    import { Briefcase, MapPin, Bookmark, ExternalLink } from "@lucide/svelte";

    let savedJobs = $state([]);
    let loading = $state(true);
    let error = $state("");

    onMount(async () => {
        try {
            savedJobs = await savedJobService.listSavedJobs();
        } catch (e) {
            error = "Failed to load saved jobs";
        } finally {
            loading = false;
        }
    });

    async function handleUnsave(jobId, e) {
        e.stopPropagation();
        try {
            await savedJobService.unsaveJob(jobId);
            savedJobs = savedJobs.filter((j) => j.JobID !== jobId);
        } catch {
            // ignore
        }
    }
</script>

<div class="space-y-4">
    {#if loading}
        <div class="py-20 text-center text-slate-500">
            <span class="loading loading-spinner loading-md text-indigo-600"></span>
            <p class="mt-2">Loading saved jobs...</p>
        </div>
    {:else if error}
        <div class="py-20 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <p>{error}</p>
        </div>
    {:else if savedJobs.length === 0}
        <div class="py-20 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Bookmark class="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 class="text-lg font-semibold text-slate-800">No saved jobs</h3>
            <p class="mt-1">Browse jobs and bookmark the ones you like.</p>
            <button
                onclick={() => goto("/jobs")}
                class="btn btn-sm mt-4 border-indigo-600/90 bg-indigo-600 text-white hover:bg-indigo-700"
            >
                Browse Jobs
            </button>
        </div>
    {:else}
        <div class="grid gap-4 sm:grid-cols-2">
            {#each savedJobs as job}
                <div
                    onclick={() => goto(`/jobs/${job.JobID}`)}
                    class="group cursor-pointer rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-md"
                >
                    <div class="flex items-start justify-between">
                        <div class="min-w-0 flex-1">
                            <h4 class="truncate text-base font-semibold text-slate-800">
                                {job.Title}
                            </h4>
                            <p class="text-sm font-medium text-indigo-600/80">
                                {job.Company}
                            </p>
                        </div>
                        <button
                            onclick={(e) => handleUnsave(job.JobID, e)}
                            class="btn btn-ghost btn-xs text-slate-400 hover:text-rose-500"
                            title="Remove"
                        >
                            <Bookmark class="h-4 w-4 fill-current" />
                        </button>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        {#if job.Location}
                            <span class="flex items-center gap-1">
                                <MapPin class="h-3 w-3" />
                                {job.Location}
                            </span>
                        {/if}
                        {#if job.JobType}
                            <span class="rounded-full bg-slate-100 px-2 py-0.5">
                                {job.JobType}
                            </span>
                        {/if}
                        {#if job.SalaryMin != null}
                            <span class="font-medium text-emerald-600">
                                {job.SalaryCurrency || ""}
                                {job.SalaryMin?.toLocaleString()}
                                {#if job.SalaryMax != null}
                                    - {job.SalaryMax?.toLocaleString()}
                                {/if}
                            </span>
                        {/if}
                    </div>
                    <div class="mt-3 flex items-center justify-between text-xs">
                        <span class="text-slate-400">
                            Saved {new Date(job.SavedAt).toLocaleDateString()}
                        </span>
                        <span class="flex items-center gap-1 text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
                            View <ExternalLink class="h-3 w-3" />
                        </span>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>
