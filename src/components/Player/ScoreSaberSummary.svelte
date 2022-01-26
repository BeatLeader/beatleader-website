<script>
  import {createEventDispatcher} from 'svelte'
  import createPlayerService from '../../services/scoresaber/player'
  import {addToDate, DAY, formatDateRelative, toSsMidnight} from '../../utils/date'
  import {debounce} from '../../utils/debounce'
  import ScoresStats from './ScoresStats.svelte'

  export let playerId = null;
  export let scoresStats = null;
  export let accStats = null;
  export let accBadges = null;
  export let skeleton = false;
  export let isCached = false;
  export let rankHistory = null;

  const HISTORY_GAIN_DEBOUNCE = 500;

  const dispatch = createEventDispatcher();

  const playerService = createPlayerService();

  let playerHistory = null;
  let playerHistoryGain = null;

  let gainDaysAgo = 1;

  async function refreshPlayerHistory(playerId) {
    if (!playerId) return;

    playerHistory = await playerService.getPlayerHistory(playerId) ?? null;
  }

  function refreshHistoryGain(playerId, playerHistory, rankHistory, daysAgo = 1) {
    playerHistoryGain = null;

    if (!playerId || (!playerHistory?.length && !rankHistory?.length)) return;

    const todaySsDate = toSsMidnight(new Date());
    let gainDaysAgo = null;
    let playerHistoryItem = playerService.getPlayerGain(playerHistory, daysAgo, daysAgo + 7 - 1);
    if (playerHistoryItem) {
      gainDaysAgo = Math.floor((todaySsDate - playerHistoryItem.ssDate) / DAY);
    }

    if (rankHistory?.length) {
      const reversedRankHistory = rankHistory.map(r => r).reverse();
      if (!reversedRankHistory?.[daysAgo]) return;

      if (!playerHistoryItem) playerHistoryItem = {
        playerId,
        rank: reversedRankHistory[daysAgo],
        ssDate: addToDate(-DAY, todaySsDate)
      };
      else {
        playerHistoryItem.rank = reversedRankHistory[gainDaysAgo];
      }
    }

    if (!playerHistoryItem) return;

    playerHistoryGain = {...playerHistoryItem, gainDaysAgo, gainType: 'scoresaber'};
  }

  const debouncedRefreshHistoryGain = debounce(
    (playerId, playerHistory, rankHistory, gainDaysAgo) =>
      refreshHistoryGain(playerId, playerHistory, rankHistory, gainDaysAgo), HISTORY_GAIN_DEBOUNCE,
  );

  let accStatsWithGain = null;

  function updateAccStatsWithGain(accStats, playerGain) {
    accStatsWithGain = accStats?.map(s => ({
        ...s,
        prevValue: playerGain?.[s?.key] ?? null,
        prevLabel: Number.isFinite(playerGain?.gainDaysAgo) ? formatDateRelative(addToDate(-playerGain.gainDaysAgo * DAY)) : null,
        inline: true,
      }))
      ?? null;
  }

  const debouncedUpdateAccStatsWithGain = debounce((accStats, playerHistoryGain) => updateAccStatsWithGain(accStats, playerHistoryGain), HISTORY_GAIN_DEBOUNCE)

  $: refreshPlayerHistory(playerId);
  $: debouncedRefreshHistoryGain(playerId, playerHistory, rankHistory, gainDaysAgo)
  $: debouncedUpdateAccStatsWithGain(accStats, playerHistoryGain)
</script>

<div class="scoresaber-summary">
  {#if scoresStats || skeleton}
    {#if scoresStats}
      <ScoresStats stats={scoresStats} {skeleton}/>
    {/if}
    <div>
      {#if accStats || accStatsWithGain}
        <ScoresStats stats={accStatsWithGain ?? accStats}/>
      {/if}
      {#if accBadges}
        <ScoresStats stats={accBadges}/>
      {/if}
    </div>
  {/if}
</div>

<style>
</style>