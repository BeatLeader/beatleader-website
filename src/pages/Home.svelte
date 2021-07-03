<script>
  import {navigate} from "svelte-routing";
  import {onMount} from 'svelte'
  import {delay} from '../utils/promise'

  let name = "Stranger";
  let playerInfo = null;
  let isLoading = true;
  let error = null;

  onMount(async () => {
    await delay(3000);

    isLoading = false;
  })
</script>

<article>
  <p>Select profile to test:</p>
  <div>
    <button on:click={() => navigate("/u/76561198035381239/recent")}>motzel's profile</button>
    <button on:click={() => navigate("/u/76561198025451538/recent")}>Drakonnos's profile</button>
    <button on:click={() => navigate("/u/76561198333869741/recent")}>Cerret's profile</button>
  </div>
</article>

<style>
    article {
        max-width: 1024px;
        margin: 0 auto;
        text-align: center;
    }

    button {
        cursor: pointer;
        min-width: 2rem;
        margin-right: .5rem;
    }
</style>