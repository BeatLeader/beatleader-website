<script>
	import ReplayButton from '../ReplayButton.svelte';
	import Value from '../../Common/Value.svelte';
	import FormattedDate from '../../Common/FormattedDate.svelte';
	import PlayerName from '../../Scores/PlayerName.svelte';
	import {badgesDef, ModifiersList} from '../../../utils/beatleader/format';
	import Icons from '../../Song/Icons.svelte';
	import ScoreExternalStatuses from './ScoreExternalStatuses.svelte';
	import Button from '../../Common/Button.svelte';
	import ScoreNomination from './ScoreNomination.svelte';
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';
	import {getContext} from 'svelte';

	const {open, close} = getContext('simple-modal');

	export let score;

	function getRank(acc) {
		return badgesDef.find(b => (!b.max || acc <= b.max) && (!b.min || acc > b.min));
	}
	let nominationStatus = null;
	let nominationError = null;

	function fetchNominationStatus(score) {
		fetch(`${BL_API_URL}score/nominations/${score.score.id}`, {credentials: 'include'}).then(async d => {
			if (d.status == 200) {
				nominationStatus = parseInt(await d.text());
			}
		});
	}

	function postVote(value) {
		nominationError = null;
		fetch(`${BL_API_URL}score/nominate/${score.score.id}/?description=${encodeURIComponent(value)}`, {
			credentials: 'include',
			method: 'POST',
		}).then(async d => {
			if (d.status == 200) {
				fetchNominationStatus(score);
			} else {
				nominationError = await d.text();
			}
		});
	}

	function openNomination() {
		open(ScoreNomination, {
			confirm: value => {
				close();
				postVote(value);
			},
			cancel: () => {
				close();
			},
		});
	}

	$: acc = score?.score?.acc;
	$: rank = getRank(acc);
	$: pp = score?.score?.pp;

	$: score?.score && fetchNominationStatus(score);

	const getConicGradient = accuracy => {
		// Create gradient stops through all badge colors
		const stops = badgesDef
			.slice()
			.reverse() // Reverse so SS+ is at the end
			.map((badge, i) => {
				const threshold = badge.min ?? 0;
				const position = ((threshold - 0) / 100) * 100;
				return `${badge.color} ${position}%`;
			})
			.join(', ');

		// Calculate position for accuracy marker
		const percentage = accuracy;

		return `background: conic-gradient(from 0deg, ${stops}, ${badgesDef[0].color} 100%);
				mask: conic-gradient(from 0deg, black ${percentage}%, transparent ${percentage}%);
				-webkit-mask: conic-gradient(from 0deg, black ${percentage}%, transparent ${percentage}%);`;
	};
</script>

