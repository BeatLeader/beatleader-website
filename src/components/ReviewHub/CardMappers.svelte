<script>
	import Mapper from "./Mapper.svelte";

  export let mappers = [
    "76561198051924392"
  ];

  $: compact = (mappers.length > 1);
</script>

<div>
  {#each mappers as mapper}
    <Mapper playerId={mapper} compact={compact} />
  {/each}
</div>

<style>
  div {
    display: flex;
    height: 24px;
    gap: 0.6em;
    line-height: 170%;
  }
</style>