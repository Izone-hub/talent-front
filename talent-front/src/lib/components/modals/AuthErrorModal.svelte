<script>
    import { ShieldAlert } from "lucide-svelte";
    import { fade } from "svelte/transition";

    export let isOpen = false;
    export let onClose = () => {};
</script>

{#if isOpen}
    <div
        class="modal modal-open items-center justify-center bg-black/40 backdrop-blur-[2px]"
        transition:fade={{ duration: 200 }}
    >
        <div class="modal-box max-w-sm text-center shadow-2xl">
            <div>
                <div
                    class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500"
                >
                    <ShieldAlert size={32} />
                </div>

                <h3 class="text-xl font-bold text-gray-900 leading-tight mb-2">
                    Access Restricted
                </h3>
                <p class="text-sm text-gray-500 px-4">
                    This area is reserved for administrators only. Please return
                    to the homepage.
                </p>

                <div class="mt-8">
                    <button
                        class="btn btn-primary w-full border-none bg-purple-600 hover:bg-purple-700 text-white"
                        on:click={onClose}
                    >
                        Go Back Home
                    </button>
                </div>
            </div>

            <div class="bg-gray-50/80 py-3 border-t border-gray-100">
                <span
                    class="text-[10px] uppercase tracking-widest text-gray-400 font-semibold"
                    >Security Protocol Alpha</span
                >
            </div>
        </div>
    </div>
{/if}
