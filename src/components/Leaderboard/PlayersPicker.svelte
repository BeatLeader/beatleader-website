<script>
	import Select from 'svelte-select';
	import {onMount} from 'svelte';
	import {createEventDispatcher} from 'svelte';
	import PlayerPickerMultiItem from './PlayerPickerMultiItem.svelte';
	import PlayerPickerItem from './PlayerPickerItem.svelte';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

	export let playerIds = [];
	export let currentPlayerId = null;

	const dispatch = createEventDispatcher();
	let items = [];
	let page = 1;

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

<section>
	<Select
		id="playersInput"
		value={value.length ? value : null}
		{items}
		{itemFilter}
		{loadOptions}
		Item={PlayerPickerItem}
		MultiSelection={PlayerPickerMultiItem}
		placeholder="Search for players"
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
