<script>
  export let mappers = [
    { id: 76561198051924392 }
  ];


  function handleClick(id) {
		console.log(id);
	}

</script>

<div>
  {#each mappers as mapper}
    <div class="mapper" on:click={handleClick(mapper.id)}>
      <img src="https://eu.cdn.beatsaver.com/bad92ca1c855788d200d741f84a7dbf6b5126bb9.jpg" alt="Mapper" style="height: 24px; width: 24px; border-radius: 12px;"/>
      
      <h1>Light Ai</h1>
    </div>
  {/each}

</div>

<style>
  div {
    display: flex;
    height: 24px;
    gap: 0.6em;
    line-height: 170%;
  }

  .mapper {
    background-color: #323232;
    border-radius: 12px;
    padding-right: 0.3em;
  }

  h1 {
    padding-right: 0.4em;
    margin-left: -0.2em;
    margin-top: -0.1em;
  }

</style>