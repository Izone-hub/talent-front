<script>
    import { createEventDispatcher } from "svelte";
    import { Trash2, X, AlertTriangle } from "lucide-svelte";
    import { fly, fade } from "svelte/transition";

    export let isOpen = false;
    export let title = "Confirm Deletion";
    export let message =
        "Are you sure you want to delete this item? This action cannot be undone.";
    export let loading = false;
    export let confirmText = "Delete";
    export let cancelText = "Cancel";

    const dispatch = createEventDispatcher();

    function close() {
        if (!loading) {
            dispatch("close");
        }
    }

    function confirm() {
        dispatch("confirm");
    }
</script>

{#if isOpen}
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            on:click={close}
            transition:fade={{ duration: 200 }}
        ></div>

        <!-- Modal Content -->
        <div
            class="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden"
            transition:fly={{ y: 20, duration: 300 }}
        >
            <div class="p-8">
                <!-- Header Icon -->
                <div class="flex justify-center mb-6">
                    <div
                        class="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 relative"
                    >
                        <Trash2 size={32} />
                        <div
                            class="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-white border-4 border-white"
                        >
                            <AlertTriangle size={12} />
                        </div>
                    </div>
                </div>

                <!-- Text Content -->
                <div class="text-center space-y-3 mb-8">
                    <h2
                        class="text-xl font-black text-slate-900 tracking-tight"
                    >
                        {title}
                    </h2>
                    <p
                        class="text-sm font-medium text-slate-500 leading-relaxed px-4"
                    >
                        {message}
                    </p>
                </div>

                <!-- Actions -->
                <div class="flex flex-col gap-3">
                    <button
                        on:click={confirm}
                        disabled={loading}
                        class="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.15em] shadow-lg shadow-rose-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {#if loading}
                            <span class="loading loading-spinner loading-xs"
                            ></span>
                            Processing...
                        {:else}
                            <Trash2 size={16} />
                            {confirmText}
                        {/if}
                    </button>
                    <button
                        on:click={close}
                        disabled={loading}
                        class="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-[0.15em] transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>

            <!-- Decorative Elements -->
            <div class="absolute top-0 right-0 p-4">
                <button
                    on:click={close}
                    class="p-2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    </div>
{/if}
