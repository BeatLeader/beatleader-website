<script>
  import {Router, Route} from "svelte-routing";
  import buildInfo from '../build-info';
  import HomePage from './pages/Home.svelte';
  import PlayerPage from './pages/Player.svelte';
  import NotFoundPage from './pages/NotFound.svelte';
  import QueueStats from './components/Common/QueueStats.svelte'

  export let url = "";
</script>

<QueueStats />

<Router {url}>
  <main class="section">
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
    <a href="https://www.beatsavior.io">Beat Savior API</a>.
  </p>
</footer>

<style>
    .sspl-page-container {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
        overflow: hidden;
        min-height: calc(100vh - 7rem);
    }

    .sspl-page-container :global(> *) {
        grid-area: 1 / 1 / 1 / 1;
    }

    .section {
        padding: 1rem;
    }

    @media (max-width: 400px) {
        .section {
            padding: .5rem 0;
        }
    }

    footer {
        margin-top: 1rem;
        font-size: .75em;
        text-align: center;
    }
</style>