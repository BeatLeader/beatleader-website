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
  import {LEADERBOARD_SCORES_PER_PAGE} from '../utils/scoresaber/consts'
  import {formatNumber} from '../utils/format'
  import Value from '../components/Common/Value.svelte'
  import Avatar from '../components/Common/Avatar.svelte'
  import PlayerNameWithFlag from '../components/Common/PlayerNameWithFlag.svelte'
  import Pager from '../components/Common/Pager.svelte'
  import Spinner from '../components/Common/Spinner.svelte'
  import Pp from '../components/Score/Pp.svelte'
  import Badge from '../components/Common/Badge.svelte'
  import Accuracy from '../components/Common/Accuracy.svelte'
  import Difficulty from '../components/Song/Difficulty.svelte'
  import Duration from '../components/Song/Duration.svelte'

  export let leaderboardId;
  export let type = 'global';
  export let page = 1;
  export let withHeader = true;

  if (page && !Number.isFinite(page)) page = parseInt(page, 10);
  if (!page || isNaN(page) || page <= 0) page = 1;

  const {activeRoute} = getContext(ROUTER);

  let currentLeaderboardId = leaderboardId;
  let currentType = type;
  let currentPage = page;
  let boxEl = null;
  let leaderboard = null;

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
  $: enhanced = leaderboardStore.enhanced

  $: changeParams(leaderboardId, type, page)
  $: scrollToTop($pending);
  $: scores = opt($leaderboardStore, 'scores', null)
  $: if ($leaderboardStore || $enhanced) leaderboard = opt($leaderboardStore, 'leaderboard', null)
  $: song = opt($leaderboardStore, 'leaderboard.song', null)
</script>

<svelte:head>
  <title>{`${opt(song, 'name', 'Leaderboard')} / ${page} - ${config.name}`}</title>
</svelte:head>