{#if score}
	<div class="score-header-container">
		<div class="left-section">
			<div class="rank-grades">
				{#each badgesDef as r}
					<div
						class="grade"
						class:active={r.name === rank.name}
						style="background-color: {r.name === rank.name ? rank.color : 'var(--background-secondary)'};">
						{r.name}
					</div>
				{/each}
			</div>
			<div class="rank-circle">
				<div class="circle-background" style={getConicGradient(acc)}></div>
				<div class="inner-circle">
					<span class="rank-letter">{rank.name}</span>
					<Value value={acc} digits={2} suffix="%" />
				</div>
			</div>
		</div>

		<div class="center-section">
			<div class="modifiers">
				{#if score?.score?.mods}
					{#each score.score.mods as modifier}
						<img
							class="modifier-badge"
							title={`${ModifiersList.find(m => m.id == modifier).name} modifier`}
							alt={`${ModifiersList.find(m => m.id == modifier).name} image`}
							src={`/assets/${ModifiersList.find(m => m.id == modifier).icon}`} />
					{/each}
				{/if}
			</div>
			<div class="main-value">
				{#if pp > 0}
					<Value value={pp} digits={2} suffix="pp" />
				{:else}
					<Value value={acc} digits={2} suffix="%" />
				{/if}
			</div>
			<div class="submission-info">
				<span>Submitted</span>
				<FormattedDate date={score?.score?.timeSet} />
			</div>
			<div class="global-rank">
				<span>SCORE RANK</span>
				<span class="rank-value">#{score?.score?.rank}</span>
			</div>
		</div>

		<div class="right-section">
			{#if score?.score?.externalStatuses?.length}
				<ScoreExternalStatuses statuses={score?.score?.externalStatuses} />
			{/if}
			{#if nominationStatus}
				<div class="nomination-container">
					{#if nominationError}
						<span class="error-description">{nominationError}</span>
					{:else if nominationStatus == 1}
						<Button
							title="Nominate this for the Score Of The Week"
							label="Nominate"
							iconFa="fas fa-award"
							on:click={() => {
								openNomination();
							}} />
					{:else}
						<span class="nominates-status"
							>You nominated this score for the "Score Of The Week". Check Cube Community Youtube Channel on Wednesday for results.</span>
					{/if}
				</div>
			{/if}
			<div class="replay-icons-container">
				<Icons icons={['replay', 'analyzer', 'altReplay', 'download']} score={score?.score} />
			</div>
		</div>
	</div>
{/if}

<style>
	.score-header-container {
		display: flex;
		align-items: center;
		position: relative;
		overflow: hidden;
		color: white;
		padding: 0.5em;
	}

	.background-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-size: cover;
		background-position: center;
		filter: blur(8px);
		transform: scale(1.1);
		z-index: -2;
	}

	.background-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.6);
		z-index: -1;
	}

	.left-section,
	.center-section,
	.right-section {
		display: flex;
		align-items: center;
		gap: 1.5em;
	}

	.right-section {
		justify-content: end;
	}

	.replay-icons-container {
		width: 2em;
		transform: scale(1.6);
		margin-left: 2em;
	}

	:global(.right-section .buttons-container.flat) {
		flex-direction: column;
	}

	.center-section {
		flex-direction: column;
		flex-grow: 1;

		text-align: right;
		align-items: start;
	}

	.rank-grades {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.grade {
		font-size: 0.9em;
		padding: 0.3em 0.7em;
		border-radius: 6px;
		font-weight: bold;
		opacity: 0.7;
	}
	.grade.active {
		opacity: 1;
	}

	.rank-circle {
		width: 150px;
		height: 150px;
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 10px;
		margin-left: 2em;
		position: relative;
		margin-right: 4em;
	}

	.circle-background {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		z-index: 0;
		pointer-events: none;
		border-radius: 50%;
	}

	.inner-circle {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background-color: var(--background-secondary-alpha);
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		z-index: 1;
	}

	.rank-letter {
		font-size: 4em;
		font-weight: bold;
		color: white;
	}

	.modifiers {
		display: flex;
		gap: 0.5em;
		margin-bottom: -1em;
	}

	.modifier-badge {
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		font-size: 0.9em;
		height: 3em;
	}

	.main-value {
		font-size: 4em;
		font-weight: 600;
		text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
		margin-left: -2px;
	}

	.player-info,
	.submission-info,
	.global-rank {
		display: flex;
		gap: 0.5em;
		align-items: center;
		opacity: 0.8;
	}

	.global-rank {
		background: rgba(0, 0, 0, 0.4);
		padding: 0.4em 1em;
		border-radius: 8px;
		opacity: 1;
		margin-top: 0.5em;
	}

	.rank-value {
		font-weight: bold;
	}

	.nomination-container {
		position: absolute;
		top: 0.5em;
		right: 1em;
	}

	.nominates-status {
		width: 23em;
		display: block;
	}

	@media screen and (max-width: 767px) {
		.score-header-container {
			flex-direction: column;
		}

		:global(.right-section .buttons-container.flat) {
			flex-direction: row;
		}

		.replay-icons-container {
			margin-left: unset;
			width: unset;
			margin-top: 1.5em;
			transform: scale(1.2);
		}

		.center-section {
			text-align: center;
			align-items: center;
			gap: 0.8em;
		}

		.nomination-container {
			position: relative;
			margin-top: 0.5em;
			margin-right: 1em;
			transform: scale(0.8);
		}

		.left-section {
			flex-direction: column;
		}

		.rank-grades {
			flex-direction: row;
		}

		.rank-circle {
			margin-left: unset;
			margin-right: unset;
		}

		.nominates-status {
			width: 12em;
		}
	}
</style>
