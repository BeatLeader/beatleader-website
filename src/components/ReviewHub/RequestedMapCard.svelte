<script>
	import { mapTypeListFromMask } from "../../utils/beatleader/format";
	import MapTypeDescription from "../Leaderboard/MapTypeDescription.svelte";
	import CardMappers from "./CardMappers.svelte";
	import CardStatus from "./CardStatus.svelte";

  let type = 1;

</script>

<div class="card">
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
        <CardStatus />
      </div>
    </div>
    
  </div>



</div>


<style>
  .card {
    width: 480px;
    height: 100px;
    border-radius: 6px;
    background: #252525 !important;
    overflow: hidden;
    display: flex;
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
    padding-right: 0.3em;
		gap: 0.6em;
  }

</style>