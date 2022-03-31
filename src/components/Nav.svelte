<script>
  import eventBus from '../utils/broadcast-channel-pubsub'
  import {onMount} from 'svelte'
  import {navigate} from 'svelte-routing'
  import createFriendsStore from '../stores/beatleader/friends'
  import createAccountStore from '../stores/beatleader/account'
  import createPlaylistStore from '../stores/playlists'
  import {configStore} from '../stores/config'
  import createPlayerService from '../services/beatleader/player'
  import Dropdown from './Common/Dropdown.svelte'
  import MenuLine from './Player/MenuLine.svelte'
  import QueueStats from './Common/QueueStats.svelte'
  import {opt} from '../utils/js'
  import {fade} from 'svelte/transition'
  import Settings from './Others/Settings.svelte'
  import Button from "./Common/Button.svelte";

  const playerService = createPlayerService();

  let player = null;
  let settingsNotificationBadge = null;
  let loggedInPlayer = null;

  function navigateToPlayer(playerId) {
    if (!playerId) return;

    navigate(`/u/${playerId}/beatleader/date/1`);
  }

  function onAccountClicked(event, playerId) {
    if (event.srcElement.innerText == "Migrate" || event.srcElement.innerText == "Log In") {
      navigate(`/signin`)
    } else if (event.srcElement.innerText == "Log Out") {
      account.logOut();
    } else if (playerId) {
      navigateToPlayer(playerId)
    }    
  }

  function onFriendClick(event) {
    if (!event.detail) return;

    friendsMenuShown = false;

    navigateToPlayer(event.detail.playerId);
  }

  function onPlaylistClick(event) {
    if (!event.detail) return;

    playlistMenuShown = false;

    playlists.select(event.detail);
  }

  async function updateMainPlayer(playerId) {
    if (!playerId) {
      player = null;
      return;
    }

    player = await playerService.get(playerId);
  }

  onMount(async () => {
    const playerChangedUnsubscribe = eventBus.on('player-profile-changed', player => {
      if (mainPlayerId && player && player.playerId === mainPlayerId) updateMainPlayer(mainPlayerId)
    })

    const settingsBadgeUnsubscribe = eventBus.on('settings-notification-badge', message => settingsNotificationBadge = message);

    const settingsOpenUnsubscribe = eventBus.on('show-settings', () => {
      showSettings = !showSettings;
    })

    return () => {
      playerChangedUnsubscribe();
      settingsBadgeUnsubscribe();
      settingsOpenUnsubscribe();
    }
  })

  const friends = createFriendsStore();
  const playlists = createPlaylistStore();
  const account = createAccountStore();

  let friendsMenuShown = false;
  let playlistMenuShown = false;
  let accountMenuShown = false;
  let mobileMenuShown = false;

  let showSettings = false;

  $: selectedPlaylist = opt($configStore, 'selectedPlaylist');
  $: mainPlayerId = opt($configStore, 'users.main');
  $: loggedInPlayer = $account.id;
  $: updateMainPlayer(mainPlayerId)
  $: newSettingsAvailable = $configStore ? configStore.getNewSettingsAvailable() : undefined;
  $: notificationBadgeTitle = (settingsNotificationBadge ? [settingsNotificationBadge + '\n'] : []).concat(newSettingsAvailable ? ['New settings are available:'].concat(newSettingsAvailable) : []).join('\n');
</script>

