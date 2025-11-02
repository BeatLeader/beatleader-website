<script>
	import AchievementDetailsContent from './AchievementDetailsContent.svelte';
	import {dateFromUnix, formatDateRelative} from '../../../utils/date';

	export let achievement;

	let showDetails = false;
</script>

<div class="main-container">
	<div class="achievement-descriptions-container">
		<div class="achievement-description-name">
			<a href={achievement.achievementDescription.link}>{achievement.achievementDescription.name}</a>
		</div>
		<div class="achievement-description-description">
			{achievement.achievementDescription.description}
		</div>
	</div>
	{#each achievement.achievementDescription.levels as level}
		<AchievementDetailsContent {achievement} {showDetails} {level} grey={level.level != achievement.level.level} />
		{#if level.level == achievement.level.level}
			<div class="timeset">{formatDateRelative(dateFromUnix(achievement.timeset))}</div>
		{/if}
	{/each}
</div>

<style>
	.main-container {
		display: flex;
		gap: 1em;
		flex-direction: column;
		padding: 2em;
		color: var(--textColor) !important;
	}
	.achievement-descriptions-container {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		margin-bottom: 1em;
	}
	.achievement-description-name {
		font-size: larger;
		font-weight: bold;
	}
	.achievement-description-description {
		font-size: small;
		color: #666;
		text-decoration: underline;
		max-width: 30em;
	}
	.timeset {
		margin-top: -1em;
	}
	:global(.atropos-inner) {
		overflow: visible !important;
	}
	:global(.atropos-scale) {
		pointer-events: none;
	}

	:global(.atropos-rotate) {
		pointer-events: all;
	}
</style>
