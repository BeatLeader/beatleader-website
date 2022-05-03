<script>
	export let item = undefined;
    let regionNames = new Intl.DisplayNames(['en'], {type: 'region'});
    $: countryName = item.value == "not set" ? item.value : regionNames.of(item.value.toUpperCase());
</script>

<style>
  .customItem {
    display: flex;
    align-items: center;
  }

  img {
    width: 25px;
    padding: 5px 0;
    margin: 0 10px;
  }

  .customItem_title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .customItem_name {
    display: inline-block;
    font-weight: 400;
    
    margin-right: 10px;
  }
</style>

<div class="customItem">
  <img src={`https://cdn.beatleader.xyz/flags/${item.value}.png`} alt="{countryName}">
  <div class="customItem_title">
    <div class="customItem_name">{countryName}</div>
  </div>
</div>