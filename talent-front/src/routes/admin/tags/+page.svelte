<script>
    import { Plus, Edit, Trash2, Briefcase, HelpCircle, ArrowLeft, X, Search } from "lucide-svelte";
    import { tagService } from "$lib/api/tag.service";
    import PageLoader from "$lib/components/ui/PageLoader.svelte";
    import EmptyState from "$lib/components/ui/EmptyState.svelte";
    import CreateTagModal from "$lib/components/modals/admin/tag/createTag.svelte";
    import EditTagModal from "$lib/components/modals/admin/tag/editTag.svelte";
    import DeleteConfirmationModal from "$lib/components/modals/admin/tag/deletComfirmation.svelte";
    import AssignTagJobModal from "$lib/components/modals/admin/tag/assignTagJob.svelte";
    import JobDetailModal from "$lib/components/modals/admin/jobs/job-detail.svelte";
    import QuestionDetailModal from "$lib/components/modals/admin/question/QuestionDetailModal.svelte";

    let loading = $state(true);
    let tags = $state([]);
    let searchQuery = $state("");

    // Detail view state
    let selectedTag = $state(null);
    let detailLoading = $state(false);
    let tagJobs = $state([]);
    let tagQuestions = $state([]);
    let detailTab = $state("jobs"); // "jobs" or "questions"
    let isJobDetailOpen = $state(false);
    let selectedJob = $state(null);
    let isQuestionDetailOpen = $state(false);
    let selectedQuestionId = $state(null);

    async function loadTags() {
        loading = true;
        try {
            const data = await tagService.listTags();
            tags = data;
        } catch (error) {
            console.error("Failed to load tags:", error);
        } finally {
            loading = false;
        }
    }

    $effect(() => {
        loadTags();
    });

    function tagName(tag) {
        return tag?.Name || tag?.name || "";
    }

    function tagColor(tag) {
        return tag?.Color || tag?.color || "#7C3AED";
    }

    function tagCategory(tag) {
        const cat = tag?.Category || tag?.category;
        if (typeof cat === "object") return cat?.TagCategory || cat?.category || "General";
        return cat || "General";
    }

    function tagDescription(tag) {
        return tag?.Description || tag?.description || "";
    }

    const filteredTags = $derived(
        searchQuery.trim()
            ? tags.filter((t) => tagName(t).toLowerCase().includes(searchQuery.trim().toLowerCase()))
            : tags
    );

    async function selectTag(tag) {
        selectedTag = tag;
        detailLoading = true;
        tagJobs = [];
        tagQuestions = [];
        detailTab = "jobs";

        const tagId = tag?.ID || tag?.id;
        try {
            const [jobsData, questionsData] = await Promise.all([
                tagService.getTagJobs(tagId),
                tagService.getTagQuestions(tagId),
            ]);
            tagJobs = jobsData?.jobs || [];
            tagQuestions = questionsData?.questions || [];
        } catch (err) {
            console.error("Failed to load tag details:", err);
        } finally {
            detailLoading = false;
        }
    }

    function closeDetail() {
        selectedTag = null;
        tagJobs = [];
        tagQuestions = [];
    }
</script>

