<script>
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { contactRequestsService } from '$lib/api/contactRequests.service';
    import { showToast } from '$lib/stores/toast';
    import { ArrowLeft, Calendar, Mail, Building2, Tag, Loader2, Send, Trash2 } from 'lucide-svelte';
    import DeleteConfirmationModal from '$lib/components/modals/admin/common/DeleteConfirmationModal.svelte';

    const statuses = ['new', 'read', 'replied', 'archived'];
    let requestId = $state('');
    let request = $state(null);
    let contactMessages = $state([]);
    let selectedStatus = $state('new');
    let loading = $state(true);
    let loadingMessages = $state(false);
    let savingStatus = $state(false);
    let sendingReply = $state(false);
    let replySubject = $state('Re: Your inquiry to Izone Technologies');
    let replyMessage = $state('');
    let notFound = $state(false);

    // Delete confirmation modal state
    let deleteModalOpen = $state(false);
    let deleteModalLoading = $state(false);
    let deleteModalTitle = $state('');
    let deleteModalMessage = $state('');
    let deleteModalConfirmText = $state('Delete');
    let pendingDeleteAction = $state(null); // 'message' | 'request'
    let pendingMessage = $state(null);

    $effect(() => {
        const id = $page.params.id;
        if (id && id !== requestId) {
            requestId = id;
            loadRequest();
        }
    });

    /** Normalize the /messages response into an array regardless of shape. */
    function normalizeMessages(raw) {
        if (Array.isArray(raw)) return raw;
        if (raw && Array.isArray(raw.items)) return raw.items;
        return [];
    }

    async function loadRequest() {
        loading = true;
        notFound = false;
        try {
            request = await contactRequestsService.get(requestId);
            if (!request) {
                notFound = true;
                return;
            }
            selectedStatus = request.status || 'new';
            replySubject = `Re: Your inquiry to Izone Technologies`;
            replyMessage = '';
        } catch (error) {
            console.error('Failed to load contact request:', error);
            request = null;
            notFound = true;
            return;
        } finally {
            loading = false;
        }

        // Load messages separately — a failure here should NOT hide the request.
        await loadMessages();
    }

    async function loadMessages() {
        if (!request) return;
        loadingMessages = true;
        try {
            const raw = await contactRequestsService.listMessages(request.id);
            const messages = normalizeMessages(raw);
            // Backend returns created_at DESC; reverse for chronological order.
            contactMessages = [...messages].reverse();
        } catch (error) {
            console.error('Failed to load contact messages:', error);
            // Fallback: show the original submission as the only message.
            contactMessages = [request];
        } finally {
            loadingMessages = false;
        }
    }

    async function sendReply() {
        if (!request || !replySubject.trim() || !replyMessage.trim()) return;
        sendingReply = true;
        try {
            const updated = await contactRequestsService.reply(request.id, replySubject, replyMessage);
            request = updated;
            selectedStatus = updated.status;
            replyMessage = '';
            showToast('Reply sent successfully', 'success');
            await loadMessages();
        } catch (error) {
            console.error('Failed to send contact reply:', error);
            showToast('Failed to send reply', 'error');
        } finally {
            sendingReply = false;
        }
    }

    // --- Delete message ---
    function openDeleteMessageModal(message) {
        pendingMessage = message;
        pendingDeleteAction = 'message';
        deleteModalTitle = 'Delete Message';
        deleteModalMessage = `Delete this message from ${message.first_name} ${message.last_name}?`;
        deleteModalConfirmText = 'Delete message';
        deleteModalOpen = true;
    }

    async function confirmDeleteMessage() {
        if (!request || !pendingMessage) return;
        deleteModalLoading = true;
        try {
            await contactRequestsService.deleteMessage(request.id, pendingMessage.id);
            contactMessages = contactMessages.filter((m) => m.id !== pendingMessage.id);
            showToast('Message deleted', 'success');
        } catch (error) {
            console.error('Failed to delete message:', error);
            showToast('Failed to delete message', 'error');
        } finally {
            deleteModalLoading = false;
            deleteModalOpen = false;
            pendingMessage = null;
            pendingDeleteAction = null;
        }
    }

    // --- Delete entire request ---
    function openDeleteRequestModal() {
        pendingDeleteAction = 'request';
        deleteModalTitle = 'Delete Conversation';
        deleteModalMessage = `Delete the entire conversation from ${request.first_name} ${request.last_name}? This cannot be undone.`;
        deleteModalConfirmText = 'Delete conversation';
        deleteModalOpen = true;
    }

    async function confirmDeleteRequest() {
        if (!request) return;
        deleteModalLoading = true;
        try {
            await contactRequestsService.remove(request.id);
            showToast('Contact request deleted', 'success');
            goto('/admin/contact-requests');
        } catch (error) {
            console.error('Failed to delete contact request:', error);
            showToast('Failed to delete contact request', 'error');
        } finally {
            deleteModalLoading = false;
            deleteModalOpen = false;
            pendingDeleteAction = null;
        }
    }

    // --- Modal event handlers ---
    function handleDeleteModalConfirm() {
        if (pendingDeleteAction === 'message') confirmDeleteMessage();
        else if (pendingDeleteAction === 'request') confirmDeleteRequest();
    }

    function handleDeleteModalClose() {
        deleteModalOpen = false;
        deleteModalLoading = false;
        pendingMessage = null;
        pendingDeleteAction = null;
    }

    async function saveStatus() {
        if (!request || selectedStatus === request.status) return;
        savingStatus = true;
        try {
            const updated = await contactRequestsService.updateStatus(request.id, selectedStatus);
            request = updated;
            selectedStatus = updated.status;
            showToast('Contact request status updated', 'success');
        } catch (error) {
            console.error('Failed to update contact request status:', error);
            showToast('Failed to update contact request status', 'error');
            selectedStatus = request.status;
        } finally {
            savingStatus = false;
        }
    }

    function formatDate(value) {
        if (!value) return '—';
        return new Date(value).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
        });
    }
