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
			title={`Positive: ${totals.votesPositive}, Negative: ${totals.votesNegative}, Total: ${totals.votesTotal}`}>
			{#if totals.votesRating >= 0.7}
				<i class="fa fa-check" />
			{:else}
				<i class="fa fa-xmark" />
			{/if}
			<span>{formatNumber(totals.votesRating)}</span>
		</div>

		{#if count}
			{#each Object.keys(keys) as key (key)}
				<div
					class="ratio"
					class:ok={totals[`${key}Ratio`] === 1}
					class:warning={totals[`${key}Ratio`] < 1 && totals[`${key}Ratio`] >= 0.5}
					class:error={totals[`${key}Ratio`] < 0.5}
					title={keys[key]}>
					{#if totals[`${key}Ratio`] === 1}
						<i class="fa fa-check" />
					{:else}
						<i class="fa fa-xmark" />
					{/if}
					{totals[key]} / {count}
				</div>
			{/each}
		{/if}
	</div>
{/if}

<style>
	.totals,
	.totals .ratio {
		display: inline-flex;
		gap: 0.25rem;
		align-items: center;
	}

	.totals {
		gap: 1.25rem;
	}

	.totals .ratio {
		min-width: 3rem;
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
</style>
