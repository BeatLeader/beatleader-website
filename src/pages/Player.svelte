<script>
  import Profile from '../components/Player/Profile.svelte'
  import createPlayerInfoWithScoresStore from '../stores/http-player-info-with-scores-store'
  import Scores from '../components/Player/Scores.svelte'
  import {opt} from '../utils/js'
  import queue from '../network/queues';

  export let initialPlayerId = null;
  export let initialScoresType = 'recent';
  export let initialState = null;

  const ssApiQueueStats = queue.SCORESABER_API;

  let initialType = opt(initialState, 'scoresType', initialScoresType);

  export const changePlayer = async newPlayerId => playerStore.fetch(newPlayerId);

  let playerStore = createPlayerInfoWithScoresStore(initialPlayerId, initialType, initialState);
  let playerIsLoading = opt(playerStore, 'isLoading', false);
  let playerError = opt(playerStore, 'error', null);

  function onTypeChanged(event) {
    playerStore.setType(opt(event, 'detail', initialScoresType));
  }

  $: {
    changePlayer(initialPlayerId);
  }

  $: playerId = $playerStore && playerStore && playerStore.getPlayerId ? playerStore.getPlayerId() : null;
  $: currentType = $playerStore && playerStore && playerStore.getType ? playerStore.getType() : null;
  $: skeleton = !$playerStore && $playerIsLoading;

  function showSsApiStats(queueStats) {
    console.log('---------------')
    console.log(`[In queue] size=${queueStats.size}, pending=${queueStats.pending}`)
    console.log(`[Queue progress]: ${Math.round(queueStats.progress.progress * 100)}% (${queueStats.progress.num}/${queueStats.progress.count})`)
    console.log(`[Queue rate limit]: ${queueStats.rateLimit.waiting}ms, ${queueStats.rateLimit.remaining}/${queueStats.rateLimit.limit}, reset at ${queueStats.rateLimit.resetAt}`)
  }
  $: showSsApiStats($ssApiQueueStats)
</script>

<main>
  <Profile playerData={$playerStore} isLoading={$playerIsLoading} error={$playerError} {skeleton} />

  {#if $playerStore}
    <Scores {playerId} initialState={opt($playerStore, 'scores', null)} initialType={currentType}
            numOfScores={opt($playerStore, 'scoreStats.totalPlayCount', null)}
            on:type-changed={onTypeChanged}
    />
  {/if}
</main>

<style>
  main {
      max-width: 1024px;
      margin: 0 auto;
  }
</style>