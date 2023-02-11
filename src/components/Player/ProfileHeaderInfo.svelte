<script>
	import {navigate} from 'svelte-routing';
	import {createEventDispatcher, getContext} from 'svelte';
	import createAccountStore from '../../stores/beatleader/account';
	import createStatsHistoryStore from '../../stores/beatleader/stats-history';
	import {configStore} from '../../stores/config';
	import {PLAYERS_PER_PAGE} from '../../utils/beatleader/consts';

	import Value from '../Common/Value.svelte';
	import Status from './Status.svelte';
	import Error from '../Common/Error.svelte';
	import Button from '../Common/Button.svelte';
	import Preview from '../Common/Preview.svelte';
	import CountryPicker from '../Common/CountryPickerSingle.svelte';
	import ClanBadges from './ClanBadges.svelte';
	import BanForm from './BanForm.svelte';
	import ProfileChange from './ProfileChange.svelte';

	export let name;
	export let playerInfo;
	export let playerId;
	export let error = null;
	export let editModel = null;
	export let showRedact = true;

	const dispatch = createEventDispatcher();

	const account = createAccountStore();
	const historyStore = createStatsHistoryStore();

	function getCountryRankingUrl(countryObj) {
		const rank = countryObj?.rankValue ?? countryObj?.rank ?? null;
		if (!rank) return null;

		const country = countryObj?.country ?? null;
		if (!country) return null;

		return `/ranking/${Math.floor((rank - 1) / PLAYERS_PER_PAGE) + 1}?countries=${country.toLowerCase()}`;
	}

	function navigateToCountryRanking(countryObj) {
		const url = getCountryRankingUrl(countryObj);

		if (url && url.length) navigate(url);
	}

	function navigateToGlobalRanking(rank) {
		if (!rank) return;

		navigate(`/ranking/${Math.floor((rank - 1) / PLAYERS_PER_PAGE) + 1}`);
	}

	function getPlayerCountries(playerInfo) {
		if (!playerInfo?.countries) return [];

		return playerInfo.countries.map(c => ({
			...c,
			prevRank: playerInfo?.lastWeekCountryRank,
		}));
	}

	const {open} = getContext('simple-modal');
	const showProfile = profileLink => {
		open(Preview, {previewLink: profileLink});
	};

	function showRainbow(player) {
		var result = false;
		player.clans?.forEach(element => {
			if (element.tag == 'GAY') {
				result = true;
			}
		});

		return result;
	}

	let showBanForm = false;
	let showChanges = false;

	$: rank = playerInfo ? (playerInfo.rankValue ? playerInfo.rankValue : playerInfo.rank) : null;
	$: changes = playerInfo?.changes;
	$: countries = getPlayerCountries(playerInfo);
	$: loggedInPlayer = $account?.id;
	$: isMain = playerId && $account?.id === playerId;
	$: isAdmin = $account?.player?.role?.includes('admin');
	$: canRedact = showRedact && ((isMain && loggedInPlayer === playerId) || isAdmin);

	function getIndex(array) {
		if (!array || array.length == 1) {
			return 0;
		} else {
			return array.length - Math.min($configStore.preferences.daysToCompare, array.length) - 1;
		}
	}

	function getPrevLabel() {
		switch ($configStore.preferences.daysToCompare) {
			case 1:
				return 'Yesterday';
			case 7:
				return 'Last week';
			case 30:
				return 'Last month';

			default:
				return `${$configStore.preferences.daysToCompare} days ago`;
		}
	}

	$: history = $historyStore[playerId];
	$: prevLabel = getPrevLabel();
	$: prevRank = history?.rank ? history.rank[getIndex(history.rank)] : playerInfo?.rank;
	$: prevPp = history?.pp ? history.pp[getIndex(history.pp)] : playerInfo?.pp;
	$: prevCountryRank = history?.countryRank ? history.countryRank[getIndex(history.countryRank)] : playerInfo?.countryRank;
</script>

