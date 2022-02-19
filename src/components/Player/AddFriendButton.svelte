<script>
  import {configStore} from "../../stores/config";
  import {opt} from "../../utils/js";
  import createPlayersStore from "../../stores/beatleader/players";
  import eventBus from "../../utils/broadcast-channel-pubsub";

  export let playerId = null;

  let playersStore = createPlayersStore();

  function onClick(operation) {
    if (!playerId || !operation) return;

    switch (operation) {
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

{#if isMain}
  <div class="fas fa-home icon main-profile" title="This is your profile"></div>
{:else}
  <div class={isFriend ? "fas fa-user-minus icon remove-friend" : "fas fa-user-plus icon add-friend"}
       on:click={() => onClick(isFriend ? 'remove' : 'add')}
       title={isFriend ? "Remove from Friends" : "Add to Friends"}>
  </div>
{/if}

<style>
    .icon {
        display: grid;
        width: 2em;
        height: 2em;
        color: white;
        border-radius: .4em;
    }

    .icon.main-profile {
        background: var(--faded);
    }

    .icon.remove-friend {
        background: var(--decrease);
        cursor: pointer;
    }

    .icon.remove-friend:hover {
        background: var(--decrease) linear-gradient(0deg, transparent, #ffffff66);
    }

    .icon.add-friend {
        background: var(--alternate);
        cursor: pointer;
    }

    .icon.add-friend:hover {
        background: var(--alternate) linear-gradient(0deg, transparent, #ffffff66);
    }
</style>