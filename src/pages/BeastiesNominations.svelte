<script>
	import {tick, onMount} from 'svelte';
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import createAccountStore from '../stores/beatleader/account';
	import ssrConfig from '../ssr-config';
	import Spinner from '../components/Common/Spinner.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {formatNumber} from '../utils/format';
	import {MetaTags} from 'svelte-meta-tags';
	import {BL_API_URL, CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import {configStore} from '../stores/config';
	import MapCard from '../components/Maps/List/MapCard.svelte';
	import {PRIORITY} from '../utils/queue';
	import AsideBox from '../components/Common/AsideBox.svelte';
	import {dateFromUnix} from '../utils/date';
	import { bestiesCategoriesNames } from '../utils/beatleader/format';

	document.body.classList.remove('slim');

	const account = createAccountStore();

	let isLoading = false;
	let allMaps = null;

	function fetchNominations() {
		isLoading = true;

		fetch(`${BL_API_URL}beasties/nominations/my`, {
			credentials: 'include',
		})
			.then(response => {
				if (response.status === 200) {
					return response.json();
				} else if (response.status === 404) {
                    isLoading = false;
                    return [];
                } else {
                    console.error('Error fetching nominations:', response.status);
                    return null;
                }
			})
			.then(songs => {
				allMaps = songs?.map((song, index) => {
						song.index = index;

						song.nominations = song.difficulties.reduce((nominations, diff) => {
							nominations.push(...(diff.nominations ?? []));
							return nominations;
						}, []);

                        song.nominations.sort((a, b) => b.timepost - a.timepost);
                        song.nominations = song.nominations.filter(
							(nom, idx, arr) => arr.findIndex(n => n.category === nom.category) === idx
						);

						return song;
					});
				isLoading = false;
			})
			.catch(error => {
				console.error('Error fetching nominations:', error);
				isLoading = false;
			});
	}

	onMount(() => {
		if ($account.id) {
			fetchNominations();
		}
	});

	$: if ($account.id && !allMaps) {
		fetchNominations();
	}

	const metaTitle = 'My Beasties Nominations';
	const metaDescription = 'View and manage your nominations for the Beasties awards';
</script>

<svelte:head>
	<title>{metaTitle} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		<div class="nominations-header">
			{#if allMaps?.length}
				<p class="nominations-count">
					You have nominated <strong>{allMaps.length}</strong> map{allMaps.length !== 1 ? 's' : ''}
				</p>
			{/if}
		</div>

		<div class="maps-box">
			{#if isLoading}
				<Spinner />
			{:else if !$account.id}
				<div class="no-maps-found">
					<p>Please sign in to view your nominations.</p>
					<a href="/signin">Sign In</a>
				</div>
			{:else if allMaps?.length}
				<div class="songs" class:long={$configStore.mapCards.wideCards}>
					{#each allMaps as song, idx (song.index)}
						<div class="map-with-nominations">
							<MapCard map={song} starsKey="stars" sortBy="timestamp" dateType="ranked" />

							{#if song.nominations && song.nominations.length > 0}
								<div class="nominations-info">
									<h4>Nominated Categories:</h4>
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
			{:else}
				<div class="no-maps-found">
					<p>You haven't nominated any maps yet.</p>
					<a href="/maps/all/1?mytype=played&sortBy=timestamp">Browse Maps</a>
                    <p style="margin-top: 0.8em; font-size: 0.9em;">Help your favorite mappers receive recognition they deserve for their hard work!</p>
				</div>
			{/if}
		</div>

        <div class="nominations-footer">
            <div class="nominations-footer-background">
                 <img src="/assets/beasties-background.webp" alt="Beasties awards background" />
            </div>
            <p><strong>The Beasties awards are a celebration of the best of the best of Beat Saber mapping across multiple categories. Maps that were released between December 1, 2024 and November 30, 2025 are eligible for this year's nominations.</strong></p>
            <div class="nominations-footer-links">
                <a href="https://bsaber.com/the-beastsaber-mapping-awards">Learn more about the Beasties awards</a>
            </div>
            <p>Each map displays the categories you've nominated it for and when you made the nomination.</p>
            <p>To nominate a map, click the "Nominate" button on the map page.</p>
            <img class="nominations-footer-instructions" src="/assets/beasties-awards-instructions.jpg" alt="Beasties awards instructions" />
            <br />
            <p><strong>What will happen next?</strong></p>
            <p>Nominations will be open until December 15, 2025. After that, the nominations will be closed and the finalist maps will be selected by a panel of judges and announced some time later for public voting.</p>
        </div>
	</article>
</section>

<MetaTags
	title={metaTitle}
	description={metaDescription}
	openGraph={{
		title: metaTitle,
		description: metaDescription,
		images: [{url: CURRENT_URL + '/assets/logo-small.png'}],
		siteName: ssrConfig.name + ' - Beasties Nominations',
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: metaTitle,
		description: metaDescription,
		image: CURRENT_URL + '/assets/logo-small.png',
		imageAlt: ssrConfig.name + "'s logo",
	}} />

<style>
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
		width: 100%;
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
    }

	.nominations-footer p {
		margin-bottom: 1em;
        text-align: center;
		color: var(--textColor);
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
        z-index: -1;
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
