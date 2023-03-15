<script>
	import {createEventDispatcher, getContext} from 'svelte';
	import stringify from 'json-stable-stringify';
	import PlayersHeader from './PlayersHeader.svelte';
	import PlayersItem from './PlayersItem.svelte';
	import LoadMore, {getProps as LoadMoreGetProps} from './LoadMore.svelte';

	export let value = '';

	const DEFAULT_ITEMS_PER_PAGE = 10;

	const dispatch = createEventDispatcher();

	let filters = {
		search: '',
	};
	let lastFilters = null;
	let items = [];
	let isLoading = false;
	let page = 1;
	let itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

	const {register, updateLoading, updateItems} = getContext('search');

	// TEST ONLY
	let total = 14;
	let totalPages = null;
	const allItems = Array(total)
		.fill(null)
		.map((_, idx) => ({
			playerId: idx + 1,
			name: `Player ${idx + 1}`,
		}));

	async function fetchPage(filters, page = 1, perPage = itemsPerPage) {
		return new Promise((resolve, reject) => {
			if (Math.random() < 0.2) {
				reject('Test error ');
				return;
			}

			setTimeout(() => {
				resolve({data: allItems.slice(perPage * (page - 1), perPage * page), metadata: {page, itemsPerPage: perPage, total}});
			}, Math.random() * 1000 + 500);
		});
	}

	async function search(filters, newPage = 1) {
		if (!filters?.search?.length) return;

		try {
			isLoading = true;
			updateLoading(key, true);

			const response = await fetchPage(filters, newPage, itemsPerPage);

			page = newPage;
			total = response?.metadata?.total ?? null;
			if (!Number.isFinite(itemsPerPage)) itemsPerPage = response?.metadata?.itemsPerPage ?? DEFAULT_ITEMS_PER_PAGE;
			totalPages = Number.isFinite(total) ? Math.floor(total / itemsPerPage) + 1 : null;

			return Array.isArray(response?.data) ? response.data : [];
		} catch (err) {
			setNewItems(items, newPage, true);
		} finally {
			isLoading = false;
			updateLoading(key, false);
		}

		return null;
	}

	function setNewItems(items, newPage = page, retry = false, selectedItem = undefined) {
		const displayedItems = [...items];
		if (retry || page < totalPages) {
			displayedItems.push({
				component: LoadMore,
				componentProps: {retry},
				page,
				totalPages,
				itemsPerPage,
				onClick: () => LoadMoreGetProps(newPage),
			});
		}

		updateItems(key, displayedItems, retry ? displayedItems[displayedItems.length - 1] : selectedItem);
	}

	async function newSearch(filters) {
		const newItems = await search(filters, 1);
		if (!newItems) return;

		items = newItems;

		setNewItems(items, page + 1);
	}

	async function getNextPage(filters, newPage) {
		if (Number.isFinite(totalPages) && newPage > totalPages) {
			return;
		}

		const newItems = await search(filters, newPage);
		if (!newItems) return;

		items = [...items, ...newItems];

		setNewItems(items, page + 1, false, newItems?.length ? newItems[0] : undefined);
	}

	function onMessage(message) {
		switch (message?.type) {
			case 'select':
				if (message?.value) {
					console.warn('SELECT:', message.value);
					dispatch('close');
				}
				break;

			case 'load-more':
				if (isLoading || !Number.isFinite(message?.value?.page)) return;

				getNextPage(filters, message.value.page);
				break;
		}
	}

	const key = Symbol('players');
	register({key, header: PlayersHeader, headerProps: {isLoading}, item: PlayersItem, onMessage, noItems: 'No players found.'});

	$: if (value?.length && stringify(filters) !== lastFilters) {
		filters.search = value;
		lastFilters = stringify(filters);
		newSearch(filters);
	}
</script>
