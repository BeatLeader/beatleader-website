<script>
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import {opt} from '../../utils/js';
	import Value from '../Common/Value.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import Change from '../Common/Change.svelte';
	import Flag from '../Common/Flag.svelte';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import {PLAYERS_PER_PAGE} from '../../utils/beatleader/consts';
	import ClanBadges from '../Player/ClanBadges.svelte';
	import {rankValue, ppValue, changingValuesClan} from '../../utils/clans';
	import {buildSearchFromFilters} from '../../utils/filters';
	import {createEventDispatcher} from 'svelte';
	import MiniProfile from '../Player/Mini/MiniProfile.svelte';
	import Popover from '../Common/Popover.svelte';
	import {configStore} from '../../stores/config';
	import {PlayerValue, RANKING_SORT_BY_PROPS} from './rankingSortConstants';

	export let player;
	export let currentFilters = null;
	export let playerId = null;
	export let withCrown = false;
	export let selectedClanTag = null;
	export let numRank = 1;

	export let playerClickFilter = null;
	export let maxRank = 1;
	export let maxCountryRank = 1;
	export let maxNumRank = 1;
	export let opacity = '1.0';
	export let noImprovements = false;

	const dispatch = createEventDispatcher();

	function navigateToPlayer(player) {
		if (!player) return;

		navigate(`/u/${player.alias ?? player.playerId}${playerClickFilter ? '?' + playerClickFilter : ''}`);
	}

	function onPlayerClick(event, player) {
		const target = event.target;
		if (
			target &&
			(target.classList.contains('rank') ||
				target.classList.contains('country') ||
				target.classList.contains('sharp') ||
				target.classList.contains('value'))
		)
			return;

		if (!player) return;

		navigateToPlayer(player);
	}

	function onCountryClick(player) {
		if (!player) return;

		if (currentFilters) {
			currentFilters.countries = player?.playerInfo?.country?.country?.toLowerCase() ?? '';

			const currentPage = Math.floor((player.playerInfo.country.rank - 1) / PLAYERS_PER_PAGE) + 1;
		}

		navigate(`/ranking/${currentPage}?${buildSearchFromFilters(currentFilters)}`);
	}

	function onGlobalClick(player) {
		if (!player) return;

		navigate(`/ranking/${Math.floor((player.playerInfo.rank - 1) / PLAYERS_PER_PAGE) + 1}?${buildSearchFromFilters(currentFilters)}`);
	}

	function showRainbow(player) {
		var result = false;
		player.clans?.forEach(element => {
			if (element.tag == 'GAY') {
				result = true;
			}
		});

		return result;
	}

	var pp = player?.playerInfo?.pp;
	var rank = 1;
	var countryRank = 1;

	function updateRanks(numRank, showingGeneral) {
		rank = showingGeneral ? player?.playerInfo?.rank : numRank;
		countryRank = showingGeneral ? (player?.playerInfo?.country.rankValue ?? player?.playerInfo?.country.rank) : player?.playerInfo?.rank;
	}

	function hoverStats() {
		if (player && player.playerInfo && (selectedClanTag || player.clans)) {
			const firstSpecialClanTag = selectedClanTag ?? changingValuesClan(player.clans);
			pp = ppValue(firstSpecialClanTag, player.playerInfo.pp);
			rank = rankValue(firstSpecialClanTag, rank);
			countryRank = rankValue(firstSpecialClanTag, countryRank);
		}
	}

	let firstColumnWidth = '3.5em';
	let firstColumnGridTemplate = '';

	function updateFirstColumn(maxRank, maxCountryRank, showCountryRank, showDifference, showCountryDifference) {
		let result = 1.5;
		let gridParts = [];

		function addPart(rank, showDiff, offset = 0) {
			let width = offset + 1.4 + ((rank + '').length - 1) * 0.6;
			result += width;
			gridParts.push(width + 'em');
			if (showDiff) {
				let diffWidth = 1 + ((rank + '').length - 1) * 0.6;
				result += diffWidth;
				gridParts.push(diffWidth + 'em');
			}
		}

		addPart(maxRank, showDifference);

		if (showCountryRank) {
			addPart(maxCountryRank, showCountryDifference, 1.5);
		}

		firstColumnWidth = result + 'em';
		firstColumnGridTemplate = gridParts.join(' ');
	}

	$: showingGeneral = currentFilters.sortBy == 'pp' && currentFilters.ppType == 'general';
	$: updateFirstColumn(
		showingGeneral ? maxRank : maxNumRank,
		showingGeneral ? maxCountryRank : maxRank,
		$configStore.rankingList.showCountryRank,
		!noImprovements && $configStore.rankingList.showDifference && showingGeneral,
		!noImprovements && $configStore.rankingList.showCountryDifference && showingGeneral
	);

	$: value = PlayerValue(player, currentFilters);
	$: valueProps = RANKING_SORT_BY_PROPS[currentFilters.sortBy];
	$: updateRanks(numRank, showingGeneral);

	let referenceElement;
