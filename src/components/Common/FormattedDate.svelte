<script>
  import {dateFromString, formatDate, formatDateRelative, isValidDate} from '../../utils/date'

  export let date = new Date();
  export let prevDate = null;
  export let noDate = "";

  $: dateObj = isValidDate(date) ? date : dateFromString(date);
  $: formatted = dateObj ? formatDateRelative(dateObj.toISOString()) : noDate;
  $: prevDateObj = prevDate ? (isValidDate(prevDate) ? prevDate : dateFromString(date)) : null;
  $: prevFormatted = prevDateObj ? formatDateRelative(prevDateObj.toISOString()) : "";
</script>

<span title={dateObj ? formatDate(dateObj) : ''}>{formatted}</span>{#if prevDateObj }<small title={formatDate(prevDateObj)}>{prevFormatted}</small>{/if}

<style>
    small {
        display: block;
        color: var(--faded);
    }
</style>