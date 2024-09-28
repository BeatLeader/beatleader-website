<script>
    export let content = "";
</script>

<div tooltip={content}>
    <slot></slot>
</div>

<svelte:head>
<style>
    [tooltip] {
    position: relative;
    z-index: 2;
    display: inline-block; 
    }

    [tooltip]:before,
    [tooltip]:after {
    visibility: hidden;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease-out, transform 0.2s ease-out;
    transform: translate(-50%, 5px);
    }

    [tooltip]:before {
    position: absolute;
    bottom: 100%;
    left: 50%;
    margin-bottom: 5px;
    padding: 7px;
    min-width: 150%;
    max-width: 500%;
    border-radius: 3px;
    background-color: #222;
    color: #fff;
    content: attr(tooltip);
    text-align: center;
    font-size: 12px;
    line-height: 1.2;
    overflow: hidden;
    }

    [tooltip]:after {
    position: absolute;
    bottom: 100%;
    left: 50%;
    width: 0;
    border-top: 5px solid #222;
    border-right: 5px solid transparent;
    border-left: 5px solid transparent;
    border-radius: 3px;
    content: '';
    overflow: hidden;
    }

    [tooltip]:hover:before,
    [tooltip]:hover:after {
    visibility: visible;
    opacity: 1;
    transform: translate(-50%, 0);
    }
</style>
</svelte:head>