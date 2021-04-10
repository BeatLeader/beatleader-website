<script>
  import Spinner from '../Common/Spinner.svelte'

  export let playerInfo;
  export let isLoading = false;
  export let main = false;
</script>

{#if playerInfo}
  <span class:loading={isLoading} class:main>
  <img src={playerInfo.avatar} class="avatar"  alt="Avatar"/>
  <span class="spinner">
    <Spinner width="100%" height="100%"/>
  </span>
    </span>
{/if}

<style>
    img {
        border-radius: 50%;
        width: 150px;
        height: 150px;
        transition: transform 300ms;
    }

    .loading img {
        transform: scale(.7);
    }

    .main img {
        border: 2px solid var(--increase, '#42b129');
    }

    .spinner {
        display: none;
        position: absolute;
        width: 150px;
        height: 150px;
        top: .75rem;
        left: .75rem;
        color: var(--faded);
    }

    .loading .spinner {
        display: inline-block;
    }
</style>