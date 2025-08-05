<script>
	import {fade} from 'svelte/transition';
	import {navigate} from 'svelte-routing';
	import ssrConfig from '../ssr-config';
	import {onMount, getContext} from 'svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';
	import {MetaTags} from 'svelte-meta-tags';
	import {CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import SimpleModal from '../components/Common/SimpleModal.svelte';
	import BadgeDetails from '../components/Badges/BadgeDetails.svelte';
	import {dateFromUnix, formatDateRelative} from '../utils/date';
	import TabSwitcher from '../components/Common/TabSwitcher.svelte';

	let badges = [];
	let isLoading = true;
	const modal = getContext('simple-modal');

	const tabOptions = [
		{value: 'events', label: 'Events', iconFa: 'fas fa-calendar-alt', url: '/events/1', cls: 'ranking-tab-button'},
		{value: 'badges', label: 'Badges', iconFa: 'fas fa-medal', url: '/badges', cls: 'ranking-tab-button'},
	];
	const currentTab = tabOptions[1];

	function onTabChanged(e) {
		if (e.detail.value === 'events') {
			navigate(`/events/1`);
		}
	}

	onMount(async () => {
		try {
			const response = await fetch(`${BL_API_URL}badges/all`);
			badges = await response.json();
		} catch (error) {
			console.error('Error fetching badges:', error);
		} finally {
			isLoading = false;
		}
	});

	const metaDescription = 'A list of all badges that were received on BeatLeader.';

	function showBadgeDetails(badge) {
		modal.open(BadgeDetails, {badge});
	}
</script>

<svelte:head>
	<title>Badges - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		<div class="ranking-switcher">
			<TabSwitcher values={tabOptions} value={currentTab} on:change={onTabChanged} class="ranking" />
		</div>
		<ContentBox>
			{#if !isLoading}
				<div class="badges-list">
					{#each badges as badge (badge.image)}
						<div class="badge-item" on:click={() => showBadgeDetails(badge)}>
							<img src={badge.image} loading="lazy" alt={badge.description} class="badge-image" />

							<div class="badge-info">
								<p class="badge-description">{badge.description}</p>
								<div class="badge-player-time">
									{#if badge.players.length === 1}
										<div class="badge-player">
											<img loading="lazy" src={badge.players[0].avatar} alt={badge.players[0].name} class="player-avatar" />
											<span>{badge.players[0].name}</span>
										</div>
									{:else}
										<div class="badge-player badge-player-count">
											<div class="overlapping-avatars {badge.players.length > 5 ? 'more-avatars' : ''}">
												{#each badge.players.slice(0, 5) as player}
													<img loading="lazy" src={player.avatar} alt={player.name} class="player-avatar overlapping-avatar" />
												{/each}
											</div>
											<span>{badge.players.length} players</span>
										</div>
									{/if}
									<span class="timestamp">{formatDateRelative(dateFromUnix(badge.timeset))} </span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<Spinner />
			{/if}
		</ContentBox>
	</article>
</section>

<MetaTags
	title="Beat Saber Badges"
	description={metaDescription}
	openGraph={{
		title: 'Beat Saber Badges',
		description: metaDescription,
		images: [{url: CURRENT_URL + '/assets/logo-small.png'}],
		siteName: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title: 'Beat Saber Badges',
		description: metaDescription,
		image: CURRENT_URL + '/assets/logo-small.png',
		imageAlt: ssrConfig.name + "'s logo",
	}} />

<style>
	.align-content {
		display: flex;
		justify-content: center;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
		overflow: hidden;
	}

	.badges-list {
		display: grid;
		gap: 1rem;
	}

	.badge-item {
		display: flex;
		align-items: center;
		background-color: var(--foreground);
		padding: 1rem;
		border-radius: 8px;
		cursor: pointer;
	}

	.badge-image {
		height: 64px;
		margin-right: 1rem;
		margin-bottom: -0.4em;
	}

	.badge-info {
		display: grid;
		flex: 1;
		gap: 0.2em;
	}

	.badge-description {
		margin-bottom: 0.5rem;
	}

	.badge-player-time {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.badge-player {
		display: flex;
		align-items: center;
	}

	.badge-player-count {
		font-style: italic;
	}

	.player-avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		margin-right: 0.5rem;
	}

	.overlapping-avatar {
		margin-right: 0;
		margin-left: -0.5em;
	}

	.overlapping-avatars {
		padding-left: 0.5em;
		margin-right: 0.5rem;
	}

	.more-avatars {
		mask-image: linear-gradient(90deg, white 0px, white 34px, transparent 100%);
		margin-right: 0;
	}

	.timestamp {
		color: var(--faded);
	}

	.ranking-switcher {
		margin-left: 0.8em;
		margin-top: 0.5em;
	}

	@media screen and (max-width: 767px) {
		.badge-item {
			flex-direction: column;
			gap: 0.5em;
		}

		.badge-image {
			margin-right: unset;
			margin-bottom: unset;
		}

		.badge-description {
			text-align: center;
		}
	}
</style>
