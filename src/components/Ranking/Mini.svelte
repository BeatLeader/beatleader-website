<script>
	import {createEventDispatcher, tick} from 'svelte';
	import {opt} from '../../utils/js';
	import {navigate} from 'svelte-routing';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import Value from '../Common/Value.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import Flag from '../Common/Flag.svelte';
	import {fade} from 'svelte/transition';

	const dispatch = createEventDispatcher();

	export let players = null;
	export let rank = 0;
	export let country = false;

	let miniRanking = null;

	let isLoading = false;
	let comparePp = null;

	const prevTitle = 'vs ${value}';

	async function onParamsChanged(players) {
		try {
			miniRanking = null;
			comparePp = null;

			if (!players) return;

			comparePp = opt(
				players.find(p => (country ? opt(p, 'countryRank') : opt(p, 'rank')) === rank),
				'pp'
			);
			miniRanking = players;

			await tick();
			dispatch('height-changed');
		} finally {
			isLoading = false;
		}
	}

	$: onParamsChanged(players);
</script>

{#if miniRanking}
	<section transition:fade>
		<h3 class="title is-6">
			{#if country}
				<Flag country={miniRanking[0].country} />
			{:else}
				<i class="fas fa-globe-americas svelte-1pb1u1r" />
			{/if}
			<span>{country ? 'Country' : 'Global'} ranking</span>
			{#if isLoading}
				<Spinner />
			{/if}
		</h3>
		{#if miniRanking}
			<div class="players">
				{#each miniRanking as player}
					<div class="rank">
						<Value value={country ? player.countryRank : player.rank} zero="" digits={0} prefix="#" />
					</div>

					<PlayerNameWithFlag {player} on:click={() => navigate(`/u/${player.id}`)} />

					<div class="pp">
						<Value value={player.pp} prevValue={comparePp} zero="" suffix="pp" {prevTitle} />
					</div>
				{/each}
			</div>
		{/if}
	</section>
{/if}

<style>
	section {
		width: 100%;

		padding: 0.5em;
		font-size: 0.875em;
	}

	h3 {
		padding: 0.25em;
		margin-bottom: 0.75em !important;
	}

	h3 > span {
		margin-left: 0.25em;
	}

	.players {
		display: grid;
		grid-template-columns: auto 1fr auto;
		grid-row-gap: 0.25em;
	}

	.players :global(> *) {
		border-bottom: 1px solid var(--dimmed);
		padding: 0.125em 0.25em;
	}

	.rank {
		text-align: right;
	}

	.rank :global(.value) {
		font-weight: bold;
	}

	.players :global(.player-name) {
		overflow-x: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.pp {
		display: inline-flex;
		align-items: center;
		min-width: 10.75em;
		color: var(--ppColour);
	}

	.pp :global(> :nth-child(2)) {
		margin-left: 0.5em;
	}
</style>
