<script>
	import Select from 'svelte-select';
	import {onMount} from 'svelte';
	import {createEventDispatcher} from 'svelte';
	import MapperPickerMultiItem from './MapperPickerMultiItem.svelte';
	import MapperPickerItem from './MapperPickerItem.svelte';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

	export let mapperIds = [];
	export let currentMapperId = null;

	const dispatch = createEventDispatcher();
	let items = [];
	let page = 1;

	async function fetchMappers(ids, search) {
		let url = `${BL_API_URL}mappers?page=${page}`;
		if (ids?.length) {
			url += `&ids=${ids.join(',')}`;
		} else if (search?.length) {
			url += `&search=${search}`;
		}
		const response = await fetch(url);
		const mappers = await response.json();
		return mappers.data.map(mapper => ({
			value: mapper.id,
			label: currentMapperId && mapper.id == currentMapperId ? 'Me' : mapper.name,
			...mapper,
		}));
	}

	function addItems(mapperIds) {
		if (mapperIds) {
			mapperIds = mapperIds.filter(mid => !items.find(i => i.id == mid));
			if (!mapperIds.length) {
				return;
			}
		}

		fetchMappers(mapperIds).then(mappers => {
			mappers.forEach(element => {
				items.push(element);
			});

			items = items;
		});
	}

	function onSelect(e) {
		const selectedIds = e?.detail?.map(i => i.value) ?? [];
		if (selectedIds.length) {
			e?.detail.forEach(element => {
				if (!items.find(i => i.id == element.id)) {
					items.unshift(element);
				}
			});
		}
		dispatch('change', selectedIds);
	}

	async function loadOptions(filterText) {
		page = 1;
		return fetchMappers(null, filterText);
	}

	const itemFilter = (label, filterText) => label.toLowerCase().includes(filterText.toLowerCase());

	onMount(() => {
		let fetchedBase = false;
		document.getElementById('mappersInput').onclick = () => {
			if (!fetchedBase) {
				fetchedBase = true;
				addItems();
			}
		};
	});

	$: currentMapperId && addItems([currentMapperId]);
	$: mapperIds?.length && addItems(mapperIds);
	$: value = items.filter(i => (mapperIds ?? []).includes(i.value));
</script>

<section>
	<Select
		id="mappersInput"
		value={value.length ? value : null}
		{items}
		{itemFilter}
		{loadOptions}
		Item={MapperPickerItem}
		MultiSelection={MapperPickerMultiItem}
		placeholder="Search BeatSaver mappers"
		isSearchable={true}
		isMulti={true}
		on:select={onSelect}
		on:clear />
</section>

<style>
	section {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
	}

	section :global(.badge-bg) {
		background: rgba(255, 255, 255, 0.123);
		border-bottom: 2px solid transparent;
		border-radius: 0.1rem;
		padding: 0.5rem;
		filter: saturate(0.5) brightness(1.4);
		transform: scale(0.8);
		font-weight: 400 !important;
		color: white !important;
		margin: 0 0;
	}

	:global(.listContainer) {
		background-color: #242424 !important;
		z-index: 8 !important;
	}

	:global(.selectContainer) {
		width: 100%;
	}

	:global(.listItem) {
		cursor: pointer;
	}
</style>
