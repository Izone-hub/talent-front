<script>
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
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
        ArrowLeft as BackIcon,
        Plus,
        Trash2,
    } from "lucide-svelte";
    import { jobService } from "$lib/api/job.service";
    import { jobDescriptionService } from "$lib/api/jobDescription.service";
    import { tagService } from "$lib/api/tag.service";
    import { surveyService } from "$lib/api/survey.service";
    import { showToast } from "$lib/stores/toast";
    import { settingsService } from "$lib/api/settings.service";

    let currentStep = $state(1);
    const totalSteps = 6;

    const validCategories = ['full_stack_developer', 'web_developer', 'frontend_developer', 'backend_developer', 'system_architect', 'mobile_developer'];
    let initialCategory = '';
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const cat = params.get('category');
        if (cat && validCategories.includes(cat)) {
            initialCategory = cat;
        }
    }

    let jobData = $state({
        title: "",
        description: "",
        requirements: "",
        responsibilities: "",
        benefits: "",
        job_type: "full-time",
        category: initialCategory,
        experience_level: "mid",
        location: "",
        remote_possible: false,
        salary_min: null,
        salary_max: null,
        salary_currency: "ETB",
        expires_at: "",
    });

    let showAiPrompt = $state(false);
    let aiPrompt = $state("");
    let aiGenerating = $state(false);
    let submitting = $state(false);

    let requirementTags = $state([]);
    let newTagInput = $state("");
    let selectedBenefits = $state([]);

    let allTags = $state([]);
    let tagSearch = $state("");
    let tagLoading = $state(true);

    async function loadTags() {
        tagLoading = true;
        try {
            const data = await tagService.listTags();
            allTags = data || [];
        } catch (error) {
            console.error("Failed to load tags:", error);
            allTags = [];
        } finally {
            tagLoading = false;
        }
    }

    $effect(() => {
        loadTags();
    });

    function tagName(tag) {
        return (tag && (tag.name || tag.Name)) || "";
    }

    function tagColor(name) {
        const match = allTags.find(
            (t) => (t.name || t.Name)?.toLowerCase() === name.toLowerCase(),
        );
        return (match && (match.color || match.Color)) || "#7C3AED";
    }

    function getSuggestedTags() {
        const lower = requirementTags.map((t) => t.toLowerCase());
        return allTags.filter(
            (t) => !lower.includes(tagName(t).toLowerCase()),
        );
    }

    function filteredTags() {
        const q = tagSearch.trim().toLowerCase();
        return getSuggestedTags().filter((t) => {
            const name = tagName(t);
            return !q || name.toLowerCase().includes(q);
        });
    }

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

    const categoryRequirements = {
        full_stack_developer: {
            tags: ["React", "TypeScript", "Node.js", "PostgreSQL", "REST APIs", "Git", "Docker", "AWS"],
            responsibilities: "• Build and maintain full-stack web applications\n• Design and implement RESTful APIs\n• Collaborate with product and design teams\n• Write clean, testable, and well-documented code"
        },
        web_developer: {
            tags: ["HTML", "CSS", "JavaScript", "React", "Responsive Design", "Git", "REST APIs", "SEO"],
            responsibilities: "• Build responsive and interactive web applications\n• Optimize pages for maximum speed and scalability\n• Collaborate with designers to implement visual elements\n• Maintain and improve existing web projects"
        },
        frontend_developer: {
            tags: ["React", "TypeScript", "CSS", "HTML", "Tailwind CSS", "Redux", "Next.js", "Figma"],
            responsibilities: "• Develop user-facing features using modern frontend frameworks\n• Ensure responsive design across all devices\n• Optimize applications for performance and accessibility\n• Collaborate with backend developers and designers"
        },
        backend_developer: {
            tags: ["Node.js", "Python", "Go", "PostgreSQL", "Redis", "Docker", "REST APIs", "AWS"],
            responsibilities: "• Design and implement scalable backend services\n• Build and maintain RESTful APIs\n• Manage database schemas and optimize queries\n• Ensure system security and performance"
        },
        system_architect: {
            tags: ["AWS", "Docker", "Kubernetes", "Microservices", "System Design", "CI/CD", "Terraform", "PostgreSQL"],
            responsibilities: "• Define and oversee technical architecture\n• Make key design and infrastructure decisions\n• Guide engineering teams on best practices\n• Ensure system scalability and reliability"
        },
        mobile_developer: {
            tags: ["React Native", "Flutter", "Swift", "Kotlin", "TypeScript", "REST APIs", "Git", "Firebase"],
            responsibilities: "• Build and maintain mobile applications for iOS and Android\n• Implement responsive and performant UIs\n• Integrate with backend APIs and third-party services\n• Test, debug, and optimize app performance"
        }
    };

    let currentSuggestedTags = $state([]);

    let stepErrors = $state({});
    let enhancing = $state(false);
    let salaryLocked = $state(true);

    // Survey screening questions (simple Yes/No)
    let surveyQuestions = $state([]);

    function addSurveyQuestion() {
        surveyQuestions = [...surveyQuestions, {
            question_text: "",
            expected_answer: true,
        }];
    }

    function removeSurveyQuestion(index) {
        surveyQuestions = surveyQuestions.filter((_, i) => i !== index);
    }

    const categoryData = {
        full_stack_developer: {
            title: "Full Stack Developer",
            description: "We are looking for a skilled Full Stack Developer to join our team. You will work on both frontend and backend development, building end-to-end features and ensuring seamless user experiences across our web applications."
        },
        web_developer: {
            title: "Web Developer",
            description: "We are seeking a talented Web Developer to build and maintain responsive, high-performance web applications. You will collaborate with designers and engineers to deliver engaging user experiences on the web."
        },
        frontend_developer: {
            title: "Frontend Developer",
            description: "We are looking for a creative Frontend Developer to bring our designs to life. You will build pixel-perfect, responsive interfaces and ensure smooth interactions across all modern browsers and devices."
        },
        backend_developer: {
            title: "Backend Developer",
            description: "We are hiring a Backend Developer to design and implement robust server-side logic, APIs, and database architectures. You will ensure our systems are scalable, secure, and performant."
        },
        system_architect: {
            title: "System Architect",
            description: "We are looking for an experienced System Architect to define and oversee the technical architecture of our platform. You will make key design decisions, guide engineering teams, and ensure our systems meet performance and reliability goals."
        },
        mobile_developer: {
            title: "Mobile Developer",
            description: "We are seeking a skilled Mobile Developer to design and build intuitive mobile applications for iOS and Android. You will work closely with product and design teams to deliver seamless mobile experiences."
        }
    };

    function selectCategory(catValue) {
        jobData.category = catValue;
        const data = categoryData[catValue];
        if (data) {
            jobData.title = data.title;
            jobData.description = data.description;
        }
        const reqData = categoryRequirements[catValue];
        if (reqData) {
            requirementTags = [];
            const tagNameSet = new Set(
                allTags.map((t) => (t.name || t.Name || "").toLowerCase()),
            );
            const matched = reqData.tags.filter((t) =>
                tagNameSet.has(t.toLowerCase()),
            );
            requirementTags = matched.length > 0 ? matched : [...reqData.tags];
            jobData.requirements = requirementTags.join("\n");
            jobData.responsibilities = reqData.responsibilities;
            currentSuggestedTags = reqData.tags;
        }
        // Auto-advance to next step
        if (currentStep === 1 && currentStep < totalSteps) {
            currentStep++;
            stepErrors = {};
        }
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
                if (parsed.responsibilities) jobData.responsibilities = parsed.responsibilities;
                if (parsed.benefits) {
                    jobData.benefits = parsed.benefits;
                    selectedBenefits = parsed.benefits
                        .split(",")
                        .map((b) => b.trim())
                        .filter(Boolean);
                }
                if (parsed.job_type) jobData.job_type = parsed.job_type;
                if (parsed.experience_level) jobData.experience_level = parsed.experience_level;
                if (parsed.location) jobData.location = parsed.location;
                if (typeof parsed.remote_possible === "boolean")
                    jobData.remote_possible = parsed.remote_possible;
                if (!salaryLocked) {
                    if (parsed.salary_min) jobData.salary_min = parsed.salary_min;
                    if (parsed.salary_max) jobData.salary_max = parsed.salary_max;
                    if (parsed.salary_currency) jobData.salary_currency = parsed.salary_currency;
                }
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
                remote_possible: jobData.remote_possible,
            };
            // Only include salary if not locked
            if (!salaryLocked) {
                payload.salary_min = jobData.salary_min;
                payload.salary_max = jobData.salary_max;
                payload.salary_currency = jobData.salary_currency;
            }

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
                if (!salaryLocked) {
                    if (raw.salary_min) jobData.salary_min = raw.salary_min;
                    if (raw.salary_max) jobData.salary_max = raw.salary_max;
                    if (raw.salary_currency) jobData.salary_currency = raw.salary_currency;
                }
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
        if (trimmed && !requirementTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
            requirementTags = [...requirementTags, trimmed];
            syncRequirements();
        }
    }

    function removeTag(text) {
        requirementTags = requirementTags.filter(
            (t) => t.toLowerCase() !== text.toLowerCase(),
        );
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
            if (!jobData.category) errors.category = "Please select a category";
        }
        if (step === 2) {
            if (!jobData.title.trim()) errors.title = "Job title is required";
            if (!jobData.description.trim()) errors.description = "Job description is required";
        }
        if (step === 3) {
            if (requirementTags.length === 0) errors.requirements = "Add at least one requirement";
        }
        if (step === 4) {
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

    async function submit(e) {
        e.preventDefault();
        if (!validateStep(currentStep)) return;
        if (submitting) return;

        submitting = true;
        try {
            let settings = {};
            try {
                settings = await settingsService.getCompanySettings();
            } catch (err) {
                console.error('Failed to load company settings:', err);
            }

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

            if (!payload.salary_currency) payload.salary_currency = "ETB";

            payload.status = "draft";

            const createdJob = await jobService.createJob(payload);

            // Assign selected tags to the created job
            if (createdJob?.id && requirementTags.length > 0) {
                try {
                    await tagService.assignTagsToJob(createdJob.id, requirementTags, allTags);
                } catch (tagErr) {
                    console.error("Failed to assign tags to job:", tagErr);
                    // Don't block job creation if tag assignment fails
                }
            }

            // Save survey questions separately if any exist
            const validQuestions = surveyQuestions.filter(q => q.question_text.trim());
            if (validQuestions.length > 0 && createdJob?.id) {
                await surveyService.upsertQuestions(createdJob.id, validQuestions.map((q, i) => ({
                    question_text: q.question_text,
                    expected_answer: q.expected_answer,
                })));
            }

            showToast("Job created successfully!", "success");
            goto("/admin/jobs");
        } catch (error) {
            showToast(error.message || "Failed to create job", "error");
        } finally {
            submitting = false;
        }
    }

    const stepLabels = ["Category", "Job Details", "Requirements", "Survey", "Compensation", "Publishing"];
</script>

<svelte:head>
    <title>Post a Job | Admin</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
    <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
            <button
                class="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4 transition-colors"
                onclick={() => goto("/admin/jobs")}
            >
                <BackIcon size={16} />
                Back to Jobs
            </button>
            <div class="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl px-8 py-6 text-white">
                <div class="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-xs font-semibold mb-2">
                    <Zap size={12} />
                    Post a Job
                </div>
                <h1 class="text-2xl font-bold">Find Your Next Great Hire</h1>
                <p class="text-purple-200 text-sm mt-1">
                    Create a compelling job posting that attracts top talent
                </p>
            </div>
        </div>

        <!-- Step Progress -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 pt-6 pb-4 mb-6">
            <div class="flex items-center justify-between relative">
                <div class="absolute top-5 left-8 right-8 h-0.5 bg-slate-200 z-0"></div>
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
                                    : 'bg-slate-100 text-slate-400 border-slate-200 group-hover:border-purple-300'}"
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
                                    : 'text-slate-400'}"
                        >
                            {label}
                        </span>
                    </button>
                {/each}
            </div>
        </div>

        <!-- Form Content -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-8">
            <form onsubmit={submit}>
                <!-- Step 1: Category -->
                {#if currentStep === 1}
                    <div class="animate-fadeIn">
                        <h4 class="text-lg font-bold text-slate-900 mb-1">Choose a Category</h4>
                        <p class="text-sm text-slate-500 mb-6">
                            Select the job category that best fits this role
                        </p>

                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {#each [
                                { value: 'full_stack_developer', label: 'Full Stack Developer', icon: '🌐', desc: 'Frontend + Backend', color: 'from-blue-500 to-indigo-500' },
                                { value: 'web_developer', label: 'Web Developer', icon: '🌍', desc: 'Web applications', color: 'from-emerald-500 to-teal-500' },
                                { value: 'frontend_developer', label: 'Frontend Developer', icon: '🎨', desc: 'UI/UX & client-side', color: 'from-pink-500 to-rose-500' },
                                { value: 'backend_developer', label: 'Backend Developer', icon: '⚙️', desc: 'Server & APIs', color: 'from-orange-500 to-amber-500' },
                                { value: 'system_architect', label: 'System Architect', icon: '🏗️', desc: 'Infrastructure & design', color: 'from-purple-500 to-violet-500' },
                                { value: 'mobile_developer', label: 'Mobile Developer', icon: '📱', desc: 'iOS & Android', color: 'from-cyan-500 to-sky-500' },
                            ] as cat}
                                <button
                                    type="button"
                                    class="group relative flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all duration-300 text-center cursor-pointer
                                    {jobData.category === cat.value
                                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg shadow-purple-200 scale-[1.02]'
                                        : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/30 hover:shadow-md'}"
                                    onclick={() => selectCategory(cat.value)}
                                >
                                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br {cat.color} flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        {cat.icon}
                                    </div>
                                    <div>
                                        <span class="text-sm font-bold text-slate-800 leading-tight block">{cat.label}</span>
                                        <span class="text-xs text-slate-400 mt-0.5 block">{cat.desc}</span>
                                    </div>
                                    {#if jobData.category === cat.value}
                                        <div class="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                                            <Check size={14} class="text-white" />
                                        </div>
                                    {/if}
                                </button>
                            {/each}
                        </div>
                        {#if stepErrors.category}
                            <p class="text-xs text-red-500 mt-3 text-center">{stepErrors.category}</p>
                        {/if}
                        <p class="text-xs text-slate-400 mt-4 text-center">
                            You can change this later if needed
                        </p>
                    </div>
                {/if}

                <!-- Step 2: Job Details -->
                {#if currentStep === 2}
                    <div class="animate-fadeIn">
                        <h4 class="text-lg font-bold text-slate-900 mb-1">Job Details</h4>
                        <p class="text-sm text-slate-500 mb-6">
                            Tell candidates what this role is about
                        </p>

                        <div class="space-y-5">
                            <!-- Job Title -->
                            <div class="flex flex-col gap-1.5">
                                <label class="text-sm font-semibold text-slate-700" for="job-title">
                                    Job Title <span class="text-red-500">*</span>
                                </label>
                                <input
                                    id="job-title"
                                    type="text"
                                    placeholder="e.g. Senior Software Engineer"
                                    class="input w-full bg-slate-50 border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 rounded-xl text-sm"
                                    bind:value={jobData.title}
                                />
                                {#if stepErrors.title}
                                    <p class="text-xs text-red-500">{stepErrors.title}</p>
                                {/if}
                                <p class="text-xs text-slate-400">
                                    Be specific — use keywords candidates search for
                                </p>
                            </div>

                            <!-- Job Description -->
                            <div class="flex flex-col gap-1.5">
                                <div class="flex items-center justify-between">
                                    <label class="text-sm font-semibold text-slate-700" for="description">
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
                                    <p class="text-[11px] text-slate-400 -mt-1">
                                        Press <kbd class="kbd kbd-xs">Enter</kbd> to generate
                                    </p>
                                {/if}
                                <textarea
                                    id="description"
                                    class="textarea bg-slate-50 border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 h-40 rounded-xl w-full text-sm"
                                    placeholder="Describe the role, team, culture, and what makes this opportunity unique..."
                                    bind:value={jobData.description}
                                ></textarea>
                                {#if stepErrors.description}
                                    <p class="text-xs text-red-500">{stepErrors.description}</p>
                                {/if}
                                <p class="text-xs text-slate-400 flex items-center gap-1">
                                    <Sparkles size={11} class="text-amber-500" />
                                    Tip: Include company culture, team dynamics, and growth opportunities
                                </p>
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- Step 3: Requirements -->
                {#if currentStep === 3}
                    <div class="animate-fadeIn">
                        <h4 class="text-lg font-bold text-slate-900 mb-1">Requirements & Responsibilities</h4>
                        <p class="text-sm text-slate-500 mb-6">
                            Define what candidates need and what they'll do
                        </p>

                        <div class="space-y-5">
                            <!-- Requirements Tags -->
                            <div class="flex flex-col gap-1.5">
                                <label class="text-sm font-semibold text-slate-700">
                                    Key Requirements <span class="text-red-500">*</span>
                                </label>
                                <div class="border-2 border-dashed border-slate-200 rounded-xl p-3 bg-slate-50 focus-within:border-purple-500 focus-within:bg-white transition-all">
                                    <div class="flex flex-wrap gap-2 items-center min-h-[44px]">
                                        {#each requirementTags as tag}
                                            <span
                                                class="inline-flex items-center gap-1.5 text-white rounded-full px-3 py-1 text-xs font-medium animate-popIn"
                                                style="background-color: {tagColor(tag)}"
                                            >
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
                                            class="flex-1 min-w-[140px] border-none outline-none bg-transparent text-sm py-1 placeholder:text-slate-300"
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
                                <p class="text-xs text-slate-400">
                                    Press <kbd class="kbd kbd-xs">Enter</kbd> to add each requirement as a tag
                                </p>
                                <!-- Tag picker from tags database -->
                                <div class="mt-3 border border-slate-200 rounded-xl overflow-hidden">
                                    <div class="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
                                        <p class="text-xs font-semibold text-slate-600">
                                            Select from existing tags
                                        </p>
                                        {#if tagLoading}
                                            <span class="loading loading-spinner loading-xs text-purple-600"></span>
                                        {/if}
                                    </div>
                                    {#if !tagLoading}
                                        <div class="p-2">
                                            <input
                                                type="text"
                                                class="input input-sm w-full bg-white border-slate-200 focus:border-purple-500 rounded-lg text-xs mb-2"
                                                placeholder="Search tags..."
                                                bind:value={tagSearch}
                                            />
                                            {#if filteredTags().length === 0}
                                                <p class="text-xs text-slate-400 text-center py-4">
                                                    No available tags match.
                                                </p>
                                            {:else}
                                                <div class="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                                                    {#each filteredTags() as sTag}
                                                        {@const sName = tagName(sTag)}
                                                        {@const sColor = tagColor(sName)}
                                                        <button
                                                            type="button"
                                                            class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] transition-all border border-transparent hover:-translate-y-0.5"
                                                            style="background-color: {sColor}1A; color: {sColor}; border-color: {sColor}40"
                                                            onclick={() => addTag(sName)}
                                                        >
                                                            <span
                                                                class="w-2 h-2 rounded-full inline-block"
                                                                style="background-color: {sColor}"
                                                            ></span>
                                                            + {sName}
                                                        </button>
                                                    {/each}
                                                </div>
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                                <!-- Category suggestions -->
                                {#if currentSuggestedTags.length > 0}
                                    <div class="mt-2">
                                        <p class="text-[11px] font-medium text-slate-400 mb-1">
                                            Category suggestions
                                        </p>
                                        <div class="flex flex-wrap gap-1.5">
                                            {#each currentSuggestedTags as sTag}
                                                <button
                                                    type="button"
                                                    class="px-2.5 py-0.5 bg-slate-100 hover:bg-purple-600 hover:text-white rounded-full text-[11px] text-slate-500 transition-all border border-transparent hover:border-purple-400 hover:-translate-y-0.5"
                                                    onclick={() => addTag(sTag)}
                                                >
                                                    + {sTag}
                                                </button>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            </div>

                            <!-- Responsibilities -->
                            <div class="flex flex-col gap-1.5">
                                <label class="text-sm font-semibold text-slate-700" for="responsibilities">
                                    Responsibilities
                                </label>
                                <textarea
                                    id="responsibilities"
                                    class="textarea bg-slate-50 border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 h-32 rounded-xl w-full text-sm"
                                    placeholder="• Lead technical architecture decisions&#10;• Mentor junior developers&#10;• Collaborate with product team"
                                    bind:value={jobData.responsibilities}
                                ></textarea>
                                <p class="text-xs text-slate-400">
                                    Separate each responsibility with a new line
                                </p>
                            </div>

                            <!-- Benefits Grid -->
                            <div class="flex flex-col gap-2">
                                <label class="text-sm font-semibold text-slate-700">
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
                                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-purple-300 hover:bg-purple-50/50'}"
                                            onclick={() => toggleBenefit(benefit.id)}
                                        >
                                            <benefit.icon size={16} class="{isSelected ? 'text-purple-600' : 'text-slate-300'}" />
                                            <span class="flex-1 text-xs">{benefit.label}</span>
                                            {#if isSelected}
                                                <Check size={14} class="text-emerald-500" />
                                            {/if}
                                        </button>
                                    {/each}
                                </div>
                                <p class="text-xs text-slate-400">
                                    Click to select benefits your company offers
                                </p>
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- Step 4: Survey Screening Questions -->
                {#if currentStep === 4}
                    <div class="animate-fadeIn">
                        <h4 class="text-lg font-bold text-slate-900 mb-1">Screening Questions</h4>
                        <p class="text-sm text-slate-500 mb-6">
                            Simple Yes/No questions before candidates can apply (optional)
                        </p>

                        <div class="space-y-4">
                            {#each surveyQuestions as q, qi}
                                <div class="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 group hover:border-purple-300 transition-all">
                                    <!-- Question number -->
                                    <div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold shrink-0">
                                        {qi + 1}
                                    </div>

                                    <!-- Question input -->
                                    <input
                                        type="text"
                                        class="flex-1 bg-white border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-all"
                                        placeholder="e.g., Do you live in Hawassa?"
                                        bind:value={surveyQuestions[qi].question_text}
                                    />

                                    <!-- Expected answer toggle -->
                                    <div class="flex items-center gap-2 shrink-0">
                                        <span class="text-xs text-slate-400 font-medium">Expected:</span>
                                        <button
                                            type="button"
                                            class="relative w-14 h-7 rounded-full transition-all cursor-pointer
                                            {surveyQuestions[qi].expected_answer
                                                ? 'bg-emerald-500'
                                                : 'bg-rose-400'}"
                                            onclick={() => {
                                                surveyQuestions[qi].expected_answer = !surveyQuestions[qi].expected_answer;
                                                surveyQuestions = [...surveyQuestions];
                                            }}
                                        >
                                            <span class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform
                                                {surveyQuestions[qi].expected_answer ? 'translate-x-7' : ''}"></span>
                                            <span class="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                                                {surveyQuestions[qi].expected_answer ? 'Yes' : 'No'}
                                            </span>
                                        </button>
                                    </div>

                                    <!-- Remove -->
                                    <button
                                        type="button"
                                        class="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0"
                                        onclick={() => removeSurveyQuestion(qi)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            {/each}

                            <!-- Add Question Button -->
                            <button
                                type="button"
                                class="w-full border-2 border-dashed border-slate-200 rounded-xl py-4 flex items-center justify-center gap-2 text-slate-400 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50/30 transition-all cursor-pointer"
                                onclick={addSurveyQuestion}
                            >
                                <Plus size={18} />
                                <span class="text-sm font-semibold">Add Screening Question</span>
                            </button>

                            {#if surveyQuestions.length === 0}
                                <p class="text-xs text-slate-400 text-center">
                                    No screening questions. Candidates can apply directly.
                                </p>
                            {:else}
                                <p class="text-xs text-slate-400 text-center">
                                    {surveyQuestions.length} screening question{surveyQuestions.length !== 1 ? 's' : ''} — candidates must answer Yes to proceed
                                </p>
                            {/if}
                        </div>
                    </div>
                {/if}

                <!-- Step 5: Compensation -->
                {#if currentStep === 5}
                    <div class="animate-fadeIn">
                        <h4 class="text-lg font-bold text-slate-900 mb-1">Compensation</h4>
                        <p class="text-sm text-slate-500 mb-6">
                            Set the salary range and job specifics
                        </p>

                        <div class="space-y-6">
                            <!-- Salary Lock Toggle -->
                            <div
                                class="flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all
                                {salaryLocked ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white hover:border-purple-300'}"
                                onclick={() => salaryLocked = !salaryLocked}
                                role="button"
                                tabindex="0"
                                onkeydown={(e) => e.key === 'Enter' && (salaryLocked = !salaryLocked)}
                            >
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                                        {salaryLocked ? 'bg-amber-100' : 'bg-slate-100'}">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 {salaryLocked ? 'text-amber-600' : 'text-slate-400'}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    </div>
                                    <div>
                                        <p class="text-sm font-semibold {salaryLocked ? 'text-amber-800' : 'text-slate-700'}">
                                            {salaryLocked ? 'Salary Locked' : 'Salary Unlocked'}
                                        </p>
                                        <p class="text-xs {salaryLocked ? 'text-amber-600' : 'text-slate-400'}">
                                            {salaryLocked ? 'AI will not modify salary fields' : 'AI may adjust salary during enhancement'}
                                        </p>
                                    </div>
                                </div>
                                <div class="relative w-12 h-6 rounded-full transition-colors
                                    {salaryLocked ? 'bg-amber-500' : 'bg-slate-300'}">
                                    <div class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                                        {salaryLocked ? 'translate-x-6' : ''}"></div>
                                </div>
                            </div>

                            <!-- Salary Range -->
                            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                                <div class="flex items-center justify-between mb-4">
                                    <span class="text-sm font-semibold text-slate-700">Annual Salary</span>
                                    <span class="text-base font-bold text-purple-600 bg-white px-3 py-1 rounded-lg border border-slate-200">
                                        ${Number(jobData.salary_min || 0).toLocaleString()} — ${Number(jobData.salary_max || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    <div class="flex flex-col gap-1">
                                        <label class="text-xs font-medium text-slate-400" for="salary-min">Minimum</label>
                                        <input
                                            id="salary-min"
                                            type="number"
                                            placeholder="50000"
                                            class="input input-sm w-full bg-white border-slate-200 focus:border-purple-500 rounded-lg text-sm"
                                            bind:value={jobData.salary_min}
                                        />
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <label class="text-xs font-medium text-slate-400" for="salary-max">Maximum</label>
                                        <input
                                            id="salary-max"
                                            type="number"
                                            placeholder="85000"
                                            class="input input-sm w-full bg-white border-slate-200 focus:border-purple-500 rounded-lg text-sm"
                                            bind:value={jobData.salary_max}
                                        />
                                    </div>
                                </div>
                                {#if stepErrors.salary}
                                    <p class="text-xs text-red-500 mb-2">{stepErrors.salary}</p>
                                {/if}
                                <div class="flex items-center justify-between text-[11px] text-slate-300">
                                    <span>$30,000</span>
                                    <span>$200,000+</span>
                                </div>
                            </div>

                            <!-- Currency -->
                            <div class="flex flex-col gap-1.5">
                                <label class="text-sm font-semibold text-slate-700" for="currency">Currency</label>
                                <select
                                    id="currency"
                                    class="select w-full bg-slate-50 border-slate-200 focus:border-purple-500 rounded-xl text-sm"
                                    bind:value={jobData.salary_currency}
                                >
                                    <option value="ETB">ETB</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="CAD">CAD ($)</option>
                                    <option value="AUD">AUD ($)</option>
                                    <option value="JPY">JPY (¥)</option>
                                </select>
                            </div>

                            <!-- Job Type & Experience -->
                            <div class="grid grid-cols-2 gap-4">
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-sm font-semibold text-slate-700" for="job-type">
                                        Job Type <span class="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="job-type"
                                        class="select w-full bg-slate-50 border-slate-200 focus:border-purple-500 rounded-xl text-sm"
                                        bind:value={jobData.job_type}
                                    >
                                        <option value="full-time">Full Time</option>
                                        <option value="part-time">Part Time</option>
                                        <option value="contract">Contract</option>
                                        <option value="freelance">Freelance</option>
                                        <option value="internship">Internship</option>
                                    </select>
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-sm font-semibold text-slate-700" for="experience-level">
                                        Experience Level <span class="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="experience-level"
                                        class="select w-full bg-slate-50 border-slate-200 focus:border-purple-500 rounded-xl text-sm"
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

                <!-- Step 6: Publishing -->
                {#if currentStep === 6}
                    <div class="animate-fadeIn">
                        <h4 class="text-lg font-bold text-slate-900 mb-1">Publishing</h4>
                        <p class="text-sm text-slate-500 mb-6">
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

                            <!-- Remote Toggle -->
                            <div
                                class="flex items-center gap-3 p-4 bg-slate-50 border-2 rounded-xl cursor-pointer transition-all hover:border-purple-300 hover:bg-purple-50/30 {jobData.remote_possible ? 'border-purple-400 bg-purple-50/50' : 'border-slate-200'}"
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
                                    <p class="text-sm font-semibold text-slate-700">This is a remote position</p>
                                    <p class="text-xs text-slate-400">Candidates can work from anywhere</p>
                                </div>
                            </div>

                            <!-- Expiry & Status -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-sm font-semibold text-slate-700" for="expires-at">
                                        Application Deadline
                                    </label>
                                    <div class="relative">
                                        <Calendar
                                            size={16}
                                            class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                                        />
                                        <input
                                            id="expires-at"
                                            type="date"
                                            class="input w-full pl-10 bg-slate-50 border-slate-200 focus:border-purple-500 rounded-xl text-sm"
                                            bind:value={jobData.expires_at}
                                        />
                                    </div>
                                    <p class="text-xs text-slate-400">
                                        Leave blank for no deadline
                                    </p>
                                </div>
                                <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Publishing Status</p>
                                    <div class="flex items-center gap-2">
                                        <div class="w-2 h-2 rounded-full bg-amber-400"></div>
                                        <span class="text-sm font-semibold text-slate-700">Save as Draft</span>
                                    </div>
                                    <p class="text-xs text-slate-400 mt-1">
                                        You can publish later from the job management page
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}
            </form>
        </div>

        <!-- Footer Navigation -->
        <div class="mt-6 flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs text-slate-400">
                {#if currentStep < totalSteps}
                    <div class="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                    Draft in progress
                {/if}
            </div>
            <div class="flex items-center gap-3">
                {#if currentStep > 1}
                    <button
                        type="button"
                        class="btn btn-sm btn-ghost rounded-lg gap-1 text-slate-500"
                        onclick={prevStep}
                    >
                        <ArrowLeft size={14} />
                        Back
                    </button>
                {/if}
                <button
                    type="button"
                    class="btn btn-sm btn-ghost rounded-lg text-slate-500"
                    onclick={() => goto("/admin/jobs")}
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
                        disabled={submitting}
                    >
                        {#if submitting}
                            <span class="loading loading-spinner loading-xs"></span>
                            Posting...
                        {:else}
                            <Check size={14} />
                            Post Job
                        {/if}
                    </button>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
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

    :global(.custom-scrollbar)::-webkit-scrollbar {
        width: 6px;
    }
    :global(.custom-scrollbar)::-webkit-scrollbar-track {
        background: #f8fafc;
    }
    :global(.custom-scrollbar)::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
    }
    :global(.custom-scrollbar)::-webkit-scrollbar-thumb:hover {
        background: #cbd5e1;
    }
</style>
