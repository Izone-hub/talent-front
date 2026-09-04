<script>
    import { auth } from "$lib/stores/authStore";
    import { dashboardService } from "$lib/api/dashboard.service";
    import { formatRelativeTime } from "$lib/utils/dateFormatter";
    import { onMount } from "svelte";
    import {
        Users,
        Briefcase,
        FileText,
        Clock,
        TrendingUp,
        Inbox,
        RefreshCw,
        BarChart3,
        Activity,
    } from "lucide-svelte";
    import AdminPageHeader from "$lib/components/ui/AdminPageHeader.svelte";
    import AdminDashboardSkeleton from "$lib/components/ui/skeletons/AdminDashboardSkeleton.svelte";

    let dashboard = $state(null);
    let loading = $state(true);

    // Recent activity pagination
    let activity = $state([]);
    let activityPagination = $state(null);
    let activityLoading = $state(false);
    let initialActivityLength = $state(0);
    let initialPagination = $state(null);

    const stats = $derived(() => dashboard?.stats || null);

    const statCards = $derived(() => {
        const s = stats();
        if (!s) return [];
        return [
            {
                label: "Total Users",
                value: s.total_users,
                icon: Users,
                color: "#6366f1",
                subtitle: `${s.new_users_today || 0} new today`,
                subtitleColor: "text-emerald-600",
            },
            {
                label: "Active Jobs",
                value: s.active_jobs,
                icon: Briefcase,
                color: "#8b5cf6",
                subtitle: null,
                subtitleColor: null,
            },
            {
                label: "Pending Applications",
                value: s.pending_applications,
                icon: Clock,
                color: "#f59e0b",
                subtitle: `${s.new_applications_today || 0} today`,
                subtitleColor: "text-blue-600",
            },
            {
                label: "Total Applications",
                value: s.total_applications,
                icon: FileText,
                color: "#10b981",
                subtitle: null,
                subtitleColor: null,
            },
        ];
    });

    function statusInfo(status) {
        const map = {
            draft: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
            submitted: { label: "Submitted", cls: "bg-blue-50 text-blue-600" },
            quiz_started: { label: "Quiz Started", cls: "bg-indigo-50 text-indigo-600" },
            quiz_completed: { label: "Quiz Done", cls: "bg-purple-50 text-purple-600" },
            under_review: { label: "Review", cls: "bg-amber-50 text-amber-600" },
            shortlisted: { label: "Shortlisted", cls: "bg-cyan-50 text-cyan-600" },
            interviewed: { label: "Interviewed", cls: "bg-teal-50 text-teal-600" },
            accepted: { label: "Accepted", cls: "bg-emerald-50 text-emerald-600" },
            rejected: { label: "Rejected", cls: "bg-red-50 text-red-600" },
            withdrawn: { label: "Withdrawn", cls: "bg-slate-100 text-slate-500" },
        };
        return map[status] || { label: status || "Unknown", cls: "bg-gray-100 text-gray-600" };
    }

    function initials(username) {
        if (!username) return "U";
        return username.slice(0, 2).toUpperCase();
    }

    function getRandomColor(seed) {
        const colors = ["#6366f1", "#8b5cf6", "#a855f7", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
        return colors[seed ? seed.length % colors.length : 0];
    }

    async function loadDashboard() {
        loading = true;
        try {
            dashboard = await dashboardService.getDashboard();
            // Set initial activity from dashboard response
            activity = dashboard.recent_activity || [];
            activityPagination = dashboard.recent_activity_pagination || null;
            initialActivityLength = activity.length;
            initialPagination = dashboard.recent_activity_pagination || null;
        } catch (e) {
            console.error("Failed to load dashboard", e);
        } finally {
            loading = false;
        }
    }

    async function showMore() {
        if (!activityPagination || activityLoading) return;
        activityLoading = true;
        try {
            const nextOffset = activityPagination.offset + activityPagination.limit;
            const data = await dashboardService.getRecentActivityPage(activityPagination.limit, nextOffset);
            // Append new items to existing list
            activity = [...activity, ...(data.items || [])];
            activityPagination = data.pagination || null;
        } catch (e) {
            console.error("Failed to load more activity", e);
        } finally {
            activityLoading = false;
        }
    }

    function showLess() {
        if (activityLoading || activity.length <= initialActivityLength) return;
        activity = activity.slice(0, initialActivityLength);
        activityPagination = initialPagination ? { ...initialPagination } : null;
    }

    onMount(() => {
        loadDashboard();
    });
</script>

<div class="space-y-6 max-w-full mx-auto">
    <!-- ============================================================ -->
    <!-- STABLE HEADER                                                  -->
    <!-- ============================================================ -->
    <AdminPageHeader
        title="Dashboard"
        subtitle={loading ? null : `Welcome back, ${$auth.user?.name || "Admin"}!`}
    >
        <button
            class="btn btn-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 gap-2 rounded-xl"
            onclick={loadDashboard}
        >
            <RefreshCw size={14} />
            Refresh
        </button>
    </AdminPageHeader>

    {#if loading}
        <AdminDashboardSkeleton />
    {:else}
    <!-- ============================================================ -->
    <!-- STATISTICS CARDS                                               -->
    <!-- ============================================================ -->
    {#if stats()}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {#each Array(4) as _, i}
                {@const card = statCards()[i]}
                <div class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all min-h-[88px]">
                    <div class="flex items-center gap-3">
                        <div
                            class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                            style="background-color: {card.color}"
                        >
                            <card.icon size={18} />
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-[11px] text-gray-400 font-medium">{card.label}</p>
                            <p class="text-xl font-bold text-gray-900">{card.value}</p>
                        </div>
                    </div>
                    {#if card.subtitle}
                        <p class="text-xs {card.subtitleColor} mt-2">{card.subtitle}</p>
                    {:else}
                        <div class="mt-2 h-4"></div>
                    {/if}
                </div>
            {/each}
        </div>
    {:else}
        <div class="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p class="text-sm text-gray-500">
                Couldn't load dashboard stats right now — check your connection and try the Refresh button.
            </p>
        </div>
    {/if}

    <!-- ============================================================ -->
    <!-- ANALYTICS GRAPHS                                               -->
    <!-- ============================================================ -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <!-- Applications Trend -->
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div class="flex items-center gap-2">
                    <Activity size={14} class="text-gray-400" />
                    <h3 class="text-sm font-semibold text-gray-900">Applications Trend</h3>
                </div>
                <span class="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Coming Soon</span>
            </div>
            <div class="p-4 min-h-[180px] flex flex-col items-center justify-center">
                <svg class="w-full h-32" viewBox="0 0 400 120" fill="none">
                    <path d="M0 100 Q50 80 100 85 T200 60 T300 40 T400 50" stroke="#e5e7eb" stroke-width="2" fill="none" stroke-dasharray="4 4" />
                    <path d="M0 90 Q50 70 100 75 T200 50 T300 30 T400 40" stroke="#c4b5fd" stroke-width="2" fill="none" opacity="0.5" />
                </svg>
                <p class="text-xs text-gray-400 mt-3 text-center">Analytics data will appear here when historical data is available.</p>
            </div>
        </div>

        <!-- Users Trend -->
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div class="flex items-center gap-2">
                    <TrendingUp size={14} class="text-gray-400" />
                    <h3 class="text-sm font-semibold text-gray-900">Users Trend</h3>
                </div>
                <span class="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Coming Soon</span>
            </div>
            <div class="p-4 min-h-[180px] flex flex-col items-center justify-center">
                <svg class="w-full h-32" viewBox="0 0 400 120" fill="none">
                    <path d="M0 110 Q60 90 120 95 T240 70 T360 55 T400 60" stroke="#e5e7eb" stroke-width="2" fill="none" stroke-dasharray="4 4" />
                    <path d="M0 100 Q60 80 120 85 T240 60 T360 45 T400 50" stroke="#a5b4fc" stroke-width="2" fill="none" opacity="0.5" />
                </svg>
                <p class="text-xs text-gray-400 mt-3 text-center">Analytics data will appear here when historical data is available.</p>
            </div>
        </div>

        <!-- Application Status Distribution -->
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden lg:col-span-2">
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div class="flex items-center gap-2">
                    <BarChart3 size={14} class="text-gray-400" />
                    <h3 class="text-sm font-semibold text-gray-900">Application Status Distribution</h3>
                </div>
                <span class="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Coming Soon</span>
            </div>
            <div class="p-4 min-h-[140px] flex flex-col items-center justify-center">
                <div class="flex items-end gap-3 w-full max-w-md justify-center">
                    {#each ["Submitted", "Review", "Shortlisted", "Rejected", "Accepted"] as label, i}
                        {@const heights = [60, 40, 25, 35, 20]}
                        {@const colors = ["#3b82f6", "#f59e0b", "#06b6d4", "#ef4444", "#10b981"]}
                        <div class="flex flex-col items-center gap-1.5 flex-1">
                            <div
                                class="w-full rounded-t-md"
                                style="height: {heights[i]}px; background-color: {colors[i]}; opacity: 0.2;"
                            ></div>
                            <span class="text-[9px] text-gray-400 font-medium text-center">{label}</span>
                        </div>
                    {/each}
                </div>
                <p class="text-xs text-gray-400 mt-3 text-center">Analytics data will appear here when historical data is available.</p>
            </div>
        </div>
    </div>

    <!-- ============================================================ -->
    <!-- RECENT ACTIVITY                                                -->
    <!-- ============================================================ -->
    <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 class="text-sm font-semibold text-gray-900">Recent Activity</h3>
            {#if activity.length > 0}
                <span class="text-[11px] text-gray-400 font-medium">
                    {activityPagination?.total || activity.length} total
                </span>
            {/if}
        </div>

        <div class="divide-y divide-gray-50">
            {#if activity.length === 0}
                <div class="px-4 py-12 text-center">
                    <Inbox size={32} class="mx-auto mb-2 text-gray-300" />
                    <p class="text-sm text-gray-400">No recent activity yet</p>
                </div>
            {:else}
                {#each activity as item}
                    {@const cfg = statusInfo(item.status)}
                    <div class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                        {#if item.avatar_url}
                            <img
                                src={item.avatar_url}
                                alt={item.github_username}
                                class="w-9 h-9 rounded-full object-cover shrink-0"
                            />
                        {:else}
                            <div
                                class="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0"
                                style="background: {getRandomColor(item.github_username)}"
                            >
                                {initials(item.github_username)}
                            </div>
                        {/if}
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 truncate">
                                {item.github_username}
                            </p>
                            <p class="text-xs text-gray-400 truncate">
                                {item.job_title ? `Applied to ${item.job_title}` : "Submitted application"}
                            </p>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full {cfg.cls}">
                                {cfg.label}
                            </span>
                            <span class="text-[11px] text-gray-400 whitespace-nowrap">
                                {formatRelativeTime(item.submitted_at)}
                            </span>
                        </div>
                    </div>
                {/each}

                <!-- Show More / Show Less Buttons -->
                {#if activity.length > initialActivityLength || activityPagination?.has_more}
                    <div class="px-4 py-3 text-center flex items-center justify-center gap-2">
                        {#if activityPagination?.has_more}
                            <button
                                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:text-purple-700 hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                                onclick={showMore}
                                disabled={activityLoading}
                            >
                                {#if activityLoading}
                                    <span class="loading loading-spinner loading-xs"></span>
                                    Loading...
                                {:else}
                                    Show More
                                {/if}
                            </button>
                        {/if}
                        {#if activity.length > initialActivityLength}
                            <button
                                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:text-purple-700 hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                                onclick={showLess}
                                disabled={activityLoading}
                            >
                                Show Less
                            </button>
                        {/if}
                    </div>
                {/if}
            {/if}
        </div>
    </div>
    {/if}
</div>
