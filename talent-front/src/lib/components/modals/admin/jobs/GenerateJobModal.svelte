<script>
    import { XCircle, Sparkles } from "lucide-svelte";
    import { jobDescriptionService } from "$lib/api/jobDescription.service";
    import { showToast } from "$lib/stores/toast";

    let { isOpen = false, onclose = () => {}, ongenerated = (data) => {} } = $props();

    let prompt = $state("");
    let generating = $state(false);

    function close() {
        prompt = "";
        generating = false;
        onclose();
    }

    async function generate() {
        if (!prompt.trim()) return;
        generating = true;
        try {
            const data = await jobDescriptionService.generate(prompt);
            let parsed = data.job_description;
            if (parsed && typeof parsed === "object" && parsed.raw) {
                try { parsed = JSON.parse(parsed.raw); } catch {}
            }
            ongenerated(parsed);
            showToast("Job description generated successfully", "success");
            close();
        } catch (error) {
            showToast(error.message || "Failed to generate job description", "error");
        } finally {
            generating = false;
        }
    }

    function handleKeydown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            generate();
        }
    }
</script>

{#if isOpen}
    <div
        class="modal modal-open bg-black/40 backdrop-blur-sm transition-all duration-300 z-[100]"
        onclick={close}
    >
        <div
            class="modal-box max-w-xl rounded-lg p-0 overflow-hidden border-none scale-95"
            onclick={(e) => e.stopPropagation()}
        >
            <!-- Header -->
            <div class="bg-purple-600 p-6 text-white relative flex items-center gap-3">
                <Sparkles size={22} />
                <div>
                    <h3 class="text-lg font-bold">Generate with AI</h3>
                    <p class="text-purple-100 text-xs mt-0.5">
                        Describe the role — press Enter to generate
                    </p>
                </div>
                <button
                    class="absolute top-6 right-6 text-white/80 hover:text-white transition-transform hover:rotate-90"
                    onclick={close}
                    type="button"
                    aria-label="Close"
                >
                    <XCircle size={20} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-6 bg-white">
                <textarea
                    class="textarea bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-600 h-28 rounded-lg w-full text-sm"
                    placeholder="e.g. Senior Backend Developer with Go experience, remote, 5+ years..."
                    bind:value={prompt}
                    onkeydown={handleKeydown}
                    disabled={generating}
                ></textarea>
                <p class="text-[11px] text-gray-400 mt-2">
                    Press <kbd class="kbd kbd-xs">Enter</kbd> to generate
                    {#if generating}
                        <span class="ml-2 text-purple-500 font-medium">
                            <span class="loading loading-spinner loading-xs"></span>
                            Generating...
                        </span>
                    {/if}
                </p>
            </div>
        </div>
    </div>
{/if}
