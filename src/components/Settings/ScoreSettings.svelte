<script>
	import {setContext} from 'svelte';
	import {fly, fade} from 'svelte/transition';
	import {writable} from 'svelte/store';
	import stringify from 'json-stable-stringify';
	import {configStore, DEFAULT_CONFIG, DEFAULT_LOCALE, getSupportedLocales} from '../../stores/config';
	import createAccountStore from '../../stores/beatleader/account';
	import {deepClone} from '../../utils/js';
	import Switch from '../Common/Switch.svelte';
	import DemoProfileScore from './DemoProfileScore.svelte';
	import Select from './Select.svelte';
	import BadgeEdit from './BadgeEdit.svelte';

	export let animationSign = 1;

	const isDemo = writable(true);
	setContext('isDemo', isDemo);

	const DEFAULT_ACC_CHART = 1;
	const DEFAULT_SCORE_COMPARISON_METHOD = 'in-place';
	const DEFAULT_ONECLICK_VALUE = 'modassistant';

	const scoreComparisonMethods = [
		{name: 'No comparison', value: 'none'},
		{name: 'In place', value: DEFAULT_SCORE_COMPARISON_METHOD},
		{name: 'In details', value: 'in-details'},
	];

	const configPresets = [
		{
			key: 'basic',
			name: 'Basic',
			customizable: false,
			settings: {
				scoreComparison: {
					method: 'none',
					badgeRows: 1,
				},
				scorePreferences: {
					badgeRows: 1,
				},
				scoreBadges: [
					[
						{metric: 'pp', secondary: 'weighted'},
						{metric: 'acc', secondary: 'improvement', withMods: true},
						{metric: 'score', withImprovements: true},
					],
					[null, null, null],
					[null, null, null],
				],
				scoreDetailsPreferences: {
					showMapInfo: false,
					showScoreMetrics: false,
					showHandsAcc: false,
					showAccChart: false,
					showSliceDetails: false,
					showAccSpreadChart: false,
					showLeaderboard: true,
					defaultAccChartIndex: 0,
				},
				visibleScoreIcons: {
					pin: false,
					playlist: false,
					bsr: false,
					bs: false,
					oneclick: false,
					preview: false,
					replay: true,
					delete: true,
				},
			},
		},
		{
			key: 'default',
			name: 'Default',
			customizable: false,
			settings: {
				scoreComparison: deepClone(DEFAULT_CONFIG.scoreComparison),
				scorePreferences: deepClone(DEFAULT_CONFIG.scorePreferences),
				scoreBadges: deepClone(DEFAULT_CONFIG.scoreBadges),
				scoreDetailsPreferences: deepClone(DEFAULT_CONFIG.scoreDetailsPreferences),
				visibleScoreIcons: deepClone(DEFAULT_CONFIG.visibleScoreIcons),
			},
		},
		{
			key: 'advanced',
			name: 'Advanced',
			customizable: false,
			settings: {
				scoreComparison: {
					method: 'in-place',
					badgeRows: 2,
				},
				scorePreferences: {
					badgeRows: 3,
				},
				scoreBadges: [
					[
						{metric: 'pp', secondary: 'weighted'},
						{metric: 'acc', secondary: 'improvement', withMods: true},
						{metric: 'score', withImprovements: true},
					],
					[
						{metric: 'accLeft', withImprovements: true},
						{metric: 'accRight', withImprovements: true},
						{metric: 'mistakes', withImprovements: true},
					],
					[{metric: 'replaysWatched'}, {metric: 'pauses', alternatives: [{metric: 'maxStreak'}]}, {metric: 'fcAccuracy'}],
				],
				scoreDetailsPreferences: {
					showMapInfo: true,
					showScoreMetrics: true,
					showHandsAcc: true,
					showAccChart: true,
					showSliceDetails: true,
					showAccSpreadChart: true,
					showLeaderboard: true,
					defaultAccChartIndex: 1,
				},
				visibleScoreIcons: {
					pin: true,
					playlist: true,
					bsr: true,
					bs: true,
					oneclick: true,
					preview: true,
					replay: true,
					delete: true,
				},
			},
		},
		{
			key: 'custom',
			name: 'Custom',
			customizable: true,
			settings: {
				scoreComparison: deepClone($configStore?.scoreComparison ?? DEFAULT_CONFIG.scoreComparison),
				scorePreferences: deepClone($configStore?.scorePreferences ?? DEFAULT_CONFIG.scorePreferences.badgeRows),
				scoreBadges: deepClone(Object.values($configStore?.scoreBadges ?? DEFAULT_CONFIG.scoreBadges)),
				scoreDetailsPreferences: deepClone($configStore?.scoreDetailsPreferences ?? DEFAULT_CONFIG.scoreDetailsPreferences),
				visibleScoreIcons: deepClone($configStore?.visibleScoreIcons ?? DEFAULT_CONFIG.visibleScoreIcons),
			},
		},
	];

	const currentBadgesConfig = {
		scoreComparison: deepClone($configStore?.scoreComparison ?? DEFAULT_CONFIG.scoreComparison),
		scorePreferences: deepClone($configStore?.scorePreferences ?? DEFAULT_CONFIG.scorePreferences),
		scoreBadges: deepClone(Object.values($configStore?.scoreBadges ?? DEFAULT_CONFIG.scoreBadges)),
		scoreDetailsPreferences: deepClone($configStore?.scoreDetailsPreferences ?? DEFAULT_CONFIG.scoreDetailsPreferences),
		visibleScoreIcons: deepClone($configStore?.visibleScoreIcons ?? DEFAULT_CONFIG.visibleScoreIcons),
	};

	const stringifiedBadgesConfig = stringify(currentBadgesConfig);
	let currentBadgePreset = configPresets.find(p => stringifiedBadgesConfig === stringify(p.settings)) ?? configPresets[2];

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
	let currentComparisonBadgeLayout = badgeLayouts[0].value;
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

		if (config?.scoreComparison?.badgeRows !== currentComparisonBadgeLayout)
			currentComparisonBadgeLayout =
				badgeLayouts.find(b => b.value === config?.scoreComparison?.badgeRows ?? 1)?.value ?? badgeLayouts[0].value;
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
		if (!$isDemo || !Number.isFinite(e?.detail?.row) || !Number.isFinite(e?.detail?.col)) return;

		currentScoreBadgeSelected = e.detail;
		if (!currentScoreBadges?.[e.detail.row]?.[e.detail.col]) {
			currentScoreBadges[e.detail.row][e.detail.col] = {metric: '__not-set'};
		}
		currentScoreMetric = currentScoreBadges?.[e.detail.row]?.[e.detail.col];
	}

	function updateSelectedBadge(e) {
		if (!e?.detail || !Number.isFinite(currentScoreBadgeSelected?.row) || !Number.isFinite(currentScoreBadgeSelected?.col)) return;

		currentScoreBadges[currentScoreBadgeSelected.row][currentScoreBadgeSelected.col] = e.detail;
		currentScoreMetric = currentScoreBadges[currentScoreBadgeSelected.row][currentScoreBadgeSelected.col];
	}

	function onBadgePresetChange(preset) {
		settempsetting('scoreComparison', null, deepClone(preset.settings.scoreComparison));
		settempsetting('scorePreferences', 'badgeRows', deepClone(preset.settings.scorePreferences.badgeRows));
		settempsetting('scoreBadges', null, deepClone(preset.settings.scoreBadges));
		settempsetting('scoreDetailsPreferences', null, deepClone(preset.settings.scoreDetailsPreferences));
		settempsetting('visibleScoreIcons', null, deepClone(preset.settings.visibleScoreIcons));
		$isDemo = preset.customizable;

		currentScoreBadgeSelected = null;
		currentScoreMetric = null;
		currentBadgeLayout = preset.settings.scorePreferences.badgeRows;
		currentComparisonBadgeLayout = preset.settings.scoreComparison.badgeRows;
		currentScoreComparisonMethod = preset.settings.scoreComparison.method;
	}

	$: onConfigUpdated(configStore && $configStore ? $configStore : null);
	$: onBadgePresetChange(currentBadgePreset);

	$: settempsetting('locale', null, currentLocale);
	$: settempsetting('scoreDetailsPreferences', 'defaultAccChartIndex', currentAccChartIndex);
	$: settempsetting('scoreComparison', 'method', currentScoreComparisonMethod);
	$: settempsetting('preferences', 'oneclick', currentOneclick);
	$: settempsetting('scorePreferences', 'badgeRows', currentBadgeLayout);
	$: settempsetting('scoreComparison', 'badgeRows', currentComparisonBadgeLayout);
	$: settempsetting('scoreBadges', null, currentScoreBadges);

	$: scoreDetailsPreferences = $configStore.scoreDetailsPreferences ?? {};
	$: visibleScoreIcons = $configStore.visibleScoreIcons;

	$: scoreIcons = Object.keys(visibleScoreIcons).filter(key => key !== 'delete');
