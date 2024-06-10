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

	let noFunny = false;
	let anySupporter = false;

	async function toggleBots() {
		if (isUpdating) return;

		try {
			isUpdating = true;

			await account.update({noFunny: !noFunny});
		} finally {
			isUpdating = null;
		}
	}

	function updateProfileSettings(account) {
		if (account?.player?.profileSettings) {
			noFunny = account.player.profileSettings.noFunny;
		}

		anySupporter = isAnySupporter(account?.player?.playerInfo?.role);
	}

	$: onConfigUpdated(configStore && $configStore ? $configStore : null);
	$: onBadgePresetChange(currentBadgePreset);

	$: settempsetting('leaderboardPreferences', 'badgeRows', currentBadgeLayout);
	$: settempsetting('leaderboardPreferences', 'badges', currentScoreBadges);

	$: scoreDetailsPreferences = $configStore?.leaderboardPreferences?.show ?? {};

	$: updateProfileSettings($account);
</script>

<div class="main-container" in:fly|global={{y: animationSign * 200, duration: 400}} out:fade|global={{duration: 100}}>
	<div class="options">
		{#if $account?.player}
			<section class="option full">
				<label>Disable April Fools context:</label>
				{#if isUpdating}
					<Spinner />
				{/if}
				<div class="single" title="April Fools context Enabled">
					<Switch disabled={isUpdating} value={noFunny} label="OurSaber" fontSize={12} design="slider" on:click={() => toggleBots()} />
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
