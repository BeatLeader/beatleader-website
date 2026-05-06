<script>
	import {fade} from 'svelte/transition';
	import ToolTip from '../../Common/ToolTip.svelte';
	import {onMount, onDestroy} from 'svelte';

	export let badges;

	let badgesContainer;
	let allElements = [];
	let hoveredBadge = null;
	let placeholder = null;

	let fontChangeInterval;
	let glitchInterval;
	let touchTimeout;
	let startGlitchTimeout;
	let isTouching = false;
	let isHovered = false;

	let portalContainer;

	const exsiiBadges = [1755, 1756];
	const phoenixBadges = [1803, 1804, 1805];
	const rsihBadges = [2030, 2031];
	const specialBadges = [...exsiiBadges, ...phoenixBadges, ...rsihBadges];

	let tvLoopState = null;

	function fetchElements(badges) {
		if (badges && badges.find(badge => specialBadges.includes(badge.id))) {
			setTimeout(() => {
				allElements = Array.from(
					document.querySelectorAll(
						'body *:not(script):not(style):not(meta):not(.avatar-overlay):not(.align-content):not(.page-content):not(.main-background):not(main):not(.avatar-overlay-container):not(.profile-box):not(.cinematics):not(.share-buttons-container):not(.cover-image):not(.ssr-page-container):not(.content-box)'
					)
				).filter(el => el.getBoundingClientRect().top <= 1000);
				if (!portalContainer) {
					portalContainer = document.createElement('div');
					portalContainer.style.position = 'absolute';
					portalContainer.style.pointerEvents = 'none';
					portalContainer.style.zIndex = '9999';
					portalContainer.style.top = '0';
					portalContainer.style.height = '100%';
					portalContainer.style.width = '100%';
					document.body.appendChild(portalContainer);
				}
			}, 1000);
		}
	}

	onDestroy(() => {
		isHovered = false;
		clearInterval(fontChangeInterval);
		clearInterval(glitchInterval);
		clearTimeout(touchTimeout);
		if (tvLoopState) {
			tvLoopState.hovered = false;
			if (tvLoopState.cancel) tvLoopState.cancel();
			if (tvLoopState.currentCtx && !tvLoopState.currentCtx.restored) {
				restoreBox(tvLoopState.currentCtx);
			}
			tvLoopState = null;
		}
		portalContainer?.remove();
		portalContainer = null;
	});

	function getRandomDirection() {
		return (Math.random() * 2 - 1) * 2;
	}

	function applyRandomFontChange() {
		if (!isHovered) return;

		const numElements = Math.floor(Math.random() * 20) + 1;
		const selectedElements = [...allElements]
			.filter(el => el.textContent?.trim().length > 0)
			.sort(() => Math.random() - 0.5)
			.slice(0, numElements);

		selectedElements.forEach(element => {
			if (!isHovered) return;
			if (element.classList.contains('glitch-font')) {
				return;
			}
			element.classList.add('glitch-font');
			const duration = Math.random() * 800 + 200;
			setTimeout(() => {
				element.classList.remove('glitch-font');
			}, duration);
		});
	}

	let morseMessage = '-.-. .... .- -- .--. .. --- -.';
	function applyMorseFontChange() {
		if (!isHovered) return;

		const numElements = Math.floor(Math.random() * 20) + 1;
		const selectedElements = [...allElements]
			.filter(
				el =>
					el.textContent?.trim().length > 0 &&
					(el.tagName === 'SPAN' ||
						el.tagName === 'H1' ||
						el.tagName === 'H2' ||
						el.tagName === 'H3' ||
						el.tagName === 'H4' ||
						el.tagName === 'H5' ||
						el.tagName === 'H6')
			)
			.sort(() => Math.random() - 0.5)
			.slice(0, numElements);

		selectedElements.forEach(element => {
			if (!isHovered) return;
			if (element.classList.contains('morse-font') || element.morseTimeout) {
				return;
			}
			element.opacityBackup = element.style.opacity ?? 1;
			element.morseIndex = 0;
			element.classList.add('morse-font');
			element.querySelectorAll('*').forEach(child => {
				child.classList.add('morse-font');
			});

			const morseCallback = () => {
				element.style.opacity = '1';
				const currentSignal = morseMessage[element.morseIndex];
				var delay = 0;
				if (currentSignal === '.') {
					delay = 400;
				} else if (currentSignal === '-') {
					delay = 800;
				}

				element.morseTimeout = setTimeout(() => {
					element.morseIndex++;
					element.style.opacity = '0';
					if (element.morseIndex < morseMessage.length) {
						if (morseMessage[element.morseIndex] == ' ') {
							element.morseTimeout = setTimeout(morseCallback, 1000);
						} else {
							element.morseTimeout = setTimeout(morseCallback, 200);
						}
					} else {
						element.morseIndex = 0;
						element.morseTimeout = setTimeout(morseCallback, 2000);
						element.style.opacity = element.opacityBackup;
					}
				}, delay);
			};
			morseCallback();
		});
	}

	function applyGlitchToRandomElements() {
		if (!isHovered) return;

		const numElements = Math.floor(Math.random() * 10) + 1;
		const availableElements = [...allElements].filter(
			el => !portalContainer.contains(el) && el !== placeholder && el.offsetParent !== null && !el.classList.contains('glitch-effect')
		);

		const selectedElements = availableElements.sort(() => Math.random() - 0.5).slice(0, numElements);

		selectedElements.forEach(element => {
			if (!isHovered) return;
			element.classList.add('glitch-effect');
			element.style.setProperty('--glitch-x', getRandomDirection());
			element.style.setProperty('--glitch-y', getRandomDirection());
			element.style.setProperty('--glitch-x2', getRandomDirection());
			element.style.setProperty('--glitch-y2', getRandomDirection());
		});
	}

	function pickRandomVisibleContentBox() {
		const boxes = Array.from(document.querySelectorAll('.content-box:not(.profile-box)')).filter(box => {
			const rect = box.getBoundingClientRect();
			if (rect.bottom < 0 || rect.top > window.innerHeight) return false;
			if (rect.width < 50 || rect.height < 50) return false;
			if (box.dataset.tvOccupied === '1') return false;
			return box.offsetParent !== null;
		});
		if (!boxes.length) return null;
		return boxes[Math.floor(Math.random() * boxes.length)];
	}

	function takeOverBox(box) {
		const rect = box.getBoundingClientRect();
		const computed = getComputedStyle(box);
		const top = rect.top + window.scrollY;
		const left = rect.left + window.scrollX;

		const wrapper = document.createElement('div');
		wrapper.style.position = 'absolute';
		wrapper.style.top = `${top}px`;
		wrapper.style.left = `${left}px`;
		wrapper.style.width = `${rect.width}px`;
		wrapper.style.height = `${rect.height}px`;
		wrapper.style.borderRadius = computed.borderRadius;
		wrapper.style.overflow = 'hidden';
		wrapper.style.zIndex = '100';
		wrapper.style.background = 'black';
		wrapper.style.pointerEvents = 'none';

		const video = document.createElement('video');
		video.muted = false;
		video.volume = 0.6;
		video.playsInline = true;
		video.autoplay = true;
		video.style.width = '100%';
		video.style.height = '100%';
		video.style.objectFit = 'cover';
		video.style.display = 'block';
		wrapper.appendChild(video);

		document.body.appendChild(wrapper);

		const originalVisibility = box.style.visibility;
		box.style.visibility = 'hidden';
		box.dataset.tvOccupied = '1';

		return {box, wrapper, video, originalVisibility, restored: false};
	}

	function restoreBox(ctx) {
		if (ctx.restored) return;
		ctx.restored = true;
		ctx.box.style.visibility = ctx.originalVisibility;
		delete ctx.box.dataset.tvOccupied;
		ctx.wrapper.remove();
	}

	function waitForCanPlay(video, state) {
		return new Promise(resolve => {
			let done = false;
			const cleanup = () => {
				video.removeEventListener('canplaythrough', onLoad);
				video.removeEventListener('canplay', onLoad);
				video.removeEventListener('loadeddata', onLoad);
				video.removeEventListener('error', onError);
				if (state.cancel === onCancel) state.cancel = null;
			};
			const onLoad = () => {
				if (done) return;
				done = true;
				cleanup();
				resolve(true);
			};
			const onError = () => {
				if (done) return;
				done = true;
				cleanup();
				resolve(false);
			};
			const onCancel = () => {
				if (done) return;
				done = true;
				cleanup();
				resolve(true);
			};

			if (video.readyState >= 3) {
				resolve(true);
				return;
			}

			video.addEventListener('canplaythrough', onLoad);
			video.addEventListener('canplay', onLoad);
			video.addEventListener('loadeddata', onLoad);
			video.addEventListener('error', onError);
			state.cancel = onCancel;
		});
	}

	function waitForVideoEnd(video, state) {
		return new Promise(resolve => {
			let done = false;
			const finish = () => {
				if (done) return;
				done = true;
				video.removeEventListener('ended', finish);
				if (state && state.cancel === finish) state.cancel = null;
				resolve();
			};
			video.addEventListener('ended', finish, {once: true});
			if (state) state.cancel = finish;
		});
	}

	function cancellableSleep(ms, state) {
		return new Promise(resolve => {
			let done = false;
			const finish = () => {
				if (done) return;
				done = true;
				clearTimeout(t);
				if (state.cancel === finish) state.cancel = null;
				resolve();
			};
			const t = setTimeout(finish, ms);
			state.cancel = finish;
		});
	}

	async function playOffAndRestore(ctx) {
		if (ctx.restored) return;
		ctx.video.loop = false;
		ctx.video.src = '/assets/rsih/tv_off_effect.mp4';
		try {
			ctx.video.load();
			await ctx.video.play();
		} catch (e) {}
		await new Promise(resolve => {
			let done = false;
			const finish = () => {
				if (done) return;
				done = true;
				ctx.video.removeEventListener('ended', finish);
				ctx.video.removeEventListener('error', finish);
				clearTimeout(safety);
				resolve();
			};
			ctx.video.addEventListener('ended', finish, {once: true});
			ctx.video.addEventListener('error', finish, {once: true});
			const safety = setTimeout(finish, 5000);
		});
		restoreBox(ctx);
	}

	async function runTvLoop(state) {
		try {
			while (state.hovered) {
				const box = pickRandomVisibleContentBox();
				if (!box) {
					await cancellableSleep(500, state);
					continue;
				}

				const ctx = takeOverBox(box);
				state.currentCtx = ctx;

				ctx.video.loop = true;
				ctx.video.src = '/assets/rsih/tv_on_effect.mp4';
				const tvOnStart = performance.now();
				try {
					ctx.video.load();
					await ctx.video.play();
				} catch (e) {}

				let clipUrl;
				if (Math.random() < 1 / 50) {
					const specialNum = Math.floor(Math.random() * 2) + 1;
					clipUrl = `/assets/rsih/clip_special_${specialNum}.mp4`;
				} else {
					const clipNum = Math.floor(Math.random() * 12) + 1;
					clipUrl = `/assets/rsih/clip_${clipNum}.mp4`;
				}
				const preloader = document.createElement('video');
				preloader.muted = false;
				preloader.volume = 0.6;
				preloader.preload = 'auto';
				preloader.src = clipUrl;

				const loadOk = await waitForCanPlay(preloader, state);

				if (state.hovered && loadOk) {
					const elapsed = performance.now() - tvOnStart;
					const remaining = 1000 - elapsed;
					if (remaining > 0) await cancellableSleep(remaining, state);
				}

				if (!state.hovered || !loadOk) {
					await playOffAndRestore(ctx);
					state.currentCtx = null;
					if (!state.hovered) break;
					await cancellableSleep(1000, state);
					continue;
				}

				ctx.video.loop = false;
				ctx.video.src = clipUrl;
				try {
					ctx.video.load();
					await ctx.video.play();
				} catch (e) {}

				await waitForVideoEnd(ctx.video, state);

				await playOffAndRestore(ctx);
				state.currentCtx = null;

				if (!state.hovered) break;

				await cancellableSleep(1000, state);
			}
		} finally {
			if (state.currentCtx && !state.currentCtx.restored) {
				restoreBox(state.currentCtx);
				state.currentCtx = null;
			}
			if (tvLoopState === state) tvLoopState = null;
		}
	}

	function startTvLoop() {
		if (tvLoopState) return;
		tvLoopState = {hovered: true, cancel: null, currentCtx: null};
		runTvLoop(tvLoopState);
	}

	function stopTvLoop() {
		if (!tvLoopState) return;
		tvLoopState.hovered = false;
		if (tvLoopState.cancel) tvLoopState.cancel();
	}

	function handleMouseEnter(event, badgeId) {
		if (placeholder) return;

		const badge = event.currentTarget;
		const rect = badge.children[0].getBoundingClientRect();

		placeholder = document.createElement('div');
		placeholder.style.width = `${rect.width}px`;
		placeholder.style.height = `${rect.height}px`;
		badge.parentNode.insertBefore(placeholder, badge);

		portalContainer.style.pointerEvents = 'auto';
		portalContainer.appendChild(badge);
		badge.style.position = 'fixed';
		badge.style.top = `${rect.top}px`;
		badge.style.left = `${rect.left}px`;
		badge.style.width = `${rect.width}px`;
		badge.style.height = `${rect.height}px`;
		badge.style.display = 'block';
		hoveredBadge = badge;

		if (exsiiBadges.includes(badgeId)) {
			startGlitchTimeout = setTimeout(() => {
				isHovered = true;
				glitchInterval = setInterval(() => {
					applyGlitchToRandomElements();
				}, 50);
			}, 1000);
			fontChangeInterval = setInterval(() => {
				applyRandomFontChange();
			}, 100);
		}

		if (phoenixBadges.includes(badgeId)) {
			isHovered = true;
			applyMorseFontChange();
		}

		if (rsihBadges.includes(badgeId)) {
			startTvLoop();
		}
	}

	function handleMouseLeave() {
		clearTimeout(startGlitchTimeout);
		isHovered = false;
		stopTvLoop();
		if (glitchInterval) {
			clearInterval(glitchInterval);
			glitchInterval = null;
		}
		if (fontChangeInterval) {
			clearInterval(fontChangeInterval);
			fontChangeInterval = null;
		}
		if (hoveredBadge && placeholder) {
			placeholder.parentNode.insertBefore(hoveredBadge, placeholder);
			placeholder.remove();
			hoveredBadge.style.position = '';
			hoveredBadge.style.top = '';
			hoveredBadge.style.left = '';
			hoveredBadge.style.width = '';
			hoveredBadge.style.height = '';
			hoveredBadge.style.display = 'contents';
			hoveredBadge = null;
			placeholder = null;
			portalContainer.style.pointerEvents = 'none';
		}
		allElements.forEach(element => {
			element.classList.remove('glitch-effect');
			element.classList.remove('glitch-font');
			element.classList.remove('morse-font');
			if (element.morseTimeout) {
				clearTimeout(element.morseTimeout);
				element.morseTimeout = null;
				element.style.opacity = element.opacityBackup;
			}
			element.style.removeProperty('--glitch-x');
			element.style.removeProperty('--glitch-y');
			element.style.removeProperty('--glitch-x2');
			element.style.removeProperty('--glitch-y2');
		});
	}

	function handleClick(link) {
		window.location.href = link;
	}

	function handleTouchStart(event, badgeId) {
		isTouching = true;

		var currentTarget = event.currentTarget;

		touchTimeout = setTimeout(() => {
			if (isTouching) {
				isHovered = true;
				handleMouseEnter({currentTarget}, badgeId);
			}
		}, 600);
	}

	function handleTouchEnd(event) {
		isTouching = false;
		isHovered = false;
		clearTimeout(touchTimeout);

		if (glitchInterval) {
			handleMouseLeave();
		} else if (event.currentTarget.href) {
			window.location.href = event.currentTarget.href;
		}
	}

	function handleTouchCancel() {
		isTouching = false;
		isHovered = false;
		clearTimeout(touchTimeout);
		handleMouseLeave();
	}

	$: fetchElements(badges);
