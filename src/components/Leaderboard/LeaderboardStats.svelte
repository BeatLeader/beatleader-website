<script>
	import LeaderboardStatsDetails from './Details/LeaderboardStats.svelte';

	export let leaderboard;
	export let compact = false;
</script>

<LeaderboardStatsDetails {leaderboard} {compact} />
