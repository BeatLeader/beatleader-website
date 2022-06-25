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

    <p><strong>BeatLeader Oculus Store application does not collect any data locally, nor connects to the internet.</strong></p>

    <br>What data BeatLeader mods collect?<br>
    <br><b>1. Platform specific ID</b><br>
    In order to identify you as a Beat Saber player we collect your personal ID from the platform you own the Game. For example: Steam ID, Oculus ID.
    Then this ID is used as ID in BeatLeader system. (Not changeable)
    <br><b>2. Profile picture</b><br>
    Your Oculus or Steam profile picture will be used as BeatLeader profile picture. (Changeable)
    <br><b>3. Profile name</b><br>
    Your Oculus or Steam profile name will be used as BeatLeader profile name. (Changeable)
    <br><b>IP address</b><br>
    Some requests will use your IP address to set a country for profile or to protect sensitive endpoints(for example "log in").
    <br><b>Replays</b><br>
    The main purpose of this service is to collect your Beat Saber plays, so yes, we collect them.

    <br><br><b>Steam specific</b><br>
    BS played hours amount and country. This data is used on the website. (Country is changeable)
    <br><br><b>Patreon specific</b><br>
    Server will use your Patreon profile id to ensure your pledge to grant the "Patron" role.

    <br><br><b>Can I delete my data from BeatLeader?</b><br>
    No. Work in progress, you will be able as soon as I finish implenting it.

    <br><br><br>What data BeatLeader website/"electron app" collect?<br>
    <b>No data is collected.</b>

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