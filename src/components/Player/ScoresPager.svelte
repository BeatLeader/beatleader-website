<script>
  import {formatDate, formatDateWithOptions, truncateDate} from '../../utils/date'
  import {PLAYER_SCORES_PER_PAGE} from '../../utils/scoresaber/consts'
  import {PLAYER_SCORES_PER_PAGE as ACCSABER_PLAYER_SCORES_PER_PAGE} from '../../utils/accsaber/consts'
  import {formatNumber, roundToPrecision} from '../../utils/format'
  import createScoresService from '../../services/scoresaber/scores'
  import createBeatSaviorService from '../../services/beatsavior'
  import ChartBrowser from '../Common/ChartBrowser.svelte'
  import Pager from '../Common/Pager.svelte'

  export let playerId = null;
  export let service = null;
  export let serviceSort = null;
  export let totalItems = null;
  export let currentPage = 0;
  export let loadingPage = null;

  const SS_TOP_CHART_BROWSER_PRECISON = 5;

  const scoresService = createScoresService();
  const beatSaviorService = createBeatSaviorService();

  let playerScoresByField = null;
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
    .sort((a, b) => b?.[0].key - a?.[0].key)
    .reduce((cum, values) => {
      if (!values?.length) return cum;

      const x = values[0].key;
      const y = values.length;

      const prevTotal = cum.length ? cum[cum.length - 1].total : 0;
      const page = Math.floor(prevTotal / (service === 'accsaber' ? ACCSABER_PLAYER_SCORES_PER_PAGE : PLAYER_SCORES_PER_PAGE));
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
    .sort((a, b) => b.x - a.x)

  async function refreshAllPlayerSsRecentScores(playerId, service, serviceSort) {
    if (!playerId || service !== 'scoresaber' || serviceSort !== 'recent') return;

    playerScoresType = 'time';
    playerScoresByField = groupScores((await scoresService.getPlayerScores(playerId)).sort((a, b) => b?.timeSet - a?.timeSet))
  }

  async function refreshAllPlayerSsTopScores(playerId, service, serviceSort) {
    if (!playerId || service !== 'scoresaber' || serviceSort !== 'top') return;

    playerScoresType = 'linear';
    playerScoresByField = groupScores(
      (await scoresService.getPlayerScores(playerId))
        .filter(s => Number.isFinite(s?.pp) && s.pp > 0)
        .sort((a, b) => b?.pp - a?.pp),
      score => roundToPrecision(score?.pp, SS_TOP_CHART_BROWSER_PRECISON),
    )
  }

  async function refreshAllPlayerBeatSaviorScores(playerId, service) {
    if (!playerId || service !== 'beatsavior') return;

    playerScoresType = 'time';
    playerScoresByField = groupScores((await beatSaviorService.getPlayerBeatSaviorData(playerId)).sort((a, b) => b?.timeSet - a?.timeSet))
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

  $: playerId, service, serviceSort, playerScoresByField = null, playerScoresType = null;
  $: refreshAllPlayerSsRecentScores(playerId, service, serviceSort)
  $: refreshAllPlayerSsTopScores(playerId, service, serviceSort)
  $: refreshAllPlayerBeatSaviorScores(playerId, service)
</script>

<Pager {totalItems} itemsPerPage={service === 'accsaber' ? ACCSABER_PLAYER_SCORES_PER_PAGE : PLAYER_SCORES_PER_PAGE} itemsPerPageValues={null}
       {currentPage} {loadingPage}
       mode={totalItems ? 'pages' : 'simple'}
       on:page-changed
/>

{#if playerScoresByField?.length}
  <section class="scores-date-browse">
    <ChartBrowser data={playerScoresByField} type={playerScoresType}
                  tooltipTitleFunc={chartBrowserTooltipTitle}
                  tooltipLabelFunc={chartBrowserTooltipLabel}
                  tickFormatFunc={chartBrowserTickFormat}
                  on:page-changed
    />
  </section>
{/if}

<style>
    .scores-date-browse {
        margin-top: 1rem;
        width: 100%;
        height: 100px;
    }
</style>