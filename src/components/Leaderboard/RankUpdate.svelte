<script>
	import Dialog from '../Common/Dialog.svelte';
	import Button from '../Common/Button.svelte';
	import Select from 'svelte-select';
	import {createEventDispatcher} from 'svelte';

	import {votingTypes, mapTypeFromMask} from '../../utils/beatleader/format';
	import ModifiersUpdate from './ModifiersUpdate.svelte';
	import {deepClone, shallowEqual} from '../../utils/js';
	import CriteriaCheck from './CriteriaCheck.svelte';

	const dispatch = createEventDispatcher();

	export let votingStore;
	export let leaderboard;
	export let playerId;
	export let reweight;

	let hash = leaderboard?.song?.hash;
	let diff = leaderboard?.diffInfo?.diff;
	let mode = leaderboard?.diffInfo?.type;
	let currentStars = reweight?.stars ?? leaderboard?.stats?.stars;
	let currentType = reweight?.type ?? leaderboard?.stats?.type;
	let currentModifiers = reweight?.modifiers ?? leaderboard?.difficultyBl?.modifierValues;

	let suitableForRank = reweight?.keep ?? 1;

	let constants;
	let stars;
	let modifiers;

	let criteriaMet = reweight?.criteriaMet ?? 1;
	let criteriaCommentary = reweight?.criteriaCommentary;

	let originalTypes = currentType ? mapTypeFromMask(currentType).split(',') : [];
	let selectedTypes = currentType ? mapTypeFromMask(currentType).split(',') : [];
	const allMapTypes = votingTypes;
	let mapTypes = votingTypes;
	let selectedType = '+';

	function somethingChanged(suitableForRank, criteriaMet, criteriaCommentary, stars, selectedTypes, modifiers) {
		return (
			reweight?.keep != suitableForRank ||
			reweight?.criteriaMet != criteriaMet ||
			reweight?.criteriaCommentary != criteriaCommentary ||
			stars != reweight?.stars ||
			!(
				originalTypes.length === selectedTypes.length &&
				originalTypes.every(function (value, index) {
					return value === selectedTypes[index];
				})
			) ||
			!shallowEqual(modifiers, reweight?.modifiers, ['modifierId'])
		);
	}

	function vote() {
		if (
			!reweight ||
			reweight.rtMember == playerId ||
			somethingChanged(suitableForRank, criteriaMet, criteriaCommentary, stars, selectedTypes, modifiers)
		) {
			votingStore.updateReweight(hash, diff, mode, suitableForRank, selectedTypes, criteriaMet, criteriaCommentary, modifiers);
		} else {
			votingStore.approveReweight(hash, diff, mode);
		}
		dispatch('finished');
	}

	function stop() {
		votingStore.stopReweight(hash, diff, mode);
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
		stars = currentStars ?? 0;
	}

	function modifiersUpdated(modifiersUpdate) {
		modifiers = modifiersUpdate;
	}

	let dialogTitle;
	function updateDialogTitle(reweight, suitableForRank, criteriaMet, criteriaCommentary, stars, selectedTypes, modifiers) {
		if (!reweight) {
			dialogTitle = 'Assign map reweight to me';
		} else if (
			reweight.rtMember == playerId ||
			somethingChanged(suitableForRank, criteriaMet, criteriaCommentary, stars, selectedTypes, modifiers)
		) {
			dialogTitle = 'Update values';
		} else {
			dialogTitle = 'Approve reweight';
		}
	}

	let actionButtonTitle;
	let actionButtonType;
	function updateActionButtonTitle(reweight, suitableForRank, criteriaMet, criteriaCommentary, stars, selectedTypes, modifiers) {
		actionButtonType = 'primary';
		if (!reweight) {
			actionButtonTitle = 'Assign map';
		} else if (
			reweight.rtMember == playerId ||
			somethingChanged(suitableForRank, criteriaMet, criteriaCommentary, stars, selectedTypes, modifiers)
		) {
			actionButtonTitle = 'Update values';
		} else {
			actionButtonType = 'purple';
			actionButtonTitle = 'Approve reweight';
		}
	}

	let showModifiers = false;

	$: updateStars(currentStars);
	$: modifiersUpdated(deepClone(currentModifiers));
	$: updateDialogTitle(reweight, suitableForRank, criteriaMet, criteriaCommentary, stars, selectedTypes, modifiers);
	$: updateActionButtonTitle(reweight, suitableForRank, criteriaMet, criteriaCommentary, stars, selectedTypes, modifiers);
