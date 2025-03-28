<script>
	let smallSnow;
	let mediumSnow;

	const makeItSnow = function (smallSnow, mediumSnow) {
		if (!smallSnow || !mediumSnow) return;

		let smallSnowElements = '';
		let mediumSnowElements = '';

		let windowWidth = window.innerWidth;

		for (let i = 0; i < windowWidth / 10; i++) {
			const left = Math.floor(Math.random() * 100); // Random position within 800px width
			const delay = Math.random() * 15; // Random delay between 0-10s
			const shakeDelay = Math.random() * 3; // Random shake delay

			smallSnowElements += `<div class="small" style="left: ${left}%; animation-delay: ${delay}s, ${shakeDelay}s;"></div>`;
		}

		for (let i = 0; i < windowWidth / 20; i++) {
			const left = Math.floor(Math.random() * 100);
			const delay = Math.random() * 15;
			const shakeDelay = Math.random() * 3;

			mediumSnowElements += `<div class="medium" style="left: ${left}%; animation-delay: ${delay}s, ${shakeDelay}s;"></div>`;
		}

		smallSnow.innerHTML = smallSnowElements;
		mediumSnow.innerHTML = mediumSnowElements;
	};

	$: makeItSnow(smallSnow, mediumSnow);
</script>

<div class="snow-container">
	<div class="snowing">
		<div class="small-snow" bind:this={smallSnow}></div>
		<div class="medium-snow" bind:this={mediumSnow}></div>
	</div>
</div>

<style>
	.snow-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: -1;
		overflow: hidden;
	}

	.snowing {
		position: absolute;
		filter: blur(0.8px);
		width: 100%;
		height: 100%;
	}

	:global(.small) {
		position: absolute;
		width: 6px;
		height: 6px;
		background: #fff;
		border-radius: 50%;
		animation-name: snow-fall, snow-shake;
		animation-duration: 15s, 4s;
		animation-timing-function: linear, ease-in-out;
		animation-iteration-count: infinite, infinite;
		top: -10%;
	}

	:global(.medium) {
		position: absolute;
		width: 8px;
		height: 8px;
		background: #fff;
		border-radius: 50%;
		animation-name: snow-fall, snow-shake;
		animation-duration: 15s, 4s;
		animation-timing-function: linear, ease-in-out;
		animation-iteration-count: infinite, infinite;
		top: -10%;
	}

	@keyframes snow-fall {
		0% {
			top: -10%;
		}
		100% {
			top: 100%;
		}
	}

	@keyframes snow-shake {
		0% {
			transform: translateX(0px);
		}
		50% {
			transform: translateX(60px);
		}
		100% {
			transform: translateX(0px);
		}
	}
</style>
