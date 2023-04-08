<script>
	import {onMount, setContext} from 'svelte';
	import {Router, Route, navigate} from 'svelte-routing';
	import Notifications from 'svelte-notifications';
	import buildInfo from '../build-info';
	import {configStore} from './stores/config';
	import createAccountStore from './stores/beatleader/account';
	import {search} from './stores/search';
	import createContainerStore from './stores/container';
	import {isTouchDevice} from './utils/is-touch';
	import RankingPage from './pages/Ranking.svelte';
	import EventPage from './pages/Event.svelte';
	import LeaderboardPage from './pages/Leaderboard.svelte';
	import LeaderboardsPage from './pages/Leaderboards.svelte';
	import ClanPage from './pages/Clan.svelte';
	import ClansPage from './pages/Clans.svelte';
	import FollowedPage from './pages/Followed.svelte';
	import PlayerPage from './pages/Player.svelte';
	import TwitchPage from './pages/Twitch.svelte';
	import NotFoundPage from './pages/NotFound.svelte';
	import PrivacyPage from './pages/Privacy.svelte';
	import AboutPage from './pages/About.svelte';
	import DashboardPage from './pages/Dashboard.svelte';
	import PlaylistsPage from './pages/Playlists.svelte';
	import PlaylistPage from './pages/Playlist.svelte';
	import SigninPage from './pages/SignIn.svelte';
	import OauthSignInPage from './pages/OauthSignIn.svelte';
	import SupportPage from './pages/Support.svelte';
	import Nav from './components/Nav/Nav.svelte';
	import Modal from 'svelte-simple-modal';
	import StaffDashboard from './pages/StaffDashboard.svelte';
	import EventsPage from './pages/Events.svelte';
	import Socket from './pages/Socket.svelte';
	import Settings from './pages/Settings.svelte';
	import {setGlobalCSSValue} from './utils/color';
	import ContentBox from './components/Common/ContentBox.svelte';
	import PlaylistCart from './components/Playlists/PlaylistCart.svelte';
	import Search from './components/Search/Search.svelte';
	import LandingPage from './pages/LandingPage.svelte';

	export let url = '';

	let mainEl = null;

	const containerStore = createContainerStore();
	const account = createAccountStore();

	setContext('pageContainer', containerStore);

	let mobileTooltip = null;
	onMount(() => {
		const hideTooltip = () => (mobileTooltip ? (mobileTooltip.style.display = 'none') : null);
		const showTooltip = (contents, x, y) => {
			if (!mobileTooltip) return;

			mobileTooltip.innerHTML = contents;
			mobileTooltip.style.display = 'inline-block';

			const windowWidth = window.innerWidth;
			const windowHeight = window.innerHeight;
			const rect = mobileTooltip.getBoundingClientRect();

			const posX = x + rect.width > windowWidth ? x - (x + rect.width - windowWidth) : x;
			const posY = y + rect.height > windowHeight ? y - (y + rect.height - windowHeight) : y;

			mobileTooltip.style.left = `${posX}px`;
			mobileTooltip.style.top = `${posY}px`;
		};

		const mobileTooltipHandler = e => {
			hideTooltip();

			const closestTitle = e?.target?.title?.length ? e.target : e?.target?.closest("[title]:not([title=''])");
			if (closestTitle) {
				showTooltip(closestTitle.title.split('\n').join('<br />'), e.clientX, e.clientY);
			}
		};

		if (isTouchDevice()) {
			document.body.addEventListener('click', mobileTooltipHandler, {passive: true});
			document.addEventListener('scroll', hideTooltip, {passive: true});

			return () => {
				document.body.removeEventListener('click', mobileTooltipHandler);
				document.removeEventListener('scroll', hideTooltip);
			};
		}
	});

	$: if (mainEl) containerStore.observe(mainEl);

	if ($configStore.preferences.theme != 'default') {
		setGlobalCSSValue('background-image', 'url(' + $configStore.preferences.bgimage + ')');
		setGlobalCSSValue('customizable-color-1', $configStore.preferences.bgColor);
		setGlobalCSSValue('customizable-color-2', $configStore.preferences.headerColor);
	}
</script>

