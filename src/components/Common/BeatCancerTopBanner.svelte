<script>
	import {produce} from 'immer';
	import {configStore} from '../../stores/config';
	import {fetchJson} from '../../network/fetch';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';

	let ongoing = null;

	const tournamentName = 'Beat Cancer';

	// Initialize beatcancer if it doesn't exist
	$configStore.preferences.beatcancer ??= [];

	function getOngoing() {
		fetchJson(`${BL_API_URL}beatcancer/ongoing`).then(response => {
			if (response.body?.live) {
				ongoing = response.body;
			} else {
				ongoing = null;
			}
		});
	}

	$: getOngoing();
</script>

{#if ongoing && !$configStore.preferences?.beatcancer.some(el => el === ongoing.eventId) && !$configStore.preferences?.beatcancer.some(el => el === 'all')}
	<div class="tournament-banner">
		<button
			class="close-all-future"
			title="Hide all Beat Cancer activity alerts"
			on:click|preventDefault|stopPropagation={() => {
				$configStore = produce($configStore, draft => {
					draft.preferences.beatcancer.push('all');
				});
			}}><i class="fas fa-xmark" /> Hide All</button>

		<div class="banner-center-text">
			<img class="beatcancer-logo" src="/assets/beat-cancer.svg" alt="" />
			<a class="center-content-in-a" href="https://www.twitch.tv/cubecommunity?utm_source=BeatLeader">
				<span class="replayed-link-text-desktop">{tournamentName}: {ongoing.currRound} is Live! 🔴</span>
				<span class="replayed-link-text-mobile">{tournamentName}: {ongoing.currRound} is Live! 🔴</span>
			</a>
		</div>

		<button
			class="close-banner"
			title="Dismiss this activity alert"
			on:click|preventDefault|stopPropagation={() => {
				$configStore = produce($configStore, draft => {
					draft.preferences.beatcancer.push(ongoing.eventId);
				});
			}}><i class="fas fa-xmark" /></button>
	</div>
{/if}

<style>
	.tournament-banner {
		background-color: #761cbe;
		color: white;
		font-size: large;
		height: 3em;
		width: 100%;
		display: flex;
		justify-content: space-between;
		justify-items: center;
		align-items: center;
		margin-bottom: -0.1em;

		overflow: visible;
		pointer-events: none;
	}

	.beatcancer-logo {
		height: 80%;
	}

	.close-banner {
		border: none;
		color: white;
		background-color: transparent;
		cursor: pointer;
		width: 3em;
		z-index: 104;
		pointer-events: auto;
	}

	.close-all-future {
		margin-left: 0.25em;
		border: none;
		color: white;
		background-color: transparent;
		cursor: pointer;
		pointer-events: auto;
		color: rgba(255, 255, 255, 0.75);
	}

	.banner-center-text {
		display: flex;
		gap: 0.3em;
		justify-content: center;
		cursor: pointer;
		height: 100%;
		align-items: center;
	}

	.replayed-link-text-desktop {
		z-index: 101;
		font-weight: 800;
		color: rgba(255, 255, 255, 0.95);
	}

	.replayed-link-text-mobile {
		font-size: 0.8em;
		display: none;
		z-index: 101;
		font-weight: 800;
		color: rgba(255, 255, 255, 0.95);
	}

	.center-content-in-a {
		display: flex;
		flex-direction: column;
		align-items: center;
		pointer-events: auto;
	}

	@media (max-width: 1000px) {
		.banner-center-text {
			flex-direction: column;
			align-items: center;
			gap: 0;
		}

		.bswc-logo {
			display: none;
		}

		.close-all-future {
			font-size: 0.5em;
		}

		.replayed-link-text-desktop {
			display: none;
		}

		.replayed-link-text-mobile {
			display: flex;
		}
	}
</style>
