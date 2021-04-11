<script>
  import Spinner from '../Common/Spinner.svelte'

  export let playerInfo;
  export let isLoading = false;
  export let main = false;
</script>


<span class:loading={isLoading} class:main>
  <span class="no-image">?</span>

  {#if playerInfo}
    <img src={playerInfo.avatar} class="avatar" alt="Avatar"/>
  {/if}
  <span class="spinner">
    <Spinner width="100%" height="100%"/>
  </span>
</span>

<style>
    img {
        border-radius: 50%;
        width: 150px;
        height: 150px;
        transition: transform 300ms;
        z-index: 2;
        position: absolute;
        top: .75rem;
        left: .75rem;
    }

    .loading img, .loading .no-image {
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
        z-index: 10
    }

    .loading .spinner {
        display: inline-block;
    }

    .no-image {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 150px;
        height: 150px;
        border-radius: 50%;
        color: var(--foreground);
        background-color: var(--dimmed);
        font-weight: 500;
        font-size: 75px;
        line-height: 1;
        z-index: 0;
    }
</style>