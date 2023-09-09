<script>
	import {dateFromUnix, formatDateCustom, formatDateCustomTooltip, isValidDate} from '../../utils/date';
	import {configStore} from '../../stores/config';

	export let date = new Date();
	export let prevDate = null;
	export let noDate = '';
	export let prevPrefix = '';
	export let absolute = false;

	$: dateObj = isValidDate(date) ? date : dateFromUnix(date);
	$: dateFormat = $configStore.scorePreferences.dateFormat == null ? 'relative' : $configStore.scorePreferences.dateFormat;
	$: dateTitle = (configStore, $configStore, dateObj && !absolute ? formatDateCustomTooltip(dateObj, dateFormat) : null);
	$: formatted = dateObj ? (absolute ? formatDateCustomTooltip(dateObj, dateFormat) : formatDateCustom(dateObj, dateFormat)) : noDate;
	$: prevDateObj = prevDate ? (isValidDate(prevDate) ? prevDate : dateFromUnix(date)) : null;
	$: prevDateTitle = (configStore, $configStore, prevDateObj && !absolute ? formatDateCustomTooltip(prevDateObj, dateFormat) : null);
	$: prevFormatted = prevDateObj ? (absolute ? formatDateCustomTooltip(prevDateObj, dateFormat) : formatDateCustom(prevDateObj, dateFormat)) : '';
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
