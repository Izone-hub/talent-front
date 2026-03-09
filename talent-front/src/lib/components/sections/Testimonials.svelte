<script>
/* eslint-disable svelte/no-navigation-without-resolve */
	const testimonials = [
		{
			name: 'Sarah Jenkins',
			role: 'Senior Software Engineer',
			company: 'TechNova Solutions',
			quote:
				'I found my dream job in just two weeks using this platform. The AI matching algorithm instantly connected me with a startup that perfectly fit my niche technical background in Rust.',
			avatar: 'https://i.pravatar.cc/150?img=1', // using placeholder avatars that look like real people instead of random products for a better visual representation
			linkedin: 'https://linkedin.com/in/#'
		},
		{
			name: 'David Chen',
			role: 'Product Manager',
			company: 'Innovate AI',
			quote:
				'The one-click application feature saved me hours of repetitive data entry. I applied to 5 high-quality positions on my lunch break and secured 3 interviews by the end of the week.',
			avatar: 'https://i.pravatar.cc/150?img=11',
			linkedin: 'https://linkedin.com/in/#'
		},
		{
			name: 'Elena Rodriguez',
			role: 'Lead UI/UX Designer',
			company: 'Creative Studio',
			quote:
				'As a designer, I appreciated the clean interface and how well the portal allows you to showcase your portfolio. The companies here are top-tier and seriously looking for talent.',
			avatar: 'https://i.pravatar.cc/150?img=5',
			linkedin: 'https://linkedin.com/in/#'
		}
	]
</script>

<section class="relative mx-auto w-full max-w-7xl px-6 py-20 md:px-12 md:py-28 lg:px-20">
	<div class="relative z-10 mb-16 flex flex-col gap-4 text-center">
		<div class="mx-auto inline-block">
			<span
				class="mb-3 badge rounded-full badge-outline border-sky-400 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-600 shadow-sm badge-primary"
				>Success Stories</span
			>
		</div>
		<h2 class="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl md:text-5xl">
			Loved by <span class="text-sky-500">thousands</span>
		</h2>
		<p class="mx-auto mt-2 max-w-2xl text-base text-gray-500 sm:text-lg">
			Don't just take our word for it. Hear from the professionals who have accelerated their
			careers using iZone.
		</p>
	</div>

	<!-- Testimonial Grid -->
	<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
		{#each testimonials as testimonial (testimonial.name)}
			<div
				class="group card relative z-10 border border-slate-100 bg-white shadow-md transition-all duration-300 hover:shadow-xl"
			>
				<!-- Decorative quote mark background -->
				<div
					class="absolute top-6 right-6 font-serif text-6xl leading-none text-slate-100 opacity-50 transition-colors select-none group-hover:text-sky-50"
				>
					"
				</div>

				<div class="relative z-10 card-body flex h-full flex-col justify-between p-8">
					<div>
						<!-- Stars rating -->
						<div class="mb-6 flex gap-1 text-amber-400">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="h-5 w-5"
								><path
									fill-rule="evenodd"
									d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
									clip-rule="evenodd"
								/></svg
							>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="h-5 w-5"
								><path
									fill-rule="evenodd"
									d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
									clip-rule="evenodd"
								/></svg
							>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="h-5 w-5"
								><path
									fill-rule="evenodd"
									d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
									clip-rule="evenodd"
								/></svg
							>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="h-5 w-5"
								><path
									fill-rule="evenodd"
									d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
									clip-rule="evenodd"
								/></svg
							>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="h-5 w-5"
								><path
									fill-rule="evenodd"
									d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
									clip-rule="evenodd"
								/></svg
							>
						</div>

						<p class="mb-8 leading-relaxed text-slate-600 italic">
							"{testimonial.quote}"
						</p>
					</div>

					<!-- Divider -->
					<div class="mb-6 h-px w-full bg-slate-100"></div>

					<!-- Profile Info -->
					<div class="mt-auto flex items-center justify-between">
						<div class="flex items-center gap-4">
							<div class="avatar">
								<div
									class="h-12 w-12 rounded-full ring ring-sky-100 ring-offset-2 ring-offset-base-100"
								>
									<img src={testimonial.avatar} alt={testimonial.name} />
								</div>
							</div>
							<div class="flex flex-col">
								<span class="text-[15px] font-bold text-slate-800">{testimonial.name}</span>
								<span class="text-xs text-slate-500">{testimonial.role}</span>
								<span class="text-[10px] font-semibold tracking-wider text-sky-600 uppercase"
									>{testimonial.company}</span
								>
							</div>
						</div>

						<a
							href={testimonial.linkedin}
							target="_blank"
							rel="noopener noreferrer"
							class="rounded-full p-2 text-slate-300 transition-colors hover:bg-sky-50 hover:text-[#0A66C2]"
							aria-label="LinkedIn Profile"
						>
							<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path
									fill-rule="evenodd"
									d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
									clip-rule="evenodd"
								/>
							</svg>
						</a>
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>
