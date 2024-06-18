<script>
	import {createEventDispatcher} from 'svelte';
	import {navigate} from 'svelte-routing';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import Value from '../Common/Value.svelte';

	export let item = null;
	export let selected = false;

	const dispatch = createEventDispatcher();

	$: rank = item?.playerInfo?.rank ?? null;
	$: country = item?.playerInfo?.countries?.[0]?.country ?? null;
	$: countryRank = item?.playerInfo?.countries?.[0]?.rank ?? null;
	$: pp = item?.playerInfo?.pp ?? 0;
</script>

{#if item}
	<a
		href={`/u/${item?.alias ?? item?.playerId}`}
		class="player-card"
		on:click|preventDefault|stopPropagation={() => {
			navigate(`/u/${item?.alias ?? item?.playerId}`);
			dispatch('close');
		}}>
		<div class="player-rank">
			<div class={`rank ${rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'brown' : rank >= 10000 ? 'small' : ''}`}>
				#<Value value={rank} digits={0} zero="?" />
			</div>
		</div>
		<div class="player-avatar">
			<Avatar player={item} />
		</div>
		<div class="player-name-and-rank">
			<PlayerNameWithFlag player={item} disablePopover={true} />
		</div>
		<div class="steam-and-pp">
			<div>
				<Value value={pp} suffix="pp" zero="0.00pp" digits={2} />
			</div>
		</div>
	</a>
{/if}

<style>
	.player-card {
		display: inline-grid;
		grid-template-columns: 4.5em 4em auto 1fr;
		grid-template-rows: 1fr;
		align-items: center;
		width: 100%;
		color: var(--textColor) !important;
	}

	.player-card .player-avatar {
		position: relative;
		overflow: visible;
	}

	.player-card .player-avatar :global(figure) {
		width: 2em;
		height: 2em;
		margin-left: 1em;
	}

	.player-card :global(.rank) {
		padding: 0 0.25em;
		font-size: 0.8em;
		font-weight: 500;
		margin-left: 0.25em;
		cursor: pointer;
		flex: none;
	}

	.player-card .player-name-and-rank {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		font-size: 1.1em;
		font-weight: 500;
	}

	.player-card .steam-and-pp {
		display: flex;
		justify-self: end;
		align-items: center;
		font-size: 0.8em;
		font-weight: 500;
		margin-right: 0.25em;
		color: var(--ppColour) !important;
	}

	.player-card :global(.rank.small) {
		font-size: 0.875em;
	}

	.player-card :global(.rank.gold) {
		background-color: darkgoldenrod;
	}

	.player-card :global(.rank.silver) {
		background-color: #888;
	}

	.player-card :global(.rank.brown) {
		background-color: saddlebrown;
	}

	.player-card .player-rank {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 1.1em;
		font-weight: 500;
	}

	@media screen and (max-width: 768px) {
		.player-card {
			grid-template-columns: 50% 50%;
			grid-template-rows: 1fr 1fr;
		}

		.player-card .player-avatar {
			grid-column: 1 / 2;
			grid-row: 1;
			margin-left: -0.8em;
		}

		.player-card .player-name-and-rank {
			grid-column: 1 / 3;
			margin-left: 2.5em;
			grid-row: 1;
		}

		.player-card .player-name-and-rank :global(a) {
			white-space: unset;
			overflow-wrap: break-word;
		}

		.player-card .player-rank {
			grid-column: 1;
			grid-row: 2;
			justify-content: flex-start;
			font-size: 0.8em;
		}

		.player-card .steam-and-pp {
			grid-column: 2;
			grid-row: 2;
		}

		.player-card :global(.rank) {
			font-size: 1em;
		}
	}
</style>
