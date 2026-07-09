<script>
    import { XCircle, Globe, MapPin, Building2, Image, AlertCircle } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";
    import { jobService } from "$lib/api/job.service";

    const dispatch = createEventDispatcher();

    export let isOpen = false;
    export let jobData = {
        title: "",
        company: "",
        company_logo: "",
        company_website: "",
        company_location: "",
        description: "",
        requirements: "",
        responsibilities: "",
        benefits: "",
        job_type: "full-time",
        experience_level: "entry",
        location: "",
        remote_possible: false,
        salary_min: null,
        salary_max: null,
        salary_currency: "USD",
        expires_at: "",
    };

    let errors = {};
    let submitted = false;

    function close() {
        errors = {};
        submitted = false;
        dispatch("close");
    }

    function validate() {
        const e = {};
        if (!jobData.title || !jobData.title.trim()) {
            e.title = "Job title is required";
        } else if (jobData.title.trim().length < 3) {
            e.title = "Job title must be at least 3 characters";
        } else if (jobData.title.trim().length > 200) {
            e.title = "Job title must be less than 200 characters";
        }

        if (!jobData.company || !jobData.company.trim()) {
            e.company = "Company name is required";
        }

        if (jobData.company_website && jobData.company_website.trim()) {
            try {
                new URL(jobData.company_website);
            } catch {
                e.company_website = "Enter a valid URL (e.g. https://example.com)";
            }
        }

        if (!jobData.description || !jobData.description.trim()) {
            e.description = "Job description is required";
        } else if (jobData.description.trim().length < 50) {
            e.description = "Description must be at least 50 characters";
        }

        if (!jobData.requirements || !jobData.requirements.trim()) {
            e.requirements = "Requirements are required";
        } else if (jobData.requirements.trim().length < 20) {
            e.requirements = "Requirements must be at least 20 characters";
        }

        const sMin = jobData.salary_min ? parseInt(jobData.salary_min, 10) : null;
        const sMax = jobData.salary_max ? parseInt(jobData.salary_max, 10) : null;
        if (sMin !== null && sMin < 0) {
            e.salary_min = "Minimum salary cannot be negative";
        }
        if (sMax !== null && sMax < 0) {
            e.salary_max = "Maximum salary cannot be negative";
        }
        if (sMin !== null && sMax !== null && sMin > sMax) {
            e.salary_max = "Max salary must be greater than or equal to min salary";
        }

        if (jobData.expires_at) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiry = new Date(jobData.expires_at);
            if (expiry <= today) {
                e.expires_at = "Expiration date must be in the future";
            }
        }

        return e;
    }

    function getFieldClass(field) {
        const base = "input w-full bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-600 rounded-xl";
        return errors[field] && submitted ? base + " ring-2 ring-red-400 focus:ring-red-500" : base;
    }

    function getTextareaClass(field) {
        const base = "textarea bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-600 rounded-lg w-full";
        return errors[field] && submitted ? base + " ring-2 ring-red-400 focus:ring-red-500" : base;
    }

    function submit(e) {
        e.preventDefault();
        submitted = true;
        errors = validate();
        if (Object.keys(errors).length > 0) return;

        // Convert empty strings to null for optional pointer fields if needed by API
        const payload = { ...jobData };
        if (!payload.company_logo) payload.company_logo = null;
        if (!payload.company_website) payload.company_website = null;
        if (!payload.company_location) payload.company_location = null;
        if (!payload.responsibilities) payload.responsibilities = null;
        if (!payload.benefits) payload.benefits = null;
        if (!payload.location) payload.location = null;

        if (!payload.expires_at) {
            payload.expires_at = null;
        } else if (payload.expires_at.length === 10) {
            // YYYY-MM-DD to ISO RFC3339 format
            payload.expires_at = payload.expires_at + "T23:59:59Z";
        }

        if (payload.salary_min)
            payload.salary_min = parseInt(payload.salary_min, 10);
        else payload.salary_min = null;

        if (payload.salary_max)
            payload.salary_max = parseInt(payload.salary_max, 10);
        else payload.salary_max = null;

        if (!payload.salary_currency) payload.salary_currency = "USD";

        payload.status = "draft";

        dispatch("submit", payload);
    }
</script>

