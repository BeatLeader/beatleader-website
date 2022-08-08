<script>
    import {fade, slide} from 'svelte/transition'
    import Button from '../Common/Button.svelte';

    export let votingStore;
    export let leaderboard;
    export let hash;
	export let diff;
	export let mode;

    let ranked;

    function approve() {
        votingStore.updateMap(hash, diff, mode, true, leaderboard?.stats?.stars, leaderboard?.stats?.type);

        ranked = true;
    }
  </script>
  
    <div transition:fade>
        {#if !ranked}
            <div class="title-box">
                Map is ready to be ranked🎉<br>
                All checks are completed and people voted.<br>
                Great job!<br>
            </div>

            <div class="title-box">
                <Button iconFa="fas fa-bomb" label="Rank" type="submit" on:click={() => approve()}/>
            </div>
        {:else}
            <div class="title-box">
                Map is ranked! Let's go!<br>
                Players pp and ranks will be recalculating for some time.<br>
            </div>
        {/if}
    </div>
  
  <style>
    .title-box {
        margin: 1em;
    }
  </style>