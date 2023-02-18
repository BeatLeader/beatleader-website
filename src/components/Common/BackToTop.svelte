<script>
	import Button from './Button.svelte';

	export let showOnPx = 150;
	let hidden = true;

	function goTop() {
		document.body.scrollIntoView({behavior: 'smooth'});
	}

	function scrollContainer() {
		return document.documentElement || document.body;
	}

	function handleOnScroll() {
		if (!scrollContainer()) {
			return;
		}

		if (scrollContainer().scrollTop > showOnPx) {
			hidden = false;
		} else {
			hidden = true;
		}
	}
</script>

<svelte:window on:scroll={handleOnScroll} />

<Button iconFa="fas fa-arrow-up" cls="back-to-top {hidden ? 'hidden' : ''}" title="Back to top" on:click={goTop} />

<style>
	:global(.back-to-top) {
		opacity: 1;
		transition: opacity 0.5s, visibility 0.5s;
		position: fixed !important;
		z-index: 99;
		right: 20px;
		user-select: none;
		bottom: 20px;
	}

	:global(.back-to-top.hidden) {
		opacity: 0;
		visibility: hidden;
	}
</style>