</script>

{#if badges}
	<div class="bl-badges" bind:this={badgesContainer} transition:fade|global={{duration: 500}}>
		{#each badges as badge (badge.src)}
			{#if badge.link}
				{#if specialBadges.includes(badge.id)}
					<div
						class="badge-link"
						on:mouseenter={e => handleMouseEnter(e, badge.id)}
						on:mouseleave={e => handleMouseLeave(e, badge.id)}
						on:touchstart={e => handleTouchStart(e, badge.id)}
						on:touchend={e => handleTouchEnd(e, badge.id)}
						on:touchcancel={e => handleTouchCancel(e, badge.id)}
						on:click={() => handleClick(badge.link)}>
						<ToolTip content={badge.title}>
							<img class="clickable" src={badge.src} alt={badge.title} />
						</ToolTip>
					</div>
				{:else}
					<a class="badge-link" href={badge.link}>
						<ToolTip content={badge.title}>
							<img class="clickable" src={badge.src} alt={badge.title} />
						</ToolTip>
					</a>
				{/if}
			{:else}
				<ToolTip content={badge.title}>
					<img src={badge.src} alt={badge.title} />
				</ToolTip>
			{/if}
		{/each}
	</div>
{/if}

<style>
	.bl-badges {
		display: flex;
		gap: 0.5em 0.5em;
		padding: 0.5em;
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

	@media (max-width: 768px) {
		.bl-badges {
			justify-content: center;
		}
	}

	:global(.glitch-effect) {
		animation: glitch-text 0.2s infinite;
		position: relative;
		z-index: 1;
		transform-style: preserve-3d;
		backface-visibility: hidden;
	}

	:global(.glitch-effect::before),
	:global(.glitch-effect::after) {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		clip: rect(0, 0, 0, 0);
		pointer-events: none;
	}

	:global(.glitch-effect::before) {
		left: 2px;
		text-shadow: -2px 0 #ff00c1;
		background: rgba(255, 0, 193, 0.2);
		animation: glitch-anim-1 4s infinite linear alternate-reverse;
	}

	:global(.glitch-effect::after) {
		left: -2px;
		text-shadow: 2px 0 #00fff9;
		background: rgba(0, 255, 249, 0.2);
		animation: glitch-anim-2 6s infinite linear alternate-reverse;
	}

	@keyframes glitch-anim-1 {
		0% {
			clip: rect(20px, 9999px, 21px, 0);
		}
		10% {
			clip: rect(42px, 9999px, 78px, 0);
		}
		20% {
			clip: rect(13px, 9999px, 10px, 0);
		}
		30% {
			clip: rect(23px, 9999px, 56px, 0);
		}
		40% {
			clip: rect(89px, 9999px, 99px, 0);
		}
		50% {
			clip: rect(67px, 9999px, 34px, 0);
		}
		60% {
			clip: rect(12px, 9999px, 23px, 0);
		}
		70% {
			clip: rect(45px, 9999px, 78px, 0);
		}
		80% {
			clip: rect(89px, 9999px, 12px, 0);
		}
		90% {
			clip: rect(34px, 9999px, 45px, 0);
		}
		100% {
			clip: rect(56px, 9999px, 89px, 0);
		}
	}

	@keyframes glitch-anim-2 {
		0% {
			clip: rect(12px, 9999px, 34px, 0);
		}
		10% {
			clip: rect(56px, 9999px, 78px, 0);
		}
		20% {
			clip: rect(89px, 9999px, 12px, 0);
		}
		30% {
			clip: rect(45px, 9999px, 23px, 0);
		}
		40% {
			clip: rect(67px, 9999px, 45px, 0);
		}
		50% {
			clip: rect(23px, 9999px, 67px, 0);
		}
		60% {
			clip: rect(78px, 9999px, 89px, 0);
		}
		70% {
			clip: rect(34px, 9999px, 12px, 0);
		}
		80% {
			clip: rect(12px, 9999px, 56px, 0);
		}
		90% {
			clip: rect(89px, 9999px, 78px, 0);
		}
		100% {
			clip: rect(45px, 9999px, 34px, 0);
		}
	}

	@keyframes glitch-text {
		0% {
			transform: translate(0);
			filter: hue-rotate(0deg);
			clip-path: none;
		}
		20% {
			transform: translate(calc(var(--glitch-x, 1) * 2px), calc(var(--glitch-y, 1) * 2px));
			filter: hue-rotate(90deg);
			clip-path: inset(15% 0 20% 0);
		}
		40% {
			transform: translate(calc(var(--glitch-x2, -1) * 2px), calc(var(--glitch-y2, -1) * 2px));
			filter: hue-rotate(180deg) brightness(1.3);
			clip-path: inset(8% 0 12% 0);
		}
		60% {
			transform: translate(calc(var(--glitch-y, 1) * 2px), calc(var(--glitch-x, 1) * 2px));
			filter: hue-rotate(270deg) contrast(1.5);
			clip-path: inset(25% 0 5% 0);
		}
		80% {
			transform: translate(calc(var(--glitch-y2, -1) * 2px), calc(var(--glitch-x2, -1) * 2px));
			filter: hue-rotate(360deg) saturate(1.5);
			clip-path: inset(10% 0 15% 0);
		}
		100% {
			transform: translate(0);
			filter: hue-rotate(0deg);
			clip-path: none;
		}
	}

	:global(.glitch-effect)::before {
		background: repeating-linear-gradient(0deg, rgba(255, 0, 193, 0.2), rgba(255, 0, 193, 0.2) 1px, transparent 1px, transparent 2px);
	}

	:global(.glitch-effect)::after {
		background: repeating-linear-gradient(0deg, rgba(0, 255, 249, 0.2), rgba(0, 255, 249, 0.2) 1px, transparent 1px, transparent 2px);
	}

	:global(.glitch-font) {
		font-family: 'EPTA-GLYPHS', sans-serif !important;
		transition: font-family 50ms ease-in-out;
	}

	:global(.morse-font) {
		font-family: 'Morse', sans-serif !important;
		transition: font-family 50ms ease-in-out;
	}

	@font-face {
		font-family: 'EPTA-GLYPHS';
		src: url('/assets/EPTA-GLYPHS.ttf.woff') format('woff');
		font-display: swap;
	}

	@font-face {
		font-family: 'Morse';
		src: url('/assets/morse.woff') format('woff');
		font-display: swap;
	}
</style>
