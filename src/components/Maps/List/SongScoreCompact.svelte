<script>
	import {dateFromUnix} from '../../../utils/date';
	import ScoreRank from '../../Player/ScoreRank.svelte';
	import FormattedDate from '../../Common/FormattedDate.svelte';
	import {badgesDef} from '../../../utils/beatleader/format';

	export let score = null;
	export let shortdate = true;

	export let showDetails = false;
</script>

{#if score}
	<div
		class="song-score"
		style="background-color: {badgesDef.find(b => (!b.max || score.accuracy * 100 <= b.max) && (!b.min || score.accuracy * 100 > b.min))
			.color};">
		<div class="main">
			<span class="rank">
				#{score.rank}
			</span>

			<div class="timeset">
				<FormattedDate date={dateFromUnix(score.timepost)} externalDateFormat={shortdate ? 'relativeshort' : null} />
			</div>
			<div class="score">
				{#if score.pp}
					<span>{score.pp.toFixed(2)}pp</span>
				{:else}
					<span>{(score.accuracy * 100).toFixed(2)}%</span>
				{/if}
			</div>
			{#if score.fullCombo}
				<span style="color: yellow">FC</span>
			{/if}
			{#if showDetails}
				<span style="color: white">{(score.accuracy * 100).toFixed(2)}%</span>

				{#if score.modifiers?.length}
					<span style="color: white">{score.modifiers}</span>
				{/if}
			{/if}
		</div>
	</div>
{/if}

<style>
	.score-in-list {
		border-bottom: 1px solid var(--row-separator);
		padding: 0.5em 0;
	}

	.song-score {
		border-radius: 0.8em;
		padding: 0 0.2em;
		font-size: 0.9em;
	}
	.song-score .main {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: space-between;
		grid-column-gap: 0.4em;
		padding: 0 0.3em 0.1em 0.3em;
	}

	.score {
		font-weight: 600;
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
		min-width: 9em;
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
