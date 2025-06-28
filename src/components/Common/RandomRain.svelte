<!-- https://codepen.io/arickle/pen/XKjMZY -->
<script>
	export let slow = true;
	export let icons = null;

	let frontRow;
	let backRow;

	const iconClasses = icons ?? ['soup-icon', 'pixelsoup-icon'];

	var makeItRain = function (frontRow, backRow) {
		if (!frontRow || !backRow) return;

		var increment = 0;
		var drops = '';
		var backDrops = '';

		const animationDuration = `s; animation-duration: ${slow ? '3.' : '0.5'}`;
		let dropClass;

		while (increment < 100) {
			dropClass = iconClasses[Math.floor(Math.random() * iconClasses.length)];
			//couple random numbers to use for various randomizations
			//random number between 98 and 1
			var randoHundo = Math.floor(Math.random() * (98 - 1 + 1) + 1);
			//random number between 5 and 2
			var randoFiver = Math.floor(Math.random() * (5 - 2 + 1) + 2);
			//increment
			increment += randoFiver * 1.5;

			const rotation = `transform: translateY(-30vh) rotateZ(${Math.random() * 180 - 180}deg);`;
			//add in a new raindrop with various randomizations to certain CSS properties
			drops +=
				`<div class="${dropClass}" style="` +
				rotation +
				'left: ' +
				increment +
				'%; bottom: ' +
				(randoFiver + randoFiver - 1 + 60) +
				'%; animation-delay: 0.' +
				randoHundo +
				animationDuration +
				randoHundo +
				`s;">` +
				'<div class="splat" style="animation-delay: 0.' +
				randoHundo +
				animationDuration +
				randoHundo +
				's;"></div></div>';
			backDrops +=
				`<div class="${dropClass}" style="right: ` +
				increment +
				'%; bottom: ' +
				(randoFiver + randoFiver - 1 + 60) +
				'%; animation-delay: 0.' +
				randoHundo +
				animationDuration +
				randoHundo +
				`s;">` +
				'<div class="splat" style="animation-delay: 0.' +
				randoHundo +
				animationDuration +
				randoHundo +
				's;"></div></div>';
		}

		frontRow.innerHTML = drops;
		backRow.innerHTML = backDrops;
	};

	$: makeItRain(frontRow, backRow);
</script>

<div class="rain-container">
	<div class="rain front-row" bind:this={frontRow} />
	<div class="rain back-row" bind:this={backRow} />
</div>

<style>
	.rain-container {
		top: -5em;
		bottom: -5em;
		overflow: hidden;
		position: fixed;
		left: -5em;
		right: 0;
		pointer-events: none;
	}

	.rain {
		position: absolute;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 2;
		pointer-events: none;
	}

	.rain.back-row {
		display: none;
		z-index: 1;
		bottom: 60px;
		opacity: 0.5;
		pointer-events: none;
	}

	:global(.container.back-row-toggle .rain.back-row) {
		display: block;
	}

	:global(.soup-icon) {
		position: absolute;
		width: 80px;
		height: 80px;
		pointer-events: none;
		animation: baguette 2s linear infinite;
		background-size: cover;
		background-repeat: no-repeat;
		background-image: url('https://cdn.assets.beatleader.com/SOUPclan.png');
		pointer-events: none;
	}

	:global(.pixelsoup-icon) {
		position: absolute;
		width: 40px;
		height: 40px;
		pointer-events: none;
		animation: baguette 2s linear infinite;
		background-size: cover;
		background-repeat: no-repeat;
		background-image: url('/assets/soup_px.webp');
		pointer-events: none;
	}

	@keyframes baguette {
		100% {
			transform: translateY(90vh) rotateZ(0);
		}
	}

	:global(.stem) {
		width: 1px;
		height: 60%;
		margin-left: 7px;
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.25));
		animation: stem 0.5s linear infinite;
		pointer-events: none;
	}

	@keyframes stem {
		0% {
			opacity: 1;
		}
		65% {
			opacity: 1;
		}
		75% {
			opacity: 0;
		}
		100% {
			opacity: 0;
		}
	}

	:global(.splat) {
		width: 15px;
		height: 10px;
		border-top: 2px dotted rgba(255, 255, 255, 0.5);
		border-radius: 50%;
		opacity: 1;
		transform: scale(0);
		animation: splat 0.5s linear infinite;
		display: none;
		pointer-events: none;
	}

	@keyframes splat {
		0% {
			opacity: 1;
			transform: scale(0);
		}
		80% {
			opacity: 1;
			transform: scale(0);
		}
		90% {
			opacity: 0.5;
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: scale(1.5);
		}
	}
</style>
