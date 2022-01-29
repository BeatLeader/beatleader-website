<script>
export let box = null;
</script>

<div class="content-box" bind:this={box}>
  <slot></slot>
</div>

<style>
  .content-box {
      background-color: var(--foreground);

      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
      margin: 4px 10px 18px;
      border-radius: 6px;
      padding: 1.0rem;
  }

  .content-box:hover {
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
  }

  @media screen and (max-width: 767px) {
      .content-box {
          margin: 4px 0 18px;
          border-radius: 0;
          padding: 1.0rem .8rem;
      }
  }
</style>