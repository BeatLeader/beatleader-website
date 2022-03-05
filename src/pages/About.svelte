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
  <title>About - {ssrConfig.name}</title>
</svelte:head>

<article bind:this={articleEl} transition:fade>
  <ContentBox>
    <h1 class="title is-3">Team</h1>
    <section class="content">
      <div class="member"><img src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/9a/9a2159cfa8e0035593953b231f64fc4c06ba1349_full.jpg" alt="NSGolova"/><a href="https://github.com/NSGolova">NSGolova</a><p class="memberTitle"> - bug factory</p></div>
      <div class="member"><img src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/38/38c54625673d34ec684e650e7203cfa193c02f35_full.jpg" alt="Karghoff"/><a href="https://github.com/karghoff-e">Karghoff</a><p class="memberTitle"> - supporter and bug detective</p></div>
      <div class="member"><img src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/05/05d491662979a9fcde141c228a7f50702ddfa761_full.jpg" alt="Reezonate"/><a href="https://github.com/reezonate">Reezonate</a><p class="memberTitle"> - 3D and UI guru</p></div>

    </section>

    <h1 class="title is-3">ScoreSaber Reloaded Creator</h1>
    <section class="content">
      <div class="member"><img src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/3a/3a733da6e52376759914f2cd792d40e3204227e6_full.jpg" alt="motzel"/><a href="https://github.com/motzel">motzel</a><p class="memberTitle"> - original project creator and greatest contributor.</p></div>

    </section>

    

    <h1 class="title is-3">Credits</h1>

    <section class="content">
      <h2 class="title is-6">This project was only possible thanks to the following great APIs:</h2>
      <ul>
        <li><a href="https://beatsaver.com" target="_blank" rel="noreferrer">Beat Saver API</a></li>
        <li><a href="https://www.beatsavior.io" target="_blank" rel="noreferrer">Beat Savior API</a></li>
        <li><a href="https://accsaber.com" target="_blank" rel="noreferrer">AccSaber API</a></li>
      </ul>

      <h2 class="title is-6">The project also uses the following open source libraries:</h2>
      <ul>
        <li><a href="https://github.com/sveltejs/svelte" target="_blank" rel="noreferrer">svelte</a></li>
        <li><a href="https://github.com/jakearchibald/idb" target="_blank" rel="noreferrer">idb</a></li>
        <li><a href="https://github.com/EmilTholin/svelte-routing" target="_blank" rel="noreferrer">svelte-routing</a>
        </li>
        <li><a href="https://github.com/chartjs" target="_blank" rel="noreferrer">chart.js</a></li>
        <li><a href="https://github.com/sindresorhus/p-queue" target="_blank" rel="noreferrer">p-queue</a></li>
        <li><a href="https://github.com/GoogleChromeLabs/comlink" target="_blank" rel="noreferrer">comlink</a></li>
        <li><a href="https://github.com/immerjs/immer" target="_blank" rel="noreferrer">immer</a></li>
        <li><a href="https://github.com/pubkey/broadcast-channel" target="_blank" rel="noreferrer">broadcast-channel</a>
        </li>
        <li><a href="https://github.com/primus/eventemitter3" target="_blank" rel="noreferrer">eventemitter3</a></li>
        <li><a href="https://github.com/moment/luxon" target="_blank" rel="noreferrer">luxon</a></li>
        <li><a href="https://github.com/substack/json-stable-stringify" target="_blank" rel="noreferrer">json-stable-stringify</a>
        </li>
        <li><a href="https://github.com/tailwindlabs/heroicons" target="_blank" rel="noreferrer">heroicons</a></li>
        <li><a href="https://github.com/FortAwesome/Font-Awesome" target="_blank" rel="noreferrer">font-awesome</a></li>
      </ul>

      <p>Special thanks to
        <a href="/u/76561198023909718/beatleader/date/1"
           on:click|preventDefault={() => navigate('/u/76561198023909718/beatleader/date/1')}
        >DanielDuel</a>
        for making the default song icon.</p>
    </section>

    <p class="back"><a href="/" on:click|preventDefault={() => navigate('/')}>Back to Home</a></p>
  </ContentBox>
</article>

<style>
    p.back {
        margin-top: 1rem;
    }

    img {
      width: 3em;
      height: 3em;
      border-radius: 1.5em;
      padding: 0.3em;
    }

    .member {
      display: flex;
      align-items: center;
      padding: 0.5em;
    }

    .memberTitle {
      margin-left: 5px;
    }
</style>