<script>
	import {createEventDispatcher} from 'svelte';

	const dispatch = createEventDispatcher();

	export let pagesCount = 1;
	export let pageIndex = 0;

	let pages = [];

	function onPaginationClick(page) {
		pageIndex = page;
		dispatch('change', {
			page: page,
		});
	}

	function updatePages(count) {
		pages = [];
		for (let i = 0; i < count; i++) {
			pages.push(i);
		}
	}

	$: updatePages(pagesCount);
</script>

<div class="compact-pagination">
	{#each pages as page, i}
		<div class="pagination-button {pageIndex === i ? 'selected' : ''}" on:click={_ => onPaginationClick(i)} />
	{/each}
</div>

<style>
	.compact-pagination {
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
		cursor: pointer;
	}

	.pagination-button:hover {
		background: #7c7c7c66;
	}

	.pagination-button.selected {
		background: #aaaaaaff;
	}
</style>
