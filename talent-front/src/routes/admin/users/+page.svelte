<script>
    import { goto } from '$app/navigation';
    import { usersService } from '$lib/api/users.service';
    import { showToast } from '$lib/stores/toast';
    import AdminPageHeader from '$lib/components/ui/AdminPageHeader.svelte';
    import EmptyState from '$lib/components/ui/EmptyState.svelte';
    import { getCategoryConfig } from '$lib/utils/jobCategories';
    import {
        RefreshCw,
        Users,
        Inbox,
        ChevronLeft,
        ChevronRight,
        GitBranch,
        ArrowRight,
        X,
        Wand2,
    } from 'lucide-svelte';

    const PAGE_SIZE = 50;

    let users = $state([]);
    let total = $state(0);
    let categoryCounts = $state([]);
    let selectedCategory = $state('');
    let loading = $state(true);
    let loadingCounts = $state(true);
    let reindexing = $state(false);
    let currentPage = $state(0);

    const totalPages = $derived(Math.max(1, Math.ceil(total / PAGE_SIZE)));

    const selectedCfg = $derived(selectedCategory ? getCategoryConfig(selectedCategory) : null);

    let loadStarted = false;
    $effect(() => {
        if (loadStarted) return;
        loadStarted = true;
        loadAll();
    });

    async function loadAll() {
        await Promise.all([loadUsers(), loadCategoryCounts()]);
    }

    async function loadUsers() {
        loading = true;
        try {
            const data = await usersService.listUsers(PAGE_SIZE, currentPage * PAGE_SIZE, selectedCategory);
            users = data.items;
            total = data.pagination.total;
        } catch (error) {
            console.error('Failed to load users:', error);
            users = [];
            total = 0;
        } finally {
            loading = false;
        }
    }

    async function loadCategoryCounts() {
        loadingCounts = true;
        try {
            categoryCounts = await usersService.getUserCategoryCounts();
        } catch (error) {
            console.error('Failed to load category counts:', error);
            categoryCounts = [];
        } finally {
            loadingCounts = false;
        }
    }

    function selectCategory(category) {
        if (selectedCategory === category) return;
        selectedCategory = category;
        currentPage = 0;
        loadUsers();
    }

    function clearCategory() {
        if (!selectedCategory) return;
        selectedCategory = '';
        currentPage = 0;
        loadUsers();
    }

    async function reindexCategories() {
        reindexing = true;
        try {
            const result = await usersService.reindexUserCategories();
            showToast(result?.updated ? `Reindexed ${result.updated} users` : 'Nothing to reindex', 'success');
            await Promise.all([loadUsers(), loadCategoryCounts()]);
        } catch (error) {
            console.error('Failed to reindex categories:', error);
            showToast('Failed to reindex categories', 'error');
        } finally {
            reindexing = false;
        }
    }

    function goToPage(page) {
        if (page < 0 || page >= totalPages) return;
        currentPage = page;
        loadUsers();
    }

    function getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    function getRandomColor(seed) {
        const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
        return colors[seed ? seed.length % colors.length : 0];
    }
</script>

