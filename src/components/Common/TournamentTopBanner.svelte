<script>
	import {produce} from 'immer';
	import {configStore} from '../../stores/config';
	import {fetchJson} from '../../network/fetch';

	let ongoing = null;
	
	const tournamentId = 'bswc-2024'
	const tournamentName = "BSWC 2024"

	// Initialize bswc2024 if it doesn't exist
	$configStore.preferences.bswc2024 ??= [];
	
	function getOngoing() {
		fetchJson(`https://api.cube.community/rest/bracket/ongoing?tournamentId=${tournamentId}`)
			.then(response => {
				if (response.body?.live || true) {
					ongoing = response.body;
					ongoing = {
						matchId: "testing2",
						live: true,
						team1: "test 1",
						team2: "test 2",
						currRound: "round of testing"
					}
				}
				else {
					ongoing = null;
				}
			})
	}
	
	console.log($configStore.preferences);
	
	$: getOngoing();
</script>

{#if ongoing && !$configStore.preferences?.bswc2024.some(el => el === ongoing.matchId) && !$configStore.preferences?.bswc2024.some(el => el === "all")}
<div class="tournament-banner">
	
	<button
		class="close-all-future"
		title="Hide all BSWC banners"
		on:click|preventDefault|stopPropagation={() => {
				$configStore = produce($configStore, draft => {
					draft.preferences.bswc2024.push("all");
				});
			}}><i class="fas fa-xmark" /> Hide All</button>
	
		<div class="banner-center-text">
			<img class="bswc-logo" src="/assets/bswc-2024-logo.svg" alt="" />
			<a class="center-content-in-a" href="https://www.twitch.tv/cubecommunity">
				<span class="replayed-link-text-desktop">{tournamentName} {ongoing.currRound} - {ongoing.team1} vs. {ongoing.team2} is Live! 🔴</span>
				<span class="replayed-link-text-mobile">{tournamentName} {ongoing.currRound}</span>
				<span class="replayed-link-text-mobile">{ongoing.team1} vs. {ongoing.team2} is Live! 🔴</span>
			</a>
		</div>
	

	<button
		class="close-banner"
		title="Dismiss this match alert"
		on:click|preventDefault|stopPropagation={() => {
				$configStore = produce($configStore, draft => {
					draft.preferences.bswc2024.push(ongoing.matchId);
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
	
	.bswc-logo {
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
		margin-right: 0.8em;
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
			font-size: 0.7em;
		}

		.replayed-link-text-desktop {
			display: none;
		}
		
		.replayed-link-text-mobile {
			display: flex;
		}
	}

	
</style>