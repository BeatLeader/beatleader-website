<script>
  import {navigate} from "svelte-routing";
  import Avatar from '../components/Player/Avatar.svelte'
  import {onMount} from 'svelte'
  import {delay} from '../utils/promise'
  import Error from '../components/Common/Error.svelte'

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

  <div class="box has-shadow" class:loading={isLoading}>
    <Avatar {playerInfo} {isLoading}/>

    <h1 class="title is-4 has-text-centered-mobile">
      {name}
    </h1>

    {#if error}
      <div>
        <Error {error}/>
      </div>
    {/if}
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