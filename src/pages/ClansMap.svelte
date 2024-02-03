<script>
	import GlobalClansMap from '../components/Clans/GlobalClansMap2.svelte';

	export let leaderboardId;
	export let clanTag;
	export let save = false;
</script>

<GlobalClansMap {leaderboardId} {clanTag} {save} />
