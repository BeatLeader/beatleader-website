<script>
  import eventBus from '../utils/broadcast-channel-pubsub'
  import {getContext, onMount} from 'svelte'
  import {navigate} from 'svelte-routing'
  import { ROUTER, } from 'svelte-routing/src/contexts'
  import createFriendsStore from '../stores/scoresaber/friends'
  import createConfigStore from '../stores/config'
  import createPlayerService from '../services/scoresaber/player'
  import Dropdown from './Common/Dropdown.svelte'
  import MenuLine from './Player/MenuLine.svelte'
  import QueueStats from './Common/QueueStats.svelte'
  import {opt} from '../utils/js'
  import {fade} from 'svelte/transition'

  const { activeRoute } = getContext(ROUTER);

  const playerService = createPlayerService();

  let configStore = null;
  let player = null;

  function navigateToPlayer(playerId) {
    if (!playerId) return;

    if (!$activeRoute || !$activeRoute.uri || !$activeRoute.uri.startsWith('/u/'))
    {
      navigate(`/u/${playerId}`)
    } else {
      eventBus.publish('navigate-to-player-cmd', playerId)
    }
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
    configStore = await createConfigStore();

    const playerChangedUnsubscribe = eventBus.on('player-profile-changed', player => {
      if (mainPlayerId && player && player.playerId === mainPlayerId) updateMainPlayer(mainPlayerId)
    })

    return () => {
      playerChangedUnsubscribe();
    }
  })

  const friends = createFriendsStore();

  let friendsMenuShown = false;

  $: mainPlayerId = opt($configStore, 'users.main');
  $: updateMainPlayer(mainPlayerId)
</script>

<nav>
  {#if player}
  <div on:click={() => navigateToPlayer(player.playerId)} transition:fade>
    {#if opt(player, 'playerInfo.avatar')}
      <img src={player.playerInfo.avatar} class="avatar" alt="" />
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    {/if}

    Me
  </div>
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

  <div on:click={() => navigate('/global')}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>

    Ranking
  </div>

  <div on:click={() => navigate('/search')}>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>

    Search
  </div>

  <QueueStats />
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
    }

    nav > * {
        display: inline-flex;
        justify-content: flex-start;
        align-items: center;
        height: 100%;
        font-size: 1rem;
        padding: .5rem 1rem;
        cursor: pointer;
    }

    nav > *:hover {
        background-color: var(--selected);
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

    @media screen and (max-width: 450px) {
        nav {
            height: 3.5rem;
        }

        nav > * {
            flex: 1;
            border-right: 1px solid var(--dimmed);
            flex-direction: column;
            font-size: .75rem;
        }
        nav > *:last-child {
            border-right: none;
        }

        nav svg, nav .avatar {
            margin-right: 0;
        }
    }
</style>