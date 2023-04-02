<script>
	import {fly, fade} from 'svelte/transition';
	import stringify from 'json-stable-stringify';
	import {configStore, DEFAULT_CONFIG, DEFAULT_LOCALE, getSupportedLocales} from '../../stores/config';
	import createAccountStore from '../../stores/beatleader/account';
	import {availableMetrics, getDefaultMetricWithOptions} from '../../utils/beatleader/performance-badge';
	import {deepClone} from '../../utils/js';
	import Switch from '../Common/Switch.svelte';
	import DemoScores from './DemoScores.svelte';
	import Select from './Select.svelte';

	export let animationSign = 1;

	const DEFAULT_ACC_CHART = 1;
	const DEFAULT_SCORE_COMPARISON_METHOD = 'in-place';
	const DEFAULT_ONECLICK_VALUE = 'modassistant';

	const scoreComparisonMethods = [
		{name: 'In place', value: DEFAULT_SCORE_COMPARISON_METHOD},
		{name: 'In details', value: 'in-details'},
	];

	const badgeLayouts = [
		{name: 'One row layout', value: 1},
		{name: 'Two rows layout', value: 2},
		{name: 'Three rows layout', value: 3},
	];

	const accCharts = [
		{name: 'Map acc', value: 0},
		{name: 'Underswings', value: 1},
	];

	const oneclickOptions = [
		{name: 'Mod Assistant', value: DEFAULT_ONECLICK_VALUE},
		{name: 'Playlist sync', value: 'playlist'},
	];

	let currentLocale = DEFAULT_LOCALE;
	let currentScoreBadges = null;
	let currentScoreBadgeSelected = null;
	let currentScoreMetric = null;
	let currentBadgeLayout = badgeLayouts[0].value;
	let currentAccChartIndex = DEFAULT_ACC_CHART;
	let currentScoreComparisonMethod = DEFAULT_SCORE_COMPARISON_METHOD;
	let currentOneclick = DEFAULT_ONECLICK_VALUE;

	const scoreDetailsKeyDescription = {
		showMapInfo: 'Map info',
		showScoreMetrics: 'Score metrics',
		showHandsAcc: 'Hands acc',
		showAccChart: 'Acc chart',
		showSliceDetails: 'Slice details',
		showAccSpreadChart: 'Acc spread chart',
		showLeaderboard: 'Map leaderboard',
	};

	const account = createAccountStore();

	function onConfigUpdated(config) {
		if (config?.locale != currentLocale) currentLocale = config.locale;
		if (config?.scoreDetailsPreferences?.defaultAccChartIndex != currentAccChartIndex)
			currentAccChartIndex = config?.scoreDetailsPreferences?.defaultAccChartIndex ?? DEFAULT_ACC_CHART;
		if (config?.scoreComparison != currentScoreComparisonMethod)
			currentScoreComparisonMethod = config?.scoreComparison?.method ?? DEFAULT_SCORE_COMPARISON_METHOD;
		if (config?.preferences?.oneclick != currentOneclick) currentOneclick = config?.preferences?.oneclick ?? DEFAULT_ONECLICK_VALUE;
		if (stringify(config?.scoreBadges) !== stringify(currentScoreBadges)) {
			currentScoreBadges = deepClone(Object.values(config?.scoreBadges) ?? DEFAULT_CONFIG.scoreBadges);
			currentScoreBadgeSelected = null;
			currentScoreMetric = null;
		}
		if (config?.scorePreferences?.badgeRows !== currentBadgeLayout)
			currentBadgeLayout = badgeLayouts.find(b => b.value === config?.scorePreferences?.badgeRows ?? 2)?.value ?? badgeLayouts[0].value;
	}

	async function settempsetting(key, subkey, value) {
		if (subkey) {
			var preferences = configStore.get(key);
			preferences[subkey] = value;
			await configStore.setForKey(key, preferences, false);
		} else {
			await configStore.setForKey(key, value, false);
		}
	}

	function onBadgeClick(e) {
		if (!Number.isFinite(e?.detail?.row) || !Number.isFinite(e?.detail?.col)) return;

		currentScoreBadgeSelected = e.detail;
		if (!currentScoreBadges?.[e.detail.row]?.[e.detail.col]) {
			currentScoreBadges[e.detail.row][e.detail.col] = {metric: '__not-set'};
		}
		currentScoreMetric = currentScoreBadges?.[e.detail.row]?.[e.detail.col];
	}

	function updateSelectedBadge(newValue) {
		if (!Number.isFinite(currentScoreBadgeSelected?.row) || !Number.isFinite(currentScoreBadgeSelected?.col)) return;

		currentScoreBadges[currentScoreBadgeSelected.row][currentScoreBadgeSelected.col] = newValue;
		currentScoreMetric = currentScoreBadges[currentScoreBadgeSelected.row][currentScoreBadgeSelected.col];
	}

	function onMetricChanged() {
		updateSelectedBadge(getDefaultMetricWithOptions(currentScoreMetric.metric));
	}

	function onMetricOptionChanged() {
		const metric = availableMetrics.find(m => m.metric === currentScoreMetric?.metric);
		if (!metric) return;

		const options = (metric?.options ?? []).reduce(
			(acc, o) => ({...acc, [o.name]: currentScoreMetric?.[o.name] ?? metric?.default?.[o.name] ?? null}),
			{}
		);
		updateSelectedBadge({metric: currentScoreMetric.metric, ...options});
	}

	$: onConfigUpdated(configStore && $configStore ? $configStore : null);

	$: settempsetting('locale', null, currentLocale);
	$: settempsetting('scoreDetailsPreferences', 'defaultAccChartIndex', currentAccChartIndex);
	$: settempsetting('scoreComparison', 'method', currentScoreComparisonMethod);
	$: settempsetting('preferences', 'oneclick', currentOneclick);
	$: settempsetting('scorePreferences', 'badgeRows', currentBadgeLayout);
	$: settempsetting('scoreBadges', null, currentScoreBadges);

	$: scoreDetailsPreferences = $configStore.scoreDetailsPreferences ?? {};
	$: visibleScoreIcons = $configStore.visibleScoreIcons;

	$: scoreIcons = Object.keys(visibleScoreIcons).filter(key => key !== 'delete');

	$: currentScoreMetricOptions = availableMetrics.find(m => m.metric === currentScoreMetric?.metric)?.options ?? null;
