<script>
	import Select from 'svelte-select';
	import {onMount} from 'svelte';
	import {createEventDispatcher} from 'svelte';
	import PlayerPickerMultiItem from './PlayerPickerMultiItem.svelte';
	import PlayerPickerItem from './PlayerPickerItem.svelte';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import PickerBlock from '../Common/PickerBlock.svelte';

	export let playerIds = [];
	export let currentPlayerId = null;
	export let placeholder = 'Players';
	export let icon = null;

	const dispatch = createEventDispatcher();
	let items = [];
	let page = 1;
	let listOpen = false;

	async function fetchPlayers(ids, search) {
		let url = `${BL_API_URL}players?page=${page}`;
		if (ids?.length) {
			url += `&ids=${ids.join(',')}`;
		} else if (search?.length) {
			url += `&search=${search}`;
		}
		const response = await fetch(url);
		const players = await response.json();
		return players.data.map(player => ({
			value: player.id,
			label: currentPlayerId && player.id == currentPlayerId ? 'Me' : player.name,
			...player,
		}));
	}

	function addItems(mapperIds) {
		if (playerIds) {
			playerIds = playerIds.filter(pid => !items.find(i => i.id == pid));
			if (!playerIds.length) {
				return;
			}
		}

		fetchPlayers(playerIds).then(players => {
			players.forEach(element => {
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
		return fetchPlayers(null, filterText);
	}

	const itemFilter = (label, filterText) => label.toLowerCase().includes(filterText.toLowerCase());

	onMount(() => {
		let fetchedBase = false;
		document.getElementById('playersInput').onclick = () => {
			if (!fetchedBase) {
				fetchedBase = true;
				addItems();
			}
		};
	});

	$: currentPlayerId && addItems([currentPlayerId]);
	$: playerIds?.length && addItems(playerIds);
	$: value = items.filter(i => (playerIds ?? []).includes(i.value));
</script>

<PickerBlock {icon} hasValue={!!playerIds?.length} open={listOpen}>
	<Select
		id="playersInput"
		value={value.length ? value : null}
		{items}
		{itemFilter}
		{loadOptions}
		Item={PlayerPickerItem}
		MultiSelection={PlayerPickerMultiItem}
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
