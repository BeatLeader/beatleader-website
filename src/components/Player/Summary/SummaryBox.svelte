<script>
	import ContentBox from '../../Common/ContentBox.svelte';
	import BeatLeaderSummary from './BeatLeaderSummary.svelte';
	import HeadsetAndPlatform from './HeadsetAndPlatform.svelte';

	import createStatsHistoryStore from '../../../stores/beatleader/stats-history';
	import {configStore} from '../../../stores/config';
	import Value from '../../Common/Value.svelte';
	import BlBadges from '../Bio/BlBadges.svelte';

	const historyStore = createStatsHistoryStore();

	export let playerId = null;
	export let playerData = null;
	export let scoresStats = null;
	export let accBadges = null;
	export let skeleton = false;
	export let profileAppearance;
	export let editModel = null;
	export let overrideVisibleStats = null;
	export let ssBadges = null;

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
		<div class="stats-and-summary" class:edit-enabled={!!editModel}>
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
		<div class="badges-footer">
			<BlBadges badges={ssBadges} />
		</div>
	</ContentBox>
{/if}

<style>
	.badges-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-left: -0.5em;
		margin-right: -0.5em;
		margin-bottom: -0.5em;
		background-color: #0000004f;
		margin-top: 0.5em;
		border-radius: 0 0 12px 12px;
	}

	.stats-and-summary {
		display: flex;
		gap: 0.5em 0.5em;
	}
	.pp {
		font-size: 1.4em !important;
		font-weight: 700 !important;
		color: var(--ppColour) !important;
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

	.pp-and-platform {
		flex: 0;
	}

	:global(.stats-and-summary-box) {
		padding: 0.5em !important;
		border-radius: 12px !important;
	}

	@media screen and (max-width: 600px) {
		.stats-and-summary {
			flex-wrap: wrap;
		}

		:global(.player-data) {
			max-width: 100% !important;
		}
	}

	@media screen and (max-width: 767px) {
		:global(.stats-and-summary-box) {
			border-radius: 0 !important;
		}
	}
</style>
