<script>
	import {createEventDispatcher, onMount} from 'svelte';
	import {fly} from 'svelte/transition';
	import createAccountStore from '../../stores/beatleader/account';
	import createRankingStore from '../../stores/http/http-ranking-store';
	import createEventRankingStore from '../../stores/http/http-event-ranking-store';
	import {PLAYERS_PER_PAGE} from '../../utils/beatleader/consts';
	import Pager from '../Common/Pager.svelte';
	import PlayerCard from './PlayerCard.svelte';
	import AddFriendButton from '../Player/AddFriendButton.svelte';
	import Switcher from '../Common/Switcher.svelte';
	import {deepClone} from '../../utils/js';

	import RankingMeta from './RankingMeta.svelte';
	import Select from '../Settings/Select.svelte';
	import {configStore} from '../../stores/config';

	import Spinner from '../Common/Spinner.svelte';

	const participantsImport24 = () => import('../../others/bswc2024').then(m => m.participants);
	const participantsImport25 = () => import('../../others/bswc2025').then(m => m.participants);

	export let type = 'global';
	export let page = 1;
	export let filters = {};
	export let noIcons = false;
	export let eventId = null;
	export let useInternalFilters = false;
	export let playerClickFilter = null;
	export let showTypeSwitcher = true;
	export let meta = false;
	export let editing = false;
	export let animationSign = 1;
	export let playersPerPage = PLAYERS_PER_PAGE;

	let currentFilters = filters;

	const dispatch = createEventDispatcher();

	const account = createAccountStore();

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	const rankingStore = createEventRankingStore(type, page, eventId, filters, []);

	function changeParams(newType, newPage, newFilters) {
		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		rankingStore.fetch(newType, newPage, eventId, {...newFilters});
	}

	function checkEligible(eventId, team) {
		if (eventId == 52) return '';

		if (eventId < 55) {
			const teamNames = [
				'Sweden',
				'Switzerland',
				'Argentina',
				'Staff',
				'Czechia',
				'Slovakia',
				'Latvia',
				'South Africa',
				'Saudi Arabia',
				'Hungary',
			];

			return teamNames.includes(team.name) ? '-eligible' : '';
		}

		if (eventId == 69 || eventId == 70) {
			const teamNames = [
				'Israel',
				'France',
				'Finland',
				'Switzerland',
				'Poland',
				'Denmark',
				'Norway',
				'United Kingdom',
				'Canada',
				'Sweden',
				'Italy',
				'Germany',
				'Netherlands',
				'Japan',
				'Australia',
				'United States',
			];

			return !teamNames.includes(team.name) ? '-eligible' : '';
		}

		if (eventId == 71) {
			const teamNames = [
				'Israel',
				'France',
				'Finland',
				'Denmark',
				'United Kingdom',
				'Canada',
				'Sweden',
				'Germany',
				'Netherlands',
				'Japan',
				'Australia',
				'United States',
			];

			if (eventId == 72) {
				const teamNames = ['Israel', 'United Kingdom', 'Canada', 'United States'];

				return !teamNames.includes(team.name) ? '-eligible' : '';
			}

			return !teamNames.includes(team.name) ? '-eligible' : '';
		}

		if (eventId == 55) {
			const teamNames = ['United States', 'United Kingdom', 'Denmark', 'Israel', 'Canada', 'Germany'];

			return !teamNames.includes(team.name) ? '-eligible' : '';
		}

		const teamNames = ['United States', 'United Kingdom', 'Canada'];

		return !teamNames.includes(team.name) ? '-eligible' : '';
	}

	onMount(() => {
		dispatch('loading', true);
	});

	$: isLoading = rankingStore.isLoading;
	$: pending = rankingStore.pending;
	$: numOfPlayers = $rankingStore ? $rankingStore.total : null;
	$: mainPlayerId = $account?.id;

	$: changeParams(type, page, filters);
	$: dispatch('loading', $isLoading);
	$: dispatch('pending', $pending?.page);
	$: dispatch('players-fetched', $rankingStore?.data);

	$: maxRank = $rankingStore?.data ? Math.max(...$rankingStore.data.map(p => p.playerInfo?.rank)) : 0;
	$: maxCountryRank = $rankingStore?.data ? Math.max(...$rankingStore.data.map(p => p.playerInfo?.country.rank)) : 0;

	$: if (!$isLoading && $rankingStore?.data) currentFilters = deepClone(filters);
</script>