</script>

<div class="mx-auto max-w-5xl space-y-6">
    <div class="flex items-center gap-3">
        <button
            class="btn btn-sm gap-2 rounded-lg text-gray-500 btn-ghost"
            onclick={() => goto('/admin/contact-requests')}
        >
            <ArrowLeft size={16} />
            Contact Requests
        </button>
    </div>

    {#if loading}
        <div class="space-y-4 animate-pulse">
            <div class="h-32 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/50"></div>
            <div class="h-64 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/50"></div>
        </div>
    {:else if notFound}
        <div class="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <p class="font-semibold text-gray-900">Contact request not found</p>
            <button class="btn btn-sm mt-4 rounded-lg" onclick={() => goto('/admin/contact-requests')}>Back to requests</button>
        </div>
    {:else if request}
        <!-- Header: Contact info + status -->
        <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p class="text-xs font-bold uppercase tracking-wider text-purple-600">Contact request</p>
                    <h1 class="mt-2 text-2xl font-bold text-gray-900">{request.first_name} {request.last_name}</h1>
                    <a class="mt-2 inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800" href={`mailto:${request.email}`}>
                        <Mail size={14} />
                        {request.email}
                    </a>
                </div>
                <div class="flex items-center gap-2">
                    <select class="select select-sm rounded-lg border-gray-200 bg-white text-sm capitalize" bind:value={selectedStatus} onchange={saveStatus} disabled={savingStatus}>
                        {#each statuses as status}
                            <option value={status}>{status}</option>
                        {/each}
                    </select>
                    {#if savingStatus}<Loader2 size={16} class="animate-spin text-purple-600" />{/if}
                </div>
            </div>

            <div class="mt-7 grid gap-4 border-t border-gray-100 pt-6 sm:grid-cols-3">
                <div class="flex items-start gap-3">
                    <Building2 size={17} class="mt-0.5 text-purple-500" />
                    <div><p class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Company</p><p class="mt-1 text-sm text-gray-800">{request.company || '—'}</p></div>
                </div>
                <div class="flex items-start gap-3">
                    <Tag size={17} class="mt-0.5 text-purple-500" />
                    <div><p class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Budget</p><p class="mt-1 text-sm text-gray-800">{request.budget_range || '—'}</p></div>
                </div>
                <div class="flex items-start gap-3">
                    <Calendar size={17} class="mt-0.5 text-purple-500" />
                    <div><p class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Submitted</p><p class="mt-1 text-sm text-gray-800">{formatDate(request.created_at)}</p></div>
                </div>
            </div>
        </div>

        <!-- Conversation -->
        <section class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="conversation-title">
            <div class="flex items-center justify-between">
                <h2 id="conversation-title" class="text-lg font-bold text-gray-900">Conversation</h2>
                {#if loadingMessages}<Loader2 size={16} class="animate-spin text-purple-600" />{/if}
            </div>
            <p class="mt-1 text-xs text-gray-400">{contactMessages.length} {contactMessages.length === 1 ? 'message' : 'messages'}</p>

            <div class="mt-5 space-y-4">
                {#each contactMessages as message, i (message.id || i)}
                    <article class="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-bold text-gray-700">{message.first_name} {message.last_name}</span>
                                <span class="text-[11px] text-gray-400">{message.email}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-gray-400">{formatDate(message.created_at)}</span>
                                <button class="btn btn-xs gap-1 rounded-lg text-red-500 btn-ghost hover:bg-red-50" onclick={() => openDeleteMessageModal(message)}>
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                        <div class="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                            <p><span class="font-semibold text-gray-500">Company:</span> {message.company || '—'}</p>
                            <p><span class="font-semibold text-gray-500">Budget:</span> {message.budget_range || '—'}</p>
                        </div>
                        <p class="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-600">{message.project_details}</p>
                    </article>
                {/each}

                {#if contactMessages.length === 0 && !loadingMessages}
                    <p class="py-4 text-center text-sm text-gray-400">No messages found.</p>
                {/if}
            </div>
        </section>

        <!-- Reply form -->
        <section class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="reply-title">
            <div class="flex items-center gap-2">
                <Send size={18} class="text-purple-600" />
                <h2 id="reply-title" class="text-lg font-bold text-gray-900">Reply to {request.first_name}</h2>
            </div>
            <div class="mt-5 grid gap-4">
                <label class="grid gap-2 text-sm font-semibold text-gray-700">
                    Subject
                    <input class="input input-bordered w-full" bind:value={replySubject} maxlength="255" />
                </label>
                <label class="grid gap-2 text-sm font-semibold text-gray-700">
                    Message
                    <textarea class="textarea textarea-bordered min-h-40 w-full" bind:value={replyMessage} maxlength="10000" placeholder="Write your reply..."></textarea>
                </label>
                <div>
                    <button
                        class="btn gap-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
                        onclick={sendReply}
                        disabled={sendingReply || !replySubject.trim() || !replyMessage.trim()}
                    >
                        {#if sendingReply}<Loader2 size={16} class="animate-spin" />Sending...{:else}<Send size={16} />Send reply{/if}
                    </button>
                </div>
            </div>
        </section>

        <!-- Delete -->
        <div class="flex justify-end">
            <button
                class="btn gap-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                onclick={openDeleteRequestModal}
            >
                <Trash2 size={16} />
                Delete request
            </button>
        </div>
    {/if}
</div>

<!-- Delete confirmation modal (reusable for message & request delete) -->
<DeleteConfirmationModal
    isOpen={deleteModalOpen}
    title={deleteModalTitle}
    message={deleteModalMessage}
    confirmText={deleteModalConfirmText}
    loading={deleteModalLoading}
    on:confirm={handleDeleteModalConfirm}
    on:close={handleDeleteModalClose}
/>
