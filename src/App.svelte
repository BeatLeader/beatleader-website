<script>
  import { setContext } from "svelte";
  import { Router, Route, navigate } from "svelte-routing";
  import buildInfo from "../build-info";
  import createContainerStore from "./stores/container";
  import HomePage from "./pages/Home.svelte";
  import SearchPage from "./pages/Search.svelte";
  import RankingPage from "./pages/Ranking.svelte";
  import LeaderboardPage from "./pages/Leaderboard.svelte";
  import LeaderboardsPage from "./pages/Leaderboards.svelte";
  import ClanPage from "./pages/Clan.svelte";
  import ClansPage from "./pages/Clans.svelte";
  import FriendsPage from "./pages/Friends.svelte";
  import PlayerPage from "./pages/Player.svelte";
  import TwitchPage from "./pages/Twitch.svelte";
  import NotFoundPage from "./pages/NotFound.svelte";
  import PrivacyPage from "./pages/Privacy.svelte";
  import AboutPage from "./pages/About.svelte";
  import DashboardPage from "./pages/Dashboard.svelte";
  import PlaylistsPage from "./pages/Playlists.svelte";
  import SigninPage from "./pages/SignIn.svelte";
  import Nav from "./components/Nav.svelte";
  import Modal from "svelte-simple-modal";
  import { configStore } from "./stores/config";
  export let url = "";

  let mainEl = null;

  const containerStore = createContainerStore();

  setContext("pageContainer", containerStore);

  $: if (mainEl) containerStore.observe(mainEl);

  if ($configStore.preferences.theme != "default") {
    let dom = document.createElement("style");
    dom.innerHTML = `html,body{background:url(${$configStore.preferences.bgimage}) var(--background) !important;background-size:cover !important;background-attachment: fixed !important;}`;
    document.head.appendChild(dom);
  }
</script>

<Router {url}>
  <Nav />
  <Modal
    closeButton={false}
    styleWindow={{ width: "90vw", height: "65vh" }}
    styleContent={{ padding: 0 }}
  >
    <main bind:this={mainEl}>
      <div class="ssr-page-container">
        <Route path="/" component={HomePage} />
        <Route path="/u/:initialPlayerId/*initialParams" let:params>
          <PlayerPage
            initialPlayerId={params.initialPlayerId}
            initialParams={params.initialParams}
          />
        </Route>
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/friends" component={FriendsPage} />
        <Route path="/ranking/:type/*page" let:params>
          <RankingPage type={params.type} page={params.page} />
        </Route>
        <Route
          path="/leaderboard/:type/:leaderboardId/*page"
          let:params
          let:location
        >
          <LeaderboardPage
            leaderboardId={params.leaderboardId}
            type={params.type}
            page={params.page}
            {location}
            dontChangeType={false}
            showVotings={true}
          />
        </Route>
        <Route path="/leaderboards/*page" let:params let:location>
          <LeaderboardsPage page={params.page} {location} />
        </Route>
        <Route path="/clan/:clanId/*page" let:params>
          <ClanPage clanId={params.clanId} page={params.page} />
        </Route>
        <Route path="/clans/*page" let:params let:location>
          <ClansPage page={params.page} {location} />
        </Route>
        <Route path="/playlists" component={PlaylistsPage} />
        <Route path="/search">
          <SearchPage changeTitle={true} />
        </Route>
        <Route path="/twitch" component={TwitchPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/signin/*action" let:params>
          <SigninPage action={params.action} />
        </Route>
        <Route path="/*" component={NotFoundPage} />
      </div>
    </main>
  </Modal>
</Router>

<link rel="stylesheet" href="/themes/{$configStore.preferences.theme}.css" />

<footer>
  <p class="build">Build: {buildInfo.buildVersion} ({buildInfo.buildDate})</p>
  <p>
    <a href="/privacy" on:click|preventDefault={() => navigate("/privacy")}
      >Privacy policy</a
    >
    |
    <a href="/about" on:click|preventDefault={() => navigate("/about")}>About</a
    >
    |
    <a href="https://github.com/BeatLeader/beatleader-website">Source</a> |
    <a href="https://discord.gg/2RG5YVqtG6">Discord</a> |
    <a href="https://patreon.com/BeatLeader">Patreon</a>
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
    font-size: 0.875em;
    color: var(--faded);
  }

  footer {
    margin: 1rem 0;
    font-size: 0.75em;
    text-align: center;
  }
</style>
