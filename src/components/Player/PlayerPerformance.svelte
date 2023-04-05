<script>
	import {getContext} from 'svelte';
	import {configStore} from '../../stores/config';
	import {getPerformanceBadge} from '../../utils/beatleader/performance-badge';
	import {deepClone, opt} from '../../utils/js';
	import FormattedDate from '../Common/FormattedDate.svelte';
	import ScoreBadges from '../Common/PerformanceBadge/ScoreBadges.svelte';

	const isDemo = getContext('isDemo') ?? false;

	export let service = null;
	export let songScore = null;
	export let showDetails = false;
	export let modifiers = null;
	export let additionalStat = null;
	export let selectedMetric = null;

	const ACC_SABER_BADGES = [[{metric: 'ap'}, {metric: 'acc', withImprovements: true}, {metric: 'score', withImprovements: true}]];
	const BEAT_SAVIOR_BADGES = [
		[{metric: 'pp'}, {metric: 'acc', withImprovements: true}, {metric: 'score', withImprovements: true}],
		[
			{metric: 'accLeft', withImprovements: true},
			{metric: 'accRight', withImprovements: true},
			{metric: 'mistakes', withImprovements: true},
		],
	];

	let badges = null;

	function getBeatSaviorCompatibleStats(score) {
		if (!score?.missedNotes === undefined) return null;

		return {
			stats: {
				accLeft: score?.accLeft ?? null,
				accRight: score?.accRight ?? null,
				badCuts: score?.badCuts ?? null,
				bombHit: score?.bombCuts ?? null,
				fullCombo: !!score?.fullCombo,
				missedNotes: score?.missedNotes ?? null,
				wallHit: score?.wallsHit ?? null,
				miss: score?.badCuts !== undefined || score?.missedNotes !== undefined ? (score?.badCuts ?? 0) + (score?.missedNotes ?? 0) : null,
			},
		};
	}

	function getBadges(service, config, rows, score, improvements, beatSavior, additionalStat) {
		if (!service?.length || !Array.isArray(config) || !config?.length) return;

		if (!rows) rows = 2;

		switch (service) {
			case 'beatsavior':
				config = BEAT_SAVIOR_BADGES;
				rows = 2;
				break;

			case 'accsaber':
				config = ACC_SABER_BADGES;
				rows = 1;
				break;

			default:
				config = deepClone(config);
		}

		if (
			additionalStat &&
			['pauses', 'maxStreak'].includes(additionalStat) &&
			service === 'beatleader' &&
			rows >= 2 &&
			!config.some(row => row.some(col => col?.metric === additionalStat))
		) {
			config[config.length - 1][0] = {metric: additionalStat};
			rows = config.length;
		}

		return config
			.map(row => row.map(col => getPerformanceBadge(col, score, improvements, beatSavior, modifiers, isDemo)))
			.filter(row => row.some(col => col?.component))
			.slice(0, rows);
	}

	$: leaderboard = songScore?.leaderboard ?? null;
	$: score = songScore?.score ?? null;

	$: improvements = score?.scoreImprovement;

	$: beatSavior = songScore?.beatSavior ?? getBeatSaviorCompatibleStats(score);

	$: badgesDefinition = [...(Object.values($configStore?.scoreBadges) ?? [])];

	$: badges = getBadges(
		service,
		badgesDefinition,
		$configStore?.scorePreferences?.badgeRows ?? 2,
		score,
		improvements,
		beatSavior,
		additionalStat,
		modifiers
	);

	$: myScoreBadges = getBadges(
		service,
		badgesDefinition,
		1,
		score?.myScore?.score,
		null,
		getBeatSaviorCompatibleStats(score?.myScore?.score),
		additionalStat,
		modifiers
	);
</script>

<div class="player-performance">
	<ScoreBadges {badges} selected={selectedMetric} on:badge-click />

	{#if (showDetails || (configStore && opt($configStore, 'scoreComparison.method') === 'in-place')) && score?.myScore && myScoreBadges}
		<span class="compare-player-name">
			<span>
				vs me (<FormattedDate date={score?.myScore?.score?.timeSet} />)
			</span>
		</span>

		<ScoreBadges badges={myScoreBadges} additionalClass="compare" />
	{/if}
</div>

<style>
	.compare-player-name {
		display: block;
		color: var(--faded);
		text-align: center;
		font-size: 0.875em;
		border-bottom: 1px solid var(--faded);
		margin-bottom: 0.9em;
		line-height: 1;
	}

	.compare-player-name > span {
		display: inline-block;
		position: relative;
		top: 0.5em;
		background-color: var(--foreground);
		padding: 0 0.5em;
	}
</style>