</script>

<a
	href={`/u/${player.alias ?? player.playerId}${playerClickFilter ? '?' + playerClickFilter : ''}`}
	class={`player-card ${$configStore.rankingList.ppToTheLeft ? 'with-pp-on-left' : ''} ${playerId == player.playerId ? 'current' : ''} ${
		showRainbow(player) ? 'rainbow' : ''
	}`}
	bind:this={referenceElement}
	style="grid-template-columns: {firstColumnWidth} 4em auto 1fr; opacity: {opacity}"
	on:click|preventDefault={e => onPlayerClick(e, player)}
	on:keypress={e => onPlayerClick(e, player)}
	on:pointerover={() => hoverStats(player)}>
	<div class="player-rank" style="grid-template-columns: {firstColumnGridTemplate}">
		<div
			class={`rank ${rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'brown' : rank >= 10000 ? 'small' : ''}`}
			title="Go to global ranking"
			on:click={e => onGlobalClick(player)}
			on:keypress={e => onGlobalClick(e, player)}>
			#<Value value={rank} digits={0} zero="?" />
		</div>
		{#if !noImprovements && $configStore.rankingList.showDifference && showingGeneral}
			<span class="change" title="Compared to the last week">
				<Change value={opt(player, 'others.difference')} digits={0} />
			</span>
		{/if}
		{#if $configStore.rankingList.showCountryRank}
			<div
				class={`rank ${$configStore.rankingList.showColorsForCountryRank ? '' : 'not'}${
					countryRank === 1 ? 'gold' : countryRank === 2 ? 'silver' : countryRank === 3 ? 'brown' : countryRank >= 10000 ? 'small' : ''
				}`}
				title="Go to country ranking"
				on:click={e => onCountryClick(player)}
				on:keypress={e => onGlobalClick(e, player)}>
				#<Value value={countryRank} digits={0} zero="?" />
				{#if showingGeneral}
					<Flag country={opt(player, 'playerInfo.country.country')} />
				{:else}
					<i class="fa-solid fa-earth-americas"></i>
				{/if}
			</div>
		{/if}
		{#if !noImprovements && $configStore.rankingList.showCountryDifference && showingGeneral}
			<span class="change" title="Country rank compared to the last week">
				<Change value={opt(player, 'others.countryDifference')} digits={0} />
			</span>
		{/if}
		{#if $configStore.rankingList.ppToTheLeft}
			<div class="steam-and-pp">
				<div>
					{#if valueProps.isText}
						{value}
					{:else}
						<Value {value} {...valueProps} />
					{/if}
				</div>
			</div>
		{/if}
	</div>
	<div class="player-avatar">
		<Avatar {player} />
	</div>
	<div class="player-name-and-rank">
		<PlayerNameWithFlag {player} {playerClickFilter} hideFlag={true} {withCrown} disablePopover={true} />

		{#if $configStore.rankingList.showClans}
			<ClanBadges {player} />
		{/if}
	</div>
	{#if !$configStore.rankingList.ppToTheLeft}
		<div class="steam-and-pp">
			<div>
				{#if valueProps.isText}
					{value}
				{:else}
					<Value {value} {...valueProps} />
				{/if}
			</div>
		</div>
	{/if}
</a>

{#if player && player.playerInfo && $configStore.rankingList.openPlayerPopover}
	<Popover triggerEvents={['hover', 'focus']} {referenceElement} placement="bottom" spaceAway={10}>
		<div class="popover-contents" transition:fade|global={{duration: 250}}>
			<MiniProfile {player} />
		</div>
	</Popover>
{/if}

<style>
	.player-card {
		display: inline-grid;
		grid-template-rows: 1fr;
		padding: 0 0.2em 0 0.2em;
		border: 2px solid var(--dimmed);
		border-radius: 8px;
		background-color: var(--background);
		cursor: pointer;
		font-size: 1.12em;
		align-items: center;
		width: 100%;
		color: unset;
	}
	.player-card.with-pp-on-left {
		grid-template-columns: 12em 4em auto 1fr;
	}

	.current {
		border-color: yellow;
	}

	.player-card:hover {
		background-color: var(--faded);
	}

	.player-card.rainbow:hover {
		color: #00ffbc;
		-webkit-background-clip: text;
		background-clip: text;
		background-image: -webkit-linear-gradient(180deg, #f35626, #feab3a);
		-webkit-animation: rainbow 0.9s infinite linear;
		animation: rainbow 0.9s infinite linear;
	}

	.player-card .player-avatar {
		position: relative;
		overflow: visible;
	}

	.player-card .player-avatar :global(figure) {
		width: 2em;
		height: 2em;
		margin-left: 1em;
	}

	.player-card :global(.rank) {
		padding: 0 0.25em;
		font-size: 0.8em;
		font-weight: 500;
		background-color: var(--dimmed);
		border-radius: 3px;
		margin-left: 0.25em;
		cursor: pointer;
		flex: none;
		width: fit-content;
	}

	.player-card .player-name-and-rank {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		font-size: 1.1em;
		font-weight: 500;
	}

	.player-card .steam-and-pp {
		display: flex;
		justify-self: end;
		align-items: center;
		font-size: 0.8em;
		font-weight: 500;
		margin-right: 0.25em;
	}

	.player-card .player-countryglobal-rank {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.player-card :global(.rank.small) {
		font-size: 0.875em;
	}

	.player-card :global(.rank.gold) {
		background-color: darkgoldenrod;
	}

	.player-card :global(.rank.silver) {
		background-color: #888;
	}

	.player-card :global(.rank.brown) {
		background-color: saddlebrown;
	}

	.player-card :global(.player-name-and-rank .clan-badges) {
		margin-left: 0.3em;
		margin-top: 0.1em;
	}

	.player-card .player-rank {
		display: grid;
		justify-content: space-between;
		align-items: center;
		font-size: 1.1em;
		font-weight: 500;
	}

	.player-card .change {
		font-size: 0.875em;
	}

	.banner {
		display: flex;
		justify-content: center;
		margin-bottom: 1em;
	}

	.show-details {
		display: flex;
		justify-content: center;
		margin-bottom: 1em;
	}

	.details {
		margin: 1em;
	}

	.clickable {
		cursor: pointer;
	}

	.reveal-title {
		margin-right: 0.5em;
		margin-bottom: -0.2em;
	}

	.details-reveal.opened {
		transform: rotateZ(180deg);
	}

	.popover-contents {
		max-width: 40em;
	}

	@media screen and (max-width: 768px) {
		.player-card {
			grid-template-columns: 50% 50% !important;
			grid-template-rows: 1fr 1fr;
		}

		.player-card .player-avatar {
			grid-column: 1 / 2;
			grid-row: 1;
			margin-left: -0.8em;
		}

		.player-card .player-name-and-rank {
			grid-column: 1 / 3;
			margin-left: 2.5em;
			grid-row: 1;
		}

		.player-card .player-name-and-rank :global(a) {
			white-space: unset;
			overflow-wrap: break-word;
		}

		.player-card .steam-and-pp {
			grid-column: 2;
			grid-row: 2;
		}
	}

	@media (hover: none) {
		.player-card.rainbow {
			color: #00ffbc;
			-webkit-background-clip: text;
			background-clip: text;
			background-image: -webkit-linear-gradient(180deg, #f35626, #feab3a);
			-webkit-animation: rainbow 0.9s infinite linear;
			animation: rainbow 0.9s infinite linear;
		}
	}
</style>
