<script>
	import {createEventDispatcher, onMount} from 'svelte';
	import Spinner from './Spinner.svelte';
	import {dndzone} from 'svelte-dnd-action';
	import {debounce} from '../../utils/debounce';
	import {opt} from '../../utils/js';
	import Select from '../Settings/Select.svelte';

	const dispatch = createEventDispatcher();

	const WINDOW_RESIZE_DEBOUNCE_TIME = 500;
	const MINIMUM_PAGES = 5;

	export let totalItems = null;
	export let currentPage = 0;
	export let itemsPerPage = 10;
	export let itemsPerPageValues = [5, 10, 15, 20, 25];
	export let displayMax = 11;
	export let hide = false;
	export let mode = 'pages';
	export let dnd = false;
	export let loadingPage = null;

	let displayStart = false;
	let displayEnd = false;
	let prevItemsPerPage = itemsPerPage;

	let navEl = null;
	let currentDisplayMax = displayMax;
	let initialPages = currentPage;

	function dispatchEvent(page = 0, initial = false) {
		let to = (page + 1) * itemsPerPage - 1;
		if (isTotalItemsAvailable && to > totalItems - 1) to = totalItems - 1;

		dispatch('page-changed', {page, itemsPerPage, from: page * itemsPerPage, to, total: totalItems, initial});
	}

	onMount(() => {
		dispatchEvent(currentPage, true);
	});

	async function onPageChanged(page) {
		if (loadingPage) return;

		dispatchEvent(page, false);
	}

	function calcPages(total, current, max) {
		const needToDisplayFacetedPages = total > max;

		const middle = Math.floor(max / 2);
		const startPage = current > middle && needToDisplayFacetedPages ? current - middle + 1 : 0;

		displayStart = current > middle && needToDisplayFacetedPages;
		displayEnd = current + middle + 1 < total && needToDisplayFacetedPages;

		currentPage = current;
		if (currentPage > pagesTotal - 1) currentPage = pagesTotal - 1;
		if (currentPage < 0) currentPage = 0;

		return allPages.slice(
			startPage - (needToDisplayFacetedPages && !displayEnd ? middle - total + current + 1 : 0),
			startPage + max - (displayStart ? 1 : 0) - (displayEnd ? 1 : 0)
		);
	}

	function getEnd(currentPage, itemsPerPage, totalItems) {
		const end = (currentPage + 1) * itemsPerPage;

		return isTotalItemsAvailable && end > totalItems ? totalItems : end;
	}

	function onItemsPerPageChanged() {
		const firstItem = prevItemsPerPage * currentPage;

		prevItemsPerPage = itemsPerPage;
		currentPage = Math.floor(firstItem / itemsPerPage);
	}

	function onWindowResize() {
		if (!navEl) return;

		const minPositionWidth = 8.5 * 16;
		const itemWidth = 51.85;

		const pagerWidth = opt(navEl.getBoundingClientRect(), 'width', null);
		if (!pagerWidth) return;

		const numOfPagesThatWillFit = Math.floor((pagerWidth - minPositionWidth) / itemWidth) - 4;
		currentDisplayMax = numOfPagesThatWillFit <= displayMax ? numOfPagesThatWillFit : displayMax;
	}

	const debouncedOnWindowResize = debounce(() => onWindowResize(), WINDOW_RESIZE_DEBOUNCE_TIME);

	onMount(() => {
		window.addEventListener('resize', debouncedOnWindowResize);

		onWindowResize();

		return () => {
			window.removeEventListener('resize', debouncedOnWindowResize);
		};
	});

	let consideredPage = null;
	let timeout = null;

	function dropToPlaylist(e, page) {
		clearTimeout(timeout);

		if (e.detail.items.length) {
			consideredPage = page;
			timeout = setTimeout(() => {
				consideredPage = null;
				dispatchEvent(page, false);
			}, 500);
		} else {
			consideredPage = null;
		}
	}

	$: isTotalItemsAvailable = Number.isFinite(totalItems);
	$: pagesTotal = isTotalItemsAvailable ? Math.ceil(totalItems / itemsPerPage) : null;
	$: allPages = isTotalItemsAvailable
		? Array(pagesTotal)
				.fill(null)
				.map((val, idx) => idx + 1)
		: [];
	$: initialPages = currentPage;
	$: displayedPages = isTotalItemsAvailable ? calcPages(pagesTotal, initialPages, currentDisplayMax) : [];
	$: startItem = currentPage * itemsPerPage + 1;
	$: endItem = getEnd(currentPage, itemsPerPage, totalItems);
	$: currentMode = !isTotalItemsAvailable || currentDisplayMax < MINIMUM_PAGES ? 'simple' : mode;
