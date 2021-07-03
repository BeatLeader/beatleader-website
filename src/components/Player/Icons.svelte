<script>
  import {onMount} from 'svelte';
  import createPlayersStore from '../../stores/scoresaber/players'
  import {fade} from 'svelte/transition'
  import Button from '../Common/Button.svelte'
  import createConfigStore from '../../stores/config'
  import eventBus from '../../utils/broadcast-channel-pubsub'
  import {opt} from '../../utils/js'

  export let playerId;

  let playersStore = createPlayersStore();

  let configStore = null;
  onMount(async () => {
    configStore = await createConfigStore();
  })

  function onSetAsMain() {
    if (!configStore || !playerId) return;

    const newConfig = {...$configStore}
    if (!newConfig.users) newConfig.users = {};
    newConfig.users.main = playerId;

    $configStore = newConfig;

    eventBus.publish('player-add-cmd', {playerId});
  }

  function onFriendsChange(op) {
    if (!playerId || !op) return;

    switch (op) {
      case 'add':
        eventBus.publish('player-add-cmd', {playerId});
        break;
      case 'remove':
        eventBus.publish('player-remove-cmd', {playerId});
        break;
    }
  }

  $: isMain = configStore && playerId && opt($configStore, 'users.main') === playerId;
  $: isFriend = playerId && !!$playersStore.find(p => p.playerId === playerId);
</script>

{#if playerId}
  <nav transition:fade>
    {#if !isMain}
      <Button title="Set as your profile" iconFa="fas fa-user-check" type="primary"
              on:click={onSetAsMain}
      />

      <Button title={isFriend ? "Remove from Friends" : "Add to Friends"}
              iconFa="far fa-star" type={isFriend ? "danger" : "primary"}
              on:click={() => onFriendsChange(isFriend ? 'remove' : 'add')}
      />
    {/if}
  </nav>
{/if}

<style>
    nav {
        position: absolute;
        top: 0;
        left: 0;
        text-align: center;
        font-size: .75rem;
        z-index: 100;
        width: calc(100% - 1rem);
    }

    nav :global(button) {
        border-radius: 50% !important;
        transition: all 200ms !important;
    }

    nav :global(button):nth-child(1) {
        transform: translate3d(-50px, 30px, 0);
    }

    nav :global(button):nth-child(2) {
        transform: translate3d(-50px, 4px, 0);
    }

    nav :global(button):nth-child(1):hover {
        transform: translate3d(-50px, 30px, 0) scale(1.2);
    }

    nav :global(button):nth-child(2):hover {
        transform: translate3d(-50px, 4px, 0) scale(1.2);
    }
</style>