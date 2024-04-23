<script>
	import {onMount} from 'svelte';
	import {navigate} from 'svelte-routing';
	import eventBus from '../../utils/broadcast-channel-pubsub';
	import createAccountStore from '../../stores/beatleader/account';
	import createPlaylistStore from '../../stores/playlists';
	import followed from '../../stores/beatleader/followed';
	import {configStore} from '../../stores/config';
	import {opt} from '../../utils/js';
	import {mobileTouch} from '../../svelte-utils/actions/mobile-touch';
	import {clickOutside} from '../../svelte-utils/actions/click-outside';
	import {isTouchDevice} from '../../utils/is-touch';
	import {search} from '../../stores/search';
	import Dropdown from '../Common/Dropdown.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import PlaylistMenuItem from './PlaylistMenuItem.svelte';
	import MenuLine from '../Player/MenuLine.svelte';
	import LinkMenuItem from './LinkMenuItem.svelte';
	import PlaylistHeaderMenuItem from './PlaylistHeaderMenuItem.svelte';
	import {globalHistory} from 'svelte-routing/src/history';
	import {GLOBAL_LEADERBOARD_TYPE, setLeaderboardType} from '../../utils/format';

	let className = null;
	export {className as class};

	let player = null;
	let settingsNotificationBadge = null;
	let clansNotification = null;

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}`);
	}

	let accountMenuShown = false;
	let mobileMenuShown = false;
	var currenturl;

	onMount(async () => {
		const settingsBadgeUnsubscribe = eventBus.on('settings-notification-badge', message => (settingsNotificationBadge = message));

		const keyDownHandler = e => {
			if (e.ctrlKey === true && e.key === '/') {
				e.preventDefault();

				$search = true;
			}
		};

		document.addEventListener('keydown', keyDownHandler);

		globalHistory.listen(({location, action}) => {
			currenturl = location.href;
		});

		return () => {
			settingsBadgeUnsubscribe();
			document.removeEventListener('keydown', keyDownHandler);
		};
	});

	function checkClanInvites() {
		if ($account?.clanRequest?.length) {
			let clansText = '';
			$account.clanRequest.forEach(clan => {
				clansText += `• ${clan.name} \n`;
			});
			clansNotification =
				`You have ${$account?.clanRequest?.length} clan invite${$account?.clanRequest?.length > 1 ? 's' : ''}: \n` + clansText;
		} else {
			clansNotification = null;
		}
	}

	const playlists = createPlaylistStore();
	const account = createAccountStore();

	let testMenuShown = false;

	var leaderboardTypeOptions = [
		{
			name: 'General',
			id: '',
			logoBig: '/assets/logo.webp',
			logoSmall: '/assets/logo-small.webp',
		},
		{
			name: 'No modifiers',
			id: 'nomods',
			logoBig: '/assets/logo-no-pause.webp',
			logoSmall: '/assets/logo-small-no-pause.webp',
		},
		{
			name: 'No pauses',
			id: 'nopause',
			logoBig: '/assets/logo.webp',
			logoSmall: '/assets/favicon-96x96.webp',
		},
		{
			name: 'Golf',
			id: 'golf',
			logoBig: '/assets/logo.webp',
			logoSmall: '/assets/favicon-96x96.webp',
		},
		{
			name: 'SCPM',
			id: 'scpm',
			logoBig: '/assets/logo.webp',
			logoSmall: '/assets/favicon-96x96.webp',
		},
	];

	let leaderboardType = leaderboardTypeOptions.find(
		t => t.id == GLOBAL_LEADERBOARD_TYPE || (GLOBAL_LEADERBOARD_TYPE == 'general' && t.id == '')
	);

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
							e?.preventDefault();
							e?.stopPropagation();
							accountMenuShown = false;
							navigateToPlayer(player.playerId);
						},
					})),
				];
				signupOptions.push({
					component: LinkMenuItem,
					props: {label: starredFollowed?.length ? 'More Followed...' : 'All Followed...', url: `/followed`},
				});
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
					},
				},
			});

			($playlists ?? []).map((playlist, idx) => {
				if (!playlist.oneclick) {
					signupOptions.push({
						component: PlaylistMenuItem,
						props: {
							playlist,
						},
						class: idx === selectedPlaylist ? 'selected' : '',
						onClick: () => {
							playlists.select(idx === selectedPlaylist ? null : playlist);
						},
					});
				}
			});
		} else {
			signupOptions.push({component: LinkMenuItem, props: {label: 'Log In', url: '/signin'}});
		}
	}

	function normalizedId(id) {
		return id != '' ? id + '.' : '';
	}

	function updateHref() {
		currenturl = window.location.href;
	}
	$: updateHref();
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
	$: $account?.clanRequest ? checkClanInvites() : null;
	$: clanInviteBadgeTitle = clansNotification ? clansNotification : '';
</script>

<nav class={`ssr-page-container ${className ?? ''}`}>
	<div
		class="hovermenu nav-button"
		on:mouseover={() => {
			if (!isTouchDevice()) testMenuShown = true;
		}}
		on:focus={() => {
			if (!isTouchDevice()) testMenuShown = true;
		}}
		on:mouseleave={() => {
			if (!isTouchDevice()) testMenuShown = false;
		}}>
		<a
			class="logo-link"
			href="/"
			on:click|preventDefault={() => {
				if (!isTouchDevice()) navigate('/');
			}}
			use:mobileTouch={() => (testMenuShown = true)}>
			<div class="logo-container desktop-and-up">
				<img src="/assets/logo.webp" class="logo" alt="" />
				<div class="logo-name">
					<span class="name">BEATLEADER</span>
					{#if leaderboardType.id != ''}
						<span class="leaderboard-type">{leaderboardType.name}</span>
					{/if}
				</div>
			</div>

			<div class="logo-container tablet">
				<img src="/assets/logo-small.webp" class="logo" alt="" />
				<div class="logo-name">
					<span class="name">BL</span>
					{#if leaderboardType.id != ''}
						<span class="leaderboard-type">{leaderboardType.name}</span>
					{/if}
				</div>
			</div>

			<div class="logo-container up-to-tablet">
				<img src="/assets/logo-small.webp" class="logo" alt="" />
				{#if leaderboardType.id != 'general'}
					<span class="leaderboard-type">{leaderboardType.name}</span>
				{/if}
			</div>
		</a>
		<Dropdown
			items={isTouchDevice()
				? [
						{
							name: 'Dashboard',
							id: 'dashboard',
						},
						...leaderboardTypeOptions,
				  ]
				: leaderboardTypeOptions}
			bind:shown={testMenuShown}>
			<svelte:fragment slot="row" let:item>
				{#if item.id == 'dashboard'}
					<a href="/">
						{item.name}
					</a>
				{:else}
					<a
						style="display: block; width: 100%"
						href={currenturl.replace(
							location.protocol + '//' + normalizedId(leaderboardType.id),
							location.protocol + '//' + normalizedId(item.id)
						)}>
						<i class={item.icon} />
						{item.name}
					</a>
				{/if}
			</svelte:fragment>
		</Dropdown>
	</div>

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

			<Dropdown
				items={signupOptions}
				bind:shown={accountMenuShown}
				on:select={e => (e.detail.onClick ? e.detail.onClick() : (accountMenuShown = false))}
				noItems="">
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

	<a href="#" on:click|preventDefault={() => ($search = true)} class="mobile-only">
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
		</svg>

		Search
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
					<a href="/clans" title={clanInviteBadgeTitle} on:click|preventDefault={() => navigate('/clans')}>
						<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
							<path
								d="M184 88C184 118.9 158.9 144 128 144C97.07 144 72 118.9 72 88C72 57.07 97.07 32 128 32C158.9 32 184 57.07 184 88zM208.4 196.3C178.7 222.7 160 261.2 160 304C160 338.3 171.1 369.8 192 394.5V416C192 433.7 177.7 448 160 448H96C78.33 448 64 433.7 64 416V389.2C26.16 371.2 0 332.7 0 288C0 226.1 50.14 176 112 176H144C167.1 176 190.2 183.5 208.4 196.3V196.3zM64 245.7C54.04 256.9 48 271.8 48 288C48 304.2 54.04 319.1 64 330.3V245.7zM448 416V394.5C468 369.8 480 338.3 480 304C480 261.2 461.3 222.7 431.6 196.3C449.8 183.5 472 176 496 176H528C589.9 176 640 226.1 640 288C640 332.7 613.8 371.2 576 389.2V416C576 433.7 561.7 448 544 448H480C462.3 448 448 433.7 448 416zM576 330.3C585.1 319.1 592 304.2 592 288C592 271.8 585.1 256.9 576 245.7V330.3zM568 88C568 118.9 542.9 144 512 144C481.1 144 456 118.9 456 88C456 57.07 481.1 32 512 32C542.9 32 568 57.07 568 88zM256 96C256 60.65 284.7 32 320 32C355.3 32 384 60.65 384 96C384 131.3 355.3 160 320 160C284.7 160 256 131.3 256 96zM448 304C448 348.7 421.8 387.2 384 405.2V448C384 465.7 369.7 480 352 480H288C270.3 480 256 465.7 256 448V405.2C218.2 387.2 192 348.7 192 304C192 242.1 242.1 192 304 192H336C397.9 192 448 242.1 448 304zM256 346.3V261.7C246 272.9 240 287.8 240 304C240 320.2 246 335.1 256 346.3zM384 261.7V346.3C393.1 335 400 320.2 400 304C400 287.8 393.1 272.9 384 261.7z" />
						</svg>
						Clans

						{#if clansNotification}<div class="notification-badge" />{/if}
					</a>
				</div>

				<div class="dropdown-item">
					<a
						href="/maps"
						on:click|preventDefault={() => {
							navigate('/maps');
						}}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							xmlns:xlink="http://www.w3.org/1999/xlink"
							version="1.1"
							style="width: 1.4em; height: 1.4em"
							fill="currentColor"
							viewBox="0 -0.000021333333336315263 256 242.00004266666667"
							xml:space="preserve">
							<desc>Created with Fabric.js 5.3.0</desc>
							<defs />
							<g transform="matrix(1.1048905253 0 0 1.1048905253 129.000001 121)" id="Hv0Mln4rOQt0RfN4JTAED">
								<path
									style="stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill-rule: nonzero;"
									transform=" translate(-129.4592048269, -121.9449386269)"
									d="M 45.000389 178.985321 C 45.00045 137.992767 45.189491 97.496063 44.861656 57.003548 C 44.784096 47.424049 54.241299 37.780491 64.001831 37.855831 C 107.327415 38.19025 150.658096 38.15852 193.98439 37.873428 C 203.12883 37.813251 212.811661 45.977306 212.993591 55.486298 C 213.339569 73.568573 213.811829 91.650421 213.935333 109.734474 C 214.098083 133.563858 214.114029 157.39653 213.883713 181.224792 C 213.821442 187.665894 213.30394 194.314758 208.5121 199.491562 C 205.003296 203.282211 201.02977 206.04187 195.477585 206.03447 C 151.149612 205.975357 106.821526 206.00708 62.493473 205.996414 C 53.822044 205.994339 45.304428 197.709274 45.017761 188.980713 C 44.913883 185.817917 45.000626 182.64888 45.000389 178.985321 M 61.998081 74.501007 C 61.998142 110.818878 62.069172 147.13707 61.905449 183.454208 C 61.885727 187.828964 63.081978 189.114273 67.51033 189.096863 C 108.492271 188.935852 149.475342 188.938278 190.457321 189.094498 C 194.831314 189.11116 196.114288 187.925613 196.096756 183.494614 C 195.934601 142.51268 195.937805 101.52961 196.09346 60.547623 C 196.110046 56.177303 194.930069 54.872513 190.494385 54.900955 C 161.174728 55.088959 131.853287 54.998047 102.532417 54.998112 C 90.537514 54.998138 78.541191 55.101215 66.548607 54.934402 C 63.07354 54.886063 61.755344 55.97451 61.939281 59.510906 C 62.181255 64.162987 61.998314 68.837181 61.998081 74.501007 z"
									stroke-linecap="round" />
							</g>
							<g transform="matrix(1.1048905253 0 0 1.1048905253 127.9964442239 91.1615548049)" id="BtC5zti8rEr_z2OL_M3iq">
								<path
									style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill-rule: nonzero;"
									transform=" translate(-128.5509186636, -94.9391452814)"
									d="M 90.715462 98.248207 C 88.056625 96.918488 85.791435 95.59008 83.360916 94.727562 C 76.309387 92.225159 74.808846 84.376251 79.059593 77.598518 C 80.176155 75.818184 83.098114 74.17614 85.203873 74.160065 C 114.335274 73.937668 143.469437 73.941101 172.600922 74.158386 C 174.653503 74.173698 177.382858 75.808907 178.605759 77.535141 C 182.406235 82.899879 179.884796 91.398643 173.976761 94.333504 C 160.161194 101.196495 146.240448 107.852715 132.522049 114.903503 C 127.989937 117.232849 124.640701 114.898148 121.093513 113.207054 C 111.019943 108.404556 101.046471 103.392128 90.715462 98.248207 z"
									stroke-linecap="round" />
							</g>
						</svg>

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
		<a href="#" on:click|preventDefault={() => ($search = true)} class="search-button">
			<div class="search-box">
				<div>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>

					<span>Search...</span>
				</div>

				<span class="search-hint">Ctrl + /</span>
			</div>
		</a>

		<a
			href="/maps"
			on:click|preventDefault={() => {
				navigate('/maps');
			}}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				xmlns:xlink="http://www.w3.org/1999/xlink"
				version="1.1"
				style="width: 1.4em; height: 1.4em"
				fill="currentColor"
				viewBox="0 -0.000021333333336315263 256 242.00004266666667"
				xml:space="preserve">
				<desc>Created with Fabric.js 5.3.0</desc>
				<defs />
				<g transform="matrix(1.1048905253 0 0 1.1048905253 129.000001 121)" id="Hv0Mln4rOQt0RfN4JTAED">
					<path
						style="stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill-rule: nonzero;"
						transform=" translate(-129.4592048269, -121.9449386269)"
						d="M 45.000389 178.985321 C 45.00045 137.992767 45.189491 97.496063 44.861656 57.003548 C 44.784096 47.424049 54.241299 37.780491 64.001831 37.855831 C 107.327415 38.19025 150.658096 38.15852 193.98439 37.873428 C 203.12883 37.813251 212.811661 45.977306 212.993591 55.486298 C 213.339569 73.568573 213.811829 91.650421 213.935333 109.734474 C 214.098083 133.563858 214.114029 157.39653 213.883713 181.224792 C 213.821442 187.665894 213.30394 194.314758 208.5121 199.491562 C 205.003296 203.282211 201.02977 206.04187 195.477585 206.03447 C 151.149612 205.975357 106.821526 206.00708 62.493473 205.996414 C 53.822044 205.994339 45.304428 197.709274 45.017761 188.980713 C 44.913883 185.817917 45.000626 182.64888 45.000389 178.985321 M 61.998081 74.501007 C 61.998142 110.818878 62.069172 147.13707 61.905449 183.454208 C 61.885727 187.828964 63.081978 189.114273 67.51033 189.096863 C 108.492271 188.935852 149.475342 188.938278 190.457321 189.094498 C 194.831314 189.11116 196.114288 187.925613 196.096756 183.494614 C 195.934601 142.51268 195.937805 101.52961 196.09346 60.547623 C 196.110046 56.177303 194.930069 54.872513 190.494385 54.900955 C 161.174728 55.088959 131.853287 54.998047 102.532417 54.998112 C 90.537514 54.998138 78.541191 55.101215 66.548607 54.934402 C 63.07354 54.886063 61.755344 55.97451 61.939281 59.510906 C 62.181255 64.162987 61.998314 68.837181 61.998081 74.501007 z"
						stroke-linecap="round" />
				</g>
				<g transform="matrix(1.1048905253 0 0 1.1048905253 127.9964442239 91.1615548049)" id="BtC5zti8rEr_z2OL_M3iq">
					<path
						style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill-rule: nonzero;"
						transform=" translate(-128.5509186636, -94.9391452814)"
						d="M 90.715462 98.248207 C 88.056625 96.918488 85.791435 95.59008 83.360916 94.727562 C 76.309387 92.225159 74.808846 84.376251 79.059593 77.598518 C 80.176155 75.818184 83.098114 74.17614 85.203873 74.160065 C 114.335274 73.937668 143.469437 73.941101 172.600922 74.158386 C 174.653503 74.173698 177.382858 75.808907 178.605759 77.535141 C 182.406235 82.899879 179.884796 91.398643 173.976761 94.333504 C 160.161194 101.196495 146.240448 107.852715 132.522049 114.903503 C 127.989937 117.232849 124.640701 114.898148 121.093513 113.207054 C 111.019943 108.404556 101.046471 103.392128 90.715462 98.248207 z"
						stroke-linecap="round" />
				</g>
			</svg>

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

		<a href="/clans" title={clanInviteBadgeTitle} on:click|preventDefault={() => navigate('/clans')} class="tablet-and-up">
			<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"
				><path
					d="M184 88C184 118.9 158.9 144 128 144C97.07 144 72 118.9 72 88C72 57.07 97.07 32 128 32C158.9 32 184 57.07 184 88zM208.4 196.3C178.7 222.7 160 261.2 160 304C160 338.3 171.1 369.8 192 394.5V416C192 433.7 177.7 448 160 448H96C78.33 448 64 433.7 64 416V389.2C26.16 371.2 0 332.7 0 288C0 226.1 50.14 176 112 176H144C167.1 176 190.2 183.5 208.4 196.3V196.3zM64 245.7C54.04 256.9 48 271.8 48 288C48 304.2 54.04 319.1 64 330.3V245.7zM448 416V394.5C468 369.8 480 338.3 480 304C480 261.2 461.3 222.7 431.6 196.3C449.8 183.5 472 176 496 176H528C589.9 176 640 226.1 640 288C640 332.7 613.8 371.2 576 389.2V416C576 433.7 561.7 448 544 448H480C462.3 448 448 433.7 448 416zM576 330.3C585.1 319.1 592 304.2 592 288C592 271.8 585.1 256.9 576 245.7V330.3zM568 88C568 118.9 542.9 144 512 144C481.1 144 456 118.9 456 88C456 57.07 481.1 32 512 32C542.9 32 568 57.07 568 88zM256 96C256 60.65 284.7 32 320 32C355.3 32 384 60.65 384 96C384 131.3 355.3 160 320 160C284.7 160 256 131.3 256 96zM448 304C448 348.7 421.8 387.2 384 405.2V448C384 465.7 369.7 480 352 480H288C270.3 480 256 465.7 256 448V405.2C218.2 387.2 192 348.7 192 304C192 242.1 242.1 192 304 192H336C397.9 192 448 242.1 448 304zM256 346.3V261.7C246 272.9 240 287.8 240 304C240 320.2 246 335.1 256 346.3zM384 261.7V346.3C393.1 335 400 320.2 400 304C400 287.8 393.1 272.9 384 261.7z" /></svg>
			Clans

			{#if clansNotification}<div class="notification-badge" />{/if}
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

	.logo-link {
		height: 100%;
		display: flex;
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

	.name {
		font-family: 'Audiowide';
		letter-spacing: 0.2em;
		font-size: 0.9em;
		margin-top: 0.3em;
	}

	.leaderboard-type {
		color: #9f9f9f;
		font-size: 0.8em;
		font-weight: 600;
		margin-top: -0.2em;
	}

	.logo-container.desktop-and-up {
		display: flex;
	}

	.logo-container.up-to-tablet {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 0.1em;
	}

	.logo-container.tablet {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.1em;
	}

	.desktop-and-up .logo-name {
		display: flex;
		align-items: center;
		flex-direction: column;
		justify-content: center;
	}

	.desktop-and-up .logo {
		width: 6em;
		height: 3em;
		margin-top: -0.4em;
		margin-left: -0.4em;
	}

	.up-to-tablet .logo {
		margin: 0;
		margin-top: -0.3em;
		height: 2.5em;
		width: 2.5em;
		padding: 0;
		aspect-ratio: 1;
		max-width: none;
	}

	.tablet .logo-name {
		display: flex;
		align-items: center;
		flex-direction: column;
		justify-content: center;
	}

	.tablet .name {
		margin-top: -0.1em;
		margin-left: 0.3em;
	}

	.tablet .logo {
		height: 2.5em;
		width: 2.5em;
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

	.mobile-only {
		display: none !important;
	}

	.search-hint {
		display: none !important;
	}

	@media (pointer: coarse) {
		nav :global(.dropdown-item) {
			min-height: 2rem;
			line-height: 2rem;
		}
	}

	@media (hover: hover) and (pointer: fine) and (min-width: 835px) {
		.search-hint {
			display: inline-block !important;
			opacity: 0.6;
			justify-content: center;
			align-items: center;
			padding: 0.125em 0.25em;
			margin: 0 0 0 0.5rem;
			border: 1px solid var(--textColor);
			border-radius: 2px;
			font-size: 0.875em;
			color: var(--textColor);
		}
	}

	@media screen and (min-width: 1022px) {
		.logo-container.tablet {
			display: none !important;
		}
	}

	@media screen and (min-width: 768px) {
		.search-button {
			flex: 1;
			margin-inline: auto;
			max-width: 35rem;
		}
		.search-button:hover {
			background-color: transparent !important;
		}
		.search-box {
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 100%;
			height: 100%;
			margin-inline: 1rem;
			border: 1px solid var(--faded);
			background-color: var(--dimmed);
			padding-inline: 0.5rem !important;
			font-size: 0.875em !important;
			overflow: hidden;
		}
		:global(.mirror) .search-box,
		:global(.mirror-low) .search-box {
			border-color: var(--textColor);
			background-color: rgba(255, 255, 255, 0.13);
			border: none;
			border-bottom: 2px solid white;
			border-radius: 0.4em;
		}
		.search-box > :first-child {
			display: inline-flex;
			align-items: center;
		}
		.search-box > svg {
			margin-right: 0.5rem;
			min-width: 1.25rem;
		}
		.search-box > span {
			display: inline-block;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.logo-container.up-to-tablet {
			display: none !important;
		}
	}

	@media screen and (max-width: 767px) {
		.mobile-only {
			display: inline-flex !important;
		}

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
		.logo-container.tablet {
			display: none !important;
		}
	}

	@media screen and (max-width: 1023px) {
		.search-box {
			margin-inline: 0.5rem;
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
