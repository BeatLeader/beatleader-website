<script>
	import {dateFromUnix, formatDate, formatDateRelative, isValidDate} from '../../utils/date';
	import {configStore} from '../../stores/config';

	export let date = new Date();
	export let prevDate = null;
	export let noDate = '';
	export let prevPrefix = '';
	export let absolute = false;

	$: dateObj = isValidDate(date) ? date : dateFromUnix(date);
	$: dateTitle = (configStore, $configStore, dateObj && !absolute ? formatDate(dateObj) : null);
	$: formatFunction = $configStore.scorePreferences.dateFormat == 'full' ? formatDate : formatDateRelative;
	$: formatted = dateObj ? (absolute ? formatDate(dateObj) : formatFunction(dateObj)) : noDate;
	$: prevDateObj = prevDate ? (isValidDate(prevDate) ? prevDate : dateFromUnix(date)) : null;
	$: prevDateTitle = (configStore, $configStore, prevDateObj && !absolute ? formatDate(prevDateObj) : null);
	$: prevFormatted = prevDateObj ? (absolute ? formatDate(prevDateObj) : formatFunction(prevDateObj)) : '';
</script>

<span title={dateTitle}>
	{formatted}
</span>

{#if prevDateObj}
	<small title={prevDateTitle}>
		{prevPrefix}{prevFormatted}
	</small>
{/if}

<style>
	small {
		display: block;
		color: var(--faded);
	}
</style>
