<script>
	import {fade} from 'svelte/transition';
	import ssrConfig from '../ssr-config';
	import {configStore} from '../stores/config';
	import createAccountStore from '../stores/beatleader/account';
	import Button from '../components/Common/Button.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import ThemeSettings from '../components/Settings/ThemeSettings.svelte';
	import ProfileUiSettings from '../components/Settings/ProfileUISettings.svelte';
	import ScoreSettings from '../components/Settings/ScoreSettings.svelte';
	import LeaderboardSettings from '../components/Settings/LeaderboardSettings.svelte';
	import AccountSettings from '../components/Settings/AccountSettings.svelte';
	import RankingSettings from '../components/Settings/RankingSettings.svelte';

	document.body.scrollIntoView({behavior: 'smooth'});

	const account = createAccountStore();

	var navigationItems = [
		{
			name: 'Theme',
			link: '#theme',
			icon: 'fas fa-paint-roller',
		},
		{
			name: 'Profile',
			link: '#profile',
			icon: 'fas fa-address-card',
		},
		{
			name: 'Ranking',
			link: '#ranking',
			icon: 'fas fa-list',
		},
		{
			name: 'Scores',
			link: '#scores',
			icon: 'fas fa-list',
		},
		{
			name: 'Leaderboard',
			link: '#leaderboard',
			icon: 'fas fa-list',
		},
		{
			name: 'April Fools',
			link: '#aprilfools',
			icon: 'fas fa-calendar-days',
		},
	];
	var selectedNavigationIndex = navigationItems.findIndex(el => el.link == window.location.hash);
	if (selectedNavigationIndex == -1) {
		selectedNavigationIndex = 0;
	}

	let previousIndex = undefined;

	function selectNavigation(item, index) {
		previousIndex = selectedNavigationIndex;
		selectedNavigationIndex = index;
		history.replaceState(undefined, undefined, item.link);
		document.body.scrollIntoView({behavior: 'smooth'});
	}

	async function onSave() {
		if (configStore && $configStore) {
			await configStore.persist();
		}
	}

	async function onCancel() {
		if (configStore && $configStore) {
			await configStore.reset();
		}
	}

	$: settingsChanged = $configStore ? configStore.getSettingsChanged() : undefined;
	$: animationSign = previousIndex == undefined ? 0 : selectedNavigationIndex >= previousIndex ? 1 : -1;
	$: if ($account?.player && !navigationItems.find(i => i.link === '#account')) {
		navigationItems = [
			...navigationItems,
			{
				name: 'Account',
				link: '#account',
				icon: 'fas fa-user',
			},
		];
	}
</script>

<svelte:head>
	<title>Settings - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		{#if configStore && $configStore}
			<ContentBox>
				<h1 class="header-title">Settings</h1>
				<div class="settings-container">
					<div class="navigation">
						{#each navigationItems as item, idx}
							<div
								on:click={() => selectNavigation(item, idx)}
								on:keydown={() => selectNavigation(item, idx)}
								class="navigation-item {idx == selectedNavigationIndex ? 'selected' : ''}">
								<i class={item.icon} />
								<span class="navigation-item-title">{item.name}</span>
							</div>
						{/each}
					</div>
					<div class="tabs-container">
						{#if selectedNavigationIndex == 0}
							<ThemeSettings {animationSign} />
						{:else if selectedNavigationIndex == 1}
							<ProfileUiSettings {animationSign} />
						{:else if selectedNavigationIndex == 2}
							<RankingSettings {animationSign} />
						{:else if selectedNavigationIndex == 3}
							<ScoreSettings {animationSign} />
						{:else if selectedNavigationIndex == 4}
							<LeaderboardSettings {animationSign} />
						{:else if selectedNavigationIndex == 5}
							<LeaderboardSettings {animationSign} />
						{:else if selectedNavigationIndex == 6}
							<AccountSettings {animationSign} />
						{/if}
					</div>
				</div>
			</ContentBox>
		{:else}
			Loading...
		{/if}

		<div class="buttons">
			<Button iconFa="fas fa-save" label="Save" type="primary" on:click={onSave} disabled={!settingsChanged} />
			<Button label="Cancel" on:click={onCancel} disabled={!settingsChanged} />
		</div>
	</article>
</section>

<style>
	.settings-container {
		display: flex;
	}

	.tabs-container {
		display: flex;
		flex-direction: column;
		width: clamp(20rem, calc(63rem - 20px), 100%);
	}

	.navigation {
		border-right: 1px solid #ccc;
		margin: 0.5em;
		margin-left: 0;
		min-width: 11rem;
	}

	.navigation-item-title {
		user-select: none;
	}

	.navigation-item {
		padding: 0.4em 1.2em;
		margin: 0.5em;
		border-radius: 0.4em;
		cursor: pointer;
		min-width: 7.5em;
		margin-left: 0;
		user-select: none;
	}

	.navigation-item.selected {
		background-color: var(--selected);
	}

	.buttons {
		display: flex;
		justify-content: center;
		align-items: center;
		grid-gap: 1em;
	}

	.header-title {
		font-size: xx-large;
		margin-bottom: 1em;
		font-weight: 500;
	}

	@media screen and (max-width: 600px) {
		.settings-container {
			flex-direction: column;
		}

		.navigation {
			border-right: none;
			border-bottom: 1px solid #ccc;
		}
	}
</style>
