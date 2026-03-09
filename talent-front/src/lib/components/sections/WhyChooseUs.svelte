<script>
	const benefits = [
		{
			title: 'Verified Companies',
			description:
				"Every employer is manually vetted to ensure you're applying to legitimate, high-quality roles.",
			icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>`,
			color: 'text-blue-600',
			bg: 'bg-blue-100',
			iconBg: 'bg-blue-500'
		},
		{
			title: 'Easy One-Click Applications',
			description:
				'Apply to multiple positions effortlessly. Your profile acts as your dynamic resume.',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" /></svg>`,
			color: 'text-emerald-600',
			bg: 'bg-emerald-100',
			iconBg: 'bg-emerald-500'
		},
		{
			title: 'Real-Time Tracking',
			description:
				'No more black holes. Know exactly where you stand with transparent application status updates.',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>`,
			color: 'text-violet-600',
			bg: 'bg-violet-100',
			iconBg: 'bg-violet-500'
		},
		{
			title: 'AI-Powered Job Matching',
			description:
				'Our smart algorithms suggest positions perfectly tailored to your skills and preferences.',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>`,
			color: 'text-fuchsia-600',
			bg: 'bg-fuchsia-100',
			iconBg: 'bg-fuchsia-500'
		}
	]
</script>

<section class="bg-slate-50/50 px-6 py-16 md:px-12 md:py-24 lg:px-20">
	<div class="mx-auto w-full max-w-7xl">
		<div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
			<!-- Left Side: Text and Graphics -->
			<div class="relative flex flex-col gap-6">
				<!-- Decorative element -->
				<div
					class="absolute -top-10 -left-10 -z-10 h-32 w-32 rounded-full bg-indigo-200/50 blur-3xl"
				></div>
				<div
					class="absolute right-10 bottom-0 -z-10 h-40 w-40 rounded-full bg-pink-200/50 blur-3xl"
				></div>

				<div class="inline-flex">
					<span
						class="badge rounded-full badge-outline border-indigo-400 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-600 shadow-sm badge-primary"
						>Platform Benefits</span
					>
				</div>

				<h2
					class="text-3xl leading-tight font-bold tracking-tight text-slate-800 sm:text-4xl md:text-5xl"
				>
					Why the best talent <br class="hidden sm:block" />
					<span class="group relative inline-block text-indigo-600">
						chooses iZone
						<!-- Animated underline -->
						<span
							class="absolute -bottom-2 left-0 h-1.5 w-full origin-left scale-x-0 rounded-full bg-indigo-300 transition-transform duration-300 ease-out group-hover:scale-x-100"
						></span>
					</span>
				</h2>

				<p class="mt-2 max-w-lg text-base leading-relaxed text-gray-500 sm:text-lg">
					We've completely reimagined the hiring process. Say goodbye to the frustrations of
					traditional job hunting and embrace a platform that works for you.
				</p>

				<!-- Small Stats block -->
				<div class="mt-6 flex gap-6">
					<div class="flex flex-col">
						<span class="text-3xl font-black text-slate-800">10k+</span>
						<span class="text-sm font-medium text-slate-500">Active Jobs</span>
					</div>
					<div class="h-12 w-px self-center bg-slate-200"></div>
					<div class="flex flex-col">
						<span class="text-3xl font-black text-slate-800">95%</span>
						<span class="text-sm font-medium text-slate-500">Response Rate</span>
					</div>
				</div>
			</div>

			<!-- Right Side: Features Grid -->
			<div class="relative grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6">
				<!-- Center blurred orb -->
				<div
					class="absolute top-1/2 left-1/2 -z-10 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/20 blur-3xl"
				></div>

				{#each benefits as benefit, index (benefit.title)}
					<!-- Applying stagger animation to odds and evens via Tailwind offsets -->
					<div
						class="group card z-10 overflow-hidden border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl {index %
							2 !==
						0
							? 'sm:mt-8'
							: ''}"
					>
						<!-- Hover colored top border -->
						<div
							class="absolute top-0 left-0 h-1 w-full {benefit.iconBg} origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
						></div>

						<div class="card-body gap-4 p-6 sm:p-7">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-xl {benefit.bg} {benefit.color} shadow-sm transition-colors duration-300"
							>
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html benefit.icon}
							</div>

							<h3 class="text-lg leading-tight font-bold text-slate-800">
								{benefit.title}
							</h3>

							<p class="text-sm leading-relaxed text-slate-500">
								{benefit.description}
							</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>
