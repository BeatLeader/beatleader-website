<script>
	import Popover from '../Popover.svelte';
	import AchievementDetails from './AchievementDetails.svelte';
	import {fade} from 'svelte/transition';

	export let achievement;

	let referenceElement;

	let level = achievement.level;
</script>

<div class="achievement" style="background-color: {level.color}" bind:this={referenceElement}>
	<img src={level.image} title={level.name} alt={level.name} />
</div>

<Popover triggerEvents={['hover', 'focus']} {referenceElement} placement="top" spaceAway={10}>
	<div class="popover-contents" transition:fade={{duration: 250}}>
		<AchievementDetails {achievement} />
	</div>
</Popover>

<style>
	.achievement {
		display: flex;
		align-items: center;
		border-radius: 0.8em;
		box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
	}

	.achievement img {
		width: 4em;
		height: 4em;
		border-radius: 50%;
	}
</style>
