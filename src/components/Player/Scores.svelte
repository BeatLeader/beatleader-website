<script>
  import {createEventDispatcher} from 'svelte'
  import {PLAYER_SCORES_PER_PAGE} from '../../utils/scoresaber/consts'
  import {PLAYER_SCORES_PER_PAGE as ACCSABER_PLAYER_SCORES_PER_PAGE} from '../../utils/accsaber/consts'
  import createScoresStore from '../../stores/http/http-scores-store.js';
  import createScoresService from '../../services/scoresaber/scores';
  import {opt} from '../../utils/js'
  import {scrollToTargetAdjusted} from '../../utils/browser'
  import createBeatSaviorService from '../../services/beatsavior'
  import Pager from '../Common/Pager.svelte'
  import SongScore from './SongScore.svelte'
  import Error from '../Common/Error.svelte'
  import {formatDate, formatDateWithOptions, truncateDate} from '../../utils/date'
  import ChartBrowser from '../Common/ChartBrowser.svelte'
  import {formatNumber, roundToPrecision} from '../../utils/format'
  import ScoreServiceSwitcher from './ScoreServiceSwitcher.svelte'

  const dispatch = createEventDispatcher();

  export let playerId = null;
  export let initialState = null;
  export let initialStateType = null;
  export let initialService = 'scoresaber';
  export let initialServiceParams = {};
  export let numOfScores = null;
  export let fixedBrowserTitle = null;

  const SS_TOP_CHART_BROWSER_PRECISON = 5;

  const scoresService = createScoresService();
  const beatSaviorService = createBeatSaviorService();

  let scoresStore = createScoresStore(
    playerId,
    initialService,
    initialServiceParams,
    initialState,
    initialStateType
  );

  let scoresBoxEl = null;

  let pagerTotalScores = numOfScores;

  function changeParams(newPlayerId, newService, newServiceParams) {
    if (!newPlayerId) return null;

    scoresStore.fetch(newServiceParams, newService, newPlayerId);

    return {playerId: newPlayerId, service: newService, serviceParams: newServiceParams}
  }

  function onPageChanged(event) {
    if (!(event?.detail?.initial ?? false)) scrollToTop();

    const page = (event?.detail?.page ?? 0) + 1

    dispatch('page-changed', page);
  }

  function onServiceChanged(event) {
    if (!event?.detail) return;

    scrollToTop();

    dispatch('service-changed', event.detail);
  }

  function scrollToTop() {
    if (scoresBoxEl) scrollToTargetAdjusted(scoresBoxEl, 44)
  }

  function updateTotalScores(numOfScores) {
    pagerTotalScores = numOfScores
  }

  let playerScoresByDate = null;
  let playerScoresType = null;

  const groupScores = (scores, keyFunc = score => truncateDate(score?.timeSet)?.getTime()) => Object.values(
    scores
      .reduce((scores, score) => {
        const key = keyFunc(score);
        if (key === null || key === undefined) return scores;

        if (!scores[key]) scores[key] = [];

        scores[key].push({key, score});

        return scores;
      }, {}),
  )
    .sort((a,b) => b?.[0].key - a?.[0].key)
    .reduce((cum, values) => {
      if (!values?.length) return cum;

      const x = values[0].key;
      const y = values.length;

      const prevTotal = cum.length ? cum[cum.length - 1].total : 0;
      const page = Math.floor(prevTotal / PLAYER_SCORES_PER_PAGE);
      const total = prevTotal + y;

      cum.push({
        x,
        y,
        firstScore: values[0].score,
        page,
        total,
      })

      return cum;
    }, [])
    .sort((a,b) => b.x - a.x)

  async function refreshAllPlayerSsRecentScores(playerId, service, serviceParams) {
    if (!playerId || service !== 'scoresaber' || serviceParams?.sort !== 'recent') return;

    playerScoresType = 'time';
    playerScoresByDate = groupScores((await scoresService.getPlayerScores(playerId)).sort((a,b) => b?.timeSet - a?.timeSet))
  }

  async function refreshAllPlayerSsTopScores(playerId, service, serviceParams) {
    if (!playerId || service !== 'scoresaber' || serviceParams?.sort !== 'top') return;

    playerScoresType = 'linear';
    playerScoresByDate = groupScores(
      (await scoresService.getPlayerScores(playerId))
        .filter(s => Number.isFinite(s?.pp) && s.pp > 0)
        .sort((a,b) => b?.pp - a?.pp),
      score => roundToPrecision(score?.pp, SS_TOP_CHART_BROWSER_PRECISON)
    )
  }

  async function refreshAllPlayerBeatSaviorScores(playerId, service) {
    if (!playerId || service !== 'beatsavior') return;

    playerScoresType = 'time';
    playerScoresByDate = groupScores((await beatSaviorService.getPlayerBeatSaviorData(playerId)).sort((a,b) => b?.timeSet - a?.timeSet))
  }

  const chartBrowserTooltipTitle = ctx => playerScoresType === 'time'
    ? formatDate(new Date(ctx?.raw?.x), 'long', null)
    : `${formatNumber(ctx?.raw?.x, 0)} - ${formatNumber(ctx?.raw?.x + SS_TOP_CHART_BROWSER_PRECISON, 0)}pp`;

  const chartBrowserTooltipLabel = ctx => (ctx?.raw?.page ?? null) !== null
    ? [`${formatNumber(ctx?.raw?.y, 0)} score(s)`, '', `Click to go to page ${ctx.raw.page + 1}`]
    : null;

  const chartBrowserTickFormat = (val, idx, ticks) => playerScoresType === 'time'
    ? formatDateWithOptions(new Date(ticks?.[idx]?.value), {
      localeMatcher: 'best fit',
      year: '2-digit',
      month: 'short',
    })
    : `${formatNumber(ticks?.[idx]?.value, 0)}pp`

  $: playerId, currentService, currentServiceParams, playerScoresByDate = null, playerScoresType = null;
  $: refreshAllPlayerSsRecentScores(playerId, currentService, currentServiceParams)
  $: refreshAllPlayerSsTopScores(playerId, currentService, currentServiceParams)
  $: refreshAllPlayerBeatSaviorScores(playerId, currentService)

  $: changeParams(playerId, initialService, initialServiceParams, initialState, initialStateType)
  $: currentService = $scoresStore && scoresStore ? scoresStore?.getService() : null;
  $: currentServiceParams = $scoresStore && scoresStore ? scoresStore?.getServiceParams() : null;
  $: page = currentServiceParams?.page ?? null;
  $: totalScores = $scoresStore && scoresStore && scoresStore.getTotalScores ? scoresStore.getTotalScores() : null;
  $: isLoading = scoresStore ? scoresStore.isLoading : false;
  $: pending = scoresStore ? scoresStore.pending : null;
  $: error = scoresStore ? scoresStore.error : null;

  $: scoresStore && scoresStore.fetch(currentServiceParams, currentService)
  $: updateTotalScores(totalScores !== null && totalScores !== undefined ? totalScores : numOfScores)
