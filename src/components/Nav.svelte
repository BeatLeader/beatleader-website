<script>
  import eventBus from '../utils/broadcast-channel-pubsub'
  import {onMount} from 'svelte'
  import {navigate} from 'svelte-routing'
  import createFriendsStore from '../stores/scoresaber/friends'
  import {configStore} from '../stores/config'
  import createPlayerService from '../services/scoresaber/player'
  import Dropdown from './Common/Dropdown.svelte'
  import MenuLine from './Player/MenuLine.svelte'
  import QueueStats from './Common/QueueStats.svelte'
  import {opt} from '../utils/js'
  import {fade} from 'svelte/transition'
  import Settings from './Others/Settings.svelte'

  const playerService = createPlayerService();

  let player = null;

  function navigateToPlayer(playerId) {
    if (!playerId) return;

    navigate(`/u/${playerId}/recent/1`)
  }

  function onFriendClick(event) {
    if (!event.detail) return;

    friendsMenuShown = false;

    navigateToPlayer(event.detail.playerId);
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

    return () => {
      playerChangedUnsubscribe();
    }
  })

  const friends = createFriendsStore();

  let friendsMenuShown = false;

  let showSettings = false;

  $: mainPlayerId = opt($configStore, 'users.main');
  $: updateMainPlayer(mainPlayerId)
</script>

<nav>
  {#if player}
  <a href={`/u/${player.playerId}/recent/1`} on:click|preventDefault={() => navigateToPlayer(player.playerId)} transition:fade>
    {#if opt(player, 'playerInfo.avatar')}
      <img src={player.playerInfo.avatar} class="avatar" alt="" />
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    {/if}

    Me
  </a>
  {/if}

  <div class="friends" on:mouseover={() => friendsMenuShown = true} on:mouseleave={() => friendsMenuShown = false}>
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

  <div class="right">
    <a href="/search" on:click|preventDefault={() => navigate('/search')}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      Search
    </a>

    <div on:click={() => showSettings = true}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>

      Settings
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
    }

    nav > *, nav > .right > * {
        display: inline-flex;
        justify-content: flex-start;
        align-items: center;
        height: 100%;
        font-size: 1rem;
        padding: .5rem 1rem;
        cursor: pointer;
    }

    nav > *:not(.right):hover, nav > .right > *:hover {
        background-color: var(--selected);
    }

    nav a {
        color: inherit!important;
    }

    .friends {
        position: relative;
    }

    .friends :global(.dropdown-menu) {
        width: 15rem !important;
        max-width: 60vw;
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
    }
</style>