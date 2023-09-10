<script>
	import {configStore} from '../../stores/config';
	import {opt} from '../../utils/js';
	import FormattedDate from '../Common/FormattedDate.svelte';
	import ScoreRank from '../Player/ScoreRank.svelte';

	export let songScore = null;
	export let idx = 0;
	export let service = null;

	$: score = opt(songScore, 'score', null);
	$: prevScore = score?.scoreImprovement?.timeset?.length && score?.scoreImprovement?.score ? score.scoreImprovement : null;

	$: scoreBadgesHaveImprovements = [...(Object.values($configStore?.scoreBadges) ?? [])].some(row =>
		row.some(col => !!col?.withImprovements || col?.secondary === 'improvement')
	);
</script>

{#if songScore}
	<div class={`song-score row-${idx}`}>
		<div class="main" class:beat-savior={service === 'beatsavior'} class:accsaber={service === 'accsaber'}>
			<span class="rank">
				{#if service !== 'beatsavior'}
					<ScoreRank rank={score.rank} />
				{/if}

				<div class="timeset">
					<FormattedDate date={score.timeSet} prevPrefix="vs " prevDate={scoreBadgesHaveImprovements ? prevScore?.timeSet ?? null : null} />
				</div>
			</span>
			<div class="score">
				{#if songScore.score.pp}
					<span style="color: var(--ppColour)">{songScore.score.pp.toFixed(2)}pp</span>
				{:else}
					<span style="color: var(--ppColour)">{songScore.score.acc.toFixed(2)}%</span>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.score-in-list {
		border-bottom: 1px solid var(--row-separator);
		padding: 0.5em 0;
	}

	.song-score .main {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: space-between;
		grid-column-gap: 0.4em;
		padding: 0.3em;
	}

	.song-score.with-details .main {
		border-bottom: none;
	}

	.song-score .main > *:last-child {
		margin-right: 0;
	}

	.song-score .main :global(.badge) {
		margin: 0 !important;
		padding: 0.125em 0.25em !important;
		width: 100%;
	}

	.song-score .main :global(.badge small) {
		font-size: 0.7em;
		font-weight: normal;
		margin-top: -2px;
	}

	.song-score .main :global(.inc),
	.song-score :global(.dec) {
		color: inherit;
	}

	.rank {
		width: 5.5em;
		text-align: center;
		display: flex;
		align-items: center;
	}

	.song {
		flex-grow: 1;
		min-width: 15.25em;
	}

	.song > div {
		display: flex;
		flex-direction: column;
	}

	.timeset {
		width: 8.5em;
		text-align: center;
	}

	.timeset.mobile-only {
		align-items: baseline;
		gap: 0.5em;
		min-width: fit-content;
	}

	.player {
		text-align: left;
		padding-bottom: 0.5rem;
	}

	.main.beat-savior .timeset {
		width: auto;
	}

	.timeset :global(small) {
		line-height: 1;
	}

	.rank .timeset {
		width: auto;
		min-width: 7em;
		font-size: 0.8em;
	}

	.with-badge :global(.badge) {
		height: 100%;
	}

	small {
		display: block;
		text-align: center;
		white-space: nowrap;
		font-size: 0.75em;
	}

	.score-options-section {
		display: grid;
		justify-items: center;
		margin: 0.3em;
	}

	.beat-savior-reveal {
		align-self: end;
		cursor: pointer;
		transition: transform 500ms;
		transform-origin: 0.42em 0.8em;
	}

	.beat-savior-reveal.opened {
		transform: rotateZ(180deg);
	}

	h3 {
		width: fit-content;
		border-bottom-left-radius: 0.5em;
		border-bottom-right-radius: 0.5em;
		background: var(--row-separator);
		padding: 0 1em 0;
		margin-right: 0.5em;
	}

	h3.editable {
		cursor: pointer;
	}

	h3 .move i {
		padding: 0.25em 0.125em;
		cursor: pointer !important;
	}

	h3 i.fa-edit {
		display: inline-block;
		margin-left: 0.5em;
		cursor: pointer !important;
	}

	.icons h3 {
		border-radius: 5px;
	}

	@media screen and (max-width: 1023px) {
		.icons {
			display: flex;
			align-items: center;
			margin-bottom: 0.5em;
		}
		.up-to-tablet {
			display: flex;
		}
	}

	@media screen and (max-width: 767px) {
		.song-score {
			padding: 0.75em 0;
		}

		.song-score .main {
			flex-wrap: wrap;
		}

		.rank,
		.timeset {
			padding-bottom: 0 !important;
		}

		.song {
			display: flex;
			justify-content: flex-start;
			align-items: center;
			width: 100%;
			margin-right: 0;
			padding-top: 1em;
			padding-bottom: 0.75em;
		}

		.up-to-tablet {
			margin-bottom: 0.5em;
		}

		.player {
			text-align: center;
		}
	}
</style>
