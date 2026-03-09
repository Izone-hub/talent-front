<script>
	import { setContext } from 'svelte'
	import Navbar from '$lib/components/layout/Navbar.svelte'
	import Footer from '$lib/components/layout/Footer.svelte'
	import './layout.css'
	import favicon from '$lib/assets/icons/izone-favicon.svg'

	let x = 0
	let y = 0
	let glowActive = false

	/** @param {MouseEvent} e */
	function handleMouseMove(e) {
		if (!glowActive) return
		x = e.clientX
		y = e.clientY
	}

	setContext(
		'setGlow',
		/** @param {boolean} value */ (value) => {
			glowActive = value
		}
	)
</script>

<svelte:head>
	<title>iZone | Technology Talent Platform</title>
	<meta
		name="description"
		content="Connecting top technology talent with innovative companies and startups."
	/>

	<!-- Favicon -->
	<link rel="icon" href={favicon} />

	<!-- Optional: better sharing preview -->
	<meta property="og:title" content="iZone | Technology Talent Platform" />
	<meta
		property="og:description"
		content="Connecting top technology talent with innovative companies and startups."
	/>
</svelte:head>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="bgGrid bgGradient cursor-glow flex min-h-screen flex-col"
	class:glow-active={glowActive}
	on:mousemove={handleMouseMove}
	style="--x: {x}px; --y: {y}px;"
>
	<Navbar />

	<main class="relative z-10 grow">
		<slot />
	</main>

	<Footer />
</div>
