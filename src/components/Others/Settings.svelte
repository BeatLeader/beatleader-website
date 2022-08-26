<script>
	import produce from 'immer';
	import {configStore, DEFAULT_LOCALE, getSupportedLocales} from '../../stores/config';
	import {ROUTER} from 'svelte-routing/src/contexts';
	import {getContext, onMount} from 'svelte';
	import {opt} from '../../utils/js';
	import eventBus from '../../utils/broadcast-channel-pubsub';
	import {DAY} from '../../utils/date';
	import Dialog from '../Common/Dialog.svelte';
	import Button from '../Common/Button.svelte';
	import Select from './Select.svelte';

	export let show = false;

	const DEFAULT_THEME = 'mirror';
	const DEFAULT_PP_METRIC = 'weighted';
	const DEFAULT_SCORE_COMPARISON_METHOD = 'in-place';
	const DEFAULT_AVATAR_ICONS = 'show';
	const DEFAULT_ONECLICK_VALUE = 'modassistant';
	const DEFAULT_SORT_VALUE = 'last';

	const {activeRoute} = getContext(ROUTER);

	const scoreComparisonMethods = [
		{name: 'In place', value: DEFAULT_SCORE_COMPARISON_METHOD},
		{name: 'In details', value: 'in-details'},
	];

	const ppMetrics = [
		{name: 'Weighted PP', value: DEFAULT_PP_METRIC},
		{name: 'PP improvement', value: 'improvement'},
		{name: 'Total PP gain', value: 'total-gain'},
	];

	const avatarIcons = [
		{name: 'Always show', value: DEFAULT_AVATAR_ICONS},
		{name: 'Show when needed', value: 'only-when-needed'},
		{name: 'Always hide', value: 'hide'},
	];

	const themes = [
		{name: 'Classic - Motzel', value: 'default'},
		{name: 'Mirror - MicroBlock', value: 'mirror'},
		{name: 'Mirror(Low) - MicroBlock', value: 'mirror-low'},
		{name: 'Unbounded - MicroBlock', value: 'unbounded'},
	];

	const oneclickOptions = [
		{name: 'Mod Assistant', value: DEFAULT_ONECLICK_VALUE},
		{name: 'Playlist sync', value: 'playlist'},
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

	let currentTheme = DEFAULT_THEME;
	let currentBGImage = '';
	let currentLocale = DEFAULT_LOCALE;
	let currentPpMetric = DEFAULT_PP_METRIC;
	let currentScoreComparisonMethod = DEFAULT_SCORE_COMPARISON_METHOD;
	let currentAvatarIcons = DEFAULT_AVATAR_ICONS;
	let currentOneclick = DEFAULT_ONECLICK_VALUE;
	let currentSortOption = DEFAULT_SORT_VALUE;

	function onConfigUpdated(config) {
		if (config?.locale) currentLocale = config.locale;
		if (config?.preferences?.ppMetric) currentPpMetric = config?.preferences?.ppMetric ?? DEFAULT_PP_METRIC;
		if (config?.scoreComparison) currentScoreComparisonMethod = config?.scoreComparison?.method ?? DEFAULT_SCORE_COMPARISON_METHOD;
		if (config?.preferences?.iconsOnAvatars) currentAvatarIcons = config?.preferences?.iconsOnAvatars ?? DEFAULT_AVATAR_ICONS;
		if (config?.preferences?.theme) currentTheme = config?.preferences?.theme ?? DEFAULT_THEME;
		if (config?.preferences?.oneclick) currentOneclick = config?.preferences?.oneclick ?? DEFAULT_ONECLICK_VALUE;
		if (config?.preferences?.scoresSortOptions) currentSortOption = config?.preferences?.scoresSortOptions ?? DEFAULT_SORT_VALUE;
		if (config?.preferences?.bgimage) currentBGImage = config?.preferences?.bgimage ?? '';
	}

	function onSave() {
		if (!configStore || !$configStore) return;

		$configStore = produce($configStore, draft => {
			draft.locale = currentLocale;
			draft.preferences.ppMetric = currentPpMetric;
			draft.scoreComparison.method = currentScoreComparisonMethod;
			draft.preferences.iconsOnAvatars = currentAvatarIcons;
			draft.preferences.theme = currentTheme;
			draft.preferences.oneclick = currentOneclick;
			draft.preferences.bgimage = currentBGImage;
			draft.preferences.scoresSortOptions = currentSortOption;
			document.location.reload();
		});

		show = false;
	}

	function onCancel() {
		if (configStore && $configStore) {
			currentLocale = $configStore.locale;
			currentPpMetric = $configStore.preferences.ppMetric;
			currentScoreComparisonMethod = $configStore.scoreComparison.method;
			currentAvatarIcons = $configStore.preferences.iconsOnAvatars;
			currentSortOption = $configStore.preferences.scoresSortOptions;
		}

		show = false;
	}

	$: onConfigUpdated(configStore && $configStore ? $configStore : null);
</script>

{#if show}
	<Dialog title="Settings" closeable={true} on:confirm={onCancel}>
		<svelte:fragment slot="content">
			{#if configStore && $configStore}
				<section class="options">
					<section class="option">
						<label
							title="Determines which metric will be displayed at the score under PP, if available. The others will be displayed in the tooltip."
							>PP metric</label>
						<Select bind:value={currentPpMetric}>
							{#each ppMetrics as option (option.value)}
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
						<label title="Determines when to show icons on player avatars">Icons on avatars</label>
						<Select bind:value={currentAvatarIcons}>
							{#each avatarIcons as option (option.value)}
								<option value={option.value}>{option.name}</option>
							{/each}
						</Select>
					</section>

					<section class="option">
						<label title="Choose the theme you want">Theme</label>
						<Select bind:value={currentTheme}>
							{#each themes as option (option.value)}
								<option value={option.value}>{option.name}</option>
							{/each}
						</Select>
					</section>

					<section class="option">
						<label title="Input url of the background image you want">Background Image</label>
						<input type="url" bind:value={currentBGImage} disabled={currentTheme == 'default' || currentTheme == 'mirror-low'} />
					</section>

					<section class="option">
						<label title="How One-Click button will work">One-click installs</label>
						<Select bind:value={currentOneclick}>
							{#each oneclickOptions as option (option.value)}
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
				</section>
			{:else}
				Loading...
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="footer-right">
			<Button iconFa="fas fa-save" label="Save" type="primary" on:click={onSave} disabled={!configStore} />
			<Button label="Cancel" on:click={onCancel} />
		</svelte:fragment>
	</Dialog>
{/if}

<style>
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
		color: var(--faded) !important;
		margin-bottom: 0.25em;
	}

	@media screen and (max-width: 600px) {
		.options {
			grid-template-columns: 1fr;
		}
	}
</style>
