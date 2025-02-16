<script>
	import AchievementCompact from '../Common/Achievements/AchievementCompact.svelte';

	export let achievements;
</script>

{#if achievements?.length > 0}
	<div class="achievements-section">
		<h3 class="title is-6" style="    margin: 0.2em;">
			<i class="fa-solid fa-medal"></i>
			<span class="maps-title">Achievements</span>
		</h3>
		<div class="achievements-list darkened-background">
			{#each achievements as achievement, idx (achievement.id)}
				<AchievementCompact {achievement} />
			{/each}
		</div>
	</div>
{/if}

<style>
	.achievements-list {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5em;
		padding: 0.5em;
		border-radius: 8px;
	}
	.achievements-section {
		display: flex;
		flex-direction: column;
		gap: 0.4em;
	}
</style>
