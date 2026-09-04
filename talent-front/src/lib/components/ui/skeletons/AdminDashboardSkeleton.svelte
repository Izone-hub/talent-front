<div class="space-y-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {#each Array(4) as _}
            <div class="bg-white border border-gray-200 rounded-xl p-4 min-h-[88px]">
                <div class="flex items-center gap-3 animate-pulse">
                    <div class="w-10 h-10 rounded-xl bg-gray-100 shrink-0"></div>
                    <div class="flex-1 space-y-2">
                        <div class="h-2.5 bg-gray-100 rounded w-20"></div>
                        <div class="h-5 bg-gray-100 rounded w-12"></div>
                    </div>
                </div>
                <div class="mt-2 h-4 bg-gray-50 rounded w-16"></div>
            </div>
        {/each}
    </div>

    <!-- Analytics Cards -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div class="flex items-center gap-2 animate-pulse">
                    <div class="w-3.5 h-3.5 rounded bg-gray-100"></div>
                    <div class="h-3.5 bg-gray-100 rounded w-32"></div>
                </div>
                <div class="h-5 bg-gray-100 rounded-full w-20 animate-pulse"></div>
            </div>
            <div class="p-4 min-h-[180px] flex items-center justify-center">
                <div class="w-full h-32 bg-gray-50 rounded-lg animate-pulse"></div>
            </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div class="flex items-center gap-2 animate-pulse">
                    <div class="w-3.5 h-3.5 rounded bg-gray-100"></div>
                    <div class="h-3.5 bg-gray-100 rounded w-24"></div>
                </div>
                <div class="h-5 bg-gray-100 rounded-full w-20 animate-pulse"></div>
            </div>
            <div class="p-4 min-h-[180px] flex items-center justify-center">
                <div class="w-full h-32 bg-gray-50 rounded-lg animate-pulse"></div>
            </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden lg:col-span-2">
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div class="flex items-center gap-2 animate-pulse">
                    <div class="w-3.5 h-3.5 rounded bg-gray-100"></div>
                    <div class="h-3.5 bg-gray-100 rounded w-48"></div>
                </div>
                <div class="h-5 bg-gray-100 rounded-full w-20 animate-pulse"></div>
            </div>
            <div class="p-4 min-h-[140px] flex items-center justify-center">
                <div class="w-full h-24 bg-gray-50 rounded-lg animate-pulse"></div>
            </div>
        </div>
    </div>

    <!-- Activity List -->
    <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div class="h-3.5 bg-gray-100 rounded w-28 animate-pulse"></div>
            <div class="h-4 bg-gray-100 rounded w-12 animate-pulse"></div>
        </div>
        <div class="divide-y divide-gray-50">
            {#each Array(3) as _}
                <div class="flex items-center gap-3 px-4 py-3 animate-pulse">
                    <div class="w-9 h-9 rounded-full bg-gray-100 shrink-0"></div>
                    <div class="flex-1 space-y-2">
                        <div class="h-3 bg-gray-100 rounded w-24"></div>
                        <div class="h-2.5 bg-gray-50 rounded w-32"></div>
                    </div>
                    <div class="space-y-1.5 shrink-0">
                        <div class="h-4 bg-gray-100 rounded-full w-16"></div>
                        <div class="h-2.5 bg-gray-50 rounded w-12"></div>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>
