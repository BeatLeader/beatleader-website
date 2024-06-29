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
		<span class="pp">
			<Value value={playerData?.playerInfo?.pp} suffix="pp" inline={true} zero="0pp" />
		</span>
		<div class="platform-entry">
			<a
				style="flex: none"
				href={`/ranking/${Math.floor((rank - 1) / PLAYERS_PER_PAGE) + 1}`}
				on:click|preventDefault={() => navigateToGlobalRanking(rank)}
				title="Go to global ranking"
				class="clickable">
				<Value value={playerInfo?.rank} prefix="#" digits={0} zero="#0" inline={true} reversePrevSign={true} />
				<i class="fas fa-globe-americas" />
			</a>
			<div class="hmd-container">
				<div class="hmd-image-container">
					<img src={'/assets/' + headset?.icon} alt={headset?.name} style={headsetStyle} />
				</div>
				<span>
					{headset?.name}
				</span>
			</div>
		</div>
		<div class="platform-entry">
			<a
				style="flex: none"
				href={getCountryRankingUrl(country)}
				on:click|preventDefault={() => navigateToCountryRanking(country)}
				title="Go to country ranking"
				class="clickable">
				<Value value={country.rank} prefix="#" digits={0} zero="#0" inline={true} reversePrevSign={true} />
				<img
					src={`/assets/flags/${country && country.country && country.country.toLowerCase ? country.country.toLowerCase() : ''}.png`}
					class="countryIcon"
					alt={country?.country} />
			</a>
			<div class="top-platform">
				{topPlatform}
			</div>
		</div>
	</div>
</div>

<style>
	.pp {
		font-size: 1.6em !important;
		font-weight: 700 !important;
		color: #ffffff !important;
		display: flex;
		justify-content: center;
		align-items: center;
		flex: 1;
		background-color: #00000069;
		border-radius: 8px 8px 0 0;
		margin: -0.3em -0.3em 0em -0.3em;
	}

	.player-data {
		display: flex;
		flex-wrap: wrap;
		gap: 0.1em;
		background-color: #1212129c;
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

	.platform-entry a {
		color: var(--textColor) !important;
	}

	.countryIcon {
		width: 1.2em;
	}
</style>