<article transition:fade>
  <div class="box has-shadow" bind:this={boxEl}>
    {#if !$leaderboardStore && $isLoading}<Spinner/>{/if}

    <div class="leaderboard" style={opt($leaderboardStore, 'leaderboard.song.imageUrl') ? `--background-image: url(${$leaderboardStore.leaderboard.song.imageUrl})` : ''}>
      {#if $leaderboardStore}

        {#if leaderboard && song && withHeader}
        <header transition:fade>
          <h1 class="title is-4">
            <span class="name">{song.name} {song.subName ? song.subName : ''}</span>
            <span class="author">{song.authorName}</span>
            <small class="level-author">{song.levelAuthorName}</small>
          </h1>

          <h2 class="title is-6" class:unranked={leaderboard.stats && leaderboard.stats.status && leaderboard.stats.status !== 'Ranked'}>
            {#if leaderboard.stats && leaderboard.stats.status}<span>{leaderboard.stats.status}</span>{/if}
            {#if song.stars}<Value value={song.stars} digits={2} zero="" suffix="★"/>{/if}
            {#if leaderboard.diffInfo}<span class="diff"><Difficulty diff={leaderboard.diffInfo} reverseColors={true}/></span>{/if}
          </h2>

          {#if leaderboard.stats}
            <div class="stats">
              {#if leaderboard.stats.length}
                <div transition:fly={{x:100, duration: 500}}>
                  <span class="time" transition:fade={{duration: 500}}>
                      <i class="fas fa-clock"></i> Length: <Duration value={leaderboard.stats.length}/>
                  </span>
                </div>
              {/if}

              {#if leaderboard.stats.notes}
                <div transition:fly={{x:100, duration: 500}}><i class="fas fa-music"></i> Notes: <strong>
                  <Value value={leaderboard.stats.notes} digits={0}/>
                </strong></div>
              {/if}

              {#if leaderboard.stats.bpm}
                <div transition:fly={{x:100, duration: 500}}><i class="fas fa-drum"></i> BPM: <strong>
                  <Value value={leaderboard.stats.bpm} digits={0}/>
                </strong></div>
              {/if}

              {#if leaderboard.stats.njs}
                <div transition:fly={{x:100, duration: 500}}><i class="fas fa-tachometer-alt"></i> NJS: <strong>
                  <Value value={leaderboard.stats.njs} digits={0}/>
                </strong></div>
              {/if}

              {#if leaderboard.stats.njsOffset}
                <div transition:fly={{x:100, duration: 500}}><i class="fas fa-ruler-horizontal"></i> Offset: <strong>
                  <Value value={leaderboard.stats.njsOffset} digits={2}/>
                </strong></div>
              {/if}

              {#if leaderboard.stats.nps}
                <div transition:fly={{x:100, duration: 500}}><i class="fas fa-fire"></i> NPS: <strong>
                  <Value value={leaderboard.stats.nps} digits={2}/>
                </strong></div>
              {/if}

              {#if leaderboard.stats.bombs}
                <div transition:fly={{x:100, duration: 500}}><i class="fas fa-bomb"></i> Bombs: <strong>
                  <Value value={leaderboard.stats.bombs} digits={0} zero="0"/>
                </strong></div>
              {/if}

              {#if leaderboard.stats.obstacles}
                <div transition:fly={{x:100, duration: 500}}><i class="fas fa-skull"></i> Obstacles: <strong>
                  <Value value={leaderboard.stats.obstacles} digits={0} zero="0"/>
                </strong></div>
              {/if}
            </div>
          {/if}
        </header>
        {/if}

        {#if scores && scores.length}
          <div class="scores-grid">
          {#each scores as score, idx}
            <div class="player-score" in:fly={{delay: idx * 20, x: 100}}>
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
                <PlayerNameWithFlag player={score.player} on:click={score.player ? () => navigateToPlayer(score.player.playerId) : null}/>
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
                  <Accuracy score={score.score} showPercentageInstead={true} noSecondMetric={true} />
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

          <Pager totalItems={$leaderboardStore.totalItems} itemsPerPage={LEADERBOARD_SCORES_PER_PAGE} itemsPerPageValues={null}
                 currentPage={currentPage-1} loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
                 mode={$leaderboardStore.totalItems ? 'pages' : 'simple'}
                 on:page-changed={onPageChanged}
          />
        {/if}
      {:else if (!$isLoading)}
        <p>Leaderboard not found.</p>
      {/if}
    </div>
  </div>
</article>

<style>
    .leaderboard {
        position: relative;
        margin-left: -1em;
        margin-top: -1em;
        margin-bottom: -1em;
        width: calc(100% + 2em);
        padding: 1em;
    }

    .leaderboard:before {
        position: absolute;
        content: ' ';
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: .1;
        background-image: var(--background-image);
        background-repeat: no-repeat;
        background-size: cover;
        pointer-events: none;
    }

    header {
        color: var(--alternate);
        margin-bottom: 1em;
    }

    header .title {
        color: inherit !important;
    }

    header h1 {
        font-size: 1.5em!important;
        margin-bottom: .5em;
    }

    header h1 span.name {
        font-size: .875em;
    }

    header h2.title {
        font-size: 1em!important;
        margin-top: 0;
        color: var(--increase, #42b129) !important;
        margin-bottom: .5em;
    }

    header h2.title.unranked {
        color: var(--decrease, #f94022) !important;
    }

    header .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, 8em);
        grid-column-gap: 1em;
        grid-row-gap: .5em;
        justify-items: center;
        align-items: center;
        color: var(--textColor, #fff) !important;
    }

    header small {
        font-size: 0.75em;
        color: var(--ppColour);
    }

    header .diff :global(.reversed) {
        display: inline-block;
        padding: .1em .25em .25em .25em;
        margin-left: .5em;
        margin-right: .5em;
        border-radius: .25em;
    }

    .scores-grid {
        display: grid;
        grid-template-columns: 1fr;
        grid-row-gap: .5em;
        max-width: 100%;
        position: relative;
    }

    .scores-grid .player-score {
        display: grid;
        grid-template-columns: minmax(2em, max-content) auto minmax(6.85em, min-content) 6em 4.5em 5.5em;
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

    .player-score .player :global(.player-name) {
        cursor: pointer;
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
        header .stats {
          justify-items: left;
        }

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