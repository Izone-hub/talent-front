<script>
	import ProductCard from './ProductCard.svelte'
	import image1 from '$lib/assets/images/image1.jpg'
	let productFeatures = [
		{
			featureList: [
				'Daily streak counter',
				'Weights and reps tracker',
				'Community challenges',
				'Every workout is new and exciting'
			],
			description:
				'Swoley moley ensures all users have the information they need to train safely and train effectively.',
			imgUrl: image1
		}
	]
</script>

<section>
	<div
		class="flex flex-1 flex-col items-center justify-center gap-10 px-20 pb-10 sm:gap-14 md:gap-24 md:pb-14"
	>
		<div class="flex flex-col gap-2">
			<p class="text-center text-base opacity-60 sm:text-lg md:text-xl">
				Start your career journey with <span class="text-indigo-400">real opportunities</span> today
			</p>
			<h3
				class="mx-auto w-full max-w-[1000px] text-center text-4xl font-semibold sm:text-5xl md:text-6xl"
			>
				Our Service
			</h3>
		</div>

		{#each productFeatures as productFeature, index (index)}
			<ProductCard {productFeature} {index}>
				{#if index === 0}
					Experience a beginner exercise <span class="font-medium text-indigo-400">master</span> class
				{/if}
			</ProductCard>
		{/each}
	</div>
</section>
