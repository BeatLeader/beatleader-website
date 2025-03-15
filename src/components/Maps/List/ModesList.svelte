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
	} from '../../../utils/beatleader/format';
	import Icons from '../../Song/Icons.svelte';
	import SongScoreCompact from './SongScoreCompact.svelte';
	import SongStatus from './SongStatus.svelte';
	import {createEventDispatcher} from 'svelte';

	export let song;
	export let isHovered;

	export let sortValue;
	export let sortBy;

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

		modes = result;
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
							{#if isHovered}
								<span class="diff-name">{diff.difficultyName}</span>
							{/if}
							<div
								class="diff-orb"
								class:isHovered
								style="background-color: {diff.color}; margin-right: {!isHovered && idx == mode.diffs.length - 1 && !diff.stars
									? '0.3em'
									: '0'};">
								{#if !isHovered && diff.myScore}
									<div
										class="my-score"
										style="background-color: {badgesDef.find(
											b => (!b.max || diff.myScore.accuracy * 100 <= b.max) && (!b.min || diff.myScore.accuracy * 100 > b.min)
										).color}; border: solid {diff.myScore.fullCombo ? 'yellow' : 'white'} 2px;">
									</div>
								{/if}
								{#if diff.stars}
									<span>{diff.stars.toFixed(isHovered ? 2 : 1)}</span><span>★</span>
								{/if}
							</div>
							{#if isHovered}
								<div class="tail-container">
									<div class="status-container">
										{#if diff.status && diff.status != DifficultyStatus.unranked && diff.status != DifficultyStatus.unrankable}
											<SongStatus songStatus={wrapBLStatus(diff.status)} />
										{/if}
										{#if !songOnly}
											<span class="sort-value">{diffSortValue}</span>
										{/if}
									</div>
									<div class="score-and-icons">
										<SongScoreCompact score={diff.myScore} />
										<Icons {song} diffInfo={diff.diffInfo} icons={['playlist']} />
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
		transition: all 0.3s ease-in-out;
		overflow: hidden;
		width: 19em;
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
		padding: 0.15em 0.2em 0.15em 0.4em;
		display: flex;
		gap: 0.2em;
		align-items: center;
		transition: all 0.3s ease-in-out;
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

	.diff-container {
		display: flex;
		transition: all 0.3s ease-in-out;
	}

	.diff-container.isHovered {
		display: grid;
		grid-template-columns: 6em 3.5em auto;
		gap: 0.2em;
		align-items: center;
	}

	.diffs-container {
		display: flex;
		gap: 0.2em;
		transition: all 0.3s ease-in-out;
	}

	.diffs-container.isHovered {
		flex-direction: column;
		width: 100%;
	}

	.status-container {
		display: flex;
		gap: 0.2em;
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
		color: white;
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
		padding: 0.25em 0.3em 0.2em 0.4em;
		font-size: 0.8em;
		border-radius: 0.7em;
		justify-content: center;
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
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.2em;
	}

	@media (max-width: 767px) {
		.modes-list {
			width: 16em;
			font-size: 0.9em;
		}
	}
</style>
