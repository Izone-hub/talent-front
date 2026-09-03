<script>
    import { Building2, Globe, MapPin, Image, Save, RotateCcw } from "lucide-svelte";
    import { settingsService } from "$lib/api/settings.service";
    import { showToast } from "$lib/stores/toast";
    import AdminPageHeader from "$lib/components/ui/AdminPageHeader.svelte";
    import AdminSettingsSkeleton from "$lib/components/ui/skeletons/AdminSettingsSkeleton.svelte";

    let formData = $state({
        company_name: "",
        company_logo: "",
        company_website: "",
        company_location: "",
    });

    let saved = $state(false);
    let loading = $state(true);
    let saving = $state(false);

    // Load settings from API on mount
    $effect(() => {
        loadSettings();
    });

    async function loadSettings() {
        loading = true;
        try {
            const settings = await settingsService.getCompanySettings();
            if (settings) {
                formData = {
                    company_name: settings.company_name || "",
                    company_logo: settings.company_logo || "",
                    company_website: settings.company_website || "",
                    company_location: settings.company_location || "",
                };
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
            showToast("Failed to load settings", "error");
        } finally {
            loading = false;
        }
    }

    async function save() {
        saving = true;
        try {
            await settingsService.updateCompanySettings(formData);
            saved = true;
            showToast("Company settings saved", "success");
            setTimeout(() => (saved = false), 2000);
        } catch (error) {
            console.error("Failed to save settings:", error);
            showToast("Failed to save settings", "error");
        } finally {
            saving = false;
        }
    }

    function resetDefaults() {
        formData = {
            company_name: "iZone Hub",
            company_logo: "",
            company_website: "",
            company_location: "Addis Ababa, Ethiopia",
        };
        showToast("Reset to defaults (save to apply)", "info");
    }
</script>

<div class="space-y-6 max-w-full mx-auto">
    <AdminPageHeader
        title="Settings"
        subtitle="Company info used automatically when posting jobs."
    />

    {#if loading}
        <AdminSettingsSkeleton />
    {:else}
        <!-- Form Card -->
        <div class="bg-white rounded-xl border border-gray-100 p-8 space-y-6">
            <!-- Company Name -->
            <div class="form-control flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-gray-700" for="sett-company-name">
                    Company Name
                </label>
                <div class="relative">
                    <Building2 size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        id="sett-company-name"
                        type="text"
                        placeholder="iZone Hub"
                        class="input w-full pl-10 bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-600 rounded-xl"
                        bind:value={formData.company_name}
                    />
                </div>
                <p class="text-xs text-gray-400">Auto-filled in every new job post</p>
            </div>

            <!-- Logo URL -->
            <div class="form-control flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-gray-700" for="sett-company-logo">
                    Company Logo URL
                </label>
                <div class="relative">
                    <Image size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        id="sett-company-logo"
                        type="text"
                        placeholder="https://logo.url/image.png"
                        class="input w-full pl-10 bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-600 rounded-xl"
                        bind:value={formData.company_logo}
                    />
                </div>
                {#if formData.company_logo}
                    <div class="mt-2 flex items-center gap-3">
                        <img
                            src={formData.company_logo}
                            alt="Logo preview"
                            class="w-10 h-10 rounded-lg object-cover ring-1 ring-gray-200"
                            onerror={(e) => (e.target.style.display = "none")}
                        />
                        <span class="text-xs text-gray-400">Preview</span>
                    </div>
                {/if}
            </div>

            <!-- Website -->
            <div class="form-control flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-gray-700" for="sett-company-website">
                    Company Website
                </label>
                <div class="relative">
                    <Globe size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        id="sett-company-website"
                        type="url"
                        placeholder="https://example.com"
                        class="input w-full pl-10 bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-600 rounded-xl"
                        bind:value={formData.company_website}
                    />
                </div>
            </div>

            <!-- Default Location -->
            <div class="form-control flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-gray-700" for="sett-company-location">
                    Default Job Location
                </label>
                <div class="relative">
                    <MapPin size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        id="sett-company-location"
                        type="text"
                        placeholder="Addis Ababa, Ethiopia"
                        class="input w-full pl-10 bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-600 rounded-xl"
                        bind:value={formData.company_location}
                    />
                </div>
                <p class="text-xs text-gray-400">Used as the default location for new job posts</p>
            </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between">
            <button
                type="button"
                class="btn btn-ghost gap-2 text-gray-500"
                onclick={resetDefaults}
            >
                <RotateCcw size={16} />
                Reset Defaults
            </button>
            <button
                type="button"
                class="btn bg-purple-600 hover:bg-purple-700 border-none text-white gap-2 rounded-xl shadow-lg shadow-purple-100 {saved ? 'btn-success' : ''}"
                onclick={save}
                disabled={saving}
            >
                {#if saving}
                    <span class="loading loading-spinner loading-sm"></span>
                    Saving...
                {:else}
                    <Save size={16} />
                    {saved ? "Saved!" : "Save Settings"}
                {/if}
            </button>
        </div>
    {/if}
</div>
