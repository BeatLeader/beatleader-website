<script>
	import Avatar from '../Common/Avatar.svelte';
	import Popover from '../Common/Popover.svelte';
	import MiniProfile from '../Player/Mini/MiniProfile.svelte';
	import {fade} from 'svelte/transition';

	export let player;
	export let type = null;
	export let playerClickFilter = null;
	export let disablePopover = false;
	export let showRank = true;
	export let cls = null;

	let referenceElement;

	$: name = player?.name;
	$: playerId = player?.alias ?? player?.playerId ?? player?.id;
</script>

<a
	href={`/u/${playerId}${type ? '/' + type : ''}/1${playerClickFilter ? '?' + playerClickFilter : ''}`}
	class="player-name clickable has-pointer-events {cls}"
	bind:this={referenceElement}
	on:click|preventDefault>
	{#if showRank}
		<span class="rank">{'#' + (player?.playerInfo?.rank ?? '?')}</span>
	{/if}
	<Avatar {player} />
	<span class="name">{name ?? 'Unknown'}</span>
</a>

{#if !disablePopover && player && player.playerInfo}
	<Popover triggerEvents={['hover', 'focus']} {referenceElement} placement="auto" spaceAway={10}>
		<div class="popover-contents" transition:fade|global={{duration: 250}}>
			<MiniProfile {player} />
		</div>
	</Popover>
{/if}

<style>
	a {
		color: inherit;
	}

	.player-name {
		white-space: normal;
		overflow: visible;
		word-break: break-all;
		max-height: 2em;
		display: flex;
		gap: 0.6em;
	}

	.player-name :global(> img) {
		margin-right: 0.125rem;
	}

	.crown {
		position: relative;
		top: -0.125em;
	}

	.popover-contents {
		max-width: 40em;
	}
</style>
