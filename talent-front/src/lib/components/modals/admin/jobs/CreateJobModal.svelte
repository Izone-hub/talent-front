<script>
    import {
        XCircle,
        Sparkles,
        ArrowRight,
        ArrowLeft,
        Check,
        Heart,
        PiggyBank,
        Home,
        Clock,
        Umbrella,
        TrendingUp,
        GraduationCap,
        Dumbbell,
        Calendar,
        Zap,
    } from "lucide-svelte";
    import { jobService } from "$lib/api/job.service";
    import { jobDescriptionService } from "$lib/api/jobDescription.service";
    import { showToast } from "$lib/stores/toast";
    import { companySettings } from "$lib/stores/companySettings";

    let {
        isOpen = false,
        onclose = () => {},
        onsubmit = (data) => {},
        jobData = {
            title: "",
            description: "",
            requirements: "",
            responsibilities: "",
            benefits: "",
            job_type: "",
            category: "",
            experience_level: "",
            location: "",
            remote_possible: false,
            salary_min: null,
            salary_max: null,
            salary_currency: "",
            expires_at: "",
        },
    } = $props();

    let currentStep = $state(1);
    const totalSteps = 4;

    let showAiPrompt = $state(false);
    let aiPrompt = $state("");
    let aiGenerating = $state(false);

    let requirementTags = $state([]);
    let newTagInput = $state("");
    let selectedBenefits = $state([]);

    const benefitOptions = [
        { id: "health", label: "Health Insurance", icon: Heart },
        { id: "401k", label: "401(k) Matching", icon: PiggyBank },
        { id: "remote", label: "Remote Work", icon: Home },
        { id: "flexible", label: "Flexible Hours", icon: Clock },
        { id: "pto", label: "Paid Time Off", icon: Umbrella },
        { id: "stock", label: "Stock Options", icon: TrendingUp },
        { id: "learning", label: "Learning Budget", icon: GraduationCap },
        { id: "gym", label: "Gym Membership", icon: Dumbbell },
    ];

    const suggestedTags = [
        "React",
        "TypeScript",
        "Node.js",
        "Python",
        "AWS",
        "Docker",
        "PostgreSQL",
        "GraphQL",
        "Git",
        "REST APIs",
    ];

    let stepErrors = $state({});
    let enhancing = $state(false);

    function close() {
        showAiPrompt = false;
        aiPrompt = "";
        currentStep = 1;
        stepErrors = {};
        onclose();
    }

    async function generateWithAi() {
        if (!aiPrompt.trim()) return;
        aiGenerating = true;
        try {
            const data = await jobDescriptionService.generate(aiPrompt);
            let parsed = data.job_description;
            if (parsed && typeof parsed === "object" && parsed.raw) {
                try {
                    parsed = JSON.parse(parsed.raw);
                } catch {}
            }
            if (parsed && typeof parsed === "object") {
                if (parsed.title) jobData.title = parsed.title;
                if (parsed.description) jobData.description = parsed.description;
                if (parsed.requirements) {
                    jobData.requirements = parsed.requirements;
                    requirementTags = parsed.requirements
                        .split("\n")
                        .map((r) => r.trim())
                        .filter(Boolean);
                }
                if (parsed.responsibilities)
                    jobData.responsibilities = parsed.responsibilities;
                if (parsed.benefits) {
                    jobData.benefits = parsed.benefits;
                    selectedBenefits = parsed.benefits
                        .split(",")
                        .map((b) => b.trim())
                        .filter(Boolean);
                }
                if (parsed.job_type) jobData.job_type = parsed.job_type;
                if (parsed.experience_level)
                    jobData.experience_level = parsed.experience_level;
                if (parsed.location) jobData.location = parsed.location;
                if (typeof parsed.remote_possible === "boolean")
                    jobData.remote_possible = parsed.remote_possible;
                if (parsed.salary_min) jobData.salary_min = parsed.salary_min;
                if (parsed.salary_max) jobData.salary_max = parsed.salary_max;
                if (parsed.salary_currency)
                    jobData.salary_currency = parsed.salary_currency;
            }
            showAiPrompt = false;
            aiPrompt = "";
            showToast("Job description generated successfully", "success");
        } catch (error) {
            showToast(error.message || "Failed to generate", "error");
        } finally {
            aiGenerating = false;
        }
    }

    function handleAiKeydown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            generateWithAi();
        }
    }

    async function enhanceWithAi() {
        enhancing = true;
        try {
            const payload = {
                title: jobData.title,
                description: jobData.description,
                requirements: requirementTags.join(", "),
                responsibilities: jobData.responsibilities || "",
                benefits: selectedBenefits.join(", "),
                job_type: jobData.job_type,
                category: jobData.category,
                experience_level: jobData.experience_level,
                salary_min: jobData.salary_min,
                salary_max: jobData.salary_max,
                salary_currency: jobData.salary_currency,
                remote_possible: jobData.remote_possible,
            };

            const data = await jobDescriptionService.enhanceJobPost(payload);
            const parsed = data.response || data.job_description;
            let raw = parsed;
            if (raw && typeof raw === "object" && raw.raw) {
                raw = raw.raw;
            }
            if (typeof raw === "string") {
                raw = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
                try { raw = JSON.parse(raw); } catch {}
            }
            if (raw && typeof raw === "object") {
                const title = raw.title || raw.job_title;
                if (title) jobData.title = title;
                if (raw.description) jobData.description = raw.description;
                if (raw.requirements) {
                    const reqs = Array.isArray(raw.requirements) ? raw.requirements : raw.requirements.split("\n");
                    const cleaned = reqs.map((r) => r.trim().replace(/^[-•*]\s*/, "")).filter(Boolean);
                    jobData.requirements = cleaned.join("\n");
                    requirementTags = cleaned;
                }
                if (raw.responsibilities) {
                    const resp = Array.isArray(raw.responsibilities) ? raw.responsibilities : raw.responsibilities.split("\n");
                    jobData.responsibilities = resp.map((r) => r.trim()).filter(Boolean).join("\n");
                }
                if (raw.benefits) {
                    const bens = Array.isArray(raw.benefits) ? raw.benefits : raw.benefits.split(",");
                    const cleaned = bens.map((b) => b.trim()).filter(Boolean);
                    jobData.benefits = cleaned.join(", ");
                    selectedBenefits = cleaned;
                }
                if (raw.job_type) jobData.job_type = raw.job_type;
                if (raw.experience_level) jobData.experience_level = raw.experience_level;
                if (typeof raw.remote_possible === "boolean") jobData.remote_possible = raw.remote_possible;
                if (raw.salary_min) jobData.salary_min = raw.salary_min;
                if (raw.salary_max) jobData.salary_max = raw.salary_max;
                if (raw.salary_currency) jobData.salary_currency = raw.salary_currency;
                showToast("Job posting enhanced with AI", "success");
            } else {
                showToast("AI returned unexpected format", "error");
            }
        } catch (error) {
            showToast(error.message || "Failed to enhance", "error");
        } finally {
            enhancing = false;
        }
    }

    function addTag(text) {
        const trimmed = text.trim();
        if (trimmed && !requirementTags.includes(trimmed)) {
            requirementTags = [...requirementTags, trimmed];
            syncRequirements();
        }
    }

    function removeTag(text) {
        requirementTags = requirementTags.filter((t) => t !== text);
        syncRequirements();
    }

    function syncRequirements() {
        jobData.requirements = requirementTags.join("\n");
    }

    function handleTagKeydown(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            if (newTagInput.trim()) {
                addTag(newTagInput);
                newTagInput = "";
            }
        }
    }

    function toggleBenefit(benefitId) {
        const bLabel = benefitOptions.find((b) => b.id === benefitId)?.label;
        if (selectedBenefits.includes(bLabel)) {
            selectedBenefits = selectedBenefits.filter((b) => b !== bLabel);
        } else {
            selectedBenefits = [...selectedBenefits, bLabel];
        }
        jobData.benefits = selectedBenefits.join(", ");
    }

    function validateStep(step) {
        const errors = {};
        if (step === 1) {
            if (!jobData.title.trim()) errors.title = "Job title is required";
            if (!jobData.description.trim())
                errors.description = "Job description is required";
        }
        if (step === 2) {
            if (requirementTags.length === 0)
                errors.requirements = "Add at least one requirement";
        }
        if (step === 3) {
            if (
                jobData.salary_min &&
                jobData.salary_max &&
                Number(jobData.salary_min) > Number(jobData.salary_max)
            ) {
                errors.salary = "Maximum salary must be greater than minimum";
            }
        }
        stepErrors = errors;
        return Object.keys(errors).length === 0;
    }

    function nextStep() {
        if (validateStep(currentStep) && currentStep < totalSteps) {
            currentStep++;
            stepErrors = {};
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
            stepErrors = {};
        }
    }

    function submit(e) {
        e.preventDefault();
        if (!validateStep(currentStep)) return;

        let settings = {};
        const unsub = companySettings.subscribe((v) => (settings = v));
        unsub();

        const payload = { ...jobData };
        payload.company = settings.company_name || "";
        payload.company_logo = settings.company_logo || null;
        payload.company_website = settings.company_website || null;
        payload.company_location = settings.company_location || null;
        payload.location = settings.company_location || null;
        if (!payload.responsibilities) payload.responsibilities = null;
        if (!payload.benefits) payload.benefits = null;

        if (!payload.expires_at) {
            payload.expires_at = null;
        } else if (payload.expires_at.length === 10) {
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

        onsubmit(payload);
    }

    function goToStep(step) {
        if (step <= currentStep || step === currentStep + 1) {
            if (step < currentStep) {
                currentStep = step;
                stepErrors = {};
            } else if (validateStep(currentStep)) {
                currentStep = step;
                stepErrors = {};
            }
        }
    }

    const stepLabels = ["Job Details", "Requirements", "Compensation", "Publishing"];
</script>

{#if isOpen}
    <div
        class="modal modal-open bg-black/50 backdrop-blur-sm z-[100]"
        onclick={close}
    >
        <div
            class="modal-box max-w-3xl rounded-2xl p-0 overflow-hidden border border-base-200 shadow-2xl"
            onclick={(e) => e.stopPropagation()}
        >
            <!-- Modal Header -->
            <div class="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6 text-white relative">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-xs font-semibold mb-2">
                            <Zap size={12} />
                            Post a Job
                        </div>
                        <h3 class="text-xl font-bold">Find Your Next Great Hire</h3>
                        <p class="text-purple-200 text-sm mt-0.5">
                            Create a compelling job posting that attracts top talent
                        </p>
                    </div>
                    <button
                        class="text-white/70 hover:text-white transition-all hover:rotate-90 p-1"
                        onclick={close}
                        type="button"
                        aria-label="Close modal"
                    >
                        <XCircle size={22} />
                    </button>
                </div>
            </div>

            <!-- Step Progress -->
            <div class="bg-white px-8 pt-6 pb-2">
                <div class="flex items-center justify-between relative">
                    <div class="absolute top-5 left-8 right-8 h-0.5 bg-base-200 z-0"></div>
                    <div
                        class="absolute top-5 left-8 h-0.5 bg-purple-500 z-0 transition-all duration-500"
                        style="width: {((currentStep - 1) / (totalSteps - 1)) * 100}%"
                    ></div>
                    {#each stepLabels as label, i}
                        {@const stepNum = i + 1}
                        <button
                            class="flex flex-col items-center gap-1.5 z-10 cursor-pointer group"
                            onclick={() => goToStep(stepNum)}
                            type="button"
                        >
                            <div
                                class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2
                                {stepNum === currentStep
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200'
                                    : stepNum < currentStep
                                        ? 'bg-emerald-500 text-white border-emerald-500'
                                        : 'bg-base-200 text-base-content/50 border-base-200 group-hover:border-purple-300'}"
                            >
                                {#if stepNum < currentStep}
                                    <Check size={16} />
                                {:else}
                                    {stepNum}
                                {/if}
                            </div>
                            <span
                                class="text-xs font-semibold transition-colors
                                {stepNum === currentStep
                                    ? 'text-purple-700'
                                    : stepNum < currentStep
                                        ? 'text-emerald-600'
                                        : 'text-base-content/40'}"
                            >
                                {label}
                            </span>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Modal Body -->
            <div class="px-8 py-6 max-h-[55vh] overflow-y-auto custom-scrollbar">
                <form onsubmit={submit}>
                    <!-- Step 1: Job Details -->
                    {#if currentStep === 1}
                        <div class="animate-fadeIn">
                            <h4 class="text-lg font-bold text-base-content mb-1">Job Details</h4>
                            <p class="text-sm text-base-content/50 mb-6">
                                Tell candidates what this role is about
                            </p>

                            <div class="space-y-5">
                                <!-- Job Title -->
                                <div class="form-control flex flex-col gap-1.5">
                                    <label class="text-sm font-semibold text-base-content" for="job-title">
                                        Job Title <span class="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="job-title"
                                        type="text"
                                        placeholder="e.g. Senior Software Engineer"
                                        class="input w-full bg-base-100 border-base-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 rounded-xl text-sm"
                                        bind:value={jobData.title}
                                    />
                                    {#if stepErrors.title}
                                        <p class="text-xs text-red-500">{stepErrors.title}</p>
                                    {/if}
                                    <p class="text-xs text-base-content/40">
                                        Be specific — use keywords candidates search for
                                    </p>
                                </div>

                                <!-- Job Description -->
                                <div class="form-control flex flex-col gap-1.5">
                                    <div class="flex items-center justify-between">
                                        <label class="text-sm font-semibold text-base-content" for="description">
                                            Job Description <span class="text-red-500">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            class="btn btn-xs btn-outline border-purple-200 text-purple-600 hover:bg-purple-50 gap-1"
                                            onclick={() => (showAiPrompt = !showAiPrompt)}
                                        >
                                            <Sparkles size={12} />
                                            Generate with AI
                                        </button>
                                    </div>
                                    {#if showAiPrompt}
                                        <div class="flex gap-2 items-center p-3 bg-purple-50 rounded-xl border border-purple-100">
                                            <input
                                                type="text"
                                                class="input input-sm flex-1 bg-white border-purple-200 focus:border-purple-500 text-sm"
                                                placeholder="e.g. Senior Backend Developer with Go experience..."
                                                bind:value={aiPrompt}
                                                onkeydown={handleAiKeydown}
                                                disabled={aiGenerating}
                                            />
                                            {#if aiGenerating}
                                                <span class="loading loading-spinner loading-sm text-purple-600"></span>
                                            {/if}
                                        </div>
                                        <p class="text-[11px] text-base-content/40 -mt-1">
                                            Press <kbd class="kbd kbd-xs">Enter</kbd> to generate
                                        </p>
                                    {/if}
                                    <textarea
                                        id="description"
                                        class="textarea bg-base-100 border-base-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 h-32 rounded-xl w-full text-sm"
                                        placeholder="Describe the role, team, culture, and what makes this opportunity unique..."
                                        bind:value={jobData.description}
                                    ></textarea>
                                    {#if stepErrors.description}
                                        <p class="text-xs text-red-500">{stepErrors.description}</p>
                                    {/if}
                                    <p class="text-xs text-base-content/40 flex items-center gap-1">
                                        <Sparkles size={11} class="text-amber-500" />
                                        Tip: Include company culture, team dynamics, and growth opportunities
                                    </p>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Step 2: Requirements -->
                    {#if currentStep === 2}
                        <div class="animate-fadeIn">
                            <h4 class="text-lg font-bold text-base-content mb-1">Requirements & Responsibilities</h4>
                            <p class="text-sm text-base-content/50 mb-6">
                                Define what candidates need and what they'll do
                            </p>

                            <div class="space-y-5">
                                <!-- Requirements Tags -->
                                <div class="form-control flex flex-col gap-1.5">
                                    <label class="text-sm font-semibold text-base-content">
                                        Key Requirements <span class="text-red-500">*</span>
                                    </label>
                                    <div class="border-2 border-dashed border-base-300 rounded-xl p-3 bg-base-100 focus-within:border-purple-500 focus-within:bg-white transition-all">
                                        <div class="flex flex-wrap gap-2 items-center min-h-[44px]">
                                            {#each requirementTags as tag}
                                                <span class="inline-flex items-center gap-1.5 bg-purple-600 text-white rounded-full px-3 py-1 text-xs font-medium animate-popIn">
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        class="opacity-70 hover:opacity-100 transition-opacity hover:rotate-90"
                                                        onclick={() => removeTag(tag)}
                                                    >
                                                        <XCircle size={13} />
                                                    </button>
                                                </span>
                                            {/each}
                                            <input
                                                type="text"
                                                class="flex-1 min-w-[140px] border-none outline-none bg-transparent text-sm py-1 placeholder:text-base-content/30"
                                                placeholder={requirementTags.length === 0
                                                    ? "Type a requirement and press Enter..."
                                                    : "Add another..."}
                                                bind:value={newTagInput}
                                                onkeydown={handleTagKeydown}
                                            />
                                        </div>
                                    </div>
                                    {#if stepErrors.requirements}
                                        <p class="text-xs text-red-500">{stepErrors.requirements}</p>
                                    {/if}
                                    <p class="text-xs text-base-content/40">
                                        Press <kbd class="kbd kbd-xs">Enter</kbd> to add each requirement as a tag
                                    </p>
                                    <!-- Suggestions -->
                                    <div class="flex flex-wrap gap-1.5 mt-1">
                                        {#each suggestedTags as sTag}
                                            <button
                                                type="button"
                                                class="px-2.5 py-0.5 bg-base-200 hover:bg-purple-600 hover:text-white rounded-full text-[11px] text-base-content/60 transition-all border border-transparent hover:border-purple-400 hover:-translate-y-0.5"
                                                onclick={() => addTag(sTag)}
                                            >
                                                + {sTag}
                                            </button>
                                        {/each}
                                    </div>
                                </div>

                                <!-- Responsibilities -->
                                <div class="form-control flex flex-col gap-1.5">
                                    <label class="text-sm font-semibold text-base-content" for="responsibilities">
                                        Responsibilities
                                    </label>
                                    <textarea
                                        id="responsibilities"
                                        class="textarea bg-base-100 border-base-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 h-28 rounded-xl w-full text-sm"
                                        placeholder="• Lead technical architecture decisions&#10;• Mentor junior developers&#10;• Collaborate with product team"
                                        bind:value={jobData.responsibilities}
                                    ></textarea>
                                    <p class="text-xs text-base-content/40">
                                        Separate each responsibility with a new line
                                    </p>
                                </div>

                                <!-- Benefits Grid -->
                                <div class="form-control flex flex-col gap-2">
                                    <label class="text-sm font-semibold text-base-content">
                                        Benefits & Perks
                                    </label>
                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {#each benefitOptions as benefit}
                                            {@const isSelected = selectedBenefits.includes(benefit.label)}
                                            <button
                                                type="button"
                                                class="flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all text-left
                                                {isSelected
                                                    ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                                                    : 'border-base-200 bg-base-100 text-base-content/70 hover:border-purple-300 hover:bg-purple-50/50'}"
                                                onclick={() => toggleBenefit(benefit.id)}
                                            >
                                                <benefit.icon size={16} class="{isSelected ? 'text-purple-600' : 'text-base-content/30'}" />
                                                <span class="flex-1 text-xs">{benefit.label}</span>
                                                {#if isSelected}
                                                    <Check size={14} class="text-emerald-500" />
                                                {/if}
                                            </button>
                                        {/each}
                                    </div>
                                    <p class="text-xs text-base-content/40">
                                        Click to select benefits your company offers
                                    </p>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Step 3: Compensation -->
                    {#if currentStep === 3}
                        <div class="animate-fadeIn">
                            <h4 class="text-lg font-bold text-base-content mb-1">Compensation</h4>
                            <p class="text-sm text-base-content/50 mb-6">
                                Set the salary range and job specifics
                            </p>

                            <div class="space-y-6">
                                <!-- Salary Range -->
                                <div class="bg-base-100 border border-base-200 rounded-2xl p-5">
                                    <div class="flex items-center justify-between mb-4">
                                        <span class="text-sm font-semibold text-base-content">Annual Salary</span>
                                        <span class="text-base font-bold text-purple-600 bg-white px-3 py-1 rounded-lg border border-base-200">
                                            ${Number(jobData.salary_min || 0).toLocaleString()} — ${Number(jobData.salary_max || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div class="grid grid-cols-2 gap-4 mb-4">
                                        <div class="form-control flex flex-col gap-1">
                                            <label class="text-xs font-medium text-base-content/50" for="salary-min">Minimum</label>
                                            <input
                                                id="salary-min"
                                                type="number"
                                                placeholder="50000"
                                                class="input input-sm w-full bg-white border-base-200 focus:border-purple-500 rounded-lg text-sm"
                                                bind:value={jobData.salary_min}
                                            />
                                        </div>
                                        <div class="form-control flex flex-col gap-1">
                                            <label class="text-xs font-medium text-base-content/50" for="salary-max">Maximum</label>
                                            <input
                                                id="salary-max"
                                                type="number"
                                                placeholder="85000"
                                                class="input input-sm w-full bg-white border-base-200 focus:border-purple-500 rounded-lg text-sm"
                                                bind:value={jobData.salary_max}
                                            />
                                        </div>
                                    </div>
                                    {#if stepErrors.salary}
                                        <p class="text-xs text-red-500 mb-2">{stepErrors.salary}</p>
                                    {/if}
                                    <div class="flex items-center justify-between text-[11px] text-base-content/30">
                                        <span>$30,000</span>
                                        <span>$200,000+</span>
                                    </div>
                                </div>

                                <!-- Currency -->
                                <div class="form-control flex flex-col gap-1.5">
                                    <label class="text-sm font-semibold text-base-content" for="currency">Currency</label>
                                    <select
                                        id="currency"
                                        class="select w-full bg-base-100 border-base-300 focus:border-purple-500 rounded-xl text-sm"
                                        bind:value={jobData.salary_currency}
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="ETB">ETB</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="CAD">CAD ($)</option>
                                        <option value="AUD">AUD ($)</option>
                                        <option value="JPY">JPY (¥)</option>
                                    </select>
                                </div>

                                                <!-- Category -->
                                <div class="form-control flex flex-col gap-1.5">
                                        <label class="text-sm font-semibold text-base-content" for="category">
                                            Category <span class="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="category"
                                            class="select w-full bg-base-100 border-base-300 focus:border-purple-500 rounded-xl text-sm"
                                            bind:value={jobData.category}
                                        >
                                            <option value="full_stack_developer">Full Stack Developer</option>
                                            <option value="web_developer">Web Developer</option>
                                            <option value="frontend_developer">Frontend Developer</option>
                                            <option value="backend_developer">Backend Developer</option>
                                            <option value="system_architect">System Architect</option>
                                            <option value="mobile_developer">Mobile Developer</option>
                                        </select>
                                    </div>

                                <!-- Job Type & Experience -->
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="form-control flex flex-col gap-1.5">
                                        <label class="text-sm font-semibold text-base-content" for="job-type">
                                            Job Type <span class="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="job-type"
                                            class="select w-full bg-base-100 border-base-300 focus:border-purple-500 rounded-xl text-sm"
                                            bind:value={jobData.job_type}
                                        >
                                            <option value="full-time">Full Time</option>
                                            <option value="part-time">Part Time</option>
                                            <option value="contract">Contract</option>
                                            <option value="freelance">Freelance</option>
                                            <option value="internship">Internship</option>
                                        </select>
                                    </div>
                                    <div class="form-control flex flex-col gap-1.5">
                                        <label class="text-sm font-semibold text-base-content" for="experience-level">
                                            Experience Level <span class="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="experience-level"
                                            class="select w-full bg-base-100 border-base-300 focus:border-purple-500 rounded-xl text-sm"
                                            bind:value={jobData.experience_level}
                                        >
                                            <option value="entry">Entry Level</option>
                                            <option value="junior">Junior</option>
                                            <option value="mid">Mid Level</option>
                                            <option value="senior">Senior Level</option>
                                            <option value="lead">Lead</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Step 4: Publishing -->
                    {#if currentStep === 4}
                        <div class="animate-fadeIn">
                            <h4 class="text-lg font-bold text-base-content mb-1">Publishing</h4>
                            <p class="text-sm text-base-content/50 mb-6">
                                Review and publish your job posting
                            </p>

                            <div class="space-y-5">
                                <!-- AI Enhance Card -->
                                <div class="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5">
                                    <div class="flex items-start gap-4">
                                        <div class="w-11 h-11 rounded-xl bg-purple-600 flex items-center justify-center shrink-0">
                                            <Sparkles size={20} class="text-white" />
                                        </div>
                                        <div class="flex-1">
                                            <h5 class="text-sm font-bold text-purple-900">Enhance with AI</h5>
                                            <p class="text-xs text-purple-600/70 mt-0.5">
                                                AI reads everything you entered and optimizes the title, description, requirements, and responsibilities.
                                            </p>
                                            <button
                                                type="button"
                                                class="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white border-none rounded-lg gap-1.5 font-semibold mt-3 shadow-lg shadow-purple-200"
                                                onclick={enhanceWithAi}
                                                disabled={enhancing}
                                            >
                                                {#if enhancing}
                                                    <span class="loading loading-spinner loading-xs"></span>
                                                    Enhancing...
                                                {:else}
                                                    <Sparkles size={14} />
                                                    Generate AI Post
                                                {/if}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    class="flex items-center gap-3 p-4 bg-base-100 border-2 rounded-xl cursor-pointer transition-all hover:border-purple-300 hover:bg-purple-50/30 {jobData.remote_possible ? 'border-purple-400 bg-purple-50/50' : 'border-base-200'}"
                                    onclick={() => (jobData.remote_possible = !jobData.remote_possible)}
                                    role="button"
                                    tabindex="0"
                                    onkeydown={(e) => e.key === 'Enter' && (jobData.remote_possible = !jobData.remote_possible)}
                                >
                                    <input
                                        type="checkbox"
                                        class="checkbox checkbox-sm checkbox-primary rounded-md"
                                        bind:checked={jobData.remote_possible}
                                    />
                                    <div>
                                        <p class="text-sm font-semibold text-base-content">This is a remote position</p>
                                        <p class="text-xs text-base-content/50">Candidates can work from anywhere</p>
                                    </div>
                                </div>

                                <!-- Expiry & Status -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="form-control flex flex-col gap-1.5">
                                        <label class="text-sm font-semibold text-base-content" for="expires-at">
                                            Application Deadline
                                        </label>
                                        <div class="relative">
                                            <Calendar
                                                size={16}
                                                class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30"
                                            />
                                            <input
                                                id="expires-at"
                                                type="date"
                                                class="input w-full pl-10 bg-base-100 border-base-300 focus:border-purple-500 rounded-xl text-sm"
                                                bind:value={jobData.expires_at}
                                            />
                                        </div>
                                        <p class="text-xs text-base-content/40">
                                            Leave blank for no deadline
                                        </p>
                                    </div>
                                    <div class="bg-base-100 border border-base-200 rounded-xl p-4">
                                        <p class="text-xs font-bold text-base-content/40 uppercase tracking-wider mb-2">Publishing Status</p>
                                        <div class="flex items-center gap-2">
                                            <div class="w-2 h-2 rounded-full bg-amber-400"></div>
                                            <span class="text-sm font-semibold text-base-content">Save as Draft</span>
                                        </div>
                                        <p class="text-xs text-base-content/40 mt-1">
                                            You can publish later from the job management page
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/if}
                </form>
            </div>

            <!-- Modal Footer -->
            <div class="px-8 py-5 bg-base-100/50 border-t border-base-200 flex items-center justify-between">
                <div class="flex items-center gap-2 text-xs text-base-content/40">
                    {#if currentStep < totalSteps}
                        <div class="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                        Draft in progress
                    {/if}
                </div>
                <div class="flex items-center gap-3">
                    {#if currentStep > 1}
                        <button
                            type="button"
                            class="btn btn-sm btn-ghost rounded-lg gap-1 text-base-content/60"
                            onclick={prevStep}
                        >
                            <ArrowLeft size={14} />
                            Back
                        </button>
                    {/if}
                    <button
                        type="button"
                        class="btn btn-sm btn-ghost rounded-lg text-base-content/60"
                        onclick={close}
                    >
                        Cancel
                    </button>
                    {#if currentStep < totalSteps}
                        <button
                            type="button"
                            class="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white border-none rounded-lg gap-1.5 font-semibold shadow-lg shadow-purple-100"
                            onclick={nextStep}
                        >
                            Next Step
                            <ArrowRight size={14} />
                        </button>
                    {:else}
                        <button
                            type="button"
                            class="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-lg gap-1.5 font-semibold shadow-lg shadow-emerald-100"
                            onclick={submit}
                        >
                            <Check size={14} />
                            Post Job
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
    }

    :global(.animate-fadeIn) {
        animation: fadeIn 0.3s ease;
    }
    :global(.animate-popIn) {
        animation: popIn 0.2s ease;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes popIn {
        0% {
            transform: scale(0.85);
            opacity: 0;
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
</style>
