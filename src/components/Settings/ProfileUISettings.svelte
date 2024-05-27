<script>
	import {configStore} from '../../stores/config';
	import Select from './Select.svelte';
	import RangeSlider from 'svelte-range-slider-pips';
	import Profile from '../Player/Profile.svelte';
	import Switch from '../Common/Switch.svelte';
	import processPlayerData from '../Player/utils/profile';
	import createStatsHistoryStore from '../../stores/beatleader/stats-history';
	import createPlayerInfoWithScoresStore from '../../stores/http/http-player-with-scores-store';
	import createPinnedScoresStore from '../../stores/beatleader/pinned-scores';
	import createAccountStore from '../../stores/beatleader/account';
	import {fly, fade} from 'svelte/transition';
	import CardsCarousel from '../Player/CardsCarousel.svelte';
	import {describeGraphAxis, describeProfilePart} from '../../utils/beatleader/format';
	import PinnedScores from '../Player/PinnedScores.svelte';
	import Achievements from '../Player/Achievements.svelte';
	import {debounce} from '../../utils/debounce';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

	export let animationSign = 1;

	const DEFAULT_AVATAR_ICONS = 'show';
	const DEFAULT_SORT_VALUE = 'last';
	const DEFAULT_DAYS_TO_COMPARE = 1;
	const DEFAULT_DAYS_OF_HISTORY = 30;
	const DEFAULT_GRAPH_HEIGHT = 350;

	const avatarIcons = [
		{name: 'Always show', value: DEFAULT_AVATAR_ICONS},
		{name: 'Show when needed', value: 'only-when-needed'},
		{name: 'Always hide', value: 'hide'},
	];

	const sortOptions = [
		{name: 'Last selected option', value: 'last'},
		{name: 'PP', value: 'pp'},
		{name: 'Date', value: 'date'},
		{name: 'Accuracy', value: 'acc'},
		{name: 'Rank', value: 'rank'},
		{name: 'Stars', value: 'stars'},
		{name: 'Pauses', value: 'pauses'},
		{name: 'Mistakes', value: 'mistakes'},
	];

	let currentAvatarIcons = DEFAULT_AVATAR_ICONS;
	let currentSortOption = DEFAULT_SORT_VALUE;
	let currentDaysToCompare = DEFAULT_DAYS_TO_COMPARE;
	let currentDaysOfHistory = DEFAULT_DAYS_OF_HISTORY;
	let currentGraphHeight = DEFAULT_GRAPH_HEIGHT;

	function onConfigUpdated(config) {
		if (config?.preferences?.iconsOnAvatars != currentAvatarIcons)
			currentAvatarIcons = config?.preferences?.iconsOnAvatars ?? DEFAULT_AVATAR_ICONS;
		if (config?.preferences?.scoresSortOptions != currentSortOption)
			currentSortOption = config?.preferences?.scoresSortOptions ?? DEFAULT_SORT_VALUE;
		if (config?.preferences?.daysToCompare != currentDaysToCompare)
			currentDaysToCompare = config?.preferences?.daysToCompare ?? DEFAULT_DAYS_TO_COMPARE;
		if (config?.preferences?.daysOfHistory != currentDaysOfHistory)
			currentDaysOfHistory = config?.preferences?.daysOfHistory ?? DEFAULT_DAYS_OF_HISTORY;
		if (config?.preferences?.graphHeight != currentGraphHeight)
			currentGraphHeight = config?.preferences?.graphHeight ?? DEFAULT_GRAPH_HEIGHT;
	}

	async function settempsetting(key, value) {
		var preferences = configStore.get('preferences');
		preferences[key] = value;
		await configStore.setForKey('preferences', preferences, false);
	}

	async function setroottempsetting(key, subkey, value) {
		if (subkey) {
			var preferences = configStore.get(key);
			preferences[subkey] = value;
			await configStore.setForKey(key, preferences, false);
		} else {
			await configStore.setForKey(key, value, false);
		}
	}

	let isUpdating = false;
	let followersPublic = true;

	async function toggleFollowersPublic() {
		if (isUpdating) return;

		try {
			isUpdating = true;
			followersPublic = !followersPublic;
			fetch(`${BL_API_URL}user/friends?is_public=${followersPublic}`, {method: 'PATCH', credentials: 'include'}).then(() => {
				isUpdating = false;
			});
		} finally {
			isUpdating = null;
		}
	}

	function updateProfileSettings(account) {
		if (account) {
			followersPublic = !account.hideFriends;
		}
	}

	function onCurrentDaysToCompareChange(event) {
		currentDaysToCompare = event.detail.values[0];
	}

	const debouncedOnCurrentDaysToCompareChange = debounce(onCurrentDaysToCompareChange, 100);

	function onDaysOfHistoryChange(event) {
		currentDaysOfHistory = event.detail.values[0];
	}

	const debouncedOnDaysOfHistoryChange = debounce(onDaysOfHistoryChange, 100);

	function onGraphHeightChange(event) {
		currentGraphHeight = event.detail.values[0];
	}

	const debouncedOnGraphHeightChange = debounce(onGraphHeightChange, 100);

	const account = createAccountStore();
	const statsHistoryStore = createStatsHistoryStore();
	const pinnedScoresStore = createPinnedScoresStore();

	$: playerStore = createPlayerInfoWithScoresStore($account?.player?.playerId ?? '1');
	$: pinnedScoresStore.fetchScores($account?.player?.playerId ?? '1');
	$: onConfigUpdated(configStore && $configStore ? $configStore : null);

	$: settempsetting('iconsOnAvatars', currentAvatarIcons);
	$: settempsetting('scoresSortOptions', currentSortOption);
	$: settempsetting('daysToCompare', currentDaysToCompare);
	$: settempsetting('daysOfHistory', currentDaysOfHistory);
	$: settempsetting('graphHeight', currentGraphHeight);

	$: playerData = $playerStore;
	$: playerId = playerData && playerData.playerId ? playerData.playerId : null;
	$: ({playerInfo, scoresStats, _, ssBadges} = processPlayerData(playerData));
	$: updateProfileSettings($account);
	$: statsHistoryStore.fetchStats(playerData, $configStore.preferences.daysOfHistory);
	$: profileParts = Object.keys($configStore.profileParts);
	$: graphLegends = Object.keys($configStore.chartLegendVisible);