</script>

{#if !hide}
	<nav class="pagination" class:simple={currentMode === 'simple'} bind:this={navEl} class:no-items-per-page={!itemsPerPageValues}>
		<div class="position">
			{startItem} - {endItem}
			{#if totalItems}
				/ {totalItems}{/if}
		</div>
		{#if pagesTotal > 1 || currentMode === 'simple'}
			<ul class="pagination-list">
				{#if currentMode === 'simple'}
					{#if currentPage !== 0}
						<li>
							<button on:click={() => onPageChanged(0)} class="pagination-link">
								{#if loadingPage === 0}
									<Spinner />
								{:else}
									<i class="fas fa-step-backward" />
								{/if}
							</button>
						</li>

						<li>
							<button on:click={() => onPageChanged(currentPage - 1)} class="pagination-link">
								{#if loadingPage === currentPage - 1}
									<Spinner />
								{:else}
									<i class="fas fa-chevron-left" />
								{/if}
							</button>
						</li>
					{:else}
						<li><span class="pagination-link disabled"><i class="fas fa-step-backward" /></span></li>
						<li><span class="pagination-link disabled"><i class="fas fa-chevron-left" /></span></li>
					{/if}

					{#if !isTotalItemsAvailable || currentPage !== pagesTotal - 1}
						<li>
							<button on:click={() => onPageChanged(currentPage + 1)} class="pagination-link">
								{#if loadingPage === currentPage + 1}
									<Spinner />
								{:else}
									<i class="fas fa-chevron-right" />
								{/if}
							</button>
						</li>

						{#if isTotalItemsAvailable}
							<li>
								<button on:click={() => onPageChanged(pagesTotal - 1)} class="pagination-link">
									{#if loadingPage === pagesTotal - 1}
										<Spinner />
									{:else}
										<i class="fas fa-step-forward" />
									{/if}
								</button>
							</li>
						{:else}
							<li><span class="pagination-link disabled"><i class="fas fa-step-forward" /></span></li>
						{/if}
					{:else}
						<li><span class="pagination-link disabled"><i class="fas fa-chevron-right" /></span></li>
						<li><span class="pagination-link disabled"><i class="fas fa-step-forward" /></span></li>
					{/if}
				{:else}
					{#if displayStart}
						{#if dnd}
							<li class:is-loading={loadingPage === 0}>
								<button
									on:click={() => onPageChanged(0)}
									use:dndzone={{items: [{id: 'page1', page: true}], dragDisabled: true}}
									on:consider={e => dropToPlaylist(e, 0)}
									on:click={() => onPageChanged(0)}
									class={'pagination-link' + (currentPage === 0 ? ' is-current' : '') + (consideredPage === 0 ? ' considered' : '')}>
									<span class="spinner"><Spinner /></span>
									<span class="page">1</span>
								</button>
							</li>
							<li><span class="pagination-ellipsis">…</span></li>
						{:else}
							<li class:is-loading={loadingPage === 0}>
								<button on:click={() => onPageChanged(0)} class={'pagination-link' + (currentPage === 0 ? ' is-current' : '')}>
									<span class="spinner"><Spinner /></span>
									<span class="page">1</span>
								</button>
							</li>
							<li><span class="pagination-ellipsis">…</span></li>
						{/if}
					{/if}

					{#if dnd}
						{#each displayedPages as page}
							<li class:is-loading={loadingPage === page - 1}>
								<button
									use:dndzone={{items: [{id: 'page' + page, page: true}], dragDisabled: true}}
									on:consider={e => dropToPlaylist(e, page - 1)}
									on:click={() => onPageChanged(page - 1)}
									class={'pagination-link' +
										(currentPage === page - 1 ? ' is-current' : '') +
										(consideredPage === page - 1 ? ' considered' : '')}>
									<span class="spinner"><Spinner /></span>
									<span class="page">{page}</span>
								</button>
							</li>
						{/each}
					{:else}
						{#each displayedPages as page}
							<li class:is-loading={loadingPage === page - 1}>
								<button
									on:click={() => onPageChanged(page - 1)}
									class={'pagination-link' + (currentPage === page - 1 ? ' is-current' : '')}>
									<span class="spinner"><Spinner /></span>
									<span class="page">{page}</span>
								</button>
							</li>
						{/each}
					{/if}

					{#if displayEnd}
						<li><span class="pagination-ellipsis">…</span></li>
						{#if dnd}
							<li class:is-loading={loadingPage === pagesTotal - 1}>
								<button
									use:dndzone={{items: [{id: 'page' + pagesTotal, page: true}], dragDisabled: true}}
									on:consider={e => dropToPlaylist(e, pagesTotal - 1)}
									on:click={() => onPageChanged(pagesTotal - 1)}
									on:click={() => onPageChanged(pagesTotal - 1)}
									class={'pagination-link' +
										(currentPage === pagesTotal - 1 ? ' is-current' : '') +
										(consideredPage === pagesTotal - 1 ? ' considered' : '')}>
									<span class="spinner"><Spinner /></span>
									<span class="page">{pagesTotal}</span>
								</button>
							</li>
						{:else}
							<li class:is-loading={loadingPage === pagesTotal - 1}>
								<button
									on:click={() => onPageChanged(pagesTotal - 1)}
									class={'pagination-link' + (currentPage === pagesTotal - 1 ? ' is-current' : '')}>
									<span class="spinner"><Spinner /></span>
									<span class="page">{pagesTotal}</span>
								</button>
							</li>
						{/if}
					{/if}
				{/if}
			</ul>
		{/if}
		{#if currentMode === 'pages'}
			<div class="spacer" />
		{/if}
		{#if itemsPerPageValues && itemsPerPageValues.length}
			<div class="items-per-page">
				<Select
					bind:value={itemsPerPage}
					on:select={onItemsPerPageChanged}
					valueSelector={x => x}
					nameSelector={x => '' + x}
					fontPadding={0.1}
					options={itemsPerPageValues} />
			</div>
		{/if}
	</nav>
{/if}

<style>
	ul {
		list-style-type: none;
	}

	li {
		margin-top: 0em;
	}

	button {
		color: var(--textColor);
		background-color: transparent;
		cursor: pointer;
	}

	select {
		font-size: 1em;
		border: none;
		color: var(--textColor, #000);
		background-color: var(--foreground, #fff);
		outline: none;
	}

	.pagination-link.considered {
		color: var(--textColor);
		background-color: rgb(123, 123, 227) !important;
		border-color: var(--selected);
	}

	.pagination {
		margin-top: 0.1em;
	}

	.pagination.no-items-per-page {
		justify-content: space-between !important;
	}

	.pagination.no-items-per-page .position {
		text-align: left;
	}

	.pagination.no-items-per-page .pagination-list {
		margin-left: 0;
	}

	.pagination-list {
		max-width: none !important;
		justify-content: center;
		margin-top: 0;
		margin-bottom: 0 !important;
	}

	.pagination.simple .pagination-list {
		justify-content: flex-end;
	}

	.pagination.simple .pagination-list button i {
		position: relative;
		top: 2px;
	}

	span.pagination-link {
		cursor: not-allowed;
	}

	.pagination-link {
		border-color: transparent;
		background: var(--faded);
		height: 1.5em;
		display: grid;
		justify-items: center;
		align-content: center;
	}

	.pagination-link.is-current,
	.pagination:not(.simple) button:hover {
		color: var(--textColor);
		background-color: var(--selected);
		border-color: var(--selected);
	}

	.pagination-link.is-current {
		cursor: not-allowed;
	}

	.pagination-link:focus {
		border-color: #dbdbdb !important;
	}

	.pagination-link .spinner {
		display: none;
		position: absolute;
		top: 0.1em;
	}

	.is-loading .pagination-link .spinner {
		display: block;
	}

	.is-loading .pagination-link .page {
		visibility: hidden;
	}

	.position {
		min-width: 8.5em;
		order: 0;
	}

	.spacer {
		min-width: 8.5em;
		order: 2;
	}

	.pagination-list {
		order: 1;
	}

	.items-per-page {
		order: 2;
	}

	@media (max-width: 767px) {
		.pagination {
			justify-content: space-between;
		}

		.pagination.no-items-per-page .pagination-list {
			justify-content: flex-end;
		}
	}
</style>
