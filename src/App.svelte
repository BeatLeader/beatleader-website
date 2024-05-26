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
	import LeaderboardsLoloppe from './pages/LeaderboardsLoloppe.svelte';
	import ClanPage from './pages/Clan.svelte';
	import ClansPage from './pages/Clans.svelte';
	import FollowedPage from './pages/Followed.svelte';
	import PlayerPage from './pages/Player.svelte';
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
	import {importFonts, setGlobalCSSValue} from './utils/color';
	import ContentBox from './components/Common/ContentBox.svelte';
	import PlaylistCart from './components/Playlists/PlaylistCart.svelte';
	import Search from './components/Search/Search.svelte';
	import LandingPage from './pages/LandingPage.svelte';
	import CensusPage from './pages/Census.svelte';
	import SurveyAchievementPage from './pages/SurveyAchievement.svelte';
	import PatreonPage from './pages/Patreon.svelte';
	import DeveloperPortalPage from './pages/DeveloperPortal.svelte';
	import produce from 'immer';
	import Maps from './pages/Maps.svelte';
	import Replayed from './pages/Replayed.svelte';
	import ReplayedLanding from './pages/ReplayedLanding.svelte';
	import ClansMap from './pages/ClansMap.svelte';
	import NotificationComponent from './components/Common/NotificationComponent.svelte';
	import SongSuggestMap from './pages/SongSuggestMap.svelte';
	import GigaMap from './pages/GigaMap.svelte';

	import rewindTimer from './stores/rewind-timer';
	import {padNumber} from './utils/format';

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

		window.addEventListener('keydown', event => {
			if (event.altKey && event.code === 'KeyF') {
				$search = true;
				event.preventDefault();
				event.stopPropagation();
			}
		});
	});

	$: if (mainEl) containerStore.observe(mainEl);

	if ($configStore.preferences.theme != 'default') {
		setGlobalCSSValue('background-image', 'url(' + $configStore.preferences.bgimage + ')');
		setGlobalCSSValue('customizable-color-1', $configStore.preferences.bgColor);
		setGlobalCSSValue('customizable-color-2', $configStore.preferences.headerColor);
		setGlobalCSSValue('font-names', $configStore.preferences.fontNames);

		if ($configStore.preferences.theme == 'mirror') {
			importFonts($configStore.preferences.fontNames);
		}
	}
</script>