</script>

<div class="main-container" in:fly|global={{y: animationSign * 200, duration: 400}} out:fade|global={{duration: 100}}>
	<div class="profile">
		<Profile playerData={$playerStore} fixedBrowserTitle="Settings" clanEffects={false} />

		{#if $configStore.profileParts.graphs}
			<CardsCarousel {playerId} {playerInfo} {scoresStats} {ssBadges} {playerData} />
		{/if}
		{#if $configStore.profileParts.pinnedScores}
			<PinnedScores {pinnedScoresStore} {playerId} />
		{/if}
		{#if $configStore.profileParts.achievements}
			<Achievements {playerId} />
		{/if}
	</div>

	<div class="options">
		{#if $account?.player}
			<section class="option full">
				<label title="Wether to show and make public followers">Followers:</label>
				{#if isUpdating}
					<Spinner />
				{/if}
				<div class="followers-switches">
					<Switch
						disabled={isUpdating}
						value={followersPublic}
						label="Public followers and following (incoming change, auto-saved)"
						fontSize={12}
						design="slider"
						on:click={() => toggleFollowersPublic()} />
				</div>
			</section>
		{/if}
		<section class="option">
			<label title="Determines when to show icons on player avatars">Icons on avatars</label>
			<Select bind:value={currentAvatarIcons} options={avatarIcons} />
		</section>

		<section class="option">
			<label title="How to sort scores by defauls">Sort scores by</label>
			<Select bind:value={currentSortOption} options={sortOptions} />
		</section>

		<section class="option">
			<label title="How many days of history to show on the profile">Rank and pp gain</label>
			<RangeSlider
				min={1}
				max={30}
				step={1}
				values={[currentDaysToCompare]}
				float
				hoverable
				pips
				pipstep={6}
				all="label"
				on:change={debouncedOnCurrentDaysToCompareChange} />
		</section>

		<section class="option">
			<label title="How many days of history to show on the profile">Days of history</label>
			<RangeSlider
				min={2}
				max={100}
				step={1}
				values={[currentDaysOfHistory]}
				float
				hoverable
				pips
				pipstep={30}
				all="label"
				on:change={debouncedOnDaysOfHistoryChange} />
		</section>

		<section class="option full">
			<label title="Determines which parts of the profile to show">Profile parts to show:</label>
			<div class="switches">
				{#each profileParts as key}
					<Switch
						value={$configStore.profileParts[key]}
						label={describeProfilePart(key)}
						fontSize={12}
						design="slider"
						on:click={() => setroottempsetting('profileParts', key, !$configStore.profileParts[key])} />
				{/each}
			</div>
		</section>

		<section class="option full">
			<label title="Determines which parts of the profile to show">Other score sources:</label>
			<div class="switches">
				<Switch
					value={$configStore.preferences.showAccSaber}
					label="AccSaber"
					title="Show AccSaber information on profiles"
					fontSize={12}
					design="slider"
					on:click={() => settempsetting('showAccSaber', !$configStore.preferences.showAccSaber)} />
			</div>
		</section>

		{#if $configStore.profileParts.graphs}
			<section class="option">
				<label title="How many days of history to show on the profile">Graph height(px):</label>
				<RangeSlider
					min={200}
					max={500}
					step={1}
					values={[currentGraphHeight]}
					float
					hoverable
					pips
					pipstep={30}
					all="label"
					on:change={debouncedOnGraphHeightChange} />
			</section>
			<section class="option full">
				<label title="Which graph legend elements to show">Graph legend:</label>
				<div class="switches">
					{#each graphLegends as key}
						<Switch
							value={$configStore.chartLegendVisible[key]}
							label={describeGraphAxis(key)}
							fontSize={12}
							design="slider"
							on:click={() => setroottempsetting('chartLegendVisible', key, !$configStore.chartLegendVisible[key])} />
					{/each}
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

	.profile {
		max-width: 67em;
		overflow: auto;
		max-height: 22.3em;
		border: 3px dashed var(--textColor);
		padding-top: 0.3em;
		scrollbar-width: none;
	}

	.profile::-webkit-scrollbar {
		display: none;
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

	label {
		display: block;
		font-size: 0.75em;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #afafaf !important;
		margin-bottom: 0.25em;
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
	.followers-switches {
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
		.switches {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
		}

		:global(.s--slider) {
			justify-content: space-between;
		}
	}
</style>
