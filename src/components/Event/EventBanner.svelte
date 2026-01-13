<script>
	import {navigate} from 'svelte-routing';
	import {onMount} from 'svelte';
	import Button from '../Common/Button.svelte';
	import ContentBox from '../Common/ContentBox.svelte';

	let cinematicsCanvas;
	export let wideScreen = false;

	// All available character images, grouped by character name
	const charactersByName = {
		// Nijigasaki
		'ayumu': ['ayumu.webp', 'figure-01-ayumu-casual.webp', 'figure-01-ayumu-idol.webp', 'figure-01-ayumu-school.webp', '03_01_Ayumu_Uehara.webp'],
		'kasumi': ['figure-02-kasumi-casual.webp', 'figure-02-kasumi-idol.webp', 'figure-02-kasumi-school.webp', '01-23_Kazumi_Nakasu.webp'],
		'shizuku': ['shizuku.webp', 'figure-03-shizuku-casual.webp', 'figure-03-shizuku-idol.webp', 'figure-03-shizuku-school.webp', '04-03_Shizuku_Osaka.webp'],
		'karin': ['karin.webp', 'figure-04-karin-casual.webp', 'figure-04-karin-idol.webp', 'figure-04-karin-school.webp', '06-29_Karin_Asaka.webp'],
		'ai': ['ai.webp', 'figure-05-ai-casual.webp', 'figure-05-ai-idol.webp', 'figure-05-ai-school.webp', '05-30_Ai_Miyashita.webp'],
		'kanata': ['kanata.webp', 'figure-06-kanata-casual.webp', 'figure-06-kanata-idol.webp', 'figure-06-kanata-school.webp', '12-16_Kanata_Konoe.webp'],
		'setsuna': ['1setsuna.webp', 'setsuna.webp', 'figure-07-setsuna-casual.webp', 'figure-07-setsuna-idol.webp', 'figure-07-setsuna-school.webp', '08-08_Setsuna_Yuki.webp'],
		'emma': ['figure-08-emma-casual.webp', 'figure-08-emma-idol.webp', 'figure-08-emma-school.webp', '02_05_Emma_Verde.webp'],
		'rina': ['rina.webp', 'figure-09-rina-idol.webp', 'figure-09-rina-school.webp', '11-13_Rina_Tennoji.webp'],
		'shioriko': ['10-05_Shioriko_Mifune.webp'],
		'lanzhu': ['02-15_Lanzhu_Zhong.webp'],
		'mia': ['12-02_Mia_Taylor.webp'],

		// Aqours
		'chika': ['chika.webp', '08-01_Chika_Takami.webp'],
		'riko': ['riko.webp', '09-19_Riko_Sakurauchi.webp'],
		'kanan': ['kanan.webp', '02-10_Kanan_Matsuura.webp'],
		'dia': ['dia.webp', '01-01_Dia_Kurosawa.webp'],
		'you': ['04-17_You_Watanabe.webp'],
		'yoshiko': ['yoshiko.webp', '07-13_Yoshiko_Tsushima.webp'],
		'hanamaru': ['hanamaru.webp', '03-04_Hanamaru_Kunikida.webp'],
		'mari': ['mari.webp', '06-13_Mari_Ohara.webp'],
		'ruby': ['ruby.webp', '09-21_Ruby_Kurosawa.webp'],
		'sarah': ['05-04_Sarah_Kazuno.webp'],
		'leah': ['12-12_Leah_Kazuno.webp'],

		// μ's
		'honoka': ['honoka.webp', '08-03_Honoka_Kosaka.webp'],
		'eli': ['eli.webp', '10-21_Eli_Ayase.webp'],
		'kotori': ['kotori.webp', '09-12_Kotori_Minami.webp'],
		'umi': ['umi.webp', '03-15_Umi_Sonoda.webp'],
		'rin': ['rin.webp', '11-01_Rin_Hozhizora.webp'],
		'maki': ['maki.webp', '04-19_Maki_Nishikino.webp'],
		'nozomi': ['nozomi.webp', '06-09_Nozomi_Tojo.webp'],
		'hanayo': ['hanayo.webp', '01-17_Hanayo_Koizumi.webp'],
		'nico': ['nico.webp', '07-22_Nico_Yazawa.webp'],

		// Liella!
		'kanon': ['05-01_Kanon_Shibuya.webp'],
		'keke': ['07-17_Keke_Tang.webp'],
		'chisato': ['02-25_Chisato_Arashi.webp'],
		'sumire': ['09-28_Sumire_Heanna.webp'],
		'ren': ['11-24_Ren_Hazuki.webp'],
		'kinako': ['04-10_Kinako_Sakurakoji.webp'],
		'mei': ['10-29_Mei_Yoneme.webp'],
		'shiki': ['06-17_Shiki_Wakana.webp'],
		'natsumi': ['08-07_Natsumi_Onitsuka.webp'],
		'wien': ['01-20_Wien_Margarete.webp'],
		'tomari': ['12-28_Tomari_Onitsuka.webp'],

		// Hasunosora
		'kaho': ['05-22_Kaho_Hinoshita.webp'],
		'sayaka': ['01-13_Sayaka_Murano.webp'],
		'kozue': ['06-15_Kozue_Otomune.webp'],
		'tsuzuri': ['11-17_Tsuzuri_Yugiri.webp'],
		'rurino': ['08-31_Rurino_Osawa.webp'],
		'megumi': ['12-20_Megumi_Fujishima.webp'],
		'ginko': ['10-20_Ginko_Momose.webp'],
		'hime': ['09-24_Hime_Anyoji.webp'],
		'kosuzu': ['02_28_Kozuzu_Kachimachi.webp'],

		// A-RISE
		'anju': ['A-RISE-1_Anju_Yuki.webp'],
		'tsubasa': ['A-RISE-2_Tsubasa_Kira.webp'],
		'erena': ['A-RISE-3_Erena_Todo.webp'],

		// Sunny Passion
		'mao': ['Sunny_Passion_Mao_Hiiragi.webp'],
		'yuna': ['Sunny_Passion_Yuna_Hijirisawa.webp']
	};

	// Randomly selected characters for this load
	let selectedCharacters = [];

	function shuffleArray(array) {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	function pickRandomVariant(variants) {
		return variants[Math.floor(Math.random() * variants.length)];
	}

	onMount(() => {
		// Get all character names and shuffle them
		const characterNames = shuffleArray(Object.keys(charactersByName));
		// Pick 4 unique characters, then select a random variant for each
		selectedCharacters = characterNames.slice(0, 4).map(name => pickRandomVariant(charactersByName[name]));
		
	});

	function drawCinematics(cinematicsCanvas, coverUrl) {
		if (coverUrl && cinematicsCanvas) {
			cinematicsCanvas.style.opacity = 1;
			const context = cinematicsCanvas.getContext('2d');

			const cover = new Image();
			cover.onload = function () {
				context.drawImage(cover, 0, 0, cinematicsCanvas.width, cinematicsCanvas.height);
			};
			cover.src = coverUrl;
		}
	}

	$: cinematicsCanvas && drawCinematics(cinematicsCanvas, '/assets/lovelive_bg.webp');
</script>

<ContentBox cls="event-banner" on:click={() => navigate('/event/lovelive')}>
	<div class="cinematics">
		<div class="cinematics-canvas">
			<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
		</div>
	</div>

	<div class="event-container">
		{#await import('atropos/svelte').then(m => m.default)}
			<div class="loading-container">
				<div class="cover-bg" />
				{#if selectedCharacters.length === 4}
					<div class="cover-girl cover-girl1" style="background-image: url(/assets/love_live_portraits/{selectedCharacters[0]})" />
					<div class="cover-girl cover-girl2" style="background-image: url(/assets/love_live_portraits/{selectedCharacters[1]})" />
						<div class="cover-logo" />
					<div class="cover-girl cover-girl3" style="background-image: url(/assets/love_live_portraits/{selectedCharacters[2]})" />
					<div class="cover-girl cover-girl4" style="background-image: url(/assets/love_live_portraits/{selectedCharacters[3]})" />
				{/if}
			</div>
		{:then Atropos}
			<svelte:component this={Atropos} rotateXMax={1} rotateYMax={1} highlight="false" shadow="false" rotateTouch="scroll-y">
				<div class="cover-bg {wideScreen ? 'wide-screen' : ''}" data-atropos-offset="0" />
				{#if selectedCharacters.length === 4}
					<div 
						class="cover-girl cover-girl1 {wideScreen ? 'wide-screen' : ''}" 
						style="background-image: url(/assets/love_live_portraits/{selectedCharacters[0]})"
						data-atropos-offset="-2" 
					/>
					<div 
						class="cover-girl cover-girl2 {wideScreen ? 'wide-screen' : ''}" 
						style="background-image: url(/assets/love_live_portraits/{selectedCharacters[1]})"
						data-atropos-offset="-1" 
					/>
					<div class="cover-logo {wideScreen ? 'wide-screen' : ''}" data-atropos-offset="1" />
					<div 
						class="cover-girl cover-girl3 {wideScreen ? 'wide-screen' : ''}" 
						style="background-image: url(/assets/love_live_portraits/{selectedCharacters[2]})"
						data-atropos-offset="2" 
					/>
					<div 
						class="cover-girl cover-girl4 {wideScreen ? 'wide-screen' : ''}" 
						style="background-image: url(/assets/love_live_portraits/{selectedCharacters[3]})"
						data-atropos-offset="3" 
					/>
				{/if}
			</svelte:component>
		{/await}

		<div class="event-text-and-button">
			<div class="event-text-container">
				<span class="event-title"></span>
			</div>
			<div>
				<Button label="EVENT" cls="event-cover-btn" iconFa="fas fa-cake-candles" on:click={() => navigate('/event/lovelive')} />
			</div>
		</div>
	</div>
</ContentBox>

<style>
	:global(.content-box.event-banner) {
		display: flex;
		align-items: center;
		grid-gap: 1em;
		justify-content: center;
		margin: 0.6em;
		padding: 0 !important;
		border-radius: 0.5em;
		cursor: pointer;
	}

	.event-container {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: end;
		position: relative;
		height: 12em;
		align-items: center;
		overflow: hidden;
		border-radius: 0.5em;
		flex-direction: column;
	}

	.loading-container {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	:global(.content-box.event-banner .atropos) {
		width: 100%;
		position: absolute;
		width: 100%;
		height: 100%;
	}
	:global(.content-box.event-banner .atropos-highlight) {
		display: none;
	}
	:global(.content-box.event-banner .atropos-shadow) {
		display: none;
	}
	.event-title-mobile {
		display: none;
	}
	.event-title-desktop {
		color: #4caf50 !important;
	}
	.event-text-and-button {
		display: flex;
		flex-direction: column;
		z-index: 2;
		align-items: center;
		gap: 0.5em;
	}

	.event-text-container {
		display: flex;
		flex-direction: column;
	}

	.event-image {
		width: 7em;
		height: 7em;
		margin-right: 1em;
		border-radius: 18px;
	}

	:global(.event-cover-btn) {
		box-shadow: 1px 1px black !important;
	}

	.cover-bg {
		position: absolute;
		display: block;
		background: url(/assets/lovelive_bg.webp) !important;
		background-size: cover !important;
		background-position: center !important;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		filter: brightness(0.4);
	}

	/* Character girl styles - showing middle third of 2800x2000 images */
	.cover-girl {
		position: absolute;
		height: 140%;
		aspect-ratio: 1.4;
        background-size: 100%;
		background-position: center center;
		background-repeat: no-repeat;
		top: -20%; /* vertically center 140% height element */
	}

	/* Girl 1 - far left */
	.cover-girl1 {
		left: -1em;
	}

	/* Girl 2 - left of center */
	.cover-girl2 {
		left: calc(50% - 20em);
	}

	/* Girl 3 - right of center */
	.cover-girl3 {
		right: calc(50% - 20em);
	}

	/* Girl 4 - far right */
	.cover-girl4 {
		right: -1em;
	}

	/* Logo in the center */
	.cover-logo {
		position: absolute;
		width: 15em;
		height: 15em;
		left: calc(50% - 7.5em);
		top: calc(50% - 7.5em);
		background-repeat: no-repeat;
		background-position: center center;
		background-size: contain;
		z-index: 5;
		background-image: url(/assets/lovelive_logo.webp);
	}

	.cinematics {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		pointer-events: none;
	}

	.cinematics-canvas {
		filter: blur(5em) opacity(0.5) saturate(250%);
		left: 0;
		opacity: 0;
		pointer-events: none;
		position: absolute;
		top: 0;
		transform: scale(1.1) translateZ(0);
		width: 100%;
		z-index: -1;
		height: 100%;
		transition: opacity 0.2s ease-in-out;
	}

	:global(.content-box.event-banner:hover .cinematics-canvas) {
		opacity: 1;
	}

	.event-title {
		color: var(--text-color);
		font-size: x-large;
		font-weight: 800;
		text-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
		text-shadow: 1px 1px 11px #000000e8;
	}

	.event-text {
		color: var(--text-color);
		font-size: larger;
		text-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
	}

	/* Mobile styles - small screens */
	@media screen and (max-width: 512px) {
		.cover-girl {
			height: 164%;
        	top: -15%;
		}

		.cover-girl1 {
			left: -11.5em;
		}

		.cover-girl2 {
			display: none;
		}

		.cover-girl3 {
			display: none;
		}

		.cover-girl4 {
			right: -11.5em;
		}

		.cover-logo {
			background-image: url(/assets/lovelive_logo_mobile.webp);
		}
	}

	/* Medium mobile - show 2 girls */
	@media screen and (min-width: 513px) and (max-width: 760px) {
		.cover-girl {
			height: 144%;
            top: -11%;
		}

		.cover-girl1 {
			left: -4.5em;
		}

		.cover-girl2 {
			display: none;
		}

		.cover-girl3 {
			display: none;
		}

		.cover-girl4 {
			right: -4.5em;
		}
	}

	/* Tablet - show 3-4 girls with adjusted spacing */
	@media screen and (min-width: 761px) and (max-width: 1024px) {
		.cover-girl {
			height: 135%;
			top: -17.5%;
		}

		.cover-girl1 {
			left: -7em;
		}

		.cover-girl2 {
			left: calc(50% + 7em);
		}

		.cover-girl3 {
			right: calc(50% + 7em);
		}

		.cover-girl4 {
			right: -7em;
		}
	}

	/* Desktop - standard layout */
	@media screen and (min-width: 1025px) and (max-width: 1275px) {
		.cover-girl {
			height: 160%;
			top: -10%;
		}

		.cover-girl1 {
			left: -10em;
		}

		.cover-girl2 {
			left: calc(50% - 32em);
		}

		.cover-girl3 {
			right: calc(50% - 32em);
		}

		.cover-girl4 {
			right: -10em;
		}
	}

	/* Wide screen - expanded layout */
	@media screen and (min-width: 1276px) {
		.cover-girl {
			height: 160%;
			top: -10%;
		}

		.cover-girl1 {
			left: -6em;
		}

		.cover-girl2 {
			left: calc(50% - 27em);
		}

		.cover-girl3 {
			right: calc(50% - 27em);
		}

		.cover-girl4 {
			right: -6em;
		}

		.cover-girl2.wide-screen {
			left: calc(50% - 42em);
		}

		.cover-girl3.wide-screen {
			right: calc(50% - 42em);
		}

		.cover-bg.wide-screen {
			background: url(/assets/lovelive_bg.webp) !important;
			background-size: cover !important;
			background-position: center !important;
		}
	}
</style>
