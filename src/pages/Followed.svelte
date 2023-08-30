<script>
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import ssrConfig from '../ssr-config';
	import {PLAYERS_PER_PAGE} from '../utils/beatleader/consts';
	import followed from '../stores/beatleader/followed';
	import createAccountStore from '../stores/beatleader/account';
	import {opt} from '../utils/js';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import PlayerNameWithFlag from '../components/Common/PlayerNameWithFlag.svelte';
	import Avatar from '../components/Common/Avatar.svelte';
	import Value from '../components/Common/Value.svelte';
	import Spinner from '../components/Common/Spinner.svelte';

	document.body.classList.add('slim');
	document.body.scrollIntoView({behavior: 'smooth'});

	const account = createAccountStore();

	const sortOptions = [
		{key: 'name', label: 'Sort by Name', type: 'string'},
		{key: 'playerInfo.rank', label: 'Sort by Global Rank'},
		{key: 'playerInfo.countries.0.rank', label: 'Sort by Country Rank'},
	];
	let sortBy = sortOptions[0];

	let isUpdating = null;
	let starredFollowedIds = [];

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

	async function toggleStar(player) {
		if (isUpdating || !player?.playerId) return;

		try {
			isUpdating = player.playerId;

			let starredFriends = [];
			if (starredFollowedIds.includes(player.playerId)) starredFriends = starredFollowedIds.filter(id => id !== player.playerId);
			else starredFriends = [...starredFollowedIds, player.playerId];

			await account.update({starredFriends: starredFriends.join(',')});

			starredFollowedIds = starredFriends;
		} finally {
			isUpdating = null;
		}
	}

	$: $account?.player?.profileSettings?.starredFriends, (starredFollowedIds = $account?.player?.profileSettings?.starredFriends ?? []);
	$: followedSorted =
		(sortBy,
		($followed ?? [])
			.map(f => ({...f, starred: starredFollowedIds.includes(f?.playerId)}))
			.sort((a, b) => {
				let [first, second] = sortBy.reverse === true ? [b, a] : [a, b];

				if (a.starred !== b.starred) {
					return (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
				}

				return sortBy.type === 'string'
					? opt(first, sortBy.key, '').localeCompare(opt(second, sortBy.key, ''))
					: opt(first, sortBy.key, 0) - opt(second, sortBy.key, 0);
			}));
</script>

<svelte:head>
	<title>Followed - {ssrConfig.name}</title>
</svelte:head>

<article>
	<ContentBox>
		<h1 class="title is-3">
			<span>Followed</span>
			<select bind:value={sortBy}>
				{#each sortOptions as option}
					<option value={option}>{option.label}</option>
				{/each}
			</select>
		</h1>

		{#if $account.loading}
			<p>Loading...</p>
		{:else if followedSorted?.length}
			{#key sortBy.key}
				<section class="grid">
					{#each followedSorted as f, idx (f?.playerId)}
						<a
							href={`/u/${f.playerId}`}
							on:click|preventDefault={() => navigate(`/u/${f.playerId}`)}
							in:fade|global={{delay: idx * 20, duration: 200}}
							out:fade|global={{duration: 50}}>
							<ContentBox cls="friend-box">
								<div class="friend-container">
									<span
										class="star"
										class:starred={f.starred}
										class:is-updating={isUpdating === f?.playerId}
										title={isUpdating === f?.playerId
											? 'Please wait for the update to complete'
											: f.starred
											? 'Click to remove from starred'
											: 'Click to add starred'}
										on:click|preventDefault|stopPropagation={() => toggleStar(f)}>
										{#if isUpdating === f?.playerId}
											<Spinner />
										{:else}
											<i class="fa-star" class:fa-regular={!f.starred} class:fa-solid={f.starred} />
										{/if}
									</span>

									{#if f?.profileSettings?.profileCover}
										<div class="profile-background" style:background-image={`url(${f.profileSettings.profileCover})`} />
									{/if}

									<div class="avatar-cell">
										<Avatar player={f} overlaySuffix="preview" />
									</div>

									<div class="friend-details">
										<PlayerNameWithFlag player={f} disablePopover={true} hideFlag={true} />

										<section class="stats">
											<a
												style="flex: none"
												href={`/ranking/${Math.floor(((f?.playerInfo?.rank ?? 1) - 1) / PLAYERS_PER_PAGE) + 1}`}
												on:click|preventDefault={() => navigateToGlobalRanking(f?.playerInfo?.rank ?? 1)}
												title="Go to global ranking"
												class="clickable">
												<i class="fas fa-globe-americas" />

												<Value value={f?.playerInfo?.rank} prefix="#" digits={0} zero="#0" inline={true} reversePrevSign={true} />
											</a>

											{#each getPlayerCountries(f?.playerInfo) as country}
												<a
													style="flex: none"
													href={getCountryRankingUrl(country)}
													on:click|preventDefault={() => navigateToCountryRanking(country)}
													title="Go to country ranking"
													class="clickable">
													<img
														src={`/assets/flags/${
															country && country.country && country.country.toLowerCase ? country.country.toLowerCase() : ''
														}.png`}
														class="countryIcon"
														alt={country?.country} />

													<Value value={country.rank} prefix="#" digits={0} zero="#0" inline={true} reversePrevSign={true} />
												</a>
											{/each}

											<span class="pp">
												<Value value={f?.playerInfo?.pp} suffix="pp" inline={true} zero="0pp" />
											</span>
										</section>
									</div>
								</div>
							</ContentBox>
						</a>
					{/each}
				</section>
			{/key}
		{:else}
			<p>None followed, add someone.</p>
		{/if}
	</ContentBox>
</article>

<style>
	h1 {
		display: flex;
		justify-content: space-between;
	}

	select {
		font-size: 0.875rem;
	}

	:global(.mirror) select,
	:global(.mirror-low) select {
		border-radius: 0.4em;
		background-color: rgba(0, 0, 0, 0.2);
		padding-inline: 0.25em;
		border-color: var(--textColor);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(23rem, 1fr));
		gap: 1rem;
	}

	.grid :global(> *) {
		cursor: pointer;
		opacity: 0.75;
		transition: opacity 300ms;
	}

	.grid :global(> *:hover) {
		opacity: 1;
	}

	.grid :global(.content-box) {
		margin: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding-top: 1.5rem;
	}

	.star {
		position: absolute;
		top: 1rem;
		right: 1rem;
		transition: color, opacity 200ms;
		cursor: pointer !important;
	}

	.star.starred {
		color: yellow;
	}

	.star:hover:not(.is-updating),
	.star.starred:hover:not(.is-updating) {
		color: yellow;
		opacity: 0.6;
	}

	.profile-background {
		position: absolute;
		inset: 0;
		opacity: 0.2;
		background-size: cover;
		background-position: 50%;
		z-index: -1;
	}

	.avatar-cell {
		position: relative;
		width: 4.5rem;
		height: 4.5rem;
		margin-bottom: 0.5rem;
	}

	.avatar-cell :global(.image) {
		width: 100%;
		height: 100%;
	}

	.stats {
		display: flex;
		gap: 1rem;
	}

	.countryIcon {
		width: 1.2em;
	}

	.friend-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.friend-details {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	@media screen and (max-width: 600px) {
		.friend-container {
			flex-direction: row;
			width: 100%;
			margin-left: 2em;
		}

		.friend-details {
			margin-left: 2em;
			align-items: baseline;
			grid-gap: 0.5em;
		}

		:global(.friend-box) {
			padding: 0.3em !important;
		}
	}
</style>
