<div class="space-y-6">
    <!-- Search Bar -->
    <div class="relative animate-pulse">
        <div class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded bg-gray-100"></div>
        <div class="w-full h-11 bg-white border border-gray-200 rounded-lg"></div>
    </div>

    <!-- Question Type Cards Grid -->
    <!-- Mirrors the enlarged type-card grid on the questions page so loading
         does not shift the layout. Max 3 cards per row. -->
    <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {#each Array(6) as _}
            <div class="flex min-h-[8.5rem] items-center gap-4 bg-white border border-gray-200 rounded-xl p-6">
                <div class="w-12 h-12 rounded-2xl bg-gray-100 shrink-0 animate-pulse"></div>
                <div class="min-w-0 flex-1 space-y-2.5 animate-pulse">
                    <div class="h-4 bg-gray-100 rounded w-32"></div>
                    <div class="h-3 bg-gray-50 rounded w-20"></div>
                </div>
            </div>
        {/each}
    </div>
</div>
