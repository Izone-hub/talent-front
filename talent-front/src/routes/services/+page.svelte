<script>
    // Hard-coded services array by actual technical tracks
    const services = [
        {
            id: 1,
            title: "Frontend Web Development",
            provider: "UI & Single Page App Specialists",
            description:
                "Building fast, responsive, and highly interactive user interfaces using modern framework systems like Svelte, React, and Vue with Tailwind CSS.",
        },
        {
            id: 2,
            title: "Backend Development",
            provider: "API & Database Architects",
            description:
                "Robust server infrastructure, secure RESTful/GraphQL APIs, database modeling (SQL/NoSQL), authentication flows, and scalable cloud logic.",
        },
        {
            id: 3,
            title: "Fullstack Web Development",
            provider: "End-to-End Engineers",
            description:
                "Complete turnkey web application setups combining slick interactive frontends with fully integrated backend architectures and databases.",
        },
        {
            id: 4,
            title: "Mobile App Development",
            provider: "iOS & Android Engineers",
            description:
                "Cross-platform mobile engineering utilizing Flutter or React Native to ship native apps to both Apple App Store and Google Play Store.",
        },
    ];
</script>

<div class="min-h-screen bg-slate-50 font-sans">
    <div class="flex w-full flex-col items-center">
        <div class="mx-auto w-full max-w-7xl px-4 py-8">
            <div
                class="mb-2 flex flex-col justify-between gap-4 p-6 md:flex-row md:items-center"
            >
                <div>
                    <h1
                        class="text-3xl font-bold tracking-tight text-slate-800"
                    >
                        Our Services
                    </h1>
                    <p class="mt-2 text-slate-500">
                        Choose a specialization stack engineered to scale your
                        product.
                    </p>
                </div>

                <div
                    class="flex w-full items-center overflow-hidden rounded-xl border border-slate-200 bg-white md:w-auto"
                >
                    <div class="shrink-0 pl-4 text-slate-400">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search services..."
                        class="input h-11 w-full border-none bg-transparent shadow-none focus:outline-none md:w-48"
                    />

                    <div class="h-6 w-px shrink-0 bg-slate-200"></div>

                    <select
                        class="select h-11 min-h-0 cursor-pointer rounded-none border-none bg-transparent pr-8 pl-3 font-medium text-slate-600 shadow-none focus:outline-none"
                    >
                        <option selected>All Engineering</option>
                        <option>Frontend</option>
                        <option>Backend</option>
                        <option>Fullstack</option>
                        <option>Mobile App</option>
                    </select>
                </div>
            </div>

            <ul
                class="list divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
                <li
                    class="bg-slate-50/50 p-5 pb-3 text-xs font-semibold tracking-widest text-slate-400 uppercase"
                >
                    Core Technical Capabilities
                </li>

                {#each services as service (service.id)}
                    <li
                        class="list-row p-5 transition-colors hover:bg-slate-50"
                    >
                        <div class="list-col-grow justify-center">
                            <div class="text-lg font-bold text-slate-800">
                                {service.title}
                            </div>
                            <div
                                class="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-3.5 w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                </svg>
                                {service.provider}
                            </div>
                        </div>

                        <p
                            class="list-col-wrap hidden max-w-md text-sm leading-relaxed text-slate-500 md:block"
                        >
                            {service.description}
                        </p>
                    </li>
                {/each}
            </ul>
        </div>
    </div>
</div>
