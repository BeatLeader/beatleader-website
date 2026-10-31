<script>
	import Button from '../Common/Button.svelte';
	import ContentBox from '../Common/ContentBox.svelte';
	import TabSwitcher from '../Common/TabSwitcher.svelte';
	import {dateFromUnix, formatDate, formatDateRelative} from '../../utils/date';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {configStore} from '../../stores/config';
	import {currentTheme, withTheme} from '../../utils/theme';
	import {applyThemePreferences} from '../../utils/color';

	export let event;
	export let tab = 'ranking';

	const PC_MOD_URL = 'https://github.com/BeatLeader/beatleader-mod/releases/tag/v0.10.666';
	const QUEST_MOD_URL = 'https://github.com/BeatLeader/beatleader-qmod/releases/tag/v0.9.666';
	const DANCE_SITE_URL = BL_API_URL.replace('api', 'dnc');

	const tabs = [
		{value: 'ranking', label: 'Ranking', iconFa: 'fas fa-hashtag', color: '#b83f00', cls: 'dod-tab'},
		{value: 'faq', label: 'FAQ', iconFa: 'fas fa-circle-question', color: '#b83f00', cls: 'dod-tab'},
	];

	async function useHalloweenTheme() {
		const preferences = withTheme($configStore.preferences, 'halloween');
		await configStore.setForKey('preferences', preferences);
		applyThemePreferences(preferences);
	}

	$: endDate = event?.endDate ? dateFromUnix(event.endDate) : null;
	$: halloweenTheme = currentTheme($configStore?.preferences) === 'halloween';
	$: live = event && Date.now() / 1000 < event.endDate;
</script>

<svelte:head>
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Creepster&display=swap" />
</svelte:head>

