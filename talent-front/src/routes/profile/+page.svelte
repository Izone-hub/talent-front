<script>
    import { onMount } from "svelte";
    import { auth } from "$lib/stores/authStore";
    import { cvService } from "$lib/api/cv.service";
    import {
        formatDate,
        formatDateOnly,
        formatRelativeTime,
    } from "$lib/utils/dateFormatter";
    import { showToast } from "$lib/stores/toast";
    import {
        Upload,
        Github,
        Mail,
        MapPin,
        Briefcase,
        Link as LinkIcon,
        Download,
        FileText,
        Trash2,
        History,
        CheckCircle2,
        Star,
        Users,
        BookOpen,
    } from "@lucide/svelte";

    $: user = $auth.user;
    $: if (user) {
        console.log("curent user is:", user);
    }
    $: if ($auth.isAuthenticated && user && !currentCV && !isLoading) {
        loadCVData();
    }

    let isLoading = false;
    let uploadProgress = 0;
    let currentCV = null;
    let cvVersions = [];
    let activeTab = "profile";

    onMount(async () => {
        // Initial check if user is already loaded
        if (user) {
            await loadCVData();
        }
    });

    async function loadCVData() {
        try {
            const [current, versions] = await Promise.all([
                cvService.getCurrentCV(),
            ]);
            currentCV = current;
            cvVersions = versions || [];
        } catch (error) {
            console.error("Error loading CV data:", error);
        }
    }

    async function handleCVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type and size
        const validTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!validTypes.includes(file.type)) {
            alert("Please upload PDF or Word documents only");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            // 10MB limit
            alert("File size should be less than 10MB");
            return;
        }

        isLoading = true;
        uploadProgress = 0;

        try {
            // Simulate progress for UI
            const progressInterval = setInterval(() => {
                if (uploadProgress < 90) uploadProgress += 5;
            }, 100);

            await cvService.uploadCV(file);

            clearInterval(progressInterval);
            uploadProgress = 100;

            // Refresh CV data
            await loadCVData();

            // Show success notification (if you have one)
            showToast("CV uploaded successfully!", "success");
        } catch (error) {
            console.error("Error uploading CV:", error);
            showToast("Failed to upload CV: " + error.message, "error");
        } finally {
            isLoading = false;
            uploadProgress = 0;
            // Clear the file input
            event.target.value = "";
        }
    }

    async function deleteCV(id) {
        if (!confirm("Are you sure you want to delete this CV version?"))
            return;

        try {
            await cvService.deleteCV(id);
            showToast("CV deleted successfully!", "success");
            await loadCVData();
        } catch (error) {
            console.error("Error deleting CV:", error);
            showToast("Failed to delete CV: " + error.message, "error");
        }
    }

    function downloadCV(id) {
        cvService.downloadCV(id);
    }
</script>

