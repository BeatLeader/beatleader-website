<script>
	import {createEventDispatcher} from 'svelte';
	import GenericSearch from './GenericSearch.svelte';
	import MapsHeader from './MapsHeader.svelte';
	import MapsItem from './MapsItem.svelte';

	export let value = '';

	const dispatch = createEventDispatcher();

	const key = Symbol('maps');

	const ITEMS_PER_PAGE = 15;

	let filters = {
		search: '',
		type: 'ranked',
	};

	function onMessage(event) {
		const message = event?.detail;
		if (!message) return;

		switch (message?.source) {
			case 'header':
				switch (message?.type) {
					case 'filter-map-type':
						if (!message?.value?.value) return;
						filters.type = message.value.value;
						break;
				}

			case 'item':
				if (message?.type === 'select' && message?.value) {
					// TODO: navigate
					console.warn('MapsSearch/onMessage(SELECT):', message.value);
					dispatch('close');
				}
				break;
		}
	}

	// TEST ONLY: replace it with actual fetching from the API
	let total = 23;
	const allItems = () =>
		Array(total)
			.fill(null)
			.map((_, idx) => ({
				leaderboardId: idx + 1,
				name: `Map ${idx + 1} (${value})`,
				ranked: idx % 3 === 0,
			}));

	async function fetchPage(filters, page = 1, itemsPerPage = ITEMS_PER_PAGE) {
		console.log(`maps/fetchPage(), page=${page}, itemsPerPage=${itemsPerPage}, filters=`, filters);
		return new Promise((resolve, reject) => {
			if (Math.random() < 0.0) {
				reject('Test error ');
				return;
			}

			setTimeout(() => {
				const filteredItems = allItems().filter(i => filters?.type !== 'ranked' || i.ranked);

				resolve({
					data: filteredItems.slice(itemsPerPage * (page - 1), itemsPerPage * page),
					metadata: {page, itemsPerPage, total: filteredItems.length},
				});
			}, Math.random() * 1000 + 500);
		});
	}

	$: if (value?.length) filters.search = value;
</script>

<GenericSearch
	{key}
	{filters}
	{fetchPage}
	itemsPerPage={ITEMS_PER_PAGE}
	header={MapsHeader}
	item={MapsItem}
	noItems="No maps found."
	on:message={onMessage} />
