<script>
    import { auth } from "$lib/stores/authStore";
</script>

<div class="space-y-6">
    <header>
        <h1 class="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p class="text-gray-500">
            Welcome back, {$auth.user?.name || "Admin"}!
        </p>
    </header>

    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <!-- Stats Cards -->
        <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div class="text-sm font-medium text-gray-500">Total Users</div>
            <div class="mt-2 text-3xl font-bold text-gray-900">1,284</div>
            <div class="mt-2 text-xs text-green-600">+12% from last month</div>
        </div>

        <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div class="text-sm font-medium text-gray-500">Active Jobs</div>
            <div class="mt-2 text-3xl font-bold text-gray-900">45</div>
            <div class="mt-2 text-xs text-green-600">+5% from last month</div>
        </div>

        <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div class="text-sm font-medium text-gray-500">
                New Applications
            </div>
            <div class="mt-2 text-3xl font-bold text-gray-900">128</div>
            <div class="mt-2 text-xs text-blue-600">Pending review</div>
        </div>

        <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div class="text-sm font-medium text-gray-500">Revenue</div>
            <div class="mt-2 text-3xl font-bold text-gray-900">$12,450</div>
            <div class="mt-2 text-xs text-green-600">+8% from last month</div>
        </div>
    </div>

    <!-- Recent Activity Placeholder -->
    <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 class="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <div class="mt-4 space-y-4">
            {#each [1, 2, 3] as i}
                <div
                    class="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold"
                        >
                            U
                        </div>
                        <div>
                            <div class="text-sm font-medium text-gray-900">
                                New user registered
                            </div>
                            <div class="text-xs text-gray-500">2 hours ago</div>
                        </div>
                    </div>
                    <button
                        class="text-xs font-semibold text-purple-600 hover:text-purple-700"
                        >View</button
                    >
                </div>
            {/each}
        </div>
    </div>
</div>
