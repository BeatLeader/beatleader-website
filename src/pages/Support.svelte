<script>
    import {navigate} from "svelte-routing";
    import {fade} from 'svelte/transition'
    import ssrConfig from '../ssr-config'
    import {scrollToTargetAdjusted} from '../utils/browser'
    import ContentBox from "../components/Common/ContentBox.svelte";
  
    document.body.classList.add('slim');
  
    let articleEl = null;
  
    function scrollToTop() {
      if (articleEl) scrollToTargetAdjusted(articleEl, 50)
    }
  
    $: scrollToTop(articleEl)
  </script>
  
  <svelte:head>
    <title>Support - {ssrConfig.name}</title>
  </svelte:head>
  
  <article bind:this={articleEl} transition:fade>
    <ContentBox>
      <h1 class="title is-3">Support</h1>
    
      If you have any issues with mods, websites or app - <br>
      <b> the quiest and easiest way to resolve them will be to ping me in <a href="https://discord.com/users/698212038106677259">Discord(NSGolova#3325).</a></b><br><br>

      or<br><br>

      <a href="https://discord.gg/2RG5YVqtG6">Join our Discord server</a>. And ask in #help or write report in #bugreports.<br><br>
      
      or<br><br>

      <a href="mailto:golova@golova.dev">Write me an email</a>. And I'll know a <a href="/clan/GENX">clan for you</a> ¯\_(ツ)_/¯<br><br>
  
      <p class="back"><a href="/" on:click|preventDefault={() => navigate('/')}>Back to Home</a></p>
    </ContentBox>
  </article>
  
  <style>
      p {
          margin-bottom: .5rem;
      }
  
      p.back {
          margin-top: 1rem;
      }
  
      strong {
          color: var(--alternate) !important;
      }
  </style>