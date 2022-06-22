<script>
  import {navigate} from 'svelte-routing'
  import {LEADERBOARD_SCORES_PER_PAGE} from '../../utils/beatleader/consts'
  import {LEADERBOARD_SCORES_PER_PAGE as ACCSABER_LEADERBOARD_SCORES_PER_PAGE} from '../../utils/accsaber/consts'
  import Icons from '../Song/Icons.svelte'
  import Badge from '../Common/Badge.svelte'
  import SongCover from './SongCover.svelte'

  export let leaderboard = null;
  export let score = null;
  export let rank = null;
  export let hash = null;
  export let twitchUrl = null
  export let notClickable = false;
  export let replayLink = false;
  export let category = null;
  export let service = 'beatleader';
  export let playerId = null;

  $: song = leaderboard?.song ?? null;
  $: scoresPerPage = service === 'accsaber' ? ACCSABER_LEADERBOARD_SCORES_PER_PAGE : LEADERBOARD_SCORES_PER_PAGE
  $: page = rank && Number.isFinite(rank) ? Math.floor((rank - 1) / scoresPerPage) + 1 : 1;
  $: diffInfo = leaderboard?.diffInfo ?? null;
  $: leaderboardId = leaderboard?.leaderboardId ?? '';
  $: leaderboardUrl = `/leaderboard/${service === 'accsaber' ? 'accsaber' : 'global'}/${leaderboardId}/${page ?? ''}`;
</script>

{#if song}
  <section>
    <SongCover {leaderboard} {notClickable} url={leaderboardUrl} />

    <div class="songinfo">
      {#if notClickable}
        <span class="name">{song.name} {song.subName}</span>
        <div class="author">{song.authorName} <small>{song.levelAuthorName}</small></div>
      {:else}
        <a href={leaderboardUrl} on:click|preventDefault={() => navigate(leaderboardUrl)}>
          <span class="name">{song.name} {song.subName}</span>
          <div class="author">{song.authorName} <small>{song.levelAuthorName}</small></div>

          {#if category}
            <span class="category">
              <Badge onlyLabel={true} color="white" bgColor="var(--dimmed)" label={category} fluid={true} />
            </span>
          {/if}
        </a>
      {/if}
    </div>

    {#if hash && hash.length}
      <div class="icons desktop-and-up" class:wide={twitchUrl && twitchUrl.length}>
        <Icons {hash} {twitchUrl} {diffInfo} scoreId={score.id} {replayLink} />
      </div>
    {/if}
  </section>
{/if}

<style>
    section {
        display: flex;
        justify-content: flex-start;
        align-items: center;
    }

    section :global(> *) {
        margin-right: .75em;
    }

    .songinfo {
        text-align: left;
        font-size: .95rem;
        font-weight: 500;
        flex-grow: 1;
    }

    .songinfo {
        color: var(--alternate);
    }

    .songinfo small {
        font-size: 0.75em;
        color: var(--ppColour);
    }

    .category {
        font-size: .75em;
    }

    .songinfo .category :global(.badge) {
        width: auto;
    }

    .icons {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        font-size: .65em;
        min-width: 4.66em;
        width: 4.66em;
        margin-right: 0;
        align-self: flex-end;
    }

    .icons.wide :global(> *:not(:first-child)) {
        margin-left: .25em;
        margin-bottom: .25em;
    }

    .icons:not(.wide) :global(> *:not(:nth-child(2n + 1))) {
        margin-left: .25em;
        margin-bottom: .25em;
    }

    .icons.wide {
        min-width: 6.85em;
    }

    .icons:empty {
        margin-bottom: 0;
    }
</style>