<nav class="ssr-page-container">
  <a href="/dashboard" on:click|preventDefault={() => navigate('/dashboard')}>
    <img src="/assets/logo.png" class="logo desktop-and-up" alt="" onmouseover="this.src='/assets/logopepe.png'"
    onmouseout="this.src='/assets/logo.png'" />
    <img src="/assets/favicon-96x96.png" class="logo up-to-tablet" alt="" />
  </a>

  {#if player}
  <a href={`/u/${player.playerId}/beatleader/date/1`} class="me" on:click={(e) => { e.preventDefault(); onAccountClicked(e, player.playerId) }} transition:fade on:mouseover={() => accountMenuShown = true} on:focus={() => accountMenuShown = true} on:mouseleave={() => accountMenuShown = false}>
    {#if opt(player, 'playerInfo.avatar')}
      <img src={player.playerInfo.avatar} class="avatar" alt="" />
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    {/if}

    Me

    <Dropdown items={loggedInPlayer ? ["Migrate", "Log Out"] : ["Log In"]} shown={accountMenuShown} noItems="">
      <svelte:fragment slot="row" let:item>
        <div>
          <span class="accountMenuItem">{item}</span>
        </div>
      </svelte:fragment>
    </Dropdown>
  </a>
  {:else}
  <a href={`/signin`} transition:fade>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>

    Account
  </a>
  {/if}
  

  <div class="friends" on:mouseover={() => friendsMenuShown = true} on:focus={() => friendsMenuShown = true} on:mouseleave={() => friendsMenuShown = false}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>

    Friends

    <Dropdown items={$friends} shown={friendsMenuShown} on:select={onFriendClick} noItems="No friends, add someone">
      <svelte:fragment slot="row" let:item>
        <MenuLine player={item} withRank={false} />
      </svelte:fragment>
    </Dropdown>
  </div>

  <a href="/ranking/global" on:click|preventDefault={() => navigate('/ranking/global')}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clip-rule="evenodd" />
    </svg>

    Ranking
  </a>

  <a href="/leaderboards" on:click|preventDefault={() => navigate('/leaderboards')}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>

    Maps
  </a>

  <div class="right mobile-menu"  on:mouseover={() => mobileMenuShown = true} on:focus={() => mobileMenuShown = true} on:mouseleave={() => mobileMenuShown = false}>
    <div class="hamburger">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
    </div>

    <div class="dropdown-menu left" class:shown={mobileMenuShown}>
      <div class="dropdown-content">
        <div class="dropdown-item">
          <a href="/playlists" on:click|preventDefault={() => navigate('/search')}>
            <i class="fas fa-list-ul"></i>

            Playlists
          </a>

          <div>
            {#if selectedPlaylist !== null && $playlists[selectedPlaylist]}
              <figure class="selected-playlist">
                <div class="playlistInfo">
                  <img class="playlistImage" src="{$playlists[selectedPlaylist].image}" alt="PlaylistImage"/>
                  <span class="playlistTitle">{$playlists[selectedPlaylist].playlistTitle}</span>
                </div>
              </figure>
            {/if}

            <Dropdown items={[{firstRow: true}].concat($playlists.length ? $playlists : [])} shown={true} on:select={onPlaylistClick}>
              <svelte:fragment slot="row" let:item>
                {#if item.firstRow}
                  <div class="playlistButtonsContainer">
                    <Button type="primary" iconFa="fas fa-plus-square" label="New" on:click={() => playlists.create()}/>
                    <Button type="primary" iconFa="fas fa-external-link-alt" label="Details" on:click={() => navigate('/playlists')}/>
                  </div>
                {:else}
                  <figure>
                    <div class="playlistInfo">
                      <img class="playlistImage" src="{item.image}" alt="PlaylistImage"/>
                      <span class="playlistTitle">{item.playlistTitle} - {item.songs.length} songs</span>
                    </div>
                  </figure>
                {/if}
              </svelte:fragment>
            </Dropdown>
          </div>
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
          <a class="settings" title={notificationBadgeTitle} on:click={() => showSettings = true}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>

            Settings

            {#if settingsNotificationBadge || newSettingsAvailable}<div class="notification-badge"></div>{/if}
          </a>
        </div>
      </div>
    </div>
  </div>

  <div class="right">
    <div class="playlists" on:mouseover={() => playlistMenuShown = true} on:focus={() => playlistMenuShown = true} on:mouseleave={() => playlistMenuShown = false}>
      {#if selectedPlaylist !== null && $playlists[selectedPlaylist]}
      <figure>
        <div class="playlistInfo">
            <img class="playlistImage" src="{$playlists[selectedPlaylist].image}" alt="PlaylistImage"/>
            <span class="playlistTitle">{$playlists[selectedPlaylist].playlistTitle}</span>
        </div>
      </figure>
      {:else}
      <i class="fas fa-list-ul"></i>
      Playlists
      {/if}
  
      <Dropdown items={[{firstRow: true}].concat($playlists.length ? $playlists : [])} shown={playlistMenuShown} on:select={onPlaylistClick}>
        <svelte:fragment slot="row" let:item>
          {#if item.firstRow}
          <div class="playlistButtonsContainer">
            <Button type="primary" iconFa="fas fa-plus-square" label="New" on:click={() => playlists.create()}/>
            <Button type="primary" iconFa="fas fa-external-link-alt" label="Details" on:click={() => navigate('/playlists')}/>
          </div>
          {:else}
          <figure>
            <div class="playlistInfo">
                <img class="playlistImage" src="{item.image}" alt="PlaylistImage"/>
                <span class="playlistTitle">{item.playlistTitle} - {item.songs.length} songs</span>
            </div>
          </figure>
          {/if}
        </svelte:fragment>
      </Dropdown>
    </div>

    <a href="/search" on:click|preventDefault={() => navigate('/search')}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      Search
    </a>

    <div class="settings" title={notificationBadgeTitle} on:click={() => showSettings = true}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>

      Settings

      {#if settingsNotificationBadge || newSettingsAvailable}<div class="notification-badge"></div>{/if}
    </div>
  </div>

  <QueueStats />
</nav>

<Settings bind:show={showSettings} />

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

    nav > *:not(.right), nav > .right > *:not(.dropdown-menu) {
        display: inline-flex;
        justify-content: flex-start;
        align-items: center;
        height: 100%;
        font-size: 1rem;
        padding: .5rem .5rem;
        cursor: pointer;
        position: relative;
    }

    nav > *:not(.right):hover, nav > .right > *:not(.dropdown-menu):hover {
        background-color: var(--selected);
    }

    nav a {
        color: inherit!important;
    }

    .friends {
        position: relative;
    }

    .friends :global(.dropdown-menu), .me :global(.dropdown-menu) {
        width: 15rem !important;
        max-width: 60vw;
    }

    .playlists {
        position: relative;
    }

    .playlists :global(.dropdown-menu) {
        width: 15rem !important;
        max-width: 60vw;
    }

    .playlists :global(.dropdown-item:first-child):hover {
        background: transparent!important;
    }

    .playlistImage {
      height: 1.5em;
      width: 1.5em;
    }

    .playlistTitle {
      bottom: 0.3em;
      position: relative;
    }

    .playlistButtonsContainer {
      display: flex;
      justify-content: space-between;
      font-size: .875rem;
      font-weight: 500;
    }

    .logo {
      height: 2.5rem;
      margin-top: 0.1em;
    }

    .logo.up-to-tablet {
      height: 3em;
      width: 2.5em;
      margin-top: -0.1em;
      margin-left: -1em;
      margin-right: -1em;
      max-width: none;
    }

    nav svg, nav .avatar {
        width: 1.25rem;
        height: 1.25rem;
        margin-right: .5rem;
    }

    nav .avatar {
        border-radius: 50%;
    }

    nav .right {
        flex: 1;
        padding: 0;
        display: flex;
        justify-content: flex-end;
    }

    .settings {
        position: relative;
    }

    .notification-badge {
        position: absolute;
        top: .65rem;
        left: 1.75rem;
        width: .5em;
        height: .5em;
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

    .accountMenuItem {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        width: 4em;
    }

    .right.mobile-menu {
        display: none;
    }

    @media screen and (max-width: 450px) {
        nav {
            height: 3.5rem;
        }

        nav > *:not(.right), nav > .right > * {
            flex: 1;
            border-right: 1px solid var(--dimmed);
            flex-direction: column;
            font-size: .75rem;
        }
        nav > *:last-child, nav > .right > *:last-child {
            border-right: none;
        }

        nav svg, nav .avatar {
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
            justify-content: center!important;
            height: 3.5rem!important;
        }

        .mobile-menu .hamburger svg {
            margin-right: 0;
        }

        .mobile-menu .dropdown-menu {
            max-width: 16rem;
        }

        .mobile-menu .dropdown-item > a {
            display: flex;
            align-items: center;
        }

        .mobile-menu svg {
            margin-right: .25rem;
        }

        .mobile-menu .dropdown-menu :global(.dropdown-menu) {
            position: relative;
            border: none;
        }

        .mobile-menu .dropdown-menu :global(.dropdown-item:hover) {
            background: transparent!important;
        }

        .mobile-menu .selected-playlist .playlistInfo {
            margin-top: .5rem;
            margin-left: 1rem;
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
</style>