<script>
	/* eslint-disable svelte/no-navigation-without-resolve */
	import IZoneLogo from '$lib/assets/icons/IZone-logo.png'
</script>

<!-- class="flex min-h-screen flex-col bgGrid bgGradient cursor-glow" -->
<footer class="footer bg-neutral p-10 text-neutral-content sm:footer-horizontal">
	<div class="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:gap-60">
		<aside>
			<img src={IZoneLogo} alt="Talent izone" class="h-7 w-auto" />
			<p>
				ACME Industries Ltd.
				<br />
				Providing reliable tech since 1992
			</p>
		</aside>
		<nav class="flex flex-col gap-2">
			<h6 class="footer-title">Services</h6>
			<a href="/" class="link link-hover">Branding</a>
			<a href="/" class="link link-hover">Design</a>
			<a href="/" class="link link-hover">Marketing</a>
			<a href="/" class="link link-hover">Advertisement</a>
		</nav>
		<nav class="flex flex-col gap-2">
			<h6 class="footer-title">Company</h6>
			<a href="/" class="link link-hover">About us</a>
			<a href="/" class="link link-hover">Contact</a>
			<a href="/" class="link link-hover">Jobs</a>
			<a href="/" class="link link-hover">Press kit</a>
		</nav>
		<nav class="flex flex-col gap-2">
			<h6 class="footer-title">Legal</h6>
			<a href="/" class="link link-hover">Terms of use</a>
			<a href="/" class="link link-hover">Privacy policy</a>
			<a href="/" class="link link-hover">Cookie policy</a>
		</nav>
	</div>
</footer>
