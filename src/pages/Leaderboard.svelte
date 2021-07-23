<script>
  import {getContext} from 'svelte'
  import {navigate} from "svelte-routing";
  import {ROUTER} from 'svelte-routing/src/contexts'
  import {fade, fly} from 'svelte/transition'
  import createLeaderboardStore from '../stores/http/http-leaderboard-store'
  import {opt} from '../utils/js'
  import eventBus from '../utils/broadcast-channel-pubsub'
  import {scrollToTargetAdjusted} from '../utils/browser'
  import config from '../config'
  import Value from '../components/Common/Value.svelte'
  import Avatar from '../components/Common/Avatar.svelte'
  import Change from '../components/Common/Change.svelte'
  import PlayerNameWithFlag from '../components/Common/PlayerNameWithFlag.svelte'
  import Pager from '../components/Common/Pager.svelte'
  import Spinner from '../components/Common/Spinner.svelte'
  import {LEADERBOARD_SCORES_PER_PAGE} from '../utils/scoresaber/consts'
  import Pp from '../components/Score/Pp.svelte'
  import {formatNumber} from '../utils/format'
  import Badge from '../components/Common/Badge.svelte'
  import Accuracy from '../components/Common/Accuracy.svelte'

  export let leaderboardId;
  export let type = 'global';
  export let page = 1;

  if (page && !Number.isFinite(page)) page = parseInt(page, 10);
  if (!page || isNaN(page) || page <= 0) page = 1;

  const {activeRoute} = getContext(ROUTER);

  let currentLeaderboardId = leaderboardId;
  let currentType = type;
  let currentPage = page;
  let boxEl = null;

  function navigateToPlayer(playerId) {
    if (!playerId) return;

    if (!$activeRoute || !$activeRoute.uri || !$activeRoute.uri.startsWith('/u/')) {
      navigate(`/u/${playerId}`)
    } else {
      eventBus.publish('navigate-to-player-cmd', playerId)
    }
  }

  function scrollToTop() {
    if (boxEl) scrollToTargetAdjusted(boxEl, 44)
  }

  const leaderboardStore = createLeaderboardStore(leaderboardId, type, page);

  function changeParams(newLeaderboardId, newType, newPage) {
    currentLeaderboardId = newLeaderboardId;
    currentType = newType;

    newPage = parseInt(newPage, 10);
    if (isNaN(newPage)) newPage = 1;

    currentPage = newPage;
    leaderboardStore.fetch(currentLeaderboardId, currentType, currentPage);
  }

  function onPageChanged(event) {
    if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

    navigate(`/leaderboard/${currentType}/${currentLeaderboardId}/${event.detail.page + 1}`);
  }

  function onPlayerClick(event, player) {
    navigateToPlayer(player.playerId)
  }

  $: isLoading = leaderboardStore.isLoading;
  $: pending = leaderboardStore.pending;

  $: changeParams(leaderboardId, type, page)
  $: scrollToTop($pending);
  $: scores = opt($leaderboardStore, 'scores', null)

  $: console.log($leaderboardStore)
</script>

<svelte:head>
  <title>Leaderboard - {config.name}</title>
</svelte:head>

