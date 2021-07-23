<script>
    import {padNumber} from '../../utils/format'

    export let value = 0;
    export let zero = "-";
    export let suffix = "";
    export let withZeroSuffix = false;
    export let inline = false;

    $: formatted = value ? (Math.floor(value/60) + ':' + padNumber(Math.round(value % 60))) + suffix : zero + (withZeroSuffix ? suffix : '');
</script>

<span>{formatted}</span>

<style>
</style>
