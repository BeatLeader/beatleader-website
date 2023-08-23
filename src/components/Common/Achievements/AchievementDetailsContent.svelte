<script>
	import {dateFromUnix, formatDateRelative} from '../../../utils/date';

	export let achievement;
	export let level = achievement.level;
	export let showDetails = true;
	export let grey = false;

	let grade = 2;

	if (achievement.achievementDescription.levels.length > 1) {
		achievement.achievementDescription.levels
			.sort((a, b) => b.level - a.level)
			.forEach((element, index) => {
				if (element.level == level.level) {
					grade = index;
				}
			});
	}
</script>

<div class="achievement-container {grey ? 'grey' : ''}">
	{#if showDetails}
		<div class="achievement-description-name">
			<a href={achievement.achievementDescription.link}>{achievement.achievementDescription.name}</a>
		</div>
	{/if}
	<div class="achievement {grade == 0 ? 'gold' : grade == 1 ? 'silver' : ''}" style="background-color: {level.color}" on:click>
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

	.gold {
		box-shadow: 1px 1px 0px 2px #ffd700, -1px -1px 0px 2px #ffcc00, 2px 2px 0px 3px #ffac00, -2px -2px 0px 3px #ff8c00,
			3px 3px 0px 4px #ff7100;
		border-width: 5px;
	}

	.silver {
		box-shadow: 1px 1px 0px 2px #eeeeee, -1px -1px 0px 2px #dcdcdc, 2px 2px 0px 3px #c0c0c0, -2px -2px 0px 3px #a9a9a9,
			3px 3px 0px 4px #808080;
		border-width: 5px;
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
	.grey {
		filter: grayscale();
	}
</style>
