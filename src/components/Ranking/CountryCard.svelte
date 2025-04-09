<script>
	import {onMount} from 'svelte';
	import DiscordInvite from '../Clans/DiscordInvite.svelte';
	import PlayerName from '../Scores/PlayerName.svelte';
	import createPlayerService from '../../services/beatleader/player';
	import {navigate} from 'svelte-routing';
	import ToolTip from '../Common/ToolTip.svelte';

	// export let country;

	let country = {
		name: 'United States of America',
		cover: 'https://wallpapercat.com/w/full/6/0/4/2137758-3840x2160-desktop-4k-american-flag-wallpaper.jpg',
		leader: '2538637699496776',
		discord: 'https://discord.gg/beatleader',
		rank: 1,
		players: 63000,
		pp: 253000,
		badges: [
			{
				id: 1179,
				description: 'World Cup 2020 Champions - Team USA!',
				image: 'https://cdn.assets.beatleader.com/BSWC-2020-1-300.png',
				link: 'https://www.youtube.com/watch?v=n_H_U8Su-Gc&list=PLwx5EB8PdMNeybwcATZiiT1eWju39ULl7',
				timeset: 1596338530,
				hidden: false,
			},
			{
				id: 1156,
				description: 'Champions of World Cup 2021!',
				image: 'https://cdn.assets.beatleader.com/BSWC_Badge_2021_1st-300.png',
				link: 'https://www.youtube.com/watch?v=5FtYnTdmvi4&list=PLwx5EB8PdMNfK2biESUQiDvOlFw0FhEDD',
				timeset: 1627701730,
				hidden: false,
			},
			{
				id: 1134,
				description: 'World Cup 2022 Champion Team!',
				image: 'https://cdn.assets.beatleader.com/BSWC_Badge_2022_H3_1_300.gif',
				link: 'https://www.twitch.tv/collections/KyE7buwp_ha5bw',
				timeset: 1656731976,
				hidden: false,
			},
			{
				id: 1358,
				description: 'World Cup 2024 Champions - Team USA!',
				image: 'https://cdn.assets.beatleader.com/BSWC-2024-1-300.gif',
				link: 'https://cube.community/tournaments/bswc-2024',
				timeset: 1724196246,
				hidden: false,
			},
		],
	};
	let countryLeader = null;

	async function fetchCountryLeader(country) {
		if (!country?.leader) return;
		const playerService = createPlayerService();
		countryLeader = await playerService.fetchPlayerOrGetFromCache(country.leader);
	}

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}`);
	}

	$: fetchCountryLeader(country);
</script>

<div class="country-card">
	<div
		class="background-cover"
		style="background: linear-gradient(rgb(26 26 26 / 65%), rgb(16 16 16 / 79%)), url({country.cover}) no-repeat center center; background-size: cover; height: 100%; width: 100%; position: absolute; top: 0; left: 0; z-index: 0;">
	</div>
	<div class="country-card-header">
		<h1 class="country-card-title">{country.name}</h1>
	</div>
	<div class="country-card-body">
		<div class="country-card-info">
			<div class="country-card-info-item">
				<span class="country-card-info-item-value">#{country.rank}</span>
				<span class="country-card-info-item-value">{country.pp} pp</span>
				<span class="country-card-info-item-value">{country.players} players</span>
			</div>
			<div class="country-card-info-item">
				<div class="player">
					Leader: <PlayerName player={countryLeader} on:click={() => navigateToPlayer(countryLeader.alias ?? countryLeader.playerId)} />
				</div>
				<DiscordInvite inviteLink={country.discord} introText="Join Country Discord Server" />
			</div>
		</div>
	</div>
	<div class="bl-badges">
		{#each country.badges as badge (badge.id)}
			<a class="badge-link" href={badge.link}>
				<ToolTip content={badge.description}>
					<img class="clickable" src={badge.image} alt={badge.description} />
				</ToolTip>
			</a>
		{/each}
	</div>
</div>

<style>
	.country-card {
		padding: 1em;
	}
	.background-cover {
		border-radius: 12px;
	}
	.country-card-header {
		position: relative;
		z-index: 1;
	}
	.country-card-title {
		font-size: 3em;
	}
	.country-card-body {
		position: relative;
	}
	.country-card-info {
		display: flex;
		justify-content: space-between;
	}
	.country-card-info-item {
		display: flex;
		flex-direction: column;
		align-items: start;
		justify-content: center;
		gap: 0.5em;
	}

	.bl-badges {
		display: flex;
		gap: 0.5em 0.5em;
		padding: 0.5em 0;
		justify-content: center;
		width: 100%;
		flex-wrap: wrap;
		background: inherit;
		border-radius: 0 0 12px 12px;
	}

	.bl-badges img {
		height: 41px;
	}

	.badge-link {
		display: contents;
		touch-action: none;
	}

	:global(.country-card-body #discordInvite) {
		padding: 0 !important;
	}

	@media (max-width: 768px) {
		.bl-badges {
			justify-content: center;
		}
	}
</style>
