<script>
  import {formatDate, formatDateWithOptions, truncateDate} from '../../utils/date'
  import {PLAYER_SCORES_PER_PAGE} from '../../utils/beatleader/consts'
  import {PLAYER_SCORES_PER_PAGE as ACCSABER_PLAYER_SCORES_PER_PAGE} from '../../utils/accsaber/consts'
  import {formatNumber} from '../../utils/format'
  import createScoresService from '../../services/beatleader/scores'
  import createBeatSaviorService from '../../services/beatsavior'
  import createAccSaberService from '../../services/accsaber'
  import ChartBrowser from '../Common/ChartBrowser.svelte'
  import Pager from '../Common/Pager.svelte'
  import {debounce} from '../../utils/debounce'

  export let playerId = null;
  export let service = null;
  export let serviceParams = null;
  export let totalItems = null;
  export let currentPage = 0;
  export let loadingPage = null;

  const DEBOUNCE_THRESHOLD = 500;

  const scoresService = createScoresService();
  const beatSaviorService = createBeatSaviorService();
  const accSaberService = createAccSaberService();

  let playerScores = null;
  let groupedPlayerScores = null;
  let playerScoresHistogram = null;
  let playerScoresHistogramBucketSize = null;
  let playerScoresHistogramBucketSizeHash = null;

  const getHistogramBucketSizeHash = (playerId, service, serviceParams) => `${playerId ?? ''}::${service ?? ''}::${serviceParams?.sort ?? ''}`

  const groupScores = (scores, keyFunc = score => truncateDate(score?.timeSet)?.getTime(), order = 'desc') =>
    Object.values(
      scores
        .reduce((scores, score) => {
          const key = keyFunc(score);
          if (key === null || key === undefined) return scores;

          if (!scores[key]) scores[key] = [];

          scores[key].push({key, score});

          return scores;
        }, {}),
    )
      .sort((a, b) => order === 'asc' ? a?.[0]?.key - b?.[0]?.key : b?.[0].key - a?.[0].key)
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
      .sort((a, b) => order === 'asc' ? a.x - b. x : b.x - a.x);

  async function refreshAllPlayerServiceScores(playerId, service, serviceParams) {
    if (!playerId) return;

    let serviceObj = null;
    switch (service) {
      case 'beatleader':
        serviceObj = scoresService;
        break;

      case 'beatsavior':
        serviceObj = beatSaviorService;
        break;

      case 'accsaber':
        serviceObj = accSaberService;
        break;
    }

    if (!serviceObj) return;

    playerScoresHistogram = serviceObj.getScoresHistogramDefinition(serviceParams);

    const currentHistogramBucketSizeHash = getHistogramBucketSizeHash(playerId, service, serviceParams)
    if (playerScoresHistogramBucketSizeHash !== currentHistogramBucketSizeHash) {
      playerScoresHistogramBucketSize = playerScoresHistogram.bucketSize;
      playerScoresHistogramBucketSizeHash = currentHistogramBucketSizeHash;
    }

    playerScores = (await serviceObj.getPlayerScores(playerId))
      .filter(playerScoresHistogram.filter)
      .sort(playerScoresHistogram.sort)
  }

  function resetCurrentValues() {
    playerScores = null;
    groupedPlayerScores = null;
    playerScoresHistogram = null;

    if (playerScoresHistogramBucketSizeHash !== getHistogramBucketSizeHash(playerId, service, serviceParams))
      playerScoresHistogramBucketSize = null;
  }

  function refreshGroupedScores() {
    groupedPlayerScores = playerScores?.length && playerScoresHistogram
      ? groupScores(
        playerScores,
        playerScoresHistogram.getRoundedValue(playerScoresHistogramBucketSize),
        playerScoresHistogram.order,
      )
        .filter(playerScoresHistogram.histogramFilter)
      : null
  }

  const debouncedRefreshGroupedScores = debounce(() => refreshGroupedScores(), DEBOUNCE_THRESHOLD)

  const chartBrowserTooltipTitle = ctx => playerScoresHistogram?.type === 'time'
    ? formatDate(new Date(ctx?.raw?.x), 'long', ['hour', 'minute'].includes(playerScoresHistogramBucketSize) ? 'short' : null)
    : `${playerScoresHistogram.prefixLong ?? playerScoresHistogram.prefix}${formatNumber(ctx?.raw?.x, playerScoresHistogram.round)}${` - ${formatNumber(ctx?.raw?.x + playerScoresHistogramBucketSize, playerScoresHistogram.round)}`}${playerScoresHistogram.suffixLong ?? playerScoresHistogram.suffix}`;

  const chartBrowserTooltipLabel = ctx => (ctx?.raw?.page ?? null) !== null
    ? [`${formatNumber(ctx?.raw?.y, 0)} score(s)`, '', `Click to go to page ${ctx.raw.page + 1}`]
    : null;

  const chartBrowserTickFormat = (val, idx, ticks) => playerScoresHistogram?.type === 'time'
    ? formatDateWithOptions(new Date(ticks?.[idx]?.value), {
      localeMatcher: 'best fit',
      year: ['year'].includes(playerScoresHistogramBucketSize) ? 'numeric' : '2-digit',
      month: ['month', 'day', 'hour', 'minute'].includes(playerScoresHistogramBucketSize) ? 'short' : undefined,
      day: ['hour', 'minute'].includes(playerScoresHistogramBucketSize) ? 'numeric' : undefined,
    })
    : `${playerScoresHistogram.prefix}${formatNumber(ticks?.[idx]?.value, playerScoresHistogram.round)}${playerScoresHistogram.suffix}`

  $: playerId, service, serviceParams, resetCurrentValues();
  $: refreshAllPlayerServiceScores(playerId, service, serviceParams);
  $: debouncedRefreshGroupedScores(playerScores, playerScoresHistogram, playerScoresHistogramBucketSize);
