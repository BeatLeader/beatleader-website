<script>
  import {navigate} from 'svelte-routing'
  import Badge from '../Common/Badge.svelte'

  export let player;

  $: clans = player?.clans ?? null;
</script>

{#if clans}
<span class="clan-badges">
  {#each clans as clan (clan.id)}
    <a href={`/clan/${clan?.id}`} on:click|stopPropagation={() => navigate(`/clan/${clan?.id}`)}>
      <Badge label={clan?.tag ?? '???'} onlyLabel={true} fluid={true} color="white" bgColor={clan?.color ?? 'var(--dimmed)'} title="Click to go to clan profile"/>
    </a>
  {/each}
</span>
{/if}

<style>
    .clan-badges {
        margin-left: .5em;
        font-size: .75em;
        white-space: nowrap;
    }

    .clan-badges :global(a > *) {
        margin-bottom: 0 !important;
        margin-right: .25em!important;
        width: min-content!important;
    }
    .clan-badges :global(a > *:last-child) {
        margin-right: 0!important;
    }

    @media screen and (max-width: 500px) {
        .clan-badges {
            display: none;
        }
    }
</style>