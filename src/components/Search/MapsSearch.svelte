<script>
	import {createEventDispatcher, getContext} from 'svelte';
	import MapsHeader from './MapsHeader.svelte';
	import MapsItem from './MapsItem.svelte';

	export let value = '';

	const dispatch = createEventDispatcher();

	let isLoading = false;
	let filters = {
		type: 'ranked',
		search: '',
	};

	const {register, updateLoading, updateItems, updateHeaderProps, updateItemProps} = getContext('search');

	function onMessage(message) {
		console.log('MapsSearch::onMessage', message);
		switch (message?.source) {
			case 'header':
				switch (message?.type) {
					case 'filter-map-type':
						if (!message?.value?.value?.length) return;
						filters.type = message.value.value;
						page = 1;
						break;
				}

			case 'item':
				if (message?.type === 'select' && message?.value) {
					console.warn('SELECT:', message.value);
					dispatch('close');
				}
				break;
		}
	}

	const key = Symbol('maps');
	register({key, header: MapsHeader, headerProps: {isLoading, type: filters.type}, item: MapsItem, onMessage, noItems: 'No maps found.'});

	// TEST
	let page = 1;
	let total = 25;
	let itemsPerPage = 20;

	const allItems = Array(total)
		.fill(null)
		.map((_, idx) => ({
			leaderboardId: idx + 1,
			name: `Map ${idx + 1}`,
			ranked: Math.random() > 0.5,
		}));

	const getFiltered = filters => allItems.filter(i => filters.type !== 'ranked' || i.ranked);
	const getPage = (filters, page = 1) => getFiltered(filters).slice(itemsPerPage * (page - 1), itemsPerPage * page);

	$: updateHeaderProps(key, {isLoading, type: filters.type});

	$: if (value?.length && (filters || value !== filters.search)) {
		filters.search = value;
		isLoading = true;
		page = 1;

		updateLoading(key, true);

		setTimeout(() => {
			updateItems(key, getPage(filters, page));

			isLoading = false;
			updateLoading(key, false);
		}, Math.random() * 1500 + 500);
	}
</script>