</script>

<div class="ranking-voting inside-leaderboard">
	<Dialog
		type="update"
		title={dialogTitle}
		okButton={actionButtonTitle}
		okButtonType={actionButtonType}
		cancelButton="Cancel"
		deleteButton="Stop"
		okButtonDisabled={suitableForRank == undefined || ((criteriaMet == 2 || criteriaMet == 3) && !criteriaCommentary)}
		on:confirm={() => vote()}
		on:cancel={() => dispatch('finished')}
		on:delete={() => stop()}>
		<div slot="content">
			<div>Keep this map ranked?</div>
			<Button
				label="NO"
				type={suitableForRank || suitableForRank == undefined ? 'default' : 'danger'}
				on:click={() => (suitableForRank = false)} />
			<Button
				label="YES"
				type={suitableForRank === false || suitableForRank == undefined ? 'default' : 'green'}
				on:click={() => (suitableForRank = true)} />
			<div>Criteria check result</div>
			<Button label="UNKNOWN" type={criteriaMet == 0 ? 'lessdanger' : 'default'} on:click={() => (criteriaMet = 0)} />
			<Button label="UNMET" type={criteriaMet == 2 ? 'danger' : 'default'} on:click={() => (criteriaMet = 2)} />
			<Button label="HOLD" type={criteriaMet == 3 ? 'lessdanger' : 'default'} on:click={() => (criteriaMet = 3)} />
			<Button label="MET" type={criteriaMet == 1 ? 'green' : 'default'} on:click={() => (criteriaMet = 1)} />
			{#if criteriaMet != 0}
				<input type="text" style="width: 100%;" bind:value={criteriaCommentary} placeholder="Criteria commentary" class="input-reset" />
			{/if}
			{#if suitableForRank}
				<div>
					<label>Type:</label>
					{#each selectedTypes as type, idx}
						<div>
							{type}
							<button class="remove-type" title="Remove" on:click={() => remove(type)}><i class="fas fa-xmark" /></button>
						</div>
					{/each}
					<Select bind:value={selectedType} items={mapTypes} isSearchable={true} on:select={e => selectType(e.detail.value)} />
				</div>
				<div>
					<div class="score-options-section">
						<span
							class="beat-savior-reveal clickable"
							class:opened={showModifiers}
							on:click={() => (showModifiers = !showModifiers)}
							title="Show average difficulty stats">
							{#if showModifiers}
								Hide modifiers
							{:else}
								Show modifiers
							{/if}

							<i class="fas fa-chevron-down" />
						</span>
					</div>
					{#if showModifiers}
						<ModifiersUpdate {modifiers} on:modifiersUpdated={e => modifiersUpdated(e.detail)} />
					{/if}
				</div>
				<CriteriaCheck songId={leaderboard.song.id} />
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

	.beat-savior-reveal {
		align-self: end;
		cursor: pointer;
	}

	.beat-savior-reveal > i {
		transition: transform 500ms;
		transform-origin: 0.42em 0.5em;
	}

	.beat-savior-reveal.opened > i {
		transform: rotateZ(180deg);
	}

	.score-options-section {
		display: grid;
		justify-items: center;
		margin: 0.3em;
	}

	:global(.buttons-and-slider .rangeSlider) {
		width: 100%;
		margin-left: -0.2em;
		margin-right: -0.2em;
		margin-top: 0.85em;
	}

	.buttons-and-slider {
		display: flex;
		margin-left: -1em;
		margin-right: -1em;
	}
</style>
