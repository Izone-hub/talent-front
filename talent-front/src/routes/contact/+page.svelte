<script>
    // Hard-coded support/contact records
    const contactChannels = [
        {
            id: 1,
            title: "General Inquiries & Support",
            email: "support@izone.platform",
            account: "@izone_support",
            phone: "+1 (555) 234-5678"
        },
        {
            id: 2,
            title: "Business & Enterprise Sales",
            email: "sales@izone.platform",
            account: "@izone_sales",
            phone: "+1 (555) 876-5432"
        },
        {
            id: 3,
            title: "Partnerships & Media Relations",
            email: "press@izone.platform",
            account: "@izone_press",
            phone: "+1 (555) 432-1098"
        }
    ];
</script>

<div class="min-h-screen bg-slate-50 font-sans">
    <div class="flex w-full flex-col items-center">
        <div class="mx-auto w-full max-w-7xl px-4 py-8">
            
            <div class="mb-6 p-6">
                <h1 class="text-3xl font-bold tracking-tight text-slate-800">
                    Contact Us
                </h1>
                <p class="mt-2 text-slate-500">
                    Reach out directly through our formal departments or official channels.
                </p>
            </div>

            <ul class="list divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <li class="bg-slate-50/50 p-5 pb-3 text-xs font-semibold tracking-widest text-slate-400 uppercase">
                    Our Contact Channels
                </li>

                {#each contactChannels as channel (channel.id)}
                    <li class="list-row flex-col sm:flex-row sm:items-center p-5 transition-colors hover:bg-slate-50 gap-4">
                        
                        <div class="list-col-grow justify-center min-w-[200px]">
                            <div class="text-lg font-bold text-slate-800">
                                {channel.title}
                            </div>
                        </div>

                        <div class="flex items-center gap-2 text-sm text-slate-600 min-w-[220px]">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L22 8m-2 13H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v14a2 2 0 01-2 2z" />
                            </svg>
                            <a href="mailto:{channel.email}" class="hover:text-indigo-600 hover:underline transition-all truncate">
                                {channel.email}
                            </a>
                        </div>

                        <div class="flex items-center gap-2 text-sm text-slate-600 min-w-[150px]">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span class="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                {channel.account}
                            </span>
                        </div>

                        <div class="flex items-center gap-2 text-sm text-slate-600 justify-start sm:justify-end min-w-[160px] sm:ml-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.72.59.59 0 00.74.24l.85-.23a1 1 0 011.41.68l.85 2.54a1 1 0 01-.61 1.25l-.59.2a.59.59 0 00-.36.75l.49 1.48a.59.59 0 00.75.36l.59-.2a1 1 0 011.25.61l.85 2.54a1 1 0 01-.68 1.41l-.23.85a.59.59 0 00-.24.73 1 1 0 01-.73.94H15a2 2 0 01-2-2z" />
                            </svg>
                            <a href="tel:{channel.phone}" class="hover:text-emerald-600 hover:underline transition-all whitespace-nowrap">
                                {channel.phone}
                            </a>
                        </div>

                    </li>
                {/each}
            </ul>
        </div>
    </div>
</div>