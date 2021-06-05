<script>
  import {navigate} from "svelte-routing";
</script>

<article>
  <h1 class="title is-3">404 | Page not found.</h1>

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