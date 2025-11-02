<script>
	import Popover from '../Popover.svelte';
	import AchievementDetails from './AchievementDetails.svelte';
	import {fade} from 'svelte/transition';

	export let achievement;

	let referenceElement;

	let level = achievement.level;

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

<div
	class="achievement {grade == 0 ? 'gold' : grade == 1 ? 'silver' : ''}"
	style="background-color: {level.color}"
	bind:this={referenceElement}>
	<img src={level.image} title={level.name} alt={level.name} />
</div>

<Popover triggerEvents={['hover', 'focus']} {referenceElement} placement="top" remainOpenOnPopoverHover={true} spaceAway={10}>
	<div class="popover-contents" transition:fade|global={{duration: 250}}>
		<AchievementDetails {achievement} />
	</div>
</Popover>

<style>
	.achievement {
		display: flex;
		align-items: center;
		border-radius: 0.8em;
		box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
		overflow: hidden;
	}

	:global(.popover-contents .atropos-highlight) {
		top: -150% !important;
		height: 400% !important;
	}

	.achievement img {
		width: 4em;
		height: 4em;
	}

	.gold {
		box-shadow:
			1px 1px 0px 1px #ffd700,
			-1px -1px 0px 1px #ffcc00,
			2px 1px 0px 2px #ffac00,
			-1px -1px 0px 2px #ff8c00;
	}

	.silver {
		box-shadow:
			1px 1px 0px 1px #eeeeee,
			-1px -1px 0px 1px #dcdcdc,
			2px 1px 0px 2px #c0c0c0,
			-2px -1px 0px 2px #a9a9a9;
	}
</style>
