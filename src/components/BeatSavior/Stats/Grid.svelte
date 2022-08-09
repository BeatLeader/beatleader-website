<script>
	import {configStore} from '../../../stores/config';
	import {formatNumber} from '../../../utils/format';
	import Value from '../../Common/Value.svelte';

	const MAX_BLOCK_VALUE = 115;

	export let accGrid = null;
	export let name = null;
	export let compareTo = null;
	export let compareToName = null;
</script>

{#if accGrid && Array.isArray(accGrid) && accGrid.length === 12}
	<div class="grid">
		{#each accGrid as gridVal, idx}
			<span>
				{#if Number.isFinite(gridVal)}
					<div>
						<Value
							value={gridVal}
							digits={2}
							title={(configStore,
							$configStore,
							`${compareTo && compareToName && name ? `[${name}]: ` : ''}${formatNumber((gridVal / MAX_BLOCK_VALUE) * 100)}%`)} />

						{#if compareTo && compareTo[idx] && Number.isFinite(compareTo[idx])}
							<small>
								<Value
									value={compareTo[idx]}
									digits={2}
									title={(configStore,
									$configStore,
									`${compareTo && compareToName ? `[${compareToName}]: ` : ''}${formatNumber(
										(compareTo[idx] / MAX_BLOCK_VALUE) * 100
									)}%`)} />
							</small>
						{/if}
					</div>
				{/if}
			</span>
		{/each}
	</div>
{/if}

<style>
	.grid {
		display: inline-grid;
		grid-template-columns: 1fr 1fr 1fr 1fr;
		grid-gap: 0.5em;
		font-size: 0.75em;
		min-height: 12em;
		align-self: end;
	}

	.grid > span {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--dimmed);
		width: 3.5em;
		height: 3.5em;
		border-radius: 0.4em;
	}

	div > small {
		display: block;
		color: var(--faded);
		text-align: center;
	}
</style>
