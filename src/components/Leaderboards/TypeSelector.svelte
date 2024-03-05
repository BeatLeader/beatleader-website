<script>
	import {
		DifficultyStatus,
		featureTags,
		featureTagsMap,
		mapTypeFrom,
		speedTags,
		speedTagsMap,
		styleTags,
		styleTagsMap,
		votingTypes,
	} from '../../utils/beatleader/format';
	import Select from 'svelte-select';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {createEventDispatcher} from 'svelte';

	export let type;
	export let map;

	const dispatch = createEventDispatcher();

	let opened;

	function openedChanged(opened) {
		dispatch('open', opened);
	}

	let key = '';
	let typeMap;
	let typeList;

	switch (type) {
		case 'speed':
			key = 'speedTags';
			typeMap = speedTagsMap;
			typeList = speedTags;
			break;
		case 'style':
			key = 'styleTags';
			typeMap = styleTagsMap;
			typeList = styleTags;
			break;
		case 'features':
			key = 'featureTags';
			typeMap = featureTagsMap;
			typeList = featureTags;
			break;

		default:
			break;
	}

	let currentType = map.difficulty[key];
	let originalTypes = currentType ? mapTypeFrom(currentType, typeMap).split(',') : [];
	let selectedTypes = currentType ? mapTypeFrom(currentType, typeMap).split(',') : [];
	const allMapTypes = typeList;
	let mapTypes = typeList;
	let selectedType = '+';

	function selectType(typeToSelect) {
		if (typeToSelect != '+') {
			selectedTypes.push(typeToSelect);
			selectedTypes = selectedTypes;

			selectedType = '+';
			mapTypes = allMapTypes.filter(m => !selectedTypes.includes(m));

			let typeValue = 0;
			if (Array.isArray(selectedTypes)) {
				selectedTypes.forEach(typeName => {
					typeValue += typeMap[typeName];
				});
			}

			fetch(BL_API_URL + `leaderboard/tags?id=${map.id}&tagType=${type}&tagValue=${typeValue}`, {credentials: 'include', method: 'POST'});
		}
	}

	function remove(typeToRemove) {
		selectedTypes = selectedTypes.filter(m => m != typeToRemove);
		mapTypes.push(typeToRemove);
		mapTypes = mapTypes;

		let typeValue = 0;
		if (Array.isArray(selectedTypes)) {
			selectedTypes.forEach(typeName => {
				typeValue += typeMap[typeName];
			});
		}

		fetch(BL_API_URL + `leaderboard/tags?id=${map.id}&tagType=${type}&tagValue=${typeValue}`, {credentials: 'include', method: 'POST'});
	}

	$: openedChanged(opened);
</script>

<div class="tag-selector">
	{#each selectedTypes as type, idx}
		<div>
			{type}
			<button class="remove-type" title="Remove" on:click={() => remove(type)}><i class="fas fa-xmark" /></button>
		</div>
	{/each}
	<Select
		bind:value={selectedType}
		items={mapTypes}
		isSearchable={true}
		on:select={e => selectType(e.detail.value)}
		bind:listOpen={opened} />
</div>

<style>
	.tag-selector {
		display: flex;
		flex-direction: column;
		width: 12em;
	}

	:global(.tag-selector .item.hover) {
		background-color: rebeccapurple !important;
	}
</style>
