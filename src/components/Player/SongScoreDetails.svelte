<script>
  import {LEADERBOARD_SCORES_PER_PAGE} from '../../utils/scoresaber/consts'
  import {LEADERBOARD_SCORES_PER_PAGE as ACCSABER_LEADERBOARD_SCORES_PER_PAGE} from '../../utils/accsaber/consts'
  import {opt} from '../../utils/js'
  import BeatSaviorDetails from '../BeatSavior/Details.svelte'
  import LeaderboardPage from '../../pages/Leaderboard.svelte'
  import LeaderboardStats from '../../pages/LeaderboardStats.svelte'

  export let playerId;
  export let songScore;
  export let fixedBrowserTitle = null;
  export let noBeatSaviorHistory = false;
  export let noSsLeaderboard = false;
  export let showAccSaberLeaderboard = false;

  let inBuiltLeaderboardPage = null;

  function updateInBuiltLeaderboardPage(rank, type) {
    if (!rank) {
      inBuiltLeaderboardPage = null;
      return;
    }

    inBuiltLeaderboardPage = Math.floor((rank - 1) / (type === 'accsaber' ? ACCSABER_LEADERBOARD_SCORES_PER_PAGE : LEADERBOARD_SCORES_PER_PAGE)) + 1;
  }

  function onInBuiltLeaderboardPageChanged(event) {
    const newPage = opt(event, 'detail.page');
    if (!Number.isFinite(newPage)) return;

    inBuiltLeaderboardPage = newPage;
  }

  $: leaderboard = opt(songScore, 'leaderboard', null);
  $: score = opt(songScore, 'score', null);
  $: prevScore = opt(songScore, 'prevScore', null);
  $: beatSavior = opt(songScore, 'beatSavior', null)

  $: updateInBuiltLeaderboardPage(score && score.rank ? score.rank : null, 'leaderboard')
</script>

<section class="details">
  {#if songScore}
    <div className="tab">
      <LeaderboardStats  leaderboardId={leaderboard.leaderboardId}
                         type="global"
                         page={inBuiltLeaderboardPage}
      />
    </div>

    <div className="tab">
      <BeatSaviorDetails {playerId} {beatSavior} {leaderboard} noHistory={noBeatSaviorHistory}/>
    </div>

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
                         higlightedPlayerId={playerId}
        />
      </div>
    {:else}
      <div className="tab">
        <LeaderboardPage leaderboardId={leaderboard.leaderboardId}
                         type="global"
                         page={inBuiltLeaderboardPage}
                         autoScrollToTop={false}
                         showStats={false}
                         dontNavigate={true} withoutDiffSwitcher={true} withoutHeader={true}
                         on:page-changed={onInBuiltLeaderboardPageChanged}
                         {fixedBrowserTitle}
                         higlightedPlayerId={playerId}
        />
      </div>
    {/if}
  {/if}
</section>


<style>
    .details {
        padding: 1rem 0;
    }

    nav {
        margin-bottom: 1rem;
    }

    .tab {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
        overflow: hidden;
    }

    .tab > :global(*) {
        grid-area: 1 / 1 / 1 / 1;
    }
</style>