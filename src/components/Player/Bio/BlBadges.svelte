<script>
	import {fade} from 'svelte/transition';
	import ToolTip from '../../Common/ToolTip.svelte';
	import {onMount, onDestroy} from 'svelte';

	export let badges;

	let badgesContainer;
	let allElements = [];
	let hoveredBadge = null;
	let placeholder = null;
	let portalContainer;
	let fontChangeInterval;
	let glitchInterval;
	let touchTimeout;
	let startGlitchTimeout;
	let isTouching = false;
	let isHovered = false;

	function fetchElements(badges) {
		if (badges && badges.find(badge => badge.id == 1755 || badge.id == 1756)) {
			setTimeout(() => {
				allElements = document.querySelectorAll(
					'body *:not(script):not(style):not(meta):not(.avatar-overlay):not(.align-content):not(.page-content):not(.main-background):not(main):not(.avatar-overlay-container):not(.profile-box):not(.cinematics):not(.share-buttons-container):not(.cover-image):not(.ssr-page-container):not(.content-box)'
				);
				if (!portalContainer) {
					portalContainer = document.createElement('div');
					portalContainer.style.position = 'absolute';
					portalContainer.style.pointerEvents = 'none';
					portalContainer.style.zIndex = '9999';
					portalContainer.style.top = '0';
					portalContainer.style.height = '100%';
					portalContainer.style.width = '100%';
					document.body.appendChild(portalContainer);

					const fontLink = document.createElement('link');
					fontLink.rel = 'preload';
					fontLink.href = '/assets/EPTA-GLYPHS.ttf.woff';
					fontLink.as = 'font';
					fontLink.type = 'font/woff';
					fontLink.crossOrigin = 'anonymous';
					document.head.appendChild(fontLink);
				}
			}, 1000);
		}
	}

	onDestroy(() => {
		isHovered = false;
		clearInterval(fontChangeInterval);
		clearInterval(glitchInterval);
		clearTimeout(touchTimeout);
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

	function handleMouseEnter(event) {
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

	function handleMouseLeave() {
		clearTimeout(startGlitchTimeout);
		isHovered = false;
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
			element.style.removeProperty('--glitch-x');
			element.style.removeProperty('--glitch-y');
			element.style.removeProperty('--glitch-x2');
			element.style.removeProperty('--glitch-y2');
		});
	}

	function handleClick(link) {
		window.location.href = link;
	}

	function handleTouchStart(event) {
		isTouching = true;

		var currentTarget = event.currentTarget;

		touchTimeout = setTimeout(() => {
			if (isTouching) {
				isHovered = true;
				handleMouseEnter({currentTarget});
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
				{#if badge.id == 1755 || badge.id == 1756}
					<div
						class="badge-link"
						on:mouseenter={handleMouseEnter}
						on:mouseleave={handleMouseLeave}
						on:touchstart={handleTouchStart}
						on:touchend={handleTouchEnd}
						on:touchcancel={handleTouchCancel}
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
		padding: 0.5em 0;
		justify-content: center;
		width: 100%;
		flex-wrap: wrap;
		background: inherit;
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

	@font-face {
		font-family: 'EPTA-GLYPHS';
		src: url('/assets/EPTA-GLYPHS.ttf.woff') format('woff');
		font-display: swap;
	}
</style>
