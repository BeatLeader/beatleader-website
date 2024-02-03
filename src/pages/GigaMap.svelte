<script>
	import GigaMap from '../components/Clans/GigaMap.svelte';

	export let leaderboardId;
	export let topCount;
</script>

<GigaMap {leaderboardId} {topCount} />
