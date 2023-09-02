<script>
	import {dateFromUnix, formatDate, formatDateRelative, isValidDate} from '../../utils/date';
	import {configStore} from '../../stores/config';

	export let date = new Date();
	export let prevDate = null;
	export let noDate = '';
	export let prevPrefix = '';
	export let absolute = false;

	$: dateObj = isValidDate(date) ? date : dateFromUnix(date);
	$: formatFunction = $configStore.scorePreferences.dateFormat == 'full' ? formatDate : formatDateRelative;
	$: titleFormatFunction = $configStore.scorePreferences.dateFormat == 'full' ? formatDateRelative : formatDate;
	$: dateTitle = (configStore, $configStore, dateObj && !absolute ? titleFormatFunction(dateObj) : null);
	
	$: formatted = dateObj ? (absolute ? titleFormatFunction(dateObj) : formatFunction(dateObj)) : noDate;
	$: prevDateObj = prevDate ? (isValidDate(prevDate) ? prevDate : dateFromUnix(date)) : null;
	$: prevDateTitle = (configStore, $configStore, prevDateObj && !absolute ? titleFormatFunction(prevDateObj) : null);
	$: prevFormatted = prevDateObj ? (absolute ? titleFormatFunction(prevDateObj) : formatFunction(prevDateObj)) : '';
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