<article transition:fade>
  <div class="box has-shadow" bind:this={boxEl}>
    {#if $isLoading}
      <Spinner/>
    {/if}

    {#if $leaderboardStore}
      {#if scores && scores.length}
        <div class="scores-grid">
        {#each scores as score}
          <div class="player-score">
            <div class="rank with-badge">
              <Badge onlyLabel={true} color="white" bgColor={opt(score, 'score.rank') === 1 ? 'darkgoldenrod' : (opt(score,
              'score.rank') === 2 ? '#888' : (opt(score, 'score.rank') === 3 ? 'saddlebrown' : (opt(score, 'score.rank')
              >= 10000 ? 'small' : 'var(--dimmed)')))}>
                  <span slot="label">
                    #<Value value={opt(score, 'score.rank')} digits={0} zero="?"/>
                  </span>
              </Badge>
            </div>

            <div class="player">
              <Avatar player={score.player}/>
              <PlayerNameWithFlag player={score.player}/>
            </div>

            <div class="timeset">{opt(score, 'score.timeSetString', '-')}</div>

            <div class="score-metrics">
              <div class="score with-badge">
                <Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
                    <span slot="label">
                      <Value value="{opt(score, 'score.score')}" inline={false} digits={0}/>

                      <small title="Mods">{opt(score, 'score.mods') ? score.score.mods.join(', ') : ''}</small>
                    </span>
                </Badge>
              </div>

              <div class="percentage with-badge">
                <Accuracy score={score.score} showPercentageInstead={true} secondMetricInsteadOfDiff={true} />
              </div>

              <div class="pp with-badge">
                <Badge onlyLabel={true} color="white" bgColor="var(--ppColour)">
                  <span slot="label">
                    <Pp playerId={opt(score, 'player.playerId')} leaderboardId={leaderboardId} pp={opt(score, 'score.pp')}
                        zero={formatNumber(0)} withZeroSuffix={true} inline={false}
                        color="white"
                    />
                  </span>
                </Badge>
              </div>
            </div>
          </div>
        {/each}
        </div>
      {/if}

      <hr style="background-color: red"/>
      page={$leaderboardStore.page}, totalItems={$leaderboardStore.totalItems}
    {:else if (!$isLoading)}
      <p>Leaderboard not found</p>
    {/if}
  </div>
</article>

<style>
    .scores-grid {
        display: grid;
        grid-template-columns: 1fr;
        grid-row-gap: .5em;
        max-width: 100%;
    }

    .scores-grid .player-score {
        display: grid;
        grid-template-columns: minmax(2em, max-content) auto minmax(6.5em, min-content) 6em 4.5em 5.5em;
        grid-gap: .5em;
        align-items: center;
        overflow: hidden;
        border-bottom: 1px solid var(--faded);
        padding-bottom: .5em;
    }

    .player-score .score-metrics {
        display: contents;
    }

    .player-score :global(.badge) {
        margin: 0 !important;
        padding: .125em .25em !important;
        width: 100%;
        height: 100%;
    }

    .player-score :global(.badge span) {
        width: 100%;
    }

    .player-score :global(.badge small) {
        display: block;
        font-size: .7em;
        font-weight: normal;
        margin-top: -2px;
    }

    .player-score :global(.inc), .song-score :global(.dec) {
        color: inherit;
    }

    .player-score .rank {
        font-size: .875em;
    }

    .player-score .player {
        display: flex;
        align-items: center;
        max-width: 100%;
        overflow-x: hidden;
    }

    .player-score .player :global(figure) {
        width: 1.5em;
        height: 1.5em;
        min-width: 1.5em;
        margin-right: .5em;
    }

    .player-score .player :global(.player-name) {
        overflow-x: hidden;
        text-overflow: ellipsis;
    }

    .player-score .timeset {
        text-align: center;
    }

    .with-badge {
        height: 100%;
        text-align: center;
    }

    @media screen and (max-width: 767px) {
        .scores-grid .player-score {
            grid-template-columns: minmax(2em, max-content) auto auto auto auto auto;
            width: 100%;
        }

        .player-score .player {
            grid-column: 2 / span 4;
            grid-row: 1 / 2;
        }

        .player-score .timeset {
            grid-row: 1 / 2;
            grid-column: 6 / 7;
            text-align: right;
            font-size: .875em;
            line-height: 1;
        }

        .player-score .score-metrics {
            grid-column: 1 / span 6;
            grid-row: 2 / 3;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            grid-gap: .5em;
            align-items: center;
            justify-items: center;
        }

        .player-score .score-metrics > * {
            min-width: 5em;
            max-width: 6.5em;
        }

        .player-score .score-metrics *:first-child {
            justify-self: left;
        }

        .player-score .score-metrics *:last-child {
            justify-self: right;
        }
    }

    @media screen and (max-width: 409px) {
        .player-score .player {
            grid-column: 2 / span 5;
        }

        .player-score .timeset {
            grid-column: 1 / span 6;
            grid-row: 3 / 4;
            text-align: center;
        }
    }
</style>