<script>
	import Dialog from '../Common/Dialog.svelte';
	import Button from '../Common/Button.svelte';
	import RangeSlider from 'svelte-range-slider-pips';
	import Select from 'svelte-select';
	import {createEventDispatcher} from 'svelte';

	import {votingTypes, mapTypeFromMask, DifficultyStatus} from '../../utils/beatleader/format';
	import {deepClone, shallowEqual} from '../../utils/js';
	import ModifiersUpdate from './ModifiersUpdate.svelte';
	import {Ranked_Const} from '../../utils/beatleader/consts';

	const dispatch = createEventDispatcher();

	export let votingStore;
	export let leaderboard;
	export let insideLeaderboard = false;
	export let playerId;
	export let rtvoting;
	export let qualificationUpdate;
	export let isjuniorRT;
	export let hideStarSlider = false;

	let hash = leaderboard?.song?.hash;
	let diff = leaderboard?.diffInfo?.diff;
	let mode = leaderboard?.diffInfo?.type;
	let currentStars = leaderboard?.stats?.stars;
	let currentType = leaderboard?.stats?.type;
	let isRanked = leaderboard?.stats?.status === DifficultyStatus.ranked;
	let isQualified = leaderboard?.stats?.status === DifficultyStatus.qualified;
	let qualification = leaderboard?.qualification;

	let suitableForRank = rtvoting && !isRanked ? true : undefined;
	let stars;
	let modifiers;

	let mapperAllowed = qualification?.mapperAllowed;
	let criteriaMet = qualification?.criteriaMet;
	let criteriaCommentary = qualification?.criteriaCommentary;
	let currentModifiers = qualification?.modifiers ?? leaderboard?.difficultyBl?.modifierValues;

	let originalTypes = currentType ? mapTypeFromMask(currentType).split(',') : [];
	let selectedTypes = currentType ? mapTypeFromMask(currentType).split(',') : [];
	const allMapTypes = votingTypes;
	let mapTypes = votingTypes;
	let selectedType = '+';

	function vote() {
		if (rtvoting) {
			if (isRanked) {
				votingStore.updateMap(hash, diff, mode, suitableForRank, stars, selectedTypes);
			} else {
				if (qualificationUpdate) {
					votingStore.updateQualification(
						hash,
						diff,
						mode,
						suitableForRank,
						stars,
						selectedTypes,
						mapperAllowed,
						criteriaMet,
						criteriaCommentary,
						modifiers
					);
				} else {
					votingStore.qualifyMap(hash, diff, mode, suitableForRank, stars, selectedTypes, modifiers);
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
		stars = currentStars ?? 7.5;
	}

	function modifiersUpdated(modifiersUpdate) {
		modifiers = modifiersUpdate;
	}

	let dialogTitle;
	function updateDialogTitle(rtvoting, isRanked, qualificationUpdate, isQualified) {
		if (rtvoting) {
			if (isRanked) {
				dialogTitle = 'Update map ranking';
			} else if (qualificationUpdate) {
				if (isQualified) {
					dialogTitle = 'Update map qualification';
				} else {
					dialogTitle = 'Update map nomination';
				}
			} else {
				dialogTitle = 'Nominate map';
			}
		} else {
			dialogTitle = 'Vote map for ranked';
		}
	}

	let actionButtonTitle;
	let actionButtonType;
	function updateActionButtonTitle(
		suitableForRank,
		mapperAllowed,
		rtvoting,
		isRanked,
		qualificationUpdate,
		criteriaMet,
		playerId,
		stars,
		selectedTypes,
		modifiers,
		isQualified
	) {
		actionButtonType = 'primary';
		if (rtvoting) {
			if (isRanked) {
				actionButtonTitle = 'Update';
			} else if (qualificationUpdate) {
				if (suitableForRank) {
					if (
						qualification.mapperAllowed &&
						mapperAllowed &&
						!isjuniorRT &&
						qualification.rtMember != playerId &&
						qualification.criteriaChecker != playerId &&
						qualification.criteriaMet == 1 &&
						qualification.criteriaMet == criteriaMet &&
						currentStars == stars &&
						originalTypes.length === selectedTypes.length &&
						((qualification?.modifiers == null && shallowEqual(modifiers, leaderboard?.difficultyBl?.modifierValues, ['modifierId'])) ||
							shallowEqual(modifiers, qualification?.modifiers, ['modifierId'])) &&
						originalTypes.every(function (value, index) {
							return value === selectedTypes[index];
						})
					) {
						actionButtonTitle = 'Approve qualification!';
						actionButtonType = 'purple';
					} else {
						actionButtonTitle = 'Update nomination';
					}
				} else {
					if (!isQualified) {
						actionButtonTitle = 'Stop nomination!';
					} else {
						actionButtonTitle = 'Decline qualification!';
					}

					actionButtonType = 'danger';
				}
			} else {
				actionButtonTitle = 'Nominate';
			}
		} else {
			actionButtonTitle = 'Submit';
		}
	}

	let showModifiers = false;

	$: updateStars(currentStars);
	$: modifiersUpdated(deepClone(currentModifiers));
	$: updateDialogTitle(rtvoting, isRanked, qualificationUpdate, isQualified);
	$: updateActionButtonTitle(
		suitableForRank,
		mapperAllowed,
		rtvoting,
		isRanked,
		qualificationUpdate,
		criteriaMet,
		playerId,
		stars,
		selectedTypes,
		modifiers,
		isQualified
	);
</script>

<div class="ranking-voting {insideLeaderboard || showModifiers ? 'inside-leaderboard' : ''}">
	<Dialog
		type="confirm"
		title={dialogTitle}
		okButton={actionButtonTitle}
		okButtonType={actionButtonType}
		cancelButton="Cancel"
		okButtonDisabled={suitableForRank == undefined || ((criteriaMet == 2 || criteriaMet == 3) && !criteriaCommentary)}
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
				<div>{isQualified ? 'Qualification status' : 'Nomination status'}</div>
				<Button
					label="STOP"
					type={suitableForRank || suitableForRank == undefined ? 'default' : 'danger'}
					on:click={() => (suitableForRank = false)} />
				<Button
					label="KEEP"
					type={suitableForRank === false || suitableForRank == undefined ? 'default' : 'green'}
					on:click={() => (suitableForRank = true)} />
				{#if !isQualified}
					<div>Mapper allowed but can't/not want to use website</div>
					<Button
						label="NO"
						type={mapperAllowed === true || mapperAllowed == undefined ? 'default' : 'danger'}
						on:click={() => (mapperAllowed = false)} />
					<Button
						label="YES"
						type={mapperAllowed === false || mapperAllowed == undefined ? 'default' : 'green'}
						on:click={() => (mapperAllowed = true)} />
					<div>Criteria check result</div>
					<Button label="UNKNOWN" type={criteriaMet == 0 ? 'lessdanger' : 'default'} on:click={() => (criteriaMet = 0)} />
					<Button label="UNMET" type={criteriaMet == 2 ? 'danger' : 'default'} on:click={() => (criteriaMet = 2)} />
					<Button label="HOLD" type={criteriaMet == 3 ? 'lessdanger' : 'default'} on:click={() => (criteriaMet = 3)} />
					<Button label="MET" type={criteriaMet == 1 ? 'green' : 'default'} on:click={() => (criteriaMet = 1)} />
				{/if}
			{/if}
			{#if qualification && rtvoting}
				<input type="text" style="width: 100%;" bind:value={criteriaCommentary} placeholder="Criteria commentary" class="input-reset" />
			{/if}
			{#if suitableForRank}
				{#if !hideStarSlider}
					<div>
						<label>{rtvoting ? 'Stars:' : 'Stars (optional):'}</label>
						<div class="buttons-and-slider">
							<Button
								title="Less"
								iconFa="fas fa-caret-left"
								type="text"
								on:click={() => {
									if (stars > 0) stars -= Ranked_Const.STAR_GRANULARITY;
								}} />

							<RangeSlider
								min={Ranked_Const.MIN_STARS}
								max={Ranked_Const.MAX_STARS}
								step={Ranked_Const.STAR_GRANULARITY}
								values={[stars]}
								float
								hoverable
								pips
								pipstep={2/Ranked_Const.STAR_GRANULARITY}
								all="label"
								on:change={event => {
									stars = event.detail.values[0];
								}} />
							<Button
								title="More"
								iconFa="fas fa-caret-right"
								type="text"
								on:click={() => {
									if (stars > 0) stars += Ranked_Const.STAR_GRANULARITY;
								}} />
						</div>
					</div>
				{/if}
				<div>
					<label>{rtvoting ? 'Type:' : 'Type (optional):'}</label>
					{#each selectedTypes as type, idx}
						<div>
							{type}
							<button class="remove-type" title="Remove" on:click={() => remove(type)}><i class="fas fa-xmark" /></button>
						</div>
					{/each}
					<Select bind:value={selectedType} items={mapTypes} isSearchable={true} on:select={e => selectType(e.detail.value)} />
				</div>
				{#if rtvoting}
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
				{/if}
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
