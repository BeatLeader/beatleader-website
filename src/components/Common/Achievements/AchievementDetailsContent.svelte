<script>
	import {dateFromUnix, formatDateRelative} from '../../../utils/date';

	export let achievement;
	export let showDetails = true;

	let level = achievement.level;
</script>

<div class="achievement-container">
	{#if showDetails}
		<div class="achievement-description-name">
			<span>{achievement.achievementDescription.name}</span>
		</div>
	{/if}
	<div class="achievement" style="background-color: {level.color}">
		<img src={level.image} alt={level.name} />
		<div class="achievement-details">
			<div class="achievement-name">{level.name}</div>
			<div class="achievement-description">{level.description}</div>
		</div>
	</div>
	{#if showDetails}
		<div class="timeset">{formatDateRelative(dateFromUnix(achievement.timeset))}</div>
	{/if}
</div>

<style>
	.achievement {
		display: flex;
		align-items: center;
		margin-bottom: 1rem;
		padding: 0.8em;
		border-radius: 0.8em;
		box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
	}

	.achievement img {
		width: 7em;
		height: 7em;
		border-radius: 50%;
		margin: -0.7em 0.8em -0.7em -0.7em;
	}

	.achievement-details {
		display: flex;
		flex-direction: column;
		grid-gap: 0.5rem;
		margin-right: 0.3em;
	}

	.achievement-name {
		font-size: 1.2rem;
		font-weight: bold;
	}

	.achievement-description {
		font-size: 1rem;
	}

	.achievement-description-name {
		display: none;
	}

	.achievement-container:hover .achievement-description-name {
		display: block;
	}

	.timeset {
		font-size: 0.8rem;
		color: #666;
		display: none;
	}
	.achievement-container:hover .timeset {
		display: block;
	}
</style>
