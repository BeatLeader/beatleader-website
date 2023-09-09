<script>
	import {dateFromUnix, formatDate, formatDateRelative, formatDateCustom, isValidDate} from '../../utils/date';
	import {configStore} from '../../stores/config';

	export let date = new Date();
	export let prevDate = null;
	export let noDate = '';
	export let prevPrefix = '';
	export let absolute = false;

	$: dateObj = isValidDate(date) ? date : dateFromUnix(date);
	$: dateFormat = $configStore.scorePreferences.dateFormat;
	$: formatFunction = dateFormat == 'full' ? formatDate : 
						(dateFormat == 'relative' ? formatDateRelative : formatDateCustom);
	$: titleFormatFunction = dateFormat == 'full' ? formatDateRelative : 
						     (dateFormat == 'relative' ? formatDate : formatDateCustom);
	$: dateTitle = (configStore, $configStore, dateObj && !absolute ? titleFormatFunction(dateObj, dateFormat) : null);
	
	$: formatted = dateObj ? (absolute ? titleFormatFunction(dateObj, dateFormat) : formatFunction(dateObj, dateFormat)) : noDate;
	$: prevDateObj = prevDate ? (isValidDate(prevDate) ? prevDate : dateFromUnix(date)) : null;
	$: prevDateTitle = (configStore, $configStore, prevDateObj && !absolute ? titleFormatFunction(prevDateObj, dateFormat) : null);
	$: prevFormatted = prevDateObj ? (absolute ? titleFormatFunction(prevDateObj, dateFormat) : formatFunction(prevDateObj, dateFormat)) : '';
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
