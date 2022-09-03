<script>
	import {formatNumber} from '../../utils/format';

	export let totals;
	export let count;

	const keys = {
		nominated: 'Nominated',
		criteriaMet: 'Criteria checked',
		mapperAllowed: 'Mapper allowed',
		approved: 'RT approved',
	};
</script>

{#if totals}
	<div class="totals" class:with-count={!!count}>
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
		</div>

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
					{#if totals?.byDiff?.length}
						<div class="dots">
							{#each totals.byDiff as d}
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
	.totals,
	.totals .ratio {
		gap: 0.25rem;
		align-items: center;
	}

	.totals {
		display: inline-flex;
		align-items: flex-start;
		gap: 1.25rem;
	}

	.totals .ratio {
		display: flex;
		flex-direction: column;
		min-width: 3rem;
	}

	.totals .ratio .value {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.totals.with-count {
		min-width: 18rem;
	}

	.totals .ratio.ok {
		color: green;
	}

	.totals .ratio.warning {
		color: orange;
	}

	.totals .ratio.error {
		color: red;
	}

	.totals .ratio.neutral {
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
</style>
