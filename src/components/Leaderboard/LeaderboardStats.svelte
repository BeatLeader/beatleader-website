<script>
  import {fade} from 'svelte/transition'
  import Value from '../Common/Value.svelte'
  import Duration from '../Song/Duration.svelte'

  export let leaderboard;

  $: metadata = leaderboard ? {...leaderboard?.difficulty, duration: leaderboard?.song?.duration, bpm: leaderboard?.song.bpm} : null;
</script>

<article transition:fade>
  {#if metadata}
    <div class="stats">
      {#if metadata?.duration}
        <div transition:fade>
                <span class="time" transition:fade={{duration: 500}}>
                    <i class="fas fa-clock"></i> Length: <strong>
                  <Duration value={metadata.duration}/>
                </strong></span>
        </div>
      {/if}

      {#if metadata.notes}
        <div transition:fade><i class="fas fa-music"></i> Notes: <strong>
          <Value value={metadata.notes} digits={0}/>
        </strong></div>
      {/if}

      {#if metadata?.bpm}
        <div transition:fade><i class="fas fa-drum"></i> BPM: <strong>
          <Value value={metadata.bpm} digits={0}/>
        </strong></div>
      {/if}

      {#if metadata.njs}
        <div transition:fade><i class="fas fa-tachometer-alt"></i> NJS: <strong>
          <Value value={metadata.njs} digits={0}/>
        </strong></div>
      {/if}

      {#if metadata.nps}
        <div transition:fade><i class="fas fa-fire"></i> NPS: <strong>
          <Value value={metadata.nps} digits={2}/>
        </strong></div>
      {/if}

      {#if metadata.bombs}
        <div transition:fade><i class="fas fa-bomb"></i> Bombs: <strong>
          <Value value={metadata.bombs} digits={0} zero="0"/>
        </strong></div>
      {/if}

      {#if metadata.walls}
        <div transition:fade><i class="fas fa-gopuram"></i> Walls: <strong>
          <Value value={metadata.walls} digits={0} zero="0"/>
        </strong></div>
      {/if}
    </div>
  {/if}
</article>

<style>
    .stats {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-evenly;
        column-gap: 1em;
    }
</style>