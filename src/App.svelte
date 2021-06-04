<script>
  import {Router, Route} from "svelte-routing";
  import HomePage from './pages/Home.svelte';
  import PlayerPage from './pages/Player.svelte';

  export let url = "";
</script>

<Router url="{url}">
  <main class="section">
    <div class="sspl-page-container">
      <Route path="/u/:initialPlayerId/:initialScoresType" component="{PlayerPage}" />
      <Route path="/u/:initialPlayerId" component="{PlayerPage}" />
      <Route path="/" component="{HomePage}" />
    </div>
  </main>
</Router>

<footer>
  <p>ScoreSaber Reloaded by <a href="https://github.com/motzel">motzel</a></p>
  <p>
    Uses <a href="https://scoresaber.com">ScoreSaber API</a>,
    <a href="https://beatsaver.com">Beat Saver API</a>,
    <a href="https://www.beatsavior.io">Beat Savior API</a>.
  </p>
</footer>

<style>
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