</script>

<div class="main-container" in:fly={{y: animationSign * 200, duration: 400}} out:fade={{duration: 100}}>
	<DemoScores playerId={$account?.player?.playerId} selectedMetric={currentScoreBadgeSelected} on:badge-click={onBadgeClick} />

	<div class="options">
		<section class="option full">
			<label title="Determines which metrics are shown at score">Score metrics settings:</label>
			<div class="single">
				<Select bind:value={currentBadgeLayout}>
					{#each badgeLayouts as option (option.value)}
						<option value={option.value}>{option.name}</option>
					{/each}
				</Select>
			</div>
		</section>

		{#if currentScoreMetric}
			<section class="option">
				<label>Metric</label>

				<Select bind:value={currentScoreMetric.metric} on:change={onMetricChanged}>
					{#each availableMetrics as option (option.metric)}
						<option value={option.metric}>{option.name}</option>
					{/each}
				</Select>
			</section>

			{#if currentScoreMetricOptions?.length}
				{#each currentScoreMetricOptions as option}
					<section class="option">
						<label>{option?.label ?? option?.name}</label>
						<Select bind:value={currentScoreMetric[option.name]} on:change={onMetricOptionChanged}>
							{#each option.values as option (option.value)}
								<option value={option.value}>{option.name}</option>
							{/each}
						</Select>
					</section>
				{/each}
			{/if}
		{:else}
			<section class="option">
				<label>Metric</label>
				<div>Click first on the score metric badge you want to set.</div>
			</section>
		{/if}

		<section class="option full">
			<label title="Determines which buttons should be displayed at score">Buttons to show:</label>
			<div class="switches">
				{#each scoreIcons as key}
					<Switch
						value={visibleScoreIcons[key]}
						label={key}
						fontSize={12}
						design="slider"
						on:click={() => settempsetting('visibleScoreIcons', key, !visibleScoreIcons[key])} />
				{/each}
			</div>
		</section>

		<section class="option full">
			<label title="Determines which data should be displayed in score details">Score details settings:</label>
			<div class="switches">
				{#each Object.keys(scoreDetailsPreferences).filter(k => !['defaultAccChartIndex'].includes(k)) as key}
					<Switch
						value={scoreDetailsPreferences[key]}
						label={scoreDetailsKeyDescription[key]}
						fontSize={12}
						design="slider"
						on:click={() => settempsetting('scoreDetailsPreferences', key, !scoreDetailsPreferences[key])} />
				{/each}
			</div>
		</section>

		<section class="option">
			<label title="Determines which acc chart displays by default.">Default acc chart in details</label>
			<Select bind:value={currentAccChartIndex}>
				{#each accCharts as option (option.value)}
					<option value={option.value}>{option.name}</option>
				{/each}
			</Select>
		</section>

		<section class="option">
			<label
				title="Comparison of a current player's score against the main player will be displayed either immediately or after expanding the details"
				>Score comparison</label>
			<Select bind:value={currentScoreComparisonMethod}>
				{#each scoreComparisonMethods as option (option.value)}
					<option value={option.value}>{option.name}</option>
				{/each}
			</Select>
		</section>

		<section class="option">
			<label title="All numbers and dates will be formatted according to the rules of the selected locale">Locale</label>
			<Select bind:value={currentLocale}>
				{#each getSupportedLocales() as option (option.id)}
					<option value={option.id}>{option.name}</option>
				{/each}
			</Select>
		</section>

		<section class="option">
			<label title="How One-Click button will work">One-click installs</label>
			<Select bind:value={currentOneclick}>
				{#each oneclickOptions as option (option.value)}
					<option value={option.value}>{option.name}</option>
				{/each}
			</Select>
		</section>
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
	}

	.options {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-gap: 1em;
		align-items: start;
		justify-items: start;
		margin-top: 1rem;
	}

	.option {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.option.full {
		grid-column: span 2;
	}

	label {
		display: block;
		font-size: 0.75em;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #afafaf !important;
		margin-bottom: 0.25em;
	}

	.switches {
		display: flex;
		grid-gap: 1em;
		flex-wrap: wrap;
		justify-content: space-evenly;
		padding: 0.5em;
	}

	.switches.start {
		justify-content: flex-start;
	}

	.single {
		width: calc(50% - 1rem);
	}

	@media screen and (max-width: 600px) {
		.options {
			grid-template-columns: 1fr;
		}
	}
</style>
