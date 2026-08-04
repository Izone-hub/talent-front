<script>
    import { auth } from "$lib/stores/authStore";
    import { dashboardService } from "$lib/api/dashboard.service";
    import { formatRelativeTime } from "$lib/utils/dateFormatter";
    import { onMount } from "svelte";

    let stats = $state({
        total_users: 0,
        active_jobs: 0,
        pending_applications: 0,
        total_applications: 0,
        new_users_today: 0,
        new_applications_today: 0,
    });
    let loading = $state(true);
    let activity = $state([]);
    let activityLoading = $state(true);
    let activityError = $state("");
    let page = $state(1);
    let totalPages = $state(0);

    async function loadActivity(p) {
        page = p;
        activityLoading = true;
        activityError = "";
        try {
            const data = await dashboardService.getRecentActivity(10, p);
            // The backend returns a BARE ARRAY (original design). Accept both
            // that and the paginated { items, total_pages } shape so the list
            // renders regardless of which backend variant is running.
            const items = Array.isArray(data) ? data : data?.items;
            if (Array.isArray(items)) {
                activity = items;
                totalPages = data?.total_pages || 0;
            }
        } catch (e) {
            activityError = e.message || "Failed to load recent activity";
        } finally {
            activityLoading = false;
        }
    }

    function pageItems() {
        const total = totalPages;
        const current = page;
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        const pages = new Set([
            1,
            2,
            total - 1,
            total,
            current - 1,
            current,
            current + 1,
        ]);
        const sorted = [...pages]
            .filter((p) => p >= 1 && p <= total)
            .sort((a, b) => a - b);
        const out = [];
        let prev = 0;
        for (const p of sorted) {
            if (p - prev > 1) out.push("...");
            out.push(p);
            prev = p;
        }
        return out;
    }

    onMount(async () => {
        try {
            const data = await dashboardService.getDashboard();
            if (data) stats = data;
        } catch (e) {
            console.error("Failed to load dashboard stats", e);
        } finally {
            loading = false;
        }

        await loadActivity(1);
    });

    function initials(username) {
        if (!username) return "U";
        return username.slice(0, 2).toUpperCase();
    }

    function statusInfo(status) {
        const map = {
            draft: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
            submitted: { label: "Submitted", cls: "bg-blue-50 text-blue-600" },
            quiz_started: { label: "Quiz Started", cls: "bg-indigo-50 text-indigo-600" },
            quiz_completed: { label: "Quiz Completed", cls: "bg-purple-50 text-purple-600" },
            under_review: { label: "Under Review", cls: "bg-amber-50 text-amber-600" },
            shortlisted: { label: "Shortlisted", cls: "bg-cyan-50 text-cyan-600" },
            interviewed: { label: "Interviewed", cls: "bg-teal-50 text-teal-600" },
            accepted: { label: "Accepted", cls: "bg-emerald-50 text-emerald-600" },
            rejected: { label: "Rejected", cls: "bg-red-50 text-red-600" },
            withdrawn: { label: "Withdrawn", cls: "bg-slate-100 text-slate-500" },
        };
        return map[status] || { label: status || "Unknown", cls: "bg-gray-100 text-gray-600" };
    }
</script>

<div class="space-y-6">
    <header>
        <h1 class="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p class="text-gray-500">
            Welcome back, {$auth.user?.name || "Admin"}!
        </p>
    </header>

    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div class="text-sm font-medium text-gray-500">Total Users</div>
            <div class="mt-2 text-3xl font-bold text-gray-900">
                {loading ? "..." : stats.total_users}
            </div>
            <div class="mt-2 text-xs text-green-600">
                {stats.new_users_today || 0} new today
            </div>
        </div>

        <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div class="text-sm font-medium text-gray-500">Active Jobs</div>
            <div class="mt-2 text-3xl font-bold text-gray-900">
                {loading ? "..." : stats.active_jobs}
            </div>
        </div>

        <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div class="text-sm font-medium text-gray-500">
                New Applications
            </div>
            <div class="mt-2 text-3xl font-bold text-gray-900">
                {loading ? "..." : stats.pending_applications}
            </div>
            <div class="mt-2 text-xs text-blue-600">
                {stats.new_applications_today || 0} today
            </div>
        </div>

        <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div class="text-sm font-medium text-gray-500">
                Total Applications
            </div>
            <div class="mt-2 text-3xl font-bold text-gray-900">
                {loading ? "..." : stats.total_applications}
            </div>
        </div>
    </div>

    <!-- Recent Activity -->
    <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Recent Activity</h2>
            {#if activity.length > 0}
                <span class="text-xs text-gray-400">Latest applications</span>
            {/if}
        </div>

        <div class="mt-4 space-y-4">
            {#if activityLoading}
                <div class="space-y-4">
                    {#each [1, 2, 3] as i}
                        <div class="flex animate-pulse items-center gap-3">
                            <div class="h-10 w-10 rounded-full bg-gray-100"></div>
                            <div class="flex-1 space-y-2">
                                <div class="h-3 w-1/3 rounded bg-gray-100"></div>
                                <div class="h-2.5 w-1/2 rounded bg-gray-50"></div>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else if activityError}
                <div class="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                    {activityError}
                </div>
            {:else if activity.length === 0}
                <div class="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
                    No recent activity yet. Applications will show up here as they come in.
                </div>
            {:else}
                {#each activity as item}
                    <div
                        class="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0"
                    >
                        <div class="flex min-w-0 items-center gap-3">
                            {#if item.avatar_url}
                                <img
                                    src={item.avatar_url}
                                    alt={item.github_username}
                                    class="h-10 w-10 rounded-full object-cover"
                                />
                            {:else}
                                <div
                                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 font-bold text-purple-600"
                                >
                                    {initials(item.github_username)}
                                </div>
                            {/if}
                            <div class="min-w-0">
                                <div class="truncate text-sm font-medium text-gray-900">
                                    {item.github_username}
                                </div>
                                <div class="truncate text-xs text-gray-500">
                                    Applied to {item.job_title || "a job"}
                                </div>
                            </div>
                        </div>
                        <div class="flex shrink-0 flex-col items-end gap-1">
                            <span
                                class="rounded-full px-2.5 py-0.5 text-xs font-semibold {statusInfo(item.status).cls}"
                            >
                                {statusInfo(item.status).label}
                            </span>
                            <span class="text-xs text-gray-400">
                                {formatRelativeTime(item.submitted_at)}
                            </span>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>

        {#if totalPages > 1}
            <div class="mt-5 flex justify-center">
                <div class="join">
                    <button
                        class="join-item btn btn-sm"
                        disabled={page <= 1 || activityLoading}
                        onclick={() => loadActivity(page - 1)}
                    >
                        «
                    </button>
                    {#each pageItems() as item}
                        {#if item === "..."}
                            <button class="join-item btn btn-sm btn-disabled">
                                …
                            </button>
                        {:else}
                            <button
                                class="join-item btn btn-sm {page === item
                                    ? "btn-active"
                                    : ""}"
                                disabled={activityLoading}
                                onclick={() => loadActivity(item)}
                            >
                                {item}
                            </button>
                        {/if}
                    {/each}
                    <button
                        class="join-item btn btn-sm"
                        disabled={page >= totalPages || activityLoading}
                        onclick={() => loadActivity(page + 1)}
                    >
                        »
                    </button>
                </div>
            </div>
        {/if}
    </div>
</div>
