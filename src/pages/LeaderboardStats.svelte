<script>
  import {fade, fly} from 'svelte/transition'
  import createLeaderboardStore from '../stores/http/http-leaderboard-store'
  import {opt} from '../utils/js'
  import Value from '../components/Common/Value.svelte'
  import Spinner from '../components/Common/Spinner.svelte'
  import Duration from '../components/Song/Duration.svelte'

  export let leaderboardId;

  if (leaderboardId && !Number.isFinite(leaderboardId)) leaderboardId = parseInt(leaderboardId, 10);

  let leaderboard = null;

  const leaderboardStore = createLeaderboardStore(leaderboardId, 0, 1);

  function changeParams(newLeaderboardId) {
    if (newLeaderboardId && !Number.isFinite(newLeaderboardId)) newLeaderboardId = parseInt(newLeaderboardId, 10);
    leaderboardStore.fetch(newLeaderboardId, 0, 1);
  }

  $: isLoading = leaderboardStore.isLoading;
  $: pending = leaderboardStore.pending;
  $: enhanced = leaderboardStore.enhanced

  $: changeParams(leaderboardId)
  $: if ($leaderboardStore || $enhanced) leaderboard = opt($leaderboardStore, 'leaderboard', null)
</script>

<article transition:fade>
  {#if !$leaderboardStore && $isLoading}
    <Spinner/>
  {/if}

  {#if $leaderboardStore}
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
      </div>
    {/if}
  {/if}
</article>

<style>
    .stats {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-evenly;
        column-gap: 1em;
        padding: .4em;
    }
</style>