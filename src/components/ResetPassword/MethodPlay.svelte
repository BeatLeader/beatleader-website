<script>
	import {createEventDispatcher, onDestroy} from 'svelte';
	import Button from '../Common/Button.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import SearchPicker from './SearchPicker.svelte';
	import {session, searchMaps, startChallenge, getSession, declareLoggedOut} from './api';

	const dispatch = createEventDispatcher();

	const MODIFIER_ICONS = {
		'No Bombs': 'NoBombsIcon',
		'No Walls': 'NoObstaclesIcon',
		'No Arrows': 'NoArrowsIcon',
		'Slower Song': 'SlowerSongIcon',
		'Small Notes': 'SmallNotesIcon',
		'Pro Mode': 'ProModeIcon',
	};

	let loggedIn = !!$session.challenge;
	let picking = false;
	let starting = null;
	let declaring = false;
	let error = null;

	const findMaps = async term =>
		(await searchMaps(term)).map(s => ({
			id: s.id,
			image: s.cover,
			title: s.subName ? `${s.name} ${s.subName}` : s.name,
			subtitle: `${s.author} · mapped by ${s.mapper}`,
		}));

	async function pick(song) {
		starting = song.id;
		error = null;
		try {
			await startChallenge(song.id);
			picking = false;
		} catch (e) {
			error = e.message;
		}
		starting = null;
	}

	async function notLoggedIn() {
		declaring = true;
		error = null;
		try {
			await declareLoggedOut();
			dispatch('next');
		} catch (e) {
			error = e.message;
		}
		declaring = false;
	}

	const poll = setInterval(() => {
		if (challenge && !document.hidden) getSession().catch(() => {});
	}, 4000);
	onDestroy(() => clearInterval(poll));

	$: challenge = $session.challenge;
</script>

{#if !loggedIn}
	<p>
		Is the BeatLeader mod logged in to this profile right now? It is if the mod shows your name and rank on top of the leaderboard to the
		right of the song selection list.
	</p>
	{#if !$session.playSuggested}
		<p class="hint">This profile hasn't played in a week, so the mod may well be logged out.</p>
	{/if}
	<div class="row">
		<Button type="primary" iconFa="fas fa-check" label="Yes, it's logged in" noMargin={true} on:click={() => (loggedIn = true)} />
		<Button iconFa="fas fa-xmark" label="No" loading={declaring} disabled={declaring} noMargin={true} on:click={notLoggedIn} />
	</div>
{:else if challenge && !picking}
	<div class="song">
		<img src={challenge.song.cover} alt="" />
		<span>
			<b>{challenge.song.name} {challenge.song.subName ?? ''}</b>
			<span class="hint">{challenge.song.author} · mapped by {challenge.song.mapper}</span>
		</span>
	</div>
	<ol class="steps">
		<li>Open this map in the game, any difficulty.</li>
		<li>
			Turn on these modifiers and no others, No Fail can stay on:
			<span class="row modifiers">
				{#each challenge.modifiers as modifier}
					<span class="modifier"><img src="/assets/{MODIFIER_ICONS[modifier]}.webp" alt="" />{modifier}</span>
				{/each}
			</span>
		</li>
		<li>Start it and cut a note, then pause and quit. You don't have to finish.</li>
	</ol>
	{#if challenge.otherModifiers}
		<p class="bad">
			We saw you play it with {challenge.otherModifiers == 'none' ? 'no modifiers' : challenge.otherModifiers}. Turn on exactly
			{challenge.modifiers.join(' and ')}, then play it again.
		</p>
	{/if}
	<p class="status">
		<Spinner /> Waiting for your play.
		{#if $session.challengesLeft}<button class="link" on:click={() => (picking = true)}>Pick another map</button>{/if}
	</p>
{:else if $session.challengesLeft}
	<p>Pick any map you have in the game, custom or OST.</p>
	<SearchPicker
		placeholder="Song name, author or mapper"
		search={findMaps}
		busy={starting}
		empty="No maps found, try another name."
		on:select={e => pick(e.detail)} />
{:else}
	<p>No more maps can be picked in this session.</p>
{/if}

{#if loggedIn}
	<p class="hint">
		The mod isn't logged in after all? <button class="link" disabled={declaring} on:click={notLoggedIn}>Tell us</button> and the other option
		opens.
	</p>
{/if}
{#if error}
	<p class="bad">{error}</p>
{/if}

<style>
	.song {
		display: flex;
		align-items: center;
		gap: 0.75em;
	}

	.song img {
		width: 3em;
		height: 3em;
		border-radius: 4px;
		object-fit: cover;
	}

	.song > span {
		display: flex;
		flex-direction: column;
	}

	.modifiers {
		margin: 0.4em 0;
	}

	.modifier {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		padding: 0.2em 0.6em 0.2em 0.3em;
		border-radius: 4px;
		background-color: var(--dimmed);
		font-weight: 600;
	}

	.modifier img {
		width: 1.5em;
		height: 1.5em;
	}
</style>