<div class="space-y-6 max-w-full mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 class="text-xl font-semibold text-gray-900 tracking-tight">Tags</h1>
            <p class="text-gray-500 mt-0.5 text-sm">
                {tags.length} tags — click one to see linked questions & jobs
            </p>
        </div>
        <CreateTagModal onSuccess={loadTags} />
    </div>

    {#if selectedTag}
        <!-- Detail View -->
        <div class="space-y-4">
            <!-- Back button + tag header -->
            <div class="flex items-center gap-3">
                <button
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    onclick={closeDetail}
                >
                    <ArrowLeft size={20} class="text-gray-500" />
                </button>
                <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style="background-color: {tagColor(selectedTag)}"
                >
                    {tagName(selectedTag).charAt(0).toUpperCase()}
                </div>
                <div class="flex-1 min-w-0">
                    <h2 class="text-lg font-bold text-gray-900">{tagName(selectedTag)}</h2>
                    <p class="text-xs text-gray-400">{tagCategory(selectedTag)}</p>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <AssignTagJobModal tag={selectedTag} onSuccess={() => { selectTag(selectedTag); }} />
                    <EditTagModal tag={selectedTag} onSuccess={() => { loadTags(); selectTag(selectedTag); }} />
                    <DeleteConfirmationModal
                        tag={selectedTag}
                        onSuccess={() => { loadTags(); closeDetail(); }}
                    />
                </div>
            </div>

            {#if tagDescription(selectedTag)}
                <p class="text-sm text-gray-500 ml-11">{tagDescription(selectedTag)}</p>
            {/if}

            <!-- Stats -->
            <div class="flex gap-3 ml-11">
                <div class="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <Briefcase size={13} />
                    {tagJobs.length} jobs
                </div>
                <div class="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <HelpCircle size={13} />
                    {tagQuestions.length} questions
                </div>
            </div>

            <!-- Tab switcher -->
            <div class="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit ml-11">
                <button
                    class="px-4 py-1.5 rounded-md text-xs font-semibold transition-all
                        {detailTab === 'jobs'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'}"
                    onclick={() => (detailTab = "jobs")}
                >
                    Jobs ({tagJobs.length})
                </button>
                <button
                    class="px-4 py-1.5 rounded-md text-xs font-semibold transition-all
                        {detailTab === 'questions'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'}"
                    onclick={() => (detailTab = "questions")}
                >
                    Questions ({tagQuestions.length})
                </button>
            </div>

            <!-- Content -->
            {#if detailLoading}
                <div class="flex items-center justify-center py-12">
                    <span class="loading loading-spinner loading-md text-purple-600"></span>
                </div>
            {:else if detailTab === "jobs"}
                {#if tagJobs.length === 0}
                    <div class="text-center py-12 text-gray-400">
                        <Briefcase size={32} class="mx-auto mb-2 opacity-40" />
                        <p class="text-sm">No jobs linked to this tag yet</p>
                    </div>
                {:else}
                    <div class="grid gap-3">
                        {#each tagJobs as job}
                            <button
                                class="block w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer"
                                onclick={() => { selectedJob = job; isJobDetailOpen = true; }}
                            >
                                <div class="flex items-start justify-between gap-3">
                                    <div class="min-w-0">
                                        <h3 class="text-sm font-bold text-gray-900 truncate">{job.title}</h3>
                                        <p class="text-xs text-gray-400 mt-0.5">{job.company}</p>
                                    </div>
                                    <span
                                        class="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full
                                            {job.status === 'published'
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : job.status === 'draft'
                                                    ? 'bg-amber-50 text-amber-600'
                                                    : 'bg-gray-100 text-gray-500'}"
                                    >
                                        {job.status}
                                    </span>
                                </div>
                                {#if job.salary_min || job.salary_max}
                                    <p class="text-xs text-gray-400 mt-2">
                                        {job.salary_currency || 'ETB'} {job.salary_min?.toLocaleString() || '?'} – {job.salary_max?.toLocaleString() || '?'}
                                    </p>
                                {/if}
                            </button>
                        {/each}
                    </div>
                {/if}
            {:else if detailTab === "questions"}
                {#if tagQuestions.length === 0}
                    <div class="text-center py-12 text-gray-400">
                        <HelpCircle size={32} class="mx-auto mb-2 opacity-40" />
                        <p class="text-sm">No questions linked to this tag yet</p>
                    </div>
                {:else}
                    <div class="grid gap-3">
                        {#each tagQuestions as q}
                            <button
                                class="block w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer"
                                onclick={() => { selectedQuestionId = q.ID || q.id; isQuestionDetailOpen = true; }}
                            >
                                <div class="flex items-start justify-between gap-3">
                                    <div class="min-w-0">
                                        <p class="text-sm font-medium text-gray-800 line-clamp-2">{q.question_text}</p>
                                        <div class="flex items-center gap-2 mt-2">
                                            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                                                {q.question_type?.replace('_', ' ')}
                                            </span>
                                            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full
                                                {q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600'
                                                    : q.difficulty === 'medium' ? 'bg-amber-50 text-amber-600'
                                                    : q.difficulty === 'hard' ? 'bg-rose-50 text-rose-600'
                                                    : 'bg-purple-50 text-purple-600'}">
                                                {q.difficulty}
                                            </span>
                                            <span class="text-[10px] text-gray-400">{q.points} pts</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        {/each}
                    </div>
                {/if}
            {/if}
        </div>
    {:else}
        <!-- Tag Grid View -->
        {#if loading}
            <PageLoader message="Loading tags..." />
        {:else if tags.length === 0}
            <EmptyState title="No tags yet" description="Create your first tag to get started" />
        {:else}
            <!-- Search -->
            <div class="relative">
                <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    placeholder="Search tags..."
                    class="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    bind:value={searchQuery}
                />
                {#if searchQuery}
                    <button
                        class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded"
                        onclick={() => (searchQuery = "")}
                    >
                        <X size={16} />
                    </button>
                {/if}
            </div>

            <!-- Tags Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {#each filteredTags as tag (tag.ID || tag.id)}
                    <button
                        class="group text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                        onclick={() => selectTag(tag)}
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 group-hover:scale-110 transition-transform"
                                style="background-color: {tagColor(tag)}"
                            >
                                {tagName(tag).charAt(0).toUpperCase()}
                            </div>
                            <div class="min-w-0 flex-1">
                                <h3 class="text-sm font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                                    {tagName(tag)}
                                </h3>
                                <p class="text-[11px] text-gray-400 font-medium">{tagCategory(tag)}</p>
                            </div>
                        </div>
                        {#if tagDescription(tag)}
                            <p class="text-xs text-gray-400 mt-2 line-clamp-2">{tagDescription(tag)}</p>
                        {/if}
                    </button>
                {/each}
            </div>

            {#if filteredTags.length === 0 && searchQuery}
                <div class="text-center py-12 text-gray-400">
                    <p class="text-sm">No tags match "{searchQuery}"</p>
                </div>
            {/if}
        {/if}
    {/if}
</div>

<JobDetailModal
    bind:isOpen={isJobDetailOpen}
    job={selectedJob}
    on:close={() => { isJobDetailOpen = false; selectedJob = null; }}
/>

<QuestionDetailModal
    bind:isOpen={isQuestionDetailOpen}
    questionId={selectedQuestionId}
    on:close={() => { isQuestionDetailOpen = false; selectedQuestionId = null; }}
/>
