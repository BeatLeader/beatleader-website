<script>
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import ssrConfig from '../ssr-config';
	import createAccountStore from '../stores/beatleader/account';
	import followed from '../stores/beatleader/followed';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import PlayerNameWithFlag from '../components/Common/PlayerNameWithFlag.svelte';
	import Avatar from '../components/Common/Avatar.svelte';

	const account = createAccountStore();

	document.body.classList.add('slim');

	$: followedSorted = ($followed ?? []).sort((a, b) => a?.name.localeCompare(b?.name));
</script>

<svelte:head>
	<title>Followed - {ssrConfig.name}</title>
</svelte:head>

<article transition:fade>
	<ContentBox>
		<h1 class="title is-3">Followed</h1>

		{#if $account.loading}
			<p>Loading...</p>
		{:else if followedSorted?.length}
			<section class="grid">
				{#each followedSorted as f}
					<a href={`/u/${f.playerId}`} on:click|preventDefault={() => navigate(`/u/${f.playerId}`)}>
						<ContentBox>
							{#if f?.profileSettings?.profileCover}
								<div class="profile-background" style:background-image={`url(${f.profileSettings.profileCover})`} />
							{/if}

							<div class="avatar-cell">
								<Avatar player={f} />
							</div>
							<PlayerNameWithFlag player={f} disablePopover={true} />
						</ContentBox>
					</a>
				{/each}
			</section>
		{:else}
			<p>None followed, add someone.</p>
		{/if}
	</ContentBox>
</article>

<style>
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
	}

	.avatar-cell :global(.image) {
		width: 100%;
		height: 100%;
	}
</style>