</script>

<div class="main-container" in:fly={{y: animationSign * 200, duration: 400}} out:fade={{duration: 100}}>
	<DemoProfileScore playerId={$account?.player?.playerId} selectedMetric={currentScoreBadgeSelected} on:badge-click={onBadgeClick} />
	<div class="options">
		<section class="option full">
			<label title="Determines which metrics are shown at score">Preset:</label>
			<div class="single">
				<Select bind:value={currentBadgePreset} options={configPresets} valueSelector={x => x} />
			</div>
		</section>
		{#if currentBadgePreset?.key === 'custom'}
			<section class="option">
				<label title="Determines which metrics are shown at score">Score metrics settings:</label>
				<Select bind:value={currentBadgeLayout} options={badgeLayouts} />
			</section>
			<section class="option">
				<label title="Determines which metrics are shown when comparing scores">Score comparison settings:</label>
				<Select bind:value={currentComparisonBadgeLayout} options={badgeLayouts} />
			</section>
			{#if currentScoreMetric}
				<BadgeEdit badge={currentScoreMetric} on:change={updateSelectedBadge} />
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
				<Select bind:value={currentAccChartIndex} options={accCharts} />
			</section>
			<section class="option">
				<label
					title="Comparison of a current player's score against the main player will be displayed either immediately or after expanding the details"
					>Score comparison</label>
				<Select bind:value={currentScoreComparisonMethod} options={scoreComparisonMethods} />
			</section>
		{/if}
		<section class="option">
			<label title="All numbers and dates will be formatted according to the rules of the selected locale">Locale</label>
			<Select bind:value={currentLocale} options={getSupportedLocales()} valueSelector={x => x.id} />
		</section>
		<section class="option">
			<label title="How One-Click button will work">One-click installs</label>
			<Select bind:value={currentOneclick} options={oneclickOptions} />
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
	* :global(.option) {
		display: flex;
		flex-direction: column;
		width: 100%;
	}
	* :global(.option.full) {
		grid-column: span 2;
	}
	* :global(label) {
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
