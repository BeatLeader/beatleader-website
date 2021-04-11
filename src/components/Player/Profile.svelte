<script>
  import Error from '../Common/Error.svelte'
  import processPlayerData from './utils/profile';
  import Avatar from './Avatar.svelte'
  import PlayerStats from './PlayerStats.svelte'
  import SsBadges from './SsBadges.svelte'
  import ScoresStats from './ScoresStats.svelte'

  export let playerData;
  export let isLoading = false;
  export let error = null;

  $: ({playerInfo, prevInfo, scoresStats, ssBadges} = processPlayerData(playerData))
</script>

<section class="player-profile" class:loading={isLoading}>
  <div class="box has-shadow">
    <div class="columns">
      <div class="column is-narrow avatar enlarge">
        <Avatar {playerInfo} {isLoading} />
      </div>

      <div class="column">
        <div class="columns player-name">
          <div class="column">
            {#if error}<div><Error {error}/></div>{/if}

            <PlayerStats {playerInfo} {prevInfo} />
          </div>
        </div>

        {#if scoresStats || ssBadges}
        <div class="columns">
          <div class="column">
            <ScoresStats stats={scoresStats} />
            <SsBadges badges={ssBadges} />
          </div>
        </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<style>
    .column.avatar {
        position: relative;
        text-align: center;
        margin-right: 1rem;
        min-width: calc(150px + 1.5rem + 1rem);
        min-height: 190px;
    }
</style>