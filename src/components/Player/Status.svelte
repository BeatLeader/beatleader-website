<script>
	import {dateFromUnix, DAYSECONDS, formatDate} from '../../utils/date';

	export let playerInfo;

	$: banDescription = playerInfo.banned && playerInfo.banDescription;
	$: title = banDescription
		? `Player banned by admin due to: ${banDescription.banReason} for ${
				banDescription.duration ? Math.round(banDescription.duration / DAYSECONDS) + ' days' : 'eternity'
		  }`
		: `Player banned by admin`;
</script>

{#if playerInfo.banned}
	{#if banDescription && banDescription.playerId == banDescription.bannedBy}
		<span
			class="status self-banned"
			title="Player suspended this account themself. It can be unblocked until {formatDate(
				dateFromUnix(banDescription.timeset + 6 * 30 * DAYSECONDS)
			)}">Self-suspended</span>
	{:else}
		<span class="status banned" {title}>Banned</span>
	{/if}
{/if}
{#if playerInfo.inactive}<span class="status inactive">Inactive</span>{/if}

<style>
	.status {
		border-left: 1px solid var(--dimmed);
		padding-left: 0.75rem;
		margin-left: 0.5rem;
	}

	.banned {
		color: var(--decrease);
	}

	.self-banned {
		color: grey;
	}

	.inactive {
		color: var(--faded);
	}
</style>
