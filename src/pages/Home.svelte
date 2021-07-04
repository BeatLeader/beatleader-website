<script>
  import {navigate} from "svelte-routing";
  import {onMount} from 'svelte'
  import {fade} from 'svelte/transition'
  import createConfigService from '../services/config'
  import createPlayerService from '../services/scoresaber/player'
  import Avatar from '../components/Player/Avatar.svelte'
  import Error from '../components/Common/Error.svelte'
  import PlayerStats from '../components/Player/PlayerStats.svelte'
  import Button from '../components/Common/Button.svelte'
  import Search from '../components/Player/Search.svelte'

  const DEFAULT_NAME = 'Stranger';

  let playerId = null;
  let name = DEFAULT_NAME;
  let player = null;
  let isLoading = false;
  let error = null;

  const configService = createConfigService();
  const playerService = createPlayerService();

  const setPlayerData = newPlayer => {
    if (newPlayer) {
      player = newPlayer;
      name = newPlayer.name;
    }
  }

  async function updatePlayer(playerId) {
    if (!playerId) return;

    try {
      isLoading = true;

      setPlayerData(await playerService.get(playerId));
      setPlayerData(await playerService.fetchPlayerOrGetFromCache(playerId));
    }
    catch(err) {
      error = err;
    }
    finally {
      isLoading = false;
    }
  }

  onMount(async () => {
    playerId = await configService.getMainPlayerId();

    return () => {
      configService.destroyService();
      playerService.destroyService();
    }
  })

  $: updatePlayer(playerId)
</script>

<article transition:fade>
  <div class="box has-shadow">
    <h1 class="title is-3 has-text-centered">Hello</h1>

    <div class="avatar">
      <Avatar playerInfo={player ? player.playerInfo : null} {isLoading} centered={true}/>
    </div>

    <PlayerStats {name} playerInfo={player ? player.playerInfo : null} skeleton={!name && isLoading} centered={true} />

    {#if player}
      <Button iconFa="fas fa-user" label="Go to Player Profile" type="primary" on:click={() => navigate(`/u/${player.playerId}/recent`)}/>
      <div class="another-search"><a on:click={() => {name = DEFAULT_NAME; playerId = null; player = null;}}>Another search</a></div>
    {:else if !!name}
      <h2 class="title is-4 has-text-centered">{name}</h2>
      <h3 class="title is-6 has-text-centered">Find a player profile</h3>
      <Search on:selected={event => playerId = event.detail}/>
    {/if}

    {#if error}
      <div>
        <Error {error}/>
      </div>
    {/if}

    <h3 class="title is-6">OR</h3>

    <Button iconFa="fas fa-user" label="Browse ranking" type="default" on:click={() => navigate(`/global`)}/>
  </div>
</article>

<style>
    article {
        width: 100%;
        max-width: 1024px;
        margin: 0 auto;
        text-align: center;
    }

    div.avatar {
        position: relative;
        padding: .75rem 0;
        text-align: center;
    }

    h1 {
        margin-bottom: .75rem!important;
    }

    h2 {
        margin-top: .75rem!important;
    }

    h3 {
        margin: 1rem 0 1.45rem 0;
    }

    .another-search {
        font-size: .75em;
    }

    button {
        cursor: pointer;
        min-width: 2rem;
        margin-right: .5rem;
    }
</style>