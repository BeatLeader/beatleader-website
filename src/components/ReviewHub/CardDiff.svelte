<script>
	import { createEventDispatcher } from "svelte";
	import { getDescriptionForDiff, getIconNameForDiff } from "../../utils/beatleader/format";

  export let diff = {
    color: "#8f48db",
    type: "Standard",
    name: "Expert+",
    id: 573438
  };

  const dispatch = createEventDispatcher();

  $: icon = `<div class="${getIconNameForDiff(diff)}" title="${getDescriptionForDiff(diff)}">`

</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:mouseenter={() => {
  dispatch('diff-hover', {
    hover: true,
    diff: diff
  })
}} on:mouseleave={() => {
  dispatch('diff-hover', {
    hover: false,
    diff: diff
  })
}} style={`background-color: ${diff.color}`}>
  <span class="icon">{@html icon}</span>
  <span>
    {diff.name}
  </span>
</div>

<style>
  div {
    display: flex;
    height: 24px;
    border-radius: 6px;
    padding-left: 0.1em;
    padding-right: 0.4em;
    line-height: 170%;
  }

  div:hover {
    box-shadow: inset 0 0 100px 100px rgba(255, 255, 255, 0.1);
  }

  span {
    color: #e9e9e9;
    margin-top: -0.1em;
  }

  .icon {
    padding: 0.2em;
  }

  
</style>