{#if $rankingStore?.data?.length}
	<section class="ranking-grid">
		{#each $rankingStore.data as player, idx (player?.playerId)}
			{@const bswc2024 = eventId == 52 || eventId == 53 || eventId == 54 || eventId == 55 || eventId == 56}
			{@const bswc2025 = eventId == 69 || eventId == 70 || eventId == 71 || eventId == 72}
			{@const showFlags = bswc2024 || bswc2025}
			<div
				class="ranking-grid-row {showFlags || (!noIcons && $configStore.rankingList.showFriendsButton)
					? 'with-friends-button'
					: ''} {eventId == 50 && (player.playerInfo.rank == 1 || player.playerInfo.rank == 10 || player.playerInfo.rank == 50)
					? 'event-winner'
					: ''} {type}-rating"
				in:fly|global={{delay: idx * 10, x: animationSign * 100}}>
				<PlayerCard
					{player}
					playerId={mainPlayerId}
					{playerClickFilter}
					{currentFilters}
					value={sortValue?.value(player)}
					valueProps={eventId == 32 || eventId == 48
						? {prefix: '', suffix: ' scores', zero: 'Carbon positive', digits: 0}
						: (sortValue?.props ?? {})}
					{maxRank}
					{maxCountryRank}
					noImprovements={eventId}
					on:filters-updated />
				{#if showFlags}
					{#await bswc2025 ? participantsImport25() : participantsImport24()}
						<Spinner />
					{:then participants}
						{@const team = participants.find(t =>
							t.players.find(p =>
								p.user.playableAccounts.find(
									pa =>
										pa.id == player?.playerId ||
										pa.avatar.includes('cdn.assets.beatleader.com/' + player?.playerId) ||
										pa.avatar.includes('cdn.assets.beatleader.xyz/' + player?.playerId)
								)
							)
						)}
						{#if team}
							<img class={'bswc-country-icon' + checkEligible(eventId, team)} src={team.image} title={'Team ' + team.name} />
						{/if}
					{/await}
				{:else if !noIcons && $configStore.rankingList.showFriendsButton}
					<AddFriendButton playerId={player.playerId} />
				{/if}
			</div>
		{/each}
	</section>

	<Pager
		totalItems={numOfPlayers}
		itemsPerPage={playersPerPage}
		itemsPerPageValues={null}
		currentPage={page - 1}
		loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
		mode={numOfPlayers ? 'pages' : 'simple'}
		on:page-changed />
{:else if $isLoading}
	<div class="ranking-grid-empty" style="display: flex; justify-content: center; align-items: center; height: {playersPerPage * 2}em;">
		<Spinner />
	</div>
{:else}
	<p>No players found.</p>
{/if}

{#if meta}
	<RankingMeta {rankingStore} countries={filters.countries} />
{/if}

<style>
	.switcher-nav {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.ranking-grid {
		display: grid;
		grid-gap: 0.5em;
	}

	.ranking-grid-row {
		display: grid;
		grid-gap: 0.4em;
		align-items: center;
		justify-items: center;
	}

	.ranking-grid-row.with-friends-button {
		grid-template-columns: auto 2.4em;
	}

	.type-select {
		padding: 0.175rem;
		margin-top: 0.875rem;
		text-align: center;
		white-space: nowrap;
		border: 0;
		border-radius: 0.2em;
		cursor: pointer;
		color: var(--color, #363636);
		background-color: #dbdbdb;
		box-shadow: none;
		opacity: 0.35;
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		margin-left: 0.4em;
	}

	.type-option {
		color: black;
		font-family: inherit;
	}

	.type-switcher {
		margin-left: 0.4em;
	}

	:global(.followed-rating .clan-badges) {
		display: none;
	}

	nav > :global(*) {
		margin-top: 1rem;
		margin-bottom: 2rem;
	}

	.edit-enabled :global(.switch-types .button),
	.edit-enabled :global(.score-filters .filter-btn),
	.edit-enabled :global(.score-filters .filter),
	.edit-enabled :global(.score-filters .filter select),
	.edit-enabled :global(.score-filters .filter input) {
		cursor: cell !important;
		opacity: 1 !important;
		color: var(--textColor, white) !important;
		background: transparent !important;
	}

	.edit-enabled :global(.switch-types .button:not(.hidden)),
	.edit-enabled :global(.score-filters .filter:not(.hidden)) {
		border: 1px dotted var(--textColor, white);
	}

	.edit-enabled :global(.switch-types .button.hidden),
	.edit-enabled :global(.score-filters .filter.hidden) {
		filter: grayscale(1);
		opacity: 0.25 !important;
		transition: all 200ms;
	}

	.edit-enabled :global(.switch-types .button.hidden:hover),
	.edit-enabled :global(.score-filters .filter.hidden:hover) {
		filter: none;
		opacity: 0.5 !important;
	}

	:global(.ranking-grid-row.event-winner .player-card) {
		background-color: #61082c !important;
	}

	:global(.ranking-grid-row:has(.bswc-country-icon) .player-card) {
		opacity: 0.6 !important;
	}

	@media screen and (max-width: 500px) {
		.ranking-grid {
			grid-template-columns: 1fr;
		}

		:global(.player-name-and-rank .clan-badges) {
			display: none;
		}

		.switcher-nav {
			flex-direction: column-reverse;
		}

		.type-switcher {
			margin-top: 0;
			margin-bottom: 1rem;
		}
	}
</style>
