<script>
	import Dialog from '../Common/Dialog.svelte';
	import Button from '../Common/Button.svelte';
	import RangeSlider from 'svelte-range-slider-pips';
	import Select from 'svelte-select';
	import {createEventDispatcher} from 'svelte';

	import {votingTypes, mapTypeFromMask} from '../../utils/beatleader/format';

	const dispatch = createEventDispatcher();

	export let insideLeaderboard = false;
	export let votingStore;
	export let hash;
	export let diff;
	export let mode;
    export let currentStars;
	export let currentType;

	export let isRanked;
	export let rtvoting;

	export let qualification;
	export let qualificationUpdate;

	let suitableForRank = rtvoting && !isRanked;
	let stars;

	let mapperAllowed = qualification?.mapperAllowed;
	let criteriaMet = qualification?.criteriaMet;
	let criteriaCommentary = qualification?.criteriaCommentary;

	let selectedTypes = currentType ? mapTypeFromMask(currentType).split(",") : [];
	const allMapTypes = votingTypes;
	let mapTypes = votingTypes;
	let selectedType = '+';

	function vote() {
        if (rtvoting) {
			if (isRanked) {
            	votingStore.updateMap(hash, diff, mode, suitableForRank, stars, selectedTypes);
			} else {
				if (qualificationUpdate) {
					votingStore.updateQualification(hash, diff, mode, suitableForRank, stars, selectedTypes, mapperAllowed, criteriaMet, criteriaCommentary);
				} else {
					votingStore.qualifyMap(hash, diff, mode, suitableForRank, stars, selectedTypes)
				}
			}
        } else {
            votingStore.vote(hash, diff, mode, suitableForRank, stars, selectedTypes);
        }

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

	function updateStars(currentStars) {
		stars = currentStars;
	}

	let dialogTitle;
	function updateDialogTitle(rtvoting, isRanked, qualificationUpdate) {
		if (rtvoting) {
			if (isRanked) {
				dialogTitle = "Update map ranking";
			} else if (qualificationUpdate) {
				dialogTitle = "Update map qualification";
			} else {
				dialogTitle = "Qualify map";
			}
		} else {
			dialogTitle = "Vote map for ranked";
		}
	}

	let actionButtonTitle;
	function updateActionButtonTitle(rtvoting, isRanked, qualificationUpdate, criteriaMet) {
		if (rtvoting) {
			if (isRanked) {
				actionButtonTitle = "Update";
			} else if (qualificationUpdate) {
				if (criteriaMet != 2) {
					actionButtonTitle = "Update qualification";
				} else {
					actionButtonTitle = "Disqualify";
				}
			} else {
				actionButtonTitle = "Qualify";
			}
		} else {
			actionButtonTitle = "Submit";
		}
	}

	$: updateStars(currentStars);
	$: updateDialogTitle(rtvoting, isRanked, qualificationUpdate);
	$: updateActionButtonTitle(rtvoting, isRanked, qualificationUpdate, criteriaMet);

</script>

<div class="ranking-voting {insideLeaderboard ? "inside-leaderboard" : ""}">
	<Dialog
		type="confirm"
		title={dialogTitle}
		okButton={actionButtonTitle}
		cancelButton="Cancel"
        okButtonDisabled={suitableForRank == undefined}
		on:confirm={() => vote()}
		on:cancel={() => dispatch('finished')}>
		<div slot="content">
			{#if !(rtvoting && !isRanked)}
			<div>Is this map suitable for rank?</div>
			<Button
				label="NO"
				type={suitableForRank || suitableForRank == undefined ? 'default' : 'danger'}
				on:click={() => (suitableForRank = false)} />
			<Button
				label="YES"
				type={suitableForRank === false || suitableForRank == undefined ? 'default' : 'green'}
				on:click={() => (suitableForRank = true)} />
			{/if}
			{#if qualificationUpdate}
			<div>Qualification status</div>
			<Button
				label="STOP"
				type={suitableForRank || suitableForRank == undefined ? 'default' : 'danger'}
				on:click={() => (suitableForRank = false)} />
			<Button
				label="KEEP"
				type={suitableForRank === false || suitableForRank == undefined ? 'default' : 'green'}
				on:click={() => (suitableForRank = true)} />
			<div>Mapper allowed but can't/not want to use website</div>
			<Button
				label="YES"
				type={mapperAllowed === false || mapperAllowed == undefined ? 'default' : 'green'}
				on:click={() => (mapperAllowed = true)} />
			{/if}
			{#if qualificationUpdate}
			<div>Criteria check result</div>
			<Button
				label="UNMET"
				type={criteriaMet == 2 ? 'danger' : 'default'}
				on:click={() => (criteriaMet = 2)} />
			<Button
				label="MET"
				type={criteriaMet == 1 ? 'green' : 'default'}
				on:click={() => (criteriaMet = 1)} />
			{/if}
			{#if criteriaMet == 2} 
			<input type="text" style="width: 100%;" bind:value={criteriaCommentary} placeholder="Criteria commentary" class="input-reset">
			{/if}
			{#if suitableForRank}
				<div>
					<label>{rtvoting ? "Stars:" : "Stars (optional):"}</label>
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
					<label>{rtvoting ? "Type:" : "Type (optional):"}</label>
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
		--itemHoverBG: #eb008c;
	}

	:global(.inside-leaderboard .ss-modal) {
		top: 0 !important;
		position: sticky !important;
		transform: none !important;
	}

	.remove-type {
		border: none;
		color: rgb(255, 0, 0);
		background-color: transparent;
		cursor: pointer;
		transform: translate(-7px, -2px);
	}
</style>
