<script>
    import {formatNumber} from "../utils/format";

    export let sliceDetailsData = null;
    let leftData = null;
    let rightData = null;
    let selectedSecondaryGridIndex = 0;
    let showSecondaryGrid = false;

    function mainGridCellOnClick(index) {
        leftData = sliceDetailsData[index].left;
        rightData = sliceDetailsData[index].right;
        selectedSecondaryGridIndex = index;
        showSecondaryGrid = true;
    }

    function miniMainGridOnClick() {
        showSecondaryGrid = false;
    }

    function formatHoverHint(cell) {
        if (!cell.count) return '';
        return formatNumber((cell.averageScore * 100 / 115), 2) + '%';
    }
</script>

{#if sliceDetailsData}
    <div class="slide-details">
        {#if showSecondaryGrid}
            <div class="secondary-grid">
                {#each leftData as cell, idx}
                    <div class="grid-cell left" title={formatHoverHint(cell)}>
                        {#if cell.count}
                            <p>{cell.count}</p>
                            <p>{formatNumber(cell.averageScore, 2)}</p>
                        {:else}
                            <p>-</p>
                        {/if}
                    </div>
                {/each}
            </div>
            <div class="mini-main-grid" on:click={miniMainGridOnClick}>
                {#each sliceDetailsData as cell, idx}
                    <div class="mini-main-grid-cell {(idx === selectedSecondaryGridIndex) ? 'selected' : ''}">
                    </div>
                {/each}
            </div>
            <div class="secondary-grid">
                {#each rightData as cell, idx}
                    <div class="grid-cell right" title={formatHoverHint(cell)}>
                        {#if cell.count}
                            <p>{cell.count}</p>
                            <p>{formatNumber(cell.averageScore, 2)}</p>
                        {:else}
                            <p>-</p>
                        {/if}
                    </div>
                {/each}
            </div>
        {:else}
            <div class="main-grid">
                {#each sliceDetailsData as cell, idx}
                    <div class="grid-cell main" title={formatHoverHint(cell)} on:click={() => mainGridCellOnClick(idx)}>
                        {#if cell.count}
                            <p>{cell.count}</p>
                            <p>{formatNumber(cell.averageScore, 2)}</p>
                        {:else}
                            <p>-</p>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{/if}

<style>
    .slide-details {
        display: flex;
        justify-content: center;
        align-items: center;
        grid-gap: 10px;
    }

    .main-grid {
        display: grid;
        grid-template-columns: auto auto auto auto;
        grid-template-rows: auto auto auto;
        grid-gap: 4px;
    }

    .secondary-grid {
        display: grid;
        grid-template-columns: auto auto auto;
        grid-template-rows: auto auto auto;
        grid-gap: 4px;
    }

    .mini-main-grid {
        display: grid;
        grid-template-columns: auto auto auto auto;
        grid-template-rows: auto auto auto;
        grid-gap: 1px;

        background: #00000066;
        box-shadow: #00000066 0px 0px 4px 1px;
    }

    .mini-main-grid:hover {
        background: #00000099;
        box-shadow: #00000099 0px 0px 5px 1px;
    }

    .mini-main-grid-cell {
        width: 10px;
        height: 10px;
        background: #666666;
        border-radius: 2px;
    }

    .mini-main-grid-cell.selected {
        background: #999999;
    }

    .grid-cell {
        display: flex;
        flex-direction: column;
        justify-content: center;
        justify-items: center;

        width: 50px;
        height: 50px;
        border-radius: 4px;

        text-align: center;
        font-size: .8em;
        font-weight: 400;

        box-shadow: #00000066 0px 0px 6px;
    }

    .grid-cell:hover {
        background: #00000099;
        box-shadow: #00000099 0px 0px 6px;
    }

    .grid-cell.main {
        background: linear-gradient(180deg, #88888877, #5a5a5a77);
    }

    .grid-cell.left {
        background: linear-gradient(180deg, #ff5c5ccc, #a54949cc);
    }

    .grid-cell.right {
        background: linear-gradient(180deg, #5c5cffcc, #4949a5cc);
    }
</style>