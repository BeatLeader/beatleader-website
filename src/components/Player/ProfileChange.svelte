<script>
	import {dateFromUnix, formatDateRelative, getTimeStringColor} from '../../utils/date';
	import Flag from '../Common/Flag.svelte';

	export let change;
</script>

{#if change}
	<div class="qualification-description">
		<div class="timeset">
			<span style="color: {getTimeStringColor(change?.timestamp)}; ">
				{formatDateRelative(dateFromUnix(change.timestamp))}
			</span>
		</div>

		{#if change.oldName && change.newName && change.oldName !== change.newName}
			{change.oldName} → {change.newName}
		{/if}

		{#if change.oldCountry && change.newCountry && change.oldCountry !== change.newCountry}
			{change.oldCountry}
			<Flag country={change.oldCountry} on:flag-click /> → {change.newCountry}
			<Flag country={change.newCountry} on:flag-click />
		{/if}

		{#if change.changer}
			Changed by Admin
		{/if}
	</div>
{/if}

<style>
	.qualification-description {
		display: flex;
		grid-gap: 0.4em;
		align-items: center;
		margin-top: 0.25em;
	}
</style>
