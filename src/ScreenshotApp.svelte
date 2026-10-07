<script>
	import {setContext} from 'svelte';
	import {Router, Route} from 'svelte-routing';
	import Notifications from 'svelte-notifications';
	import {configStore} from './stores/config';
	import createContainerStore from './stores/container';
	import {applyThemePreferences} from './utils/color';
	import SimpleModal from './components/Common/SimpleModal.svelte';
	import NotificationComponent from './components/Common/NotificationComponent.svelte';

	const pageImports = {
		ProfilePage: () => import('./pages/ScreenshotProfile.svelte'),
		SkillTrianglePage: () => import('./pages/ScreenshotSkillTriangle.svelte'),
		ScoreStatsPage: () => import('./pages/ScreenshotScoreStats.svelte'),
		Replayed: () => import('./pages/Replayed.svelte'),
		ClansMap: () => import('./pages/ClansMap.svelte'),
		GlobalClansMapHistory: () => import('./components/Clans/GlobalClansMapHistory.svelte'),
		NotFoundPage: () => import('./pages/NotFound.svelte'),
	};

	export let url = '';

	let mainEl = null;

	const containerStore = createContainerStore();

	setContext('pageContainer', containerStore);

	$: if (mainEl) containerStore.observe(mainEl);

	document.documentElement.classList.add('screenshot-mode');

	applyThemePreferences($configStore.preferences);
</script>

<Router {url}>
	<Notifications zIndex={10000} item={NotificationComponent}>
		<SimpleModal closeButton={false}>
			<main bind:this={mainEl} class={$configStore?.preferences?.theme}>
				<Route path="/u/:playerId/*" let:params>
					{#await pageImports.ProfilePage() then module}
						<svelte:component this={module.default} playerId={params.playerId} />
					{/await}
				</Route>
				<Route path="/triangle/:playerId" let:params>
					{#await pageImports.SkillTrianglePage() then module}
						<svelte:component this={module.default} playerId={params.playerId} />
					{/await}
				</Route>
				<Route path="/score/:scoreId/stats" let:params>
					{#await pageImports.ScoreStatsPage() then module}
						<svelte:component this={module.default} scoreId={params.scoreId} />
					{/await}
				</Route>
				<Route path="/score/:scoreId/stats/graph" let:params>
					{#await pageImports.ScoreStatsPage() then module}
						<svelte:component this={module.default} scoreId={params.scoreId} graphOnly={true} />
					{/await}
				</Route>
				<Route path="/replayed/*id" let:params>
					{#await pageImports.Replayed() then module}
						<svelte:component this={module.default} playerId={params.id ? params.id : null} summaryOnly={true} />
					{/await}
				</Route>
				<Route path="/replayed/mapper/*id" let:params>
					{#await pageImports.Replayed() then module}
						<svelte:component this={module.default} replayedType="mapper" playerId={params.id ? params.id : null} summaryOnly={true} />
					{/await}
				</Route>
				<Route path="/clansmap/leaderboard/*leaderboardId" let:params>
					{#await pageImports.ClansMap() then module}
						<svelte:component this={module.default} leaderboardId={params.leaderboardId} />
					{/await}
				</Route>
				<Route path="/clansmap/history/*startTimeset" let:params>
					{#await pageImports.GlobalClansMapHistory() then module}
						<svelte:component
							this={module.default}
							startTimeset={params.startTimeset.includes('/') ? params.startTimeset.split('/')[0] : params.startTimeset}
							finishTimeset={params.startTimeset.includes('/') ? params.startTimeset.split('/')[1] : null} />
					{/await}
				</Route>
				<Route path="/clansmap/save">
					{#await pageImports.ClansMap() then module}
						<svelte:component this={module.default} save={true} />
					{/await}
				</Route>
				<Route path="/*">
					{#await pageImports.NotFoundPage() then module}
						<svelte:component this={module.default} />
					{/await}
				</Route>
			</main>
		</SimpleModal>
	</Notifications>
</Router>

<link rel="stylesheet" href="/build/themes/{$configStore.preferences.theme}.css" />

<style>
	:global(html.screenshot-mode),
	:global(html.screenshot-mode body) {
		background-color: transparent !important;
	}

	main {
		margin-top: 1em;
	}

	@media (max-width: 600px) {
		main {
			margin-top: 0;
		}
	}
</style>
