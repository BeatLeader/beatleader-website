<script>
  export let automodder = {
    errors: 0,
    warnings: 0
  }

</script>

<div>
  <span><i class="fas fa-xmark" />{automodder.errors}</span>
  <span><i class="fas fa-triangle-exclamation" />{automodder.warnings}</span>
</div>

<style>
  div {
    display: flex;
    height: 24px;
    border-radius: 6px;
    padding-left: 0.1em;
    padding-right: 0.4em;
    line-height: 170%;
    gap: 0.4em;
  }

  span {
    color: #e9e9e9;
  }

  i {
    margin-right: 0.2em;
  }

</style>