</script>

<Pager {totalItems} itemsPerPage={service === 'accsaber' ? ACCSABER_PLAYER_SCORES_PER_PAGE : PLAYER_SCORES_PER_PAGE} itemsPerPageValues={null}
       {currentPage} {loadingPage}
       mode={totalItems ? 'pages' : 'simple'}
       on:page-changed
/>

{#if groupedPlayerScores?.length}
  <section class="scores-date-browse">
    <ChartBrowser data={groupedPlayerScores} type={playerScoresHistogram?.type} order={playerScoresHistogram?.order ?? 'desc'}
                  tooltipTitleFunc={chartBrowserTooltipTitle}
                  tooltipLabelFunc={chartBrowserTooltipLabel}
                  tickFormatFunc={chartBrowserTickFormat}
                  on:page-changed
    />
  </section>

  {#if playerScoresHistogramBucketSize && playerScoresHistogram?.minBucketSize && playerScoresHistogram?.maxBucketSize && playerScoresHistogram?.bucketSizeStep}
    <div class="histogram-controls">
      <div class="range" title="Change histogram bucket size">
        <input type="range" bind:value={playerScoresHistogramBucketSize}
               min={playerScoresHistogram.minBucketSize}
               max={playerScoresHistogram.maxBucketSize}
               step={playerScoresHistogram.bucketSizeStep}
        />

        <span>{`${formatNumber(playerScoresHistogramBucketSize, playerScoresHistogram?.round ?? 2)}${playerScoresHistogram.suffixLong ?? playerScoresHistogram.suffix}`}</span>

        <i class="fa fa-undo" title="Reset bucket size to default value"
           on:click={() => playerScoresHistogramBucketSize = playerScoresHistogram.bucketSize}
        ></i>
      </div>
    </div>
  {/if}
{/if}

<style>
    .scores-date-browse {
        margin-top: 1rem;
        width: 100%;
        height: 100px;
    }

    .histogram-controls {
        display: flex;
        justify-content: flex-end;
        align-items: center;
    }

    .range {
        display: inline-flex;
    }

    .range > *:not(:last-child) {
        margin-right: .5em;
    }

    .range i.fa {
        cursor: pointer;
        padding-top: .25em;
    }
</style>