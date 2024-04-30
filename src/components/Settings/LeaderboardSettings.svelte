<script>
	import {setContext} from 'svelte';
	import {fly, fade} from 'svelte/transition';
	import {writable} from 'svelte/store';
	import stringify from 'json-stable-stringify';
	import {configStore, DEFAULT_CONFIG} from '../../stores/config';
	import createAccountStore from '../../stores/beatleader/account';
	import createLeaderboardStore from '../../stores/http/http-leaderboard-store';
	import {deepClone, optSet} from '../../utils/js';
	import Switch from '../Common/Switch.svelte';
	import DemoLeaderboardScore from './DemoLeaderboardScore.svelte';
	import Select from './Select.svelte';
	import BadgeEdit from './BadgeEdit.svelte';
	import {isAnySupporter} from '../Player/Overlay/overlay';
	import Spinner from '../Common/Spinner.svelte';
	import ContentBox from '../Common/ContentBox.svelte';
	import LeaderboardHeader from '../Leaderboard/LeaderboardHeader.svelte';

	export let animationSign = 1;

	const isDemo = writable(true);
	setContext('isDemo', isDemo);

	const configPresets = [
		{
			key: 'basic',
			name: 'Basic',
			customizable: false,
			settings: {
				leaderboardPreferences: {
					badges: [
						[null, {metric: 'pp', secondary: 'none'}, {metric: 'acc', secondary: 'mods', withMods: false}],
						[null, null, null],
					],
					badgeRows: 1,
					show: {
						avatar: true,
						country: false,
						clans: false,
						date: true,
						replay: true,
						hmd: false,
					},
				},
			},
		},
		{
			key: 'default',
			name: 'Default',
			customizable: false,
			settings: {
				leaderboardPreferences: deepClone(DEFAULT_CONFIG.leaderboardPreferences),
			},
		},
		{
			key: 'mistakes',
			name: 'Mistakes',
			customizable: false,
			settings: {
				leaderboardPreferences: {
					badges: [
						[
							{metric: 'pp', secondary: 'none'},
							{metric: 'acc', secondary: 'mods', withMods: false},
							{metric: 'mistakes', withImprovements: false},
						],
						[null, null, null],
					],
					badgeRows: 1,
					show: {
						avatar: true,
						country: true,
						clans: true,
						date: true,
						replay: true,
						hmd: false,
					},
				},
			},
		},
		{
			key: 'pauses',
			name: 'Pauses',
			customizable: false,
			settings: {
				leaderboardPreferences: {
					badges: [
						[{metric: 'pp', secondary: 'none'}, {metric: 'acc', secondary: 'mods', withMods: false}, {metric: 'pauses'}],
						[null, null, null],
					],
					badgeRows: 1,
					show: {
						avatar: true,
						country: true,
						clans: true,
						date: true,
						replay: true,
						hmd: false,
					},
				},
			},
		},
		{
			key: 'maxStreak',
			name: 'Max 115 Streak',
			customizable: false,
			settings: {
				leaderboardPreferences: {
					badges: [
						[{metric: 'pp', secondary: 'none'}, {metric: 'acc', secondary: 'mods', withMods: false}, {metric: 'maxStreak'}],
						[null, null, null],
					],
					badgeRows: 1,
					show: {
						avatar: true,
						country: true,
						clans: true,
						date: true,
						replay: true,
						hmd: false,
					},
				},
			},
		},
		{
			key: 'mistakes',
			name: 'Amount of mistakes',
			customizable: false,
			settings: {
				leaderboardPreferences: {
					badges: [
						[{metric: 'pp', secondary: 'none'}, {metric: 'acc', secondary: 'mods', withMods: false}, {metric: 'mistakes'}],
						[null, null, null],
					],
					badgeRows: 1,
					show: {
						avatar: true,
						country: true,
						clans: true,
						date: true,
						replay: true,
						hmd: false,
					},
				},
			},
		},
		{
			key: 'custom',
			name: 'Custom',
			customizable: true,
			settings: {
				leaderboardPreferences: deepClone($configStore?.leaderboardPreferences ?? DEFAULT_CONFIG.leaderboardPreferences),
			},
		},
	];

	const currentLeaderboardConfig = {
		leaderboardPreferences: deepClone($configStore?.leaderboardPreferences ?? DEFAULT_CONFIG.leaderboardPreferences),
	};

	const stringifiedBadgesConfig = stringify(currentLeaderboardConfig);
	let currentBadgePreset = configPresets.find(p => stringifiedBadgesConfig === stringify(p.settings)) ?? configPresets[2];

	const badgeLayouts = [
		{name: 'One row layout', value: 1},
		{name: 'Two rows layout', value: 2},
	];

	let currentScoreBadges = null;
	let currentScoreBadgeSelected = null;
	let currentScoreMetric = null;
	let currentBadgeLayout = badgeLayouts[0].value;

	const scoreDetailsKeyDescription = {
		avatar: 'Avatar',
		country: 'Country flag',
		clans: 'Clans',
		date: 'Date',
		replay: 'Replay',
		hmd: 'Headset',
	};

	const account = createAccountStore();
	const leaderboardStore = createLeaderboardStore('2c7d691', 'global', 1, {});

	function onConfigUpdated(config) {
		if (stringify(config?.leaderboardPreferences?.badges) !== stringify(currentScoreBadges)) {
			currentScoreBadges = deepClone(Object.values(config?.leaderboardPreferences?.badges) ?? DEFAULT_CONFIG.leaderboardPreferences.badges);
			currentScoreBadgeSelected = null;
			currentScoreMetric = null;
		}
		if (config?.leaderboardPreferences?.badgeRows !== currentBadgeLayout)
			currentBadgeLayout =
				badgeLayouts.find(b => b.value === config?.leaderboardPreferences?.badgeRows ?? 1)?.value ?? badgeLayouts[0].value;
	}

	async function settempsetting(key, subkey, value) {
		if (subkey) {
			const preferences = configStore.get(key);
			optSet(preferences, subkey, value);
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
		settempsetting('leaderboardPreferences', null, deepClone(preset.settings.leaderboardPreferences));
		$isDemo = preset.customizable;

		currentScoreBadgeSelected = null;
		currentScoreMetric = null;
		currentBadgeLayout = preset.settings.leaderboardPreferences.badgeRows;
	}

	let isUpdating = false;

	let showBots = false;
	let showAllRatings = false;
	let anySupporter = false;

	async function toggleBots() {
		if (isUpdating) return;

		try {
			isUpdating = true;

			await account.update({showBots: !showBots});
		} finally {
			isUpdating = null;
		}
	}

	async function toggleAllRatings() {
		if (isUpdating) return;

		try {
			isUpdating = true;
			showAllRatings = !showAllRatings;

			await account.update({showAllRatings});
		} finally {
			isUpdating = null;
		}
	}

	function updateProfileSettings(account) {
		if (account?.player?.profileSettings) {
			showBots = account.player.profileSettings.showBots;
			showAllRatings = account.player.profileSettings.showAllRatings;
		}

		anySupporter = isAnySupporter(account?.player?.playerInfo?.role);
	}

	$: leaderboard = $leaderboardStore?.leaderboard;
	$: ratings = {
		passRating: leaderboard?.stats?.passRating,
		accRating: leaderboard?.stats?.accRating,
		techRating: leaderboard?.stats?.techRating,
		stars: leaderboard?.stats?.stars,
	};

	$: onConfigUpdated(configStore && $configStore ? $configStore : null);
	$: onBadgePresetChange(currentBadgePreset);

	$: settempsetting('leaderboardPreferences', 'badgeRows', currentBadgeLayout);
	$: settempsetting('leaderboardPreferences', 'badges', currentScoreBadges);

	$: scoreDetailsPreferences = $configStore?.leaderboardPreferences?.show ?? {};
	$: showSubtitle = $configStore?.leaderboardPreferences?.showSubtitleInHeader ?? false;
	$: showStats = $configStore?.leaderboardPreferences?.showStatsInHeader ?? false;
	$: showHash = $configStore?.leaderboardPreferences?.showHashInHeader ?? false;
	$: showGraph = $configStore?.leaderboardPreferences?.showGraphOption ?? false;

	$: showClanInHeader = $configStore?.leaderboardPreferences?.showClanCaptureInHeader ?? false;
	$: showClanInList = $configStore?.leaderboardPreferences?.showClanCaptureInList ?? false;

	$: updateProfileSettings($account);
</script>

<div class="main-container" in:fly|global={{y: animationSign * 200, duration: 400}} out:fade|global={{duration: 100}}>
	<DemoLeaderboardScore playerId={$account?.player?.playerId} selectedMetric={currentScoreBadgeSelected} on:badge-click={onBadgeClick} />
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
			<div class="option" />

			{#if currentScoreMetric}
				<BadgeEdit badge={currentScoreMetric} on:change={updateSelectedBadge} type="leaderboard-score" />
			{:else}
				<section class="option">
					<label>Metric</label>
					<div>Click first on the score metric badge you want to set.</div>
				</section>
			{/if}
			<section class="option full">
				<label title="Determines which data should be displayed in score details">Score details settings:</label>
				<div class="switches">
					{#each Object.keys(scoreDetailsPreferences) as key}
						<Switch
							value={scoreDetailsPreferences[key]}
							label={scoreDetailsKeyDescription[key]}
							fontSize={12}
							design="slider"
							on:click={() => settempsetting('leaderboardPreferences', 'show.' + key, !scoreDetailsPreferences[key])} />
					{/each}
				</div>
			</section>
		{/if}
		{#if $account?.player}
			<section class="option full">
				<label>Other (saved automatically, account synced):</label>
				{#if isUpdating}
					<Spinner />
				{/if}
				<div class="single" title="Display scores from AI on leaderboards">
					<Switch disabled={isUpdating} value={showBots} label="Show bots" fontSize={12} design="slider" on:click={() => toggleBots()} />
				</div>
				{#if !anySupporter}
					<span><br />To enable this feature please support us on <a href="https://patreon.com/beatleader">Patreon</a></span>
				{/if}
				<div class="single" title="Display approximate ratings for all standard leaderboards">
					<Switch
						disabled={!anySupporter || isUpdating}
						value={showAllRatings}
						label="Show rating for all maps"
						fontSize={12}
						design="slider"
						on:click={() => toggleAllRatings()} />
				</div>
			</section>
		{/if}
		{#if leaderboard}
			<section class="option full">
				<label>Header:</label>
				<ContentBox cls="leaderboard-header-box">
					<LeaderboardHeader {leaderboard} {ratings} latestHash={true} />
				</ContentBox>
				<div class="switches">
					<div title="Show map stats">
						<Switch
							value={showSubtitle}
							label="Show song subtitle"
							fontSize={12}
							design="slider"
							on:click={() => settempsetting('leaderboardPreferences', 'showSubtitleInHeader', !showSubtitle)} />
					</div>
					<div title="Show map stats">
						<Switch
							value={showStats}
							label="Show map stats"
							fontSize={12}
							design="slider"
							on:click={() => settempsetting('leaderboardPreferences', 'showStatsInHeader', !showStats)} />
					</div>
					<div title="Show map hash">
						<Switch
							value={showHash}
							label="Show hash"
							fontSize={12}
							design="slider"
							on:click={() => settempsetting('leaderboardPreferences', 'showHashInHeader', !showHash)} />
					</div>
					<div title="Show scores weight graph on ranked maps in the tab options">
						<Switch
							value={showGraph}
							label="Show scores graph"
							fontSize={12}
							design="slider"
							on:click={() => settempsetting('leaderboardPreferences', 'showGraphOption', !showGraph)} />
					</div>
					<div title="Show clan captured">
						<Switch
							value={showClanInHeader}
							label="Show clan in header"
							fontSize={12}
							design="slider"
							on:click={() => settempsetting('leaderboardPreferences', 'showClanCaptureInHeader', !showClanInHeader)} />
					</div>
					<div title="Show clan captured in the list">
						<Switch
							value={showClanInList}
							label="Show clan in list"
							fontSize={12}
							design="slider"
							on:click={() => settempsetting('leaderboardPreferences', 'showClanCaptureInList', !showClanInList)} />
					</div>
				</div>
			</section>
		{/if}
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
