<script>
  import eventBus from '../utils/broadcast-channel-pubsub'
  import { getContext } from 'svelte'
  import {navigate} from 'svelte-routing'
  import { ROUTER, } from 'svelte-routing/src/contexts'
  import createFriendsStore from '../stores/scoresaber/friends'
  import Dropdown from './Common/Dropdown.svelte'
  import MenuLine from './Player/MenuLine.svelte'
  import QueueStats from './Common/QueueStats.svelte'

  const { activeRoute } = getContext(ROUTER);

  function onFriendClick(event) {
    if (!event.detail) return;

    friendsMenuShown = false;

    if (!$activeRoute || !$activeRoute.uri || !$activeRoute.uri.startsWith('/u/'))
    {
      navigate(`/u/${event.detail.playerId}`)
    } else {
      eventBus.publish('navigate-to-player-cmd', event.detail.playerId)
    }
  }

  const friends = createFriendsStore();

  let friendsMenuShown = false;
</script>

<nav>
  <div on:click={() => navigate('/')}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
    Home
  </div>

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

    nav svg {
        width: 1.25rem;
        height: 1.25rem;
        margin-right: .5rem;
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

        nav svg {
            margin-right: 0;
        }
    }
</style>