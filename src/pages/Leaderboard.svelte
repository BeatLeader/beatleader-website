<script>
  import {createEventDispatcher} from 'svelte'
  import {navigate} from "svelte-routing";
  import {fade, fly} from 'svelte/transition'
  import createLeaderboardStore from '../stores/http/http-leaderboard-store'
  import {opt} from '../utils/js'
  import {scrollToTargetAdjusted} from '../utils/browser'
  import ssrConfig from '../ssr-config'
  import {LEADERBOARD_SCORES_PER_PAGE} from '../utils/scoresaber/consts'
  import {LEADERBOARD_SCORES_PER_PAGE as ACCSABER_LEADERBOARD_SCORES_PER_PAGE} from '../utils/accsaber/consts'
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
  import Switcher from '../components/Common/Switcher.svelte'
  import Icons from '../components/Song/Icons.svelte'
  import {formatNumber} from '../utils/format'
  import {getIconNameForDiff} from '../utils/scoresaber/format'

  export let leaderboardId;
  export let type = 'global';
  export let page = 1;
  export let withHeader = true;
  export let dontNavigate = false;
  export let withoutDiffSwitcher = false;
  export let withoutHeader = false;
  export let dontChangeType = false;
  export let scrollOffset = 45;
  export let fixedBrowserTitle = null;
  export let higlightedPlayerId = null;
  export let iconsInInfo = false;
  export let hasReplay = false;

  if (!dontNavigate) document.body.classList.add('slim');

  const dispatch = createEventDispatcher();

  if (page && !Number.isFinite(page)) page = parseInt(page, 10);
  if (!page || isNaN(page) || page <= 0) page = 1;

  if (leaderboardId && !Number.isFinite(leaderboardId)) leaderboardId = parseInt(leaderboardId, 10);

  let currentLeaderboardId = leaderboardId;
  let currentType = type;
  let currentPage = page;
  let boxEl = null;
  let leaderboard = null;

  let itemsPerPage = type === 'accsaber' ? ACCSABER_LEADERBOARD_SCORES_PER_PAGE : LEADERBOARD_SCORES_PER_PAGE;

  let typeOptions =
    (
      type === 'accsaber'
        ? [
          {
            id: 'accsaber',
            label: 'AccSaber',
            icon: '<div class="accsaber-icon">',
            url: `/leaderboard/accsaber/${currentLeaderboardId}/1`,
          }
        ]
        : []
    )
      .concat(
        [
          {
            id: 'global',
            label: 'Global',
            iconFa: 'fas fa-globe-americas',
            url: `/leaderboard/global/${currentLeaderboardId}/1`,
          },
          {
            id: 'friends',
            label: 'Friends',
            iconFa: 'fas fa-user-friends',
            url: `/leaderboard/friends/${currentLeaderboardId}/1`,
          },
        ],
      );

  let currentTypeOption = typeOptions[0];

  function navigateToPlayer(playerId) {
    if (!playerId) return;

    navigate(`/u/${playerId}/scoresaber/recent/1`)
  }

  function scrollToTop() {
    if (boxEl) scrollToTargetAdjusted(boxEl, scrollOffset)
  }

  const leaderboardStore = createLeaderboardStore(leaderboardId, type, page);

  function changeParams(newLeaderboardId, newType, newPage) {
    if (newLeaderboardId && !Number.isFinite(newLeaderboardId)) newLeaderboardId = parseInt(newLeaderboardId, 10);
    currentLeaderboardId = newLeaderboardId;

    currentType = newType;
    newPage = parseInt(newPage, 10);
    if (isNaN(newPage)) newPage = 1;

    currentTypeOption = typeOptions[currentType === 'global' ? 0 : 1];

    currentPage = newPage;
    leaderboardStore.fetch(currentLeaderboardId, currentType, currentPage);
  }

  function onPageChanged(event) {
    if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

    const newPage = event.detail.page + 1

    if (!dontNavigate) navigate(`/leaderboard/${currentType}/${currentLeaderboardId}/${newPage}`);

    dispatch('page-changed', {leaderboardId: currentLeaderboardId, type: currentType, page: newPage})
  }

  function onDiffChange(event) {
    const newLeaderboardId = opt(event, 'detail.leaderboardId');
    if (!newLeaderboardId) return;

    if (!dontNavigate) navigate(`/leaderboard/${currentType}/${newLeaderboardId}/${1}`);
    else changeParams(newLeaderboardId, currentType, 1);
  }

  function onTypeChanged(event) {
    const newType = opt(event, 'detail.id');
    if (!newType) return;

    if (!dontNavigate) navigate(`/leaderboard/${newType}/${currentLeaderboardId}/${1}`);
    else if (!dontChangeType) changeParams(currentLeaderboardId, newType, 1);

    dispatch('type-changed', {leaderboardId: currentLeaderboardId, type: newType, page: currentPage})
  }

  function processDiffs(diffArray) {
    return diffArray.map(d => (
      {...d,
        label: d.name, 
        url: `/leaderboard/${currentType}/${d.leaderboardId}`,
        icon: `<div class="${getIconNameForDiff(d)}" title="${d.type}">`,
      }))
  }

  let ssCoverDoesNotExists = false;

  $: isLoading = leaderboardStore.isLoading;
  $: pending = leaderboardStore.pending;
  $: enhanced = leaderboardStore.enhanced

  $: changeParams(leaderboardId, type, page)
  $: scrollToTop($pending);
  $: scores = opt($leaderboardStore, 'scores', null)
  $: if ($leaderboardStore || $enhanced) leaderboard = opt($leaderboardStore, 'leaderboard', null)
  $: song = opt($leaderboardStore, 'leaderboard.song', null)
  $: diffs = processDiffs(opt($leaderboardStore, 'diffs', []))
  $: currentDiff = diffs ? diffs.find(d => d.leaderboardId === currentLeaderboardId) : null
  $: currentlyLoadedDiff = $pending && diffs ? diffs.find(d => d.leaderboardId === $pending.leaderboardId) : null;
  $: hash = opt($leaderboardStore, 'leaderboard.song.hash')
  $: diffInfo = opt($leaderboardStore, 'leaderboard.diffInfo')
  $: beatSaverCoverUrl = opt($leaderboardStore, 'leaderboard.beatMaps.versions.0.coverURL')
