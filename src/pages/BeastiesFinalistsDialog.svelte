<script>
	import DialogContent from '../components/Common/DialogContent.svelte';
	import {Confetti} from 'svelte-confetti';
    import {configStore} from '../stores/config';
	import MapCard from '../components/Maps/List/MapCard.svelte';
	import {dateFromUnix} from '../utils/date';
	import {bestiesCategoriesNames} from '../utils/beatleader/format';
	export let allMaps;
	export let confirm;
	export let cancel;

	let animationPlayer = null;

	let achievementDescription;

	function fetchAchievementDescription(achievement) {
		if (achievement?.levelId == 15) {
			achievementDescription = 'passing all the maps in the event';
		} else if (achievement?.levelId == 16) {
			achievementDescription = 'passing all maps in the event on Expert+ difficulty';
		} else if (achievement?.levelId == 17) {
			achievementDescription = 'passing all maps in the event on Expert+ difficulty with at least 80% accuracy';
		}
	}
</script>

<div class="dialog-container">
    <div class="confetti">
        <Confetti
            colorArray={['url(/assets/gold-glitter-1.png)', 'url(/assets/gold-glitter-2.png)', 'url(/assets/gold-glitter-3.png)']}
            x={[-5, 5]}
            y={[0, 0.1]}
            delay={[500, 2000]}
            size="20"
            infinite
            duration="10000"
            amount="200"
            fallDistance="150vh" />
    </div>
	<DialogContent title="Beasties nominations results" okButton="Done" okButtonType="green" on:confirm={confirm} on:cancel={cancel}>
		<div slot="content">
			<div class="top-container">
				<div class="nominations-header">
					<p class="nominations-count">
						Congratulations! <strong>{allMaps.length}</strong> map{allMaps.length !== 1 ? 's' : ''} you nominated have been selected as finalist{allMaps.length !== 1 ? 's' : ''}!
					</p>
				</div>
				<div class="maps-box">
					<div class="songs" class:long={$configStore.mapCards.wideCards}>
						{#each allMaps as song, idx (song.index)}
							<div class="map-with-nominations">
								<MapCard map={song} starsKey="stars" sortBy="timestamp" dateType="ranked" />

								{#if song.nominations && song.nominations.length > 0}
									<div class="nominations-info">
										<h4>Finalist Categorie{song.nominations.length !== 1 ? 's' : ''}:</h4>
										<div class="categories-list">
											{#each song.nominations as nomination}
												<div class="nomination-item">
													<span class="category-badge">{bestiesCategoriesNames[nomination.category] ?? nomination.category}</span>
													<span class="nomination-date">
														{dateFromUnix(nomination.timepost).toLocaleDateString()}
													</span>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<div class="nominations-footer">
					<div class="nominations-footer-background">
						<img src="/assets/beasties-background.webp" alt="Beasties awards background" />
					</div>
					<p><strong>Beasties voting is now open! (until January 15th)</strong></p>
					<div class="nominations-footer-links">
						<a href="https://mappingawards.saeraphinx.dev/finalists">Vote for your favorite maps</a>
					</div>
				</div>
			</div>
		</div>
	</DialogContent>
</div>

<style>
	.dialog-container {
		margin: 1em;
	}
	:global(.wrap .window) {
		width: auto !important;
		height: auto !important;
	}

	.top-container {
		width: 70vw;
		height: 60vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2em;
		overflow: hidden;
	}

	.details-and-confetti {
		position: relative;
		display: flex;
		z-index: 1;
	}
	.confetti-container {
		position: absolute;
		display: flex;
		justify-content: space-between;
		align-items: center;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
		pointer-events: none;
	}

	.align-content {
		display: flex;
		justify-content: center !important;
	}

	.page-content {
		width: 100%;
		max-width: 50em;
		margin: 0 auto;
		overscroll-behavior: none;
		-ms-overflow-style: none;
		scrollbar-width: none;
		padding: 0 1em;
	}

	.nominations-header {
		text-align: center;
		padding: 2em 0 1em 0;
	}

	.nominations-count {
		font-size: 1.2em;
		color: var(--textColor);
	}

	.nominations-count strong {
		color: var(--beatleader-primary);
	}

	.maps-box {
		display: flex;
		justify-content: center;
		overflow: visible;
		margin-bottom: 2em;
	}

	.songs {
		display: flex;
		flex-direction: column;
		gap: 1.5em;
		width: 100%;
		max-width: 50em;
	}

	.songs.long {
		max-width: 50em;
	}

	.map-with-nominations {
		display: flex;
		flex-direction: column;
		min-width: 40vw;
	}

	:global(.map-with-nominations .map-card-wrapper) {
		width: 100% !important;
		max-width: 100%;
	}

	.nominations-info {
		background-color: var(--foreground);
		padding: 1em;
		border-radius: 8px;
		margin-top: -2em;
		padding-top: 2em;
	}

	.nominations-info h4 {
		margin: 0 0 0.5em 0;
		color: var(--beatleader-primary);
		font-size: 0.9em;
	}

	.categories-list {
		display: flex;
		flex-direction: column;
		gap: 0.4em;
	}

	.nomination-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.4em 0.6em;
		background-color: var(--background);
		border-radius: 4px;
	}

	.category-badge {
		font-weight: 600;
		color: var(--beatleader-primary);
	}

	.nomination-date {
		font-size: 0.85em;
		color: var(--faded);
	}

	.no-maps-found {
		width: 100%;
		text-align: center;
		padding: 4em 0;
	}

	.no-maps-found p {
		font-size: 1.2em;
		margin-bottom: 1em;
	}

	.no-maps-found a {
		display: inline-block;
		padding: 0.8em 1.5em;
		background-color: var(--beatleader-primary);
		color: white;
		text-decoration: none;
		border-radius: 8px;
		font-weight: 600;
		transition: opacity 0.2s;
	}

	.no-maps-found a:hover {
		opacity: 0.8;
	}

	.nominations-footer {
		border-radius: 12px;
		padding: 2em;
		margin: 2em 0 3em 0;
		line-height: 1.6;
		overflow: hidden;
		position: relative;
	}

	.nominations-footer-links {
		display: flex;
		justify-content: center;
		gap: 1em;
        z-index: 2;
        position: relative;
	}

	.nominations-footer p {
		margin-bottom: 1em;
		text-align: center;
		color: var(--textColor);
        z-index: 2;
        position: relative;
	}

	.nominations-footer a {
		display: inline-block;
		padding: 0.6em 1.2em;
		background-color: var(--beatleader-primary);
		color: white;
		text-decoration: none;
		border-radius: 6px;
		font-weight: 600;
		margin-bottom: 1.5em;
		transition: opacity 0.2s;
	}

	.nominations-footer a:hover {
		opacity: 0.8;
	}

	.nominations-footer-instructions {
		width: 100%;
		max-width: 600px;
		height: auto;
		border-radius: 8px;
		margin-top: 1em;
		display: block;
		margin-left: auto;
		margin-right: auto;
	}

	.nominations-footer-background {
		width: 100%;
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		z-index: 1;
		filter: blur(6px) brightness(0.6);
	}

	.nominations-footer-background img {
		width: 100%;
		height: auto;
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
	}

    .confetti {
		position: fixed;
		top: -50px;
		left: 0;
		height: 100vh;
		width: 100vw;
		display: flex;
		justify-content: center;
		overflow: hidden;
		pointer-events: none;
	}

	@media screen and (max-width: 767px) {
		.page-content {
			padding: 0 0.5em;
		}

		.songs {
			gap: 1em;
		}

		.nominations-header {
			padding: 1em 0;
		}

		.nominations-count {
			font-size: 1em;
		}

		.maps-box {
			width: 100%;
		}

		.nominations-info {
			padding: 0.75em;
		}

		.nominations-footer {
			padding: 1.5em;
			margin: 1.5em 0 2em 0;
		}

		.nominations-footer img {
			max-width: 100%;
		}
	}
</style>
