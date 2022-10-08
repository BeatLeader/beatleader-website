<script>
    export let type;

    let pressed = false;

    function HandleMouseDown() {
        pressed = true;
    }

    function HandleMouseUp() {
        pressed = false;
    }

    $: hoveredScale = pressed ? "90%" : "110%";
</script>

{#if type === "large"}
    <div class="score-action-buttons-layout large"
         on:mousedown={HandleMouseDown}
         on:mouseup={HandleMouseUp}
         on:mouseleave={HandleMouseUp}
         style="--hovered-scale:{hoveredScale}">
        <div class="side-row buttons-container">
            <slot name="special_buttons"/>
        </div>
        <div class="main-grid buttons-container">
            <slot name="default_buttons"/>
        </div>
    </div>
{:else}
    <div class="score-action-icons-layout buttons-container flat"
         on:mousedown={HandleMouseDown}
         on:mouseup={HandleMouseUp}
         on:mouseleave={HandleMouseUp}
         style="--hovered-scale:{hoveredScale}">
        <slot name="special_buttons"/>
        <slot name="default_buttons"/>
    </div>
{/if}

<style>
    .flat {
        display: inline-flex;
        flex-direction: row;
        align-items: center;
        flex-wrap: nowrap;
        grid-gap: 3px;
    }

    .large {
        display: inline-flex;
        flex-direction: row;
        align-items: center;
        flex-wrap: nowrap;
        grid-gap: 3px;
    }

    .side-row {
        display: flex;
        grid-gap: 3px;
    }

    .main-grid {
        display: flex;
        flex-wrap: wrap;
        grid-gap: 3px;
        max-width: 75px;
        width: max-content;
    }

    .main-grid:not(:has(span>*:nth-child(5))) {
        max-width: 50px;
    }

    .main-grid:not(:has(span>*:nth-child(4))) {
        max-width: 75px;
    }

    :global(.buttons-container > span) {
        display: contents;
    }

    :global(.buttons-container > span > *) {
        width: 22px !important;
        height: 22px !important;
        font-size: 12px !important;
        overflow: hidden !important;
        border-radius: 5px !important;

        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        text-align: center !important;

        transition: opacity ease .2s;
        opacity: 0.4 !important;
        transform: scale(100%);
    }

    :global(.buttons-container > span > *):hover {
        opacity: 1.0 !important;
        transform: scale(var(--hovered-scale));
    }
</style>
