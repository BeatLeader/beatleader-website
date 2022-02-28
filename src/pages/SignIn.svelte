<script>
    export let type;

    function processType() {
        if (type == "oculus") {
            var token = document.location.hash.replace("#", "");
            const data = new FormData();
            data.append("provider", "oculus");
            window.open("https://beatleader.azurewebsites.net/signinoculus?token=" + token, "_blank");
        }
    }

    $: processType();
</script>


