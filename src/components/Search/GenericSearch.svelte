<script>
	import {createEventDispatcher, getContext} from 'svelte';
	import {navigate} from 'svelte-routing';
	import stringify from 'json-stable-stringify';
	import LoadMore, {getProps as LoadMoreGetProps} from './LoadMore.svelte';
	import Retry, {getProps as RetryGetProps} from './Retry.svelte';
	import GenericHeader from './GenericHeader.svelte';

	const DEFAULT_ITEMS_PER_PAGE = 10;

	export let key = Symbol();
	export let filters = {search: ''};
	export let fetchPage = () => {
		throw 'Not implemented';
	};
	export let itemsPerPage = DEFAULT_ITEMS_PER_PAGE;
	export let header = GenericHeader;
	export let item = null;
	export let noItems = 'No items found.';
	export let url = null;

	const dispatch = createEventDispatcher();

	let lastFilters = null;
	let items = [];
	let isLoading = false;
	let page = 1;
	let total = null;
	let totalPages = null;

	const {register, updateLoading, updateItems, updateHeaderProps} = getContext('search');

	async function search(filters, newPage = 1) {
		if (!filters?.search?.length) return;

		try {
			isLoading = true;
			updateLoading(key, true);

			const response = await fetchPage(filters, newPage, itemsPerPage);

			page = newPage;
			total = response?.metadata?.total ?? null;
			if (!Number.isFinite(itemsPerPage)) itemsPerPage = response?.metadata?.itemsPerPage ?? DEFAULT_ITEMS_PER_PAGE;
			totalPages = Number.isFinite(total) ? Math.floor(total / itemsPerPage) + (total % itemsPerPage ? 1 : 0) : null;

			updateHeaderProps(key, {
				isLoading,
				filters,
				page,
				total,
				totalPages,
				url,
			});

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
		if (retry) {
			displayedItems.push({
				component: Retry,
				componentProps: {},
				page,
				totalPages,
				itemsPerPage,
				onClick: () => RetryGetProps(newPage),
			});
		} else if (page < totalPages) {
			displayedItems.push({
				component: LoadMore,
				componentProps: {},
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
		if (message?.source === 'header') {
			if (message?.type === 'navigate' && message?.value?.length) {
				navigate(message.value);
				dispatch('close');
			} else {
				dispatch('message', message);
			}
		} else {
			switch (message?.type) {
				case 'load-more':
					if (isLoading || !Number.isFinite(message?.value?.page)) return;

					getNextPage(filters, message.value.page);
					break;

				case 'retry':
					if (isLoading || !Number.isFinite(message?.value?.page)) return;

					if (message.value.page === 1) newSearch(filters);
					else getNextPage(filters, message.value.page);
					break;

				default:
					dispatch('message', message);
			}
		}
	}

	register({
		key,
		header,
		headerProps: {isLoading, filters, url},
		item,
		onMessage,
		noItems,
	});

	$: if (stringify(filters) !== lastFilters) {
		lastFilters = stringify(filters);
		newSearch(filters);
	}
</script>

<slot />
