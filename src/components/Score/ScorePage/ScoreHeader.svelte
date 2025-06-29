<script>
	import ReplayButton from '../ReplayButton.svelte';
	import Value from '../../Common/Value.svelte';
	import FormattedDate from '../../Common/FormattedDate.svelte';
	import PlayerName from '../../Scores/PlayerName.svelte';
	import {badgesDef} from '../../../utils/beatleader/format';

	export let score;

	const ranks = [
		{label: 'SS', threshold: 0.95},
		{label: 'S', threshold: 0.9},
		{label: 'A', threshold: 0.8},
		{label: 'B', threshold: 0.65},
		{label: 'C', threshold: 0.5},
		{label: 'D', threshold: 0},
	];

	function getRank(acc) {
		return badgesDef.find(b => (!b.max || acc <= b.max) && (!b.min || acc > b.min));
	}

	$: acc = score?.score?.acc;
	$: rank = getRank(acc);
	$: pp = score?.score?.pp;

	const getConicGradient = accuracy => {
		const rank = getRank(accuracy);
		const startColor = rank.color;
		const endColor = `color-mix(in srgb, ${rank.color} 70%, #000)`;

		const percentage = ((accuracy - rank.threshold) / (rank.next_threshold - rank.threshold)) * 100;
		return `background: conic-gradient(${endColor} ${percentage}%, ${startColor} ${percentage}%, ${startColor} 100%);`;
	};
</script>

{#if score}
	<div class="score-header-container">
		<div class="left-section">
			<div class="rank-grades">
				{#each ranks as r}
					<div
						class="grade"
						class:active={r.label === rank.name}
						style="background-color: {r.label === rank.name ? rank.color : 'var(--background-secondary)'};">
						{r.label}
					</div>
				{/each}
			</div>
			<div class="rank-circle" style={getConicGradient(acc)}>
				<div class="inner-circle">
					<span class="rank-letter">{rank.name}</span>
				</div>
			</div>
		</div>

		<div class="center-section">
			<div class="modifiers">
				{#if score?.score?.modifiers}
					{#each score.score.modifiers.split(',') as modifier}
						<div class="modifier-badge">{modifier}</div>
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
				<span>Submitted on</span>
				<FormattedDate date={score?.score?.timeSet} />
			</div>
			<div class="global-rank">
				<span>GLOBAL RANK</span>
				<span class="rank-value">#{score?.score?.rank}</span>
			</div>
		</div>

		<div class="right-section">
			<ReplayButton score={score?.score} />
		</div>
	</div>
{/if}

<style>
	.score-header-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: relative;
		overflow: hidden;
		color: white;
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
	.center-section {
		flex-direction: column;
		flex-grow: 1;
		text-align: center;
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
	}

	.inner-circle {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background-color: var(--background-secondary-alpha);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.rank-letter {
		font-size: 4em;
		font-weight: bold;
		color: white;
		text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
	}

	.modifiers {
		display: flex;
		gap: 0.5em;
	}

	.modifier-badge {
		background-color: rgba(255, 255, 255, 0.2);
		padding: 0.3em 0.8em;
		border-radius: 6px;
		font-size: 0.9em;
	}

	.main-value {
		font-size: 4em;
		font-weight: 300;
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
</style>
