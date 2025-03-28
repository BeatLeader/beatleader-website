<script>
	import {onMount, onDestroy} from 'svelte';

	// Configuration options
	const MAX_FLAKES = window.innerWidth / 10;
	const MAX_DELTA_TIME = 0.1; // Cap maximum time delta to prevent large jumps (in seconds)
	let canvas;
	let ctx;
	let flakes = [];
	let animationFrame;
	let width, height;
	let lastTime = 0; // Track the last animation timestamp
	let isPaused = false; // Track if animation is paused due to tab visibility

	// Snowflake class for more efficient management
	class Snowflake {
		constructor() {
			this.reset();
		}

		reset() {
			this.x = Math.random() * width;
			this.y = Math.random() * height;
			this.originalX = this.x; // Store original X for oscillation
			this.size = Math.random() * 3 + 2;

			// Fall speed similar to original (15s duration for screen height)
			this.speed = (height / 900) * (Math.random() * 0.4 + 0.8);

			this.opacity = Math.random() * 0.6 + 0.4;

			// Parameters for oscillation
			this.amplitude = 30 + Math.random() * 30; // Similar to original 60px shake
			this.period = 5 + Math.random() * 2; // Time to complete one oscillation (seconds)
			this.phaseShift = Math.random() * Math.PI * 2; // Random starting point in oscillation
			this.time = 0;
		}

		// Update with actual delta time
		update(deltaTime) {
			// Update time counter with actual elapsed time in seconds
			this.time += deltaTime;

			// Update vertical position (falling)
			this.y += this.speed * deltaTime * 60; // Scale by deltaTime and normalize to 60fps

			// Calculate horizontal oscillation using sine wave (like original)
			const oscillationX = Math.sin((this.time / this.period) * Math.PI * 2 + this.phaseShift) * this.amplitude;
			this.x = this.originalX + oscillationX;

			// Reset if off screen
			if (this.y > height) {
				this.reset();
				this.y = -10;
				this.originalX = Math.random() * width; // New starting X position
			}
		}

		draw() {
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
			ctx.fill();
		}
	}

	function createFlakes() {
		flakes = [];
		for (let i = 0; i < MAX_FLAKES; i++) {
			flakes.push(new Snowflake());
		}
	}

	function resizeCanvas() {
		if (!canvas) return;

		width = window.innerWidth;
		height = window.innerHeight;

		canvas.width = width;
		canvas.height = height;
	}

	function animate(timestamp) {
		if (!ctx || isPaused) return;

		// Calculate actual delta time in seconds
		if (!lastTime) lastTime = timestamp;
		let deltaTime = (timestamp - lastTime) / 1000; // Convert to seconds

		// Cap deltaTime to prevent large jumps when tab regains focus
		deltaTime = Math.min(deltaTime, MAX_DELTA_TIME);

		lastTime = timestamp;

		// Clear canvas
		ctx.clearRect(0, 0, width, height);

		// Update and draw snowflakes with actual deltaTime
		flakes.forEach(flake => {
			flake.update(deltaTime);
			flake.draw();
		});

		// Request next frame
		animationFrame = requestAnimationFrame(animate);
	}

	// Handle tab visibility changes
	function handleVisibilityChange() {
		if (document.hidden) {
			// Tab lost focus - pause animation and reset timer
			isPaused = true;
			cancelAnimationFrame(animationFrame);
		} else {
			// Tab regained focus - restart animation with fresh timer
			isPaused = false;
			lastTime = 0; // Reset timer on resume to prevent large delta
			animationFrame = requestAnimationFrame(animate);
		}
	}

	// Initialize everything on mount
	onMount(() => {
		if (!canvas) return;

		ctx = canvas.getContext('2d');

		resizeCanvas();
		createFlakes();
		animationFrame = requestAnimationFrame(animate);

		// Add event listeners
		window.addEventListener('resize', handleResize);
		document.addEventListener('visibilitychange', handleVisibilityChange);
	});

	// Cleanup on destroy
	onDestroy(() => {
		window.removeEventListener('resize', handleResize);
		document.removeEventListener('visibilitychange', handleVisibilityChange);
		cancelAnimationFrame(animationFrame);
	});

	function handleResize() {
		resizeCanvas();
		// Recreate flakes on resize to maintain appropriate density
		createFlakes();
	}
</script>

<canvas bind:this={canvas} class="snow-canvas"></canvas>

<style>
	.snow-canvas {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: -1;
		filter: blur(0.8px); /* Match original blur effect */
	}
</style>
