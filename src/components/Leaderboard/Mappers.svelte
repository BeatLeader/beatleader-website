<script>
	import Select from 'svelte-select';
	import {onMount} from 'svelte';
	import {createEventDispatcher} from 'svelte';
	import MapperPickerMultiItem from './MapperPickerMultiItem.svelte';
	import MapperPickerItem from './MapperPickerItem.svelte';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import PickerBlock from '../Common/PickerBlock.svelte';

	export let mapperIds = [];
	export let currentMapperId = null;
	export let placeholder = 'Mappers';
	export let icon = null;

	const dispatch = createEventDispatcher();
	let items = [];
	let page = 1;
	let listOpen = false;

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

<PickerBlock {icon} hasValue={!!mapperIds?.length} open={listOpen}>
	<Select
		id="mappersInput"
		value={value.length ? value : null}
		{items}
		{itemFilter}
		{loadOptions}
		Item={MapperPickerItem}
		MultiSelection={MapperPickerMultiItem}
		{placeholder}
		isSearchable={true}
		isMulti={true}
		bind:listOpen
		on:select={onSelect}
		on:clear />
</PickerBlock>

<style>
	:global(.selectContainer) {
		width: 100%;
	}
</style>
