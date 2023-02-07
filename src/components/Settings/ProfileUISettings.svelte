<script>
	import {configStore} from '../../stores/config';
	import Select from './Select.svelte';
	import RangeSlider from 'svelte-range-slider-pips';
	import Profile from '../Player/Profile.svelte';
	import createPlayerInfoWithScoresStore from '../../stores/http/http-player-with-scores-store';
	import createAccountStore from '../../stores/beatleader/account';

	const DEFAULT_AVATAR_ICONS = 'show';
	const DEFAULT_SORT_VALUE = 'last';
	const DEFAULT_DAYS_TO_COMPARE = 1;
	const DEFAULT_DAYS_OF_HISTORY = 30;

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
	];

	let currentAvatarIcons = DEFAULT_AVATAR_ICONS;
	let currentSortOption = DEFAULT_SORT_VALUE;
	let currentDaysToCompare = DEFAULT_DAYS_TO_COMPARE;
	let currentDaysOfHistory = DEFAULT_DAYS_OF_HISTORY;

	function onConfigUpdated(config) {
		if (config?.preferences?.iconsOnAvatars != currentAvatarIcons)
			currentAvatarIcons = config?.preferences?.iconsOnAvatars ?? DEFAULT_AVATAR_ICONS;
		if (config?.preferences?.scoresSortOptions != currentSortOption)
			currentSortOption = config?.preferences?.scoresSortOptions ?? DEFAULT_SORT_VALUE;
		if (config?.preferences?.daysToCompare != currentDaysToCompare)
			currentDaysToCompare = config?.preferences?.daysToCompare ?? DEFAULT_DAYS_TO_COMPARE;
		if (config?.preferences?.daysOfHistory != currentDaysOfHistory)
			currentDaysOfHistory = config?.preferences?.daysOfHistory ?? DEFAULT_DAYS_OF_HISTORY;
	}

	async function settempsetting(key, value) {
		var preferences = configStore.get('preferences');
		preferences[key] = value;
		await configStore.setForKey('preferences', preferences, false);
	}

	const account = createAccountStore();
	let playerStore = createPlayerInfoWithScoresStore($account?.player?.playerId ?? '1');

	$: onConfigUpdated(configStore && $configStore ? $configStore : null);

	$: settempsetting('iconsOnAvatars', currentAvatarIcons);
	$: settempsetting('scoresSortOptions', currentSortOption);
	$: settempsetting('daysToCompare', currentDaysToCompare);
	$: settempsetting('daysOfHistory', currentDaysOfHistory);
</script>

<div class="main-container">
	<div class="profile">
		<Profile playerData={$playerStore} fixedBrowserTitle="Settings" pinnedScores={false} />
	</div>
	<div class="options">
		<section class="option">
			<label title="Determines when to show icons on player avatars">Icons on avatars</label>
			<Select bind:value={currentAvatarIcons}>
				{#each avatarIcons as option (option.value)}
					<option value={option.value}>{option.name}</option>
				{/each}
			</Select>
		</section>

		<section class="option">
			<label title="How to sort scores by defauls">Sort scores by</label>
			<Select bind:value={currentSortOption}>
				{#each sortOptions as option (option.value)}
					<option value={option.value}>{option.name}</option>
				{/each}
			</Select>
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
				on:change={event => {
					currentDaysToCompare = event.detail.values[0];
				}} />
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
				on:change={event => {
					currentDaysOfHistory = event.detail.values[0];
				}} />
		</section>
	</div>
</div>

<style>
	.main-container {
		display: flex;
		flex-direction: column;
	}

	.profile {
		max-width: 67em;
		max-height: 23em;
		overflow: auto;
	}

	.options {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-gap: 1em;
		align-items: start;
		justify-items: start;
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

	@media screen and (max-width: 600px) {
		.options {
			grid-template-columns: 1fr;
		}
	}
</style>