{#if isOpen}
    <div
        class="modal modal-open bg-black/40 backdrop-blur-sm transition-all duration-300 z-[100]"
    >
        <div
            class="modal-box max-w-5xl rounded-lg p-0 overflow-hidden border-none scale-95"
        >
            <!-- Modal Header -->
            <div class="bg-purple-600 p-8 text-white relative">
                <h3 class="text-2xl font-bold font-display">
                    Post a New Opportunity
                </h3>
                <p class="text-purple-100 text-sm mt-1">
                    Provide detailed information to find the perfect candidate.
                </p>
                <button
                    class="absolute top-8 right-8 text-white/80 hover:text-white transition-transform hover:rotate-90"
                    onclick={close}
                    type="button"
                    aria-label="Close modal"
                >
                    <XCircle size={24} />
                </button>
            </div>

            <!-- Modal Body -->
            <div
                class="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar text-gray-700 bg-white"
            >
                <form onsubmit={submit} class="space-y-8">
                    <!-- Section: Basic Job Info -->
                    <div>
                        <h4
                            class="text-xs font-bold uppercase tracking-widest text-purple-600 mb-4 flex items-center gap-2"
                        >
                            <Building2 size={14} /> Basic Information
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div class="form-control flex flex-col gap-2">
                                <label
                                    class="label text-sm font-semibold text-gray-600 pb-1"
                                    for="job-title">Job Title *</label
                                >
                                <input
                                    id="job-title"
                                    type="text"
                                    placeholder="e.g. Senior Frontend Engineer"
                                    class={getFieldClass("title")}
                                    bind:value={jobData.title}
                                    required
                                />
                                {#if errors.title && submitted}
                                    <span class="text-xs text-red-500 flex items-center gap-1 mt-1">
                                        <AlertCircle size={12} />{errors.title}
                                    </span>
                                {/if}
                            </div>
                            <div class="form-control flex flex-col gap-2">
                                <label
                                    class="label text-sm font-semibold text-gray-600 pb-1"
                                    for="location"
                                    >Job Location (Personal)</label
                                >
                                <input
                                    id="location"
                                    type="text"
                                    placeholder="Addis Ababa, Ethiopia"
                                    class="input w-full bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-600 rounded-xl"
                                    bind:value={jobData.location}
                                />
                            </div>
                            <div class="form-control flex flex-col gap-2">
                                <label
                                    class="label text-sm font-semibold text-gray-600 pb-1"
                                    for="job-type">Job Type</label
                                >
                                <select
                                    id="job-type"
                                    class="select w-full bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-600 rounded-xl"
                                    bind:value={jobData.job_type}
                                >
                                    <option value="full-time">Full-time</option>
                                    <option value="part-time">Part-time</option>
                                    <option value="contract">Contract</option>
                                    <option value="freelance">Freelance</option>
                                    <option value="internship"
                                        >Internship</option
                                    >
                                </select>
                            </div>
                            <div class="form-control flex flex-col gap-2">
                                <label
                                    class="label text-sm font-semibold text-gray-600 pb-1"
                                    for="experience-level"
                                    >Experience Level</label
                                >
                                <select
                                    id="experience-level"
                                    class="select w-full bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-600 rounded-xl"
                                    bind:value={jobData.experience_level}
                                >
                                    <option value="entry">Entry</option>
                                    <option value="junior">Junior</option>
                                    <option value="mid">Mid</option>
                                    <option value="senior">Senior</option>
                                    <option value="lead">Lead</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Section: Company Details -->
                    <div>
                        <h4
                            class="text-xs font-bold uppercase tracking-widest text-purple-600 mb-4"
                        >
                            Company Details
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div class="form-control flex flex-col gap-2">
                                <label
                                    class="label text-sm font-semibold text-gray-600 pb-1"
                                    for="company-name">Company Name *</label
                                >
                                <input
                                    id="company-name"
                                    type="text"
                                    placeholder="iZone Hub"
                                    class={getFieldClass("company")}
                                    bind:value={jobData.company}
                                    required
                                />
                                {#if errors.company && submitted}
                                    <span class="text-xs text-red-500 flex items-center gap-1 mt-1">
                                        <AlertCircle size={12} />{errors.company}
                                    </span>
                                {/if}
                            </div>
                            <div class="form-control flex flex-col gap-2">
                                <label
                                    class="label text-sm font-semibold text-gray-600 pb-1"
                                    for="company-website">Company Website</label
                                >
                                <div class="relative">
                                    <Globe
                                        size={16}
                                        class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        id="company-website"
                                        type="url"
                                        placeholder="https://example.com"
                                        class={getFieldClass("company_website") + " pl-10"}
                                        bind:value={jobData.company_website}
                                    />
                                </div>
                                {#if errors.company_website && submitted}
                                    <span class="text-xs text-red-500 flex items-center gap-1 mt-1">
                                        <AlertCircle size={12} />{errors.company_website}
                                    </span>
                                {/if}
                            </div>
                            <div class="form-control flex flex-col gap-2">
                                <label
                                    class="label text-sm font-semibold text-gray-600 pb-1"
                                    for="company-location"
                                    >Company Headquarters</label
                                >
                                <div class="relative">
                                    <MapPin
                                        size={16}
                                        class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        id="company-location"
                                        type="text"
                                        placeholder="Bole, Addis Ababa"
                                        class="input w-full pl-10 bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-600 rounded-xl"
                                        bind:value={jobData.company_location}
                                    />
                                </div>
                            </div>
                            <div class="form-control flex flex-col gap-2">
                                <label
                                    class="label text-sm font-semibold text-gray-600 pb-1"
                                    for="company-logo">Company Logo URL</label
                                >
                                <div class="relative">
                                    <Image
                                        size={16}
                                        class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        id="company-logo"
                                        type="text"
                                        placeholder="https://logo.url/image.png"
                                        class="input w-full pl-10 bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-600 rounded-xl"
                                        bind:value={jobData.company_logo}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Section: Job Content -->
                    <div>
                        <h4
                            class="text-xs font-bold uppercase tracking-widest text-purple-600 mb-4"
                        >
                            Content & Requirements
                        </h4>
                        <div class="space-y-5">
                            <div class="form-control flex flex-col gap-2">
                                <label
                                    class="label text-sm font-semibold text-gray-600 pb-1"
                                    for="description">Job Description *</label
                                >
                                <textarea
                                    id="description"
                                    class={getTextareaClass("description") + " h-32"}
                                    placeholder="Provide a comprehensive job description..."
                                    bind:value={jobData.description}
                                    required
                                ></textarea>
                                {#if errors.description && submitted}
                                    <span class="text-xs text-red-500 flex items-center gap-1 mt-1">
                                        <AlertCircle size={12} />{errors.description}
                                    </span>
                                {/if}
                            </div>
                            <div class="form-control flex flex-col gap-2">
                                <label
                                    class="label text-sm font-semibold text-gray-600 pb-1"
                                    for="requirements">Requirements *</label
                                >
                                <textarea
                                    id="requirements"
                                    class={getTextareaClass("requirements") + " h-24"}
                                    placeholder="List key skills and qualifications..."
                                    bind:value={jobData.requirements}
                                    required
                                ></textarea>
                                {#if errors.requirements && submitted}
                                    <span class="text-xs text-red-500 flex items-center gap-1 mt-1">
                                        <AlertCircle size={12} />{errors.requirements}
                                    </span>
                                {/if}
                            </div>
                            <div class="form-control flex flex-col gap-2">
                                <label
                                    class="label text-sm font-semibold text-gray-600 pb-1"
                                    for="responsibilities"
                                    >Responsibilities</label
                                >
                                <textarea
                                    id="responsibilities"
                                    class="textarea bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-600 h-24 rounded-lg w-full"
                                    placeholder="What will they be doing daily?"
                                    bind:value={jobData.responsibilities}
                                ></textarea>
                            </div>
                            <div class="form-control flex flex-col gap-2">
                                <label
                                    class="label text-sm font-semibold text-gray-600 pb-1"
                                    for="benefits">Benefits</label
                                >
                                <textarea
                                    id="benefits"
                                    class="textarea bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-600 h-24 rounded-lg w-full"
                                    placeholder="Health insurance, PTO, Remote work, etc."
                                    bind:value={jobData.benefits}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Section: Compensation & Closing -->
                    <div class="grid grid-cols-1 gap-8 pt-4">
                        <div
                            class="bg-gray-50 p-6 rounded-2xl ring-1 ring-gray-100 h-fit"
                        >
                            <label
                                class="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-4"
                                for="remote-possible"
                                >Environment & Compensation</label
                            >
                            <div class="flex items-center gap-3 mb-6">
                                <input
                                    id="remote-possible"
                                    type="checkbox"
                                    class="checkbox checkbox-primary rounded-md"
                                    bind:checked={jobData.remote_possible}
                                />
                                <label
                                    class="text-sm font-semibold text-gray-700 cursor-pointer"
                                    for="remote-possible">Remote Possible</label
                                >
                            </div>

                            <div class="space-y-4">
                                <div class="flex items-center gap-3">
                                    <div class="flex-1">
                                        <label
                                            class="text-[10px] font-bold text-gray-400 uppercase ml-1"
                                            for="salary-min">Min Salary</label
                                        >
                                        <input
                                            id="salary-min"
                                            type="number"
                                            placeholder="0"
                                            class="input input-sm w-full bg-white border-none ring-1 ring-gray-200 rounded-lg text-sm"
                                            class:ring-2={errors.salary_min && submitted}
                                            class:ring-red-400={errors.salary_min && submitted}
                                            bind:value={jobData.salary_min}
                                        />
                                        {#if errors.salary_min && submitted}
                                            <span class="text-xs text-red-500 flex items-center gap-1 mt-1">
                                                <AlertCircle size={12} />{errors.salary_min}
                                            </span>
                                        {/if}
                                    </div>
                                    <span class="text-gray-300 mt-5">—</span>
                                    <div class="flex-1">
                                        <label
                                            class="text-[10px] font-bold text-gray-400 uppercase ml-1"
                                            for="salary-max">Max Salary</label
                                        >
                                        <input
                                            id="salary-max"
                                            type="number"
                                            placeholder="0"
                                            class="input input-sm w-full bg-white border-none ring-1 ring-gray-200 rounded-lg text-sm"
                                            class:ring-2={errors.salary_max && submitted}
                                            class:ring-red-400={errors.salary_max && submitted}
                                            bind:value={jobData.salary_max}
                                        />
                                        {#if errors.salary_max && submitted}
                                            <span class="text-xs text-red-500 flex items-center gap-1 mt-1">
                                                <AlertCircle size={12} />{errors.salary_max}
                                            </span>
                                        {/if}
                                    </div>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label
                                        class="text-sm font-semibold text-gray-600"
                                        for="currency">Currency</label
                                    >
                                    <select
                                        id="currency"
                                        class="select select-sm select-ghost font-bold text-purple-600 focus:ring-0"
                                        bind:value={jobData.salary_currency}
                                    >
                                        <option value="USD">USD</option>
                                        <option value="ETB">ETB</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="form-control">
                            <h4
                                class="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 block"
                            >
                                Listing Expiration
                            </h4>
                            <div class="flex flex-col gap-2">
                                <label
                                    class="label text-sm font-semibold text-gray-600 pb-1"
                                    for="expires-at">Expires At</label
                                >
                                <input
                                    id="expires-at"
                                    type="date"
                                    class="input bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-600 rounded-xl"
                                    class:ring-2={errors.expires_at && submitted}
                                    class:ring-red-400={errors.expires_at && submitted}
                                    bind:value={jobData.expires_at}
                                />
                                {#if errors.expires_at && submitted}
                                    <span class="text-xs text-red-500 flex items-center gap-1 mt-1">
                                        <AlertCircle size={12} />{errors.expires_at}
                                    </span>
                                {/if}
                            </div>
                            <p
                                class="text-[11px] text-gray-400 mt-2 px-1 italic"
                            >
                                When should this job posting be automatically
                                removed?
                            </p>
                        </div>
                    </div>
                </form>
            </div>

            <!-- Modal Action -->
            <div
                class="p-8 bg-gray-50/50 flex justify-end gap-3 border-t border-gray-100"
            >
                <button
                    type="button"
                    class="btn btn-ghost rounded-lg px-6 font-bold text-gray-500 hover:bg-gray-100"
                    onclick={close}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    class="btn btn-primary bg-purple-600 hover:bg-purple-700 border-none px-10 rounded-lg shadow-lg shadow-purple-100 font-bold"
                    onclick={submit}
                >
                    Create Job Post
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #ddd;
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #ccc;
    }

    .font-display {
        font-family: "Inter", sans-serif;
    }
</style>
