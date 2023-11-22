<script>
	import {DAY} from '../../utils/date';
	import {formatNumber} from '../../utils/format';
	import playersApiClient from '../../network/clients/beatleader/player/api';
	import createLocalStorageStore from '../../stores/localstorage';

	const playersCache = createLocalStorageStore('rt-players');

	export let totals;
	export let count;

	const keys = {
		criteriaMet: 'Criteria checked',
		approved: 'RT approved',
	};

	let diffsReversed = null;
	let voters = null;

	async function fetchPlayers(diffs) {
		var reversed = diffs.reverse();

		var players = [];
		var votes = [];
		reversed.forEach(element => {
			if (element.votes) {
				element.votes.forEach(element => {
					if (!players.includes(element.playerId)) {
						players.push(element.playerId);
						votes.push(element);
					}
				});
			}
		});

		const cachedPlayerIds = Object.keys($playersCache);
		const playersToFetch = players.filter(
			playerId =>
				!cachedPlayerIds.includes(playerId) || !$playersCache[playerId]?.avatar || $playersCache[playerId]?.updated + DAY < Date.now()
		);

		if (playersToFetch.length) {
			playersToFetch.map(
				async playerId =>
					await playersApiClient.getProcessed({playerId}).then(player => {
						const {playerId, name, playerInfo} = player ?? {};
						$playersCache[playerId] = {playerId, name, avatar: playerInfo.avatar, updated: Date.now()};
					})
			);
		}

		diffsReversed = reversed;
		voters = votes;
	}

	$: fetchPlayers(totals?.byDiff ?? []);
</script>

{#if totals && diffsReversed}
	<div
		class="ratio"
		class:neutral={totals.votesTotal === 0}
		class:ok={totals.votesRating >= 0.666}
		class:warning={totals.votesRating < 0.666 && totals.votesRating > 0.5}
		class:error={totals.votesRating <= 0.5}
		title={`${totals?.byDiff?.length > 1 ? 'Total / ' : ''}Positive: ${totals.votesPositive}, Negative: ${totals.votesNegative}, Total: ${
			totals.votesTotal
		}\n${
			totals?.byDiff?.length > 1
				? totals.byDiff
						.map(
							d =>
								`${d.name} / Rating: ${formatNumber(d.votesRating)}, Positive: ${d.votesPositive}, Negative: ${d.votesNegative}, Total: ${
									d.votesTotal
								}`
						)
						.join('\n')
				: ''
		}`}>
		<div class="value">
			{#if totals.votesRating >= 0.7}
				<i class="fa fa-check" />
			{:else}
				<i class="fa fa-xmark" />
			{/if}
			<span>{formatNumber(totals.votesRating)}</span>
		</div>
		{#if voters?.length}
			<div class="dots">
				{#each voters as vote}
					{#if $playersCache[vote.playerId]}
						<img
							class="voter {vote.value == 1 ? 'positive-vote' : vote.value == 3 ? 'negative-vote' : 'neutral-vote'}"
							src={$playersCache[vote.playerId].avatar} />
					{/if}
				{/each}
			</div>
		{/if}
	</div>
	<div class="totals" class:with-count={!!count}>
		{#if count}
			{#each Object.keys(keys) as key (key)}
				<div
					class="ratio"
					class:ok={totals[`${key}Ratio`] === 1}
					class:warning={totals[`${key}Ratio`] < 1 && totals[`${key}Ratio`] > 0}
					class:error={totals[`${key}Ratio`] === 0}
					title={`${keys[key]}\n${totals.byDiff.map(d => `${d.name} / ${d?.[key] ?? '???'}`).join('\n')}`}>
					<div class="value">
						{#if totals[`${key}Ratio`] === 1}
							<i class="fa fa-check" />
						{:else}
							<i class="fa fa-xmark" />
						{/if}
						{totals[key]} / {count}
					</div>
					{#if diffsReversed.length}
						<div class="dots">
							{#each diffsReversed as d}
								<div
									title={`${d.name} / ${d?.[key] ?? '???'}`}
									class:ok={d?.[key] === 'Yes'}
									class:warning={d?.[key] === 'On hold'}
									class:error={d?.[key] === 'Failed'} />
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
{/if}

<style>
	.totals {
		gap: 0.25rem;
		align-items: center;
	}

	.totals {
		display: grid;
		align-items: flex-start;
		grid-template-columns: 50% 50%;
		gap: 0.7rem;
		margin: 0 0.9em;
	}

	.ratio {
		display: flex;
		flex-direction: column;
		min-width: 3rem;
		gap: 0.25rem;
		align-items: center;
	}

	.ratio .value {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.totals.with-count {
		min-width: 12rem;
	}

	.ratio.ok {
		color: green;
	}

	.ratio.warning {
		color: orange;
	}

	.ratio.error {
		color: red;
	}

	.ratio.neutral {
		color: var(--faded);
	}

	.dots {
		display: inline-flex;
		gap: 0.25rem;
	}

	.dots > div {
		min-width: 0.75rem;
		min-height: 0.75rem;
		border-radius: 0.75rem;
		background-color: var(--faded);
	}

	.dots > div.ok {
		background-color: green;
	}

	.dots > div.warning {
		background-color: orange;
	}

	.dots > div.error {
		background-color: red;
	}

	.voter {
		width: 2.3em;
		height: 2.3em;
		border-radius: 1em;
	}

	.positive-vote {
		border: green 3px solid;
	}
	.neutral-vote {
		border: white 3px solid;
	}
	.negative-vote {
		border: red 3px solid;
	}
</style>