<div bind:this={mobileTooltip} class="mobile-tooltip" />
<div class="main-background" />
{#if $account?.player && $configStore.preferences.followersBecomingPublic}
	<div class="reebanner">
		<a class="reelink" href="/settings#profile" />
		<span class="link-text">Followers will be public, adjust your preferences!</span>
		<button
			class="close-banner"
			title="Hide banner"
			on:click|preventDefault|stopPropagation={() => {
				$configStore = produce($configStore, draft => {
					draft.preferences.followersBecomingPublic = false;
				});
			}}><i class="fas fa-xmark" /></button>
	</div>
{/if}
<!-- {#if $configStore.preferences.replayedbanner}
	<div class="replayedbanner">
		<a class="reelink" href="/replayed" />
		<div class="banner-spacer" />
		<img class="cover-1" src="https://eu.cdn.beatsaver.com/dd90f0e236c73c1a0565634bfd7eb168c0e81b58.jpg" />
		<span class="replayed-link-text">Your 2023 rePlayed is here!</span>

		<img class="cover-2" src="https://eu.cdn.beatsaver.com/4d03502003602e8e8f0d9f8c84a3e70da0c389f6.jpg" />
		<img class="cover-3" src="https://eu.cdn.beatsaver.com/3b2005183b2ac76c2a65f34540ebb6fd293ddb38.jpg" />
		<img class="cover-4" src="https://eu.cdn.beatsaver.com/6be290e33fd748cd678d4c38f1d59e582a44045f.jpg" />
		<img class="cover-5" src="https://eu.cdn.beatsaver.com/8931f3f17f8f5259c076660c986b816d7e86d708.jpg" />
		<img class="cover-6" src="https://eu.cdn.beatsaver.com/b97774a83bdfd669e1bd231039cccfa1162efa13.jpg" />
		<button
			class="close-banner"
			title="Hide banner"
			on:click|preventDefault|stopPropagation={() => {
				$configStore = produce($configStore, draft => {
					draft.preferences.replayedbanner = false;
				});
			}}><i class="fas fa-xmark" /></button>
	</div>
{/if} -->
<!--{#if $rewindTimer && $configStore.preferences.ccWinterHighlights24}
	<div class="rewindbanner">
		<a class="reelink" href="https://www.youtube.com/watch?v=9dr-M1hfCLo" />
		<div class="banner-spacer" />
		<img class="cc-cover-1" src="/assets/cc-logo-left.webp" />

		<div class="rewind-text-and-timer">
			{#if $rewindTimer.seconds > 0}
				<span class="replayed-link-text desktop-only">Cube Community Winter Highlights in</span>
				<span class="replayed-link-text mobile-only">CC Winter Highlights in</span>

				<div class="timer">
					<div class="rewind-time">
						<span>{padNumber($rewindTimer.hours)}</span>
						<label class="desktop-only">Hours</label>
						<label class="mobile-only">H</label>
					</div>

					<div class="rewind-time">
						<span>{padNumber($rewindTimer.minutes)}</span>
						<label class="desktop-only">Minutes</label>
						<label class="mobile-only">M</label>
					</div>

					<div class="rewind-time">
						<span>{padNumber(parseInt($rewindTimer.seconds, 10))}</span>
						<label class="desktop-only">Seconds!</label>
						<label class="mobile-only">S!</label>
					</div>
				</div>
			{:else}
				<span class="replayed-link-text">Cube Community Winter Highlights NOW! 🔴</span>
			{/if}
		</div>
		<img class="cc-cover-2" src="/assets/cc-logo-right.webp" />

		<button
			class="close-banner"
			title="Hide banner"
			on:click|preventDefault|stopPropagation={() => {
				$configStore = produce($configStore, draft => {
					draft.preferences.ccWinterHighlights24 = false;
				});
			}}><i class="fas fa-xmark" /></button>
	</div>
{/if}-->
<Router {url}>
	<Nav class={$configStore?.preferences?.theme} />
	<Notifications zIndex={10000} item={NotificationComponent}>
		<Modal closeButton={false} styleWindow={{width: '90vw', height: '65vh'}} styleContent={{padding: 0, 'margin-bottom': '-0.5em'}}>
			<main bind:this={mainEl} class={$configStore?.preferences?.theme}>
				<div class="ssr-page-container">
					<Route path="/">
						{#if $account?.player}
							<DashboardPage />
						{:else if $account?.refreshError}
							<LandingPage />
						{/if}
					</Route>
					<Route path="/u/:initialPlayerId/*initialParams" let:params let:location>
						<PlayerPage initialPlayerId={params.initialPlayerId} initialParams={params.initialParams} {location} />
					</Route>
					<Route path="/staff" let:location>
						<StaffDashboard {location} />
					</Route>
					<Route path="/privacy" component={PrivacyPage} />
					<Route path="/about" component={AboutPage} />
					<Route path="/socket" component={Socket} />
					<Route path="/settings" component={Settings} />
					<Route path="/followed" component={FollowedPage} />
					<Route path="/census2023" component={CensusPage} />
					<Route path="/survey/achievement" component={SurveyAchievementPage} />
					<Route path="/supporting-project/link">
						<PatreonPage action="linkPatreon" />
					</Route>
					<Route path="/supporting-project" component={PatreonPage} />
					<Route path="/ranking/*page" let:params let:location>
						<RankingPage page={params.page} {location} />
					</Route>
					<Route path="/leaderboard/:type/:leaderboardId/*page" let:params let:location>
						<LeaderboardPage
							leaderboardId={params.leaderboardId}
							type={params.type}
							page={params.page}
							{location}
							showCurve={true}
							separatePage={true} />
					</Route>
					<Route path="/leaderboard/approval/:type/:leaderboardId/*page" let:params let:location>
						<LeaderboardPage
							leaderboardId={params.leaderboardId}
							type={params.type}
							page={params.page}
							{location}
							showCurve={true}
							separatePage={true}
							showApproveRequest={true} />
					</Route>
					<Route path="/leaderboards/*page" let:params let:location>
						<LeaderboardsPage page={params.page} {location} />
					</Route>
					<Route path="/leaderboards/loloppe/*page" let:params let:location>
						<LeaderboardsLoloppe page={params.page} {location} />
					</Route>

					<Route path="/maps">
						<Maps />
					</Route>
					<Route path="/replayed">
						<ReplayedLanding />
					</Route>
					<Route path="/replayed/player/*id" let:params>
						<Replayed playerId={params.id ? params.id : null} />
					</Route>
					<Route path="/replayed/mapper/*id" let:params>
						<Replayed replayedType="mapper" playerId={params.id ? params.id : null} />
					</Route>
					<Route path="/event/:eventId/*page" let:params let:location>
						<EventPage eventId={params.eventId} page={params.page} {location} />
					</Route>
					<Route path="/events/*page" let:params let:location>
						<EventsPage page={params.page} {location} />
					</Route>
					<Route path="/clan/:clanId/*page" let:params let:location>
						<ClanPage clanId={params.clanId} page={params.page} {location} />
					</Route>
					<Route path="/clan/maps/:clanId/*page" let:params let:location>
						<ClanPage clanId={params.clanId} page={params.page} maps={true} {location} />
					</Route>
					<Route path="/clans/*page" let:params let:location>
						<ClansPage page={params.page} {location} />
					</Route>
					<Route path="/clansmap/leaderboard/*leaderboardId" let:params let:location>
						<ClansMap leaderboardId={params.leaderboardId} {location} />
					</Route>
					<Route path="/clansmap" let:location>
						<ClansMap {location} />
					</Route>
					<Route path="/songsuggestmap/leaderboard/*leaderboardId" let:params let:location>
						<SongSuggestMap leaderboardId={params.leaderboardId} {location} />
					</Route>
					<Route path="/songsuggestmap" let:location>
						<SongSuggestMap {location} />
					</Route>
					<Route path="/datavis/gigamap50" let:location>
						<GigaMap {location} topCount={50} />
					</Route>
					<Route path="/datavis/gigamap1000" let:location>
						<GigaMap {location} topCount={1000} />
					</Route>
					<Route path="/datavis/gigamap5000" let:location>
						<GigaMap {location} topCount={5000} />
					</Route>
					<Route path="/clansmap/clan/*clanTag" let:params let:location>
						<ClansMap clanTag={params.clanTag} {location} />
					</Route>
					<Route path="/playlists/*id" let:params>
						<PlaylistsPage index={params.id} />
					</Route>
					<Route path="/playlist/:id" let:params>
						<PlaylistPage id={params.id} />
					</Route>
					<Route path="/help" component={SupportPage} />
					<Route path="/dashboard" component={DashboardPage} />
					<Route path="/signin/*action" let:params>
						<SigninPage action={params.action} />
					</Route>
					<Route path="/signin/oauth2" let:location>
						<OauthSignInPage {location} />
					</Route>
					<Route path="/developer" let:params let:location>
						<DeveloperPortalPage {location} />
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
			<a href="/about" on:click|preventDefault={() => navigate('/about')}>About</a>
			|
			<a href="/developer">Developer Portal</a>
			|
			<a href="https://beatleader.wiki/">Wiki</a>
			|
			<a href="https://github.com/BeatLeader/beatleader-website">Source</a>
			|
			<a href="/privacy" on:click|preventDefault={() => navigate('/privacy')}>Privacy policy</a>
			|
			<a href="/help" on:click|preventDefault={() => navigate('/help')}>Help</a>
			|
			<a href="/socket" on:click|preventDefault={() => navigate('/socket')}>Scores feed</a>
			|
			<a href="https://twitter.com/beatleader_">Twitter</a>
			|
			<a href="https://discord.gg/2RG5YVqtG6">Discord</a>
			|
			<a href="https://patreon.com/BeatLeader">Patreon</a>
			|
			<a href="https://beatleader.xyz/supporting-project/link">Claim rewards</a>
		</p>
	</ContentBox>
</footer>

<style>
	.reebanner {
		background-color: rgb(48, 23, 23);
		color: white;
		font-size: large;
		height: 3em;
		width: 100%;
		display: flex;
		justify-content: center;
		justify-items: center;
		align-items: center;
		margin-bottom: -0.1em;

		overflow: visible;
		pointer-events: none;
	}

	.replayedbanner {
		background-color: rgb(99 0 178);
		color: white;
		font-size: large;
		height: 3em;
		width: 100%;
		display: flex;
		justify-content: space-between;
		justify-items: center;
		align-items: center;
		margin-bottom: -0.1em;

		overflow: visible;
		pointer-events: none;
	}

	.rewindbanner {
		background-color: #355870;
		color: white;
		font-size: large;
		height: 3em;
		width: 100%;
		display: flex;
		justify-content: space-between;
		justify-items: center;
		align-items: center;
		margin-bottom: -0.1em;

		overflow: visible;
		pointer-events: none;
	}

	.timer {
		display: flex;
		gap: 0.3em;
	}

	.rewind-text-and-timer {
		display: flex;
		gap: 0.3em;
		margin-right: 0.8em;
		justify-content: center;
	}

	.rewind-time {
		display: flex;
		gap: 0.3em;
	}

	.reelink {
		position: absolute;
		width: 100%;
		height: 3em;
		z-index: 102;
		pointer-events: auto;
	}

	.link-text {
		z-index: 101;
		font-weight: 800;
		color: cornflowerblue;
	}

	.replayed-link-text {
		z-index: 101;
		font-weight: 800;
		color: #20a0ee;
	}

	.banner-spacer {
		width: 3em;
	}

	.close-banner {
		border: none;
		color: white;
		background-color: transparent;
		cursor: pointer;
		width: 3em;
		z-index: 104;
		pointer-events: auto;
	}

	.reesaber-red {
		height: 8em;
		position: absolute;
		right: 65%;
		top: -1.1em;
		z-index: 100;
	}
	.reesaber-blue {
		height: 8em;
		position: absolute;
		left: 65%;
		top: -1.1em;
		z-index: 100;
	}

	.cover-1 {
		height: 4em;
		position: absolute;
		left: 25%;
		top: -0.7em;
		transform: rotateZ(7deg);
		z-index: 100;
		border-radius: 8px;
		box-shadow: 2px 11px 7px #0000007a;
	}

	.cover-2 {
		height: 3em;
		position: absolute;
		left: 10%;
		top: 0.5em;
		transform: rotateZ(350deg);
		z-index: 100;
		border-radius: 8px;
		box-shadow: 2px 11px 7px #0000007a;
	}

	.cover-3 {
		height: 2em;
		position: absolute;
		left: 19%;
		top: -0.2em;
		transform: rotateZ(3deg);
		z-index: 100;
		border-radius: 6px;
		box-shadow: 1px 5px 7px #0000007a;
	}

	.cover-4 {
		height: 4em;
		position: absolute;
		right: 7%;
		top: -0.7em;
		transform: rotateZ(4deg);
		z-index: 100;
		border-radius: 8px;
		box-shadow: 2px 11px 7px #0000007a;
	}

	.cover-5 {
		height: 3em;
		position: absolute;
		right: 18%;
		top: 0.6em;
		transform: rotateZ(10deg);
		z-index: 100;
		border-radius: 8px;
		box-shadow: 2px 11px 7px #0000007a;
	}

	.cover-6 {
		height: 4em;
		position: absolute;
		right: 25%;
		top: -1.4em;
		transform: rotateZ(349deg);
		z-index: 100;
		border-radius: 8px;
		box-shadow: 2px 11px 7px #0000007a;
	}

	.cc-cover-1 {
		height: 3.5em;
		position: absolute;
		left: 14%;
		z-index: 100;
	}

	.cc-cover-2 {
		height: 3.5em;
		position: absolute;
		right: 14%;
		z-index: 100;
	}

	.cc-cover-1 {
		height: 3.5em;
		position: absolute;
		left: 14%;
		z-index: 100;
	}

	.cc-cover-2 {
		height: 3.5em;
		position: absolute;
		right: 14%;
		z-index: 100;
	}

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
	.mobile-only {
		display: none;
	}
	@media (max-width: 1000px) {
		.rewind-text-and-timer {
			flex-direction: column;
			align-items: center;
			gap: 0;
		}

		.timer {
			margin-top: -0.3em;
		}
	}
	.mobile-only {
		display: none;
	}
	@media (max-width: 1000px) {
		.rewind-text-and-timer {
			flex-direction: column;
			align-items: center;
			gap: 0;
		}

		.timer {
			margin-top: -0.3em;
		}
	}
	@media (max-width: 600px) {
		main {
			margin-top: 0;
		}

		.reesaber-red {
			right: 5%;
			top: -1.9em;
		}

		.reesaber-blue {
			display: none;
		}
		.cover-1 {
			left: 65%;
		}
		.cover-3 {
			left: 45%;
		}
		.cover-4 {
			display: none;
		}
		.cover-5 {
			display: none;
		}
		.cover-6 {
			display: none;
		}
		.link-text {
			color: white;
			text-shadow: 3px 3px black;
			padding: 0.6em;
		}

		.replayed-link-text {
			color: white;
			text-shadow: 3px 3px black;
			margin-bottom: 0.2em;
		}

		.rewind-text-and-timer {
			max-width: 60%;
			text-align: center;
			flex-wrap: wrap;
		}

		.cc-cover-1 {
			left: 10%;
		}

		.cc-cover-2 {
			right: 10%;
		}

		.mobile-only {
			display: block;
		}
		.desktop-only {
			display: none;
		}

		.rewind-text-and-timer {
			max-width: 60%;
			text-align: center;
			flex-wrap: wrap;
		}

		.cc-cover-1 {
			left: 10%;
		}

		.cc-cover-2 {
			right: 10%;
		}

		.mobile-only {
			display: block;
		}
		.desktop-only {
			display: none;
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
		overflow: hidden;
		display: none;
		background-color: lightyellow;
		color: gray;
		font-size: 0.75rem;
		padding: 0.125rem;
	}
</style>
