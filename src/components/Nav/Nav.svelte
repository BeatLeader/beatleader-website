<script>
	import eventBus from '../../utils/broadcast-channel-pubsub';
	import {onMount} from 'svelte';
	import {navigate} from 'svelte-routing';
	import createAccountStore from '../../stores/beatleader/account';
	import followed from '../../stores/beatleader/followed';
	import createPlaylistStore from '../../stores/playlists';
	import {configStore} from '../../stores/config';
	import {opt} from '../../utils/js';
	import {mobileTouch} from '../../svelte-utils/actions/mobile-touch';
	import {clickOutside} from '../../svelte-utils/actions/click-outside';
	import {isTouchDevice} from '../../utils/is-touch';
	import Dropdown from '../Common/Dropdown.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import SelectedPlaylist from './PlaylistMenuItem.svelte';
	import MenuLine from '../Player/MenuLine.svelte';
	import LinkMenuItem from './LinkMenuItem.svelte';
	import PlaylistHeaderMenuItem from './PlaylistHeaderMenuItem.svelte';

	let player = null;
	let settingsNotificationBadge = null;

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}`);
	}

	let accountMenuShown = false;
	let mobileMenuShown = false;

	onMount(async () => {
		const settingsBadgeUnsubscribe = eventBus.on('settings-notification-badge', message => (settingsNotificationBadge = message));

		return () => {
			settingsBadgeUnsubscribe();
		};
	});

	const playlists = createPlaylistStore();
	const account = createAccountStore();

	let signupOptions = [];

	function calculateSignUpOptions(loggedInUser) {
		signupOptions =
			isTouchDevice() && player
				? [{component: LinkMenuItem, props: {label: 'My profile', url: `/u/${player.playerId}`, class: 'touch-only'}}]
				: [];

		const isStaff = $account?.player?.playerInfo?.role
			?.split(',')
			?.some(role => ['admin', 'rankedteam', 'juniorrankedteam', 'creator', 'qualityteam'].includes(role));

		if (loggedInUser.player) {
			if (isStaff) signupOptions.push({component: LinkMenuItem, props: {label: 'Staff Dashboard', url: '/staff'}});

			signupOptions.push({
				component: LinkMenuItem,
				props: {
					label: 'Log Out',
					callback: () => {
						account.logOut();
						navigate('/');
					},
				},
			});

			// followed
			if ($followed?.length) {
				signupOptions.push({class: 'dropdown-divider'});

				signupOptions = [
					...signupOptions,
					...starredFollowed.map(player => ({
						component: MenuLine,
						props: {player, withRank: false},
						onClick: e => {
							e.preventDefault();
							e.stopPropagation();
							accountMenuShown = false;
							navigateToPlayer(player.playerId);
						},
					})),
				];
				signupOptions.push({component: LinkMenuItem, props: {label: 'More Followed...', url: `/followed`}});
			}

			// playlists
			if (signupOptions.length) signupOptions.push({class: 'dropdown-divider'});

			signupOptions.push({
				component: PlaylistHeaderMenuItem,
			});

			signupOptions.push({
				component: LinkMenuItem,
				props: {
					label: 'Add new...',
					callback: async () => {
						playlists.create();
						navigate('/playlists');
					},
				},
			});

			($playlists ?? []).map((playlist, idx) => {
				signupOptions.push({
					component: SelectedPlaylist,
					props: {
						playlist,
					},
					class: idx === selectedPlaylist ? 'selected' : '',
					onClick: () => {
						playlists.select(playlist);
					},
				});
			});
		} else {
			signupOptions.push({component: LinkMenuItem, props: {label: 'Log In', url: '/signin'}});
		}
	}

	$: player = $account?.player;
	$: starredFollowedIds = player?.profileSettings?.starredFriends ?? [];
	$: starredFollowed =
		$followed?.filter(f => starredFollowedIds.includes(f?.playerId))?.sort((a, b) => a?.name?.localeCompare(b?.name)) ?? [];
	$: selectedPlaylist = $configStore?.selectedPlaylist;
	$: calculateSignUpOptions($account, $playlists, selectedPlaylist);
	$: newSettingsAvailable = $configStore ? configStore.getNewSettingsAvailable() : undefined;
	$: notificationBadgeTitle = (settingsNotificationBadge ? [settingsNotificationBadge + '\n'] : [])
		.concat(newSettingsAvailable ? ['New settings are available:'].concat(newSettingsAvailable) : [])
		.join('\n');
</script>

<nav class="ssr-page-container">
	<a href="/public" on:click|preventDefault={() => navigate('/')}>
		<img src="/assets/logo.png" class="logo desktop-and-up" alt="" />
		<img src="/assets/favicon-96x96.png" class="logo up-to-tablet" alt="" />
	</a>

	{#if player}
		<div class="me nav-button">
			<a
				href={`/u/${player.playerId}`}
				on:click|preventDefault={() => {
					if (!isTouchDevice()) navigateToPlayer(player.playerId);
				}}
				use:mobileTouch={() => (accountMenuShown = !accountMenuShown)}>
				{#if opt(player, 'playerInfo.avatar')}
					<Avatar {player} />
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				{/if}

				Me
			</a>

			<Dropdown items={signupOptions} bind:shown={accountMenuShown} noItems="">
				<svelte:fragment slot="row" let:item>
					<svelte:component
						this={item.component}
						{...item.props ?? {}}
						on:click={item.onClick
							? item.onClick
							: () => {
									accountMenuShown = false;
							  }} />
				</svelte:fragment>
			</Dropdown>
		</div>
	{:else}
		<a href={`/signin`}>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>

			Account
		</a>
	{/if}

	<a href="/ranking/1" on:click|preventDefault={() => navigate('/ranking/1')}>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
			<path
				fill-rule="evenodd"
				d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z"
				clip-rule="evenodd" />
		</svg>

		Ranking
	</a>

	<a href="/clans" on:click|preventDefault={() => navigate('/clans')}>
		<svg fill="white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"
			><path
				d="M184 88C184 118.9 158.9 144 128 144C97.07 144 72 118.9 72 88C72 57.07 97.07 32 128 32C158.9 32 184 57.07 184 88zM208.4 196.3C178.7 222.7 160 261.2 160 304C160 338.3 171.1 369.8 192 394.5V416C192 433.7 177.7 448 160 448H96C78.33 448 64 433.7 64 416V389.2C26.16 371.2 0 332.7 0 288C0 226.1 50.14 176 112 176H144C167.1 176 190.2 183.5 208.4 196.3V196.3zM64 245.7C54.04 256.9 48 271.8 48 288C48 304.2 54.04 319.1 64 330.3V245.7zM448 416V394.5C468 369.8 480 338.3 480 304C480 261.2 461.3 222.7 431.6 196.3C449.8 183.5 472 176 496 176H528C589.9 176 640 226.1 640 288C640 332.7 613.8 371.2 576 389.2V416C576 433.7 561.7 448 544 448H480C462.3 448 448 433.7 448 416zM576 330.3C585.1 319.1 592 304.2 592 288C592 271.8 585.1 256.9 576 245.7V330.3zM568 88C568 118.9 542.9 144 512 144C481.1 144 456 118.9 456 88C456 57.07 481.1 32 512 32C542.9 32 568 57.07 568 88zM256 96C256 60.65 284.7 32 320 32C355.3 32 384 60.65 384 96C384 131.3 355.3 160 320 160C284.7 160 256 131.3 256 96zM448 304C448 348.7 421.8 387.2 384 405.2V448C384 465.7 369.7 480 352 480H288C270.3 480 256 465.7 256 448V405.2C218.2 387.2 192 348.7 192 304C192 242.1 242.1 192 304 192H336C397.9 192 448 242.1 448 304zM256 346.3V261.7C246 272.9 240 287.8 240 304C240 320.2 246 335.1 256 346.3zM384 261.7V346.3C393.1 335 400 320.2 400 304C400 287.8 393.1 272.9 384 261.7z" /></svg>
		Clans
	</a>

	<div class="right mobile-menu nav-button" use:mobileTouch={() => (mobileMenuShown = !mobileMenuShown)}>
		<div class="hamburger">
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
				><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
		</div>

		<div
			class="dropdown-menu left"
			class:shown={mobileMenuShown}
			use:clickOutside={{callback: () => (mobileMenuShown = false), parent: '.nav-button'}}>
			<div class="dropdown-content">
				<div class="dropdown-item">
					<a
						href="/leaderboards"
						on:click|preventDefault={() => {
							navigate('/leaderboards');
						}}>
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>

						Maps
					</a>
				</div>

				<div class="dropdown-item">
					<a
						href="/events"
						on:click|preventDefault={() => {
							navigate('/events');
						}}>
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>

						Events
					</a>
				</div>

				<div class="dropdown-item">
					<a href="/search" on:click|preventDefault={() => navigate('/search')}>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>

						Search
					</a>
				</div>

				<div class="dropdown-item">
					<a href="/settings" title={notificationBadgeTitle} on:click|preventDefault={() => navigate('/settings')}>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>

						Settings

						{#if settingsNotificationBadge || newSettingsAvailable}<div class="notification-badge" />{/if}
					</a>
				</div>
			</div>
		</div>
	</div>

	<div class="right">
		<a
			href="/leaderboards"
			on:click|preventDefault={() => {
				navigate('/leaderboards');
			}}>
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>

			Maps
		</a>

		<a
			href="/events"
			on:click|preventDefault={() => {
				navigate('/events');
			}}>
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>

			Events
		</a>

		<a href="/search" on:click|preventDefault={() => navigate('/search')}>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>

			Search
		</a>

		<a href="/settings" title={notificationBadgeTitle} on:click|preventDefault={() => navigate('/settings')}>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>

			Settings

			{#if settingsNotificationBadge || newSettingsAvailable}<div class="notification-badge" />{/if}
		</a>
	</div>
</nav>

<style>
	nav {
		position: sticky;
		top: 0;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		height: 2.75rem;
		background-color: var(--foreground);
		border-bottom: 1px solid var(--dimmed);
		z-index: 50;
		box-shadow: 0 8px 10px rgba(0, 0, 0, 0.23), 0 5px 15px rgba(0, 0, 0, 0.18);
	}

	nav > *:not(.right),
	nav > .right > *:not(.dropdown-menu),
	.me > a {
		display: inline-flex;
		justify-content: flex-start;
		align-items: center;
		height: 100%;
		font-size: 1rem;
		padding: 0.25rem 0.5rem;
		cursor: pointer;
		position: relative;
	}

	.me :global(.dropdown-item.selected) {
		background-color: var(--beatleader-primary);
	}

	nav > *:not(.right):hover,
	nav > .right > *:not(.dropdown-menu):hover {
		background-color: var(--selected);
	}

	nav a {
		color: inherit !important;
	}

	.ssr-page-container > a {
		user-select: none;
	}

	.playlists {
		position: relative;
	}

	.playlists :global(.dropdown-menu) {
		width: 15rem !important;
		max-width: 60vw;
	}

	.playlists :global(.dropdown-item:first-child):hover {
		background: transparent !important;
	}

	.playlistButtonsContainer {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.logo {
		height: 2.5rem;
		margin-top: 0.1em;
	}

	.logo.up-to-tablet {
		height: 100%;
		padding: 0;
		margin: 0;
		aspect-ratio: 1;
		max-width: none;
	}

	nav svg,
	nav .me :global(figure) {
		width: 1.25rem;
		height: 1.25rem;
		margin-right: 0.5rem;
	}

	nav .me :global(.dropdown-menu) {
		width: 15rem !important;
		max-width: 60vw;
	}

	nav .right {
		flex: 1;
		padding: 0;
		display: flex;
		justify-content: flex-end;
		height: 100%;
	}

	.notification-badge {
		position: absolute;
		top: 0.65rem;
		left: 1.75rem;
		width: 0.5em;
		height: 0.5em;
		background-color: red;
		border-radius: 50%;
		animation: pulse 1.5s infinite;
	}

	.fa-list-ul {
		width: 1.25rem;
		height: 1.1rem;
		margin-top: 0.15rem;
		margin-left: 0.25em;
		padding-right: 1.5em;
	}

	.right.mobile-menu {
		display: none;
	}

	.right > a {
		user-select: none;
	}

	@media screen and (max-width: 900px) {
		nav {
			height: 3.5rem;
		}

		nav > *:not(.right),
		nav > .right > *,
		.me > a {
			flex: 1;
			border-right: 1px solid var(--dimmed);
			flex-direction: column;
			font-size: 0.75rem;
		}
		nav > *:last-child,
		nav > .right > *:last-child,
		nav > .right.mobile-menu,
		nav .hamburger,
		.me > a {
			border-right: none;
		}

		nav svg,
		nav .me :global(figure) {
			margin-right: 0;
		}

		nav .right {
			display: none;
		}

		.right.mobile-menu {
			display: flex;
			align-items: center;
		}

		.mobile-menu .hamburger {
			justify-content: center !important;
			height: 3.5rem !important;
		}

		.mobile-menu .hamburger svg {
			margin-right: 0;
		}

		.mobile-menu .dropdown-menu {
			max-width: 16rem;
			margin-top: -1em;
		}

		.mobile-menu .dropdown-item > a {
			display: flex;
			align-items: center;
		}

		.mobile-menu svg {
			margin-right: 0.25rem;
		}

		.mobile-menu .dropdown-menu :global(.dropdown-menu) {
			position: relative;
			border: none;
		}

		.mobile-menu .dropdown-menu :global(.dropdown-item:hover) {
			background: transparent !important;
		}

		.mobile-menu .selected-playlist .playlistInfo {
			margin-top: 0.5rem;
			margin-left: 1rem;
		}

		.notification-badge {
			left: 0.75rem;
		}
	}

	@keyframes pulse {
		0% {
			transform: scale(1.05);
			box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7);
		}

		70% {
			transform: scale(1);
			box-shadow: 0 0 0 10px rgba(255, 0, 0, 0);
		}

		100% {
			transform: scale(1.05);
			box-shadow: 0 0 0 0 rgba(255, 0, 0, 0);
		}
	}

	@media (pointer: fine) {
		.nav-button:hover :global(> *) {
			display: block;
		}
	}

	.touch-only {
		display: none;
	}

	@media (pointer: coarse) {
		.touch-only {
			display: block;
		}
	}
</style>
