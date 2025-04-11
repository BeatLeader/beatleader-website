<script>
	import {
		diffColors,
		difficultyDescriptions,
		DifficultyStatus,
		getSongSortingValue,
		modeDescriptions,
		wrapBLStatus,
		sortingValueIsSongOnly,
		badgesDef,
		userDiffNameForDiff,
		starsToBackgroundColor,
		starsToColor,
	} from '../../../utils/beatleader/format';
	import Icons from '../../Song/Icons.svelte';
	import {decapitalizeFirstLetter} from '../../../utils/js';
	import SongScoreCompact from './SongScoreCompact.svelte';
	import SongStatus from './SongStatus.svelte';
	import {createEventDispatcher} from 'svelte';
	import FormattedDate from '../../Common/FormattedDate.svelte';
	import {navigate} from 'svelte-routing';
	import {configStore} from '../../../stores/config';

	export let song;
	export let isHovered;

	export let sortValue;
	export let sortBy;
	export let dateType;

	let modes;

	const dispatch = createEventDispatcher();

	function groupDiffs(song) {
		var result = [];

		for (let i = 0; i < song.difficulties.length; i++) {
			var diff = song.difficulties[i];

			if (diff.mode < 10) {
				var characteristic = result.find(d => d.mode == diff.mode);

				if (!characteristic) {
					characteristic = {
						mode: diff.mode,
						modeName: diff.modeName,
						diffs: [],
						description: modeDescriptions[diff.modeName],
					};
					result.push(characteristic);
				}
				diff.color = diffColors[diff.difficultyName.toLowerCase()];
				characteristic.diffs.push(diff);
			}
		}

		for (let i = 0; i < result.length; i++) {
			const mode = result[i];
			mode.diffs = mode.diffs.sort((a, b) => a.value - b.value);
		}

		modes = result.sort((a, b) => (a.mode > 0 ? a.mode : 10) - (b.mode > 0 ? b.mode : 10));
	}

	function dateTypeDescription(dateType) {
		switch (dateType) {
			case 'ranked':
				return 'Ranked:';
			case 'qualification':
				return 'Qualified:';
			case 'nomination':
				return 'Nominated:';
			default:
				return 'Uploaded:';
		}
	}

	function dateTypeKey(dateType) {
		switch (dateType) {
			case 'ranked':
				return 'rankedTime';
			case 'qualification':
				return 'qualificationTime';
			case 'nomination':
				return 'nominationTime';
			default:
				return 'uploadTime';
		}
	}

	$: song?.difficulties && groupDiffs(song);
	$: songOnly = sortingValueIsSongOnly(sortBy);
</script>

