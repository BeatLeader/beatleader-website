<script>
  import {createEventDispatcher} from 'svelte'
  import createTwitchService from '../../services/twitch'
  import Button from '../Common/Button.svelte'
  import Dialog from '../Common/Dialog.svelte'
  import {delay} from '../../utils/promise'

  export let playerId;
  export let show = false;

  const dispatch = createEventDispatcher();

  const twitchService = createTwitchService();

  let twitchProfile = null;

  let twitchUserName = "";
  let alreadySearched = false;
  let isSearching = false;

  async function onPlayerChanged(playerId) {
    if (!playerId) return;

    twitchProfile = await twitchService.getPlayerProfile(playerId)
    if (twitchProfile && twitchProfile.login) {
      twitchUserName = twitchProfile.login;

      if (!twitchProfile.id) onFindUser();
    }
  }

  function onCancel() {
    dispatch('cancel')
  }

  async function onFindUser() {
    if (!twitchUserName || !twitchUserName.length) return;

    try {
      isSearching = true
      alreadySearched = false;
      twitchProfile = null;

      await delay(100);
      twitchProfile = await twitchService.fetchProfile(twitchUserName);

      alreadySearched = true;
    }
    finally {
      isSearching = false;
    }
  }

  function onTwitchUserNameKeyUp(e) {
    if (e.code === 'Enter') {
      e.preventDefault()

      onFindUser();

      return false
    }
  }

  $: onPlayerChanged(playerId)
</script>

{#if show}
  <Dialog closeable={true} on:confirm={onCancel}>
    <svelte:fragment slot="header">
      <div class="header-title">Set up a Twitch profile</div>
    </svelte:fragment>

    <svelte:fragment slot="content">
      <div class="search">
        <input type="text" bind:value={twitchUserName} placeholder="Enter Twitch username..." on:keyup={onTwitchUserNameKeyUp}/>
        <Button iconFa="fas fa-search" type="primary" label="Search" on:click={onFindUser} loading={isSearching}/>
      </div>

      {#if twitchProfile && twitchProfile.id}
        <div class="results">
          <img src={twitchProfile.profile_image_url}/>
          <div>
            <h1 class="title is-4">{twitchProfile.display_name}</h1>
            <h2 class="subtitle is-6"><a href="https://twitch.tv/{encodeURIComponent(twitchProfile.login)}" target="_blank">https://twitch.tv/{twitchProfile.login}</a></h2>
            <p>{twitchProfile.description}</p>
          </div>
        </div>
      {:else if alreadySearched}
        <p>Twitch user not found.</p>
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="footer-right">
      <Button iconFa="fab fa-twitch" label="Link" type="twitch" on:click={() => dispatch('link', twitchProfile)} disabled={!twitchProfile}/>
      <Button label="Cancel" on:click={onCancel}/>
    </svelte:fragment>
  </Dialog>
{/if}

<style>
    .header-title {
        text-align: left;
    }

    .search {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 1em;
    }

    input {
        width: 100%;
        padding: calc(0.65em - 1px) 1em;
        margin: 0 0 0.45em 0;
        outline: none;
        color: var(--textColor);
        background-color: var(--faded);
        border: 2px solid var(--faded);
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    }

    .search :global(.button) {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    }

    .results {
        display: flex;
        justify-content: flex-start;
        align-items: center;
    }

    img {
        width: 30%;
        height: auto;
        margin-right: 1.5em;
        border-radius: 50%;
    }

    a {
        color: #9146ff !important;
        word-wrap: break-word;
    }
</style>