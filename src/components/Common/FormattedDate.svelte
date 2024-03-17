<script>
	import {dateFromUnix, formatDateCustom, formatDateCustomTooltip, isValidDate} from '../../utils/date';
	import {configStore} from '../../stores/config';

	export let date = new Date();
	export let prevDate = null;
	export let noDate = '';
	export let prevPrefix = '';
	export let externalDateFormat = null;

	$: dateObj = isValidDate(date) ? date : dateFromUnix(date);
	$: dateFormat =
		externalDateFormat ?? ($configStore.scorePreferences.dateFormat == null ? 'relative' : $configStore.scorePreferences.dateFormat);
	$: dateTitle = (configStore, $configStore, dateObj ? formatDateCustomTooltip(dateObj, dateFormat) : null);
	$: formatted = dateObj ? formatDateCustom(dateObj, dateFormat) : noDate;
	$: prevDateObj = prevDate ? (isValidDate(prevDate) ? prevDate : dateFromUnix(date)) : null;
	$: prevDateTitle = (configStore, $configStore, prevDateObj ? formatDateCustomTooltip(prevDateObj, dateFormat) : null);
	$: prevFormatted = prevDateObj ? formatDateCustom(prevDateObj, dateFormat) : '';
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
