<script>
  export let item;
</script>

<div class="customItem">
  <img src={`https://cdn.beatleader.xyz/flags/${item?.value}.png`} alt="{item?.label}">
  <div class="customItem_title">
    <div class="customItem_name">{item?.label}</div>
  </div>
</div>

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