{#if modes?.length}
	<div class="modes-list" on:scroll={e => dispatch('container-scroll', e)} class:isHovered>
		{#each modes as mode}
			<div class="mode-container" class:isHovered>
				<div class="mode-icon-name" class:isHovered>
					<i class="mode-icon {mode.description.icon}" class:isHovered />
					{#if isHovered}
						<span class="mode-name">{mode.modeName}</span>
					{/if}
				</div>
				<div class="diffs-container" class:isHovered>
					{#each mode.diffs as diff, idx}
						{@const diffSortValue = getSongSortingValue(song, diff, sortBy)}
						<div class="diff-container" class:isHovered>
							<div
								class="diff-orb"
								class:isHovered
								class:nonApplicable={!diff.applicable}
								style="background-color: {starsToBackgroundColor(diff, $configStore)}; color: {starsToColor(
									diff,
									$configStore
								)}; margin-right: {!isHovered && idx == mode.diffs.length - 1 && !diff.stars ? '0.3em' : '0'};">
								{#if !isHovered && diff.myScore}
									<div
										class="my-score"
										style="background-color: {badgesDef.find(
											b => (!b.max || diff.myScore.accuracy * 100 <= b.max) && (!b.min || diff.myScore.accuracy * 100 > b.min)
										).color}; border: solid {diff.myScore.fullCombo ? 'yellow' : 'white'} 2px;">
									</div>
								{/if}
								{#if isHovered}
									<a
										on:click|preventDefault|stopPropagation={e => navigate(`/leaderboard/global/${diff.leaderboardId}`)}
										style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0;"
										href={`/leaderboard/global/${diff.leaderboardId}`} />
									<span class="diff-name">{userDiffNameForDiff(diff.value)}</span>
								{/if}
								{#if diff.stars}
									<div class="stars-container">
										<span>{diff.stars.toFixed(isHovered ? 2 : 1)}</span><span>★</span>
									</div>
								{/if}
							</div>
							{#if isHovered}
								<div
									on:click={e => {
										navigate(`/leaderboard/global/${diff.leaderboardId}`);
									}}
									class="tail-container">
									<div class="status-container">
										{#if diff.status && diff.status != DifficultyStatus.unranked && diff.status != DifficultyStatus.unrankable}
											<SongStatus songStatus={wrapBLStatus(diff.status)} />
										{/if}
										{#if sortBy == 'timestamp' && (diff[dateTypeKey(dateType)] || song[dateTypeKey(dateType)])}
											<span class="sort-value" style="font-size: 0.8em;">
												<FormattedDate date={diff[dateTypeKey(dateType)] ?? song[dateTypeKey(dateType)]} /></span>
										{:else if !songOnly}
											<span class="sort-value">{diffSortValue}</span>
										{/if}
									</div>
									<div class="score-and-icons">
										<SongScoreCompact score={diff.myScore} />
										<Icons {song} diffInfo={{diff: diff.difficultyName, type: diff.modeName}} icons={['playlist']} />
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	.modes-list {
		display: flex;
		gap: 0.3em;
		overflow: hidden;
		overflow: hidden;
		mask-image: linear-gradient(90deg, white 0%, white 90%, transparent);
	}
	.modes-list.isHovered {
		flex-direction: column;
		flex: 1;
		gap: 0.4em;
		width: unset;
		mask-image: unset;
		overflow: visible;
	}
	.mode-container {
		border-radius: 12px;
		background-color: #00000069;
		padding: 0.25em 0.2em 0.25em 0.4em;
		display: flex;
		gap: 0.2em;
		align-items: center;
	}

	.mode-container.isHovered {
		display: flex;
		flex-direction: column;
		align-items: baseline;
		padding: 0.2em 0.4em 0.3em 0.4em;
	}

	.mode-icon-name.isHovered {
		display: flex;
		padding-top: 0.2em;
		gap: 0.4em;
		font-weight: 600;
	}

	.diff-container:hover {
		background-color: #202020a1;
		border-radius: 6px;
	}

	.diff-container {
		display: flex;
		position: relative;
		pointer-events: none;
		color: white;
	}

	.diff-container.isHovered {
		display: contents;
		align-items: center;
		pointer-events: auto;
	}

	.diffs-container {
		display: flex;
		gap: 0.2em;
	}

	.diffs-container.isHovered {
		width: 100%;
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.3em;
	}

	.status-container {
		display: flex;
		gap: 0.3em;
		align-items: center;
	}

	.mode-icon {
		width: 1.2em;
		height: 1.2em;
		display: block;
	}

	.mode-icon.isHovered {
		width: 1.4em;
		height: 1.4em;
	}

	.diff-orb {
		font-weight: 600;
		padding: 0.15em 0.3em 0.18em 0.4em;
		font-size: 0.7em;
		border-radius: 0.8em;
		display: flex;
		align-items: center;
		gap: 0.1em;
		min-height: 1.6em;
	}

	.diff-orb.isHovered {
		position: relative;
		padding: 0.1em 0.3em 0.1em 0.4em;
		font-size: 0.8em;
		border-radius: 0.7em;
		justify-content: space-between;
		gap: 0.5em;
	}

	.diff-orb.isHovered::before {
		content: '';
		position: absolute;
		top: -0.2em;
		bottom: -0.2em;
		right: -0.2em;
		border-radius: 10px 0 0 10px;
		left: -0.2em;
		z-index: -1;
	}

	.diff-container.isHovered:hover .diff-orb::before {
		background-color: #474747a1;
	}

	.diff-orb.nonApplicable {
		opacity: 0.6;
	}

	.my-score {
		width: 1em;
		height: 1em;
		border-radius: 0.5em;
		margin-right: 0.1em;
	}

	.score-and-icons {
		display: flex;
		gap: 0.5em;
		align-items: center;
	}

	.tail-container {
		position: relative;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.2em;
		color: white;
		cursor: pointer;
	}

	.tail-container::before {
		content: '';
		position: absolute;
		top: -0.16em;
		bottom: -0.16em;
		right: -0.2em;
		border-radius: 0 10px 10px 0;
		left: -0.15em;
		z-index: -1;
	}

	.diff-container.isHovered:hover .tail-container::before {
		background-color: #474747a1;
	}

	@media (max-width: 767px) {
		.modes-list {
			font-size: 0.9em;
		}
	}
</style>
