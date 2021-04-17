<script>
    import {createEventDispatcher, onMount} from 'svelte';
    import Spinner from './Spinner.svelte'

    const dispatch = createEventDispatcher();

    export let totalItems = null;
    export let currentPage = 0;
    export let itemsPerPage = 10;
    export let itemsPerPageValues = [5, 10, 15, 20, 25];
    export let displayMax = 11;
    export let hide = false;
    export let mode = 'pages';
    export let loadingPage = null;

    let displayStart = false;
    let displayEnd = false;
    let prevItemsPerPage = itemsPerPage;

    function dispatchEvent(page = 0, initial = false) {
        let to = (page + 1) * itemsPerPage - 1;
        if (isTotalItemsAvailable && to > totalItems - 1) to = totalItems - 1;

        dispatch('page-changed', {page, itemsPerPage, from: page * itemsPerPage, to, total: totalItems, initial});
    }

    onMount(() => {
        dispatchEvent(currentPage, true);
    })

    async function onPageChanged(page) {
        if (loadingPage) return;

        dispatchEvent(page, false);
    }

    function calcPages(total, current, max) {
        const needToDisplayFacetedPages = total > max;

        const middle = Math.floor(max / 2);
        const startPage = current > middle && needToDisplayFacetedPages ? current - middle + 1 : 0;

        displayStart = current > middle && needToDisplayFacetedPages;
        displayEnd = current + middle + 1 < total && needToDisplayFacetedPages;

        if (currentPage > pagesTotal - 1) currentPage = pagesTotal - 1;
        if (currentPage < 0) currentPage = 0;

        return allPages.slice(startPage - (needToDisplayFacetedPages && !displayEnd ? middle - total + current + 1 : 0), startPage + max - (displayStart ? 1 : 0) - (displayEnd ? 1 : 0));
    }

    function getEnd(currentPage, itemsPerPage, totalItems) {
        const end = (currentPage + 1) * itemsPerPage;

        return isTotalItemsAvailable && end > totalItems ? totalItems : end;
    }

    function onItemsPerPageChanged() {
        const firstItem = prevItemsPerPage * currentPage

        prevItemsPerPage = itemsPerPage;
        currentPage = Math.floor(firstItem / itemsPerPage);
    }

    $: isTotalItemsAvailable = Number.isFinite(totalItems);
    $: pagesTotal = isTotalItemsAvailable ? Math.ceil(totalItems / itemsPerPage) : null;
    $: allPages = isTotalItemsAvailable ? Array(pagesTotal).fill(null).map((val, idx) => idx + 1) : []
    $: displayedPages = isTotalItemsAvailable ? calcPages(pagesTotal, currentPage, displayMax) : [];
    $: startItem = currentPage * itemsPerPage + 1;
    $: endItem = getEnd(currentPage, itemsPerPage, totalItems);
    $: currentMode = !isTotalItemsAvailable ? 'simple' : mode;
</script>

