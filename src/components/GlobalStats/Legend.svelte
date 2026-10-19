<script>
	import StatEntity from './StatEntity.svelte';

	export let items = [];
</script>

<ul class="legend">
	{#each items as item (item.key)}
		<li>
			<span class="swatch" style="background: {item.color}"></span>
			<span class="name" title={item.name}>
				{#if item.entity}
					<StatEntity entity={item.entity} fallback={item.name} />
				{:else}
					{item.name}
				{/if}
			</span>
			<span class="change">{item.change ?? ''}</span>
			<span class="value">{item.value}</span>
		</li>
	{/each}
</ul>

<style>
	.legend {
		list-style: none;
		margin: 0;
		padding: 0;
		font-size: 0.95em;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.6em;
		padding: 0.3em 0;
		border-bottom: 1px solid var(--row-separator);
	}

	li:last-child {
		border-bottom: none;
	}

	.swatch {
		width: 0.85em;
		height: 0.85em;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.name {
		flex: 1;
		min-width: 0;
		display: flex;
		color: var(--textColor);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.change {
		color: var(--faded);
		font-size: 0.85em;
		font-variant-numeric: tabular-nums;
	}

	.value {
		min-width: 3em;
		text-align: right;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
</style>
