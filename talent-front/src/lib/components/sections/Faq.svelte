<script>
	let faqs = [
		{
			question: 'Who can join iZone?',
			ans: 'iZone is open to developers, designers, data analysts, engineers, and other tech professionals at all experience levels, as well as companies seeking talent.'
		},
		{
			question: 'Is iZone free to use?',
			ans: 'browsing opportunities on iZone is free. Some premium features or services may require a subscription.'
		},
		{
			question: 'Can I apply for jobs directly through iZone?',
			ans: 'Yes, you can apply to job opportunities directly on iZone and manage your applications from your personal dashboard.'
		},
		{
			question: 'Does iZone support remote work opportunities?',
			ans: 'Yes, iZone features both local and remote job opportunities, allowing talent to work with companies from anywhere.'
		},
		{
			question: 'How does iZone ensure quality and trust?',
			ans: 'iZone uses profile reviews, skill verification, and optional document checks to maintain high-quality and trusted talent on the platform.'
		},
		{
			question: 'Can I customize my profile on iZone?',
			ans: 'Absolutely. You can personalize your profile with your skills, experience, portfolio, and career preferences to attract the right opportunities.'
		}
	]
</script>

<section id="faqs">
	<div
		class="flex flex-1 flex-col items-center justify-center gap-10 px-20 py-20 sm:gap-14 md:gap-24"
	>
		<div class="flex flex-col gap-2">
			<p class="text-center text-base opacity-60 sm:text-lg md:text-xl">
				For all your questions, qualms & queries
			</p>
			<h3
				class="mx-auto w-full max-w-[1000px] text-center text-4xl font-semibold sm:text-5xl md:text-6xl"
			>
				Frequently Asked Questions
			</h3>
		</div>
		<div class="grid w-full gap-8 sm:gap-10 md:grid-cols-2 md:gap-14">
			{#each faqs as faq (faq.question)}
				<div class="relative mx-auto flex w-full max-w-[800px] flex-col gap-2 p-4 px-6 text-left">
					<div class="absolute top-0 left-0 h-[1px] w-1/3 -translate-x-4 bg-slate-950"></div>
					<div class="absolute top-0 left-0 h-2/3 w-[1px] -translate-y-4 bg-slate-950"></div>
					<h4 class="pt-2 text-lg sm:text-xl md:text-2xl">
						{faq.question}
					</h4>
					<p class="pl-2">{faq.ans}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