{#if (pagesTotal > 1 || currentMode === 'simple') && !hide}
<nav class="pagination">
    <div class="position">{startItem} - {endItem}{#if totalItems} / {totalItems}{/if}</div>
    <ul class="pagination-list" class:simple={currentMode === 'simple'}>
        {#if currentMode === 'simple'}
            <li>
                {#if currentPage !== 0}
                    <button on:click={() => onPageChanged(0)} class="pagination-link">
                        {#if loadingPage === 0}
                            <Spinner />
                        {:else}
                            <i class="fas fa-step-backward"></i>
                        {/if}
                    </button>

                    <button on:click={() => onPageChanged(currentPage - 1)} class="pagination-link">
                        {#if loadingPage === currentPage - 1}
                            <Spinner />
                        {:else}
                            <i class="fas fa-chevron-left"></i>
                        {/if}
                    </button>
                {:else}
                    <span class="pagination-link disabled"><i class="fas fa-step-backward"></i></span>
                    <span class="pagination-link disabled"><i class="fas fa-chevron-left"></i></span>
                {/if}

                {#if !isTotalItemsAvailable || currentPage !== pagesTotal - 1}
                    <button on:click={() => onPageChanged(currentPage + 1)} class="pagination-link">
                        {#if loadingPage === currentPage + 1}
                            <Spinner />
                        {:else}
                            <i class="fas fa-chevron-right"></i>
                        {/if}
                    </button>

                    {#if isTotalItemsAvailable}
                    <button on:click={() => onPageChanged(pagesTotal - 1)}
                           class="pagination-link">
                        {#if loadingPage === pagesTotal - 1}
                            <Spinner />
                        {:else}
                            <i class="fas fa-step-forward"></i>
                        {/if}
                    </button>
                    {:else}
                        <span class="pagination-link disabled"><i class="fas fa-step-forward"></i></span>
                    {/if}
                {:else}
                    <span class="pagination-link disabled"><i class="fas fa-chevron-right"></i></span>
                    <span class="pagination-link disabled"><i class="fas fa-step-forward"></i></span>
                {/if}
            </li>
        {:else}
            {#if displayStart}
                <li class:is-loading={loadingPage === 0}>
                    <button on:click={() => onPageChanged(0)} class={'pagination-link' + (currentPage === 0 ? ' is-current' : '')}>
                        <span class="spinner"><Spinner /></span>
                        <span class="page">1</span>
                    </button>
                </li>
                <li><span class="pagination-ellipsis">…</span></li>
            {/if}

            {#each displayedPages as page}
            <li class:is-loading={loadingPage === page - 1}>
                <button on:click={() => onPageChanged(page-1)} class={'pagination-link' + (currentPage === page - 1 ? ' is-current' : '')}>
                    <span class="spinner"><Spinner /></span>
                    <span class="page">{page}</span>
                </button>
            </li>
            {/each}

            {#if displayEnd}
                <li><span class="pagination-ellipsis">…</span></li>
                <li class:is-loading={loadingPage === pagesTotal - 1}>
                    <button on:click={() => onPageChanged(pagesTotal - 1)} class={'pagination-link' + (currentPage === pagesTotal - 1 ? ' is-current' : '')}>
                        <span class="spinner"><Spinner /></span>
                        <span class="page">{pagesTotal}</span>
                    </button>
                </li>
            {/if}
        {/if}
    </ul>
    {#if itemsPerPageValues && itemsPerPageValues.length}
    <div class="items-per-page"><select bind:value={itemsPerPage} on:change={onItemsPerPageChanged}>{#each itemsPerPageValues as ipp}<option value={ipp}>{ipp}</option>{/each}</select></div>
    {/if}
</nav>
{/if}

<style>
    button {
        color: var(--textColor);
        background-color: transparent;
        cursor: pointer;
    }

    select {
        font-size: 1em;
        border: none;
        color: var(--textColor, #000);
        background-color: var(--foreground, #fff);
        outline: none;
    }

    .pagination {
        margin-top: 1em;
    }
    .pagination-list {
        max-width: none !important;
        justify-content: center;
        margin-top: 0;
        margin-bottom: 0!important;
    }
    .pagination-list.simple {
        justify-content: flex-end;
    }
    span.pagination-link {
        cursor: not-allowed;
    }
    .pagination-link {
        border-color: var(--alternate);
    }
    .pagination-link.is-current, button:hover {
        color: var(--textColor);
        background-color: var(--selected);
        border-color: var(--selected);
    }
    .pagination-link.is-current {
        cursor: not-allowed;
    }
    .pagination-link:focus {
        border-color: #dbdbdb !important;
    }
    .pagination-link .spinner {
        display: none;
        position: absolute;
        top: .5em;
    }
    .is-loading .pagination-link .spinner {
        display: block;
    }
    .is-loading .pagination-link .page {
        visibility: hidden;
    }
    .position {
        min-width: 8.5em;
        order: 0
    }
    .pagination-list {
        order: 1
    }
    .items-per-page {
        order: 2
    }
</style>
