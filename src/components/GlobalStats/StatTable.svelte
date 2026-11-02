<div class="stat-table-scroll">
	<table class="stat-table">
		<slot />
	</table>
</div>

<style>
	.stat-table-scroll {
		margin-top: 1em;
		overflow-x: auto;
	}

	.stat-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9em;
	}

	.stat-table :global(th) {
		color: var(--faded);
		font-weight: normal;
		text-align: right;
		padding: 0.25em 0.5em;
	}

	.stat-table :global(td) {
		text-align: right;
		padding: 0.25em 0.5em;
		border-top: 1px solid var(--row-separator);
		font-variant-numeric: tabular-nums;
	}

	.stat-table :global(.left) {
		text-align: left;
		max-width: 24em;
	}

	.stat-table :global(.muted) {
		color: var(--faded);
	}

	.stat-table :global(.swatch) {
		display: inline-block;
		width: 0.8em;
		height: 0.8em;
		border-radius: 2px;
	}
</style>
