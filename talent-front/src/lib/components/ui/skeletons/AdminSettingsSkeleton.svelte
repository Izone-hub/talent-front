<div class="space-y-6">
    <!-- Form Card -->
    <div class="bg-white rounded-xl border border-gray-100 p-8 space-y-6">
        {#each Array(4) as _}
            <div class="space-y-1.5 animate-pulse">
                <div class="h-4 bg-gray-100 rounded w-32"></div>
                <div class="relative">
                    <div class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded bg-gray-100"></div>
                    <div class="w-full h-11 bg-gray-50 rounded-xl"></div>
                </div>
                <div class="h-3 bg-gray-50 rounded w-40"></div>
            </div>
        {/each}
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between">
        <div class="h-10 w-32 bg-gray-100 rounded-lg animate-pulse"></div>
        <div class="h-10 w-36 bg-gray-100 rounded-xl animate-pulse"></div>
    </div>
</div>
