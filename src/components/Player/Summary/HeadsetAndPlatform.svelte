<script>
	import {getControllerForEnum, getHeadsetForHMD, platformDescription} from '../../../utils/beatleader/format';

	import {navigate} from 'svelte-routing';
	import {configStore} from '../../../stores/config';
	import createStatsHistoryStore from '../../../stores/beatleader/stats-history';
	import Value from '../../Common/Value.svelte';
	import {PLAYERS_PER_PAGE} from '../../../utils/beatleader/consts';

	export let playerData;

	const historyStore = createStatsHistoryStore();

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

	$: scoresStats = playerData.scoreStats;
	$: topPlatform = scoresStats.topPlatform && platformDescription[scoresStats.topPlatform];
	$: headset = scoresStats.topHMD && getHeadsetForHMD(scoresStats.topHMD);
	$: headsetStyle = `width: 1.2em; height: 1.2em; margin-bottom: -0.2em; filter: ${headset?.color}`;
	$: topController = scoresStats.topController;
	$: controllerDescription = topController && getControllerForEnum(topController).length > 0 ? getControllerForEnum(topController) : '';

	$: playerInfo = playerData?.playerInfo;
	$: country = playerInfo?.country;
	$: playerId = playerData?.playerId;

	$: history = $historyStore[playerId];
	$: prevLabel = getPrevLabel();
	$: prevRank = history?.rank ? history.rank[getIndex(history.rank)] : playerInfo?.rank;
	$: rank = playerInfo ? (playerInfo.rankValue ? playerInfo.rankValue : playerInfo.rank) : null;

	$: prevCountryRank = history?.countryRank ? history.countryRank[getIndex(history.countryRank)] : playerInfo?.countryRank;
</script>

<div>
	<div class="player-data">
		<div class="platform-entry">
			<span class="platform-title" title="Global ranking place">Global</span>
			<a
				style="flex: none"
				href={`/ranking/${Math.floor((rank - 1) / PLAYERS_PER_PAGE) + 1}`}
				on:click|preventDefault={() => navigateToGlobalRanking(rank)}
				title="Go to global ranking"
				class="clickable">
				<i class="fas fa-globe-americas" />

				<Value
					value={playerInfo?.rank}
					prevValue={$configStore.profileParts.changes ? prevRank : undefined}
					{prevLabel}
					prefix="#"
					digits={0}
					zero="#0"
					inline={true}
					reversePrevSign={true} />
			</a>
		</div>
		<div class="platform-entry">
			<span class="platform-title" title="Country ranking place">Country</span>
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
					prevValue={$configStore.profileParts.changes ? prevCountryRank : undefined}
					{prevLabel}
					prefix="#"
					digits={0}
					zero="#0"
					inline={true}
					reversePrevSign={true} />
			</a>
		</div>
		{#if headset}
			<div class="platform-entry">
				<span class="platform-title" title="Last 50 scores top headset">Headset</span>
				<div class="hmd-container">
					<div class="hmd-image-container">
						<img src={'/assets/' + headset.icon} alt={headset.name} style={headsetStyle} />
					</div>
					<span>
						{headset.name}
					</span>
				</div>
			</div>
		{/if}
		{#if controllerDescription.length}
			<div class="platform-entry">
				<span class="platform-title" title="Last 50 scores top controllers">Controllers</span>
				{controllerDescription}
			</div>
		{/if}
		{#if topPlatform}
			<div class="platform-entry">
				<span class="platform-title" title="Last 50 scores top platform">Platform</span>
				{topPlatform}
			</div>
		{/if}
	</div>
</div>

<style>
	.player-data {
		display: flex;
		flex-wrap: wrap;
		gap: 0.1em;
		background-color: #121212;
		max-width: 18em;
		min-width: 13em;
		padding: 0.5em;
		border-radius: 8px;
		justify-content: space-between;
	}
	.hmd-container {
		display: flex;
		gap: 0.4em;
	}
	.platform-title {
		font-size: small;
		font-weight: 700;
	}
	.platform-entry {
		display: flex;
		min-width: 4em;
		gap: 0.4em;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}

	.countryIcon {
		width: 1.2em;
	}

	.platform-entry a {
		color: var(--textColor) !important;
	}
</style>
