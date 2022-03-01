<script>
    import Button from "../components/Common/Button.svelte";

    export let type;

    let copied = false;

    function copyToken() {
        if (type == "oculus") {
            let input = document.createElement('input');
            const target = document.activeElement;
            target.appendChild(input);

            input.value = document.location.hash.replace("#", "");
            input.select();
            document.execCommand("copy");
            target.removeChild(input);
            copied = true;
        }
    }
</script>

<div class="oculusButton">
    Copy your token and go back to BeatLeader settings in Beat Saber.

    <Button iconFa="fas fa-plus-square" label="Copy my token" on:click={() => copyToken()}/>

    {#if copied}
    <p>Copied!</p>
    {/if}
</div>

<style>
    .oculusButton {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        grid-gap: 2em;
    }
</style>



