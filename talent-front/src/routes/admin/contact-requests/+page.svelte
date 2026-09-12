<script>
    import { goto } from '$app/navigation';
    import { contactRequestsService } from '$lib/api/contactRequests.service';
    import AdminPageHeader from '$lib/components/ui/AdminPageHeader.svelte';
    import EmptyState from '$lib/components/ui/EmptyState.svelte';
    import { ChevronLeft, ChevronRight, Mail, RefreshCw, ArrowRight } from 'lucide-svelte';

    const PAGE_SIZE = 50;
    let requests = $state([]);
    let total = $state(0);
    let currentPage = $state(0);
    let loading = $state(true);
    let loadError = $state(false);
    const totalPages = $derived(Math.max(1, Math.ceil(total / PAGE_SIZE)));
    const contacts = $derived.by(() => {
        const groups = new Map();
        for (const request of requests) {
            const name = `${request.first_name || ''} ${request.last_name || ''}`.trim() || 'Unknown contact';
            const key = (request.email || name).toLowerCase();
            if (!groups.has(key)) groups.set(key, { name, email: request.email, requests: [] });
            groups.get(key).requests.push(request);
        }
        return Array.from(groups.values());
    });

    function initials(name) {
        return name.split(' ').filter(Boolean).map((part) => part[0]).join('').toUpperCase().slice(0, 2) || '?';
    }

    let loadStarted = false;
    $effect(() => {
        if (loadStarted) return;
        loadStarted = true;
        loadRequests();
    });

    async function loadRequests() {
        loading = true;
        loadError = false;
        try {
            const response = await contactRequestsService.list(PAGE_SIZE, currentPage * PAGE_SIZE);
            requests = response.items;
            total = response.pagination.total;
        } catch (error) {
            console.error('Failed to load contact requests:', error);
            requests = [];
            total = 0;
            loadError = true;
        } finally {
            loading = false;
        }
    }

    function goToPage(page) {
        if (page < 0 || page >= totalPages) return;
        currentPage = page;
        loadRequests();
    }

    function formatDate(value) {
        if (!value) return '—';
        return new Date(value).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    }

    function statusClass(status) {
        return {
            new: 'bg-blue-50 text-blue-700',
            read: 'bg-amber-50 text-amber-700',
            replied: 'bg-emerald-50 text-emerald-700',
            archived: 'bg-gray-100 text-gray-500',
        }[status] || 'bg-gray-100 text-gray-600';
    }
</script>

<div class="mx-auto max-w-full space-y-6">
    <AdminPageHeader
        title="Contact Requests"
        subtitle={loading ? null : `${total} ${total === 1 ? 'request' : 'requests'}`}
    >
        <button
            class="btn btn-sm gap-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            onclick={loadRequests}
            disabled={loading}
        >
            <RefreshCw size={14} />
            Refresh
        </button>
    </AdminPageHeader>

    {#if loading}
        <div class="space-y-2 animate-pulse">
            {#each Array(6) as _}
                <div class="h-16 rounded-2xl border border-gray-100 bg-white"></div>
            {/each}
        </div>
    {:else if loadError}
        <div class="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
            <p class="text-sm font-semibold text-red-700">Failed to load contact requests.</p>
            <button class="btn btn-sm mt-3 rounded-lg" onclick={loadRequests}>Try again</button>
        </div>
    {:else if requests.length === 0}
        <EmptyState
            icon={Mail}
            title="No contact requests yet"
            description="Submissions from the public Contact Us form will appear here."
        />
    {:else}
        <div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div class="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {#each contacts as contact (contact.email || contact.name)}
                    {@const latest = contact.requests[0]}
                    <button
                        class="group rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
                        onclick={() => goto(`/admin/contact-requests/${latest.id}`)}
                    >
                        <div class="flex items-center gap-3">
                            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">
                                {initials(contact.name)}
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="truncate font-bold text-gray-900">{contact.name}</p>
                                <p class="truncate text-xs text-gray-500">{contact.email || 'No email'}</p>
                            </div>
                            <ArrowRight size={16} class="shrink-0 text-gray-300 transition group-hover:translate-x-1 group-hover:text-purple-600" />
                        </div>
                        <div class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                            <span class="text-xs font-semibold text-gray-500">{contact.requests.length} {contact.requests.length === 1 ? 'message' : 'messages'}</span>
                            <span class="rounded-full px-2.5 py-1 text-[11px] font-bold capitalize {statusClass(latest.status)}">{latest.status}</span>
                        </div>
                        <p class="mt-2 text-xs text-gray-400">Latest: {formatDate(latest.created_at)}</p>
                    </button>
                {/each}
            </div>
            {#if totalPages > 1}
                <div class="flex items-center justify-between border-t border-gray-100 px-5 py-3.5">
                    <p class="text-[11px] font-semibold text-gray-400">Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, total)} of {total}</p>
                    <div class="flex items-center gap-1.5">
                        <button class="btn btn-xs gap-1 rounded-lg text-gray-500 btn-ghost" onclick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}><ChevronLeft size={14} />Prev</button>
                        <span class="px-2 text-[11px] font-semibold text-gray-400">Page {currentPage + 1} of {totalPages}</span>
                        <button class="btn btn-xs gap-1 rounded-lg text-gray-500 btn-ghost" onclick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages - 1}>Next<ChevronRight size={14} /></button>
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>
