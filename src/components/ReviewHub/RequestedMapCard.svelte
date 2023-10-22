<script>
  import { mapTypeListFromMask } from "../../utils/beatleader/format";
	import MapTypeDescription from "../Leaderboard/MapTypeDescription.svelte";
	import CardAutomodder from "./CardAutomodder.svelte";
	import CardComments from "./CardComments.svelte";
	import CardDiff from "./CardDiff.svelte";
	import CardMappers from "./CardMappers.svelte";
	import CardRequestDate from "./CardRequestDate.svelte";
	import CardStatus from "./CardStatus.svelte";
	import CardVotes from "./CardVotes.svelte";

  let type = 1;

  let activeStatsIsDiff = false;


  function handleDiffHover(event) {
    console.log(event.detail);

    if (event.detail.hover) {
      activeStatsIsDiff = true;
      // enable diff specific stats
    } else {
      activeStatsIsDiff = false;
      // disable diff specific stats
    }

  }

  $: difficulties = [{
    color: "#8f48db",
    type: "Standard",
    name: "Expert+",
    id: 573438
  },
  {
    color: "#bf2a42",
    type: "Standard",
    name: "Expert",
    id: 573438
  }
  ];


  let averageStats = {
    votes: {
      positive: 2,
      neutral: 1,
      negative: 2
    },
    comments: {
      count: 15,
      lastDate: 1693445979,
    },
    automodder: {
      errors: 0,
      warnings: 2
    },
    requestDate: 1693445979,
  }

  let activeStats = averageStats;

</script>

<div class="card">
  <div class="card-details">
    <img src="https://eu.cdn.beatsaver.com/bad92ca1c855788d200d741f84a7dbf6b5126bb9.jpg" alt="Song Cover" class="cover"/>

    <div class="song-info">

      <div class="song-info-top">
        <div class="song-info-row">
          <h1>Song Title</h1>
          <h2>Song subname</h2>
        </div>

        <div class="tags">
          {#if type && mapTypeListFromMask(type).length < 2}
            <MapTypeDescription type={type} />
          {:else}
            <MapTypeDescription type={type} cram />
          {/if}
        </div>
        
      </div>
      
      <div class="song-info-top">
        <div class="song-info-row">
          <h2 style="margin-top: -0.1em;">Author</h2>
    
          <CardMappers />
        </div>

        <div class="tags">
          <CardStatus status={2}/>
        </div>
      </div>

      <div class="song-info-row-diffs">
        {#each difficulties as difficulty}
          <CardDiff diff={difficulty} on:diff-hover={handleDiffHover} />
        {/each}
      </div>
      
    </div>
  </div>
  <div class="card-stats">
    <div class="card-stats-main">
      <CardVotes votes={activeStats.votes}/>
      <CardComments comments={activeStats.comments}/>
      <CardAutomodder automodder={activeStats.automodder}/>
      <!--TODO: show star rating if a map is hovered (and the user is able to see star ratings on all maps?)-->
    </div>
    <div class="card-stats-end">
      <CardRequestDate date={activeStats.requestDate}/>
    </div>
  </div>
  



</div>


<style>
  .card {
    min-width: 33em;
    width: calc(50% - 1em);
    height: 128px;
    border-radius: 6px;
    background: #252525 !important;
    overflow: hidden;
  }

  @media (max-width: 1506px) {
		.card {
      width: calc(100% - 1em);
      height: 128px;
      border-radius: 6px;
      background: #252525 !important;
      overflow: hidden;
    }
	}

  .card-details {
    width: 100%;
    height: 100px;
    display: flex;
  }

  .card-stats {
    width: 100%;
    height: 28px;
    background: #2b2b2b !important;
    padding-left: 0.3em;
    display: flex;
    justify-content: space-between;
  }

  .card-stats-main {
    display: flex;
    flex-direction: row;
    gap: 0.4em;
  }

  .card-stats-end {
    display: flex;
    flex-direction: row;
    gap: 0.4em;
  }

  .song-info {
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 0.2em;
  }

  .song-info-top {
    display: flex;
    justify-content: space-between;
  }

  .song-info-row {
    display: flex;
    flex-direction: row;
    gap: 0.4em;
    padding-left: 0.3em;
    line-height: 170%;
  }

  .song-info-row-diffs {
    display: flex;
    flex-direction: row;
    gap: 0.4em;
    padding-top: 0.5em;
    padding-left: 0.3em;
    line-height: 170%;
  }

  .song-info-row h1 {
    font-size: 1.2em;
    font-weight: 600;
  }

  .song-info-row h2 {
    font-size: 1em;
    font-weight: 400;
  }

  .cover {
    height: 100px;
    width: 100px;
  }

  .tags {
    height: 24px;
    display: flex;
    padding-right: 0.2em;
		gap: 0.6em;
  }

</style>