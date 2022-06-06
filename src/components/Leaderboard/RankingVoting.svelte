<script>
	import Dialog from '../Common/Dialog.svelte';
	import Button from '../Common/Button.svelte';
	import RangeSlider from 'svelte-range-slider-pips';
	import Select from 'svelte-select';
	import {createEventDispatcher} from 'svelte';

	import {votingTypes} from '../../utils/beatleader/format';

	const dispatch = createEventDispatcher();

	export let votingStore;
	export let hash;
	export let diff;
	export let mode;

	let suitableForRank;
	let stars;

	let selectedTypes = [];
	const allMapTypes = votingTypes;
	let mapTypes = votingTypes;
	let selectedType = '+';

	function vote() {
		votingStore.vote(hash, diff, mode, suitableForRank, stars, selectedTypes);

		dispatch('finished');
	}

	function selectType(type) {
		if (type != '+') {
			selectedTypes.push(type);
			selectedTypes = selectedTypes;

			selectedType = '+';
			mapTypes = allMapTypes.filter(m => !selectedTypes.includes(m));
		}
	}

	function remove(type) {
		selectedTypes = selectedTypes.filter(m => m != type);
		mapTypes.push(type);
		mapTypes = mapTypes;
	}
</script>

<div class="ranking-voting">
	<Dialog
		type="confirm"
		title="Vote map for ranked"
		okButton="Submit"
		cancelButton="Cancel"
        okButtonDisabled={suitableForRank == undefined}
		on:confirm={() => vote()}
		on:cancel={() => dispatch('finished')}>
		<div slot="content">
			<div>Is this map suitable for rank?</div>
			<Button
				label="NO"
				type={suitableForRank || suitableForRank == undefined ? 'default' : 'danger'}
				on:click={() => (suitableForRank = false)} />
			<Button
				label="YES"
				type={suitableForRank === false || suitableForRank == undefined ? 'default' : 'green'}
				on:click={() => (suitableForRank = true)} />
			{#if suitableForRank}
				<div>
					<label>Stars (optional):</label>
					<RangeSlider
						min={0}
						max={15}
						step={0.1}
						values={[stars]}
						float
						hoverable
						pips
						pipstep={20}
						all="label"
						on:change={event => {
							stars = event.detail.values[0];
						}} />
				</div>
				<div>
					<label>Type (optional):</label>
					{#each selectedTypes as type, idx}
						<div>
							{type}
							<button class="remove-type" title="Remove" on:click={() => remove(type)}><i class="fas fa-xmark" /></button>
						</div>
					{/each}
					<Select bind:value={selectedType} items={mapTypes} isSearchable={true} on:select={e => selectType(e.detail.value)} />
				</div>
			{/if}
		</div>
	</Dialog>
</div>

<style>
	:global(.ranking-voting .ss-modal) {
		top: 0 !important;
		position: sticky !important;
		transform: none !important;
		--itemHoverBG: #eb008c;
	}

	.remove-type {
		border: none;
		color: rgb(255, 0, 0);
		background-color: transparent;
		cursor: pointer;
		transform: translate(-7px, -2px);
	}
</style>
