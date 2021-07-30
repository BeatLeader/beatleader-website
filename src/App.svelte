<script>
  import {Router, Route} from "svelte-routing";
  import buildInfo from '../build-info';
  import HomePage from './pages/Home.svelte';
  import SearchPage from './pages/Search.svelte';
  import RankingPage from './pages/Ranking.svelte';
  import LeaderboardPage from './pages/Leaderboard.svelte';
  import FriendsPage from './pages/Friends.svelte';
  import PlayerPage from './pages/Player.svelte';
  import NotFoundPage from './pages/NotFound.svelte';
  import Nav from './components/Nav.svelte';
  import Dialog from './components/Common/Dialog.svelte'
  import Button from './components/Common/Button.svelte'

  export let url = "";

  let showModal = true;
</script>

<a on:click={() => showModal=true}>test</a>

{#if showModal}
<Dialog closeable={true} on:confirm={() => showModal = false}>
  <svelte:fragment slot="header">
    Are you sure?
  </svelte:fragment>

  <svelte:fragment slot="content">
    This is just a test.
  </svelte:fragment>

  <svelte:fragment slot="footer">
    <Button label="Save" type="primary" on:click={() => showModal = false} />
    <Button label="Cancel" on:click={() => showModal = false} />
  </svelte:fragment>
</Dialog>
{/if}

<Router {url}>
  <Nav />

  <main>
    <div class="sspl-page-container">
      <Route path="/u/:initialPlayerId/*initialScoresType" let:params>
        <PlayerPage initialPlayerId={params.initialPlayerId}
                    initialScoresType={
                      params.initialScoresType && params.initialScoresType.indexOf('/') > 0
                        ? params.initialScoresType.substr(0, params.initialScoresType.indexOf('/'))
                        : params.initialScoresType
                    }
                    initialScoresPage={
                      params.initialScoresType && params.initialScoresType.indexOf('/') > 0
                        ? params.initialScoresType.substr(params.initialScoresType.indexOf('/') + 1)
                        : 1
                    }
        />
      </Route>
      <Route path="/friends" component="{FriendsPage}" />
      <Route path="/ranking/:type/*page" let:params>
        <RankingPage type={params.type} page={params.page} />
      </Route>
      <Route path="/leaderboard/:type/:leaderboardId/*page" let:params>
        <LeaderboardPage leaderboardId={params.leaderboardId} type={params.type} page={params.page} />
      </Route>
      <Route path="/search" component="{SearchPage}" />
      <Route path="/" component="{HomePage}" />
      <Route path="/*" component="{NotFoundPage}" />
    </div>
  </main>
</Router>

<footer>
  <p>ScoreSaber Reloaded by <a href="https://github.com/motzel">motzel</a></p>
  <p>Developer preview build {buildInfo.buildVersion}. Build date: {buildInfo.buildDate}</p>
  <p>
    Uses <a href="https://scoresaber.com">ScoreSaber API</a>,
    <a href="https://beatsaver.com">Beat Saver API</a>,
    <a href="https://www.beatsavior.io">Beat Savior API</a>,
    <a href="https://heroicons.com/">heroicons</a>
  </p>
</footer>

<style>
    .sspl-page-container {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
        overflow: hidden;
        min-height: calc(100vh - 8rem);
    }

    .sspl-page-container :global(> *) {
        grid-area: 1 / 1 / 1 / 1;
    }

    @media (max-width: 450px) {
        .section {
            padding: .5rem;
        }
    }

    footer {
        margin-top: 1rem;
        font-size: .75em;
        text-align: center;
    }
</style>