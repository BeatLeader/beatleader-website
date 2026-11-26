<script>
	import {dateFromUnix, DAYSECONDS, formatDate} from '../../utils/date';
	import {botCategoryById} from '../../utils/beatleader/bots';

	export let playerInfo;

	$: botCategory = playerInfo.bot ? botCategoryById(playerInfo.botInfo?.category ?? 0) : null;
	$: botVerified = playerInfo.bot && playerInfo.botInfo?.verified;
	$: verifiedTitle = botVerified
		? `Verified by BeatLeader admins${
				playerInfo.botInfo.verifiedAt ? ' on ' + formatDate(dateFromUnix(playerInfo.botInfo.verifiedAt), 'short', null) : ''
			}${playerInfo.botInfo.verificationComment ? ': ' + playerInfo.botInfo.verificationComment : ''}`
		: null;

	$: banDescription = playerInfo.banned && playerInfo.banDescription;
	$: title = banDescription
		? `Player banned by admin due to: ${banDescription.banReason} for ${
				banDescription.duration ? Math.round(banDescription.duration / DAYSECONDS) + ' days' : 'eternity'
			}`
		: `Player banned by admin`;
</script>

{#if playerInfo.banned}
	{#if playerInfo.bot}
		<span class="status bot" {title}>BOT</span>
		{#if botCategory}
			<span class="status bot-category" style="color: {botCategory.color}" title={botCategory.description}>
				<i class={botCategory.iconFa}></i>
				{botCategory.label}
			</span>
		{/if}
		{#if botVerified}
			<span class="status bot-verified" title={verifiedTitle}>
				<i class="fas fa-circle-check"></i>
				Verified
			</span>
		{/if}
	{:else if banDescription && banDescription.playerId == banDescription.bannedBy}
		<span
			class="status self-banned"
			title="Player suspended this account themself. It can be unblocked until {formatDate(
				dateFromUnix(banDescription.timeset + 6 * 30 * DAYSECONDS)
			)}">Self-suspended</span>
	{:else}
		<span class="status banned" {title}>Banned</span>
	{/if}
{/if}
{#if playerInfo.createdBy}
	<span class="status created-by">
		Created by:
		<a href={`/u/${playerInfo.createdBy.alias ?? playerInfo.createdBy.id}`} title="Developer of this bot">
			{#if playerInfo.createdBy.avatar}
				<img class="creator-avatar" src={playerInfo.createdBy.avatar} alt="" />
			{/if}
			{playerInfo.createdBy.name}
		</a>
	</span>
{/if}
{#if playerInfo.inactive}<span class="status inactive">Inactive</span>{/if}
{#if playerInfo.temporary}<span class="status temporary" title="Player profile was issued temporary, and will be deleted in a week"
		>Temporary</span
	>{/if}

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

	.bot {
		color: blue;
	}

	.bot-category,
	.bot-verified {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
	}

	.bot-verified {
		color: #4caf50;
		cursor: help;
	}

	.created-by {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
		color: #ffffff8f;
	}

	.created-by a {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
		color: var(--textColor);
	}

	.creator-avatar {
		width: 1.2em;
		height: 1.2em;
		border-radius: 50%;
	}

	.temporary {
		color: yellow;
	}
</style>
