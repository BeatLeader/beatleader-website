<script>
	import {createEventDispatcher} from 'svelte';
	import createRankingService from '../../services/accsaber';
	import {opt, capitalize} from '../../utils/js';
	import {navigate} from 'svelte-routing';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import Value from '../Common/Value.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import Flag from '../Common/Flag.svelte';
	import {fade} from 'svelte/transition';

	const dispatch = createEventDispatcher();

	export let playerId = null;
	export let numOfPlayers = 5;
	export let category = '';

	let rankingService = createRankingService();
	let miniRanking = null;
	var compareAp;

	let isLoading = false;
	let categories;

	var currentCategoryName = category;

	const prevTitle = 'vs ${value}';
	var categoriesOrder = ['overall', 'true', 'standard', 'tech'];

	async function onParamsChanged(playerId, category, numOfPlayers) {
		try {
			miniRanking = null;

			if (!playerId) return;

			categories = await rankingService.getPlayer(playerId);

			const currentCategory = categories.find(el => el.category === category);

			isLoading = true;

			const ranking = await rankingService.getMiniRanking(currentCategory?.rank, category, numOfPlayers);
			if (!ranking) return;
			miniRanking = ranking;
			categoriesOrder = categoriesOrder;
			compareAp = currentCategory?.ap;

			dispatch('height-changed');
		} finally {
			isLoading = false;
		}
	}

	$: onParamsChanged(playerId, currentCategoryName, numOfPlayers);
</script>

{#if miniRanking || isLoading}
	<section>
		<h3 style="display: flex;" class="title is-6">
			<div style="width: 20px; height: 20px" class="accsaber-icon" />
			<span>{capitalize(currentCategoryName)} acc ranking</span>
			{#if isLoading}
				<Spinner />
			{/if}
			<div class="bullets {currentCategoryName}">
				{#each categoriesOrder as card, cardIdx}
					<span title="{capitalize(card)} acc" class:active={card === currentCategoryName} on:click={() => (currentCategoryName = card)} />
				{/each}
			</div>
		</h3>
		{#if miniRanking?.length}
			<div class="players">
				{#each miniRanking as player}
					<div class="rank">
						<Value value={opt(player, 'rank')} zero="" digits={0} prefix="#" />
					</div>

					<PlayerNameWithFlag
						type="accsaber/{currentCategoryName}/ap"
						player={{name: player.playerName, playerId: player.playerId}}
						on:click={() => navigate(`/u/${player.playerId}/accsaber/${currentCategoryName}/ap/1`)} />

					<div class="pp">
						<Value value={opt(player, 'ap')} prevValue={compareAp} zero="" suffix="ap" {prevTitle} />
					</div>
				{/each}
			</div>
		{:else}
			No data.
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
		border-bottom: 1px solid var(--row-separator);
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

	.bullets {
		text-align: center;
		margin-left: auto;
		margin-right: 0;
	}

	.bullets > span {
		display: inline-block;
		width: 1em;
		height: 1em;
		background-color: var(--dimmed);
		border-radius: 50%;
		cursor: pointer;
		margin: 0 0.25em;
		transition: background-color 300ms;
	}

	.bullets > span.active {
		background-color: var(--textColor);
	}
</style>
