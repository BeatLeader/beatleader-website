<script>
  export let width = "100%";
  export let height = "1em";
  export let inline = true;
</script>

<div style="--width: {width}; --height: {height}; --inline: {inline}" class="skeleton-fade" class:inline>&nbsp;</div>

<style>
    div {
        width: var(--width, "100%");
        height: var(--height, "1em");
        max-height: 100%;
        max-width: 100%;
        background-color: var(--dimmed);
        animation: skeleton-fade 1.5s infinite;
    }

    div.inline {
        display: inline-block;
    }

    @keyframes skeleton-fade {
        0% {
            opacity: 1;
        }
        50% {
            opacity: 0.2;
        }
        100% {
            opacity: 1;
        }
    }
</style>