<div class="space-y-6 max-w-full mx-auto">
    <AdminPageHeader
        title="Users"
        subtitle={loading ? null : selectedCategory
            ? `${total} accepted ${total === 1 ? 'user' : 'users'} in ${selectedCfg?.label}`
            : `${total} registered ${total === 1 ? 'user' : 'users'} — pick a category to see accepted users`}
    >
        <button
            class="btn btn-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 gap-2 rounded-xl"
            onclick={() => loadAll()}
        >
            <RefreshCw size={14} />
            Refresh
        </button>
        <button
            class="btn btn-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 gap-2 rounded-xl"
            onclick={reindexCategories}
            disabled={reindexing}
        >
            {#if reindexing}
                <span class="loading loading-spinner loading-xs"></span>
                Reindexing...
            {:else}
                <Wand2 size={14} />
                Reindex categories
            {/if}
        </button>
    </AdminPageHeader>

    <!-- ============ Category cards (accepted users) ============ -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <!-- All Users card (always available) -->
        <button
            class="text-left bg-white border rounded-2xl p-4 transition-all duration-300 cursor-pointer
            {selectedCategory === ''
                ? 'border-purple-300 shadow-lg ring-4 ring-purple-50'
                : 'border-gray-100 hover:border-purple-200 hover:shadow-md hover:-translate-y-0.5'}"
            onclick={() => clearCategory()}
        >
            <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                     style="background: linear-gradient(135deg, #6b7280, #9ca3af)">
                    <Users size={16} />
                </div>
                <p class="text-2xl font-extrabold text-gray-900 leading-none">
                    {loading ? '—' : total}
                </p>
            </div>
            <p class="mt-2.5 text-xs font-bold text-gray-700">All Users</p>
            <p class="text-[10px] text-gray-400 font-medium">everyone registered</p>
        </button>

        {#each categoryCounts as cat}
            {@const cfg = getCategoryConfig(cat.category)}
            <button
                class="text-left bg-white border rounded-2xl p-4 transition-all duration-300 cursor-pointer
                {selectedCategory === cat.category
                    ? 'border-purple-300 shadow-lg ring-4 ring-purple-50'
                    : 'border-gray-100 hover:border-purple-200 hover:shadow-md hover:-translate-y-0.5'}"
                onclick={() => selectCategory(cat.category)}
            >
                <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                         style="background: {cfg.color}">
                        <svelte:component this={cfg.icon} size={16} />
                    </div>
                    <p class="text-2xl font-extrabold text-gray-900 leading-none">{cat.count}</p>
                </div>
                <p class="mt-2.5 text-xs font-bold text-gray-700 truncate">{cfg.label}</p>
                <p class="text-[10px] text-gray-400 font-medium">accepted users</p>
            </button>
        {/each}
    </div>

    {#if loadingCounts && categoryCounts.length === 0 && !loading}
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 animate-pulse">
            {#each Array(5) as _}
                <div class="bg-white border border-gray-100 rounded-2xl p-4">
                    <div class="w-9 h-9 rounded-xl bg-gray-100"></div>
                    <div class="mt-3 h-3 bg-gray-100 rounded w-16"></div>
                    <div class="mt-1.5 h-2.5 bg-gray-50 rounded w-20"></div>
                </div>
            {/each}
        </div>
    {/if}

    <!-- Active filter bar -->
    {#if selectedCategory}
        <div class="flex items-center gap-2.5 bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5">
            <span class="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700">
                <svelte:component this={selectedCfg.icon} size={13} style="color: {selectedCfg.color}" />
                {selectedCfg.label}
            </span>
            <span class="text-xs text-purple-500">— accepted users only</span>
            <button
                class="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors cursor-pointer"
                onclick={clearCategory}
            >
                <X size={13} />
                Clear filter
            </button>
        </div>
    {/if}

    <!-- ============ User list ============ -->
    {#if loading}
        <div class="space-y-2 animate-pulse">
            {#each Array(10) as _}
                <div class="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4">
                    <div class="w-10 h-10 rounded-full bg-gray-100 shrink-0"></div>
                    <div class="flex-1 min-w-0 space-y-2">
                        <div class="h-3.5 bg-gray-100 rounded w-40"></div>
                        <div class="h-2.5 bg-gray-50 rounded w-24"></div>
                    </div>
                </div>
            {/each}
        </div>
    {:else if users.length === 0}
        <EmptyState
            icon={Inbox}
            title={selectedCategory ? 'No accepted users in this category yet' : 'No users yet'}
            description={selectedCategory
                ? 'Accept applicants with this skill set and they will appear here.'
                : 'Users who sign in with GitHub will show up here.'}
        />
    {:else}
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <ul class="divide-y divide-gray-50">
                {#each users as user}
                    <li>
                        <button
                            class="w-full flex items-center gap-4 px-4 sm:px-6 py-4 text-left hover:bg-purple-50/40 transition-colors cursor-pointer group"
                            onclick={() => goto(`/admin/users/${user.id}`)}
                        >
                            {#if user.avatar_url}
                                <img
                                    src={user.avatar_url}
                                    alt=""
                                    class="w-10 h-10 rounded-full object-cover ring-2 ring-purple-50 shrink-0"
                                />
                            {:else}
                                <div
                                    class="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                                    style="background: {getRandomColor(user.github_username)}"
                                >
                                    {getInitials(user.name || user.github_username)}
                                </div>
                            {/if}
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                                    {user.name || user.github_username || 'Unknown'}
                                </p>
                                <p class="flex items-center gap-1 text-xs text-gray-400 truncate">
                                    <GitBranch size={10} class="shrink-0" />
                                    <span class="truncate">@{user.github_username || '—'}</span>
                                </p>
                                {#if user.categories && user.categories.length > 0}
                                    <div class="mt-1.5 flex flex-wrap gap-1">
                                        {#each user.categories as cat}
                                            {@const ccfg = getCategoryConfig(cat)}
                                            <span
                                                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                                                style="background-color: {ccfg.color}14; color: {ccfg.color}"
                                            >
                                                <svelte:component this={ccfg.icon} size={9} />
                                                {ccfg.label}
                                            </span>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                            <span class="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 group-hover:text-purple-600 transition-colors">
                                View activity
                                <ArrowRight size={14} class="group-hover:translate-x-0.5 transition-transform" />
                            </span>
                        </button>
                    </li>
                {/each}
            </ul>

            <!-- Pagination -->
            {#if totalPages > 1}
                <div class="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
                    <p class="text-[11px] font-semibold text-gray-400">
                        Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, total)} of {total}
                    </p>
                    <div class="flex items-center gap-1.5">
                        <button
                            class="btn btn-xs btn-ghost text-gray-500 gap-1 rounded-lg hover:bg-gray-50"
                            onclick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 0}
                        >
                            <ChevronLeft size={14} />
                            Prev
                        </button>
                        {#if totalPages <= 10}
                            <div class="flex items-center gap-1.5">
                                {#each Array(totalPages) as _, i}
                                    <button
                                        class="w-7 h-7 rounded-lg text-xs font-bold transition-all
                                        {i === currentPage
                                            ? 'bg-purple-600 text-white shadow-sm'
                                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}"
                                        onclick={() => goToPage(i)}
                                    >
                                        {i + 1}
                                    </button>
                                {/each}
                            </div>
                        {:else}
                            <span class="text-[11px] font-semibold text-gray-400 px-2">
                                Page {currentPage + 1} of {totalPages}
                            </span>
                        {/if}
                        <button
                            class="btn btn-xs btn-ghost text-gray-500 gap-1 rounded-lg hover:bg-gray-50"
                            onclick={() => goToPage(currentPage + 1)}
                            disabled={currentPage >= totalPages - 1}
                        >
                            Next
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>