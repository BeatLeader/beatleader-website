<script>
  import {LEADERBOARD_SCORES_PER_PAGE} from '../../utils/beatleader/consts'
  import {LEADERBOARD_SCORES_PER_PAGE as ACCSABER_LEADERBOARD_SCORES_PER_PAGE} from '../../utils/accsaber/consts'
  import scoreStatisticEnhancer from '../../stores/http/enhancers/scores/scoreStatistic'
  import BeatSaviorDetails from '../BeatSavior/Details.svelte'
  import LeaderboardPage from '../../pages/Leaderboard.svelte'
  import LeaderboardStats from '../Leaderboard/LeaderboardStats.svelte'
  import Spinner from '../Common/Spinner.svelte'

  export let playerId;
  export let songScore;
  export let fixedBrowserTitle = null;
  export let noSsLeaderboard = false;
  export let showAccSaberLeaderboard = false;

  let inBuiltLeaderboardPage = null;

  function updateInBuiltLeaderboardPage(rank, scoresPerPage) {
    if (!rank) {
      inBuiltLeaderboardPage = null;
      return;
    }

    inBuiltLeaderboardPage = Math.floor((rank - 1) / scoresPerPage) + 1;
  }

  function onInBuiltLeaderboardPageChanged(event) {
    const newPage = event?.detail?.page;
    if (!Number.isFinite(newPage)) return;

    inBuiltLeaderboardPage = newPage;
  }

  $: leaderboard = songScore?.leaderboard ?? null;
  $: score = songScore?.score ??null;
  $: prevScore = songScore?.prevScore ?? null;
  $: beatSaviorPromise = scoreStatisticEnhancer(songScore);

  $: updateInBuiltLeaderboardPage(score && score.rank ? score.rank : null, (showAccSaberLeaderboard ? ACCSABER_LEADERBOARD_SCORES_PER_PAGE : LEADERBOARD_SCORES_PER_PAGE))
</script>

<section class="details">
  {#if songScore}
    <div class="tab">
      <LeaderboardStats {leaderboard}/>
    </div>

    {#await beatSaviorPromise}
      <div class="tab">
        <Spinner />
      </div>
    {:then beatSavior}
      <div class="tab">
        <BeatSaviorDetails {playerId} {beatSavior} {leaderboard}/>
      </div>
    {/await}

    {#if showAccSaberLeaderboard}
      <div class="tab">
        <LeaderboardPage leaderboardId={leaderboard.leaderboardId}
                         type="accsaber"
                         page={inBuiltLeaderboardPage}
                         autoScrollToTop={false}
                         showStats={false}
                         dontNavigate={true} withoutDiffSwitcher={true} withoutHeader={true}
                         on:page-changed={onInBuiltLeaderboardPageChanged}
                         {fixedBrowserTitle}
                         higlightedScore={score}
        />
      </div>
    {:else}
      {#if !noSsLeaderboard}
        <div class="tab">
          <LeaderboardPage leaderboardId={leaderboard.leaderboardId}
                           type="global"
                           page={inBuiltLeaderboardPage}
                           autoScrollToTop={false}
                           showStats={false}
                           dontNavigate={true} withoutDiffSwitcher={true} withoutHeader={true}
                           on:page-changed={onInBuiltLeaderboardPageChanged}
                           {fixedBrowserTitle}
                           higlightedScore={score}
          />
        </div>
      {/if}
    {/if}
  {/if}
</section>


<style>
    .details {
        display: flex;
        flex-direction: column;
        grid-row-gap: .2em;
        padding-top: .4em;
    }

    nav {
        margin-bottom: 1rem;
    }

    .tab {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
    }

    .tab > :global(*) {
        grid-area: 1 / 1 / 1 / 1;
    }
</style>