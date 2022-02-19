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
  <title>Privacy policy - {ssrConfig.name}</title>
</svelte:head>

<article bind:this={articleEl} transition:fade>
  <ContentBox>
    <h1 class="title is-3">Privacy policy</h1>

    <p><strong>This website does not collect any data.</strong></p>

    <p>I believe we all deserve the Internet that I know from the late 90's - not that ugly, but that private.</p>

    <p>To be honest, it's not even a website - it's an application that runs in your browser, and it's only delivered
      to your computer through this website. All downloaded data stays only in your computer's browser (so remember
      to make regular backups ;-)</p>

    <p>The only identifying information sent externally from your computer is player IDs. They are passed to all the APIs this app uses to
      retrieve your and your friends' scores. All APIs that this app uses are listed on the
      <a href="/credits" on:click|preventDefault={() => navigate('/credits')}>Credits</a> page.</p>

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