</script>

<div class="box has-shadow" bind:this={scoresBoxEl}>
  {#if $error}
    <div><Error error={$error} /></div>
  {/if}

  <ScoreServiceSwitcher {playerId} service={currentService} loadingService={$pending?.service} on:change={onServiceChanged} />

  {#if $scoresStore && $scoresStore.length}
  <div class="song-scores grid-transition-helper">
    {#each $scoresStore as songScore, idx (opt(songScore, 'leaderboard.leaderboardId'))}
      <SongScore {playerId} {songScore} {fixedBrowserTitle} {idx} service={currentService} />
    {/each}
  </div>
  {:else}
    <p>No scores.</p>
  {/if}

  {#if Number.isFinite(page) && (!Number.isFinite(pagerTotalScores) || pagerTotalScores > 0)}
    <Pager totalItems={pagerTotalScores} itemsPerPage={currentService === 'accsaber' ? ACCSABER_PLAYER_SCORES_PER_PAGE : PLAYER_SCORES_PER_PAGE} itemsPerPageValues={null}
           currentPage={page-1} loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
           mode={pagerTotalScores ? 'pages' : 'simple'}
           on:page-changed={onPageChanged}
    />
  {/if}

  {#if playerScoresByDate?.length}
    <section class="scores-date-browse">
      <ChartBrowser data={playerScoresByDate} type={playerScoresType}
                    tooltipTitleFunc={chartBrowserTooltipTitle}
                    tooltipLabelFunc={chartBrowserTooltipLabel}
                    tickFormatFunc={chartBrowserTickFormat}
                    on:page-changed={onPageChanged}
      />
    </section>
  {/if}
</div>

<style>
    .song-scores :global(> *:last-child) {
        border-bottom: none !important;
    }

    .scores-date-browse {
        margin-top: 1rem;
        width: 100%;
        height: 100px;
    }

</style>