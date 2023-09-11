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
	import CriteriaCheck from './CriteriaCheck.svelte';
	import {AccRatingFromAIAcc} from '../../utils/beatleader/pp';

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
	let currentTechRating = leaderboard?.stats?.techRating;
	let currentAccRating = leaderboard?.stats?.accRating;
	let currentPassRating = leaderboard?.stats?.passRating;
	let currentType = leaderboard?.stats?.type;
	let isRanked = leaderboard?.stats?.status === DifficultyStatus.ranked;
	let isQualified = leaderboard?.stats?.status === DifficultyStatus.qualified;
	let isNominated = leaderboard?.stats?.status === DifficultyStatus.nominated;
	let qualification = leaderboard?.qualification;

	let suitableForRank = rtvoting && !isRanked ? true : undefined;
	let techRating;
	let accRating;
	let passRating;
	let modifiers;
	let status = leaderboard?.stats?.status;

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
				votingStore.updateMap(hash, diff, mode, status, accRating, passRating, techRating, selectedTypes);
			} else {
				if (qualificationUpdate) {
					votingStore.updateQualification(
						hash,
						diff,
						mode,
						status,
						accRating,
						passRating,
						techRating,
						selectedTypes,
						criteriaMet,
						criteriaCommentary,
						modifiers
					);
				} else {
					votingStore.qualifyMap(hash, diff, mode, suitableForRank, accRating, passRating, techRating, selectedTypes, modifiers);
				}
			}
		} else {
			votingStore.vote(hash, diff, mode, suitableForRank);
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

	function updateStars(currentTechRating, currentAccRating, currentPassRating) {
		techRating = currentTechRating ?? 0.0;
		accRating = currentAccRating ?? 0.0;
		passRating = currentPassRating ?? 0.0;
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
		rtvoting,
		isRanked,
		qualificationUpdate,
		status,
		criteriaMet,
		playerId,
		techRating,
		accRating,
		passRating,
		selectedTypes,
		modifiers,
		isQualified
	) {
		if (rtvoting) {
			if (isRanked) {
				actionButtonTitle = 'Update';
			} else if (qualificationUpdate) {
				if (status == DifficultyStatus.qualified || status == DifficultyStatus.nominated) {
					if (
						status == DifficultyStatus.qualified &&
						!isjuniorRT &&
						qualification.criteriaChecker != playerId &&
						qualification.criteriaMet == 1 &&
						qualification.criteriaMet == criteriaMet &&
						currentTechRating.toFixed(2) == techRating.toFixed(2) &&
						currentAccRating.toFixed(2) == accRating.toFixed(2) &&
						currentPassRating.toFixed(2) == passRating.toFixed(2) &&
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

	function fetchAI(leaderboard) {
		fetch(`https://bs-replays-ai.azurewebsites.net/bl-reweight/${leaderboard?.song?.hash}/Standard/${leaderboard?.difficultyBl?.value}`)
			.then(d => d.json())
			.then(d => {
				techRating = d.none.lack_map_calculation.balanced_tech * 10;
				accRating = AccRatingFromAIAcc(
					d.none.AIacc,
					d.none.lack_map_calculation.balanced_pass_diff,
					d.none.lack_map_calculation.balanced_tech * 10
				);
				passRating = d.none.lack_map_calculation.balanced_pass_diff;
			});
	}

	let showModifiers = false;

	$: updateStars(currentTechRating, currentAccRating, currentPassRating);
	$: modifiersUpdated(deepClone(currentModifiers));
	$: updateDialogTitle(rtvoting, isRanked, qualificationUpdate, isQualified);
	$: updateActionButtonTitle(
		rtvoting,
		isRanked,
		qualificationUpdate,
		status,
		criteriaMet,
		playerId,
		techRating,
		accRating,
		passRating,
		selectedTypes,
		modifiers,
		isQualified
	);

	$: if (!accRating && leaderboard) fetchAI(leaderboard);
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
				<div>Map status</div>
				{#if criteriaMet == 2}
					<Button
						label="Unrankable"
						type={status == DifficultyStatus.unrankable ? 'danger' : 'default'}
						on:click={() => (status = DifficultyStatus.unrankable)} />
				{/if}
				<Button
					label="Unranked"
					type={status == DifficultyStatus.unranked ? 'danger' : 'default'}
					on:click={() => (status = DifficultyStatus.unranked)} />
				<Button
					label="Nominated"
					type={status == DifficultyStatus.nominated ? 'green' : 'default'}
					on:click={() => (status = DifficultyStatus.nominated)} />
				{#if isNominated}
					<Button
						label="Qualified"
						disabled={isjuniorRT}
						type={status == DifficultyStatus.qualified ? 'green' : 'default'}
						on:click={() => (status = DifficultyStatus.qualified)} />
				{/if}
				{#if !isQualified}
					<div>Criteria check result</div>
					<Button label="UNKNOWN" type={criteriaMet == 0 ? 'lessdanger' : 'default'} on:click={() => (criteriaMet = 0)} />
					<Button label="UNMET" type={criteriaMet == 2 ? 'danger' : 'default'} on:click={() => (criteriaMet = 2)} />
					<Button label="HOLD" type={criteriaMet == 3 ? 'lessdanger' : 'default'} on:click={() => (criteriaMet = 3)} />
					<Button label="MET" type={criteriaMet == 1 ? 'green' : 'default'} on:click={() => (criteriaMet = 1)} />
				{/if}
			{/if}
			{#if qualification && rtvoting}
				<input type="text" style="width: 100%;" bind:value={criteriaCommentary} placeholder="Short summary..." class="input-reset" />
			{/if}
			{#if rtvoting && suitableForRank}
				<div>
					<label>Acc rating:</label>
					<div class="buttons-and-slider">
						<Button
							title="Less"
							iconFa="fas fa-caret-left"
							type="text"
							on:click={() => {
								if (accRating > 0) accRating -= Ranked_Const.STAR_GRANULARITY;
							}} />

						<RangeSlider
							disabled={true}
							min={Ranked_Const.MIN_STARS}
							max={Ranked_Const.MAX_STARS}
							step={Ranked_Const.STAR_GRANULARITY}
							values={[accRating]}
							float
							hoverable
							pips
							pipstep={2 / Ranked_Const.STAR_GRANULARITY}
							all="label"
							on:change={event => {
								accRating = event.detail.values[0];
							}} />
						<Button
							title="More"
							iconFa="fas fa-caret-right"
							type="text"
							on:click={() => {
								if (accRating > 0) accRating += Ranked_Const.STAR_GRANULARITY;
							}} />
					</div>
				</div>
				<div>
					<label>Pass rating:</label>
					<div class="buttons-and-slider">
						<Button
							title="Less"
							iconFa="fas fa-caret-left"
							type="text"
							on:click={() => {
								if (passRating > 0) passRating -= Ranked_Const.STAR_GRANULARITY;
							}} />

						<RangeSlider
							disabled={true}
							min={Ranked_Const.MIN_STARS}
							max={Ranked_Const.MAX_STARS}
							step={Ranked_Const.STAR_GRANULARITY}
							values={[passRating]}
							float
							hoverable
							pips
							pipstep={2 / Ranked_Const.STAR_GRANULARITY}
							all="label"
							on:change={event => {
								passRating = event.detail.values[0];
							}} />
						<Button
							title="More"
							iconFa="fas fa-caret-right"
							type="text"
							on:click={() => {
								if (passRating > 0) passRating += Ranked_Const.STAR_GRANULARITY;
							}} />
					</div>
				</div>

				<div>
					<label>Tech rating:</label>
					<div class="buttons-and-slider">
						<Button
							title="Less"
							iconFa="fas fa-caret-left"
							type="text"
							on:click={() => {
								if (techRating > 0) techRating -= Ranked_Const.STAR_GRANULARITY;
							}} />

						<RangeSlider
							disabled={true}
							min={Ranked_Const.MIN_STARS}
							max={Ranked_Const.MAX_STARS}
							step={Ranked_Const.STAR_GRANULARITY}
							values={[techRating]}
							float
							hoverable
							pips
							pipstep={2 / Ranked_Const.STAR_GRANULARITY}
							all="label"
							on:change={event => {
								techRating = event.detail.values[0];
							}} />
						<Button
							title="More"
							iconFa="fas fa-caret-right"
							type="text"
							on:click={() => {
								if (techRating > 0) techRating += Ranked_Const.STAR_GRANULARITY;
							}} />
					</div>
				</div>
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
					<CriteriaCheck songId={leaderboard.song.id} />
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
