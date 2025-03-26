<script>
	import {navigate} from 'svelte-routing';
	import {fly, fade} from 'svelte/transition';
	import Popover from '../Common/Popover.svelte';
	import MiniProfile from '../Player/Mini/MiniProfile.svelte';

	export let mapper;
	export let noPopover = false;
	let referenceElement;

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}`);
	}
</script>

{#if mapper.playerId}
	<a
		href="/u/{mapper.playerId}"
		class="mapper-container"
		bind:this={referenceElement}
		on:click|preventDefault={() => navigateToPlayer(mapper.playerId)}>
		<img loading="lazy" class="mapper-avatar" src={mapper.avatar} />
		<span>{mapper.name}</span>
	</a>
	{#if !noPopover}
		<Popover triggerEvents={['hover', 'focus']} placement="bottom" {referenceElement} spaceAway={10}>
			<div class="popover-contents" transition:fade|global={{duration: 250}}>
				<MiniProfile player={{playerId: mapper.playerId, name: mapper.name, playerInfo: {}}} />
			</div>
		</Popover>
	{/if}
{:else}
	<div class="mapper-container">
		{#if mapper.authorName}
			<i class="fa-solid fa-circle-info map-name-info" title="Missing collaborators were detected. This is the map author name." />
		{:else}
			<img loading="lazy" class="mapper-avatar" src={mapper.avatar} />
		{/if}
		<span>{mapper.name}</span>
	</div>
{/if}

<style>
	.mapper-container {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: 0.25em;
		border-radius: 0.6em;
		padding: 0.3em;
		padding-right: 0.5em;
		color: white;
		background-color: #20202073;
		min-width: fit-content;
	}

	.mapper-container:hover {
		background-color: #474747a1;
	}

	.mapper-avatar {
		width: 1.45em;
		aspect-ratio: 1;
		border-radius: 100%;
	}

	.map-name-info {
		color: white;
		opacity: 0.75;
		align-self: center;
	}
</style>