{#if showBanForm}
	<BanForm {playerId} accountStore={account} on:finished={() => (showBanForm = false)} />
{/if}
<div class="profile-header-info">
	{#if playerInfo}
		<div class="player-nickname {showRainbow(playerInfo) ? 'rainbow' : ''}">
			{#if name}
				{#if editModel?.data}
					<input type="text" bind:value={editModel.data.name} placeholder="Your name" class="input-reset" />
				{:else if playerInfo.externalProfileUrl}
					<a
						href={playerInfo.externalProfileUrl}
						on:click={e => {
							e.preventDefault();
							showProfile(playerInfo.externalProfileCorsUrl);
						}}
						target="_blank"
						rel="noreferrer">
						{name}
					</a>
				{:else}
					{name}
				{/if}

				{#if !editModel}
					<span class="clan-badges"><ClanBadges player={playerInfo} /></span>
				{/if}

				{#if changes && changes.length}
					<div class="score-options-section">
						<span
							class="beat-savior-reveal clickable"
							class:opened={showChanges}
							on:click={() => (showChanges = !showChanges)}
							title={showChanges ? 'Hide profile changelog' : 'Show profile changelog'}>
							<i class="fas fa-chevron-down" />
						</span>
					</div>
				{/if}

				{#if canRedact && !editModel?.data}
					<div style="margin: 0; padding: 0;">
						<Button
							type="text"
							title="Edit profile"
							cls="editNameButton"
							iconFa="fas fa-edit"
							on:click={() => dispatch('edit-model-enable')} />
					</div>
				{/if}
			{/if}

			<span class="status">
				<Status {playerInfo} />
			</span>
		</div>

		{#if showChanges}
			{#each changes as change, idx}
				<ProfileChange {change} />
			{/each}
		{/if}

		{#if playerInfo.sponsor}
			{#if editModel?.data}
				<div class="sponsor-message">
					<span
						>This message will be shown in-game for your scores.<br />
						You can use <a class="inlineLink" href="http://digitalnativestudios.com/textmeshpro/docs/rich-text">Unity tags</a> here.</span>
					<input type="text" bind:value={editModel.data.message} placeholder="Promotion message" class="sponsor-input" />
				</div>
			{/if}
		{/if}

		<div class="player-ranking">
			<a
				style="flex: none"
				href={`/ranking/${Math.floor((rank - 1) / PLAYERS_PER_PAGE) + 1}`}
				on:click|preventDefault={() => navigateToGlobalRanking(rank)}
				title="Go to global ranking"
				class="clickable">
				<i class="fas fa-globe-americas" />

				<Value
					value={playerInfo?.rank}
					prevValue={prevRank}
					{prevLabel}
					prefix="#"
					digits={0}
					zero="#0"
					inline={true}
					reversePrevSign={true} />
			</a>

			{#if canRedact && editModel?.data}
				<div class="pickerContainer">
					<CountryPicker selected={editModel.data.country} on:select={e => (editModel.data.country = e.detail.value)} />
				</div>
			{:else}
				{#each countries as country}
					<a
						style="flex: none"
						href={getCountryRankingUrl(country)}
						on:click|preventDefault={() => navigateToCountryRanking(country)}
						title="Go to country ranking"
						class="clickable">
						<img
							src={`/assets/flags/${country && country.country && country.country.toLowerCase ? country.country.toLowerCase() : ''}.png`}
							class="countryIcon"
							alt={country?.country} />

						<Value
							value={country.rank}
							prevValue={prevCountryRank}
							{prevLabel}
							prefix="#"
							digits={0}
							zero="#0"
							inline={true}
							reversePrevSign={true} />

						{#if country.subRank && country.subRank !== country.rankValue}
							<small>(#{country.subRank})</small>
						{/if}
					</a>
				{/each}
			{/if}

			<span class="pp">
				<Value value={playerInfo?.pp} suffix="pp" prevValue={prevPp} {prevLabel} inline={true} zero="0pp" />
			</span>

			{#if showRedact && isAdmin && loggedInPlayer != playerId}
				{#if playerInfo?.banned}
					<Button
						cls="banButton"
						title="Unban player"
						label="Unban player"
						type="danger"
						on:click={async () => await account.unbanPlayer(playerId)} />
				{:else}
					<Button cls="banButton" title="Ban player" label="Ban player" type="danger" on:click={async () => (showBanForm = !showBanForm)} />
				{/if}
			{/if}
		</div>

		{#if editModel?.data && editModel?.data?.country?.toUpperCase() !== playerInfo?.countries?.[0]?.country}
			Make sure you selected right country. You can change it only every 30 days.
		{/if}

		{#if error}
			<div>
				<Error {error} />
			</div>
		{/if}
	{:else if error}
		<div>
			<Error {error} />
		</div>
	{/if}
</div>

<style>
	.profile-header-info {
		display: contents;
	}

	.player-nickname {
		display: flex;
		flex-wrap: nowrap;
		color: var(--alternate);
		font-size: 2em;
		font-weight: bold;
		margin: -0.2em 0em;
		align-items: baseline;
	}

	.player-nickname.rainbow {
		color: #00ffbc;
		-webkit-background-clip: text;
		background-clip: text;
		background-image: -webkit-linear-gradient(180deg, #f35626, #feab3a);
		-webkit-animation: rainbow 0.9s infinite linear;
		animation: rainbow 0.9s infinite linear;
	}

	.clan-badges {
		margin-left: 0.5rem;
		position: relative;
		top: -0.125em;
	}

	.status {
		font-size: smaller;
	}

	.player-ranking {
		display: flex;
		flex-wrap: wrap;
		grid-gap: 0.7em;
		font-size: 1.25em;
		font-weight: 500;
		align-items: center;
	}

	:global(.edit-enabled) .player-ranking {
		margin: 1rem 0;
	}

	.pp {
		color: var(--ppColour) !important;
	}

	.sponsor-message {
		padding-top: 1em;
		padding-bottom: 1em;
		display: grid;
	}

	.sponsor-input {
		font-size: inherit;
		padding: 0;
		color: var(--textColor);
		background-color: transparent;
		border: none;
		border-bottom: solid 1px var(--dimmed);
		outline: none;
	}

	.countryIcon {
		width: 1.2em;
	}

	.input-reset {
		font-size: inherit;
		padding: 0;
		color: var(--textColor);
		background-color: transparent;
		border: none;
		border-bottom: solid 1px var(--dimmed);
		outline: none;
		max-width: 80vw;
	}

	.input-reset::placeholder {
		color: var(--faded) !important;
	}

	.inlineLink {
		display: contents;
	}

	.pickerContainer {
		font-size: 1rem;
	}

	:global(.editNameButton) {
		margin-bottom: -1em !important;
		font-size: 0.75em !important;
	}
	:global(.banButton) {
		padding: 0 !important;
		font-size: 0.8em !important;
	}

	.beat-savior-reveal {
		align-self: end;
		cursor: pointer;
	}

	.beat-savior-reveal > i {
		transition: transform 500ms;
		transform-origin: 0.42em 0.5em;
	}

	.beat-savior-reveal.opened > i {
		transform: rotateZ(180deg);
	}

	.score-options-section {
		display: grid;
		justify-items: center;
		opacity: 0;
	}

	.score-options-section:hover {
		opacity: 1;
	}

	@media screen and (max-width: 767px) {
		.input-reset {
			flex: 1;
		}

		.player-ranking {
			justify-content: center;
		}

		.player-nickname {
			flex-wrap: wrap !important;
			justify-content: center;
		}
	}
</style>
