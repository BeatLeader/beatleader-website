<script>
    import Button from "../components/Common/Button.svelte";

    export let type;

    function signin() {
        if (type == "oculus") {
            var token = document.location.hash.replace("#", "");
            const data = new FormData();
            data.append("provider", "oculus");
            window.open("https://beatleader.azurewebsites.net/signinoculus?token=" + token, "_blank");
        }
    }
</script>

<Button iconFa="fas fa-plus-square" label="Signin" on:click={() => signin()}/>


