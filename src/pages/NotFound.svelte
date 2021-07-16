<script>
  import {navigate} from "svelte-routing";
  import {fade} from 'svelte/transition'
</script>

<article transition:fade>
  <div class="box has-shadow">
    <h1 class="title is-3">404 | Not found</h1>

    <p><a href="" on:click|preventDefault={() => navigate('/')}>Back to Home</a></p>
  </div>
</article>

<style>
    article {
        text-align: center;
    }

    p {
        text-align: center;
    }
</style>