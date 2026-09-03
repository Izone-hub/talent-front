<div class="space-y-6">
    <!-- Overview stat strip -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {#each Array(4) as _}
            <div class="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm animate-pulse">
                <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-xl bg-gray-100 shrink-0"></div>
                    <div class="h-7 w-12 bg-gray-100 rounded"></div>
                </div>
                <div class="mt-3 h-3 bg-gray-100 rounded w-24"></div>
                <div class="mt-1.5 h-2.5 bg-gray-50 rounded w-20"></div>
            </div>
        {/each}
    </div>

    <!-- Quiz Completed Special Card -->
    <div class="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse">
        <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-amber-100 shrink-0"></div>
            <div class="flex-1 min-w-0 space-y-2">
                <div class="h-3.5 bg-gray-100 rounded w-40"></div>
                <div class="h-2.5 bg-gray-50 rounded w-32"></div>
            </div>
            <div class="h-7 bg-amber-50 rounded-full w-14 shrink-0"></div>
        </div>
    </div>

    <!-- Job Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each Array(4) as _}
            <div class="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse">
                <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-2xl bg-gray-100 shrink-0"></div>
                    <div class="flex-1 min-w-0 space-y-2">
                        <div class="h-3.5 bg-gray-100 rounded w-36"></div>
                        <div class="h-2.5 bg-gray-50 rounded w-24"></div>
                    </div>
                </div>
                <div class="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                    <div class="h-6 bg-gray-100 rounded-full w-28"></div>
                    <div class="h-3 bg-gray-100 rounded w-20"></div>
                </div>
            </div>
        {/each}
    </div>
</div>