</script>

<svelte:head>
  <title>{fixedBrowserTitle ? fixedBrowserTitle : `${opt(song, 'name', 'Leaderboard')} / ${currentDiff ? currentDiff.name + ' / ' : ''} ${page} - ${ssrConfig.name}}`}</title>
</svelte:head>

<article transition:fade>
  <div class="box has-shadow" bind:this={boxEl}>
    {#if !$leaderboardStore && $isLoading}<Spinner/>{/if}

    <div class="leaderboard" style={opt($leaderboardStore, 'leaderboard.song.imageUrl') ? `--background-image: url(${ssCoverDoesNotExists && beatSaverCoverUrl ? beatSaverCoverUrl : $leaderboardStore.leaderboard.song.imageUrl})` : ''}>
      {#if $leaderboardStore}

        {#if leaderboard && song && withHeader}
        <header transition:fade>
          {#if !withoutHeader}
          <h1 class="title is-4">
            <span class="name">{song.name} {song.subName ? song.subName : ''}</span>
            <span class="author">{song.authorName}</span>
            <small class="level-author">{song.levelAuthorName}</small>
          </h1>

          <h2 class="title is-6" class:unranked={leaderboard.stats && leaderboard.stats.status && leaderboard.stats.status !== 'Ranked'}>
            {#if leaderboard.categoryDisplayName}
              <Badge onlyLabel={true} color="white" bgColor="var(--dimmed)" fluid={true}>
                  <span slot="label">
                    {leaderboard.categoryDisplayName}
                    {#if leaderboard.complexity}<Value value={leaderboard.complexity} digits={2} zero="" suffix="★"/>{/if}
                  </span>
              </Badge>
            {/if}

            {#if leaderboard.stats && leaderboard.stats.status}<span>{leaderboard.stats.status}</span>{/if}
            {#if leaderboard.stats && leaderboard.stats.stars}<Value value={leaderboard.stats.stars} digits={2} zero="" suffix="★"/>{/if}
            {#if leaderboard.diffInfo}<span class="diff"><Difficulty diff={leaderboard.diffInfo} reverseColors={true}/></span>{/if}

            <span class="icons"><Icons {hash} {diffInfo} {hasReplay} playerId={higlightedPlayerId} /></span>
          </h2>
          {/if}

          {#if leaderboard.stats}
            <div class="stats">
              {#if leaderboard?.stats?.seconds}
                <div transition:fade>
                  <span class="time" transition:fade={{duration: 500}}>
                      <i class="fas fa-clock"></i> Length: <Duration value={leaderboard.stats?.seconds}/>
                  </span>
                </div>
              {/if}

              {#if leaderboard?.stats?.notes}
                <div transition:fade><i class="fas fa-music"></i> Notes: <strong>
                  <Value value={leaderboard.stats?.notes} digits={0}/>
                </strong></div>
              {/if}

              {#if leaderboard?.stats?.bpm}
                <div transition:fade><i class="fas fa-drum"></i> BPM: <strong>
                  <Value value={leaderboard.stats?.bpm} digits={0}/>
                </strong></div>
              {/if}

              {#if leaderboard?.stats?.njs}
                <div transition:fade><i class="fas fa-tachometer-alt"></i> NJS: <strong>
                  <Value value={leaderboard.stats?.njs} digits={0}/>
                </strong></div>
              {/if}

              {#if Number.isFinite(leaderboard?.stats?.njsOffset)}
                <div transition:fade><i class="fas fa-ruler-horizontal"></i> Offset: <strong>
                  <Value value={leaderboard?.stats?.njsOffset} digits={2}/>
                </strong></div>
              {/if}

              {#if leaderboard?.stats?.nps}
                <div transition:fade><i class="fas fa-fire"></i> NPS: <strong>
                  <Value value={leaderboard.stats?.nps} digits={2}/>
                </strong></div>
              {/if}

              {#if leaderboard?.stats?.bombs}
                <div transition:fade><i class="fas fa-bomb"></i> Bombs: <strong>
                  <Value value={leaderboard.stats?.bombs} digits={0} zero="0"/>
                </strong></div>
              {/if}

              {#if leaderboard?.stats?.obstacles}
                <div transition:fade><i class="fas fa-skull"></i> Obstacles: <strong>
                  <Value value={leaderboard.stats?.obstacles} digits={0} zero="0"/>
                </strong></div>
              {/if}

              {#if leaderboard?.stats?.paritySummary}
                {#if leaderboard?.stats?.paritySummary?.errors}
                  <div transition:fade><i class="fas fa-exclamation-circle"></i> Errors: <strong>
                    <Value value={leaderboard.stats?.paritySummary?.errors} digits={0} zero="0"/>
                  </strong></div>
                {/if}

                {#if leaderboard?.stats?.paritySummary?.warns}
                  <div transition:fade><i class="fas fa-exclamation-triangle"></i> Warnings: <strong>
                    <Value value={leaderboard.stats?.paritySummary?.warns} digits={0} zero="0"/>
                  </strong></div>
                {/if}

                {#if leaderboard?.stats?.paritySummary?.resets}
                  <div transition:fade><i class="fas fa-redo"></i> Resets: <strong>
                    <Value value={leaderboard.stats?.paritySummary?.resets} digits={0} zero="0"/>
                  </strong></div>
                {/if}
              {/if}
              
              {#if iconsInInfo}
                <span class="icons"><Icons {hash} {diffInfo} {hasReplay} playerId={higlightedPlayerId} /></span>
              {/if}
            </div>
          {/if}
        </header>
        {/if}

        {#if type !== 'accsaber'}
        <nav class="diff-switch">
            {#if !withoutDiffSwitcher && diffs && diffs.length}
                <Switcher values={diffs} value={currentDiff} on:change={onDiffChange} loadingValue={currentlyLoadedDiff} />
            {/if}

            <Switcher values={typeOptions} value={currentTypeOption} on:change={onTypeChanged}
                      loadingValue={currentlyLoadedDiff} />
        </nav>
        {/if}

        {#if scores && scores.length}
          <div class="scores-grid grid-transition-helper">
          {#each scores as score, idx}
            {#key opt(score, 'player.playerId')}
            <div class={`player-score row-${idx} ${score.player.playerId == higlightedPlayerId ? "highlight" :""} ${score.score.pp && score.score.rank < 500 ? "with-replay" : ""}`} in:fly={{x: 200, delay: idx * 20, duration:500}} out:fade={{duration:100}}>
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
                <PlayerNameWithFlag player={score.player} type={type === 'accsaber' ? 'accsaber/recent' : 'scoresaber/recent'}
                                    on:click={score.player ? () => navigateToPlayer(score.player.playerId) : null}
                />
              </div>

              <div class="timeset">
                {opt(score, 'score.timeSetString', '-')}
                
              </div>

              {#if score.score.pp && score.score.rank < 500}
              <div class="replay">
                <Icons {hash} {diffInfo} icons={["preview"]} hasReplay={true} playerId={score.player.playerId} />
              </div>
              {/if}

              <div class="score-metrics">
                <div class="pp with-badge">
                  <Badge onlyLabel={true} color="white" bgColor="var(--ppColour)">
                    <span slot="label">
                      {#if type === 'accsaber'}
                        <Pp playerId={opt(score, 'player.playerId')}
                            pp="{opt(score, 'score.ap')}" weighted={opt(score, 'score.weightedAp')}
                            zero={formatNumber(0)} withZeroSuffix={true} inline={false}
                            suffix="AP"
                            color="white"
                        />
                      {:else}
                        <Pp playerId={opt(score, 'player.playerId')} leaderboardId={leaderboardId} pp={opt(score, 'score.pp')}
                            whatIf={opt(score, 'score.whatIfPp')}
                            inline={false} color="white"
                        />
                      {/if}
                    </span>
                  </Badge>
                </div>

                <div class="percentage with-badge">
                  <Accuracy score={score.score} showPercentageInstead={type !== 'accsaber'} noSecondMetric={true} showMods={false} />
                </div>

                <div class="score with-badge">
                  <Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
                      <span slot="label">
                        <Value value="{opt(score, 'score.score')}" inline={false} digits={0}/>

                        <small title="Mods">{opt(score, 'score.mods') ? score.score.mods.join(', ') : ''}</small>
                      </span>
                  </Badge>
                </div>
              </div>
            </div>
              {/key}
          {/each}
          </div>

          <Pager totalItems={$leaderboardStore.totalItems} {itemsPerPage} itemsPerPageValues={null}
                 currentPage={currentPage-1} loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
                 mode={$leaderboardStore.totalItems ? 'pages' : 'simple'}
                 hide={!['global', 'accsaber'].includes(currentType)}
                 on:page-changed={onPageChanged}
          />
        {:else}
          <p transition:fade>No scores found.</p>
        {/if}
      {:else if (!$isLoading)}
        <p>Leaderboard not found.</p>
      {/if}
    </div>

    {#if opt($leaderboardStore, 'leaderboard.song.imageUrl')}
      <img class="dummy" src={$leaderboardStore.leaderboard.song.imageUrl} on:error={() => ssCoverDoesNotExists = true} />
    {/if}
  </div>
</article>

<style>
    .diff-switch {
        display: flex;
        justify-content: center;
        margin-bottom: 1em;
    }

    .diff-switch :global(> *:not(:last-child)) {
        margin-right: 1em;
    }


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
        margin-bottom: 1.5em;
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

    header .icons {
        font-size: .65em;
    }

    header .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, 11em);
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

    .player-score.with-replay:hover {
        grid-template-columns: minmax(2em, max-content) auto minmax(6.9em, min-content) 2em 5.5em 4.5em 6em !important;
    }

    .replay {
      display: none;
    }

    .player-score:hover .replay {
      display: block;
    }

    .scores-grid .player-score {
        display: grid;
        grid-template-columns: minmax(2em, max-content) auto minmax(6.9em, min-content) 5.5em 4.5em 6em;
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

    .player-score.highlight {
        border: 1px solid yellow;
        border-radius: 4px;
        padding: 10px;
        margin: 0px -12px 0px -12px;
        max-width: 130%;
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

    .pp.with-badge {
        position: relative;
    }

    @media screen and (max-width: 1023px) {
        header .stats {
            grid-template-columns: repeat(auto-fit, 9em);
        }
    }

    @media screen and (max-width: 767px) {
        header .stats {
          justify-items: left;
        }

        .diff-switch {
            flex-direction: column;
        }

        .diff-switch :global(> *:not(:last-child)) {
            margin-right: 0;
            margin-bottom: .5em;
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

    img.dummy {
        display: none;
    }

    @media screen and (max-width: 409px) {
        header .stats {
            justify-items: left;
            grid-template-columns: repeat(auto-fit, 8em);
        }

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