<script>
	import {search, searchValue} from '../../stores/search';
	import SearchBox from './SearchBox.svelte';
	import PlayersSearch from './PlayersSearch.svelte';
	import MapsSearch from './MapsSearch.svelte';
	import ClansSearch from './ClansSearch.svelte';
	import EventsSearch from './EventsSearch.svelte';
	import WikiSearch from './WikiSearch.svelte';
	import {onMount} from 'svelte';

	function onClose() {
		$search = false;
		$searchValue = '';
	}

	onMount(() => {
		document.documentElement.style.overflow = 'hidden';

		return () => (document.documentElement.style.overflow = 'auto');
	});
</script>

<main>
	<div class="bg" on:click={onClose} />
	<SearchBox on:close={onClose}>
		<PlayersSearch value={$searchValue} on:close={onClose} />
		<MapsSearch value={$searchValue} on:close={onClose} />
		<ClansSearch value={$searchValue} on:close={onClose} />
		<EventsSearch value={$searchValue} on:close={onClose} />
		<WikiSearch value={$searchValue} on:close={onClose} />
	</SearchBox>
</main>

<style>
	main {
		position: fixed;
		inset: 0;
		z-index: 1000;
	}
	.bg {
		position: absolute;
		inset: 0;
		background-color: var(--customizable-color-1, var(--foreground)) !important;
		opacity: 0.99;
		backdrop-filter: blur(10px);
		--webkit-transofrm: translateZ(0);
		--webkit-perspective: 1000;
		--webkit-backface-visibility: hidden;
		-webkit-backdrop-filter: blur(10px);
	}
</style>
