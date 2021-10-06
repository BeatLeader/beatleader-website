<script>
  import {setContext} from 'svelte'
  import {Router, Route, navigate} from "svelte-routing";
  import buildInfo from '../build-info';
  import createContainerStore from './stores/container';
  import HomePage from './pages/Home.svelte';
  import SearchPage from './pages/Search.svelte';
  import RankingPage from './pages/Ranking.svelte';
  import LeaderboardPage from './pages/Leaderboard.svelte';
  import FriendsPage from './pages/Friends.svelte';
  import PlayerPage from './pages/Player.svelte';
  import TwitchPage from './pages/Twitch.svelte';
  import NotFoundPage from './pages/NotFound.svelte';
  import PrivacyPage from './pages/Privacy.svelte';
  import CreditsPage from './pages/Credits.svelte';
  import Nav from './components/Nav.svelte';

  export let url = "";

  let mainEl = null;

  const containerStore = createContainerStore();

  setContext('pageContainer', containerStore);

  $: if (mainEl) containerStore.observe(mainEl)
</script>

<Router {url}>
  <Nav />

  <main bind:this={mainEl}>
    <div class="ssr-page-container">
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
      <Route path="/privacy" component="{PrivacyPage}" />
      <Route path="/credits" component="{CreditsPage}" />
      <Route path="/friends" component="{FriendsPage}" />
      <Route path="/ranking/:type/*page" let:params>
        <RankingPage type={params.type} page={params.page} />
      </Route>
      <Route path="/leaderboard/:type/:leaderboardId/*page" let:params>
        <LeaderboardPage leaderboardId={params.leaderboardId} type={params.type} page={params.page} />
      </Route>
      <Route path="/search" component="{SearchPage}" />
      <Route path="/twitch" component="{TwitchPage}" />
      <Route path="/" component="{HomePage}" />
      <Route path="/*" component="{NotFoundPage}" />
    </div>
  </main>
</Router>

<footer>
  <p>ScoreSaber Reloaded by <a href="https://github.com/motzel">motzel</a></p>
  <p class="build">Build: {buildInfo.buildVersion} ({buildInfo.buildDate})</p>
  <p>
    <a href="/privacy" on:click|preventDefault={() => navigate('/privacy')}>Privacy policy</a> |
    <a href="/credits" on:click|preventDefault={() => navigate('/credits')}>Credits</a>
  </p>
</footer>

<style>
    main {
        margin-top: 1em;
    }

    .ssr-page-container {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
        overflow: hidden;
        min-height: calc(100vh - 9rem);
    }

    .ssr-page-container :global(> *) {
        grid-area: 1 / 1 / 1 / 1;
    }

    .build {
        font-size: .875em;
        color: var(--faded);
    }

    footer {
        margin-top: 1rem;
        font-size: .75em;
        text-align: center;
    }
</style>