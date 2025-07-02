<script>
	import {navigate} from 'svelte-routing';
	import createAccountStore from '../../stores/beatleader/account';
	import {LEADERBOARD_SCORES_PER_PAGE} from '../../utils/beatleader/consts';
	import {LEADERBOARD_SCORES_PER_PAGE as ACCSABER_LEADERBOARD_SCORES_PER_PAGE} from '../../utils/accsaber/consts';
	import Icons from '../Song/Icons.svelte';
	import Badge from '../Common/Badge.svelte';
	import SongCover from './SongCover.svelte';
	import {configStore} from '../../stores/config';

	export let leaderboard = null;
	export let score = null;
	export let rank = null;
	export let song = null;
	export let twitchUrl = null;
	export let notClickable = false;
	export let replayLink = false;
	export let category = null;
	export let service = 'scores';
	export let noIcons = false;
	export let icons = null;

	const account = createAccountStore();

	function mapServiceToLink(service) {
		switch (service) {
			case 'accsaber':
			case 'clanranking':
				return service;
		}

		return 'global';
	}

	$: song = leaderboard?.song ?? null;
	$: scoresPerPage = service === 'accsaber' ? ACCSABER_LEADERBOARD_SCORES_PER_PAGE : LEADERBOARD_SCORES_PER_PAGE;
	$: page = rank && Number.isFinite(rank) ? Math.floor((rank - 1) / scoresPerPage) + 1 : 1;
	$: diffInfo = leaderboard?.diffInfo ?? null;
	$: leaderboardId = leaderboard?.leaderboardId ?? '';
	$: leaderboardUrl = `/leaderboard/${mapServiceToLink(service)}/${leaderboardId}/${page ?? ''}`;
	$: isPlayerScore = $account?.id && $account?.id === score?.playerId;
	$: serviceIcon = score?.metadata ?? null;
</script>

{#if song}
	<section>
		<SongCover mods={score?.mods} {leaderboard} {notClickable} url={leaderboardUrl} triangle={$configStore.scorePreferences.showTriangle} />

		<div class="songinfo">
			{#if notClickable}
				<span class="name">{song.name} {song.subName}</span>
				<div class="author"><span class="author-name">{song.author}</span> <small>{song.mapper}</small></div>
			{:else}
				<a href={leaderboardUrl} on:click|preventDefault={() => navigate(leaderboardUrl)}>
					<span class="name">{song.name} {song.subName}</span>
					<div class="author"><span class="author-name">{song.author}</span> <small>{song.mapper}</small></div>

					{#if category}
						<span class="category">
							<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)" label={category} fluid={true} />
						</span>
					{/if}
				</a>
			{/if}
		</div>

		{#if !noIcons && song}
			<div class="desktop-and-up">
				<Icons
					layoutType="large"
					{song}
					{twitchUrl}
					{diffInfo}
					scoreId={score.id}
					{replayLink}
					{icons}
					{serviceIcon}
					noPin={!isPlayerScore}
					on:score-pinned />
			</div>
		{/if}
	</section>
{/if}

<style>
	section {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		grid-gap: 0.75em;
	}

	.songinfo {
		text-align: left;
		font-size: 0.95rem;
		font-weight: 500;
		flex-grow: 1;
	}

	.songinfo {
		color: var(--alternate);
	}

	.songinfo .name {
		overflow-wrap: anywhere;
	}

	.songinfo small {
		font-size: 0.75em;
		color: var(--ppColour);
	}

	.author-name {
		overflow-wrap: anywhere;
	}

	.category {
		font-size: 0.75em;
	}

	.songinfo .category :global(.badge) {
		width: auto;
	}
</style>
