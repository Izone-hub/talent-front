<div class="space-y-6">
    <!-- Search Bar -->
    <div class="relative animate-pulse">
        <div class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded bg-gray-100"></div>
        <div class="w-full h-11 bg-white border border-gray-200 rounded-lg"></div>
    </div>

    <!-- Tags Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {#each Array(6) as _}
            <div class="bg-white border border-gray-200 rounded-xl p-4">
                <div class="flex items-center gap-3 animate-pulse">
                    <div class="w-10 h-10 rounded-xl bg-gray-100 shrink-0"></div>
                    <div class="min-w-0 flex-1 space-y-2">
                        <div class="h-3.5 bg-gray-100 rounded w-24"></div>
                        <div class="h-2.5 bg-gray-50 rounded w-20"></div>
                    </div>
                </div>
                <div class="mt-3 h-2.5 bg-gray-50 rounded w-3/4 animate-pulse"></div>
            </div>
        {/each}
    </div>
</div>
