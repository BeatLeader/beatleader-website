<script>
	import ContentBox from '../../Common/ContentBox.svelte';
	import BeatLeaderSummary from './BeatLeaderSummary.svelte';
	import HeadsetAndPlatform from './HeadsetAndPlatform.svelte';

	import createStatsHistoryStore from '../../../stores/beatleader/stats-history';
	import {configStore} from '../../../stores/config';
	import Value from '../../Common/Value.svelte';

	const historyStore = createStatsHistoryStore();

	export let playerId = null;
	export let playerData = null;
	export let scoresStats = null;
	export let accBadges = null;
	export let skeleton = false;
	export let profileAppearance;
	export let editModel = null;
	export let overrideVisibleStats = null;

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

	function getIndex(array) {
		if (!array || array.length == 1) {
			return 0;
		} else {
			return array.length - Math.min($configStore.preferences.daysToCompare, array.length) - 1;
		}
	}

	$: history = $historyStore[playerId];
	$: prevPp = history?.pp ? history.pp[getIndex(history.pp)] : playerData?.playerInfo?.pp;
	$: prevLabel = getPrevLabel();
</script>

{#if scoresStats}
	<ContentBox cls="stats-and-summary-box">
		<div class="stats-and-summary">
			<div class="pp-and-platform">
				<div class="pp-container">
					<span class="pp">
						<Value
							value={playerData?.playerInfo?.pp}
							suffix="pp"
							prevValue={$configStore.profileParts.changes ? prevPp : undefined}
							{prevLabel}
							inline={true}
							zero="0pp" />
					</span>
				</div>
				<HeadsetAndPlatform {playerData} />
			</div>

			<BeatLeaderSummary {playerId} {scoresStats} {accBadges} {skeleton} {profileAppearance} bind:editModel />
		</div>
	</ContentBox>
{/if}

<style>
	.stats-and-summary {
		display: flex;
	}
	.pp {
		font-size: 1.4em !important;
		font-weight: 700 !important;
		color: #fddbff !important;
	}

	.pp-container {
		background-color: #332c36;
		padding: 0 0.5em 1em 0.5em;
		margin-bottom: -1em;
		border-radius: 8px;
		display: flex;
		justify-content: start;
		align-items: center;
		width: fit-content;
	}

	:global(.stats-and-summary-box) {
		padding: 0.5em !important;
		border-radius: 12px !important;
	}
</style>
