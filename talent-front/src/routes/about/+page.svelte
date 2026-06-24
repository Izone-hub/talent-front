<script>
    // Hard-coded about us/team data
    const teamMembers = [
        {
            name: "Alex Rivera",
            username: "alexrivera_dev",
            role: "Frontend Engineer",
            email: "alex@izone.platform",
            github: "https://github.com",
            photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        },
        {
            name: "Sarah Chen",
            username: "schen_codes",
            role: "Backend Architect",
            email: "sarah@izone.platform",
            github: "https://github.com",
            photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
        },
        {
            name: "Marcus Brody",
            username: "marcus_stack",
            role: "Fullstack Engineer",
            email: "marcus@izone.platform",
            github: "https://github.com",
            photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
        },
        {
            name: "Elena Rostova",
            username: "elena_mobile",
            role: "Mobile Developer",
            email: "elena@izone.platform",
            github: "https://github.com",
            photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
        }
    ];
</script>

<div class="min-h-screen bg-slate-50 font-sans">
    <div class="flex w-full flex-col items-center">
        <div class="mx-auto w-full max-w-7xl px-4 py-8">
            
            <!-- Header -->
            <div class="mb-6 p-6">
                <h1 class="text-3xl font-bold tracking-tight text-slate-800">
                    About Us
                </h1>
                <p class="mt-2 text-slate-500">
                    Meet the core engineering team behind our platform operations.
                </p>
            </div>

            <!-- List Container using daisyUI list system layout -->
            <ul class="list divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <li class="bg-slate-50/50 p-5 pb-3 text-xs font-semibold tracking-widest text-slate-400 uppercase">
                    Core Team Members
                </li>

                {#each teamMembers as member}
                    <li class="list-row items-center p-5 transition-colors hover:bg-slate-50">
                        
                        <!-- Photo (Avatar Column) -->
                        <div class="shrink-0 pr-2">
                            <div class="avatar">
                                <div class="w-12 h-12 rounded-xl ring-2 ring-slate-100">
                                    <img src={member.photo} alt={member.name} />
                                </div>
                            </div>
                        </div>

                        <!-- Name & Username Column -->
                        <div class="list-col-grow justify-center pl-2">
                            <div class="text-base font-bold text-slate-800">
                                {member.name}
                            </div>
                            <div class="text-xs text-slate-400 font-mono mt-0.5">
                                @{member.username}
                            </div>
                        </div>

                        <!-- Role Designation Column -->
                        <div class="hidden sm:block min-w-[150px]">
                            <span class="badge badge-sm rounded-md border-slate-200 bg-slate-100 px-2.5 py-3 text-xs font-medium text-slate-600">
                                {member.role}
                            </span>
                        </div>

                        <!-- Email Contact Info -->
                        <div class="hidden md:flex items-center gap-1.5 text-sm text-slate-500 max-w-xs truncate">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L22 8m-2 13H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v14a2 2 0 01-2 2z" />
                            </svg>
                            <a href="mailto:{member.email}" class="hover:text-indigo-600 hover:underline transition-colors">
                                {member.email}
                            </a>
                        </div>

                        <!-- GitHub Profile Action Link -->
                        <div class="my-2 flex items-center justify-end pl-4">
                            <a 
                                href={member.github} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                class="btn btn-sm gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.061.069-.061 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                                </svg>
                                GitHub
                            </a>
                        </div>

                    </li>
                {/each}
            </ul>
        </div>
    </div>
</div>