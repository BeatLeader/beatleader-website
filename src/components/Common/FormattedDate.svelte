<script>
  import {dateFromString, formatDate, formatDateRelative, isValidDate} from '../../utils/date'
  import {configStore} from '../../stores/config'

  export let date = new Date();
  export let prevDate = null;
  export let noDate = "";
  export let prevPrefix = "";

  $: dateObj = isValidDate(date) ? date : dateFromString(date)
  $: dateTitle = (configStore, $configStore, dateObj ? formatDate(dateObj) : null)
  $: formatted = dateObj ? formatDateRelative(dateObj) : noDate
  $: prevDateObj = prevDate ? (isValidDate(prevDate) ? prevDate : dateFromString(date)) : null
  $: prevDateTitle = (configStore, $configStore, prevDateObj ? formatDate(prevDateObj) : null)
  $: prevFormatted = prevDateObj ? formatDateRelative(prevDateObj) : "";
</script>

<span
  title={dateTitle}>{formatted}</span>{#if prevDateObj }<small title={prevDateTitle}>{prevPrefix}{prevFormatted}</small>{/if}

<style>
    small {
        display: block;
        color: var(--faded);
    }
</style>