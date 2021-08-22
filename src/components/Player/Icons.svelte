<script>
  import createPlayersStore from '../../stores/scoresaber/players'
  import createTwitchService from '../../services/twitch'
  import {configStore} from '../../stores/config'
  import eventBus from '../../utils/broadcast-channel-pubsub'
  import {opt} from '../../utils/js'
  import Button from '../Common/Button.svelte'
  import {onMount} from 'svelte'
  import TwitchLinkModal from './TwitchLinkModal.svelte'

  export let playerId;

  let playersStore = createPlayersStore();
  const twitchService = createTwitchService();

  let twitchToken = null;

  let showLinkingModal = false;

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

  async function onTwitchLink(event) {
    if (!opt(event, 'detail.id')) return;

    await twitchService.updatePlayerProfile({...event.detail, playerId, profileLastUpdated: new Date()})

    showLinkingModal = false;
  }

  onMount(async () => {
    twitchToken = await twitchService.getCurrentToken();
  })

  $: isMain = configStore && playerId && opt($configStore, 'users.main') === playerId;
  $: isFriend = playerId && !!$playersStore.find(p => p.playerId === playerId);
</script>

{#if playerId}
  <nav class:main={isMain}>
    {#if !isMain}
      <Button title="Set as your profile" iconFa="fas fa-home" type="primary"
              on:click={onSetAsMain}
      />

      <Button title={isFriend ? "Remove from Friends" : "Add to Friends"}
              iconFa={isFriend ? "fas fa-user-minus" : "fas fa-user-plus"} type={isFriend ? "danger" : "primary"}
              on:click={() => onFriendsChange(isFriend ? 'remove' : 'add')}
      />
    {/if}

    {#if twitchToken}
      <Button type="twitch" iconFa="fab fa-twitch" title="Link Twitch profile"
              on:click={() => showLinkingModal = true}
      />
    {/if}
  </nav>
{/if}

{#if twitchToken}
  <TwitchLinkModal {playerId} show={showLinkingModal}
                   on:link={onTwitchLink} on:cancel={() => showLinkingModal = false}
  />
{/if}

<style>
    nav {
        position: absolute;
        top: 0;
        left: calc(50% - 50px);
        text-align: left;
        font-size: .75rem;
        z-index: 15;
        width: 100px;
    }

    nav :global(button) {
        border-radius: 50% !important;
        transition: all 200ms !important;
    }

    nav :global(button):nth-child(1) {
        transform: translate3d(-40px, 60px, 0);
    }

    nav :global(button):nth-child(1):hover {
        transform: translate3d(-40px, 60px, 0) scale(1.2);
    }

    nav :global(button):nth-child(2) {
        transform: translate3d(-50px, 24px, 0);
    }

    nav :global(button):nth-child(2):hover {
        transform: translate3d(-50px, 24px, 0) scale(1.2);
    }

    nav :global(button):nth-child(3) {
        transform: translate3d(-47px, 0px, 0);
    }

    nav :global(button):nth-child(3):hover {
        transform: translate3d(-47px, 0px, 0) scale(1.2);
    }
</style>