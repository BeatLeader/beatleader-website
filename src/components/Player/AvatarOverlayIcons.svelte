<script>
  import createPlayersStore from '../../stores/beatleader/players'
  import createTwitchService from '../../services/twitch'
  import {configStore} from '../../stores/config'
  import createAccountStore from '../../stores/beatleader/account'
  import eventBus from '../../utils/broadcast-channel-pubsub'
  import {opt} from '../../utils/js'
  import {SsrHttpResponseError} from '../../network/errors'
  import {createEventDispatcher, onMount} from 'svelte'
  import createClanService from '../../services/beatleader/clan'
  import Button from '../Common/Button.svelte'
  import TwitchLinkModal from './TwitchLinkModal.svelte'
  import Dialog from '../Common/Dialog.svelte'
  import Error from '../Common/Error.svelte'

  export let playerId;

  const dispatch = createEventDispatcher();

  let playersStore = createPlayersStore();
  const account = createAccountStore();
  const twitchService = createTwitchService();
  const clanService = createClanService();

  let twitchToken = null;
  let playerTwitchProfile = null;

  let showLinkingModal = false;

  function onSetAsMain(remove) {
    if (!configStore || !playerId) return;

    const newConfig = {...$configStore}
    if (remove) {
      newConfig.users.main = null;

      eventBus.publish('player-remove-cmd', {playerId});
    } else {

      if (!newConfig.users) newConfig.users = {};
      newConfig.users.main = playerId;

      eventBus.publish('player-add-cmd', {playerId});
    }

    $configStore = newConfig;

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

    playerTwitchProfile = event.detail;

    await twitchService.updatePlayerProfile({...event.detail, playerId, profileLastUpdated: new Date()})

    showLinkingModal = false;
  }

  async function onPlayerChanged(playerId) {
    if (!playerId) return;

    playerTwitchProfile = await twitchService.getPlayerProfile(playerId)
  }

  onMount(async () => {
    twitchToken = await twitchService.getCurrentToken();
  })

  let fileinput;
  const changeAvatar = (e) => {
      let image = e.target.files[0];
      let reader = new FileReader();
      reader.readAsArrayBuffer(image);
      reader.onload = async e => {
        try {
          dispatch('player-data-edit-error', null);

          if (loggedInPlayer === playerId) {
            await account.changeAvatar(e.target.result);
          } else {
            await account.changeAvatar(e.target.result, playerId);
          }

          dispatch('player-data-updated', {avatar: e.target.result})
        }
        catch(err) {
          dispatch('player-data-edit-error', err);
        }
      };
  }

  let invitationConfirmationType = null;
  let invitingError = null;
  async function onInvite(playerId) {
    if (!playerId?.length) return;

    try {
      invitingError = null;

      await clanService.invite(playerId);

      invitationConfirmationType = null;
    } catch (err) {
      if (err instanceof SsrHttpResponseError) {
        const htmlError = await err.getResponse().text();
        invitingError = htmlError?.length ? htmlError : err;
      } else {
        invitingError = err;
      }
    }
  }

  async function onCancelInvite(playerId) {
    if (!playerId?.length) return;

    try {
      invitingError = null;

      await clanService.cancelInvite(playerId);

      invitationConfirmationType = null;
    } catch (err) {
      if (err instanceof SsrHttpResponseError) {
        const htmlError = await err.getResponse().text();
        invitingError = htmlError?.length ? htmlError : err;
      } else {
        invitingError = err;
      }
    }
  }

  $: onPlayerChanged(playerId);
  $: isProfileLinkedToTwitch = !!playerTwitchProfile?.login ?? false;
  $: mainIsSet = !!$configStore?.users?.main ?? false;
  $: isMain = configStore && playerId && opt($configStore, 'users.main') === playerId;
  $: loggedInPlayer = $account.id;
  $: isFriend = playerId && !!$playersStore.find(p => p.playerId === playerId);
  $: isAdmin = $account.player && $account.player.role && $account.player.role.includes("admin");
  $: showAvatarIcons = $configStore?.preferences?.iconsOnAvatars ?? 'only-when-needed';

  $: isUserFounderOfTheClan = !!$account?.clan;
  $: isPlayerClanMember = isUserFounderOfTheClan && !!$account?.clan?.players?.find(pId => pId === playerId);
  $: hasPlayerPendingInvitation = isUserFounderOfTheClan && !isPlayerClanMember && !!$account?.clan?.pendingInvites?.find(pId => pId === playerId)
