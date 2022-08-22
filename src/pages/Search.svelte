<script>
	import {navigate} from 'svelte-routing';
	import {onDestroy} from 'svelte';
	import {fade} from 'svelte/transition';
	import createPlayerService from '../services/beatleader/player';
	import ssrConfig from '../ssr-config';
	import Avatar from '../components/Player/Avatar.svelte';
	import Error from '../components/Common/Error.svelte';
	import PlayerStats from '../components/Player/ProfileHeaderInfo.svelte';
	import Button from '../components/Common/Button.svelte';
	import Search from '../components/Player/Search.svelte';
	import Icons from '../components/Player/AvatarOverlayIcons.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';

	const DEFAULT_NAME = 'Search a profile';

	export let title = 'Find a player profile';
	export let changeTitle = false;
	export let focusField = true;

	document.body.classList.add('slim');

	let playerId = null;
	let name = DEFAULT_NAME;
	let player = null;
	let isLoading = false;
	let error = null;

	const playerService = createPlayerService();

	const setPlayerData = newPlayer => {
		if (newPlayer) {
			player = newPlayer;
			name = newPlayer.name;
		}
	};

	async function updatePlayer(playerId) {
		if (!playerId) return;

		try {
			isLoading = true;

			setPlayerData(await playerService.fetchPlayerOrGetFromCache(playerId));
		} catch (err) {
			error = err;
		} finally {
			isLoading = false;
		}
	}

	onDestroy(async () => {
		playerService.destroyService();
	});

	$: updatePlayer(playerId);
</script>

<svelte:head>
	{#if changeTitle}
		<title>Player search - {ssrConfig.name}</title>
	{/if}
</svelte:head>

<article transition:fade>
	<ContentBox>
		<div class="avatar">
			{#if playerId && !isLoading}
				<Icons {playerId} />
			{/if}
			<Avatar playerInfo={player ? player.playerInfo : null} {isLoading} centered={true} />
		</div>

		<div class="playerInfo">
			<PlayerStats {name} playerInfo={player ? player.playerInfo : null} skeleton={!name && isLoading} centered={true} />
		</div>

		{#if player}
			<Button iconFa="fas fa-user" label="Go to Player Profile" type="primary" on:click={() => navigate(`/u/${player.playerId}`)} />
			<div class="another-search">
				<a
					on:click={() => {
						name = DEFAULT_NAME;
						playerId = null;
						player = null;
					}}>
					Another search
				</a>
			</div>
		{:else if !!name}
			<h2 class="title is-4 has-text-centered">{name}</h2>
			<h3 class="title is-6 has-text-centered">{title}</h3>
			<Search {focusField} on:selected={event => (playerId = event.detail)} />
		{/if}

		{#if error}
			<div>
				<Error {error} />
			</div>
		{/if}
	</ContentBox>
</article>

<style>
	article {
		width: 100%;
		margin: 0 auto;
		text-align: center;
	}

	div.avatar {
		position: relative;
		padding: 0.75rem 0;
		text-align: center;
		height: 180px;
	}

	h1 {
		margin-bottom: 0.75rem !important;
	}

	h2 {
		margin-top: 0.75rem !important;
	}

	h3 {
		margin: 1rem 0 1.45rem 0;
	}

	.another-search {
		font-size: 0.875em;
	}

	button {
		cursor: pointer;
		min-width: 2rem;
		margin-right: 0.5rem;
	}

	.playerInfo :global(.player-ranking) {
		justify-content: center;
	}

	.playerInfo :global(.player-nickname) {
		justify-content: center;
	}
</style>
