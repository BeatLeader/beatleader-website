<script>
  export let value = "";
  let selectElement = null;

  const onDropdownIconClick = () => {
    selectElement && selectElement.click();
  };
</script>

<div class="selectWrapper">
  <select bind:this={selectElement} bind:value class="selectElement">
    <slot />
  </select>
  <i class="fa fa-chevron-down select-arrow" on:click={onDropdownIconClick} />
</div>

<style>
  .selectWrapper {
    position: relative;
    display: block;
    cursor: pointer;
  }
  .selectElement {
    width: 100%;
    font-size: 1em;
    padding: 0.5em 2em 0.5em 1em;
    text-overflow: ellipsis;
    -moz-appearance: none;
    -webkit-appearance: none;
  }
  .selectElement::-ms-expand {
    display: none;
  }
  .select-arrow {
    position: absolute;
    pointer-events: none;

    top: 50%;
    right: 0;
    transform: translate(-0.75em, -50%);
  }
</style>