<div bind:this={mobileTooltip} class="mobile-tooltip" />
<div class="main-background" />
<Router {url}>
	<Nav class={$configStore?.preferences?.theme} />
	<Notifications zIndex={10000}>
		<Modal closeButton={false} styleWindow={{width: '90vw', height: '65vh'}} styleContent={{padding: 0}}>
			<main bind:this={mainEl} class={$configStore?.preferences?.theme}>
				<div class="ssr-page-container">
					<Route path="/">
						{#if $account?.player}
							<DashboardPage />
						{:else}
							<LandingPage />
						{/if}
					</Route>
					<Route path="/u/:initialPlayerId/*initialParams" let:params>
						<PlayerPage initialPlayerId={params.initialPlayerId} initialParams={params.initialParams} />
					</Route>
					<Route path="/staff" let:location>
						<StaffDashboard {location} />
					</Route>
					<Route path="/privacy" component={PrivacyPage} />
					<Route path="/about" component={AboutPage} />
					<Route path="/socket" component={Socket} />
					<Route path="/settings" component={Settings} />
					<Route path="/followed" component={FollowedPage} />
					<Route path="/ranking/*page" let:params let:location>
						<RankingPage page={params.page} {location} />
					</Route>
					<Route path="/leaderboard/:type/:leaderboardId/*page" let:params let:location>
						<LeaderboardPage
							leaderboardId={params.leaderboardId}
							type={params.type}
							page={params.page}
							{location}
							dontChangeType={false}
							showCurve={true}
							separatePage={true} />
					</Route>
					<Route path="/leaderboard/approval/:type/:leaderboardId/*page" let:params let:location>
						<LeaderboardPage
							leaderboardId={params.leaderboardId}
							type={params.type}
							page={params.page}
							{location}
							dontChangeType={false}
							showCurve={true}
							separatePage={true}
							showApproveRequest={true} />
					</Route>
					<Route path="/leaderboards/*page" let:params let:location>
						<LeaderboardsPage page={params.page} {location} />
					</Route>
					<Route path="/clan/:clanId/*page" let:params>
						<ClanPage clanId={params.clanId} page={params.page} />
					</Route>
					<Route path="/event/:eventId/*page" let:params let:location>
						<EventPage eventId={params.eventId} page={params.page} {location} />
					</Route>
					<Route path="/events/*page" let:params let:location>
						<EventsPage page={params.page} {location} />
					</Route>
					<Route path="/clans/*page" let:params let:location>
						<ClansPage page={params.page} {location} />
					</Route>
					<Route path="/playlists/*id" let:params>
						<PlaylistsPage index={params.id} />
					</Route>
					<Route path="/playlist/:id" let:params>
						<PlaylistPage id={params.id} />
					</Route>
					<Route path="/twitch" component={TwitchPage} />
					<Route path="/support" component={SupportPage} />
					<Route path="/dashboard" component={DashboardPage} />
					<Route path="/signin/*action" let:params>
						<SigninPage action={params.action} />
					</Route>
					<Route path="/signin/oauth2" let:location>
						<OauthSignInPage {location} />
					</Route>
					<Route path="/*" component={NotFoundPage} />
				</div>
			</main>
		</Modal>
	</Notifications>
</Router>

<PlaylistCart />

{#if $search}
	<Search />
{/if}

<link rel="stylesheet" href="/build/themes/{$configStore.preferences.theme}.css" />

<footer>
	<p class="build">Build: {buildInfo.buildVersion} ({buildInfo.buildDate})</p>
	<ContentBox cls="footer-box">
		<p>
			<a href="https://github.com/BeatLeader/beatleader-website">Source</a>
			|
			<a href="http://api.beatleader.xyz/swagger/index.html">API</a>
			|
			<a href="/about" on:click|preventDefault={() => navigate('/about')}>About</a>
			|
			<a href="/privacy" on:click|preventDefault={() => navigate('/privacy')}>Privacy policy</a>
			|
			<a href="/support" on:click|preventDefault={() => navigate('/support')}>Support</a>
			|
			<a href="/socket" on:click|preventDefault={() => navigate('/socket')}>Scores feed</a>
			|
			<a href="https://twitter.com/beatleader_">Twitter</a>
			|
			<a href="https://discord.gg/2RG5YVqtG6">Discord</a>
			|
			<a href="https://patreon.com/BeatLeader">Patreon</a>
		</p>
	</ContentBox>
</footer>

<style>
	:global(.notifications) {
		position: fixed;
		z-index: 10000;
	}

	:global(.notifications .position-top-left, .notifications .position-top-center, .notifications .position-top-right) {
		top: 3.5rem !important;
	}

	:global(.notification) {
		padding: 0;
		width: 20rem;
	}

	:global(.notification .notification-content) {
		width: auto !important;
	}

	:global(.footer-box) {
		margin: 1em 0 0 0 !important;
		border-radius: 0 !important;
	}

	main {
		margin-top: 1em;
	}
	@media (max-width: 600px) {
		main {
			margin-top: 0;
		}
	}

	.ssr-page-container {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
		min-height: calc(100vh - 9rem);
	}

	.ssr-page-container :global(> *) {
		grid-area: 1 / 1 / 1 / 1;
	}

	.build {
		font-size: 0.875em;
		color: var(--faded);
	}

	footer {
		font-size: 0.75em;
		text-align: center;
	}

	.mobile-tooltip {
		position: fixed;
		z-index: 1000;
		top: 0;
		left: 0;
		min-width: 5rem;
		max-width: 10rem;
		max-height: 5rem;
		overflow: hidden;
		display: none;
		background-color: lightyellow;
		color: gray;
		font-size: 0.75rem;
		padding: 0.125rem;
	}
</style>
