<script>
	import {search} from '../../stores/search';
	import SearchBox from './SearchBox.svelte';
	import PlayersSearch from './PlayersSearch.svelte';
	import MapsSearch from './MapsSearch.svelte';
	import ClansSearch from './ClansSearch.svelte';
	import EventsSearch from './EventsSearch.svelte';
	import WikiSearch from './WikiSearch.svelte';
	import {onMount} from 'svelte';

	function onClose() {
		$search = false;
	}

	onMount(() => {
		document.documentElement.style.overflow = 'hidden';

		return () => (document.documentElement.style.overflow = 'auto');
	});
</script>

<main>
	<div class="bg" on:click={onClose} />
	<SearchBox let:value on:close={onClose}>
		<PlayersSearch {value} on:close={onClose} />
		<MapsSearch {value} on:close={onClose} />
		<ClansSearch {value} on:close={onClose} />
		<EventsSearch {value} on:close={onClose} />
		<WikiSearch {value} on:close={onClose} />
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
	}
</style>