<ContentBox cls="dod-hero">
	<div class="dod-sky" aria-hidden="true">
		<span class="dod-bat dod-bat-1" />
		<span class="dod-bat dod-bat-2" />
		<span class="dod-bat dod-bat-3" />
	</div>
	<img class="dod-web" src="/assets/halloween/web.webp" alt="" aria-hidden="true" />
	<div class="dod-spider" aria-hidden="true"><img src="/assets/halloween/spider.webp" alt="" /></div>

	<div class="dod-hero-content">
		<img class="dod-art" src="/assets/halloween/event-hero.webp" alt="Dance or Die!" />
		<div class="dod-intro">
			<p class="dod-tagline">Keep dancing or discover what is hiding in the dark!</p>
			<p>
				Turn on <b>Dance Mode</b> and play the event maps. This time scoring isn't accuracy or PP, it's how much you dance. Stop moving and your
				energy drains, the lights die, and something steps out of the dark.
			</p>
			<p>The <b class="dod-gold">top 10</b> dancers get an event badge on their profile.</p>
			{#if endDate}
				<p class="dod-deadline" title={formatDate(endDate)}>
					{#if live}
						The ghosts leave {formatDateRelative(endDate)}, on {formatDate(endDate)}.
					{:else}
						The ghosts left {formatDateRelative(endDate)}.
					{/if}
				</p>
			{/if}
			<div class="dod-buttons">
				<a href={PC_MOD_URL} target="_blank" rel="noreferrer">
					<Button iconFa="fas fa-download" label="PC mod 0.10.666" color="white" bgColor="#b83f00" />
				</a>
				<a href={QUEST_MOD_URL} target="_blank" rel="noreferrer">
					<Button iconFa="fas fa-download" label="Quest mod 0.9.666" color="white" bgColor="#b83f00" />
				</a>
				{#if event?.playlistId}
					<a href="/playlist/{event.playlistId}">
						<Button iconFa="fas fa-compact-disc" label="Get the maps" color="white" bgColor="#3a2e45" />
					</a>
				{/if}
				{#if !halloweenTheme}
					<Button iconFa="fas fa-ghost" label="Halloween theme" color="white" bgColor="#3a2e45" on:click={useHalloweenTheme} />
				{/if}
			</div>
		</div>
	</div>
</ContentBox>

<div class="dod-tabs">
	<TabSwitcher values={tabs} value={tabs.find(t => t.value === tab)} on:change={e => (tab = e.detail.value)} />
</div>

{#if tab === 'faq'}
	<div class="dod-faq">
		<ContentBox cls="dod-box">
			<h2 class="dod-question">How do I join?</h2>
			<ol class="dod-steps">
				<li>Install BeatLeader <b>0.10.666</b> on PC or <b>0.9.666</b> on Quest.</li>
				<li>
					Turn on <b>Dance Mode</b> in the Modifiers panel: the <b>Custom</b> tab on PC, at the end of the list on Quest. Your leaderboard switches to the Dance one by itself.
				</li>
				<li>Play the event maps on <b>Standard</b>. Any of them, as many times as you like.</li>
				<li>Keep moving to the music. Bounce, sway, lean into it. Standing still is how you die.</li>
			</ol>
		</ContentBox>

		<ContentBox cls="dod-box">
			<h2 class="dod-question">What can I win?</h2>
			<ul class="dod-rules">
				<li>The <b class="dod-gold">top 10</b> players of the event get a badge on their BeatLeader profile.</li>
				<li>
					If more than 10 players score <b class="dod-gold">100 points</b> on more than 5 maps, a <b>jury vote</b> decides the winners.
				</li>
			</ul>
		</ContentBox>

		<ContentBox cls="dod-box">
			<h2 class="dod-question">How is it scored?</h2>
			<ul class="dod-rules">
				<li>
					Each map gives up to <b class="dod-gold">100 points</b>: how your dancing ranks against hundreds of reference plays, from your
					bounce and beat lock to sway, tilt and steadiness.
				</li>
				<li>Your <b>best 5 maps</b> add up to your total, up to <b class="dod-gold">500</b>. More maps are more chances.</li>
				<li>
					<b class="dod-lilac">94.5</b> or more on a map is <span class="dod-lilac">dancing</span>. Ties go to more maps above that line,
					then to whoever reached their total first.
				</li>
			</ul>
		</ContentBox>

		<ContentBox cls="dod-box">
			<h2 class="dod-question">Which runs count?</h2>
			<ul class="dod-rules">
				<li>
					No negative modifiers (No Fail, No Walls, No Bombs, No Arrows, Slower Song, Small Notes), and no energy modifiers (1 Life, 4
					Lives).
				</li>
			</ul>
			<p class="dod-note">
				Every map's dance leaderboard is on <a href={DANCE_SITE_URL}>dnc.beatleader.com</a>.
			</p>
		</ContentBox>
	</div>
{/if}

<style>
	:global(.content-box.dod-hero) {
		position: relative;
		overflow: hidden;
		padding: 1.5em !important;
		background: radial-gradient(90% 80% at 25% 100%, rgba(255, 85, 0, 0.28), transparent 65%),
			radial-gradient(60% 70% at 100% 0%, rgba(115, 64, 153, 0.45), transparent 70%), #17121c !important;
	}

	.dod-hero-content {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		gap: 1.5em;
	}

	.dod-art {
		width: 22em;
		max-width: 45%;
		filter: drop-shadow(0 0 24px rgba(255, 138, 0, 0.35));
	}

	.dod-intro {
		display: flex;
		flex-direction: column;
		gap: 0.75em;
		color: #efe6d2;
	}

	.dod-tagline {
		font-family: 'Creepster', 'Noto Sans', cursive;
		font-size: 1.6em;
		line-height: 1.2;
		letter-spacing: 0.04em;
		color: #ff9a1f;
		text-shadow: 0 0 24px rgba(255, 138, 0, 0.55);
	}

	.dod-deadline {
		color: #c9a0ff;
		font-style: italic;
	}

	.dod-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25em;
	}

	.dod-web {
		position: absolute;
		top: -1.5em;
		left: -1.5em;
		width: 11em;
		opacity: 0.35;
		pointer-events: none;
		z-index: 1;
	}

	.dod-spider {
		position: absolute;
		top: 0;
		right: 3em;
		z-index: 3;
		display: flex;
		flex-direction: column;
		align-items: center;
		animation: dod-dangle 6s ease-in-out infinite;
		pointer-events: none;
	}

	.dod-spider::before {
		content: '';
		width: 1px;
		height: 4em;
		background: rgba(239, 230, 210, 0.35);
	}

	.dod-spider img {
		width: 2.2em;
	}

	@keyframes dod-dangle {
		0%,
		100% {
			transform: translateY(-1.5em);
		}
		50% {
			transform: translateY(0.5em);
		}
	}

	.dod-sky {
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
		overflow: hidden;
	}

	.dod-bat {
		position: absolute;
		left: -3em;
		width: 2.4em;
		height: 1.6em;
		background: url(/assets/halloween/bat-up.webp) center / contain no-repeat;
		animation:
			dod-flap 0.3s steps(1) infinite,
			dod-fly 16s linear infinite;
		opacity: 0.8;
	}

	.dod-bat-1 {
		top: 18%;
	}

	.dod-bat-2 {
		top: 42%;
		width: 1.6em;
		animation-delay:
			0.1s,
			-6s;
		animation-duration: 0.26s, 21s;
	}

	.dod-bat-3 {
		top: 8%;
		width: 1.2em;
		opacity: 0.55;
		animation-delay:
			0.05s,
			-13s;
		animation-duration: 0.22s, 26s;
	}

	@keyframes dod-flap {
		0% {
			background-image: url(/assets/halloween/bat-up.webp);
		}
		50% {
			background-image: url(/assets/halloween/bat-down.webp);
		}
	}

	@keyframes dod-fly {
		0% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(30vw, -1.5em);
		}
		50% {
			transform: translate(60vw, 1em);
		}
		75% {
			transform: translate(90vw, -1em);
		}
		100% {
			transform: translate(120vw, 0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dod-spider {
			animation: none;
		}

		.dod-bat {
			display: none;
		}
	}

	.dod-tabs {
		margin: 0 0.8em -0.5em;
	}

	:global(.dod-tab) {
		height: 3.5em;
		min-width: 7em;
		border-radius: 12px 12px 0 0 !important;
	}

	:global(.dod-tab span) {
		font-weight: 900;
	}

	.dod-faq {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}

	:global(.content-box.dod-box) {
		color: #efe6d2;
	}

	.dod-question {
		font-family: 'Creepster', 'Noto Sans', cursive;
		font-size: 1.5em;
		letter-spacing: 0.05em;
		color: #ff9a1f;
		text-shadow: 0 0 18px rgba(255, 138, 0, 0.45);
		margin-bottom: 0.5em;
	}

	.dod-steps {
		list-style: decimal;
		margin-left: 1.4em;
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.dod-steps li::marker {
		color: #ff7a1a;
		font-weight: 800;
	}

	.dod-rules {
		display: flex;
		flex-direction: column;
		gap: 0.6em;
	}

	.dod-rules li {
		padding-left: 1.2em;
		position: relative;
	}

	.dod-rules li::before {
		content: '🎃';
		position: absolute;
		left: 0;
		font-size: 0.8em;
		top: 0.15em;
	}

	.dod-gold {
		color: #ffd700;
	}

	.dod-lilac {
		color: #c9a0ff;
	}

	.dod-note {
		margin-top: 0.8em;
		font-size: 0.875em;
		color: #a99bb5;
	}

	@media screen and (max-width: 767px) {
		.dod-hero-content {
			flex-direction: column;
		}

		.dod-art {
			max-width: 100%;
			width: 18em;
		}

		.dod-faq {
			grid-template-columns: 1fr;
		}

		.dod-spider {
			right: 1em;
		}
	}
</style>
