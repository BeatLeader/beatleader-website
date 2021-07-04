<script>
  import {navigate} from "svelte-routing";
  import {fade} from 'svelte/transition'
</script>

<article transition:fade>
  <h1 class="title is-3">Not implemented yet :-(</h1>
  <p>Come back later.</p>

  <p><a href="" on:click|preventDefault={() => navigate('/')}>Back to Home</a></p>
</article>

<style>
  article {
      max-width: 1024px;
      margin: 0 auto;
      text-align: center;
  }

  p {
      text-align: center;
  }
</style>