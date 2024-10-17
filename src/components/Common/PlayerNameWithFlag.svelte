<script>
	import Flag from './Flag.svelte';
	import Popover from './Popover.svelte';
	import {fade} from 'svelte/transition';
	import MiniProfile from '../Player/Mini/MiniProfile.svelte';

	export let player;
	export let type = null;
	export let hideFlag = false;
	export let withCrown = false;
	export let playerClickFilter = null;
	export let disablePopover = false;

	let referenceElement;

	$: country = player?.playerInfo?.country?.country ?? player?.country;
	$: name = player?.name;
	$: playerId = player?.alias ?? player?.playerId ?? player?.id;
</script>

<a
	href={`/u/${playerId}${type ? '/' + type : ''}/1${playerClickFilter ? '?' + playerClickFilter : ''}`}
	class="player-name clickable has-pointer-events"
	bind:this={referenceElement}
	on:click|preventDefault>
	{#if !hideFlag}
		<Flag {country} on:flag-click />
	{/if}
	<span class="name"
		>{#if withCrown}<span class="crown">👑</span>{/if}{name ?? 'Unknown'}</span>
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
		color: inherit !important;
	}

	.player-name {
		white-space: normal;
		overflow-x: hidden;
		overflow: hidden;
		word-break: break-all;
		max-height: 2em;
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