</script>

{#if playerId}
  {#if invitationConfirmationType}
    <Dialog type="confirm" title="Are you sure?" okButton="Yeah!" cancelButton="Hell no!"
            on:confirm={() => invitationConfirmationType === 'invite' ? onInvite(playerId) : onCancelInvite(playerId)}
            on:cancel={() => invitationConfirmationType = false}
    >
      <div slot="content">
        {#if invitationConfirmationType === 'invite'}
          <div>An invitation will be sent to the player to join the clan.</div>
        {:else}
          <div>The player's invitation to the clan will be cancelled.</div>
        {/if}

        {#if invitingError}
          <Error error={invitingError} />
        {/if}
      </div>
    </Dialog>
  {/if}

  <nav class:main={isMain}>
    {#if (!loggedInPlayer || !mainIsSet) && (showAvatarIcons === 'show' || (showAvatarIcons === 'only-when-needed' && !mainIsSet))}
      <Button title={isMain ? "Remove your profile" : "Set as your profile"} iconFa="fas fa-home"
              type={isMain ? "danger" : "primary"}
              on:click={() => onSetAsMain(isMain)}
      />
    {/if}

    {#if !isMain && (showAvatarIcons === 'show' || (showAvatarIcons === 'only-when-needed' && !isFriend))}
      <Button title={isFriend ? "Remove from Friends" : "Add to Friends"}
              iconFa={isFriend ? "fas fa-user-minus" : "fas fa-user-plus"} type={isFriend ? "danger" : "primary"}
              on:click={() => onFriendsChange(isFriend ? 'remove' : 'add')}
      />
    {/if}

    {#if twitchToken && (showAvatarIcons === 'show' || (showAvatarIcons === 'only-when-needed' && !isProfileLinkedToTwitch))}
      <Button type="twitch" iconFa="fab fa-twitch"
              title={`${isProfileLinkedToTwitch ? 'Re-link' : 'Link'} Twitch profile`}
              on:click={() => showLinkingModal = true}
      />
    {/if}

    {#if !isPlayerClanMember && !hasPlayerPendingInvitation}
      <Button type="primary" iconFa="fas fa-users"
              title="Invite player to the clan"
              on:click={() => invitationConfirmationType = 'invite'}
      />
    {:else if hasPlayerPendingInvitation}
      <Button type="danger" iconFa="fas fa-users-slash"
              title="Cancel invitation to the clan"
              on:click={() => invitationConfirmationType = 'cancel'}
      />
    {/if}

    {#if (isMain && loggedInPlayer === playerId) || isAdmin}
    <div class="imageInput" on:click={() => fileinput.click()}>
      <input style="display:none" type="file" accept=".jpg, .jpeg, .png, .gif" on:change={(e)=>changeAvatar(e)} bind:this={fileinput} >
      <span class="imageChange">
          <h3 class="changeLabel">Change</h3>
      </span>
    </div>
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
        transform: translate3d(-35px, 60px, 0);
    }

    nav :global(button):nth-child(1):hover {
        transform: translate3d(-35px, 60px, 0) scale(1.2);
    }

    nav :global(button):nth-child(2) {
        transform: translate3d(-50px, 21px, 0);
    }

    nav :global(button):nth-child(2):hover {
        transform: translate3d(-50px, 21px, 0) scale(1.2);
    }

    nav :global(button):nth-child(3) {
        transform: translate3d(-47px, -7px, 0);
    }

    nav :global(button):nth-child(3):hover {
        transform: translate3d(-47px, -7px, 0) scale(1.2);
    }

    nav :global(button):nth-child(4) {
        transform: translate3d(50px, -45px, 0);
    }

    nav :global(button):nth-child(4):hover {
        transform: translate3d(50px, -45px, 0) scale(1.2);
    }

    .imageInput {
        cursor: pointer;
        display: flex;
        position: absolute;
        width: 130px;
        height: 130px;
        margin-left: -5px;
        margin-top: -40px;
    }

    .imageChange {
        transition: opacity .2s ease-in-out;
        background-color: rgba(32,33,36,0.6);
        bottom: 0;
        height: 33%;
        left: 0;
        opacity: 0;
        position: absolute;
        right: 0;
        display: flex;
        justify-content: center;
    }

    .imageInput:hover .imageChange {
        opacity: 1;
    }

    .changeLabel {
        top: 30%;
        position: absolute;
    }
</style>