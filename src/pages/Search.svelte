<script>
	import Search from '../components/Search/Search.svelte';
	import PlayersSearch from '../components/Search/PlayersSearch.svelte';
	import MapsSearch from '../components/Search/MapsSearch.svelte';

	export let title = 'Find a player profile';
	export let changeTitle = false;
	export let focusField = true;

	function onClose() {
		console.error('Close search');
	}
</script>

<article>
	<Search let:value on:close={onClose}>
		<PlayersSearch {value} on:close={onClose} />
		<MapsSearch {value} on:close={onClose} />
	</Search>
</article>

<style>
	article {
		width: 100%;
		margin: 0 auto;
		text-align: center;
	}
</style>
