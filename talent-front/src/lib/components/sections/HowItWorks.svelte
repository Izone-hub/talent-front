<script>
	const steps = [
		{
			num: '01',
			title: 'Create Your Profile',
			description:
				'Showcase your skills, experience, and portfolio in one unified professional identity.',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`,
			color: 'text-blue-500',
			bg: 'bg-blue-100',
			border: 'border-blue-200'
		},
		{
			num: '02',
			title: 'Discover Opportunities',
			description: 'Browse curated roles from top companies that perfectly match your expertise.',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>`,
			color: 'text-indigo-500',
			bg: 'bg-indigo-100',
			border: 'border-indigo-200'
		},
		{
			num: '03',
			title: 'Apply in One Click',
			description: 'Say goodbye to endless forms. Apply to multiple positions seamlessly.',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" /></svg>`,
			color: 'text-violet-500',
			bg: 'bg-violet-100',
			border: 'border-violet-200'
		},
		{
			num: '04',
			title: 'Get Hired',
			description: 'Interview seamlessly through our platform and land your dream job.',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>`,
			color: 'text-emerald-500',
			bg: 'bg-emerald-100',
			border: 'border-emerald-200'
		}
	]
</script>

<section class="relative mx-auto w-full max-w-7xl px-6 py-20 md:px-12 md:py-28 lg:px-20">
	<div class="relative z-10 mb-16 flex flex-col gap-4 text-center sm:mb-24">
		<div class="mx-auto inline-block">
			<span
				class="mb-3 badge rounded-full badge-outline border-violet-400 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-600 shadow-sm badge-secondary"
				>Simple Process</span
			>
		</div>
		<h2 class="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl md:text-5xl">
			How <span class="text-violet-500">iZone</span> Works
		</h2>
		<p class="mx-auto mt-2 max-w-2xl text-base text-gray-500 sm:text-lg">
			Your next career move is just a few steps away. We've made the hiring process as smooth and
			transparent as possible.
		</p>
	</div>

	<!-- Container for steps -->
	<div class="relative grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-4">
		<!-- Desktop connecting line -->
		<div
			class="absolute top-12 right-[12%] left-[12%] z-0 hidden h-0.5 bg-gradient-to-r from-blue-200 via-indigo-300 to-emerald-200 lg:block"
		></div>

		{#each steps as step, index (index)}
			<div class="group relative z-10">
				<!-- Step Number & Icon -->
				<div class="flex flex-col items-center text-center">
					<div
						class="relative mb-6 h-24 w-24 transition-transform duration-300 group-hover:-translate-y-2"
					>
						<!-- Outer animated blur/glow -->
						<div
							class="absolute inset-0 rounded-full bg-white shadow-[0_0_30px_rgba(0,0,0,0.05)] blur-md transition-shadow duration-300 group-hover:shadow-[0_0_40px_rgba(0,0,0,0.1)]"
						></div>

						<!-- Main Icon Circle -->
						<div
							class="absolute inset-0 {step.bg} border-2 {step.border} flex items-center justify-center rounded-full {step.color} z-10 shadow-sm"
						>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html step.icon}
						</div>

						<!-- Floating Step Number -->
						<div
							class="absolute -top-1 -right-1 z-20 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-800 text-xs font-bold text-white shadow-md transition-colors duration-300 group-hover:bg-violet-600"
						>
							{step.num}
						</div>
					</div>

					<!-- Text Content -->
					<h3
						class="mb-3 text-xl font-bold text-slate-800 transition-colors duration-300 group-hover:text-violet-600"
					>
						{step.title}
					</h3>
					<p class="px-2 text-sm leading-relaxed text-slate-500">
						{step.description}
					</p>
				</div>

				<!-- Connector Arrow for mobile and tablet (hidden on lg) -->
				{#if index !== steps.length - 1}
					<div class="my-6 flex justify-center text-slate-300 lg:hidden">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="h-6 w-6 animate-bounce"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M19.5 8.25l-7.5 7.5-7.5-7.5"
							/>
						</svg>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Call to action connecting to the steps -->
	<div class="relative z-10 mt-20 flex justify-center text-center">
		<button
			class="btn h-auto min-h-0 gap-2 rounded-full border-none bg-violet-600 px-10 py-3 text-base font-bold text-white shadow-lg transition-all btn-primary hover:-translate-y-1 hover:bg-violet-700 hover:shadow-xl"
		>
			Start Your Journey Now
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="h-5 w-5"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
				/>
			</svg>
		</button>
	</div>
</section>
