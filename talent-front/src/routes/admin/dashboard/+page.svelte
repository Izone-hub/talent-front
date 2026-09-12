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

    // Chart controls and analytics
    let appChartMode = $state("daily"); // "daily" or "cumulative"
    let userChartMode = $state("growth"); // "growth" or "new"
    let hoveredAppIndex = $state(null);
    let hoveredUserIndex = $state(null);

    const stats = $derived(() => dashboard?.stats || null);
    const appTrend = $derived(() => dashboard?.applications_trend || []);
    const userTrend = $derived(() => dashboard?.users_trend || []);
    const statusDist = $derived(() => dashboard?.status_distribution || []);

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
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Applications Trend -->
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
            <div class="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <div class="flex items-center gap-2.5">
                    <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Activity size={15} />
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-gray-900">Applications Trend</h3>
                        <p class="text-[11px] text-gray-400">Activity across the last 30 days</p>
                    </div>
                </div>
                <div class="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5 text-xs font-medium text-gray-500">
                    <button
                        type="button"
                        onclick={() => appChartMode = 'daily'}
                        class="rounded-md px-2.5 py-1 transition-all {appChartMode === 'daily' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'hover:text-gray-900'}"
                    >
                        Daily
                    </button>
                    <button
                        type="button"
                        onclick={() => appChartMode = 'cumulative'}
                        class="rounded-md px-2.5 py-1 transition-all {appChartMode === 'cumulative' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'hover:text-gray-900'}"
                    >
                        Cumulative
                    </button>
                </div>
            </div>

            <div class="p-5">
                {#if appTrend().length > 0}
                    {@const trend = appTrend()}
                    {@const maxCount = Math.max(...trend.map(t => appChartMode === 'daily' ? t.count : t.total), 4)}
                    {@const points = trend.map((p, i) => ({
                        x: 35 + (i / (trend.length - 1 || 1)) * 435,
                        y: 125 - ((appChartMode === 'daily' ? p.count : p.total) / maxCount) * 105,
                        data: p,
                        val: appChartMode === 'daily' ? p.count : p.total
                    }))}
                    {@const lineD = points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '')}
                    {@const areaD = `${lineD} L ${points[points.length - 1].x} 125 L ${points[0].x} 125 Z`}

                    <div class="relative">
                        <svg class="w-full h-44 overflow-visible" viewBox="0 0 490 145">
                            <defs>
                                <linearGradient id="appGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35" />
                                    <stop offset="100%" stop-color="#6366f1" stop-opacity="0.0" />
                                </linearGradient>
                            </defs>

                            <!-- Horizontal Grid Lines -->
                            <line x1="35" y1="20" x2="470" y2="20" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="3 3" />
                            <text x="25" y="24" fill="#94a3b8" font-size="9" text-anchor="end">{maxCount}</text>

                            <line x1="35" y1="72" x2="470" y2="72" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="3 3" />
                            <text x="25" y="76" fill="#94a3b8" font-size="9" text-anchor="end">{Math.round(maxCount / 2)}</text>

                            <line x1="35" y1="125" x2="470" y2="125" stroke="#e2e8f0" stroke-width="1" />
                            <text x="25" y="128" fill="#94a3b8" font-size="9" text-anchor="end">0</text>

                            <!-- Area fill -->
                            <path d={areaD} fill="url(#appGradient)" />

                            <!-- Line stroke -->
                            <path d={lineD} fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

                            <!-- Interactive Points -->
                            {#each points as pt, idx}
                                {#if pt.val > 0 || idx === hoveredAppIndex}
                                    <circle
                                        cx={pt.x}
                                        cy={pt.y}
                                        r={idx === hoveredAppIndex ? 6 : 4}
                                        fill="#ffffff"
                                        stroke="#6366f1"
                                        stroke-width="2.5"
                                        class="cursor-pointer transition-all"
                                        onmouseenter={() => hoveredAppIndex = idx}
                                        onmouseleave={() => hoveredAppIndex = null}
                                    />
                                {/if}
                            {/each}

                            <!-- X Axis Labels -->
                            {#each points as pt, idx}
                                {#if idx === 0 || idx === points.length - 1 || idx % 7 === 0}
                                    <text x={pt.x} y="140" fill="#94a3b8" font-size="9" text-anchor="middle">{pt.data.label}</text>
                                {/if}
                            {/each}
                        </svg>

                        <!-- Hover Tooltip -->
                        {#if hoveredAppIndex !== null && points[hoveredAppIndex]}
                            {@const activePt = points[hoveredAppIndex]}
                            <div
                                class="absolute pointer-events-none rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg transition-all"
                                style="left: {Math.min(Math.max((activePt.x / 490) * 100, 12), 88)}%; top: {Math.max((activePt.y / 145) * 100 - 30, 5)}%; transform: translate(-50%, -100%);"
                            >
                                <p class="font-semibold">{activePt.data.label}</p>
                                <p class="text-[11px] text-gray-300">
                                    {appChartMode === 'daily' ? `${activePt.data.count} applications` : `${activePt.data.total} total applications`}
                                </p>
                            </div>
                        {/if}
                    </div>

                    <div class="mt-3 flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <span>Total in period: <strong class="text-gray-900">{trend[trend.length - 1]?.total || 0}</strong> applications</span>
                        <span class="text-indigo-600 font-medium">{trend.filter(t => t.count > 0).length} active submission days</span>
                    </div>
                {:else}
                    <div class="py-12 text-center text-xs text-gray-400">No application data available yet.</div>
                {/if}
            </div>
        </div>

        <!-- Users Trend -->
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
            <div class="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <div class="flex items-center gap-2.5">
                    <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <TrendingUp size={15} />
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-gray-900">Users Growth</h3>
                        <p class="text-[11px] text-gray-400">Candidate registration trajectory</p>
                    </div>
                </div>
                <div class="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5 text-xs font-medium text-gray-500">
                    <button
                        type="button"
                        onclick={() => userChartMode = 'growth'}
                        class="rounded-md px-2.5 py-1 transition-all {userChartMode === 'growth' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'hover:text-gray-900'}"
                    >
                        Total Users
                    </button>
                    <button
                        type="button"
                        onclick={() => userChartMode = 'new'}
                        class="rounded-md px-2.5 py-1 transition-all {userChartMode === 'new' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'hover:text-gray-900'}"
                    >
                        New Monthly
                    </button>
                </div>
            </div>

            <div class="p-5">
                {#if userTrend().length > 0}
                    {@const trend = userTrend()}
                    {@const maxCount = Math.max(...trend.map(t => userChartMode === 'growth' ? t.total : t.count), 4)}
                    {@const points = trend.map((p, i) => ({
                        x: 35 + (i / (trend.length - 1 || 1)) * 435,
                        y: 125 - ((userChartMode === 'growth' ? p.total : p.count) / maxCount) * 105,
                        data: p,
                        val: userChartMode === 'growth' ? p.total : p.count
                    }))}
                    {@const lineD = points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '')}
                    {@const areaD = `${lineD} L ${points[points.length - 1].x} 125 L ${points[0].x} 125 Z`}

                    <div class="relative">
                        <svg class="w-full h-44 overflow-visible" viewBox="0 0 490 145">
                            <defs>
                                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="#10b981" stop-opacity="0.35" />
                                    <stop offset="100%" stop-color="#10b981" stop-opacity="0.0" />
                                </linearGradient>
                            </defs>

                            <!-- Horizontal Grid Lines -->
                            <line x1="35" y1="20" x2="470" y2="20" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="3 3" />
                            <text x="25" y="24" fill="#94a3b8" font-size="9" text-anchor="end">{maxCount}</text>

                            <line x1="35" y1="72" x2="470" y2="72" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="3 3" />
                            <text x="25" y="76" fill="#94a3b8" font-size="9" text-anchor="end">{Math.round(maxCount / 2)}</text>

                            <line x1="35" y1="125" x2="470" y2="125" stroke="#e2e8f0" stroke-width="1" />
                            <text x="25" y="128" fill="#94a3b8" font-size="9" text-anchor="end">0</text>

                            <!-- Area fill -->
                            <path d={areaD} fill="url(#userGradient)" />

                            <!-- Line stroke -->
                            <path d={lineD} fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

                            <!-- Interactive Points -->
                            {#each points as pt, idx}
                                <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={idx === hoveredUserIndex ? 6 : 4}
                                    fill="#ffffff"
                                    stroke="#10b981"
                                    stroke-width="2.5"
                                    class="cursor-pointer transition-all"
                                    onmouseenter={() => hoveredUserIndex = idx}
                                    onmouseleave={() => hoveredUserIndex = null}
                                />
                            {/each}

                            <!-- X Axis Labels -->
                            {#each points as pt}
                                <text x={pt.x} y="140" fill="#94a3b8" font-size="9" text-anchor="middle">{pt.data.label.slice(0, 3)}</text>
                            {/each}
                        </svg>

                        <!-- Hover Tooltip -->
                        {#if hoveredUserIndex !== null && points[hoveredUserIndex]}
                            {@const activePt = points[hoveredUserIndex]}
                            <div
                                class="absolute pointer-events-none rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg transition-all"
                                style="left: {Math.min(Math.max((activePt.x / 490) * 100, 12), 88)}%; top: {Math.max((activePt.y / 145) * 100 - 30, 5)}%; transform: translate(-50%, -100%);"
                            >
                                <p class="font-semibold">{activePt.data.label}</p>
                                <p class="text-[11px] text-gray-300">
                                    {userChartMode === 'growth' ? `${activePt.data.total} total registered users` : `${activePt.data.count} new registrations`}
                                </p>
                            </div>
                        {/if}
                    </div>

                    <div class="mt-3 flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <span>Total registered: <strong class="text-gray-900">{trend[trend.length - 1]?.total || 0}</strong> users</span>
                        <span class="text-emerald-600 font-medium">Historical trajectory</span>
                    </div>
                {:else}
                    <div class="py-12 text-center text-xs text-gray-400">No user growth data available yet.</div>
                {/if}
            </div>
        </div>

        <!-- Application Status Distribution -->
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs lg:col-span-2">
            <div class="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <div class="flex items-center gap-2.5">
                    <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                        <BarChart3 size={15} />
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-gray-900">Application Status Distribution</h3>
                        <p class="text-[11px] text-gray-400">Breakdown of all {stats()?.total_applications || 0} candidate applications</p>
                    </div>
                </div>
                <span class="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    {stats()?.total_applications || 0} Total
                </span>
            </div>

            <div class="p-6">
                {#if statusDist().length > 0}
                    {@const dist = statusDist()}
                    {@const maxCount = Math.max(...dist.map(d => d.count), 1)}

                    <!-- Multi-segment Progress Bar -->
                    <div class="mb-6">
                        <div class="h-3.5 w-full rounded-full bg-gray-100 flex overflow-hidden p-0.5">
                            {#each dist as item}
                                <div
                                    class="h-full rounded-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                                    style="width: {item.percentage}%; background-color: {item.color};"
                                    title="{item.label}: {item.count} ({item.percentage}%)"
                                ></div>
                            {/each}
                        </div>
                    </div>

                    <!-- Column Bars Representation -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {#each dist as item}
                            <div class="flex flex-col items-center rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-all hover:bg-gray-50 hover:shadow-2xs">
                                <div class="w-full flex items-end justify-center h-28 mb-3">
                                    <div
                                        class="w-12 rounded-t-lg transition-all duration-700 hover:brightness-105"
                                        style="height: {Math.max((item.count / maxCount) * 100, 12)}px; background-color: {item.color};"
                                    ></div>
                                </div>
                                <span class="text-lg font-bold text-gray-900">{item.count}</span>
                                <span class="text-xs font-medium text-gray-600 text-center mt-0.5">{item.label}</span>
                                <span class="mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold" style="background-color: {item.color}15; color: {item.color};">
                                    {item.percentage}%
                                </span>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="py-8 text-center text-xs text-gray-400">No application status data available yet.</div>
                {/if}
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
