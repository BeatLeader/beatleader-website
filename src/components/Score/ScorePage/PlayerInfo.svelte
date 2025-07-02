<script>
	import {getHeadsetForHMD} from '../../../utils/beatleader/format';
	import Avatar from '../../Common/Avatar.svelte';
	import Popover from '../../Common/Popover.svelte';
	import MiniProfile from '../../Player/Mini/MiniProfile.svelte';
	import {fade} from 'svelte/transition';

	export let player;
	export let score;
	export let type = null;
	export let playerClickFilter = null;
	export let disablePopover = false;

	let referenceElement;

	$: name = player?.name;
	$: playerId = player?.alias ?? player?.playerId ?? player?.id;
	$: hmd = getHeadsetForHMD(score?.score?.hmd ?? 0);
</script>

<a
	href={`/u/${playerId}${type ? '/' + type : ''}/1${playerClickFilter ? '?' + playerClickFilter : ''}`}
	class="player-name clickable has-pointer-events"
	bind:this={referenceElement}
	on:click|preventDefault>
	<Avatar {player} cls="profile-info-avatar" big={true} />
	<div class="name-and-details">
		<div class="name-and-headset">
			<span class="name">{name ?? 'Unknown'}</span>
			with
			<div class="icon-and-hmd">
				<img src={'/assets/' + hmd.icon} alt={hmd.name} style={`width: 1.2em; filter: ${hmd?.color}`} />
				<span class="hmd">{hmd.name}</span>
			</div>
		</div>
		<div class="rank-and-pp">
			<span class="rank">{'#' + (player?.playerInfo?.rank ?? '?')}</span>
			<span class="pp">{Math.round(player?.playerInfo?.pp ?? 0, 0)}pp</span>
		</div>
	</div>
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
		overflow: visible;
		word-break: break-all;
		display: flex;
		align-items: center;
		gap: 0.6em;
		padding: 0.5em;
		background-color: #0000003b;
		margin-top: 0.6em;
		border-radius: 0 0 12px 12px;
		position: relative;
	}

	:global(.profile-info-avatar) {
		height: 4em;
		width: 4em;
	}

	.name {
		font-size: 1.4em;
	}

	.pp {
		color: var(--ppColour);
	}

	.name-and-details {
		display: flex;
		flex-direction: column;
	}

	.name-and-headset {
		display: flex;
		gap: 0.5em;
		align-items: baseline;
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
