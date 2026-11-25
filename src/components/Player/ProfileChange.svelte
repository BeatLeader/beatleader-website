<script>
	import {createEventDispatcher} from 'svelte';
	import {dateFromUnix, formatDateRelative, getTimeStringColor} from '../../utils/date';
	import Flag from '../Common/Flag.svelte';

	export let change;
	export let removal = null;
	export let canRequestRemoval = false;

	const dispatch = createEventDispatcher();

	$: isNameChange = change?.oldName && change?.newName && change.oldName !== change.newName;
</script>

{#if change}
	<div class="qualification-description">
		<div class="timeset">
			<span style="color: {getTimeStringColor(change?.timestamp)}; ">
				{formatDateRelative(dateFromUnix(change.timestamp))}
			</span>
		</div>

		{#if isNameChange}
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

		{#if isNameChange && canRequestRemoval}
			{#if removal?.status === 'pending'}
				<span class="removal-status" title="Your request to remove this change is being reviewed, usually takes a few minutes">
					<i class="fas fa-hourglass-half"></i> Removal under review
				</span>
			{:else if removal?.status === 'manual'}
				<span class="removal-status" title="Your request to remove this change waits for an admin">
					<i class="fas fa-user-clock"></i> Removal waits for an admin
				</span>
			{:else if removal?.status === 'rejected'}
				<span class="removal-status declined" title="An admin declined removing this change, it can't be requested again">
					<i class="fas fa-ban"></i> Removal declined
				</span>
			{:else}
				<button
					class="removal-request"
					title="Ask to remove this change from your name history"
					aria-label="Ask to remove this change from your name history"
					on:click={() => dispatch('request-removal', change)}>
					<i class="fas fa-eraser"></i>
				</button>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.qualification-description {
		display: flex;
		flex-wrap: wrap;
		grid-gap: 0.4em;
		align-items: center;
		margin-top: 0.25em;
	}

	.removal-request {
		padding: 0.1em 0.35em;
		border: none;
		border-radius: 4px;
		background: none;
		color: var(--faded, #999);
		font: inherit;
		cursor: pointer;
		opacity: 0.6;
		transition:
			opacity 150ms,
			color 150ms,
			background-color 150ms;
	}

	.removal-request:hover,
	.removal-request:focus-visible {
		opacity: 1;
		color: var(--textColor, white);
		background-color: color-mix(in srgb, var(--textColor, white) 10%, transparent);
	}

	.removal-status {
		padding: 0.05em 0.45em;
		border-radius: 4px;
		font-size: 0.85em;
		white-space: nowrap;
		color: #e8c34a;
		background-color: color-mix(in srgb, var(--textColor, white) 8%, transparent);
	}

	.removal-status.declined {
		color: var(--faded, #999);
	}
</style>
