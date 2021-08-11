<script>
  import {navigate} from "svelte-routing";
  import {fade} from 'svelte/transition'
  import ssrConfig from '../ssr-config'

  document.body.classList.add('slim');
</script>

<svelte:head>
  <title>404 | You missed - {ssrConfig.name}</title>
</svelte:head>

<article transition:fade>
  <div class="box has-shadow">
    <h1 class="title is-3">404 | You missed</h1>

    <p><a href="" on:click|preventDefault={() => navigate('/')}>Back to Home</a></p>

    <img src="/assets/miss.gif" width="306" height="342" alt="Miss"/>
  </div>
</article>

<style>
    article {
        text-align: center;
    }

    p {
        text-align: center;
    }

    img {
        margin-top: 1em;
        max-width: 100%;
        border-radius: 10%;
    }
</style>