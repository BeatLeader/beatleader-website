<script>
	import {formatNumber} from '../../utils/format';
	import {createEventDispatcher} from 'svelte';

	const dispatch = createEventDispatcher();

	export let sliceSummaryData;
	let pageIndex = 0;

	function format(num, count, round) {
		if (count === 0) return '-';
		return formatNumber(num, round);
	}

	function onHover(groupIndex) {
		dispatch('groupHover', {groupIndex});
	}

	function onLeave(groupIndex) {
		dispatch('groupLeave', {groupIndex});
	}

	function onPaginationClick(page) {
		pageIndex = page;
	}

	function getPaginationClass(groupIndex, pageIndex) {
		let isVisible = false;
		switch (pageIndex) {
			case 0:
				isVisible = groupIndex < 3;
				break;
			case 1:
				isVisible = groupIndex >= 3;
				break;
		}
		return isVisible ? '' : 'hidden';
	}
</script>

<div class="slice-summary">
	<div class="slice-summary-list">
		{#each sliceSummaryData as summary, idx}
			<div class="summary-group {getPaginationClass(idx, pageIndex)}" on:mouseenter={_ => onHover(idx)} on:mouseleave={_ => onLeave(idx)}>
				<h2>{summary.label}</h2>
				<div class="summary-grid">
					<span class="summary-row-label">Acc</span>
					<span class="summary-left">{format(summary.left.averageScore, summary.left.count, 2)}</span>
					<span class="summary-right">{format(summary.right.averageScore, summary.right.count, 2)}</span>
					<span class="summary-row-label">TD</span>
					<span class="summary-left">{format(summary.left.averageTD, summary.left.count, 3)}</span>
					<span class="summary-right">{format(summary.right.averageTD, summary.right.count, 3)}</span>
				</div>
			</div>
		{/each}
	</div>
	<div class="slice-summary-pagination">
		<div class="pagination-button {pageIndex === 0 ? 'selected' : ''}" on:click={_ => onPaginationClick(0)} />
		<div class="pagination-button {pageIndex === 1 ? 'selected' : ''}" on:click={_ => onPaginationClick(1)} />
	</div>
</div>

<style>
	.slice-summary {
		display: flex;
		flex-direction: row;
		grid-gap: 5px;

		border-left: 1px solid var(--row-separator);
		margin-left: 20px;
		padding-left: 10px;
	}

	.slice-summary-list {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.slice-summary-pagination {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		grid-gap: 5px;
	}

	.pagination-button {
		width: 16px;
		height: 24px;
		background: #66666666;
		border-radius: 5px;
		box-shadow: 0 0 4px #00000033;
	}

	.pagination-button.selected {
		background: #aaaaaaff;
	}

	.summary-group {
		border-radius: 4px;
		padding: 0 6px;
	}

	.summary-group.hidden {
		display: none;
	}

	.summary-group:hover {
		box-shadow: inset 0 0 0 1px #ffffff44;
	}

	.summary-group > h2 {
		border-bottom: 1px solid var(--row-separator);
		font-size: 14px;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: min-content 3em 3em;
		grid-gap: 0 10px;

		font-size: 12px;
		font-weight: 400;
	}

	.summary-row-label {
		color: var(--row-separator);
		font-weight: 900;
	}

	.summary-left {
		text-align: end;
	}

	.summary-right {
		text-align: start;
	}
</style>
