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
  import Modal from 'svelte-simple-modal';

  export let url = "";

  let mainEl = null;

  const containerStore = createContainerStore();

  setContext('pageContainer', containerStore);

  $: if (mainEl) containerStore.observe(mainEl)
</script>

<Router {url}>
  <Nav />
  <Modal closeButton={false} styleWindow={{width: "90vw", height: "65vh"}} styleContent={{padding: 0}}>

  <main bind:this={mainEl}>
    <div class="ssr-page-container">
      <Route path="/u/:initialPlayerId/*initialParams" let:params>
        <PlayerPage initialPlayerId={params.initialPlayerId} initialParams={params.initialParams}/>
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
</Modal>
</Router>

<footer>
  <p>BeatLeader by <a href="https://github.com/motzel">motzel</a></p>
  <p class="build">Build: {buildInfo.buildVersion} ({buildInfo.buildDate})</p>
  <p>
    <a href="/privacy" on:click|preventDefault={() => navigate('/privacy')}>Privacy policy</a> |
    <a href="/credits" on:click|preventDefault={() => navigate('/credits')}>Credits</a> |
    <a href="https://github.com/radulov/scoresaber-reloaded">Source</a>
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
        margin: 1rem 0;
        font-size: .75em;
        text-align: center;
    }
</style>