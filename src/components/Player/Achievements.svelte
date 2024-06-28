<script>
	import AchievementCompact from '../Common/Achievements/AchievementCompact.svelte';

	export let achievements;
</script>

<div class="achievements-section">
	{#if achievements?.length > 0}
		<h2>Achievements</h2>
		<div class="achievements-list">
			{#each achievements as achievement}
				<AchievementCompact {achievement} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.achievements-list {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5em;
	}
	.achievements-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 0.5em;
	}
</style>
