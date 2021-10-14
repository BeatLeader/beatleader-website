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
  import Switcher from '../Common/Switcher.svelte'
  import {formatDate, formatDateWithOptions, truncateDate} from '../../utils/date'
  import ChartBrowser from '../Common/ChartBrowser.svelte'
  import {formatNumber, roundToPrecision} from '../../utils/format'

  const dispatch = createEventDispatcher();

  export let playerId = null;
  export let initialState = null;
  export let initialStateType = null;
  export let initialService = 'scoresaber';
  export let initialServiceParams = {};
  export let numOfScores = null;
  export let fixedBrowserTitle = null;
  export let withAccSaber = false;

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

  const allScoresTypes = [
    {id: 'scoresaber', label: 'Recent', iconFa: 'fa fa-clock', url: `/u/${playerId}/scoresaber/recent/1`},
    {id: 'scoresaber/top', label: 'Top', iconFa: 'fa fa-cubes', url: `/u/${playerId}/scoresaber/top/1`},
    {id: 'beatsavior', label: 'Beat Savior', icon: '<div class="beatsavior-icon"></div>', url: `/u/${playerId}/beatsavior/recent/1`},
    {id: 'accsaber', label: 'AccSaber', icon: '<div class="accsaber-icon"></div>', url: `/u/${playerId}/accsaber/recent/1`},
  ];

  let scoresTypes = allScoresTypes;

  function changeParams(newPlayerId, newService, newServiceParams) {
    if (!newPlayerId) return null;

    console.log('Scores::changeParams', newPlayerId, newService, newServiceParams)

    newService = scoresTypes.map(st => st.id).includes(newService) ? newService : 'scoresaber'

    scoresStore.fetch(newServiceParams, newService, newPlayerId);

    return {playerId: newPlayerId, service: newService, serviceParams: newServiceParams}
  }

  function onPageChanged(event) {
    if (!(event?.detail?.initial ?? false)) scrollToTop();

    const page = (event?.detail?.page ?? 0) + 1

    dispatch('page-changed', page);
  }

  function onScoreTypeChanged(event) {
    // TODO
    scrollToTop();
    const type = event?.detail?.id ?? null;

    dispatch('type-changed', type);
  }

  function scrollToTop() {
    if (scoresBoxEl) scrollToTargetAdjusted(scoresBoxEl, 44)
  }

  function updateTotalScores(numOfScores) {
    pagerTotalScores = numOfScores
  }

  async function updateAvailableScoresTypes(playerId, withAccSaber) {
    if (!playerId) return;

    let newScoresTypes = allScoresTypes;
    if (!await beatSaviorService.isDataForPlayerAvailable(playerId)) {
      newScoresTypes = newScoresTypes.filter(st => st.id !== 'beatsavior');
    }

    if (!withAccSaber) {
      newScoresTypes = newScoresTypes.filter(st => st.id !== 'accsaber');
    }

    scoresTypes = newScoresTypes;
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

  $: updateAvailableScoresTypes(playerId, withAccSaber)
  $: playerId, type, playerScoresByDate = null, playerScoresType = null;
  $: refreshAllPlayerSsRecentScores(playerId, currentService, currentServiceParams)
  $: refreshAllPlayerSsTopScores(playerId, currentService, currentServiceParams)
  $: refreshAllPlayerBeatSaviorScores(playerId, currentService)

  $: changeParams(playerId, initialService, initialServiceParams, initialState, initialStateType)
  $: currentService = $scoresStore && scoresStore ? scoresStore?.getService() : null;
  $: currentServiceParams = $scoresStore && scoresStore ? scoresStore?.getServiceParams() : null;
  $: page = currentServiceParams?.page ?? null;
  // TODO: remove type & replace with currentService
  $: type = $scoresStore && scoresStore && scoresStore.getType ? scoresStore.getType() : null;
  $: totalScores = $scoresStore && scoresStore && scoresStore.getTotalScores ? scoresStore.getTotalScores() : null;
  $: isLoading = scoresStore ? scoresStore.isLoading : false;
  $: pending = scoresStore ? scoresStore.pending : null;
  $: error = scoresStore ? scoresStore.error : null;
  $: scoreType = scoresTypes.find(st => st.id === type);

  $: loadingScoreType = $pending ? scoresTypes.find(st => st.id === opt($pending, 'type')) : null

  $: scoresStore && scoresStore.fetch(currentServiceParams, currentService)
  $: updateTotalScores(totalScores !== null && totalScores !== undefined ? totalScores : numOfScores)

  $: console.error(currentService, currentServiceParams)
</script>

<div class="box has-shadow" bind:this={scoresBoxEl}>
  {#if $error}
    <div><Error error={$error} /></div>
  {/if}

  <Switcher values={scoresTypes} value={scoreType} on:change={onScoreTypeChanged} loadingValue={loadingScoreType} />

  {#if $scoresStore && $scoresStore.length}
  <div class="song-scores grid-transition-helper">
    {#each $scoresStore as songScore, idx (opt(songScore, 'leaderboard.leaderboardId'))}
      <SongScore {playerId} {songScore} {fixedBrowserTitle} {idx} {type} {withAccSaber} />
    {/each}
  </div>
  {:else}
    <p>No scores.</p>
  {/if}

  {#if Number.isFinite(page) && (!Number.isFinite(pagerTotalScores) || pagerTotalScores > 0)}
    <Pager totalItems={pagerTotalScores} itemsPerPage={type === 'accsaber/recent' ? ACCSABER_PLAYER_SCORES_PER_PAGE : PLAYER_SCORES_PER_PAGE} itemsPerPageValues={null}
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