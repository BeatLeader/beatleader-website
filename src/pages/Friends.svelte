<script>
  import {navigate} from "svelte-routing";
  import {fade} from 'svelte/transition'
  import ssrConfig from '../ssr-config'
  import ContentBox from "../components/Common/ContentBox.svelte";

  document.body.classList.add('slim');
</script>

<svelte:head>
  <title>Friends - {ssrConfig.name}</title>
</svelte:head>

<article transition:fade>
  <ContentBox>
    <h1 class="title is-3">Not implemented yet :-(</h1>
    <p>Come back later.</p>

    <p><a href="" on:click|preventDefault={() => navigate('/')}>Back to Home</a></p>
  </ContentBox>
</article>

<style>
    article {
        text-align: center;
    }

    p {
        text-align: center;
    }
</style>