<div class="min-h-screen bg-slate-50 font-sans">
    {#if $auth.loading}
        <div class="flex h-screen w-full items-center justify-center">
            <div class="flex flex-col items-center gap-4">
                <span class="loading loading-spinner loading-lg text-indigo-600"
                ></span>
                <p class="text-sm font-medium text-slate-500 italic">
                    Syncing with GitHub...
                </p>
            </div>
        </div>
    {:else if !$auth.isAuthenticated}
        <div class="flex h-screen w-full items-center justify-center">
            <div
                class="text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-md"
            >
                <Github class="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h2 class="text-xl font-bold text-slate-800 mb-2">
                    Login Required
                </h2>
                <p class="text-slate-500 mb-6">
                    Please sign in with your GitHub account to view your
                    professional profile.
                </p>
                <button
                    on:click={() => auth.loginWithGithub()}
                    class="btn btn-primary w-full border-none bg-purple-600 hover:bg-purple-700 text-white"
                >
                    <Github class="h-4 w-4" />
                    Sign in with GitHub
                </button>
            </div>
        </div>
    {:else}
        <div class="flex w-full flex-col items-center">
            <div class="mx-auto w-full max-w-7xl px-4 py-8">
                <!-- Header with GitHub info -->
                <div
                    class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center"
                >
                    <div>
                        <h1
                            class="text-3xl font-bold tracking-tight text-slate-800"
                        >
                            Talent Profile
                        </h1>
                        <p class="mt-2 text-slate-500">
                            Your professional profile synced from GitHub
                        </p>
                    </div>
                </div>

                <!-- Profile Summary Stats -->
                <div class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div
                        class="rounded-lg border border-slate-200 bg-white p-6"
                    >
                        <div
                            class="flex items-center gap-3 text-slate-500 mb-2"
                        >
                            <BookOpen class="h-4 w-4" />
                            <span
                                class="text-xs font-semibold uppercase tracking-wider"
                                >Repositories</span
                            >
                        </div>
                        <p class="text-3xl font-bold text-slate-800">
                            {user?.public_repos || 0}
                        </p>
                    </div>
                    <div
                        class="rounded-lg border border-slate-200 bg-white p-6"
                    >
                        <div
                            class="flex items-center gap-3 text-slate-500 mb-2"
                        >
                            <Users class="h-4 w-4" />
                            <span
                                class="text-xs font-semibold uppercase tracking-wider"
                                >Followers</span
                            >
                        </div>
                        <p class="text-3xl font-bold text-slate-800">
                            {user?.followers || 0}
                        </p>
                    </div>
                    <div
                        class="rounded-lg border border-slate-200 bg-white p-6"
                    >
                        <div
                            class="flex items-center gap-3 text-slate-500 mb-2"
                        >
                            <Star class="h-4 w-4" />
                            <span
                                class="text-xs font-semibold uppercase tracking-wider"
                                >Following</span
                            >
                        </div>
                        <p class="text-3xl font-bold text-slate-800">
                            {user?.following || 0}
                        </p>
                    </div>
                    <div
                        class="rounded-lg border border-slate-200 bg-white p-6"
                    >
                        <div
                            class="flex items-center gap-3 text-slate-500 mb-2"
                        >
                            <Github class="h-4 w-4" />
                            <span
                                class="text-xs font-semibold uppercase tracking-wider"
                                >Gists</span
                            >
                        </div>
                        <p class="text-3xl font-bold text-slate-800">
                            {user?.public_gists || 0}
                        </p>
                    </div>
                </div>

                <!-- Profile Tab Content -->
                {#if activeTab === "profile"}
                    <div class="grid grid-cols-1 gap-6">
                        <!-- Left Column - Profile Card & CV -->
                        <div class="space-y-6">
                            <!-- Profile Card -->
                            <div
                                class="overflow-hidden rounded-lg border border-slate-200 bg-white pb-6"
                            >
                                <div
                                    class="h-24 bg-gradient-to-r from-[#e9ecef] to-[#ced4da]"
                                ></div>
                                <div class="relative px-6 pb-6">
                                    <div
                                        class="absolute -top-12 flex items-end gap-4"
                                    >
                                        <div class="avatar">
                                            <div
                                                class="w-24 rounded-xl ring-4 ring-white"
                                            >
                                                <img
                                                    src={user?.avatar_url ||
                                                        "https://avatars.githubusercontent.com/u/0"}
                                                    alt={user?.name}
                                                    class="bg-slate-100"
                                                />
                                            </div>
                                        </div>
                                        <div class="pb-2 pl-2">
                                            <h2
                                                class="text-xl font-bold text-slate-800"
                                            >
                                                {user?.name || user?.username}
                                            </h2>
                                            <p
                                                class="flex items-center gap-1 text-sm text-slate-500"
                                            >
                                                @{user?.github_username ||
                                                    user?.username}
                                            </p>
                                        </div>
                                    </div>

                                    <div class="mt-16 space-y-3">
                                        {#if user?.bio}
                                            <p class="text-sm text-slate-600">
                                                {user.bio}
                                            </p>
                                        {/if}

                                        <div
                                            class="space-y-2 text-sm text-slate-500"
                                        >
                                            {#if user?.location}
                                                <div
                                                    class="flex items-center gap-2"
                                                >
                                                    <MapPin class="h-4 w-4" />
                                                    <span>{user.location}</span>
                                                </div>
                                            {/if}
                                            {#if user?.blog}
                                                <div
                                                    class="flex items-center gap-2"
                                                >
                                                    <LinkIcon class="h-4 w-4" />
                                                    <a
                                                        href={user.blog.startsWith(
                                                            "http",
                                                        )
                                                            ? user.blog
                                                            : `https://${user.blog}`}
                                                        target="_blank"
                                                        class="text-indigo-600 hover:underline"
                                                        >{user.blog}</a
                                                    >
                                                </div>
                                            {/if}
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <Mail class="h-4 w-4" />
                                                <span
                                                    >{user?.email ||
                                                        "N/A"}</span
                                                >
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- CV Upload Card -->
                            <div
                                class="rounded-lg border border-slate-200 bg-white"
                            >
                                <div class="border-b border-slate-100 p-6">
                                    <h3
                                        class="text-lg font-semibold text-slate-800"
                                    >
                                        Resume / CV
                                    </h3>
                                    <p class="text-xs text-slate-500">
                                        Manage your professional documents
                                    </p>
                                </div>

                                <div class="p-6 space-y-6">
                                    {#if currentCV}
                                        <div class="space-y-3">
                                            <p
                                                class="text-xs font-semibold uppercase tracking-wider text-slate-400"
                                            >
                                                Current active CV
                                            </p>
                                            <div
                                                class="group flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 transition-all hover:bg-indigo-50/50"
                                            >
                                                <div
                                                    class="flex items-center gap-3"
                                                >
                                                    <div
                                                        class="rounded-lg bg-indigo-100 p-2 text-indigo-600"
                                                    >
                                                        <FileText
                                                            class="h-6 w-6"
                                                        />
                                                    </div>
                                                    <div class="min-w-0">
                                                        <p
                                                            class="truncate text-sm font-semibold text-slate-800"
                                                        >
                                                            {currentCV.filename}
                                                        </p>
                                                        <div
                                                            class="flex items-center gap-2"
                                                        >
                                                            <span
                                                                class="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded"
                                                            >
                                                                <CheckCircle2
                                                                    class="h-3 w-3"
                                                                />
                                                                Active
                                                            </span>
                                                            <p
                                                                class="text-[11px] text-slate-500"
                                                            >
                                                                {formatDate(
                                                                    currentCV.created_at,
                                                                )}
                                                                <!-- {new Date(
                                                                    currentCV.created_at,
                                                                ).toLocaleDateString()} -->
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div
                                                    class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                                                >
                                                    <button
                                                        on:click={() =>
                                                            downloadCV(
                                                                currentCV.id,
                                                            )}
                                                        class="btn btn-circle btn-ghost btn-xs text-slate-500 hover:text-indigo-600"
                                                        title="Download"
                                                    >
                                                        <Download
                                                            class="h-4 w-4"
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    {/if}

                                    <div class="relative">
                                        <input
                                            type="file"
                                            id="cv-upload"
                                            accept=".pdf,.doc,.docx"
                                            on:change={handleCVUpload}
                                            class="hidden"
                                            disabled={isLoading}
                                        />

                                        {#if isLoading}
                                            <div
                                                class="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-6"
                                            >
                                                <div
                                                    class="h-2 w-full overflow-hidden rounded-full bg-slate-200"
                                                >
                                                    <div
                                                        class="h-full bg-indigo-600 transition-all duration-300"
                                                        style="width: {uploadProgress}%"
                                                    ></div>
                                                </div>
                                                <p
                                                    class="text-center text-xs font-medium text-slate-600"
                                                >
                                                    Uploading document... {uploadProgress}%
                                                </p>
                                            </div>
                                        {:else}
                                            <label
                                                for="cv-upload"
                                                class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 transition-all hover:border-indigo-300 hover:bg-indigo-50"
                                            >
                                                <div
                                                    class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-110"
                                                >
                                                    <Upload
                                                        class="h-6 w-6 text-indigo-600"
                                                    />
                                                </div>
                                                <span
                                                    class="text-sm font-semibold text-slate-800"
                                                    >Upload new version</span
                                                >
                                                <span
                                                    class="mt-1 text-xs text-slate-500"
                                                    >PDF or DOCX up to 5MB</span
                                                >
                                            </label>
                                        {/if}
                                    </div>

                                    {#if cvVersions.length > 0}
                                        <div class="space-y-4 pt-4">
                                            <div
                                                class="flex items-center gap-2 text-slate-400"
                                            >
                                                <History class="h-4 w-4" />
                                                <p
                                                    class="text-xs font-semibold uppercase tracking-wider"
                                                >
                                                    Version History
                                                </p>
                                            </div>

                                            <div
                                                class="max-h-[300px] space-y-2 overflow-y-auto pr-1 custom-scrollbar"
                                            >
                                                {#each cvVersions.filter((v) => v.id !== currentCV?.id) as version}
                                                    <div
                                                        class="group flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3 transition-all hover:border-slate-200 hover:shadow-sm"
                                                    >
                                                        <div
                                                            class="flex items-center gap-3 overflow-hidden"
                                                        >
                                                            <FileText
                                                                class="h-4 w-4 flex-shrink-0 text-slate-400"
                                                            />
                                                            <div
                                                                class="min-w-0"
                                                            >
                                                                <p
                                                                    class="truncate text-xs font-medium text-slate-700"
                                                                >
                                                                    {version.filename}
                                                                </p>
                                                                <p
                                                                    class="text-[10px] text-slate-400"
                                                                >
                                                                    {new Date(
                                                                        version.uploaded_at,
                                                                    ).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div
                                                            class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                                                        >
                                                            <button
                                                                on:click={() =>
                                                                    downloadCV(
                                                                        version.id,
                                                                    )}
                                                                class="btn btn-ghost btn-xs text-slate-400 hover:text-indigo-600"
                                                                title="Download"
                                                            >
                                                                <Download
                                                                    class="h-3.5 w-3.5"
                                                                />
                                                            </button>
                                                            <button
                                                                on:click={() =>
                                                                    deleteCV(
                                                                        version.id,
                                                                    )}
                                                                class="btn btn-ghost btn-xs text-slate-400 hover:text-rose-600"
                                                                title="Delete"
                                                            >
                                                                <Trash2
                                                                    class="h-3.5 w-3.5"
                                                                />
                                                            </button>
                                                        </div>
                                                    </div>
                                                {/each}
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}

                {#if activeTab === "applications" || activeTab === "saved"}
                    <div
                        class="py-20 text-center text-slate-500 bg-white rounded-2xl border border-slate-200"
                    >
                        <Briefcase
                            class="mx-auto mb-4 h-12 w-12 text-slate-300"
                        />
                        <h3 class="text-lg font-semibold text-slate-800">
                            Feature Coming Soon
                        </h3>
                        <p class="mt-1">
                            Application tracking is currently being integrated.
                        </p>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #cbd5e1;
    }
</style>
