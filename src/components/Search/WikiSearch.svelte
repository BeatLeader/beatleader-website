<script>
	import {createEventDispatcher} from 'svelte';
	import {navigate} from 'svelte-routing';
	import GenericSearch from './GenericSearch.svelte';
	import WikiHeader from './WikiHeader.svelte';
	import WikiItem from './WikiItem.svelte';

	export let value = '';
	export let priority = 6;

	const dispatch = createEventDispatcher();

	const key = Symbol('wiki');

	const ITEMS_PER_PAGE = 10;

	let filters = {
		search: '',
	};

	function onMessage(event) {
		const message = event?.detail;
		if (!message) return;

		switch (message?.type) {
			case 'select':
				if (message?.value?.id) {
					navigate(`https://beatleader.wiki/${message.value.path}`);
					dispatch('close');
				}
				break;
		}
	}

	async function fetchPage(filters, page = 1, itemsPerPage = ITEMS_PER_PAGE) {
		return await fetch('/cors/blwiki/', {
			body: `{"query": "{pages {search(query: \\\"${filters.search}\\\") {results {path title}}}}"}`,
			method: 'post',
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.then(b => b.json())
			.then(response => {
				const result = response?.data?.pages?.search?.results;
				return {
					metadata: {
						page: 1,
						total: result?.length ?? 0,
						itemsPerPage: 5,
					},
					data: result ?? [],
				};
			});
	}

	$: if (value?.length) filters.search = value;
</script>

<GenericSearch
	{key}
	{filters}
	{fetchPage}
	itemsPerPage={ITEMS_PER_PAGE}
	header={WikiHeader}
	item={WikiItem}
	noItems="No events found."
	url="https://beatleader.wiki"
	{priority}
	on:message={onMessage}
	on:close />
